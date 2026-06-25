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
    monthly: { plan_id: process.env.RAZORPAY_PLAN_STD_MONTHLY    || 'plan_std_monthly',    amount_inr: 2999  },
    annual:  { plan_id: process.env.RAZORPAY_PLAN_STD_ANNUAL     || 'plan_std_annual',     amount_inr: 28788 },
  },
  premium: {
    monthly: { plan_id: process.env.RAZORPAY_PLAN_PREM_MONTHLY   || 'plan_prem_monthly',   amount_inr: 7999  },
    annual:  { plan_id: process.env.RAZORPAY_PLAN_PREM_ANNUAL    || 'plan_prem_annual',    amount_inr: 76788 },
  },
};

const REQUEST_LIMITS = { free: 1000, basic: 25000, standard: 100000, premium: -1 };

// ─────────────────────────────────────────────
// GET /billing/subscription
// ─────────────────────────────────────────────
router.get('/subscription', authenticateUser, async (req, res) => {
  const orgId = req.user.org_id;
  try {
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
  const orgId = req.user.org_id;
  try {
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
router.post('/create-subscription', authenticateUser, async (req, res) => {
  const { plan, interval = 'monthly' } = req.body;
  const orgId = req.user.org_id;

  if (!PLAN_CONFIG[plan]) {
    return res.status(400).json({ detail: `Invalid plan: ${plan}. Must be basic, standard, or premium.` });
  }

  try {
    const rzp = getRazorpayClient();
    const planCfg = PLAN_CONFIG[plan][interval] || PLAN_CONFIG[plan].monthly;

    const subscription = await rzp.subscriptions.create({
      plan_id:       planCfg.plan_id,
      total_count:   interval === 'annual' ? 1 : 12,
      quantity:      1,
      customer_notify: 1,
      notes: { org_id: orgId, plan, interval },
    });

    // Persist pending subscription to org
    await pool.query(
      `UPDATE organizations SET subscription_id = $1, subscription_status = 'pending', plan = $2, billing_interval = $3
       WHERE id = $4`,
      [subscription.id, plan, interval, orgId]
    );

    return res.json({
      subscription_id:  subscription.id,
      razorpay_key_id:  process.env.RAZORPAY_KEY_ID,
      amount_inr:       planCfg.amount_inr,
      plan,
      interval,
    });
  } catch (err) {
    logger.error(`Create subscription error: ${err.message}`);
    return res.status(500).json({ detail: err.message || 'Failed to create Razorpay subscription.' });
  }
});

// ─────────────────────────────────────────────
// POST /billing/verify-payment
// ─────────────────────────────────────────────
router.post('/verify-payment', authenticateUser, async (req, res) => {
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
  const orgId = req.user.org_id;

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return res.status(500).json({ detail: 'Webhook secret not configured.' });
  }

  // Verify HMAC signature
  const payload   = `${razorpay_payment_id}|${razorpay_subscription_id}`;
  const expected  = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  if (expected !== razorpay_signature) {
    return res.status(400).json({ detail: 'Payment signature verification failed.' });
  }

  try {
    // Get subscription details to determine plan
    const orgRes = await pool.query(
      'SELECT plan, billing_interval FROM organizations WHERE id = $1', [orgId]
    );
    const { plan, billing_interval } = orgRes.rows[0] || {};
    const planCfg = PLAN_CONFIG[plan]?.[billing_interval || 'monthly'];

    // Activate subscription
    const nextBillingDate = billing_interval === 'annual'
      ? new Date(Date.now() + 365 * 24 * 3600 * 1000)
      : new Date(Date.now() + 30  * 24 * 3600 * 1000);

    await pool.query(
      `UPDATE organizations
       SET subscription_status = 'active',
           next_billing_date   = $1,
           amount_inr          = $2
       WHERE id = $3`,
      [nextBillingDate, planCfg?.amount_inr || 0, orgId]
    );

    // Record invoice
    await pool.query(
      `INSERT INTO billing_invoices (org_id, payment_id, subscription_id, amount_inr, status, payment_method)
       VALUES ($1, $2, $3, $4, 'captured', 'razorpay')
       ON CONFLICT DO NOTHING`,
      [orgId, razorpay_payment_id, razorpay_subscription_id, planCfg?.amount_inr || 0]
    );

    return res.json({ success: true, plan });
  } catch (err) {
    logger.error(`Verify payment error: ${err.message}`);
    return res.status(500).json({ detail: 'Failed to activate subscription.' });
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
