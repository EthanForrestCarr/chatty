'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { backupEncrypt } from '@/lib/crypto';

export default function KeyBackup() {
  const { data: session } = useSession();
  const userId = session?.user.id;
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
    if (!userId) return;
    if (!pass1 || pass1 !== pass2) {
      setStatus('Passphrases must match');
      return;
    }
    // require a minimum passphrase length for better security
    if (pass1.length < 8) {
      setStatus('Passphrase must be at least 8 characters long');
      return;
    }
    const storageKey = `privateKey:${userId}`;
    const privKey = localStorage.getItem(storageKey);
    if (!privKey) {
      setStatus('No private key found for this user');
      return;
    }
    setLoading(true);
    try {
      const { salt, nonce, encryptedKey } = await backupEncrypt(privKey, pass1);
      const res = await fetch(`/api/users/${userId}/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salt, nonce, encryptedKey }),
      });
      if (res.ok) {
        setStatus('Backup successful');
      } else {
        const text = await res.text();
        setStatus(`Backup failed (${res.status}): ${text}`);
      }
    } catch (e) {
      console.error('KeyBackup handleBackup error:', e);
      setStatus(e instanceof Error ? e.message : 'Encryption or network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Backup E2EE Keys</h1>
      <label className="block mb-2">
        Passphrase:
        <input
          type="password"
          className="w-full border p-2 mt-1"
          value={pass1}
          onChange={(e) => setPass1(e.target.value)}
        />
      </label>
      <label className="block mb-4">
        Confirm Passphrase:
        <input
          type="password"
          className="w-full border p-2 mt-1"
          value={pass2}
          onChange={(e) => setPass2(e.target.value)}
        />
      </label>
      <button
        disabled={loading}
        onClick={handleBackup}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Backing up...' : 'Backup Keys'}
      </button>
      {status && <p className="mt-4">{status}</p>}
    </div>
  );
}
