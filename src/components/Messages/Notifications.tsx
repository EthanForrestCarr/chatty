import React, { useState, useEffect } from 'react';
import { initSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';
import type { ChatUser, ServerToClientEvents, ClientToServerEvents } from '@/lib/socket-types';

interface NotificationsProps {
  chatId: string;
  currentUserId: string;
  currentUsername: string;
}

const Notifications: React.FC<NotificationsProps> = ({
  chatId,
  currentUserId,
  currentUsername,
}) => {
  const [notifications, setNotifications] = useState<string[]>([]);
  const seenRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    let socketInstance: Socket<ServerToClientEvents, ClientToServerEvents>;
    let isActive = true;
    // reset seen notifications when chatId changes
    seenRef.current.clear();

    const addNote = (note: string) => {
      if (seenRef.current.has(note)) return;
      seenRef.current.add(note);
      setNotifications((prev) => [...prev, note]);
    };
    const handleJoin = (user: ChatUser) => addNote(`${user.username} joined`);
    const handleLeave = (user: ChatUser) => addNote(`${user.username} left`);
    // subscribe
    initSocket().then((socket) => {
      if (!isActive) return;
      // join the room for presence
      socket.emit('join', chatId, { id: currentUserId, username: currentUsername });
      socket.off('userJoined', handleJoin);
      socket.off('userLeft', handleLeave);
      socket.on('userJoined', handleJoin);
      socket.on('userLeft', handleLeave);
      socketInstance = socket;
    });
    // cleanup
    return () => {
      isActive = false;
      if (socketInstance) {
        // leave the room
        socketInstance.emit('leave', chatId, { id: currentUserId, username: currentUsername });
        socketInstance.off('userJoined', handleJoin);
        socketInstance.off('userLeft', handleLeave);
      }
    };
  }, [chatId, currentUserId, currentUsername]);

  return (
    <>
      {notifications.map((note, i) => (
        <p key={i} className="text-center text-gray-500 italic text-sm">
          {note}
        </p>
      ))}
    </>
  );
};

export default Notifications;
