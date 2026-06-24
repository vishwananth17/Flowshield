import crypto from 'crypto';

// Routes that generate or bootstrap session tokens — exempt from CSRF
// (they cannot have a token yet since they ARE what creates it)
const CSRF_EXEMPT_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/waitlist',
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/waitlist',
  '/waitlist',
];

/**
 * Middleware to check CSRF tokens on unsafe methods. (Layer 8)
 */
export default function csrfMiddleware(req, res, next) {
  // 1. Exclude read-only methods (Layer 8.1)
  if (['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(req.method)) {
    return next();
  }

  // 2. Exclude API key authenticated requests (Layer 8.2)
  if (req.headers['x-api-key']) {
    return next();
  }

  // 3. Exempt bootstrap auth endpoints that create the CSRF token (Layer 8.3)
  // These cannot have a CSRF token yet because they ARE the session-creation endpoints
  const path = req.path || '';
  if (CSRF_EXEMPT_PATHS.some(p => path === p || path.endsWith(p))) {
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
 * Set the CSRF cookie after a successful login or register.
 * Uses SameSite=None in production for cross-origin Vercel → Render flows.
 */
export function setCsrfCookie(res) {
  const token = crypto.randomBytes(32).toString('hex');
  const isProd = process.env.ENVIRONMENT === 'production';
  res.cookie('flowshield_csrf', token, {
    httpOnly: false,             // Must be JS-readable so frontend can copy to header
    secure: isProd,              // Required by browsers when SameSite=None
    sameSite: isProd ? 'none' : 'lax', // 'none' allows cross-origin (Vercel → Render)
    path: '/',
    maxAge: 7 * 24 * 3600 * 1000 // 7 days
  });
  return token;
}
