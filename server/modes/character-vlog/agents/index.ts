/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHARACTER VLOG AI AGENTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * AI agents for character vlog content generation.
 * Organized by step/tab folders.
 */

// Step 1: Script Phase
export { generateScript } from './step-1-script/script-generator';

// Step 2: Elements Phase
export { analyzeCharacters } from './step-2-elements/character-analyzer';
export { analyzeLocations } from './step-2-elements/location-analyzer';

// Step 3: Scenes Phase
export { generateScenes } from './step-3-scenes/scene-generator';
export { generateShots } from './step-3-scenes/shot-generator';

// Step 4: Storyboard Phase
export { 
  generatePromptsForScene,
  buildCharacterAnchors,
  buildLocationAnchors,
  buildStyleAnchor,
} from './step-4-storyboard/unified-prompt-producer';
export { generateStoryboardImage } from './step-4-storyboard/image-generator';
export { generateVideo } from './step-4-storyboard/video-generator';

// Step 5: Sound Phase
export {
  generateVoiceoverScript,
  generateVoiceoverAudio,
  generateBackgroundMusic,
  generateSoundEffectPrompt,
  generateSoundEffect,
  calculateTotalDuration,
  CHARACTER_VLOG_VOICES,
} from './step-5-sound';