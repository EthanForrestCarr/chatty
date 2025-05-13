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

export interface User {
  id: string;
  username: string;
}
