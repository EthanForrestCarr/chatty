'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactionPicker from '@/components/ReactionPicker';
import { initSocket } from '@/lib/socket';
import { Message } from './types';

interface MessageBubbleProps {
  msg: Message;
  currentUserId: string;
  currentUsername: string;
  isPending?: boolean;
  onUndo?: (id: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  currentUserId,
  currentUsername,
  isPending,
  onUndo,
}) => {
  const isOwn = msg.sender.id === currentUserId;
  // edit state
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(msg.content);
  // allow edit within 10 minutes
  const createdTime = new Date(msg.createdAt).getTime();
  const canEdit = isOwn && Date.now() - createdTime < 10 * 60 * 1000;
  // always initialize ref and scroll effect
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  // if pending deletion, show undo option
  if (isPending) {
    return (
      <div className="max-w-[70%] p-3 rounded-2xl break-words opacity-50 italic bg-yellow-100 text-black">
        <p className="text-sm mb-1">Message deleted</p>
        {isOwn && onUndo && (
          <button onClick={() => onUndo(msg.id)} className="text-xs text-blue-500 hover:underline">
            Undo
          </button>
        )}
      </div>
    );
  }

  // handle save/cancel
  const handleSaveEdit = async () => {
    try {
      const socket = await initSocket();
      socket.emit('editMessage', { messageId: msg.id, newContent: draft });
    } catch (err) {
      console.error('Failed to emit editMessage:', err);
    }
    setIsEditing(false);
  };
  const handleCancelEdit = () => {
    setDraft(msg.content);
    setIsEditing(false);
  };

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
      // deletion handled via socket events
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
      {isEditing ? (
        <textarea
          className="w-full p-2 border rounded"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      ) : (
        <p className="whitespace-pre-wrap">{msg.content}</p>
      )}
      <p className="text-xs text-right mt-1 text-white/70">
        {new Date(msg.createdAt).toLocaleTimeString()}
        {msg.editedAt && <span className="italic ml-2">(edited)</span>}
      </p>
      <div className="flex items-center space-x-2 mt-2">
        {Object.entries(reactionCounts).map(([emoji, count]) => (
          <span key={emoji} className="text-sm">
            {emoji} {count}
          </span>
        ))}
        <ReactionPicker onSelect={handleReaction} />
        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-green-500 hover:underline"
          >
            Edit
          </button>
        )}
        {isEditing && (
          <>
            <button onClick={handleSaveEdit} className="text-xs text-blue-500 hover:underline">
              Save
            </button>
            <button onClick={handleCancelEdit} className="text-xs text-gray-500 hover:underline">
              Cancel
            </button>
          </>
        )}
        {!isPending && isOwn && (
          <button onClick={handleDelete} className="ml-2 text-xs text-red-500 hover:underline">
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
