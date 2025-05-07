'use client';

import { useEffect, useRef, useState } from "react";
import { initSocket } from "@/lib/socket";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; username: string };
}

interface User {
  id: string;
  username: string;
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

  useEffect(() => {
    let socket: any;
    (async () => {
      socket = await initSocket();

      // join room & tell server who you are
      socket.emit("join", chatId, {
        id: currentUserId,
        username: currentUsername,
      });

      // load initial messages
      const res = await fetch(`/api/messages/chat/${chatId}`);
      setMessages(await res.json());

      // events
      socket.on("message", (msg: Message) =>
        setMessages((ms) => [...ms, msg])
      );
      socket.on("userJoined", (user: User) =>
        setNotifications((n) => [...n, `${user.username} joined`])
      );
      socket.on("userLeft", (user: User) =>
        setNotifications((n) => [...n, `${user.username} left`])
      );
      socket.on("presence", (users: User[]) => setOnline(users));
    })();

    return () => {
      if (socket) {
        socket.emit("leave", chatId, {
          id: currentUserId,
          username: currentUsername,
        });
        socket.off("message");
        socket.off("userJoined");
        socket.off("userLeft");
        socket.off("presence");
      }
    };
  }, [chatId, currentUserId, currentUsername]);

  // auto-scroll
  useEffect(() => {
    scrollAnchor.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="space-y-2 mb-6 border p-4 rounded max-h-[60vh] overflow-y-auto">
      {/* Online presence bar */}
      {online.length > 0 && (
        <p className="text-xs text-green-600 mb-1">
          Online now:{" "}
          {online
            .map((u) => (u.id === currentUserId ? "You" : u.username))
            .join(", ")}
        </p>
      )}

      {/* join/leave notifications */}
      {notifications.map((note, i) => (
        <p key={i} className="text-center text-gray-500 italic text-sm">
          {note}
        </p>
      ))}

      {/* message bubbles */}
      {messages.length === 0 && (
        <p className="text-center text-gray-500 italic">No messages yet. Say hi!</p>
      )}
      {messages.map((msg) => {
        const isOwn = msg.sender.id === currentUserId;
        return (
          <div
            key={msg.id}
            className={`max-w-[70%] p-3 rounded-2xl break-words ${
              isOwn ? "ml-auto bg-blue-500 text-white" : "mr-auto bg-gray-200 text-black"
            }`}
          >
            <p className="text-sm font-semibold mb-1">
              {isOwn ? "You" : msg.sender.username}
            </p>
            <p className="whitespace-pre-wrap">{msg.content}</p>
            <p className="text-xs text-right mt-1 text-white/70">
              {new Date(msg.createdAt).toLocaleTimeString()}
            </p>
          </div>
        );
      })}
      <div ref={scrollAnchor} />
    </div>
  );
}

