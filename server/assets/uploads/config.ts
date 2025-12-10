// Upload Management Configuration

/**
 * Allowed image file types
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/**
 * Allowed video file types
 */
export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
] as const;

/**
 * All allowed file types for uploads
 */
export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
] as const;

/**
 * Maximum file size for images (50MB)
 */
export const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Maximum file size for videos (500MB)
 */
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

/**
 * Maximum file size (uses video limit as max)
 */
export const MAX_FILE_SIZE = MAX_VIDEO_SIZE;

/**
 * Supported file extensions
 */
export const ALLOWED_FILE_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".webp", ".gif",
  ".mp4", ".webm", ".mov", ".avi",
] as const;

/**
 * Check if a MIME type is an image
 */
export function isImageType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType as any);
}

/**
 * Check if a MIME type is a video
 */
export function isVideoType(mimeType: string): boolean {
  return ALLOWED_VIDEO_TYPES.includes(mimeType as any);
}

