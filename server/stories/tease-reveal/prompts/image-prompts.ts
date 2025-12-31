/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * IMAGE GENERATION PROMPTS - TEASE-REVEAL
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This module enhances image prompts with style-specific modifiers,
 * quality keywords, and advanced prompt engineering techniques for optimal
 * AI image generation results.
 * 
 * SPECIAL FOCUS: Tease-reveal stories require visuals that build curiosity
 * and suspense. Early scenes may use partial reveals or mysterious elements,
 * while final scenes deliver satisfying visual payoffs.
 * 
 * PROMPT ENGINEERING BEST PRACTICES:
 * - Weighted keywords: Use parentheses for emphasis (keyword) = 1.1x, ((keyword)) = 1.21x
 * - Quality boosters: Technical terms that improve output quality
 * - Style consistency: Maintain visual coherence across scenes
 * - Aspect ratio optimization: Composition guidance for different formats
 * 
 * NOTE: Negative prompts are not used as many models don't support them.
 * Instead, we use positive reinforcement and specific style keywords.
 */

import type { ImageStyle } from '../../shared/types';

/**
 * Style-specific quality modifiers
 * Each style has its own set of keywords that enhance the output
 * 
 * STRUCTURE:
 * - quality: Technical quality keywords (resolution, detail, sharpness)
 * - composition: Framing and layout guidance
 * - lighting: Lighting style and mood
 * - boosters: Advanced quality enhancers (weighted keywords)
 */
const STYLE_MODIFIERS: Record<ImageStyle, {
  quality: string[];
  composition: string[];
  lighting: string[];
  boosters: string[]; // Advanced quality enhancers
}> = {
  'photorealistic': {
    quality: ['photorealistic', 'ultra detailed', '8k UHD', 'DSLR quality', 'sharp focus', 'high resolution', 'masterpiece'],
    composition: ['professional photography', 'rule of thirds', 'depth of field', 'perfect composition'],
    lighting: ['natural lighting', 'golden hour', 'soft shadows', 'realistic lighting', 'professional lighting'],
    boosters: ['((best quality))', '((ultra detailed))', '((sharp focus))', 'masterpiece', 'professional'],
  },
  'cinematic': {
    quality: ['cinematic', 'film grain', 'movie still', '35mm film', 'anamorphic', 'cinematic quality'],
    composition: ['wide shot', 'dramatic composition', 'epic scale', 'movie scene', 'cinematic framing'],
    lighting: ['dramatic lighting', 'volumetric light', 'rim lighting', 'cinematic color grading', 'theatrical lighting'],
    boosters: ['((cinematic))', '((film quality))', '((dramatic))', 'masterpiece', 'award-winning'],
  },
  '3d-render': {
    quality: ['3D render', 'CGI', 'Octane render', 'Blender', 'ray tracing', 'highly detailed', 'studio quality'],
    composition: ['studio lighting', 'product shot', 'clean background', 'professional composition'],
    lighting: ['volumetric lighting', 'ambient occlusion', 'global illumination', 'subsurface scattering', 'PBR materials'],
    boosters: ['((CGI quality))', '((3D render))', '((ray tracing))', 'studio quality', 'professional'],
  },
  'digital-art': {
    quality: ['digital art', 'digital painting', 'concept art', 'ArtStation trending', 'highly detailed', 'masterpiece'],
    composition: ['vibrant colors', 'dynamic composition', 'artistic', 'professional composition'],
    lighting: ['dramatic lighting', 'fantasy lighting', 'glowing effects', 'atmospheric lighting'],
    boosters: ['((digital art))', '((concept art))', '((ArtStation quality))', 'masterpiece', 'trending'],
  },
  'anime': {
    quality: ['anime style', 'anime art', 'manga style', 'Japanese animation', 'cel shading', 'high quality'],
    composition: ['dynamic pose', 'expressive', 'vibrant colors', 'clean lines', 'anime composition'],
    lighting: ['anime lighting', 'soft shading', 'bright colors', 'cel shading', 'anime style lighting'],
    boosters: ['((anime style))', '((manga style))', '((cel shading))', 'high quality', 'professional'],
  },
  'illustration': {
    quality: ['illustration', 'hand-drawn', 'editorial illustration', 'book illustration', 'detailed linework', 'professional'],
    composition: ['artistic composition', 'storybook style', 'whimsical', 'editorial layout'],
    lighting: ['soft lighting', 'watercolor lighting', 'gentle shadows', 'illustration lighting'],
    boosters: ['((illustration))', '((hand-drawn))', '((editorial quality))', 'professional', 'masterpiece'],
  },
  'watercolor': {
    quality: ['watercolor painting', 'watercolor art', 'traditional media', 'paint texture', 'artistic quality'],
    composition: ['soft edges', 'flowing colors', 'artistic', 'delicate', 'watercolor composition'],
    lighting: ['soft lighting', 'pastel tones', 'ethereal', 'dreamy atmosphere', 'watercolor lighting'],
    boosters: ['((watercolor))', '((traditional media))', '((artistic))', 'masterpiece', 'professional'],
  },
  'minimalist': {
    quality: ['minimalist', 'clean design', 'simple', 'modern', 'flat design', 'professional'],
    composition: ['geometric shapes', 'white space', 'balanced', 'elegant', 'minimalist composition'],
    lighting: ['even lighting', 'soft shadows', 'clean', 'professional', 'minimalist lighting'],
    boosters: ['((minimalist))', '((clean design))', '((modern))', 'professional', 'elegant'],
  },
};

/**
 * Aspect ratio composition guidance
 * Optimized for each format's strengths and platform requirements
 */
const ASPECT_RATIO_GUIDANCE: Record<string, {
  composition: string;
  framing: string;
  focus: string;
}> = {
  '9:16': {
    composition: 'vertical composition, portrait orientation, mobile-optimized',
    framing: 'subject centered vertically, full-body or upper-body framing',
    focus: 'vertical storytelling, TikTok/Reels format, eye-level camera',
  },
  '16:9': {
    composition: 'cinematic wide shot, horizontal composition, rule of thirds',
    framing: 'wide framing, landscape orientation, cinematic aspect ratio',
    focus: 'YouTube format, cinematic storytelling, horizontal movement',
  },
  '1:1': {
    composition: 'centered composition, balanced framing, symmetrical layout',
    framing: 'square format, Instagram feed optimized, centered subject',
    focus: 'Instagram format, balanced visual weight, symmetrical design',
  },
  '4:5': {
    composition: 'portrait composition, subject prominent, vertical emphasis',
    framing: 'slightly vertical, Instagram portrait, subject-focused',
    focus: 'Instagram feed posts, portrait storytelling, vertical emphasis',
  },
};

/**
 * Build character consistency suffix for maintaining visual continuity
 * Uses weighted keywords to emphasize consistency
 */
export function buildConsistencySuffix(): string {
  return ', ((same person)), ((identical features)), ((consistent appearance)), maintaining visual continuity, character consistency';
}

/**
 * Build quality boosters string
 * Adds weighted keywords for enhanced quality
 */
function buildQualityBoosters(imageStyle: ImageStyle): string {
  const modifiers = STYLE_MODIFIERS[imageStyle] || STYLE_MODIFIERS['photorealistic'];
  // Use top 2-3 boosters with weighted emphasis
  const boosters = modifiers.boosters.slice(0, 3);
  return boosters.join(', ');
}

/**
 * Enhance image prompt with style-specific modifiers and advanced techniques
 * 
 * PROMPT STRUCTURE (optimized order):
 * 1. Original prompt (from storyboard-enhancer)
 * 2. Quality boosters (weighted keywords for emphasis)
 * 3. Style modifiers (quality, composition, lighting)
 * 4. Aspect ratio guidance (composition, framing, focus)
 * 5. Consistency suffix (for non-first scenes)
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
  // Start with original prompt (already well-crafted by storyboard-enhancer)
  let enhanced = prompt.trim();
  
  // Get style-specific modifiers
  const modifiers = STYLE_MODIFIERS[imageStyle] || STYLE_MODIFIERS['photorealistic'];
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: Add quality boosters (weighted keywords for emphasis)
  // ═══════════════════════════════════════════════════════════════════════════
  const qualityBoosters = buildQualityBoosters(imageStyle);
  if (qualityBoosters) {
    enhanced += `, ${qualityBoosters}`;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: Add style-specific modifiers
  // ═══════════════════════════════════════════════════════════════════════════
  // Select top modifiers (avoid redundancy with original prompt)
  const styleModifiers = [
    ...modifiers.quality.slice(0, 2),      // Top 2 quality (avoid overloading)
    ...modifiers.composition.slice(0, 2), // Top 2 composition
    ...modifiers.lighting.slice(0, 2),    // Top 2 lighting
  ];
  
  if (styleModifiers.length > 0) {
    enhanced += `, ${styleModifiers.join(', ')}`;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: Add aspect ratio guidance
  // ═══════════════════════════════════════════════════════════════════════════
  const aspectGuidance = ASPECT_RATIO_GUIDANCE[aspectRatio];
  if (aspectGuidance) {
    // Add composition, framing, and focus guidance
    enhanced += `, ${aspectGuidance.composition}, ${aspectGuidance.framing}, ${aspectGuidance.focus}`;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4: Add consistency suffix for non-first scenes
  // ═══════════════════════════════════════════════════════════════════════════
  if (!isFirstScene) {
    enhanced += buildConsistencySuffix();
  }
  
  return enhanced.trim();
}

/**
 * Get style modifiers for a specific style
 * Useful for debugging or displaying in UI
 */
export function getStyleModifiers(imageStyle: ImageStyle): {
  quality: string[];
  composition: string[];
  lighting: string[];
  boosters: string[];
} {
  return STYLE_MODIFIERS[imageStyle] || STYLE_MODIFIERS['photorealistic'];
}

/**
 * Get aspect ratio guidance for a specific aspect ratio
 * Useful for debugging or displaying in UI
 */
export function getAspectRatioGuidance(aspectRatio: string): {
  composition: string;
  framing: string;
  focus: string;
} | null {
  return ASPECT_RATIO_GUIDANCE[aspectRatio] || null;
}
