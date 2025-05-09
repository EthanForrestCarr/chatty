import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { chatParamsSchema, messageCreateSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  // params comes in as a Promise<...>, so await it first
  const realParams = await params;

  // now realParams === { chatId: string }
  console.log("[api] realParams:", realParams);

  // 1) validate chatId
  const parsed = chatParamsSchema.safeParse(realParams);
  console.log("[api] Zod safeParse:", parsed);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { chatId } = parsed.data;

  // 2) auth
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3) membership guard
  const member = await prisma.chatUser.findUnique({
    where: { chatId_userId: { chatId, userId: session.user.id } },
  });
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 4) fetch & return
  const messages = await prisma.message.findMany({
    where: { chatId },
    include: { sender: { select: { id: true, username: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
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
