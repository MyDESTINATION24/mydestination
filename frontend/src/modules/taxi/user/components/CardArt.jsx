// Vector art for service cards that have no 3D render yet.
//
// Pooling deliberately keeps its PNG -- the vector version read as too plain
// next to the other 3D tiles. Only add here when there is genuinely no asset.

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
