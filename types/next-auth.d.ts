import type { DefaultSession } from 'next-auth';

// Module augmentation for next-auth
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: DefaultSession['user'] & { id: string };
  }
}
