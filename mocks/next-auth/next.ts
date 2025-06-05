import { NextResponse } from 'next/server';

// stubbed getServerSession
export const getServerSession = jest
  .fn<Promise<{ user: { id: string } } | null>, []>()
  .mockResolvedValue({ user: { id: 'foo' } });

// stubbed NextAuth handler
const NextAuth = () => ({
  GET: () => NextResponse.json({}),
  POST: () => NextResponse.json({}),
});
export default NextAuth;
