/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SHARED UTILITIES FOR AMBIENT VISUAL ROUTES
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import multer from 'multer';

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPORARY REFERENCE IMAGE STORAGE (Memory)
// ═══════════════════════════════════════════════════════════════════════════════

// Configure multer for memory storage (files stored in buffer)
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max for reference images
  },
  fileFilter: (_req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO FILE UPLOAD (for custom background music)
// ═══════════════════════════════════════════════════════════════════════════════

// Configure multer for audio file uploads
export const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max for audio files
  },
  fileFilter: (_req, file, cb) => {
    // Allow audio files: MP3, WAV, M4A, OGG
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/m4a',
      'audio/x-m4a',
      'audio/ogg',
      'audio/aac',
    ];
    const allowedExtensions = /\.(mp3|wav|m4a|ogg|aac)$/i;
    
    if (allowedMimeTypes.some(type => file.mimetype.includes(type.split('/')[1])) || 
        allowedExtensions.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed (MP3, WAV, M4A, OGG)'));
    }
  },
});

// In-memory storage for temporary uploads
export interface TempUpload {
  buffer: Buffer;
  mimetype: string;
  originalName: string;
  uploadedAt: number;
}

export const tempUploads = new Map<string, TempUpload>();

// Cleanup expired uploads every 30 minutes
setInterval(() => {
  const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
  let cleaned = 0;
  const entries = Array.from(tempUploads.entries());
  for (const [id, upload] of entries) {
    if (upload.uploadedAt < thirtyMinAgo) {
      tempUploads.delete(id);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[ambient-visual:routes] Cleaned up ${cleaned} expired temp uploads`);
  }
}, 30 * 60 * 1000);

export function getTempUpload(tempId: string): TempUpload | undefined {
  return tempUploads.get(tempId);
}

export function deleteTempUpload(tempId: string): void {
  tempUploads.delete(tempId);
}

