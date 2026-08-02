import type { ReaderSettings } from '../types';
import { readStorage, writeStorage } from './storage';

const KEY = 'ebooks-library.settings.v1';

export const defaultSettings: ReaderSettings = {
  theme: 'system',
  readingTheme: 'paper',
  fontSize: 18,
  lineHeight: 1.8,
  contentWidth: 760,
  fontFamily: 'serif',
};

export function getSettings(): ReaderSettings {
  return { ...defaultSettings, ...readStorage<Partial<ReaderSettings>>(KEY, {}) };
}

export function saveSettings(settings: ReaderSettings): void {
  writeStorage(KEY, settings);
}

export const settingsStorageKey = KEY;
