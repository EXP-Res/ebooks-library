import { readStorage, removeStorage, writeStorage } from './storage';

const KEY = 'ebooks-library.auth.v1';

async function sha256(value: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function authEnabled(): boolean {
  return Boolean(__ACCESS_PASSWORD_HASH__);
}

export function isAuthenticated(): boolean {
  if (!authEnabled()) return true;
  const session = readStorage<{ expiresAt: number } | null>(KEY, null);
  return Boolean(session && session.expiresAt > Date.now());
}

export async function authenticate(password: string): Promise<boolean> {
  if (!password || await sha256(password) !== __ACCESS_PASSWORD_HASH__) return false;
  writeStorage(KEY, { expiresAt: Date.now() + __ACCESS_SESSION_HOURS__ * 60 * 60 * 1000 });
  return true;
}

export function signOut(): void {
  removeStorage(KEY);
}
