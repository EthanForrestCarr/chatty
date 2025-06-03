import { prisma } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
): Promise<Response> {
  // await the dynamic params proxy
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { publicKey: true },
  });

  if (!user) {
    return new Response('User not found', { status: 404 });
  }

  return new Response(JSON.stringify({ publicKey: user.publicKey }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
): Promise<Response> {
  // await dynamic params
  const { userId } = await params;
  const { publicKey } = (await req.json()) as { publicKey?: string };

  if (!publicKey || typeof publicKey !== 'string') {
    return new Response('Invalid publicKey', { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { publicKey },
    select: { publicKey: true },
  });

  return new Response(JSON.stringify({ publicKey: updated.publicKey }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
