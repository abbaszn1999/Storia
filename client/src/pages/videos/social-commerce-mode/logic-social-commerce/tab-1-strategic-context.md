# Tab 1: Strategic Context Backend Logic

This document defines the backend agent responsible for processing Tab 1 (Strategic Context / Campaign Configuration) inputs.

---

## Agent 1.1: Strategic Context Optimizer

### Role
Acts as the **"Campaign Director."** It synthesizes cultural context, audience intent, and time constraints into a technical "Visual Bible" and high-level optimized prompts. It focuses on cinematic quality and regional relevance without using model-specific jargon.

### Type
AI Text Model (Reasoning-focused: GPT-4o / Claude 3.5)

---

## Context Input

| Field | Source | Description |
|-------|--------|-------------|
| `targetAudience` | Tab 1 Frontend | e.g., "Gen Z", "MENA / Arab Region", "Luxury / High-End" |
| `region` | Tab 1 Frontend | Geographic/cultural region |
| `motionPrompt` | Tab 1 Frontend | User's raw motion DNA text (global camera/physics rules) |
| `duration` | Tab 1 Frontend | Target campaign duration (e.g., 15s, 30s) |
| `customImageInstruction` | Tab 1 Frontend | User's raw style intent for image generation |

---

## Processing Logic

The agent analyzes the inputs and:

1. **Cultural Analysis**: Interprets the target audience and region to determine visual/cultural laws
2. **Pacing Determination**: Based on audience and duration, selects appropriate pacing profile
3. **Motion Optimization**: Transforms raw user motion text into professional cinematic movement descriptions
4. **Style Elevation**: Converts user style intent into SOTA technical aesthetic prompts

---

## Output Structure

```json
{
  "strategic_directives": "Visual/cultural laws (e.g., 'Apply high-contrast desert-gold lighting for MENA audience, emphasize luxury through slow reveals')",
  
  "pacing_profile": "FAST_CUT | LUXURY_SLOW | KINETIC_RAMP | STEADY_CINEMATIC",
  
  "optimized_motion_dna": "High-level cinematic movement description (e.g., 'Dynamic parallax zoom with subtle handheld drift, macro-to-wide reveals')",
  
  "optimized_image_instruction": "Professional aesthetic prompt (e.g., 'SOTA 8k cinematic render, hyper-realistic textures, anamorphic lens flares, volumetric lighting')"
}
```

---

## Output Field Definitions

### `strategic_directives`
Visual and cultural laws that guide all downstream agents. These are high-level rules that ensure the entire campaign feels cohesive and culturally appropriate.

**Examples:**
- "Apply high-contrast desert-gold lighting for MENA audience"
- "Use minimalist composition with negative space for Western/Luxury markets"
- "Fast-paced cuts with bold colors for Gen Z engagement"

### `pacing_profile`
Determines the rhythmic feel of the entire campaign:

| Profile | Description | Use Case |
|---------|-------------|----------|
| `FAST_CUT` | Rapid transitions, high energy | Gen Z, Social Media, Action |
| `LUXURY_SLOW` | Deliberate, elegant pacing | High-end products, Premium brands |
| `KINETIC_RAMP` | Speed ramping, dynamic acceleration | Sports, Tech, Energy drinks |
| `STEADY_CINEMATIC` | Consistent, film-like pacing | Storytelling, Brand awareness |

### `optimized_motion_dna`
Professional translation of user's motion intent. Converts casual descriptions into cinematic terminology.

**Before (User Input):**
> "I want the camera to move around the product smoothly"

**After (Optimized):**
> "Orbital dolly with 15° tilt, micro-drift stabilization, rack focus transitions"

### `optimized_image_instruction`
Elevates user's style intent to SOTA (State of the Art) technical prompts.

**Before (User Input):**
> "Make it look professional and high quality"

**After (Optimized):**
> "SOTA 8k cinematic render, hyper-realistic PBR textures, anamorphic bokeh, volumetric god-rays, film grain overlay"

---

## Downstream Usage

The output of Agent 1.1 is consumed by:

| Downstream Agent | Fields Used | Purpose |
|------------------|-------------|---------|
| Agent 2.2 (Cast Curator) | `strategic_directives`, `targetAudience` | Character cultural fit |
| Agent 3.0 (Creative Catalyst) | `strategic_directives`, `pacing_profile` | Creative spark generation |
| Agent 3.1 (World-Builder) | `strategic_directives`, `optimized_image_instruction` | Environment design |
| Agent 3.2 (Narrative Architect) | `pacing_profile` | Script energy levels |
| Agent 4.1 (Media Planner) | All fields | Shot planning |
| Agent 4.3 (Prompt Architect) | `optimized_motion_dna`, `optimized_image_instruction` | Technical prompts |

---

## Example

### Input
```json
{
  "targetAudience": "Gen Z / Youth Culture",
  "region": "MENA / Arab Region",
  "motionPrompt": "Dynamic camera movements, close-ups on the product details, energetic feel",
  "duration": 15,
  "customImageInstruction": "Modern, sleek, high-tech look with vibrant colors"
}
```

### Output
```json
{
  "strategic_directives": "Apply high-energy visual language with bold geometric compositions. Use warm amber-gold accent lighting to resonate with MENA aesthetics. Emphasize youth culture through dynamic framing and trend-aware color grading. Maintain premium feel despite fast pacing.",
  
  "pacing_profile": "KINETIC_RAMP",
  
  "optimized_motion_dna": "Aggressive macro reveals with speed-ramped dolly pushes. Whip-pan transitions between product angles. Orbital tracking with parallax depth. Handheld micro-drift for authenticity. Peak motion intensity at 0.3s intervals.",
  
  "optimized_image_instruction": "SOTA 8k cinematic render, hyper-realistic metallic textures with anisotropic reflections, neon-accented rim lighting, chromatic aberration on edges, shallow depth of field with anamorphic bokeh, subtle film grain for premium feel."
}
```

