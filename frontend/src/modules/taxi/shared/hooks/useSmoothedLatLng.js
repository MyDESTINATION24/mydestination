import { useEffect, useRef, useState } from 'react';

// Live driver positions arrive from the socket every few seconds, so binding a
// marker straight to them makes it teleport. This tweens between the last
// rendered point and the newest one so the vehicle glides instead.

const TWEEN_MS = 1000;

// Beyond this a tween reads as the car sliding across the map rather than
// driving, so snap: it means a GPS jump, a reroute, or a resumed session.
const SNAP_DISTANCE_DEG = 0.01; // ~1.1km

const shortestHeadingDelta = (from, to) => ((((to - from) % 360) + 540) % 360) - 180;

const prefersReducedMotion = () =>
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isFiniteLatLng = (value) =>
  Boolean(value) && Number.isFinite(Number(value.lat)) && Number.isFinite(Number(value.lng));

export const useSmoothedLatLng = (target, targetHeading = 0, durationMs = TWEEN_MS) => {
  const [rendered, setRendered] = useState(() => (isFiniteLatLng(target) ? target : null));
  const [renderedHeading, setRenderedHeading] = useState(() => Number(targetHeading) || 0);

  // Latest rendered values, read inside the rAF loop without re-subscribing.
  // Written only from commit() below -- never during render, which React
  // forbids and which breaks under StrictMode's double invocation.
  const currentRef = useRef(rendered);
  const currentHeadingRef = useRef(renderedHeading);
  const frameRef = useRef(0);

  const commit = (position, headingValue) => {
    currentRef.current = position;
    currentHeadingRef.current = headingValue;
    setRendered(position);
    setRenderedHeading(headingValue);
  };

  const targetLat = isFiniteLatLng(target) ? Number(target.lat) : null;
  const targetLng = isFiniteLatLng(target) ? Number(target.lng) : null;
  const nextHeading = Number.isFinite(Number(targetHeading)) ? Number(targetHeading) : 0;

  useEffect(() => {
    if (targetLat === null || targetLng === null) {
      return undefined;
    }

    const from = currentRef.current;
    const fromHeading = currentHeadingRef.current;

    // First fix, a teleport, or reduced motion: land on it immediately.
    const jumped = from
      && (Math.abs(targetLat - from.lat) > SNAP_DISTANCE_DEG
        || Math.abs(targetLng - from.lng) > SNAP_DISTANCE_DEG);

    if (!from || jumped || prefersReducedMotion() || durationMs <= 0) {
      // Deferred a frame rather than committed inline: setState directly in an
      // effect body cascades renders. One frame is imperceptible for a snap.
      frameRef.current = requestAnimationFrame(() => {
        commit({ lat: targetLat, lng: targetLng }, nextHeading);
      });

      return () => cancelAnimationFrame(frameRef.current);
    }

    if (from.lat === targetLat && from.lng === targetLng && fromHeading === nextHeading) {
      return undefined;
    }

    const headingDelta = shortestHeadingDelta(fromHeading, nextHeading);
    const startedAt = performance.now();

    const step = (now) => {
      const elapsed = now - startedAt;
      const progress = Math.min(1, elapsed / durationMs);
      // easeOutQuad -- decelerates into the new point, which reads as a vehicle
      // settling rather than a linear slide.
      const eased = 1 - (1 - progress) * (1 - progress);

      commit(
        {
          lat: from.lat + (targetLat - from.lat) * eased,
          lng: from.lng + (targetLng - from.lng) * eased,
        },
        fromHeading + headingDelta * eased,
      );

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameRef.current);
  }, [targetLat, targetLng, nextHeading, durationMs]);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  return {
    position: rendered,
    heading: renderedHeading,
  };
};

export default useSmoothedLatLng;
