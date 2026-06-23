import crypto from 'crypto';
import { createClient } from 'redis';
import winston from 'winston';

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

// Configure Redis Client
const REDIS_URL = process.env.REDIS_URL;
let redisClient = null;

if (REDIS_URL) {
  try {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => logger.error(`Redis Error: ${err ? err.message || err : 'unknown error'}`));
    await redisClient.connect().catch((e) => {
      logger.error(`Redis connection failed: ${e.message}. Using in-memory fallback.`);
      redisClient = null;
    });
  } catch (err) {
    logger.error(`Failed to initialize Redis client: ${err.message}. Using in-memory fallback.`);
    redisClient = null;
  }
}
// In-memory cache fallback for local/non-production if Redis isn't running
const memoryCache = new Map();

// Cleanup memoryCache occasionally to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryCache.entries()) {
    if (value.expiresAt < now) {
      memoryCache.delete(key);
    }
  }
}, 60000);

// ------------------------------------------------------------
// 10.1 Idempotency Keys
// ------------------------------------------------------------

export async function checkIdempotency(key, orgId) {
  if (!key) return null;
  const cacheKey = `idempotency:${orgId || 'system'}:${key}`;
  
  if (redisClient) {
    try {
      const cached = await redisClient.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      logger.error(`Redis get failed: ${e.message}`);
    }
  }
  
  // Memory fallback
  const cachedVal = memoryCache.get(cacheKey);
  if (cachedVal && cachedVal.expiresAt > Date.now()) {
    return cachedVal.data;
  }
  return null;
}

export async function storeIdempotency(key, orgId, responseData) {
  if (!key) return;
  const cacheKey = `idempotency:${orgId || 'system'}:${key}`;
  
  if (redisClient) {
    try {
      await redisClient.setEx(cacheKey, 86400, JSON.stringify(responseData)); // 24 hours (Layer 10.1)
      return;
    } catch (e) {
      logger.error(`Redis set failed: ${e.message}`);
    }
  }
  
  // Memory fallback
  memoryCache.set(cacheKey, {
    data: responseData,
    expiresAt: Date.now() + 86400 * 1000 // 24 hours
  });
}

// ------------------------------------------------------------
// 10.2 Razorpay Webhook Signature Verification
// ------------------------------------------------------------

/**
 * Verify incoming Razorpay webhook signature.
 * @param {string|Buffer} payload The raw body payload as string or buffer
 * @param {string} signature The Razorpay signature header
 * @param {string} secret The configured Razorpay webhook secret
 */
export function verifyRazorpayWebhook(payload, signature, secret) {
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    // Timing safe comparison (Layer 3.3 timing safe comparison)
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch (err) {
    logger.error(`Razorpay signature verification failed: ${err.message}`);
    return false;
  }
}

/**
 * Compute signature for outgoing webhook payload.
 */
export function signWebhookPayload(payload, secret) {
  const body = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return `sha256=${signature}`;
}

// ------------------------------------------------------------
// 10.3 Request Timestamp Validation
// ------------------------------------------------------------

export function validateWebhookTimestamp(timestamp, toleranceSeconds = 300) {
  try {
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts)) return false;
    
    const diff = Math.abs(Math.floor(Date.now() / 1000) - ts);
    return diff <= toleranceSeconds; // Tolerance (default 5 minutes)
  } catch (err) {
    return false;
  }
}
