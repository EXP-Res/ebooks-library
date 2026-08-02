import MarkdownIt from 'markdown-it';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ReaderSearch } from '../components/ReaderSearch';
import { useDocumentSearch } from '../hooks/useDocumentSearch';
import { getProgress, saveProgress } from '../services/progress';
import { getSettings } from '../services/settings';
import type { Book } from '../types';
import { assetUrl, originalFileUrl } from '../utils/assetUrl';
import { decodeText } from './text';

interface Heading { level: number; text: string; id: string }

export function MarkdownReader({ book }: { book: Book }) {
  const [source, setSource] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  const search = useDocumentSearch(contentRef, query);
  const settings = getSettings();
  const directory = book.id.split('/').slice(0, -1).join('/');

  const markdown = useMemo(() => {
    const md = new MarkdownIt({ html: false, linkify: true, typographer: true });
    const imageRule = md.renderer.rules.image;
    md.renderer.rules.image = (tokens, index, options, env, self) => {
      const srcIndex = tokens[index].attrIndex('src');
      const src = srcIndex >= 0 ? String(tokens[index].attrs![srcIndex][1]) : '';
      if (src && !/^(https?:|data:)/i.test(src)) tokens[index].attrs![srcIndex][1] = assetUrl(`books/${directory}/${src.replace(/^\.\//, '')}`);
      return imageRule ? imageRule(tokens, index, options, env, self) : self.renderToken(tokens, index, options);
    };
    return md;
  }, [directory]);

  const headings = useMemo<Heading[]>(() => [...source.matchAll(/^(#{1,4})\s+(.+)$/gm)].map((match, index) => ({ level: match[1].length, text: match[2].replace(/[*_`[\]]/g, ''), id: `heading-${index}` })), [source]);
  const html = useMemo(() => markdown.render(source), [markdown, source]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(originalFileUrl(book.path), { signal: controller.signal }).then((response) => { if (!response.ok) throw new Error(`文件请求失败（${response.status}）`); return response.arrayBuffer(); })
      .then((buffer) => setSource(decodeText(buffer))).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Markdown 加载失败'); });
    return () => controller.abort();
  }, [book.path]);

  useEffect(() => {
    if (!source || !contentRef.current) return;
    contentRef.current.querySelectorAll('h1,h2,h3,h4').forEach((heading, index) => { heading.id = `heading-${index}`; });
    const saved = getProgress(book.id);
    requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = saved?.scrollTop || 0; });
  }, [book.id, source]);

  if (error) throw new Error(error);
  return <div className={`prose-reader theme-${settings.readingTheme} markdown-layout`}>
    {headings.length > 0 && <aside className="document-toc"><b>本书目录</b>{headings.map((heading) => <button style={{ paddingLeft: `${(heading.level - 1) * 10 + 8}px` }} key={heading.id} onClick={() => document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' })}>{heading.text}</button>)}</aside>}
    <div className="markdown-main">
      <div className="prose-scroll" ref={scrollRef} onScroll={() => { const element = scrollRef.current; if (!element) return; const range = element.scrollHeight - element.clientHeight; saveProgress(book, { scrollTop: element.scrollTop, progress: range > 0 ? element.scrollTop / range * 100 : 100 }); }}>
        {!source ? <div className="reader-loading">正在排版文稿…</div> : <article ref={contentRef} className={`markdown-body ${settings.fontFamily}`} style={{ fontSize: settings.fontSize, lineHeight: settings.lineHeight, maxWidth: settings.contentWidth }} dangerouslySetInnerHTML={{ __html: html }} />}
      </div>
      <div className="reader-subbar"><ReaderSearch query={query} setQuery={setQuery} count={search.count} current={search.current} onPrevious={search.previous} onNext={search.next} /></div>
    </div>
  </div>;
}
