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
