'use client';

import { useEffect, useRef, useState } from 'react';
import { initSocket, subscribeToNewMessages } from '@/lib/socket';
import type { Socket } from 'socket.io-client';
import { Message, MessageEnvelope } from './Messages/types';
import TypingIndicator from './Messages/TypingIndicator';
import MessageBubble from './Messages/MessageBubble';

// dedupe helper
function uniqById(arr: unknown): Message[] {
  if (!Array.isArray(arr)) {
    console.warn('uniqById: expected Message[], got:', arr);
    return [];
  }
  const seen = new Set<string>();
  return (arr as Message[]).filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export default function RealtimeMessages({
  chatId,
  currentUserId,
  currentUsername,
}: {
  chatId: string;
  currentUserId: string;
  currentUsername: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  // banner text for join/leave notifications
  const [banner, setBanner] = useState<string | null>(null);
  const scrollAnchor = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // 1) initial load
  useEffect(() => {
    (async () => {
      console.log('[ui] fetching messages for chatId =', chatId);
      try {
        const res = await fetch(`/api/messages/chat/${chatId}`, {
          credentials: 'include', // ← send NextAuth cookie
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const body = await res.json();
        const msgs = Array.isArray(body) ? body : Array.isArray(body.messages) ? body.messages : [];
        setMessages(uniqById(msgs));
      } catch (err) {
        console.error('Messages fetch failed:', err);
      }
    })();
  }, [chatId]);

  // 2) real-time subscription
  useEffect(() => {
    let socketInstance: Socket | null = null;
    let unsubscribeFn: () => void = () => {};

    (async () => {
      socketInstance = await initSocket();
      console.log('🔗 Socket connected on client with id:', socketInstance.id);
      socketInstance.emit('join', chatId, {
        id: currentUserId,
        username: currentUsername,
      });
      console.log('📣 Emitted join for chat', chatId);

      unsubscribeFn = subscribeToNewMessages((payload: Message | MessageEnvelope) => {
        const m = 'message' in payload ? payload.message : payload;
        setMessages((prev) => uniqById([...prev, m]));
      });

      socketInstance.on('presence', (users) => {
        console.log('👥 Presence update:', users);
      });

      socketInstance.on('typing', (user) => {
        if (user.id !== currentUserId) {
          setTypingUsers((s) => new Set(s).add(user.username));
          setTimeout(() => {
            setTypingUsers((s) => {
              const copy = new Set(s);
              copy.delete(user.username);
              return copy;
            });
          }, 3000);
        }
      });
      // sticky banner for join/leave
      socketInstance.on('userJoined', (user) => {
        setBanner(`${user.username} joined`);
        setTimeout(() => setBanner(null), 3000);
      });
      socketInstance.on('userLeft', (user) => {
        setBanner(`${user.username} left`);
        setTimeout(() => setBanner(null), 3000);
      });
      socketInstance.on('reaction', (reaction) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === reaction.messageId
              ? { ...m, reactions: [...(m.reactions ?? []), reaction] }
              : m
          )
        );
      });
      socketInstance.on('deleteMessage', (messageId: string) => {
        console.log('💥 Received deleteMessage event in client for', messageId);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      });
    })().catch((err) => console.error('socket setup failed:', err));

    return () => {
      if (socketInstance) {
        socketInstance.emit('leave', chatId, {
          id: currentUserId,
          username: currentUsername,
        });
        socketInstance.off('typing');
        socketInstance.off('userJoined');
        socketInstance.off('userLeft');
        socketInstance.off('reaction');
        socketInstance.off('deleteMessage');
        unsubscribeFn();
      }
    };
  }, [chatId, currentUserId, currentUsername]);

  return (
    <div className="relative mb-6 border p-4 rounded max-h-[60vh] overflow-x-hidden overflow-y-auto">
      {/* sticky banner sliding in/out */}
      <div
        className={
          `sticky top-0 z-10 mx-auto mb-2 max-w-[80%] px-4 py-2 text-center text-sm italic rounded-2xl transform transition-transform duration-300 ` +
          (banner
            ? `translate-x-0 ${banner.includes('joined') ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`
            : 'translate-x-full')
        }
      >
        {banner || ''}
      </div>
      {messages.length === 0 && (
        <p className="text-center text-gray-500 italic">No messages yet. Say hi!</p>
      )}
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          msg={msg}
          currentUserId={currentUserId}
          currentUsername={currentUsername}
          onDelete={(id) => setMessages((prev) => prev.filter((m) => m.id !== id))}
        />
      ))}
      <TypingIndicator typingUsers={typingUsers} />
      <div ref={scrollAnchor} />
    </div>
  );
}
