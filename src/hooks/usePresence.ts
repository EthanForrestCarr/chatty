// A hook to manage online presence for a chat
'use client';

import { useEffect, useState } from 'react';
import { initSocket } from '@/lib/socket';
import type { User } from '@/components/Messages/types';
import type { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, ChatUser } from '@/lib/socket-types';

export default function usePresence(
  chatId: string,
  currentUserId: string,
  currentUsername: string
) {
  const [online, setOnline] = useState<User[]>([]);

  useEffect(() => {
    let socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

    (async () => {
      socketInstance = await initSocket();
      socketInstance.emit('join', chatId, {
        id: currentUserId,
        username: currentUsername,
      });
      socketInstance.on('presence', (users: ChatUser[]) => {
        setOnline(users.map((u) => ({ id: u.id, username: u.username })));
      });
    })();

    return () => {
      if (socketInstance) {
        socketInstance.emit('leave', chatId, {
          id: currentUserId,
          username: currentUsername,
        });
        socketInstance.off('presence');
      }
    };
  }, [chatId, currentUserId, currentUsername]);

  return online;
}
