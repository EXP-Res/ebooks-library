import type { Book, ReadingProgress } from '../types';
import { readStorage, removeStorage, writeStorage } from './storage';

const KEY = 'ebooks-library.progress.v1';

export function getAllProgress(): Record<string, ReadingProgress> {
  return readStorage<Record<string, ReadingProgress>>(KEY, {});
}

export function getProgress(bookId: string): ReadingProgress | undefined {
  return getAllProgress()[bookId];
}

export function saveProgress(book: Book, patch: Partial<ReadingProgress>): void {
  const all = getAllProgress();
  const progress = Math.max(0, Math.min(100, Number(patch.progress ?? all[book.id]?.progress ?? 0)));
  all[book.id] = {
    ...all[book.id],
    ...patch,
    bookId: book.id,
    format: book.format,
    progress: Number(progress.toFixed(1)),
    lastReadAt: new Date().toISOString(),
  };
  writeStorage(KEY, all);
}

export function clearProgress(bookId?: string): void {
  if (!bookId) return removeStorage(KEY);
  const all = getAllProgress();
  delete all[bookId];
  writeStorage(KEY, all);
}

export const progressStorageKey = KEY;
