'use client';

import { useEffect, useRef, useState } from 'react';
import { initSocket, subscribeToNewMessages } from '@/lib/socket';
import type { Socket } from 'socket.io-client';
import { Message, MessageEnvelope, User } from './Messages/types';
import TypingIndicator from './Messages/TypingIndicator';
import OnlinePresenceBar from './Messages/OnlinePresenceBar';
import Notifications from './Messages/Notifications';
import MessageBubble from './Messages/MessageBubble';

// dedupe helper
function uniqById(arr: unknown): Message[] {
  if (!Array.isArray(arr)) {
    console.warn('uniqById: expected Message[], got:', arr);
    return [];
  }
  const seen = new Set<string>();
  return (arr as Message[]).filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
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
  const [notifications, setNotifications] = useState<string[]>([]);
  const [online, setOnline] = useState<User[]>([]);
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
      socketInstance.emit('join', chatId, {
        id: currentUserId,
        username: currentUsername,
      });

      unsubscribeFn = subscribeToNewMessages((payload: Message | MessageEnvelope) => {
        const m = 'message' in payload ? payload.message : payload;
        setMessages((prev) => uniqById([...prev, m]));
      });

      socketInstance.on('userJoined', (user: User) =>
        setNotifications((n) => [...n, `${user.username} joined`])
      );
      socketInstance.on('userLeft', (user: User) =>
        setNotifications((n) => [...n, `${user.username} left`])
      );
      socketInstance.on('presence', (users: User[]) => setOnline(users));
      socketInstance.on('typing', (user: User) => {
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
    })().catch((err) => console.error('socket setup failed:', err));

    return () => {
      if (socketInstance) {
        socketInstance.emit('leave', chatId, {
          id: currentUserId,
          username: currentUsername,
        });
        socketInstance.off('userJoined');
        socketInstance.off('userLeft');
        socketInstance.off('presence');
        socketInstance.off('typing');
        unsubscribeFn();
      }
    };
  }, [chatId, currentUserId, currentUsername]);

  return (
    <div className="space-y-2 mb-6 border p-4 rounded max-h-[60vh] overflow-y-auto">
      <OnlinePresenceBar online={online} currentUserId={currentUserId} />
      <Notifications notifications={notifications} />
      {messages.length === 0 && (
        <p className="text-center text-gray-500 italic">No messages yet. Say hi!</p>
      )}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} msg={msg} currentUserId={currentUserId} />
      ))}
      <TypingIndicator typingUsers={typingUsers} />
      <div ref={scrollAnchor} />
    </div>
  );
}
