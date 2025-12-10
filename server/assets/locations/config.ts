// Location Management Configuration

/**
 * Maximum number of reference images allowed per location
 */
export const MAX_REFERENCE_IMAGES = 2;

/**
 * Allowed image file types for location uploads
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

/**
 * Maximum file size for location images (10MB)
 */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Supported image file extensions
 */
export const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

