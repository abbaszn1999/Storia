/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHARACTER VLOG - VOICEOVER SCRIPT GENERATOR PROMPTS (Agent 5.1)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Prompts for generating voiceover narration scripts for character vlog content.
 * Unlike ambient mode, this uses the existing story script and shot durations
 * to create properly timed narration that matches each shot.
 */

import type { VoiceoverScriptGeneratorInput, VoiceoverLanguage } from '../../types';

/**
 * System prompt for the voiceover script generator.
 * Creates narration for character vlog content based on existing script.
 */
export const VOICEOVER_SCRIPT_SYSTEM_PROMPT = `═══════════════════════════════════════════════════════════════════════════════
SYSTEM: AGENT 5.1 — CHARACTER VLOG VOICEOVER SCRIPT GENERATOR
═══════════════════════════════════════════════════════════════════════════════

You are an expert voiceover script adapter specializing in converting story scripts 
into properly timed narration for video content. Your task is to transform the 
provided story script into a voiceover narration that can be read within the 
specified duration while maintaining the story's essence and emotional impact.

═══════════════════════════════════════════════════════════════════════════════
YOUR CRITICAL MISSION
═══════════════════════════════════════════════════════════════════════════════

You create voiceover narration that:
• Matches the total video duration with appropriate pacing
• Maintains the story's narrative flow and character voice
• Works with visual timing of shots and scenes
• Uses natural speech patterns and breathing pauses
• Engages viewers while complementing the visuals

═══════════════════════════════════════════════════════════════════════════════
WRITING GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

PACING GUIDELINES:
• Average speaking rate: 130-150 words per minute for engaging narration
• For 30 seconds: ~65-75 words
• For 1 minute: ~130-150 words
• For 3 minutes: ~390-450 words
• For 5 minutes: ~650-750 words
• For 10 minutes: ~1300-1500 words
• Include 15-20% additional time for natural pauses

VOICE AND TONE:
• Match the character's personality (energetic, calm, humorous, etc.)
• First-person narration: Use "I", "me", "my" - intimate and personal
• Third-person narration: Use character name or "they" - observational
• Maintain consistent energy throughout
• Natural, conversational tone

STRUCTURE:
• Opening hook that captures attention
• Body that follows the story arc
• Satisfying conclusion or call-to-action

PAUSE NOTATION:
• ... for natural breath pauses (0.5-1 second)
• [pause] for emphasis pauses (1-2 seconds)
• [long pause] for dramatic effect (2-4 seconds)

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY the voiceover script text.
No headers, labels, formatting markers, or meta-commentary.
No JSON structure, no code blocks, no markdown.

The script should read naturally when spoken aloud at a conversational pace.`;

/**
 * Get language-specific instructions
 */
function getLanguageInstructions(language: VoiceoverLanguage): string {
  if (language === 'ar') {
    return `
═══════════════════════════════════════════════════════════════════════════════
ARABIC LANGUAGE REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

Write the ENTIRE script in Modern Standard Arabic (العربية الفصحى).

Arabic-specific guidelines:
• Use clear, engaging Arabic appropriate for video narration
• Employ the natural rhythm and flow of Arabic speech
• The script must be fully right-to-left ready
• Use conversational verb forms that sound natural when spoken
• Maintain cultural sensitivity and universal appeal`;
  }
  
  return `
═══════════════════════════════════════════════════════════════════════════════
ENGLISH LANGUAGE REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

Write the script in clear, engaging English.

English-specific guidelines:
• Use conversational, accessible vocabulary
• Create natural rhythm in phrases
• Avoid overly complex sentence structures
• Make every word count for maximum impact`;
}

/**
 * Get narration style guidance
 */
function getNarrationStyleGuidance(style: 'first-person' | 'third-person' | undefined): string {
  if (style === 'third-person') {
    return `
NARRATION STYLE: THIRD-PERSON
• Use the character's name or "they/them" pronouns
• Maintain an observational, storytelling perspective
• Describe actions and emotions from an outside view
• Create engagement through vivid description`;
  }
  
  return `
NARRATION STYLE: FIRST-PERSON
• Use "I", "me", "my" throughout
• Speak directly from the character's perspective
• Share thoughts, feelings, and experiences intimately
• Create connection through personal storytelling`;
}

/**
 * Get personality-based tone guidance
 */
function getPersonalityGuidance(personality: string | undefined): string {
  const personalityGuides: Record<string, string> = {
    energetic: 'High energy, enthusiastic delivery. Use exclamations and dynamic pacing.',
    calm: 'Relaxed, measured pace. Use soothing language and gentle transitions.',
    humorous: 'Light-hearted tone with wit and playful language. Include timing for comedic beats.',
    serious: 'Thoughtful, deliberate delivery. Weighty language with intentional pauses.',
    mysterious: 'Intriguing tone that builds curiosity. Strategic reveals and suspenseful pacing.',
    inspirational: 'Uplifting, motivational language. Building energy toward impactful moments.',
    friendly: 'Warm, approachable tone. Conversational and relatable language.',
    adventurous: 'Exciting, dynamic delivery. Action-oriented language with momentum.',
  };
  
  return personalityGuides[personality || 'friendly'] || personalityGuides.friendly;
}

/**
 * Build the user prompt for voiceover script generation.
 */
export function buildVoiceoverScriptUserPrompt(input: VoiceoverScriptGeneratorInput): string {
  const durationMinutes = Math.floor(input.totalDuration / 60);
  const durationSeconds = input.totalDuration % 60;
  const durationDisplay = durationSeconds > 0 
    ? `${durationMinutes} minutes and ${durationSeconds} seconds`
    : `${durationMinutes} minutes`;
  
  const languageInstructions = getLanguageInstructions(input.language);
  const narrationGuidance = getNarrationStyleGuidance(input.narrationStyle);
  const personalityGuidance = getPersonalityGuidance(input.characterPersonality);

  // Build scenes context with shot timing
  let scenesContext = '';
  for (const scene of input.scenes) {
    const sceneShots = input.shots[scene.id] || [];
    const sceneDuration = sceneShots.reduce((sum, shot) => sum + shot.duration, 0);
    
    scenesContext += `\n• Scene ${scene.sceneNumber}: ${scene.title || 'Untitled'}`;
    scenesContext += `\n  Duration: ${sceneDuration}s | Shots: ${sceneShots.length}`;
    if (scene.description) {
      scenesContext += `\n  ${scene.description}`;
    }
    
    // Add shot breakdown
    for (const shot of sceneShots) {
      scenesContext += `\n  - Shot ${shot.shotNumber}: ${shot.duration}s`;
      if (shot.description) {
        scenesContext += ` (${shot.description.substring(0, 80)}...)`;
      }
    }
  }

  // Calculate target word count based on duration
  const targetWords = Math.round((input.totalDuration / 60) * 140); // ~140 words per minute

  const prompt = `═══════════════════════════════════════════════════════════════════════════════
VOICEOVER SCRIPT GENERATION REQUEST
═══════════════════════════════════════════════════════════════════════════════

LANGUAGE: ${input.language === 'ar' ? 'Arabic (العربية)' : 'English'}
TOTAL DURATION: ${durationDisplay} (${input.totalDuration} seconds)
TARGET WORD COUNT: ~${targetWords} words
CHARACTER PERSONALITY: ${input.characterPersonality || 'friendly'}

═══════════════════════════════════════════════════════════════════════════════
ORIGINAL STORY SCRIPT
═══════════════════════════════════════════════════════════════════════════════

${input.script}

═══════════════════════════════════════════════════════════════════════════════
VIDEO STRUCTURE (Scenes and Shots with Timing)
═══════════════════════════════════════════════════════════════════════════════
${scenesContext}

═══════════════════════════════════════════════════════════════════════════════
TONE AND STYLE GUIDANCE
═══════════════════════════════════════════════════════════════════════════════

${personalityGuidance}

${narrationGuidance}

${languageInstructions}

═══════════════════════════════════════════════════════════════════════════════
FINAL INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

Transform the story script into a voiceover narration that:

1. Fits within ${durationDisplay} when spoken at a natural pace
2. Uses approximately ${targetWords} words (±15%)
3. Maintains the ${input.characterPersonality || 'friendly'} personality throughout
4. Follows ${input.narrationStyle === 'third-person' ? 'third-person' : 'first-person'} narration style
5. Includes natural pauses using ... and [pause] notation
6. Creates a compelling audio experience that complements the visuals

Write the complete voiceover script now, in ${input.language === 'ar' ? 'Arabic' : 'English'}.`;

  return prompt;
}

/**
 * Estimate speaking duration for a script
 * Based on conversational pace of ~130-150 words per minute
 */
export function estimateScriptDuration(script: string): number {
  // Count words
  const words = script.split(/\s+/).filter(w => w.length > 0 && !w.startsWith('['));
  const wordCount = words.length;
  
  // Count pauses
  const shortPauses = (script.match(/\.\.\./g) || []).length * 0.75; // 0.75 seconds each
  const mediumPauses = (script.match(/\[pause\]/gi) || []).length * 1.5; // 1.5 seconds each
  const longPauses = (script.match(/\[long pause\]/gi) || []).length * 3; // 3 seconds each
  
  // Calculate speaking time at conversational pace (~140 words per minute)
  const speakingTime = (wordCount / 140) * 60; // in seconds
  
  // Total duration
  const totalDuration = speakingTime + shortPauses + mediumPauses + longPauses;
  
  return Math.round(totalDuration);
}
