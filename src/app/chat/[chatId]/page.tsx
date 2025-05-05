import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Messages from "@/components/Messages";
import ChatInput from "@/components/ChatInput";

interface Props {
    params: {
        chatId: string;
    };
}

type UserPreview = {
    id: string;
    username: string;
};

export default async function ChatPage({ params }: Props) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = session.user.id;

    const chat = await prisma.chat.findUnique({
        where: { id: params.chatId },
        include: {
            users: { select: { id: true, username: true } },
        },
    });

    if (!chat) notFound();

    const isUserInChat = chat.users.some((u: UserPreview) => u.id === userId);
    if (!isUserInChat) {
        return (
            <main className="p-4 text-center">
                <p>You are not authorized to view this chat.</p>
                <Link href="/dashboard" className="text-blue-500 underline">
                    Back to Dashboard
                </Link>
            </main>
        );
    }
    const chatPartner = chat.users.find((u) => u.id !== userId);

    return (
        <main className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">
                {chatPartner?.username || "Unknown User"}
            </h1>
            <Messages chatId={chat.id} currentUserId={userId} />
            <ChatInput chatId={chat.id} />
        </main>
    );
}

