export interface ChatUser {
  id: string;
  username: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: ChatUser;
}

export type MessageEnvelope = { message: ChatMessage };

export interface ClientToServerEvents {
  undoDeleteMessage: (messageId: string) => void;
  deleteMessage: (messageId: string) => void;
  join: (chatId: string, user: ChatUser) => void;
  leave: (chatId: string, user: ChatUser) => void;
  typing: (chatId: string, user: ChatUser) => void;
  message: (payload: ChatMessage & { chatId: string }) => void;
  reaction: (payload: { messageId: string; emoji: string; user: ChatUser }) => void;
  editMessage: (payload: { messageId: string; newContent: string }) => void;
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
  message: (payload: ChatMessage | MessageEnvelope) => void;
  reaction: (payload: Reaction) => void;
  messageEdited: (payload: { messageId: string; newContent: string; editedAt: string }) => void;
}

export interface Reaction {
  id: string;
  emoji: string;
  user: ChatUser;
  messageId: string;
}
