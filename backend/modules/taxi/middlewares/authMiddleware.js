import { Admin } from '../admin/models/Admin.js';
import MainAdmin from '../../admin/models/Admin.js';
import { Owner } from '../admin/models/Owner.js';
import { ServiceStore } from '../admin/models/ServiceStore.js';
import { ServiceCenterStaff } from '../admin/models/ServiceCenterStaff.js';
import { RentalBookingRequest } from '../admin/models/RentalBookingRequest.js';
import { ApiError } from '../../../utils/ApiError.js';
import { Driver } from '../driver/models/Driver.js';
import { BusDriver } from '../driver/models/BusDriver.js';
import User from '../../user/models/User.js';
import { verifyAccessToken } from '../services/tokenService.js';
import {
  normalizeAdminPermissions,
  normalizeAdminType,
} from '../admin/services/adminAccessService.js';

const roleModelMap = {
  admin: Admin,
  'super-admin': Admin,
  driver: Driver,
  pooling: Driver,
  bus_driver: BusDriver,
  owner: Owner,
  service_center: ServiceStore,
  service_center_staff: ServiceCenterStaff,
  user: User,
};

const normalizeRole = (role = '') => {
  const value = String(role || '').toLowerCase();
  if (value === 'super-admin' || value === 'superadmin') {
    return 'admin';
  }

  // A wedding vendor or hotel partner is still a customer of the taxi module,
  // and their token's subject IS a User document -- the extra role is a second
  // identity, not a different account. Without this, taxi routes gated on
  // 'user' answered 403 for them and the app treated that as a dead session and
  // logged them out the moment they opened the taxi module.
  if (value === 'vendor' || value === 'partner') {
    return 'user';
  }

  return value;
};

const attachResolvedAuth = (req, payload) => {
  req.auth = {
    sub: payload.sub,
    role: normalizeRole(payload.role),
    originalRole: payload.role,
  };
};

const resolveOpenUserIdentity = async (req) => {
  // SECURITY: this used to accept an identity straight from the caller --
  // x-user-id, body.userId, query.userId, params.userId -- with no token at
  // all, and fell back to the OLDEST user in the database when none was given.
  // Any unauthenticated request could therefore act as any user, across the 60+
  // routes using this middleware: read their bookings, book as them, end their
  // rides. No client ever sent those fields; the app always carries a bearer
  // token, which is handled before this function is reached.
  //
  // Identity may only come from a token, or from a resolver that derives it
  // from a resource the caller already had to know (see resolveOpenUser).
  throw new ApiError(401, 'Authorization token is required');
};

export const resolveOpenUserFromRentalBooking = async (req) => {
  const bookingId = String(req.params?.id || '').trim();

  if (!bookingId) {
    throw new ApiError(400, 'Rental booking id is required');
  }

  const booking = await RentalBookingRequest.findById(bookingId).select('userId');

  if (!booking) {
    throw new ApiError(404, 'Rental booking not found');
  }

  if (!booking.userId) {
    throw new ApiError(404, 'No user account is linked to this rental booking');
  }

  attachResolvedAuth(req, {
    sub: String(booking.userId),
    role: 'user',
  });
};

export const authenticate = (allowedRoles = [], options = {}) => async (req, _res, next) => {
  try {
    const allowPending = options?.allowPending === true;
    const authorization = req.headers.authorization || '';
    const [, token] = authorization.split(' ');

    if (!token) {
      throw new ApiError(401, 'Authorization token is required');
    }

    const payload = verifyAccessToken(token);

    const normalizedRole = normalizeRole(payload.role);
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

    if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(normalizedRole)) {
      throw new ApiError(403, 'Insufficient permissions for this resource');
    }

    const Model = roleModelMap[payload.role] || roleModelMap[normalizedRole];

    if (!Model) {
      throw new ApiError(401, 'Unsupported auth role');
    }

    let entity = await Model.findById(payload.sub || payload.id);

    if (!entity && normalizedRole === 'admin') {
      entity = await MainAdmin.findById(payload.sub || payload.id);
    }

    if (!entity) {
      throw new ApiError(401, 'Authenticated account no longer exists');
    }

    if (
      normalizedRole === 'user' &&
      (entity.deletedAt || entity.isActive === false || entity.active === false)
    ) {
      throw new ApiError(401, 'User account is not active');
    }

    if (
      (normalizedRole === 'driver' || normalizedRole === 'pooling') &&
      !allowPending &&
      (entity.approve === false || String(entity.status || '').toLowerCase() === 'pending')
    ) {
      throw new ApiError(403, 'Driver account is pending approval');
    }

    if (
      normalizedRole === 'owner' &&
      !allowPending &&
      (entity.active === false ||
        entity.approve === false ||
        String(entity.status || '').toLowerCase() === 'pending')
    ) {
      throw new ApiError(403, 'Owner account is pending approval');
    }

    if (
      normalizedRole === 'bus_driver' &&
      (entity.active === false ||
        entity.approve === false ||
        ['pending', 'blocked'].includes(String(entity.status || '').toLowerCase()))
    ) {
      throw new ApiError(403, 'Bus driver account is pending approval');
    }

    if (
      normalizedRole === 'service_center' &&
      (entity.active === false || String(entity.status || '').toLowerCase() === 'inactive')
    ) {
      throw new ApiError(403, 'Service center account is inactive');
    }

    if (
      normalizedRole === 'service_center_staff' &&
      (entity.active === false || String(entity.status || '').toLowerCase() === 'inactive')
    ) {
      throw new ApiError(403, 'Service center staff account is inactive');
    }

    attachResolvedAuth(req, payload);
    req.auth.entity = entity;

    if (normalizedRole === 'admin') {
      req.auth.admin = {
        id: String(entity._id),
        email: entity.email || '',
        name: entity.name || '',
        role: entity.role || '',
        admin_type: normalizeAdminType(entity.admin_type || entity.role),
        permissions: normalizeAdminPermissions(entity.permissions || []),
        service_location_ids: Array.isArray(entity.service_location_ids)
          ? entity.service_location_ids.map((item) => String(item))
          : [],
        zone_ids: Array.isArray(entity.zone_ids)
          ? entity.zone_ids.map((item) => String(item))
          : [],
        active: entity.active !== false,
        status: entity.status || 'active',
      };

      if (req.auth.admin.active === false || String(req.auth.admin.status).toLowerCase() === 'inactive') {
        throw new ApiError(403, 'Admin account is inactive');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const authenticateOrResolveUser = (allowedRoles = ['user'], options = {}) => async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const [, token] = authorization.split(' ');

  if (token) {
    return authenticate(allowedRoles)(req, res, next);
  }

  try {
    if (!allowedRoles.includes('user')) {
      throw new ApiError(401, 'Authorization token is required');
    }

    const resolver =
      typeof options?.resolveOpenUser === 'function'
        ? options.resolveOpenUser
        : resolveOpenUserIdentity;

    await resolver(req);
    next();
  } catch (error) {
    next(error);
  }
};
