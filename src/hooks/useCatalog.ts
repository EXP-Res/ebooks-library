import { useEffect, useState } from 'react';
import { loadCatalog } from '../services/catalog';
import type { Book } from '../types';

export function useCatalog() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCatalog().then(setBooks).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : '目录加载失败')).finally(() => setLoading(false));
  }, []);

  return { books, loading, error };
}
