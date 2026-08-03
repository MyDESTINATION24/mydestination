import jwt from 'jsonwebtoken';
import User from '../modules/user/models/User.js';
import Partner from '../modules/partner/models/Partner.js';
import Admin from '../modules/admin/models/Admin.js';
import { Driver } from '../modules/taxi/driver/models/Driver.js';

// Taxi tokens carry the account id in `sub` (see taxi tokenService), not `id`, so
// `protect` cannot resolve them. Push-token registration is the one endpoint the
// taxi apps share with the hotel/wedding apps, so it accepts taxi drivers too.
// Scoped deliberately: this does NOT widen `protect` for every other route.
export const protectPushToken = async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer')
    ? req.headers.authorization.split(' ')[1]
    : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded.id && decoded.sub && String(decoded.role || '').toLowerCase() === 'driver') {
        const driver = await Driver.findById(decoded.sub);

        if (driver) {
          req.user = driver;
          req.auth = { role: 'driver', sub: String(driver._id) };
          return next();
        }
      }
    } catch {
      // Fall through to `protect`, which reports the auth failure.
    }
  }

  return protect(req, res, next);
};

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🛡️ Auth Middleware - Decoded Payload:', decoded);

    // 1. Check User Collection
    let user = await User.findById(decoded.id);

    // 2. Check Partner Collection
    if (!user) {
      user = await Partner.findById(decoded.id);
    }

    // 3. Check Admin Collection
    if (!user) {
      console.log('🛡️ Auth Middleware - User/Partner not found, checking Admin collection for ID:', decoded.id);
      user = await Admin.findById(decoded.id);
    }

    if (!user) {
      console.warn('🛡️ Auth Middleware - No User/Partner/Admin found for ID:', decoded.id);
      return res.status(401).json({ message: 'The user belonging to this token no longer exists.' });
    }

    console.log(`🛡️ Auth Middleware - Authorized: ${user.name} (${user.role})`);

    // 4. Check Blocked Status
    if (user.isBlocked) {
      console.warn(`🛡️ Auth Middleware - User ${user.name} is BLOCKED`);
      return res.status(403).json({
        message: 'Your account has been blocked by admin. Please contact support.',
        isBlocked: true
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      console.error('🛡️ Auth Middleware - Invalid Token:', error.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
    console.error('🛡️ Auth Middleware Error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const authorizedRoles = (...roles) => {
  return (req, res, next) => {
    console.log(`🔐 Role Check - Required: [${roles}], User Has: ${req.user.role}`);
    if (!roles.includes(req.user.role)) {
      console.warn(`🚫 Role Check FAILED for user ${req.user.name}`);
      return res.status(403).json({ message: `User role ${req.user.role} is not authorized to access this route` });
    }
    console.log(`✅ Role Check PASSED`);
    next();
  };
};

export const optionalProtect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      let user = await User.findById(decoded.id);
      if (!user) user = await Partner.findById(decoded.id);
      if (!user) user = await Admin.findById(decoded.id);

      if (user && !user.isBlocked) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue even if token is invalid, but don't set req.user
    next();
  }
};
