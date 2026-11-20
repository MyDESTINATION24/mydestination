import React, { useEffect, useRef, useState } from 'react';

// Slim promo / ad banners (managed in CMS Admin -> App Services -> Banners).
// Swipe sideways with native scroll-snap; auto-advances every few seconds and
// pauses for a while after the user touches it. Renders nothing when empty.

const AUTO_MS = 4000;
const PAUSE_AFTER_TOUCH_MS = 7000;

const PromoBanners = ({ banners = [], onOpen, reduceMotion = false, className = '' }) => {
  const scrollerRef = useRef(null);
  const indexRef = useRef(0);
  const pausedUntil = useRef(0);
  const [index, setIndex] = useState(0);
  const count = banners.length;

  const animRef = useRef(0);
  const fallbackRef = useRef(0);

  const stopAnim = () => {
    cancelAnimationFrame(animRef.current);
    clearTimeout(fallbackRef.current);
    if (scrollerRef.current) scrollerRef.current.style.scrollSnapType = '';
  };

  // Native smooth scrollTo is unreliable on scroll-snap containers (some
  // Chromium builds just don't move), so ease scrollLeft by hand with snapping
  // switched off for the duration.
  const goTo = (i, smooth = true) => {
    const el = scrollerRef.current;
    if (!el) return;
    const target = i * el.clientWidth;
    stopAnim();
    // track the slide ourselves too: scroll events can lag when frames are throttled
    indexRef.current = i;
    setIndex(i);
    if (!smooth || reduceMotion) { el.scrollLeft = target; return; }
    const from = el.scrollLeft;
    const dist = target - from;
    const start = performance.now();
    el.style.scrollSnapType = 'none';
    const step = (now) => {
      const p = Math.min(1, (now - start) / 450);
      el.scrollLeft = from + dist * (1 - (1 - p) ** 3);
      if (p < 1) animRef.current = requestAnimationFrame(step);
      else stopAnim();
    };
    animRef.current = requestAnimationFrame(step);
    // if frames are throttled (background webview, battery saver), just land on it
    fallbackRef.current = setTimeout(() => { stopAnim(); el.scrollLeft = target; }, 900);
  };

  useEffect(() => () => { cancelAnimationFrame(animRef.current); clearTimeout(fallbackRef.current); }, []);

  // auto-advance
  useEffect(() => {
    if (count < 2 || reduceMotion) return undefined;
    const id = setInterval(() => {
      if (Date.now() < pausedUntil.current || document.hidden) return;
      goTo((indexRef.current + 1) % count);
    }, AUTO_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, reduceMotion]);

  // list changed (CMS edit) -- back to the first banner
  useEffect(() => {
    indexRef.current = 0;
    setIndex(0);
    goTo(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  if (!count) return null;

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== indexRef.current) {
      indexRef.current = i;
      setIndex(i);
    }
  };

  // a touch takes over from any running auto-slide
  const pause = () => { pausedUntil.current = Date.now() + PAUSE_AFTER_TOUCH_MS; stopAnim(); };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_-10px_rgba(15,23,42,0.25)] ring-1 ring-slate-900/5 ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Offers"
    >
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onPointerDown={pause}
        onTouchStart={pause}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {banners.map((banner, i) => {
          const inner = (
            <>
              <img
                src={banner.image}
                alt={banner.title || 'Offer'}
                loading={i === 0 ? 'eager' : 'lazy'}
                draggable={false}
                className="h-full w-full object-cover"
              />
              {banner.isAd && (
                <span className="absolute left-2 top-2 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  Ad
                </span>
              )}
            </>
          );
          const cls = 'relative block aspect-[4/1] w-full shrink-0 snap-center';
          return banner.link ? (
            <button
              key={banner._id || i}
              type="button"
              aria-label={banner.title || 'Open offer'}
              onClick={() => onOpen?.(banner)}
              className={cls}
            >
              {inner}
            </button>
          ) : (
            <div key={banner._id || i} className={cls}>{inner}</div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-1.5 flex justify-center gap-1">
          {banners.map((b, i) => (
            <span
              key={b._id || i}
              className={`h-1.5 rounded-full bg-white shadow transition-all duration-300 ${i === index ? 'w-4 opacity-100' : 'w-1.5 opacity-60'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PromoBanners;
