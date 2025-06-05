import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { chatParamsSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function GET(_request: NextRequest, { params }: { params: { chatId: string } }) {
  // route params
  const { chatId } = params;

  // 1) validate chatId
  const parsed = chatParamsSchema.safeParse({ chatId });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // 2) auth
  const session = (await getServerSession(authOptions)) as Session | null;
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
      attachments: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  // return messages directly; Date objects will be serialized to ISO strings
  return NextResponse.json(raw);
}
