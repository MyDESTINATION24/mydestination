/**
 * Typography Whitelist & Responsive Class Governance Configuration
 */

// 1. Approved Font Families -> Tailwind CSS Class
export const FONT_WHITELIST = {
  'poppins': 'font-poppins',
  'inter': 'font-inter',
  'roboto': 'font-roboto',
  'open sans': 'font-sans',
  'default': 'font-inter', // Fallback if admin uses an unapproved font
};

// 2. Approved Brand Colors -> Tailwind CSS Color Class
export const BRAND_COLOR_WHITELIST = {
  '#000000': 'text-gray-900',
  '#0f172a': 'text-slate-900',
  '#1e293b': 'text-slate-800',
  '#2563eb': 'text-blue-600',    // Primary Brand Color
  '#059669': 'text-emerald-600', // Success Color
  '#dc2626': 'text-red-600',     // Danger Color
  '#64748b': 'text-slate-500',   // Muted Text Color
  'default': 'text-slate-900',   // Fallback color
};

// 3. Word Font Sizes (pt) -> Responsive Tailwind Class Rules
export const RESPONSIVE_FONT_SIZE_MAP = [
  { minPt: 32, class: 'text-3xl sm:text-4xl md:text-5xl font-bold leading-tight' },   // Display / H1
  { minPt: 24, class: 'text-2xl sm:text-3xl md:text-4xl font-semibold leading-snug' },  // H2
  { minPt: 18, class: 'text-xl sm:text-2xl md:text-3xl font-medium leading-normal' },   // H3
  { minPt: 14, class: 'text-lg sm:text-xl font-medium leading-relaxed' },              // Subtitle / H4
  { minPt: 0,  class: 'text-base sm:text-lg leading-relaxed' },                        // Body / Paragraph
];
