// src/pages/api/socketio.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as IOServer, Socket as IOSocket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { prisma } from '@/lib/db';
import type { ChatUser, ClientToServerEvents, ServerToClientEvents } from '@/lib/socket-types';

type NextSocketServer = HTTPServer & { io?: IOServer };

/* reach into the raw Node socket to get the HTTPServer */
export default function SocketHandler(_req: NextApiRequest, res: NextApiResponse) {
  const server = (res.socket as unknown as { server: NextSocketServer }).server;

  if (!server.io) {
    const io = new IOServer<ClientToServerEvents, ServerToClientEvents>(server);
    server.io = io;

    const presenceMap = new Map<string, Map<string, string>>();
    // track pending deletions: messageId -> {timeout, chatId}
    const pendingDeletions = new Map<string, { timeout: NodeJS.Timeout; chatId: string }>();

    io.on('connection', (socket: IOSocket<ClientToServerEvents, ServerToClientEvents>) => {
      console.log('🔌 socket connected:', socket.id);

      socket.on('join', (chatId, user) => {
        console.log('🔵 socket', socket.id, 'user', user.username, 'joining room', chatId);
        socket.join(chatId);
        socket.data.user = user;

        let room = presenceMap.get(chatId);
        if (!room) {
          room = new Map();
          presenceMap.set(chatId, room);
        }
        room.set(user.id, user.username);

        io.to(chatId).emit(
          'presence',
          Array.from(room.entries()).map(([id, username]) => ({ id, username }))
        );

        socket.to(chatId).emit('userJoined', user);
      });

      socket.on('leave', (chatId, user) => {
        socket.leave(chatId);
        const room = presenceMap.get(chatId);
        if (room) {
          room.delete(user.id);
          io.to(chatId).emit(
            'presence',
            Array.from(room.entries()).map(([id, username]) => ({ id, username }))
          );
        }
        socket.to(chatId).emit('userLeft', user);
      });

      socket.on('typing', (chatId, user) => {
        socket.to(chatId).emit('typing', user);
      });

      socket.on('message', async (msg) => {
        const { chatId, content, sender } = msg;
        const saved = await prisma.message.create({
          data: { content, chatId, senderId: sender.id },
          include: { sender: { select: { id: true, username: true } } },
        });

        // convert Date → string so it matches your ChatMessage type
        const outgoing = {
          id: saved.id,
          content: saved.content,
          sender: saved.sender,
          createdAt: saved.createdAt.toISOString(),
          chatId,
        };

        io.to(chatId).emit('message', outgoing);
      });

      socket.on('reaction', async ({ messageId, emoji, user }) => {
        const saved = await prisma.messageReaction.create({
          data: { messageId, userId: user.id, emoji },
          select: {
            id: true,
            messageId: true,
            emoji: true,
            user: { select: { id: true, username: true } },
            message: { select: { chatId: true } },
          },
        });
        const { id, messageId: mId, emoji: e, user: u, message } = saved;
        // broadcast reaction to room
        io.to(message.chatId).emit('reaction', { id, messageId: mId, emoji: e, user: u });
      });

      // handle deleteMessage from client
      socket.on('deleteMessage', async (messageId: string) => {
        console.log('🔴 deleteMessage received for', messageId, 'from', socket.data.user);
        const user = socket.data.user;
        if (!user) return;
        // find message and verify ownership
        const msg = await prisma.message.findUnique({ where: { id: messageId } });
        if (msg) console.log('💬 delete target chatId', msg.chatId);
        if (!msg || msg.senderId !== user.id) return;
        const chatId = msg.chatId;

        // notify clients that deletion is pending
        io.to(chatId).emit('messagePendingDeletion', messageId);
        // schedule actual deletion after 30s
        const timeout = setTimeout(async () => {
          // perform DB delete
          await prisma.messageReaction.deleteMany({ where: { messageId } });
          await prisma.message.delete({ where: { id: messageId } });
          io.to(chatId).emit('messageRemoved', messageId);
          pendingDeletions.delete(messageId);
        }, 30_000);
        pendingDeletions.set(messageId, { timeout, chatId });
      });

      // handle undo delete within grace period
      socket.on('undoDeleteMessage', async (messageId: string) => {
        const pending = pendingDeletions.get(messageId);
        if (!pending) return;
        clearTimeout(pending.timeout);
        pendingDeletions.delete(messageId);
        io.to(pending.chatId).emit('messageUndoDelete', messageId);
      });

      socket.on('disconnecting', () => {
        const user = socket.data.user as ChatUser | undefined;
        if (user) {
          socket.rooms.forEach((chatId) => {
            const room = presenceMap.get(chatId as string);
            if (room) {
              room.delete(user.id);
              io.to(chatId as string).emit(
                'presence',
                Array.from(room.entries()).map(([id, username]) => ({ id, username }))
              );
              io.to(chatId as string).emit('userLeft', user);
            }
          });
        }
      });

      socket.on('disconnect', () => {
        console.log('🔌 socket disconnected:', socket.id);
      });
    });
  }

  res.end();
}
