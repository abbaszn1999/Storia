// Brand Kit Management Configuration

/**
 * Allowed image file types for brand kit logo uploads
 * Includes SVG for vector logos
 */
export const ALLOWED_LOGO_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/svg+xml",
] as const;

/**
 * Maximum file size for brand kit logos (10MB)
 */
export const MAX_LOGO_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Supported logo file extensions
 */
export const ALLOWED_LOGO_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".svg"] as const;

