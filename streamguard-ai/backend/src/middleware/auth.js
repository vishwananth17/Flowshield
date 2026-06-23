import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../services/db.js';
import supabase from '../services/supabase.js';
import winston from 'winston';

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

/**
 * Middleware to authenticate dashboard users using Supabase JWT.
 */
export async function authenticateUser(req, res, next) {
  try {
    let token = null;
    
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = req.cookies?.access_token;
    }

    if (!token) {
      return res.status(401).json({ detail: "Not authenticated. Missing token." });
    }


    // Verify Supabase JWT using the Supabase SDK (supports both HS256 and ECC P-256)
    const { data: { user: sbUser }, error: sbErr } = await supabase.auth.getUser(token);
    
    if (sbErr || !sbUser) {
      return res.status(401).json({ detail: "Invalid or expired session token." });
    }

    // Retrieve user from our database to check status, role, and org_id
    const userRes = await pool.query(
      'SELECT u.*, o.name as org_name, o.plan as org_plan FROM users u LEFT JOIN organizations o ON u.org_id = o.id WHERE u.id = $1',
      [sbUser.id]
    );

    if (userRes.rows.length === 0) {
      // User is authenticated in Supabase but not yet synchronized in our DB
      // We can extract metadata and dynamically sync them
      const email = sbUser.email || '';
      const fullName = sbUser.user_metadata?.full_name || '';
      
      req.tempUser = {
        id: sbUser.id,
        email: email,
        fullName: fullName
      };
      
      // Let it pass but flag it so routing can handle registration finalization
      return next();
    }

    const user = userRes.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ detail: "User account is disabled." });
    }

    // Attach to request
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      org_id: user.org_id,
      orgName: user.org_name,
      orgPlan: user.org_plan
    };

    next();
  } catch (err) {
    logger.error(`User authentication error: ${err.message}`);
    return res.status(500).json({ detail: "Internal authentication error." });
  }
}

/**
 * Timing-safe utility to compare two key hashes.
 */
function safeCompare(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Middleware to authenticate neobank API calls using custom X-API-Key.
 */
export async function authenticateAPIKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ detail: "X-API-Key header is missing" });
  }

  // Generate prefix and hash
  const keyPrefix = apiKey.substring(0, 16);
  const incomingHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  const startTime = process.hrtime();

  try {
    // 3.3 Query DB using Prefix
    const keyRes = await pool.query(
      'SELECT * FROM api_keys WHERE key_prefix = $1 AND is_active = true',
      [keyPrefix]
    );

    let verified = false;
    let dbKey = null;

    if (keyRes.rows.length > 0) {
      dbKey = keyRes.rows[0];
      // Compare hashes securely in timing-safe way (Layer 3.3)
      verified = safeCompare(dbKey.key_hash, incomingHash);
    }

    // If key not found or hash mismatch, simulate validation timing (Layer 3.3)
    if (!verified) {
      const elapsed = process.hrtime(startTime);
      const elapsedMs = elapsed[0] * 1000 + elapsed[1] / 1000000;
      const delay = Math.max(50, 150 - elapsedMs); // Target ~150ms timing target to mitigate enumeration
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return res.status(401).json({ detail: "Invalid or inactive API Key" });
    }

    // Attach API key context to request
    req.apiKey = {
      id: dbKey.id,
      prefix: dbKey.key_prefix,
      org_id: dbKey.org_id,
      environment: dbKey.environment,
      scopes: dbKey.scopes || []
    };

    // Update last_used_at timestamp in background
    pool.query('UPDATE api_keys SET last_used_at = NOW() WHERE id = $1', [dbKey.id]).catch(() => {});

    next();
  } catch (err) {
    logger.error(`API Key authentication error: ${err.message}`);
    return res.status(500).json({ detail: "Internal authentication error." });
  }
}
