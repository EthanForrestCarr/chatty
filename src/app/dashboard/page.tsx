import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import Link from "next/link";

type UserPreview = { id: string; username: string };
type ChatWithUsers = Awaited<ReturnType<typeof prisma.chat.findMany>>[number];

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return (
            <main className="p-4 text-center">
                <p>You must be logged in to view this page.</p>
                <Link href="/login" className="text-blue-500 underline">
                    Go to Login
                </Link>
            </main>
        );
    }

    const chats = await prisma.chat.findMany({
        where: {
            users: {
                some: {
                    id: session.user.id,
                },
            },
        },
        include: {
            users: {
                select: { id: true, username: true },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return (
        <main className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Your Chats</h1>

            <ul className="space-y-4 mb-8">
                {chats.map((chat: ChatWithUsers) => {
                    const otherUser = chat.users.find((u: UserPreview) => u.id !== session.user.id);

                    return (
                        <li key={chat.id} className="border p-4 rounded">
                            <Link href={`/chat/${chat.id}`}>
                                <div className="hover:underline">
                                    Chat with <strong>{otherUser?.username ?? "Unknown"}</strong>
                                </div>
                            </Link>
                        </li>
                    );
                })}
            </ul>

            <h2 className="text-xl font-semibold mb-2">Start New Chat</h2>
            <form action="/api/chats" method="POST" className="flex gap-2">
                <input
                    type="text"
                    name="username"
                    placeholder="Search username..."
                    className="border p-2 rounded w-full"
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Start
                </button>
            </form>
        </main>
    );
}