/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AMBIENT VISUAL - ATMOSPHERE PHASE PROMPTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Prompts for generating mood descriptions for ambient visual content.
 * Creates evocative, atmospheric descriptions that guide visual generation.
 */

import type { MoodDescriptionGeneratorInput } from '../types';

/**
 * System prompt for the mood description generator.
 * Instructs the AI to create atmospheric, evocative descriptions.
 */
export const MOOD_DESCRIPTION_SYSTEM_PROMPT = `
You are an expert in crafting atmospheric mood descriptions for ambient visual content.
Your descriptions should evoke the emotional and sensory experience of the visual journey.

═══════════════════════════════════════════════════════════════════════════════
YOUR ROLE
═══════════════════════════════════════════════════════════════════════════════

You create mood descriptions for long-form ambient videos used for:
• Meditation and mindfulness
• Focus and productivity backgrounds
• Relaxation and sleep
• Atmospheric ambiance

═══════════════════════════════════════════════════════════════════════════════
WRITING GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

Your descriptions should:
• Capture the emotional essence and atmosphere
• Paint a vivid sensory picture (visual, auditory, tactile)
• Guide the visual generation in later steps
• Be concise but evocative (2-4 paragraphs)
• Use present tense for immediacy
• Avoid clichés and generic phrases

Focus on:
• Color palettes and light qualities
• Movement and rhythm (matching loop settings)
• Textures and materials
• Ambient sounds implied by the scene
• Emotional journey through the duration

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY the mood description text.
No headers, labels, or formatting markers.
Just flowing, evocative prose that sets the visual tone.
`;

/**
 * Get human-readable labels for theme-specific time contexts
 */
function getTimeContextLabel(theme: string, timeContext: string): string {
  const labels: Record<string, Record<string, string>> = {
    nature: {
      dawn: 'the gentle break of dawn',
      day: 'bright daylight',
      sunset: 'golden sunset',
      night: 'peaceful night',
      timeless: 'a timeless moment',
    },
    urban: {
      dawn: 'early morning city awakening',
      day: 'bustling daytime',
      sunset: 'urban golden hour',
      night: 'city nightscape',
      timeless: 'an eternal urban moment',
    },
    cosmic: {
      'bright-nebula': 'luminous nebula clouds',
      'dark-void': 'deep cosmic void',
      'star-field': 'infinite star fields',
      eclipse: 'celestial eclipse',
      aurora: 'cosmic aurora',
    },
    abstract: {
      static: 'still energy',
      flowing: 'flowing motion',
      pulsing: 'rhythmic pulses',
      chaotic: 'chaotic energy',
      balanced: 'harmonious balance',
    },
    interior: {
      'morning-light': 'soft morning light',
      afternoon: 'warm afternoon glow',
      'golden-hour': 'golden hour radiance',
      evening: 'calm evening ambiance',
      ambient: 'ambient lighting',
    },
    fantasy: {
      'ethereal-dawn': 'ethereal dawn',
      'mystical-day': 'mystical daylight',
      'enchanted-dusk': 'enchanted dusk',
      'moonlit-night': 'moonlit night',
      twilight: 'magical twilight',
    },
  };

  return labels[theme]?.[timeContext] || timeContext;
}

/**
 * Get human-readable labels for theme-specific seasons
 */
function getSeasonLabel(theme: string, season: string): string {
  const labels: Record<string, Record<string, string>> = {
    nature: {
      spring: 'spring renewal',
      summer: 'summer warmth',
      autumn: 'autumn colors',
      winter: 'winter stillness',
      rainy: 'gentle rain',
      snowy: 'falling snow',
      foggy: 'misty fog',
      neutral: 'timeless weather',
    },
    urban: {
      spring: 'spring in the city',
      summer: 'urban summer',
      autumn: 'fall cityscape',
      winter: 'winter streets',
      rainy: 'rain-slicked streets',
      snowy: 'snow-covered city',
      foggy: 'foggy urban landscape',
      neutral: 'clear urban day',
    },
    cosmic: {
      sparse: 'sparse stellar density',
      moderate: 'moderate cosmic activity',
      dense: 'dense star clusters',
      nebulous: 'nebulous formations',
      energetic: 'energetic cosmic events',
      calm: 'calm cosmic expanse',
    },
    abstract: {
      minimal: 'minimalist forms',
      moderate: 'balanced complexity',
      complex: 'intricate patterns',
      intense: 'intense visual energy',
      layered: 'layered depth',
    },
    interior: {
      'warm-cozy': 'warm and cozy atmosphere',
      'cool-fresh': 'cool and fresh feeling',
      'natural-light': 'natural daylight',
      'dim-moody': 'dim and moody setting',
      'bright-airy': 'bright and airy space',
    },
    fantasy: {
      'magical-bloom': 'magical blooming',
      'mystical-mist': 'mystical mist',
      'enchanted-frost': 'enchanted frost',
      'fairy-lights': 'dancing fairy lights',
      elemental: 'elemental forces',
    },
  };

  return labels[theme]?.[season] || season;
}

/**
 * Get duration description for context
 */
function getDurationContext(duration: string): string {
  const contexts: Record<string, string> = {
    '1min': 'a brief 1-minute journey',
    '2min': 'a 2-minute meditation',
    '4min': 'a 4-minute experience',
    '6min': 'a 6-minute immersion',
    '8min': 'an 8-minute ambient journey',
    '10min': 'a 10-minute ambient experience',
  };
  return contexts[duration] || duration;
}

/**
 * Get loop context for the description
 */
function getLoopContext(input: MoodDescriptionGeneratorInput): string {
  if (!input.loopMode) {
    return 'linear progression';
  }

  const loopDescriptions: Record<string, string> = {
    seamless: 'seamlessly cycling',
    fade: 'gently fading between loops',
    'hard-cut': 'distinct loop points',
  };

  let context = loopDescriptions[input.loopType] || 'looping';

  if (input.segmentLoopEnabled) {
    context += ' with repeating segments';
  }
  if (input.shotLoopEnabled) {
    context += ' and recurring motifs';
  }

  return context;
}

/**
 * Get animation mode context
 */
function getAnimationContext(input: MoodDescriptionGeneratorInput): string {
  if (input.animationMode === 'image-transitions') {
    return 'smooth transitions between contemplative scenes';
  }
  
  if (input.videoGenerationMode === 'start-end-frame') {
    return 'fluid AI-generated motion with connected visual sequences';
  }
  
  return 'gentle AI-animated movement within each scene';
}

/**
 * Build the user prompt with all atmosphere parameters.
 * This creates a detailed context for the AI to generate an appropriate mood description.
 */
export function buildMoodDescriptionUserPrompt(input: MoodDescriptionGeneratorInput): string {
  const timeLabel = getTimeContextLabel(input.theme, input.timeContext);
  const seasonLabel = getSeasonLabel(input.theme, input.season);
  const durationContext = getDurationContext(input.duration);
  const loopContext = getLoopContext(input);
  const animationContext = getAnimationContext(input);

  let prompt = `
Create an atmospheric mood description for an ambient visual with these characteristics:

═══════════════════════════════════════════════════════════════════════════════
ATMOSPHERE SETTINGS
═══════════════════════════════════════════════════════════════════════════════

PRIMARY MOOD: ${input.mood}
THEME/ENVIRONMENT: ${input.theme}
LIGHTING/TIME: ${timeLabel}
ATMOSPHERE/CONDITION: ${seasonLabel}

DURATION: ${durationContext}
ASPECT RATIO: ${input.aspectRatio} (${input.aspectRatio === '16:9' ? 'wide cinematic' : input.aspectRatio === '9:16' ? 'vertical mobile' : input.aspectRatio === '1:1' ? 'square balanced' : 'portrait'})

VISUAL STYLE: ${animationContext}
RHYTHM: ${loopContext}
`;

  // Add user's own input if provided
  if (input.userPrompt && input.userPrompt.trim()) {
    prompt += `
═══════════════════════════════════════════════════════════════════════════════
USER'S CONCEPT
═══════════════════════════════════════════════════════════════════════════════

The user has provided this initial concept to build upon:
"${input.userPrompt.trim()}"

Enhance and expand this concept while maintaining its core vision.
`;
  }

  prompt += `
═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

Write a rich, evocative mood description (2-4 paragraphs) that:
1. Captures the ${input.mood} emotional tone throughout
2. Describes the ${input.theme} environment vividly
3. Incorporates ${timeLabel} lighting and atmosphere
4. Suggests ${seasonLabel} conditions naturally
5. Accounts for the ${loopContext} visual rhythm
6. Is suitable for ${durationContext}

Focus on sensory details: colors, light quality, textures, implied sounds, and the emotional journey.
`;

  return prompt;
}

