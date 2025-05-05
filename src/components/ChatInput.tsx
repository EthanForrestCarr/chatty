'use client';

import { useState, useRef } from "react";

export default function ChatInput({ chatId }: { chatId: string }) {
  const [content, setContent] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendTypingActivity = () => {
    fetch(`/api/typing/chat/${chatId}`, {
      method: "POST",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Debounced typing notification
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingActivity();
    }, 300); // 300ms after user stops typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await fetch(`/api/chats/${chatId}`, {
      method: "POST",
      body: new URLSearchParams({ content }),
    });

    setContent("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <textarea
        value={content}
        onChange={handleChange}
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
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Send
      </button>
    </form>
  );
}

