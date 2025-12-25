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
  
  // AI Model Settings
  imageModel?: string;
  imageResolution?: string;
  videoModel?: string;
  videoResolution?: string;
  language?: 'ar' | 'en';
  voiceOverEnabled?: boolean;
  
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
 * 
 * NOTE: This matches the JSON schema output from the agent
 */
export interface ProductDNAOutput {
  geometry_profile: string;        // Mathematical description of form
  material_spec: string;           // Technical texture specifications
  hero_anchor_points: string[];    // Array of 3-5 key visual landmarks
  lighting_response: string;       // Physics-based light interaction rules
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
 * Step 2 Data stored in database (Organized Structure)
 */
export interface Step2Data {
  product?: {
    images?: {
      heroProfile?: string | null;
      macroDetail?: string | null;
      materialReference?: string | null;
    };
    material?: {
      preset?: string;
      objectMass?: number;
      surfaceComplexity?: number;
      refractionEnabled?: boolean;
      heroFeature?: string;
      originMetaphor?: string;
    };
    dna?: ProductDNAOutput; // Agent 2.1 output
  };
  
  character?: {
    mode?: string;
    name?: string;
    description?: string;
    referenceUrl?: string | null;
    assetId?: string | null;
    aiProfile?: CharacterAIProfile; // Agent 2.2 output
  };
  
  brand?: {
    logoUrl?: string | null;
    name?: string;
    assetId?: string | null;
    colors?: {
      primary?: string;
      secondary?: string;
    };
    logo?: {
      integrity?: number; // 1-10 slider
      depth?: number; // 1-5 slider
    };
    identity?: BrandIdentityOutput; // Agent 2.3 output
  };
  
  style?: {
    referenceUrl?: string | null;
  };
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
 * Input for Character Planning Agent (AI Recommend)
 * Generates 3 character suggestions based on description and/or reference image
 */
export interface CharacterPlanningInput {
  // Context from Tab 1
  strategic_directives: string;
  targetAudience: string;
  optimized_image_instruction: string;
  productTitle: string;
  
  // User selected mode (REQUIRED - user must select before AI Recommend)
  characterMode: CharacterMode;
  
  // User input (optional - can work from context alone)
  character_description?: string;  // User's text description
  referenceImageUrl?: string;      // Temporary reference image URL
  
  // Campaign settings
  aspectRatio: string;
  duration: number;
}

/**
 * Single character recommendation from Planning Agent (Agent 2.2a)
 * Each recommendation is a COMPLETE profile ready for execution by Agent 2.2b
 */
export interface CharacterRecommendation {
  id: string;                      // Unique ID like "REC_ASPIRATIONAL_001"
  name: string;                    // Short name like "Elegant Minimalist"
  mode: 'hand-model' | 'full-body' | 'silhouette';
  
  // Character Profile (detailed persona)
  character_profile: {
    identity_id: string;           // Unique reference ID like "LUXURY_ELEGANT_F1"
    detailed_persona: string;      // Complete physical specification (4-6 sentences)
    cultural_fit: string;          // How character matches target audience (2-3 sentences)
  };
  
  // Visual profile (for UI display)
  appearance: {
    age_range: string;             // "25-35"
    skin_tone: string;             // "warm olive with golden undertones"
    build: string;                 // "athletic", "elegant", "professional"
    style_notes: string;           // Key visual characteristics
  };
  
  // Interaction Protocol (how character engages with product)
  interaction_protocol: {
    product_engagement: string;    // Technical rules for product interaction (2-4 sentences)
    motion_limitations: string;    // AI-safe movement constraints (2-4 sentences)
  };
  
  // Identity Locking (VFX consistency strategy)
  identity_locking: {
    strategy: 'IP_ADAPTER_STRICT' | 'PROMPT_EMBEDDING' | 'SEED_CONSISTENCY' | 'COMBINED';
    vfx_anchor_tags: string[];     // Keywords for shot-to-shot consistency
    reference_image_required: boolean;
  };
}

/**
 * Output from Character Planning Agent
 */
export interface CharacterPlanningOutput {
  recommendations: CharacterRecommendation[];
  reasoning: string;               // Brief explanation of choices
  cost?: number;
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
  visual_manifest: {
    global_lighting_setup: string;
    physics_parameters: {
      fog_density: number;
      moisture_level: number;
      wind_intensity: number;
      dust_frequency: number;
      particle_type: 'floating_dust' | 'rain' | 'snow' | 'embers' | 'smoke' | 'none';
    };
    chromatic_bible: {
      primary_hex: string;
      secondary_hex: string;
      accent_hex: string;
    };
    environmental_anchor_prompt: string;
  };
  cost?: number;
}

/**
 * Output from Agent 3.2: 3-Act Narrative Architect
 */
export interface NarrativeOutput {
  script_manifest: {
    act_1_hook: {
      text: string;
      emotional_goal: string;
      target_energy: number;
      sfx_cue: string;
    };
    act_2_transform: {
      text: string;
      emotional_goal: string;
      target_energy: number;
      sfx_cue: string;
    };
    act_3_payoff: {
      text: string;
      emotional_goal: string;
      target_energy: number;
      sfx_cue: string;
      cta_text: string; // Always present, but can be empty string if not applicable
    };
  };
  cost?: number;
}

/**
 * Output from Agent 3.3: Asset-Environment Harmonizer
 */
export interface HarmonizerOutput {
  interaction_physics: {
    product_modifiers: string;
    character_modifiers: string;
    metaphor_injection: string;
  };
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
  
  // UI Inputs (user-entered settings)
  uiInputs?: {
    environmentConcept: string;
    atmosphericDensity: number;
    cinematicLighting: string;
    visualPreset: string;
    styleReferenceUrl?: string | null;
    campaignSpark: string;
    visualBeats: {
      beat1: string;
      beat2: string;
      beat3: string;
    };
    campaignObjective: string;
    environmentBrandPrimaryColor?: string;
    environmentBrandSecondaryColor?: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4: SHOT ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Shot definition from Agent 4.1
 */
export interface ShotDefinition {
  shot_id: string;
  cinematic_goal: string;
  brief_description: string;
  
  // Technical cinematography
  technical_cinematography: {
    camera_movement: string;
    lens: string;
    depth_of_field: string;
    framing: "ECU" | "CU" | "MCU" | "MED" | "WIDE";
    motion_intensity: number; // 1-10
  };
  
  // Generation mode
  generation_mode: {
    shot_type: ShotType;
    reason: string;
  };
  
  // Identity references (dynamic decisions by Agent 4.1)
  identity_references: {
    refer_to_product: boolean;
    product_image_ref?: "heroProfile" | "macroDetail" | "materialReference";
    refer_to_character: boolean;
    refer_to_logo: boolean;
    refer_to_previous_outputs: Array<{
      shot_id: string;
      reason: string;
      reference_type: "VISUAL_CALLBACK" | "LIGHTING_MATCH" | "PRODUCT_STATE" | "COMPOSITION_ECHO";
    }>;
  };
  
  // Continuity logic
  continuity_logic: {
    is_connected_to_previous: boolean;
    is_connected_to_next: boolean;
    handover_type: "SEAMLESS_FLOW" | "MATCH_CUT" | "JUMP_CUT";
  };
  
  composition_safe_zones: string;
  lighting_event: string;
}

/**
 * Scene definition from Agent 4.1
 */
export interface SceneDefinition {
  scene_id: string;
  scene_name: string;
  scene_description: string;
  shots: ShotDefinition[];
}

/**
 * Output from Agent 4.1: Cinematic Media Planner
 */
export interface MediaPlannerOutput {
  scenes: SceneDefinition[];
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
 * VFX Seeds from algorithmic calculator
 */
export interface VfxSeeds {
  shot_id: string;
  motion_bucket: number; // 1-10
  frame_consistency_scale: number; // 0.70-0.90
  target_handover_image: string | null;
}

/**
 * Step 4 Data stored in database
 */
export interface Step4Data {
  // Agent 4.1 output
  mediaPlanner?: MediaPlannerOutput;
  
  // Agent 4.2 output
  timing?: TimingOutput;
  
  // VFX Seeds (algorithmic)
  vfxSeeds?: VfxSeeds[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5: PROMPT ARCHITECT (AGENT 5.1)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for Agent 5.1: Prompt Architect
 */
export interface PromptArchitectInput {
  // Section 1: Strategic Foundation
  strategic_foundation: {
    target_audience: string;
    campaign_objective: 'brand-awareness' | 'feature-showcase' | 'sales-cta';
  };
  
  // Section 2: Narrative Vision
  narrative_vision: {
    creative_spark: string;
    visual_beat_1: string;
    visual_beat_2: string;
    visual_beat_3: string;
  };
  
  // Section 3: Visual Identity
  visual_identity: {
    style_source: 'preset' | 'uploaded';
    visual_preset?: string;
    environment_concept: string;
    lighting_preset: string;
    atmospheric_density: number;
    environment_primary_color: string;
    environment_secondary_color: string;
  };
  
  // Section 4: Subject Assets (images handled separately)
  subject_assets: {
    product?: {
      image_url: string;
      image_ref: 'heroProfile' | 'macroDetail' | 'materialReference';
      material_preset: string;
      object_mass: number;
      surface_complexity: number;
      refraction_enabled: boolean;
      hero_feature: string;
      origin_metaphor: string;
    };
    logo?: {
      image_url: string;
      brand_primary_color: string;
      brand_secondary_color: string;
      logo_integrity: number;
      logo_depth: string;
    };
    character?: {
      image_url: string;
      character_mode: string;
      character_description: string;
    };
    style_reference?: {
      image_url: string;
    };
    previous_shots?: Array<{
      shot_id: string;
      shot_image_url: string;
      reference_type: string;
      reason: string;
    }>;
  };
  
  // Section 5: Scene Context
  scene_context: {
    // All scenes overview
    all_scenes: Array<{
      scene_id: string;
      scene_name: string;
      scene_description: string;
    }>;
    
    // All shots in all scenes (complete details, not summaries)
    all_shots: Array<{
      scene_id: string;
      shot_id: string;
      shot_name: string;
      shot_description: string;
      shot_type: 'IMAGE_REF' | 'START_END';
      camera_path: string;
      lens: string;
      framing: string;
      motion_intensity: number;
      duration: number;
      is_connected_to_previous: boolean;
      connects_to_next: boolean;
    }>;
    
    // Current scene (for context only)
    current_scene: {
      scene_id: string;
      scene_name: string;
      scene_description: string;
      scene_position: string;
      is_first_scene: boolean;
      is_last_scene: boolean;
    };
  };
  
  // Section 6: Target Shot
  target_shot: {
    shot_id: string;
    shot_name: string;
    description: string;
    framing: string;
    camera_path: string;
    lens: string;
    motion_intensity: number;
    shot_type: 'IMAGE_REF' | 'START_END';
    shot_type_reason: string;
    is_connected_to_previous: boolean;
    connects_to_next: boolean;
    rendered_duration: number;
    multiplier: number;
    curve_type: string;
    frame_consistency_scale: number;
    motion_blur_intensity: number;
    temporal_coherence_weight: number;
    shot_position_in_scene: string;
    is_first_in_scene: boolean;
    is_last_in_scene: boolean;
    previous_shot_summary?: string;
    next_shot_summary?: string;
    // Identity references - which @ tags to use
    refer_to_product?: boolean;
    product_image_ref?: 'heroProfile' | 'macroDetail' | 'materialReference';
    refer_to_logo?: boolean;
    refer_to_character?: boolean;
    refer_to_previous_outputs?: Array<{
      shot_id: string;
      reference_type: string;
    }>;
  };
  
  // Section 7: Custom Instructions
  custom_instructions: {
    custom_image_instructions?: string;
    global_motion_dna?: string;
  };
  
  // Previous Shot Context (Condition 3 & 4 only)
  previous_shot_context?: {
    previous_shot_id: string;
    previous_end_frame_prompt: string;  // Text only - how inherited image was described
    previous_video_prompt: string;      // Text only - motion that led to end frame
  };
}

/**
 * Prompt set from Agent 5.1
 */
export interface ShotPrompts {
  shot_id: string;
  condition: 1 | 2 | 3 | 4;
  shot_type: ShotType;
  is_connected: boolean;
  
  prompts: {
    image: { text: string } | null;
    start_frame: { text: string } | null;
    end_frame: { text: string } | null;
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


