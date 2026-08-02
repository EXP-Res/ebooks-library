export function LoadingState({ label = '正在整理书架…' }: { label?: string }) {
  return <div className="state-panel" role="status"><span className="loader" /> <p>{label}</p></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="state-panel error-state"><strong>这里暂时翻不开</strong><p>{message}</p>{onRetry && <button className="button" onClick={onRetry}>重新加载</button>}</div>;
}
