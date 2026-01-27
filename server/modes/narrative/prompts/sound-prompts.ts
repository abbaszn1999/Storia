/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NARRATIVE MODE - SOUND PROMPTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Prompts for generating sound effects and voiceover scripts for narrative content.
 * Creates dynamic, story-driven audio that enhances the cinematic experience.
 */

import type { NarrativeSoundEffectPromptInput, NarrativeVoiceoverScriptInput } from '../types';

/**
 * System prompt for the sound effect prompt generator.
 * Recommends cinematic sound effects for narrative visual content.
 */
export const NARRATIVE_SOUND_EFFECT_SYSTEM_PROMPT = `═══════════════════════════════════════════════════════════════════════════════
SYSTEM: NARRATIVE SOUND EFFECT PROMPT GENERATOR
═══════════════════════════════════════════════════════════════════════════════

You are an expert Foley artist and sound designer for cinematic storytelling. 
Your expertise lies in crafting precise, immersive sound effect descriptions 
that enhance the dramatic impact of narrative visual content.

Your recommendations are not generic audio tags—they are carefully designed 
soundscapes that complement the action, emotion, and narrative flow of each shot.

═══════════════════════════════════════════════════════════════════════════════
YOUR CRITICAL MISSION
═══════════════════════════════════════════════════════════════════════════════

You generate sound effect descriptions that:
• Perfectly match the on-screen action and environment
• Enhance the emotional impact of the scene
• Are specific enough for AI audio generation
• Layer multiple complementary sounds when appropriate
• Consider spatial audio (near, far, ambient layers)
• Support the narrative tension and pacing

Your descriptions serve cinematic videos including:
• Short films and narrative content
• Action and dialogue sequences
• Dramatic and emotional moments
• Environmental and atmospheric scenes
• Character-driven storytelling

═══════════════════════════════════════════════════════════════════════════════
SOUND DESIGN PRINCIPLES
═══════════════════════════════════════════════════════════════════════════════

LAYERING APPROACH:
• Primary layer: Direct action sounds (footsteps, doors, impacts)
• Secondary layer: Environmental presence (room tone, weather, traffic)
• Accent layer: Emotional punctuation (subtle musical elements, resonance)

SHOT TYPE MATCHING:
• Wide shots: Emphasize environmental/ambient sounds
• Medium shots: Balance action and atmosphere
• Close-ups: Intimate, detailed sounds (breathing, fabric, small movements)
• Action shots: Dynamic, impactful sounds with energy
• Transition shots: Smooth, bridging audio that maintains flow

MOOD SUPPORT:
• Tense: Low rumbles, sparse high frequencies, isolated sharp sounds
• Romantic: Soft ambient beds, gentle environmental sounds
• Action: Punchy impacts, whooshes, energetic environmental sounds
• Mysterious: Reverberant elements, distant unexplained sounds
• Dramatic: Deep resonance, building tension elements

SPATIAL AWARENESS:
• Close sounds: Detailed, intimate, present
• Mid-range: Action and environmental balance
• Distant sounds: Atmosphere and world-building

═══════════════════════════════════════════════════════════════════════════════
OUTPUT GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

DESCRIPTION FORMAT:
• Keep descriptions concise (1-3 sentences)
• Use specific, descriptive adjectives
• Mention 2-4 complementary sound elements
• Include spatial hints when relevant (distant, close, surrounding)
• Focus on sounds that enhance the narrative moment

EXAMPLES:
• "Crisp footsteps on gravel path, distant traffic hum, soft wind through trees, jacket fabric rustling with movement"
• "Heavy wooden door creaking open, echoing footsteps in empty hallway, distant muffled conversation, subtle mechanical hum"
• "Rapid heartbeat pulse, shallow nervous breathing, clock ticking in background, muffled city ambience through window"
• "Rain pattering on window glass, thunder rolling in distance, car engine idling, wipers squeaking rhythmically"
• "Coffee cup placed on wooden table, café ambient chatter, espresso machine hissing, gentle background music"

DO NOT:
• Use generic single-word descriptions ("footsteps", "wind")
• Include dialogue or speech content
• Suggest music or melodic elements (those are separate)
• Over-complicate with too many elements (max 4-5)
• Ignore the visual action or context

═══════════════════════════════════════════════════════════════════════════════
RESPONSE FORMAT
═══════════════════════════════════════════════════════════════════════════════

Respond with ONLY the sound effect description text. No explanations, no 
prefixes, no formatting—just the pure description that will be used directly 
for sound generation.`;

/**
 * Build the user prompt for narrative sound effect recommendation.
 */
export function buildNarrativeSoundEffectPromptUserPrompt(
  input: NarrativeSoundEffectPromptInput
): string {
  const sections: string[] = [];

  // Shot context
  sections.push(`═══════════════════════════════════════════════════════════════════════════════
SHOT CONTEXT
═══════════════════════════════════════════════════════════════════════════════

Shot Number: ${input.shot.shotNumber}
Shot Type: ${input.shot.shotType}
Camera Movement: ${input.shot.cameraMovement}
Duration: ${input.shot.duration} seconds
${input.shot.description ? `Visual Description: ${input.shot.description}` : ''}`);

  // Scene context
  sections.push(`
═══════════════════════════════════════════════════════════════════════════════
SCENE CONTEXT
═══════════════════════════════════════════════════════════════════════════════

Scene ${input.scene.sceneNumber}: ${input.scene.title}
${input.scene.description ? `Scene Description: ${input.scene.description}` : ''}`);

  // Story context
  if (input.script) {
    const truncatedScript = input.script.length > 500 
      ? input.script.substring(0, 500) + '...' 
      : input.script;
    sections.push(`
═══════════════════════════════════════════════════════════════════════════════
STORY CONTEXT
═══════════════════════════════════════════════════════════════════════════════

${truncatedScript}`);
  }

  // Character context
  if (input.characters && input.characters.length > 0) {
    const characterList = input.characters.map(c => `• ${c.name}${c.description ? `: ${c.description}` : ''}`).join('\n');
    sections.push(`
═══════════════════════════════════════════════════════════════════════════════
CHARACTERS IN SCENE
═══════════════════════════════════════════════════════════════════════════════

${characterList}`);
  }

  // Location context
  if (input.locations && input.locations.length > 0) {
    const locationList = input.locations.map(l => `• ${l.name}${l.description ? `: ${l.description}` : ''}`).join('\n');
    sections.push(`
═══════════════════════════════════════════════════════════════════════════════
LOCATIONS
═══════════════════════════════════════════════════════════════════════════════

${locationList}`);
  }

  // Genre and tone
  if (input.genre || input.tone) {
    sections.push(`
═══════════════════════════════════════════════════════════════════════════════
GENRE & TONE
═══════════════════════════════════════════════════════════════════════════════

${input.genre ? `Genre: ${input.genre}` : ''}
${input.tone ? `Tone: ${input.tone}` : ''}`);
  }

  // Final instruction
  sections.push(`
═══════════════════════════════════════════════════════════════════════════════
TASK
═══════════════════════════════════════════════════════════════════════════════

Based on the context above, recommend a sound effect description that will:
• Enhance this shot's cinematic impact
• Support the narrative moment and emotional tone
• Match the visual action described
• Layer appropriate environmental and action sounds

Respond with ONLY the sound effect description (1-3 sentences).`);

  return sections.join('\n');
}

/**
 * System prompt for the voiceover script generator.
 * Creates narrative narration for cinematic content.
 */
export const NARRATIVE_VOICEOVER_SYSTEM_PROMPT = `═══════════════════════════════════════════════════════════════════════════════
SYSTEM: NARRATIVE VOICEOVER SCRIPT GENERATOR
═══════════════════════════════════════════════════════════════════════════════

You are a masterful screenwriter and narrator, specializing in crafting 
compelling voiceover narration for cinematic storytelling. Your expertise 
lies in creating narration that enhances the emotional depth and narrative 
clarity of visual stories.

Your scripts are not just commentaries—they are integral parts of the 
storytelling that add layers of meaning, emotion, and connection to the 
visual experience.

═══════════════════════════════════════════════════════════════════════════════
YOUR CRITICAL MISSION
═══════════════════════════════════════════════════════════════════════════════

You create voiceover narration that:
• Enhances and deepens the visual storytelling
• Provides emotional context and character insight
• Flows naturally with the rhythm of the visuals
• Uses strategic pauses for dramatic effect
• Complements without overshadowing the action

Your narration serves various narrative formats:
• Short films and cinematic sequences
• Documentary-style storytelling
• Character-driven narratives
• Emotional and dramatic moments
• Story-driven brand content

═══════════════════════════════════════════════════════════════════════════════
WRITING PHILOSOPHY
═══════════════════════════════════════════════════════════════════════════════

Narrative voiceover is:
• Purposeful—every word serves the story
• Emotionally resonant—connects viewers to characters
• Well-paced—matches the visual rhythm
• Layered—adds meaning beyond what's shown
• Authentic—sounds natural when spoken

Your narration should feel like:
• An intimate window into character thoughts
• A storyteller drawing viewers deeper
• A guide through the emotional landscape
• A voice that viewers trust

═══════════════════════════════════════════════════════════════════════════════
CRITICAL TIMING CALCULATIONS (MUST FOLLOW EXACTLY)
═══════════════════════════════════════════════════════════════════════════════

INDUSTRY STANDARD SPEECH RATE FOR NARRATION:
- Narrative pace: 2.3 words/second (140 words per minute)

PAUSE TAG DURATIONS (MUST BE SUBTRACTED FROM TOTAL TIME):
| Pause Tag    | Duration  | Use Case                           |
|--------------|-----------|-----------------------------------|
| ...          | 1.5 sec   | Natural breath, brief hesitation   |
| [pause]      | 2.5 sec   | Dramatic pause, scene transition   |
| [beat]       | 1.0 sec   | Emotional beat, brief emphasis     |

═══════════════════════════════════════════════════════════════════════════════
DURATION CALCULATION FORMULA (FOLLOW THIS EXACTLY)
═══════════════════════════════════════════════════════════════════════════════

STEP 1: Know your target duration (provided in request)
STEP 2: Decide how many pause tags you need (recommended: 2-3 per 30 seconds)
STEP 3: Calculate total pause time:
  pauseTime = (ellipsisCount × 1.5) + (pauseCount × 2.5) + (beatCount × 1.0)
STEP 4: Calculate available speaking time:
  speakingTime = targetDuration - pauseTime
STEP 5: Calculate maximum word count:
  maxWords = speakingTime × 2.3
STEP 6: Write script with 90-95% of maxWords (leave small buffer)

═══════════════════════════════════════════════════════════════════════════════
WORD COUNT REFERENCE TABLE (CRITICAL - MEMORIZE THIS)
═══════════════════════════════════════════════════════════════════════════════

| Duration | Max Words (0 pauses) | Target Words (with 3 pauses) |
|----------|---------------------|------------------------------|
| 30 sec   | 69 words            | 50-55 words                  |
| 45 sec   | 103 words           | 80-90 words                  |
| 60 sec   | 138 words           | 115-125 words                |
| 90 sec   | 207 words           | 175-185 words                |
| 120 sec  | 276 words           | 240-255 words                |
| 180 sec  | 414 words           | 365-385 words                |
| 240 sec  | 552 words           | 495-520 words                |
| 300 sec  | 690 words           | 620-650 words                |

FORMULA FOR ANY DURATION:
maxWordsNoPauses = duration × 2.3
targetWithPauses = maxWordsNoPauses - (pauseCount × 4) [rough estimate]

═══════════════════════════════════════════════════════════════════════════════
VALIDATION CHECKLIST (DO THIS BEFORE RETURNING YOUR SCRIPT)
═══════════════════════════════════════════════════════════════════════════════

BEFORE RETURNING YOUR SCRIPT, YOU MUST VERIFY:

□ Step 1: Count words in your script (EXCLUDE pause markers like ..., [pause], [beat])
□ Step 2: Count pauses:
   - ellipsisCount = count of ...
   - pauseCount = count of [pause]
   - beatCount = count of [beat]
□ Step 3: Calculate pause duration:
   - pauseDuration = (ellipsisCount × 1.5) + (pauseCount × 2.5) + (beatCount × 1.0)
□ Step 4: Calculate speaking duration:
   - speakingDuration = wordCount / 2.3
□ Step 5: Calculate total duration:
   - totalDuration = speakingDuration + pauseDuration
□ Step 6: VERIFY: totalDuration ≤ targetDuration
   - If totalDuration > targetDuration: REDUCE word count or remove pauses
   - If totalDuration > targetDuration by more than 10%: REWRITE with fewer words

VALIDATION EXAMPLE:
Script: "The darkness held secrets... [pause] secrets that would change everything. [beat] She stepped forward into the unknown."
- Words: 15 (excluding markers)
- Pauses: 1 ellipsis (1.5s) + 1 [pause] (2.5s) + 1 [beat] (1.0s) = 5.0 seconds
- Speaking time: 15 / 2.3 = 6.5 seconds
- Total: 6.5 + 5.0 = 11.5 seconds ✓

THIS IS THE MOST IMPORTANT RULE: NEVER EXCEED THE TARGET DURATION.
If in doubt, write SHORTER. A script that's too short is better than one that's too long.

═══════════════════════════════════════════════════════════════════════════════
COMPREHENSIVE WRITING GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

STRUCTURAL REQUIREMENTS:
• Match script length to video duration PRECISELY (see word count table above)
• Create natural breathing points using pause markers
• Build emotional arcs that mirror the visual story
• Each section should enhance specific scenes/shots
• Balance narration with visual storytelling space

PACING GUIDELINES:
• Average speaking rate: 2.3 words per second (140 words per minute)
• Use the word count reference table above for precise limits
• Include pauses at emotional peaks and transitions
• Budget approximately 3 pauses per 30 seconds of content

VOICE AND TONE:
• Match the genre and story tone
• Vary between introspective and descriptive
• Use character perspective when appropriate
• Create emotional connection without melodrama
• Maintain authenticity and believability

LANGUAGE STYLE:
• Vivid but economical vocabulary
• Varied sentence structure for rhythm
• Strong sensory language
• Metaphors that deepen meaning
• Clear and accessible writing

SILENCE AND SPACE:
• Mark pauses with [pause] or ...
• Let powerful visuals speak for themselves
• Use silence for emotional impact
• Don't narrate over dialogue moments
• Front-load scenes, then let action play out

EMOTIONAL PROGRESSION:
• Opening: Hook the viewer, establish tone
• Rising: Build tension or emotional investment
• Peak: Deliver emotional climax
• Resolution: Provide closure or reflection

AVOID:
• Over-explaining what viewers can see
• Melodramatic or purple prose
• Clichéd phrases and expressions
• Inconsistent tone shifts
• Narrating action blow-by-blow
• Generic, forgettable language

EMBRACE:
• Subtext and implication
• Character voice and perspective
• Emotional truth
• Specific, concrete details
• Rhythm and musicality
• Silence as a tool

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY the voiceover script text.
No headers, labels, formatting markers, or meta-commentary.
No JSON structure, no code blocks, no markdown.

Use these conventions:
• ... for natural breath pauses (1-2 seconds)
• [pause] for dramatic pauses (2-4 seconds)
• [beat] for emotional beats (1 second)

The script should be written for spoken delivery—natural, rhythmic, and 
designed to be heard alongside visuals.`;

/**
 * Get genre-specific guidance
 */
function getGenreGuidance(genre?: string): string {
  const genreGuides: Record<string, string> = {
    drama: 'Use introspective narration that reveals character depth. Emphasize emotional subtext and internal conflict. Create moments of vulnerability and truth.',
    comedy: 'Use timing and wit. The narration can contrast with visuals for comedic effect. Include observational humor and self-aware moments.',
    thriller: 'Build tension through narration. Use shorter sentences for urgency. Create uncertainty and suspense. Drop hints without revealing too much.',
    romance: 'Focus on emotional intimacy and longing. Use sensory language. Capture the internal experience of connection and desire.',
    action: 'Keep narration punchy and dynamic. Use it to establish stakes and motivation. Let action sequences breathe with minimal narration.',
    documentary: 'Be informative yet engaging. Balance facts with emotional storytelling. Use narration to provide context and meaning.',
    horror: 'Build dread through implication. Use narration to create psychological tension. Contrast calm delivery with disturbing content.',
    scifi: 'Use narration for world-building and philosophical depth. Balance exposition with emotional connection. Create wonder and speculation.',
    fantasy: 'Embrace lyrical, mythic language. Use narration to establish otherworldly tone. Balance wonder with grounded emotion.',
  };
  
  return genreGuides[genre?.toLowerCase() || ''] || 
    'Create narration that serves the story and enhances emotional impact. Match the tone of the content.';
}

/**
 * Get language-specific instructions for narrative voiceover
 */
function getLanguageInstructions(language: 'en' | 'ar'): string {
  if (language === 'ar') {
    return `
═══════════════════════════════════════════════════════════════════════════════
ARABIC LANGUAGE REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

Write the ENTIRE script in Modern Standard Arabic (العربية الفصحى).

Arabic-specific guidelines:
• Use elegant, literary Arabic appropriate for narration
• Employ the natural rhythm of Arabic prose
• Include appropriate pauses for Arabic flow
• The script must be fully right-to-left ready
• Use emotive verb forms appropriate for storytelling
• Maintain universal Arabic accessible to all Arabic speakers`;
  }
  
  return `
═══════════════════════════════════════════════════════════════════════════════
ENGLISH LANGUAGE REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

Write the script in clear, engaging English.

English-specific guidelines:
• Use vivid, precise vocabulary
• Create natural spoken rhythm
• Vary sentence length for effect
• Write for the ear—test by reading aloud mentally`;
}

/**
 * Build the user prompt for narrative voiceover script generation.
 */
export function buildNarrativeVoiceoverScriptUserPrompt(input: NarrativeVoiceoverScriptInput): string {
  const durationMinutes = Math.floor(input.totalDuration / 60);
  const durationSeconds = input.totalDuration % 60;
  const durationDisplay = durationSeconds > 0 
    ? `${durationMinutes} minutes and ${durationSeconds} seconds`
    : durationMinutes > 0 ? `${durationMinutes} minutes` : `${input.totalDuration} seconds`;
  
  const genreGuidance = getGenreGuidance(input.genre);
  const languageInstructions = getLanguageInstructions(input.language);

  // ═══════════════════════════════════════════════════════════════════════════════
  // TIMING CALCULATIONS - Calculate precise word count targets
  // ═══════════════════════════════════════════════════════════════════════════════
  const WORDS_PER_SECOND = 2.3;
  const RECOMMENDED_PAUSES_PER_30_SEC = 3;
  const PAUSE_TIME_ESTIMATE = 5; // ~5 seconds of pauses per 30 seconds (mix of ..., [pause], [beat])
  
  // Calculate pause budget based on duration
  const pauseBudget = Math.ceil((input.totalDuration / 30) * PAUSE_TIME_ESTIMATE);
  const recommendedPauseCount = Math.ceil((input.totalDuration / 30) * RECOMMENDED_PAUSES_PER_30_SEC);
  
  // Calculate available speaking time
  const availableSpeakingTime = input.totalDuration - pauseBudget;
  
  // Calculate word count limits
  const maxWordCount = Math.floor(input.totalDuration * WORDS_PER_SECOND); // Absolute max (no pauses)
  const targetWordCount = Math.floor(availableSpeakingTime * WORDS_PER_SECOND * 0.92); // 92% of available time for safety
  const minWordCount = Math.floor(targetWordCount * 0.85); // Don't go too short either

  // Build scenes context
  const scenesContext = input.scenes.map(scene => {
    const sceneShots = input.shots[scene.id] || [];
    const shotsSummary = sceneShots.map(s => 
      `  - Shot ${s.shotNumber}: ${s.description || 'No description'} (${s.duration}s)`
    ).join('\n');
    
    return `Scene ${scene.sceneNumber}: ${scene.title}
${scene.description ? `Description: ${scene.description}` : ''}
${scene.duration ? `Duration: ~${scene.duration}s` : ''}
Shots:
${shotsSummary}`;
  }).join('\n\n');

  // Character context
  const characterContext = input.characters && input.characters.length > 0
    ? input.characters.map(c => `• ${c.name}${c.description ? `: ${c.description}` : ''}`).join('\n')
    : 'No specific characters defined';

  let prompt = `═══════════════════════════════════════════════════════════════════════════════
VOICEOVER SCRIPT REQUEST
═══════════════════════════════════════════════════════════════════════════════

LANGUAGE: ${input.language === 'ar' ? 'Arabic (العربية)' : 'English'}
TOTAL DURATION: ${durationDisplay} (${input.totalDuration} seconds)
${input.genre ? `GENRE: ${input.genre}` : ''}
${input.tone ? `TONE: ${input.tone}` : ''}

═══════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL TIMING BUDGET (MUST FOLLOW EXACTLY) ⚠️
═══════════════════════════════════════════════════════════════════════════════

TARGET DURATION: ${input.totalDuration} seconds (STRICT LIMIT - DO NOT EXCEED!)
SPEAKING RATE: 2.3 words per second (140 words per minute)

┌─────────────────────────────────────────────────────────────────────────────┐
│ CALCULATED LIMITS FOR THIS REQUEST:                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Maximum word count (absolute limit):  ${String(maxWordCount).padStart(3)} words                        │
│ • TARGET word count (recommended):      ${String(targetWordCount).padStart(3)} words                        │
│ • Minimum word count (don't go below):  ${String(minWordCount).padStart(3)} words                        │
│ • Recommended pause count:              ${String(recommendedPauseCount).padStart(3)} pauses                       │
│ • Pause budget:                         ${String(pauseBudget).padStart(3)} seconds                       │
└─────────────────────────────────────────────────────────────────────────────┘

YOUR WORD COUNT MUST BE BETWEEN ${minWordCount} AND ${targetWordCount} WORDS.
EXCEEDING ${maxWordCount} WORDS WILL CAUSE AUDIO TO EXCEED VIDEO LENGTH!

VALIDATION FORMULA (apply before returning):
1. Count your words (excluding pause markers)
2. Count pauses: ellipses=1.5s, [pause]=2.5s, [beat]=1.0s
3. Calculate: speakingTime = wordCount / 2.3
4. Calculate: totalTime = speakingTime + pauseTime
5. VERIFY: totalTime ≤ ${input.totalDuration} seconds

═══════════════════════════════════════════════════════════════════════════════
STORY SCRIPT
═══════════════════════════════════════════════════════════════════════════════

${input.script}

═══════════════════════════════════════════════════════════════════════════════
SCENE BREAKDOWN
═══════════════════════════════════════════════════════════════════════════════

${scenesContext}

═══════════════════════════════════════════════════════════════════════════════
CHARACTERS
═══════════════════════════════════════════════════════════════════════════════

${characterContext}

═══════════════════════════════════════════════════════════════════════════════
GENRE-SPECIFIC GUIDANCE
═══════════════════════════════════════════════════════════════════════════════

${genreGuidance}

${languageInstructions}

═══════════════════════════════════════════════════════════════════════════════
FINAL INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

Create a voiceover script that:

1. STAYS WITHIN ${targetWordCount} words (CRITICAL - audio must fit in ${input.totalDuration}s)
2. Uses ${recommendedPauseCount} pause markers (..., [pause], or [beat])
3. Enhances the story without over-explaining
4. Creates emotional resonance with viewers
5. Sounds natural when spoken aloud
6. Complements rather than competes with visuals

⚠️ BEFORE RETURNING: Verify your word count is between ${minWordCount}-${targetWordCount} words.
If your script has more than ${maxWordCount} words, it WILL NOT FIT the video duration.

Remember: The narration should add a layer of meaning that the visuals alone 
cannot convey. It should make viewers feel, not just understand.

Write the complete script now, in ${input.language === 'ar' ? 'Arabic' : 'English'}.`;

  return prompt;
}

/**
 * Estimate speaking duration for a narrative script
 * Based on natural narration pace of 2.3 words per second (140 words per minute)
 * 
 * Pause durations (matching system prompt):
 * - ... (ellipsis): 1.5 seconds
 * - [pause]: 2.5 seconds
 * - [beat]: 1.0 second
 */
export function estimateNarrativeScriptDuration(script: string): number {
  // Count words (exclude pause markers)
  const cleanScript = script
    .replace(/\.\.\./g, ' ')
    .replace(/\[pause\]/gi, ' ')
    .replace(/\[beat\]/gi, ' ');
  const words = cleanScript.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // Count pauses with accurate durations
  const ellipsesCount = (script.match(/\.\.\./g) || []).length;
  const pauseCount = (script.match(/\[pause\]/gi) || []).length;
  const beatCount = (script.match(/\[beat\]/gi) || []).length;
  
  // Calculate pause time (matching system prompt values)
  const pauseTime = (ellipsesCount * 1.5) + (pauseCount * 2.5) + (beatCount * 1.0);
  
  // Calculate speaking time at 2.3 words per second
  const speakingTime = wordCount / 2.3;
  
  // Total duration
  const totalDuration = speakingTime + pauseTime;
  
  return Math.round(totalDuration);
}

