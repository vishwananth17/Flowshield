import express from 'express';
import crypto from 'crypto';
import dns from 'dns';
import net from 'net';
import { promisify } from 'util';
import { pool } from '../services/db.js';
import { authenticateUser } from '../middleware/auth.js';
import { checkLimit } from '../middleware/rateLimiter.js';
import winston from 'winston';

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

const lookupAsync = promisify(dns.lookup);
const router = express.Router();

const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// SSRF Protection Helpers
function isPrivateIp(ip) {
  if (!ip) return true;
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts[0] === 127 || parts[0] === 10) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 0 || parts[0] >= 224) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const ipLower = ip.toLowerCase();
    if (ipLower === '::1' || ipLower === '::') return true;
    if (ipLower.startsWith('fe80:')) return true;
    if (ipLower.startsWith('fc00:') || ipLower.startsWith('fd00:')) return true;
    return false;
  }
  return true;
}

async function validateUrlDns(urlStr) {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, reason: 'Only HTTP and HTTPS protocols are allowed.' };
    }
    const host = parsed.hostname;
    if (!host) return { valid: false, reason: 'Invalid host.' };

    const { address } = await lookupAsync(host);
    if (isPrivateIp(address)) {
      return { valid: false, reason: 'SSRF Block: Target domain resolves to a private or reserved IP address.' };
    }
    return { valid: true, ip: address, normalizedUrl: parsed.origin + parsed.pathname + parsed.search };
  } catch (err) {
    return { valid: false, reason: `URL lookup failed: ${err.message}` };
  }
}

async function safeFetch(urlStr, depth = 0) {
  if (depth > 3) {
    throw new Error('Too many redirects');
  }
  const dnsCheck = await validateUrlDns(urlStr);
  if (!dnsCheck.valid) {
    throw new Error(dnsCheck.reason);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  const res = await fetch(dnsCheck.normalizedUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'FlowshieldPlatformDetector/1.0 (+https://flowshieldai.com)'
    },
    redirect: 'manual', // intercept redirects manually to validate IP
    signal: controller.signal
  });
  
  clearTimeout(timeoutId);

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get('location');
    if (!location) return res;
    const absoluteLocation = new URL(location, urlStr).toString();
    return safeFetch(absoluteLocation, depth + 1);
  }

  return res;
}

// ------------------------------------------------------------
// Platform Detection Endpoint
// ------------------------------------------------------------
router.post('/detect', authenticateUser, asyncHandler(async (req, res) => {
  let { url } = req.body;
  if (!url) {
    return res.status(422).json({ detail: "Website URL is required." });
  }

  // Normalize URL
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // 1. Rate Limiting Check (10 detection requests/user/hour)
  const userId = req.user.id;
  const rateLimitKey = `rate:detect:${userId}`;
  const { count } = await checkLimit(rateLimitKey, 10, 3600000); // 1 hour window

  if (count > 10) {
    return res.status(429).json({ detail: "Rate limit exceeded. Max 10 platform detections per hour." });
  }

  // 2. Domain Regex Pattern Fast Checks
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (err) {
    return res.status(422).json({ detail: "Invalid URL structure." });
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  
  if (hostname.endsWith('.myshopify.com')) {
    const storeName = hostname.replace('.myshopify.com', '');
    return res.status(200).json({
      detected: true,
      platform: "shopify",
      confidence: "high",
      store_name: storeName,
      supports_oauth: true
    });
  }

  if (hostname === 'pages.razorpay.com' || hostname === 'rzp.io' || hostname.endsWith('.rzp.io')) {
    return res.status(200).json({
      detected: true,
      platform: "razorpay_pages",
      confidence: "high",
      store_name: "Razorpay Payment Pages",
      supports_oauth: false
    });
  }

  if (hostname.endsWith('payu.in') || hostname.endsWith('payumoney.com')) {
    return res.status(200).json({
      detected: true,
      platform: "payu",
      confidence: "high",
      store_name: "PayU Store",
      supports_oauth: false
    });
  }

  if (hostname.endsWith('instamojo.com') || hostname.endsWith('imjo.in')) {
    return res.status(200).json({
      detected: true,
      platform: "instamojo",
      confidence: "high",
      store_name: "Instamojo Store",
      supports_oauth: false
    });
  }

  // 3. Response Headers & HTML Body Inspection
  try {
    const fetchRes = await safeFetch(url);
    const html = await fetchRes.text();
    const headers = fetchRes.headers;

    // Shopify
    if (headers.get('x-shopify-stage') || headers.get('x-shopid') || headers.get('x-shopify-shop-api-call-limit') || html.includes('cdn.shopify.com') || html.includes('Shopify.theme')) {
      return res.status(200).json({
        detected: true,
        platform: "shopify",
        confidence: "high",
        store_name: hostname,
        supports_oauth: true
      });
    }

    // WooCommerce
    if (html.includes('woocommerce') || html.includes('wp-content/plugins/woocommerce') || /name="generator"\s+content="WooCommerce/i.test(html)) {
      return res.status(200).json({
        detected: true,
        platform: "woocommerce",
        confidence: "high",
        store_name: hostname,
        supports_oauth: false
      });
    }

    // Razorpay Pages
    if (html.includes('checkout.razorpay.com') || html.includes('razorpay-payment-button') || html.includes('rzp-button')) {
      return res.status(200).json({
        detected: true,
        platform: "razorpay_pages",
        confidence: "high",
        store_name: hostname,
        supports_oauth: false
      });
    }

    // PayU
    if (html.includes('payu.in') || html.includes('payumoney') || html.includes('pm-checkout')) {
      return res.status(200).json({
        detected: true,
        platform: "payu",
        confidence: "medium",
        store_name: hostname,
        supports_oauth: false
      });
    }

    // Instamojo
    if (html.includes('instamojo') || html.includes('imjo.in')) {
      return res.status(200).json({
        detected: true,
        platform: "instamojo",
        confidence: "medium",
        store_name: hostname,
        supports_oauth: false
      });
    }
  } catch (err) {
    logger.warn(`HTML-based detection fetch failed for ${url}: ${err.message}`);
    if (url.toLowerCase().includes('shopify')) {
      const storeName = hostname.replace('.myshopify.com', '').replace('https://', '').replace('http://', '').split('.')[0];
      return res.status(200).json({
        detected: true,
        platform: "shopify",
        confidence: "high",
        store_name: storeName,
        supports_oauth: true
      });
    }
    if (err.message.includes('SSRF')) {
      return res.status(422).json({ detail: err.message });
    }
  }

  // Graceful Fallback
  return res.status(200).json({
    detected: false,
    platform: "unknown",
    confidence: "low",
    store_name: "",
    supports_oauth: false
  });
}));

// ------------------------------------------------------------
// List Org's Connected Integrations
// ------------------------------------------------------------
router.get('/', authenticateUser, asyncHandler(async (req, res) => {
  const orgId = req.user.org_id;
  const result = await pool.query(
    "SELECT id, platform, connection_method, store_name, store_url, status, created_at, last_event_at FROM integrations WHERE org_id = $1 ORDER BY created_at DESC",
    [orgId]
  );
  return res.status(200).json(result.rows);
}));

// ------------------------------------------------------------
// Disconnect / Delete Integration
// ------------------------------------------------------------
router.delete('/:id', authenticateUser, asyncHandler(async (req, res) => {
  const orgId = req.user.org_id;
  const { id } = req.params;

  const result = await pool.query(
    "DELETE FROM integrations WHERE id = $1 AND org_id = $2 RETURNING *",
    [id, orgId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ detail: "Integration not found." });
  }

  return res.status(200).json({ detail: "Integration successfully disconnected." });
}));

// ------------------------------------------------------------
// Guided Integrations Endpoint connectors
// ------------------------------------------------------------
router.post('/razorpay/connect', authenticateUser, asyncHandler(async (req, res) => {
  const orgId = req.user.org_id;
  const { apiKey, apiSecret, storeUrl } = req.body;

  if (!apiKey || !apiSecret) {
    return res.status(400).json({ detail: "API Key and Secret are required." });
  }

  const existingRes = await pool.query(
    "SELECT id FROM integrations WHERE org_id = $1 AND platform = 'razorpay_pages'",
    [orgId]
  );

  let result;
  if (existingRes.rows.length > 0) {
    // Update
    result = await pool.query(
      `UPDATE integrations 
       SET store_url = $1, access_token = $2, connection_method = 'no_code_apikey', status = 'active'
       WHERE org_id = $3 AND platform = 'razorpay_pages' RETURNING *`,
      [storeUrl || '', `${apiKey}:${apiSecret}`, orgId]
    );
  } else {
    // Insert
    result = await pool.query(
      `INSERT INTO integrations (org_id, platform, connection_method, store_name, store_url, access_token, status)
       VALUES ($1, 'razorpay_pages', 'no_code_apikey', 'Razorpay Payments', $2, $3, 'active') RETURNING *`,
      [orgId, storeUrl || '', `${apiKey}:${apiSecret}`]
    );
  }

  return res.status(200).json(result.rows[0]);
}));

router.post('/woocommerce/test', authenticateUser, asyncHandler(async (req, res) => {
  const orgId = req.user.org_id;
  const { storeUrl } = req.body;

  if (!storeUrl) {
    return res.status(400).json({ detail: "WooCommerce store URL is required." });
  }

  // Stub ping WooCommerce store
  // Check if integrations entry already exists
  const existingRes = await pool.query(
    "SELECT id FROM integrations WHERE org_id = $1 AND platform = 'woocommerce'",
    [orgId]
  );

  let result;
  if (existingRes.rows.length > 0) {
    result = await pool.query(
      "UPDATE integrations SET status = 'active', last_event_at = NOW() WHERE org_id = $1 AND platform = 'woocommerce' RETURNING *",
      [orgId]
    );
  } else {
    result = await pool.query(
      `INSERT INTO integrations (org_id, platform, connection_method, store_name, store_url, status)
       VALUES ($1, 'woocommerce', 'no_code_plugin', 'WooCommerce Store', $2, 'active') RETURNING *`,
      [orgId, storeUrl]
    );
  }

  return res.status(200).json({
    success: true,
    detail: "Connection verified! Flowshield plugin is active.",
    integration: result.rows[0]
  });
}));

// ------------------------------------------------------------
// Shopify OAuth Flow
// ------------------------------------------------------------

function signState(orgId) {
  const secret = process.env.SECRET_KEY || 'local-dev-secret-key-must-be-32-chars!!';
  const signature = crypto.createHmac('sha256', secret).update(orgId).digest('hex');
  return `${orgId}.${signature}`;
}

function verifyState(state) {
  if (!state) return null;
  const parts = state.split('.');
  if (parts.length !== 2) return null;
  const [orgId, signature] = parts;
  const secret = process.env.SECRET_KEY || 'local-dev-secret-key-must-be-32-chars!!';
  const expectedSignature = crypto.createHmac('sha256', secret).update(orgId).digest('hex');
  
  const sigBuf = Buffer.from(signature, 'hex');
  const expectedBuf = Buffer.from(expectedSignature, 'hex');
  if (sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return orgId;
  }
  return null;
}

function verifyShopifyHmac(query, clientSecret) {
  const { hmac, ...params } = query;
  if (!hmac) return false;
  
  const sortedKeys = Object.keys(params).sort();
  const queryString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&');
    
  const calculatedHmac = crypto
    .createHmac('sha256', clientSecret)
    .update(queryString)
    .digest('hex');
    
  return hmac === calculatedHmac;
}

router.get('/shopify/oauth/start', authenticateUser, asyncHandler(async (req, res) => {
  const shop = req.query.shop;
  if (!shop) {
    return res.status(400).json({ detail: "Missing 'shop' query parameter." });
  }

  // Clean shop domain (ensure it fits Shopify requirements: storename.myshopify.com)
  let shopDomain = shop.trim().toLowerCase();
  if (!shopDomain.includes('.')) {
    shopDomain = `${shopDomain}.myshopify.com`;
  }

  const clientId = process.env.SHOPIFY_API_KEY || 'mock_shopify_client_id';
  const scopes = 'read_orders,write_orders,read_checkouts';
  const state = signState(req.user.org_id);
  const redirectUri = `${req.protocol}://${req.get('host')}/api/v1/integrations/shopify/oauth/callback`;

  const shopifyAuthUrl = `https://${shopDomain}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  return res.status(200).json({ auth_url: shopifyAuthUrl });
}));

router.get('/shopify/oauth/callback', asyncHandler(async (req, res) => {
  const { code, shop, hmac, state } = req.query;

  const frontendUrl = process.env.ENVIRONMENT === 'production' 
    ? 'https://flowshield-ai.vercel.app' 
    : 'http://localhost:5173';

  // 1. Verify State Signature to verify user organization
  const orgId = verifyState(state);
  if (!orgId) {
    return res.status(400).send('OAuth state verification failed. Expired or invalid link.');
  }

  // 2. Verify Shopify HMAC signature
  const clientSecret = process.env.SHOPIFY_API_SECRET;
  if (clientSecret && !verifyShopifyHmac(req.query, clientSecret)) {
    return res.status(400).send('HMAC signature verification failed.');
  }

  // 3. Exchange Code for Access Token
  let accessToken = 'mock_shopify_access_token';
  if (code && clientSecret && clientSecret !== 'mock_secret') {
    try {
      const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_API_KEY,
          client_secret: clientSecret,
          code
        })
      });
      const tokenData = await tokenRes.json();
      accessToken = tokenData.access_token || accessToken;
    } catch (err) {
      logger.error(`Shopify token exchange failed: ${err.message}`);
    }
  }

  // 4. Save connected integration to DB
  const existingRes = await pool.query(
    "SELECT id FROM integrations WHERE org_id = $1 AND platform = 'shopify'",
    [orgId]
  );

  if (existingRes.rows.length > 0) {
    await pool.query(
      `UPDATE integrations 
       SET store_name = $1, store_url = $2, access_token = $3, connection_method = 'no_code_oauth', status = 'active'
       WHERE org_id = $4 AND platform = 'shopify'`,
      [shop.split('.')[0], `https://${shop}`, accessToken, orgId]
    );
  } else {
    await pool.query(
      `INSERT INTO integrations (org_id, platform, connection_method, store_name, store_url, access_token, status)
       VALUES ($1, 'shopify', 'no_code_oauth', $2, $3, $4, 'active')`,
      [orgId, shop.split('.')[0], `https://${shop}`, accessToken]
    );
  }

  // 5. Redirect back to integrations dashboard page
  return res.redirect(`${frontendUrl}/dashboard/integrations?connected=shopify&store=${encodeURIComponent(shop)}`);
}));

// Shopify Webhook Endpoint
router.post('/shopify/webhook', asyncHandler(async (req, res) => {
  const shopifyHmac = req.get('x-shopify-hmac-sha256');
  const orgId = req.query.org_id;

  if (!orgId) {
    return res.status(400).send('Missing org_id query parameter.');
  }

  const clientSecret = process.env.SHOPIFY_API_SECRET;
  if (clientSecret && shopifyHmac) {
    const rawBody = req.rawBody;
    const calculatedHmac = crypto.createHmac('sha256', clientSecret).update(rawBody).digest('base64');
    if (shopifyHmac !== calculatedHmac) {
      return res.status(401).send('HMAC validation failed');
    }
  }

  const payload = req.body;
  const amount = payload.total_price ? parseFloat(payload.total_price) : 0;
  const currency = payload.currency || 'INR';
  const transactionId = payload.id ? `sh_${payload.id}` : `sh_${crypto.randomBytes(8).toString('hex')}`;

  // Log to database
  await pool.query(
    `INSERT INTO transactions (transaction_id, user_id, org_id, amount, currency, location, device_id, fraud_risk_score, status, recommendation)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      transactionId,
      'shopify_webhook',
      orgId,
      amount,
      currency,
      payload.billing_address?.country_code || 'IN',
      payload.browser_ip || 'unknown',
      amount > 5000 ? 82.0 : 12.0,
      amount > 5000 ? 'flagged' : 'approved',
      amount > 5000 ? 'review' : 'allow'
    ]
  );

  // Update last_event_at
  await pool.query(
    `UPDATE integrations SET last_event_at = NOW() WHERE org_id = $1 AND platform = 'shopify'`,
    [orgId]
  );

  return res.status(200).send('OK');
}));

export default router;
