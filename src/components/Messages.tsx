'use client';

import useSWR from "swr";
import { useEffect, useRef } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Messages({ chatId, currentUserId }: { chatId: string; currentUserId: string }) {
    const { data: messages, isLoading } = useSWR(
        `/api/messages/chat/${chatId}`,
        fetcher,
        { refreshInterval: 2000 }
    );

    const { data: typingData } = useSWR(
        `/api/typing/chat/${chatId}`,
        fetcher,
        { refreshInterval: 1500 }
    );

    const scrollAnchor = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollAnchor.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (isLoading || !messages) return <p>Loading messages...</p>;

    return (
        <div className="space-y-4 mb-6 border p-4 rounded max-h-[60vh] overflow-y-auto">
            {messages.length === 0 && (
                <p className="text-center text-gray-500 italic">
                    No messages yet. Say hi!
                </p>
            )}

            {messages.map((msg: any) => (
                <div
                    key={msg.id}
                    className={`max-w-[70%] p-3 rounded-2xl break-words ${msg.sender.id === currentUserId
                        ? "ml-auto bg-blue-500 text-white"
                        : "mr-auto bg-gray-200 text-black"
                        }`}
                >
                    <p className="text-sm font-semibold mb-1">
                        {msg.sender.id === currentUserId ? "You" : msg.sender.username}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs text-right mt-1 text-white/70">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                </div>
            ))}

            {typingData?.typing?.length > 0 && (
                <p className="text-sm italic text-gray-500">
                    {typingData.typing.length === 1
                        ? "Someone is typing..."
                        : "Multiple users are typing..."}
                </p>
            )}


            <div ref={scrollAnchor} />
        </div>
    );

}
