import rateLimit from 'express-rate-limit';

// The app had no rate limiting at all. The OTP endpoints are the costly ones:
// every send dispatches a real SMS, so an open endpoint is a way to burn the
// SMS balance, spam a stranger's phone, or enumerate which numbers are
// registered (the send route answers 404 for unknown accounts and 200 for
// known ones).

const normalizePhoneKey = (value = '') => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
};

// Limit per PHONE first and fall back to IP. Keying on IP alone would let one
// attacker rotate addresses, and would also lump every user behind a shared
// mobile-carrier NAT into a single bucket.
const phoneOrIpKey = (req) => {
  const phone = normalizePhoneKey(req.body?.phone);
  return phone ? `phone:${phone}` : `ip:${req.ip}`;
};

const tooMany = (message) => (req, res) => {
  res.status(429).json({ success: false, message });
};

// Sending: the expensive path, since each one is an SMS.
export const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: phoneOrIpKey,
  handler: tooMany('Too many OTP requests for this number. Please wait a few minutes and try again.'),
});

// Verifying: the per-session attempt cap already stops walking one code. This
// stops someone requesting a fresh code over and over to keep guessing.
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: phoneOrIpKey,
  handler: tooMany('Too many verification attempts. Please wait a few minutes and try again.'),
});

// Password/credential logins, which are guessable in a way OTP flows are not.
export const credentialLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: tooMany('Too many login attempts. Please wait a few minutes and try again.'),
});
