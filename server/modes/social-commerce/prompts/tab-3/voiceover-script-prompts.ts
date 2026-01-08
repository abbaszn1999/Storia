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
Generate professional, precisely-timed voiceover scripts for EACH beat (8 seconds each) 
that perfectly match the visual narrative, respect timing constraints, and deliver 
compelling product messaging.

CRITICAL CONSTRAINTS:
- Each beat is exactly 8.0 seconds
- Dialogue must fit within 8 seconds based on speech tempo
- Natural speech patterns (not robotic, not rushed)
- Leave breathing room between lines (0.3-0.5s pauses)
- Match emotional tone of visual beat
- Cultural appropriateness for target audience
- Product-focused messaging aligned with campaign objective

═══════════════════════════════════════════════════════════════════════════════
TIMING CALCULATIONS (CRITICAL - MUST FOLLOW)
═══════════════════════════════════════════════════════════════════════════════

SPEECH TEMPO GUIDELINES:
- Slow: ~1.5-2.0 words per second (12-16 words per 8s beat)
- Normal: ~2.0-2.5 words per second (16-20 words per 8s beat)
- Fast: ~2.5-3.5 words per second (20-28 words per 8s beat)
- Ultra-fast: ~3.5-4.5 words per second (28-36 words per 8s beat)
- Auto: Calculate based on language and content complexity (default: normal)

DURATION CALCULATION:
- Base duration = wordCount / wordsPerSecond
- Add 10% buffer for natural pauses within sentences
- Add 0.3-0.5s pause between dialogue lines
- Total dialogue duration should be 6.5-7.5 seconds (leaving 0.5-1.5s for natural pauses)

EXAMPLE CALCULATIONS:
- Normal tempo, 18 words: 18 / 2.25 = 8.0s (with pauses)
- Fast tempo, 24 words: 24 / 3.0 = 8.0s (with pauses)
- Slow tempo, 14 words: 14 / 1.75 = 8.0s (with pauses)

TIMING DISTRIBUTION:
- Beat 1 (Hook): Usually 1-2 lines, high impact opening
- Beat 2 (Transformation): 2-3 lines, building narrative
- Beat 3 (Payoff): 2-3 lines, delivering message
- Beat 4 (CTA/Closure): 1-2 lines, call-to-action or closing

═══════════════════════════════════════════════════════════════════════════════
SCRIPT GENERATION LOGIC (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════

TWO SCENARIOS:

SCENARIO 1: USER PROVIDED DIALOGUE
→ Use the user's dialogue exactly as provided
→ Refine for natural speech (minor adjustments only)
→ Time each line precisely within 8-second beats
→ Distribute across beats if not already assigned
→ Respect user's creative intent completely

SCENARIO 2: NO USER DIALOGUE PROVIDED
→ Generate ONE continuous, cohesive voiceover script
→ Script should tell a complete story across all beats
→ Divide the script intelligently across beats:
  * Beat 1 (Hook): Opening lines (first ~8 seconds of script)
  * Beat 2 (Transformation): Middle lines (next ~8 seconds)
  * Beat 3 (Payoff): Climax lines (next ~8 seconds)
  * Beat 4 (CTA): Closing lines (final ~8 seconds, if exists)
→ Each beat gets a segment of the continuous script
→ Script should flow naturally when read sequentially
→ Total script duration = number of beats × 8 seconds

SCRIPT DIVISION STRATEGY:
- Read the full script and identify natural break points
- Divide at sentence boundaries or natural pauses
- Ensure each beat segment fits within 8 seconds
- Maintain narrative flow across beat boundaries
- Each segment should feel complete yet connected

EXAMPLE (No User Dialogue):
Full Script: "Introducing the future of design. Every detail, perfectly crafted. 
Experience innovation that transforms your world. Discover excellence today."

Beat 1 (0-8s): "Introducing the future of design. Every detail, perfectly crafted."
Beat 2 (8-16s): "Experience innovation that transforms your world."
Beat 3 (16-24s): "Discover excellence today."

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

STEP 3: GENERATE DIALOGUE PER BEAT
→ For EACH beat:
  - Calculate available time based on tempo
  - Write dialogue that matches emotional tone
  - Include product messaging naturally
  - Respect cultural context and language
  - Time each line precisely (start time + duration)
  - Leave appropriate pauses between lines

STEP 4: VALIDATE TIMING
→ Check: Total dialogue duration fits within 8 seconds
→ Check: Pauses are natural (0.3-0.5s between lines)
→ Check: Word count matches tempo guidelines
→ Check: Script flows naturally across all beats
→ Check: Narrative coherence maintained

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
3. Time each line precisely within 8-second beats
4. Distribute across beats if not already assigned
5. Fill gaps if dialogue doesn't cover all beats
6. Adjust word count to match tempo if needed

IF NO USER DIALOGUE:
1. Generate compelling script from scratch
2. Use product DNA and narrative context
3. Match campaign objective style
4. Create natural, flowing dialogue
5. Ensure each beat has appropriate dialogue

═══════════════════════════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

Return a JSON object with this structure:

{
  "beat_scripts": [
    {
      "beatId": "beat1" | "beat2" | "beat3" | "beat4",
      "voiceoverScript": {
        "enabled": boolean,
        "language": "ar" | "en",
        "tempo": "slow" | "normal" | "fast" | "ultra-fast",
        "volume": "low" | "medium" | "high",
        "dialogue": [
          {
            "timestamp": number, // Start time (0.0-8.0)
            "duration": number, // Duration in seconds
            "line": "string", // Dialogue text
            "wordCount": number,
            "emotionalTone": "string",
            "pacing": "slow" | "normal" | "fast"
          }
        ],
        "totalDuration": number, // Sum of all dialogue + pauses
        "totalWordCount": number,
        "scriptSummary": "string" // Brief description
      }
    }
  ],
  "fullScript": {
    "text": "string", // Complete script if generated from scratch, empty string "" if user provided dialogue
    "totalDuration": number, // Total duration across all beats (0 if user provided dialogue)
    "totalWordCount": number // Total word count across all beats (0 if user provided dialogue)
  }
}

CRITICAL: fullScript is ALWAYS REQUIRED:
- If user provided dialogue: Set text to empty string "", totalDuration to 0, totalWordCount to 0
- If generated from scratch: Include the complete continuous script with actual values

CRITICAL REQUIREMENTS:
- Generate scripts for ALL beats provided
- Each dialogue line must have precise timestamp and duration
- Total duration must fit within 8 seconds per beat
- Word count must match tempo guidelines
- Script must flow naturally across beats
- Match emotional tone of each visual beat

NEVER:
- Exceed 8 seconds per beat
- Use robotic or unnatural language
- Ignore cultural context
- Create dialogue that doesn't match visual tone
- Skip timing calculations
- Generate generic scripts

ALWAYS:
- Calculate timing precisely
- Match emotional tone
- Respect cultural context
- Create compelling, natural dialogue
- Include product messaging
- Leave natural pauses between lines
`;

// ═══════════════════════════════════════════════════════════════════════════════
// USER PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

export function buildVoiceoverScriptUserPrompt(input: VoiceoverScriptInput): string {
  let prompt = `═══════════════════════════════════════════════════════════════════════════════
VOICEOVER SCRIPT GENERATION REQUEST
═══════════════════════════════════════════════════════════════════════════════

Generate professional voiceover scripts for ${input.beats.length} beat(s), each exactly 8 seconds.

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
- Time each line precisely within 8-second beats
- Distribute across beats if not already assigned
- Minor refinements for natural speech only
- Respect user's creative intent completely

`;
  } else {
    prompt += `═══════════════════════════════════════════════════════════════════════════════
SCRIPT GENERATION MODE
═══════════════════════════════════════════════════════════════════════════════

NO USER DIALOGUE PROVIDED.

Generate ONE continuous, cohesive voiceover script that tells a complete story 
across all ${input.beats.length} beat(s).

SCRIPT REQUIREMENTS:
1. Create ONE unified script (total duration: ${input.beats.length * 8} seconds)
2. Script should flow naturally when read sequentially
3. Divide the script intelligently across beats:
   ${input.beats.map(b => `   - ${b.beatId}: ${b.beatName} (${b.narrativeRole})`).join('\n')}
4. Each beat segment must fit within 8 seconds
5. Divide at natural break points (sentence boundaries)
6. Maintain narrative coherence across all beats
7. Match emotional tone of each visual beat
8. Include product messaging naturally

SCRIPT STRUCTURE:
- Opening (Beat 1): Hook, establish presence, create intrigue
- Development (Beat 2): Build narrative, introduce features/benefits
- Climax (Beat 3): Deliver value proposition, emotional payoff
- Closing (Beat 4, if exists): Call to action or memorable close

Generate the complete script now, then divide it across beats with precise timing.

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
GENERATION INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

1. Generate dialogue for ALL ${input.beats.length} beat(s)
2. Each beat is exactly 8.0 seconds
3. Calculate timing based on tempo: ${input.voiceoverSettings.tempo}
4. Match emotional tone of each visual beat
5. Include product messaging naturally
6. Respect target audience: ${input.strategicContext.targetAudience}
7. Create natural, compelling dialogue
8. Time each line precisely with start time and duration
9. Leave 0.3-0.5s pauses between lines
10. Total dialogue should be 6.5-7.5 seconds per beat

Generate scripts now.
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
      description: 'Voiceover scripts for each beat',
      items: {
        type: 'object' as const,
        properties: {
          beatId: {
            type: 'string' as const,
            enum: ['beat1', 'beat2', 'beat3', 'beat4'] as const,
            description: 'Beat identifier',
          },
          voiceoverScript: {
            type: 'object' as const,
            properties: {
              enabled: { type: 'boolean' as const },
              language: { type: 'string' as const, enum: ['ar', 'en'] },
              tempo: { type: 'string' as const },
              volume: { type: 'string' as const },
              dialogue: {
                type: 'array' as const,
                items: {
                  type: 'object' as const,
                  properties: {
                    timestamp: { type: 'number' as const, description: 'Start time in seconds (0.0-8.0)' },
                    duration: { type: 'number' as const, description: 'Duration in seconds' },
                    line: { type: 'string' as const, description: 'Dialogue text' },
                    wordCount: { type: 'number' as const, description: 'Number of words' },
                    emotionalTone: { type: 'string' as const },
                    pacing: { type: 'string' as const, enum: ['slow', 'normal', 'fast'] },
                  },
                  required: ['timestamp', 'duration', 'line', 'wordCount', 'emotionalTone', 'pacing'],
                  additionalProperties: false,
                },
              },
              totalDuration: { type: 'number' as const, description: 'Total duration including pauses' },
              totalWordCount: { type: 'number' as const },
              scriptSummary: { type: 'string' as const },
            },
            required: ['enabled', 'language', 'tempo', 'volume', 'dialogue', 'totalDuration', 'totalWordCount', 'scriptSummary'],
            additionalProperties: false,
          },
        },
        required: ['beatId', 'voiceoverScript'],
        additionalProperties: false,
      },
    },
    fullScript: {
      type: 'object' as const,
      description: 'Full continuous script. If user provided dialogue, use empty string for text. If generated from scratch, include the complete script.',
      properties: {
        text: { type: 'string' as const },
        totalDuration: { type: 'number' as const },
        totalWordCount: { type: 'number' as const },
      },
      required: ['text', 'totalDuration', 'totalWordCount'],
      additionalProperties: false,
    },
  },
  required: ['beat_scripts', 'fullScript'],
  additionalProperties: false,
} as const;

