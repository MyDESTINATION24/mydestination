import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Menu, Wallet, Bell } from 'lucide-react';
import useIsMobile from '../../hooks/useIsMobile';
import { useAppServices, rememberServiceTab } from '../../services/appServices';
import MobileMenu from '../ui/MobileMenu';

/**
 * Phone-only service tabs (CMS Admin -> App Services), rendered ONCE at the top
 * of the app (App.jsx) whenever the current page is a service home screen:
 * Hotels, Rides, Wedding, Helicopter, Char Dham...
 *
 * It used to be rendered inside each service page, so every tab tap destroyed
 * and rebuilt it: the tabs vanished behind a full-page loader, the tab row
 * jumped, the banner reloaded and each page's fonts resized the tabs. Living
 * above the routes, it stays put; only the content underneath changes.
 *
 * Renders nothing on tablet/desktop or on any non-home page.
 */

const normalize = (path) => String(path || '').replace(/\/+$/, '') || '/';
const isExternal = (path) => /^https?:\/\//i.test(path || '');

// Warms up each service's home screen code (not just its app) so a tab switch
// rarely has anything left to download. Paths must match the app's own lazy
// imports so the same files are reused.
const PREFETCH = [
  { match: /^\/hotels$/, load: () => import('../../pages/user/Home') },
  { match: /^\/wedding$/, load: () => Promise.all([import('../../modules/wedding-integrated/components/WeddingLayout'), import('../../modules/wedding-integrated/views/WeddingHomePage')]) },
  { match: /^\/taxi\/user$/, load: () => Promise.all([import('../../modules/taxi/TaxiApp'), import('../../modules/taxi/user/pages/Home')]) },
  { match: /^\/taxi\/user\/airways$/, load: () => Promise.all([import('../../modules/taxi/TaxiApp'), import('../../modules/taxi/user/pages/airways/AirwaysHome')]) },
  { match: /^\/taxi\/user\/tours$/, load: () => Promise.all([import('../../modules/taxi/TaxiApp'), import('../../modules/taxi/user/pages/tours/ToursHome')]) },
];

// Buttons each service shows next to the profile picture (what its own
// header used to have), chosen by where the service lives.
const configFor = (tab) => {
  const path = normalize(tab?.path);
  if (path === '/hotels') {
    return { profile: '/profile', menu: 'hotel', wallet: '/wallet', notifications: '/notifications', search: { placeholder: 'Search hotels, resorts, cities…', path: '/search' } };
  }
  if (path.startsWith('/taxi')) {
    return { profile: '/taxi/user/profile', menu: 'taxi', wallet: '/taxi/wallet', notifications: '/taxi/notifications' };
  }
  if (path.startsWith('/wedding')) return { profile: '/wedding/account' };
  return { profile: '/profile' };
};

/** The tab for the current page, or null when the tabs should not show. */
export const useActiveServiceTab = () => {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const { services } = useAppServices();
  return useMemo(() => {
    if (!isMobile) return null;
    const here = normalize(pathname);
    return services.find((s) => s.tabLabel && !isExternal(s.path) && normalize(s.path) === here) || null;
  }, [isMobile, pathname, services]);
};

/** True when the shared tabs are showing, so a page should hide its own mobile header. */
export const useServiceShellActive = () => Boolean(useActiveServiceTab());

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const TabIcon = ({ tab }) => {
  if (tab.tabIcon) {
    return <img src={tab.tabIcon} alt="" className="h-8 w-8 object-contain drop-shadow" loading="lazy" />;
  }
  const Icon = tab.icon;
  return (
    <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${tab.chip} text-white shadow-md`}>
      <Icon size={16} />
    </span>
  );
};

const MobileServiceShell = () => {
  const navigate = useNavigate();
  const active = useActiveServiceTab();
  const { services } = useAppServices();
  const stripRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const tabs = useMemo(() => services.filter((s) => s.tabLabel), [services]);
  const config = configFor(active);

  useEffect(() => {
    if (active?.key) rememberServiceTab(active.key);
  }, [active?.key]);

  // Keep the active tab in view (smoothly, after the first paint).
  const firstScroll = useRef(true);
  useLayoutEffect(() => {
    if (!active) return;
    const el = stripRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: firstScroll.current ? 'auto' : 'smooth' });
    firstScroll.current = false;
  }, [active?.key]);

  // Once idle: preload every service's screen and every banner picture, so a
  // tab switch has nothing left to fetch.
  const tabsKey = tabs.map((t) => `${t.path}|${t.bannerImage}|${t.tabIcon}`).join(',');
  useEffect(() => {
    if (!active) return undefined;
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 600));
    const handle = idle(() => {
      tabs.forEach((tab) => {
        PREFETCH.find((p) => p.match.test(normalize(tab.path)))?.load().catch(() => {});
        [tab.bannerImage, tab.tabIcon].filter(Boolean).forEach((src) => { const img = new Image(); img.src = src; });
      });
    });
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(handle) : clearTimeout(handle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(active), tabsKey]);

  if (!active) return null;

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') || {}; } catch { return {}; }
  })();
  const firstName = String(user.name || '').split(' ')[0];
  const avatar = user.profileImage || user.avatar || '';

  const actions = [
    config.menu ? {
      icon: Menu,
      label: 'Menu',
      onClick: () => (config.menu === 'hotel' ? setMenuOpen(true) : window.dispatchEvent(new CustomEvent('openTaxiSidebar'))),
    } : null,
    config.wallet ? { icon: Wallet, label: 'My Wallet', onClick: () => navigate(config.wallet) } : null,
    config.notifications ? { icon: Bell, label: 'Notifications', onClick: () => navigate(config.notifications), dot: config.menu === 'hotel' } : null,
  ].filter(Boolean);

  const openTab = (tab) => {
    if (tab.key === active.key) return;
    if (isExternal(tab.path)) {
      window.location.assign(tab.path);
      return;
    }
    // replace: Back leaves the services instead of replaying every tab tapped.
    // The tab is remembered only once its screen opens (effect above), so a
    // service that bounces to login is never reopened from /home.
    navigate(tab.path, { replace: true });
    window.scrollTo({ top: 0 });
  };

  return (
    <section className="relative z-[55] md:hidden font-sans" aria-label="Services" style={{ letterSpacing: 'normal' }}>
      <div className="relative overflow-hidden rounded-b-[28px] bg-slate-900 pb-4 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.55)]">
        {/* Banner: crossfades between services */}
        <AnimatePresence initial={false}>
          <motion.div
            key={active.key}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            {active.bannerImage ? (
              <img src={active.bannerImage} alt="" className={`h-full w-full object-cover ${active.imagePos}`} />
            ) : (
              <div className={`h-full w-full bg-gradient-to-br ${active.chip}`} />
            )}
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/70" />

        <div className="relative z-10 px-4 pt-[calc(env(safe-area-inset-top)+0.9rem)]">
          {/* Top row: greeting, actions, profile */}
          <div className="flex h-11 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">{greeting()}</p>
              <p className="truncate text-[17px] font-black leading-tight text-white">{firstName ? `Hi, ${firstName}!` : 'Welcome!'}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <AnimatePresence initial={false} mode="popLayout">
                {actions.map(({ icon: Icon, label, onClick, dot }) => (
                  <motion.button
                    key={label}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    type="button"
                    onClick={onClick}
                    aria-label={label}
                    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md active:scale-95"
                  >
                    <Icon size={18} />
                    {dot ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-white bg-red-500" /> : null}
                  </motion.button>
                ))}
              </AnimatePresence>
              <button
                type="button"
                onClick={() => navigate(config.profile)}
                aria-label="Profile"
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white/80 bg-white/20 text-sm font-black text-white backdrop-blur-md active:scale-95"
              >
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : (firstName.charAt(0).toUpperCase() || 'U')}
              </button>
            </div>
          </div>

          {/* Headline: fixed height so every service has the same layout */}
          <div className="relative h-[118px] pt-7">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={active.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <h1 className="truncate text-[28px] font-black leading-[1.1] tracking-tight text-white drop-shadow-md">{active.bannerTitle}</h1>
                {active.description ? (
                  <p className="mt-1.5 line-clamp-2 max-w-[92%] text-[13px] font-medium leading-snug text-white/85">{active.description}</p>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Service tabs */}
        <div
          ref={stripRef}
          className="relative z-10 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
        >
          {tabs.map((tab) => {
            const isActive = tab.key === active.key;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-active={isActive}
                onClick={() => openTab(tab)}
                className="relative flex w-[92px] shrink-0 snap-start flex-col items-center gap-1 rounded-2xl border border-white/10 bg-black/25 px-2 pb-2.5 pt-2 backdrop-blur-sm transition-transform active:scale-95"
              >
                {/* The highlight slides from the old tab to the new one. */}
                {isActive ? (
                  <motion.span
                    layoutId="svc-active-tab"
                    className="absolute inset-0 rounded-2xl border border-white/70 bg-white/25 shadow-lg backdrop-blur-md"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                ) : null}
                <span className="relative"><TabIcon tab={tab} /></span>
                <span className="relative w-full truncate text-center text-[13px] font-black leading-none text-white">{tab.tabLabel}</span>
                {tab.tagline ? <span className="relative w-full truncate text-center text-[10px] font-semibold leading-none text-white/75">{tab.tagline}</span> : null}
                {isActive ? (
                  <motion.span
                    layoutId="svc-active-underline"
                    className={`absolute -bottom-px left-1/2 h-1 w-7 -translate-x-1/2 rounded-full bg-gradient-to-r ${tab.chip}`}
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Search (Hotels): height animates in/out instead of jumping */}
        <AnimatePresence initial={false}>
          {config.search ? (
            <motion.div
              key="search"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative z-10 overflow-hidden"
            >
              <div className="px-4 pt-3">
                <button
                  type="button"
                  onClick={() => navigate(config.search.path)}
                  className="flex h-12 w-full items-center gap-3 rounded-2xl bg-white px-4 text-left shadow-lg active:scale-[0.99]"
                >
                  <Search size={18} className="text-slate-400" />
                  <span className="truncate text-sm font-medium text-slate-400">{config.search.placeholder}</span>
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {config.menu === 'hotel' ? <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} /> : null}
    </section>
  );
};

/** Placeholder shown under the tabs while a service's screen is still loading. */
export const ServiceContentSkeleton = () => (
  <div className="px-4 pt-5 animate-pulse" aria-hidden>
    <div className="h-5 w-40 rounded-full bg-slate-200" />
    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="h-32 rounded-3xl bg-slate-200/80" />
      <div className="h-32 rounded-3xl bg-slate-200/80" />
      <div className="h-32 rounded-3xl bg-slate-200/70" />
      <div className="h-32 rounded-3xl bg-slate-200/70" />
    </div>
    <div className="mt-4 h-40 rounded-3xl bg-slate-200/60" />
  </div>
);

/**
 * Fades the page content in when switching services (Web Animations, so the
 * page is never remounted -- remounting would restart apps like Rides).
 */
export const ServiceContentTransition = ({ children }) => {
  const ref = useRef(null);
  const active = useActiveServiceTab();
  const lastKey = useRef(active?.key);
  useLayoutEffect(() => {
    const key = active?.key;
    if (key && lastKey.current && key !== lastKey.current && ref.current?.animate) {
      // Opacity only: a transform here would make this wrapper the containing
      // block for the pages' fixed bottom menus, which would then jump.
      ref.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
    }
    lastKey.current = key;
  }, [active?.key]);
  return <div ref={ref}>{children}</div>;
};

export default MobileServiceShell;
