/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SOCIAL COMMERCE MODE - TYPE DEFINITIONS
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type {
  AspectRatio,
  DurationOption,
  PacingProfile,
  ShotType,
  CharacterMode,
  SpeedCurve,
} from './config';

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: STRATEGIC CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for Agent 1.1: Strategic Context Optimizer
 */
export interface StrategicContextInput {
  // Product basics
  productTitle: string;
  productDescription?: string;
  productCategory?: string;
  
  // Campaign settings
  targetAudience: string;
  region?: string;
  
  // Technical settings
  aspectRatio: AspectRatio;
  duration: DurationOption;
  
  // Optional user instructions
  customImageInstructions?: string;
  customMotionInstructions?: string;
}

/**
 * Output from Agent 1.1: Strategic Context Optimizer
 * 
 * This is the "Visual Bible" that guides all downstream agents.
 * Fields match the JSON output schema from agent-1.1-strategic-context-optimizer.md
 */
export interface StrategicContextOutput {
  /** Visual/cultural laws covering: cultural laws, visual hierarchy, emotional targeting, quality standards (4-8 sentences) */
  strategic_directives: string;
  
  /** Rhythmic profile determining shot durations and transitions */
  pacing_profile: PacingProfile;
  
  /** Professional cinematic movement description with camera/lens/timing specs (3-5 sentences) */
  optimized_motion_dna: string;
  
  /** SOTA technical prompt with render quality, materials, lighting, lens, post-processing (3-5 sentences) */
  optimized_image_instruction: string;
  
  /** Cost in USD for the API call */
  cost?: number;
}

/**
 * Step 1 Data stored in database
 */
export interface Step1Data {
  // Input settings
  productTitle: string;
  productDescription?: string;
  productCategory?: string;
  targetAudience: string;
  region?: string;
  aspectRatio: AspectRatio;
  duration: DurationOption;
  customImageInstructions?: string;
  customMotionInstructions?: string;
  
  // Agent 1.1 output
  strategicContext?: StrategicContextOutput;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2: PRODUCT & CAST DNA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Product image reference
 */
export interface ProductImage {
  id: string;
  url: string;
  isHero: boolean;
  label?: string;
}

/**
 * Output from Agent 2.1: Product DNA Visionary
 */
export interface ProductDNAOutput {
  geometric_soul: {
    silhouette_class: string;
    complexity_score: number;
    hero_angle: string;
    negative_space_map: string;
  };
  material_fingerprint: {
    surface_type: string;
    texture_detail: string;
    reflectivity: number;
    transparency: number;
  };
  anchor_points: Array<{
    name: string;
    position: string;
    camera_affinity: string[];
  }>;
  lighting_response: {
    key_light_position: string;
    fill_ratio: string;
    rim_sensitivity: string;
    specular_behavior: string;
  };
  cost?: number;
}

/**
 * Character AI Profile from Agent 2.2
 */
export interface CharacterAIProfile {
  identity_id: string;
  character_name: string;
  detailed_persona: string;
  cultural_fit: string;
  interaction_protocol: {
    product_relationship: string;
    gesture_vocabulary: string[];
    forbidden_actions: string[];
  };
  identity_locking: {
    strategy: 'IP_ADAPTER_STRICT' | 'PROMPT_EMBEDDING' | 'SEED_CONSISTENCY' | 'COMBINED';
    vfx_anchor_tags: string[];
    reference_image_required: boolean;
  };
  image_generation_prompt?: string;
  cost?: number;
}

/**
 * Brand Identity output from Agent 2.3
 */
export interface BrandIdentityOutput {
  logo_integrity: 'flexible' | 'moderate' | 'strict' | 'exact';
  logo_depth: 'flat' | 'subtle' | 'moderate' | 'embossed' | 'extruded';
  brand_colors: {
    primary: string;
    secondary: string;
  };
}

/**
 * Step 2 Data stored in database
 */
export interface Step2Data {
  // Product images (Bunny CDN URLs from Assets/Uploads/)
  productImages: {
    heroProfile: string | null;
    macroDetail: string | null;
    materialReference: string | null;
  };
  
  // Material settings
  materialPreset: string;
  surfaceComplexity: number;
  refractionEnabled: boolean;
  heroFeature: string;
  originMetaphor: string;
  
  // Agent 2.1 output
  productDNA?: ProductDNAOutput;
  
  // Character (always creates asset if provided)
  characterMode?: string;
  characterDescription?: string;
  characterReferenceUrl?: string | null;
  characterAssetId?: string | null; // ID in characters table
  characterName?: string;
  
  // Agent 2.2 output
  characterAIProfile?: CharacterAIProfile;
  
  // Brand (always creates asset if provided)
  logoUrl?: string | null;
  brandPrimaryColor?: string;
  brandSecondaryColor?: string;
  logoIntegrity?: number; // 1-10 slider
  logoDepth?: number; // 1-5 slider
  brandkitAssetId?: string | null; // ID in brandkits table
  brandName?: string;
  
  // Agent 2.3 output
  brandIdentity?: BrandIdentityOutput;
  
  // Style reference
  styleReferenceUrl?: string | null;
}

/**
 * Input for Agent 2.1: Product DNA Visionary
 */
export interface ProductDNAInput {
  heroProfile: string;
  macroDetail: string | null;
  materialReference: string | null;
  materialPreset: string;
  surfaceComplexity: number;
  refractionEnabled: boolean;
  heroFeature: string;
  originMetaphor: string;
}

/**
 * Input for Agent 2.2: Character Curator
 */
export interface CharacterCuratorInput {
  strategic_directives: string;
  targetAudience: string;
  optimized_image_instruction: string;
  characterMode: string;
  character_description: string;
  characterReferenceUrl: string | null;
}

/**
 * Input for Agent 2.3: Brand Identity Guardian
 */
export interface BrandIdentityInput {
  logoUrl: string | null;
  brandPrimaryColor: string;
  brandSecondaryColor: string;
  logoIntegrity: number;
  logoDepth: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3: ENVIRONMENT & STORY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Output from Agent 3.0: Creative Concept Catalyst
 */
export interface CreativeSparkOutput {
  creative_spark: string;
  cost?: number;
}

/**
 * Output from Agent 3.1: Atmospheric World-Builder
 */
export interface EnvironmentOutput {
  lighting_preset: string;
  atmospheric_density: string;
  chromatic_bible: {
    primary_hex: string;
    secondary_hex: string;
    accent_hex: string;
  };
  environment_anchor_prompt: string;
  cost?: number;
}

/**
 * Scene structure from Agent 3.2
 */
export interface SceneStructure {
  scene_id: string;
  act: 'hook' | 'transform' | 'payoff';
  scene_name: string;
  scene_description: string;
  energy_level: number; // 1-10
  sfx_cue?: string;
}

/**
 * Output from Agent 3.2: 3-Act Narrative Architect
 */
export interface NarrativeOutput {
  scenes: SceneStructure[];
  total_duration: number;
  cost?: number;
}

/**
 * Output from Agent 3.3: Asset-Environment Harmonizer
 */
export interface HarmonizerOutput {
  product_modifiers: {
    environment_reflection: string;
    lighting_adaptation: string;
    color_temperature_shift: string;
  };
  character_modifiers: {
    wardrobe_adaptation?: string;
    skin_tone_lighting?: string;
  };
  metaphor_injection: string;
  cost?: number;
}

/**
 * Step 3 Data stored in database
 */
export interface Step3Data {
  // Agent 3.0 output
  creativeSpark?: CreativeSparkOutput;
  
  // Agent 3.1 output
  environment?: EnvironmentOutput;
  
  // Agent 3.2 output
  narrative?: NarrativeOutput;
  
  // Agent 3.3 output
  harmonizer?: HarmonizerOutput;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4: SHOT ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Shot definition from Agent 4.1
 */
export interface ShotDefinition {
  shot_id: string;
  scene_id: string;
  shot_name: string;
  description: string;
  
  // Technical cinematography
  technical_cinematography: {
    framing: string;
    camera_path: string;
    lens: string;
    motion_intensity: number; // 1-10
  };
  
  // Generation mode
  generation_mode: {
    shot_type: ShotType;
    reason: string;
    is_connected_to_previous: boolean;
    connects_to_next: boolean;
  };
  
  // Identity references (dynamic decisions by Agent 4.1)
  identity_references: {
    refer_to_product: boolean;
    product_image_ref?: string;
    refer_to_logo: boolean;
    refer_to_character: boolean;
    refer_to_previous_outputs?: Array<{
      shot_id: string;
      reference_type: 'composition' | 'lighting' | 'color_grade' | 'product_state';
      reason: string;
    }>;
  };
}

/**
 * Output from Agent 4.1: Cinematic Media Planner
 */
export interface MediaPlannerOutput {
  shots: ShotDefinition[];
  total_shots: number;
  cost?: number;
}

/**
 * Timing data from Agent 4.2
 */
export interface ShotTiming {
  shot_id: string;
  rendered_duration: number;
  multiplier: number;
  speed_curve: SpeedCurve;
  sfx_hint: string;
}

/**
 * Output from Agent 4.2: Temporal Rhythmic Orchestrator
 */
export interface TimingOutput {
  temporal_map: ShotTiming[];
  duration_budget: {
    target_total: number;
    actual_total: number;
    variance: number;
  };
  cost?: number;
}

/**
 * Step 4 Data stored in database
 */
export interface Step4Data {
  // Agent 4.1 output
  mediaPlanner?: MediaPlannerOutput;
  
  // Agent 4.2 output
  timing?: TimingOutput;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5: MEDIA PLANNING & GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Prompt set from Agent 5.1
 */
export interface ShotPrompts {
  shot_id: string;
  condition: 1 | 2 | 3 | 4;
  shot_type: ShotType;
  is_connected: boolean;
  
  prompts: {
    image: { text: string; tags_used: string[] } | null;
    start_frame: { text: string; tags_used: string[] } | null;
    end_frame: { text: string; tags_used: string[] } | null;
    video: { text: string };
  };
  
  inheritance_note: string | null;
}

/**
 * Generated shot version
 */
export interface ShotVersion {
  id: string;
  shot_id: string;
  version_number: number;
  
  // Prompts used
  prompts: ShotPrompts;
  
  // Generated assets
  image_url?: string;
  start_frame_url?: string;
  end_frame_url?: string;
  video_url?: string;
  
  // Status
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error_message?: string;
  
  // Timestamps
  created_at: Date;
  completed_at?: Date;
}

/**
 * Step 5 Data stored in database
 */
export interface Step5Data {
  // All shot prompts from Agent 5.1
  shotPrompts?: Record<string, ShotPrompts>;
  
  // Generated versions
  shotVersions?: Record<string, ShotVersion[]>;
  
  // Current version selections
  currentVersions?: Record<string, string>; // shot_id -> version_id
  
  // Export settings
  exportSettings?: {
    resolution: string;
    format: string;
    includeAudio: boolean;
  };
  
  // Final export
  exportUrl?: string;
  thumbnailUrl?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO PROJECT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Request to create a new Social Commerce video project
 */
export interface CreateVideoRequest {
  workspaceId: string;
  title: string;
  productTitle: string;
  aspectRatio?: AspectRatio;
  duration?: DurationOption;
}

/**
 * Complete video project state
 */
export interface SocialCommerceVideo {
  id: string;
  workspaceId: string;
  title: string;
  mode: 'commerce';
  status: 'draft' | 'in_progress' | 'completed' | 'failed';
  
  currentStep: number;
  completedSteps: number[];
  
  step1Data?: Step1Data;
  step2Data?: Step2Data;
  step3Data?: Step3Data;
  step4Data?: Step4Data;
  step5Data?: Step5Data;
  
  exportUrl?: string;
  thumbnailUrl?: string;
  
  createdAt: Date;
  updatedAt: Date;
}


