'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="p-4 text-center">
      <h1 className="text-red-600 text-2xl font-bold">Oops, something went wrong.</h1>
      <p className="mt-2">{error.message}</p>
      <button onClick={reset} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
        Try again
      </button>
    </main>
  );
}
