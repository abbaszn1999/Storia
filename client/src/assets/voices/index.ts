// Voice Management Entry Point

// Re-export API client functions
export {
  listVoices,
  getVoice,
  createVoice,
  updateVoice,
  deleteVoice,
  uploadAudioSample,
} from "./routes";

// Re-export types
export type {
  CreateVoiceRequest,
  UpdateVoiceRequest,
  VoiceResponse,
  UploadAudioResponse,
} from "./types";

