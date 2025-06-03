import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: { userId: string } }) {
  const { userId } = params;
  // fetch encrypted backup for this user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { encryptedBackup: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  return NextResponse.json({ encryptedBackup: user.encryptedBackup });
}

export async function POST(req: Request, { params }: { params: { userId: string } }) {
  const { userId } = params;
  const body = await req.json();
  const { salt, nonce, encryptedKey } = body;
  if (!salt || !nonce || !encryptedKey) {
    return NextResponse.json({ error: 'Missing backup fields' }, { status: 400 });
  }
  // store encrypted backup as JSON string
  const blob = JSON.stringify({ salt, nonce, encryptedKey });
  await prisma.user.update({
    where: { id: userId },
    data: { encryptedBackup: blob },
  });
  return NextResponse.json({ success: true });
}
