import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

interface Props {
    params: {
        chatId: string;
    };
}

type ChatMessage = {
    id: string;
    content: string;
    createdAt: Date;
    sender: {
        id: string;
        username: string;
    };
};

type UserPreview = {
    id: string;
    username: string
};


export default async function ChatPage({ params }: Props) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/login");
    }

    const chat = await prisma.chat.findUnique({
        where: { id: params.chatId },
        include: {
            users: { select: { id: true, username: true } },
            messages: {
                orderBy: { createdAt: "asc" },
                include: {
                    sender: { select: { id: true, username: true } },
                },
            },
        },
    });

    if (!chat) notFound();

    const isUserInChat = chat.users.some((u: UserPreview) => u.id === session.user.id);
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

    return (
        <main className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Chat</h1>

            <div className="space-y-4 mb-6 border p-4 rounded max-h-[60vh] overflow-y-auto">
                {chat.messages.map((msg: ChatMessage) => (
                    <div
                        key={msg.id}
                        className={`p-2 rounded ${msg.sender.id === session.user.id
                            ? "bg-blue-100 text-right"
                            : "bg-gray-100 text-left"
                            }`}
                    >
                        <p className="text-sm font-semibold">{msg.sender.username}</p>
                        <p>{msg.content}</p>
                        <p className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString()}</p>
                    </div>
                ))}
            </div>

            <form action={`/api/chats/${chat.id}`} method="POST" className="flex gap-2">
                <input
                    name="content"
                    placeholder="Type your message..."
                    className="border p-2 rounded w-full"
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Send
                </button>
            </form>
        </main>
    );
}
