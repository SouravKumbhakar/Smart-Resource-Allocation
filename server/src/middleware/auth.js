import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { errorResponse } from '../utils/response.js';

// ── Core JWT protection ───────────────────────────────────────────────────
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-passwordHash');
      if (!req.user) return errorResponse(res, 'User no longer exists', 401);
      next();
    } catch (error) {
      return errorResponse(res, 'Not authorized, token failed', 401);
    }
  } else {
    return errorResponse(res, 'Not authorized, no token', 401);
  }
};

// ── Role-based access control ─────────────────────────────────────────────
// Super admin bypasses ALL role checks — they have god-mode access.
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (req.user.role === 'super_admin') return next(); // Super admin always passes
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, `Role '${req.user.role}' is not authorized for this action`, 403);
    }
    next();
  };
};

// ── Convenience middleware ────────────────────────────────────────────────
export const superAdminOnly = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return errorResponse(res, 'Super Admin access required', 403);
  }
  next();
};

export const adminOrAbove = (req, res, next) => {
  const ADMIN_ROLES = ['ngo_admin', 'coordinator', 'super_admin'];
  if (!ADMIN_ROLES.includes(req.user.role)) {
    return errorResponse(res, 'Admin access required', 403);
  }
  next();
};
