import { createClient } from 'redis';
import { checkIpReputation } from '../services/botDetection.js';
import { pool } from '../services/db.js';
import winston from 'winston';

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379/0";
let redisClient = null;

if (process.env.ENVIRONMENT === 'production' || process.env.REDIS_URL) {
  try {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', () => {});
    await redisClient.connect().catch(() => {
      redisClient = null;
    });
  } catch (err) {
    redisClient = null;
  }
}

// In-memory rate limiting fallback
const memoryLimits = {
  windowMap: new Map(), // key -> { count, windowStart }
  concurrencyMap: new Map(), // key -> count
  keySharingMap: new Map() // key -> Set of IPs
};

// Periodic cleanups
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of memoryLimits.windowMap.entries()) {
    if (val.windowStart + 60000 < now) memoryLimits.windowMap.delete(key);
  }
}, 30000);

/**
 * Increment and check rate limit window (sliding window proxy)
 */
async function checkLimit(key, limit, windowSizeMs = 60000) {
  if (redisClient) {
    try {
      const p = redisClient.multi();
      p.incr(key);
      p.ttl(key);
      const [count, ttl] = await p.execute();
      if (count === 1) {
        await redisClient.expire(key, Math.floor(windowSizeMs / 1000));
      }
      return { count, remaining: Math.max(0, limit - count) };
    } catch (e) {
      logger.error(`Redis rate limit error: ${e.message}`);
    }
  }

  // Memory fallback
  const now = Date.now();
  let val = memoryLimits.windowMap.get(key);
  if (!val || val.windowStart + windowSizeMs < now) {
    val = { count: 1, windowStart: now };
  } else {
    val.count += 1;
  }
  memoryLimits.windowMap.set(key, val);
  return { count: val.count, remaining: Math.max(0, limit - val.count) };
}

/**
 * Global IP and Endpoint Rate Limiting Middleware (Layer 4.1 / 4.2)
 */
export async function globalRateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const ipRep = await checkIpReputation(ip);

  // 1. Set limit based on reputation (Layer 4.1)
  let limit = 1000; // Normal client (1000/min)
  if (ipRep === 'bot') {
    limit = 100; // Bot client (100/min)
  } else if (ipRep === 'tor') {
    limit = 10; // Tor exit node (10/min)
  }

  // Auth endpoint override (Layer 4.2)
  const isAuth = req.path.includes('/auth/');
  if (isAuth) {
    limit = 10; // Auth routes max 10/min
  }

  const cacheKey = `rate:ip:${ip}:${isAuth ? 'auth' : 'global'}`;
  const { count, remaining } = await checkLimit(cacheKey, limit, 60000);

  // Set standard rate limit headers (Layer 4.5)
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', 60);

  if (count > limit) {
    return res.status(429).json({
      detail: "Too many requests. Rate limit exceeded.",
      retry_after: 60
    });
  }

  next();
}

/**
 * Concurrency Limiter Middleware (Layer 4.4)
 */
export function concurrencyLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const apiKeyPrefix = req.apiKey ? req.apiKey.prefix : null;

  const ipKey = `concurrent:ip:${ip}`;
  const keyKey = apiKeyPrefix ? `concurrent:key:${apiKeyPrefix}` : null;

  // Increment counters
  const currentIpCount = (memoryLimits.concurrencyMap.get(ipKey) || 0) + 1;
  memoryLimits.concurrencyMap.set(ipKey, currentIpCount);

  let currentKeyCount = 0;
  if (keyKey) {
    currentKeyCount = (memoryLimits.concurrencyMap.get(keyKey) || 0) + 1;
    memoryLimits.concurrencyMap.set(keyKey, currentKeyCount);
  }

  // Exceeded limits?
  // Max 50 per IP, max 10 per API Key
  if (currentIpCount > 50 || (keyKey && currentKeyCount > 10)) {
    // Decrement since request is rejected
    memoryLimits.concurrencyMap.set(ipKey, currentIpCount - 1);
    if (keyKey) memoryLimits.concurrencyMap.set(keyKey, currentKeyCount - 1);

    return res.status(429).json({ detail: "Concurrent request limit exceeded." });
  }

  // Cleanup on request end
  const decrement = () => {
    const cIp = memoryLimits.concurrencyMap.get(ipKey) || 1;
    memoryLimits.concurrencyMap.set(ipKey, Math.max(0, cIp - 1));

    if (keyKey) {
      const cKey = memoryLimits.concurrencyMap.get(keyKey) || 1;
      memoryLimits.concurrencyMap.set(keyKey, Math.max(0, cKey - 1));
    }
  };

  res.on('finish', decrement);
  res.on('close', decrement);

  next();
}

/**
 * Plan-based monthly rate limits & Sharing detection (Layer 4.3 / Layer 4.6)
 */
export async function planUsageLimiter(req, res, next) {
  if (!req.apiKey) return next();

  const orgId = req.apiKey.org_id;
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  try {
    // Fetch Organization plan details
    const orgRes = await pool.query('SELECT plan FROM organizations WHERE id = $1', [orgId]);
    if (orgRes.rows.length === 0) return next();

    const plan = orgRes.rows[0].plan;
    
    // Limits: Free=1000, Basic=25000, Standard=100000, Premium=unlimited
    let monthlyLimit = 1000;
    if (plan === 'basic') monthlyLimit = 25000;
    else if (plan === 'standard') monthlyLimit = 100000;
    else if (plan === 'premium') monthlyLimit = Infinity;

    if (monthlyLimit !== Infinity) {
      // Check current month's usage in DB
      const currentMonthStart = new Date();
      currentMonthStart.setDate(1);
      currentMonthStart.setHours(0,0,0,0);

      const usageRes = await pool.query(
        'SELECT COUNT(*) FROM transactions WHERE org_id = $1 AND timestamp >= $2',
        [orgId, currentMonthStart]
      );
      const currentUsage = parseInt(usageRes.rows[0].count, 10);

      if (currentUsage >= monthlyLimit) {
        return res.status(403).json({ detail: "Monthly plan rate limit exceeded. Please upgrade." });
      }
    }

    // 2. Key sharing detection anomaly: same API key used by >10 different IPs in 1 hour (Layer 4.6)
    const keySharingCacheKey = `key_sharing:${req.apiKey.prefix}`;
    let uniqueIps = 0;
    
    if (redisClient) {
      await redisClient.sAdd(keySharingCacheKey, ip);
      await redisClient.expire(keySharingCacheKey, 3600); // 1 hour expiration
      uniqueIps = await redisClient.sCard(keySharingCacheKey);
    } else {
      let ipSet = memoryLimits.keySharingMap.get(keySharingCacheKey);
      if (!ipSet) {
        ipSet = new Set();
        memoryLimits.keySharingMap.set(keySharingCacheKey, ipSet);
      }
      ipSet.add(ip);
      uniqueIps = ipSet.size;
    }

    if (uniqueIps > 10) {
      logger.warn(`⚠️ Anomaly detected: API key ${req.apiKey.prefix} shared from ${uniqueIps} different IPs in the last hour!`);
      // Trigger warning flag/email logging if desired
    }

    next();
  } catch (err) {
    logger.error(`Plan usage checking error: ${err.message}`);
    next();
  }
}
