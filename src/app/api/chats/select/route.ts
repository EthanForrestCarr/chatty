import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { chatSelectSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  // parse & validate body
  const body = await req.json();
  const parsed = chatSelectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { userId } = parsed.data;

  // auth guard
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // check for existing chat
  const existing = await prisma.chat.findFirst({
    where: {
      AND: [
        { chatUsers: { some: { userId: session.user.id } } },
        { chatUsers: { some: { userId } } },
      ],
    },
  });

  if (existing) {
    return NextResponse.json({ chatId: existing.id });
  }

  // create new chat
  const created = await prisma.chat.create({
    data: {
      chatUsers: {
        create: [
          { user: { connect: { id: session.user.id } } },
          { user: { connect: { id: userId } } },
        ],
      },
    },
  });

  return NextResponse.json({ chatId: created.id });
}
