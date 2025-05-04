// src/app/api/chats/select/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // Check if a chat already exists between the two users
  const existingChat = await prisma.chat.findFirst({
    where: {
      users: {
        every: {
          id: { in: [session.user.id, userId] },
        },
      },
    },
  });

  if (existingChat) {
    return NextResponse.json({ chatId: existingChat.id });
  }

  const newChat = await prisma.chat.create({
    data: {
      users: {
        connect: [{ id: session.user.id }, { id: userId }],
      },
    },
  });

  return NextResponse.json({ chatId: newChat.id });
}
