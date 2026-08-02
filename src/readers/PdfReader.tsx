import { useEffect, useRef, useState } from 'react';
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import { Icon } from '../components/Icon';
import { ReaderSearch } from '../components/ReaderSearch';
import { getProgress, saveProgress } from '../services/progress';
import type { Book } from '../types';
import { originalFileUrl } from '../utils/assetUrl';

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

export function PdfReader({ book }: { book: Book }) {
  const [document, setDocument] = useState<PDFDocumentProxy>();
  const [page, setPage] = useState(() => getProgress(book.id)?.page || 1);
  const [scale, setScale] = useState(1.15);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<number[]>([]);
  const [currentResult, setCurrentResult] = useState(0);
  const [loadError, setLoadError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const task = getDocument({ url: originalFileUrl(book.path) });
    task.promise.then((pdf) => { if (active) setDocument(pdf); }).catch((reason: unknown) => { if (active) setLoadError(reason instanceof Error ? reason.message : 'PDF 加载失败'); });
    return () => { active = false; task.destroy(); };
  }, [book.path]);

  useEffect(() => {
    if (!document || !canvasRef.current) return;
    let cancelled = false;
    let renderTask: ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']> | undefined;
    document.getPage(page).then((pdfPage) => {
      if (cancelled || !canvasRef.current) return;
      const viewport = pdfPage.getViewport({ scale });
      const ratio = Math.min(devicePixelRatio || 1, 2);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      renderTask = pdfPage.render({ canvas, canvasContext: context, viewport, transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0] });
      return renderTask.promise;
    }).catch((reason: unknown) => {
      if (!cancelled && !(reason instanceof Error && reason.name === 'RenderingCancelledException')) console.error(reason);
    });
    saveProgress(book, { page, totalPages: document.numPages, progress: page / document.numPages * 100 });
    return () => { cancelled = true; renderTask?.cancel(); };
  }, [book, document, page, scale]);

  const fitWidth = async () => {
    if (!document || !stageRef.current) return;
    const pdfPage = await document.getPage(page);
    const viewport = pdfPage.getViewport({ scale: 1 });
    setScale(Math.max(0.25, (stageRef.current.clientWidth - 40) / viewport.width));
  };

  const search = async () => {
    if (!document || !query.trim()) { setResults([]); return; }
    setSearching(true);
    const needle = query.trim().toLocaleLowerCase();
    const found: number[] = [];
    for (let number = 1; number <= document.numPages; number += 1) {
      const pdfPage = await document.getPage(number);
      const text = (await pdfPage.getTextContent()).items.map((item) => 'str' in item ? item.str : '').join(' ').toLocaleLowerCase();
      let index = text.indexOf(needle);
      while (index >= 0) { found.push(number); index = text.indexOf(needle, index + needle.length); }
    }
    setResults(found);
    setCurrentResult(0);
    if (found[0]) setPage(found[0]);
    setSearching(false);
  };

  const moveResult = (direction: number) => {
    if (!results.length) return;
    const next = (currentResult + direction + results.length) % results.length;
    setCurrentResult(next);
    setPage(results[next]);
  };

  if (loadError) throw new Error(loadError);
  return <div className="pdf-reader" ref={stageRef}>
    <div className="pdf-stage">{!document && <div className="reader-loading">正在装订 PDF…</div>}<canvas ref={canvasRef} />{searching && <div className="searching-overlay">正在搜索全书…</div>}</div>
    <div className="reader-subbar pdf-tools">
      <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>上一页</button>
      <button onClick={() => setPage((value) => Math.min(document?.numPages || value, value + 1))} disabled={!document || page >= document.numPages}>下一页</button>
      <label className="reader-page-status"><input aria-label="当前页" type="number" min="1" max={document?.numPages || 1} value={page} onChange={(event) => setPage(Math.min(document?.numPages || 1, Math.max(1, Number(event.target.value))))} /> / {document?.numPages || '—'}</label>
      <span className="tool-divider" />
      <button onClick={() => setScale((value) => Math.max(.25, value - .15))}>−</button><span>{Math.round(scale * 100)}%</span><button onClick={() => setScale((value) => Math.min(4, value + .15))}>＋</button>
      <button onClick={fitWidth}>适应宽度</button>
      <button className="icon-button" onClick={() => stageRef.current?.requestFullscreen()} aria-label="全屏"><Icon name="fullscreen" /></button>
      <ReaderSearch query={query} setQuery={setQuery} count={results.length} current={currentResult} onPrevious={() => moveResult(-1)} onNext={() => moveResult(1)} onSubmit={search} />
    </div>
  </div>;
}
