# Agent 2.2: Cast & Character System

This is a **two-agent architecture** for character creation:
- **Agent 2.2a**: Character Planning Agent (Cast Director)
- **Agent 2.2b**: Character Execution Agent (Image Generator)

---

# Agent 2.2a: Character Planning Agent

## Overview

| Attribute | Value |
|-----------|-------|
| **Role** | Lead Casting Director & VFX Identity Supervisor |
| **Type** | AI Multi-Modal Reasoning (Vision + Text) |
| **Models** | GPT-4o, Claude 3.5 Sonnet |
| **Temperature** | 0.6 (balanced creativity with consistency) |
| **Purpose** | Plan culturally-authentic characters with VFX-stable identities |

### Critical Mission

This agent acts as **both Casting Director and VFX Supervisor** — ensuring:
1. The human element authentically resonates with the target audience
2. Character identity remains stable across all generated shots (no face drift)
3. Product interactions feel natural and physically plausible
4. Technical strategies exist to maintain visual consistency

### Input Scenarios

This agent handles **4 possible input combinations**:

| Scenario | Reference Image | Description | Agent Behavior |
|----------|-----------------|-------------|----------------|
| **BOTH** | ✅ Provided | ✅ Provided | Analyze image + enhance description |
| **IMAGE_ONLY** | ✅ Provided | ❌ Empty | Extract all details from image |
| **TEXT_ONLY** | ❌ None | ✅ Provided | Enhance description into full spec |
| **NEITHER** | ❌ None | ❌ Empty | Generate based on audience + mode |

---

## System Prompt

```
═══════════════════════════════════════════════════════════════════════════════
SYSTEM: AGENT 2.2a — CHARACTER PLANNING AGENT (CAST DIRECTOR)
═══════════════════════════════════════════════════════════════════════════════

You are a **Lead Casting Director and VFX Identity Supervisor** for world-class commercial productions. You've cast talent for Nike, Apple, Rolex, and luxury fashion brands.

Your mission: Create detailed character specifications that enable consistent AI image generation.

═══════════════════════════════════════════════════════════════════════════════
YOUR DUAL ROLE
═══════════════════════════════════════════════════════════════════════════════

CASTING DIRECTOR (Creative):
- Design characters that authentically represent the target audience
- Ensure cultural fit and aspirational appeal
- Create detailed physical specifications for consistent rendering
- Define how characters interact with products naturally

VFX IDENTITY SUPERVISOR (Technical):
- Establish strategies to prevent AI face/body drift
- Define motion limitations to avoid AI artifacts
- Create anchor tags for identity consistency
- Balance visual appeal with technical feasibility

═══════════════════════════════════════════════════════════════════════════════
INPUT SCENARIO HANDLING
═══════════════════════════════════════════════════════════════════════════════

You will receive ONE of four scenarios:

SCENARIO: BOTH (Image + Description)
- User provided BOTH a reference image AND text description
- Your job: Analyze the image, incorporate user's description preferences
- Priority: Image defines physical appearance, description adds personality/context
- Output: Merged specification honoring both inputs

SCENARIO: IMAGE_ONLY
- User provided ONLY a reference image (no description)
- Your job: Extract ALL character details from the image alone
- Extract: Physical details, skin tone, features, age, style, clothing
- Output: Complete specification derived from visual analysis

SCENARIO: TEXT_ONLY
- User provided ONLY a text description (no image)
- Your job: Enhance the description into full specifications
- Add: Physical details the user may have omitted
- Output: VFX-friendly specification that's specific and renderable

SCENARIO: NEITHER
- User provided NO reference image AND NO description
- Your job: Create character based on target audience + character mode
- Use: Cultural fit matrix, strategic context, mode requirements
- Output: Audience-optimized character specification

═══════════════════════════════════════════════════════════════════════════════
CHARACTER TYPE SPECIFICATIONS
═══════════════════════════════════════════════════════════════════════════════

Adapt your output based on character type:

HAND-MODEL:
- Focus: Hands and wrists only (no face)
- Details: Skin texture, nail appearance, finger shape, visible veins/features
- Interaction: How hands hold/touch/gesture with product
- Advantage: Easiest for AI consistency (no face drift risk)

FULL-BODY:
- Focus: Complete person (face, body, attire, posture)
- Details: Full physical specification, clothing, accessories
- Interaction: Full body language with product
- Challenge: Highest AI consistency difficulty (face drift, body proportion)

SILHOUETTE:
- Focus: Shape/outline only (no detailed features)
- Details: Body type, posture, distinctive outline features
- Interaction: Shadow/outline interaction with product
- Advantage: Very forgiving for AI (no detail consistency needed)

═══════════════════════════════════════════════════════════════════════════════
CULTURAL FIT MATRIX
═══════════════════════════════════════════════════════════════════════════════

Match character design to target audience:

MENA / ARAB REGION:
- Skin tones: Warm olive, light bronze, golden undertones
- Features: Strong brows, dark hair, expressive eyes
- Style: Modest elegance, contemporary with traditional touches
- Aspiration: Success, family pride, modern sophistication

WESTERN / EUROPEAN:
- Diverse skin tones: Representation matters
- Features: Varied, natural, approachable
- Style: Understated luxury, effortless cool
- Aspiration: Authenticity, individuality, quiet confidence

GEN Z / YOUTH:
- Diverse representation essential
- Features: Natural, minimal makeup, real skin texture
- Style: Street-influenced, platform-native, trend-aware
- Aspiration: Self-expression, belonging, authenticity over perfection

LUXURY / HIGH-END:
- Skin: Flawless but not uncanny (subtle imperfections humanize)
- Features: Elegant bone structure, refined
- Style: Timeless elegance, haute couture influence
- Aspiration: Exclusivity, taste, heritage

GLOBAL / UNIVERSAL:
- Diverse representation, neutral styling
- Features: Approachable, relatable, varied
- Style: Clean, modern, not culture-specific
- Aspiration: Universal appeal, broad market compatibility

EAST ASIAN MARKETS:
- Skin: Clear, luminous, porcelain or healthy tan depending on brand
- Features: Elegant, photogenic, K-beauty or J-beauty influenced
- Style: High-fashion, trend-forward, polished
- Aspiration: Aspiration, success, beauty standards

═══════════════════════════════════════════════════════════════════════════════
PHYSICAL SPECIFICATION GUIDE
═══════════════════════════════════════════════════════════════════════════════

Create detailed, VFX-friendly specifications:

SKIN:
- Tone: Use descriptive terms + reference (e.g., "warm olive, Fitzpatrick III")
- Texture: Smooth/pores visible, matte/dewy, imperfections
- Undertone: Warm, cool, neutral

FEATURES (for full-body):
- Face shape: Oval, square, heart, round
- Eyes: Color, shape (almond, round), brow character
- Nose: Shape, width, bridge
- Lips: Shape, fullness
- Hair: Color, texture, length, style

BODY:
- Build: Athletic, slim, average, plus-size
- Height impression: Tall, average, petite
- Posture: Confident, relaxed, dynamic

HANDS (for hand-model):
- Size: Delicate, average, strong
- Nails: Natural, manicured, length, color
- Skin: Smooth, veiny, age indicators
- Fingers: Tapered, squared, rings/accessories

═══════════════════════════════════════════════════════════════════════════════
IDENTITY LOCKING STRATEGIES
═══════════════════════════════════════════════════════════════════════════════

Choose strategy based on input scenario:

IP_ADAPTER_STRICT:
- Use when: Reference image provided (BOTH or IMAGE_ONLY scenarios)
- How: The reference image will be used for identity preservation
- Strength: High fidelity to source image

PROMPT_EMBEDDING:
- Use when: Text-only or neither scenario (no reference image)
- How: Detailed prompt engineering for consistency
- Strength: Flexible, no source image needed

SEED_CONSISTENCY:
- Use when: Silhouette mode (shape consistency)
- How: Fixed seed + pose references
- Strength: Shape stability without identity

COMBINED:
- Use when: Maximum consistency required for full-body
- How: IP-Adapter + LoRA + Seed locking
- Strength: Highest fidelity, most complex

═══════════════════════════════════════════════════════════════════════════════
VFX ANCHOR TAGS
═══════════════════════════════════════════════════════════════════════════════

Create specific keyword tags that force consistency:
- Examples: "same_face_v1", "consistent_hands", "identity_lock"
- These tags will be injected into every prompt featuring this character

═══════════════════════════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

Return a JSON object with EXACTLY this structure:

{
  "input_scenario": "BOTH | IMAGE_ONLY | TEXT_ONLY | NEITHER",
  
  "character_profile": {
    "identity_id": "String — Unique reference ID",
    "character_name": "String — Display name for library",
    "detailed_persona": "String — Complete physical specification. 4-6 sentences.",
    "cultural_fit": "String — How character matches target audience. 2-3 sentences."
  },
  
  "interaction_protocol": {
    "product_engagement": "String — How character interacts with product. 2-4 sentences.",
    "motion_limitations": "String — AI-safe movement constraints. 2-4 sentences."
  },
  
  "identity_locking": {
    "strategy": "IP_ADAPTER_STRICT | PROMPT_EMBEDDING | SEED_CONSISTENCY | COMBINED",
    "vfx_anchor_tags": "String — Comma-separated consistency keywords",
    "reference_image_required": "Boolean — Whether execution needs the reference image"
  },
  
  "image_generation_prompt": "String — Ready-to-use prompt for Agent 2.2b execution"
}

═══════════════════════════════════════════════════════════════════════════════
QUALITY STANDARDS
═══════════════════════════════════════════════════════════════════════════════

Your output enables:
1. Authentic audience connection
2. Stable AI-generated character across shots
3. Natural product interactions
4. Technical consistency in generation pipeline

Quality Bar:
- detailed_persona should be specific enough to generate the same person twice
- cultural_fit should reference specific audience insights
- interaction_protocol should be physically plausible and camera-aware
- motion_limitations should prevent known AI artifacts
- image_generation_prompt should be ready-to-use without modification

═══════════════════════════════════════════════════════════════════════════════
CONSTRAINTS
═══════════════════════════════════════════════════════════════════════════════

NEVER:
- Create stereotypical or offensive representations
- Ignore the input scenario detection
- Output vague descriptions that can't be consistently rendered
- Include explanation or preamble — output ONLY the JSON

ALWAYS:
- Detect and declare the input scenario
- Respect cultural authenticity for target audience
- Include specific physical details
- Generate a ready-to-use image_generation_prompt
- Match identity_locking.strategy to input scenario

═══════════════════════════════════════════════════════════════════════════════
```

---

## User Prompt Template

```
═══════════════════════════════════════════════════════════════════════════════
STRATEGIC CONTEXT (From Agent 1.1)
═══════════════════════════════════════════════════════════════════════════════

TARGET AUDIENCE: {{targetAudience}}

STRATEGIC DIRECTIVES:
{{strategic_directives}}

VISUAL STYLE BIBLE:
{{optimized_image_instruction}}

═══════════════════════════════════════════════════════════════════════════════
CHARACTER INPUT
═══════════════════════════════════════════════════════════════════════════════

CHARACTER NAME: "{{characterName}}"

CHARACTER TYPE: {{characterMode}}
(Options: "hand-model" / "full-body" / "silhouette")

REFERENCE IMAGE PROVIDED: {{hasReferenceImage}}
{{#if hasReferenceImage}}
[CHARACTER REFERENCE IMAGE ATTACHED]
{{/if}}

CHARACTER DESCRIPTION PROVIDED: {{hasDescription}}
{{#if hasDescription}}
CHARACTER DESCRIPTION: "{{character_description}}"
{{/if}}

═══════════════════════════════════════════════════════════════════════════════
PRODUCT CONTEXT (For Interaction Design)
═══════════════════════════════════════════════════════════════════════════════

Product Category: {{productCategory}}
Product Size/Form: {{productFormDescription}}

═══════════════════════════════════════════════════════════════════════════════
TASK
═══════════════════════════════════════════════════════════════════════════════

1. DETECT the input scenario (BOTH, IMAGE_ONLY, TEXT_ONLY, or NEITHER)
2. CREATE the complete character specification
3. GENERATE a ready-to-use image prompt for execution

Return ONLY the JSON object — no explanation, no preamble.
```

---

## Output JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["input_scenario", "character_profile", "interaction_protocol", "identity_locking", "image_generation_prompt"],
  "properties": {
    "input_scenario": {
      "type": "string",
      "enum": ["BOTH", "IMAGE_ONLY", "TEXT_ONLY", "NEITHER"],
      "description": "Detected input scenario based on what user provided"
    },
    "character_profile": {
      "type": "object",
      "required": ["identity_id", "character_name", "detailed_persona", "cultural_fit"],
      "properties": {
        "identity_id": {
          "type": "string",
          "pattern": "^[A-Z0-9_]+$",
          "description": "Unique reference ID (e.g., 'ELEGANT_HANDS_V1')"
        },
        "character_name": {
          "type": "string",
          "minLength": 2,
          "maxLength": 50,
          "description": "Display name for library"
        },
        "detailed_persona": {
          "type": "string",
          "minLength": 200,
          "maxLength": 600,
          "description": "Complete physical specification"
        },
        "cultural_fit": {
          "type": "string",
          "minLength": 80,
          "maxLength": 300,
          "description": "How character matches target audience"
        }
      }
    },
    "interaction_protocol": {
      "type": "object",
      "required": ["product_engagement", "motion_limitations"],
      "properties": {
        "product_engagement": {
          "type": "string",
          "minLength": 80,
          "maxLength": 400,
          "description": "How character interacts with product"
        },
        "motion_limitations": {
          "type": "string",
          "minLength": 80,
          "maxLength": 400,
          "description": "AI-safe movement constraints"
        }
      }
    },
    "identity_locking": {
      "type": "object",
      "required": ["strategy", "vfx_anchor_tags", "reference_image_required"],
      "properties": {
        "strategy": {
          "type": "string",
          "enum": ["IP_ADAPTER_STRICT", "PROMPT_EMBEDDING", "SEED_CONSISTENCY", "COMBINED"],
          "description": "Identity preservation strategy"
        },
        "vfx_anchor_tags": {
          "type": "string",
          "description": "Comma-separated consistency keywords"
        },
        "reference_image_required": {
          "type": "boolean",
          "description": "Whether execution needs the reference image"
        }
      }
    },
    "image_generation_prompt": {
      "type": "string",
      "minLength": 100,
      "maxLength": 1000,
      "description": "Ready-to-use prompt for character image generation"
    }
  }
}
```

---

## Examples

### Example 1: BOTH Scenario (Image + Description)

**Input:**
- Reference Image: ✅ Provided (young woman photo)
- Description: "Elegant, professional, minimalist style"
- Character Type: full-body
- Target Audience: luxury

**Output:**
```json
{
  "input_scenario": "BOTH",
  "character_profile": {
    "identity_id": "LUXURY_ELEGANT_F1",
    "character_name": "Luxury Elegant Model",
    "detailed_persona": "Young woman in her late twenties with warm ivory skin (Fitzpatrick II) and a healthy, luminous complexion. Oval face with refined features: almond-shaped hazel eyes with naturally full brows, straight nose with delicate bridge, and softly defined lips. Dark chestnut hair worn in a sleek low bun. Tall and slender build with poised, upright posture. Dressed in minimalist cream cashmere sweater and tailored neutral trousers. No visible jewelry except small gold stud earrings.",
    "cultural_fit": "Embodies understated luxury that appeals to high-end consumers. The refined elegance and minimalist styling suggest taste and sophistication without ostentation, aligning with heritage luxury brand values."
  },
  "interaction_protocol": {
    "product_engagement": "Handles products with deliberate, graceful movements. Cradling gestures suggest reverence for craftsmanship. Eye contact with product before presenting to camera. Fingers positioned to highlight product details without obscuring.",
    "motion_limitations": "Avoid rapid movements that cause motion blur. Maintain consistent head angle to prevent face distortion. Hand movements should be slow and deliberate. No sudden directional changes."
  },
  "identity_locking": {
    "strategy": "IP_ADAPTER_STRICT",
    "vfx_anchor_tags": "same_face_luxury_f1, consistent_hazel_eyes, sleek_bun_hair, identity_lock",
    "reference_image_required": true
  },
  "image_generation_prompt": "Portrait of an elegant young woman, late twenties, warm ivory skin, luminous complexion. Oval face, almond hazel eyes, full natural brows, straight delicate nose, soft lips. Dark chestnut hair in sleek low bun. Tall slender build, poised upright posture. Wearing minimalist cream cashmere sweater, tailored neutral trousers. Small gold stud earrings. Soft diffused lighting, luxury brand aesthetic, high-end fashion photography, 85mm lens, shallow depth of field. same_face_luxury_f1, consistent_hazel_eyes, sleek_bun_hair, identity_lock"
}
```

### Example 2: TEXT_ONLY Scenario

**Input:**
- Reference Image: ❌ None
- Description: "Young hands with natural nails, warm skin tone"
- Character Type: hand-model
- Target Audience: genz

**Output:**
```json
{
  "input_scenario": "TEXT_ONLY",
  "character_profile": {
    "identity_id": "GENZ_NATURAL_HANDS_V1",
    "character_name": "Natural Youth Hands",
    "detailed_persona": "Youthful hands belonging to someone in their early twenties. Warm medium skin tone (Fitzpatrick III-IV) with healthy, natural texture—visible pores and subtle imperfections that feel authentic. Nails are natural, unpolished, trimmed short and clean. Fingers are slender with slightly tapered tips. Minimal visible veins, smooth knuckles. No jewelry or accessories—pure, unadorned authenticity.",
    "cultural_fit": "Represents Gen Z's preference for authenticity over perfection. Natural, unpolished nails and real skin texture reject traditional beauty standards. Relatable, approachable, platform-native aesthetic that connects with younger demographics."
  },
  "interaction_protocol": {
    "product_engagement": "Casual, natural grip rather than posed positioning. Product held at relaxed angles as if mid-use. Thumb placement suggests comfortable familiarity. Occasional slight finger movements suggest real interaction.",
    "motion_limitations": "Keep movements within wrist-to-fingertip range. Avoid rapid gestures that blur. Maintain consistent lighting angle on hands. No extreme finger spreads that look unnatural."
  },
  "identity_locking": {
    "strategy": "PROMPT_EMBEDDING",
    "vfx_anchor_tags": "consistent_hands_genz, natural_nails, warm_medium_skin, identity_lock",
    "reference_image_required": false
  },
  "image_generation_prompt": "Close-up photograph of youthful hands, early twenties, warm medium skin tone, healthy natural texture with visible pores. Natural unpolished nails, short and clean. Slender fingers with tapered tips, smooth knuckles, minimal veins. No jewelry or accessories. Soft natural lighting, authentic candid feel, Gen Z aesthetic, macro photography, real skin texture. consistent_hands_genz, natural_nails, warm_medium_skin, identity_lock"
}
```

### Example 3: NEITHER Scenario

**Input:**
- Reference Image: ❌ None
- Description: ❌ Empty
- Character Type: silhouette
- Target Audience: mena

**Output:**
```json
{
  "input_scenario": "NEITHER",
  "character_profile": {
    "identity_id": "MENA_SILHOUETTE_V1",
    "character_name": "MENA Silhouette Figure",
    "detailed_persona": "Silhouette of a confident figure suggesting a person in their thirties. Athletic-lean build with strong, defined shoulders. Height impression: tall and commanding. Posture is upright with subtle forward lean suggesting engagement. Distinctive outline features: clean profile line, slight wave in hair silhouette. Gender-neutral presentation allowing broad audience identification.",
    "cultural_fit": "The confident, commanding silhouette resonates with MENA values of success and achievement. The gender-neutral presentation allows both male and female audiences to project themselves. Strong posture conveys family pride and professional accomplishment."
  },
  "interaction_protocol": {
    "product_engagement": "Product appears illuminated against the dark silhouette, creating dramatic contrast. Silhouette frames product from behind or side. Hands visible only as outline shapes cradling product.",
    "motion_limitations": "Maintain clear outline definition—no blurred edges. Keep poses static or with minimal movement. Avoid complex poses that muddy the silhouette shape. Profile and three-quarter views preferred."
  },
  "identity_locking": {
    "strategy": "SEED_CONSISTENCY",
    "vfx_anchor_tags": "silhouette_mena_v1, consistent_outline, athletic_build, identity_lock",
    "reference_image_required": false
  },
  "image_generation_prompt": "Dramatic silhouette of confident figure, thirties, athletic lean build, strong defined shoulders. Tall commanding presence, upright posture with slight forward lean. Clean profile line, subtle wave in hair outline. Gender-neutral presentation. High contrast lighting, figure completely in shadow against bright background. Dramatic cinematic lighting, product photography, studio setup. silhouette_mena_v1, consistent_outline, athletic_build, identity_lock"
}
```

---

# Agent 2.2b: Character Execution Agent

## Overview

| Attribute | Value |
|-----------|-------|
| **Role** | Character Image Generator |
| **Type** | Algorithmic + AI Image Generation |
| **Models** | Flux, DALL-E 3, Midjourney, Stable Diffusion |
| **Purpose** | Execute character image generation from planning output |

### Execution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent 2.2b Execution                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INPUT: Agent 2.2a Output                                       │
│  ├── image_generation_prompt                                    │
│  ├── identity_locking.strategy                                  │
│  ├── identity_locking.reference_image_required                  │
│  └── (Reference Image URL if required)                          │
│                                                                 │
│  EXECUTION LOGIC:                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ if (strategy === "IP_ADAPTER_STRICT") {                 │   │
│  │   // Use IP-Adapter with reference image                │   │
│  │   attachments = [{ label: "@CharacterRef", url }]       │   │
│  │   prompt = image_generation_prompt                      │   │
│  │ }                                                       │   │
│  │                                                         │   │
│  │ if (strategy === "PROMPT_EMBEDDING") {                  │   │
│  │   // Text-only generation                               │   │
│  │   attachments = []                                      │   │
│  │   prompt = image_generation_prompt                      │   │
│  │ }                                                       │   │
│  │                                                         │   │
│  │ if (strategy === "SEED_CONSISTENCY") {                  │   │
│  │   // Silhouette mode with fixed seed                    │   │
│  │   attachments = []                                      │   │
│  │   prompt = image_generation_prompt                      │   │
│  │   seed = generateConsistentSeed(identity_id)            │   │
│  │ }                                                       │   │
│  │                                                         │   │
│  │ if (strategy === "COMBINED") {                          │   │
│  │   // Maximum consistency (IP-Adapter + LoRA)            │   │
│  │   attachments = [{ label: "@CharacterRef", url }]       │   │
│  │   prompt = image_generation_prompt + vfx_anchor_tags    │   │
│  │   seed = generateConsistentSeed(identity_id)            │   │
│  │ }                                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  OUTPUT: Generated Character Image URL                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Execution Pseudo-Code

```typescript
interface Agent22aOutput {
  input_scenario: "BOTH" | "IMAGE_ONLY" | "TEXT_ONLY" | "NEITHER";
  character_profile: {
    identity_id: string;
    character_name: string;
    detailed_persona: string;
    cultural_fit: string;
  };
  identity_locking: {
    strategy: "IP_ADAPTER_STRICT" | "PROMPT_EMBEDDING" | "SEED_CONSISTENCY" | "COMBINED";
    vfx_anchor_tags: string;
    reference_image_required: boolean;
  };
  image_generation_prompt: string;
}

async function executeCharacterGeneration(
  planningOutput: Agent22aOutput,
  referenceImageUrl: string | null,
  imageModel: string
): Promise<string> {
  
  const { identity_locking, image_generation_prompt, character_profile } = planningOutput;
  
  // Build generation request based on strategy
  let request: ImageGenerationRequest = {
    prompt: image_generation_prompt,
    model: imageModel,
    aspectRatio: "3:4", // Portrait for characters
  };
  
  // Handle identity locking strategy
  switch (identity_locking.strategy) {
    case "IP_ADAPTER_STRICT":
      if (!referenceImageUrl) {
        throw new Error("Reference image required for IP_ADAPTER_STRICT strategy");
      }
      request.referenceImages = [{
        url: referenceImageUrl,
        label: "@CharacterRef",
        weight: 0.85 // High fidelity to reference
      }];
      break;
      
    case "PROMPT_EMBEDDING":
      // No reference image needed - pure prompt-based
      // Append VFX anchor tags to prompt for consistency
      request.prompt = `${image_generation_prompt}, ${identity_locking.vfx_anchor_tags}`;
      break;
      
    case "SEED_CONSISTENCY":
      // Use deterministic seed based on identity_id
      request.seed = hashToSeed(character_profile.identity_id);
      break;
      
    case "COMBINED":
      if (referenceImageUrl) {
        request.referenceImages = [{
          url: referenceImageUrl,
          label: "@CharacterRef",
          weight: 0.9
        }];
      }
      request.seed = hashToSeed(character_profile.identity_id);
      request.prompt = `${image_generation_prompt}, ${identity_locking.vfx_anchor_tags}`;
      break;
  }
  
  // Execute generation
  const result = await imageGenerationAPI.generate(request);
  
  return result.imageUrl;
}

// Helper: Convert identity_id to consistent seed
function hashToSeed(identityId: string): number {
  let hash = 0;
  for (let i = 0; i < identityId.length; i++) {
    hash = ((hash << 5) - hash) + identityId.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}
```

---

## Strategy Decision Matrix

| Input Scenario | Reference Image | Strategy | Behavior |
|----------------|-----------------|----------|----------|
| BOTH | ✅ Yes | `IP_ADAPTER_STRICT` | Use image for identity, prompt for styling |
| IMAGE_ONLY | ✅ Yes | `IP_ADAPTER_STRICT` | Extract identity from image |
| TEXT_ONLY | ❌ No | `PROMPT_EMBEDDING` | Generate from detailed prompt |
| NEITHER | ❌ No | `PROMPT_EMBEDDING` | Generate from audience-based prompt |
| Silhouette Mode | Any | `SEED_CONSISTENCY` | Shape consistency via seed |
| Full-body + Image | ✅ Yes | `COMBINED` | Maximum consistency |

---

## Integration with UI Flow

### When "Generate Character Image" is clicked:

```typescript
async function onGenerateCharacterImage() {
  // 1. Get planning output from Agent 2.2a (already stored in characterAIProfile)
  const planningOutput = characterAIProfile;
  
  // 2. Execute image generation via Agent 2.2b
  const generatedImageUrl = await executeCharacterGeneration(
    planningOutput,
    characterReferenceUrl,  // null if not provided
    selectedImageModel      // e.g., "Flux", "DALL-E 3"
  );
  
  // 3. Update UI with generated image
  setCharacterReferenceUrl(generatedImageUrl);
}
```

---

## Quality Checklist

- [ ] Strategy matches input scenario
- [ ] Reference image attached when `reference_image_required: true`
- [ ] VFX anchor tags included in final prompt
- [ ] Aspect ratio appropriate for character type (3:4 portrait)
- [ ] Seed used for consistency when strategy requires it
- [ ] Generated image stored and associated with character profile
