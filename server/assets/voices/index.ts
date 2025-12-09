// Voice Management Entry Point

// Re-export router
export { default as voiceRouter, default } from "./routes";

// Re-export types
export type {
  CreateVoiceRequest,
  UpdateVoiceRequest,
  UploadAudioRequest,
  VoiceResponse,
  UploadAudioResponse,
} from "./types";

// Re-export config
export {
  ALLOWED_AUDIO_TYPES,
  MAX_AUDIO_SIZE,
  ALLOWED_AUDIO_EXTENSIONS,
} from "./config";

