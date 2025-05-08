import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export async function initSocket() {
  if (socket) return socket;
  await fetch("/api/socketio");
  socket = io();
  return socket;
}

// Subscribe to the "message" event for new chat messages.
// Returns an unsubscribe function.
export function subscribeToNewMessages(
  cb: (msg: any) => void
): () => void {
  if (!socket) throw new Error("Socket not initialized");
  const s = socket;  // now TS knows `s` is non-null
  s.on("message", cb);
  return () => {
    s.off("message", cb);
  };
}
