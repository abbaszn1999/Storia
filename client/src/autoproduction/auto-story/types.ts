// Story Template types
export type StoryTemplate = 
  | 'problem-solution'
  | 'tease-reveal'
  | 'before-after'
  | 'myth-busting'
  | 'auto-asmr'  // Future
  | 'asmr';      // Future

export type TemplateType = 'narrative' | 'auto-asmr' | 'asmr';

// Template structure
export interface TemplateStructure {
  id: StoryTemplate;
  name: string;
  description: string;
  duration: string; // "30-60s"
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'Marketing' | 'Educational' | 'Entertainment';
  structure: string; // "Hook → Problem → Solution → CTA"
  icon: any;
  color: string;
  available: boolean;
}

// Template configuration for each story type
export const STORY_TEMPLATES: TemplateStructure[] = [
  {
    id: 'problem-solution',
    name: 'Problem-Solution',
    description: 'Present a problem and show how your product/idea solves it perfectly',
    duration: '30-60s',
    difficulty: 'beginner',
    category: 'Marketing',
    structure: 'Hook → Problem → Solution → Call-to-Action',
    icon: 'Lightbulb',
    color: 'orange',
    available: true,
  },
  {
    id: 'tease-reveal',
    name: 'Tease & Reveal',
    description: 'Build curiosity with a teaser, then reveal the answer or solution',
    duration: '15-45s',
    difficulty: 'intermediate',
    category: 'Marketing',
    structure: 'Hook → Tease → Buildup → Reveal',
    icon: 'Star',
    color: 'purple',
    available: true,
  },
  {
    id: 'before-after',
    name: 'Before & After',
    description: 'Showcase a transformation. Great for tutorials or demonstrations',
    duration: '30-90s',
    difficulty: 'beginner',
    category: 'Educational',
    structure: 'Before State → Transformation → After State → Results',
    icon: 'RefreshCw',
    color: 'blue',
    available: true,
  },
  {
    id: 'myth-busting',
    name: 'Myth-Busting',
    description: 'Address a common misconception and reveal the truth with facts',
    duration: '30-60s',
    difficulty: 'intermediate',
    category: 'Educational',
    structure: 'Common Myth → Why It\'s Wrong → The Truth → Takeaway',
    icon: 'AlertCircle',
    color: 'red',
    available: true,
  },
  {
    id: 'auto-asmr',
    name: 'Auto ASMR',
    description: 'Automated ASMR content generation with AI',
    duration: '30-120s',
    difficulty: 'beginner',
    category: 'Entertainment',
    structure: 'Visual Prompt → Sound Design → Composition',
    icon: 'Volume2',
    color: 'green',
    available: false, // Future
  },
  {
    id: 'asmr',
    name: 'ASMR',
    description: 'Manual ASMR creation with detailed controls',
    duration: '60-300s',
    difficulty: 'advanced',
    category: 'Entertainment',
    structure: 'Scene Design → Sound Layers → Final Mix',
    icon: 'Headphones',
    color: 'teal',
    available: false, // Future
  },
];

// Platform info for aspect ratios
export const ASPECT_RATIO_PLATFORMS: Record<string, string[]> = {
  '9:16': ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'Facebook Reels'],
  '16:9': ['YouTube', 'Facebook'],
  '1:1': ['Instagram Feed', 'Facebook'],
  '4:5': ['Instagram Posts'],
};

// Pacing options
export const PACING_OPTIONS = [
  { value: 'slow', label: 'Slow', emoji: '🐢', description: 'Relaxed narration' },
  { value: 'medium', label: 'Medium', emoji: '⚡', description: 'Standard pace' },
  { value: 'fast', label: 'Fast', emoji: '🚀', description: 'Quick delivery' },
] as const;

// Text overlay styles
export const TEXT_OVERLAY_STYLES = [
  { value: 'modern', label: 'Modern', description: 'Clean, minimal' },
  { value: 'cinematic', label: 'Cinematic', description: 'Film-style' },
  { value: 'bold', label: 'Bold', description: 'High contrast' },
] as const;

// Story settings
export interface StorySettings {
  // Content
  template: StoryTemplate;
  topics: string[]; // 10 topics
  
  // Technical
  duration: 30 | 45 | 60 | 90;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
  language: string;
  
  // Pacing & Text Overlay
  pacing: 'slow' | 'medium' | 'fast';
  textOverlayEnabled: boolean;
  textOverlayStyle: 'modern' | 'cinematic' | 'bold';
  
  // Visual Style
  imageStyle: 'photorealistic' | 'cinematic' | '3d-render' | 'digital-art' | 'anime' | 'illustration' | 'watercolor' | 'minimalist';
  imageModel: string;
  videoModel?: string;
  mediaType: 'static' | 'animated';
  transitionStyle?: string; // if static
  
  // Resolutions
  imageResolution: string;  // "1k", "2k", "4k"
  videoResolution?: string; // "480p", "720p", "1080p", etc.
  
  // Reference Images (Optional)
  styleReferenceUrl?: string;
  characterReferenceUrl?: string;
  
  // Audio Style
  hasVoiceover: boolean;
  voiceProfile?: string;
  voiceVolume: number;
  backgroundMusic?: string;
  musicVolume: number;
}
