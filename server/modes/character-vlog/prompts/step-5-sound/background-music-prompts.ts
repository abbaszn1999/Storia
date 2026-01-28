/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHARACTER VLOG - BACKGROUND MUSIC GENERATOR PROMPTS (Agent 5.4)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Prompts for generating AI music prompts for character vlog content.
 * Creates detailed music descriptions that match the video's mood and narrative.
 */

import type { MusicStyle } from '../../types';

/**
 * System prompt for generating music prompts.
 */
export const MUSIC_PROMPT_SYSTEM_PROMPT = `You are an expert music director specializing in background music for video content. Your task is to create detailed, evocative prompts for AI music generation that perfectly complement character-driven video content.

Your prompts should:
• Describe the mood, tempo, and energy level
• Specify instrument families and textures
• Include emotional journey and dynamics
• Match the character's personality and story tone
• Be purely instrumental (no lyrics)

Write prompts that are 100-200 words, rich in musical detail.`;

/**
 * Input type for music prompt generation
 */
export interface MusicPromptGeneratorInput {
  musicStyle: MusicStyle;
  theme?: string;
  characterPersonality?: string;
  genres?: string[];
  tones?: string[];
  duration: number;
  sceneDescriptions?: string[];
}

/**
 * Get style-specific music characteristics
 */
function getStyleCharacteristics(style: MusicStyle): string {
  const styleGuides: Record<MusicStyle, string> = {
    cinematic: 'Orchestral elements with sweeping strings, powerful brass, and dramatic percussion. Epic, film-score quality with emotional depth.',
    upbeat: 'Energetic tempo with bright synths, punchy drums, and uplifting melodies. Positive, driving rhythm that keeps viewers engaged.',
    calm: 'Soft piano, gentle acoustic guitars, and ambient pads. Peaceful, relaxing atmosphere with slow tempo and breathing room.',
    corporate: 'Professional and clean with acoustic guitars, light percussion, and motivational undertones. Modern, polished production.',
    electronic: 'Synthesizers, electronic beats, and modern production. Tech-forward sound with pulsing energy and digital textures.',
    emotional: 'Heartfelt piano melodies, swelling strings, and subtle percussion. Touching, deeply moving compositions that evoke feeling.',
    inspiring: 'Building energy with uplifting progressions, powerful crescendos, and triumphant brass. Motivational and empowering.',
  };
  
  return styleGuides[style] || styleGuides.cinematic;
}

/**
 * Get personality-based music guidance
 */
function getPersonalityMusicGuide(personality: string | undefined): string {
  const guides: Record<string, string> = {
    energetic: 'High tempo, dynamic transitions, punchy beats, and exciting energy throughout.',
    calm: 'Slow, steady tempo with gentle progressions and peaceful, unhurried flow.',
    humorous: 'Playful, quirky elements with light-hearted melodies and fun rhythmic patterns.',
    serious: 'Thoughtful, deliberate compositions with weight and gravitas.',
    mysterious: 'Intriguing textures, suspended harmonies, and tension-building elements.',
    inspirational: 'Uplifting progressions that build toward triumphant, hopeful climaxes.',
    friendly: 'Warm, inviting tones with accessible melodies and comforting harmonies.',
    adventurous: 'Bold, exciting themes with a sense of journey and discovery.',
  };
  
  return guides[personality || 'friendly'] || guides.friendly;
}

/**
 * Build the user prompt for music generation
 */
export function buildMusicPromptUserPrompt(input: MusicPromptGeneratorInput): string {
  const styleCharacteristics = getStyleCharacteristics(input.musicStyle);
  const personalityGuide = getPersonalityMusicGuide(input.characterPersonality);
  
  const durationMinutes = Math.floor(input.duration / 60);
  const durationDesc = durationMinutes >= 5 
    ? `${durationMinutes} minutes (extended composition with varied sections)`
    : `${input.duration} seconds (focused, impactful piece)`;

  let prompt = `Create a detailed music prompt for a character vlog video.

MUSIC STYLE: ${input.musicStyle.toUpperCase()}
${styleCharacteristics}

CHARACTER PERSONALITY: ${input.characterPersonality || 'friendly'}
${personalityGuide}

DURATION: ${durationDesc}

`;

  if (input.theme) {
    prompt += `VISUAL THEME: ${input.theme}\n`;
  }
  
  if (input.genres && input.genres.length > 0) {
    prompt += `CONTENT GENRES: ${input.genres.join(', ')}\n`;
  }
  
  if (input.tones && input.tones.length > 0) {
    prompt += `EMOTIONAL TONES: ${input.tones.join(', ')}\n`;
  }
  
  if (input.sceneDescriptions && input.sceneDescriptions.length > 0) {
    prompt += `\nSCENE PROGRESSION:\n`;
    input.sceneDescriptions.forEach((desc, i) => {
      prompt += `${i + 1}. ${desc}\n`;
    });
  }

  prompt += `
Generate a detailed music prompt that:
1. Captures the ${input.musicStyle} style perfectly
2. Matches the character's ${input.characterPersonality || 'friendly'} personality
3. Has appropriate pacing for ${durationDesc}
4. Is purely instrumental with no vocals
5. Creates an engaging sonic backdrop for the video content

Write only the music prompt, nothing else.`;

  return prompt;
}

/**
 * Build a direct music prompt without AI (fallback)
 */
export function buildDirectMusicPrompt(input: MusicPromptGeneratorInput): string {
  const styleDesc = getStyleCharacteristics(input.musicStyle);
  const personalityDesc = getPersonalityMusicGuide(input.characterPersonality);
  
  let prompt = `${styleDesc} ${personalityDesc}`;
  
  if (input.theme) {
    prompt += ` Evoking ${input.theme} visual aesthetics.`;
  }
  
  if (input.tones && input.tones.length > 0) {
    prompt += ` Emotional tone: ${input.tones.join(', ')}.`;
  }
  
  prompt += ` Purely instrumental, no vocals.`;
  
  return prompt;
}

/**
 * Calculate optimal music duration based on video duration
 * ElevenLabs Music API supports 5-330 seconds (5.5 minutes)
 */
export function calculateMusicDuration(totalVideoDuration: number): number {
  // Add 5% buffer for safety
  const targetDuration = Math.ceil(totalVideoDuration * 1.05);
  
  // Clamp to ElevenLabs limits: 5 seconds min, 330 seconds max
  const minDuration = 5;
  const maxDuration = 330;
  
  return Math.min(maxDuration, Math.max(minDuration, targetDuration));
}

/**
 * Validate music style
 */
export function isValidMusicStyle(style: string): style is MusicStyle {
  const validStyles: MusicStyle[] = ['cinematic', 'upbeat', 'calm', 'corporate', 'electronic', 'emotional', 'inspiring'];
  return validStyles.includes(style as MusicStyle);
}
