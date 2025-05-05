import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export async function initSocket() {
  if (socket) return socket;

  // hit the API once to ensure the server handler runs
  await fetch("/api/socketio");

  socket = io(); // connects to same origin
  return socket;
}
