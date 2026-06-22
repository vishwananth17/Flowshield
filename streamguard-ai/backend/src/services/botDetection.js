import { createClient } from 'redis';
import winston from 'winston';

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379/0";
let redisClient = null;

if (process.env.ENVIRONMENT === 'production' || process.env.REDIS_URL) {
  try {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => logger.error(`Redis Error: ${err.message}`));
    await redisClient.connect().catch((e) => {
      logger.error(`Redis connection failed for BotDetection: ${e.message}`);
      redisClient = null;
    });
  } catch (err) {
    redisClient = null;
  }
}

// In-memory sets fallback if Redis is unavailable
const memorySets = {
  blockedIps: new Set(),
  torExitNodes: new Set(),
  suspiciousIps: new Set(),
  counters: new Map(), // key -> { count, expires }
  members: new Map() // key -> Set of values
};

// Periodic in-memory cleanups
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of memorySets.counters.entries()) {
    if (val.expires < now) memorySets.counters.delete(key);
  }
  for (const [key, val] of memorySets.members.entries()) {
    // Basic expiry check if set exists
    if (val.expires < now) memorySets.members.delete(key);
  }
}, 60000);

const TOR_EXIT_NODES_KEY = "security:tor_exit_nodes";
const BLOCKED_IPS_KEY = "security:blocked_ips";
const SUSPICIOUS_IPS_KEY = "security:suspicious_ips";

// ------------------------------------------------------------
// 11.1 IP Reputation Checking
// ------------------------------------------------------------

export async function checkIpReputation(ip) {
  if (redisClient) {
    try {
      const isBlocked = await redisClient.sIsMember(BLOCKED_IPS_KEY, ip);
      if (isBlocked) return "blocked";
      const isTor = await redisClient.sIsMember(TOR_EXIT_NODES_KEY, ip);
      if (isTor) return "tor";
      const isSuspicious = await redisClient.sIsMember(SUSPICIOUS_IPS_KEY, ip);
      if (isSuspicious) return "suspicious";
      return "clean";
    } catch (e) {
      logger.error(`Redis checkIpReputation failed: ${e.message}`);
    }
  }

  // Memory fallbacks
  if (memorySets.blockedIps.has(ip)) return "blocked";
  if (memorySets.torExitNodes.has(ip)) return "tor";
  if (memorySets.suspiciousIps.has(ip)) return "suspicious";
  return "clean";
}

export async function updateTorExitNodes() {
  try {
    const resp = await fetch("https://check.torproject.org/torbulkexitlist", { signal: AbortSignal.timeout(10000) });
    if (resp.ok) {
      const text = await resp.text();
      const ips = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
      
      if (redisClient) {
        await redisClient.del(TOR_EXIT_NODES_KEY);
        if (ips.length > 0) {
          await redisClient.sAdd(TOR_EXIT_NODES_KEY, ips);
        }
      } else {
        memorySets.torExitNodes.clear();
        ips.forEach(ip => memorySets.torExitNodes.add(ip));
      }
      logger.info("Successfully refreshed Tor exit nodes.");
    }
  } catch (err) {
    logger.error(`Failed to refresh Tor exit nodes: ${err.message}`);
  }
}

// ------------------------------------------------------------
// 11.2 User Agent Analysis
// ------------------------------------------------------------

const BOT_UA_PATTERNS = [
  /python-requests/i, /curl\//i, /wget\//i,
  /Go-http-client/i, /okhttp/i, /axios\//i,
  /node-fetch/i, /bot/i, /crawler/i, /spider/i
];

export function isBotUserAgent(userAgent) {
  if (!userAgent) return false;
  return BOT_UA_PATTERNS.some(regex => regex.test(userAgent));
}

// Helper to increment with expire fallback
async function incrWithExpire(key, expireSeconds) {
  if (redisClient) {
    try {
      const count = await redisClient.incr(key);
      if (count === 1) {
        await redisClient.expire(key, expireSeconds);
      }
      return count;
    } catch (e) {
      logger.error(`Redis incr failed: ${e.message}`);
    }
  }

  // Memory fallback
  const now = Date.now();
  let val = memorySets.counters.get(key);
  if (!val || val.expires < now) {
    val = { count: 1, expires: now + (expireSeconds * 1000) };
  } else {
    val.count += 1;
  }
  memorySets.counters.set(key, val);
  return val.count;
}

// Helper to add to set and return cardinality
async function saddWithExpire(key, value, expireSeconds) {
  if (redisClient) {
    try {
      await redisClient.sAdd(key, value);
      await redisClient.expire(key, expireSeconds);
      return await redisClient.sCard(key);
    } catch (e) {
      logger.error(`Redis sadd failed: ${e.message}`);
    }
  }

  // Memory fallback
  const now = Date.now();
  let setVal = memorySets.members.get(key);
  if (!setVal || setVal.expires < now) {
    setVal = { set: new Set(), expires: now + (expireSeconds * 1000) };
  }
  setVal.set.add(value);
  memorySets.members.set(key, setVal);
  return setVal.set.size;
}

// ------------------------------------------------------------
// 11.3 Behavioral Anomaly Detection
// ------------------------------------------------------------

export async function recordRegistrationAttempt(ip) {
  const count = await incrWithExpire(`reg_attempts:${ip}`, 3600); // 1 hour window
  return count <= 3;
}

export async function recordApiKeyAttempt(ip) {
  const count = await incrWithExpire(`invalid_keys:${ip}`, 300); // 5 min window
  return count <= 5;
}

export async function recordAccountLoginAttempts(ip, email) {
  const count = await saddWithExpire(`ip_logins:${ip}`, email, 300); // 5 min window
  return count <= 10;
}

export async function recordRepeatedBody(ip, bodyHash) {
  const count = await incrWithExpire(`repeated_body:${ip}:${bodyHash}`, 60); // 1 min window
  return count <= 5;
}

// ------------------------------------------------------------
// 11.4 Geo-blocking
// ------------------------------------------------------------

export async function getIpCountry(ip) {
  if (!ip || ip === "127.0.0.1" || ip === "localhost" || ip === "::1" || ip === "unknown") {
    return "IN";
  }
  try {
    const resp = await fetch(`https://ipapi.co/${ip}/country/`, { signal: AbortSignal.timeout(2000) });
    if (resp.ok) {
      const text = await resp.text();
      return text.trim().toUpperCase();
    }
  } catch (err) {
    // Ignore and fallback
  }
  return "IN";
}

export async function checkGeoBlocking(ip, blockedCountries) {
  if (!blockedCountries || blockedCountries.length === 0) {
    return false;
  }
  const country = await getIpCountry(ip);
  return blockedCountries.includes(country);
}
