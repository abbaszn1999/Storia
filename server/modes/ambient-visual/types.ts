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

// Step 2-6 data interfaces (placeholders)
export interface Step2Data {
  artStyle?: string;
  visualElements?: string[];
  referenceImages?: string[];
}

export interface Step3Data {
  scenes?: any[];
  shots?: Record<string, any[]>;
  continuityLocked?: boolean;
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

