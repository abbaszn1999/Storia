/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHARACTER VLOG MODE TYPES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Type definitions for character vlog mode.
 * Will be expanded as the mode is developed.
 */

// Reference mode types (short codes used in frontend)
export type ReferenceModeCode = '1F' | '2F' | 'AI';

// Reference mode display names (stored in database)
export type ReferenceMode = 'Image Reference' | 'Start/End' | 'AI Auto';

// Narration style
export type NarrationStyle = 'first-person' | 'third-person';

// Helper function to convert short code to display name
export function convertReferenceModeCode(code: ReferenceModeCode): ReferenceMode {
  const mapping: Record<ReferenceModeCode, ReferenceMode> = {
    '1F': 'Image Reference',
    '2F': 'Start/End',
    'AI': 'AI Auto',
  };
  return mapping[code];
}

// Helper function to convert display name back to code (for backwards compatibility)
export function convertReferenceModeToCode(mode: ReferenceMode | ReferenceModeCode | string): ReferenceModeCode {
  if (mode === '1F' || mode === '2F' || mode === 'AI') {
    return mode;
  }
  // Handle old format for backwards compatibility
  const mapping: Record<string, ReferenceModeCode> = {
    'Image Reference': '1F',
    'Start/End': '2F',
    'AI Auto': 'AI',
    // Old format support
    '1 frame': '1F',
    '2 Frames': '2F',
  };
  return mapping[mode] || '1F'; // Default fallback
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCRIPT GENERATOR - AI INPUT/OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for script generation (AI agent)
 * Fields that will be sent to the AI for script generation
 */
export interface ScriptGeneratorInput {
  userPrompt: string;              // User's story concept or idea
  characterPersonality: string;    // energetic, calm, humorous, serious, mysterious, inspirational, friendly, adventurous
  narrationStyle: NarrationStyle;  // "first-person" | "third-person"
  theme: string;                   // urban, nature, home, studio, fantasy, tech, retro, anime
  duration: number;                // Target duration in seconds: 30, 60, 180, 300, 600, 1200
  genres: string[];                // Array of content genres (max 3)
  tones: string[];                 // Array of emotional tones (max 3)
  language: string;                 // Script language
}

export interface ScriptGeneratorOutput {
  script: string;
  cost?: number;
}

// Step 1: Script data - All settings from the Script phase
export interface Step1Data {
  // Reference mode (from onboarding)
  referenceMode?: ReferenceMode; // Stored as display name: "Image Reference", "Start/End", "AI Auto"
  
  // Script generation settings
  // Note: scriptModel is not saved - we always use GPT-5 in the agent
  narrationStyle?: NarrationStyle;
  theme?: string;
  numberOfScenes?: number | 'auto';
  shotsPerScene?: number | 'auto';
  characterPersonality?: string;
  videoModel?: string;
  imageModel?: string;
  aspectRatio?: string;
  duration?: string;
  genres?: string[];
  tones?: string[];
  language?: string;
  voiceActorId?: string | null;
  voiceOverEnabled?: boolean;
  
  // Script content
  userPrompt?: string;  // User's original idea/prompt
  script?: string;      // AI-generated script
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHARACTER ANALYZER - AI INPUT/OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for character analysis (AI agent)
 * Fields that will be sent to the AI for character extraction
 */
export interface CharacterAnalyzerInput {
  script: string;                    // Full story script
  narrationStyle: NarrationStyle;      // "first-person" | "third-person"
  characterPersonality: string;       // Primary character personality trait
  theme: string;                      // Visual environment theme
  style: string;                       // Preset style name or "custom_image"
  worldDescription: string;            // Custom world/atmosphere description
}

/**
 * Output from character analyzer
 */
export interface CharacterAnalyzerOutput {
  primaryCharacter: {
    name: string;
    summaryDescription: string;      // 20-30 words - for recommendation modal
    summaryAppearance: string;        // 30-50 words - for recommendation modal
    description: string;              // 50-100 words - for cast card Role field
    appearance: string;                // 100-150 words - for cast card Appearance field
    personality: string;              // 20-40 words - for cast card Personality field
    age: number | null;               // Inferred from script context
    mentionCount: number | "implicit";
  };
  secondaryCharacters: Array<{
    name: string;
    summaryDescription: string;        // 15-25 words - for recommendation modal
    summaryAppearance: string;         // 20-40 words - for recommendation modal
    description: string;               // 30-50 words - for cast card Role field (NO personality)
    appearance: string;                // 50-80 words - for cast card Appearance field (NO personality)
    age: number | null;                // Inferred from script context
    mentionCount: number;
  }>;
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOCATION ANALYZER - AI INPUT/OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for location analysis (AI agent)
 * Fields that will be sent to the AI for location extraction
 */
export interface LocationAnalyzerInput {
  script: string;                    // Full story script
  theme: string;                     // Visual environment theme
  genres: string[];                  // Array of content genres (up to 3)
  worldDescription: string;          // Custom world/atmosphere description
  duration: number;                  // Target duration in seconds
  maxResults?: number;               // Maximum number of locations (default: 5)
}

/**
 * Output from location analyzer
 */
export interface LocationAnalyzerOutput {
  locations: Array<{
    name: string;                    // Location name
    description: string;             // 30-50 word brief description
    details: string;                 // 50-100 word detailed visual description
  }>;
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2: ELEMENTS DATA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Step 2: Elements data - World settings and style configuration
 */
export interface Step2Data {
  artStyle?: string;                  // Selected art style preset name or "custom_image"
  imageModel?: string;                 // Selected image model (e.g., "Flux", "Midjourney", "nano-banana")
  worldDescription?: string;           // Custom world/atmosphere description
  styleReferenceImageUrl?: string;     // URL to uploaded style reference image (when artStyle is "custom_image")
  characters?: Array<{                  // Full character objects with all fields (like narrative mode)
    id: string;
    workspaceId: string;
    name: string;
    description?: string | null;
    personality?: string | null;
    appearance?: string | null;
    imageUrl?: string | null;
    referenceImages?: any;
    voiceSettings?: any;
    createdAt: Date | string;
    section?: 'primary' | 'secondary';  // Character-vlog specific: which section the character belongs to
  }>;
  locations?: Array<{                  // Full location objects with all fields (like narrative mode)
    id: string;
    workspaceId: string;
    name: string;
    description?: string | null;
    details?: string | null;
    imageUrl?: string | null;
    referenceImages?: any;
    createdAt: Date | string;
  }>;
  // Legacy fields (kept for backwards compatibility, but characters/locations arrays are preferred)
  characterIds?: string[];            // IDs of characters associated with this video
  locationIds?: string[];              // IDs of locations associated with this video
  characterImages?: Array<{            // Generated character images saved to Bunny CDN
    characterId: string;
    imageUrl: string;
    name: string;
  }>;
  locationImages?: Array<{             // Generated location images saved to Bunny CDN
    locationId: string;
    imageUrl: string;
    name: string;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE GENERATOR - AI INPUT/OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for scene generation (AI agent)
 * Fields that will be sent to the AI for scene breakdown
 */
export interface SceneGeneratorInput {
  script: string;                    // Full story script
  theme: string;                     // Visual environment theme
  duration: number;                  // Target duration in seconds
  worldDescription: string;           // Custom world/atmosphere description
  numberOfScenes: number | 'auto';  // Number of scenes or 'auto'
  shotsPerScene: number | 'auto';   // Shots per scene (informational for planning)
  primaryCharacter: {                // Primary character
    name: string;
    personality: string;
  };
  secondaryCharacters: Array<{       // Secondary characters (up to 4)
    name: string;
    description: string;
  }>;
  locations: Array<{                 // Available locations
    name: string;
    description: string;
  }>;
}

/**
 * Output from scene generator
 */
export interface SceneGeneratorOutput {
  scenes: Array<{
    name: string;                    // Format: "Scene {number}: {Title}"
    description: string;             // 2-3 sentence scene summary (30-80 words)
    duration: number;                // Estimated duration in seconds
  }>;
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHOT GENERATOR - AI INPUT/OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for shot generation (AI agent)
 * Fields that will be sent to the AI for shot breakdown
 */
export interface ShotGeneratorInput {
  sceneName: string;                  // Scene name from Agent 3.1 (e.g., "Scene 1: The Morning Rush")
  sceneDescription: string;           // Scene description from Agent 3.1
  sceneDuration: number;              // Scene duration in seconds (PRIMARY constraint)
  script: string;                     // Full story script
  characters: Array<{                 // Available characters (primary + secondary)
    name: string;
    description: string;
    personality?: string;              // Only for primary character
  }>;
  locations: Array<{                 // Available locations
    name: string;
    description: string;
    details?: string;
  }>;
  theme: string;                      // Visual environment theme
  worldDescription: string;            // Custom world/atmosphere description
  referenceMode: ReferenceModeCode;  // '1F' | '2F' | 'AI' (CRITICAL for frame type assignment)
  videoModel: string;                 // Video model (e.g., "seedance-1.0-pro")
  videoModelDurations: number[];      // Available durations for the video model
  targetDuration: number;              // Target video duration in seconds (context)
  shotsPerScene: number | 'auto';     // Shots per scene (number or 'auto')
}

/**
 * Continuity group structure (matches client-side ContinuityGroup)
 */
export interface ContinuityGroup {
  id: string;
  sceneId: string;
  groupNumber: number;
  shotIds: string[];
  description?: string | null;
  transitionType?: string | null;
  status: string;
  editedBy?: string | null;
  editedAt?: Date | null;
  approvedAt?: Date | null;
  createdAt: Date;
}

/**
 * Output from shot generator
 */
export interface ShotGeneratorOutput {
  shots: Array<{
    name: string;                     // Format: "Shot {sceneNumber}.{shotNumber}: {Title}"
    description: string;              // Detailed visual description (50-300 words)
    shotType: '1F' | '2F';            // Frame type: "1F" (single image) or "2F" (start/end frames)
    cameraShot: string;                // Camera angle from 10 preset options
    referenceTags: string[];           // Character and location tags (e.g., ["@PrimaryCharacter", "@Location1"])
    duration: number;                  // Duration from videoModelDurations array
    isLinkedToPrevious?: boolean;      // Deprecated - kept for backward compatibility during migration
    isFirstInGroup?: boolean;          // Deprecated - kept for backward compatibility during migration
  }>;
  continuityGroups?: Array<{
    shotIndices: number[]; // 0-based indices to map to shot IDs in routes
    description: string;
    transitionType: string;
  }>;
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3: SCENES DATA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Scene structure (aligned with ambient-visual pattern)
 * Supports both 'name' (frontend) and 'title' (ambient-visual compatible)
 */
export interface VlogScene {
  id: string;
  videoId?: string;  // Optional for character-vlog
  sceneNumber?: number;  // Optional - can be derived from name
  title?: string;  // Aligned with ambient-visual
  name?: string;  // Frontend compatibility (maps to title)
  description?: string | null;
  duration?: number | null;
  actType?: 'hook' | 'intro' | 'main' | 'outro' | 'custom';
  createdAt?: Date | string;
}

/**
 * Shot structure (aligned with ambient-visual pattern)
 * Supports both 'cameraShot' (frontend) and 'cameraMovement' (ambient-visual compatible)
 */
export interface VlogShot {
  id: string;
  sceneId: string;
  shotNumber?: number;  // Optional - can be derived from name
  shotType: string;  // 'image-ref' | 'start-end' (maps to ambient's shotType)
  cameraMovement?: string;  // Aligned with ambient-visual
  cameraShot?: string;  // Frontend compatibility (maps to cameraMovement)
  duration: number;
  description?: string | null;
  isLinkedToPrevious?: boolean; // Deprecated - kept for backward compatibility during migration
  referenceTags?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Step 3: Scenes data - Scene breakdown from script
 * Aligned with ambient-visual Step3Data structure
 */
export interface Step3Data {
  scenes: VlogScene[];
  shots: Record<string, VlogShot[]>;  // Keyed by sceneId, array of shots
  continuityLocked: boolean;
  continuityGroups: Record<string, any[]>;  // Keyed by sceneId, array of continuity groups
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED PROMPT PRODUCER - AI INPUT/OUTPUT (BATCH PROCESSING)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for unified prompt producer (batch processing - all shots in scene at once)
 */
export interface UnifiedPromptProducerSceneInput {
  sceneId: string;
  sceneName: string;
  shots: Array<{
    shotId: string;
    shotDescription: string;
    frameType: '1F' | '2F';
    cameraShot: string;
    shotDuration: number;
    referenceTags: string[];
    isFirstInGroup: boolean;
    isLinkedToPrevious: boolean;
    // NEW: Explicit inheritance info (what will be inherited, not generated)
    inheritedPrompts?: {
      imagePrompt?: string;      // For 1F: inherit single image prompt from previous
      startFramePrompt?: string; // For 2F: inherit start from previous end
    };
    // Legacy: kept for backward compatibility (regeneration scenarios)
    previousShotOutput?: {
      lastFrameDescription: string;
      visualContinuityNotes: string;
      imagePrompts: {
        end?: string;
      };
    };
  }>;
  // Character references with anchors for consistency
  characterReferences: Array<{
    name: string;              // Character name with @ tag (e.g., "@Alex Chen")
    anchor: string;            // SHORT stable identity descriptor (30-50 words)
    imageUrl: string;          // Reference image URL
    appearance?: string;       // Optional: full appearance description
    personality?: string;      // Optional: personality traits
  }>;
  // Location references with anchors for consistency
  locationReferences: Array<{
    name: string;              // Location name with @ tag (e.g., "@Modern Studio")
    anchor: string;            // SHORT stable location descriptor (20-40 words)
    imageUrl: string;          // Reference image URL
    description?: string;      // Optional: full description
  }>;
  // Style reference for visual consistency
  styleReference: {
    anchor: string;            // Reusable style descriptor from worldSettings
    negativeStyle?: string;    // Optional: things to avoid
    artStyle: string;          // Art style preset name
    artStyleImageUrl?: string; // Optional: custom style reference image
  };
  aspectRatio: string;
  
  // Legacy fields (kept for backwards compatibility)
  characters?: Array<{
    id: string;
    name: string;
    imageUrl: string;
  }>;
  locations?: Array<{
    id: string;
    name: string;
    imageUrl: string;
  }>;
  worldSettings?: {
    artStyle: string;
    artStyleImageUrl?: string;
    worldDescription: string;
  };
}

/**
 * Output from unified prompt producer (batch processing)
 */
export interface UnifiedPromptProducerSceneOutput {
  shots: Array<{
    shotId: string;
    imagePrompts: {
      single: string | null;
      start: string | null;
      end: string | null;
    };
    videoPrompt: string;
    visualContinuityNotes: string | null;
    negativePrompt: string;  // Things to avoid in generation
  }>;
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4: STORYBOARD DATA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Shot version structure - tracks generated images and videos for each shot
 * Aligned with ambient-visual pattern for consistency
 */
export interface ShotVersion {
  id: string;
  shotId: string;
  versionNumber: number;
  
  // Image URLs (from Agent 4.2)
  imageUrl: string | null;          // For 1F mode
  startFrameUrl: string | null;     // For 2F mode
  endFrameUrl: string | null;       // For 2F mode
  
  // Video URL (from Agent 4.3)
  videoUrl?: string | null;
  thumbnailUrl?: string | null;     // Video thumbnail
  actualDuration?: number;          // Final video duration (may differ from requested)
  
  // Prompts (from Agent 4.1)
  imagePrompt: string | null;
  startFramePrompt: string | null;
  endFramePrompt: string | null;
  videoPrompt: string | null;
  negativePrompt: string | null;
  
  // Metadata
  status: 'pending' | 'generated' | 'failed';
  needsRerender: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Video generation metadata
  videoGenerationMetadata?: {
    model: string;
    generationTime: number;
    resolution: string;
    error?: string;
  };
}

/**
 * Step 4: Storyboard data - Generated prompts and versions for shots
 */
export interface Step4Data {
  shots: Record<string, {
    imagePrompts: {
      single: string | null;
      start: string | null;
      end: string | null;
    };
    videoPrompt: string;
    visualContinuityNotes: string | null;
    negativePrompt: string;  // Things to avoid in generation
    isInherited?: boolean;    // For shared frame optimization
  }>;  // Keyed by shotId
  
  // Shot versions - tracks generated images and videos
  shotVersions?: Record<string, ShotVersion[]>;  // Keyed by shotId, array of versions
  
  // Legacy fields for backward compatibility
  scenes?: any[];
}

// Placeholder for future step data types
// export interface Step5Data { ... }
// export interface Step6Data { ... }

