// Animation mode types
export type AnimationMode = 'image-transitions' | 'video-animation';
export type VideoGenerationMode = 'image-reference' | 'start-end-frame';

// Step 1: Atmosphere data
export interface Step1Data {
  animationMode: AnimationMode;
  videoGenerationMode?: VideoGenerationMode;
  // Future: imageModel, aspectRatio, duration, mood, etc.
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

