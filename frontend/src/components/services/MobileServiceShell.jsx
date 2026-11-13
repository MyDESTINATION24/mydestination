import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import useIsMobile from '../../hooks/useIsMobile';
import { useAppServices, rememberServiceTab } from '../../services/appServices';

/**
 * Phone-only top section shared by every service's home screen (Hotels, Rides,
 * Wedding, Helicopter, Char Dham...): greeting, the service's banner, a tab
 * strip of all services and an optional search box. Tapping a tab opens that
 * service's own home screen, which shows this same section with its tab active.
 * Tabs, labels and banners come from CMS Admin -> App Services.
 *
 * Renders nothing on tablet/desktop, where each service keeps its own header.
 */

// Warms up the next service's code so switching tabs feels instant. Paths must
// match the app's own lazy imports so the same chunks are reused.
const PREFETCH = [
  { match: /^\/hotels/, load: () => import('../../pages/user/Home') },
  { match: /^\/wedding/, load: () => Promise.all([import('../../modules/wedding-integrated/components/WeddingLayout'), import('../../modules/wedding-integrated/views/WeddingHomePage')]) },
  { match: /^\/taxi/, load: () => import('../../modules/taxi/TaxiApp') },
];

const isExternal = (path) => /^https?:\/\//i.test(path || '');

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

/**
 * @param {string} serviceKey  key of the service this screen belongs to (hotel, taxi, wedding, helicopter, chardham)
 * @param {Array}  actions     right-side buttons: [{ icon: Component, label, onClick, dot }]
 * @param {string} profilePath where the avatar goes
 * @param {object} search      optional { placeholder, onClick } for a search box under the tabs
 */
const MobileServiceShell = ({ serviceKey, actions = [], profilePath = '/profile', search = null }) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { services } = useAppServices();
  const stripRef = useRef(null);

  const tabs = useMemo(() => services.filter((s) => s.tabLabel), [services]);
  const active = tabs.find((t) => t.key === serviceKey) || tabs[0];

  useEffect(() => {
    if (serviceKey) rememberServiceTab(serviceKey);
  }, [serviceKey]);

  // Bring the active tab into view and preload the others once idle.
  useEffect(() => {
    if (!isMobile) return undefined;
    const el = stripRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1200));
    const handle = idle(() => {
      tabs.forEach((tab) => PREFETCH.find((p) => p.match.test(tab.path))?.load().catch(() => {}));
    });
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(handle) : clearTimeout(handle));
  }, [isMobile, tabs, active?.key]);

  if (!isMobile || !active) return null;

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') || {}; } catch { return {}; }
  })();
  const firstName = String(user.name || '').split(' ')[0];
  const avatar = user.profileImage || user.avatar || '';

  const openTab = (tab) => {
    if (tab.key === active.key) return;
    if (isExternal(tab.path)) {
      window.location.assign(tab.path);
      return;
    }
    // The tab is remembered only once its screen actually opens (effect above),
    // so a service that bounces to login is never reopened from /home.
    // replace: the back button leaves the app section instead of replaying every tab tapped.
    navigate(tab.path, { replace: true });
    window.scrollTo(0, 0);
  };

  return (
    <section className="relative md:hidden" aria-label="Services">
      <div className="relative overflow-hidden rounded-b-[28px] bg-slate-900 pb-4 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.55)]">
        {/* Banner */}
        {active.bannerImage ? (
          <img
            key={active.bannerImage}
            src={active.bannerImage}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover ${active.imagePos}`}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${active.chip}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/70" />

        <div className="relative z-10 px-4 pt-[calc(env(safe-area-inset-top)+0.9rem)]">
          {/* Top row: greeting, actions, profile */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">{greeting()}</p>
              <p className="truncate text-[17px] font-black text-white">{firstName ? `Hi, ${firstName}!` : 'Welcome!'}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {actions.map(({ icon: Icon, label, onClick, dot }) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  aria-label={label}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md active:scale-95"
                >
                  <Icon size={18} />
                  {dot ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-white bg-red-500" /> : null}
                </button>
              ))}
              <button
                type="button"
                onClick={() => navigate(profilePath)}
                aria-label="Profile"
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white/80 bg-white/20 text-sm font-black text-white backdrop-blur-md active:scale-95"
              >
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : (firstName.charAt(0).toUpperCase() || 'U')}
              </button>
            </div>
          </div>

          {/* Banner headline */}
          <div className="pb-5 pt-9">
            <h1 className="text-[28px] font-black leading-[1.1] tracking-tight text-white drop-shadow-md">{active.bannerTitle}</h1>
            {active.description ? (
              <p className="mt-1.5 line-clamp-2 max-w-[90%] text-[13px] font-medium text-white/85">{active.description}</p>
            ) : null}
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
                className={`relative flex min-w-[86px] shrink-0 snap-start flex-col items-center gap-1 rounded-2xl border px-3 pb-2.5 pt-2 transition-all active:scale-95 ${
                  isActive
                    ? 'border-white/70 bg-white/25 shadow-lg backdrop-blur-md'
                    : 'border-white/10 bg-black/25 backdrop-blur-sm'
                }`}
              >
                <TabIcon tab={tab} />
                <span className="text-[13px] font-black leading-none text-white">{tab.tabLabel}</span>
                {tab.tagline ? <span className="text-[10px] font-semibold leading-none text-white/75">{tab.tagline}</span> : null}
                {isActive ? <span className={`absolute -bottom-px left-1/2 h-1 w-7 -translate-x-1/2 rounded-full bg-gradient-to-r ${tab.chip}`} /> : null}
              </button>
            );
          })}
        </div>

        {/* Optional search */}
        {search ? (
          <div className="relative z-10 px-4 pt-3">
            <button
              type="button"
              onClick={search.onClick}
              className="flex h-12 w-full items-center gap-3 rounded-2xl bg-white px-4 text-left shadow-lg active:scale-[0.99]"
            >
              <Search size={18} className="text-slate-400" />
              <span className="truncate text-sm font-medium text-slate-400">{search.placeholder || 'Search'}</span>
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default MobileServiceShell;
