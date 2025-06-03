'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';
import { initSodium, generateKeyPair } from '@/lib/crypto';

function E2EEInitializer() {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const userId = session.user.id;
      const stored = localStorage.getItem('privateKey');
      if (!stored) {
        initSodium().then(async () => {
          const { publicKey, privateKey } = await generateKeyPair();
          localStorage.setItem('privateKey', privateKey);
          fetch(`/api/users/${userId}/publicKey`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicKey }),
          });
        });
      }
    }
  }, [status]);

  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <E2EEInitializer />
      {children}
    </SessionProvider>
  );
}
