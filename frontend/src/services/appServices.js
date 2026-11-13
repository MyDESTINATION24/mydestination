import { useEffect, useState } from 'react';
import axios from 'axios';
import { Building2, Car, Heart, Helicopter, MapPin, Compass, Sparkles, Plane, Mountain, Bus } from 'lucide-react';
import chardhamImg from '@/assets/airways/kedarnath.png';
import { API_BASE_URL } from '../shared/api/runtimeConfig';

// "Explore Services" cards on the app home screen, managed in
// CMS Admin -> App Services. Colours and icons are presets so every card stays
// readable; the app and the CMS preview both build cards from these.

export const SERVICE_THEMES = {
  emerald: { label: 'Green', chip: 'from-emerald-500 to-green-600', textColor: 'text-emerald-600', glow: 'rgba(5,150,105,0.22)' },
  amber: { label: 'Amber', chip: 'from-amber-400 to-orange-500', textColor: 'text-amber-600', glow: 'rgba(217,119,6,0.22)' },
  rose: { label: 'Pink', chip: 'from-pink-500 to-rose-500', textColor: 'text-rose-600', glow: 'rgba(225,29,72,0.20)' },
  sky: { label: 'Blue', chip: 'from-sky-500 to-cyan-600', textColor: 'text-sky-600', glow: 'rgba(2,132,199,0.22)' },
  orange: { label: 'Orange', chip: 'from-orange-500 to-amber-600', textColor: 'text-orange-600', glow: 'rgba(234,88,12,0.22)' },
  violet: { label: 'Purple', chip: 'from-violet-500 to-purple-600', textColor: 'text-violet-600', glow: 'rgba(124,58,237,0.22)' },
  indigo: { label: 'Indigo', chip: 'from-indigo-500 to-blue-600', textColor: 'text-indigo-600', glow: 'rgba(79,70,229,0.22)' },
  teal: { label: 'Teal', chip: 'from-teal-500 to-emerald-600', textColor: 'text-teal-600', glow: 'rgba(13,148,136,0.22)' },
};

export const SERVICE_ICONS = {
  building: { label: 'Hotel', Icon: Building2 },
  car: { label: 'Car', Icon: Car },
  heart: { label: 'Heart', Icon: Heart },
  helicopter: { label: 'Helicopter', Icon: Helicopter },
  mappin: { label: 'Location pin', Icon: MapPin },
  compass: { label: 'Compass', Icon: Compass },
  sparkles: { label: 'Sparkles', Icon: Sparkles },
  plane: { label: 'Plane', Icon: Plane },
  mountain: { label: 'Mountain', Icon: Mountain },
  bus: { label: 'Bus', Icon: Bus },
};

// Built-in pictures for seeded cards that have no uploaded image yet.
const BUILTIN_IMAGES = { chardham: chardhamImg };

// Shown until the API answers, and if it fails, so the home screen is never empty.
export const DEFAULT_APP_SERVICES = [
  { key: 'hotel', title: 'Hotels & Stays', description: 'Book luxury hotels, resorts, and homestays at the best prices.', theme: 'emerald', icon: 'building', path: '/hotels', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800' },
  { key: 'taxi', title: 'Cab Booking', description: 'Ride safely with our verified drivers. Outstation & local cabs.', theme: 'amber', icon: 'car', path: '/taxi/user', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800' },
  { key: 'wedding', title: 'Wedding Planner', description: 'Plan your dream destination wedding with top vendors & venues.', theme: 'rose', icon: 'heart', path: '/wedding', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800' },
  { key: 'helicopter', title: 'Helicopter Booking', description: 'Book premium helicopter travel & spiritual tours to holy shrines.', theme: 'sky', icon: 'helicopter', path: '/taxi/user/airways', image: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=800' },
  { key: 'chardham', title: 'Char Dham Yatra', description: 'Spiritual pilgrim tour packages to Yamunotri, Gangotri, Kedarnath, and Badrinath.', theme: 'orange', icon: 'mappin', path: '/taxi/user/tours', image: '', imagePos: 'bottom' },
];

/** Turns a stored service into what the card component renders. */
export const toServiceCard = (service) => {
  const theme = SERVICE_THEMES[service.theme] || SERVICE_THEMES.emerald;
  const icon = SERVICE_ICONS[service.icon] || SERVICE_ICONS.compass;
  return {
    id: service._id || service.key,
    title: service.title || '',
    description: service.description || '',
    path: service.path || '/',
    ctaText: service.ctaText || 'Explore',
    image: service.image || BUILTIN_IMAGES[service.key] || '',
    imagePos: service.imagePos === 'bottom' ? 'object-bottom' : service.imagePos === 'top' ? 'object-top' : 'object-center',
    icon: icon.Icon,
    chip: theme.chip,
    textColor: theme.textColor,
    glow: theme.glow,
    // Mobile tab strip + banner
    key: service.key || '',
    tabLabel: service.tabLabel || service.title || '',
    tagline: service.tagline || '',
    tabIcon: service.tabIcon || '',
    bannerImage: service.bannerImage || service.image || BUILTIN_IMAGES[service.key] || '',
    bannerTitle: service.bannerTitle || service.title || '',
  };
};

export const DEFAULT_HOME_SETTINGS = {
  greetingSubtitle: 'What are you looking for today?',
  sectionTitle: 'Explore Services',
};

// One request shared by every screen: the mobile tabs re-mount on each tab
// switch, so they read this cache instead of fetching (and flickering) again.
// The last good answer is also kept in localStorage for an instant first paint.
const CACHE_KEY = 'md_app_services_v1';
const readCache = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; }
};
let memoryCache = null;
let pending = null;

const fetchAppServices = () => {
  if (!pending) {
    pending = axios.get(`${API_BASE_URL}/app-services`)
      .then((res) => {
        if (!res.data?.success || !Array.isArray(res.data.data)) throw new Error('bad response');
        memoryCache = { services: res.data.data, settings: { ...DEFAULT_HOME_SETTINGS, ...(res.data.settings || {}) } };
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache)); } catch { /* storage full or blocked */ }
        return memoryCache;
      })
      .catch(() => {
        pending = null; // try again on the next screen
        return null;
      });
  }
  return pending;
};

/** Returns { services, settings, loaded } for the app home screen and mobile tabs. */
export const useAppServices = () => {
  const [state, setState] = useState(() => memoryCache || readCache() || { services: DEFAULT_APP_SERVICES, settings: DEFAULT_HOME_SETTINGS });
  const [loaded, setLoaded] = useState(Boolean(memoryCache));
  useEffect(() => {
    let alive = true;
    fetchAppServices().then((data) => {
      if (!alive) return;
      if (data) setState(data);
      setLoaded(true);
    });
    return () => { alive = false; };
  }, []);
  return { services: state.services.map(toServiceCard), settings: state.settings, loaded };
};

// Remembers the last service tab opened on a phone, for /home to reopen it.
export const LAST_SERVICE_KEY = 'md_last_service_tab';
export const rememberServiceTab = (key) => {
  try { localStorage.setItem(LAST_SERVICE_KEY, key); } catch { /* ignore */ }
};
export const lastServiceTab = () => {
  try { return localStorage.getItem(LAST_SERVICE_KEY) || ''; } catch { return ''; }
};
