import ePub, { type Book as EpubBook, type NavItem, type Rendition } from 'epubjs';
import { useEffect, useRef, useState } from 'react';
import { ReaderSearch } from '../components/ReaderSearch';
import { getProgress, saveProgress } from '../services/progress';
import { getSettings } from '../services/settings';
import type { Book } from '../types';
import { originalFileUrl } from '../utils/assetUrl';

interface EpubLocation { start?: { cfi?: string; href?: string; location?: number }; end?: { cfi?: string }; }
interface SearchResult { cfi: string; excerpt: string }
interface SearchableSection { load(loader: (path: string) => Promise<unknown>): Promise<void>; find(query: string): SearchResult[]; unload(): void }
interface SearchableBook extends EpubBook { spine: { spineItems: SearchableSection[] }; load(path: string): Promise<unknown> }

function flatten(items: NavItem[], depth = 0): { label: string; href: string; depth: number }[] {
  return items.flatMap((item) => [{ label: item.label.trim(), href: item.href, depth }, ...flatten(item.subitems || [], depth + 1)]);
}

export function EpubReader({ book }: { book: Book }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<EpubBook | undefined>(undefined);
  const renditionRef = useRef<Rendition | undefined>(undefined);
  const [chapters, setChapters] = useState<{ label: string; href: string; depth: number }[]>([]);
  const [tocOpen, setTocOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [current, setCurrent] = useState(0);
  const [searching, setSearching] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [pageInfo, setPageInfo] = useState({ current: 0, total: 0 });
  const settings = getSettings();

  useEffect(() => {
    if (!viewportRef.current) return;
    let active = true;
    const epubBook = ePub(originalFileUrl(book.path));
    const rendition = epubBook.renderTo(viewportRef.current, { width: '100%', height: '100%', spread: 'none', allowScriptedContent: false });
    bookRef.current = epubBook;
    renditionRef.current = rendition;
    rendition.themes.register('paper', { body: { background: '#f7f4ee', color: '#233044' }, 'a': { color: '#9b631f' } });
    rendition.themes.register('eye', { body: { background: '#e8eddc', color: '#26332b' }, 'a': { color: '#546b3d' } });
    rendition.themes.register('night', { body: { background: '#121b2a', color: '#d9e0e8' }, 'a': { color: '#e5ad5c' } });
    rendition.themes.select(settings.readingTheme);
    rendition.themes.fontSize(`${settings.fontSize}px`);
    const saved = getProgress(book.id);
    epubBook.ready.then(async () => {
      setChapters(flatten(epubBook.navigation.toc));
      await epubBook.locations.generate(1400);
      setPageInfo((value) => ({ ...value, total: epubBook.locations.length() }));
      await rendition.display(saved?.location);
    }).catch((reason: unknown) => { if (active) setLoadError(reason instanceof Error ? reason.message : 'EPUB 加载失败'); });
    rendition.on('relocated', (rawLocation) => {
      const location = rawLocation as EpubLocation;
      const cfi = location.start?.cfi;
      if (!cfi) return;
      const currentPage = location.start?.location;
      setPageInfo({ current: typeof currentPage === 'number' ? currentPage + 1 : 0, total: epubBook.locations.length() });
      const chapter = flatten(epubBook.navigation.toc).find((item) => location.start?.href?.includes(item.href.split('#')[0]))?.label;
      saveProgress(book, { location: cfi, chapter, progress: epubBook.locations.percentageFromCfi(cfi) * 100 });
    });
    return () => { active = false; rendition.destroy(); epubBook.destroy(); };
  }, [book, settings.fontSize, settings.readingTheme]);

  const search = async () => {
    const epubBook = bookRef.current as SearchableBook | undefined;
    if (!epubBook || !query.trim()) { setResults([]); return; }
    setSearching(true);
    const found: SearchResult[] = [];
    for (const section of epubBook.spine.spineItems) {
      await section.load(epubBook.load.bind(epubBook));
      found.push(...section.find(query.trim()));
      section.unload();
    }
    setResults(found);
    setCurrent(0);
    if (found[0]) await renditionRef.current?.display(found[0].cfi);
    setSearching(false);
  };

  const move = async (direction: number) => {
    if (!results.length) return;
    const next = (current + direction + results.length) % results.length;
    setCurrent(next);
    await renditionRef.current?.display(results[next].cfi);
  };

  if (loadError) throw new Error(loadError);
  return <div className="epub-reader">
    <div className="epub-workspace">
      <aside className={`epub-toc ${tocOpen ? 'open' : ''}`}><b>章节目录</b>{chapters.map((chapter, index) => <button key={`${chapter.href}-${index}`} style={{ paddingLeft: `${12 + chapter.depth * 14}px` }} onClick={() => { renditionRef.current?.display(chapter.href); setTocOpen(false); }}>{chapter.label}</button>)}</aside>
      {tocOpen && <button className="epub-scrim" onClick={() => setTocOpen(false)} aria-label="关闭目录" />}
      <div className={`epub-viewport theme-${settings.readingTheme}`} ref={viewportRef} onClick={(event) => { const x = event.clientX / window.innerWidth; if (x < .2) renditionRef.current?.prev(); else if (x > .8) renditionRef.current?.next(); }} />
      {searching && <div className="searching-overlay">正在搜索全书…</div>}
    </div>
    <div className="reader-subbar epub-tools">
      <button onClick={() => setTocOpen((value) => !value)}>章节目录</button>
      <button onClick={() => renditionRef.current?.prev()}>上一页</button>
      <button onClick={() => renditionRef.current?.next()}>下一页</button>
      <output className="reader-page-status" aria-live="polite">{pageInfo.current || '—'} / {pageInfo.total || '—'}</output>
      <span className="tool-divider" />
      <button onClick={() => renditionRef.current?.themes.fontSize(`${Math.max(12, settings.fontSize - 2)}px`)}>字小</button>
      <button onClick={() => renditionRef.current?.themes.fontSize(`${settings.fontSize + 2}px`)}>字大</button>
      <ReaderSearch query={query} setQuery={setQuery} count={results.length} current={current} onPrevious={() => move(-1)} onNext={() => move(1)} onSubmit={search} />
    </div>
  </div>;
}
