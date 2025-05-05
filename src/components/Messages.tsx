'use client';

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Messages({ chatId, currentUserId }: { chatId: string; currentUserId: string }) {
  const { data: messages, isLoading } = useSWR(
    `/api/messages/${chatId}`,
    fetcher,
    { refreshInterval: 2000 } // ← poll every 2 seconds
  );

  if (isLoading || !messages) return <p>Loading messages...</p>;

  return (
    <div className="space-y-4 mb-6 border p-4 rounded max-h-[60vh] overflow-y-auto">
      {messages.map((msg: any) => (
        <div
          key={msg.id}
          className={`p-2 rounded ${
            msg.sender.id === currentUserId
              ? "bg-blue-100 text-right"
              : "bg-gray-100 text-left"
          }`}
        >
          <p className="text-sm font-semibold">{msg.sender.username}</p>
          <p>{msg.content}</p>
          <p className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
