import { pool } from './db.js';
import winston from 'winston';
import crypto from 'crypto';

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

export async function sendSecurityEmail(subject, body, recipient = "legal@flowshieldai.com") {
  // Check if Resend is configured, otherwise fallback to logging
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: 'alerts@flowshieldai.com',
          to: recipient,
          subject: subject,
          html: `<pre>${body}</pre>`
        })
      });
      if (response.ok) {
        logger.info(`Security email sent successfully to ${recipient}`);
        return;
      }
      logger.error(`Resend API returned error status: ${response.status}`);
    } catch (e) {
      logger.error(`Failed to send security email: ${e.message}`);
    }
  }
  // Mock fallback logger (Layer 9.1 / Layer 2.4)
  logger.warn(`📧 [SECURITY ALERT EMAIL MOCK] To: ${recipient}\nSubject: ${subject}\nBody:\n${body}`);
}

class AuditLogger {
  async log({
    action,
    result,
    actor = null,
    resourceType = null,
    resourceId = null,
    metadata = {},
    severity = 'info',
    req = null
  }) {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    // Extract request context if present
    const ipAddress = req ? (req.ip || req.headers['x-forwarded-for'] || 'unknown') : 'unknown';
    const userAgent = req ? req.headers['user-agent'] : null;
    const requestId = req ? req.headers['x-request-id'] : null;

    const actorId = actor ? actor.id : null;
    const actorType = actor ? 'user' : 'system';
    const actorEmail = actor ? actor.email : null;
    const orgId = actor ? actor.org_id : null;

    const queryText = `
      INSERT INTO audit_logs (
        id, timestamp, actor_id, actor_type, actor_email, org_id, 
        action, resource_type, resource_id, ip_address, user_agent, 
        request_id, result, metadata, severity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;

    const params = [
      id, timestamp, actorId, actorType, actorEmail, orgId,
      action, resourceType, resourceId, ipAddress, userAgent,
      requestId, result, JSON.stringify(metadata), severity
    ];

    try {
      const res = await pool.query(queryText, params);
      const entry = res.rows[0];

      // Trigger critical security alerts (Layer 9.1)
      if (severity === 'critical') {
        await this.sendSecurityAlert(entry);
      }

      return entry;
    } catch (err) {
      logger.error(`Failed to write audit log: ${err.message}`);
      return null;
    }
  }

  async sendSecurityAlert(entry) {
    const subject = `[SECURITY ALERT] ${entry.severity.toUpperCase()} — ${entry.action}`;
    const body = `
Time: ${entry.timestamp} UTC
Severity: ${entry.severity.toUpperCase()}
Event: ${entry.action}
Actor ID: ${entry.actor_id || 'System'}
Actor Email: ${entry.actor_email || 'System'}
Actor IP: ${entry.ip_address}
User Agent: ${entry.user_agent}
Affected Org: ${entry.org_id || 'System'}
Result: ${entry.result}
Metadata: ${JSON.stringify(entry.metadata, null, 2)}
Action Taken: Automated threat response flagged
Recommended Action: Inspect security console and verify logs.
`;
    await sendSecurityEmail(subject, body, "legal@flowshieldai.com");
  }
}

export const auditLogger = new AuditLogger();
export default auditLogger;
