'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';
import { initSodium, generateKeyPair } from '@/lib/crypto';

function E2EEInitializer() {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const userId = session.user.id;
      const storageKey = `privateKey:${userId}`;
      let stored = localStorage.getItem(storageKey);
      // migrate legacy global key
      if (!stored) {
        const legacy = localStorage.getItem('privateKey');
        if (legacy) {
          localStorage.setItem(storageKey, legacy);
          localStorage.removeItem('privateKey');
          stored = legacy;
        }
      }
      if (!stored) {
        initSodium().then(async () => {
          // check if user already has a publicKey on server to avoid overwriting
          try {
            const res = await fetch(`/api/users/${userId}/publicKey`);
            if (res.ok) {
              const data = await res.json();
              if (data.publicKey) {
                // existing key, no need to regenerate
                return;
              }
            }
          } catch (e) {
            console.error('Failed to fetch existing publicKey', e);
            // proceed to generate, since we cannot confirm
          }
          const { publicKey, privateKey } = await generateKeyPair();
          localStorage.setItem(storageKey, privateKey);
          fetch(`/api/users/${userId}/publicKey`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicKey }),
          });
        });
      }
    }
  }, [status, session?.user?.id]);

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
