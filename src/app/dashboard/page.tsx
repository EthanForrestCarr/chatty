import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import Link from "next/link";
import UserSearchInput from "@/components/UserSearchInput";

type UserPreview = { id: string; username: string };

type ChatRow = {
  chat: {
    id: string;
    chatUsers: { user: UserPreview }[];
    messages: { createdAt: Date }[];
  };
  lastReadAt: Date | null;
};

type ChatListItem = {
  chatId: string;
  partnerUsername: string;
  unreadCount: number;
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <main className="p-4 text-center">
        <p>You must be logged in to view this page.</p>
        <Link href="/login" className="text-blue-500 underline">
          Go to Login
        </Link>
      </main>
    );
  }
  const userId = session.user.id;

  // Fetch your ChatUser rows, including each chat’s users & messages
  const rows = await prisma.chatUser.findMany({
    where: { userId },
    include: {
      chat: {
        include: {
          chatUsers: { select: { user: { select: { id: true, username: true } } } },
          messages: { select: { createdAt: true } },
        },
      },
    },
    orderBy: { chat: { createdAt: "desc" } },
  });

  // Build a simple array with unread counts
  const items: ChatListItem[] = rows.map((row: ChatRow) => {
    const { chat, lastReadAt } = row;
    const partnerUsername =
      chat.chatUsers
        .map((cu) => cu.user)
        .find((u) => u.id !== userId)
        ?.username ?? "Unknown";

    const unreadCount = chat.messages.filter(
      (m: { createdAt: Date }) => !lastReadAt || m.createdAt > lastReadAt
    ).length;

    return {
      chatId: chat.id,
      partnerUsername,
      unreadCount,
    };
  });

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Chats</h1>
      <ul className="space-y-2">
        {items.map(({ chatId, partnerUsername, unreadCount }) => (
          <li
            key={chatId}
            className="flex justify-between items-center border p-4 rounded"
          >
            <Link href={`/chat/${chatId}`} className="hover:underline">
              Chat with <strong>{partnerUsername}</strong>
            </Link>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                {unreadCount}
              </span>
            )}
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Start New Chat</h2>
      <UserSearchInput />
    </main>
  );
}
