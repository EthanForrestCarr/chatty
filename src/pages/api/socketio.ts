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

  if (!resSocket.server.io) {
    const io = new IOServer(resSocket.server, {
      // configure CORS, pingInterval, etc. here if needed
    });
    resSocket.server.io = io;

    io.on("connection", (socket) => {
      console.log("🔌 socket connected:", socket.id);

      // user joins a chat room
      socket.on("join", (chatId: string, user: { id: string; username: string }) => {
        socket.join(chatId);
        socket.to(chatId).emit("userJoined", user);
      });

      // user leaves a chat room
      socket.on("leave", (chatId: string, user: { id: string; username: string }) => {
        socket.leave(chatId);
        socket.to(chatId).emit("userLeft", user);
      });

      // new message arrives
      socket.on("message", async (msg) => {
        const { chatId, content, sender } = msg;

        // persist to DB
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

        // broadcast the saved message
        io.to(chatId).emit("message", saved);
      });

      socket.on("disconnect", () => {
        console.log("🔌 socket disconnected:", socket.id);
      });
    });
  }

  res.end();
}

