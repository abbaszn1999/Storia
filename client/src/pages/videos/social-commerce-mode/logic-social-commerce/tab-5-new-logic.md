# Tab 5: Media Planning & Execution — Complete Backend Logic

This document defines the complete logic for Tab 5, which consists of two agents:
- **Agent 5.1: Prompt Architect** (AI) — Writes the prompts
- **Agent 5.2: Execution Orchestrator** (Algorithmic) — Executes generation with asset injection

---

## Critical Architecture Note: Prompt Writing vs Execution

| Stage | Agent | Type | Behavior |
|-------|-------|------|----------|
| **Prompt Writing** | 5.1 | AI | **Single request** — writes ALL prompts at once, uses @ tags as placeholders |
| **Execution** | 5.2 | Algorithmic | **Sequential** — generates assets in order, injects URLs before each generation |

**Key Insight:** Agent 5.1 receives the **condition** as input, so it KNOWS when to write `@StartFrame` in the End Frame prompt. It doesn't wait for the Start Frame to be generated — it writes the placeholder. Agent 5.2 handles the actual sequential execution and URL injection.

---
---

# PART 1: REFERENCE SYSTEM & CONDITIONS

---

## 1.1 The 4 Conditions

The system handles **4 distinct conditions** based on shot type and connection status:

| # | Shot Type | Connected | Images Generated | Video Generated |
|---|-----------|-----------|------------------|-----------------|
| 1 | IMAGE_REF | ❌ No | 1 | 1 |
| 2 | START_END | ❌ No | 2 (Start + End) | 1 |
| 3 | START_END | ✅ Yes | 1 (End only) | 1 |
| 4 | IMAGE_REF | ✅ Yes | 0 (Inherited) | 1 |

---

### Condition Detection Logic

```
function detectCondition(shot):
  if (shot.generation_mode.shot_type === "IMAGE_REF") {
    if (shot.continuity_logic.is_connected_to_previous === false) {
      return CONDITION_1
    } else {
      return CONDITION_4
    }
  } else if (shot.generation_mode.shot_type === "START_END") {
    if (shot.continuity_logic.is_connected_to_previous === false) {
      return CONDITION_2
    } else {
      return CONDITION_3
    }
  }
```

---

### Connection Rules

**Important:** Only `START_END` shots can connect TO the next shot (they have an End Frame to pass).

| Previous Shot Type | Can Connect To Next? | Reason |
|--------------------|---------------------|--------|
| `START_END` | ✅ Yes | Has distinct End Frame to pass |
| `IMAGE_REF` | ❌ No | Single image, no distinct end frame |

---

### Visual Flow Summary

**Important Distinction:**
- **Agent 5.1 (Prompt Writing)**: Single request — writes ALL prompts at once (knows condition, uses @StartFrame as placeholder)
- **Agent 5.2 (Execution)**: Sequential — generates assets in order, injects URLs before each generation

```
CONDITION 1: IMAGE_REF (Non-Connected)
├── 5.1 writes: 1 image prompt + 1 video prompt
└── 5.2 executes: Generate Image → Generate Video
    [1 image generated]

CONDITION 2: START_END (Non-Connected)
├── 5.1 writes: Start prompt + End prompt (with @StartFrame) + Video prompt
└── 5.2 executes: Gen Start → Inject URL → Gen End → Gen Video
    [2 images generated]

CONDITION 3: START_END (Connected)
├── 5.1 writes: End prompt (with @StartFrame) + Video prompt
└── 5.2 executes: Inherit Start → Inject URL → Gen End → Gen Video
    [1 image generated]

CONDITION 4: IMAGE_REF (Connected)
├── 5.1 writes: Video prompt only
└── 5.2 executes: Inherit Image → Gen Video
    [0 images generated]
```

---
---

## 1.2 Reference Types

There are **two categories** of references:

### A. Dynamic References (Agent 4.1 Decides)

These are **creative decisions** made by Agent 4.1 for each shot. The decision is stored in `identity_references` field of each shot.

| Tag | Asset | Decision Field (from Agent 4.1) |
|-----|-------|--------------------------------|
| `@Product` | Hero Profile Image | `refer_to_product = true` + `product_image_ref = "heroProfile"` |
| `@Product_Macro` | Macro Detail Image | `refer_to_product = true` + `product_image_ref = "macroDetail"` |
| `@Texture` | Material Reference Image | `refer_to_product = true` + `product_image_ref = "materialReference"` |
| `@Logo` | Logo Image | `refer_to_logo = true` |
| `@Character` | Character Reference Image | `refer_to_character = true` |
| `@Shot_X` | Generated output of Shot X | `refer_to_previous_outputs: [{shot_id: "X", ...}]` |

**Responsibility Chain:**
| Step | Who | Action |
|------|-----|--------|
| 1 | Agent 4.1 | Decides which references each shot needs |
| 2 | Agent 5.1 | Writes @ tags in the prompt text |
| 3 | Agent 5.2 | Injects actual asset URLs |

---

### B. Static References (Auto-Applied by Condition)

These are **mechanical rules** applied automatically based on the condition. No creative decision needed.

| Tag | When Applied | Purpose |
|-----|--------------|---------|
| `@Style` | Always (if style image uploaded in Tab 3) | Apply visual style reference to all image prompts |
| `@StartFrame` | Condition 2, 3 — End Frame prompts only | Reference the Start Frame for visual consistency |
| `@InheritedImage` | Condition 3, 4 — Shot inherits from previous | The actual inherited image from previous shot's End Frame |

**Responsibility:**
| Step | Who | Action |
|------|-----|--------|
| 1 | Agent 5.2 | Detects condition and auto-applies static references |

---
---

## 1.3 Reference Flow Per Condition

### Condition 1: IMAGE_REF (Non-Connected)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONDITION 1 REFERENCE FLOW                    │
└─────────────────────────────────────────────────────────────────┘

Dynamic References (from Agent 4.1 identity_references):
├── @Product / @Product_Macro / @Texture (if refer_to_product = true)
├── @Logo (if refer_to_logo = true)
├── @Character (if refer_to_character = true)
└── @Shot_X (for each entry in refer_to_previous_outputs)

Static References (auto-applied):
└── @Style (if styleReferenceUrl exists in Tab 3)

═══════════════════════════════════════════════════════════════════

Agent 5.1 Output (SINGLE REQUEST):
├── 1 Image Prompt (with dynamic + static references)
└── 1 Video Prompt

Agent 5.2 Execution:
Step 1: Inject @ tags with asset URLs into image prompt
Step 2: Generate Image
Step 3: Generate Video (using generated image)
```

---

### Condition 2: START_END (Non-Connected)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONDITION 2 REFERENCE FLOW                    │
└─────────────────────────────────────────────────────────────────┘

Dynamic References (from Agent 4.1 identity_references):
├── @Product / @Product_Macro / @Texture (if refer_to_product = true)
├── @Logo (if refer_to_logo = true)
├── @Character (if refer_to_character = true)
└── @Shot_X (for each entry in refer_to_previous_outputs)

Static References (auto-applied):
├── @Style (if styleReferenceUrl exists in Tab 3)
└── @StartFrame (in End Frame prompt ONLY)

═══════════════════════════════════════════════════════════════════

Agent 5.1 Output (SINGLE REQUEST — all prompts written at once):
├── 1 Start Frame Prompt (dynamic + @Style)
├── 1 End Frame Prompt (dynamic + @Style + @StartFrame placeholder)
└── 1 Video Prompt

Note: Agent 5.1 KNOWS it's Condition 2, so it writes @StartFrame in the
End Frame prompt as a placeholder. No waiting for Start Frame generation.

Agent 5.2 Execution (SEQUENTIAL — asset generation):
Step 1: Inject @ tags → Generate Start Frame → Get startFrameUrl
Step 2: Replace @StartFrame with startFrameUrl → Generate End Frame
Step 3: Generate Video (using Start Frame + End Frame)
```

---

### Condition 3: START_END (Connected)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONDITION 3 REFERENCE FLOW                    │
└─────────────────────────────────────────────────────────────────┘

Inherited (auto):
└── Start Frame = Previous shot's End Frame (@InheritedImage)

Dynamic References (from Agent 4.1 identity_references):
├── @Product / @Product_Macro / @Texture (if refer_to_product = true)
├── @Logo (if refer_to_logo = true)
├── @Character (if refer_to_character = true)
└── @Shot_X (for each entry in refer_to_previous_outputs)

Static References (auto-applied):
├── @Style (if styleReferenceUrl exists in Tab 3)
└── @StartFrame (= @InheritedImage, in End Frame prompt)

═══════════════════════════════════════════════════════════════════

Agent 5.1 Output (SINGLE REQUEST):
├── 0 Start Frame Prompt (INHERITED — no prompt needed)
├── 1 End Frame Prompt (dynamic + @Style + @StartFrame placeholder)
└── 1 Video Prompt

Note: Agent 5.1 KNOWS Start Frame is inherited, still writes @StartFrame
in End Frame prompt. Agent 5.2 will inject the inherited URL.

Agent 5.2 Execution (SEQUENTIAL):
Step 1: Resolve @StartFrame = Previous shot's End Frame URL (inherited)
Step 2: Inject inherited URL + other @ tags → Generate End Frame
Step 3: Generate Video (using inherited Start + generated End)
```

---

### Condition 4: IMAGE_REF (Connected)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONDITION 4 REFERENCE FLOW                    │
└─────────────────────────────────────────────────────────────────┘

Inherited (auto):
└── Image = Previous shot's End Frame (@InheritedImage)

Dynamic References: NONE for image generation (image is inherited)

Static References: NONE for image (image is inherited)

═══════════════════════════════════════════════════════════════════

Agent 5.1 Output (SINGLE REQUEST):
├── 0 Image Prompt (INHERITED — no prompt needed)
└── 1 Video Prompt

Agent 5.2 Execution:
Step 1: Resolve inherited image = Previous shot's End Frame URL
Step 2: Generate Video (animates inherited image)
```

---
---

## 1.4 @Shot_X Dependency Management

When Agent 4.1 specifies `refer_to_previous_outputs`, the execution must respect dependencies.

### The Rule

**A shot can only reference shots that will be generated BEFORE it in the execution sequence.**

Agent 4.1 enforces this by only allowing references to shots with lower scene/shot numbers.

---

### Dependency Resolution Process

```
For each shot in execution queue:

1. Check: Does this shot have refer_to_previous_outputs?
   └── If empty: No dependencies, proceed normally

2. For each referenced shot in refer_to_previous_outputs:
   └── Check: Is the referenced shot already generated?
       ├── If YES: Proceed, asset is available
       └── If NO: ERROR — dependency not met (should not happen if 4.1 followed rules)

3. Inject @Shot_X with the generated output URL
```

---

### Example: @Shot_X in Action

```
Agent 4.1 Output for Shot S2.3:
{
  "shot_id": "S2.3",
  "identity_references": {
    "refer_to_product": true,
    "product_image_ref": "heroProfile",
    "refer_to_logo": true,
    "refer_to_previous_outputs": [
      {
        "shot_id": "S1.2",
        "reason": "Match exact golden lighting angle for visual bookend",
        "reference_type": "LIGHTING_MATCH"
      }
    ]
  }
}

Execution Order:
S1.1 → S1.2 → S1.3 → S2.1 → S2.2 → S2.3
         ↑                           ↑
    Generated here            Uses @Shot_S1.2 here

When S2.3 executes:
├── @Product → Tab 2 heroProfileUrl
├── @Logo → Tab 2 logoUrl
├── @Shot_S1.2 → generatedOutputs["S1.2"].imageUrl
└── @Style → Tab 3 styleReferenceUrl (if exists)
```

---

### Reference Type Meanings

When Agent 4.1 specifies `refer_to_previous_outputs`, it includes a `reference_type`:

| Type | Purpose | AI Instruction |
|------|---------|----------------|
| `VISUAL_CALLBACK` | Same visual state should appear | "Match the exact product appearance from this reference" |
| `LIGHTING_MATCH` | Match the lighting setup | "Use the same lighting direction and color temperature" |
| `PRODUCT_STATE` | Product in specific state | "The product should be in the same state as shown" |
| `COMPOSITION_ECHO` | Similar framing/composition | "Echo the composition style of this reference" |

---
---

## 1.5 Complete Reference Table

| Tag | Type | Asset Source | Applied In | Condition |
|-----|------|--------------|------------|-----------|
| `@Product` | Dynamic | Tab 2 Hero Profile | Image prompts | All (if 4.1 decides) |
| `@Product_Macro` | Dynamic | Tab 2 Macro Detail | Image prompts | All (if 4.1 decides) |
| `@Texture` | Dynamic | Tab 2 Material Reference | Image prompts | All (if 4.1 decides) |
| `@Logo` | Dynamic | Tab 2 Logo URL | Image prompts | All (if 4.1 decides) |
| `@Character` | Dynamic | Tab 2 Character Reference | Image prompts | All (if 4.1 decides) |
| `@Shot_X` | Dynamic | Generated output of Shot X | Image prompts | All (if 4.1 decides) |
| `@Style` | Static | Tab 3 Style Reference URL | Image prompts | All (if uploaded) |
| `@StartFrame` | Static | Generated/Inherited Start Frame | End Frame prompts | 2, 3 only |
| `@InheritedImage` | Static | Previous shot's End Frame | N/A (no prompt) | 3, 4 only |

---
---

## 1.6 Summary: Who Does What

```
┌─────────────────────────────────────────────────────────────────┐
│                    REFERENCE RESPONSIBILITY CHAIN                │
└─────────────────────────────────────────────────────────────────┘

AGENT 4.1 (Cinematic Media Planner):
├── Decides: Which product image to reference
├── Decides: Whether to include logo
├── Decides: Whether to include character
├── Decides: Which previous shots to reference (@Shot_X)
└── Output: identity_references per shot

AGENT 5.1 (Prompt Architect):
├── Reads: identity_references from 4.1
├── Writes: Prompts with @ tag placeholders
└── Output: Image prompts, Video prompts (text with @ tags)

AGENT 5.2 (Execution Orchestrator):
├── Detects: Condition (1, 2, 3, or 4)
├── Applies: Static references (@Style, @StartFrame, @InheritedImage)
├── Injects: All @ tags with actual asset URLs
├── Manages: Execution order and dependencies
├── Calls: Image/Video generation models
└── Output: Generated images, Generated videos
```

---

# PART 2: AGENT 5.1 — PROMPT ARCHITECT

---

## 2.1 Agent Definition

| Attribute | Value |
|-----------|-------|
| **Name** | Agent 5.1: Prompt Architect |
| **Type** | AI — Multimodal (Vision + Text) |
| **Model Options** | GPT-4o, Claude 3.5 Sonnet, Gemini Pro Vision |
| **Processing Mode** | Per-shot (one shot at a time) |
| **Purpose** | Write image and video prompts with @ tag placeholders |

### Why Vision + Text?

Agent 5.1 receives **actual images** (product, logo, character, style reference, @Shot_X outputs) and analyzes them to write more accurate, detailed prompts.

| Without Vision | With Vision |
|----------------|-------------|
| "A luxury watch @Product..." | "A brushed titanium chronograph with midnight blue dial and rose gold crown @Product..." |
| Relies on Agent 4.1's descriptions | Sees actual visual details |
| Risk of prompt/image mismatch | High consistency |

---

## 2.2 Complete Input Schema

Agent 5.1 receives input organized into **8 sections**, following the "Context → Task → Override" pattern.

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT 5.1 INPUT STRUCTURE                     │
└─────────────────────────────────────────────────────────────────┘

Section 1: STRATEGIC FOUNDATION ─────── The "Why"
Section 2: NARRATIVE VISION ─────────── The "Story"
Section 3: VISUAL IDENTITY ──────────── The "Look"
Section 4: SUBJECT ASSETS ───────────── The "What" (VISION INPUT)
Section 5: SCENE CONTEXT ────────────── The "Where"
Section 6: TARGET SHOT ──────────────── The "Task"
Section 7: CUSTOM INSTRUCTIONS ──────── The "Override"
Section 8: SHOT TYPE DIRECTIVE ──────── The "How" (condition-specific)
```

---

### Section 1: STRATEGIC FOUNDATION (The "Why")

| Field | Source | Type | Description |
|-------|--------|------|-------------|
| `target_audience` | Tab 1 | string | e.g., "MENA / Arab Region", "Gen Z / Youth Culture" |
| `campaign_objective` | Tab 3 | enum | "brand-awareness" / "feature-showcase" / "sales-cta" |

---

### Section 2: NARRATIVE VISION (The "Story")

| Field | Source | Type | Description |
|-------|--------|------|-------------|
| `creative_spark` | Tab 3 | string | Campaign's core idea/tagline |
| `visual_beat_1` | Tab 3 | string | Full text of "The Hook" narrative |
| `visual_beat_2` | Tab 3 | string | Full text of "The Transformation" narrative |
| `visual_beat_3` | Tab 3 | string | Full text of "The Payoff" narrative (includes CTA) |

---

### Section 3: VISUAL IDENTITY (The "Look")

| Field | Source | Type | Description |
|-------|--------|------|-------------|
| `style_source` | Tab 3 | enum | "preset" or "uploaded" |
| `visual_preset` | Tab 3 | enum | If preset: "photorealistic" / "cinematic" / "anime" / "cyberpunk" / "minimalist" |
| `environment_concept` | Tab 3 | string | Text describing the world |
| `lighting_preset` | Tab 3 | enum | "golden-hour" / "studio-soft" / "dramatic-contrast" / "neon-glow" |
| `atmospheric_density` | Tab 3 | number | 0–100 slider value |
| `environment_primary_color` | Tab 3 | string | Hex color |
| `environment_secondary_color` | Tab 3 | string | Hex color |

---

### Section 4: SUBJECT ASSETS (The "What" — VISION INPUT)

**This section contains actual images for the agent to analyze.**

Only include assets that Agent 4.1 flagged in `identity_references` for this shot.

#### 4A. Product Assets (if `refer_to_product = true`)

| Field | Source | Type | Description |
|-------|--------|------|-------------|
| `product_image_url` | Tab 2 | IMAGE | The specific product image (heroProfile, macroDetail, or materialReference) |
| `product_image_ref` | Agent 4.1 | enum | Which image: "heroProfile" / "macroDetail" / "materialReference" |
| `material_preset` | Tab 2 | enum | "metallic" / "translucent" / "soft-organic" / "matte-industrial" |
| `object_mass` | Tab 2 | number | 0–100 (affects perceived weight/motion) |
| `surface_complexity` | Tab 2 | number | 0–100 (smooth to intricate) |
| `refraction_enabled` | Tab 2 | boolean | true/false |
| `hero_feature` | Tab 2 | string | e.g., "The brushed titanium bezel" |
| `origin_metaphor` | Tab 2 | string | e.g., "A block of obsidian" |

#### 4B. Brand Assets (if `refer_to_logo = true`)

| Field | Source | Type | Description |
|-------|--------|------|-------------|
| `logo_image_url` | Tab 2 | IMAGE | High-res logo image |
| `brand_primary_color` | Tab 2 | string | Hex color |
| `brand_secondary_color` | Tab 2 | string | Hex color |
| `logo_integrity` | Tab 2 | number | 1–10 (how strictly to protect logo geometry) |
| `logo_depth` | Tab 2 | enum | "flat" to "3d-embossed" |

#### 4C. Character Assets (if `refer_to_character = true`)

| Field | Source | Type | Description |
|-------|--------|------|-------------|
| `character_image_url` | Tab 2 | IMAGE | Character reference image |
| `character_mode` | Tab 2 | enum | "hand-model" / "full-body" / "silhouette" |
| `character_description` | Tab 2 | string | AI-generated or user-written description |

#### 4D. Style Reference (if `style_source = "uploaded"`)

| Field | Source | Type | Description |
|-------|--------|------|-------------|
| `style_reference_url` | Tab 3 | IMAGE | Moodboard/style reference image |

#### 4E. Previous Shot References (from `refer_to_previous_outputs`)

For each entry in Agent 4.1's `refer_to_previous_outputs` array:

| Field | Source | Type | Description |
|-------|--------|------|-------------|
| `shot_id` | Agent 4.1 | string | e.g., "S1.2" |
| `shot_image_url` | Generated | IMAGE | The generated output of that shot |
| `reference_type` | Agent 4.1 | enum | "VISUAL_CALLBACK" / "LIGHTING_MATCH" / "PRODUCT_STATE" / "COMPOSITION_ECHO" |
| `reason` | Agent 4.1 | string | Why this reference was chosen |

---

### Section 5: SCENES CONTEXT the all scenese + (The "Where")

| Field | Source | Type | Description |
|-------|--------|------|-------------|
| `scene_id` | Tab 4 | string | Unique identifier |
| `scene_name` | Tab 4 | string | e.g., "Scene 1: The Ignition" |
| `scene_description` | Tab 4 | string | Brief scene summary |
| `scene_position` | Tab 4 | string | e.g., "1 of 3" |
| `is_first_scene` | Tab 4 | boolean | true/false |
| `is_last_scene` | Tab 4 | boolean | true/false |

#### All Shots in This Scene (for context)

| Field | Type | Description |
|-------|------|-------------|
| `shot_id` | string | Unique identifier |
| `shot_name` | string | e.g., "Shot 1.1: Macro Reveal" |
| `shot_description` | string | Brief shot summary |
| `shot_type` | enum | "IMAGE_REF" / "START_END" |
| `duration` | number | Seconds |
| `is_linked_to_previous` | boolean | true/false |

---

### Section 6: TARGET SHOT (The "Task")

This is the shot Agent 5.1 is writing prompts for.

#### From Agent 4.1 (Cinematic Media Planner)

| Field | Source | Type | Description |
|-------|--------|------|-------------|
| `shot_id` | Agent 4.1 | string | Unique identifier |
| `shot_name` | Agent 4.1 | string | e.g., "Shot 1.2: Hero Reveal" |
| `description` | Agent 4.1 | string | Full cinematic description |
| `framing` | Agent 4.1 | enum | "extreme-close-up" / "close-up" / "medium" / "wide" / "establishing" |
| `camera_path` | Agent 4.1 | enum | "orbit" / "dolly-in" / "dolly-out" / "tracking" / "static" / "pan" / "zoom" |
| `lens` | Agent 4.1 | enum | "macro" / "wide-24mm" / "portrait-85mm" / "telephoto" |
| `motion_intensity` | Agent 4.1 | number | 0.0–1.0 (creative intent) |
| `shot_type` | Agent 4.1 | enum | "IMAGE_REF" / "START_END" |
| `shot_type_reason` | Agent 4.1 | string | Why this type was chosen |
| `is_connected_to_previous` | Agent 4.1 | boolean | true/false |
| `connects_to_next` | Agent 4.1 | boolean | true/false |

#### From Agent 4.2 (Temporal Rhythmic Orchestrator)

| Field | Source | Type | Description |
|-------|--------|------|-------------|
| `rendered_duration` | Agent 4.2 | number | Actual render time in seconds |
| `processing_method` | Agent 4.2 | enum | "SPEED_RAMP" / "TRIM_CUT" / "SLOW_MOTION" / "NORMAL" |
| `multiplier` | Agent 4.2 | number | Speed multiplier |
| `curve_type` | Agent 4.2 | enum | "LINEAR" / "EASE_IN" / "EASE_OUT" / "EASE_IN_OUT" |

#### VFX Seeds (Algorithmic, from Tab 4)

| Field | Source | Type | Description |
|-------|--------|------|-------------|
| `frame_consistency_scale` | Algorithmic | number | 0.70–0.95 |
| `motion_blur_intensity` | Algorithmic | number | 0.0–1.0 |
| `temporal_coherence_weight` | Algorithmic | number | 0.80–0.98 |

#### Continuity Context

| Field | Source | Type | Description |
|-------|--------|------|-------------|
| `shot_position_in_scene` | Tab 4 | string | e.g., "2 of 3" |
| `is_first_in_scene` | Tab 4 | boolean | true/false |
| `is_last_in_scene` | Tab 4 | boolean | true/false |
| `previous_shot_summary` | Tab 4 | string | Brief context (if exists) |
| `next_shot_summary` | Tab 4 | string | Brief context (if exists) |

---

### Section 7: CUSTOM INSTRUCTIONS (The "Override")

| Field | Source | Type | Description |
|-------|--------|------|-------------|
| `custom_image_instructions` | Tab 1 | string | Free-text user guidance for image generation |
| `global_motion_dna` | Tab 1 | string | Global camera and physics rules |

---

### Section 8: SHOT TYPE DIRECTIVE (The "How")

This section is **condition-specific**. It tells Agent 5.1 exactly what to output.

#### Condition 1: IMAGE_REF (Non-Connected)

```
═══════════════════════════════════════════════════════════════════════
SHOT TYPE DIRECTIVE: IMAGE_REF (NON-CONNECTED)
═══════════════════════════════════════════════════════════════════════

Generate:
1. ONE image prompt (single keyframe)
2. ONE video prompt (animates the keyframe)

Use @ tags for assets that should be injected:
- @Product, @Product_Macro, @Texture (if product referenced)
- @Logo (if logo referenced)
- @Character (if character referenced)
- @Style (if style reference uploaded)
- @Shot_X (for each previous shot reference)

═══════════════════════════════════════════════════════════════════════
```

#### Condition 2: START_END (Non-Connected)

```
═══════════════════════════════════════════════════════════════════════
SHOT TYPE DIRECTIVE: START_END (NON-CONNECTED)
═══════════════════════════════════════════════════════════════════════

Generate:
1. ONE start frame prompt (opening composition)
2. ONE end frame prompt (closing composition)
3. ONE video prompt (interpolation between frames)

CRITICAL for End Frame Prompt:
- Include @StartFrame tag
- Instruct: "Generate the END FRAME that continues from @StartFrame.
  Maintain exact subject identity, lighting, materials, and environment."

The @StartFrame tag will be replaced with the generated start frame
during execution by Agent 5.2.

═══════════════════════════════════════════════════════════════════════
```

#### Condition 3: START_END (Connected)

```
═══════════════════════════════════════════════════════════════════════
SHOT TYPE DIRECTIVE: START_END (CONNECTED)
═══════════════════════════════════════════════════════════════════════

The START FRAME is INHERITED from the previous shot's end frame.
Do NOT generate a start frame prompt.

Generate:
1. ONE end frame prompt (closing composition)
2. ONE video prompt (interpolation between frames)

CRITICAL for End Frame Prompt:
- Include @StartFrame tag (will be the inherited image)
- Instruct: "Generate the END FRAME that continues from @StartFrame.
  Maintain exact subject identity, lighting, materials, and environment."

═══════════════════════════════════════════════════════════════════════
```

#### Condition 4: IMAGE_REF (Connected)

```
═══════════════════════════════════════════════════════════════════════
SHOT TYPE DIRECTIVE: IMAGE_REF (CONNECTED)
═══════════════════════════════════════════════════════════════════════

The IMAGE is INHERITED from the previous shot's end frame.
Do NOT generate any image prompt.

Generate:
1. ONE video prompt (animates the inherited image)

Focus the video prompt on camera movement and animation.
The image content will NOT change — only camera movement applies.

═══════════════════════════════════════════════════════════════════════
```

---
---

## 2.3 Output Schema

Agent 5.1 outputs a JSON object containing the prompts for the shot.

### Base Output Structure

```json
{
  "shot_id": "S1.2",
  "condition": 2,
  "shot_type": "START_END",
  "is_connected": false,
  
  "prompts": {
    "image": null,
    "start_frame": null,
    "end_frame": null,
    "video": null
  }
}
```

---

### Condition 1 Output: IMAGE_REF (Non-Connected)

```json
{
  "shot_id": "S1.1",
  "condition": 1,
  "shot_type": "IMAGE_REF",
  "is_connected": false,
  
  "prompts": {
    "image": {
      "text": "Extreme macro close-up of a luxury smartwatch, focusing on the brushed titanium bezel catching golden light. The surface texture is highly detailed with metallic reflections. Shot with macro lens, static camera position. Cinematic render style with golden-hour lighting in a sleek black void environment. @Product @Texture @Style",
      "tags_used": ["@Product", "@Texture", "@Style"]
    },
    "start_frame": null,
    "end_frame": null,
    "video": {
      "text": "Static macro shot with subtle micro-drift. Duration: 2.0s. Speed: Linear. Metallic surface reflections shimmer subtly with light movement. Object mass: Heavy/Solid. Maintain absolute object permanence."
    }
  }
}
```

---

### Condition 2 Output: START_END (Non-Connected)

```json
{
  "shot_id": "S1.2",
  "condition": 2,
  "shot_type": "START_END",
  "is_connected": false,
  
  "prompts": {
    "image": null,
    "start_frame": {
      "text": "Extreme macro close-up of luxury smartwatch at the START of dolly-in motion. Product fills 40% of frame, positioned left-of-center. Brushed titanium bezel catching golden light from the left. Macro lens perspective, shallow depth of field. Cinematic render style with golden-hour lighting in a sleek black void. @Product @Texture @Style",
      "tags_used": ["@Product", "@Texture", "@Style"]
    },
    "end_frame": {
      "text": "Generate the END FRAME that continues from @StartFrame. After dolly-in camera motion completes: Product now fills 80% of frame, centered. Same brushed titanium bezel, same golden light (now more direct). Macro lens perspective maintained. Same cinematic render style, same black void environment. @Product @Texture @Style @StartFrame. CRITICAL: Maintain exact subject identity, lighting temperature, material reflections, and environment from the start frame.",
      "tags_used": ["@Product", "@Texture", "@Style", "@StartFrame"]
    },
    "video": {
      "text": "Smooth dolly-in interpolation between start and end frames. Camera Path: Dolly-In. Duration: 2.5s. Speed Profile: Kinetic. Motion should feel intentional and cinematic. Object permanence: Absolute. Lighting consistency: Maintain golden-hour temperature throughout."
    }
  }
}
```

---

### Condition 3 Output: START_END (Connected)

```json
{
  "shot_id": "S1.3",
  "condition": 3,
  "shot_type": "START_END",
  "is_connected": true,
  
  "prompts": {
    "image": null,
    "start_frame": null,
    "end_frame": {
      "text": "Generate the END FRAME that continues from @StartFrame. After orbit camera motion completes: Product has rotated 90 degrees, now showing the side profile. Same brushed titanium finish, same golden lighting from the original angle (now illuminating the side). Macro lens perspective maintained. Same cinematic render style, same black void. @Product @Texture @Style @StartFrame. CRITICAL: The @StartFrame is the inherited end frame from the previous shot. Maintain exact subject identity, lighting temperature, material reflections, and environment.",
      "tags_used": ["@Product", "@Texture", "@Style", "@StartFrame"]
    },
    "video": {
      "text": "Smooth orbit interpolation between inherited start and generated end. Camera Path: Orbit. Duration: 3.0s. Speed Profile: Smooth. Object permanence: Absolute during rotation. Lighting consistency: Maintain throughout."
    }
  },
  
  "inheritance_note": "Start frame inherited from S1.2 end frame"
}
```

---

### Condition 4 Output: IMAGE_REF (Connected)

```json
{
  "shot_id": "S1.4",
  "condition": 4,
  "shot_type": "IMAGE_REF",
  "is_connected": true,
  
  "prompts": {
    "image": null,
    "start_frame": null,
    "end_frame": null,
    "video": {
      "text": "Animate the inherited image with a slow pan motion. Camera Path: Pan (left to right). Duration: 2.0s. Speed Profile: Smooth. The image content remains static — only the camera viewport moves. Maintain absolute object permanence. Subtle parallax effect on depth layers if applicable."
    }
  },
  
  "inheritance_note": "Image inherited from S1.3 end frame"
}
```

---
---

## 2.4 System Prompt Template

This is the system prompt sent to Agent 5.1 for every request.

```
═══════════════════════════════════════════════════════════════════════
SYSTEM PROMPT: AGENT 5.1 — PROMPT ARCHITECT
═══════════════════════════════════════════════════════════════════════

You are the Prompt Architect for a professional AI video production system.

YOUR ROLE:
- Analyze the provided images (product, logo, character, style reference)
- Write detailed, cinematic prompts for image and video generation
- Use @ tags as placeholders for assets that will be injected later

═══════════════════════════════════════════════════════════════════════
@ TAG REFERENCE
═══════════════════════════════════════════════════════════════════════

Use these tags in your prompts. They will be replaced with actual assets.

DYNAMIC TAGS (use if the asset is provided in Section 4):
- @Product — The product image (hero profile)
- @Product_Macro — Product close-up detail
- @Texture — Material/texture reference
- @Logo — Brand logo
- @Character — Human element reference
- @Shot_S1.2 — Output of a previous shot (format: @Shot_[shot_id])

STATIC TAGS (use based on condition):
- @Style — Style reference image (if uploaded)
- @StartFrame — The start frame (for end frame prompts in conditions 2, 3)

═══════════════════════════════════════════════════════════════════════
VISION ANALYSIS INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════

You have been provided with actual images. ANALYZE THEM CAREFULLY:

1. PRODUCT IMAGE: Note specific details — colors, materials, textures,
   shapes, reflections, unique features. Describe what you SEE.

2. LOGO IMAGE: Note typography, colors, geometry, style. Describe the
   visual characteristics accurately.

3. CHARACTER IMAGE: Note appearance, pose, clothing, expression.
   Describe for identity consistency.

4. STYLE REFERENCE: Note color palette, lighting style, mood, texture
   treatment. Apply this aesthetic to your prompts.

5. @SHOT_X REFERENCES: Note the visual state, lighting, composition.
   Use these for consistency as specified by the reference_type.

═══════════════════════════════════════════════════════════════════════
PROMPT WRITING GUIDELINES
═══════════════════════════════════════════════════════════════════════

IMAGE PROMPTS:
- Be specific and detailed about visual elements
- Include: subject, composition, lighting, environment, camera, style
- Place @ tags naturally in the prompt
- Include composition notes for camera movement planning

VIDEO PROMPTS:
- Focus on motion, not static description
- Include: camera path, duration, speed profile, physics behavior
- Emphasize object permanence — no morphing or distortion
- Include lighting and material consistency notes

END FRAME PROMPTS (Conditions 2, 3):
- Always include @StartFrame tag
- Explicitly instruct to maintain consistency with start frame
- Describe what CHANGES (composition, angle) and what STAYS SAME

═══════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════

Return a JSON object with this structure:

{
  "shot_id": "[from input]",
  "condition": [1, 2, 3, or 4],
  "shot_type": "[IMAGE_REF or START_END]",
  "is_connected": [true or false],
  "prompts": {
    "image": { "text": "...", "tags_used": [...] } or null,
    "start_frame": { "text": "...", "tags_used": [...] } or null,
    "end_frame": { "text": "...", "tags_used": [...] } or null,
    "video": { "text": "..." }
  }
}

═══════════════════════════════════════════════════════════════════════
```

---
---

## 2.5 Per-Condition Behavior Summary

| Condition | Agent 5.1 Receives | Agent 5.1 Outputs | Key Instructions |
|-----------|-------------------|-------------------|------------------|
| **1** | Full input + assets | 1 image + 1 video | Standard single keyframe |
| **2** | Full input + assets + "Generate 2 frames" directive | 1 start + 1 end + 1 video | End frame uses @StartFrame |
| **3** | Full input + assets + "End frame only" directive | 1 end + 1 video | Start is inherited, end uses @StartFrame |
| **4** | Full input + "Video only" directive | 1 video only | Image is inherited, video animates it |

---

### Condition 1: IMAGE_REF (Non-Connected)

```
INPUT:
├── Sections 1-7 (full context)
├── Section 4: Product/Logo/Character/Style images (if referenced)
├── Section 8: "Generate 1 image + 1 video"
└── No inheritance context

AGENT 5.1 BEHAVIOR:
1. Analyze provided images (product details, style reference)
2. Write detailed image prompt with @ tags
3. Write video prompt for animation
4. Return JSON with image + video prompts

OUTPUT:
├── prompts.image: { text, tags_used }
├── prompts.video: { text }
└── prompts.start_frame, prompts.end_frame: null
```

---

### Condition 2: START_END (Non-Connected)

```
INPUT:
├── Sections 1-7 (full context)
├── Section 4: Product/Logo/Character/Style images (if referenced)
├── Section 8: "Generate 2 frames + 1 video, use @StartFrame in end"
└── No inheritance context

AGENT 5.1 BEHAVIOR:
1. Analyze provided images
2. Write start frame prompt (opening composition)
3. Write end frame prompt (closing composition + @StartFrame)
4. Write video prompt (interpolation)
5. Return JSON with all three prompts

OUTPUT:
├── prompts.start_frame: { text, tags_used }
├── prompts.end_frame: { text with @StartFrame, tags_used }
├── prompts.video: { text }
└── prompts.image: null
```

---

### Condition 3: START_END (Connected)

```
INPUT:
├── Sections 1-7 (full context)
├── Section 4: Product/Logo/Character/Style images (if referenced)
├── Section 8: "End frame only, start is inherited, use @StartFrame"
└── Inheritance note: "Start frame = previous shot's end frame"

AGENT 5.1 BEHAVIOR:
1. Analyze provided images
2. SKIP start frame prompt (it's inherited)
3. Write end frame prompt (uses @StartFrame for inherited image)
4. Write video prompt (interpolation)
5. Return JSON with end + video prompts

OUTPUT:
├── prompts.end_frame: { text with @StartFrame, tags_used }
├── prompts.video: { text }
├── prompts.image, prompts.start_frame: null
└── inheritance_note: "Start frame inherited from [previous shot]"
```

---

### Condition 4: IMAGE_REF (Connected)

```
INPUT:
├── Sections 1-7 (full context)
├── Section 4: Minimal (image is inherited, no generation needed)
├── Section 8: "Video only, image is inherited"
└── Inheritance note: "Image = previous shot's end frame"

AGENT 5.1 BEHAVIOR:
1. SKIP image analysis (image is inherited)
2. SKIP image prompt (no generation needed)
3. Write video prompt (camera movement on inherited image)
4. Return JSON with video prompt only

OUTPUT:
├── prompts.video: { text }
├── prompts.image, prompts.start_frame, prompts.end_frame: null
└── inheritance_note: "Image inherited from [previous shot]"
```

---
---

## 2.6 Example: Complete Agent 5.1 Request/Response

### Example Request (Condition 2)

```json
{
  "section_1_strategic": {
    "target_audience": "MENA / Arab Region",
    "campaign_objective": "feature-showcase"
  },
  
  "section_2_narrative": {
    "creative_spark": "Timeless elegance meets modern precision",
    "visual_beat_1": "A mysterious unveiling in golden light",
    "visual_beat_2": "The transformation reveals intricate details",
    "visual_beat_3": "The payoff: pure luxury captured"
  },
  
  "section_3_visual": {
    "style_source": "preset",
    "visual_preset": "cinematic",
    "environment_concept": "Sleek black void with golden spotlight",
    "lighting_preset": "golden-hour",
    "atmospheric_density": 70,
    "environment_primary_color": "#1a1a1a",
    "environment_secondary_color": "#d4af37"
  },
  
  "section_4_assets": {
    "product": {
      "included": true,
      "image_url": "https://storage.../product-hero.jpg",
      "image_ref": "heroProfile",
      "material_preset": "metallic",
      "object_mass": 80,
      "surface_complexity": 75,
      "hero_feature": "The brushed titanium bezel"
    },
    "logo": {
      "included": false
    },
    "character": {
      "included": false
    },
    "style_reference": {
      "included": false
    },
    "previous_shots": []
  },
  
  "section_5_scene": {
    "scene_id": "scene-1",
    "scene_name": "Scene 1: The Ignition",
    "scene_position": "1 of 3",
    "is_first_scene": true
  },
  
  "section_6_target_shot": {
    "shot_id": "S1.2",
    "shot_name": "Shot 1.2: Hero Reveal",
    "description": "Dolly-in reveals the watch face in stunning detail",
    "framing": "extreme-close-up",
    "camera_path": "dolly-in",
    "lens": "macro",
    "motion_intensity": 0.7,
    "shot_type": "START_END",
    "is_connected_to_previous": false,
    "connects_to_next": true,
    "rendered_duration": 2.5,
    "processing_method": "NORMAL",
    "vfx_seeds": {
      "frame_consistency_scale": 0.85,
      "motion_blur_intensity": 0.3,
      "temporal_coherence_weight": 0.92
    }
  },
  
  "section_7_custom": {
    "custom_image_instructions": "Focus on the metallic textures",
    "global_motion_dna": "Cinematic macro lighting, smooth deliberate movements"
  },
  
  "section_8_directive": {
    "condition": 2,
    "instruction": "Generate START frame, END frame (with @StartFrame), and VIDEO prompt"
  }
}
```

### Example Response (Condition 2)

```json
{
  "shot_id": "S1.2",
  "condition": 2,
  "shot_type": "START_END",
  "is_connected": false,
  
  "prompts": {
    "image": null,
    "start_frame": {
      "text": "Extreme macro close-up of a luxury chronograph watch at the START of a dolly-in motion. The brushed titanium bezel fills 40% of the frame, positioned left-of-center. Golden spotlight from the upper left creates dramatic highlights on the metallic surface, revealing the intricate brushed texture pattern. Shallow depth of field with macro lens perspective. The watch face is partially visible, hinting at the complexity beneath. Sleek black void environment with subtle golden ambient glow. Cinematic render style. @Product",
      "tags_used": ["@Product"]
    },
    "end_frame": {
      "text": "Generate the END FRAME that continues from @StartFrame. After the dolly-in camera motion completes: The same luxury chronograph now fills 85% of the frame, perfectly centered. The brushed titanium bezel is now fully visible, golden spotlight now more direct, creating intense metallic reflections. The intricate dial details are now clearly visible — indices, hands, subdials. Same macro lens perspective with slightly deeper depth of field. Same black void environment, same golden lighting temperature. @Product @StartFrame. CRITICAL: Maintain exact subject identity — same watch, same titanium finish, same lighting color temperature. Only composition and camera distance change.",
      "tags_used": ["@Product", "@StartFrame"]
    },
    "video": {
      "text": "Smooth, deliberate dolly-in interpolation between start and end frames. Camera Path: Dolly-In. Duration: 2.5s. Speed Profile: Kinetic with subtle ease-out. The camera movement should feel intentional and cinematic, not rushed. Object permanence: Absolute — no morphing or distortion of the watch geometry. Lighting consistency: Maintain golden-hour temperature throughout the motion. The metallic reflections should shift naturally with the camera movement, creating a sense of three-dimensional depth. Motion blur: Low (0.3) for crisp detail retention."
    }
  }
}
```

---

# PART 3: AGENT 5.2 — EXECUTION ORCHESTRATOR

---

## 3.1 Agent Definition

| Attribute | Value |
|-----------|-------|
| **Name** | Agent 5.2: Execution Orchestrator |
| **Type** | Algorithmic (NOT AI) |
| **Purpose** | Inject assets into prompts, call generation models, manage execution order |
| **Processing** | Shot by shot, image by image |

### Key Characteristics

- **No AI decisions** — purely mechanical execution
- **Deterministic** — same inputs always produce same execution flow
- **Sequential where needed** — respects dependencies (Start → End, inheritance)
- **Parallel where possible** — independent shots can run concurrently

---

## 3.2 Core Responsibilities

```
┌─────────────────────────────────────────────────────────────────┐
│                 AGENT 5.2 RESPONSIBILITIES                       │
└─────────────────────────────────────────────────────────────────┘

For each shot in timeline order:

1. DETECT condition (1, 2, 3, or 4)

2. RESOLVE inheritance (if connected):
   └── Get previous shot's end frame URL

3. RESOLVE @ tags to image attachments:
   ├── Scan prompt for @ tags (they stay in the text as labels)
   ├── Build image attachment array with matching labels
   └── Each attachment: { label: "@Product", url: "https://..." }

4. EXECUTE generation (prompt + labeled images sent together):
   ├── Condition 1: Gen Image → Gen Video
   ├── Condition 2: Gen Start → Add @StartFrame attachment → Gen End → Gen Video
   ├── Condition 3: Inherit Start → Add @StartFrame attachment → Gen End → Gen Video
   └── Condition 4: Inherit Image → Gen Video

5. STORE outputs for:
   ├── Inheritance by next connected shot
   └── @Shot_X references by future shots
```

---

## 3.3 Input: What Agent 5.2 Receives

| Input | Source | Description |
|-------|--------|-------------|
| `shot` | Tab 4 | Shot metadata (id, type, connection status) |
| `agent51Output` | Agent 5.1 | The prompts with @ tag placeholders |
| `assetRegistry` | Tabs 2, 3 | All uploaded assets (product, logo, character, style) |
| `generatedOutputs` | Previous executions | Map of shot_id → generated URLs |

---

## 3.4 The Asset Registry

The asset registry contains all uploaded assets from Tabs 2 and 3:

```json
{
  "product": {
    "heroProfileUrl": "https://storage.../product-hero.jpg",
    "macroDetailUrl": "https://storage.../product-macro.jpg",
    "materialReferenceUrl": "https://storage.../product-texture.jpg"
  },
  "brand": {
    "logoUrl": "https://storage.../logo.png"
  },
  "character": {
    "referenceUrl": "https://storage.../character-ref.jpg"
  },
  "style": {
    "referenceUrl": "https://storage.../style-moodboard.jpg"
  }
}
```

---

## 3.5 The Generated Outputs Store

As shots are generated, their outputs are stored for future reference:

```json
{
  "S1.1": {
    "imageUrl": "https://generated.../s1-1-image.jpg",
    "videoUrl": "https://generated.../s1-1-video.mp4"
  },
  "S1.2": {
    "startFrameUrl": "https://generated.../s1-2-start.jpg",
    "endFrameUrl": "https://generated.../s1-2-end.jpg",
    "videoUrl": "https://generated.../s1-2-video.mp4"
  },
  "S1.3": {
    "startFrameUrl": "https://generated.../s1-2-end.jpg",  // inherited
    "endFrameUrl": "https://generated.../s1-3-end.jpg",
    "videoUrl": "https://generated.../s1-3-video.mp4"
  }
}
```

---
---

## 3.6 The Execution Loop

### Main Execution Function

```
function executeAllShots(shots, agent51Outputs, assetRegistry):
  
  generatedOutputs = {}
  
  for each shot in shots (in timeline order):
    
    agent51Output = agent51Outputs[shot.id]
    
    result = executeShot(shot, agent51Output, assetRegistry, generatedOutputs)
    
    generatedOutputs[shot.id] = result
  
  return generatedOutputs
```

---

### Per-Shot Execution Function

```
function executeShot(shot, agent51Output, assetRegistry, generatedOutputs):

  condition = detectCondition(shot)
  
  // ═══════════════════════════════════════════════════════════════
  // CONDITION 1: IMAGE_REF (Non-Connected)
  // ═══════════════════════════════════════════════════════════════
  if (condition === 1):
    
    // Step 1: Resolve @ tags to image attachments
    // (prompt text unchanged, images sent as labeled attachments)
    imageRequest = resolveTagsToAttachments(
      agent51Output.prompts.image.text,
      assetRegistry,
      generatedOutputs
    )
    // imageRequest = { prompt: "...@Product...", images: [{label: "@Product", url: "..."}] }
    
    // Step 2: Generate image (prompt + labeled images sent together)
    generatedImage = callImageModel(imageRequest.prompt, imageRequest.images)
    
    // Step 3: Generate video
    generatedVideo = callVideoModel(
      agent51Output.prompts.video.text,
      generatedImage
    )
    
    // Step 4: Return result
    return {
      imageUrl: generatedImage.url,
      videoUrl: generatedVideo.url
    }
  
  // ═══════════════════════════════════════════════════════════════
  // CONDITION 2: START_END (Non-Connected)
  // ═══════════════════════════════════════════════════════════════
  else if (condition === 2):
    
    // Step 1: Resolve @ tags for start frame prompt
    startRequest = resolveTagsToAttachments(
      agent51Output.prompts.start_frame.text,
      assetRegistry,
      generatedOutputs
    )
    
    // Step 2: Generate start frame
    startFrame = callImageModel(startRequest.prompt, startRequest.images)
    
    // Step 3: Resolve @ tags for end frame prompt
    //         PLUS add @StartFrame attachment with generated start frame
    endRequest = resolveTagsToAttachments(
      agent51Output.prompts.end_frame.text,
      assetRegistry,
      generatedOutputs
    )
    endRequest.images.push({ label: "@StartFrame", url: startFrame.url })
    
    // Step 4: Generate end frame (sees start frame as labeled reference)
    endFrame = callImageModel(endRequest.prompt, endRequest.images)
    
    // Step 5: Generate video with both frames
    generatedVideo = callVideoModel(
      agent51Output.prompts.video.text,
      startFrame,
      endFrame
    )
    
    // Step 6: Return result
    return {
      startFrameUrl: startFrame.url,
      endFrameUrl: endFrame.url,
      videoUrl: generatedVideo.url
    }
  
  // ═══════════════════════════════════════════════════════════════
  // CONDITION 3: START_END (Connected)
  // ═══════════════════════════════════════════════════════════════
  else if (condition === 3):
    
    // Step 1: Inherit start frame from previous shot
    previousShot = getPreviousShot(shot)
    inheritedStart = generatedOutputs[previousShot.id].endFrameUrl
    
    // Step 2: Resolve @ tags for end frame prompt
    //         PLUS add @StartFrame attachment with inherited image
    endRequest = resolveTagsToAttachments(
      agent51Output.prompts.end_frame.text,
      assetRegistry,
      generatedOutputs
    )
    endRequest.images.push({ label: "@StartFrame", url: inheritedStart })
    
    // Step 3: Generate end frame (sees inherited start as labeled reference)
    endFrame = callImageModel(endRequest.prompt, endRequest.images)
    
    // Step 4: Generate video with inherited start + generated end
    generatedVideo = callVideoModel(
      agent51Output.prompts.video.text,
      inheritedStart,
      endFrame
    )
    
    // Step 5: Return result
    return {
      startFrameUrl: inheritedStart,  // inherited, not generated
      endFrameUrl: endFrame.url,
      videoUrl: generatedVideo.url
    }
  
  // ═══════════════════════════════════════════════════════════════
  // CONDITION 4: IMAGE_REF (Connected)
  // ═══════════════════════════════════════════════════════════════
  else if (condition === 4):
    
    // Step 1: Inherit image from previous shot
    previousShot = getPreviousShot(shot)
    inheritedImage = generatedOutputs[previousShot.id].endFrameUrl
    
    // Step 2: Generate video (no image generation needed)
    generatedVideo = callVideoModel(
      agent51Output.prompts.video.text,
      inheritedImage
    )
    
    // Step 3: Return result
    return {
      imageUrl: inheritedImage,  // inherited, not generated
      videoUrl: generatedVideo.url
    }
```

---
---

## 3.7 The Tag Resolution Function

This function scans the prompt for @ tags and builds a labeled image attachment array.
**The @ tags stay in the prompt text as labels** — they are NOT replaced.

```
function resolveTagsToAttachments(promptText, assetRegistry, generatedOutputs):
  
  images = []  // Array of { label, url } pairs
  
  // ═══════════════════════════════════════════════════════════════
  // DYNAMIC REFERENCES (from Tab 2)
  // ═══════════════════════════════════════════════════════════════
  
  if contains(promptText, "@Product"):
    images.push({
      label: "@Product",
      url: assetRegistry.product.heroProfileUrl
    })
  
  if contains(promptText, "@Product_Macro"):
    images.push({
      label: "@Product_Macro",
      url: assetRegistry.product.macroDetailUrl
    })
  
  if contains(promptText, "@Texture"):
    images.push({
      label: "@Texture",
      url: assetRegistry.product.materialReferenceUrl
    })
  
  if contains(promptText, "@Logo"):
    images.push({
      label: "@Logo",
      url: assetRegistry.brand.logoUrl
    })
  
  if contains(promptText, "@Character"):
    images.push({
      label: "@Character",
      url: assetRegistry.character.referenceUrl
    })
  
  // ═══════════════════════════════════════════════════════════════
  // STATIC REFERENCE (from Tab 3)
  // ═══════════════════════════════════════════════════════════════
  
  if contains(promptText, "@Style"):
    if assetRegistry.style.referenceUrl exists:
      images.push({
        label: "@Style",
        url: assetRegistry.style.referenceUrl
      })
    // If no style uploaded, no attachment added (tag ignored)
  
  // ═══════════════════════════════════════════════════════════════
  // DYNAMIC SHOT REFERENCES (from Agent 4.1)
  // ═══════════════════════════════════════════════════════════════
  
  // Pattern: @Shot_S1.2, @Shot_S2.1, etc.
  for each match of "@Shot_S[X.Y]" in promptText:
    shotId = extractShotId(match)  // e.g., "S1.2"
    
    if generatedOutputs[shotId] exists:
      // Use endFrameUrl if available (for START_END shots), else imageUrl
      shotUrl = generatedOutputs[shotId].endFrameUrl 
                || generatedOutputs[shotId].imageUrl
      images.push({
        label: match,  // e.g., "@Shot_S1.2"
        url: shotUrl
      })
    else:
      // ERROR: Referenced shot not yet generated
      throw DependencyError("Shot " + shotId + " not yet generated")
  
  // Return prompt unchanged + image attachments
  return {
    prompt: promptText,  // @ tags remain as labels in the text
    images: images       // Labeled images sent alongside prompt
  }
```

---

### How the Image Model Receives the Request

```json
{
  "prompt": "A luxury watch @Product with golden lighting, styled like @Style, 
             matching the composition of @Shot_S1.1...",
  
  "images": [
    { "label": "@Product", "url": "https://storage.../product-hero.jpg" },
    { "label": "@Style", "url": "https://storage.../style-moodboard.jpg" },
    { "label": "@Shot_S1.1", "url": "https://generated.../s1-1-image.jpg" }
  ]
}
```

The image model:
1. Reads the prompt text
2. Sees `@Product`, `@Style`, `@Shot_S1.1` as labels
3. Associates each label with its corresponding image from the attachments array
4. Uses those images as visual references when generating

---
---

## 3.8 Helper Functions

### Condition Detection

```
function detectCondition(shot):
  if (shot.shot_type === "IMAGE_REF"):
    if (shot.is_connected_to_previous === false):
      return 1
    else:
      return 4
  else if (shot.shot_type === "START_END"):
    if (shot.is_connected_to_previous === false):
      return 2
    else:
      return 3
```

### Get Previous Shot

```
function getPreviousShot(shot):
  // Returns the shot that this shot is connected to
  // (the immediately preceding shot in the timeline)
  return shots.find(s => s.id === shot.previous_shot_id)
```

### Call Image Model

```
function callImageModel(promptText, imageAttachments):
  // Send prompt + labeled images to the image generation model
  
  return imageModelAPI.generate({
    prompt: promptText,           // @ tags remain as labels
    reference_images: imageAttachments.map(img => ({
      name: img.label,            // e.g., "@Product"
      image_url: img.url          // The actual image URL
    }))
  })
```

---
---

## 3.9 Execution Flow Diagrams

### Condition 1: IMAGE_REF (Non-Connected)

```
┌─────────────────────────────────────────────────────────────────┐
│              CONDITION 1 EXECUTION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

Agent 5.1 Output:
├── image.text: "...@Product @Texture @Style..."  (tags as labels)
└── video.text: "..."

                    ↓

Step 1: RESOLVE @ TAGS TO ATTACHMENTS
┌─────────────────────────────────────────────────────────────────┐
│  Scan prompt for @ tags, build attachment array:                 │
│                                                                  │
│  images: [                                                       │
│    { label: "@Product", url: heroProfileUrl },                   │
│    { label: "@Texture", url: materialReferenceUrl },             │
│    { label: "@Style", url: styleReferenceUrl }                   │
│  ]                                                               │
│                                                                  │
│  Prompt text UNCHANGED — @ tags stay as labels                   │
└─────────────────────────────────────────────────────────────────┘

                    ↓

Step 2: GENERATE IMAGE (prompt + labeled images)
┌─────────────────────────────────────────────────────────────────┐
│  callImageModel(prompt, images)                                  │
│  ├── prompt: "...@Product @Texture @Style..."                    │
│  └── images: [{ label: "@Product", url: "..." }, ...]            │
│                    ↓                                             │
│  Model associates labels in text with attached images            │
│                    ↓                                             │
│  ┌──────────────────┐                                            │
│  │  GENERATED IMAGE │                                            │
│  └──────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘

                    ↓

Step 3: GENERATE VIDEO
┌─────────────────────────────────────────────────────────────────┐
│  callVideoModel(videoPrompt, generatedImage)                     │
│                    ↓                                             │
│  ┌──────────────────┐                                            │
│  │  GENERATED VIDEO │                                            │
│  └──────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘

                    ↓

Step 4: STORE
┌─────────────────────────────────────────────────────────────────┐
│  generatedOutputs[shot.id] = {                                   │
│    imageUrl: "...",                                              │
│    videoUrl: "..."                                               │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

### Condition 2: START_END (Non-Connected)

```
┌─────────────────────────────────────────────────────────────────┐
│              CONDITION 2 EXECUTION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

Agent 5.1 Output:
├── start_frame.text: "...@Product @Style..."  (tags as labels)
├── end_frame.text: "...@Product @Style @StartFrame..."
└── video.text: "..."

                    ↓

Step 1: RESOLVE @ TAGS FOR START FRAME
┌─────────────────────────────────────────────────────────────────┐
│  images: [                                                       │
│    { label: "@Product", url: heroProfileUrl },                   │
│    { label: "@Style", url: styleReferenceUrl }                   │
│  ]                                                               │
└─────────────────────────────────────────────────────────────────┘

                    ↓

Step 2: GENERATE START FRAME
┌─────────────────────────────────────────────────────────────────┐
│  callImageModel(prompt, images)                                  │
│                    ↓                                             │
│  ┌──────────────────┐                                            │
│  │   START FRAME    │ ← Save URL for next step                   │
│  └──────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘

                    ↓

Step 3: RESOLVE @ TAGS FOR END FRAME + ADD @StartFrame
┌─────────────────────────────────────────────────────────────────┐
│  images: [                                                       │
│    { label: "@Product", url: heroProfileUrl },                   │
│    { label: "@Style", url: styleReferenceUrl },                  │
│    { label: "@StartFrame", url: startFrame.url }  ← From Step 2  │
│  ]                                                               │
└─────────────────────────────────────────────────────────────────┘

                    ↓

Step 4: GENERATE END FRAME
┌─────────────────────────────────────────────────────────────────┐
│  callImageModel(prompt, images)                                  │
│  ├── prompt: "...@Product @Style @StartFrame..."                 │
│  └── images: [..., { label: "@StartFrame", url: "..." }]         │
│                    ↓                                             │
│  Model sees @StartFrame in text, uses attached image             │
│                    ↓                                             │
│  ┌──────────────────┐                                            │
│  │    END FRAME     │                                            │
│  └──────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘

                    ↓

Step 5: GENERATE VIDEO
┌─────────────────────────────────────────────────────────────────┐
│  callVideoModel(videoPrompt, startFrame, endFrame)               │
│                    ↓                                             │
│  ┌──────────────────┐                                            │
│  │  GENERATED VIDEO │                                            │
│  └──────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘

                    ↓

Step 6: STORE
┌─────────────────────────────────────────────────────────────────┐
│  generatedOutputs[shot.id] = {                                   │
│    startFrameUrl: "...",                                         │
│    endFrameUrl: "...",  ← Available for next connected shot      │
│    videoUrl: "..."                                               │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

### Condition 3: START_END (Connected)

```
┌─────────────────────────────────────────────────────────────────┐
│              CONDITION 3 EXECUTION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

Previous Shot Output (already generated):
└── endFrameUrl: "https://..." ← This becomes our Start Frame

Agent 5.1 Output:
├── start_frame: null (inherited)
├── end_frame.text: "...@Product @Style @StartFrame..."
└── video.text: "..."

                    ↓

Step 1: INHERIT START FRAME
┌─────────────────────────────────────────────────────────────────┐
│  inheritedStart = generatedOutputs[previousShot.id].endFrameUrl  │
│  ┌──────────────────┐                                            │
│  │   START FRAME    │ = Previous shot's End Frame (INHERITED)    │
│  │   (INHERITED)    │                                            │
│  └──────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘

                    ↓

Step 2: RESOLVE @ TAGS FOR END FRAME + ADD @StartFrame
┌─────────────────────────────────────────────────────────────────┐
│  images: [                                                       │
│    { label: "@Product", url: heroProfileUrl },                   │
│    { label: "@Style", url: styleReferenceUrl },                  │
│    { label: "@StartFrame", url: inheritedStart }  ← INHERITED    │
│  ]                                                               │
└─────────────────────────────────────────────────────────────────┘

                    ↓

Step 3: GENERATE END FRAME
┌─────────────────────────────────────────────────────────────────┐
│  callImageModel(prompt, images)                                  │
│  ├── prompt: "...@Product @Style @StartFrame..."                 │
│  └── images: [..., { label: "@StartFrame", url: inherited }]     │
│                    ↓                                             │
│  Model sees @StartFrame label, uses inherited image              │
│                    ↓                                             │
│  ┌──────────────────┐                                            │
│  │    END FRAME     │                                            │
│  └──────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘

                    ↓

Step 4: GENERATE VIDEO
┌─────────────────────────────────────────────────────────────────┐
│  callVideoModel(videoPrompt, inheritedStart, endFrame)           │
│                    ↓                                             │
│  ┌──────────────────┐                                            │
│  │  GENERATED VIDEO │                                            │
│  └──────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘

                    ↓

Step 5: STORE
┌─────────────────────────────────────────────────────────────────┐
│  generatedOutputs[shot.id] = {                                   │
│    startFrameUrl: inheritedStart,  (inherited)                   │
│    endFrameUrl: "...",  ← Available for next connected shot      │
│    videoUrl: "..."                                               │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

### Condition 4: IMAGE_REF (Connected)

```
┌─────────────────────────────────────────────────────────────────┐
│              CONDITION 4 EXECUTION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

Previous Shot Output (already generated):
└── endFrameUrl: "https://..." ← This becomes our Image

Agent 5.1 Output:
├── image: null (inherited)
└── video.text: "..."

                    ↓

Step 1: INHERIT IMAGE
┌─────────────────────────────────────────────────────────────────┐
│  inheritedImage = generatedOutputs[previousShot.id].endFrameUrl  │
│  ┌──────────────────┐                                            │
│  │  KEYFRAME IMAGE  │ = Previous shot's End Frame (INHERITED)    │
│  │   (INHERITED)    │                                            │
│  └──────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘

                    ↓

Step 2: GENERATE VIDEO
┌─────────────────────────────────────────────────────────────────┐
│  callVideoModel(videoPrompt, inheritedImage)                     │
│                    ↓                                             │
│  ┌──────────────────┐                                            │
│  │  GENERATED VIDEO │                                            │
│  └──────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘

                    ↓

Step 3: STORE
┌─────────────────────────────────────────────────────────────────┐
│  generatedOutputs[shot.id] = {                                   │
│    imageUrl: inheritedImage,  (inherited)                        │
│    videoUrl: "..."                                               │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---
---

## 3.10 Summary: Execution Matrix

| Step | Action | C1 | C2 | C3 | C4 |
|------|--------|:--:|:--:|:--:|:--:|
| 1 | Inherit from previous | — | — | Start | Image |
| 2 | Resolve tags → Gen Start | — | ✅ | — | — |
| 3 | Resolve tags (+ @StartFrame) | ✅ | ✅ | ✅ | — |
| 4 | Gen Image/End Frame | ✅ | ✅ | ✅ | — |
| 5 | Gen Video | ✅ | ✅ | ✅ | ✅ |
| 6 | Store outputs | ✅ | ✅ | ✅ | ✅ |

**Note:** "Resolve tags" means scanning the prompt for @ tags and building a labeled image attachment array. The @ tags stay in the prompt text as labels — they are NOT replaced with URLs.

---

## 3.11 Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `DependencyError` | @Shot_X references a shot not yet generated | Should not happen if Agent 4.1 followed rules |
| `InheritanceError` | Connected shot but previous shot has no output | Previous shot failed; retry or abort |
| `ImageModelError` | Image generation failed | Retry with exponential backoff |
| `VideoModelError` | Video generation failed | Retry with exponential backoff |
| `AssetNotFound` | @ tag references missing asset | Skip tag or use fallback |

---

## 3.12 Output: What Agent 5.2 Produces

For each shot, Agent 5.2 produces:

```json
{
  "shot_id": "S1.2",
  "condition": 2,
  "status": "completed",
  
  "generated": {
    "startFrameUrl": "https://generated.../s1-2-start.jpg",
    "endFrameUrl": "https://generated.../s1-2-end.jpg",
    "videoUrl": "https://generated.../s1-2-video.mp4"
  },
  
  "metadata": {
    "imageModel": "imagen-4",
    "videoModel": "kling-2.0",
    "executionTimeMs": 45000,
    "retries": 0
  }
}
```

---

## 3.13 Complete Pipeline Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE TAB 5 PIPELINE                       │
└─────────────────────────────────────────────────────────────────┘

For each shot in timeline:

┌─────────────────────────────────────────────────────────────────┐
│  AGENT 5.1 (AI — Vision + Text)                                  │
│  ├── Receives: Shot context + actual images                      │
│  ├── Analyzes: Product, logo, character, style, @Shot_X         │
│  ├── Writes: Prompts with @ tag placeholders                     │
│  └── Returns: JSON with prompts                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  AGENT 5.2 (Algorithmic)                                         │
│  ├── Receives: Prompts from 5.1 + asset registry                 │
│  ├── Detects: Condition (1, 2, 3, or 4)                         │
│  ├── Resolves: Inheritance (if connected)                        │
│  ├── Injects: @ tags → actual URLs                               │
│  ├── Calls: Image model, then video model                        │
│  └── Stores: Generated URLs for future shots                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  OUTPUT                                                          │
│  ├── Generated images (0, 1, or 2 per shot)                     │
│  ├── Generated video (1 per shot)                                │
│  └── Stored for inheritance and @Shot_X references              │
└─────────────────────────────────────────────────────────────────┘
```

---

# END OF TAB 5 DOCUMENTATION

