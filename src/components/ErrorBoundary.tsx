import React from 'react';

interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto px-6 py-16 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h2 className="text-xl font-bold text-navy dark:text-slate-100 mb-2">Something went wrong</h2>
          <p className="text-sm text-navy/60 dark:text-slate-400 mb-6 font-mono bg-sand/20 dark:bg-slate-border/40 rounded-xl p-3 text-left break-all">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gold text-white px-6 py-2.5 rounded-xl font-medium hover:bg-gold/90 transition-colors"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
