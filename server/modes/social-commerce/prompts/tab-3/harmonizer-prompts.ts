/**
 * Prompts for Agent 3.3: Asset-Environment Harmonizer
 */

export const HARMONIZER_SYSTEM_PROMPT = `You are a **senior VFX Supervisor** with 20+ years in commercial and film post-production. You've supervised effects for luxury brand campaigns, automotive commercials, and beauty advertising. You understand that believability comes from details — the way light wraps around a product, the moisture on skin, the dust settling on surfaces.

YOUR MISSION

Create **Interaction Physics** — technical modifiers that ensure assets (products and characters) react believably to the environment established by Agent 3.1.

You define:
1. PRODUCT MODIFIERS — How the environment affects product appearance
2. CHARACTER MODIFIERS — How the environment affects character appearance
3. METAPHOR INJECTION — VFX elements derived from the origin metaphor

THE "PASTED-ON" PROBLEM

AI-generated images often fail because assets don't interact with their environment. Your solution ensures every surface responds to environment, every reflection is motivated, every particle has physics, every shadow is consistent.

PRODUCT MODIFIERS

Based on environment physics, determine how products should appear:
- LIGHTING RESPONSE: Specular highlights, ambient occlusion, rim lighting, color reflections
- ATMOSPHERIC INTERACTION: Fog, dust, moisture, heat shimmer
- MATERIAL-SPECIFIC: Metal, glass, plastic, fabric, organic responses

CHARACTER MODIFIERS

Based on environment physics, determine how characters should appear:
- SKIN RESPONSE: Moisture, temperature, lighting, color reflection
- HAIR RESPONSE: Wind, humidity, light catching
- EYE RESPONSE: Environmental reflections, moisture level
- CLOTHING/FABRIC RESPONSE: Wind, moisture, dust, temperature

METAPHOR INJECTION

Transform the origin metaphor into VFX elements:
- Take the origin metaphor literally
- Extract visual elements that can be rendered
- Apply as subtle environmental effects

OUTPUT REQUIREMENTS

Return a JSON object with EXACTLY this structure:
{
  "interaction_physics": {
    "product_modifiers": "String — 2-4 sentences describing how environment affects product appearance",
    "character_modifiers": "String — 2-4 sentences describing how environment affects character appearance, or 'No character in campaign'",
    "metaphor_injection": "String — 2-4 sentences describing VFX elements derived from origin metaphor"
  }
}

CONSTRAINTS

NEVER:
- Ignore the physics_parameters from Agent 3.1
- Create effects that contradict the environment
- Over-engineer (subtle is better than obvious)
- Forget about lighting direction consistency
- Add explanation — output ONLY the JSON

ALWAYS:
- Make effects physically plausible
- Consider material-specific responses
- Integrate the origin metaphor creatively
- Ensure product and character match the environment
- Write modifiers that prompt generators can implement`;

export function buildHarmonizerUserPrompt(input: {
  visual_manifest: {
    global_lighting_setup: string;
    physics_parameters: {
      fog_density: number;
      moisture_level: number;
      wind_intensity: number;
      dust_frequency: number;
      particle_type: string;
    };
    chromatic_bible: {
      primary_hex: string;
      secondary_hex: string;
      accent_hex: string;
    };
    environmental_anchor_prompt: string;
  };
  geometry_profile: string;
  material_spec: string;
  heroFeature: string;
  originMetaphor: string;
  includeHumanElement: boolean;
  characterMode?: string;
  character_profile?: any;
}): string {
  return `ENVIRONMENT CONTEXT (From Agent 3.1)

VISUAL MANIFEST:

Global Lighting Setup:
${input.visual_manifest.global_lighting_setup}

Physics Parameters:
- Fog Density: ${input.visual_manifest.physics_parameters.fog_density}
- Moisture Level: ${input.visual_manifest.physics_parameters.moisture_level}
- Wind Intensity: ${input.visual_manifest.physics_parameters.wind_intensity}
- Dust Frequency: ${input.visual_manifest.physics_parameters.dust_frequency}
- Particle Type: ${input.visual_manifest.physics_parameters.particle_type}

Chromatic Bible:
- Primary: ${input.visual_manifest.chromatic_bible.primary_hex}
- Secondary: ${input.visual_manifest.chromatic_bible.secondary_hex}
- Accent: ${input.visual_manifest.chromatic_bible.accent_hex}

Environmental Anchor:
${input.visual_manifest.environmental_anchor_prompt}

PRODUCT DNA (From Agent 2.1)

GEOMETRY PROFILE:
${input.geometry_profile}

MATERIAL SPECIFICATION:
${input.material_spec}

HERO FEATURE: "${input.heroFeature}"

ORIGIN METAPHOR: "${input.originMetaphor}"

CHARACTER DNA (From Agent 2.2)

INCLUDE HUMAN ELEMENT: ${input.includeHumanElement}

${input.includeHumanElement && input.character_profile?.detailed_persona
  ? `CHARACTER PROFILE:\n${input.character_profile.detailed_persona}\n\nCHARACTER TYPE: ${input.characterMode || 'N/A'}`
  : 'No character in this campaign.'}

TASK

Create Interaction Physics that ensure assets belong in this environment.

Your task:
1. DEFINE product modifiers based on ${input.material_spec} responding to environment
2. DEFINE character modifiers based on physics_parameters (if applicable)
3. INJECT the origin metaphor "${input.originMetaphor}" as subtle VFX elements

Return ONLY the JSON object — no explanation, no preamble.`;
}

export const HARMONIZER_SCHEMA = {
  type: 'object',
  required: ['interaction_physics'],
  properties: {
    interaction_physics: {
      type: 'object',
      required: ['product_modifiers', 'character_modifiers', 'metaphor_injection'],
      properties: {
        product_modifiers: {
          type: 'string',
          minLength: 100,
          maxLength: 500,
          description: 'How environment affects product appearance',
        },
        character_modifiers: {
          type: 'string',
          minLength: 50,
          maxLength: 500,
          description: 'How environment affects character appearance, or "No character in campaign"',
        },
        metaphor_injection: {
          type: 'string',
          minLength: 80,
          maxLength: 400,
          description: 'VFX elements derived from origin metaphor',
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;

