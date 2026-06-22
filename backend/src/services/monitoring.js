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
    redisClient.on('error', () => {});
    await redisClient.connect().catch(() => {
      redisClient = null;
    });
  } catch (err) {
    redisClient = null;
  }
}

// In-memory counters fallback
const memoryMetrics = new Map();

/**
 * Increment custom security metric counter (Layer 17.1)
 */
export async function incrementSecurityMetric(name, labels = {}) {
  const labelParts = Object.entries(labels)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${k}=${v}`);
  const labelStr = labelParts.length > 0 ? `:${labelParts.join(',')}` : "";
  const redisKey = `metrics:${name}${labelStr}`;

  if (redisClient) {
    try {
      await redisClient.incr(redisKey);
      return;
    } catch (e) {
      logger.error(`Redis metrics increment failed: ${e.message}`);
    }
  }

  // Memory fallback
  const count = (memoryMetrics.get(redisKey) || 0) + 1;
  memoryMetrics.set(redisKey, count);
}

/**
 * Compile all metrics in Prometheus format (Layer 17.1)
 */
export async function getMetricsPrometheusFormat() {
  const lines = [];

  try {
    if (redisClient) {
      const keys = await redisClient.keys("metrics:*");
      for (const key of keys) {
        const value = await redisClient.get(key);
        const parts = key.split(":");
        const metricName = parts[1];
        
        let labelStr = "";
        if (parts.length > 2 && parts[2]) {
          const labels = {};
          parts[2].split(",").forEach(pair => {
            if (pair.includes("=")) {
              const [k, v] = pair.split("=");
              labels[k] = v;
            }
          });
          labelStr = "{" + Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(",") + "}";
        }

        lines.push(`# TYPE ${metricName} counter`);
        lines.push(`${metricName}${labelStr} ${value}`);
      }
    } else {
      for (const [key, value] of memoryMetrics.entries()) {
        const parts = key.split(":");
        const metricName = parts[1];
        
        let labelStr = "";
        if (parts.length > 2 && parts[2]) {
          const labels = {};
          parts[2].split(",").forEach(pair => {
            if (pair.includes("=")) {
              const [k, v] = pair.split("=");
              labels[k] = v;
            }
          });
          labelStr = "{" + Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(",") + "}";
        }

        lines.push(`# TYPE ${metricName} counter`);
        lines.push(`${metricName}${labelStr} ${value}`);
      }
    }
  } catch (err) {
    logger.error(`Failed to compile prometheus metrics: ${err.message}`);
  }

  return lines.join("\n");
}

/**
 * Fetch aggregated security metrics for health reporting (Layer 17.2)
 */
export async function getSecurityHealthStatus() {
  let bruteForceBlocks = 0;
  let suspiciousIps = 0;
  let rateLimits = 0;

  try {
    const scanKeys = async (pattern) => {
      let sum = 0;
      if (redisClient) {
        const keys = await redisClient.keys(`metrics:${pattern}*`);
        for (const k of keys) {
          const val = await redisClient.get(k);
          sum += parseInt(val || '0', 10);
        }
      } else {
        for (const [k, val] of memoryMetrics.entries()) {
          if (k.startsWith(`metrics:${pattern}`)) {
            sum += val;
          }
        }
      }
      return sum;
    };

    bruteForceBlocks = await scanKeys("flowshield_account_lockouts_total");
    suspiciousIps = await scanKeys("flowshield_suspicious_ips_blocked_total");
    rateLimits = await scanKeys("flowshield_rate_limit_hits_total");
  } catch (err) {
    // Ignore and fallback to 0
  }

  return {
    brute_force_blocks_today: bruteForceBlocks,
    suspicious_ips_blocked: suspiciousIps,
    rate_limit_violations_today: rateLimits,
    last_security_scan: new Date().toISOString()
  };
}
