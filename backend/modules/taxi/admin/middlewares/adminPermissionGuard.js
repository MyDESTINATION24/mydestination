import { ApiError } from '../../../../utils/ApiError.js';
import { hasAdminPermission } from '../services/adminAccessService.js';

/**
 * Enforces taxi sub-admin permissions on every /admin route.
 *
 * Only a handful of handlers (drivers list, zones, service locations, set
 * prices, sub-admins) checked permissions; everything else only required an
 * admin token. A sub-admin given, say, "zones" alone could still credit any
 * wallet, approve withdrawals, edit users or change the payment-gateway keys.
 *
 * Each route group maps to the permission its admin-panel page already uses
 * (frontend sidebar), so a sub-admin keeps exactly the pages they can see.
 * Superadmins -- including the main admin -- pass every check.
 *
 * Changes (POST/PUT/PATCH/DELETE) always need the permission. Reads are
 * checked only for the sensitive groups below, because many pages load shared
 * lists (zones, service locations...) for their filters.
 */
const RULES = [
  { match: /^\/admin-management(\/|$)/, permission: 'subadmins.manage', reads: true },
  { match: /^\/wallet(\/|$)/, permission: 'wallet.view', reads: true },
  { match: /^\/payment-methods(\/|$)/, permission: 'wallet.view' },
  { match: /^\/integration-settings(\/|$)/, permission: 'settings.view', reads: true },
  { match: /^\/reports(\/|$)/, permission: 'reports.view', reads: true },
  { match: /^\/earnings(\/|$)/, permission: 'earnings.view', reads: true },
  { match: /^\/(users|user-subscriptions)(\/|$)/, permission: 'users.view' },
  { match: /^\/(drivers|driver-subscriptions)(\/|$)/, permission: 'drivers.view' },
  { match: /^\/owner-management(\/|$)/, permission: 'owners.view' },
  { match: /^\/service-locations(\/|$)/, permission: 'service_locations.view' },
  { match: /^\/service-stores(\/|$)/, permission: 'service_stores.view' },
  { match: /^\/types\/vehicle-types(\/|$)/, permission: 'vehicle_types.view' },
  { match: /^\/types\/set-prices(\/|$)/, permission: 'set_prices.view' },
  { match: /^\/(types\/rental-vehicles|types\/rental-packages|rental-booking-requests|rental-quote-requests)(\/|$)/, permission: 'rental.view' },
  { match: /^\/airports(\/|$)/, permission: 'airports.view' },
  { match: /^\/(bus-services|bus-banners|bus-bookings)(\/|$)/, permission: 'bus_service.view' },
  { match: /^\/pooling-(routes|vehicles|bookings)(\/|$)/, permission: 'pooling.view' },
  { match: /^\/(airways|airway-routes|airway-bookings)(\/|$)/, permission: 'airways.view' },
  { match: /^\/(tours|tour-banners|tour-bookings)(\/|$)/, permission: 'tours.view' },
  { match: /^\/ev-stations(\/|$)/, permission: 'dashboard.view' },
  { match: /^\/goods-types(\/|$)/, permission: 'goods_types.view' },
  { match: /^\/referrals(\/|$)/, permission: 'referrals.view' },
  { match: /^\/(safety|ongoing-rides)(\/|$)/, permission: 'ongoing.view' },
  { match: /^\/zones(\/|$)/, permission: 'zones.view' },
  { match: /^\/promotions(\/|$)/, permission: 'promotions.view' },
  { match: /^\/(general-settings|languages|preferences|roles|common\/app-modules|notification-channels)(\/|$)/, permission: 'settings.view' },
];

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Use after authenticate(['admin']) on the '/admin' mount; req.path is relative to it. */
export const adminPermissionGuard = (req, _res, next) => {
  const admin = req.auth?.admin;
  if (!admin) return next(); // authenticate() already rejected non-admins
  const rule = RULES.find((r) => r.match.test(req.path));
  if (!rule) return next();
  if (READ_METHODS.has(req.method) && !rule.reads) return next();
  if (hasAdminPermission(admin, rule.permission)) return next();
  return next(new ApiError(403, 'You do not have permission for this section'));
};

/** For admin routes mounted outside '/admin' (e.g. app onboarding screens). */
export const requireAdminPermission = (permission) => (req, _res, next) => {
  if (hasAdminPermission(req.auth?.admin, permission)) return next();
  return next(new ApiError(403, 'You do not have permission for this section'));
};
