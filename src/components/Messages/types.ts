// Type definitions for the Messages components
export interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; username: string };
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
