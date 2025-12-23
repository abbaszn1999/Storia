/**
 * Prompts for Agent 3.1: Atmospheric World-Builder
 */

export const WORLD_BUILDER_SYSTEM_PROMPT = `You are an **Emmy-winning Set Designer and Director of Photography** with 20+ years of experience crafting iconic commercial environments. You've designed sets for Hermès, Audi, Apple, and Chanel. You understand that environment is not backdrop — it's character.

YOUR MISSION

Create a **Global Visual Manifest** — the environmental DNA that every shot in this campaign will inherit.

Your manifest must define:
1. LIGHTING — Precise geometry, color temperature, quality
2. PHYSICS — Atmospheric effects, particles, environmental behavior
3. COLOR — 3-color chromatic bible (primary, secondary, accent)
4. ANCHOR PROMPT — The environmental DNA prefix for all generation

LIGHTING EXPERTISE

Describe lighting with technical precision using degrees, Kelvin, and ratios.

ATMOSPHERIC PHYSICS

Define environmental physics precisely:
- FOG DENSITY (0-1): Atmospheric haze level
- MOISTURE LEVEL (0-1): Surface wetness and humidity
- WIND INTENSITY (0-1): Air movement affecting hair/fabric
- DUST FREQUENCY (0-1): Floating particle density
- PARTICLE TYPE: floating_dust | rain | snow | embers | smoke | none

ATMOSPHERIC DENSITY SLIDER CONVERSION:
- 0-20: fog 0.0-0.1, dust 0.0-0.1 (Clean, clinical)
- 21-40: fog 0.1-0.2, dust 0.1-0.2 (Subtle atmosphere)
- 41-60: fog 0.2-0.4, dust 0.2-0.4 (Moody, cinematic)
- 61-80: fog 0.4-0.6, dust 0.3-0.5 (Heavy atmosphere)
- 81-100: fog 0.6-0.8, dust 0.5-0.7 (Dense, dramatic)

CHROMATIC BIBLE

Create a 3-color palette:
- PRIMARY HEX: Dominant color (50% of frame)
- SECONDARY HEX: Supporting color (35% of frame)
- ACCENT HEX: Pop color (15% of frame)

ENVIRONMENTAL ANCHOR PROMPT

Create a prefix prompt (2-4 sentences) that will be prepended to EVERY shot generation. Include physical space, lighting quality, atmospheric effects, and render quality markers.

OUTPUT REQUIREMENTS

Return a JSON object with EXACTLY this structure:
{
  "visual_manifest": {
    "global_lighting_setup": "String — Technical lighting spec with positions, color temps, quality, ratios. 2-4 sentences.",
    "physics_parameters": {
      "fog_density": 0.0-1.0,
      "moisture_level": 0.0-1.0,
      "wind_intensity": 0.0-1.0,
      "dust_frequency": 0.0-1.0,
      "particle_type": "floating_dust | rain | snow | embers | smoke | none"
    },
    "chromatic_bible": {
      "primary_hex": "#XXXXXX",
      "secondary_hex": "#XXXXXX",
      "accent_hex": "#XXXXXX"
    },
    "environmental_anchor_prompt": "String — 2-4 sentence prefix prompt that establishes environmental DNA for all shots"
  }
}

CONSTRAINTS

NEVER:
- Use vague lighting descriptions
- Ignore the atmospheric density slider
- Create environments that clash with the creative spark
- Output non-hex color values
- Add explanation — output ONLY the JSON

ALWAYS:
- Use precise lighting terminology (angles, Kelvin, ratios)
- Honor brand colors when provided
- Scale physics_parameters based on atmosphericDensity slider
- Create physics that match the environment concept
- Make the anchor prompt specific and evocative
- Ensure all 3 chromatic bible colors are distinct`;

export function buildWorldBuilderUserPrompt(input: {
  strategic_directives: string;
  optimized_image_instruction: string;
  creative_spark: string;
  environmentConcept: string;
  atmosphericDensity: number;
  cinematicLighting: string;
  visualPreset: string;
  styleReferenceUrl?: string | null;
  environmentBrandPrimaryColor?: string;
  environmentBrandSecondaryColor?: string;
}): string {
  return `STRATEGIC CONTEXT (From Agent 1.1)

STRATEGIC DIRECTIVES:
${input.strategic_directives}

VISUAL STYLE BIBLE:
${input.optimized_image_instruction}

CREATIVE SPARK (From Agent 3.0)

${input.creative_spark}

ENVIRONMENT INPUTS (From Tab 3 Frontend)

ENVIRONMENT CONCEPT: "${input.environmentConcept}"

ATMOSPHERIC DENSITY: ${input.atmosphericDensity} / 100

CINEMATIC LIGHTING PRESET: ${input.cinematicLighting}

VISUAL PRESET: ${input.visualPreset}

${input.styleReferenceUrl ? 'STYLE REFERENCE IMAGE PROVIDED: Yes\n[STYLE REFERENCE IMAGE ATTACHED]' : 'STYLE REFERENCE IMAGE PROVIDED: No'}

BRAND COLORS

${input.environmentBrandPrimaryColor ? `PRIMARY COLOR OVERRIDE: ${input.environmentBrandPrimaryColor}` : 'PRIMARY COLOR: (Derive from environment concept and creative spark)'}

${input.environmentBrandSecondaryColor ? `SECONDARY COLOR OVERRIDE: ${input.environmentBrandSecondaryColor}` : 'SECONDARY COLOR: (Derive from environment concept and creative spark)'}

TASK

Create the Global Visual Manifest for this campaign environment.

Your manifest must:
1. Translate "${input.cinematicLighting}" preset into precise technical specifications
2. Convert atmospheric density (${input.atmosphericDensity}/100) to physics parameters
3. Create a cohesive 3-color chromatic bible honoring any provided brand colors
4. Write an anchor prompt that captures the environmental DNA

Return ONLY the JSON object — no explanation, no preamble.`;
}

export const WORLD_BUILDER_SCHEMA = {
  type: 'object',
  required: ['visual_manifest'],
  properties: {
    visual_manifest: {
      type: 'object',
      required: ['global_lighting_setup', 'physics_parameters', 'chromatic_bible', 'environmental_anchor_prompt'],
      properties: {
        global_lighting_setup: {
          type: 'string',
          minLength: 100,
          maxLength: 500,
          description: 'Technical lighting specification with angles, color temps, quality, ratios',
        },
        physics_parameters: {
          type: 'object',
          required: ['fog_density', 'moisture_level', 'wind_intensity', 'dust_frequency', 'particle_type'],
          properties: {
            fog_density: { type: 'number', minimum: 0, maximum: 1 },
            moisture_level: { type: 'number', minimum: 0, maximum: 1 },
            wind_intensity: { type: 'number', minimum: 0, maximum: 1 },
            dust_frequency: { type: 'number', minimum: 0, maximum: 1 },
            particle_type: {
              type: 'string',
              enum: ['floating_dust', 'rain', 'snow', 'embers', 'smoke', 'none'],
            },
          },
          additionalProperties: false,
        },
        chromatic_bible: {
          type: 'object',
          required: ['primary_hex', 'secondary_hex', 'accent_hex'],
          properties: {
            primary_hex: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
            secondary_hex: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
            accent_hex: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
          },
          additionalProperties: false,
        },
        environmental_anchor_prompt: {
          type: 'string',
          minLength: 100,
          maxLength: 500,
          description: 'Prefix prompt that establishes environmental DNA for all shots',
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;

