import React from 'react';

// Without a boundary anywhere in the tree, a single render throw unmounts the
// whole app and leaves a blank white page -- no message, no recovery, and
// nothing to report. Every crash looked identical from the outside.
//
// This keeps the failure visible and recoverable, and prints the component
// stack so the actual line can be found from a device console.
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[app-error-boundary] render failed', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-slate-50 px-6 py-10">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-black text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-[13px] font-medium text-slate-500">
            This screen hit an unexpected error. Your booking is safe -- reopening usually fixes it.
          </p>

          <p className="mt-4 break-words rounded-xl bg-slate-50 px-3 py-2 text-left font-mono text-[11px] text-slate-600">
            {String(error?.message || error)}
          </p>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] font-bold text-white"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={() => { window.location.href = '/'; }}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-[13px] font-bold text-slate-700"
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
