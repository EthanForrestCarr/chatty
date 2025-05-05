export const runtime = 'nodejs';

import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Messages from "@/components/Messages";
import ChatInput from "@/components/ChatInput";

type UserPreview = { id: string; username: string };

export default async function ChatPage({
  params,
}: {
  params: { chatId: string };
}) {
  // await the whole params object
  const { chatId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { users: { select: { id: true, username: true } } },
  });
  if (!chat) notFound();

  if (!chat.users.some((u: UserPreview) => u.id === userId)) {
    return (
      <main className="p-4 text-center">
        <p>You are not authorized to view this chat.</p>
        <Link href="/dashboard" className="text-blue-500 underline">
          Back to Dashboard
        </Link>
      </main>
    );
  }

  const partner = chat.users.find((u) => u.id !== userId);

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Chat with {partner?.username || "Unknown User"}
      </h1>
      <Messages chatId={chatId} currentUserId={userId} />
      <ChatInput
        chatId={chatId}
        currentUser={{ id: userId, username: session.user.name || "Unknown" }}
      />
    </main>
  );
}



