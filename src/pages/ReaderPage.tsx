import { lazy, Suspense, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { ErrorState, LoadingState } from '../components/LoadingState';
import { ReaderErrorBoundary } from '../components/ReaderErrorBoundary';
import { useCatalog } from '../hooks/useCatalog';
import { clearProgress } from '../services/progress';
import { originalFileUrl } from '../utils/assetUrl';
import { formatLabels } from '../utils/format';

const PdfReader = lazy(() => import('../readers/PdfReader').then((module) => ({ default: module.PdfReader })));
const EpubReader = lazy(() => import('../readers/EpubReader').then((module) => ({ default: module.EpubReader })));
const TextReader = lazy(() => import('../readers/TextReader').then((module) => ({ default: module.TextReader })));
const MarkdownReader = lazy(() => import('../readers/MarkdownReader').then((module) => ({ default: module.MarkdownReader })));

export function ReaderPage() {
  const params = useParams();
  const { books, loading, error } = useCatalog();
  const [menuOpen, setMenuOpen] = useState(false);
  const id = (params['*'] || '').split('/').map(decodeURIComponent).join('/');
  const book = useMemo(() => books.find((item) => item.id === id), [books, id]);

  if (loading) return <LoadingState label="正在找到这本书…" />;
  if (error) return <ErrorState message={error} onRetry={() => location.reload()} />;
  if (!book) return <main className="reader-failure"><ErrorState message="目录中没有找到这本书，它可能已被移动或删除。" /><Link className="button" to="/">返回书架</Link></main>;

  const fallback = (message: string) => <div className="reader-failure"><ErrorState message={message} onRetry={() => location.reload()} /><div><Link className="button" to="/">返回书架</Link><a className="button" href={originalFileUrl(book.path)} target="_blank" rel="noreferrer">查看原始文件</a><a className="button" href={originalFileUrl(book.path)} download>下载原文件</a></div></div>;

  return <div className="reader-page">
    <header className="reader-header">
      <Link className="icon-button" to="/" aria-label="返回书架"><Icon name="back" /></Link>
      <div><b>{book.title}</b><span>{book.categoryPath || '未分类'} · {formatLabels[book.format]}</span></div>
      <button className="icon-button" onClick={() => setMenuOpen((value) => !value)} aria-label="更多操作"><Icon name="more" /></button>
      {menuOpen && <div className="reader-menu">
        <a href={originalFileUrl(book.path)} target="_blank" rel="noreferrer">查看原始文件</a>
        <a href={originalFileUrl(book.path)} download><Icon name="download" />下载原文件</a>
        <button onClick={() => { if (confirm('清除这本书的阅读记录？')) { clearProgress(book.id); setMenuOpen(false); } }}><Icon name="trash" />清除阅读记录</button>
      </div>}
    </header>
    <ReaderErrorBoundary key={book.id} fallback={fallback}>
      <Suspense fallback={<LoadingState label="正在准备阅读器…" />}>
        {book.format === 'pdf' && <PdfReader book={book} />}
        {book.format === 'epub' && <EpubReader book={book} />}
        {book.format === 'txt' && <TextReader book={book} />}
        {book.format === 'markdown' && <MarkdownReader book={book} />}
      </Suspense>
    </ReaderErrorBoundary>
  </div>;
}
