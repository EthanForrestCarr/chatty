// File attachment metadata
export interface AttachmentMeta {
  key: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
}

// a chat user in presence and messages
export interface ChatUser {
  id: string;
  username: string;
}

// Chat message structure, now including attachments and chatId
export interface ChatMessage {
  id: string;
  content: string;
  nonce?: string; // optional nonce for encrypted messages
  createdAt: string;
  sender: ChatUser;
  chatId?: string;
  attachments?: AttachmentMeta[];
}

export type MessageEnvelope = { message: ChatMessage };

export interface ClientToServerEvents {
  undoDeleteMessage: (messageId: string) => void;
  deleteMessage: (messageId: string) => void;
  join: (chatId: string, user: ChatUser) => void;
  leave: (chatId: string, user: ChatUser) => void;
  typing: (chatId: string, user: ChatUser) => void;
  // message payload now supports attachments and chatId
  message: (payload: ChatMessage) => void;
  reaction: (payload: { messageId: string; emoji: string; user: ChatUser }) => void;
  editMessage: (payload: { messageId: string; newContent: string; nonce?: string }) => void;
}

export interface ServerToClientEvents {
  messagePendingDeletion: (messageId: string) => void;
  messageUndoDelete: (messageId: string) => void;
  messageRemoved: (messageId: string) => void;
  deleteMessage: (messageId: string) => void;
  userJoined: (user: ChatUser) => void;
  userLeft: (user: ChatUser) => void;
  presence: (users: ChatUser[]) => void;
  typing: (user: ChatUser) => void;
  // message payload now supports attachments and chatId
  message: (payload: ChatMessage | MessageEnvelope) => void;
  reaction: (payload: Reaction) => void;
  messageEdited: (payload: {
    messageId: string;
    newContent: string;
    nonce?: string;
    editedAt: string;
  }) => void;
}

export interface Reaction {
  id: string;
  emoji: string;
  user: ChatUser;
  messageId: string;
}
