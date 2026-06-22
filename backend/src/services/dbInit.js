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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

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

    // 10. Configure Row Level Security (RLS) if not already set (Layer 12.1)
    // Note: Since this is standard PostgreSQL, we can check if it supports it.
    // In Supabase, RLS can also be controlled directly on tables.
    // We will enable RLS on transactions and api_keys.
    try {
      await client.query(`ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;`);
      await client.query(`
        CREATE POLICY tenant_isolation_policy ON transactions
        USING (org_id = current_setting('app.current_org_id', true));
      `);
      logger.info("Enforced RLS tenant policy on transactions table.");
    } catch (e) {
      // Ignore if policy already exists
    }

    try {
      await client.query(`ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;`);
      await client.query(`
        CREATE POLICY tenant_isolation_policy ON api_keys
        USING (org_id = current_setting('app.current_org_id', true));
      `);
      logger.info("Enforced RLS tenant policy on api_keys table.");
    } catch (e) {
      // Ignore if policy already exists
    }

    logger.info("Database schema setup complete.");
  } catch (err) {
    logger.error(`Database initialization error: ${err.message}`);
    throw err;
  } finally {
    client.release();
  }
}
