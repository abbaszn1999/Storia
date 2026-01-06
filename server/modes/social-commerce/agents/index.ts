/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SOCIAL COMMERCE AI AGENTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * AI agents for social commerce video generation.
 * Organized by tab/step for clarity.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: CREATIVE SPARK & BEATS
// ═══════════════════════════════════════════════════════════════════════════════

// Agent 3.0: Creative Concept Catalyst
export { generateCreativeSpark } from './tab-2/creative-concept-catalyst';
export type { CreativeSparkInput } from './tab-2/creative-concept-catalyst';

// Agent 3.2: Narrative Architect (Generates Visual Beats)
export { createNarrative } from './tab-2/narrative-architect';
export type { NarrativeInput } from './tab-2/narrative-architect';

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3: PROMPT GENERATION & EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

// Agent 5.1: Prompt Architect (Batch Generation for all beats)
export { 
  generateBeatPrompts,
  validateBeatPromptOutput,
  buildImageAttachments,
} from './tab-3/prompt-architect';
export type { BatchBeatPromptInput, BeatPromptOutput } from '../../types';

// Agent 5.2: Voiceover Script Architect
export { generateVoiceoverScripts } from './tab-3/voiceover-script-architect';
export type { VoiceoverScriptInput, VoiceoverScriptOutput } from '../../types';

