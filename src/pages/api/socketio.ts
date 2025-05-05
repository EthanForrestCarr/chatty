import { NextApiRequest, NextApiResponse } from "next";
import { Server as IOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { Socket } from "net";
import { prisma } from "@/lib/db";

type NextSocketServer = Socket & {
  server: HTTPServer & {
    io?: IOServer;
  };
};

export default function SocketHandler(req: NextApiRequest, res: NextApiResponse) {
  const resSocket = res.socket as NextSocketServer;

  if (!resSocket?.server?.io) {
    const io = new IOServer(resSocket.server);

    resSocket.server.io = io;

    io.on("connection", (socket) => {
      console.log("socket connected:", socket.id);

      socket.on("join", (chatId: string) => {
        socket.join(chatId);
      });

      socket.on("leave", (chatId: string) => {
        socket.leave(chatId);
      });

      socket.on("message", async (msg) => {
        const { chatId, content, sender } = msg;

        // Persist to DB
        const saved = await prisma.message.create({
          data: {
            content,
            chatId,
            senderId: sender.id,
          },
          include: {
            sender: { select: { id: true, username: true } },
          },
        });

        // Broadcast to room with actual DB-backed message
        io.to(chatId).emit("message", saved);
      });

      socket.on("disconnect", () => {
        console.log("socket disconnected:", socket.id);
      });
    });
  }

  res.end();
}
