import crypto from 'crypto';

/**
 * Middleware to check CSRF tokens on unsafe methods.
 */
export default function csrfMiddleware(req, res, next) {
  // 1. Exclude read-only methods (Layer 8.1)
  if (['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(req.method)) {
    return next();
  }

  // 2. Exclude API key requests (Layer 8.2)
  if (req.headers['x-api-key']) {
    return next();
  }

  const csrfCookie = req.cookies?.flowshield_csrf;
  const csrfHeader = req.headers['x-csrf-token'];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ detail: "CSRF verification failed. Token mismatch or missing." });
  }

  next();
}

/**
 * Utility helper to set CSRF cookie on login/session endpoints.
 */
export function setCsrfCookie(res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('flowshield_csrf', token, {
    httpOnly: false, // Must be accessible to frontend script to read and copy to header
    secure: process.env.ENVIRONMENT === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 3600 * 1000 // 7 days
  });
  return token;
}
