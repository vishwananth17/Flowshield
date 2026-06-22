import crypto from 'crypto';

export default function securityHeadersMiddleware(req, res, next) {
  // 1. Generate request ID (Layer 1.9)
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  // 2. Set clickjacking protection (Layer 1.1)
  res.setHeader('X-Frame-Options', 'DENY');

  // 3. MIME Sniffing protection (Layer 1.2)
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 4. Legacy XSS Filter protection (Layer 1.3)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // 5. Referrer Policy (Layer 1.4)
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 6. Permissions Policy (Layer 1.5)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // 7. Strict Transport Security (HSTS - Layer 1.6)
  if (process.env.ENVIRONMENT === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // 8. Content Security Policy (CSP - Layer 1.7)
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src https://api.razorpay.com; object-src 'none';");

  // 9. Cache-Control for dynamic APIs (Layer 1.8)
  if (req.method === 'GET' && (req.path.startsWith('/api/') || req.path.includes('/auth/'))) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }

  // 10. Hide server info (Layer 1.10)
  res.removeHeader('X-Powered-By');
  res.setHeader('Server', 'Flowshield-Core');

  next();
}
