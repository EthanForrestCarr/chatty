'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { backupDecrypt, derivePublicKey } from '@/lib/crypto';

export default function KeyRestore() {
  const { data: session } = useSession();
  const userId = session?.user.id;
  const [blob, setBlob] = useState<{ salt: string; nonce: string; encryptedKey: string } | null>(
    null
  );
  const [pass, setPass] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const storageKey = `privateKey:${userId}`;
    // warn if a local key already exists; we will still fetch backup
    const existing = localStorage.getItem(storageKey);
    if (existing) {
      setStatus('Overwriting existing local key');
    }
    fetch(`/api/users/${userId}/backup`)
      .then((res) => res.json())
      .then((data) => {
        if (data.encryptedBackup) {
          try {
            const parsed = JSON.parse(data.encryptedBackup);
            setBlob(parsed);
          } catch {
            setStatus('Invalid backup data');
          }
        } else {
          setStatus('No backup found');
        }
      })
      .catch(() => setStatus('Failed to fetch backup'));
  }, [userId]);

  const handleRestore = async () => {
    if (!blob) return;
    if (!pass) {
      setStatus('Enter passphrase');
      return;
    }
    setLoading(true);
    try {
      const privKey = await backupDecrypt(blob.salt, blob.nonce, blob.encryptedKey, pass);
      const storageKey = `privateKey:${userId}`;
      localStorage.setItem(storageKey, privKey);
      // derive and re-publish public key so peers can decrypt
      try {
        const publicKey = await derivePublicKey(privKey);
        await fetch(`/api/users/${userId}/publicKey`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicKey }),
        });
      } catch (pubErr) {
        console.error('Failed to re-publish public key:', pubErr);
      }
      setStatus('Restore successful');
      // reload to re-trigger decryption of messages
      window.location.reload();
    } catch (e) {
      console.error(e);
      setStatus('Incorrect passphrase or corrupt backup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Restore E2EE Keys</h1>
      {status && <p className="mb-2">{status}</p>}
      {blob && (
        <>
          <label className="block mb-2">
            Passphrase:
            <input
              type="password"
              className="w-full border p-2 mt-1"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </label>
          <button
            disabled={loading}
            onClick={handleRestore}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {loading ? 'Restoring...' : 'Restore Keys'}
          </button>
        </>
      )}
    </div>
  );
}
