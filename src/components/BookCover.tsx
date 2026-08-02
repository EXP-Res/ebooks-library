import { useState } from 'react';
import type { Book } from '../types';
import { assetUrl } from '../utils/assetUrl';
import { formatLabels } from '../utils/format';

export function BookCover({ book, compact = false }: { book: Book; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (book.cover && !failed) return <div className={`book-cover has-image ${compact ? 'compact' : ''}`}><img src={assetUrl(book.cover)} alt="" loading="lazy" onError={() => setFailed(true)} /></div>;
  return <div className={`book-cover format-${book.format} ${compact ? 'compact' : ''}`} aria-hidden="true">
    <span className="cover-rule" />
    <strong>{book.title}</strong>
    <small>{formatLabels[book.format]}</small>
  </div>;
}
