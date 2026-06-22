import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Ensure the encryption key is exactly 32 bytes for AES-256
function getEncryptionKey() {
  const rawKey = process.env.DB_ENCRYPTION_KEY || 'default_key_for_dev_must_be_32_bytes!';
  return crypto.createHash('sha256').update(rawKey).digest(); // Generates 32-byte key
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * Encrypt a plain text string into a formatted ciphertext.
 * @param {string} text Plain text to encrypt.
 * @returns {string} Encrypted string format: "iv:authTag:encryptedText"
 */
export function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a formatted ciphertext string.
 * @param {string} ciphertext Encrypted string format: "iv:authTag:encryptedText"
 * @returns {string} Decrypted plain text.
 */
export function decrypt(ciphertext) {
  if (!ciphertext) return null;
  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      // Return unchanged if it doesn't match the encrypted pattern
      return ciphertext;
    }
    
    const [ivHex, authTagHex, encryptedTextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedTextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    // If decryption fails, log and fallback safely
    return ciphertext;
  }
}
