/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AMBIENT VISUAL AI AGENTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * AI agents for ambient visual content generation.
 */

// Step 1: Atmosphere Phase
export { generateMoodDescription } from './mood-description-generator';

// Step 3: Flow Design Phase
export { generateScenes } from './scene-generator';
export { composeShots, composeShotsForScenes } from './shot-composer';
export { proposeContinuity } from './continuity-producer';

// Step 4: Composition Phase (Video Animation Mode)
export { generateVideoPrompts } from './video-prompt-engineer';

// Step 5: Soundscape Phase - Voiceover Generation
export { generateVoiceoverScript, calculateTotalDurationWithLoops } from './voiceover-script-generator';
export { generateVoiceoverAudio, AMBIENT_VOICES } from './voiceover-audio-generator';

// Step 5: Soundscape Phase - Sound Effect Recommendation
export { generateSoundEffectPrompt } from './sound-effect-prompt-generator';

// Step 5: Soundscape Phase - Sound Effect Generation
export { generateSoundEffect } from './sound-effect-generator';

// Future agents:
// Step 2: Visual World - Style descriptor, reference image processor
// Step 4: Composition - Image generator (video-image-generator), Video generator (video-clip-generator)
// Step 6: Export - Final video processor

