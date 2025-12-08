// ASMR Agents - Barrel Export
// ═══════════════════════════════════════════════════════════════════════════
// 4-AGENT ARCHITECTURE:
// Agent 1: Idea Generator     - Creative ASMR concept generation
// Agent 2: Prompt Engineer    - Transform ideas into cinematic prompts
// Agent 3: Video Generator    - Generate videos via Runware
// Agent 4: Image Generator    - Generate reference images for I2V
// ═══════════════════════════════════════════════════════════════════════════

// Agent 1: Idea Generator (for Enhance button)
export {
  generateIdea,
  getQuickIdea,
  type IdeaGeneratorInput,
  type IdeaGeneratorOutput,
} from "./idea-generator";

// Agent 2: Prompt Engineer (runs before video generation)
export {
  engineerPrompt,
  quickEngineer,
  type PromptEngineerInput,
  type PromptEngineerOutput,
} from "./prompt-engineer";

// Agent 3: Video Generator (Runware)
export {
  generateVideo,
  checkTaskStatus,
  getModelCapabilities,
  modelHasAudio,
} from "./video-generator";

// Agent 4: Image Generator (for Reference Image AI generation)
export {
  generateImage,
  getSupportedAspectRatios,
  type ImageGenerationInput,
  type ImageGenerationOutput,
} from "./image-generator";

// Agent 5: Sound Effects Generator (ElevenLabs - for models without native audio)
export {
  generateSound,
  isSoundGenerationAvailable,
  getMaxSoundDuration,
  type SoundGenerationInput,
  type SoundGenerationOutput,
} from "./sound-generator";

// Agent 6: Sound Prompt Enhancer (for Enhance button on Sound Prompt)
export {
  enhanceSoundPrompt,
  type SoundPromptEnhancerInput,
  type SoundPromptEnhancerOutput,
} from "./sound-prompt-enhancer";

