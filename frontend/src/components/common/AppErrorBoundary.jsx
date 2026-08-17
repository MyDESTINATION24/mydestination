import React from 'react';

// Without a boundary anywhere in the tree, a single render throw unmounts the
// whole app and leaves a blank white page -- no message, no recovery, and
// nothing to report. Every crash looked identical from the outside.
//
// This keeps the failure visible and recoverable, and prints the component
// stack so the actual line can be found from a device console.
// A WebView caches index.html hard. After a deploy it can still ask for the
// previous build's hashed chunks, which no longer exist -- every lazy() route
// then rejects and the screen goes blank. That is not a bug to show the user,
// it is a stale bundle, and the fix is to fetch the new index.html once.
const RELOAD_GUARD_KEY = 'appErrorBoundaryReloadedAt';
const RELOAD_GUARD_WINDOW_MS = 30000;

const isStaleChunkError = (error) => /Failed to fetch dynamically imported module|error loading dynamically imported module|Loading chunk .* failed|Importing a module script failed|Unable to preload CSS/i
  .test(String(error?.message || error));

// Reload at most once per window, so a genuine persistent failure shows the
// error instead of trapping the app in a refresh loop.
const canReloadOnce = () => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);

    if (Date.now() - last < RELOAD_GUARD_WINDOW_MS) {
      return false;
    }

    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
    return true;
  } catch {
    return false;
  }
};

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

    if (isStaleChunkError(error) && canReloadOnce()) {
      console.warn('[app-error-boundary] stale bundle detected, reloading once');
      window.location.reload();
    }
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
