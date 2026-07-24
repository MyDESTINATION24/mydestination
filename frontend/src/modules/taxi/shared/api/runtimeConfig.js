const trimTrailingSlash = (value = '') => String(value || '').trim().replace(/\/+$/, '');
const trimLeadingSlash = (value = '') => String(value || '').trim().replace(/^\/+/, '');

const isAbsoluteUrl = (value = '') => /^[a-z][a-z\d+\-.]*:\/\//i.test(String(value || '').trim());

const normalizeOriginCandidate = (value = '') => {
  const trimmed = trimTrailingSlash(value);
  if (!trimmed) {
    return '';
  }

  if (isAbsoluteUrl(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  return trimTrailingSlash(`https://${trimmed.replace(/^\/+/, '')}`);
};

const deriveOriginFromApiUrl = (value = '') => {
  const normalized = trimTrailingSlash(value);
  if (!normalized) {
    return '';
  }

  if (!isAbsoluteUrl(normalized) && !normalized.startsWith('//')) {
    return '';
  }

  return trimTrailingSlash(normalized.replace(/\/api(?:\/v1)?(?:\/taxi)?\/?$/, ''));
};

const normalizeSocketPathCandidate = (value = '') => {
  const trimmed = String(value || '').trim();

  if (!trimmed) {
    return '/taxi/socket.io';
  }

  if (isAbsoluteUrl(trimmed)) {
    try {
      return `/${trimLeadingSlash(new URL(trimmed).pathname || 'taxi/socket.io')}`;
    } catch {
      return '/taxi/socket.io';
    }
  }

  const schemeLessAbsolute = trimmed.match(/^(https?)\/\/(.+)$/i);
  if (schemeLessAbsolute) {
    try {
      return `/${trimLeadingSlash(new URL(`${schemeLessAbsolute[1]}://${schemeLessAbsolute[2]}`).pathname || 'taxi/socket.io')}`;
    } catch {
      return '/taxi/socket.io';
    }
  }

  return `/${trimLeadingSlash(trimmed)}`;
};

const DEFAULT_BACKEND_ORIGIN = (() => {
  const explicitOrigin = normalizeOriginCandidate(
    import.meta.env.VITE_BACKEND_ORIGIN || import.meta.env.VITE_SOCKET_URL || '',
  );

  if (explicitOrigin) {
    return explicitOrigin;
  }

  const sharedApiOrigin = deriveOriginFromApiUrl(import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '');
  if (sharedApiOrigin) {
    return sharedApiOrigin;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return trimTrailingSlash(window.location.origin);
  }

  return '';
})();

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    (DEFAULT_BACKEND_ORIGIN ? `${DEFAULT_BACKEND_ORIGIN}/api/v1` : '/api/v1'),
);

export const BACKEND_ORIGIN = trimTrailingSlash(
  normalizeOriginCandidate(
    import.meta.env.VITE_BACKEND_ORIGIN ||
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_ASSET_BASE_URL,
  ) ||
    deriveOriginFromApiUrl(API_BASE_URL) ||
    DEFAULT_BACKEND_ORIGIN,
);

export const BACKEND_LABEL = BACKEND_ORIGIN || DEFAULT_BACKEND_ORIGIN;
export const TAXI_API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_TAXI_API_URL || (BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/api/taxi` : '/api/taxi'),
);
export const TAXI_SOCKET_PATH = normalizeSocketPathCandidate(import.meta.env.VITE_TAXI_SOCKET_PATH);
export const ASSET_BASE_URL = trimTrailingSlash(
  normalizeOriginCandidate(import.meta.env.VITE_ASSET_BASE_URL) || BACKEND_ORIGIN,
);

export const buildBackendUrl = (path = '') => {
  const normalizedPath = trimLeadingSlash(path);
  if (!normalizedPath) {
    return BACKEND_ORIGIN || '/';
  }

  if (isAbsoluteUrl(normalizedPath)) {
    return normalizedPath;
  }

  if (!BACKEND_ORIGIN) {
    return `/${normalizedPath}`;
  }

  return `${BACKEND_ORIGIN}/${normalizedPath}`;
};

export const buildAssetUrl = (path = '') => {
  const normalizedPath = String(path || '').trim();
  if (!normalizedPath) {
    return '';
  }

  if (
    normalizedPath.startsWith('data:') ||
    normalizedPath.startsWith('blob:') ||
    isAbsoluteUrl(normalizedPath)
  ) {
    return normalizedPath;
  }

  const cleanPath = trimLeadingSlash(normalizedPath.replace(/\\/g, '/'));
  const assetOrigin = ASSET_BASE_URL || BACKEND_ORIGIN;

  if (!assetOrigin) {
    return `/${cleanPath}`;
  }

  return `${assetOrigin}/${cleanPath}`;
};
