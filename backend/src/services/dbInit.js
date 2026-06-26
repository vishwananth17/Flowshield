import { pool } from './db.js';
import winston from 'winston';

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    logger.info("Initializing database tables on Supabase...");

    // 1. Organizations
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        plan VARCHAR(50) DEFAULT 'free' NOT NULL,
        subscription_id VARCHAR(255),
        subscription_status VARCHAR(50) DEFAULT 'active',
        next_billing_date TIMESTAMP WITH TIME ZONE,
        amount_inr INTEGER DEFAULT 0,
        billing_interval VARCHAR(20) DEFAULT 'monthly',
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // Add billing columns to existing orgs (safe if already present)
    const billingCols = [
      `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255)`,
      `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active'`,
      `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS amount_inr INTEGER DEFAULT 0`,
      `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_interval VARCHAR(20) DEFAULT 'monthly'`,
      `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb`,
    ];
    for (const col of billingCols) {
      try { await client.query(col); } catch (e) { /* already exists */ }
    }

    // 2. Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'member' NOT NULL,
        org_id VARCHAR(255) REFERENCES organizations(id) ON DELETE SET NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        last_login_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // 3. Transactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        org_id VARCHAR(255) REFERENCES organizations(id) ON DELETE SET NULL,
        amount DOUBLE PRECISION NOT NULL,
        currency VARCHAR(50) NOT NULL,
        location VARCHAR(255) NOT NULL,
        device_id VARCHAR(255),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        fraud_risk_score DOUBLE PRECISION,
        status VARCHAR(50),
        recommendation VARCHAR(255)
      );
    `);

    // 4. API Keys
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) DEFAULT 'Default' NOT NULL,
        key_hash VARCHAR(255) UNIQUE NOT NULL,
        key_prefix VARCHAR(50) NOT NULL,
        org_id VARCHAR(255) REFERENCES organizations(id) ON DELETE SET NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        environment VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'active' NOT NULL,
        scopes JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        last_used_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE
      );
      
      -- Alter existing table to add name column if not exists
      ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT 'Default' NOT NULL;
    `);

    // 5. Audit Logs (Layer 9.1)
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(255) PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        actor_id VARCHAR(255),
        actor_type VARCHAR(50),
        actor_email VARCHAR(255),
        org_id VARCHAR(255) REFERENCES organizations(id) ON DELETE SET NULL,
        action VARCHAR(255) NOT NULL,
        resource_type VARCHAR(100),
        resource_id VARCHAR(255),
        ip_address VARCHAR(100),
        user_agent TEXT,
        request_id VARCHAR(255),
        result VARCHAR(50),
        metadata JSONB,
        severity VARCHAR(50) DEFAULT 'info' NOT NULL
      );
    `);

    // 6. Legal Document Versions
    await client.query(`
      CREATE TABLE IF NOT EXISTS legal_document_versions (
        id VARCHAR(255) PRIMARY KEY,
        document_type VARCHAR(50) NOT NULL,
        version VARCHAR(20) NOT NULL,
        effective_date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // 7. User Legal Acceptances
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_legal_acceptances (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        document_type VARCHAR(50) NOT NULL,
        version VARCHAR(20) NOT NULL,
        accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        ip_address VARCHAR(100),
        user_agent TEXT
      );
    `);

    // 8. Privacy Requests (DPDP rights)
    await client.query(`
      CREATE TABLE IF NOT EXISTS privacy_requests (
        id VARCHAR(255) PRIMARY KEY,
        reference VARCHAR(50) UNIQUE NOT NULL,
        request_type VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        resolved_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // 9. Waitlist
    await client.query(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        company VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // 10. Billing Invoices
    await client.query(`
      CREATE TABLE IF NOT EXISTS billing_invoices (
        id SERIAL PRIMARY KEY,
        org_id VARCHAR(255) REFERENCES organizations(id) ON DELETE CASCADE,
        payment_id VARCHAR(255) UNIQUE NOT NULL,
        subscription_id VARCHAR(255),
        amount_inr INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(50) DEFAULT 'captured',
        payment_method VARCHAR(100) DEFAULT 'razorpay',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // 11. Alerts Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id VARCHAR(255) PRIMARY KEY,
        org_id VARCHAR(255) REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
        transaction_id VARCHAR(255) REFERENCES transactions(transaction_id) ON DELETE SET NULL,
        severity VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'open' NOT NULL,
        title VARCHAR(255),
        description TEXT,
        assigned_to VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        resolved_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        resolved_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // 12. Alert Activities Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alert_activities (
        id VARCHAR(255) PRIMARY KEY,
        alert_id VARCHAR(255) REFERENCES alerts(id) ON DELETE CASCADE NOT NULL,
        org_id VARCHAR(255) REFERENCES organizations(id) ON DELETE CASCADE,
        from_status VARCHAR(50),
        to_status VARCHAR(50) NOT NULL,
        changed_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        note TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // 13. Integrations Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS integrations (
        id SERIAL PRIMARY KEY,
        org_id VARCHAR(255) REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
        platform VARCHAR(50) DEFAULT 'unknown' NOT NULL,
        connection_method VARCHAR(20) DEFAULT 'script' NOT NULL,
        store_name VARCHAR(255),
        store_url TEXT,
        access_token TEXT,
        webhook_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active' NOT NULL,
        detected_url TEXT,
        detection_confidence VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        last_event_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // 14. Database Performance Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_org_id ON transactions(org_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_alerts_org_id_status ON alerts(org_id, status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_alert_activities_alert_id ON alert_activities(alert_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_integrations_org_id ON integrations(org_id);`);

    // 15. Configure Row Level Security (RLS) if not already set (Layer 12.1)
    const tablesToEnableRLS = ['transactions', 'api_keys', 'alerts', 'alert_activities', 'integrations'];
    for (const tableName of tablesToEnableRLS) {
      try {
        await client.query(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`);
        await client.query(`
          CREATE POLICY tenant_isolation_policy ON ${tableName}
          USING (org_id = current_setting('app.current_org_id', true));
        `);
        logger.info(`Enforced RLS tenant policy on ${tableName} table.`);
      } catch (e) {
        // Ignore if policy already exists
      }
    }

    logger.info("Database schema setup complete.");
  } catch (err) {
    logger.error(`Database initialization error: ${err.message}`);
    throw err;
  } finally {
    client.release();
  }
}
