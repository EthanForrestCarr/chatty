import { AttachmentMeta } from '@/lib/socket-types';

// Type definitions for the Messages components
export interface Reaction {
  id: string;
  emoji: string;
  user: User;
  messageId: string;
}

export interface Message {
  id: string;
  content: string;
  nonce?: string; // optional E2EE nonce for decryption
  editedAt?: string;
  createdAt: string;
  sender: { id: string; username: string };
  reactions?: Reaction[];
  attachments?: AttachmentMeta[];
}

export interface MessageEnvelope {
  message: Message;
}

// Notification items displayed inline with messages
export interface Notification {
  id: string;
  text: string;
  createdAt: string;
}

// Chat items can be either messages or notifications
export type ChatItem = Message | Notification;

export interface User {
  id: string;
  username: string;
}
