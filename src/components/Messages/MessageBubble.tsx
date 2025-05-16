'use client';

import React, { useEffect, useRef } from 'react';
import ReactionPicker from '@/components/ReactionPicker';
import { initSocket } from '@/lib/socket';
import { Message } from './types';

interface MessageBubbleProps {
  msg: Message;
  currentUserId: string;
  currentUsername: string;
  onDelete?: (id: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  currentUserId,
  currentUsername,
  onDelete,
}) => {
  const isOwn = msg.sender.id === currentUserId;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // group reactions by emoji
  const reactionCounts =
    msg.reactions?.reduce<Record<string, number>>((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    }, {}) ?? {};

  const handleReaction = async (emoji: string) => {
    console.log('Sending reaction', emoji, 'for message', msg.id);
    try {
      const socket = await initSocket();
      socket.emit('reaction', {
        messageId: msg.id,
        emoji,
        user: { id: currentUserId, username: currentUsername },
      });
    } catch (err) {
      console.error('Failed to emit reaction event:', err);
    }
  };

  const handleDelete = async () => {
    console.log('💥 Delete button clicked for', msg.id);
    if (!window.confirm('Delete this message?')) return;
    try {
      console.log('🚀 Emitting deleteMessage for', msg.id);
      const socket = await initSocket();
      socket.emit('deleteMessage', msg.id);
      onDelete?.(msg.id);
    } catch (err) {
      console.error('Failed to emit deleteMessage:', err);
    }
  };

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
      <div className="flex items-center space-x-2 mt-2">
        {Object.entries(reactionCounts).map(([emoji, count]) => (
          <span key={emoji} className="text-sm">
            {emoji} {count}
          </span>
        ))}
        <ReactionPicker onSelect={handleReaction} />
        {isOwn && onDelete && (
          <button onClick={handleDelete} className="ml-2 text-xs text-red-500 hover:underline">
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
