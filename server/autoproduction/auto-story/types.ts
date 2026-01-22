// Story generation types
export type StoryTemplate = 
  | 'problem-solution'
  | 'tease-reveal'
  | 'before-after'
  | 'myth-busting'
  | 'auto-asmr'  // Future
  | 'asmr';      // Future

export type TemplateType = 'narrative' | 'auto-asmr' | 'asmr';

// Template structure definition
export interface TemplateStructure {
  id: StoryTemplate;
  name: string;
  stages: string[]; // e.g., ["Hook", "Problem", "Solution", "CTA"]
  minScenes: number;
  maxScenes: number;
  optimalSceneCount: number;
}

// Scene definition
export interface Scene {
  sceneNumber: number;
  duration: number;
  description: string;
  narration?: string;
  imagePrompt?: string;
  voiceText?: string;
  voiceMood?: string;
  videoPrompt?: string;
  animationName?: string;
  effectName?: string;
  transitionToNext?: string;
}

// Story generation settings
export interface StoryGenerationSettings {
  // Content
  template: StoryTemplate;
  topic: string;
  
  // Technical
  duration: number;
  aspectRatio: string;
  language: string;
  
  // Visual
  imageStyle: string;
  imageModel: string;
  videoModel?: string;
  mediaType: 'static' | 'animated';
  transitionStyle?: string;
  
  // Audio
  hasVoiceover: boolean;
  voiceProfile?: string;
  voiceVolume: number;
  backgroundMusic?: string;
  musicVolume: number;
}

// Generation result
export interface StoryGenerationResult {
  success: boolean;
  story?: {
    title: string;
    script: string;
    scenes: Scene[];
    duration: number;
  };
  error?: string;
}

// Batch generation progress
export interface BatchGenerationProgress {
  campaignId: string;
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  pending: number;
  currentIndex?: number;
  currentTopic?: string;
  currentStage?: string;
  currentProgress?: number;
}
