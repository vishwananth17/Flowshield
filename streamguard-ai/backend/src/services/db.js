import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

let databaseUrl = process.env.DATABASE_URL;

if (databaseUrl && databaseUrl.startsWith("postgresql")) {
  if (!databaseUrl.includes("ssl=") && !databaseUrl.includes("sslmode=")) {
    databaseUrl += databaseUrl.includes("?") ? "&ssl=require" : "?ssl=require";
  }
}

const poolConfig = {
  connectionString: databaseUrl || "postgresql://localhost:5432/flowshield",
  statement_timeout: 30000, // 30 seconds (Layer 12.2 query timeout)
  connectionTimeoutMillis: 5000,
};

// If using localhost database, we disable SSL verification for ease of development
if (databaseUrl && (databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1"))) {
  poolConfig.ssl = false;
} else {
  poolConfig.ssl = { rejectUnauthorized: false };
}

export const pool = new Pool(poolConfig);

/**
 * Execute a query with Row-Level Security (RLS) context configured.
 * @param {string|null} orgId The organization ID to lock the session context to.
 * @param {string} text SQL query text.
 * @param {Array} params Query parameters.
 */
export async function queryWithRLS(orgId, text, params = []) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (orgId) {
      // Escape single quotes to prevent SQLi (Layer 12.1 / Layer 5.3)
      const safeOrgId = orgId.replace(/'/g, "''");
      await client.query(`SET LOCAL app.current_org_id = '${safeOrgId}'`);
    }
    const res = await client.query(text, params);
    await client.query('COMMIT');
    return res;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export function query(text, params = []) {
  return pool.query(text, params);
}
