import { pool } from './db.js';
import { sendSecurityEmail } from './auditLogger.js';
import { createClient } from 'redis';
import winston from 'winston';

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});
const REDIS_URL = process.env.REDIS_URL;
let redisClient = null;

if (REDIS_URL) {
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
// In-memory maintenance mode tracking
let localMaintenanceMode = false;
const localBlockedIps = new Set();

/**
 * Add IP to blocked list in Redis (Layer 16.1)
 */
export async function blockIpAddress(ip, durationSeconds = 86400) {
  if (redisClient) {
    try {
      await redisClient.sAdd("security:blocked_ips", ip);
      await redisClient.setEx(`ip_block_ttl:${ip}`, durationSeconds, "1");
    } catch (e) {
      logger.error(`Redis block IP failed: ${e.message}`);
    }
  } else {
    localBlockedIps.add(ip);
    setTimeout(() => {
      localBlockedIps.delete(ip);
    }, durationSeconds * 1000);
  }

  await sendSecurityEmail(
    "[SECURITY ALERT] IP Address Blocked",
    `IP address ${ip} has been blocked automatically for ${durationSeconds} seconds due to high threat index.`
  );
}

/**
 * Check if maintenance mode is active.
 */
export async function isMaintenanceModeActive() {
  if (redisClient) {
    try {
      const mode = await redisClient.get("maintenance_mode");
      return mode === "1";
    } catch (e) {
      return localMaintenanceMode;
    }
  }
  return localMaintenanceMode;
}

/**
 * Middleware to check maintenance mode status (Layer 16.2)
 */
export async function maintenanceModeMiddleware(req, res, next) {
  const isMaintenance = await isMaintenanceModeActive();
  if (isMaintenance && !req.path.includes('/admin/disable-lockdown')) {
    return res.status(503).json({
      detail: "System is in maintenance mode due to a critical security lockdown. Please contact support."
    });
  }
  next();
}

/**
 * Temporarily suspend all API keys, invalidate all active sessions, and enable maintenance mode (Layer 16.2).
 */
export async function triggerEmergencyLockdown() {
  // 1. Suspend all API keys in PostgreSQL
  await pool.query('UPDATE api_keys SET is_active = false');
  
  // 2. Invalidate all Redis sessions/caches
  if (redisClient) {
    try {
      const keys = await redisClient.keys("session:*");
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      const apiCacheKeys = await redisClient.keys("apikey:*");
      if (apiCacheKeys.length > 0) {
        await redisClient.del(apiCacheKeys);
      }
      // 3. Set maintenance mode flag
      await redisClient.set("maintenance_mode", "1");
    } catch (e) {
      logger.error(`Redis lockdown updates failed: ${e.message}`);
    }
  }

  localMaintenanceMode = true;

  // Send critical email alert
  await sendSecurityEmail(
    "[CRITICAL] EMERGENCY SYSTEM LOCKDOWN TRIGGERED",
    "All API keys have been suspended. All active dashboard sessions have been terminated. Maintenance mode is active.",
    "legal@flowshieldai.com"
  );

  return { status: "lockdown_active", message: "Emergency system lockdown successfully activated." };
}

/**
 * Re-enable all API keys and lift maintenance mode.
 */
export async function disableEmergencyLockdown() {
  // 1. Restore all API keys in DB
  await pool.query('UPDATE api_keys SET is_active = true');
  
  // 2. Clear maintenance flags
  if (redisClient) {
    try {
      await redisClient.del("maintenance_mode");
    } catch (e) {
      logger.error(`Redis disable maintenance failed: ${e.message}`);
    }
  }

  localMaintenanceMode = false;

  await sendSecurityEmail(
    "[INFO] Emergency System Lockdown Lifted",
    "Emergency lockdown lifted. API keys have been re-enabled and dashboard operations restored.",
    "legal@flowshieldai.com"
  );

  return { status: "lockdown_inactive", message: "System lockdown successfully deactivated." };
}
