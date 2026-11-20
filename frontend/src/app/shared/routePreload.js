// Warm up the lazy-loaded page chunks behind the home-screen service cards so
// a tap opens the page straight away instead of waiting on a download.
// The specifiers must match the React.lazy() imports in App.jsx / TaxiApp.jsx
// so Vite serves the same chunks.

const LOADERS = [
  ['/hotels', () => import('@/pages/user/Home')],
  ['/taxi/user/airways', () => Promise.all([
    import('@/modules/taxi/TaxiApp'),
    import('@/modules/taxi/user/pages/airways/AirwaysHome'),
  ])],
  ['/taxi/user/tours', () => Promise.all([
    import('@/modules/taxi/TaxiApp'),
    import('@/modules/taxi/shared/pages/ComingSoon'),
  ])],
  ['/taxi', () => Promise.all([
    import('@/modules/taxi/TaxiApp'),
    import('@/modules/taxi/user/pages/Home'),
  ])],
  ['/wedding', () => Promise.all([
    import('@/modules/wedding-integrated/components/WeddingLayout'),
    import('@/modules/wedding-integrated/views/WeddingHomePage'),
  ])],
];

const started = new Set();

export const preloadRoute = (path) => {
  if (!path || /^https?:\/\//i.test(path)) return;
  const entry = LOADERS.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`));
  if (!entry || started.has(entry[0])) return;
  started.add(entry[0]);
  entry[1]().catch(() => started.delete(entry[0])); // retry on next call if it failed
};
