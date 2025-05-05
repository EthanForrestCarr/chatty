'use client';

import { useState, useRef } from "react";
import { initSocket } from "@/lib/socket";

export default function ChatInput({ chatId, currentUser }: { chatId: string; currentUser: { id: string; username: string } }) {
  const [content, setContent] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const msg = {
      chatId,
      id: crypto.randomUUID(),
      content,
      sender: currentUser,
      createdAt: new Date().toISOString(),
    };

    const socket = await initSocket();
    socket.emit("message", msg);
    setContent("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        placeholder="Type your message..."
        rows={1}
        className="border p-2 rounded w-full resize-none"
        autoFocus
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Send
      </button>
    </form>
  );
}

