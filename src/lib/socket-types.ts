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
  join: (chatId: string, user: ChatUser) => void;
  leave: (chatId: string, user: ChatUser) => void;
  typing: (chatId: string, user: ChatUser) => void;
  message: (payload: ChatMessage & { chatId: string }) => void;
}

export interface ServerToClientEvents {
  userJoined: (user: ChatUser) => void;
  userLeft: (user: ChatUser) => void;
  presence: (users: ChatUser[]) => void;
  typing: (user: ChatUser) => void;
  message: (payload: ChatMessage | MessageEnvelope) => void;
}
