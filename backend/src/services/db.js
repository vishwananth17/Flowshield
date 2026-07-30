import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const NEON_DB_URL = "postgresql://neondb_owner:npg_0nCK9awveMNl@ep-wild-shadow-amh6uy2c.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";

if (!databaseUrl || databaseUrl.includes("postgres") || databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1") || databaseUrl.includes("render.com")) {
  databaseUrl = NEON_DB_URL;
}

if (databaseUrl && databaseUrl.startsWith("postgresql")) {
  // Strip out ssl/sslmode query params so pg doesn't parse them as strings and override our SSL object
  const cleanUrl = databaseUrl.replace(/([?&])ssl(mode)?=[^&]*/gi, '');
  databaseUrl = cleanUrl.replace(/[?&]$/, '').replace(/\?&/, '?');
}

const poolConfig = {
  connectionString: databaseUrl,
  statement_timeout: 30000,
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
