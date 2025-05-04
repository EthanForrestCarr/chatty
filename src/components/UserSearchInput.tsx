'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function UserSearchInput() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; username: string }[]>([]);
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!query) return setResults([]);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      const res = await fetch(`/api/users/search?query=${query}`);
      const users = await res.json();
      setResults(users);
    }, 300);
  }, [query]);

  const handleSelect = async (userId: string) => {
    // Create or find chat
    const res = await fetch("/api/chats/select", {
      method: "POST",
      body: JSON.stringify({ userId }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
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
