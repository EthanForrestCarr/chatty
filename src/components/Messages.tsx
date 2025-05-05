'use client';

import { useEffect, useRef, useState } from "react";
import { initSocket } from "@/lib/socket";

export default function RealtimeMessages({
    chatId,
    currentUserId,
}: {
    chatId: string;
    currentUserId: string;
}) {
    const [messages, setMessages] = useState<any[]>([]);
    const scrollAnchor = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let socket: any;

        (async () => {
            socket = await initSocket();
            socket.emit("join", chatId);

            // initial load via REST
            const res = await fetch(`/api/messages/chat/${chatId}`);
            const initial = await res.json();
            setMessages(initial);

            // on new message
            socket.on("message", (msg: any) => {
                setMessages((msgs) => [...msgs, msg]);
            });
        })();

        return () => {
            socket?.emit("leave", chatId);
            socket?.off("message");
        };
    }, [chatId]);

    useEffect(() => {
        scrollAnchor.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!messages) return <p>Loading messages...</p>;

    return (
        <div className="space-y-4 mb-6 border p-4 rounded max-h-[60vh] overflow-y-auto">
            {messages.length === 0 && (
                <p className="text-center text-gray-500 italic">No messages yet. Say hi!</p>
            )}
            {messages.map((msg) => {
                const isOwnMessage = msg.sender?.id === currentUserId;
                return (
                    <div
                        key={msg.id}
                        className={`max-w-[70%] p-3 rounded-2xl break-words ${isOwnMessage
                                ? "ml-auto bg-blue-500 text-white"
                                : "mr-auto bg-gray-200 text-black"
                            }`}
                    >
                        <p className="text-sm font-semibold mb-1">
                            {isOwnMessage ? "You" : msg.sender?.username || "Unknown"}
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
