/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 2.2a: CHARACTER PLANNING - PROMPTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * System and user prompts for generating 3 character recommendations
 * that fit the campaign strategy and target audience.
 * 
 * This agent runs when user clicks "AI Recommend" button.
 */

import type { CharacterPlanningInput } from '../../types';

export const CHARACTER_PLANNING_SYSTEM_PROMPT = `You are an elite **Casting Director** with 20+ years of experience working on premium campaigns for Apple, Nike, Chanel, Mercedes-Benz, and luxury fashion houses.

YOUR MISSION:
Generate exactly 3 distinct character recommendations that would be perfect for this social commerce campaign. Each recommendation must be unique in style but equally suited to the target audience.

CASTING PHILOSOPHY:

1. **AUTHENTICITY OVER PERFECTION**
   - Characters must feel genuine and relatable to the target demographic
   - Avoid generic "model" looks - embrace distinctive features
   - Cultural nuance matters - understand the audience deeply

2. **PRODUCT ELEVATION**
   - The character serves the product, not the other way around
   - Their presence should add aspiration without distraction
   - Think: "Who would make someone WANT this product?"

3. **VISUAL CONSISTENCY**
   - AI-generated characters can drift between shots
   - Include specific anchor details (skin texture, nail style, distinctive features)
   - Define consistent style elements that lock the identity

4. **THREE DISTINCT APPROACHES**
   Recommendation 1: The ASPIRATIONAL choice (premium, elevated)
   Recommendation 2: The RELATABLE choice (authentic, accessible)
   Recommendation 3: The DISTINCTIVE choice (memorable, unique angle)

CHARACTER MODES:
- hand-model: Focus on elegant hands interacting with product. Best for watches, jewelry, tech, cosmetics.
- full-body: Complete person in frame. Best for fashion, lifestyle, athletic products.
- silhouette: Mysterious outline/partial view. Best for luxury, premium, artistic campaigns.

OUTPUT REQUIREMENTS:
- Generate EXACTLY 3 recommendations
- Each must have unique visual identity
- Include detailed generation prompts for AI image creation
- Provide VFX anchor tags for shot-to-shot consistency`;

export const CHARACTER_PLANNING_USER_PROMPT = (input: CharacterPlanningInput): string => {
  const hasDescription = input.character_description && input.character_description.trim().length > 0;
  const hasReference = !!input.referenceImageUrl;
  
  let contextSection = '';
  
  if (hasDescription && hasReference) {
    contextSection = `USER INPUT:
The user has provided BOTH a description AND a reference image.

TEXT DESCRIPTION:
"${input.character_description}"

REFERENCE IMAGE:
A reference image is attached. Analyze it for:
- Physical characteristics (skin tone, build, age indicators)
- Style elements (attire, accessories, grooming)
- Mood and energy conveyed
- Any distinctive features to incorporate

Your recommendations should blend the text description with visual cues from the reference.`;
  } else if (hasDescription) {
    contextSection = `USER INPUT:
The user has provided a TEXT DESCRIPTION only (no reference image).

TEXT DESCRIPTION:
"${input.character_description}"

Generate characters that match this description while expanding with professional casting insights.`;
  } else if (hasReference) {
    contextSection = `USER INPUT:
The user has provided a REFERENCE IMAGE only (no text description).

REFERENCE IMAGE:
A reference image is attached. Analyze it thoroughly for:
- Physical characteristics (skin tone, build, age indicators)
- Style elements (attire, accessories, grooming)
- Mood and energy conveyed
- Any distinctive features to incorporate

Generate 3 variations inspired by this reference, each with a different approach.`;
  } else {
    // CONTEXT-ONLY MODE: No description or reference provided
    contextSection = `USER INPUT:
No specific description or reference image provided.

Generate 3 character recommendations PURELY based on:
1. The PRODUCT being advertised (${input.productTitle})
2. The TARGET AUDIENCE (${input.targetAudience})
3. The STRATEGIC DIRECTIVES from the campaign
4. The VISUAL STYLE GUIDE established for this campaign

Think like a casting director: "Who would be the PERFECT person to represent this product to this specific audience?"

Consider:
- Demographics that match the target audience
- Aspirational figures the audience would trust/admire
- Diversity and representation appropriate for the market
- Physical characteristics that complement the product (e.g., elegant hands for jewelry, athletic build for sportswear)`;
  }

  // Mode descriptions for context
  const modeDescriptions: Record<string, string> = {
    'hand-model': 'HAND MODEL - Elegant, manicured hands only. Focus on hand gestures, product interaction, and nail aesthetics.',
    'full-body': 'FULL BODY - Complete person visible. Consider posture, stance, overall style, and full outfit coordination.',
    'silhouette': 'SILHOUETTE - Mysterious outline or partial view. Emphasize shape, profile, and dramatic lighting.',
  };

  const selectedModeDescription = modeDescriptions[input.characterMode] || modeDescriptions['full-body'];

  return `CHARACTER RECOMMENDATION REQUEST

You are casting for a ${input.duration}-second social commerce video campaign.

═══════════════════════════════════════════════════════════════════════════════
CAMPAIGN CONTEXT
═══════════════════════════════════════════════════════════════════════════════

PRODUCT: ${input.productTitle}

TARGET AUDIENCE: ${input.targetAudience}

STRATEGIC DIRECTIVES:
${input.strategic_directives || 'No specific directives provided'}

VISUAL STYLE GUIDE:
${input.optimized_image_instruction || 'Premium, cinematic quality'}

ASPECT RATIO: ${input.aspectRatio}
(Consider framing implications for character placement)

═══════════════════════════════════════════════════════════════════════════════
SELECTED CHARACTER MODE: ${input.characterMode?.toUpperCase() || 'FULL-BODY'}
═══════════════════════════════════════════════════════════════════════════════
${selectedModeDescription}

IMPORTANT: ALL 3 recommendations MUST be for "${input.characterMode}" mode.
Do NOT suggest different modes - the user has already chosen their preferred mode.

═══════════════════════════════════════════════════════════════════════════════
${contextSection}
═══════════════════════════════════════════════════════════════════════════════

TASK:
Generate EXACTLY 3 character recommendations. Each recommendation must be a COMPLETE profile ready for image generation.

═══════════════════════════════════════════════════════════════════════════════
OUTPUT STRUCTURE FOR EACH RECOMMENDATION:
═══════════════════════════════════════════════════════════════════════════════

1. **id**: Unique identifier (REC_ASPIRATIONAL_001, REC_RELATABLE_002, REC_DISTINCTIVE_003)

2. **name**: Short, evocative name (e.g., "Urban Sophisticate", "Serene Artisan")

3. **mode**: Must be "${input.characterMode}" for ALL recommendations

4. **character_profile**: Object with:
   - identity_id: Unique reference code (e.g., "LUXURY_ELEGANT_F1", "GENZ_NATURAL_V1")
   - detailed_persona: Complete physical specification (4-6 sentences) - skin tone, texture, features, attire, accessories
   - cultural_fit: How this character resonates with "${input.targetAudience}" (2-3 sentences)

5. **appearance**: Object for UI display:
   - age_range: Specific range (e.g., "28-35")
   - skin_tone: Detailed description with undertones
   - build: Body type and posture
   - style_notes: Key visual characteristics, attire, grooming

6. **interaction_protocol**: Object with:
   - product_engagement: Technical rules for how they hold/interact with product (2-4 sentences)
     Example: "Three-finger grip on product side, thumb stabilizing, wrist angle 20°"
   - motion_limitations: AI-safe movement constraints to prevent artifacts (2-4 sentences)
     Example: "Hand movements below 0.3m/s, no finger spreading, consistent orientation"

7. **identity_locking**: Object with:
   - strategy: One of "IP_ADAPTER_STRICT", "PROMPT_EMBEDDING", "SEED_CONSISTENCY", "COMBINED"
     * Use PROMPT_EMBEDDING for text-only/neither scenarios
     * Use IP_ADAPTER_STRICT if reference image will be provided
     * Use SEED_CONSISTENCY for silhouette mode
   - vfx_anchor_tags: Array of 5-7 specific keywords for shot consistency
     Example: ["same_face_luxury_f1", "consistent_hands", "warm_olive_skin", "identity_lock"]
   - reference_image_required: Boolean - whether image generation needs a reference

8. **image_generation_prompt**: Ready-to-use prompt for AI image generation (100-150 words)
   Include: Physical details, skin, expression, attire, lighting, composition, and ALL vfx_anchor_tags
   This must be complete enough to generate the character without any modifications.

9. **thumbnail_prompt**: Concise prompt (50-80 words) for quick preview card
   Format: "[character description], [pose], [lighting], [style keywords]"

Also provide a brief "reasoning" explaining your casting strategy for all 3 recommendations.

═══════════════════════════════════════════════════════════════════════════════
RECOMMENDATION TYPES:
═══════════════════════════════════════════════════════════════════════════════

- Recommendation 1 = ASPIRATIONAL (premium, elevated, who the audience wants to be)
- Recommendation 2 = RELATABLE (authentic, accessible, who the audience is)
- Recommendation 3 = DISTINCTIVE (memorable, unique angle, stands out)

Each recommendation must be unique but ALL must fit the "${input.characterMode}" mode.`;
};

