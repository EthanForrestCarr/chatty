import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

interface Params {
  params: {
    chatId: string;
  };
}

type UserPreview = {
    id: string;
    username: string
};

export async function POST(req: NextRequest, context: { params: { chatId: string } }) {
  const { chatId } = context.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.redirect("/login");
  }

  const content = (await req.formData()).get("content")?.toString().trim();

  if (!content) {
    return NextResponse.redirect(`/chat/${chatId}`);
  }

  // Check user is in the chat
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      users: { select: { id: true } },
    },
  });

  if (!chat || !chat.users.some((u: UserPreview) => u.id === session.user.id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.message.create({
    data: {
      content,
      chat: { connect: { id: chatId } },
      sender: { connect: { id: session.user.id } },
    },
  });

  return NextResponse.redirect(new URL(`/chat/${chatId}`, req.url));
}
