import { useEffect, useRef, useState } from 'react';
import { ReaderSearch } from '../components/ReaderSearch';
import { useDocumentSearch } from '../hooks/useDocumentSearch';
import { getProgress, saveProgress } from '../services/progress';
import { getSettings } from '../services/settings';
import type { Book } from '../types';
import { originalFileUrl } from '../utils/assetUrl';
import { decodeText } from './text';

export function TextReader({ book }: { book: Book }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const search = useDocumentSearch(contentRef, query);
  const settings = getSettings();

  useEffect(() => {
    const controller = new AbortController();
    fetch(originalFileUrl(book.path), { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error(`文件请求失败（${response.status}）`); return response.arrayBuffer(); })
      .then((buffer) => setContent(decodeText(buffer)))
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : '文本加载失败'); });
    return () => controller.abort();
  }, [book.path]);

  useEffect(() => {
    if (!content || !scrollRef.current) return;
    const saved = getProgress(book.id);
    requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = saved?.scrollTop || 0; });
  }, [book.id, content]);

  const onScroll = () => {
    const element = scrollRef.current;
    if (!element) return;
    const range = element.scrollHeight - element.clientHeight;
    saveProgress(book, { scrollTop: element.scrollTop, progress: range > 0 ? element.scrollTop / range * 100 : 100 });
  };

  if (error) throw new Error(error);
  return <div className={`prose-reader theme-${settings.readingTheme}`}>
    <div className="reader-subbar"><ReaderSearch query={query} setQuery={setQuery} count={search.count} current={search.current} onPrevious={search.previous} onNext={search.next} /></div>
    <div className="prose-scroll" ref={scrollRef} onScroll={onScroll}>
      {!content ? <div className="reader-loading">正在展开文本…</div> : <article ref={contentRef} className={settings.fontFamily} style={{ fontSize: settings.fontSize, lineHeight: settings.lineHeight, maxWidth: settings.contentWidth }}><div className="plain-text">{content}</div></article>}
    </div>
  </div>;
}
