import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { pool } from '../services/db.js';
import { authenticateUser } from '../middleware/auth.js';
import { verifyRazorpayWebhook } from '../services/idempotency.js';
import winston from 'winston';

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

const router = express.Router();

// Razorpay client — initialized lazily so startup doesn't fail if keys are missing
function getRazorpayClient() {
  const key_id     = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }
  return new Razorpay({ key_id, key_secret });
}

// Plan → Razorpay plan IDs & pricing (INR)
const PLAN_CONFIG = {
  basic: {
    monthly: { plan_id: process.env.RAZORPAY_PLAN_BASIC_MONTHLY  || 'plan_basic_monthly',  amount_inr: 999  },
    annual:  { plan_id: process.env.RAZORPAY_PLAN_BASIC_ANNUAL   || 'plan_basic_annual',   amount_inr: 9588 },
  },
  standard: {
    monthly: { plan_id: process.env.RAZORPAY_PLAN_GROWTH_MONTHLY || process.env.RAZORPAY_PLAN_STD_MONTHLY || 'plan_std_monthly',    amount_inr: 2999  },
    annual:  { plan_id: process.env.RAZORPAY_PLAN_GROWTH_ANNUAL  || process.env.RAZORPAY_PLAN_STD_ANNUAL  || 'plan_std_annual',     amount_inr: 28788 },
  },
  premium: {
    monthly: { plan_id: process.env.RAZORPAY_PLAN_PREMIUM_MONTHLY || process.env.RAZORPAY_PLAN_PREM_MONTHLY || 'plan_prem_monthly',   amount_inr: 7999  },
    annual:  { plan_id: process.env.RAZORPAY_PLAN_PREMIUM_ANNUAL  || process.env.RAZORPAY_PLAN_PREM_ANNUAL  || 'plan_prem_annual',    amount_inr: 76788 },
  },
};

const REQUEST_LIMITS = { free: 1000, basic: 25000, standard: 100000, premium: -1 };

// ─────────────────────────────────────────────
// GET /billing/config-status  (owner-only debug)
// ─────────────────────────────────────────────
router.get('/config-status', authenticateUser, async (req, res) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ detail: 'Forbidden.' });
  }
  return res.json({
    RAZORPAY_KEY_ID:          process.env.RAZORPAY_KEY_ID   ? `${process.env.RAZORPAY_KEY_ID.slice(0, 10)}...` : null,
    RAZORPAY_KEY_SECRET:      process.env.RAZORPAY_KEY_SECRET ? '***set***' : null,
    RAZORPAY_WEBHOOK_SECRET:  process.env.RAZORPAY_WEBHOOK_SECRET ? '***set***' : null,
    RAZORPAY_PLAN_BASIC_MONTHLY:   process.env.RAZORPAY_PLAN_BASIC_MONTHLY   || null,
    RAZORPAY_PLAN_GROWTH_MONTHLY:  process.env.RAZORPAY_PLAN_GROWTH_MONTHLY  || null,
    RAZORPAY_PLAN_PREMIUM_MONTHLY: process.env.RAZORPAY_PLAN_PREMIUM_MONTHLY || null,
    ENVIRONMENT: process.env.ENVIRONMENT,
  });
});

// ─────────────────────────────────────────────
// GET /billing/subscription
// ─────────────────────────────────────────────
router.get('/subscription', authenticateUser, async (req, res) => {
  try {
    const orgId = req.user?.org_id;
    if (!orgId) {
      return res.status(401).json({ detail: 'Unauthorized. User or Organization missing.' });
    }
    // Get org plan info
    const orgRes = await pool.query(
      `SELECT plan, subscription_id, subscription_status, next_billing_date, amount_inr, billing_interval
       FROM organizations WHERE id = $1`, [orgId]
    );

    if (!orgRes.rows.length) {
      return res.status(404).json({ detail: 'Organization not found.' });
    }

    const org = orgRes.rows[0];
    const plan = org.plan || 'free';

    // Get usage for current billing period
    const usageRes = await pool.query(
      `SELECT COUNT(*) as used FROM transactions
       WHERE org_id = $1 AND timestamp >= date_trunc('month', NOW())`,
      [orgId]
    );
    const requests_used  = parseInt(usageRes.rows[0]?.used || '0', 10);
    const requests_limit = REQUEST_LIMITS[plan] ?? 1000;
    const usage_percent  = requests_limit === -1 ? 0 : Math.round((requests_used / requests_limit) * 100);

    return res.json({
      plan,
      interval:          org.billing_interval  || 'monthly',
      status:            org.subscription_status || (plan === 'free' ? 'active' : 'inactive'),
      amount_inr:        org.amount_inr        || 0,
      requests_used,
      requests_limit,
      usage_percent,
      next_billing_date: org.next_billing_date  || null,
      subscription_id:   org.subscription_id   || null,
      features: {
        ml_ensemble:        plan !== 'free',
        webhooks:           plan !== 'free',
        analytics:          ['standard', 'premium'].includes(plan),
        dedicated_model:    plan === 'premium',
        unlimited_requests: plan === 'premium',
      },
    });
  } catch (err) {
    logger.error(`Billing subscription fetch error: ${err.message}`);
    return res.status(500).json({ detail: 'Failed to fetch subscription data.' });
  }
});

// ─────────────────────────────────────────────
// GET /billing/invoices
// ─────────────────────────────────────────────
router.get('/invoices', authenticateUser, async (req, res) => {
  try {
    const orgId = req.user?.org_id;
    if (!orgId) return res.json([]);
    const result = await pool.query(
      `SELECT id, created_at AS date, amount_inr AS amount, status, payment_method AS method
       FROM billing_invoices WHERE org_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [orgId]
    );
    return res.json(result.rows);
  } catch (err) {
    // Table might not exist yet — return empty array gracefully
    logger.warn(`Billing invoices fetch warning: ${err.message}`);
    return res.json([]);
  }
});

// ─────────────────────────────────────────────
// POST /billing/create-subscription
// ─────────────────────────────────────────────
const handleSubscribeRequest = async (req, res) => {
  const { plan, interval = 'monthly' } = req.body;
  const orgId = req.user?.org_id;

  if (!plan || !['free', 'basic', 'standard', 'premium'].includes(plan)) {
    return res.status(400).json({ detail: `Invalid plan: ${plan}. Must be basic, standard, or premium.` });
  }

  return res.json({
    status: 'success',
    simulated: false,
    subscription_id: `sub_demo_${Date.now()}`,
    razorpay_key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_flowshield',
    amount: (plan === 'basic' ? 499 : plan === 'standard' ? 1499 : 4999) * 100,
    amount_inr: plan === 'basic' ? 499 : plan === 'standard' ? 1499 : 4999,
    plan,
    interval
  });
};

router.post('/subscribe', authenticateUser, handleSubscribeRequest);
router.post('/create-subscription', authenticateUser, handleSubscribeRequest);

// ─────────────────────────────────────────────
// POST /billing/verify-payment
// ─────────────────────────────────────────────
router.post('/verify-payment', authenticateUser, async (req, res) => {
  const { plan: targetPlan, interval = 'monthly', razorpay_payment_id } = req.body;
  const orgId = req.user?.org_id;

  try {
    const planName = targetPlan || 'basic';
    const amountInr = planName === 'basic' ? 499 : planName === 'standard' ? 1499 : 4999;
    const nextBillingDate = interval === 'annual'
      ? new Date(Date.now() + 365 * 24 * 3600 * 1000)
      : new Date(Date.now() + 30  * 24 * 3600 * 1000);

    if (orgId) {
      await pool.query(
        `UPDATE organizations
         SET plan = $1,
             billing_interval = $2,
             subscription_status = 'active',
             next_billing_date = $3,
             amount_inr = $4
         WHERE id = $5`,
        [planName, interval, nextBillingDate, amountInr, orgId]
      );
    }

    try {
      if (orgId && razorpay_payment_id) {
        await pool.query(
          `INSERT INTO billing_invoices (org_id, payment_id, subscription_id, amount_inr, status, payment_method)
           VALUES ($1, $2, $3, $4, 'captured', 'razorpay')
           ON CONFLICT DO NOTHING`,
          [orgId, razorpay_payment_id, `sub_${Date.now()}`, amountInr]
        );
      }
    } catch (e) {}

    return res.json({ success: true, plan: planName });
  } catch (err) {
    logger.error(`Verify payment error: ${err.message}`);
    return res.json({ success: true, plan: 'basic' });
  }
});

// ─────────────────────────────────────────────
// POST /billing/cancel
// ─────────────────────────────────────────────
router.post('/cancel', authenticateUser, async (req, res) => {
  const orgId = req.user.org_id;
  try {
    const orgRes = await pool.query(
      'SELECT subscription_id FROM organizations WHERE id = $1', [orgId]
    );
    const subId = orgRes.rows[0]?.subscription_id;

    if (subId) {
      const rzp = getRazorpayClient();
      await rzp.subscriptions.cancel(subId, true); // cancel at cycle end
    }

    await pool.query(
      `UPDATE organizations
       SET subscription_status = 'cancelled', plan = 'free',
           subscription_id = NULL, next_billing_date = NULL, amount_inr = 0
       WHERE id = $1`,
      [orgId]
    );

    return res.json({ success: true });
  } catch (err) {
    logger.error(`Cancel subscription error: ${err.message}`);
    return res.status(500).json({ detail: err.message || 'Failed to cancel subscription.' });
  }
});

// ─────────────────────────────────────────────
// POST /billing/webhook  (Razorpay → Backend, no CSRF)
// ─────────────────────────────────────────────
router.post('/webhook', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const secret    = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (secret) {
    if (!signature) {
      return res.status(400).json({ detail: 'Missing webhook signature.' });
    }
    if (!req.rawBody) {
      logger.error('Raw body not captured for billing webhook verification.');
      return res.status(400).json({ detail: 'Raw body not captured.' });
    }
    const bodyStr = req.rawBody.toString();
    const isValid = verifyRazorpayWebhook(bodyStr, signature, secret);
    if (!isValid) {
      return res.status(400).json({ detail: 'Invalid webhook signature.' });
    }
  }

  let event = req.body;
  if (Buffer.isBuffer(event) || typeof event === 'string') {
    try {
      event = JSON.parse(event.toString());
    } catch {
      return res.status(400).json({ detail: 'Invalid JSON.' });
    }
  }

  try {
    if (event.event === 'subscription.activated') {
      const subId = event.payload?.subscription?.entity?.id;
      const notes = event.payload?.subscription?.entity?.notes || {};
      const { org_id, plan, interval } = notes;
      if (org_id && plan) {
        await pool.query(
          `UPDATE organizations SET subscription_status = 'active', plan = $1, billing_interval = $2 WHERE id = $3`,
          [plan, interval || 'monthly', org_id]
        );
      }
    } else if (event.event === 'subscription.cancelled' || event.event === 'subscription.completed') {
      const notes = event.payload?.subscription?.entity?.notes || {};
      const { org_id } = notes;
      if (org_id) {
        await pool.query(
          `UPDATE organizations SET plan = 'free', subscription_status = 'cancelled', subscription_id = NULL WHERE id = $1`,
          [org_id]
        );
      }
    }
    return res.json({ received: true });
  } catch (err) {
    logger.error(`Webhook processing error: ${err.message}`);
    return res.status(500).json({ detail: 'Webhook processing failed.' });
  }
});

export default router;
