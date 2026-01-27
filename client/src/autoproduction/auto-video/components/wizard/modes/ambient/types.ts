/**
 * Ambient Mode Types
 * 
 * Type definitions specific to the Ambient Visual video mode.
 * Matches the original ambient-visual-workflow tool settings EXACTLY.
 */

// ═══════════════════════════════════════════════════════════════
// ANIMATION MODE TYPES
// ═══════════════════════════════════════════════════════════════

// Animation mode - determines video generation approach
export type AnimationMode = 'image-transitions' | 'video-animation';

// Video generation mode (only for video-animation mode)
export type VideoGenerationMode = 'image-reference' | 'start-end-frame';

// Loop type for video looping
export type LoopType = 'seamless' | 'fade' | 'hard-cut';

// ═══════════════════════════════════════════════════════════════
// ATMOSPHERE SETTINGS (Step 1) - EXACT MATCH WITH ORIGINAL
// ═══════════════════════════════════════════════════════════════

// Duration options (EXACT from original tool)
export type AmbientDuration = '1min' | '2min' | '4min' | '6min' | '8min' | '10min';

// Aspect ratio options
export type AmbientAspectRatio = '16:9' | '9:16' | '1:1' | '4:5';

// Mood options (EXACT from original MOODS array)
export type AmbientMood = 
  | 'calm'
  | 'mysterious'
  | 'energetic'
  | 'nostalgic'
  | 'cozy'
  | 'dark'
  | 'dreamy'
  | 'ethereal';

// Theme options (EXACT from original THEMES array)
export type AmbientTheme = 
  | 'nature'
  | 'urban'
  | 'abstract'
  | 'cosmic'
  | 'interior'
  | 'fantasy';

// Time context options - Natural themes (nature, urban)
export type TimeContextNatural = 'dawn' | 'day' | 'sunset' | 'night' | 'timeless';

// Time context options - Cosmic theme
export type TimeContextCosmic = 'bright-nebula' | 'dark-void' | 'star-field' | 'eclipse' | 'aurora';

// Time context options - Abstract theme
export type TimeContextAbstract = 'static' | 'flowing' | 'pulsing' | 'chaotic' | 'balanced';

// Time context options - Interior theme
export type TimeContextInterior = 'morning-light' | 'afternoon' | 'golden-hour' | 'evening' | 'ambient';

// Time context options - Fantasy theme
export type TimeContextFantasy = 'ethereal-dawn' | 'mystical-day' | 'enchanted-dusk' | 'moonlit-night' | 'twilight';

// Combined time context type (all possible values)
export type AmbientTimeContext = 
  | TimeContextNatural 
  | TimeContextCosmic 
  | TimeContextAbstract 
  | TimeContextInterior 
  | TimeContextFantasy;

// Season options - Natural themes (nature, urban)
export type SeasonNatural = 'spring' | 'summer' | 'autumn' | 'winter' | 'rainy' | 'snowy' | 'foggy' | 'neutral';

// Season options - Cosmic theme (Space Density)
export type SeasonCosmic = 'sparse' | 'moderate' | 'dense' | 'nebulous' | 'energetic' | 'calm';

// Season options - Abstract theme (Complexity Level)
export type SeasonAbstract = 'minimal' | 'moderate' | 'complex' | 'intense' | 'layered';

// Season options - Interior theme (Ambiance)
export type SeasonInterior = 'warm-cozy' | 'cool-fresh' | 'natural-light' | 'dim-moody' | 'bright-airy';

// Season options - Fantasy theme (Magical Condition)
export type SeasonFantasy = 'magical-bloom' | 'mystical-mist' | 'enchanted-frost' | 'fairy-lights' | 'elemental';

// Combined season type (all possible values)
export type AmbientSeason = 
  | SeasonNatural 
  | SeasonCosmic 
  | SeasonAbstract 
  | SeasonInterior 
  | SeasonFantasy;

// ═══════════════════════════════════════════════════════════════
// VISUAL WORLD SETTINGS (Step 2)
// ═══════════════════════════════════════════════════════════════

// Art style options (EXACT from original visual-world-tab ART_STYLES)
export type AmbientArtStyle = 
  | 'cinematic'
  | 'anime'
  | 'illustrated'
  | 'realistic'
  | 'abstract'
  | 'painterly'
  | 'watercolor'
  | 'minimalist'
  | 'other';

// Visual rhythm options
export type AmbientVisualRhythm = 'constant' | 'breathing' | 'building' | 'wave';

// Image style options (for generation)
export type AmbientImageStyle = 
  | 'photorealistic'
  | 'cinematic'
  | 'artistic'
  | 'anime'
  | 'illustration'
  | 'abstract'
  | '3d-render';

// Media type for video generation
export type AmbientMediaType = 'static' | 'animated';

// Transition style options (for image-transitions mode) - EXACT from original ambient
export type AmbientTransitionStyle = 
  | 'auto'
  | 'crossfade'
  | 'dissolve'
  | 'drift'
  | 'match-cut'
  | 'morph'
  | 'wipe';

// Easing style options (for image-transitions mode) - EXACT from original
export type AmbientEasingStyle = 
  | 'smooth'
  | 'linear'
  | 'ease-in-out'
  | 'cinematic';

// ═══════════════════════════════════════════════════════════════
// SOUNDSCAPE SETTINGS
// ═══════════════════════════════════════════════════════════════

// Text overlay style options (EXACT from original)
export type AmbientTextOverlayStyle = 'modern' | 'cinematic' | 'bold';

// Music style options (EXACT from original)
export type AmbientMusicStyle = 
  | 'cinematic'
  | 'upbeat'
  | 'calm'
  | 'corporate'
  | 'electronic'
  | 'emotional'
  | 'inspiring';

// Language options (EXACT from original)
export type AmbientLanguage = 'en' | 'ar';

// Ambient sound type options
export type AmbientSoundType = 
  | 'rain'
  | 'forest'
  | 'ocean'
  | 'fireplace'
  | 'wind'
  | 'birds'
  | 'thunder'
  | 'city'
  | 'cafe'
  | 'stream';

// ═══════════════════════════════════════════════════════════════
// SETTINGS INTERFACES
// ═══════════════════════════════════════════════════════════════

// Video idea entry
export interface AmbientVideoIdea {
  idea: string;
  index: number;
}

// Soundscape settings interface
export interface AmbientSoundscapeSettings {
  // Background Music
  backgroundMusicEnabled: boolean;
  musicStyle: AmbientMusicStyle;
  customMusicUrl?: string;
  customMusicDuration?: number;
  hasCustomMusic?: boolean;
  musicVolume: number;
  
  // Voiceover
  voiceoverEnabled: boolean;
  voiceoverStory?: string;
  voiceId?: string;
  language: AmbientLanguage;
  
  // Ambient Sounds
  ambientSoundsEnabled: boolean;
  ambientSoundType: AmbientSoundType;
  ambientSoundsVolume: number;
  
  // Text Overlay / Captions
  textOverlayEnabled: boolean;
  textOverlayStyle: AmbientTextOverlayStyle;
}

// Pacing & Segment settings
export interface AmbientPacingSettings {
  pacing: number;  // 0-100 slider
  segmentEnabled: boolean;
  segmentCount: 'auto' | number;
  shotsPerSegmentEnabled: boolean;
  shotsPerSegment: 'auto' | number;
}

// Loop settings
export interface AmbientLoopSettings {
  loopMode: boolean;
  loopType: LoopType;
  segmentLoopEnabled: boolean;
  segmentLoopCount: 'auto' | number;
  shotLoopEnabled: boolean;
  shotLoopCount: 'auto' | number;
}

// Reference image from upload (matches original visual-world-tab TempReferenceImage)
export interface AmbientReferenceImage {
  tempId: string;
  previewUrl: string;
  originalName: string;
}

// Visual World settings
export interface AmbientVisualSettings {
  artStyle: AmbientArtStyle;
  visualElements: string[];
  visualRhythm: AmbientVisualRhythm;
  referenceImages: AmbientReferenceImage[];
  imageCustomInstructions?: string;
}

// ═══════════════════════════════════════════════════════════════
// CAMPAIGN SETTINGS (Main Interface)
// ═══════════════════════════════════════════════════════════════

// Ambient mode campaign settings (stored in campaignSettings JSONB)
export interface AmbientCampaignSettings {
  // ─────────────────────────────────────────────────────────────
  // ATMOSPHERE (Step 1 equivalent)
  // ─────────────────────────────────────────────────────────────
  
  // Animation Mode
  animationMode: AnimationMode;
  videoGenerationMode?: VideoGenerationMode;  // Only for video-animation mode
  
  // Core Atmosphere
  mood: AmbientMood;
  theme: AmbientTheme;
  timeContext: AmbientTimeContext;
  season: AmbientSeason;
  intensity: number;  // 0-100
  
  // Duration & Format
  duration: AmbientDuration;
  aspectRatio: AmbientAspectRatio;
  language: AmbientLanguage;
  
  // Image Generation
  imageModel: string;
  imageResolution: string;
  imageStyle: AmbientImageStyle;
  
  // Video Generation (for video-animation mode)
  videoModel?: string;
  videoResolution?: string;
  motionPrompt?: string;
  
  // Image Transitions (for image-transitions mode)
  defaultEasingStyle?: AmbientEasingStyle;
  transitionStyle?: AmbientTransitionStyle;
  mediaType: AmbientMediaType;
  
  // Pacing & Segments
  pacing: AmbientPacingSettings;
  
  // Loop Settings
  loops: AmbientLoopSettings;
  
  // ─────────────────────────────────────────────────────────────
  // VISUAL WORLD (Step 2 equivalent)
  // ─────────────────────────────────────────────────────────────
  visual: AmbientVisualSettings;
  
  // ─────────────────────────────────────────────────────────────
  // SOUNDSCAPE (Audio & Voiceover)
  // ─────────────────────────────────────────────────────────────
  soundscape: AmbientSoundscapeSettings;
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT SETTINGS
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_SOUNDSCAPE_SETTINGS: AmbientSoundscapeSettings = {
  backgroundMusicEnabled: false,
  musicStyle: 'cinematic',
  musicVolume: 60,
  voiceoverEnabled: false,
  language: 'en',
  ambientSoundsEnabled: false,
  ambientSoundType: 'rain',
  ambientSoundsVolume: 40,
  textOverlayEnabled: false,
  textOverlayStyle: 'modern',
};

export const DEFAULT_PACING_SETTINGS: AmbientPacingSettings = {
  pacing: 30,
  segmentEnabled: true,
  segmentCount: 'auto',
  shotsPerSegmentEnabled: true,
  shotsPerSegment: 'auto',
};

export const DEFAULT_LOOP_SETTINGS: AmbientLoopSettings = {
  loopMode: true,
  loopType: 'seamless',
  segmentLoopEnabled: false,
  segmentLoopCount: 'auto',
  shotLoopEnabled: false,
  shotLoopCount: 'auto',
};

export const DEFAULT_VISUAL_SETTINGS: AmbientVisualSettings = {
  artStyle: 'cinematic',
  visualElements: [],
  visualRhythm: 'breathing',
  referenceImages: [],
  imageCustomInstructions: '',
};

export const DEFAULT_AMBIENT_SETTINGS: AmbientCampaignSettings = {
  // Animation Mode
  animationMode: 'image-transitions',
  
  // Core Atmosphere (EXACT defaults from original)
  mood: 'calm',
  theme: 'nature',
  timeContext: 'sunset',
  season: 'neutral',
  intensity: 50,
  
  // Duration & Format
  duration: '1min',
  aspectRatio: '16:9',
  language: 'en',
  
  // Image Generation
  imageModel: 'nano-banana',
  imageResolution: 'auto',
  imageStyle: 'cinematic',
  
  // Image Transitions defaults
  defaultEasingStyle: 'smooth',
  transitionStyle: 'auto',
  mediaType: 'animated',
  
  // Pacing & Segments
  pacing: DEFAULT_PACING_SETTINGS,
  
  // Loop Settings
  loops: DEFAULT_LOOP_SETTINGS,
  
  // Visual World
  visual: DEFAULT_VISUAL_SETTINGS,
  
  // Soundscape
  soundscape: DEFAULT_SOUNDSCAPE_SETTINGS,
};

// ═══════════════════════════════════════════════════════════════
// DISPLAY OPTIONS (for UI components) - EXACT FROM ORIGINAL
// ═══════════════════════════════════════════════════════════════

export const DURATION_OPTIONS: { value: AmbientDuration; label: string }[] = [
  { value: '1min', label: '1 min' },
  { value: '2min', label: '2 min' },
  { value: '4min', label: '4 min' },
  { value: '6min', label: '6 min' },
  { value: '8min', label: '8 min' },
  { value: '10min', label: '10 min' },
];

export const ASPECT_RATIO_OPTIONS: { value: AmbientAspectRatio; label: string; description: string }[] = [
  { value: '16:9', label: '16:9', description: 'YouTube, Landscape' },
  { value: '9:16', label: '9:16', description: 'TikTok, Reels, Shorts' },
  { value: '1:1', label: '1:1', description: 'Instagram Feed' },
  { value: '4:5', label: '4:5', description: 'Instagram Portrait' },
];

// MOOD OPTIONS (EXACT from original MOODS array)
export const MOOD_OPTIONS: { id: AmbientMood; label: string; description: string }[] = [
  { id: 'calm', label: 'Calm', description: 'Peaceful and serene' },
  { id: 'mysterious', label: 'Mysterious', description: 'Enigmatic and intriguing' },
  { id: 'energetic', label: 'Energetic', description: 'Dynamic and vibrant' },
  { id: 'nostalgic', label: 'Nostalgic', description: 'Wistful and sentimental' },
  { id: 'cozy', label: 'Cozy', description: 'Warm and comfortable' },
  { id: 'dark', label: 'Dark', description: 'Moody and intense' },
  { id: 'dreamy', label: 'Dreamy', description: 'Surreal and floating' },
  { id: 'ethereal', label: 'Ethereal', description: 'Otherworldly and delicate' },
];

// THEME OPTIONS (EXACT from original THEMES array)
export const THEME_OPTIONS: { id: AmbientTheme; label: string; icon: string }[] = [
  { id: 'nature', label: 'Nature', icon: 'TreePine' },
  { id: 'urban', label: 'Urban', icon: 'Building2' },
  { id: 'abstract', label: 'Abstract', icon: 'Shapes' },
  { id: 'cosmic', label: 'Cosmic', icon: 'Stars' },
  { id: 'interior', label: 'Interior', icon: 'Home' },
  { id: 'fantasy', label: 'Fantasy', icon: 'Castle' },
];

// TIME CONTEXT OPTIONS - Theme-specific (EXACT from original)
export const TIME_CONTEXT_NATURAL_OPTIONS: { id: TimeContextNatural; label: string; icon: string }[] = [
  { id: 'dawn', label: 'Dawn', icon: 'Sunrise' },
  { id: 'day', label: 'Day', icon: 'Sun' },
  { id: 'sunset', label: 'Sunset', icon: 'Sunset' },
  { id: 'night', label: 'Night', icon: 'Moon' },
  { id: 'timeless', label: 'Timeless', icon: 'Sparkles' },
];

export const TIME_CONTEXT_COSMIC_OPTIONS: { id: TimeContextCosmic; label: string; icon: string }[] = [
  { id: 'bright-nebula', label: 'Bright Nebula', icon: 'Sparkles' },
  { id: 'dark-void', label: 'Dark Void', icon: 'Moon' },
  { id: 'star-field', label: 'Star Field', icon: 'Stars' },
  { id: 'eclipse', label: 'Eclipse', icon: 'Sun' },
  { id: 'aurora', label: 'Aurora', icon: 'Sparkles' },
];

export const TIME_CONTEXT_ABSTRACT_OPTIONS: { id: TimeContextAbstract; label: string; icon: string }[] = [
  { id: 'static', label: 'Static', icon: 'Moon' },
  { id: 'flowing', label: 'Flowing', icon: 'Cloud' },
  { id: 'pulsing', label: 'Pulsing', icon: 'Sparkles' },
  { id: 'chaotic', label: 'Chaotic', icon: 'Stars' },
  { id: 'balanced', label: 'Balanced', icon: 'Sun' },
];

export const TIME_CONTEXT_INTERIOR_OPTIONS: { id: TimeContextInterior; label: string; icon: string }[] = [
  { id: 'morning-light', label: 'Morning Light', icon: 'Sunrise' },
  { id: 'afternoon', label: 'Afternoon', icon: 'Sun' },
  { id: 'golden-hour', label: 'Golden Hour', icon: 'Sunset' },
  { id: 'evening', label: 'Evening', icon: 'Moon' },
  { id: 'ambient', label: 'Ambient', icon: 'Sparkles' },
];

export const TIME_CONTEXT_FANTASY_OPTIONS: { id: TimeContextFantasy; label: string; icon: string }[] = [
  { id: 'ethereal-dawn', label: 'Ethereal Dawn', icon: 'Sunrise' },
  { id: 'mystical-day', label: 'Mystical Day', icon: 'Sparkles' },
  { id: 'enchanted-dusk', label: 'Enchanted Dusk', icon: 'Sunset' },
  { id: 'moonlit-night', label: 'Moonlit Night', icon: 'Moon' },
  { id: 'twilight', label: 'Twilight', icon: 'Stars' },
];

// SEASON OPTIONS - Theme-specific (EXACT from original)
export const SEASON_NATURAL_OPTIONS: { id: SeasonNatural; label: string; icon: string }[] = [
  { id: 'spring', label: 'Spring', icon: 'Leaf' },
  { id: 'summer', label: 'Summer', icon: 'Sun' },
  { id: 'autumn', label: 'Autumn', icon: 'Leaf' },
  { id: 'winter', label: 'Winter', icon: 'Snowflake' },
  { id: 'rainy', label: 'Rainy', icon: 'CloudRain' },
  { id: 'snowy', label: 'Snowy', icon: 'Snowflake' },
  { id: 'foggy', label: 'Foggy', icon: 'CloudFog' },
  { id: 'neutral', label: 'Neutral', icon: 'Cloud' },
];

export const SEASON_COSMIC_OPTIONS: { id: SeasonCosmic; label: string; icon: string }[] = [
  { id: 'sparse', label: 'Sparse', icon: 'Stars' },
  { id: 'moderate', label: 'Moderate', icon: 'Sparkles' },
  { id: 'dense', label: 'Dense', icon: 'Cloud' },
  { id: 'nebulous', label: 'Nebulous', icon: 'CloudFog' },
  { id: 'energetic', label: 'Energetic', icon: 'Sparkles' },
  { id: 'calm', label: 'Calm', icon: 'Moon' },
];

export const SEASON_ABSTRACT_OPTIONS: { id: SeasonAbstract; label: string; icon: string }[] = [
  { id: 'minimal', label: 'Minimal', icon: 'Moon' },
  { id: 'moderate', label: 'Moderate', icon: 'Cloud' },
  { id: 'complex', label: 'Complex', icon: 'Shapes' },
  { id: 'intense', label: 'Intense', icon: 'Sparkles' },
  { id: 'layered', label: 'Layered', icon: 'CloudFog' },
];

export const SEASON_INTERIOR_OPTIONS: { id: SeasonInterior; label: string; icon: string }[] = [
  { id: 'warm-cozy', label: 'Warm & Cozy', icon: 'Home' },
  { id: 'cool-fresh', label: 'Cool & Fresh', icon: 'Snowflake' },
  { id: 'natural-light', label: 'Natural Light', icon: 'Sun' },
  { id: 'dim-moody', label: 'Dim & Moody', icon: 'Moon' },
  { id: 'bright-airy', label: 'Bright & Airy', icon: 'Cloud' },
];

export const SEASON_FANTASY_OPTIONS: { id: SeasonFantasy; label: string; icon: string }[] = [
  { id: 'magical-bloom', label: 'Magical Bloom', icon: 'Sparkles' },
  { id: 'mystical-mist', label: 'Mystical Mist', icon: 'CloudFog' },
  { id: 'enchanted-frost', label: 'Enchanted Frost', icon: 'Snowflake' },
  { id: 'fairy-lights', label: 'Fairy Lights', icon: 'Stars' },
  { id: 'elemental', label: 'Elemental', icon: 'Cloud' },
];

// Helper functions to get theme-specific options
export function getTimeContextOptions(theme: AmbientTheme) {
  switch (theme) {
    case 'cosmic':
      return TIME_CONTEXT_COSMIC_OPTIONS;
    case 'abstract':
      return TIME_CONTEXT_ABSTRACT_OPTIONS;
    case 'interior':
      return TIME_CONTEXT_INTERIOR_OPTIONS;
    case 'fantasy':
      return TIME_CONTEXT_FANTASY_OPTIONS;
    case 'nature':
    case 'urban':
    default:
      return TIME_CONTEXT_NATURAL_OPTIONS;
  }
}

export function getSeasonOptions(theme: AmbientTheme) {
  switch (theme) {
    case 'cosmic':
      return SEASON_COSMIC_OPTIONS;
    case 'abstract':
      return SEASON_ABSTRACT_OPTIONS;
    case 'interior':
      return SEASON_INTERIOR_OPTIONS;
    case 'fantasy':
      return SEASON_FANTASY_OPTIONS;
    case 'nature':
    case 'urban':
    default:
      return SEASON_NATURAL_OPTIONS;
  }
}

export function getTimeContextLabel(theme: AmbientTheme): string {
  switch (theme) {
    case 'cosmic':
      return 'Space Lighting';
    case 'abstract':
      return 'Energy State';
    case 'interior':
      return 'Lighting';
    case 'fantasy':
      return 'Magical Time';
    case 'nature':
    case 'urban':
    default:
      return 'Time of Day';
  }
}

export function getSeasonLabel(theme: AmbientTheme): string {
  switch (theme) {
    case 'cosmic':
      return 'Space Density';
    case 'abstract':
      return 'Complexity Level';
    case 'interior':
      return 'Ambiance';
    case 'fantasy':
      return 'Magical Condition';
    case 'nature':
    case 'urban':
    default:
      return 'Season / Weather';
  }
}

// Art Style Options (EXACT from original visual-world-tab ART_STYLES)
export const ART_STYLE_OPTIONS: { value: AmbientArtStyle; label: string; description: string }[] = [
  { value: 'cinematic', label: 'Cinematic', description: 'Film-quality realism' },
  { value: 'anime', label: 'Anime', description: 'Japanese animation style' },
  { value: 'illustrated', label: 'Illustrated', description: 'Digital art look' },
  { value: 'realistic', label: 'Realistic', description: 'Photo-realistic' },
  { value: 'abstract', label: 'Abstract', description: 'Non-representational' },
  { value: 'painterly', label: 'Painterly', description: 'Oil painting texture' },
  { value: 'watercolor', label: 'Watercolor', description: 'Soft, flowing edges' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean and simple' },
  { value: 'other', label: 'Other', description: 'Custom style' },
];

// Key Visual Elements (EXACT from original visual-world-tab VISUAL_ELEMENTS) — max 5 selectable
export const VISUAL_ELEMENT_OPTIONS: string[] = [
  'Mountains', 'Ocean', 'Forest', 'City Lights', 'Stars', 'Rain',
  'Fireplace', 'Clouds', 'Waves', 'Snow', 'Aurora', 'Fog',
  'Flowers', 'Desert', 'Lake', 'Waterfall', 'Sunset Sky', 'Neon Signs',
];

// Visual Rhythm Options (EXACT from original visual-world-tab VISUAL_RHYTHMS)
export const VISUAL_RHYTHM_OPTIONS: { value: AmbientVisualRhythm; label: string; description: string }[] = [
  { value: 'constant', label: 'Constant Calm', description: 'Steady, unchanging pace' },
  { value: 'breathing', label: 'Breathing', description: 'Subtle rhythmic pulse' },
  { value: 'building', label: 'Building', description: 'Gradually intensifying' },
  { value: 'wave', label: 'Wave', description: 'Rising and falling' },
];

export const IMAGE_STYLE_OPTIONS: { value: AmbientImageStyle; label: string }[] = [
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'artistic', label: 'Artistic' },
  { value: 'anime', label: 'Anime' },
  { value: 'illustration', label: 'Illustration' },
  { value: 'abstract', label: 'Abstract' },
  { value: '3d-render', label: '3D Render' },
];

export const TRANSITION_OPTIONS: { value: AmbientTransitionStyle; label: string; description: string }[] = [
  { value: 'auto', label: 'Auto', description: 'AI selects best transition per scene' },
  { value: 'crossfade', label: 'Smooth Crossfade', description: 'Gentle blend between scenes' },
  { value: 'dissolve', label: 'Slow Dissolve', description: 'Gradual fade transition' },
  { value: 'drift', label: 'Drift', description: 'Floating motion blend' },
  { value: 'match-cut', label: 'Match Cut', description: 'Seamless visual continuity' },
  { value: 'morph', label: 'Morph', description: 'Shape transformation' },
  { value: 'wipe', label: 'Soft Wipe', description: 'Directional reveal' },
];

export const EASING_STYLE_OPTIONS: { value: AmbientEasingStyle; label: string }[] = [
  { value: 'smooth', label: 'Smooth' },
  { value: 'linear', label: 'Linear' },
  { value: 'ease-in-out', label: 'Ease In-Out' },
  { value: 'cinematic', label: 'Cinematic' },
];

export const LOOP_TYPE_OPTIONS: { value: LoopType; label: string; description: string }[] = [
  { value: 'seamless', label: 'Seamless', description: 'Smooth continuous loop' },
  { value: 'fade', label: 'Fade', description: 'Fade out and back in' },
  { value: 'hard-cut', label: 'Hard Cut', description: 'Instant jump to start' },
];

export const ANIMATION_MODE_OPTIONS: { value: AnimationMode; label: string; description: string }[] = [
  { value: 'image-transitions', label: 'Image Transitions', description: 'Ken Burns style with smooth transitions' },
  { value: 'video-animation', label: 'Video Animation', description: 'AI-generated motion from keyframes' },
];

export const VIDEO_GENERATION_MODE_OPTIONS: { value: VideoGenerationMode; label: string; description: string }[] = [
  { value: 'image-reference', label: 'Image Reference', description: 'Single keyframe animation' },
  { value: 'start-end-frame', label: 'Start-End Frame', description: 'Two-frame interpolation' },
];

export const MUSIC_STYLE_OPTIONS: { value: AmbientMusicStyle; label: string }[] = [
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'upbeat', label: 'Upbeat' },
  { value: 'calm', label: 'Calm' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'electronic', label: 'Electronic' },
  { value: 'emotional', label: 'Emotional' },
  { value: 'inspiring', label: 'Inspiring' },
];

export const AMBIENT_SOUND_OPTIONS: { value: AmbientSoundType; label: string; emoji: string }[] = [
  { value: 'rain', label: 'Rain', emoji: '🌧️' },
  { value: 'forest', label: 'Forest', emoji: '🌲' },
  { value: 'ocean', label: 'Ocean Waves', emoji: '🌊' },
  { value: 'fireplace', label: 'Fireplace', emoji: '🔥' },
  { value: 'wind', label: 'Wind', emoji: '💨' },
  { value: 'birds', label: 'Birds Chirping', emoji: '🐦' },
  { value: 'thunder', label: 'Thunder', emoji: '⛈️' },
  { value: 'city', label: 'City Ambience', emoji: '🏙️' },
  { value: 'cafe', label: 'Cafe', emoji: '☕' },
  { value: 'stream', label: 'Stream', emoji: '🏞️' },
];

export const TEXT_OVERLAY_STYLE_OPTIONS: { value: AmbientTextOverlayStyle; label: string; description: string }[] = [
  { value: 'modern', label: 'Modern', description: 'Clean, minimal sans-serif' },
  { value: 'cinematic', label: 'Cinematic', description: 'Elegant, film-style' },
  { value: 'bold', label: 'Bold', description: 'Strong, attention-grabbing' },
];

export const LANGUAGE_OPTIONS: { value: AmbientLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
];
