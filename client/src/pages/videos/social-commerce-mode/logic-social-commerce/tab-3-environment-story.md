# Tab 3: Environment & Story Backend Logic

This document defines the backend agents responsible for processing Tab 3 (Environment & Narrative) inputs. Four agents work together to create the world, narrative structure, and VFX integration.

---

# Agent 3.0: Creative Concept Catalyst (The Creative Director)

### Role
Acts as a **world-class Creative Director**. It synthesizes the campaign strategy (Tab 1), cultural region, and the product's physical DNA (Tab 2) into a singular, high-concept narrative idea (The "Spark"). It focuses on finding the emotional "hook" that justifies the visual metaphor.

### Type
AI Text Model (Reasoning-focused: GPT-4o / Claude 3.5)

---

## Context Input

| Field | Source | Description |
|-------|--------|-------------|
| `strategic_directives` | Agent 1.1 | Visual/cultural laws |
| `targetAudience` | Tab 1 | Audience context |
| `region` | Tab 1 | Geographic/cultural region |
| `pacing_profile` | Agent 1.1 | FAST_CUT / LUXURY_SLOW / etc. |
| `duration` | Tab 1 | Campaign duration in seconds |
| `geometry_profile` | Agent 2.1 | Product shape description |
| `material_spec` | Agent 2.1 | Material properties |
| `heroFeature` | Tab 2 | e.g., "The brushed titanium bezel" |
| `character_profile` | Agent 2.2 | Character specifications |

### Static System Prompt
> "Mission: Generate a singular, high-concept creative spark for a professional commercial. Leverage specific textures and audience psychology. No preamble—just the core idea."

---

## Processing Logic

The agent:

1. **Texture Analysis**: Identifies unique material properties that can become visual metaphors
2. **Audience Psychology**: Maps product features to emotional triggers for target demographic
3. **Concept Synthesis**: Creates a single, powerful creative idea that unifies all elements

---

## Output Structure

```json
{
  "creative_spark": "String (e.g., 'A kinetic symphony where raw industrial textures pulse to the rhythm of a desert sunrise, transforming into the final product through heat and light.')"
}
```

---

## Example Output

```json
{
  "creative_spark": "Time crystallized in titanium — each brushed grain captures a moment of precision, revealed through light that dances across the surface like memories forming. The watch doesn't just tell time; it embodies it."
}
```

---
---

# Agent 3.1: Atmospheric World-Builder (The Set Designer)

### Role
Synthesizes the user's environment/atmosphere descriptions and lighting presets into a **"Global Visual Manifest."** It defines the mathematical physics of the set (refraction, lighting geometry, and particle density) to ensure every shot rendered later feels like it was filmed in the same physical space.

### Type
AI Multi-Modal Text/Vision

---

## Context Input

| Field | Source | Description |
|-------|--------|-------------|
| `strategic_directives` | Agent 1.1 | Visual/cultural laws |
| `optimized_image_instruction` | Agent 1.1 | Visual style "Bible" |
| `environmentConcept` | Tab 3 Frontend | User's environment description text |
| `atmosphericDensity` | Tab 3 Frontend | 0-100 slider value |
| `cinematicLighting` | Tab 3 Frontend | Selected lighting preset |
| `visualPreset` | Tab 3 Frontend | "photorealistic" / "cinematic" / "anime" / etc. |
| `styleReferenceUrl` | Tab 3 Frontend | Uploaded moodboard (if any) |
| `environmentBrandPrimaryColor` | Tab 3 Frontend | Environment-specific color override |
| `environmentBrandSecondaryColor` | Tab 3 Frontend | Environment-specific color override |

---

## Processing Logic

The agent:

1. **Environment Parsing**: Interprets user description into technical set specifications
2. **Lighting Setup**: Converts preset selection into precise lighting geometry
3. **Physics Definition**: Establishes fog, particles, wind, and atmospheric effects
4. **Color Bible Creation**: Defines the exact color palette for the environment

---

## Output Structure

```json
{
  "visual_manifest": {
    "global_lighting_setup": "Technical description (e.g., 'Anamorphic blue rim-light at 45° azimuth, volumetric god-rays from upper-left, soft key light with 3200K warmth')",
    
    "physics_parameters": {
      "fog_density": 0.3,
      "moisture_level": 0.1,
      "wind_intensity": 0.2,
      "dust_frequency": 0.05,
      "particle_type": "floating_dust | rain | snow | embers | none"
    },
    
    "chromatic_bible": {
      "primary_hex": "#C0A060",
      "secondary_hex": "#1A1A2E",
      "accent_hex": "#FFD700"
    },
    
    "environmental_anchor_prompt": "Global prefix prompt used to prime every shot render (e.g., 'In a sleek obsidian void with golden volumetric lighting, floating dust particles catching amber light...')"
  }
}
```

---

## Output Field Definitions

### `global_lighting_setup`
Technical lighting specifications that ensure consistent illumination across all shots.

### `physics_parameters`
Environmental physics that affect how objects and characters appear:

| Parameter | Range | Effect |
|-----------|-------|--------|
| `fog_density` | 0-1 | Atmospheric haze level |
| `moisture_level` | 0-1 | Surface wetness, condensation |
| `wind_intensity` | 0-1 | Hair/fabric movement |
| `dust_frequency` | 0-1 | Floating particle density |

### `chromatic_bible`
Complete color palette that maintains visual consistency.

### `environmental_anchor_prompt`
A prefix prompt that is prepended to EVERY image generation to ensure environmental consistency.

---
---

# Agent 3.2: 3-Act Narrative Architect (The Screenwriter)

### Role
Transforms the "Creative Spark" and the raw user beats into a technically structured script. It assigns a mathematical **"Energy Level"** and **"SFX Cues"** to each act, creating the rhythmic map that the Timer Agent (4.2) will use for speed ramping.

### Type
AI Text Model

---

## Context Input

| Field | Source | Description |
|-------|--------|-------------|
| `creative_spark` | Agent 3.0 | The high-concept creative idea |
| `campaignSpark` | Tab 3 Frontend | User's campaign tagline/idea |
| `campaignObjective` | Tab 3 Frontend | "brand-awareness" / "feature-showcase" / "sales-cta" |
| `visualBeats` | Tab 3 Frontend | User's 3 beat descriptions (Hook, Transformation, Payoff) |
| `pacing_profile` | Agent 1.1 | FAST_CUT / LUXURY_SLOW / etc. |

---

## Processing Logic

The agent:

1. **Beat Enhancement**: Elevates user's raw beat descriptions into cinematic language
2. **Energy Mapping**: Assigns numerical energy levels (0-1) to each act
3. **Emotional Targeting**: Defines the emotional goal for each act
4. **SFX Cueing**: Suggests sound design elements that sync with visual peaks

---

## Output Structure

```json
{
  "script_manifest": {
    "act_1_hook": {
      "text": "Enhanced narrative description for the hook",
      "emotional_goal": "Awe | Curiosity | Tension | Excitement",
      "target_energy": 0.9,
      "sfx_cue": "Low-frequency hum building to impact"
    },
    "act_2_transform": {
      "text": "Enhanced narrative description for the transformation",
      "emotional_goal": "Understanding | Value | Connection",
      "target_energy": 0.6,
      "sfx_cue": "Mechanical click, precision sounds"
    },
    "act_3_payoff": {
      "text": "Enhanced narrative description for the payoff",
      "emotional_goal": "Desire | Aspiration | Action",
      "target_energy": 1.0,
      "sfx_cue": "Intense cinematic hit, resolution chord",
      "cta_text": "Call-to-action text if applicable"
    }
  }
}
```

---

## Energy Level Guide

| Energy Level | Visual Manifestation | Pacing |
|--------------|---------------------|--------|
| 0.0 - 0.3 | Static, contemplative | Very slow |
| 0.4 - 0.6 | Moderate movement | Steady |
| 0.7 - 0.8 | Dynamic, engaging | Fast |
| 0.9 - 1.0 | Peak intensity | Maximum |

---

## Example Output

```json
{
  "script_manifest": {
    "act_1_hook": {
      "text": "From absolute darkness, a single point of golden light emerges. It catches the edge of brushed titanium, revealing texture grain by grain. Time itself seems to crystallize.",
      "emotional_goal": "Awe",
      "target_energy": 0.85,
      "sfx_cue": "Deep sub-bass pulse, building resonance"
    },
    "act_2_transform": {
      "text": "Light sweeps across the dial, each complication revealed with mechanical precision. The crown rotates — a gesture of control, of mastery over moments.",
      "emotional_goal": "Value",
      "target_energy": 0.6,
      "sfx_cue": "Crisp mechanical clicks, gear whispers"
    },
    "act_3_payoff": {
      "text": "The full timepiece emerges from shadow into golden hour warmth. On a wrist that commands attention. Time, crystallized. Yours to wear.",
      "emotional_goal": "Desire",
      "target_energy": 1.0,
      "sfx_cue": "Orchestral swell, cinematic resolution",
      "cta_text": "Discover the Collection"
    }
  }
}
```

---
---

# Agent 3.3: Asset-Environment Harmonizer (The VFX Supervisor)

### Role
Scientifically determines how the environment affects the DNA Assets from Tab 2. It ensures the product and character modifiers (e.g., wet skin, glowing metal, wind-blown hair) are consistent with the world physics to prevent the **"pasted-on"** look.

### Type
AI Reasoning Model

---

## Context Input

| Field | Source | Description |
|-------|--------|-------------|
| `visual_manifest` | Agent 3.1 | Environment specifications |
| `geometry_profile` | Agent 2.1 | Product shape description |
| `material_spec` | Agent 2.1 | Material properties |
| `character_profile` | Agent 2.2 | Character specifications |
| `originMetaphor` | Tab 2 | e.g., "Born from fire" |

---

## Processing Logic

The agent:

1. **Environment-Product Interaction**: Determines how environment affects product appearance
2. **Environment-Character Interaction**: Determines how environment affects character appearance
3. **Metaphor Injection**: Translates origin metaphor into VFX elements
4. **Consistency Validation**: Ensures all interactions are physically plausible

---

## Output Structure

```json
{
  "interaction_physics": {
    "product_modifiers": "e.g., 'Apply heat-distortion shimmer to @Product surfaces, golden ambient reflection on titanium, micro-condensation on crystal'",
    
    "character_modifiers": "e.g., 'Skin should show specular wetness to match rain environment, hair affected by wind_intensity, warm rim light on skin edges'",
    
    "metaphor_injection": "VFX-level details derived from origin metaphor (e.g., 'Floating ash particles/ember trails in air, heat-shimmer distortion around product edges')"
  }
}
```

---

## Modifier Examples by Environment

### Desert/Heat Environment
```json
{
  "product_modifiers": "Heat shimmer distortion at product edges, warm amber reflections, dust settling on surfaces",
  "character_modifiers": "Subtle perspiration sheen on skin, squint-adjusted eye reflections, warm skin undertones",
  "metaphor_injection": "Sand particles catching light, heat waves rising from ground"
}
```

### Rain/Wet Environment
```json
{
  "product_modifiers": "Water droplets on surfaces, wet reflections, caustic light patterns through water",
  "character_modifiers": "Wet hair clinging, rain droplets on skin, specular highlights from moisture",
  "metaphor_injection": "Rain streaks, puddle reflections, mist particles"
}
```

### Studio/Controlled Environment
```json
{
  "product_modifiers": "Clean specular highlights, controlled reflections, no environmental contamination",
  "character_modifiers": "Perfect skin lighting, controlled hair, no environmental effects",
  "metaphor_injection": "Floating dust particles in light beams, subtle lens flares"
}
```

---
---

# Downstream Usage

The combined output of Tab 3 agents is consumed by:

| Downstream Agent | Fields Used | Purpose |
|------------------|-------------|---------|
| Agent 4.1 (Media Planner) | `visual_manifest`, `interaction_physics`, `creative_spark`, `script_manifest` | Shot planning context |
| Agent 4.2 (Timer) | `target_energy`, `sfx_cue` | Speed ramping calculations |
| Agent 4.3 (Prompt Architect) | `environmental_anchor_prompt`, `interaction_physics` | Technical prompts |
| Tab 5 (Media Planning) | `environmentConcept`, `cinematicLighting`, `atmosphericDensity`, `visualPreset`, `styleReferenceUrl`, `visualBeats` | Image/video prompt context |

---

# Complete Example

## Input (Tab 3 Frontend + Previous Agents)
```json
{
  "environmentConcept": "A sleek black void with a single golden spotlight revealing the product",
  "atmosphericDensity": 70,
  "cinematicLighting": "golden-hour",
  "visualPreset": "cinematic",
  "styleReferenceUrl": null,
  "environmentBrandPrimaryColor": "#C0A060",
  "environmentBrandSecondaryColor": "#1A1A2E",
  "campaignSpark": "Time, crystallized",
  "campaignObjective": "feature-showcase",
  "visualBeats": {
    "beat1": "Product emerges from darkness",
    "beat2": "Details revealed through light",
    "beat3": "Full product on wrist, call to action"
  }
}
```

## Output (Combined from all 4 agents)

### Agent 3.0 Output
```json
{
  "creative_spark": "Time crystallized in titanium — each brushed grain captures a moment of precision, revealed through light that dances across the surface like memories forming."
}
```

### Agent 3.1 Output
```json
{
  "visual_manifest": {
    "global_lighting_setup": "Single volumetric spotlight at 60° elevation, 30° azimuth. Golden (3200K) key light with soft falloff. Rim light at 180° for edge separation. No fill — deep shadows.",
    "physics_parameters": {
      "fog_density": 0.4,
      "moisture_level": 0,
      "wind_intensity": 0,
      "dust_frequency": 0.3,
      "particle_type": "floating_dust"
    },
    "chromatic_bible": {
      "primary_hex": "#C0A060",
      "secondary_hex": "#1A1A2E",
      "accent_hex": "#FFD700"
    },
    "environmental_anchor_prompt": "In an infinite obsidian void, a single golden volumetric spotlight creates a pool of warm amber light. Floating dust particles drift lazily through the beam. Deep shadows, cinematic atmosphere, 8k render quality."
  }
}
```

### Agent 3.2 Output
```json
{
  "script_manifest": {
    "act_1_hook": {
      "text": "From absolute darkness, a single point of golden light catches the edge of brushed titanium. Texture emerges grain by grain as light sweeps across the bezel.",
      "emotional_goal": "Awe",
      "target_energy": 0.85,
      "sfx_cue": "Deep sub-bass pulse building"
    },
    "act_2_transform": {
      "text": "The dial comes alive — each index, each hand, each complication revealed with mechanical poetry. The crown rotates, a gesture of precision.",
      "emotional_goal": "Value",
      "target_energy": 0.6,
      "sfx_cue": "Mechanical clicks, gear whispers"
    },
    "act_3_payoff": {
      "text": "Full reveal: the timepiece on an elegant wrist, bathed in golden warmth. Time, crystallized. Mastery, worn.",
      "emotional_goal": "Desire",
      "target_energy": 1.0,
      "sfx_cue": "Orchestral swell, impact hit",
      "cta_text": "Discover the Collection"
    }
  }
}
```

### Agent 3.3 Output
```json
{
  "interaction_physics": {
    "product_modifiers": "Golden ambient occlusion on titanium surfaces, volumetric light scattering through crystal, subtle dust settling on case edges, warm specular highlights following spotlight direction",
    "character_modifiers": "Warm rim light on skin edges matching golden spotlight, subtle golden reflection in eyes, skin undertones shifted warm to match environment",
    "metaphor_injection": "Floating dust particles catching golden light around product, subtle light rays visible in atmosphere, crystalline light refraction effects on watch crystal"
  }
}
```

