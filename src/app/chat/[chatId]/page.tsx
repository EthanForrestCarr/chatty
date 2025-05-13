export const runtime = 'nodejs';

import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import RealtimeMessages from '@/components/Messages';
import Presence from '@/components/Presence';
import ChatInput from '@/components/ChatInput';

type UserPreview = { id: string; username: string };

export default async function ChatPage({ params }: { params: { chatId: string } }) {
  // this “await” un-wraps the dynamic params proxy
  const { chatId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;
  const username = session.user.name || 'You';

  // Fetch the ChatUser join row, including the Chat and its users & messages
  const row = await prisma.chatUser.findUnique({
    where: { chatId_userId: { chatId, userId } },
    include: {
      chat: {
        include: {
          chatUsers: { select: { user: { select: { id: true, username: true } } } },
          messages: { select: { createdAt: true } },
        },
      },
    },
  });
  if (!row) notFound();

  // Upsert lastReadAt
  await prisma.chatUser.upsert({
    where: { chatId_userId: { chatId, userId } },
    create: { chatId, userId, lastReadAt: new Date() },
    update: { lastReadAt: new Date() },
  });

  const { chat } = row;

  // Find the other user
  const partnerUser = chat.chatUsers
    .map((cu: { user: UserPreview }) => cu.user)
    .find((u: UserPreview) => u.id !== userId);

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chat with {partnerUser?.username ?? 'Unknown'}</h1>

      <Presence chatId={chatId} currentUserId={userId} currentUsername={username} />
      <RealtimeMessages chatId={chatId} currentUserId={userId} currentUsername={username} />

      <ChatInput chatId={chatId} currentUser={{ id: userId, username }} />
    </main>
  );
}
