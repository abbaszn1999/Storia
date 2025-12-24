/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SOCIAL COMMERCE AI AGENTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * AI agents for social commerce video generation.
 * Organized by tab/step for clarity.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: STRATEGIC CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

// Agent 1.1: Strategic Context Optimizer
export { 
  optimizeStrategicContext,
  getDefaultStrategicContext,
} from './tab-1/strategic-context-optimizer';

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: PRODUCT & CAST DNA
// ═══════════════════════════════════════════════════════════════════════════════

// Agent 2.1: Product DNA Visionary
export { analyzeProductDNA } from './tab-2/product-dna-visionary';

// Agent 2.2a: Character Planning (AI Recommend)
// Generates 3 COMPLETE character recommendations with full profiles
// Each recommendation includes: character_profile, interaction_protocol, 
// identity_locking, and image_generation_prompt ready for Agent 2.2b
export { generateCharacterRecommendations } from './tab-2/character-planning';

// Agent 2.2b: Character Execution (Image Generation)
// Takes selected recommendation's prompt and generates the actual character image
// Uses image model settings from Tab 1 (step1Data)
export { generateCharacterImage } from './tab-2/character-execution';
export type { CharacterExecutionInput, CharacterExecutionOutput } from './tab-2/character-execution';

// Agent 2.3: Brand Identity Guardian (Algorithmic)
export { convertBrandIdentity } from './tab-2/brand-identity-guardian';

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3: ENVIRONMENT & STORY
// ═══════════════════════════════════════════════════════════════════════════════

// Agent 3.0: Creative Concept Catalyst
export { generateCreativeSpark } from './tab-3/creative-concept-catalyst';
export type { CreativeSparkInput } from './tab-3/creative-concept-catalyst';

// Agent 3.1: Atmospheric World-Builder
export { buildEnvironment } from './tab-3/atmospheric-world-builder';
export type { WorldBuilderInput } from './tab-3/atmospheric-world-builder';

// Agent 3.2: 3-Act Narrative Architect
export { createNarrative } from './tab-3/narrative-architect';
export type { NarrativeInput } from './tab-3/narrative-architect';

// Agent 3.3: Asset-Environment Harmonizer
export { harmonizeAssets } from './tab-3/asset-environment-harmonizer';
export type { HarmonizerInput } from './tab-3/asset-environment-harmonizer';

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4: SHOT ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════

// Agent 4.1: Cinematic Media Planner
export { planShots } from './tab-4/cinematic-media-planner';
export type { MediaPlannerOutput } from './tab-4/cinematic-media-planner';

// Agent 4.2: Temporal Rhythmic Orchestrator
export { calculateTiming } from './tab-4/temporal-rhythmic-orchestrator';
export type { TimingOutput } from './tab-4/temporal-rhythmic-orchestrator';

// VFX Seeds Calculator (Algorithmic)
export { calculateVfxSeeds } from './tab-4/vfx-seeds-calculator';
export type { VfxSeeds, ShotForVfx } from './tab-4/vfx-seeds-calculator';

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 5: MEDIA PLANNING & GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

// Agent 5.1: Prompt Architect
// export { generatePrompts } from './tab-5/prompt-architect';

// Agent 5.2: Execution Orchestrator (Algorithmic)
// export { executeGeneration } from './tab-5/execution-orchestrator';


