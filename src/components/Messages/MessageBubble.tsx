'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactionPicker from '@/components/ReactionPicker';
import { initSocket } from '@/lib/socket';
import { initSodium, deriveSharedKey, decrypt, decryptBytes, encrypt } from '@/lib/crypto';
import Image from 'next/image';
import { Message } from './types';

interface MessageBubbleProps {
  msg: Message;
  currentUserId: string;
  currentUsername: string;
  recipientId: string; // chat partner's userId for own-message decryption
  isPending?: boolean;
  onUndo?: (id: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  currentUserId,
  currentUsername,
  recipientId,
  isPending,
  onUndo,
}) => {
  // maintain decrypted content for E2EE
  const [decryptedContent, setDecryptedContent] = useState(msg.content);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  // map attachment key to decrypted blob URL
  const [attachmentBlobs, setAttachmentBlobs] = useState<Record<string, string>>({});

  const isOwn = msg.sender.id === currentUserId;

  // decrypt incoming messages with nonce
  useEffect(() => {
    async function doDecrypt() {
      try {
        await initSodium();
        const storageKey = `privateKey:${currentUserId}`;
        const privateKey = localStorage.getItem(storageKey);
        if (!privateKey) return;
        const otherId = isOwn ? recipientId : msg.sender.id;
        const res = await fetch(`/api/users/${otherId}/publicKey`);
        if (!res.ok) {
          console.error('Failed to fetch public key for decryption');
          return;
        }
        const { publicKey } = (await res.json()) as { publicKey?: string };
        if (!publicKey) {
          console.error('No public key available for user', otherId);
          return;
        }
        const sharedKey = await deriveSharedKey(privateKey, publicKey);
        // decrypt text content if present
        if (msg.nonce) {
          const plain = await decrypt(sharedKey, msg.content, msg.nonce);
          setDecryptedContent(plain);
          setDecryptError(null);
          setDraft(plain);
        }
        // decrypt attachments if present
        if (msg.attachments && msg.attachments.length > 0) {
          const blobs: Record<string, string> = {};
          for (const att of msg.attachments) {
            if (!att.nonce) continue;
            try {
              const response = await fetch(att.url);
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              const arrayBuffer = await response.arrayBuffer();
              const cipherBytes = new Uint8Array(arrayBuffer);
              const plainBytes = await decryptBytes(sharedKey, cipherBytes, att.nonce);
              const blob = new Blob([plainBytes], { type: att.contentType });
              blobs[att.key] = URL.createObjectURL(blob);
            } catch (e) {
              console.error('Failed to decrypt attachment', att.key, e);
            }
          }
          setAttachmentBlobs(blobs);
        }
      } catch (err) {
        console.error('Decryption error:', err);
        setDecryptError('⚠️ Could not decrypt message');
      }
    }
    doDecrypt();
  }, [msg.content, msg.nonce, isOwn, recipientId, msg.sender.id, currentUserId, msg.attachments]);

  // compute message creation timestamp
  const createdTime = new Date(msg.createdAt).getTime();
  // edit state
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(msg.content);
  // allow edit within 10 minutes, managed via state
  const editWindow = 10 * 60 * 1000;
  const initialCanEdit = isOwn && Date.now() - createdTime < editWindow;
  const [canEdit, setCanEdit] = useState(initialCanEdit);
  useEffect(() => {
    if (!initialCanEdit) return;
    const elapsed = Date.now() - createdTime;
    const remaining = editWindow - elapsed;
    if (remaining > 0) {
      const timer = setTimeout(() => setCanEdit(false), remaining);
      return () => clearTimeout(timer);
    }
    // already expired
    setCanEdit(false);
  }, [initialCanEdit, createdTime, editWindow]);
  // allow delete within 30 seconds, managed via state
  const deleteWindow = 30 * 1000;
  const initialCanDelete = isOwn && Date.now() - createdTime < deleteWindow;
  const [canDelete, setCanDelete] = useState(initialCanDelete);
  useEffect(() => {
    if (!initialCanDelete) return;
    const elapsed = Date.now() - createdTime;
    const remaining = deleteWindow - elapsed;
    if (remaining > 0) {
      const timer = setTimeout(() => setCanDelete(false), remaining);
      return () => clearTimeout(timer);
    }
    // already expired
    setCanDelete(false);
  }, [initialCanDelete, createdTime, deleteWindow]);
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
      await initSodium();
      const storageKey = `privateKey:${currentUserId}`;
      const privateKey = localStorage.getItem(storageKey);
      if (!privateKey) throw new Error('Missing private E2EE key');
      const otherId = isOwn ? recipientId : msg.sender.id;
      const res = await fetch(`/api/users/${otherId}/publicKey`);
      if (!res.ok) throw new Error('Failed to fetch public key for edit');
      const { publicKey } = (await res.json()) as { publicKey?: string };
      if (!publicKey) throw new Error('No public key for user ' + otherId);
      const sharedKey = await deriveSharedKey(privateKey, publicKey);
      const { cipherText, nonce: newNonce } = await encrypt(sharedKey, draft);
      const socket = await initSocket();
      socket.emit('editMessage', { messageId: msg.id, newContent: cipherText, nonce: newNonce });
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
      {decryptError ? (
        <div className="decrypt-error">{decryptError}</div>
      ) : (
        <>
          {isEditing ? (
            <textarea
              className="w-full p-2 border rounded"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          ) : (
            <p className="whitespace-pre-wrap">{decryptedContent}</p>
          )}
          {msg.attachments && msg.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {msg.attachments!.map((att) => (
                <div key={att.key}>
                  {att.contentType.startsWith('image/') ? (
                    <div className="relative w-full h-auto">
                      <Image
                        src={attachmentBlobs[att.key] || att.url}
                        alt={att.filename}
                        width={500}
                        height={500}
                        unoptimized
                        className="rounded"
                      />
                    </div>
                  ) : (
                    <a
                      href={attachmentBlobs[att.key] || att.url}
                      download={att.filename}
                      className="text-blue-200 hover:underline"
                    >
                      📎 {att.filename}
                    </a>
                  )}
                </div>
              ))}
            </div>
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
                <button
                  onClick={handleCancelEdit}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Cancel
                </button>
              </>
            )}
            {!isPending && canDelete && (
              <button onClick={handleDelete} className="ml-2 text-xs text-red-500 hover:underline">
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MessageBubble;
