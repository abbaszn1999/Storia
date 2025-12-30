// Animation mode types
export type AnimationMode = 'image-transitions' | 'video-animation';
export type VideoGenerationMode = 'image-reference' | 'start-end-frame';

// Loop type for video looping
export type LoopType = 'seamless' | 'fade' | 'hard-cut';

// Text overlay style
export type TextOverlayStyle = 'modern' | 'cinematic' | 'bold';

// Language options
export type Language = 'ar' | 'en';

// Step 1: Atmosphere data - All settings from the Atmosphere phase
export interface Step1Data {
  // Animation Mode (from onboarding)
  animationMode: AnimationMode;
  videoGenerationMode?: VideoGenerationMode;
  
  // Image Settings
  imageModel: string;
  imageResolution: string;
  
  // Video Settings
  aspectRatio: string;
  duration: string;
  
  // Mood & Theme
  mood: string;
  theme: string;
  timeContext: string;
  season: string;
  userStory?: string;        // User's original prompt/idea (preserved)
  moodDescription: string;   // AI-generated atmospheric description
  
  // Animation-specific settings
  defaultEasingStyle?: string;  // For image-transitions
  videoModel?: string;          // For video-animation
  videoResolution?: string;
  motionPrompt?: string;
  transitionStyle?: string;
  cameraMotion?: string;
  
  // Pacing & Flow
  pacing: number;
  segmentEnabled: boolean;
  segmentCount: 'auto' | number;
  shotsPerSegment: 'auto' | number;
  
  // Loop Settings
  loopMode: boolean;
  loopType: LoopType;
  segmentLoopEnabled: boolean;
  segmentLoopCount: 'auto' | number;
  shotLoopEnabled: boolean;
  shotLoopCount: 'auto' | number;
  
  // Voiceover
  voiceoverEnabled: boolean;
  language?: Language;
  textOverlayEnabled?: boolean;
  textOverlayStyle?: TextOverlayStyle;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOOD DESCRIPTION GENERATOR - AI INPUT/OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for mood description generation (AI agent)
 * EXACT 15 fields that will be sent to the AI
 */
export interface MoodDescriptionGeneratorInput {
  // Core atmosphere settings (6 fields)
  mood: string;              // e.g., "calm", "mysterious", "energetic"
  theme: string;             // e.g., "nature", "urban", "cosmic"
  timeContext: string;       // e.g., "dawn", "night", "bright-nebula"
  season: string;            // e.g., "spring", "rainy", "sparse"
  duration: string;          // e.g., "5min", "1hour", "2hours"
  aspectRatio: string;       // e.g., "16:9", "9:16", "1:1"
  
  // Animation context (2 fields)
  animationMode: AnimationMode;              // "image-transitions" | "video-animation"
  videoGenerationMode?: VideoGenerationMode; // "image-reference" | "start-end-frame" (optional)
  
  // Loop settings (6 fields)
  loopMode: boolean;                    // Enable seamless looping
  loopType: LoopType;
  segmentLoopEnabled: boolean;
  segmentLoopCount: 'auto' | number;
  shotLoopEnabled: boolean;
  shotLoopCount: 'auto' | number;
  
  // User's manual input (1 field)
  userPrompt?: string;       // Text from "Your Idea" textarea (if user typed something)
}

export interface MoodDescriptionGeneratorOutput {
  moodDescription: string;
  cost?: number;
}

// Step 2: Visual World data - All settings from the Visual World phase
export interface Step2Data {
  artStyle: string;
  visualElements: string[];
  visualRhythm: string;
  referenceImages: string[];
  imageCustomInstructions?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLOW DESIGN TYPES - Scene, Shot, ShotVersion, ContinuityGroup
// ═══════════════════════════════════════════════════════════════════════════════

export interface Scene {
  id: string;
  videoId: string;
  sceneNumber: number;
  title: string;
  description?: string | null;
  duration?: number | null;
  videoModel?: string | null;
  imageModel?: string | null;
  cameraMotion?: string | null;
  lighting?: string | null;
  weather?: string | null;
  createdAt: Date;
}

export interface Shot {
  id: string;
  sceneId: string;
  shotNumber: number;
  shotType: string;
  cameraMovement: string;
  duration: number;
  description?: string | null;
  videoModel?: string | null;
  imageModel?: string | null;
  soundEffects?: string | null;
  transition?: string | null;
  currentVersionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShotVersion {
  id: string;
  shotId: string;
  versionNumber: number;
  
  // Prompt fields (from Agent 4.1: Video Prompt Engineer)
  imagePrompt?: string | null;
  videoPrompt?: string | null;
  negativePrompt?: string | null;
  startFramePrompt?: string | null;
  endFramePrompt?: string | null;
  
  // Image URLs (from Agent 4.2: Video Image Generator)
  imageUrl?: string | null;
  startFrameUrl?: string | null;
  endFrameUrl?: string | null;
  startFrameInherited?: boolean;  // True if inherited from previous shot
  
  // Video URLs (from Agent 4.3: Video Clip Generator)
  videoUrl?: string | null;
  videoDuration?: number | null;
  
  // Status tracking
  status: string;  // 'pending' | 'prompt_generated' | 'images_generated' | 'completed' | 'failed'
  needsRerender: boolean;
  errorMessage?: string | null;
  
  createdAt: Date;
  updatedAt?: Date;
}

export interface ContinuityGroup {
  id: string;
  sceneId: string;
  groupNumber: number;
  shotIds: string[];
  description?: string | null;
  transitionType?: string | null;
  status: string;  // "proposed" | "approved" | "declined"
  editedBy?: string | null;
  editedAt?: Date | null;
  approvedAt?: Date | null;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE GENERATOR - AI INPUT/OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for scene generation (AI agent)
 * Combines atmosphere and visual world settings to generate segments
 */
export interface SceneGeneratorInput {
  moodDescription: string;      // From Step 1
  duration: string;             // "5min", "30min", "1hour", etc.
  theme: string;                // "nature", "urban", "cosmic", etc.
  mood: string;                 // "calm", "mysterious", "energetic", etc.
  pacing: number;               // 0-100 slider value
  segmentCount: 'auto' | number;
  shotsPerSegment: 'auto' | number;
  animationMode: AnimationMode;
  videoGenerationMode?: VideoGenerationMode;
  // From Step 2 (Visual World)
  visualRhythm?: string;        // "constant", "breathing", "building", "wave"
  artStyle?: string;            // "cinematic", "anime", "realistic", etc.
  visualElements?: string[];    // ["Mountains", "Ocean", "Forest", etc.]
}

export interface SceneGeneratorOutput {
  scenes: Scene[];
  totalDuration: number;
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHOT COMPOSER - AI INPUT/OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for shot composition within a scene
 */
export interface ShotComposerInput {
  scene: Scene;  // The current scene being processed
  shotsPerSegment: 'auto' | number;
  pacing: number;
  animationMode: AnimationMode;
  artStyle?: string;
  visualElements?: string[];
  videoModel?: string;  // Video model from step1Data
  
  // Full context for understanding the overall flow
  allScenes?: Scene[];  // All scenes in the video (for context)
  existingShots?: Record<string, Shot[]>;  // Shots already generated for previous scenes
}

export interface ShotComposerOutput {
  shots: Shot[];
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTINUITY PRODUCER - AI INPUT/OUTPUT (Start-End Frame Mode Only)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for continuity analysis and proposal
 */
export interface ContinuityProducerInput {
  scenes: Scene[];
  shots: Record<string, Shot[]>;
}

export interface ContinuityProducerOutput {
  continuityGroups: Record<string, ContinuityGroup[]>;
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3 DATA - Flow Design Phase
// ═══════════════════════════════════════════════════════════════════════════════

export interface Step3Data {
  scenes: Scene[];
  shots: Record<string, Shot[]>;
  shotVersions?: Record<string, ShotVersion[]>;
  continuityLocked: boolean;
  continuityGroups: Record<string, ContinuityGroup[]>;
  continuityGenerated?: boolean; // Track if continuity has been analyzed (one-time only)
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO PROMPT ENGINEER - AI INPUT/OUTPUT (Agent 4.1)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for video prompt engineer (Agent 4.1)
 * Generates optimized prompts for image and video generation
 * 
 * Conditional output based on animationMode:
 * - image-transitions: outputs imagePrompt only
 * - video-animation: outputs startFramePrompt, endFramePrompt, videoPrompt
 */
export interface VideoPromptEngineerInput {
  // Shot context
  shotId: string;
  shotDescription: string;
  shotType: string;
  cameraMovement: string;
  shotDuration: number;
  
  // Scene context
  sceneId: string;
  sceneTitle: string;
  sceneDescription: string;
  
  // From Step 1 (Atmosphere)
  moodDescription: string;
  mood: string;
  theme: string;
  timeContext: string;
  season: string;
  aspectRatio: string;
  
  // From Step 2 (Visual World)
  artStyle: string;
  visualElements: string[];
  visualRhythm: string;
  referenceImageUrls?: string[];
  imageCustomInstructions?: string;
  
  // Animation mode determines output format
  animationMode: AnimationMode;  // 'image-transitions' | 'video-animation'
  videoGenerationMode?: VideoGenerationMode;  // Only used for video-animation
  motionPrompt?: string;
  cameraMotion?: string;
  
  // For connected shots (Start-End Frame mode in video-animation)
  isFirstInGroup?: boolean;
  isConnectedShot?: boolean;
  previousShotEndFramePrompt?: string;  // End frame prompt from previous shot (for inheritance)
}

/**
 * Output from video prompt engineer (Agent 4.1)
 * Returns optimized prompts for downstream agents
 * 
 * Conditional fields based on animationMode:
 * - image-transitions: imagePrompt only
 * - video-animation: startFramePrompt, endFramePrompt, videoPrompt only
 */
export interface VideoPromptEngineerOutput {
  // For Image Transitions mode only
  imagePrompt?: string;        // Main image generation prompt (image-transitions only)
  
  // For Video Animation mode only (both image-reference and start-end-frame)
  startFramePrompt?: string;   // Specific prompt for start frame
  endFramePrompt?: string;     // Specific prompt for end frame
  videoPrompt?: string;        // Motion/animation instructions
  
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO IMAGE GENERATOR - AI INPUT/OUTPUT (Agent 4.2)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for video image generator (Agent 4.2)
 * Generates keyframe images using Runware API
 * 
 * Conditional behavior based on animationMode and continuity:
 * - image-transitions: Generate single image from imagePrompt
 * - video-animation (standalone/first): Generate START frame, then END frame using START as reference
 * - video-animation (continuity subsequent): Inherit START from previous END, generate END only
 */
export interface VideoImageGeneratorInput {
  // Shot identification
  shotId: string;
  shotNumber: number;
  sceneId: string;
  
  // Prompts from Agent 4.1
  imagePrompt?: string;          // For image-transitions mode
  startFramePrompt?: string;     // For video-animation mode
  endFramePrompt?: string;       // For video-animation mode
  
  // Animation mode (determines generation logic)
  animationMode: AnimationMode;
  videoGenerationMode?: VideoGenerationMode;
  
  // Image generation settings (from Step 1 Atmosphere)
  imageModel: string;            // e.g., "flux-2-dev", "midjourney-v7"
  aspectRatio: string;           // e.g., "16:9", "9:16", "1:1"
  imageResolution: string;       // e.g., "1k", "2k", "4k"
  
  // Continuity context
  isFirstInGroup?: boolean;      // True if first shot in continuity group
  isConnectedShot?: boolean;     // True if part of a continuity group
  previousShotEndFrameUrl?: string;  // URL of previous shot's end frame (for inheritance)
  inheritStartFrame?: boolean;   // True if should inherit start from previous shot's end
}

/**
 * Output from video image generator (Agent 4.2)
 * Returns generated image URLs to be stored in ShotVersion
 */
export interface VideoImageGeneratorOutput {
  shotId: string;
  
  // For image-transitions mode
  imageUrl?: string;             // Single generated image
  
  // For video-animation mode
  startFrameUrl?: string;        // Generated or inherited start frame
  endFrameUrl?: string;          // Generated end frame
  startFrameInherited?: boolean; // True if start was inherited from previous shot
  
  // Generation metadata
  width?: number;
  height?: number;
  seed?: number;
  cost?: number;
  error?: string;                // Error message if generation failed
}

/**
 * Batch input for generating all images for a video
 */
export interface VideoImageGeneratorBatchInput {
  videoId: string;
  
  // Settings from Step 1 (Atmosphere)
  imageModel: string;
  aspectRatio: string;
  imageResolution: string;
  animationMode: AnimationMode;
  videoGenerationMode?: VideoGenerationMode;
  
  // Shots to process (in order for continuity)
  shots: Array<{
    shotId: string;
    shotNumber: number;
    sceneId: string;
    versionId: string;
    imagePrompt?: string;
    startFramePrompt?: string;
    endFramePrompt?: string;
    
    // Continuity info
    groupId?: string;
    isFirstInGroup?: boolean;
    previousShotId?: string;
  }>;
  
  // Approved continuity groups
  continuityGroups?: ContinuityGroup[];
}

/**
 * Batch output from image generation
 */
export interface VideoImageGeneratorBatchOutput {
  videoId: string;
  results: VideoImageGeneratorOutput[];
  totalCost?: number;
  successCount: number;
  failureCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO CLIP GENERATOR - AI INPUT/OUTPUT (Agent 4.3)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for video clip generator (Agent 4.3)
 * Generates video clips from start/end frame images using Runware I2V
 * 
 * Supports two modes:
 * - Start-End Frame: Uses both startFrameUrl and endFrameUrl for interpolation
 * - Image Reference: Uses only startFrameUrl (single keyframe animation)
 */
export interface VideoClipGeneratorInput {
  // Shot identification
  shotId: string;
  shotNumber: number;
  versionId: string;
  
  // Frame images (from Agent 4.2)
  startFrameUrl: string;       // Required: Starting keyframe
  endFrameUrl?: string;        // Optional: For Start-End Frame mode
  
  // Video prompt (from Agent 4.1)
  videoPrompt: string;
  
  // Video settings (from Step 1 / scene settings)
  videoModel: string;          // e.g., "seedance-1.0-pro"
  aspectRatio: string;         // e.g., "16:9"
  videoResolution?: string;    // e.g., "1080p" - optional, derived from aspect ratio
  duration: number;            // Shot duration in seconds (already validated by frontend)
  
  // Optional provider settings
  cameraFixed?: boolean;       // Lock camera movement (Seedance)
  generateAudio?: boolean;     // Generate native audio (Veo, Seedance 1.5)
  
  // Continuity context (informational)
  isConnectedShot?: boolean;
  isFirstInGroup?: boolean;
}

/**
 * Output from video clip generator (Agent 4.3)
 * Returns video URL from Runware (temporary URL)
 */
export interface VideoClipGeneratorOutput {
  shotId: string;
  videoUrl?: string;           // Runware temporary URL
  actualDuration?: number;     // Actual duration returned by model
  cost?: number;
  error?: string;
}

/**
 * Batch input for generating videos for all shots
 */
export interface VideoClipGeneratorBatchInput {
  videoId: string;
  shots: VideoClipGeneratorInput[];
}

/**
 * Batch output from video generation
 */
export interface VideoClipGeneratorBatchOutput {
  videoId: string;
  results: VideoClipGeneratorOutput[];
  totalCost?: number;
  successCount: number;
  failureCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4 DATA - Composition Phase
// ═══════════════════════════════════════════════════════════════════════════════

export interface Step4Data {
  // Per-shot version data (keyed by shotId)
  shotVersions: Record<string, ShotVersion[]>;
  
  // Scenes with model settings (initialized from step1Data by Agent 4.1)
  // Same structure as Scene, used for model overrides in Compose phase
  scenes?: Scene[];
  
  // Shots with model settings (initialized from step1Data by Agent 4.1)
  // Same structure as Shot, keyed by sceneId
  shots?: Record<string, Shot[]>;
  
  // Per-scene settings overrides (deprecated, use scenes[] instead)
  sceneSettings?: Record<string, {
    imageModel?: string;
    videoModel?: string;
    animationMode?: 'smooth-image' | 'animate';
  }>;
  
  // Reference images uploaded during composition
  shotReferenceImages?: Array<{
    shotId: string;
    imageUrl: string;
    type: 'style' | 'character' | 'environment';
  }>;
}

export interface Step5Data {
  previewUrl?: string;
  ambientSound?: string;
}

export interface Step6Data {
  exportQuality?: string;
  fileFormat?: string;
}

// Video creation request
export interface CreateAmbientVideoRequest {
  workspaceId: string;
  title: string;
  animationMode: AnimationMode;
  videoGenerationMode?: VideoGenerationMode;
}

