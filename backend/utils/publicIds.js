import crypto from 'crypto';

// Public-facing identifiers use a fixed shape: BP- followed by 8 characters
// that alternate letter-pairs and digit-pairs (e.g. BP-AB12CD34).
// Booking IDs start with letters, user IDs start with digits, so the two are
// visually distinguishable at a glance.
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O (confusable with 1/0)
const DIGITS = '23456789';                  // no 0/1 (confusable with O/I)

const PREFIX = 'BP-';

const pick = (alphabet, count) => {
  const bytes = crypto.randomBytes(count);
  let out = '';
  for (let i = 0; i < count; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
};

// BP-AB12CD34
export const generateBookingId = () =>
  `${PREFIX}${pick(LETTERS, 2)}${pick(DIGITS, 2)}${pick(LETTERS, 2)}${pick(DIGITS, 2)}`;

// BP-12AB34CD
export const generateUserId = () =>
  `${PREFIX}${pick(DIGITS, 2)}${pick(LETTERS, 2)}${pick(DIGITS, 2)}${pick(LETTERS, 2)}`;

// Accepts stored values with or without the prefix and normalises them for display.
export const formatPublicId = (value) => {
  if (!value) return '';
  const raw = String(value).trim().replace(/^#/, '');
  return raw.toUpperCase().startsWith(PREFIX) ? raw.toUpperCase() : `${PREFIX}${raw.toUpperCase()}`;
};

export const PUBLIC_ID_PREFIX = PREFIX;
