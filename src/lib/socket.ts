import { io, Socket } from 'socket.io-client';
import type {
  ChatMessage,
  MessageEnvelope,
  ClientToServerEvents,
  ServerToClientEvents,
} from './socket-types';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export async function initSocket() {
  if (!socket) {
    await fetch('/api/socketio');
    const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? window.location.origin;
    // drop the generic on `io<>` and cast instead:
    socket = io(url, { transports: ['websocket'] }) as Socket<
      ServerToClientEvents,
      ClientToServerEvents
    >;
  }
  return socket;
}

export function subscribeToNewMessages(
  cb: (payload: ChatMessage | MessageEnvelope) => void
): () => void {
  if (!socket) throw new Error('Socket not initialized');
  const s = socket; // now `s` is definitely non-null
  const handler = (msg: ChatMessage | MessageEnvelope) => cb(msg);
  s.on('message', handler);
  return () => {
    s.off('message', handler);
  };
}
