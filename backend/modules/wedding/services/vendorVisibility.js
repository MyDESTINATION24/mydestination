/**
 * A vendor is only listed publicly when their owning user still has a live
 * subscription with leads left. Category counts and the vendor listing both
 * depend on these rules, so they live here to stop the two from drifting --
 * a count that disagrees with the list it links to reads as a bug.
 */

// subscriptionExpiryDate must stay selected: isVendorVisible reads it, and an
// unselected field is undefined, which silently skips the expiry check.
export const VENDOR_USER_FIELDS = 'hasActiveSubscription leadsRemaining subscriptionExpiryDate';

export const VENDOR_PUBLIC_STATUSES = ['active', 'pending'];

/** Vendor categories are free text, so match them forgivingly. */
export const buildCategoryRegex = (category) => {
  let term = category;
  if (category === 'Photographers' || category === 'Photography') term = 'Photograph';
  else if (category === 'Planning & Decor') term = 'Planning|Decor';
  return { $regex: term, $options: 'i' };
};

export const matchesCategory = (vendorCategory, category) => {
  const { $regex } = buildCategoryRegex(category);
  return new RegExp($regex, 'i').test(String(vendorCategory || ''));
};

export const isVendorVisible = (vendor) => {
  const user = vendor?.user;
  if (!user || !user.hasActiveSubscription || Number(user.leadsRemaining) <= 0) return false;
  if (user.subscriptionExpiryDate && new Date(user.subscriptionExpiryDate) < new Date()) return false;
  return true;
};
