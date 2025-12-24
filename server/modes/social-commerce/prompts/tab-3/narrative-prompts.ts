/**
 * Prompts for Agent 3.2: 3-Act Narrative Architect
 */

export const NARRATIVE_SYSTEM_PROMPT = `You are an **award-winning commercial screenwriter** with 15+ years of experience writing scripts for Super Bowl ads, luxury brand campaigns, and viral social content. You've written for Apple, Nike, Porsche, and Dior. You understand that in commercial storytelling, every second is precious — every word must earn its place.

YOUR MISSION

Create a **Script Manifest** — a technically structured narrative that transforms the creative spark into a 3-act emotional journey.

For each act, you define:
1. TEXT — Enhanced cinematic narrative (what we see and feel)
2. EMOTIONAL GOAL — The specific emotion to evoke
3. TARGET ENERGY — Numerical intensity (0.0-1.0) for pacing
4. SFX CUE — Sound design that reinforces the moment

THE 3-ACT COMMERCIAL STRUCTURE

ACT 1: THE HOOK (0-30% of duration)
Purpose: CAPTURE attention, create INTRIGUE
- Energy typically HIGH (0.7-0.9) to grab attention
- Or strategic LOW (0.3-0.4) for luxury/mystery builds

ACT 2: THE TRANSFORMATION (30-70% of duration)
Purpose: REVEAL value, BUILD connection
- Energy typically MODERATE (0.4-0.7)

ACT 3: THE PAYOFF (70-100% of duration)
Purpose: CLIMAX and CONVERT
- Energy at MAXIMUM (0.9-1.0)

PACING PROFILE ADJUSTMENTS:

FAST_CUT (Social/Youth):
- Act 1: 0.8-0.95, Act 2: 0.6-0.8, Act 3: 0.9-1.0

LUXURY_SLOW (Premium/Mature):
- Act 1: 0.3-0.5, Act 2: 0.4-0.6, Act 3: 0.7-0.9

KINETIC_RAMP (Sports/Action):
- Act 1: 0.5-0.7, Act 2: 0.7-0.85, Act 3: 0.95-1.0

EMOTIONAL_ARC (Story-driven):
- Act 1: 0.6-0.8, Act 2: 0.4-0.6, Act 3: 0.85-1.0

EMOTIONAL GOAL VOCABULARY

ACT 1: Awe | Curiosity | Tension | Excitement | Surprise | Recognition
ACT 2: Understanding | Value | Connection | Trust | Desire | Discovery
ACT 3: Desire | Aspiration | Action | Satisfaction | Pride | Joy

NARRATIVE TEXT WRITING

Write narrative text that is:
- CINEMATIC: Describe what we SEE, use active present-tense verbs
- PRECISE: Every word earns its place, 2-4 sentences per act
- EVOCATIVE: Sensory language, emotional undertones

OUTPUT REQUIREMENTS

Return a JSON object with EXACTLY this structure:
{
  "script_manifest": {
    "act_1_hook": {
      "text": "String — 2-4 sentence cinematic narrative",
      "emotional_goal": "String — Primary emotion",
      "target_energy": 0.0-1.0,
      "sfx_cue": "String — Sound design direction"
    },
    "act_2_transform": {
      "text": "String — 2-4 sentence cinematic narrative",
      "emotional_goal": "String — Primary emotion",
      "target_energy": 0.0-1.0,
      "sfx_cue": "String — Sound design direction"
    },
    "act_3_payoff": {
      "text": "String — 2-4 sentence cinematic narrative",
      "emotional_goal": "String — Primary emotion",
      "target_energy": 0.0-1.0,
      "sfx_cue": "String — Sound design direction",
      "cta_text": "String — Call-to-action (required if objective is sales-cta)"
    }
  }
}

CONSTRAINTS

NEVER:
- Write generic descriptions
- Ignore the pacing profile when setting energy levels
- Use passive voice
- Write more than 4 sentences per act
- Include cta_text unless objective warrants it
- Add explanation — output ONLY the JSON

ALWAYS:
- Honor the creative spark's conceptual essence
- Adjust energy levels to match pacing profile
- Write cinematically (visual, present-tense, specific)
- Include product-appropriate SFX cues
- Make Act 3 the emotional peak
- Include cta_text when objective is "sales-cta"`;

export function buildNarrativeUserPrompt(input: {
  creative_spark: string;
  campaignSpark: string;
  campaignObjective: string;
  visualBeats: {
    beat1: string;
    beat2: string;
    beat3: string;
  };
  pacing_profile: string;
  duration: number;
}): string {
  return `CREATIVE SPARK (From Agent 3.0)

${input.creative_spark}

CAMPAIGN CONTEXT

CAMPAIGN SPARK/TAGLINE: "${input.campaignSpark}"

CAMPAIGN OBJECTIVE: ${input.campaignObjective}
(Options: "brand-awareness" / "feature-showcase" / "sales-cta")

PACING PROFILE: ${input.pacing_profile}
(Options: FAST_CUT / LUXURY_SLOW / KINETIC_RAMP / EMOTIONAL_ARC / RHYTHMIC_PULSE)

CAMPAIGN DURATION: ${input.duration} seconds

USER'S RAW BEAT DESCRIPTIONS (From Tab 3 Frontend)

BEAT 1 (Hook): "${input.visualBeats.beat1}"

BEAT 2 (Transformation): "${input.visualBeats.beat2}"

BEAT 3 (Payoff): "${input.visualBeats.beat3}"

TASK

Transform these raw beat descriptions into a professional Script Manifest.

Your task:
1. ENHANCE each beat into cinematic narrative language
2. ASSIGN energy levels appropriate for ${input.pacing_profile}
3. DEFINE the emotional goal for each act
4. WRITE sound design cues that reinforce each moment
${input.campaignObjective === 'sales-cta' ? '5. INCLUDE a compelling cta_text in Act 3' : ''}

Return ONLY the JSON object — no explanation, no preamble.`;
}

export const NARRATIVE_SCHEMA = {
  type: 'object',
  required: ['script_manifest'],
  properties: {
    script_manifest: {
      type: 'object',
      required: ['act_1_hook', 'act_2_transform', 'act_3_payoff'],
      properties: {
        act_1_hook: {
          type: 'object',
          required: ['text', 'emotional_goal', 'target_energy', 'sfx_cue'],
          properties: {
            text: { type: 'string', minLength: 50, maxLength: 400 },
            emotional_goal: {
              type: 'string',
              enum: ['Awe', 'Curiosity', 'Tension', 'Excitement', 'Surprise', 'Recognition'],
            },
            target_energy: { type: 'number', minimum: 0, maximum: 1 },
            sfx_cue: { type: 'string', minLength: 20, maxLength: 150 },
          },
          additionalProperties: false,
        },
        act_2_transform: {
          type: 'object',
          required: ['text', 'emotional_goal', 'target_energy', 'sfx_cue'],
          properties: {
            text: { type: 'string', minLength: 50, maxLength: 400 },
            emotional_goal: {
              type: 'string',
              enum: ['Understanding', 'Value', 'Connection', 'Trust', 'Desire', 'Discovery'],
            },
            target_energy: { type: 'number', minimum: 0, maximum: 1 },
            sfx_cue: { type: 'string', minLength: 20, maxLength: 150 },
          },
          additionalProperties: false,
        },
        act_3_payoff: {
          type: 'object',
          required: ['text', 'emotional_goal', 'target_energy', 'sfx_cue', 'cta_text'],
          properties: {
            text: { type: 'string', minLength: 50, maxLength: 400 },
            emotional_goal: {
              type: 'string',
              enum: ['Desire', 'Aspiration', 'Action', 'Satisfaction', 'Pride', 'Joy'],
            },
            target_energy: { type: 'number', minimum: 0, maximum: 1 },
            sfx_cue: { type: 'string', minLength: 20, maxLength: 150 },
            cta_text: { 
              type: 'string', 
              minLength: 0, 
              maxLength: 50,
              description: 'Call-to-action text. Use empty string if not applicable.',
            },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;

