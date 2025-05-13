import React from 'react';
import { User } from './types';

interface OnlinePresenceBarProps {
  online: User[];
  currentUserId: string;
}

const OnlinePresenceBar: React.FC<OnlinePresenceBarProps> = ({ online, currentUserId }) => {
  if (online.length === 0) return null;

  return (
    <p className="text-xs text-green-600 mb-1">
      Online now: {online.map((u) => (u.id === currentUserId ? 'You' : u.username)).join(', ')}
    </p>
  );
};

export default OnlinePresenceBar;
