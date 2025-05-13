import React, { useEffect, useRef } from 'react';
import { Message } from './types';

interface MessageBubbleProps {
  msg: Message;
  currentUserId: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ msg, currentUserId }) => {
  const isOwn = msg.sender.id === currentUserId;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div
      ref={ref}
      key={msg.id}
      className={`max-w-[70%] p-3 rounded-2xl break-words ${
        isOwn ? 'ml-auto bg-blue-500 text-white' : 'mr-auto bg-gray-200 text-black'
      }`}
    >
      <p className="text-sm font-semibold mb-1">{isOwn ? 'You' : msg.sender.username}</p>
      <p className="whitespace-pre-wrap">{msg.content}</p>
      <p className="text-xs text-right mt-1 text-white/70">
        {new Date(msg.createdAt).toLocaleTimeString()}
      </p>
    </div>
  );
};

export default MessageBubble;
