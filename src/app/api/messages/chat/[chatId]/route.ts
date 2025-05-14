import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { chatParamsSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: { chatId: string } }) {
  // params comes in as a Promise<...>, so await it first
  const realParams = await params;

  // now realParams === { chatId: string }
  console.log('[api] realParams:', realParams);

  // 1) validate chatId
  const parsed = chatParamsSchema.safeParse(realParams);
  console.log('[api] Zod safeParse:', parsed);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { chatId } = parsed.data;

  // 2) auth
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 3) membership guard
  const member = await prisma.chatUser.findUnique({
    where: { chatId_userId: { chatId, userId: session.user.id } },
  });
  if (!member) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 4a) fetch base messages with sender info
  const messages = await prisma.message.findMany({
    where: { chatId },
    include: { sender: { select: { id: true, username: true } } },
    orderBy: { createdAt: 'asc' },
  });
  // 4b) fetch all reactions for these messages
  const reactionRows = await prisma.messageReaction.findMany({
    where: { messageId: { in: messages.map((m) => m.id) } },
    include: { user: { select: { id: true, username: true } } },
  });
  // group reactions by messageId
  const reactionsByMsg: Record<string, typeof reactionRows> = {};
  for (const r of reactionRows) {
    if (!reactionsByMsg[r.messageId]) reactionsByMsg[r.messageId] = [];
    reactionsByMsg[r.messageId].push(r);
  }
  // attach reactions to each message object
  const messagesWithReactions = messages.map((m) => ({
    ...m,
    reactions: reactionsByMsg[m.id] || [],
  }));
  return NextResponse.json(messagesWithReactions);
}
