export type BookFormat = 'pdf' | 'epub' | 'txt' | 'markdown';

export interface Book {
  id: string;
  title: string;
  fileName: string;
  format: BookFormat;
  category: string[];
  categoryPath: string;
  path: string;
  cover?: string;
  size: number;
  updatedAt: string;
  author?: string;
  description?: string;
  tags: string[];
}

export interface ReadingProgress {
  bookId: string;
  format: BookFormat;
  progress: number;
  lastReadAt: string;
  page?: number;
  totalPages?: number;
  location?: string;
  chapter?: string;
  scrollTop?: number;
}

export type ThemeMode = 'system' | 'light' | 'dark';
export type ReadingTheme = 'paper' | 'night' | 'eye';

export interface ReaderSettings {
  theme: ThemeMode;
  readingTheme: ReadingTheme;
  fontSize: number;
  lineHeight: number;
  contentWidth: number;
  fontFamily: 'serif' | 'sans';
}
