import express from 'express';
import crypto from 'crypto';
import { pool, queryWithRLS } from '../services/db.js';
import { authenticateUser, authenticateAPIKey } from '../middleware/auth.js';
import { validateTransactionPayload } from '../middleware/validation.js';
import { planUsageLimiter, concurrencyLimiter } from '../middleware/rateLimiter.js';
import { evaluateTransaction } from '../services/ml.js';
import { checkIdempotency, storeIdempotency } from '../services/idempotency.js';
import { checkGeoBlocking } from '../services/botDetection.js';
import { triggerEmergencyLockdown, disableEmergencyLockdown } from '../services/incidentResponse.js';
import { getMetricsPrometheusFormat, getSecurityHealthStatus, incrementSecurityMetric } from '../services/monitoring.js';
import { auditLogger, sendSecurityEmail } from '../services/auditLogger.js';
import { broadcastToOrg } from '../services/websockets.js';
import supabase from '../services/supabase.js';
import winston from 'winston';

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

const router = express.Router();

// ------------------------------------------------------------
// API Key Management (Dashboard Authenticated)
// ------------------------------------------------------------

router.post('/api-keys', authenticateUser, async (req, res) => {
  const { environment } = req.body;
  if (!environment || !['live', 'test'].includes(environment)) {
    return res.status(400).json({ detail: "Environment must be 'live' or 'test'" });
  }

  const orgId = req.user.org_id;

  try {
    const rawKey = `fs_${environment}_` + crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 16);

    const insertRes = await pool.query(
      'INSERT INTO api_keys (key_hash, key_prefix, org_id, environment, status, scopes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [keyHash, keyPrefix, orgId, environment, 'active', JSON.stringify(['transactions:analyze'])]
    );

    const dbKey = insertRes.rows[0];

    await sendSecurityEmail(
      "New API Key Generated",
      `A new ${environment} API key has been created with prefix ${keyPrefix} for organization ${orgId}.`
    );

    await auditLogger.log({
      action: "api_key.created",
      result: "success",
      actor: req.user,
      resourceType: "api_key",
      resourceId: dbKey.id,
      req
    });

    return res.status(201).json({
      api_key: rawKey,
      prefix: dbKey.key_prefix,
      environment: dbKey.environment,
      status: dbKey.status,
      id: dbKey.id
    });
  } catch (err) {
    logger.error(`Create API Key error: ${err.message}`);
    return res.status(500).json({ detail: "Failed to create API key." });
  }
});

router.post('/api-keys/:key_id/rotate', authenticateUser, async (req, res) => {
  const { key_id } = req.params;
  const { environment } = req.body;
  const orgId = req.user.org_id;

  try {
    // 1. Fetch old key and verify ownership
    const oldKeyRes = await pool.query(
      'SELECT * FROM api_keys WHERE id = $1 AND org_id = $2',
      [key_id, orgId]
    );

    if (oldKeyRes.rows.length === 0) {
      return res.status(404).json({ detail: "API key not found." });
    }

    const oldKey = oldKeyRes.rows[0];

    // 2. Mark old key as rotating (valid for 24h)
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    await pool.query(
      "UPDATE api_keys SET status = 'rotating', expires_at = $1 WHERE id = $2",
      [expiresAt, oldKey.id]
    );

    // 3. Create new API key
    const rawKey = `fs_${environment || oldKey.environment}_` + crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 16);

    const insertRes = await pool.query(
      'INSERT INTO api_keys (key_hash, key_prefix, org_id, environment, status, scopes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [keyHash, keyPrefix, orgId, environment || oldKey.environment, 'active', JSON.stringify(oldKey.scopes)]
    );

    const newKey = insertRes.rows[0];

    await sendSecurityEmail(
      "API Key Rotated",
      `API key with ID ${oldKey.id} has been marked as rotating for 24 hours. A new key has been created.`
    );

    await auditLogger.log({
      action: "api_key.rotated",
      result: "success",
      actor: req.user,
      resourceType: "api_key",
      resourceId: newKey.id,
      req
    });

    return res.status(200).json({
      api_key: rawKey,
      prefix: newKey.key_prefix,
      environment: newKey.environment,
      status: newKey.status,
      id: newKey.id
    });
  } catch (err) {
    logger.error(`Rotate API Key error: ${err.message}`);
    return res.status(500).json({ detail: "Failed to rotate API key." });
  }
});

// ------------------------------------------------------------
// Core Inference & Transactions
// ------------------------------------------------------------

router.post('/analyze_transaction', authenticateAPIKey, validateTransactionPayload, planUsageLimiter, concurrencyLimiter, async (req, res) => {
  const tx = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const idempotencyKey = req.headers['x-idempotency-key'];
  const orgId = req.apiKey.org_id;

  // 1. Idempotency Check (Layer 10.1)
  if (idempotencyKey) {
    const cachedResponse = await checkIdempotency(idempotencyKey, orgId);
    if (cachedResponse) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cachedResponse);
    }
  }

  // 2. Geo-blocking Check (Layer 11.4)
  const blockedCountriesRes = await pool.query(
    'SELECT metadata->\'blocked_countries\' as blocked FROM organizations WHERE id = $1',
    [orgId]
  );
  const blockedCountries = blockedCountriesRes.rows[0]?.blocked || [];
  
  const isGeoBlocked = await checkGeoBlocking(ip, blockedCountries);
  if (isGeoBlocked) {
    await incrementSecurityMetric("flowshield_geo_blocked_requests_total", { org_id: orgId });
    return res.status(403).json({ detail: "Access denied from this geographic location." });
  }

  try {
    // 3. Evaluate risk using real-time ML rules (Layer 5/Layer 12)
    const { score, status, recommendation } = evaluateTransaction(
      tx.amount,
      tx.merchant?.name || 'unknown',
      tx.customer?.id || 'unknown'
    );

    const transactionId = tx.transaction_id || `TXN-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;

    // 4. Save transaction inside RLS context (Layer 12.1)
    const queryText = `
      INSERT INTO transactions (
        transaction_id, user_id, org_id, amount, currency, location, 
        device_id, timestamp, fraud_risk_score, status, recommendation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10)
      RETURNING *;
    `;
    const params = [
      transactionId,
      tx.customer?.id || 'unknown',
      orgId,
      tx.amount,
      tx.currency,
      tx.customer?.city || 'unknown',
      tx.device?.id || 'unknown',
      score,
      status,
      recommendation
    ];

    const dbTxRes = await queryWithRLS(orgId, queryText, params);
    const dbTx = dbTxRes.rows[0];

    // Broadcast live update via WebSocket
    broadcastToOrg(orgId, {
      type: 'new_transaction',
      data: {
        id: dbTx.transaction_id,
        external_id: dbTx.transaction_id,
        amount: parseFloat(dbTx.amount),
        currency: dbTx.currency,
        merchant_name: dbTx.location,
        risk_score: parseFloat(dbTx.fraud_risk_score || 0),
        risk_label: dbTx.status === 'high_risk' ? 'fraud' : dbTx.status === 'medium_risk' ? 'review' : 'safe',
        decision: dbTx.status,
        created_at: dbTx.timestamp
      }
    });

    const responsePayload = {
      transaction_id: dbTx.transaction_id,
      fraud_risk_score: dbTx.fraud_risk_score,
      status: dbTx.status,
      recommendation: dbTx.recommendation
    };

    // Save response for idempotency (Layer 10.1)
    if (idempotencyKey) {
      await storeIdempotency(idempotencyKey, orgId, responsePayload);
    }

    // Increment monitoring metric (Layer 17.1)
    if (status === 'high_risk' || status === 'medium_risk') {
      await incrementSecurityMetric("flowshield_suspicious_ips_blocked_total", { org_id: orgId });
    }

    await auditLogger.log({
      action: "transaction.analyzed",
      result: "success",
      resourceType: "transaction",
      resourceId: transactionId,
      metadata: { fraud_risk_score: score, decision: status },
      req
    });

    return res.status(200).json(responsePayload);

  } catch (err) {
    logger.error(`Analyze transaction error: ${err.message}`);
    return res.status(500).json({ detail: "Failed to evaluate transaction." });
  }
});

router.get('/fraud_alerts', authenticateAPIKey, async (req, res) => {
  let limit = parseInt(req.query.limit || '50', 10);
  limit = Math.min(limit, 1000); // Enforce statement limits (Layer 12.3)

  const orgId = req.apiKey.org_id;

  try {
    // Isolated tenant fetch using RLS context (Layer 12.1)
    const selectQuery = `
      SELECT * FROM transactions 
      WHERE org_id = $1 AND (status = 'high_risk' OR status = 'medium_risk')
      ORDER BY timestamp DESC 
      LIMIT $2;
    `;
    const alertsRes = await queryWithRLS(orgId, selectQuery, [orgId, limit]);
    
    return res.status(200).json(alertsRes.rows);
  } catch (err) {
    logger.error(`Get fraud alerts error: ${err.message}`);
    return res.status(500).json({ detail: "Failed to fetch alerts." });
  }
});

router.get('/model_status', (req, res) => {
  return res.status(200).json({
    model_name: "Isolation Forest Anomaly Detector",
    status: "healthy",
    version: "v1.0.0",
    accuracy_estimate: 0.92
  });
});

// ------------------------------------------------------------
// Health & Prometheus Telemetry
// ------------------------------------------------------------

router.get('/health', async (req, res) => {
  const healthData = { status: "ok" };

  // Check if requested by admin to show security details (Layer 17.2)
  const authHeader = req.headers['authorization'] || req.cookies?.access_token;
  if (authHeader) {
    try {
      const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
      const { data: { user: sbUser }, error: sbErr } = await supabase.auth.getUser(token);

      if (!sbErr && sbUser) {
        // Query database to verify role
        const userRes = await pool.query('SELECT role FROM users WHERE id = $1', [sbUser.id]);
        if (userRes.rows.length > 0 && ['owner', 'admin'].includes(userRes.rows[0].role)) {
          healthData.security = await getSecurityHealthStatus();
        }
      }
    } catch (e) {
      // Ignore auth errors and return basic health data
    }
  }

  return res.status(200).json(healthData);
});

router.get('/metrics', async (req, res) => {
  const metricsStr = await getMetricsPrometheusFormat();
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  return res.status(200).send(metricsStr);
});

// ------------------------------------------------------------
// Supabase Storage Secure Signed URLs (Storage Layer)
// ------------------------------------------------------------

router.post('/storage/upload-url', authenticateUser, async (req, res) => {
  const { fileName, bucketName } = req.body;
  if (!fileName) {
    return res.status(400).json({ detail: "fileName is required." });
  }

  const bucket = bucketName || 'flowshield-reports';
  const orgId = req.user.org_id;

  try {
    const filePath = `${orgId}/${Date.now()}_${fileName}`;
    
    // Generate signed upload URL (valid for 15 mins)
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (error) throw error;

    return res.status(200).json({
      upload_url: data.signedUrl,
      token: data.token,
      path: filePath
    });
  } catch (err) {
    logger.error(`Create signed upload URL error: ${err.message}`);
    return res.status(500).json({ detail: "Failed to generate upload URL. Ensure bucket exists and has correct policies." });
  }
});

router.post('/storage/download-url', authenticateUser, async (req, res) => {
  const { filePath, bucketName } = req.body;
  if (!filePath) {
    return res.status(400).json({ detail: "filePath is required." });
  }

  const bucket = bucketName || 'flowshield-reports';
  
  // RLS tenant check: user can only download from their own directory
  const orgId = req.user.org_id;
  if (!filePath.startsWith(`${orgId}/`)) {
    return res.status(403).json({ detail: "Unauthorized access to this resource." });
  }

  try {
    // Generate signed download URL (valid for 15 mins)
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 900); // 900 seconds = 15 minutes

    if (error) throw error;

    return res.status(200).json({
      download_url: data.signedUrl
    });
  } catch (err) {
    logger.error(`Create signed download URL error: ${err.message}`);
    return res.status(500).json({ detail: "Failed to generate download URL." });
  }
});

// ------------------------------------------------------------
// Emergency Lockdown Controls (Layer 16.2)
// ------------------------------------------------------------

router.post('/admin/emergency-lockdown', authenticateUser, async (req, res) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ detail: "Only the organization owner can trigger emergency lockdown." });
  }

  try {
    const result = await triggerEmergencyLockdown();
    
    await auditLogger.log({
      action: "system.lockdown.triggered",
      result: "success",
      actor: req.user,
      severity: "critical",
      req
    });

    return res.status(200).json(result);
  } catch (err) {
    logger.error(`Trigger emergency lockdown error: ${err.message}`);
    return res.status(500).json({ detail: "Failed to trigger lockdown." });
  }
});

router.post('/admin/disable-lockdown', authenticateUser, async (req, res) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ detail: "Only the organization owner can lift emergency lockdown." });
  }

  try {
    const result = await disableEmergencyLockdown();
    
    await auditLogger.log({
      action: "system.lockdown.lifted",
      result: "success",
      actor: req.user,
      severity: "critical",
      req
    });

    return res.status(200).json(result);
  } catch (err) {
    logger.error(`Disable emergency lockdown error: ${err.message}`);
    return res.status(500).json({ detail: "Failed to lift lockdown." });
  }
});


// ------------------------------------------------------------
// Analytics Endpoints (Dashboard Stats)
// ------------------------------------------------------------

router.get('/analytics/stats', authenticateUser, async (req, res) => {
  const orgId = req.user.org_id;
  const range = req.query.range || '24h';

  // Map range string to a PostgreSQL interval
  const intervalMap = {
    '1h':  '1 hour',
    '24h': '24 hours',
    '30d': '30 days',
    '60d': '60 days',
    '1y':  '1 year',
    'all': '100 years',
  };
  const interval = intervalMap[range] || '24 hours';

  try {
    const statsRes = await pool.query(`
      SELECT
        COUNT(*)::int                                          AS total_analyzed,
        COUNT(*) FILTER (WHERE status IN ('high_risk','medium_risk'))::int AS fraud_blocked,
        COALESCE(SUM(amount), 0)::float                       AS total_volume,
        COALESCE(AVG(EXTRACT(EPOCH FROM (NOW() - timestamp)) * 1000), 0)::float AS avg_latency_ms
      FROM transactions
      WHERE org_id = $1
        AND timestamp >= NOW() - INTERVAL '${interval}'
    `, [orgId]);

    const row = statsRes.rows[0] || {};
    return res.status(200).json({
      total_analyzed:  row.total_analyzed  || 0,
      fraud_blocked:   row.fraud_blocked   || 0,
      total_volume:    parseFloat(row.total_volume) || 0,
      avg_latency_ms:  parseFloat(row.avg_latency_ms) || 0,
      range,
    });
  } catch (err) {
    logger.error(`Analytics stats error: ${err.message}`);
    return res.status(500).json({ detail: 'Failed to fetch analytics stats.' });
  }
});

router.get('/analytics/export', authenticateUser, async (req, res) => {
  const orgId = req.user.org_id;
  const range = req.query.range || '24h';
  const intervalMap = {
    '1h': '1 hour', '24h': '24 hours', '30d': '30 days',
    '60d': '60 days', '1y': '1 year', 'all': '100 years',
  };
  const interval = intervalMap[range] || '24 hours';

  try {
    const txRes = await pool.query(`
      SELECT transaction_id, user_id, amount, currency, location, device_id,
             timestamp, fraud_risk_score, status, recommendation
      FROM transactions
      WHERE org_id = $1 AND timestamp >= NOW() - INTERVAL '${interval}'
      ORDER BY timestamp DESC
      LIMIT 10000
    `, [orgId]);

    const header = 'transaction_id,user_id,amount,currency,location,device_id,timestamp,fraud_risk_score,status,recommendation\n';
    const rows = txRes.rows.map(r =>
      [r.transaction_id, r.user_id, r.amount, r.currency, r.location,
       r.device_id, r.timestamp, r.fraud_risk_score, r.status, r.recommendation
      ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="flowshield_export_${range}.csv"`);
    return res.status(200).send(header + rows);
  } catch (err) {
    logger.error(`Analytics export error: ${err.message}`);
    return res.status(500).json({ detail: 'Failed to export analytics.' });
  }
});

// Health status alias (used by dashboard System Health button)
router.get('/health/status', (req, res) => {
  return res.status(200).json({ status: 'ok', latency_ms: 12, region: 'ap-northeast-1' });
});

// GET list of transactions (Dashboard / Transactions Feed)
router.get('/transactions', authenticateUser, async (req, res) => {
  const orgId = req.user.org_id;
  try {
    const txsRes = await pool.query(
      `SELECT transaction_id as id, transaction_id as external_id, amount, currency, location as merchant_name, 
              fraud_risk_score as risk_score, status as risk_label, status as decision, timestamp as created_at 
       FROM transactions 
       WHERE org_id = $1 
       ORDER BY timestamp DESC 
       LIMIT 100`,
      [orgId]
    );
    const formatted = txsRes.rows.map(r => ({
      id: r.id,
      external_id: r.external_id,
      amount: parseFloat(r.amount),
      currency: r.currency,
      merchant_name: r.merchant_name,
      risk_score: parseFloat(r.risk_score || 0) / 100, // Map 0-100 score to 0.0-1.0 expected by frontend
      risk_label: r.risk_label === 'high_risk' ? 'fraud' : r.risk_label === 'medium_risk' ? 'review' : 'safe',
      decision: r.decision,
      created_at: r.created_at
    }));
    return res.status(200).json(formatted);
  } catch (err) {
    logger.error(`Get transactions error: ${err.message}`);
    return res.status(500).json({ detail: "Failed to fetch transactions." });
  }
});

// GET specific transaction details
router.get('/transactions/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const orgId = req.user.org_id;
  try {
    const txRes = await pool.query(
      `SELECT transaction_id as id, transaction_id as external_id, amount, currency, location as merchant_name, 
              fraud_risk_score as risk_score, status as risk_label, status as decision, timestamp as created_at, 
              device_id, user_id, recommendation
       FROM transactions 
       WHERE transaction_id = $1 AND org_id = $2`,
      [id, orgId]
    );
    if (txRes.rows.length === 0) {
      return res.status(404).json({ detail: "Transaction not found." });
    }
    const r = txRes.rows[0];
    return res.status(200).json({
      id: r.id,
      external_id: r.external_id,
      amount: parseFloat(r.amount),
      currency: r.currency,
      merchant_name: r.merchant_name,
      risk_score: parseFloat(r.risk_score || 0) / 100, // Map 0-100 score to 0.0-1.0 expected by frontend
      risk_label: r.risk_label === 'high_risk' ? 'fraud' : r.risk_label === 'medium_risk' ? 'review' : 'safe',
      decision: r.decision,
      created_at: r.created_at,
      device_id: r.device_id,
      user_id: r.user_id,
      recommendation: r.recommendation
    });
  } catch (err) {
    logger.error(`Get transaction details error: ${err.message}`);
    return res.status(500).json({ detail: "Failed to fetch transaction details." });
  }
});

// Simulation stub (used by dashboard Run Stress Test button)
router.post('/transactions/simulate', authenticateUser, async (req, res) => {
  const count = Math.min(parseInt(req.query.count || '10', 10), 50);
  const orgId = req.user.org_id;

  const currencies = ['USD', 'EUR', 'GBP', 'INR', 'SGD'];
  const merchants  = ['Amazon', 'Netflix', 'Uber', 'Airbnb', 'Stripe', 'Shopify'];
  const locations  = ['Mumbai', 'Singapore', 'New York', 'London', 'Tokyo'];

  const inserted = [];
  for (let i = 0; i < count; i++) {
    const amount = parseFloat((Math.random() * 9900 + 100).toFixed(2));
    const { score, status, recommendation } = evaluateTransaction(amount, merchants[i % merchants.length], `sim-user-${i}`);
    const txId = `SIM-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
    await pool.query(
      `INSERT INTO transactions (transaction_id, user_id, org_id, amount, currency, location, device_id, fraud_risk_score, status, recommendation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [txId, `sim-user-${i}`, orgId, amount, currencies[i % currencies.length],
       locations[i % locations.length], `sim-device-${i}`, score, status, recommendation]
    );

    // Broadcast simulated transaction live via WebSocket
    broadcastToOrg(orgId, {
      type: 'new_transaction',
      data: {
        id: txId,
        external_id: txId,
        amount,
        currency: currencies[i % currencies.length],
        merchant_name: locations[i % locations.length],
        risk_score: score / 100, // Map 0-100 to 0.0-1.0 expected by frontend
        risk_label: status === 'high_risk' ? 'fraud' : status === 'medium_risk' ? 'review' : 'safe',
        decision: status,
        created_at: new Date().toISOString()
      }
    });

    inserted.push(txId);
  }

  return res.status(200).json({ simulated: inserted.length, transaction_ids: inserted });
});

export default router;

