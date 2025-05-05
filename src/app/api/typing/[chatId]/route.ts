import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

interface Params {
  params: { chatId: string };
}

const typingUsersMap = new Map<string, { [userId: string]: number }>();

const TYPING_TIMEOUT = 5000; // 5 seconds of inactivity

export async function POST(req: NextRequest, context: { params: { chatId: string } }) {
  const { chatId } = context.params;


  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const now = Date.now();

  const chatTyping = typingUsersMap.get(chatId) || {};
  chatTyping[userId] = now;

  typingUsersMap.set(chatId, chatTyping);
  return NextResponse.json({ status: "ok" });
}

export async function GET(req: NextRequest, context: { params: { chatId: string } }) {
  const { chatId } = context.params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = Date.now();

  const chatTyping = typingUsersMap.get(chatId) || {};
  const activeUsers = Object.entries(chatTyping)
    .filter(([id, ts]) => now - ts < TYPING_TIMEOUT && id !== userId)
    .map(([id]) => id);

  return NextResponse.json({ typing: activeUsers });
}
