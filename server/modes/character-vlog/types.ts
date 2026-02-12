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
  voiceOverEnabled?: boolean;
  
  // Sound settings
  backgroundMusicEnabled?: boolean;
  voiceoverLanguage?: 'en' | 'ar';
  textOverlayEnabled?: boolean;
  
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
 * Enhanced with entity tracking and script grounding
 */
export interface SceneGeneratorOutput {
  scenes: Array<{
    id: number;                      // Numeric scene index starting from 1
    name: string;                    // Format: "Scene {number}: {Title}"
    description: string;             // 2-3 sentence scene summary (30-80 words)
    duration: number;                // Estimated duration in seconds
    charactersFromList: string[];    // Character names from input primaryCharacter/secondaryCharacters
    otherCharacters: string[];       // Character labels not in input lists (e.g., "Barista", "Old man")
    locations: string[];             // Location names from input locations list
    characterMentionsRaw: string[];  // Exact phrases from scriptExcerpt referring to characters
    locationMentionsRaw: string[];   // Exact phrases from scriptExcerpt referring to places
    mood: string[];                  // 2-4 short adjectives describing emotional/visual tone
    scriptExcerpt: string;           // Exact portion of original script for this scene
  }>;
  totalEstimatedDuration: number;    // Sum of all scene durations
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHOT GENERATOR - AI INPUT/OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for shot generation (AI agent)
 * Fields that will be sent to the AI for shot breakdown
 * Enhanced with scene entity data from Scene Generator
 */
export interface ShotGeneratorInput {
  sceneName: string;                  // Scene name from Agent 3.1 (e.g., "Scene 1: The Morning Rush")
  sceneDescription: string;           // Scene description from Agent 3.1
  sceneDuration: number;              // Scene duration in seconds (PRIMARY constraint)
  script: string;                     // Full story script (for overall context)
  characters: Array<{                 // Available characters (primary + secondary)
    name: string;
    description: string;
    personality?: string;              // Only for primary character
  }>;
  locations: Array<{                 // Available locations from Elements step
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
  
  // Scene entity data from Agent 3.1 (Scene Generator) - for grounding
  sceneId?: number;                   // Scene index (1-based)
  scriptExcerpt?: string;             // Exact portion of script for this scene (PRIMARY focus)
  mood?: string[];                    // Scene mood adjectives
  charactersFromList?: string[];      // Characters from input lists that appear in this scene
  otherCharacters?: string[];         // Other characters in scene not from input lists
  sceneLocations?: string[];          // Locations from input list that appear in this scene
  locationMentionsRaw?: string[];     // Raw location mentions from script
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
 * With dual tagging: indexed tags in referenceTags, canonical names in description
 */
export interface ShotGeneratorOutput {
  shots: Array<{
    name: string;                     // Format: "Shot {sceneNumber}.{shotNumber}: {Title}"
    description: string;              // Detailed visual description with @CanonicalName anchors
    shotType: '1F' | '2F';            // Frame type: "1F" (single image) or "2F" (start/end frames)
    cameraShot: string;               // Camera angle from 10 preset options
    referenceTags: string[];          // Indexed tags (e.g., ["@PrimaryCharacter", "@Location1"])
    duration: number;                 // Duration from videoModelDurations array
    isLinkedToPrevious: boolean;      // Whether this shot links to the previous shot for continuity
    isFirstInGroup: boolean;          // Whether this shot is the first in a continuity group
  }>;
  continuityGroups?: Array<{
    shotIndices: number[];            // 0-based indices to map to shot IDs in routes
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
  negativePrompt?: string | null;  // Deprecated - no longer generated
  
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
    negativePrompt?: string;  // Deprecated - no longer generated
    isInherited?: boolean;    // For shared frame optimization
  }>;  // Keyed by shotId
  
  // Shot versions - tracks generated images and videos
  shotVersions?: Record<string, ShotVersion[]>;  // Keyed by shotId, array of versions
  
  // Legacy fields for backward compatibility
  scenes?: any[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5: SOUND/ANIMATIC DATA
// ═══════════════════════════════════════════════════════════════════════════════

// Language options for voiceover
export type VoiceoverLanguage = 'en' | 'ar';

// Background music style options (matches ambient mode)
export type MusicStyle = 'cinematic' | 'upbeat' | 'calm' | 'corporate' | 'electronic' | 'emotional' | 'inspiring';

// Voiceover status tracking
export type VoiceoverStatus = 'pending' | 'script_generated' | 'audio_generated';

/**
 * Sound effect data stored per-shot
 */
export interface ShotSoundEffect {
  prompt?: string;              // Sound effect description/prompt
  audioUrl?: string;            // CDN URL of generated sound effect audio
  duration?: number;            // Audio duration in seconds
  isGenerating?: boolean;       // Currently generating
}

/**
 * Step 5: Sound/Animatic data - Voiceover, sound effects, and background music
 */
export interface Step5Data {
  // Voiceover data (from Agent 5.1 and 5.2)
  voiceoverScript?: string;       // Generated/edited narration script
  voiceoverAudioUrl?: string;     // CDN URL of generated audio
  voiceoverDuration?: number;     // Audio duration in seconds
  voiceoverStatus?: VoiceoverStatus;
  voiceId?: string;               // Selected ElevenLabs voice ID
  
  // Sound Effects data (from Agent 5.3 and 5.4b) - stored per shot
  soundEffects?: Record<string, ShotSoundEffect>;  // Keyed by shotId
  
  // Background Music data (from Agent 5.4)
  generatedMusicUrl?: string;     // CDN URL of AI-generated music
  generatedMusicDuration?: number; // Music duration in seconds
  generatedMusicStyle?: MusicStyle; // Style used for generation
}

// ═══════════════════════════════════════════════════════════════════════════════
// VOICEOVER SCRIPT GENERATOR - AI INPUT/OUTPUT (Agent 5.1)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for voiceover script generation (Agent 5.1)
 * Uses the existing script from Step 1 and shot durations to create timed narration
 */
export interface VoiceoverScriptGeneratorInput {
  // Language setting
  language: VoiceoverLanguage;    // 'en' | 'ar'
  
  // Script from Step 1
  script: string;                 // User's story script
  
  // Duration context (calculated from shots, no loops)
  totalDuration: number;          // Total video duration in seconds
  
  // Scene and shot context (for timing alignment)
  scenes: Array<{
    id: string;
    sceneNumber: number;
    title: string;
    description?: string | null;
    duration?: number | null;
  }>;
  shots: Record<string, Array<{
    id: string;
    shotNumber: number;
    duration: number;
    description?: string | null;
  }>>;
  
  // Character context
  characterPersonality?: string;
  narrationStyle?: 'first-person' | 'third-person';
}

export interface VoiceoverScriptGeneratorOutput {
  script: string;                  // Generated narration text with timing
  estimatedDuration: number;       // Estimated speaking time in seconds
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VOICEOVER AUDIO GENERATOR - AI INPUT/OUTPUT (Agent 5.2)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for voiceover audio generation (Agent 5.2)
 * Converts approved text to audio using ElevenLabs TTS
 */
export interface VoiceoverAudioGeneratorInput {
  // Script to convert
  script: string;                  // Approved voiceover text
  
  // Voice settings
  voiceId: string;                 // Selected ElevenLabs voice ID
  language: VoiceoverLanguage;     // For model selection
  
  // Video context (for CDN path)
  videoId: string;
  videoTitle: string;
  videoCreatedAt?: Date | string;  // Video creation date for path
  
  // User context (for CDN path)
  userId: string;
  workspaceId: string;
  workspaceName: string;
}

export interface VoiceoverAudioGeneratorOutput {
  audioUrl: string;                // CDN URL of generated audio
  duration: number;                // Actual audio duration in seconds
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BACKGROUND MUSIC GENERATOR - AI INPUT/OUTPUT (Agent 5.4)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for background music generation (Agent 5.4)
 * Generates AI background music using ElevenLabs Music API
 */
export interface BackgroundMusicGeneratorInput {
  // Music style (from Step 1)
  musicStyle: MusicStyle;
  
  // Atmosphere context (from Step 1)
  theme?: string;
  characterPersonality?: string;
  genres?: string[];
  tones?: string[];
  
  // Duration (calculated from scenes/shots, no loops)
  totalDuration: number;           // Total video duration in seconds
  
  // Scene context (for musical narrative)
  scenes?: Array<{
    sceneNumber: number;
    title: string;
    description?: string | null;
  }>;
  
  // Video context (for CDN path)
  videoId: string;
  videoTitle: string;
  videoCreatedAt?: Date | string;  // Video creation date for path
  
  // User context (for CDN path)
  userId: string;
  workspaceId: string;
  workspaceName: string;
}

export interface BackgroundMusicGeneratorOutput {
  musicUrl: string;                // CDN URL of generated music
  duration: number;                // Actual music duration in seconds
  style: MusicStyle;               // Style used for generation
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND EFFECT PROMPT GENERATOR - AI INPUT/OUTPUT (Agent 5.3)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for sound effect prompt generation (Agent 5.3)
 * Uses shot description and video context to recommend sound effects
 */
export interface SoundEffectPromptGeneratorInput {
  // Shot context
  shotDescription: string;         // Description of what happens in the shot
  shotType?: string;               // Camera shot type (close-up, wide, etc.)
  duration: number;                // Shot duration in seconds
  
  // Scene context
  sceneTitle?: string;
  sceneDescription?: string;
  
  // Video context
  theme?: string;                  // Overall video theme
  characterPersonality?: string;   // Character personality for appropriate SFX
}

export interface SoundEffectPromptGeneratorOutput {
  prompt: string;                  // Recommended sound effect description
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND EFFECT GENERATOR - AI INPUT/OUTPUT (Agent 5.4b)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for sound effect generation (Agent 5.4b)
 * Uses MMAudio to generate audio synchronized with video
 */
export interface SoundEffectGeneratorInput {
  // Video source (required)
  videoUrl: string;                // URL of the shot video
  
  // Sound effect description (required)
  prompt: string;                  // What sounds to generate
  
  // Generation parameters (optional)
  duration?: number;               // Audio duration in seconds (1-30)
  numSteps?: number;               // Inference steps (1-50)
  cfgStrength?: number;            // Guidance strength (1-10)
  seed?: number;                   // For reproducibility
  
  // Video context (for CDN path)
  videoId: string;
  videoTitle: string;
  videoCreatedAt?: Date | string;
  
  // Shot context
  shotId: string;
  sceneId: string;
  
  // User context (for CDN path)
  userId: string;
  workspaceId: string;
  workspaceName: string;
}

export interface SoundEffectGeneratorOutput {
  audioUrl: string;                // CDN URL of generated sound effect
  duration: number;                // Audio duration in seconds
  fileSize?: number;               // File size in bytes
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 6: PREVIEW/EXPORT DATA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Audio track stored in timeline
 */
export interface TimelineAudioTrack {
  id: string;
  src: string;
  start: number;
  duration: number;
  volume: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
  order?: number;
  shotId?: string;              // For SFX: which shot this belongs to
}

/**
 * Volume settings for audio mixing
 */
export interface VolumeSettings {
  master: number;
  sfx: number;
  voiceover: number;
  music: number;
}

/**
 * Final render state
 */
export interface FinalRenderState {
  id: string;
  status: 'pending' | 'queued' | 'rendering' | 'done' | 'failed';
  url?: string;
  thumbnailUrl?: string;
  progress?: number;
  error?: string;
  startedAt?: Date | string;
  completedAt?: Date | string;
}

/**
 * Step 6: Preview/Export data - Timeline configuration and render state
 */
export interface Step6Data {
  // Timeline structure for Shotstack rendering
  timeline?: {
    scenes: VlogScene[];
    shots: Record<string, VlogShot[]>;
    audioTracks: {
      voiceover?: TimelineAudioTrack;
      music?: TimelineAudioTrack;
      sfx: TimelineAudioTrack[];
    };
  };
  
  // Volume settings from preview mixer
  volumes?: VolumeSettings;
  
  // Final render state
  finalRender?: FinalRenderState;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 7: EXPORT DATA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Step 7: Export data - Final render state and export URLs
 * Aligned with ambient-visual Step7Data structure for consistency
 */
export interface Step7Data {
  // Render identification
  renderId?: string;                 // Shotstack render ID
  
  // Render status tracking
  // 'uploading' prevents multiple Bunny uploads while large file upload is in progress
  renderStatus: 'pending' | 'queued' | 'fetching' | 'rendering' | 'saving' | 'uploading' | 'done' | 'failed';
  renderProgress: number;            // 0-100 percentage
  
  // Final export URLs (after Bunny CDN upload)
  exportUrl?: string;                // Final video URL on Bunny CDN
  thumbnailUrl?: string;             // Thumbnail URL on Bunny CDN
  
  // Export settings
  resolution: string;                // '720p' | '1080p' | '4k'
  format: string;                    // 'mp4'
  
  // Video metadata
  duration: number;                  // Total duration in seconds
  aspectRatio?: string;              // '16:9', '9:16', etc.
  sceneCount?: number;               // Number of scenes
  
  // Timestamps
  startedAt?: string;                // ISO timestamp when render started
  completedAt?: string;              // ISO timestamp when render completed
  
  // Error handling
  error?: string;                    // Error message if failed
}

