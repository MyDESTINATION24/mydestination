import { useJsApiLoader } from '@react-google-maps/api';

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const HAS_VALID_GOOGLE_MAPS_KEY =
  typeof GOOGLE_MAPS_API_KEY === 'string' &&
  GOOGLE_MAPS_API_KEY.trim() !== '' &&
  GOOGLE_MAPS_API_KEY !== 'your-google-maps-browser-key';

export const INDIA_CENTER = { lat: 22.7196, lng: 75.8577 };
export const DELHI_CENTER = { lat: 28.6139, lng: 77.209 };
export const GOOGLE_MAPS_LOADER_ID = 'appzeto-google-maps';
export const GOOGLE_MAPS_LIBRARIES = ['drawing', 'places', 'visualization'];

// Google removed DrawingManager from the Maps JS API in 3.65. The zone and
// airport editors draw polygons/circles with it, so loading the default
// ("weekly") channel throws and those pages break.
//
// ponytail: pinned to the last release that still ships DrawingManager. Google
// keeps a quarterly version live for roughly a year, so this buys time, not a
// permanent fix -- the real fix is replacing DrawingManager in ZoneManagement
// and Airport with click-to-add polygon handling on the map itself.
export const GOOGLE_MAPS_VERSION = '3.64';

export const getLatLng = (source, fallback = INDIA_CENTER) => {
  const lat = Number(source?.lat ?? source?.latitude);
  const lng = Number(source?.lng ?? source?.longitude ?? source?.lon);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }

  return fallback;
};

export const useAppGoogleMapsLoader = () =>
  useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: HAS_VALID_GOOGLE_MAPS_KEY ? GOOGLE_MAPS_API_KEY : '',
    version: GOOGLE_MAPS_VERSION,
    libraries: GOOGLE_MAPS_LIBRARIES
  });
