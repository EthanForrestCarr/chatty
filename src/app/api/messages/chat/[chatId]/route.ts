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

  // 4) fetch messages along with sender and reactions
  const raw = await prisma.message.findMany({
    where: { chatId },
    include: {
      sender: { select: { id: true, username: true } },
      reactions: {
        include: { user: { select: { id: true, username: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  // serialize dates and shape output
  const output = raw.map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    sender: m.sender,
    chatId: m.chatId,
    reactions: m.reactions.map((r) => ({
      id: r.id,
      emoji: r.emoji,
      user: r.user,
      messageId: r.messageId,
    })),
  }));
  return NextResponse.json(output);
}
