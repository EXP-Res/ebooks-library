import { Icon } from './Icon';

export function ReaderSearch({ query, setQuery, count, current, onPrevious, onNext, onSubmit }: {
  query: string;
  setQuery: (value: string) => void;
  count: number;
  current: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit?: () => void;
}) {
  return <form className="reader-search" onSubmit={(event) => { event.preventDefault(); onSubmit?.(); }}>
    <Icon name="search" />
    <input aria-label="在书内搜索" value={query} placeholder="在书内搜索" onChange={(event) => setQuery(event.target.value)} />
    <span>{query ? `${count ? current + 1 : 0} / ${count}` : ''}</span>
    <button type="button" onClick={onPrevious} disabled={!count} aria-label="上一个匹配">↑</button>
    <button type="button" onClick={onNext} disabled={!count} aria-label="下一个匹配">↓</button>
  </form>;
}
