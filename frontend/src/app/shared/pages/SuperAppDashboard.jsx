import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Building2, Car, Heart, ChevronRight, Compass, LogOut, Helicopter, MapPin, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import chardhamImg from '@/assets/airways/kedarnath.png';
import { clearAllAuth } from '@/shared/auth/clearAllAuth';

const services = [
  {
    id: 'hotel',
    title: 'Hotels & Stays',
    description: 'Book luxury hotels, resorts, and homestays at the best prices.',
    icon: Building2,
    accent: '#059669',
    glow: 'rgba(5,150,105,0.22)',
    chip: 'from-emerald-500 to-green-600',
    textColor: 'text-emerald-600',
    path: '/hotels',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'taxi',
    title: 'Cab Booking',
    description: 'Ride safely with our verified drivers. Outstation & local cabs.',
    icon: Car,
    accent: '#d97706',
    glow: 'rgba(217,119,6,0.22)',
    chip: 'from-amber-400 to-orange-500',
    textColor: 'text-amber-600',
    path: '/taxi/user',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'wedding',
    title: 'Wedding Planner',
    description: 'Plan your dream destination wedding with top vendors & venues.',
    icon: Heart,
    accent: '#e11d48',
    glow: 'rgba(225,29,72,0.20)',
    chip: 'from-pink-500 to-rose-500',
    textColor: 'text-rose-600',
    path: '/wedding',
    image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'helicopter',
    title: 'Helicopter Booking',
    description: 'Book premium helicopter travel & spiritual tours to holy shrines.',
    icon: Helicopter,
    accent: '#0284c7',
    glow: 'rgba(2,132,199,0.22)',
    chip: 'from-sky-500 to-cyan-600',
    textColor: 'text-sky-600',
    path: '/taxi/user/airways',
    image: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'chardham',
    title: 'Char Dham Yatra',
    description: 'Spiritual pilgrim tour packages to Yamunotri, Gangotri, Kedarnath, and Badrinath.',
    icon: MapPin,
    accent: '#ea580c',
    glow: 'rgba(234,88,12,0.22)',
    chip: 'from-orange-500 to-amber-600',
    textColor: 'text-orange-600',
    path: '/taxi/user/tours',
    image: chardhamImg,
    imagePos: 'object-bottom'
  }
];

// Small flock drifting across the background. Each bird is a stroked
// seagull glyph: the whole bird crosses the viewport on a long linear loop
// with a gentle vertical bob, while the glyph itself flaps via a scaleY
// keyframe. Skipped entirely under reduced motion.
const BIRDS = [
  { top: '18%', scale: 1,    duration: 34, delay: 0,  bob: 8 },
  { top: '34%', scale: 0.7,  duration: 42, delay: 6,  bob: 6 },
  { top: '12%', scale: 0.55, duration: 48, delay: 13, bob: 5 },
  { top: '46%', scale: 0.8,  duration: 38, delay: 20, bob: 7 },
  { top: '26%', scale: 0.45, duration: 54, delay: 28, bob: 4 },
];

const BirdGlyph = ({ flapDelay = 0 }) => (
  <svg
    viewBox="0 0 24 12"
    className="h-full w-full"
    style={{ animation: `flap 0.9s ease-in-out ${flapDelay}s infinite` }}
  >
    <path
      d="M2 8 C5 3, 8 3, 12 7 C16 3, 19 3, 22 8"
      fill="none"
      stroke="rgba(71,85,105,0.4)"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const Birds = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
    {BIRDS.map((bird, index) => (
      <motion.div
        key={index}
        initial={{ x: '-6vw' }}
        animate={{ x: '106vw', y: [0, -bird.bob, 0, bird.bob, 0] }}
        transition={{
          x: { duration: bird.duration, delay: bird.delay, repeat: Infinity, ease: 'linear' },
          y: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="absolute"
        style={{ top: bird.top, width: 26 * bird.scale, height: 13 * bird.scale }}
      >
        <BirdGlyph flapDelay={index * 0.22} />
      </motion.div>
    ))}
  </div>
);

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
const ServiceCard = ({ service, onClick, reduceMotion }) => {
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
          <img
            src={service.image}
            alt={service.title}
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${service.imagePos || 'object-center'}`}
          />
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
            Explore
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

const SuperAppDashboard = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
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
            {!reduceMotion && <Birds />}
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
              <p className="text-[13px] font-medium text-slate-500 md:text-sm">What are you looking for today?</p>
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
          <h2 className="text-xl font-black tracking-tight text-slate-900 md:text-[1.45rem]">Explore Services</h2>
          <div className="ml-2 hidden h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent md:block" />
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-6 xl:grid-cols-5"
        >
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              reduceMotion={reduceMotion}
              onClick={() => navigate(service.path)}
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
        @keyframes flap {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.45); }
        }
      `}</style>
    </div>
  );
};

export default SuperAppDashboard;
