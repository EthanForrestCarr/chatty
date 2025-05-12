import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { userSearchSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const rawQuery = url.searchParams.get('query') ?? '';
  const parsed = userSearchSchema.safeParse({ query: rawQuery });

  if (!parsed.success) {
    const msg = parsed.error.issues[0].message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { query } = parsed.data;
  const users = await prisma.user.findMany({
    where: {
      username: { contains: query, mode: 'insensitive' },
      NOT: { id: session.user.id },
    },
    take: 5,
    select: { id: true, username: true },
  });

  return NextResponse.json(users);
}
