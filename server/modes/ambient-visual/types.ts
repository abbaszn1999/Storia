// Animation mode types
export type AnimationMode = 'image-transitions' | 'video-animation';
export type VideoGenerationMode = 'image-reference' | 'start-end-frame';

// Loop type for video looping
export type LoopType = 'seamless' | 'fade' | 'hard-cut';

// Text overlay style
export type TextOverlayStyle = 'modern' | 'cinematic' | 'bold';

// Language options
export type Language = 'ar' | 'en';

// Background music style options
export type MusicStyle = 'cinematic' | 'upbeat' | 'calm' | 'corporate' | 'electronic' | 'emotional' | 'inspiring';

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
  
  // Background Music toggle (music style/url is in Step2Data)
  backgroundMusicEnabled: boolean;
  
  // Voiceover
  voiceoverEnabled: boolean;
  voiceoverStory?: string;    // User's narration theme/topic for voiceover generation
  voiceId?: string;           // Selected ElevenLabs voice ID
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
  // Background Music (shown in Visual World when enabled in Step 1)
  musicStyle?: MusicStyle;
  customMusicUrl?: string;
  customMusicDuration?: number;
  hasCustomMusic?: boolean;
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
  loopCount?: number | null;  // Per-scene loop count (for Soundscape step)
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
  loopCount?: number | null;           // Per-shot loop count
  soundEffectDescription?: string | null;  // Description for SFX generation
  soundEffectUrl?: string | null;      // Generated/uploaded SFX audio URL
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
  
  // Sound Effect Prompt (from Agent 5.3: Sound Effect Prompt Generator)
  soundEffectPrompt?: string | null;  // Prompt used for sound effect generation
  
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

// Voiceover status tracking
export type VoiceoverStatus = 'pending' | 'script_generated' | 'audio_generated';

export interface Step5Data {
  previewUrl?: string;
  ambientSound?: string;
  
  // Voiceover data (from Agent 5.1 and 5.2)
  voiceoverScript?: string;       // Generated/edited narration script
  voiceoverAudioUrl?: string;     // CDN URL of generated audio
  voiceoverDuration?: number;     // Audio duration in seconds
  voiceoverStatus?: VoiceoverStatus;
  
  // Background Music data (from Agent 5.4)
  generatedMusicUrl?: string;     // CDN URL of AI-generated music
  generatedMusicDuration?: number; // Music duration in seconds
  generatedMusicStyle?: MusicStyle; // Style used for generation
  
  // Loop settings (initialized from Step1Data on step 4->5 transition)
  scenesWithLoops?: Scene[];              // Scenes with initialized loopCount
  shotsWithLoops?: Record<string, Shot[]>; // Shots keyed by sceneId with loopCount
  loopSettingsLocked?: boolean;           // User can lock to prevent accidental changes
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 6: PREVIEW PHASE - SHOTSTACK INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Timeline scene for Step 6 preview
 * Contains scene data with order information for timeline display
 */
export interface TimelineSceneItem {
  id: string;
  sceneNumber: number;
  title: string;
  description?: string | null;
  duration?: number | null;
  loopCount?: number | null;
  order: number;  // For reordering in timeline
}

/**
 * Timeline shot for Step 6 preview
 * Contains shot data with order and timing information
 */
export interface TimelineShotItem {
  id: string;
  sceneId: string;
  shotNumber: number;
  duration: number;
  loopCount?: number | null;
  transition?: string | null;
  videoUrl?: string | null;
  order: number;  // For reordering within scene
}

/**
 * Audio track item for timeline
 */
export interface AudioTrackItem {
  id: string;
  shotId?: string;         // For SFX linked to specific shot
  src: string;
  start: number;           // Start time in seconds
  duration: number;        // Duration in seconds
  volume: number;          // 0-1
  fadeIn?: boolean;
  fadeOut?: boolean;
  order: number;           // For reordering
}

/**
 * Volume settings for all audio tracks
 */
export interface VolumeSettings {
  master: number;          // 0-1, applied to all tracks
  sfx: number;             // 0-1, sound effects volume
  voiceover: number;       // 0-1, narration volume
  music: number;           // 0-1, background music volume
}

/**
 * Render status for Shotstack renders
 */
export type PreviewRenderStatus = 'idle' | 'queued' | 'rendering' | 'done' | 'failed';

/**
 * Preview render state
 */
export interface PreviewRenderState {
  id: string;
  status: PreviewRenderStatus;
  url?: string;
  progress?: number;       // 0-100
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Step 6 Data - Preview Phase with Shotstack Integration
 * 
 * Contains:
 * - Timeline state with scenes, shots, and audio tracks
 * - Volume settings for audio mixing
 * - Preview and final render states
 */
export interface Step6Data {
  // Timeline state (initialized from Step 5 data)
  timeline?: {
    scenes: TimelineSceneItem[];
    shots: Record<string, TimelineShotItem[]>;  // Keyed by sceneId
    audioTracks: {
      sfx: AudioTrackItem[];                     // Sound effects per shot
      voiceover?: AudioTrackItem;                // Global voiceover track
      music?: AudioTrackItem;                    // Background music track
    };
  };
  
  // Volume settings
  volumes?: VolumeSettings;
  
  // Preview render state (lower quality, faster)
  previewRender?: PreviewRenderState;
  
  // Final render state (full quality)
  finalRender?: PreviewRenderState;
  
  // Legacy fields (for backwards compatibility during migration)
  exportQuality?: string;
  fileFormat?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 7 DATA - EXPORT PHASE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Step 7 Data - Export Phase
 * 
 * Contains:
 * - Render state and progress tracking
 * - Final export URLs (video and thumbnail)
 * - Export metadata (resolution, format, duration)
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

// ═══════════════════════════════════════════════════════════════════════════════
// VOICEOVER SCRIPT GENERATOR - AI INPUT/OUTPUT (Agent 5.1)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for voiceover script generation (Agent 5.1)
 * Generates narration text based on video context
 */
export interface VoiceoverScriptGeneratorInput {
  // Language setting
  language: Language;              // 'en' | 'ar'
  
  // User's narration theme/topic
  voiceoverStory: string;          // User's description of what the voiceover should be about
  
  // Duration context (calculated with loops)
  totalDuration: number;           // Total video duration in seconds (including loop repetitions)
  
  // Atmosphere context (from Step1Data)
  mood: string;
  theme: string;
  moodDescription: string;
  
  // Scene context (for narrative flow)
  scenes: Array<{
    sceneNumber: number;
    title: string;
    description?: string | null;
    duration?: number | null;
  }>;
}

export interface VoiceoverScriptGeneratorOutput {
  script: string;                  // Generated narration text
  estimatedDuration: number;       // Estimated speaking time in seconds
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND EFFECT PROMPT GENERATOR - AI INPUT/OUTPUT (Agent 5.3)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for sound effect prompt generation (Agent 5.3)
 * Generates recommended sound effect descriptions based on visual context
 */
export interface SoundEffectPromptGeneratorInput {
  // Shot context
  shotDescription: string | null;  // Shot visual description
  shotType: string;                // e.g., "wide", "close-up", "tracking"
  shotDuration: number;            // Duration in seconds
  
  // Video prompt context (from ShotVersion)
  videoPrompt: string | null;      // Generated video prompt for this shot
  
  // Scene context
  sceneTitle: string;              // Title of the containing scene
  sceneDescription: string | null; // Scene description
  
  // Atmosphere context (from Step1Data)
  mood: string;                    // e.g., "calm", "mysterious"
  theme: string;                   // e.g., "nature", "urban"
  moodDescription: string;         // AI-generated mood description
}

export interface SoundEffectPromptGeneratorOutput {
  prompt: string;                  // Recommended sound effect description
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND EFFECT GENERATOR - AI INPUT/OUTPUT (Agent 5.4)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for sound effect generation using MMAudio (Agent 5.4)
 * Takes a video URL and prompt to generate audio synchronized with the video
 */
export interface SoundEffectGeneratorInput {
  // Video source
  videoUrl: string;                // Public URL of the video to add audio to
  
  // Audio generation
  prompt: string;                  // Sound effect description
  duration?: number;               // Audio duration in seconds (1-30, default: 8)
  
  // Generation settings
  numSteps?: number;               // Inference steps (1-50, default: 25)
  cfgStrength?: number;            // Guidance strength (1-10, default: 4.5)
  seed?: number;                   // For reproducibility
  
  // Context for CDN upload
  videoId: string;
  videoTitle: string;            // Video title for path (same as voiceover)
  videoCreatedAt?: Date | string; // Video creation date for path (same as voiceover)
  shotId: string;
  sceneId: string;               // Scene ID for organizing files
  userId: string;
  workspaceId: string;
  workspaceName: string;
}

export interface SoundEffectGeneratorOutput {
  audioUrl: string;                // CDN URL of extracted audio (MP3)
  originalMMAudioUrl: string;      // Original MMAudio URL (expires in 24h)
  fileSize: number;                // Audio file size in bytes
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
  language: Language;              // For model selection
  
  // Video context (for CDN path)
  videoId: string;
  videoTitle: string;
  videoCreatedAt?: Date | string;   // Video creation date for path (YYYYMMDD format)
  
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
  // Music style (from Step2Data)
  musicStyle: MusicStyle;
  
  // Atmosphere context (from Step1Data)
  mood: string;
  theme: string;
  timeContext?: string;
  season?: string;
  moodDescription?: string;
  
  // Duration (calculated from scenes/shots with loops)
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

// Video creation request
export interface CreateAmbientVideoRequest {
  workspaceId: string;
  title: string;
  animationMode: AnimationMode;
  videoGenerationMode?: VideoGenerationMode;
}

