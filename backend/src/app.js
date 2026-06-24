import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import winston from 'winston';
import dns from 'dns';

// Force IPv4 resolution first to prevent ENETUNREACH errors on IPv6-disabled hosts
dns.setDefaultResultOrder('ipv4first');


import { validateAllSecrets } from './services/secrets.js';
import { initDatabase } from './services/dbInit.js';
import { updateTorExitNodes } from './services/botDetection.js';

import securityHeadersMiddleware from './middleware/securityHeaders.js';
import csrfMiddleware from './middleware/csrf.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { maintenanceModeMiddleware } from './services/incidentResponse.js';

import authRouter from './routes/auth.js';
import apiRouter from './routes/api.js';
import billingRouter from './routes/billing.js';

dotenv.config();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// 1. Validate secrets on startup (Layer 14.1)
try {
  validateAllSecrets();
} catch (err) {
  logger.error(`Critical startup secret error: ${err.message}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 10000;

// 2. Initialize PostgreSQL tables on Supabase (Layer 12)
initDatabase().then(() => {
  // Refresh Tor exit node list in background on start (Layer 11.1)
  updateTorExitNodes().catch(() => {});
}).catch(err => {
  logger.error(`Critical database initialization failed: ${err.message}`);
  process.exit(1);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CORS Security Configuration (Layer 6)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ALLOWED_CUSTOM_DOMAINS = [
  "https://flowshieldai.com",
  "https://www.flowshieldai.com",
  "https://app.flowshieldai.com",
];

const ALLOWED_ORIGINS_DEV = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
];

const env = process.env.ENVIRONMENT || "development";

function isAllowedOrigin(origin) {
  if (!origin) return true; // Allow curl, mobile apps, same-origin requests
  // Allow any Vercel preview/production deployment for this project
  if (/^https:\/\/[a-z0-9-]+-?[a-z0-9]*\.vercel\.app$/.test(origin)) return true;
  // Allow custom domains
  if (ALLOWED_CUSTOM_DOMAINS.includes(origin)) return true;
  // Allow localhost in dev
  if (env !== "production" && ALLOWED_ORIGINS_DEV.includes(origin)) return true;
  // Allow any origin explicitly listed in CORS_ORIGINS env var
  const extraOrigins = (process.env.CORS_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (extraOrigins.includes(origin) || extraOrigins.includes("*")) return true;
  return false;
}

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Authorization", "Content-Type", "X-API-Key",
    "X-Request-ID", "X-Idempotency-Key", "X-CSRF-Token"
  ],
  exposedHeaders: [
    "X-RateLimit-Limit", "X-RateLimit-Remaining",
    "X-RateLimit-Reset", "X-Request-ID"
  ],
  maxAge: 86400 // 24 hours caching for preflight requests
}));

// 3. Mount Global Middlewares
app.use(express.json({ limit: '1mb' })); // Max payload size check (Layer 5.4)
app.use(cookieParser());
app.use(securityHeadersMiddleware); // Innermost headers (Layer 1)
app.use(globalRateLimiter); // IP rate limits (Layer 4)
app.use(csrfMiddleware); // CSRF token checking (Layer 8)
app.use(maintenanceModeMiddleware); // Emergency Lockdown Maintenance mode (Layer 16.2)

// 4. Mount Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/billing', billingRouter);
app.use('/api/v1', apiRouter);
app.use('/', apiRouter); // Mount at root too for /analyze_transaction, /health, /metrics

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.message === 'Blocked by CORS policy') {
    return res.status(403).json({ detail: err.message });
  }
  logger.error(`Unhandled server error: ${err.message}`);
  return res.status(500).json({ detail: "Internal Server Error" });
});

// Run server if not on Vercel serverless
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    logger.info(`🚀 Flowshield AI Express Backend listening on port ${PORT}`);
  });
}

export default app;
