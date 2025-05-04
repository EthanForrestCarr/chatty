import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query || !session?.user?.id) {
    return NextResponse.json([]);
  }

  const users = await prisma.user.findMany({
    where: {
      username: {
        contains: query,
        mode: "insensitive",
      },
      NOT: {
        id: session.user.id,
      },
    },
    take: 5,
    select: {
      id: true,
      username: true,
    },
  });

  return NextResponse.json(users);
}
