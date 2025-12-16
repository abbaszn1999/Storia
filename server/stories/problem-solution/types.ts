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
  narration: string;
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
    narration: string;
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

// Image Animation type for camera movements
export type ImageAnimation = 'zoom-in' | 'zoom-out' | 'pan-right' | 'pan-left' | 'pan-up' | 'pan-down' | 'ken-burns' | 'rotate-cw' | 'rotate-ccw' | 'slide-left' | 'slide-right';

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
    imageAnimation?: ImageAnimation; // For 'transition' mode
    imageEffect?: ImageEffect;       // Visual effect for 'transition' mode
    wordTimestamps?: WordTimestamp[]; // NEW: Word-level sync for karaoke subtitles
  }>;
  animationMode: 'off' | 'transition' | 'video';
  backgroundMusic?: string;     // Legacy: Direct URL to music file
  musicStyle?: string;          // NEW: AI music style (e.g., "cinematic", "upbeat")
  storyTopic?: string;          // Topic for context-aware music generation
  voiceVolume: number;
  musicVolume: number;
  aspectRatio: string;
  exportFormat: 'mp4' | 'webm' | 'gif';
  exportQuality: '720p' | '1080p' | '4k';
  textOverlay: boolean;
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
