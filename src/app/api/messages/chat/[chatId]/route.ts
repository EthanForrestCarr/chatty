import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { chatParamsSchema, messageCreateSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params: { chatId } }: { params: { chatId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      // only load chatUsers so we can check membership
      chatUsers: { select: { userId: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, username: true } } },
      },
    },
  });

  if (!chat || !chat.chatUsers.some((cu) => cu.userId === session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(chat.messages);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  // 1) validate chatId
  const p = chatParamsSchema.safeParse(params);
  if (!p.success) {
    return NextResponse.json({ error: "Invalid chatId" }, { status: 400 });
  }
  const { chatId } = p.data;

  // 2) auth
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3) validate payload
  const body = await req.json();
  const m = messageCreateSchema.safeParse(body);
  if (!m.success) {
    const msg = m.error.issues[0].message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // 4) membership guard
  const member = await prisma.chatUser.findUnique({
    where: { chatId_userId: { chatId, userId: session.user.id } },
  });
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 5) create & return
  const message = await prisma.message.create({
    data: {
      chatId,
      senderId: session.user.id,
      content: m.data.content.trim(),
    },
    include: { sender: { select: { id: true, username: true } } },
  });
  return NextResponse.json(message, { status: 201 });
}
