export function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('shelf-storage', { detail: key }));
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent('shelf-storage', { detail: key }));
  } catch {}
}
