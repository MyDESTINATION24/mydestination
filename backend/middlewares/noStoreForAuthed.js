// Authenticated API responses are per-user and state-bearing: an active ride,
// a wallet balance, a booking status. Express sends an ETag but no
// Cache-Control, and with no Cache-Control an HTTP cache is free to apply
// heuristic freshness -- an Android WebView will happily serve a stored copy
// without revalidating.
//
// That is how a rider got stuck on "finding your ride": the poll of
// /rides/active/me kept being answered from cache with the pre-acceptance
// body, long after a driver had accepted. Some callers had worked around it
// by appending ?t=<timestamp>, which only fixes the one call site that
// remembers to do it.
//
// Anything carrying an Authorization header is user-specific and must never be
// stored, so mark those no-store. Public, genuinely cacheable endpoints (the
// landing page, articles, pricing rules) send no Authorization header and keep
// their caching untouched.

export const noStoreForAuthed = (req, res, next) => {
  if (req.headers.authorization) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }

  next();
};
