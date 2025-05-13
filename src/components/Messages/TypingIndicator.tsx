import React, { useEffect, useRef } from 'react';

interface TypingIndicatorProps {
  typingUsers: Set<string>;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  const users = Array.from(typingUsers);
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (typingUsers.size > 0) {
      ref.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [typingUsers]);
  if (users.length === 0) return null;

  return (
    <p ref={ref} className="text-sm italic text-gray-500">
      {users.join(', ')} {users.length > 1 ? 'are' : 'is'} typing…
    </p>
  );
};

export default TypingIndicator;
