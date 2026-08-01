import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// Helicopters and light aircraft drifting across a hero.
//
// Same crossing mechanic as BirdFlock -- each craft rides a full-width rail
// and the rail is what translates, because a percentage x in framer is
// relative to the element's own width, not its container. Kept as its own
// component rather than a BirdFlock prop because the glyphs behave
// differently: rotors spin, aircraft trail a contrail, and some fly the other
// way.
//
// Renders nothing under reduced motion.

const HelicopterGlyph = ({ fill, spinDelay = 0 }) => (
  <svg viewBox="0 0 78 30" className="h-full w-full overflow-visible">
    <g fill={fill}>
      {/* tail boom + fin */}
      <path d="M10 14.6 L34 13 L34 17 Z" />
      <path d="M7 8 L12.5 8 L11.5 14.8 L8.5 14.8 Z" />
      {/* fuselage */}
      <path d="M32 8.6 C40 7.4, 52 8.4, 59 12.4 C61.4 13.8, 61.4 16.2, 59 17.6 C52 21.2, 40 21.8, 32 20.4 C28.4 18.4, 28.4 10.6, 32 8.6 Z" />
      {/* skids */}
      <rect x="33" y="24" width="24" height="1.7" rx="0.85" />
      <rect x="36" y="20" width="1.5" height="4.4" rx="0.7" />
      <rect x="52" y="20" width="1.5" height="4.4" rx="0.7" />
      {/* rotor mast */}
      <rect x="42.5" y="4.6" width="2" height="4.6" rx="0.6" />
    </g>

    {/* main rotor: the scaleX pulse reads as a disc spinning edge-on */}
    <rect
      x="14" y="3.8" width="60" height="1.8" rx="0.9" fill={fill}
      className="origin-center"
      style={{ animation: `rotorSpin 0.42s linear ${spinDelay}s infinite` }}
    />
    {/* tail rotor */}
    <rect
      x="8.4" y="4.4" width="1.7" height="9" rx="0.85" fill={fill}
      className="origin-center"
      style={{ animation: `tailSpin 0.3s linear ${spinDelay}s infinite` }}
    />
  </svg>
);

const PlaneGlyph = ({ fill }) => (
  <svg viewBox="0 0 96 26" className="h-full w-full overflow-visible">
    {/* contrail */}
    <rect x="0" y="12.2" width="34" height="1.4" rx="0.7" fill={fill} opacity="0.35" />
    <g fill={fill}>
      {/* fuselage */}
      <path d="M36 11 C48 9.6, 68 10.2, 82 12.9 C68 15.6, 48 16.2, 36 14.8 C34.4 13.9, 34.4 11.9, 36 11 Z" />
      {/* swept wing */}
      <path d="M56 12.4 L44 3 L50 3 L68 12 Z" />
      <path d="M56 13.4 L44 22.8 L50 22.8 L68 13.8 Z" />
      {/* tailplane */}
      <path d="M38 12.2 L32 6.4 L35.6 6.4 L43 11.8 Z" />
    </g>
  </svg>
);

const DEFAULT_CRAFT = [
  { kind: 'heli',  top: '16%', width: 86, opacity: 0.5,  duration: 26, delay: 0,  bob: 7 },
  { kind: 'plane', top: '8%',  width: 92, opacity: 0.32, duration: 38, delay: 9,  bob: 4 },
  { kind: 'heli',  top: '34%', width: 58, opacity: 0.35, duration: 33, delay: 17, bob: 6 },
];

const SkyTraffic = ({ craft = DEFAULT_CRAFT, tint = '255,255,255', className = '' }) => {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {craft.map((item, index) => {
        const fill = `rgba(${tint},${item.opacity})`;
        return (
          <motion.div
            key={index}
            className="absolute left-0 w-full"
            style={{ top: item.top }}
            initial={{ x: '-18%' }}
            animate={{ x: '118%' }}
            transition={{
              duration: item.duration,
              delay: item.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <motion.div
              animate={{ y: [0, -item.bob, 0, item.bob, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: item.width, height: item.width * (item.kind === 'heli' ? 0.38 : 0.27) }}
            >
              {item.kind === 'heli'
                ? <HelicopterGlyph fill={fill} spinDelay={index * 0.11} />
                : <PlaneGlyph fill={fill} />}
            </motion.div>
          </motion.div>
        );
      })}

      <style>{`
        @keyframes rotorSpin {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(0.16); }
        }
        @keyframes tailSpin {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.2); }
        }
      `}</style>
    </div>
  );
};

export default SkyTraffic;
