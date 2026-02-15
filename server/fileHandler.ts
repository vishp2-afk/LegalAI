// Secure file handling with privacy measures
import multer from 'multer';
import crypto from 'crypto';
import { storage } from './storage';

// File upload configuration with security measures
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  },
  fileFilter: (req, file, cb) => {
    // Only allow specific file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

export const uploadMiddleware = upload.single('document');

// Extract text content from different file types
export async function extractTextContent(file: Express.Multer.File): Promise<string> {
  const { mimetype, buffer } = file;
  
  try {
    switch (mimetype) {
      case 'text/plain':
        return buffer.toString('utf-8');
        
      case 'application/pdf':
        // For now, return a placeholder. In production, you'd use pdf-parse or similar
        return `[PDF Content] - File: ${file.originalname}\nSize: ${file.size} bytes\nNote: PDF text extraction would be implemented here with pdf-parse library.`;
        
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        // For now, return a placeholder. In production, you'd use mammoth or similar
        return `[Word Document Content] - File: ${file.originalname}\nSize: ${file.size} bytes\nNote: Word document text extraction would be implemented here with mammoth library.`;
        
      default:
        throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Text extraction failed:', error);
    throw new Error('Failed to extract text content from file');
  }
}

// Create a secure hash of the document content for duplicate detection
export function createContentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// NOTE: Encryption/decryption is handled by server/crypto.ts using AES-256-GCM.
// The legacy encryptContent/decryptContent functions have been removed because they
// used deprecated APIs (crypto.createCipher), a hardcoded fallback key, and a static salt.

// Secure document upload handler
export async function handleDocumentUpload(
  file: Express.Multer.File, 
  userId: string
): Promise<{ document: any, content: string }> {
  if (!file) {
    throw new Error('No file provided');
  }

  // Extract and validate content
  const textContent = await extractTextContent(file);
  
  if (textContent.length < 50) {
    throw new Error('Document appears to be too short or empty');
  }

  if (textContent.length > 500000) { // 500KB text limit
    throw new Error('Document is too large');
  }

  // Create content hash for duplicate detection
  const contentHash = createContentHash(textContent);
  
  // Check for existing document with same content (privacy: only for same user)
  const existingDocs = await storage.getUserDocuments(userId);
  const duplicate = existingDocs.find(doc => doc.contentHash === contentHash);
  
  if (duplicate) {
    throw new Error('This document has already been uploaded');
  }

  // Create document record (encryption is handled by storage.createDocument via crypto.ts)
  const document = await storage.createDocument({
    userId,
    fileName: file.originalname,
    fileSize: file.size,
    fileType: file.mimetype,
    content: '',
    contentBuffer: file.buffer,
    contentHash,
    isPublic: false // Always private by default
  });

  return { document, content: textContent };
}