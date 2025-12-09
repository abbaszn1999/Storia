// Character Management Entry Point

// Re-export router
export { default as characterRouter, default } from "./routes";

// Re-export types
export type {
  CreateCharacterRequest,
  UpdateCharacterRequest,
  UploadImageRequest,
  CharacterResponse,
  UploadImageResponse,
} from "./types";

// Re-export config
export {
  MAX_REFERENCE_IMAGES,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  ALLOWED_IMAGE_EXTENSIONS,
} from "./config";

