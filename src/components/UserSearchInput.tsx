'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

async function searchUsers(query: string) {
  const res = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json() as Promise<{ id: string; username: string }[]>;
}

export default function UserSearchInput() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; username: string }[]>([]);
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!query) return setResults([]);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      try {
        const users = await searchUsers(query);
        setResults(users);
      } catch (err) {
        console.error('User search failed:', err);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query]);

  const handleSelect = async (userId: string) => {
    const res = await fetch('/api/chats/select', {
      method: 'POST',
      body: JSON.stringify({ userId }),
      headers: { 'Content-Type': 'application/json' },
    });

    // bail on HTTP errors
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      console.error('Failed to start chat:', err ?? res.statusText);
      return;
    }

    // follow any redirects (if for some reason your API route sent one)
    if (res.redirected) {
      router.push(new URL(res.url).pathname);
      return;
    }

    // now it’s safe to parse
    const data = await res.json();
    if (!data?.chatId) {
      console.error('No chatId in response');
      return;
    }
    router.push(`/chat/${data.chatId}`);
  };

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search users..."
        className="border p-2 rounded w-full"
      />
      {results.length > 0 && (
        <ul className="absolute bg-white border w-full rounded shadow mt-1 z-10">
          {results.map((user) => (
            <li
              key={user.id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(user.id)}
            >
              {user.username}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
