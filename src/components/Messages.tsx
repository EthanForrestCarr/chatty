'use client';

import { useEffect, useRef, useState } from "react";
import { initSocket, subscribeToNewMessages } from "@/lib/socket";

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

function uniqById(arr: Message[]): Message[] {
    const seen = new Set<string>();
    return arr.filter((m) => {
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

    // initial load
    useEffect(() => {
        fetch(`/api/messages/chat/${chatId}`)
            .then((r) => r.json())
            .then((msgs: Message[]) => {
                setMessages(uniqById(msgs));
            });
    }, [chatId]);

    // pseudo-socket subscription
    useEffect(() => {
        let socketInstance: any;
        (async () => {
            socketInstance = await initSocket();
            socketInstance.emit("join", chatId, {
                id: currentUserId,
                username: currentUsername,
            });

            // wire up new messages
            const unsubscribe = subscribeToNewMessages((newMsg: Message) => {
                setMessages((prev) => uniqById([...prev, newMsg]));
            });

            socketInstance.on("userJoined", (user: User) =>
                setNotifications((n) => [...n, `${user.username} joined`])
            );
            socketInstance.on("userLeft", (user: User) =>
                setNotifications((n) => [...n, `${user.username} left`])
            );
            socketInstance.on("presence", (users: User[]) => setOnline(users));
            socketInstance.on("typing", (user: User) => {
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

            return unsubscribe;
        })();

        return () => {
            if (socketInstance) {
                socketInstance.emit("leave", chatId, {
                    id: currentUserId,
                    username: currentUsername,
                });
                socketInstance.off("userJoined");
                socketInstance.off("userLeft");
                socketInstance.off("presence");
                socketInstance.off("typing");
            }
        };
    }, [chatId, currentUserId, currentUsername]);

    // auto-scroll
    useEffect(() => {
        scrollAnchor.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="space-y-2 mb-6 border p-4 rounded max-h-[60vh] overflow-y-auto">
            {/* typing indicator */}
            {typingUsers.size > 0 && (
                <p className="text-sm italic text-gray-500">
                    {Array.from(typingUsers).join(", ")} {typingUsers.size > 1 ? "are" : "is"} typing…
                </p>
            )}

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
                        className={`max-w-[70%] p-3 rounded-2xl break-words ${isOwn ? "ml-auto bg-blue-500 text-white" : "mr-auto bg-gray-200 text-black"
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

