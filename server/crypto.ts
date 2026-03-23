import crypto from 'crypto';

// AES-256-GCM encryption for document content (authenticated encryption)
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;
const CRYPTO_VERSION = 1; // For future key rotation and algorithm changes

// Generate encryption key from password using PBKDF2
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha512');
}

// Get encryption password from environment - FAIL if not set
function getEncryptionPassword(): string {
  const password = process.env.DOCUMENT_ENCRYPTION_KEY;
  if (!password || password.length < 32) {
    throw new Error(
      'DOCUMENT_ENCRYPTION_KEY environment variable must be set with at least 32 characters for production security. ' +
      'Generate a strong key: node -e "console.log(crypto.randomBytes(32).toString(\'hex\'))"'
    );
  }
  return password;
}

export interface EncryptedData {
  version: number;
  algorithm: string;
  iterations: number;
  encryptedContent: string; // base64 encoded
  iv: string; // base64 encoded
  salt: string; // base64 encoded
  authTag: string; // base64 encoded for GCM authentication
}

/**
 * Encrypt document content using AES-256-GCM (authenticated encryption)
 * Accepts Buffer to handle binary documents properly
 */
export function encryptDocument(contentBuffer: Buffer): EncryptedData {
  const password = getEncryptionPassword();
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as crypto.CipherGCM;
  
  let encrypted = cipher.update(contentBuffer);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return {
    version: CRYPTO_VERSION,
    algorithm: ALGORITHM,
    iterations: ITERATIONS,
    encryptedContent: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    salt: salt.toString('base64'),
    authTag: authTag.toString('base64')
  };
}

/**
 * Decrypt document content using AES-256-GCM (authenticated encryption)
 * Returns Buffer to preserve binary content
 */
export function decryptDocument(encryptedData: EncryptedData): Buffer {
  const password = getEncryptionPassword();
  const salt = Buffer.from(encryptedData.salt, 'base64');
  const iv = Buffer.from(encryptedData.iv, 'base64');
  const authTag = Buffer.from(encryptedData.authTag, 'base64');
  const key = deriveKey(password, salt);
  
  const decipher = crypto.createDecipheriv(encryptedData.algorithm || ALGORITHM, key, iv) as crypto.DecipherGCM;
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(Buffer.from(encryptedData.encryptedContent, 'base64'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted;
}

/**
 * Generate content hash for duplicate detection
 * Accepts Buffer to handle binary documents properly
 */
export function generateContentHash(contentBuffer: Buffer): string {
  return crypto.createHash('sha256').update(contentBuffer).digest('hex');
}

/**
 * Convert buffer to text for analysis using appropriate parser per file type
 */
export async function bufferToText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType.startsWith('text/')) {
    return buffer.toString('utf8');
  }

  if (mimeType === 'application/pdf') {
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
    const data = await pdfParse(buffer);
    if (!data.text?.trim()) {
      throw new Error('PDF appears to be scanned or image-only — no extractable text found.');
    }
    return data.text;
  }

  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    if (!result.value?.trim()) {
      throw new Error('Word document appears to be empty or unreadable.');
    }
    return result.value;
  }

  // Fallback: attempt UTF-8 for unknown types
  return buffer.toString('utf8');
}