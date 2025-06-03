/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import type { AuthOptions } from 'next-auth';

// stubbed getServerSession
export const getServerSession = jest
  .fn<Promise<{ user: { id: string } } | null>, []>()
  .mockResolvedValue({ user: { id: 'foo' } });

// stubbed NextAuth handler
const NextAuth = (_opts: AuthOptions) => ({
  GET: () => NextResponse.json({}),
  POST: () => NextResponse.json({}),
});
export default NextAuth;
