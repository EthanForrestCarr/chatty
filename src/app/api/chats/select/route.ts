import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

type ChatWithUsers = {
    id: string;
    users: { id: string }[];
  };

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await req.json();
  if (!userId || userId === session.user.id) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  // Try to find a chat with exactly these two users
  const possibleChats = await prisma.chat.findMany({
    where: {
      users: {
        some: { id: session.user.id },
      },
    },
    include: {
      users: true,
    },
  });
  
  const existingChat = possibleChats.find((chat: ChatWithUsers) =>
    chat.users.length === 2 &&
    chat.users.some((u: { id: string }) => u.id === userId) &&
    chat.users.some((u: { id: string }) => u.id === session.user.id)
  );
  

  if (existingChat) {
    return NextResponse.json({ chatId: existingChat.id });
  }

  // Create new chat
  const newChat = await prisma.chat.create({
    data: {
      users: {
        connect: [
          { id: session.user.id },
          { id: userId },
        ],
      },
    },
  });

  return NextResponse.json({ chatId: newChat.id });
}
