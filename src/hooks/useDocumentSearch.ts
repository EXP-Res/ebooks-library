import { type RefObject, useEffect, useState } from 'react';

function clearMarks(root: HTMLElement) {
  root.querySelectorAll('mark[data-reader-search]').forEach((mark) => mark.replaceWith(document.createTextNode(mark.textContent || '')));
  root.normalize();
}

export function useDocumentSearch(rootRef: RefObject<HTMLElement | null>, query: string) {
  const [matches, setMatches] = useState<HTMLElement[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    clearMarks(root);
    if (!query.trim()) {
      setMatches([]);
      setCurrent(0);
      return;
    }

    const found: HTMLElement[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        return node.textContent?.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) && parent && !['SCRIPT', 'STYLE', 'MARK'].includes(parent.tagName)
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    const needle = query.trim().toLocaleLowerCase();
    for (const node of nodes) {
      const source = node.data;
      const lower = source.toLocaleLowerCase();
      let start = 0;
      let index = lower.indexOf(needle);
      const fragment = document.createDocumentFragment();
      while (index >= 0) {
        fragment.append(source.slice(start, index));
        const mark = document.createElement('mark');
        mark.dataset.readerSearch = 'true';
        mark.textContent = source.slice(index, index + needle.length);
        fragment.append(mark);
        found.push(mark);
        start = index + needle.length;
        index = lower.indexOf(needle, start);
      }
      fragment.append(source.slice(start));
      node.replaceWith(fragment);
    }
    setMatches(found);
    setCurrent(0);
    found[0]?.scrollIntoView({ block: 'center' });
    return () => clearMarks(root);
  }, [query, rootRef]);

  useEffect(() => {
    matches.forEach((match, index) => match.classList.toggle('current', index === current));
  }, [current, matches]);

  const move = (direction: number) => {
    if (!matches.length) return;
    const next = (current + direction + matches.length) % matches.length;
    setCurrent(next);
    matches[next].scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return { count: matches.length, current, previous: () => move(-1), next: () => move(1) };
}
