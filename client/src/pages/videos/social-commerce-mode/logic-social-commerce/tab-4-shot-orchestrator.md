# Tab 4: Shot Orchestrator Backend Logic (The Dynamic Duo)

This document defines the two backend agents responsible for processing Tab 4 (Scene & Continuity) and transforming all previous inputs into a complete, technically executable shot manifest.

---

# System Constants

Before diving into agents, these constants are used throughout the pipeline:

| Constant | Value | Description |
|----------|-------|-------------|
| `MODEL_BASE_DURATION` | 5.0s | Standard output duration for most video models |
| `MIN_SHOT_DURATION` | 0.3s | Minimum rendered duration for a shot |
| `MAX_SHOT_DURATION` | 10.0s | Maximum rendered duration (slow-motion) |

---

# Agent 4.1: Cinematic Media Planner (The Director)

### Role
The **High-Level Architect**. This agent uses Vision-to-Text reasoning to analyze physical assets and campaign constraints. It ensures the camera movements are physically possible for the product geometry and culturally resonant for the audience.

**Key Responsibility:** Decides WHAT to show and HOW to frame it — NOT timing or duration.

### Type
AI Multi-Modal Vision + Reasoning Model

---

## Deep Context Inputs

### Strategic Context (From Tab 1)
| Field | Description |
|-------|-------------|
| `targetAudience` | Audience demographic |
| `region` | Geographic/cultural region |
| `strategic_directives` | Visual/cultural laws |
| `pacing_profile` | FAST_CUT / LUXURY_SLOW / etc. (awareness only, not calculation) |

### Temporal Context
| Field | Description |
|-------|-------------|
| `total_campaign_duration` | Total video length in seconds |
| `model_limitations` | Video model constraints (max duration, etc.) |

### Visual Assets (Vision Input)
| Field | Description |
|-------|-------------|
| `heroProfile` | Primary product image |
| `macroDetail` | Close-up detail image |
| `materialReference` | Material/texture reference |
| `characterReferenceUrl` | Character reference image |
| `logoUrl` | Brand logo image |

### Physical DNA (From Tab 2)
| Field | Description |
|-------|-------------|
| `geometry_profile` | Product shape description |
| `material_spec` | Material properties |
| `hero_anchor_points` | Visual landmarks for focus |
| `character_profile` | Character specifications |
| `interaction_protocol` | Character-product interaction rules |

### Environment & Story (From Tab 3)
| Field | Description |
|-------|-------------|
| `visual_manifest` | Environment specifications |
| `interaction_physics` | VFX modifiers |
| `creative_spark` | High-concept creative idea |
| `script_manifest` | 3-act narrative structure |

---

## Processing Logic

The agent:

1. **Scene Division**: Breaks the campaign into logical scenes based on narrative acts
2. **Shot Planning**: Creates individual shots within each scene
3. **Cinematography Assignment**: Assigns camera movements, lenses, and compositions
4. **Identity Reference Mapping**: Determines which assets are needed for each shot
5. **Generation Mode Decision**: Determines if shot is IMAGE_REF or START_END
6. **Continuity Logic**: Establishes connections between shots

---

## Output Structure

```json
{
  "scenes": [{
    "scene_id": "SC1",
    "scene_name": "String (e.g., 'The Ignition')",
    "scene_description": "String (narrative summary)",
    
    "shots": [{
      "shot_id": "S1.1",
      "cinematic_goal": "String (e.g., 'Establish mystery and anticipation')",
      "brief_description": "String (shot narrative)",
      
      "technical_cinematography": {
        "camera_movement": "String (e.g., 'Slow dolly-in with micro-drift')",
        "lens": "String (e.g., 'Macro 100mm')",
        "depth_of_field": "String (e.g., 'Ultra-shallow, f/1.4')",
        "framing": "CU | ECU | MED | WIDE",
        "motion_intensity": "Integer (1-10)"
      },
      
      "generation_mode": {
        "shot_type": "IMAGE_REF | START_END",
        "reason": "String explaining the choice"
      },
      
      "identity_references": {
        "refer_to_product": "Boolean",
        "product_image_ref": "heroProfile | macroDetail | materialReference",
        "refer_to_character": "Boolean",
        "character_image_ref": "characterUrl",
        "refer_to_logo": "Boolean",
        "focus_anchor": "String (@Logo | @Button | @Edge | @Dial)",
        
        "refer_to_previous_outputs": [{
          "shot_id": "String (e.g., 'S1.2')",
          "reason": "String explaining why this reference is needed",
          "reference_type": "VISUAL_CALLBACK | LIGHTING_MATCH | PRODUCT_STATE | COMPOSITION_ECHO"
        }]
      },
      
      "continuity_logic": {
        "is_connected_to_previous": "Boolean",
        "is_connected_to_next": "Boolean",
        "handover_type": "MATCH_CUT | JUMP_CUT | SEAMLESS_FLOW"
      },
      
      "composition_safe_zones": "String (e.g., 'Keep center empty for text overlay')",
      "lighting_event": "String (e.g., 'Light-sweep across texture at 0.5s')"
    }]
  }]
}
```

**Note:** `shot_normal_duration` is REMOVED. Duration is a system constant (5.0s) and timing decisions belong to Agent 4.2.

---

## Output Field Definitions

### Scene Level

| Field | Description |
|-------|-------------|
| `scene_id` | Unique identifier (SC1, SC2, SC3) |
| `scene_name` | Human-readable name |
| `scene_description` | Narrative summary |

### Shot Level — Cinematography

| Field | Options | Description |
|-------|---------|-------------|
| `camera_movement` | Dolly, Orbit, Pan, Zoom, Static, Tracking | Camera motion type |
| `lens` | Macro, Wide 24mm, 85mm, Telephoto | Lens choice |
| `depth_of_field` | Ultra-shallow, Shallow, Medium, Deep | Focus range |
| `framing` | ECU, CU, MED, WIDE | Shot framing |
| `motion_intensity` | 1-10 | Energy level (used by Agent 4.2 for speed calculation) |

### Shot Level — Generation Mode (NEW)

| Field | Options | Description |
|-------|---------|-------------|
| `shot_type` | `IMAGE_REF`, `START_END` | How many images to generate |
| `reason` | String | Why this mode was chosen |

**Decision Logic:**
| Condition | Shot Type | Reason |
|-----------|-----------|--------|
| Static shot, single moment | `IMAGE_REF` | "Single frame captures the moment" |
| Camera orbit/pan | `START_END` | "Motion requires start and end frames" |
| Connected to next shot | `START_END` | "Continuity requires distinct end frame" |
| Dramatic transformation | `START_END` | "Visual change needs defined endpoints" |

### Shot Level — Identity References

| Field | Description |
|-------|-------------|
| `refer_to_product` | Whether to include @Product tag |
| `product_image_ref` | Which product image to use |
| `refer_to_character` | Whether to include @Character tag |
| `refer_to_logo` | Whether to include @Logo tag |
| `focus_anchor` | Primary visual focus point |
| `refer_to_previous_outputs` | Array of references to earlier shot outputs (see below) |

### Shot Level — Previous Output References (NEW)

This powerful feature allows Agent 4.1 to reference the **generated output** of earlier shots, enabling visual callbacks, lighting matches, and product state consistency across non-connected shots.

| Field | Description |
|-------|-------------|
| `shot_id` | ID of the earlier shot to reference (e.g., "S1.2") |
| `reason` | Why this reference is needed |
| `reference_type` | Type of reference (see below) |

**Reference Types:**

| Type | Purpose | Example Use Case |
|------|---------|------------------|
| `VISUAL_CALLBACK` | Same visual state should appear | Watch dial at same angle later in video |
| `LIGHTING_MATCH` | Match the exact lighting setup | Consistent golden hour across scenes |
| `PRODUCT_STATE` | Product in specific state | Watch crown was rotated in S1.3, reference that |
| `COMPOSITION_ECHO` | Similar framing/composition | Bookend shots with matching composition |

**Guardrails:**

| Rule | Description |
|------|-------------|
| **Earlier shots only** | Can only reference shots with lower scene/shot numbers (prevents circular dependencies) |
| **Max 2 references** | Each shot can reference at most 2 previous outputs (prevents over-referencing) |
| **Optional field** | Empty array `[]` if no previous output references needed |

**Execution Order Note:** When a shot references a previous output, the execution orchestrator must ensure the referenced shot is generated first.

### Shot Level — Continuity

| Field | Options | Description |
|-------|---------|-------------|
| `is_connected_to_previous` | true/false | Inherits from previous shot |
| `is_connected_to_next` | true/false | Next shot inherits from this |
| `handover_type` | MATCH_CUT, JUMP_CUT, SEAMLESS_FLOW | Transition style |

**Connection Rules:**
| Previous Shot | Can Connect To Next? |
|---------------|---------------------|
| `START_END` | ✅ Yes (has end frame to pass) |
| `IMAGE_REF` | ❌ No (single image, no distinct end frame) |

---
---

# Agent 4.2: Temporal Rhythmic Orchestrator (The Editor)

### Role
The **Rhythmic Architect**. This AI agent analyzes the shot list, energy levels, and pacing profile to determine the optimal timing, speed processing, and SFX synchronization for each shot. It transforms raw 5-second model outputs into punchy, rhythmically perfect commercial cuts.

### Type
AI Reasoning Model with Mathematical Processing

---

## Deep Context Inputs

### System Constant
| Field | Value | Description |
|-------|-------|-------------|
| `MODEL_BASE_DURATION` | 5.0s | Injected constant — all shots start at 5s |

### Rhythm Context (From Tab 1)
| Field | Description |
|-------|-------------|
| `pacing_profile` | FAST_CUT / LUXURY_SLOW / KINETIC_RAMP / etc. |
| `total_campaign_duration` | Target total duration |

### Story Beats (From Tab 3)
| Field | Description |
|-------|-------------|
| `target_energy` | Energy level per act (0-1) |
| `sfx_cue` | Sound design hints per act |

### Shot Blueprint (From Agent 4.1)
| Field | Description |
|-------|-------------|
| `scenes` | Full scenes array with all shots |
| `motion_intensity` | Energy level per shot (1-10) |
| `generation_mode.shot_type` | IMAGE_REF or START_END |

---

## Processing Logic

The agent:

1. **Duration Decision**: Determines final rendered duration for each shot based on energy and pacing
2. **Processing Method Selection**: Chooses how to achieve the duration (speed-ramp, trim, slow-mo)
3. **Speed Ramp Design**: Creates acceleration/deceleration curves
4. **Peak Timing**: Identifies the exact timestamp for maximum intensity
5. **SFX Synchronization**: Aligns visual peaks with sound design cues
6. **Budget Validation**: Ensures total rendered duration fits campaign target

---

## Output Structure

```json
{
  "temporal_map": [{
    "shot_id": "S1.1",
    "base_duration": 5.0,
    "rendered_duration": "Float (final duration after processing)",
    
    "processing_method": "SPEED_RAMP | TRIM_CUT | SLOW_MOTION | NORMAL",
    
    "speed_ramp_logic": {
      "multiplier": "Float (e.g., 12.5x speed)",
      "curve_type": "EXPONENTIAL | LINEAR | BÉZIER",
      "peak_intensity_timestamp": "Float (e.g., 0.2s — when motion peaks)"
    },
    
    "sfx_vfx_hit_map": {
      "trigger_hint": "String (e.g., 'Heavy Bass Hit at peak')",
      "sync_vfx_modifier": "String (e.g., 'Add motion-blur streak at 0.2s')"
    }
  }],
  
  "duration_budget": {
    "target_total": 15.0,
    "actual_total": 14.8,
    "variance": -0.2
  }
}
```

---

## Processing Methods

| Method | When Used | Example | Multiplier |
|--------|-----------|---------|------------|
| `SPEED_RAMP` | High energy, kinetic | 5s → 0.4s | 12.5x |
| `TRIM_CUT` | Use portion of clip | 5s → 2s (frames 0-2s) | N/A |
| `SLOW_MOTION` | Luxury, dramatic | 5s → 8s | 0.625x |
| `NORMAL` | Already right length | 5s → 5s | 1x |

---

## Speed Calculation Formula

```
For SPEED_RAMP and SLOW_MOTION:
multiplier = base_duration / rendered_duration

Examples:
- Speed-up: 5.0s → 0.4s = 12.5x multiplier
- Slow-mo: 5.0s → 8.0s = 0.625x multiplier
- Normal: 5.0s → 5.0s = 1.0x multiplier
```

---

## Curve Types

| Curve | Description | Use Case |
|-------|-------------|----------|
| `LINEAR` | Constant speed throughout | Steady, predictable motion |
| `EXPONENTIAL` | Accelerates toward end | Building tension, impact moments |
| `BÉZIER` | Custom acceleration curve | Complex rhythmic patterns |
| `EASE_IN_OUT` | Smooth start and end | Elegant, luxury feel |

---

## AI Reasoning Examples

### Example 1: High Energy Hook Shot
```
Input Context:
- motion_intensity: 9
- target_energy: 0.85
- pacing_profile: KINETIC_RAMP
- sfx_cue: "Bass drop at peak"

AI Reasoning:
"This is the hook — maximum impact needed. 
I'll compress this 5s shot to 0.4s for explosive energy.
Peak should hit at 0.3s to sync with bass drop.
Use EXPONENTIAL curve to build tension before impact."

Output:
- rendered_duration: 0.4s
- processing_method: SPEED_RAMP
- multiplier: 12.5x
- curve_type: EXPONENTIAL
- peak_intensity_timestamp: 0.3s
```

### Example 2: Luxury Reveal Shot
```
Input Context:
- motion_intensity: 3
- target_energy: 0.4
- pacing_profile: LUXURY_SLOW
- sfx_cue: "Soft ambient swell"

AI Reasoning:
"This is a luxury brand — let the product breathe.
The slow orbital movement should feel meditative.
I'll actually slow this down to 7s for maximum elegance.
Peak should be gradual, landing at 5s."

Output:
- rendered_duration: 7.0s
- processing_method: SLOW_MOTION
- multiplier: 0.71x
- curve_type: EASE_IN_OUT
- peak_intensity_timestamp: 5.0s
```

---

## Example Output

```json
{
  "temporal_map": [
    {
      "shot_id": "S1.1",
      "base_duration": 5.0,
      "rendered_duration": 0.8,
      "processing_method": "SPEED_RAMP",
      "speed_ramp_logic": {
        "multiplier": 6.25,
        "curve_type": "EXPONENTIAL",
        "peak_intensity_timestamp": 0.6
      },
      "sfx_vfx_hit_map": {
        "trigger_hint": "Sub-bass pulse at 0.6s",
        "sync_vfx_modifier": "Light flare bloom at peak"
      }
    },
    {
      "shot_id": "S1.2",
      "base_duration": 5.0,
      "rendered_duration": 1.2,
      "processing_method": "SPEED_RAMP",
      "speed_ramp_logic": {
        "multiplier": 4.17,
        "curve_type": "BÉZIER",
        "peak_intensity_timestamp": 0.8
      },
      "sfx_vfx_hit_map": {
        "trigger_hint": "Mechanical click at 0.4s",
        "sync_vfx_modifier": "Subtle motion blur on rotation"
      }
    },
    {
      "shot_id": "S2.1",
      "base_duration": 5.0,
      "rendered_duration": 6.0,
      "processing_method": "SLOW_MOTION",
      "speed_ramp_logic": {
        "multiplier": 0.83,
        "curve_type": "EASE_IN_OUT",
        "peak_intensity_timestamp": 4.0
      },
      "sfx_vfx_hit_map": {
        "trigger_hint": "Orchestral swell building",
        "sync_vfx_modifier": "Gradual light bloom"
      }
    }
  ],
  "duration_budget": {
    "target_total": 15.0,
    "actual_total": 8.0,
    "variance": -7.0
  }
}
```

---
---

# Algorithmic VFX Seeds Function

This is NOT an AI agent — it's a pure algorithmic function that calculates VFX parameters based on shot data.

## Purpose
Converts shot metadata into technical VFX parameters for the generation models.

## Function Definition

```typescript
function calculateVfxSeeds(
  shot: Shot,
  previousShot: Shot | null,
  continuityLogic: ContinuityLogic
): VfxSeeds {
  return {
    // Motion intensity directly maps to motion bucket
    motion_bucket: shot.motion_intensity,
    
    // Higher consistency for connected shots
    frame_consistency_scale: continuityLogic.is_connected_to_previous 
      ? 0.9   // Strong consistency for continuity
      : 0.75, // Standard consistency for standalone
    
    // Reference to previous shot's end frame if connected
    target_handover_image: continuityLogic.is_connected_to_previous
      ? `${previousShot.shot_id}_end_frame.png`
      : null
  };
}
```

## Output Structure

```json
{
  "motion_bucket": 7,
  "frame_consistency_scale": 0.9,
  "target_handover_image": "S1.1_end_frame.png"
}
```

## Parameter Mappings

### Motion Bucket
| motion_intensity (1-10) | motion_bucket | Effect |
|------------------------|---------------|--------|
| 1-3 | 1-3 | Minimal motion, static feel |
| 4-6 | 4-6 | Moderate motion, smooth |
| 7-8 | 7-8 | Dynamic motion, energetic |
| 9-10 | 9-10 | Maximum motion, intense |

### Frame Consistency Scale
| Condition | Scale | Effect |
|-----------|-------|--------|
| Connected to previous | 0.90 | Strong identity preservation |
| Not connected | 0.75 | Standard identity preservation |
| First shot in campaign | 0.70 | Baseline (no reference) |

---
---

# Downstream Usage

The combined output of Tab 4 agents feeds directly into **Tab 5 (Media Planning Agent)** which:

1. Receives `scenes[]` with `shots[]` from Agent 4.1
2. Receives `temporal_map[]` from Agent 4.2
3. Receives `vfx_seeds` from Algorithmic Function
4. Processes each shot according to its condition (1, 2, 3, or 4)
5. Generates the final image and video prompts with @ tag injection
6. Manages continuity through @StartFrame and @PreviousShot references

---

# Complete Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TAB 4 AGENT PIPELINE                         │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │  All Previous Tabs  │
                    │  (1, 2, 3 outputs)  │
                    └──────────┬──────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  AGENT 4.1: Cinematic Media Planner (The Director)             │
│  ─────────────────────────────────────────────────────────────  │
│  Input: All context from Tabs 1-3 + Visual assets              │
│  Output: scenes[] with shots[], cinematography, generation_mode│
│  Does NOT output: duration (that's Agent 4.2's job)            │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  AGENT 4.2: Temporal Rhythmic Orchestrator (The Editor)        │
│  ─────────────────────────────────────────────────────────────  │
│  Input: scenes[] + pacing_profile + target_energy + motion_int │
│  Knows: MODEL_BASE_DURATION = 5.0s (system constant)           │
│  Output: temporal_map[] with rendered_duration, speed ramps    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  ALGORITHMIC: VFX Seeds Calculator (No AI)                     │
│  ─────────────────────────────────────────────────────────────  │
│  Input: shots[] + continuity_logic                             │
│  Output: vfx_seeds per shot (motion_bucket, consistency_scale) │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TAB 5: Media Planning Agent                  │
│  ─────────────────────────────────────────────────────────────  │
│  Processes each shot with @ tag injection and continuity       │
│  Generates final image prompts and video prompts               │
│  Handles all 4 conditions based on shot_type + connection      │
└─────────────────────────────────────────────────────────────────┘
```

---

# Example: Complete Scene Output

## Agent 4.1 Output (Scene 1)
```json
{
  "scenes": [{
    "scene_id": "SC1",
    "scene_name": "The Ignition",
    "scene_description": "Product emerges from darkness, texture revealed through light",
    "shots": [
      {
        "shot_id": "S1.1",
        "cinematic_goal": "Establish mystery and anticipation",
        "brief_description": "Extreme close-up of bezel edge catching first light",
        "technical_cinematography": {
          "camera_movement": "Slow dolly-in with micro-drift",
          "lens": "Macro 100mm",
          "depth_of_field": "Ultra-shallow f/1.4",
          "framing": "ECU",
          "motion_intensity": 3
        },
        "generation_mode": {
          "shot_type": "START_END",
          "reason": "Camera dolly requires start and end frames for smooth motion"
        },
        "identity_references": {
          "refer_to_product": true,
          "product_image_ref": "macroDetail",
          "refer_to_character": false,
          "refer_to_logo": false,
          "focus_anchor": "@Edge",
          "refer_to_previous_outputs": []
        },
        "continuity_logic": {
          "is_connected_to_previous": false,
          "is_connected_to_next": true,
          "handover_type": "SEAMLESS_FLOW"
        },
        "composition_safe_zones": "Keep lower third clear",
        "lighting_event": "Light sweep across texture at 0.5s"
      },
      {
        "shot_id": "S1.2",
        "cinematic_goal": "Reveal precision and craftsmanship",
        "brief_description": "Orbital reveal of dial and complications",
        "technical_cinematography": {
          "camera_movement": "Orbital 15° arc",
          "lens": "85mm Portrait",
          "depth_of_field": "Shallow f/2.0",
          "framing": "CU",
          "motion_intensity": 5
        },
        "generation_mode": {
          "shot_type": "START_END",
          "reason": "Orbital motion requires distinct start and end positions"
        },
        "identity_references": {
          "refer_to_product": true,
          "product_image_ref": "heroProfile",
          "refer_to_character": false,
          "refer_to_logo": true,
          "focus_anchor": "@Dial",
          "refer_to_previous_outputs": []
        },
        "continuity_logic": {
          "is_connected_to_previous": true,
          "is_connected_to_next": true,
          "handover_type": "SEAMLESS_FLOW"
        },
        "composition_safe_zones": "Center composition",
        "lighting_event": "Specular highlight sweep at 0.8s"
      },
      {
        "shot_id": "S1.3",
        "cinematic_goal": "Capture the hero moment",
        "brief_description": "Static beauty shot of full watch face",
        "technical_cinematography": {
          "camera_movement": "Static with subtle drift",
          "lens": "85mm Portrait",
          "depth_of_field": "Medium f/4.0",
          "framing": "CU",
          "motion_intensity": 2
        },
        "generation_mode": {
          "shot_type": "IMAGE_REF",
          "reason": "Static shot captures single perfect moment"
        },
        "identity_references": {
          "refer_to_product": true,
          "product_image_ref": "heroProfile",
          "refer_to_character": false,
          "refer_to_logo": true,
          "focus_anchor": "@Logo",
          "refer_to_previous_outputs": [
            {
              "shot_id": "S1.1",
              "reason": "Match the exact golden lighting angle from the opening shot for visual bookend",
              "reference_type": "LIGHTING_MATCH"
            }
          ]
        },
        "continuity_logic": {
          "is_connected_to_previous": true,
          "is_connected_to_next": false,
          "handover_type": "MATCH_CUT"
        },
        "composition_safe_zones": "Full frame product",
        "lighting_event": "Stable golden lighting"
      }
    ]
  }]
}
```

**Note:** Shot S1.3 references S1.1's output for `LIGHTING_MATCH` — this ensures the final hero shot has the exact same golden lighting angle as the opening, creating a visual bookend effect even though these shots are not directly connected.

## Agent 4.2 Output (Temporal Map)
```json
{
  "temporal_map": [
    {
      "shot_id": "S1.1",
      "base_duration": 5.0,
      "rendered_duration": 2.0,
      "processing_method": "SPEED_RAMP",
      "speed_ramp_logic": {
        "multiplier": 2.5,
        "curve_type": "EXPONENTIAL",
        "peak_intensity_timestamp": 1.5
      },
      "sfx_vfx_hit_map": {
        "trigger_hint": "Sub-bass pulse building",
        "sync_vfx_modifier": "Light bloom at peak"
      }
    },
    {
      "shot_id": "S1.2",
      "base_duration": 5.0,
      "rendered_duration": 3.0,
      "processing_method": "SPEED_RAMP",
      "speed_ramp_logic": {
        "multiplier": 1.67,
        "curve_type": "BÉZIER",
        "peak_intensity_timestamp": 2.0
      },
      "sfx_vfx_hit_map": {
        "trigger_hint": "Mechanical click at 1.5s",
        "sync_vfx_modifier": "Specular flare on logo"
      }
    },
    {
      "shot_id": "S1.3",
      "base_duration": 5.0,
      "rendered_duration": 4.0,
      "processing_method": "TRIM_CUT",
      "speed_ramp_logic": {
        "multiplier": 1.0,
        "curve_type": "LINEAR",
        "peak_intensity_timestamp": 2.0
      },
      "sfx_vfx_hit_map": {
        "trigger_hint": "Sustained ambient tone",
        "sync_vfx_modifier": "Subtle lens flare"
      }
    }
  ],
  "duration_budget": {
    "target_total": 15.0,
    "actual_total": 9.0,
    "variance": -6.0
  }
}
```

## Algorithmic VFX Seeds Output
```json
{
  "vfx_seeds": [
    {
      "shot_id": "S1.1",
      "motion_bucket": 3,
      "frame_consistency_scale": 0.75,
      "target_handover_image": null
    },
    {
      "shot_id": "S1.2",
      "motion_bucket": 5,
      "frame_consistency_scale": 0.9,
      "target_handover_image": "S1.1_end_frame.png"
    },
    {
      "shot_id": "S1.3",
      "motion_bucket": 2,
      "frame_consistency_scale": 0.9,
      "target_handover_image": "S1.2_end_frame.png"
    }
  ]
}
```

---

# Reference Logic Summary

This section clarifies the complete reference system and the split between **Agent 4.1 (creative decisions)** and **Tab 5 (static rules)**.

## The Two Types of References

### Dynamic References (Agent 4.1 Decides)

Agent 4.1 makes **creative decisions** about which assets to reference for each shot based on the narrative and cinematography needs.

| Reference | Tag | Agent 4.1 Decides |
|-----------|-----|-------------------|
| Product Image | `@Product` | Which product image (hero, macro, material) and when to include |
| Character | `@Character` | When to include human element |
| Logo | `@Logo` | When to feature the brand logo |
| Previous Shot Output | `@Shot_X` | Visual callbacks to earlier generated shots |

### Static References (Tab 5 Applies Automatically)

Tab 5 applies **mechanical rules** based on shot conditions — these are not creative decisions.

| Reference | Tag | Rule |
|-----------|-----|------|
| Style Image | `@Style` | Always applied if user uploaded a style reference |
| Start Frame | `@StartFrame` | Applied to End Frame prompt in START-END shots |
| Inherited Image | `@InheritedImage` | Applied when connected shot inherits previous output |
| Previous Shot | `@PreviousShot` | Applied to non-connected shots for consistency |

## Complete Reference Table

| Reference | Who Decides | Logic Type | When Applied |
|-----------|-------------|------------|--------------|
| `@Product` | Agent 4.1 | Dynamic | Per-shot creative decision |
| `@Character` | Agent 4.1 | Dynamic | Per-shot creative decision |
| `@Logo` | Agent 4.1 | Dynamic | Per-shot creative decision |
| `@Shot_X` | Agent 4.1 | Dynamic | Visual callback to earlier shot output |
| `@Style` | Tab 5 | Static | Always if style image uploaded |
| `@StartFrame` | Tab 5 | Static | END frame of START-END shots |
| `@InheritedImage` | Tab 5 | Static | Connected shots (Condition 3, 4) |
| `@PreviousShot` | Tab 5 | Static | Non-connected shots for consistency |

## Execution Order

When Agent 4.1 specifies `refer_to_previous_outputs`, the execution orchestrator must respect dependencies:

```
Example: S1.3 references S1.1

Execution Order:
S1.1 → Generate → Save output
S1.2 → Generate → Save output  
S1.3 → Inject @Shot_S1.1 → Generate → Save output
```

**Rule:** A shot can only reference shots that will be generated BEFORE it in the execution sequence.

## Visual Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    REFERENCE LOGIC FLOW                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│  AGENT 4.1 (Creative Decisions)     │
│  ─────────────────────────────────  │
│  • @Product (which image, when)     │
│  • @Character (when to include)     │
│  • @Logo (when to feature)          │
│  • @Shot_X (visual callbacks)       │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  TAB 5 (Static Rules)               │
│  ─────────────────────────────────  │
│  • @Style (if uploaded)             │
│  • @StartFrame (START-END shots)    │
│  • @InheritedImage (connected)      │
│  • @PreviousShot (consistency)      │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  FINAL IMAGE PROMPT                 │
│  ─────────────────────────────────  │
│  All references assembled with      │
│  environment, description, DNA      │
└─────────────────────────────────────┘
```

> **Note:** The static reference rules (@Style, @StartFrame, @InheritedImage, @PreviousShot) are fully defined in Tab 5 documentation based on the 4 shot conditions.

---

# Summary: What Changed

| Before | After |
|--------|-------|
| 3 agents (4.1, 4.2, 4.3) | 2 agents + 1 algorithmic function |
| Agent 4.1 output `shot_normal_duration` | Removed — duration is system constant |
| No explicit `shot_type` | Added `generation_mode.shot_type` |
| Agent 4.3 generated prompts | Removed — Tab 5 handles all prompts |
| VFX seeds from AI agent | Algorithmic calculation |
| `original_duration` from 4.1 | `base_duration` = 5.0s constant |
| No processing method | Added `processing_method` field |

---

# Why These Changes?

1. **Cleaner separation**: Director (4.1) focuses on WHAT, Editor (4.2) focuses on WHEN
2. **Honest architecture**: Duration was always 5s anyway — no fake decisions
3. **No redundancy**: Tab 5 is the sole prompt generator
4. **Explicit shot types**: Tab 5 can directly use `shot_type` for condition detection
5. **Algorithmic VFX**: No AI needed for simple math calculations
