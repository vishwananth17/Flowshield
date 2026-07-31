import { z } from 'zod';
import winston from 'winston';

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

// PII Regex Patterns (Layer 5.2)
const PII_PATTERNS = {
  aadhaar: /\b[2-9]\d{3}\s\d{4}\s\d{4}\b/, // Aadhaar Card (Indian national ID)
  pan: /\b[A-Z]{5}\d{4}[A-Z]\b/,         // PAN Card (Indian tax ID)
  passport: /\b[A-Z]\d{7}\b/,            // Indian Passport
  phone: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/, // General Phone
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email
};

// SQL Injection Patterns (Layer 5.3)
const SQLI_PATTERNS = [
  /(\b(SELECT|UNION|INSERT|DELETE|UPDATE|DROP|ALTER)\b)/i,
  /(--|#|\/\*|\*\/)/,
  /('\s*OR\s*'\d+\s*=\s*\d+)/i,
  /("\s*OR\s*"\d+\s*=\s*\d+)/i,
  /(\bOR\s+\d+\s*=\s*\d+)/i
];

/**
 * Scan a text value for PII patterns.
 */
export function scanForPII(text) {
  if (typeof text !== 'string') return null;
  for (const [key, regex] of Object.entries(PII_PATTERNS)) {
    if (regex.test(text)) {
      return key;
    }
  }
  return null;
}

/**
 * Scan a text value for SQL Injection patterns.
 */
export function hasSQLInjection(text) {
  if (typeof text !== 'string') return false;
  return SQLI_PATTERNS.some(regex => regex.test(text));
}

/**
 * Escapes characters to prevent XSS.
 */
export function escapeXSS(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Deep scan and sanitize object values.
 */
export function deepScanAndSanitize(obj, path = '') {
  if (!obj) return obj;

  if (typeof obj === 'string') {
    // 1. SQL Injection Check (Layer 5.3)
    if (hasSQLInjection(obj)) {
      throw new Error(`SQL Injection keywords detected in field: ${path}`);
    }

    // 2. PII Check (Layer 5.2) - allow standard email fields
    const piiType = scanForPII(obj);
    if (piiType && !path.toLowerCase().includes('email')) {
      throw new Error(`PII pattern (${piiType}) detected in unencrypted parameter: ${path}`);
    }

    // 3. Escape for XSS
    return escapeXSS(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item, index) => deepScanAndSanitize(item, `${path}[${index}]`));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = deepScanAndSanitize(value, path ? `${path}.${key}` : key);
    }
    return sanitized;
  }

  return obj;
}

// Zod schemas for validation (Layer 5.1)
export const TransactionRequestSchema = z.object({
  transaction_id: z.string().max(255).optional(),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().length(3, "Currency must be 3-letter ISO code"),
  merchant: z.object({
    name: z.string().max(255),
    category: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    country: z.string().length(2).optional()
  }).optional(),
  customer: z.object({
    id: z.string().max(255),
    email: z.string().email().optional(),
    phone: z.string().max(50).optional(),
    city: z.string().max(100).optional(),
    country: z.string().length(2).optional()
  }).optional(),
  payment_method: z.string().max(100).optional(),
  device: z.object({
    id: z.string().max(255).optional(),
    ip: z.string().ip().optional(),
    user_agent: z.string().optional()
  }).optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Validate Transaction Analyse Request payload.
 */
export async function validateTransactionPayload(req, res, next) {
  try {
    // Max Payload Size check middleware (Layer 5.4)
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > 1024 * 1024) { // 1 MB
      return res.status(413).json({ detail: "Payload too large. Maximum size is 1MB." });
    }

    // 1. Zod structure check
    const parseResult = TransactionRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        detail: "Input schema validation failed",
        errors: parseResult.error.errors
      });
    }

    // 2. Scan and Sanitize PII / SQLi / XSS recursively
    try {
      req.body = deepScanAndSanitize(req.body);
    } catch (err) {
      return res.status(400).json({ detail: err.message });
    }

    next();
  } catch (err) {
    logger.error(`Validation error: ${err.message}`);
    return res.status(500).json({ detail: "Internal payload validation error." });
  }
}
