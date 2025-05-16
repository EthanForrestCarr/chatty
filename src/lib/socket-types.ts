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
  deleteMessage: (messageId: string) => void;
  join: (chatId: string, user: ChatUser) => void;
  leave: (chatId: string, user: ChatUser) => void;
  typing: (chatId: string, user: ChatUser) => void;
  message: (payload: ChatMessage & { chatId: string }) => void;
  reaction: (payload: { messageId: string; emoji: string; user: ChatUser }) => void;
}

export interface ServerToClientEvents {
  deleteMessage: (messageId: string) => void;
  userJoined: (user: ChatUser) => void;
  userLeft: (user: ChatUser) => void;
  presence: (users: ChatUser[]) => void;
  typing: (user: ChatUser) => void;
  message: (payload: ChatMessage | MessageEnvelope) => void;
  reaction: (payload: Reaction) => void;
}

export interface Reaction {
  id: string;
  emoji: string;
  user: ChatUser;
  messageId: string;
}
