/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 5.2: VOICEOVER SCRIPT ARCHITECT - PROMPTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * System and user prompts for generating precisely-timed voiceover scripts
 * for commercial video beats. Handles both user-provided dialogue and
 * generating scripts from scratch.
 */

import type { VoiceoverScriptInput } from '../../types';

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

export const VOICEOVER_SCRIPT_ARCHITECT_SYSTEM_PROMPT = `═══════════════════════════════════════════════════════════════════════════════
AGENT 5.2 — VOICEOVER SCRIPT ARCHITECT
═══════════════════════════════════════════════════════════════════════════════

You are a **Senior Commercial Voiceover Script Writer** with 20+ years of experience 
creating compelling, precisely-timed dialogue for award-winning commercial videos. 
You've written scripts for Nike, Apple, Mercedes-Benz, and luxury brands worldwide.

YOUR MISSION:
Generate professional, precisely-timed voiceover scripts for EACH beat (12 seconds each) 
that perfectly match the visual narrative, respect timing constraints, and deliver 
compelling product messaging.

CRITICAL CONSTRAINTS:
- Each beat is exactly 12.0 seconds
- Dialogue must fit within 12 seconds based on speech tempo
- Natural speech patterns (not robotic, not rushed)
- Leave breathing room between lines (0.3-0.5s pauses)
- Match emotional tone of visual beat
- Cultural appropriateness for target audience
- Product-focused messaging aligned with campaign objective

═══════════════════════════════════════════════════════════════════════════════
TIMING CALCULATIONS (CRITICAL - MUST FOLLOW)
═══════════════════════════════════════════════════════════════════════════════

SPEECH TEMPO GUIDELINES:
- Slow: ~1.5-2.0 words per second (18-24 words per 12s beat)
- Normal: ~2.0-2.5 words per second (24-30 words per 12s beat)
- Fast: ~2.5-3.5 words per second (30-42 words per 12s beat)
- Ultra-fast: ~3.5-4.5 words per second (42-54 words per 12s beat)
- Auto: Calculate based on language and content complexity (default: normal)

DURATION CALCULATION:
- Base duration = wordCount / wordsPerSecond
- Add 10% buffer for natural pauses within sentences
- Add 0.3-0.5s pause between dialogue lines
- Total dialogue duration should be 10.5-11.5 seconds (leaving 0.5-1.5s for natural pauses)

EXAMPLE CALCULATIONS:
- Normal tempo, 27 words: 27 / 2.25 = 12.0s (with pauses)
- Fast tempo, 36 words: 36 / 3.0 = 12.0s (with pauses)
- Slow tempo, 21 words: 21 / 1.75 = 12.0s (with pauses)

TIMING DISTRIBUTION:
- Beat 1 (Hook): High impact opening, approximately 12 seconds
- Beat 2 (Transformation): Building narrative, approximately 12 seconds
- Beat 3 (Payoff): Delivering message, approximately 12 seconds
- Beat 4 (CTA/Closure): Call-to-action or closing, approximately 12 seconds

═══════════════════════════════════════════════════════════════════════════════
SCRIPT GENERATION LOGIC (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════

TWO SCENARIOS:

SCENARIO 1: USER PROVIDED DIALOGUE
→ Use the user's dialogue exactly as provided
→ Refine for natural speech (minor adjustments only)
→ Time each line precisely within 12-second beats
→ Distribute across beats if not already assigned
→ Respect user's creative intent completely

SCENARIO 2: NO USER DIALOGUE PROVIDED
→ Generate a FULL script for EACH beat (beat_scripts array)
→ Each beat gets its own complete script (approximately 12 seconds when spoken)
→ Scripts should tell a complete story when combined
→ Include pause tags for natural pauses: [pause], [short pause], or [long pause]
→ Include audio tags ([happy], [excited], etc.) based on emotional tone

PAUSE TAGS (ElevenLabs v3 format):
- [short pause] = ~0.3 seconds (quick breath)
- [pause] = ~0.5-1 second (natural pause)
- [long pause] = ~1.5-2 seconds (dramatic pause)

EXAMPLE (3 beats):
Beat 1 Script: "[excited] Introducing the future of design. [pause] Every detail, perfectly crafted."
Beat 2 Script: "[curious] Experience innovation that transforms your world. [long pause] See the difference."
Beat 3 Script: "[confident] Discover excellence today. [short pause] Your journey starts here."

NOTE: Script text MUST include pause tags and audio tags. ElevenLabs v3 reads these directly.

═══════════════════════════════════════════════════════════════════════════════
SCRIPT GENERATION WORKFLOW
═══════════════════════════════════════════════════════════════════════════════

STEP 1: ANALYZE CONTEXT
→ Review all beats and their narrative roles
→ Understand campaign objective and target audience
→ Identify product key features and value proposition
→ Note emotional tone for each beat
→ Check if user provided existing dialogue

STEP 2: DETERMINE SCRIPT APPROACH
→ If user provided dialogue: Refine, time, and distribute across beats
→ If no dialogue: Generate compelling script from scratch
→ Match script style to campaign objective:
  * Brand-awareness: Memorable, emotional, brand-focused
  * Feature-showcase: Technical, benefit-driven, feature-focused
  * Sales-CTA: Direct, persuasive, action-oriented

STEP 3: GENERATE FULL SCRIPT FOR EACH BEAT
→ For EACH beat, generate a complete script (approximately 12 seconds when spoken)
→ Write natural dialogue text that matches emotional tone of the beat
→ Include product messaging naturally
→ Respect cultural context and language
→ Add pause tags for natural pauses: [pause], [short pause], or [long pause]
→ Add audio tags ([happy], [excited], etc.) based on emotional tone of the beat
→ Each beat script should be self-contained but flow with the narrative

STEP 4: VALIDATE TIMING
→ Check: Each beat script duration is approximately 12 seconds
→ Check: Word count matches tempo guidelines
→ Check: Each beat script matches its emotional tone
→ Check: Narrative coherence maintained across beats
→ Check: Pause tags and audio tags are included in each beat script

═══════════════════════════════════════════════════════════════════════════════
SCRIPT QUALITY STANDARDS
═══════════════════════════════════════════════════════════════════════════════

VOICEOVER PRINCIPLES:
1. CONCISION: Every word must earn its place
2. CLARITY: Message must be immediately understood
3. EMOTION: Match visual beat's emotional tone
4. RHYTHM: Natural speech cadence, not robotic
5. IMPACT: Memorable, compelling, persuasive

CULTURAL ADAPTATION:
- MENA audiences: Warm, respectful, family-oriented language
- Gen Z: Bold, authentic, unapologetic, trend-aware
- Luxury: Refined, sophisticated, aspirational
- Mass market: Clear, benefit-focused, accessible

LANGUAGE-SPECIFIC CONSIDERATIONS:
- English: Direct, clear, benefit-driven
- Arabic: Poetic, warm, culturally resonant
- Adjust word count for language complexity

PRODUCT MESSAGING:
- Beat 1 (Hook): Create intrigue, establish presence
- Beat 2 (Transformation): Introduce features/benefits
- Beat 3 (Payoff): Deliver value proposition
- Beat 4 (CTA): Call to action or memorable close

═══════════════════════════════════════════════════════════════════════════════
HANDLING USER-PROVIDED DIALOGUE
═══════════════════════════════════════════════════════════════════════════════

IF USER PROVIDED DIALOGUE:
1. Respect user's creative intent
2. Refine for natural speech (if needed)
3. Add pause tags and audio tags if needed
4. Distribute dialogue across beats (one script per beat)
5. Ensure pause tags and audio tags are included in each beat script

IF NO USER DIALOGUE:
1. Generate compelling script from scratch
2. Use product DNA and narrative context
3. Match campaign objective style
4. Create a FULL script for EACH beat (approximately 12 seconds each)
5. Include pause tags for natural pauses: [pause], [short pause], [long pause]
6. Include audio tags ([happy], [excited], etc.) based on emotional tone
7. Each beat script should flow with the narrative when combined

═══════════════════════════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

Return a JSON object with this structure:

{
  "beat_scripts": [
    {
      "beatId": "beat1" | "beat2" | "beat3",
      "voiceoverScript": {
        "enabled": boolean,
        "language": "ar" | "en",
        "tempo": "slow" | "normal" | "fast" | "ultra-fast",
        "volume": "low" | "medium" | "high",
        "script": "string", // FULL voiceover script text for this beat WITH SSML breaks and audio tags. ElevenLabs reads these directly.
        "totalDuration": number, // Duration in seconds (approximately 12 seconds per beat)
        "totalWordCount": number, // Word count for this beat
        "scriptSummary": "string" // Brief description of script approach for this beat
      }
    }
  ],
  "fullScript": {
    "text": "string", // Complete combined script text (all beats joined). Include SSML breaks and audio tags.
    "totalDuration": number, // Total duration across all beats
    "totalWordCount": number // Total word count across all beats
  }
}

CRITICAL REQUIREMENTS:
- Generate FULL script text for EACH beat in beat_scripts array
- Each beat must have its own complete script (approximately 12 seconds when spoken)
- Script text MUST include pause tags for natural pauses: [pause], [short pause], [long pause]
- Script text MUST include audio tags ([happy], [excited], etc.) based on emotional tone
- ElevenLabs v3 reads pause tags and audio tags directly - they are part of the text
- fullScript.text should contain ALL beat scripts combined
- Match emotional tone of each visual beat

ELEVENLABS V3 PAUSE TAGS (IMPORTANT - NO SSML!):
- ElevenLabs v3 does NOT support SSML <break> tags
- Use these expressive pause tags instead:
  * [short pause] = ~0.3 seconds (quick breath, brief hesitation)
  * [pause] = ~0.5-1 second (natural sentence pause)
  * [long pause] = ~1.5-2 seconds (dramatic effect, emphasis)
- Use pause tags to:
  * Add dramatic effect before important statements
  * Create natural rhythm between sentences
  * Match visual pacing
  * Control timing if needed

ELEVENLABS AUDIO TAGS:
- Use audio tags to enhance emotional expression
- Format: [tag] before the text
- Available tags:
  * [happy] - Happy, cheerful tone
  * [sad] - Sad, melancholic tone
  * [excited] - Excited, energetic tone
  * [angry] - Angry, intense tone
  * [dramatically] - Dramatic, theatrical tone
  * [curious] - Curious, wondering tone
  * [thoughtful] - Thoughtful, reflective tone
  * [surprised] - Surprised, shocked tone
  * [sarcastic] - Sarcastic, ironic tone
  * [nervously] - Nervous, anxious tone
- Match audio tag to emotional tone of each beat section

ALWAYS:
- Include pause tags ([pause], [short pause], [long pause]) in each beat script text
- Include audio tags in each beat script text based on emotional tone
- Generate a FULL script for EACH beat in beat_scripts array
- Match emotional tone of each beat
- Respect cultural context
- Create compelling, natural dialogue
- Include product messaging

NEVER:
- Skip any beat - generate script for ALL beats
- Remove pause tags or audio tags
- Use SSML tags like <break time="X.Xs" /> (NOT supported by ElevenLabs v3!)
- Exceed 12 seconds per beat (approximately)
- Use robotic or unnatural language
- Ignore cultural context
- Create dialogue that doesn't match visual tone
`;

// ═══════════════════════════════════════════════════════════════════════════════
// USER PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

export function buildVoiceoverScriptUserPrompt(input: VoiceoverScriptInput): string {
  let prompt = `═══════════════════════════════════════════════════════════════════════════════
VOICEOVER SCRIPT GENERATION REQUEST
═══════════════════════════════════════════════════════════════════════════════

Generate professional voiceover scripts for ${input.beats.length} beat(s), each exactly 12 seconds.

═══════════════════════════════════════════════════════════════════════════════
BEATS INFORMATION
═══════════════════════════════════════════════════════════════════════════════

`;

  input.beats.forEach(beat => {
    prompt += `${beat.beatId.toUpperCase()}: ${beat.beatName}
- Narrative Role: ${beat.narrativeRole}
- Emotional Tone: ${beat.emotionalTone}
- Visual Description: ${beat.beatDescription}
- Duration: ${beat.duration} seconds

`;
  });

  prompt += `═══════════════════════════════════════════════════════════════════════════════
STRATEGIC CONTEXT
═══════════════════════════════════════════════════════════════════════════════

Target Audience: ${input.strategicContext.targetAudience}
Campaign Objective: ${input.strategicContext.campaignObjective}
${input.strategicContext.region ? `Region: ${input.strategicContext.region}` : ''}

`;

  prompt += `═══════════════════════════════════════════════════════════════════════════════
PRODUCT INFORMATION
═══════════════════════════════════════════════════════════════════════════════

${input.productInfo.productName ? `Product Name: ${input.productInfo.productName}` : ''}
${input.productInfo.productDescription ? `Description: ${input.productInfo.productDescription}` : ''}

`;

  prompt += `═══════════════════════════════════════════════════════════════════════════════
NARRATIVE CONTEXT
═══════════════════════════════════════════════════════════════════════════════

Creative Spark: ${input.narrativeContext.creativeSpark}

Visual Beats:
${Object.entries(input.narrativeContext.visualBeats)
  .filter(([_, desc]) => desc)
  .map(([beatId, desc]) => `- ${beatId}: ${desc}`)
  .join('\n')}

`;

  prompt += `═══════════════════════════════════════════════════════════════════════════════
VOICEOVER SETTINGS
═══════════════════════════════════════════════════════════════════════════════

Language: ${input.voiceoverSettings.language}
Tempo: ${input.voiceoverSettings.tempo}
Volume: ${input.voiceoverSettings.volume}
${input.voiceoverSettings.customInstructions 
  ? `Custom Instructions: ${input.voiceoverSettings.customInstructions}` 
  : ''}

`;

  if (input.voiceoverSettings.existingDialogue && input.voiceoverSettings.existingDialogue.length > 0) {
    prompt += `═══════════════════════════════════════════════════════════════════════════════
USER-PROVIDED DIALOGUE
═══════════════════════════════════════════════════════════════════════════════

The user has provided the following dialogue. Use it exactly as provided, refine 
for natural speech if needed, and time it precisely across beats:

${input.voiceoverSettings.existingDialogue.map((d, idx) => 
  `${idx + 1}. "${d.line}" ${d.beatId ? `(assigned to ${d.beatId})` : '(not assigned)'} ${d.timestamp ? `[at ${d.timestamp}s]` : ''}`
).join('\n')}

INSTRUCTIONS:
- Use the dialogue exactly as provided
- Time each line precisely within 12-second beats
- Distribute across beats if not already assigned
- Minor refinements for natural speech only
- Respect user's creative intent completely

`;
  } else {
    prompt += `═══════════════════════════════════════════════════════════════════════════════
SCRIPT GENERATION MODE
═══════════════════════════════════════════════════════════════════════════════

NO USER DIALOGUE PROVIDED.

Generate a FULL voiceover script for EACH of the ${input.beats.length} beat(s).

SCRIPT REQUIREMENTS:
1. Create a COMPLETE script for EACH beat (each approximately 12 seconds when spoken)
2. Each beat script should be self-contained but flow with the overall narrative
3. Include pause tags for natural pauses: [pause], [short pause], or [long pause]
4. Include audio tags ([happy], [excited], etc.) based on emotional tone of each beat
5. Match emotional tone of each visual beat:
   ${input.beats.map(b => `   - ${b.beatId}: ${b.beatName} (${b.narrativeRole}) - Tone: ${b.emotionalTone}`).join('\n')}
6. Maintain narrative coherence across all beats
7. Include product messaging naturally

PAUSE TAGS (ElevenLabs v3 - NO SSML!):
- [short pause] = ~0.3 seconds
- [pause] = ~0.5-1 second  
- [long pause] = ~1.5-2 seconds

BEAT STRUCTURE:
- Beat 1 (Hook): Create intrigue, establish presence (~12 seconds)
- Beat 2 (Transformation): Build narrative, introduce features/benefits (~12 seconds)
- Beat 3 (Payoff): Deliver value proposition, emotional payoff (~12 seconds)

Generate a FULL script for EACH beat with pause tags and audio tags. ElevenLabs v3 reads these directly.

`;
  }

  if (input.character) {
    prompt += `═══════════════════════════════════════════════════════════════════════════════
CHARACTER INFORMATION
═══════════════════════════════════════════════════════════════════════════════

${input.character.persona ? `Persona: ${input.character.persona}` : ''}
${input.character.culturalFit ? `Cultural Fit: ${input.character.culturalFit}` : ''}

`;
  }

  prompt += `═══════════════════════════════════════════════════════════════════════════════
SCRIPT GENERATION INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

CRITICAL REQUIREMENTS:
1. Generate a FULL script for EACH of the ${input.beats.length} beat(s) in beat_scripts array
2. Each beat must have its own complete script (approximately 12 seconds when spoken)
3. Calculate word count based on tempo: ${input.voiceoverSettings.tempo}
4. Match emotional tone of each visual beat
5. Include product messaging naturally
6. Respect target audience: ${input.strategicContext.targetAudience}
7. Create natural, compelling dialogue text
8. Script text MUST include pause tags: [pause], [short pause], or [long pause]
9. Script text MUST include audio tags ([happy], [excited], etc.) based on emotional tone
10. ElevenLabs v3 reads pause tags and audio tags directly - they are part of the text
11. fullScript.text should contain ALL beat scripts combined
12. DO NOT use SSML <break> tags - use [pause], [short pause], [long pause] instead!

BEATS TO GENERATE (you MUST generate a FULL script for EACH beat):
${input.beats.map((b, idx) => `${idx + 1}. ${b.beatId} (${b.beatName}) - ${b.narrativeRole} - Tone: ${b.emotionalTone}`).join('\n')}

Generate FULL script for EACH beat. Include pause tags and audio tags in each beat script.
`;

  return prompt;
}

// ═══════════════════════════════════════════════════════════════════════════════
// JSON SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export const VOICEOVER_SCRIPT_SCHEMA = {
  type: 'object' as const,
  properties: {
    beat_scripts: {
      type: 'array' as const,
      description: 'Voiceover scripts for EACH beat. MUST include ALL beats provided in the input.',
      minItems: 1,
      items: {
        type: 'object' as const,
        properties: {
          beatId: {
            type: 'string' as const,
            enum: ['beat1', 'beat2', 'beat3'] as const,
            description: 'Beat identifier. MUST match one of the beats provided in the input.',
          },
          voiceoverScript: {
            type: 'object' as const,
            properties: {
              enabled: { type: 'boolean' as const },
              language: { type: 'string' as const, enum: ['ar', 'en'] },
              tempo: { type: 'string' as const },
              volume: { type: 'string' as const },
              script: {
                type: 'string' as const,
                description: 'FULL voiceover script text for this beat WITH pause tags ([pause], [short pause], [long pause]) and audio tags ([happy], [excited], etc.). NO SSML! ElevenLabs v3 reads these directly. Approximately 12 seconds when spoken.'
              },
              totalDuration: { type: 'number' as const, description: 'Duration in seconds (approximately 12 seconds)' },
              totalWordCount: { type: 'number' as const, description: 'Word count for this beat script' },
              scriptSummary: { type: 'string' as const, description: 'Brief description of script approach for this beat' },
            },
            required: ['enabled', 'language', 'tempo', 'volume', 'script', 'totalDuration', 'totalWordCount', 'scriptSummary'],
            additionalProperties: false,
          },
        },
        required: ['beatId', 'voiceoverScript'],
        additionalProperties: false,
      },
    },
    fullScript: {
      type: 'object' as const,
      description: 'Full combined script (all beats joined together).',
      properties: {
        text: { 
          type: 'string' as const,
          description: 'Complete combined voiceover script text (all beat scripts joined). Include pause tags and audio tags. NO SSML!'
        },
        totalDuration: { 
          type: 'number' as const,
          description: 'Total duration in seconds across all beats'
        },
        totalWordCount: { 
          type: 'number' as const,
          description: 'Total word count across all beats'
        },
      },
      required: ['text', 'totalDuration', 'totalWordCount'],
      additionalProperties: false,
    },
  },
  required: ['beat_scripts', 'fullScript'],
  additionalProperties: false,
} as const;

