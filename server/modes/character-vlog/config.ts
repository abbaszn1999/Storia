export const CHARACTER_VLOG_CONFIG = {
  mode: 'vlog',
  defaultTitle: 'Untitled Character Vlog',
  initialStep: 1, // 1 = Script (first step), steps are 1-6
  totalSteps: 6,
  
  // Default settings
  defaults: {
    aspectRatio: '9:16',
    narrationStyle: 'first-person' as const,
  },
};

