import { type FormEvent, type ReactNode, useState } from 'react';
import { authenticate, isAuthenticated } from '../services/auth';

export function AuthGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(isAuthenticated);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (unlocked) return children;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const valid = await authenticate(password);
    setBusy(false);
    if (valid) setUnlocked(true);
    else setError('密码不正确，请重新输入。');
  };

  return <main className="auth-page">
    <section className="auth-card">
      <div className="brand-mark" aria-hidden="true"><span>泊</span></div>
      <p className="eyebrow">PRIVATE LIBRARY</p>
      <h1>回到你的书架</h1>
      <p className="muted">输入访问密码，继续上次停下的那一页。</p>
      <form onSubmit={submit}>
        <label htmlFor="access-password">访问密码</label>
        <input id="access-password" type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} autoFocus autoComplete="current-password" />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button primary" disabled={busy || !password}>{busy ? '正在验证…' : '进入书架'}</button>
      </form>
      <small>这是一道轻量访问门槛，无法加密公开托管的文件。</small>
    </section>
  </main>;
}
