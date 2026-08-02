import { Component, type ErrorInfo, type ReactNode } from 'react';

export class ReaderErrorBoundary extends Component<{ children: ReactNode; fallback: (message: string) => ReactNode }, { message: string }> {
  state = { message: '' };
  static getDerivedStateFromError(error: Error) { return { message: error.message || '阅读器加载失败' }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error(error, info); }
  render() { return this.state.message ? this.props.fallback(this.state.message) : this.props.children; }
}
