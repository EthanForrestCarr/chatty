import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

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
