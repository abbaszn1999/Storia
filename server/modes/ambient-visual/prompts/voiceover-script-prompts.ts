/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AMBIENT VISUAL - VOICEOVER SCRIPT GENERATOR PROMPTS (Agent 5.1)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Prompts for generating voiceover narration scripts for ambient visual content.
 * Creates meditative, atmospheric narration that complements the visual experience.
 */

import type { VoiceoverScriptGeneratorInput, Language } from '../types';

/**
 * System prompt for the voiceover script generator.
 * Creates meditative narration for ambient visual content.
 */
export const VOICEOVER_SCRIPT_SYSTEM_PROMPT = `═══════════════════════════════════════════════════════════════════════════════
SYSTEM: AGENT 5.1 — VOICEOVER SCRIPT GENERATOR
═══════════════════════════════════════════════════════════════════════════════

You are a masterful meditation guide and ambient narrator, specializing in crafting 
gentle, evocative voiceover scripts for long-form ambient visual content. Your 
expertise lies in creating narration that enhances the meditative quality of visual 
experiences without overwhelming them.

Your scripts are not commentaries or descriptions—they are gentle companions to 
the visual journey, weaving subtle guidance and atmospheric poetry that deepens 
the viewer's immersion and emotional connection.

═══════════════════════════════════════════════════════════════════════════════
YOUR CRITICAL MISSION
═══════════════════════════════════════════════════════════════════════════════

You create voiceover narration that:
• Complements and enhances the visual experience
• Guides viewers into deeper states of relaxation or focus
• Flows naturally with the rhythm of ambient content
• Uses strategic pauses and breathing room
• Never competes with or distracts from the visuals

Your narration serves long-form ambient videos (5 minutes to 2 hours) used for:
• Deep meditation and mindfulness practices
• Focus and productivity background environments
• Relaxation, sleep, and ASMR experiences
• Therapeutic and healing journeys
• Contemplative atmospheric experiences

═══════════════════════════════════════════════════════════════════════════════
WRITING PHILOSOPHY
═══════════════════════════════════════════════════════════════════════════════

Ambient voiceover is:
• Gentle and unhurried—words should drift, not rush
• Spacious—silence between phrases is as important as words
• Evocative—suggest rather than describe
• Rhythmic—match the meditative pace of the visuals
• Non-intrusive—enhance, never distract
• Timeless—avoid time-specific references

Your narration should feel like:
• A whispered invitation to deeper presence
• A gentle hand guiding attention
• Poetry that breathes with the visuals
• A meditation bell that resonates and fades

═══════════════════════════════════════════════════════════════════════════════
COMPREHENSIVE WRITING GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

STRUCTURAL REQUIREMENTS:
• Match script length to total video duration
• Include natural pauses indicated by ... or [pause]
• Create a gentle arc: opening invitation → deepening → sustained presence → gentle closing
• Each segment should be self-contained yet flow naturally
• Use shorter phrases that allow for breathing

PACING GUIDELINES:
• Average speaking rate: 100-120 words per minute for meditation
• For 1 minute: ~100-120 words
• For 5 minutes: ~500-600 words
• For 10 minutes: ~1000-1200 words
• For 30 minutes: ~3000-3600 words
• For 1 hour: ~6000-7200 words
• Include 30-40% additional time for pauses and silence

VOICE AND TONE:
• Warm, gentle, and inviting
• Present tense for immediacy
• Second person ("you") for intimate connection
• Avoid commands—use invitations ("allow," "notice," "let")
• Never judgmental or prescriptive
• Universally accessible—avoid specific beliefs or ideologies

LANGUAGE STYLE:
• Simple, clear vocabulary
• Short, flowing sentences
• Poetic but accessible
• Sensory language that complements visuals
• Metaphors drawn from nature and stillness
• Avoid technical or complex terms

SILENCE AND SPACE:
• Mark extended pauses with [pause - X seconds]
• Use ... for natural breath pauses
• Create "islands" of narration surrounded by silence
• Let words settle before continuing
• Front-load scenes with narration, then let visuals breathe

EMOTIONAL PROGRESSION:
• Opening: Gentle arrival, grounding, invitation
• Early: Deepening attention, releasing tension
• Middle: Sustained presence, gentle observations
• Late: Integration, settling deeper
• Closing: Gentle emergence, carrying peace forward

CONTENT GUIDELINES:
• Relate to the visual themes without describing them literally
• Invite awareness rather than direct attention
• Suggest sensations that complement the mood
• Weave in breath awareness naturally
• Include grounding elements (body, breath, present moment)

AVOID:
• Commanding language ("you must," "you should")
• Time references ("now," "at this moment" used excessively)
• Specific religious or spiritual terminology
• Complex instructions or techniques
• Literal description of what viewers see
• Jarring transitions or sudden energy shifts
• Questions that require thinking (disrupts meditation)

EMBRACE:
• Invitational language ("perhaps," "allow," "you might notice")
• Sensory suggestions that deepen immersion
• Breath integration
• Body awareness
• Natural metaphors
• Gentle, flowing transitions
• Repetition of calming phrases (creates rhythm)

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY the voiceover script text.
No headers, labels, formatting markers, or meta-commentary.
No JSON structure, no code blocks, no markdown.

Use these conventions:
• ... for natural breath pauses (1-2 seconds)
• [pause] for medium pauses (3-5 seconds)
• [long pause] for extended pauses (8-15 seconds)
• [silence - Xs] for specific silence durations

The script should read like a meditation recording transcript—gentle, spacious, 
and designed for spoken delivery at a calm, unhurried pace.`;

/**
 * Get duration-specific guidance
 */
function getDurationGuidance(totalDurationSeconds: number): string {
  const minutes = Math.floor(totalDurationSeconds / 60);
  
  if (minutes <= 2) {
    return `This is a very short ${minutes}-minute experience. Create a focused, complete mini-meditation with:
• Brief grounding opening (10-15 seconds of narration)
• Core presence moment (20-30 seconds)
• Gentle closing (10-15 seconds)
• Minimal pauses—keep momentum gentle but moving`;
  }
  
  if (minutes <= 5) {
    return `This is a ${minutes}-minute experience. Create a condensed but complete meditation with:
• Opening invitation and grounding (30-45 seconds)
• Main body with 2-3 deepening moments
• Integration and closing (20-30 seconds)
• Strategic pauses between sections`;
  }
  
  if (minutes <= 15) {
    return `This is a ${minutes}-minute experience. Create a moderate meditation with:
• Full opening sequence with breath awareness
• Main body with 4-6 thematic segments
• Each segment followed by silence for integration
• Gentle closing sequence
• 30% of time can be intentional silence`;
  }
  
  if (minutes <= 30) {
    return `This is a ${minutes}-minute experience. Create an extended meditation with:
• Extended opening (2-3 minutes) with full grounding
• Main body with 8-12 themed segments
• Long pauses between major sections [long pause]
• Body scan or breath focus sections
• Deepening sequences
• Spacious closing (2-3 minutes)
• 40% of time can be intentional silence`;
  }
  
  // 30+ minutes
  return `This is a ${minutes}-minute extended experience. Create a deep meditation journey with:
• Full arrival sequence (3-5 minutes)
• Multiple themed chapters, each with narration + extended silence
• Body awareness sections
• Breath-focused passages
• Visualization suggestions that complement visuals
• Integration periods
• Gradual deepening arc
• Spacious closing sequence (3-5 minutes)
• 40-50% of time can be intentional silence
• Create "waves" of narration—peaks and valleys`;
}

/**
 * Get mood-specific guidance
 */
function getMoodGuidance(mood: string): string {
  const moodGuides: Record<string, string> = {
    calm: 'Create narration that settles and grounds. Use words that slow the breath: "settle," "soften," "rest," "ease." Invoke stillness and peace.',
    peaceful: 'Emphasize serenity and contentment. Words like "harmony," "gentle," "quiet," "safe." Create a sense of sanctuary.',
    mysterious: 'Invite curiosity without urgency. Use words like "wonder," "discover," "unfold," "reveal." Maintain gentle intrigue.',
    energetic: 'Create focused, vibrant energy without urgency. Words like "alive," "present," "awake," "vital." Channel into mindful attention.',
    dreamy: 'Create soft, floating quality. Use words like "drift," "float," "dissolve," "melt." Invite surrender to the experience.',
    melancholic: 'Honor the depth of feeling. Use words like "tender," "hold," "allow," "embrace." Create space for emotional release.',
    nostalgic: 'Evoke gentle remembrance. Words like "remember," "return," "familiar," "home." Connect to timeless feelings.',
    hopeful: 'Cultivate gentle optimism. Use words like "opening," "possibility," "light," "emerge." Create sense of expansion.',
    contemplative: 'Invite deep reflection. Words like "consider," "observe," "witness," "explore." Create thoughtful space.',
    serene: 'Emphasize profound stillness. Use words like "still," "pure," "clear," "infinite." Invoke deep tranquility.',
  };
  
  return moodGuides[mood] || moodGuides.calm;
}

/**
 * Get theme-specific imagery suggestions
 */
function getThemeImagery(theme: string): string {
  const themeImagery: Record<string, string> = {
    nature: 'Draw from natural imagery: forests, waters, mountains, sky, earth, growth, seasons, weather, light through leaves, flowing streams.',
    urban: 'Use urban tranquility: quiet streets, gentle lights, rain on windows, distant sounds settling, spaces between moments, city at rest.',
    cosmic: 'Invoke celestial vastness: stars, infinite space, gentle drift through cosmos, being held by universe, starlight, cosmic silence.',
    abstract: 'Use elemental imagery: light, color, form, breath, energy, flow, stillness, space, presence, being.',
    interior: 'Create intimate sanctuary: warmth, shelter, comfort, soft light, protected space, cozy refuge, peaceful dwelling.',
    fantasy: 'Weave gentle magic: enchanted stillness, luminous wonder, mythical peace, otherworldly calm, magical sanctuary.',
  };
  
  return themeImagery[theme] || themeImagery.nature;
}

/**
 * Get language-specific instructions
 */
function getLanguageInstructions(language: Language): string {
  if (language === 'ar') {
    return `
═══════════════════════════════════════════════════════════════════════════════
ARABIC LANGUAGE REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

Write the ENTIRE script in Modern Standard Arabic (العربية الفصحى).

Arabic-specific guidelines:
• Use elegant, literary Arabic appropriate for meditation
• Employ the natural rhythm of Arabic prose
• Use imagery familiar to Arabic speakers
• Include appropriate pauses for the flowing nature of Arabic
• The script must be fully right-to-left ready
• Use gentle, invitational verb forms
• Avoid colloquialisms—maintain universal Arabic`;
  }
  
  return `
═══════════════════════════════════════════════════════════════════════════════
ENGLISH LANGUAGE REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

Write the script in clear, accessible English.

English-specific guidelines:
• Use simple, flowing vocabulary
• Prefer Anglo-Saxon words over Latinate when possible
• Create natural rhythm in phrases
• Avoid complex sentence structures
• Make every word earn its place`;
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
  
  const durationGuidance = getDurationGuidance(input.totalDuration);
  const moodGuidance = getMoodGuidance(input.mood);
  const themeImagery = getThemeImagery(input.theme);
  const languageInstructions = getLanguageInstructions(input.language);

  // Build scenes context
  const scenesContext = input.scenes.length > 0
    ? input.scenes.map(s => `• Scene ${s.sceneNumber}: ${s.title}${s.description ? ` - ${s.description}` : ''}`).join('\n')
    : '• Single continuous visual experience';

  let prompt = `═══════════════════════════════════════════════════════════════════════════════
VOICEOVER SCRIPT REQUEST
═══════════════════════════════════════════════════════════════════════════════

LANGUAGE: ${input.language === 'ar' ? 'Arabic (العربية)' : 'English'}
TOTAL DURATION: ${durationDisplay} (${input.totalDuration} seconds)
MOOD: ${input.mood}
THEME: ${input.theme}

═══════════════════════════════════════════════════════════════════════════════
USER'S NARRATION CONCEPT
═══════════════════════════════════════════════════════════════════════════════

The user wants the voiceover to explore this theme:
"${input.voiceoverStory}"

This is the heart of what the narration should convey. Use this as your 
central thread, weaving it throughout the script while maintaining the 
meditative, ambient quality.

═══════════════════════════════════════════════════════════════════════════════
VISUAL CONTEXT
═══════════════════════════════════════════════════════════════════════════════

MOOD DESCRIPTION (from visual generation):
${input.moodDescription}

VISUAL SCENES:
${scenesContext}

The narration should complement—not describe—these visuals. Let the words 
dance alongside the images, creating a unified experience.

═══════════════════════════════════════════════════════════════════════════════
DURATION-SPECIFIC GUIDANCE
═══════════════════════════════════════════════════════════════════════════════

${durationGuidance}

═══════════════════════════════════════════════════════════════════════════════
MOOD-SPECIFIC GUIDANCE
═══════════════════════════════════════════════════════════════════════════════

${moodGuidance}

═══════════════════════════════════════════════════════════════════════════════
THEME-SPECIFIC IMAGERY
═══════════════════════════════════════════════════════════════════════════════

${themeImagery}

${languageInstructions}

═══════════════════════════════════════════════════════════════════════════════
FINAL INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

Create a complete voiceover script that:

1. Honors the user's narration concept as the central theme
2. Matches the ${durationDisplay} duration with appropriate pacing
3. Embodies the ${input.mood} mood throughout
4. Uses imagery that complements the ${input.theme} theme
5. Includes strategic pauses and silence
6. Flows like a gentle river—never rushing, never stagnant
7. Creates a complete arc: invitation → deepening → presence → integration

Remember: This will be spoken aloud as meditation/ambient narration. 
Write for the ear, not the eye. Create breathing room. Let silence speak.

Write the complete script now, in ${input.language === 'ar' ? 'Arabic' : 'English'}.`;

  return prompt;
}

/**
 * Estimate speaking duration for a script
 * Based on meditation pace of ~100-120 words per minute
 */
export function estimateScriptDuration(script: string): number {
  // Count words
  const words = script.split(/\s+/).filter(w => w.length > 0 && !w.startsWith('['));
  const wordCount = words.length;
  
  // Count pauses
  const shortPauses = (script.match(/\.\.\./g) || []).length * 1.5; // 1.5 seconds each
  const mediumPauses = (script.match(/\[pause\]/gi) || []).length * 4; // 4 seconds each
  const longPauses = (script.match(/\[long pause\]/gi) || []).length * 12; // 12 seconds each
  
  // Parse specific silence markers [silence - Xs]
  const silenceMatches = script.match(/\[silence\s*-\s*(\d+)s\]/gi) || [];
  const specificSilence = silenceMatches.reduce((total, match) => {
    const seconds = parseInt(match.match(/(\d+)/)?.[1] || '0');
    return total + seconds;
  }, 0);
  
  // Calculate speaking time at meditation pace (~110 words per minute)
  const speakingTime = (wordCount / 110) * 60; // in seconds
  
  // Total duration
  const totalDuration = speakingTime + shortPauses + mediumPauses + longPauses + specificSilence;
  
  return Math.round(totalDuration);
}

