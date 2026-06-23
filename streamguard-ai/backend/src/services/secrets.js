import crypto from 'crypto';
import winston from 'winston';

const logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

const REQUIRED_ENV_VARS = {
  "DATABASE_URL": { minLength: 20 },
  "REDIS_URL": { minLength: 10 },
  "SUPABASE_URL": { minLength: 20 },
  "SUPABASE_ANON_KEY": { minLength: 30 },
  "DB_ENCRYPTION_KEY": { minLength: 32 },
  "RAZORPAY_KEY_ID": { minLength: 14 },
  "RAZORPAY_KEY_SECRET": { minLength: 20 },
  "RAZORPAY_WEBHOOK_SECRET": { minLength: 20 },
  "ENVIRONMENT": { allowed: ["production", "staging", "development"] },
};

export function validateAllSecrets() {
  const env = process.env.ENVIRONMENT || "development";
  const errors = [];

  // Generate safe development fallbacks
  if (env !== "production") {

    if (!process.env.DB_ENCRYPTION_KEY || process.env.DB_ENCRYPTION_KEY.length < 32) {
      process.env.DB_ENCRYPTION_KEY = crypto.randomBytes(16).toString('hex'); // 32 chars
      logger.warn("Generated fallback DB_ENCRYPTION_KEY for development.");
    }
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.length < 14) {
      process.env.RAZORPAY_KEY_ID = "rzp_test_" + crypto.randomBytes(5).toString('hex');
      logger.warn("Generated fallback RAZORPAY_KEY_ID for development.");
    }
    if (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET.length < 20) {
      process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret_" + crypto.randomBytes(4).toString('hex');
      logger.warn("Generated fallback RAZORPAY_KEY_SECRET for development.");
    }
    if (!process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET.length < 20) {
      process.env.RAZORPAY_WEBHOOK_SECRET = "rzp_webhook_secret_" + crypto.randomBytes(4).toString('hex');
      logger.warn("Generated fallback RAZORPAY_WEBHOOK_SECRET for development.");
    }
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.length < 20) {
      process.env.DATABASE_URL = "postgresql://localhost:5432/flowshield";
      logger.warn("Fallback database URL configured to localhost PostgreSQL.");
    }
    if (!process.env.REDIS_URL || process.env.REDIS_URL.length < 10) {
      process.env.REDIS_URL = "redis://localhost:6379/0";
      logger.warn("Fallback Redis URL configured to localhost.");
    }
    if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.length < 20) {
      process.env.SUPABASE_URL = "https://mockproject.supabase.co";
      logger.warn("Fallback Supabase URL configured.");
    }
    if (!process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY.length < 50) {
      process.env.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2twcm9qZWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzg4MDk2MDAsImV4cCI6MTk5NDM4NTYwMH0." + crypto.randomBytes(32).toString('base64');
      logger.warn("Fallback Supabase Anon Key configured.");
    }
  }

  // Perform checks
  for (const [varName, rules] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[varName] || "";

    if (!value) {
      errors.append ? errors.push(`Missing: ${varName}`) : errors.push(`Missing: ${varName}`);
      continue;
    }

    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${varName} too short: ${value.length} < ${rules.minLength}`);
    }

    if (rules.allowed && !rules.allowed.includes(value)) {
      errors.push(`${varName} has invalid value: ${value}`);
    }
  }

  if (errors.length > 0) {
    throw new Error("Secret validation failed:\n" + errors.join("\n"));
  }

  logger.info("All environment secrets validated successfully.");
}
