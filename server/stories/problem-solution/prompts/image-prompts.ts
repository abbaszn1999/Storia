/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * IMAGE GENERATION PROMPTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This module enhances image prompts with style-specific modifiers
 * and quality keywords for optimal AI image generation.
 * 
 * NO negative prompts - many models don't support them.
 */

import type { ImageStyle } from '../types';

/**
 * Style-specific quality modifiers
 * Each style has its own set of keywords that enhance the output
 */
const STYLE_MODIFIERS: Record<ImageStyle, {
  quality: string[];
  composition: string[];
  lighting: string[];
}> = {
  'photorealistic': {
    quality: ['photorealistic', 'ultra detailed', '8k UHD', 'DSLR quality', 'sharp focus', 'high resolution'],
    composition: ['professional photography', 'rule of thirds', 'depth of field'],
    lighting: ['natural lighting', 'golden hour', 'soft shadows', 'realistic lighting'],
  },
  'cinematic': {
    quality: ['cinematic', 'film grain', 'movie still', '35mm film', 'anamorphic'],
    composition: ['wide shot', 'dramatic composition', 'epic scale', 'movie scene'],
    lighting: ['dramatic lighting', 'volumetric light', 'rim lighting', 'cinematic color grading'],
  },
  '3d-render': {
    quality: ['3D render', 'CGI', 'Octane render', 'Blender', 'ray tracing', 'highly detailed'],
    composition: ['studio lighting', 'product shot', 'clean background'],
    lighting: ['volumetric lighting', 'ambient occlusion', 'global illumination', 'subsurface scattering'],
  },
  'digital-art': {
    quality: ['digital art', 'digital painting', 'concept art', 'ArtStation trending', 'highly detailed'],
    composition: ['vibrant colors', 'dynamic composition', 'artistic'],
    lighting: ['dramatic lighting', 'fantasy lighting', 'glowing effects'],
  },
  'anime': {
    quality: ['anime style', 'anime art', 'manga style', 'Japanese animation', 'cel shading'],
    composition: ['dynamic pose', 'expressive', 'vibrant colors', 'clean lines'],
    lighting: ['anime lighting', 'soft shading', 'bright colors'],
  },
  'illustration': {
    quality: ['illustration', 'hand-drawn', 'editorial illustration', 'book illustration', 'detailed linework'],
    composition: ['artistic composition', 'storybook style', 'whimsical'],
    lighting: ['soft lighting', 'watercolor lighting', 'gentle shadows'],
  },
  'watercolor': {
    quality: ['watercolor painting', 'watercolor art', 'traditional media', 'paint texture'],
    composition: ['soft edges', 'flowing colors', 'artistic', 'delicate'],
    lighting: ['soft lighting', 'pastel tones', 'ethereal', 'dreamy atmosphere'],
  },
  'minimalist': {
    quality: ['minimalist', 'clean design', 'simple', 'modern', 'flat design'],
    composition: ['geometric shapes', 'white space', 'balanced', 'elegant'],
    lighting: ['even lighting', 'soft shadows', 'clean', 'professional'],
  },
};

/**
 * Aspect ratio composition guidance
 */
const ASPECT_RATIO_GUIDANCE: Record<string, string> = {
  '9:16': 'vertical composition, subject centered, mobile-optimized framing',
  '16:9': 'cinematic wide shot, horizontal composition, rule of thirds',
  '1:1': 'centered composition, balanced framing, symmetrical',
  '4:5': 'portrait composition, subject prominent, vertical emphasis',
};

/**
 * Build character consistency suffix for maintaining visual continuity
 */
export function buildConsistencySuffix(): string {
  return ', maintaining consistent character appearance, same person, identical features, visual continuity';
}

/**
 * Enhance image prompt with style-specific modifiers
 * 
 * @param prompt - Original image prompt from storyboard-enhancer
 * @param aspectRatio - Target aspect ratio
 * @param imageStyle - Selected visual style
 * @param isFirstScene - Whether this is the reference scene
 * @returns Enhanced prompt optimized for AI image generation
 */
export function enhanceImagePrompt(
  prompt: string,
  aspectRatio: string,
  imageStyle: ImageStyle,
  isFirstScene: boolean
): string {
  let enhanced = prompt.trim();
  
  // Get style-specific modifiers
  const modifiers = STYLE_MODIFIERS[imageStyle] || STYLE_MODIFIERS['photorealistic'];
  
  // Build modifier string
  const allModifiers = [
    ...modifiers.quality.slice(0, 3),      // Top 3 quality modifiers
    ...modifiers.composition.slice(0, 2),   // Top 2 composition modifiers
    ...modifiers.lighting.slice(0, 2),      // Top 2 lighting modifiers
  ];
  
  // Add aspect ratio guidance
  const aspectGuidance = ASPECT_RATIO_GUIDANCE[aspectRatio] || '';
  
  // Build final prompt
  // Structure: [Original Prompt], [Style Modifiers], [Aspect Guidance]
  enhanced = `${enhanced}, ${allModifiers.join(', ')}`;
  
  if (aspectGuidance) {
    enhanced += `, ${aspectGuidance}`;
  }
  
  // Add consistency suffix for non-first scenes
  if (!isFirstScene) {
    enhanced += buildConsistencySuffix();
  }
  
  return enhanced;
}

/**
 * Get style modifiers for a specific style
 * Useful for debugging or displaying in UI
 */
export function getStyleModifiers(imageStyle: ImageStyle): {
  quality: string[];
  composition: string[];
  lighting: string[];
} {
  return STYLE_MODIFIERS[imageStyle] || STYLE_MODIFIERS['photorealistic'];
}
