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
 * @deprecated Agent 1.1 has been removed. This type is kept for backward compatibility only.
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
  
  // Visual Style Settings (NEW)
  pacingOverride?: number; // 0-100, influences pacing_profile
  visualIntensity?: number; // 0-100, influences visual style and motion DNA
  productionLevel?: 'raw' | 'casual' | 'balanced' | 'cinematic' | 'ultra'; // Influences quality standards
  
  // Optional user instructions
  customMotionInstructions?: string; // Maps to motionPrompt from UI
  // REMOVED: customImageInstructions (not used in UI anymore)
}

/**
 * Output from Agent 1.1: Strategic Context Optimizer
 * 
 * This is the "Visual Bible" that guides all downstream agents.
 * Fields match the JSON output schema from agent-1.1-strategic-context-optimizer.md
 * @deprecated Agent 1.1 has been removed. This type is kept for backward compatibility only.
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
  videoModel?: string;
  videoResolution?: string;
  language?: 'ar' | 'en';
  voiceOverEnabled?: boolean;
  
  // Audio Settings
  audioVolume?: 'low' | 'medium' | 'high';
  speechTempo?: 'auto' | 'slow' | 'normal' | 'fast' | 'ultra-fast';
  dialogue?: Array<{id: string; character?: string; line: string}>;
  customVoiceoverInstructions?: string;
  soundEffectsEnabled?: boolean;
  soundEffectsPreset?: string;
  soundEffectsCustomInstructions?: string;
  soundEffectsUsePreset?: boolean;
  musicEnabled?: boolean;
  musicPreset?: string;
  musicCustomInstructions?: string;
  musicMood?: string;
  musicUsePreset?: boolean;
  
  // Quality Settings
  productionLevel?: 'raw' | 'casual' | 'balanced' | 'cinematic' | 'ultra';
  
  // Visual Style
  pacingOverride?: number; // 0-100
  visualIntensity?: number; // 0-100 (Craziness/Intensity of wildness)
  
  // Product Image (single hero image for Agent 5.1 vision analysis)
  productImageUrl?: string;
  
  // Agent 1.1 output (kept for backward compatibility, but no longer populated)
  /** @deprecated Agent 1.1 has been removed */
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
 * @deprecated Agent 2.1 has been removed. This type is kept for backward compatibility only.
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
 * Step 2 Data stored in database (Creative Spark + Beats)
 * Migrated from old step3Data
 */
export interface Step2Data {
  // Agent 3.0 output (Creative Spark)
  creativeSpark?: CreativeSparkOutput;
  
  // Agent 3.2 output (Visual Beats)
  narrative?: NarrativeOutput;
  
  // UI Inputs (user-entered settings)
  uiInputs?: {
    visualPreset: string; // photorealistic, cinematic, editorial, anime
    campaignSpark?: string; // User-written creative spark
    campaignObjective?: 'brand-awareness' | 'feature-showcase' | 'sales-cta';
  };
  
  // Legacy fields (kept for backward compatibility, but no longer used)
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
    /** @deprecated Agent 2.1 has been removed */
    dna?: ProductDNAOutput; // Agent 2.1 output (no longer used)
  };
  
  character?: {
    mode?: 'hand-model' | 'full-body' | 'silhouette';
    name?: string;
    description?: string;
    persona?: {
      detailed_persona: string;
      cultural_fit: string;
      interaction_protocol: {
        product_engagement: string;
        motion_limitations: string;
      };
    };
  };
  
  firstFrameUrl?: string;
  firstFrameDimensions?: {
    width: number;
    height: number;
  };
  
  style?: {
    referenceUrl?: string | null;
  };
  
  cinematography?: {
    cameraShotDefault?: string | null;
    lensDefault?: string | null;
  };
}

/**
 * Input for Agent 2.1: Product DNA Visionary
 * @deprecated Agent 2.1 has been removed. This type is kept for backward compatibility only.
 */
export interface ProductDNAInput {
  heroProfile: string;
  macroDetail: string | null;
  materialReference: string | null;
  materialPreset: string;
  objectMass: number; // 0-100, influences material behavior and physics
  surfaceComplexity: number;
  refractionEnabled: boolean;
  heroFeature: string;
  originMetaphor: string;
}

/**
 * Input for Agent 2.2a: Character Planning (simplified for Sora)
 */
export interface CharacterCuratorInput {
  strategic_directives: string;
  targetAudience: string;
  optimized_image_instruction: string;
  characterMode: string;
  character_description: string;
  // Removed: characterReferenceUrl (no image upload for Sora)
}

/**
 * Input for Character Planning Agent (AI Recommend)
 * Generates 3 character suggestions based on description and/or reference image
 * @deprecated Character Planning Agent has been removed. This type is kept for backward compatibility only.
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
  // REMOVED: referenceImageUrl (no image upload for Sora - character is described in prompts only)
  
  // Campaign settings
  aspectRatio: string;
  duration: number;
}

/**
 * Single character recommendation from Planning Agent (Agent 2.2a)
 * Simplified for Sora - no image generation, persona only
 */
export interface CharacterRecommendation {
  id: string;                      // Unique ID like "REC_ASPIRATIONAL_001"
  name: string;                    // Short name like "Elegant Minimalist"
  mode: 'hand-model' | 'full-body' | 'silhouette';
  
  // Character Persona (editable by user)
  detailed_persona: string;       // Complete physical specification (4-6 sentences)
  cultural_fit: string;            // How character matches target audience (2-3 sentences)
  
  // Interaction Protocol (how character engages with product)
  interaction_protocol: {
    product_engagement: string;    // Technical rules for product interaction (2-4 sentences)
    motion_limitations: string;    // AI-safe movement constraints (2-4 sentences)
  };
  
  // Removed fields (not needed for Sora):
  // - identity_id
  // - identity_locking
  // - image_generation_prompt
  // - appearance (merged into detailed_persona)
}

/**
 * Output from Character Planning Agent
 * @deprecated Character Planning Agent has been removed. This type is kept for backward compatibility only.
 */
export interface CharacterPlanningOutput {
  recommendations: CharacterRecommendation[];
  reasoning: string;               // Brief explanation of choices
  cost?: number;
}

/**
 * Removed: Agent 2.3 (Brand Identity Guardian) - not needed for Sora
 * Logo section removed entirely from Tab 2
 */

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
 * Output from Agent 3.2: Visual Beats Architect
 */
export interface NarrativeOutput {
  visual_beats: Array<{
    beatId: 'beat1' | 'beat2' | 'beat3' | 'beat4';
    beatName: string;
    beatDescription: string;
    duration: 8;
    isConnectedToPrevious: boolean;
  }>;
  connection_strategy: 'all_connected' | 'all_distinct' | 'mixed';
  cost?: number;
}

/**
 * Output from Agent 3.3: Asset-Environment Harmonizer
 * @deprecated Agent 3.3 has been removed. This type is kept for backward compatibility only.
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
 * Step 3 Data stored in database (Generate Prompts)
 * Migrated from old step5Data
 */
export interface Step3Data {
  // Agent 5.1 output (Beat Prompts)
  beatPrompts?: BeatPromptOutput;
  
  // Agent 5.2 output (Voiceover Scripts)
  voiceoverScripts?: VoiceoverScriptOutput;
  
  // Generated beat videos
  beatVideos?: {
    [beatId: string]: {
      videoUrl: string;
      lastFrameUrl: string;
      generatedAt: Date;
    };
  };
  
  // Legacy fields (kept for backward compatibility, but no longer used)
  creativeSpark?: CreativeSparkOutput; // Moved to step2Data
  environment?: EnvironmentOutput; // No longer used
  narrative?: NarrativeOutput; // Moved to step2Data
  /** @deprecated Agent 3.3 has been removed */
  harmonizer?: HarmonizerOutput; // No longer used
  uiInputs?: {
    /** @deprecated Removed - no longer used */
    environmentConcept?: string;
    /** @deprecated Removed - no longer used */
    atmosphericDensity?: number;
    /** @deprecated Removed - no longer used */
    cinematicLighting?: string;
    visualPreset: string;
    campaignSpark: string;
    visualBeats: {
      beat1: string;
      beat2: string;
      beat3: string;
      beat4?: string;
    };
    campaignObjective: string;
    /** @deprecated Removed - no longer used */
    environmentBrandPrimaryColor?: string;
    /** @deprecated Removed - no longer used */
    environmentBrandSecondaryColor?: string;
    colorPalette?: string[];
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
  
  // Continuity logic (simplified for Sora cumulative camera consistency)
  continuity_logic: {
    is_connected_to_previous: boolean;
  };
  
  composition_safe_zones: string;
  lighting_event: string;
  
  // Duration (moved from Agent 4.2)
  rendered_duration: number; // Duration in seconds (e.g., 0.5, 1.2, 2.0)
  
  // Beat assignment (for beat-based chunking)
  beatId: 'beat1' | 'beat2' | 'beat3' | 'beat4'; // Which beat this shot belongs to
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
 * @deprecated Agent 4.1 and Tab 4 have been removed. This type is kept for backward compatibility only.
 */
export interface MediaPlannerOutput {
  scenes: SceneDefinition[];
  cost?: number;
}

/**
 * Removed: ShotTiming and TimingOutput interfaces
 * Timing is now part of ShotDefinition (rendered_duration)
 * Duration calculation was moved from Agent 4.2 to Agent 4.1
 */

/**
 * Removed: VfxSeeds interface - not needed for Sora integration
 */

/**
 * Step 4 Data stored in database
 */
/**
 * @deprecated Tab 4 has been removed. This type is kept for backward compatibility only.
 */
export interface Step4Data {
  // Agent 4.1 output (now includes timing in shots: rendered_duration)
  /** @deprecated Agent 4.1 has been removed */
  mediaPlanner?: MediaPlannerOutput;
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
 * Batch input for Agent 5.1: Generate prompts for ALL beats in one request
 * Simplified: No Agent 1.1, 2.1, 3.1, 4.1 dependencies - uses raw user inputs and vision analysis
 */
export interface BatchBeatPromptInput {
  // Product Image (for vision analysis - single hero image)
  productImageUrl: string;
  
  // Visual Beats (from Agent 3.2)
  beats: Array<{
    beatId: 'beat1' | 'beat2' | 'beat3' | 'beat4';
    beatName: string;
    beatDescription: string;
    duration: 8;
    isConnectedToPrevious: boolean;
  }>;
  
  connection_strategy: 'all_connected' | 'all_standalone' | 'mixed';
  
  // Raw User Inputs (from step1Data - replaces Agent 1.1 outputs)
  productTitle: string;
  productDescription?: string;
  targetAudience: string;
  region?: string;
  aspectRatio: AspectRatio;
  productionLevel?: 'raw' | 'casual' | 'balanced' | 'cinematic' | 'ultra';
  visualIntensity?: number; // 0-100
  pacingOverride?: number; // 0-100
  customMotionInstructions?: string;
  
  // Visual Style (from step2Data - replaces Agent 3.1 outputs)
  visualPreset: string; // photorealistic, cinematic, editorial, anime
  
  // Creative Spark (from step2Data - Agent 3.0 output)
  creativeSpark?: string;
  
  // Campaign Objective (from step2Data.uiInputs)
  campaign_objective?: 'brand-awareness' | 'feature-showcase' | 'sales-cta';
  
  // Audio Settings (from step1Data)
  audioSettings: {
    soundEffects?: {
      enabled: boolean;
      preset?: string;
      customInstructions?: string;
    };
    music?: {
      enabled: boolean;
      preset?: string;
      mood?: string;
      customInstructions?: string;
    };
  };
  
  // Technical Settings
  videoModel?: string;
  videoResolution?: string;
  custom_image_instructions?: string;
  global_motion_dna?: string;
}

/**
 * Output from Agent 5.1: Beat Prompts for Sora
 */
export interface BeatPromptOutput {
  beat_prompts: Array<{
    beatId: 'beat1' | 'beat2' | 'beat3' | 'beat4';
    beatName: string;
    isConnectedToPrevious: boolean;
    sora_prompt: {
      text: string; // Complete comprehensive Sora prompt following approved structure
    };
    input_image_type: 'hero' | 'previous_frame';
    shots_in_beat: string[]; // Array of shot_ids included in this beat
    total_duration: 8;
    audio_guidance?: {
      // Note: voiceover removed, handled by Agent 5.2 separately
      sound_effects?: {
        enabled: boolean;
        preset: string;
        timing_sync?: Array<{timestamp: number; description: string}>;
      };
      music?: {
        enabled: boolean;
        preset: string;
        mood?: string;
        energy_level: string;
      };
    };
  }>;
  cost?: number;
}

/**
 * Input for Agent 5.2: Voiceover Script Architect
 */
export interface VoiceoverScriptInput {
  // Beat Information (from Agent 3.2/4.1)
  beats: Array<{
    beatId: 'beat1' | 'beat2' | 'beat3' | 'beat4';
    beatName: string;
    beatDescription: string; // Visual beat description
    narrativeRole: 'hook' | 'transformation' | 'payoff';
    emotionalTone: string; // e.g., "confident", "energetic", "satisfying"
    duration: 8;
  }>;
  
  // Voiceover Settings (from Tab 1)
  voiceoverSettings: {
    enabled: boolean;
    language: 'ar' | 'en';
    tempo: 'auto' | 'slow' | 'normal' | 'fast' | 'ultra-fast';
    volume: 'low' | 'medium' | 'high';
    customInstructions?: string;
    existingDialogue?: Array<{
      id: string;
      line: string;
      timestamp?: number; // Optional - user may not have timed it
      beatId?: string; // Which beat this belongs to
    }>;
  };
  
  // Strategic Context (from user inputs - replaces Agent 1.1)
  strategicContext: {
    targetAudience: string; // e.g., "MENA Gen Z", "Luxury consumers"
    campaignObjective: 'brand-awareness' | 'feature-showcase' | 'sales-cta';
    region?: string;
  };
  
  // Product Info (from user inputs - replaces Agent 2.1)
  productInfo: {
    productName: string;
    productDescription?: string;
  };
  
  // Narrative Context (from Agent 3.0/3.2)
  narrativeContext: {
    creativeSpark: string;
    visualBeats: {
      beat1: string;
      beat2: string;
      beat3: string;
      beat4?: string;
    };
  };
  
  // Character Info (if applicable, from Agent 2.2a)
  character?: {
    persona?: string;
    culturalFit?: string;
  };
}

/**
 * Output from Agent 5.2: Voiceover Script Architect
 */
export interface VoiceoverScriptOutput {
  beat_scripts: Array<{
    beatId: 'beat1' | 'beat2' | 'beat3' | 'beat4';
    voiceoverScript: {
      enabled: boolean;
      language: 'ar' | 'en';
      tempo: string;
      volume: string;
      dialogue: Array<{
        timestamp: number; // Start time (0.0-8.0)
        duration: number; // Duration of this line (calculated)
        line: string;
        wordCount: number;
        emotionalTone: string;
        pacing: 'slow' | 'normal' | 'fast';
      }>;
      totalDuration: number; // Sum of all dialogue + pauses
      totalWordCount: number;
      scriptSummary: string; // Brief description of script approach
    };
  }>;
  
  // Full script (only when generated, not when user provided)
  fullScript?: {
    text: string; // The complete continuous script
    totalDuration: number; // Total seconds across all beats
    totalWordCount: number;
  };
}

/**
 * Step 5 Data stored in database (LEGACY - kept for backward compatibility)
 * @deprecated New data is stored in step3Data. This interface is kept for migration purposes.
 */
export interface Step5Data {
  // All beat prompts from Agent 5.1 (new batch format)
  beatPrompts?: BeatPromptOutput;
  
  // Voiceover scripts from Agent 5.2
  voiceoverScripts?: VoiceoverScriptOutput;
  
  // Generated beat videos
  beatVideos?: {
    [beatId: string]: {
      videoUrl: string;
      lastFrameUrl: string;
      generatedAt: Date;
    };
  };
  
  // Legacy: All shot prompts from Agent 5.1 (for backward compatibility)
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


