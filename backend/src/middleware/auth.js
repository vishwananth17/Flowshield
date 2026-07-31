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

    let userId = null;
    let email = '';
    let fullName = 'Flowshield User';

    // 1. Try decoding local JWT
    try {
      const decoded = jwt.decode(token);
      if (decoded && (decoded.sub || decoded.user_id || decoded.id)) {
        userId = decoded.sub || decoded.user_id || decoded.id;
        email = decoded.email || '';
      }
    } catch (e) {
      // Ignore local decode error
    }

    // 2. Try Supabase verification if local decode didn't yield sub
    if (!userId && supabase) {
      try {
        const { data: { user: sbUser } } = await supabase.auth.getUser(token);
        if (sbUser) {
          userId = sbUser.id;
          email = sbUser.email || '';
          fullName = sbUser.user_metadata?.full_name || fullName;
        }
      } catch (e) {
        // Ignore Supabase verification error
      }
    }

    if (!userId) {
      return res.status(401).json({ detail: "Invalid or expired session token." });
    }

    // Retrieve user from our database
    const userRes = await pool.query(
      'SELECT u.*, o.name as org_name, o.plan as org_plan FROM users u LEFT JOIN organizations o ON u.org_id = o.id WHERE u.id = $1',
      [userId]
    );

    if (userRes.rows.length === 0) {
      // Auto provision org and user if absent in local database
      const orgName = `${fullName}'s Org`;
      
      const orgIns = await pool.query(
        `INSERT INTO organizations (name, plan, subscription_status)
         VALUES ($1, 'free', 'active')
         RETURNING id, name, plan`,
        [orgName]
      );
      const newOrg = orgIns.rows[0];

      const userIns = await pool.query(
        `INSERT INTO users (id, org_id, email, full_name, role, is_active)
         VALUES ($1, $2, $3, $4, 'owner', true)
         RETURNING id, email, full_name, role, org_id`,
        [userId, newOrg.id, email || `user_${userId.slice(0, 8)}@flowshield.ai`, fullName]
      );
      const newUser = userIns.rows[0];

      req.user = {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role,
        org_id: newUser.org_id,
        orgName: newOrg.name,
        orgPlan: newOrg.plan
      };

      return next();
    }

    const user = userRes.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ detail: "User account is disabled." });
    }

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
