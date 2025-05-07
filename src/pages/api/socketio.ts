// src/pages/api/socketio.ts
import { NextApiRequest, NextApiResponse } from "next";
import { Server as IOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { Socket } from "net";
import { prisma } from "@/lib/db";

type NextSocketServer = Socket & {
  server: HTTPServer & { io?: IOServer };
};

export default function SocketHandler(req: NextApiRequest, res: NextApiResponse) {
  const resSocket = res.socket as NextSocketServer;

  if (!resSocket.server.io) {
    const io = new IOServer(resSocket.server);
    resSocket.server.io = io;

    // track who’s in each chatId
    const presenceMap = new Map<string, Map<string, string>>();

    io.on("connection", (socket) => {
      console.log("🔌 socket connected:", socket.id);

      socket.on(
        "join",
        (chatId: string, user: { id: string; username: string }) => {
          // join room
          socket.join(chatId);
          // store user info on this socket
          socket.data.user = user;

          // update presence map
          let room = presenceMap.get(chatId);
          if (!room) {
            room = new Map();
            presenceMap.set(chatId, room);
          }
          room.set(user.id, user.username);

          // broadcast updated presence
          io.to(chatId).emit(
            "presence",
            Array.from(room.entries()).map(([id, username]) => ({ id, username }))
          );

          // optional join notification
          socket.to(chatId).emit("userJoined", user);
        }
      );

      socket.on(
        "leave",
        (chatId: string, user: { id: string; username: string }) => {
          socket.leave(chatId);
          const room = presenceMap.get(chatId);
          if (room) {
            room.delete(user.id);
            io.to(chatId).emit(
              "presence",
              Array.from(room.entries()).map(([id, username]) => ({ id, username }))
            );
          }
          socket.to(chatId).emit("userLeft", user);
        }
      );

      socket.on("disconnecting", () => {
        // cleanup from _all_ rooms this socket is in
        const user = socket.data.user as { id: string; username: string } | undefined;
        if (user) {
          socket.rooms.forEach((chatId) => {
            const room = presenceMap.get(chatId as string);
            if (room) {
              room.delete(user.id);
              io.to(chatId as string).emit(
                "presence",
                Array.from(room.entries()).map(([id, username]) => ({ id, username }))
              );
              io.to(chatId as string).emit("userLeft", user);
            }
          });
        }
      });

      socket.on("message", async (msg) => {
        const { chatId, content, sender } = msg;
        const saved = await prisma.message.create({
          data: { content, chatId, senderId: sender.id },
          include: { sender: { select: { id: true, username: true } } },
        });
        io.to(chatId).emit("message", saved);
      });

      socket.on("disconnect", () => {
        console.log("🔌 socket disconnected:", socket.id);
      });
    });
  }

  res.end();
}
