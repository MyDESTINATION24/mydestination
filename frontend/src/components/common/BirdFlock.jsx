import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// A flock drifting across whatever container it is dropped into.
//
// The glyph is a filled silhouette rather than a stroked path: a hairline
// stroke scaled down to bird size renders as a grey smudge. Wings taper to
// points and the body has thickness, so the shape still reads at ~26px wide.
//
// Each bird crosses on its own long linear loop with a vertical bob, and the
// glyph flaps via a scaleY keyframe at a slightly different speed per bird so
// the flock never beats in unison. Renders nothing under reduced motion.

const DEFAULT_BIRDS = [
  { top: '16%', width: 46, opacity: 0.5,  duration: 30, delay: 0,  bob: 9, flap: 0.85 },
  { top: '30%', width: 34, opacity: 0.4,  duration: 38, delay: 5,  bob: 7, flap: 1.05 },
  { top: '11%', width: 26, opacity: 0.3,  duration: 46, delay: 12, bob: 5, flap: 1.25 },
  { top: '42%', width: 38, opacity: 0.42, duration: 34, delay: 19, bob: 8, flap: 0.95 },
];

const BIRD_PATH =
  'M20 12.6 C16.4 6.2, 11.2 2.4, 4.2 1.8 C9.4 4.6, 13.6 8.4, 16.6 13.4 ' +
  'C17.8 15.1, 18.9 15.6, 20 15.6 C21.1 15.6, 22.2 15.1, 23.4 13.4 ' +
  'C26.4 8.4, 30.6 4.6, 35.8 1.8 C28.8 2.4, 23.6 6.2, 20 12.6 Z';

const BirdGlyph = ({ opacity, flapSpeed, flapDelay, tint }) => (
  <svg
    viewBox="0 0 40 16"
    className="h-full w-full origin-center"
    style={{ animation: `birdflap ${flapSpeed}s ease-in-out ${flapDelay}s infinite` }}
  >
    <path d={BIRD_PATH} fill={`rgba(${tint},${opacity})`} />
  </svg>
);

const BirdFlock = ({ birds = DEFAULT_BIRDS, tint = '51,65,85', className = '' }) => {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {birds.map((bird, index) => (
        <motion.div
          key={index}
          className="absolute left-0 w-full"
          style={{ top: bird.top }}
          initial={{ x: '-12%' }}
          animate={{ x: '112%' }}
          transition={{
            duration: bird.duration,
            delay: bird.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <motion.div
            animate={{ y: [0, -bird.bob, 0, bird.bob, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: bird.width, height: bird.width * 0.4 }}
          >
            <BirdGlyph opacity={bird.opacity} flapSpeed={bird.flap} flapDelay={index * 0.3} tint={tint} />
          </motion.div>
        </motion.div>
      ))}

      <style>{`
        @keyframes birdflap {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.62); }
        }
      `}</style>
    </div>
  );
};

export default BirdFlock;
