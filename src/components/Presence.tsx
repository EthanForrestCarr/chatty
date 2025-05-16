'use client';

import React from 'react';
import usePresence from '@/hooks/usePresence';
import OnlinePresenceBar from '@/components/Messages/OnlinePresenceBar';
import type { User } from '@/components/Messages/types';

interface PresenceProps {
  chatId: string;
  currentUserId: string;
  currentUsername: string;
}

const Presence: React.FC<PresenceProps> = ({ chatId, currentUserId, currentUsername }) => {
  const online: User[] = usePresence(chatId, currentUserId, currentUsername);
  return <OnlinePresenceBar online={online} currentUserId={currentUserId} />;
};

export default Presence;
