// Upload Management Entry Point

// Re-export router
export { default as uploadRouter, default } from "./routes";

// Re-export types
export type {
  CreateUploadRequest,
  UpdateUploadRequest,
  UploadResponse,
  FileUploadResponse,
} from "./types";

// Re-export config
export {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_FILE_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  MAX_FILE_SIZE,
  ALLOWED_FILE_EXTENSIONS,
  isImageType,
  isVideoType,
} from "./config";

