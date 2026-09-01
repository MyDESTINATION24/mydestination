// Public-facing identifiers follow a fixed shape: BP- followed by 8 characters
// (e.g. booking BP-AB12CD34, user BP-12AB34CD). Booking IDs are rendered with a
// leading '#'; user IDs are not.
const PREFIX = 'BP-';

const normalize = (value) => {
  if (!value) return '';
  const raw = String(value).trim().replace(/^#/, '').toUpperCase();
  if (!raw) return '';
  return raw.startsWith(PREFIX) ? raw : `${PREFIX}${raw}`;
};

/** Booking reference for display, e.g. "#BP-AB12CD34". */
export const formatBookingId = (booking) => {
  const id = normalize(booking?.bookingId || booking?._id?.slice(-8));
  return id ? `#${id}` : '';
};

/** User reference for display, e.g. "BP-12AB34CD". */
export const formatUserId = (user) => normalize(user?.publicId || user?._id?.slice(-8));

export const PUBLIC_ID_PREFIX = PREFIX;
