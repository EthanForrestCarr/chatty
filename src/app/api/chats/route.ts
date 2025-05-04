import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const username = formData.get("username")?.toString();

  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { username },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if a chat already exists between the two users
  const existingChat = await prisma.chat.findFirst({
    where: {
      users: {
        every: {
          id: { in: [session.user.id, targetUser.id] },
        },
      },
    },
    include: { users: true },
  });

  if (existingChat) {
    // Chat already exists — redirect to it
    return NextResponse.redirect(`/chat/${existingChat.id}`);
  }

  // Create a new chat
  const newChat = await prisma.chat.create({
    data: {
      users: {
        connect: [{ id: session.user.id }, { id: targetUser.id }],
      },
    },
  });

  return NextResponse.redirect(`/chat/${newChat.id}`);
}
