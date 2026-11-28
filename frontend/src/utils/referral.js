/**
 * One referral link for the whole platform.
 *
 * Each app used to mint its own URL -- /r/<code> for hotel,
 * /taxi/user/signup?ref= for taxi riders, /taxi/driver/reg-phone?ref= for
 * drivers -- so the same person's code produced a different link depending on
 * which screen they shared from, and a link picked up in one app was invisible
 * to the others. Codes are already resolvable across every flow, so the link
 * should be too.
 */

const STORAGE_KEY = 'referralCode';

export const normalizeReferralCode = (value) =>
  String(value || '').trim().toUpperCase();

/** The canonical share link. /r/:referralCode is handled by ReferralHandler. */
export const buildReferralLink = (code) => {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return '';
  return `${window.location.origin}/r/${encodeURIComponent(normalized)}`;
};

/** Android package of the Flutter wrapper app on the Play Store. */
export const PLAY_STORE_PACKAGE = 'com.unq.dreamdestination';

/**
 * Play Store install link. Whatever sits in `referrer` is handed, untouched,
 * to the installed app through Google's Play Install Referrer API on first
 * launch -- the Flutter app reads it there and passes it into the WebView
 * (see window.applyReferralCode below). Without a code it is a plain store link.
 */
export const buildPlayStoreLink = (code) => {
  const base = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}`;
  const normalized = normalizeReferralCode(code);
  return normalized ? `${base}&referrer=${encodeURIComponent(normalized)}` : base;
};

export const storeReferralCode = (code) => {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return '';
  try { localStorage.setItem(STORAGE_KEY, normalized); } catch { /* private mode */ }
  return normalized;
};

export const getStoredReferralCode = () => {
  try { return normalizeReferralCode(localStorage.getItem(STORAGE_KEY)); }
  catch { return ''; }
};

export const clearStoredReferralCode = () => {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* private mode */ }
};

/**
 * Native bridge: the Flutter app calls window.applyReferralCode('<referrer>')
 * after reading the Play Install Referrer. Accepts a bare code ("ABC123") or
 * a query-style string ("ref=ABC123" / "utm_source=...&ref=ABC123").
 * Ignores Play's default "utm_source=google-play&utm_medium=organic".
 */
if (typeof window !== 'undefined') {
  window.applyReferralCode = (raw) => {
    const value = String(raw || '').trim();
    if (!value) return '';
    let code = value;
    if (value.includes('=')) {
      const params = new URLSearchParams(value);
      code = params.get('ref') || params.get('referral') || params.get('referrer') || '';
    }
    // Referral codes are alphanumeric; anything else is Play's organic noise.
    if (!/^[A-Za-z0-9_-]{3,40}$/.test(code)) return '';
    return storeReferralCode(code);
  };

  // The Flutter app may instead open the WebView at https://<site>/?ref=CODE.
  try {
    const incoming = new URLSearchParams(window.location.search).get('ref');
    if (incoming) window.applyReferralCode(incoming);
  } catch { /* ignore */ }
}

/**
 * The code to prefill a signup with, whichever way the invitee arrived:
 * a ?ref= link straight into that app, or the shared /r/ link.
 */
export const resolveIncomingReferralCode = (search) => {
  const params = new URLSearchParams(
    typeof search === 'string' ? search : window.location.search
  );
  return normalizeReferralCode(
    params.get('ref') || params.get('referral') || ''
  ) || getStoredReferralCode();
};
