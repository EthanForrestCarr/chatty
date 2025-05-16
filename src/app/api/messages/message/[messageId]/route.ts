import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/db';

interface Params {
  params: {
    messageId: string;
  };
}

export async function POST(req: NextRequest, { params }: Params) {
  // Next.js App Router params must be awaited
  const { messageId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.redirect('/login');
  }

  const methodOverride = (await req.formData()).get('_method');

  if (methodOverride !== 'DELETE') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message || message.senderId !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // remove any emoji reactions for this message to avoid FK constraint errors
  await prisma.messageReaction.deleteMany({ where: { messageId } });

  await prisma.message.delete({
    where: { id: messageId },
  });

  // Redirect back to the chat page
  const chatId = req.nextUrl.searchParams.get('chatId');
  return NextResponse.redirect(new URL(`/chat/${chatId}`, req.url));
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  // Next.js App Router params must be awaited
  const { messageId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message || message.senderId !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // remove any emoji reactions for this message to avoid FK constraint errors
  await prisma.messageReaction.deleteMany({ where: { messageId } });

  await prisma.message.delete({ where: { id: messageId } });
  return NextResponse.json({ success: true });
}
