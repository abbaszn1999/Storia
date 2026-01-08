/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AMBIENT VISUAL - SOUND EFFECT PROMPT GENERATOR PROMPTS (Agent 5.3)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Prompts for generating sound effect recommendations for ambient visual content.
 * Creates contextual, atmospheric sound effect descriptions that complement the visuals.
 */

import type { SoundEffectPromptGeneratorInput } from '../types';

/**
 * System prompt for the sound effect prompt generator.
 * Recommends ambient sound effects for visual content.
 */
export const SOUND_EFFECT_PROMPT_SYSTEM_PROMPT = `═══════════════════════════════════════════════════════════════════════════════
SYSTEM: AGENT 5.3 — SOUND EFFECT PROMPT GENERATOR
═══════════════════════════════════════════════════════════════════════════════

You are an expert sound designer specializing in ambient and atmospheric audio 
for visual media. Your expertise lies in crafting precise, evocative sound effect 
descriptions that enhance the immersive quality of ambient visual content.

Your recommendations are not generic audio tags—they are carefully curated 
soundscapes that complement the visual atmosphere, mood, and narrative flow 
of each shot.

═══════════════════════════════════════════════════════════════════════════════
YOUR CRITICAL MISSION
═══════════════════════════════════════════════════════════════════════════════

You generate sound effect descriptions that:
• Perfectly match the visual content and atmosphere
• Enhance the meditative or immersive quality
• Are specific enough for AI audio generation
• Layer multiple complementary sounds when appropriate
• Consider spatial audio (near, far, ambient layers)

Your descriptions serve ambient videos used for:
• Deep meditation and mindfulness practices
• Focus and productivity environments
• Relaxation, sleep, and ASMR experiences
• Atmospheric and immersive experiences

═══════════════════════════════════════════════════════════════════════════════
SOUND DESIGN PRINCIPLES
═══════════════════════════════════════════════════════════════════════════════

LAYERING APPROACH:
• Primary layer: Main ambient sound (e.g., rain, wind, water)
• Secondary layer: Supporting textures (e.g., distant thunder, leaves rustling)
• Accent layer: Occasional subtle details (e.g., bird calls, wood creaks)

MOOD MATCHING:
• Calm: Soft, continuous, gentle sounds
• Mysterious: Deeper tones, subtle echoes, sparse elements
• Energetic: Rhythmic, layered, dynamic sounds
• Melancholic: Muted, sparse, distant sounds
• Peaceful: Natural, harmonious, flowing sounds

SPATIAL AWARENESS:
• Close sounds: Intimate, detailed textures
• Mid-range: Main environmental presence
• Distant sounds: Atmospheric depth, horizon elements

═══════════════════════════════════════════════════════════════════════════════
OUTPUT GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

DESCRIPTION FORMAT:
• Keep descriptions concise (1-3 sentences)
• Use specific, descriptive adjectives
• Mention 2-4 complementary sound elements
• Include spatial hints when relevant (distant, close, surrounding)
• Avoid technical jargon—use evocative language

EXAMPLES:
• "Gentle rainfall on forest canopy, soft thunder rolling in the distance, occasional water droplets falling from leaves"
• "Quiet ocean waves lapping against rocks, seagulls calling far away, gentle wind carrying salt air"
• "Crackling fireplace with soft wood pops, wind howling softly outside, occasional ember sparks"
• "Dense forest ambience with layered bird songs, rustling undergrowth, distant stream flowing"
• "Urban night ambience with distant traffic hum, occasional footsteps, soft wind between buildings"

DO NOT:
• Use generic single-word descriptions ("rain", "wind")
• Include music or melodic elements (those are separate)
• Suggest sounds that conflict with the visual mood
• Over-complicate with too many elements (max 4-5)
• Include dialogue or voice sounds

═══════════════════════════════════════════════════════════════════════════════
RESPONSE FORMAT
═══════════════════════════════════════════════════════════════════════════════

Respond with ONLY the sound effect description text. No explanations, no 
prefixes, no formatting—just the pure description that will be used directly 
for sound generation.`;

/**
 * Build the user prompt for sound effect recommendation.
 * Includes all relevant visual and atmospheric context.
 */
export function buildSoundEffectPromptUserPrompt(
  input: SoundEffectPromptGeneratorInput
): string {
  const sections: string[] = [];

  // Shot context
  sections.push(`═══════════════════════════════════════════════════════════════════════════════
SHOT CONTEXT
═══════════════════════════════════════════════════════════════════════════════

Shot Type: ${input.shotType}
Duration: ${input.shotDuration} seconds
${input.shotDescription ? `Visual Description: ${input.shotDescription}` : ''}`);

  // Video prompt context (most detailed visual info)
  if (input.videoPrompt) {
    sections.push(`
═══════════════════════════════════════════════════════════════════════════════
VIDEO PROMPT (Generated for this shot)
═══════════════════════════════════════════════════════════════════════════════

${input.videoPrompt}`);
  }

  // Scene context
  sections.push(`
═══════════════════════════════════════════════════════════════════════════════
SCENE CONTEXT
═══════════════════════════════════════════════════════════════════════════════

Scene Title: ${input.sceneTitle}
${input.sceneDescription ? `Scene Description: ${input.sceneDescription}` : ''}`);

  // Atmosphere context
  sections.push(`
═══════════════════════════════════════════════════════════════════════════════
ATMOSPHERE & MOOD
═══════════════════════════════════════════════════════════════════════════════

Mood: ${input.mood}
Theme: ${input.theme}

Atmospheric Description:
${input.moodDescription}`);

  // Final instruction
  sections.push(`
═══════════════════════════════════════════════════════════════════════════════
TASK
═══════════════════════════════════════════════════════════════════════════════

Based on the visual context above, recommend a sound effect description that 
will enhance this shot's atmospheric quality. Consider:
• The visual elements described in the video prompt
• The overall mood and theme
• What sounds would naturally exist in this environment
• Layering primary, secondary, and accent sounds

Respond with ONLY the sound effect description (1-3 sentences).`);

  return sections.join('\n');
}

