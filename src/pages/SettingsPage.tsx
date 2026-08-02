import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { authEnabled, signOut } from '../services/auth';
import { clearProgress, getAllProgress } from '../services/progress';
import { getSettings, saveSettings } from '../services/settings';
import type { ReaderSettings } from '../types';

export function SettingsPage() {
  const [settings, setSettings] = useState(getSettings);
  const [recordCount, setRecordCount] = useState(() => Object.keys(getAllProgress()).length);

  const update = <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  };

  const clearAll = () => {
    if (recordCount && confirm(`清除 ${recordCount} 本书的全部阅读记录？此操作无法撤销。`)) {
      clearProgress();
      setRecordCount(0);
    }
  };

  return <div className="settings-page">
    <Header compact />
    <main className="settings-main">
      <Link className="back-link" to="/"><Icon name="back" />返回书架</Link>
      <div className="settings-title"><p className="eyebrow">READING PREFERENCES</p><h1>把页面调成舒服的样子</h1><p>这些设置和阅读记录只保存在当前浏览器。</p></div>
      <section className="settings-card"><h2>界面主题</h2><div className="segmented">
        {([['system', '跟随系统'], ['light', '浅色'], ['dark', '深色']] as const).map(([value, label]) => <button className={settings.theme === value ? 'active' : ''} key={value} onClick={() => update('theme', value)}>{label}</button>)}
      </div></section>
      <section className="settings-card"><h2>阅读排版</h2>
        <label>阅读背景<select value={settings.readingTheme} onChange={(event) => update('readingTheme', event.target.value as ReaderSettings['readingTheme'])}><option value="paper">纸白</option><option value="eye">护眼</option><option value="night">夜读</option></select></label>
        <label>正文字体<select value={settings.fontFamily} onChange={(event) => update('fontFamily', event.target.value as ReaderSettings['fontFamily'])}><option value="serif">宋体 / 衬线</option><option value="sans">黑体 / 无衬线</option></select></label>
        <label>字号 <output>{settings.fontSize}px</output><input type="range" min="14" max="30" value={settings.fontSize} onChange={(event) => update('fontSize', Number(event.target.value))} /></label>
        <label>行距 <output>{settings.lineHeight.toFixed(1)}</output><input type="range" min="1.4" max="2.4" step="0.1" value={settings.lineHeight} onChange={(event) => update('lineHeight', Number(event.target.value))} /></label>
        <label>页面宽度 <output>{settings.contentWidth}px</output><input type="range" min="560" max="1100" step="20" value={settings.contentWidth} onChange={(event) => update('contentWidth', Number(event.target.value))} /></label>
      </section>
      <section className="settings-card danger-zone"><div><h2>本地阅读数据</h2><p>当前保存了 {recordCount} 本书的阅读进度。</p></div><button className="button danger" disabled={!recordCount} onClick={clearAll}><Icon name="trash" />清除全部记录</button></section>
      {authEnabled() && <section className="settings-card"><div><h2>访问状态</h2><p>退出后需要重新输入访问密码。</p></div><button className="button" onClick={() => { signOut(); location.reload(); }}>退出访问</button></section>}
    </main>
  </div>;
}
