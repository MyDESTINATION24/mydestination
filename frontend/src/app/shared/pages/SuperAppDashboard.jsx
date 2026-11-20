import React, { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Compass, LogOut, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { clearAllAuth } from '@/shared/auth/clearAllAuth';
import BirdFlock from '@/components/common/BirdFlock';
import { useAppServices } from '@/services/appServices';
import { preloadRoute } from '@/app/shared/routePreload';
import PromoBanners from '@/app/shared/components/PromoBanners';

// Cards come from CMS Admin -> App Services (see services/appServices.js).

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 48, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 90, damping: 16 },
  },
};

// Cursor-tracked 3D tilt + spotlight. Tilt is springed so it glides rather
// than snaps, and everything collapses to a plain card when the user prefers
// reduced motion.
export const ServiceCard = ({ service, onClick, reduceMotion }) => {
  const ref = useRef(null);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 180, damping: 20 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 180, damping: 20 });

  const handleMouseMove = (event) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;

    // spotlight follows the cursor
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);

    if (!reduceMotion) {
      rotateY.set((px - 0.5) * 10);
      rotateX.set((0.5 - py) * 8);
    }
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover={reduceMotion ? undefined : { y: -10 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      style={{ perspective: 1200 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX: reduceMotion ? 0 : rotateX, rotateY: reduceMotion ? 0 : rotateY, '--mx': '50%', '--my': '50%' }}
        className="relative flex h-full flex-row overflow-hidden rounded-[24px] border border-white/70 bg-white/80 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-shadow duration-500 md:flex-col md:rounded-[28px]"
        // per-service glow blooms on hover
        onMouseEnter={(event) => {
          event.currentTarget.style.boxShadow = `0 24px 60px -12px ${service.glow}, 0 8px 30px rgba(15,23,42,0.08)`;
        }}
        onMouseOut={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            event.currentTarget.style.boxShadow = '';
          }
        }}
      >
        {/* Image */}
        <div className="relative h-[120px] w-[38%] shrink-0 overflow-hidden md:h-52 md:w-full lg:h-56">
          {service.image ? (
            <img
              src={service.image}
              alt={service.title}
              loading="lazy"
              className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${service.imagePos || 'object-center'}`}
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${service.chip} opacity-80`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />

          {/* Icon chip */}
          <div className={`absolute right-3 top-3 z-20 rounded-xl bg-gradient-to-br ${service.chip} p-2 text-white shadow-lg md:right-4 md:top-4 md:p-2.5`}>
            <service.icon className="h-4 w-4 md:h-5 md:w-5" />
          </div>
        </div>

        {/* Copy */}
        <div className="relative z-10 flex flex-1 flex-col justify-between p-4 md:p-5">
          <div>
            <h3 className="text-[15px] font-black tracking-tight text-slate-900 md:text-lg">{service.title}</h3>
            <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500 md:mt-2 md:line-clamp-3 md:text-[13px]">
              {service.description}
            </p>
          </div>
          <div className={`mt-3 flex items-center gap-1 text-xs font-black md:mt-4 md:text-sm ${service.textColor}`}>
            {service.ctaText || 'Explore'}
            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5 md:h-4 md:w-4" />
          </div>
        </div>

        {/* Cursor spotlight */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: 'radial-gradient(420px circle at var(--mx) var(--my), rgba(255,255,255,0.35), transparent 55%)' }}
        />
        {/* Accent border sheen */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[24px] opacity-0 ring-1 ring-inset transition-opacity duration-500 group-hover:opacity-100 md:rounded-[28px]"
          style={{ '--tw-ring-color': service.glow }}
        />
      </motion.div>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Phone: swipeable card stack. The top card can be flung left or right; it
// flies off and goes to the back of the deck, so the deck loops forever.
// ---------------------------------------------------------------------------

const DECK_CARD_H = 298;
const DECK_STEP_Y = 20; // how far each card behind peeks out
const DECK_FAN = [0, -4, 4]; // cards behind fan out like a held hand of cards
const DECK_VISIBLE = 3;
const SWIPE_DIST = 100;
const SWIPE_VEL = 500;
const NUDGE_KEY = 'svcDeckNudgeSeen';

// Entrance: on first load the cards are "dealt" in one by one, back card
// first, each dropping in from below with a little tilt and settling with a
// springy bounce. Cards that join the back of the deck later just fade in.
const DEAL_TILT = [-7, 6, -4];
const DEAL_START = 0.25;
const DEAL_GAP = 0.16;

const entranceFor = (dealIndex, depth, reduceMotion) => {
  if (reduceMotion) return { initial: { opacity: 0 }, transition: { duration: 0.3, delay: dealIndex == null ? 0 : 0.1 } };
  if (dealIndex == null) {
    return {
      initial: { opacity: 0, scale: 0.92, y: 10 },
      transition: { type: 'spring', stiffness: 220, damping: 24 },
    };
  }
  return {
    initial: { opacity: 0, y: 320, scale: 0.86, rotate: DEAL_TILT[depth] ?? 0 },
    transition: {
      delay: DEAL_START + dealIndex * DEAL_GAP,
      type: 'spring',
      stiffness: 170,
      damping: 15,
      mass: 0.9,
      opacity: { duration: 0.25, delay: DEAL_START + dealIndex * DEAL_GAP },
    },
  };
};

const DeckCard = ({ service, depth, isTop, locked, onThrown, onOpen, reduceMotion, throwSignal, nudge, dealIndex }) => {
  // captured once at mount -- later renders must not replay the entrance
  const [entrance] = useState(() => entranceFor(dealIndex, depth, reduceMotion));
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], reduceMotion ? [0, 0] : [-12, 12]);
  const fade = useTransform(x, [-300, -140, 0, 140, 300], [0, 1, 1, 1, 0]);
  const didDrag = useRef(false);
  const throwing = useRef(false);

  // a card that went to the back of the deck comes back centred
  useEffect(() => {
    if (!isTop) {
      x.set(0);
      throwing.current = false;
    }
  }, [isTop, x]);

  const throwCard = async (dir) => {
    if (throwing.current) return;
    throwing.current = true;
    try { navigator.vibrate?.(10); } catch { /* not supported */ }
    await animate(x, dir * (window.innerWidth + 120), reduceMotion
      ? { duration: 0.15 }
      : { duration: 0.28, ease: [0.4, 0, 1, 1] });
    onThrown();
  };

  // keyboard / external throws
  useEffect(() => {
    if (isTop && throwSignal) throwCard(throwSignal.dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [throwSignal]);

  // one-time "you can swipe this" wiggle
  useEffect(() => {
    if (!isTop || !nudge || reduceMotion) return undefined;
    const t = setTimeout(async () => {
      await animate(x, -36, { duration: 0.35, ease: 'easeOut' });
      await animate(x, 0, { type: 'spring', stiffness: 300, damping: 14 });
    }, 1900); // after the deck has finished dealing in
    return () => clearTimeout(t);
  }, [isTop, nudge, reduceMotion, x]);

  const handleDragEnd = (_e, info) => {
    const { offset, velocity } = info;
    if (Math.abs(offset.x) > SWIPE_DIST || Math.abs(velocity.x) > SWIPE_VEL) {
      throwCard(Math.sign(offset.x || velocity.x) || 1);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  };

  return (
    <motion.div
      className="absolute inset-x-0 top-0 touch-pan-y select-none"
      style={{ x, rotate, opacity: isTop ? fade : 1, zIndex: DECK_VISIBLE - depth, height: DECK_CARD_H }}
      initial={false}
      animate={{ scale: 1 - depth * 0.06, y: depth * DECK_STEP_Y, rotateZ: reduceMotion ? 0 : DECK_FAN[depth] ?? 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      drag={isTop && !locked ? 'x' : false}
      dragMomentum={false}
      onPointerDown={() => { didDrag.current = false; if (isTop) preloadRoute(service.path); }}
      onDragStart={() => { didDrag.current = true; }}
      onDragEnd={handleDragEnd}
      onClick={() => { if (isTop && !didDrag.current) onOpen(); }}
      aria-hidden={!isTop}
    >
      <motion.div
        initial={entrance.initial}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
        transition={entrance.transition}
        className={`flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100/60 bg-white shadow-[0_15px_40px_-10px_rgba(0,0,0,0.12)] ${isTop ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        {/* Image, melting into the white card body */}
        <div className="relative h-[152px] w-full shrink-0 overflow-hidden">
          {service.image ? (
            <img
              src={service.image}
              alt={service.title}
              draggable={false}
              className={`pointer-events-none h-full w-full object-cover ${service.imagePos || 'object-center'}`}
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${service.chip} opacity-80`} />
          )}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent" />

          {/* Pill, top right */}
          <div className={`absolute right-4 top-4 flex items-center gap-1 rounded-full border border-slate-900/5 bg-white/95 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wide shadow-sm backdrop-blur-md ${service.textColor}`}>
            {service.ctaText || 'Explore'}
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-grow flex-col px-6 pb-5 pt-1 text-left">
          <h3 className="mb-3 text-2xl font-black tracking-tight text-slate-800">{service.title}</h3>
          <div className="mb-3 w-full border-t border-slate-100" />
          <div className="flex items-start gap-3 text-sm font-medium text-slate-500">
            <div className={`relative mt-[-2px] shrink-0 rounded-xl p-2 ${service.textColor}`}>
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${service.chip} opacity-[0.14]`} />
              <service.icon className="relative h-4 w-4" />
            </div>
            <p className="line-clamp-2 leading-relaxed">{service.description}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const SwipeDeck = ({ services, onOpen, reduceMotion, banners = [] }) => {
  const [order, setOrder] = useState(() => services.map((_, i) => i));
  const [throwSignal, setThrowSignal] = useState(null);
  const [nudge, setNudge] = useState(() => {
    try { return !localStorage.getItem(NUDGE_KEY); } catch { return false; }
  });

  // CMS data loads async -- reset the deck when the list changes
  const idsKey = services.map((s) => s.id).join('|');
  useEffect(() => {
    setOrder(services.map((_, i) => i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  useEffect(() => {
    try { localStorage.setItem(NUDGE_KEY, '1'); } catch { /* storage blocked */ }
  }, []);

  // while true, newly mounted cards are dealt in; afterwards they just fade in
  const [dealing, setDealing] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setDealing(false), (DEAL_START + DECK_VISIBLE * DEAL_GAP + 0.9) * 1000);
    return () => clearTimeout(t);
  }, []);
  const dealDone = DEAL_START + (DECK_VISIBLE - 1) * DEAL_GAP + 0.35;

  // Preload page code so a tap opens instantly: the top card's page as soon
  // as it is on top, everything else once the home screen has settled.
  const topPath = services[order[0]]?.path;
  useEffect(() => { preloadRoute(topPath); }, [topPath]);
  useEffect(() => {
    const t = setTimeout(() => services.forEach((s) => preloadRoute(s.path)), 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // keep the active thumbnail centred in the slider below the stack
  const stripRef = useRef(null);
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.querySelector(`[data-thumb="${order[0]}"]`);
    if (!strip || !thumb) return;
    const left = thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [order, reduceMotion]);

  if (!services.length) return null;

  const single = services.length === 1;
  const activeIdx = order[0] ?? 0;
  const advance = () => {
    setThrowSignal(null); // don't let the next top card inherit the throw
    setNudge(false);
    setOrder((o) => [...o.slice(1), o[0]]);
  };
  const jumpTo = (idx) => {
    setNudge(false);
    setOrder(services.map((_, i) => (idx + i) % services.length));
  };

  const handleKeyDown = (e) => {
    if (single) return;
    if (e.key === 'ArrowLeft') setThrowSignal({ dir: -1, n: Date.now() });
    if (e.key === 'ArrowRight') setThrowSignal({ dir: 1, n: Date.now() });
    if (e.key === 'Enter') onOpen(services[activeIdx]);
  };

  const visible = order.slice(0, DECK_VISIBLE);

  return (
    <div>
      <div
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${services[activeIdx]?.title}, ${activeIdx + 1} of ${services.length}. Use arrow keys to browse.`}
        onKeyDown={handleKeyDown}
        className="relative mx-3 mt-3 outline-none"
        // + a little extra so the fanned (rotated) back cards don't touch the slider
        style={{ height: DECK_CARD_H + DECK_STEP_Y * (Math.min(services.length, DECK_VISIBLE) - 1) + 8 }}
      >
        {/* render back-to-front so the top card is last in the DOM */}
        {[...visible].reverse().map((idx) => {
          const depth = visible.indexOf(idx);
          return (
            <DeckCard
              key={services[idx].id}
              service={services[idx]}
              depth={depth}
              isTop={depth === 0}
              locked={single}
              onThrown={advance}
              onOpen={() => onOpen(services[idx])}
              reduceMotion={reduceMotion}
              throwSignal={depth === 0 ? throwSignal : null}
              nudge={nudge && !single}
              dealIndex={dealing ? visible.length - 1 - depth : null}
            />
          );
        })}
      </div>

      {!single && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : dealDone, duration: 0.4 }}
          className="mt-2"
        >
          {/* Thumbnail slider: scroll sideways, tap one to bring that card to the top */}
          <div ref={stripRef} className="no-scrollbar overflow-x-auto py-1">
            <div className="mx-auto flex w-max items-start gap-3.5 px-3">
              {services.map((s, i) => {
                const active = i === activeIdx;
                return (
                  <button
                    key={s.id}
                    type="button"
                    data-thumb={i}
                    aria-label={`Show ${s.title}`}
                    aria-current={active}
                    onClick={() => jumpTo(i)}
                    className={`flex w-14 flex-col items-center gap-1 ${s.textColor}`}
                  >
                    <motion.span
                      animate={{ scale: active ? 1.08 : 1, opacity: active ? 1 : 0.65 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                      className={`relative block h-11 w-11 overflow-hidden rounded-full ring-offset-2 ring-offset-[#F7F9FB] ${active ? 'ring-2 ring-current shadow-md' : 'ring-1 ring-slate-200'}`}
                    >
                      {s.image ? (
                        <img src={s.image} alt="" loading="lazy" className={`h-full w-full object-cover ${s.imagePos || 'object-center'}`} />
                      ) : (
                        <span className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${s.chip} text-white`}>
                          <s.icon className="h-5 w-5" />
                        </span>
                      )}
                    </motion.span>
                    <span className={`w-full truncate text-center text-[10px] font-bold ${active ? '' : 'text-slate-400'}`}>
                      {s.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {banners.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : dealDone + 0.15, duration: 0.4 }}
          className="mx-3 mt-2"
        >
          <PromoBanners banners={banners} reduceMotion={reduceMotion} onOpen={(b) => onOpen({ path: b.link })} />
        </motion.div>
      )}
    </div>
  );
};

const SuperAppDashboard = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { services, settings: homeText, banners } = useAppServices();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // pointer parallax for the aurora blobs -- each layer drifts a different
  // amount, which is what sells the depth
  const pointerX = useSpring(useMotionValue(0), { stiffness: 40, damping: 20 });
  const pointerY = useSpring(useMotionValue(0), { stiffness: 40, damping: 20 });

  const handlePointerMove = (event) => {
    if (reduceMotion) return;
    pointerX.set(event.clientX / window.innerWidth - 0.5);
    pointerY.set(event.clientY / window.innerHeight - 0.5);
  };

  const handleLogout = () => {
    clearAllAuth();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const openService = (service) => (
    /^https?:\/\//i.test(service.path) ? window.location.assign(service.path) : navigate(service.path)
  );

  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <div
      onMouseMove={handlePointerMove}
      className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-[#F7F9FB] px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-20 md:flex md:flex-col md:items-center md:justify-center md:p-8 md:pt-8"
    >
      {/* Aurora background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          style={{ x: pointerX, y: pointerY }}
          transition={{ type: 'spring' }}
          className="absolute inset-0"
        >
          <motion.div
            animate={reduceMotion ? undefined : { x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
            transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-32 left-[8%] h-[420px] w-[420px] rounded-full bg-emerald-200/40 blur-[110px]"
          />
          <motion.div
            animate={reduceMotion ? undefined : { x: [0, -50, 30, 0], y: [0, 25, -25, 0] }}
            transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute right-[5%] top-[18%] h-[380px] w-[380px] rounded-full bg-sky-200/40 blur-[110px]"
          />
          <motion.div
            animate={reduceMotion ? undefined : { x: [0, 30, -40, 0], y: [0, -20, 30, 0] }}
            transition={{ duration: 29, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-[-10%] left-[35%] h-[420px] w-[420px] rounded-full bg-rose-200/30 blur-[120px]"
          />
        </motion.div>
        {/* Fine grid, fades out towards the bottom */}
        <div
          className="absolute inset-0 opacity-[0.35] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(15,23,42,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.045) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col pb-2 md:h-full md:min-h-0 md:flex-none md:pb-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 16 }}
          className="relative mb-6 w-full overflow-hidden rounded-[24px] border border-white/70 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.12)] md:mb-10 md:rounded-[28px]"
        >
          {/* Drawn dawn scene: sky, sun, mountain silhouettes, drifting flock */}
          <div aria-hidden className="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#e3f1fd_0%,#fdeee0_52%,#fbdcc6_100%)]" />
            {/* sun */}
            <div className="absolute bottom-[-34px] left-[58%] h-28 w-28 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#fffdf4_28%,rgba(255,244,214,0.85)_45%,transparent_72%)]" />
            {/* mountain ranges, back to front */}
            <svg viewBox="0 0 1200 150" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[58%] w-full">
              <path d="M0 150 L0 96 L110 62 L215 98 L330 52 L455 104 L560 68 L690 110 L800 60 L920 102 L1030 72 L1130 98 L1200 80 L1200 150 Z" fill="#a8c3dd" opacity="0.55" />
              <path d="M0 150 L0 118 L90 92 L200 122 L320 84 L430 124 L555 96 L670 128 L790 92 L900 124 L1020 100 L1120 126 L1200 108 L1200 150 Z" fill="#8fb0d1" opacity="0.65" />
              <path d="M0 150 L0 136 L140 116 L280 140 L420 118 L560 142 L700 120 L840 142 L980 124 L1110 142 L1200 130 L1200 150 Z" fill="#7ba1c7" opacity="0.7" />
            </svg>
            {/* soft haze so the copy stays readable on the left */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/75 via-white/30 to-transparent" />
            <BirdFlock />
          </div>

          <div className="relative z-10 flex w-full items-center justify-between gap-4 p-4 md:px-7 md:py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-xl font-semibold text-white shadow-lg shadow-emerald-900/10 md:h-14 md:w-14 md:rounded-[20px] md:text-2xl">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600 md:text-xs">
                <Sparkles size={12} /> {getGreeting()}
              </p>
              <h1 className="mt-0.5 text-2xl font-black tracking-tight text-slate-900 md:text-[2rem]">
                Hi, {firstName}! <span className="inline-block origin-[70%_70%] animate-[wave_2.4s_ease-in-out_1]">👋</span>
              </h1>
              <p className="text-[13px] font-medium text-slate-500 md:text-sm">{homeText.greetingSubtitle}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="hidden cursor-pointer items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 shadow-sm shadow-red-100/50 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-600 hover:text-white hover:shadow-red-200/50 active:scale-95 md:flex"
          >
            <LogOut size={16} />
            Logout
          </button>
          </div>
        </motion.div>

        {/* Section title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 80, damping: 16 }}
          className="mb-5 flex items-center gap-2.5 md:mb-7"
        >
          <Compass className="text-surface" size={26} />
          <h2 className="text-xl font-black tracking-tight text-slate-900 md:text-[1.45rem]">{homeText.sectionTitle}</h2>
          <div className="ml-2 hidden h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent md:block" />
        </motion.div>

        {/* Cards: swipe deck on phones, grid from md up */}
        <div className="md:hidden">
          <SwipeDeck services={services} onOpen={openService} reduceMotion={reduceMotion} banners={banners} />
        </div>
        {banners.length > 0 && (
          <div className="mb-6 hidden w-full max-w-3xl md:block">
            <PromoBanners banners={banners} reduceMotion={reduceMotion} onOpen={(b) => openService({ path: b.link })} />
          </div>
        )}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ '--svc-cols': Math.min(Math.max(services.length, 1), 5) }}
          className="hidden md:grid md:grid-cols-2 md:gap-6 xl:[grid-template-columns:repeat(var(--svc-cols),minmax(0,1fr))]"
        >
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              reduceMotion={reduceMotion}
              onClick={() => openService(service)}
            />
          ))}
        </motion.div>
      </div>

      {/* Wave keyframes for the greeting emoji */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(18deg); }
          30% { transform: rotate(-8deg); }
          45% { transform: rotate(14deg); }
          60% { transform: rotate(-4deg); }
          75% { transform: rotate(8deg); }
        }
      `}</style>
    </div>
  );
};

export default SuperAppDashboard;
