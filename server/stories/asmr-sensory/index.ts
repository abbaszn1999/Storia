// ASMR / Sensory Template Entry Point

// Re-export router
export { asmrRouter, default } from "./routes";

// Re-export types
export type {
  EnhancePromptRequest,
  EnhancePromptResponse,
  ASMRGenerateRequest,
  ASMRGenerateResponse,
  ASMRTaskStatus,
  ASMRTaskStatusResponse,
  VideoModelConfig,
  ASMRCategory,
  ASMRMaterial,
} from "./types";

// Re-export config
export {
  VIDEO_MODEL_CONFIGS,
  ASMR_CATEGORIES,
  ASMR_MATERIALS,
  DIMENSION_MAP,
  MODEL_DIMENSIONS,
  getDefaultVideoModel,
  getAvailableVideoModels,
  getCategoryById,
  getMaterialsByIds,
  getDimensions,
} from "./config";

// Re-export agents
export {
  generateVideo,
  checkTaskStatus,
  getModelCapabilities,
  modelHasAudio,
} from "./agents";
