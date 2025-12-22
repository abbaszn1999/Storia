export interface ProblemSolutionIdeaRequest {
  ideaText: string;
  durationSeconds?: number;
  aspectRatio?: string;
}

export interface ProblemSolutionIdeaResponse {
  idea: string;
  hook: string;
  angles: string[];
  cta: string;
  cost?: number;
}

export interface StoryGeneratorInput {
  ideaText: string;
  durationSeconds: number;
}

export interface StoryGeneratorOutput {
  story: string;
  cost?: number;
}

export interface SceneGeneratorInput {
  storyText: string;
  duration: number;
  pacing: 'slow' | 'medium' | 'fast';
  videoModel?: string;  // Optional: Video model ID for duration constraints
}

export interface SceneOutput {
  sceneNumber: number;
  duration: number;
  description: string;   // Visual description (for image generation)
  narration?: string;    // Voiceover text (only when voiceover enabled)
}

export interface SceneGeneratorOutput {
  scenes: SceneOutput[];
  totalScenes: number;
  totalDuration: number;
  cost?: number;
}

// Image style for visual generation
export type ImageStyle = 'photorealistic' | 'cinematic' | '3d-render' | 'digital-art' | 'anime' | 'illustration' | 'watercolor' | 'minimalist';

export interface StoryboardEnhancerInput {
  scenes: Array<{
    sceneNumber: number;
    duration: number;
    description: string;   // Visual description (for image generation)
    narration?: string;    // Voiceover text (only when voiceover enabled)
  }>;
  aspectRatio: string;
  imageStyle: ImageStyle;         // Visual style for image generation
  voiceoverEnabled: boolean;
  language?: string;              // Only if voiceoverEnabled = true
  textOverlay?: string;           // Only if voiceoverEnabled = true
  animationMode: boolean;
  animationType?: 'transition' | 'image-to-video'; // Only if animationMode = true
}

// Image Effect type for visual filters
export type ImageEffect = 'none' | 'vignette' | 'sepia' | 'black-white' | 'warm' | 'cool' | 'grain' | 'dramatic' | 'cinematic' | 'dreamy' | 'glow';

// Image Animation type for camera movements (Ken Burns effects)
export type ImageAnimation = 'zoom-in' | 'zoom-out' | 'pan-right' | 'pan-left' | 'pan-up' | 'pan-down' | 'ken-burns' | 'rotate-cw' | 'rotate-ccw' | 'slide-left' | 'slide-right';

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE TRANSITIONS - 2025 Trending
// ═══════════════════════════════════════════════════════════════════════════════

// Scene-to-scene transition types (applied between scenes)
export type SceneTransition =
  // Motion-based (viral on TikTok/Reels)
  | 'whip-pan'           // Fast horizontal swipe with blur
  | 'zoom-punch'         // Quick zoom in/out impact
  | 'snap-zoom'          // Sharp quick zoom
  | 'motion-blur-left'   // Directional blur left
  | 'motion-blur-right'  // Directional blur right
  | 'motion-blur-up'     // Directional blur up
  | 'motion-blur-down'   // Directional blur down
  // Light & Glow (cinematic)
  | 'flash-white'        // White flash between scenes
  | 'flash-black'        // Black flash (dramatic)
  | 'light-leak'         // Warm light leak effect
  | 'lens-flare'         // Lens flare transition
  | 'luma-fade'          // Brightness-based fade
  // Digital / Glitch (modern/tech)
  | 'glitch'             // Digital distortion
  | 'rgb-split'          // RGB channel separation
  | 'pixelate'           // Pixelation transition
  | 'vhs-noise'          // Retro VHS noise
  // Shape Reveals (TikTok favorites)
  | 'circle-open'        // Circle expanding reveal
  | 'circle-close'       // Circle contracting
  | 'heart-reveal'       // Heart shape reveal
  | 'diamond-wipe'       // Diamond pattern
  | 'star-wipe'          // Star pattern
  | 'diagonal-tl'        // Diagonal from top-left
  | 'diagonal-br'        // Diagonal from bottom-right
  // 3D Effects
  | 'cube-rotate-left'   // 3D cube rotation left
  | 'cube-rotate-right'  // 3D cube rotation right
  | 'page-flip'          // Page flip effect
  | 'parallax-slide'     // Multi-layer depth slide
  // Smooth & Elegant
  | 'smooth-blur'        // Gentle blur dissolve
  | 'cross-dissolve'     // Classic cross dissolve
  | 'wave-ripple'        // Water ripple effect
  | 'zoom-blur'          // Radial zoom blur
  // Classic (still useful)
  | 'fade'               // Simple fade
  | 'wipe-left'          // Wipe from right to left
  | 'wipe-right'         // Wipe from left to right
  | 'wipe-up'            // Wipe upward
  | 'wipe-down'          // Wipe downward
  | 'none';              // No transition (hard cut)

// Transition category for grouping
export type TransitionCategory = 
  | 'motion'      // Fast, dynamic transitions
  | 'light'       // Glows, flashes, lens effects
  | 'digital'     // Glitch, tech effects
  | 'shape'       // Geometric reveals
  | '3d'          // Perspective, depth effects
  | 'smooth'      // Elegant, soft transitions
  | 'classic';    // Traditional transitions

// Transition configuration for a scene
export interface SceneTransitionConfig {
  name: SceneTransition;
  duration: number;        // 0.2 - 1.5 seconds
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  intensity?: number;      // 0-100 for variable effects (glitch, blur)
}

// Voice mood for ElevenLabs v3 audio tags
export type VoiceMood = 'neutral' | 'happy' | 'sad' | 'excited' | 'angry' | 'whisper' | 'dramatic' | 'curious' | 'thoughtful' | 'surprised' | 'sarcastic' | 'nervous';

export interface EnhancedSceneOutput {
  sceneNumber: number;
  imagePrompt: string;
  voiceText?: string;
  voiceMood?: VoiceMood;  // Emotional mood for voice delivery
  videoPrompt?: string;
  animationName?: ImageAnimation;
  effectName?: ImageEffect;  // Visual effect to apply
  transitionToNext?: SceneTransition;  // Transition to the next scene
  transitionDuration?: number;         // Transition duration (0.2-1.5s)
}

export interface StoryboardEnhancerOutput {
  scenes: EnhancedSceneOutput[];
  totalScenes: number;
  cost?: number;
}

export interface ImageGeneratorInput {
  storyId: string;
  scenes: Array<{
    id: string;
    sceneNumber: number;
    imagePrompt: string;
    duration: number;
  }>;
  aspectRatio: string;
  imageStyle: ImageStyle;       // Visual style (e.g., "photorealistic", "anime")
  styleReferenceUrl?: string;   // Custom style reference image URL for AI to match
  imageModel: string;           // Image model ID (e.g., "nano-banana", "flux-2-pro")
  imageResolution: string;      // Resolution tier (e.g., "1k", "2k", "4k")
  projectName: string;
  workspaceId: string;
}

export interface ImageGenerationResult {
  sceneNumber: number;
  sceneId: string;
  imageUrl: string;
  status: 'generated' | 'failed';
  error?: string;
}

export interface ImageGeneratorOutput {
  scenes: ImageGenerationResult[];
  referenceSeed: number;
  referenceImageUrl: string;
  totalCost: number;
  errors: string[];
}

// Voiceover Generator Types
export interface VoiceoverGeneratorInput {
  storyId: string;
  scenes: Array<{
    id: string;
    sceneNumber: number;
    narration: string;
    voiceInstructions?: string;
    voiceMood?: VoiceMood;  // Emotional mood for ElevenLabs v3 audio tags
    duration: number;
  }>;
  voiceId: string;
  projectName: string;
  workspaceId: string;
}

/**
 * Word-level timestamp from ElevenLabs alignment
 * Used for synchronized subtitles (karaoke-style)
 */
export interface WordTimestamp {
  word: string;
  startTime: number;  // Start time in seconds
  endTime: number;    // End time in seconds
}

export interface VoiceoverGenerationResult {
  sceneNumber: number;
  audioUrl: string;
  duration: number;
  status: 'generated' | 'failed';
  error?: string;
  cost?: number;
  wordTimestamps?: WordTimestamp[];  // Word-level sync data for subtitles
}

export interface VoiceoverGeneratorOutput {
  scenes: VoiceoverGenerationResult[];
  totalCost: number;
  errors: string[];
}

// Video Generator Types
export interface VideoGeneratorInput {
  storyId: string;
  scenes: Array<{
    id: string;
    sceneNumber: number;
    imageUrl: string;        // Source image for I2V
    videoPrompt?: string;    // Motion description (from storyboard)
    narration?: string;      // Original narration for context
    voiceMood?: string;      // Mood for motion matching
    duration: number;        // Target duration
  }>;
  videoModel: string;        // e.g., "seedance-1.0-pro"
  videoResolution: string;   // e.g., "720p"
  aspectRatio: string;       // e.g., "9:16"
  imageStyle?: ImageStyle;   // For style-aware fallback prompts
  projectName: string;
  workspaceId: string;
}

export interface VideoGenerationResult {
  sceneNumber: number;
  sceneId: string;
  videoUrl: string;
  actualDuration: number;  // Matched duration from model
  status: 'generated' | 'failed';
  error?: string;
}

export interface VideoGeneratorOutput {
  scenes: VideoGenerationResult[];
  totalCost: number;
  errors: string[];
}

// Video Export Types
export interface VideoExportInput {
  storyId: string;
  scenes: Array<{
    sceneNumber: number;
    imageUrl?: string;      // For 'off' and 'transition' modes
    videoUrl?: string;      // For 'video' mode
    audioUrl?: string;      // Voiceover audio (optional if voiceover disabled)
    narration: string;      // Text for subtitles
    duration: number;
    imageAnimation?: ImageAnimation;   // For 'transition' mode (Ken Burns)
    imageEffect?: ImageEffect;         // Visual effect for 'transition' mode
    wordTimestamps?: WordTimestamp[];  // Word-level sync for karaoke subtitles
    // Scene-to-scene transitions (2025 trending)
    transitionToNext?: SceneTransition;  // Transition to next scene
    transitionDuration?: number;         // Duration (0.2-1.5s), default 0.5
  }>;
  animationMode: 'off' | 'transition' | 'video';
  backgroundMusic?: string;     // Legacy: Direct URL to music file
  musicStyle?: string;          // NEW: AI music style (e.g., "cinematic", "upbeat")
  customMusicUrl?: string;      // NEW: User-uploaded custom music URL (takes priority)
  storyTopic?: string;          // Topic for context-aware music generation
  voiceVolume: number;
  musicVolume: number;
  aspectRatio: string;
  exportFormat: 'mp4' | 'webm' | 'gif';
  exportQuality: '720p' | '1080p' | '4k';
  textOverlay: boolean;
  textOverlayStyle?: 'modern' | 'cinematic' | 'bold';  // Subtitle style
  language?: string;                                    // Language for font selection ('en' | 'ar')
  projectName: string;
  workspaceId: string;
}

export interface VideoExportOutput {
  videoUrl: string;           // Final mixed video
  videoBaseUrl?: string;      // Video without final audio mix (for Web Audio preview)
  voiceoverUrl?: string;      // Merged voiceover audio file
  musicUrl?: string;          // Background music audio file
  duration: number;
  format: string;
  size: number;
  thumbnailUrl?: string;
}

// Input for re-mixing audio with new volume levels
export interface VideoRemixInput {
  videoBaseUrl: string;       // MUTED video (no audio at all) for remixing
  voiceoverUrl: string;       // Voiceover audio file
  musicUrl: string;           // Music audio file
  voiceVolume: number;        // 0-100
  musicVolume: number;        // 0-100
  projectName: string;
  workspaceId: string;
}

export interface VideoRemixOutput {
  videoUrl: string;
  duration: number;
  size: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL MEDIA METADATA
// ═══════════════════════════════════════════════════════════════════════════════
// NOTE: Social media types are now in shared/social/types.ts
// Import from: import { SocialPlatform, SocialMetadataInput, SocialMetadataOutput } from "../../shared/social";
