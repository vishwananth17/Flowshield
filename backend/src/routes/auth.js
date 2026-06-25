import express from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { pool } from '../services/db.js';
import { authenticateUser } from '../middleware/auth.js';
import { setCsrfCookie } from '../middleware/csrf.js';
import { recordRegistrationAttempt, recordAccountLoginAttempts } from '../services/botDetection.js';
import { auditLogger, sendSecurityEmail } from '../services/auditLogger.js';
import winston from 'winston';

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

import supabase from '../services/supabase.js';

const router = express.Router();

// ------------------------------------------------------------
// User Authentication Proxies (Supabase Auth Integration)
// ------------------------------------------------------------

router.post('/register', async (req, res) => {
  const { email, password, full_name, organization_name } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  if (!email || !password || !organization_name) {
    return res.status(400).json({ detail: "Email, password, and organization name are required." });
  }

  // Rate limit registration attempts (Layer 11.3)
  const allowed = await recordRegistrationAttempt(ip);
  if (!allowed) {
    return res.status(429).json({ detail: "Too many registration attempts from this IP. Please try again in an hour." });
  }

  try {
    // 1. Create User in Supabase Auth
    // Use admin mode if service role key is available to bypass email verification and auto-confirm
    let supabaseUser;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name }
      });
      if (error) throw error;
      supabaseUser = data.user;
    } else {
      // Fallback to standard signUp
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name } }
      });
      if (error) throw error;
      supabaseUser = data.user;
    }

    if (!supabaseUser) {
      return res.status(500).json({ detail: "Failed to create authentication user." });
    }

    // 2. Insert Organization in PostgreSQL
    const orgId = crypto.randomUUID();
    await pool.query(
      'INSERT INTO organizations (id, name, plan) VALUES ($1, $2, $3)',
      [orgId, organization_name, 'free']
    );

    // 3. Insert User in PostgreSQL
    const userRes = await pool.query(
      'INSERT INTO users (id, email, full_name, role, org_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [supabaseUser.id, email.toLowerCase(), full_name, 'owner', orgId]
    );

    const user = userRes.rows[0];

    // 4. Generate first test & live API key for the Organization (Layer 3.1)
    const generateApiKeyHex = () => crypto.randomBytes(32).toString('hex');
    
    // Live key
    const liveRawKey = "fs_live_" + generateApiKeyHex();
    const liveHash = crypto.createHash('sha256').update(liveRawKey).digest('hex');
    await pool.query(
      'INSERT INTO api_keys (key_hash, key_prefix, org_id, environment) VALUES ($1, $2, $3, $4)',
      [liveHash, liveRawKey.substring(0, 16), orgId, 'live']
    );

    // Test key
    const testRawKey = "fs_test_" + generateApiKeyHex();
    const testHash = crypto.createHash('sha256').update(testRawKey).digest('hex');
    await pool.query(
      'INSERT INTO api_keys (key_hash, key_prefix, org_id, environment) VALUES ($1, $2, $3, $4)',
      [testHash, testRawKey.substring(0, 16), orgId, 'test']
    );

    // 5. Sign in user to fetch session access token
    const { data: sessionData, error: sessionErr } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (sessionErr) throw sessionErr;

    // Set secure refresh token and session cookies
    res.cookie('refresh_token', sessionData.session.refresh_token, {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'production',
      sameSite: process.env.ENVIRONMENT === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000 // 7 days
    });

    res.cookie('session_id', crypto.randomBytes(16).toString('hex'), {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'production',
      sameSite: process.env.ENVIRONMENT === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000 // 7 days
    });

    // Set CSRF Cookie
    setCsrfCookie(res);

    await auditLogger.log({
      action: "auth.register.success",
      result: "success",
      actor: user,
      resourceType: "user",
      resourceId: user.id,
      req
    });

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        org_id: user.org_id
      },
      organization: {
        id: orgId,
        name: organization_name,
        plan: 'free'
      },
      access_token: sessionData.session.access_token
    });

  } catch (err) {
    logger.error(`Registration error: ${err.message}`);
    return res.status(400).json({ detail: err.message || "Failed to register account." });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  if (!email || !password) {
    return res.status(400).json({ detail: "Email and password are required." });
  }

  // Scan login attempts from IP (Layer 11.3)
  const allowed = await recordAccountLoginAttempts(ip, email);
  if (!allowed) {
    return res.status(429).json({ detail: "Suspicious login attempts pattern. Access locked for 5 minutes." });
  }

  try {
    // 1. Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Record failed attempts or logs if needed
      await auditLogger.log({
        action: "auth.login.failure",
        result: "failure",
        metadata: { email },
        severity: "warning",
        req
      });
      return res.status(401).json({ detail: "Invalid credentials" });
    }

    // 2. Fetch User and Organization details
    const userRes = await pool.query(
      'SELECT u.*, o.name as org_name, o.plan as org_plan FROM users u LEFT JOIN organizations o ON u.org_id = o.id WHERE u.id = $1',
      [data.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ detail: "User record not found in local database." });
    }

    const user = userRes.rows[0];

    // Set secure refresh token and session cookies
    res.cookie('refresh_token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'production',
      sameSite: process.env.ENVIRONMENT === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000 // 7 days
    });

    const sessionId = crypto.randomBytes(16).toString('hex');
    res.cookie('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'production',
      sameSite: process.env.ENVIRONMENT === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000 // 7 days
    });

    // Update last login
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    // Set CSRF Cookie
    setCsrfCookie(res);

    await auditLogger.log({
      action: "auth.login.success",
      result: "success",
      actor: user,
      resourceType: "user",
      resourceId: user.id,
      req
    });

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        org_id: user.org_id
      },
      organization: {
        id: user.org_id,
        name: user.org_name,
        plan: user.org_plan
      },
      access_token: data.session.access_token
    });

  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    return res.status(400).json({ detail: err.message || "Failed to sign in." });
  }
});

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ detail: "Missing refresh token cookie." });
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) throw error;

    // Reset refresh token cookie with new values
    res.cookie('refresh_token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'production',
      sameSite: process.env.ENVIRONMENT === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000
    });

    return res.status(200).json({
      access_token: data.session.access_token
    });

  } catch (err) {
    logger.error(`Token refresh error: ${err.message}`);
    return res.status(401).json({ detail: "Session expired or invalid." });
  }
});

router.post('/logout', authenticateUser, async (req, res) => {
  try {
    // 1. Sign out on Supabase
    await supabase.auth.signOut();

    // 2. Log event
    if (req.user) {
      await auditLogger.log({
        action: "auth.logout",
        result: "success",
        actor: req.user,
        resourceType: "user",
        resourceId: req.user.id,
        req
      });
    }

    // 3. Clear cookies
    res.clearCookie('refresh_token');
    res.clearCookie('session_id');
    res.clearCookie('flowshield_csrf');

    return res.status(200).json({ status: "ok" });
  } catch (err) {
    logger.error(`Logout error: ${err.message}`);
    return res.status(500).json({ detail: "Logout failed." });
  }
});

router.get('/me', authenticateUser, async (req, res) => {
  // If the user synchronized locally, authenticateUser populates req.user
  if (req.user) {
    const accessHeader = req.headers['authorization'];
    const access_token = accessHeader ? accessHeader.substring(7) : '';

    return res.status(200).json({
      user: {
        id: req.user.id,
        email: req.user.email,
        full_name: req.user.fullName,
        role: req.user.role,
        org_id: req.user.org_id
      },
      organization: {
        id: req.user.org_id,
        name: req.user.orgName,
        plan: req.user.orgPlan
      },
      access_token
    });
  }

  // If authenticated on Supabase but local record is missing
  if (req.tempUser) {
    return res.status(200).json({
      user: {
        id: req.tempUser.id,
        email: req.tempUser.email,
        full_name: req.tempUser.fullName,
        role: 'member',
        org_id: null
      },
      organization: null,
      access_token: ''
    });
  }

  return res.status(401).json({ detail: "Not authenticated" });
});

// ------------------------------------------------------------
// Legal / Consent Endpoints
// ------------------------------------------------------------

router.get('/legal/documents', async (req, res) => {
  try {
    const versionsRes = await pool.query('SELECT * FROM legal_document_versions');
    
    const docs = {
      privacy_policy: { version: "1.0", last_updated: "2026-04-17", url: "https://flowshieldai.com/privacy" },
      terms_of_service: { version: "1.0", last_updated: "2026-04-17", url: "https://flowshieldai.com/terms" },
      dpa: { version: "1.0", last_updated: "2026-04-17", url: "https://flowshieldai.com/dpa" },
      sla: { version: "1.0", last_updated: "2026-04-17", url: "https://flowshieldai.com/sla" },
      cookie_policy: { version: "1.0", last_updated: "2026-04-17", url: "https://flowshieldai.com/cookies" },
      security_policy: { version: "1.0", last_updated: "2026-04-17", url: "https://flowshieldai.com/security" }
    };

    versionsRes.rows.forEach(row => {
      const docKey = row.document_type;
      if (docs[docKey]) {
        docs[docKey].version = row.version;
        docs[docKey].last_updated = row.effective_date;
      }
    });

    return res.status(200).json(docs);
  } catch (err) {
    logger.error(`Get legal docs error: ${err.message}`);
    return res.status(500).json({ detail: "Failed to fetch legal documents." });
  }
});

router.post('/legal/accept', authenticateUser, async (req, res) => {
  const { document, version } = req.body;
  if (!document || !version) {
    return res.status(400).json({ detail: "Document and version are required." });
  }

  const userId = req.user ? req.user.id : (req.tempUser ? req.tempUser.id : null);
  if (!userId) {
    return res.status(401).json({ detail: "Not authenticated" });
  }

  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const userAgent = req.headers['user-agent'] || null;

  try {
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO user_legal_acceptances (id, user_id, document_type, version, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, userId, document, version, clientIp, userAgent]
    );

    return res.status(200).json({ status: "success", message: `Accepted ${document} v${version}` });
  } catch (err) {
    logger.error(`Accept legal document error: ${err.message}`);
    return res.status(500).json({ detail: "Failed to record legal acceptance." });
  }
});

router.get('/legal/acceptances', authenticateUser, async (req, res) => {
  const userId = req.user ? req.user.id : (req.tempUser ? req.tempUser.id : null);
  if (!userId) {
    return res.status(401).json({ detail: "Not authenticated" });
  }

  try {
    const acceptRes = await pool.query(
      'SELECT * FROM user_legal_acceptances WHERE user_id = $1',
      [userId]
    );

    const docTypes = ["privacy_policy", "terms_of_service", "dpa", "sla", "cookie_policy", "security_policy"];
    const results = {};

    docTypes.forEach(doc => {
      const accepts = acceptRes.rows.filter(a => a.document_type === doc);
      if (accepts.length > 0) {
        // Sort descending by date
        accepts.sort((a, b) => new Date(b.accepted_at) - new Date(a.accepted_at));
        const latest = accepts[0];
        results[doc] = {
          accepted: true,
          version: latest.version,
          accepted_at: latest.accepted_at
        };
      } else {
        results[doc] = {
          accepted: false,
          version: null,
          accepted_at: null
        };
      }
    });

    return res.status(200).json(results);
  } catch (err) {
    logger.error(`Get user acceptances error: ${err.message}`);
    return res.status(500).json({ detail: "Failed to fetch user legal acceptances." });
  }
});

router.post('/legal/dpa/request', async (req, res) => {
  const { company_name, gstin, signatory_name, signatory_title, email } = req.body;
  if (!company_name || !gstin || !signatory_name || !email) {
    return res.status(400).json({ detail: "Required fields are missing." });
  }

  const refId = `DPA-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  
  const emailHtml = `
New B2B DPA Signing Request:
Reference: ${refId}
Company Name: ${company_name}
GSTIN: ${gstin}
Signatory Name: ${signatory_name}
Signatory Title: ${signatory_title}
Contact Email: ${email}
  `;

  await sendSecurityEmail(`B2B DPA Signing Request: ${company_name} (${refId})`, emailHtml, "legal@flowshieldai.com");

  return res.status(200).json({
    reference: refId,
    message: "We will send your signed DPA within 2 business days"
  });
});

router.post('/legal/privacy-request', async (req, res) => {
  const { request_type, description, email } = req.body;
  if (!request_type || !description || !email) {
    return res.status(400).json({ detail: "Request type, description, and email are required." });
  }

  const refId = `PR-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  try {
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO privacy_requests (id, reference, request_type, email, description, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, refId, request_type, email, description, 'pending']
    );

    // Confirmation to requester
    const confHtml = `
Your DPDP rights request ticket has been received.
Reference: ${refId}
Request Type: ${request_type}
Our team will review your request and respond within 30 days.
    `;

    // Notification to team
    const teamHtml = `
New DPDP Privacy Rights Request Alert:
Reference: ${refId}
Requester: ${email}
Type: ${request_type}
Description:
${description}
    `;

    await sendSecurityEmail(`[Flowshield AI] Privacy Request Received — ${refId}`, confHtml, email);
    await sendSecurityEmail(`DPDP Rights Request Alert: ${request_type} (${refId})`, teamHtml, "legal@flowshieldai.com");

    return res.status(200).json({ reference: refId });
  } catch (err) {
    logger.error(`Create privacy request error: ${err.message}`);
    return res.status(500).json({ detail: "Failed to submit privacy request." });
  }
});

// ------------------------------------------------------------
// Waitlist Endpoint
// ------------------------------------------------------------

router.post('/waitlist', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ detail: "Email is required." });
  }

  try {
    const existing = await pool.query('SELECT * FROM waitlist WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(200).json({ status: "success", message: "Already on the waitlist!" });
    }

    await pool.query('INSERT INTO waitlist (email) VALUES ($1)', [email]);
    
    // Send welcome email
    await sendSecurityEmail("Welcome to Flowshield AI Waitlist!", "Thank you for joining the waitlist. We will notify you once onboarding slots open.", email);

    return res.status(200).json({ status: "success", message: "Added to waitlist" });
  } catch (err) {
    logger.error(`Join waitlist error: ${err.message}`);
    return res.status(500).json({ detail: "Failed to join waitlist." });
  }
});

router.get('/waitlist/debug-list', authenticateUser, async (req, res) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ detail: "Forbidden: Only organization owners can access waitlist debug details." });
  }

  try {
    const entriesRes = await pool.query('SELECT email, company, created_at FROM waitlist ORDER BY created_at DESC');
    return res.status(200).json({
      count: entriesRes.rows.length,
      entries: entriesRes.rows
    });
  } catch (err) {
    logger.error(`Get waitlist debug error: ${err.message}`);
    return res.status(500).json({ detail: "Failed to fetch waitlist debug log." });
  }
});

export default router;
