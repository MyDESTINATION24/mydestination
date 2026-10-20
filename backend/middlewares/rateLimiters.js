import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Shared limiters for the hotel/wedding API. Keys:
// - IP, via ipKeyGenerator so an IPv6 client cannot rotate through its /64.
// - the signed-in account, for money-moving routes: an attacker rotating IPs is
//   still one account, and many customers behind one carrier NAT are not.
// - the target phone/email, for credential and OTP routes, so a distributed
//   guesser or SMS-bomber is capped per victim, not just per source.

const tooMany = (message) => (req, res) => {
  res.status(429).json({ success: false, message });
};

const ipKey = (req) => `ip:${ipKeyGenerator(req.ip)}`;

const accountOrIpKey = (req) => {
  const id = req.user?._id || req.user?.id || req.auth?.sub;
  return id ? `acct:${id}` : ipKey(req);
};

const normalizePhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
};

const make = ({ windowMs, limit, keyGenerator = ipKey, message, skip }) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator,
  skip,
  handler: tooMany(message),
});

const MINUTE = 60 * 1000;

// Flood guard for the whole API. Generous on purpose: many Indian mobile users
// share one carrier-NAT address, so this only stops scripted hammering.
export const globalApiLimiter = make({
  windowMs: MINUTE,
  limit: Number(process.env.GLOBAL_RATE_LIMIT_PER_MIN) || 1200,
  message: 'Too many requests. Please slow down and try again shortly.',
  // Gateway callbacks retry on 429 and must never be dropped.
  skip: (req) => /\/(webhook|callback)(\/|$)/i.test(req.path),
});

// Credential logins (admin email/password): per IP and per target email.
export const adminLoginIpLimiter = make({
  windowMs: 15 * MINUTE,
  limit: 10,
  message: 'Too many sign-in attempts. Please try again in a few minutes.',
});

export const adminLoginEmailLimiter = make({
  windowMs: 60 * MINUTE,
  limit: 20,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return email ? `email:${email}` : ipKey(req);
  },
  message: 'Too many sign-in attempts for this account. Please try again later.',
});

// OTP sends cost an SMS each; cap per target phone as well as per IP.
export const otpSendPhoneLimiter = make({
  windowMs: 15 * MINUTE,
  limit: 5,
  keyGenerator: (req) => {
    const phone = normalizePhone(req.body?.phone);
    return phone ? `phone:${phone}` : ipKey(req);
  },
  message: 'Too many OTP requests for this number. Please wait a few minutes and try again.',
});

export const otpVerifyPhoneLimiter = make({
  windowMs: 15 * MINUTE,
  limit: 15,
  keyGenerator: (req) => {
    const phone = normalizePhone(req.body?.phone);
    return phone ? `phone:${phone}` : ipKey(req);
  },
  message: 'Too many verification attempts for this number. Please wait a few minutes and try again.',
});

// Money-moving routes, per account (mount AFTER protect).
export const bookingCreateLimiter = make({
  windowMs: 15 * MINUTE,
  limit: 20,
  keyGenerator: accountOrIpKey,
  message: 'Too many booking attempts. Please wait a few minutes and try again.',
});

export const bookingCancelLimiter = make({
  windowMs: 15 * MINUTE,
  limit: 15,
  keyGenerator: accountOrIpKey,
  message: 'Too many cancellation requests. Please wait a few minutes and try again.',
});

export const paymentLimiter = make({
  windowMs: 15 * MINUTE,
  limit: 40,
  keyGenerator: accountOrIpKey,
  message: 'Too many payment requests. Please wait a few minutes and try again.',
});

export const withdrawalLimiter = make({
  windowMs: 60 * MINUTE,
  limit: 10,
  keyGenerator: accountOrIpKey,
  message: 'Too many withdrawal requests. Please try again later.',
});

// Public (pre-account) document uploads land on Cloudinary at our cost.
export const publicUploadLimiter = make({
  windowMs: 60 * MINUTE,
  limit: 40,
  message: 'Too many uploads. Please wait a while and try again.',
});

// Public payment-status lookups each call the gateway.
export const paymentStatusLimiter = make({
  windowMs: 15 * MINUTE,
  limit: 60,
  message: 'Too many payment status checks. Please wait a few minutes and try again.',
});
