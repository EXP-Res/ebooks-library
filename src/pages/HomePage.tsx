import Fuse from 'fuse.js';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BookCard } from '../components/BookCard';
import { CategoryNav } from '../components/CategoryNav';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { ErrorState, LoadingState } from '../components/LoadingState';
import { RecentShelf } from '../components/RecentShelf';
import { useCatalog } from '../hooks/useCatalog';
import { useStorageRevision } from '../hooks/useStorageRevision';
import { getAllProgress, progressStorageKey } from '../services/progress';
import type { BookFormat } from '../types';
import { formatLabels } from '../utils/format';

const formats: BookFormat[] = ['pdf', 'epub', 'txt', 'markdown'];

export function HomePage() {
  const { books, loading, error } = useCatalog();
  const params = useParams();
  const activePath = (params['*'] || '').split('/').filter(Boolean).map(decodeURIComponent);
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<BookFormat | 'all'>('all');
  const [recentOnly, setRecentOnly] = useState(false);
  const [drawer, setDrawer] = useState(false);
  useStorageRevision(progressStorageKey);
  const progress = getAllProgress();

  const fuse = useMemo(() => new Fuse(books, { threshold: 0.32, ignoreLocation: true, keys: ['title', 'fileName', 'categoryPath', 'format', 'tags'] }), [books]);
  const filtered = useMemo(() => {
    const base = query.trim() ? fuse.search(query.trim()).map((result) => result.item) : books;
    return base.filter((book) =>
      (!activePath.length || activePath.every((part, index) => book.category[index] === part)) &&
      (format === 'all' || book.format === format) &&
      (!recentOnly || Boolean(progress[book.id])),
    );
  }, [activePath, books, format, fuse, progress, query, recentOnly]);

  const recent = useMemo(() => Object.values(progress)
    .map((item) => ({ progress: item, book: books.find((book) => book.id === item.bookId) }))
    .filter((item): item is { progress: typeof item.progress; book: NonNullable<typeof item.book> } => Boolean(item.book))
    .sort((a, b) => b.progress.lastReadAt.localeCompare(a.progress.lastReadAt)).slice(0, 8), [books, progress]);

  return <div className="app-shell">
    <Header onMenu={() => setDrawer(true)} />
    <CategoryNav books={books} activePath={activePath} open={drawer} onClose={() => setDrawer(false)} />
    <main className="home-main">
      <section className="library-intro">
        <p className="eyebrow">YOUR QUIET CORNER</p>
        <div><h1>{activePath.at(-1) || '今晚，读哪一本？'}</h1><p>{activePath.length ? ['首页', ...activePath].join(' / ') : `${books.length || '—'} 本藏书，按你的节奏慢慢读。`}</p></div>
      </section>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={() => location.reload()} /> : <>
        {!activePath.length && <RecentShelf items={recent} />}
        <section className="catalog-section" aria-labelledby="catalog-title">
          <div className="catalog-toolbar">
            <div className="search-box"><Icon name="search" /><input aria-label="搜索书架" placeholder="搜索书名、分类或格式…" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button onClick={() => setQuery('')} aria-label="清除搜索">×</button>}</div>
            <div className="filters" aria-label="格式筛选">
              <button className={format === 'all' ? 'active' : ''} onClick={() => setFormat('all')}>全部</button>
              {formats.map((item) => <button className={format === item ? 'active' : ''} key={item} onClick={() => setFormat(item)}>{formatLabels[item]}</button>)}
              <button className={recentOnly ? 'active' : ''} onClick={() => setRecentOnly((value) => !value)}>最近阅读</button>
            </div>
          </div>
          <div className="section-heading compact"><h2 id="catalog-title">{query ? `“${query}” 的结果` : '馆藏书架'}</h2><span>{filtered.length} 本</span></div>
          {filtered.length ? <div className="book-grid">{filtered.map((book) => <BookCard key={book.id} book={book} progress={progress[book.id]} />)}</div> : <div className="empty-state"><span>∅</span><h3>没有找到合适的书</h3><p>换个关键词，或清除当前筛选条件。</p><button className="button" onClick={() => { setQuery(''); setFormat('all'); setRecentOnly(false); }}>清除筛选</button></div>}
        </section>
      </>}
    </main>
  </div>;
}
