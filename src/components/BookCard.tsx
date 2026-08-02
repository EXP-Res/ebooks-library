import { Link } from 'react-router-dom';
import type { Book, ReadingProgress } from '../types';
import { formatBytes, formatLabels } from '../utils/format';
import { BookCover } from './BookCover';

export const readerHref = (book: Book) => `/reader/${book.id.split('/').map(encodeURIComponent).join('/')}`;

export function BookCard({ book, progress }: { book: Book; progress?: ReadingProgress }) {
  return <article className="book-card">
    <Link to={readerHref(book)} aria-label={`阅读《${book.title}》`}><BookCover book={book} /></Link>
    <div className="book-card-body">
      <div className="book-meta"><span>{formatLabels[book.format]}</span><span>{formatBytes(book.size)}</span></div>
      <Link className="book-title" to={readerHref(book)}>{book.title}</Link>
      <p title={book.categoryPath}>{book.categoryPath || '未分类'}</p>
      {progress && <div className="progress-wrap" title={`已读 ${progress.progress}%`}><span style={{ width: `${progress.progress}%` }} /></div>}
    </div>
  </article>;
}
