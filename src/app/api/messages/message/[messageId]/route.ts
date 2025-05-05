import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

interface Params {
  params: {
    messageId: string;
  };
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.redirect("/login");
  }

  const methodOverride = (await req.formData()).get("_method");

  if (methodOverride !== "DELETE") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  const message = await prisma.message.findUnique({
    where: { id: params.messageId },
  });

  if (!message || message.senderId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.message.delete({
    where: { id: params.messageId },
  });

  // Redirect back to the chat page
  const chatId = req.nextUrl.searchParams.get("chatId");
  return NextResponse.redirect(new URL(`/chat/${chatId}`, req.url));
}
