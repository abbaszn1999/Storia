// Story Studio Types
// ═══════════════════════════════════════════════════════════════════════════

export type StepId = 'concept' | 'script' | 'storyboard' | 'audio' | 'export';

// Music style for AI-generated background music
export type MusicStyle = 
  | 'none'
  | 'cinematic'
  | 'upbeat'
  | 'calm'
  | 'corporate'
  | 'electronic'
  | 'emotional'
  | 'inspiring';

// Export result with separated audio assets for volume control
export interface ExportResult {
  videoUrl: string;
  videoBaseUrl?: string;    // Video with voiceover, no music (for remix)
  voiceoverUrl?: string;    // Voiceover audio file
  musicUrl?: string;        // Music audio file
  duration: number;
  size: number;
}

export interface Step {
  id: StepId;
  label: string;
  shortLabel: string;
  icon: string;
}

export const STEPS: Step[] = [
  { id: 'concept', label: 'Concept & Script', shortLabel: 'Concept', icon: '💡' },
  { id: 'script', label: 'Script Review', shortLabel: 'Script', icon: '📝' },
  { id: 'storyboard', label: 'Storyboard', shortLabel: 'Scenes', icon: '🎬' },
  { id: 'audio', label: 'Audio', shortLabel: 'Audio', icon: '🎵' },
  { id: 'export', label: 'Preview & Export', shortLabel: 'Export', icon: '🚀' },
];

/**
 * Word-level timestamp for synchronized subtitles (karaoke-style)
 */
export interface WordTimestamp {
  word: string;
  startTime: number;
  endTime: number;
}

export interface StoryScene {
  id: string;
  sceneNumber: number;
  duration: number;
  description: string;      // Visual description of the scene (used for image generation)
  narration?: string;       // Voiceover text (only when voiceover enabled)
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  imagePrompt?: string;
  videoPrompt?: string;
  imageAnimation?: 'zoom-in' | 'zoom-out' | 'pan-right' | 'pan-left' | 'pan-up' | 'pan-down' | 'ken-burns' | 'rotate-cw' | 'rotate-ccw' | 'slide-left' | 'slide-right';
  imageEffect?: 'none' | 'vignette' | 'sepia' | 'black-white' | 'warm' | 'cool' | 'grain' | 'dramatic' | 'cinematic' | 'dreamy' | 'glow';
  voiceMood?: 'neutral' | 'happy' | 'sad' | 'excited' | 'angry' | 'whisper' | 'dramatic' | 'curious' | 'thoughtful' | 'surprised' | 'sarcastic' | 'nervous';
  transition?: 'fade' | 'slide' | 'zoom' | 'none';
  isAnimated?: boolean;
  voiceoverEnabled?: boolean;
  voiceInstructions?: string;
  wordTimestamps?: WordTimestamp[];  // NEW: Word-level sync for karaoke subtitles
}

export interface StoryTemplate {
  id: string;
  name: string;
  structure: string[];
  iconColor: string;
}

export interface StoryStudioState {
  // Template info
  template: StoryTemplate | null;
  
  // Project identification
  projectName: string;       // User-entered project name (required before proceeding)
  projectTimestamp: string;  // Fixed timestamp generated once: "YYYYMMDD_HHMMSS"
  projectFolder: string;     // Full folder name: "{projectName}_{projectTimestamp}"
  isProjectLocked: boolean;  // Locks project name after leaving concept step
  
  // Navigation
  currentStep: StepId;
  completedSteps: StepId[];
  direction: number; // 1 = forward, -1 = backward
  
  // Step 1: Concept
  topic: string;
  aiPrompt: string; // New: For AI Assistant input
  generatedScript: string;
  aspectRatio: string;
  duration: number;
  voiceoverEnabled: boolean;
  language: 'ar' | 'en'; // New
  textOverlayEnabled: boolean; // New: Simple ON/OFF toggle
  textOverlay: 'minimal' | 'key-points' | 'full'; // Legacy (auto-set to 'key-points')
  textOverlayStyle: 'modern' | 'cinematic' | 'bold'; // New: 3 simple styles
  pacing: 'slow' | 'medium' | 'fast';
  
  // Image & Video Settings
  imageModel: string; // Image model ID (e.g., "nano-banana", "flux-2-pro")
  imageStyle: 'photorealistic' | 'cinematic' | '3d-render' | 'digital-art' | 'anime' | 'illustration' | 'watercolor' | 'minimalist';
  styleReferenceUrl: string; // Custom style reference image URL
  imageResolution: string; // Resolution (e.g., "1k", "2k", "4k", "custom")
  animationMode: 'off' | 'transition' | 'video'; // New (Replacing old imageMode)
  videoModel: string; // Video model ID (e.g., "seedance-1.0-pro", "veo-3.0")
  videoResolution: string; // Video resolution (e.g., "720p", "1080p", "2160p")
  
  // Legacy (to be deprecated or mapped)
  imageMode: 'none' | 'transition' | 'image-to-video';
  
  // Step 2: Storyboard
  scenes: StoryScene[];
  
  // Step 3: Audio
  selectedVoice: string;
  musicStyle: MusicStyle;     // AI music style (replaces backgroundMusic)
  backgroundMusic: string;    // Legacy: kept for backwards compatibility
  customMusicUrl: string;     // Custom uploaded music URL (takes priority over AI music)
  customMusicDuration: number; // Duration of uploaded music in seconds
  voiceVolume: number;
  musicVolume: number;
  
  // Step 4: Export
  exportFormat: string;
  exportQuality: string;
  storyId?: string; // Database story ID after saving
  lastExportResult?: {
    videoUrl: string;
    videoBaseUrl?: string;
    voiceoverUrl?: string;
    musicUrl?: string;
  };
  
  // UI State
  isGenerating: boolean;
  isEnhancingStoryboard: boolean;  // Storyboard enhancement agent running
  isGeneratingImages: boolean;     // Image generation running
  generationProgress: number;
  error: string | null;
  hasGeneratedScenes: boolean;     // Track if scenes have been auto-generated once
  hasEnhancedStoryboard: boolean;  // Track if storyboard has been auto-enhanced once
  hasGeneratedVoiceover: boolean;  // Track if voiceover has been auto-generated once
  hasExportedVideo: boolean;       // Track if video has been auto-exported once
}

export interface StoryStudioActions {
  // Navigation
  goToStep: (step: StepId) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  // Project
  setProjectName: (name: string) => void;
  
  // Step 1
  setTopic: (topic: string) => void;
  setAiPrompt: (prompt: string) => void;
  setGeneratedScript: (script: string) => void;
  setAspectRatio: (ratio: string) => void;
  setDuration: (duration: number) => void;
  setVoiceoverEnabled: (enabled: boolean) => void;
  setLanguage: (lang: 'ar' | 'en') => void;
  setPacing: (pacing: 'slow' | 'medium' | 'fast') => void;
  setTextOverlay: (overlay: 'minimal' | 'key-points' | 'full') => void;
  setTextOverlayStyle: (style: 'modern' | 'cinematic' | 'bold') => void;
  setImageModel: (model: string) => void;
  setImageStyle: (style: 'photorealistic' | 'cinematic' | '3d-render' | 'digital-art' | 'anime' | 'illustration' | 'watercolor' | 'minimalist') => void;
  setImageResolution: (res: string) => void;
  setAnimationMode: (mode: 'off' | 'transition' | 'video') => void;
  setVideoModel: (model: string) => void;
  setVideoResolution: (res: string) => void;
  // Legacy
  setImageMode: (mode: 'none' | 'transition' | 'image-to-video') => void;
  
  generateScript: () => Promise<void>;
  generateIdeaStory: () => Promise<void>;
  
  // Step 2
  setScenes: (scenes: StoryScene[]) => void;
  updateScene: (id: string, updates: Partial<StoryScene>) => void;
  addScene: () => void;
  deleteScene: (id: string) => void;
  regenerateSceneImage: (sceneId: string) => Promise<void>;
  generateVoiceover: () => Promise<void>;
  
  // Step 3
  setSelectedVoice: (voice: string) => void;
  setMusicStyle: (style: MusicStyle) => void;
  setBackgroundMusic: (music: string) => void; // Legacy
  setCustomMusic: (url: string, duration: number) => void; // Custom uploaded music
  clearCustomMusic: () => void; // Remove custom music
  setVoiceVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  
  // Step 4
  setExportFormat: (format: string) => void;
  setExportQuality: (quality: string) => void;
  exportVideo: () => Promise<ExportResult | null>;
  remixVideo: (videoBaseUrl: string, voiceoverUrl: string, musicUrl: string, voiceVolume: number, musicVolume: number) => Promise<string | null>;
  
  // General
  reset: () => void;
}

