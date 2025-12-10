// Voice Management Configuration

/**
 * Allowed audio file types for voice uploads
 */
export const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",      // .mp3
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
] as const;

/**
 * Maximum file size for audio samples (25MB)
 */
export const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB

/**
 * Supported audio file extensions
 */
export const ALLOWED_AUDIO_EXTENSIONS = [".mp3", ".wav", ".ogg", ".webm"] as const;

