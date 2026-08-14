import { useEffect, useRef, useState } from 'react';
import { distanceMeters, findNearestOnPath } from '../utils/routePath';

// Live driver positions arrive from the socket every few seconds, so binding a
// marker straight to them makes it teleport. This tweens between the last
// rendered point and the newest one so the vehicle glides instead.

// Fallback tween length used until we have measured the real gap between fixes.
const DEFAULT_TWEEN_MS = 2000;

// A tween shorter than this stutters; longer than this and the marker lags so
// far behind the car that it feels broken. Real fixes land inside this range.
const MIN_TWEEN_MS = 700;
const MAX_TWEEN_MS = 6000;

// Straight-line interpolation is only honest over the distance a car covers
// between two normal fixes. Past this the line cuts corners and drives through
// buildings, so we either follow the road or snap.
const MAX_LERP_METERS = 60;

// When the socket stalls and the driver has moved on, catching up along the
// route is what reads as "drove there". Beyond this the catch-up would be a
// long animation of stale history, so it is better to just be correct.
const MAX_CATCHUP_METERS = 600;

// Catch-up is a replay, not live movement -- run it briskly and at a fixed
// length so a 60 second stall does not become a 60 second animation.
const CATCHUP_MS = 1400;

const shortestHeadingDelta = (from, to) => ((((to - from) % 360) + 540) % 360) - 180;

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

const bearingBetween = (from, to) => {
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isFiniteLatLng = (value) =>
  Boolean(value) && Number.isFinite(Number(value.lat)) && Number.isFinite(Number(value.lng));

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// The stretch of route actually between the two points, so the marker can drive
// it rather than cut across. Returns null when the route cannot explain the
// move -- a reroute, or travel backwards along the line -- and the caller snaps.
const buildRouteLeg = (from, to, path) => {
  if (!Array.isArray(path) || path.length < 2) {
    return null;
  }

  const start = findNearestOnPath(path, from);
  const end = findNearestOnPath(path, to);

  if (!start || !end || end.index < start.index) {
    return null;
  }

  const points = [from, ...path.slice(start.index + 1, end.index + 1), to];
  const legs = [];
  let total = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const spanMeters = distanceMeters(points[index], points[index + 1]);

    if (spanMeters <= 0) {
      continue;
    }

    legs.push({
      from: points[index],
      to: points[index + 1],
      spanMeters,
      startMeters: total,
      heading: bearingBetween(points[index], points[index + 1]),
    });

    total += spanMeters;
  }

  return legs.length ? { legs, totalMeters: total } : null;
};

// Position and heading at a given distance along the leg set -- constant speed,
// and the nose always pointing down the piece of road being driven.
const sampleRouteLeg = ({ legs, totalMeters }, progress) => {
  const travelled = totalMeters * progress;
  let leg = legs[legs.length - 1];

  for (const candidate of legs) {
    if (travelled <= candidate.startMeters + candidate.spanMeters) {
      leg = candidate;
      break;
    }
  }

  const localProgress = clamp((travelled - leg.startMeters) / leg.spanMeters, 0, 1);

  return {
    position: {
      lat: leg.from.lat + (leg.to.lat - leg.from.lat) * localProgress,
      lng: leg.from.lng + (leg.to.lng - leg.from.lng) * localProgress,
    },
    heading: leg.heading,
  };
};

export const useSmoothedLatLng = (target, targetHeading = 0, options = {}) => {
  const { path = null, durationMs = null } = options;

  const [rendered, setRendered] = useState(() => (isFiniteLatLng(target) ? target : null));
  const [renderedHeading, setRenderedHeading] = useState(() => Number(targetHeading) || 0);

  // Latest rendered values, read inside the rAF loop without re-subscribing.
  // Written only from commit() below -- never during render, which React
  // forbids and which breaks under StrictMode's double invocation.
  const currentRef = useRef(rendered);
  const currentHeadingRef = useRef(renderedHeading);
  const frameRef = useRef(0);

  // Read inside the tween without making the route a dependency; the array
  // identity changes on every fix and would restart the animation each time.
  const pathRef = useRef(path);

  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  // When the previous fix landed, so the next tween can be stretched to match
  // the real update cadence.
  const lastFixAtRef = useRef(0);
  const tweenMsRef = useRef(DEFAULT_TWEEN_MS);

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
    const to = { lat: targetLat, lng: targetLng };

    // Stretch the tween to however long fixes actually take to arrive. A fixed
    // 1s tween against 4s fixes made the marker sprint then freeze for 3s --
    // which reads as slow, stuttering movement rather than driving.
    const now = performance.now();
    if (lastFixAtRef.current) {
      tweenMsRef.current = clamp(now - lastFixAtRef.current, MIN_TWEEN_MS, MAX_TWEEN_MS);
    }
    lastFixAtRef.current = now;

    const snapTo = () => {
      // Deferred a frame rather than committed inline: setState directly in an
      // effect body cascades renders. One frame is imperceptible for a snap.
      frameRef.current = requestAnimationFrame(() => commit(to, nextHeading));
      return () => cancelAnimationFrame(frameRef.current);
    };

    if (!from || prefersReducedMotion()) {
      return snapTo();
    }

    if (from.lat === targetLat && from.lng === targetLng && fromHeading === nextHeading) {
      return undefined;
    }

    const gapMeters = distanceMeters(from, to);

    // The socket stalled and the car has genuinely moved on. Straight-lining
    // this is the "sliding sideways across the map" artefact; drive the route
    // between the two points instead, nose pointing where it is going.
    let routeLeg = null;

    if (gapMeters > MAX_LERP_METERS && gapMeters <= MAX_CATCHUP_METERS) {
      routeLeg = buildRouteLeg(from, to, pathRef.current);
    }

    // Too far to be worth replaying, or the route cannot explain the move
    // (reroute, GPS jump, resumed session): be correct rather than pretty.
    if (!routeLeg && gapMeters > MAX_LERP_METERS) {
      return snapTo();
    }

    const tweenMs = durationMs ?? (routeLeg ? CATCHUP_MS : tweenMsRef.current);

    if (tweenMs <= 0) {
      return snapTo();
    }

    const headingDelta = shortestHeadingDelta(fromHeading, nextHeading);
    const startedAt = performance.now();

    const step = (frameNow) => {
      const progress = Math.min(1, (frameNow - startedAt) / tweenMs);

      if (routeLeg) {
        // Heading comes from the road being driven, so the vehicle turns
        // through the corners instead of holding one bearing across them.
        const sample = sampleRouteLeg(routeLeg, progress);
        commit(sample.position, progress === 1 ? nextHeading : sample.heading);
      } else {
        // Linear, deliberately. A vehicle does not stop at each GPS fix, so
        // easing out at every one of them makes it visibly lurch and settle
        // between points. Uber/Ola read as smooth because travel between fixes
        // is constant speed. Heading still eases, since turning does decelerate.
        const easedHeading = 1 - (1 - progress) * (1 - progress);

        commit(
          {
            lat: from.lat + (targetLat - from.lat) * progress,
            lng: from.lng + (targetLng - from.lng) * progress,
          },
          fromHeading + headingDelta * easedHeading,
        );
      }

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
