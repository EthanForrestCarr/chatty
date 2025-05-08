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

  const targetUser = await prisma.user.findUnique({ where: { username } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 1) Find an existing chat via the join table:
  const existingChat = await prisma.chat.findFirst({
    where: {
      AND: [
        { chatUsers: { some: { userId: session.user.id } } },
        { chatUsers: { some: { userId: targetUser.id } } },
      ],
    },
    // include the users so you can redirect on existingChat.id
    include: { chatUsers: { include: { user: true } } },
  });

  if (existingChat) {
    return NextResponse.redirect(
      new URL(`/chat/${existingChat.id}`, req.url)
    );
  }

  // 2) Otherwise create it by nesting into chatUsers:
  const newChat = await prisma.chat.create({
    data: {
      chatUsers: {
        create: [
          { user: { connect: { id: session.user.id } } },
          { user: { connect: { id: targetUser.id } } },
        ],
      },
    },
  });

  return NextResponse.redirect(new URL(`/chat/${newChat.id}`, req.url));
}
