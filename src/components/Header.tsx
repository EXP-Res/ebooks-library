import { Link } from 'react-router-dom';
import { Icon } from './Icon';

export function Header({ onMenu, compact = false }: { onMenu?: () => void; compact?: boolean }) {
  return <header className={`site-header ${compact ? 'compact' : ''}`}>
    <div className="header-inner">
      {onMenu && <button className="icon-button mobile-only" onClick={onMenu} aria-label="打开分类"><Icon name="menu" /></button>}
      <Link className="brand" to="/" aria-label="泊书首页"><span className="brand-mark small">泊</span><span><b>泊书</b><small>PRIVATE LIBRARY</small></span></Link>
      <nav>
        <Link to="/">书架</Link>
        <Link className="icon-button" to="/settings" aria-label="阅读设置"><Icon name="settings" /></Link>
      </nav>
    </div>
  </header>;
}
