/** Authentication & authorization middleware (JWT + httpOnly cookie). */
import jwt from 'jsonwebtoken';
import { db } from '../db/engine.js';
import { parseCookies } from '../utils/helpers.js';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
}

export function cookieParser(req, _res, next) {
  req.cookies = parseCookies(req.headers.cookie);
  next();
}

export function requireAuth(req, res, next) {
  const token =
    req.cookies?.token ||
    String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.status(401).json({ error: 'Please log in to continue.', code: 'NOT_LOGGED_IN' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.users.findById(payload.id);
    if (!user || user.deactivated) {
      return res.status(401).json({ error: 'Your session has expired.', code: 'SESSION_EXPIRED' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired.', code: 'SESSION_EXPIRED' });
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'You do not have permission to do that.', code: 'FORBIDDEN' });
  }
  next();
};
