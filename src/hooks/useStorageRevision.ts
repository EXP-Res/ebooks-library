import { useEffect, useState } from 'react';

export function useStorageRevision(key: string): number {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const update = (event: Event) => {
      if (event instanceof StorageEvent ? event.key === key : (event as CustomEvent).detail === key) setRevision((value) => value + 1);
    };
    window.addEventListener('storage', update);
    window.addEventListener('shelf-storage', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('shelf-storage', update);
    };
  }, [key]);
  return revision;
}
