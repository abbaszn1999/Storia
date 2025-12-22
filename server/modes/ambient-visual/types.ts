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
  imagePrompt?: string | null;
  imageUrl?: string | null;
  startFramePrompt?: string | null;
  startFrameUrl?: string | null;
  endFramePrompt?: string | null;
  endFrameUrl?: string | null;
  videoPrompt?: string | null;
  videoUrl?: string | null;
  videoDuration?: number | null;
  status: string;
  needsRerender: boolean;
  createdAt: Date;
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
  scene: Scene;
  shotsPerSegment: 'auto' | number;
  pacing: number;
  animationMode: AnimationMode;
  artStyle?: string;
  visualElements?: string[];
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
}

export interface Step4Data {
  shotVersions?: Record<string, any[]>;
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

