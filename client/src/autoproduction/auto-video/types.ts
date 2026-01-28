/**
 * Auto Video Types
 * 
 * General type definitions for video mode selection.
 * Mode-specific types are in their respective mode folders.
 */

// Video modes available in Auto Video
export type VideoMode = 'ambient' | 'narrative' | 'vlog' | 'commerce' | 'logo' | 'podcast';

// Video mode configuration
export interface VideoModeConfig {
  id: VideoMode;
  title: string;
  description: string;
  icon: string;
  available: boolean;
  iconColor: string;
}

// All video modes with their configuration
export const VIDEO_MODES: VideoModeConfig[] = [
  {
    id: 'ambient',
    title: 'Ambient Visual',
    description: 'Mood-driven visual storytelling with atmospheric scenes',
    icon: 'Sparkles',
    available: true,
    iconColor: 'text-indigo-500',
  },
  {
    id: 'narrative',
    title: 'Narrative Video',
    description: 'Create story-driven videos from script to storyboard',
    icon: 'Video',
    available: false,
    iconColor: 'text-blue-500',
  },
  {
    id: 'vlog',
    title: 'Character Vlog',
    description: 'Create story-driven videos starring a single character',
    icon: 'MessageSquare',
    available: false,
    iconColor: 'text-purple-500',
  },
  {
    id: 'commerce',
    title: 'Social Commerce',
    description: 'Product showcase and promotional videos',
    icon: 'ShoppingBag',
    available: false,
    iconColor: 'text-orange-500',
  },
  {
    id: 'logo',
    title: 'Logo Animation',
    description: 'Brand storytelling through motion',
    icon: 'Clapperboard',
    available: false,
    iconColor: 'text-violet-500',
  },
  {
    id: 'podcast',
    title: 'Video Podcast',
    description: 'Conversation-style content creation',
    icon: 'Mic',
    available: false,
    iconColor: 'text-gray-400',
  },
];
