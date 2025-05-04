'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="p-4 text-center">
      <h1 className="text-3xl font-bold mb-6">Welcome to Chatty</h1>
      <p className="mb-4">A simple real-time chat app built with Next.js and PostgreSQL.</p>

      <div className="flex justify-center gap-4">
        <Link href="/signup">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Sign Up
          </button>
        </Link>
        <Link href="/login">
          <button className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400">
            Log In
          </button>
        </Link>
      </div>
    </main>
  );
}
