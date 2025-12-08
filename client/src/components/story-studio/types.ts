// Story Studio Types
// ═══════════════════════════════════════════════════════════════════════════

export type StepId = 'concept' | 'storyboard' | 'audio' | 'export';

export interface Step {
  id: StepId;
  label: string;
  shortLabel: string;
  icon: string;
}

export const STEPS: Step[] = [
  { id: 'concept', label: 'Concept & Script', shortLabel: 'Concept', icon: '💡' },
  { id: 'storyboard', label: 'Storyboard', shortLabel: 'Scenes', icon: '🎬' },
  { id: 'audio', label: 'Audio', shortLabel: 'Audio', icon: '🎵' },
  { id: 'export', label: 'Preview & Export', shortLabel: 'Export', icon: '🚀' },
];

export interface StoryScene {
  id: string;
  sceneNumber: number;
  narration: string;
  visualPrompt: string;
  imageUrl?: string;
  videoUrl?: string;
  isAnimated: boolean;
  transition: 'fade' | 'slide' | 'zoom' | 'none';
  duration: number;
  voiceoverEnabled: boolean;
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
  
  // Navigation
  currentStep: StepId;
  completedSteps: StepId[];
  direction: number; // 1 = forward, -1 = backward
  
  // Step 1: Concept
  topic: string;
  generatedScript: string;
  aspectRatio: string;
  duration: number;
  
  // Step 2: Storyboard
  scenes: StoryScene[];
  voiceoverEnabled: boolean;
  
  // Step 3: Audio
  selectedVoice: string;
  backgroundMusic: string;
  voiceVolume: number;
  musicVolume: number;
  
  // Step 4: Export
  exportFormat: string;
  exportQuality: string;
  
  // UI State
  isGenerating: boolean;
  generationProgress: number;
  error: string | null;
}

export interface StoryStudioActions {
  // Navigation
  goToStep: (step: StepId) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  // Step 1
  setTopic: (topic: string) => void;
  setGeneratedScript: (script: string) => void;
  setAspectRatio: (ratio: string) => void;
  setDuration: (duration: number) => void;
  generateScript: () => Promise<void>;
  
  // Step 2
  setScenes: (scenes: StoryScene[]) => void;
  updateScene: (id: string, updates: Partial<StoryScene>) => void;
  setVoiceoverEnabled: (enabled: boolean) => void;
  
  // Step 3
  setSelectedVoice: (voice: string) => void;
  setBackgroundMusic: (music: string) => void;
  setVoiceVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  
  // Step 4
  setExportFormat: (format: string) => void;
  setExportQuality: (quality: string) => void;
  exportVideo: () => Promise<void>;
  
  // General
  reset: () => void;
}

