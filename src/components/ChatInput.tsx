'use client';

import { useState, useRef } from 'react';
import { initSocket } from '@/lib/socket';

export default function ChatInput({
  chatId,
  currentUser,
}: {
  chatId: string;
  currentUser: { id: string; username: string };
}) {
  const [content, setContent] = useState('');
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const sendTyping = async () => {
    try {
      const socket = await initSocket();
      socket.emit('typing', chatId, currentUser);
    } catch (err) {
      console.error('Failed to send typing event:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    sendTyping();
    typingTimeout.current = setTimeout(sendTyping, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const socket = await initSocket();
      const msg = {
        chatId,
        id: crypto.randomUUID(),
        content,
        sender: currentUser,
        createdAt: new Date().toISOString(),
      };
      socket.emit('message', msg);
      setContent('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <textarea
        value={content}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
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
