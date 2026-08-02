import type { Book, ReadingProgress } from '../types';
import { formatRelativeTime } from '../utils/format';
import { BookCover } from './BookCover';
import { readerHref } from './BookCard';
import { Link } from 'react-router-dom';

export function RecentShelf({ items }: { items: { book: Book; progress: ReadingProgress }[] }) {
  if (!items.length) return null;
  return <section className="recent-section" aria-labelledby="recent-title">
    <div className="section-heading"><div><p className="eyebrow">PICK UP WHERE YOU LEFT</p><h2 id="recent-title">继续翻页</h2></div><span>{items.length} 本最近阅读</span></div>
    <div className="recent-track">
      {items.map(({ book, progress }) => <Link className="recent-card" to={readerHref(book)} key={book.id}>
        <BookCover book={book} compact />
        <span><b>{book.title}</b><small>{formatRelativeTime(progress.lastReadAt)}</small><span className="recent-progress"><i style={{ width: `${progress.progress}%` }} /></span><em>继续阅读 · {Math.round(progress.progress)}%</em></span>
      </Link>)}
    </div>
  </section>;
}
