// Vector art for the service cards on the taxi home screen.
//
// These cards render their art at ~88px. The 3D PNG renders in
// assets/3d images/AutoCab are 1024px illustrations full of small detail and
// baked-in text (the pooling one has six labelled speech bubbles), which turns
// into an unreadable smudge at card size. Vector keeps the silhouette legible
// and costs no bytes.
//
// Swap either of these back to an <img> the moment there is a 3D render drawn
// for this size.

export const PoolingArt = ({ className = '' }) => (
  <svg viewBox="0 0 100 80" aria-hidden="true" className={className}>
    <defs>
      <linearGradient id="poolBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="poolGlass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ecfdf5" />
        <stop offset="100%" stopColor="#a7f3d0" />
      </linearGradient>
    </defs>

    {/* two riders sharing the trip */}
    <circle cx="30" cy="15" r="8" fill="#ecfdf5" stroke="#34d399" strokeWidth="2.5" />
    <circle cx="30" cy="13" r="3" fill="#059669" />
    <path d="M24 20a6 6 0 0 1 12 0z" fill="#059669" />

    <circle cx="52" cy="12" r="9" fill="#ecfdf5" stroke="#10b981" strokeWidth="2.5" />
    <circle cx="52" cy="10" r="3.4" fill="#047857" />
    <path d="M45.5 17.5a6.5 6.5 0 0 1 13 0z" fill="#047857" />

    {/* car */}
    <path d="M14 60c0-3 1-6 3-9l5-8a7 7 0 0 1 6-3h30a7 7 0 0 1 6 3l5 8c2 3 3 6 3 9v5a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" fill="url(#poolBody)" />
    <path d="M26 44l3.5-6a3 3 0 0 1 2.6-1.5h23.8A3 3 0 0 1 58.5 38l3.5 6z" fill="url(#poolGlass)" />
    <rect x="18" y="52" width="10" height="4" rx="2" fill="#ecfdf5" opacity="0.85" />
    <rect x="60" y="52" width="10" height="4" rx="2" fill="#ecfdf5" opacity="0.85" />
    <circle cx="27" cy="69" r="7" fill="#0f172a" />
    <circle cx="27" cy="69" r="2.8" fill="#94a3b8" />
    <circle cx="61" cy="69" r="7" fill="#0f172a" />
    <circle cx="61" cy="69" r="2.8" fill="#94a3b8" />
  </svg>
);

export const TrekArt = ({ className = '' }) => (
  <svg viewBox="0 0 100 80" aria-hidden="true" className={className}>
    <defs>
      <linearGradient id="trekBack" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#c7d2fe" />
        <stop offset="100%" stopColor="#818cf8" />
      </linearGradient>
      <linearGradient id="trekFront" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>

    <circle cx="78" cy="18" r="9" fill="#fde68a" />

    {/* far peak */}
    <path d="M8 70 L34 22 L60 70 Z" fill="url(#trekBack)" />
    <path d="M34 22 L43 39 L34 45 L25 39 Z" fill="#eef2ff" />

    {/* near peak, with a summit marker */}
    <path d="M42 70 L68 28 L94 70 Z" fill="url(#trekFront)" />
    <path d="M68 28 L76 43 L68 48 L60 43 Z" fill="#f8fafc" />
    <path d="M68 28 V16" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M68.5 16 L79 19.5 L68.5 23.5 Z" fill="#ef4444" />

    <rect x="4" y="69" width="92" height="4" rx="2" fill="#0f172a" opacity="0.12" />
  </svg>
);
