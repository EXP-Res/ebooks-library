import { Link } from 'react-router-dom';
import type { Book } from '../types';
import { Icon } from './Icon';

interface Node { name: string; path: string[]; count: number; children: Map<string, Node> }

function buildTree(books: Book[]): Node[] {
  const roots = new Map<string, Node>();
  for (const book of books) {
    let level = roots;
    book.category.forEach((name, index) => {
      let node = level.get(name);
      if (!node) {
        node = { name, path: book.category.slice(0, index + 1), count: 0, children: new Map() };
        level.set(name, node);
      }
      node.count += 1;
      level = node.children;
    });
  }
  return [...roots.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
}

const categoryHref = (path: string[]) => `/category/${path.map(encodeURIComponent).join('/')}`;

function Branch({ node, activePath }: { node: Node; activePath: string[] }) {
  const active = node.path.join('/') === activePath.join('/');
  const expanded = activePath.slice(0, node.path.length).join('/') === node.path.join('/');
  return <li>
    <Link className={active ? 'active' : ''} to={categoryHref(node.path)}>
      <span>{node.name}</span><span className="category-count">{node.count}</span>
    </Link>
    {node.children.size > 0 && expanded && <ul>{[...node.children.values()].map((child) => <Branch key={child.path.join('/')} node={child} activePath={activePath} />)}</ul>}
  </li>;
}

export function CategoryNav({ books, activePath, open, onClose }: { books: Book[]; activePath: string[]; open: boolean; onClose: () => void }) {
  const tree = buildTree(books);
  return <>
    {open && <button className="drawer-scrim" onClick={onClose} aria-label="关闭分类" />}
    <aside className={`category-nav ${open ? 'open' : ''}`}>
      <div className="category-heading"><span>馆藏分类</span><button className="icon-button mobile-only" onClick={onClose} aria-label="关闭分类"><Icon name="close" /></button></div>
      <ul>
        <li><Link className={activePath.length === 0 ? 'active' : ''} to="/"><span>全部藏书</span><span className="category-count">{books.length}</span></Link></li>
        {tree.map((node) => <Branch key={node.name} node={node} activePath={activePath} />)}
      </ul>
      <p className="storage-note">阅读记录只保存在当前浏览器。</p>
    </aside>
  </>;
}
