export const AMBIENT_VISUAL_CONFIG = {
  mode: 'ambient',
  defaultTitle: 'Untitled Ambient Visual',
  initialStep: 1, // 1 = Atmosphere (first step), steps are 1-6
  totalSteps: 6,
  
  // Default settings
  defaults: {
    animationMode: 'image-transitions' as const,
    imageModel: 'nano-banana',
    aspectRatio: '16:9',
    duration: '5min',
    mood: 'calm',
    theme: 'nature',
  },
};

