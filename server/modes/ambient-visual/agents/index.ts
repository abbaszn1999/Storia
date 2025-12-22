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

// Future agents:
// Step 2: Visual World - Style descriptor, reference image processor
// Step 4: Composition - Image generator, video generator
// Step 5: Preview - Animatic assembler
// Step 6: Export - Final video processor

