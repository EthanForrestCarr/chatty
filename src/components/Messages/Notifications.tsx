import React from 'react';

interface NotificationsProps {
  notifications: string[];
}

const Notifications: React.FC<NotificationsProps> = ({ notifications }) => {
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
