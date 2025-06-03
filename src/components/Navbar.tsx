'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="flex items-center justify-between p-4 bg-gray-100 border-b">
      <div className="text-lg font-semibold">
        <Link href="/">Chatty</Link>
      </div>
      <div className="flex items-center gap-4">
        {session?.user ? (
          <>
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <Link href="/backup" className="hover:underline">
              Backup Keys
            </Link>
            <Link href="/restore" className="hover:underline">
              Restore Keys
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-red-600 hover:underline"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:underline">
              Log In
            </Link>
            <Link href="/signup" className="hover:underline">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
