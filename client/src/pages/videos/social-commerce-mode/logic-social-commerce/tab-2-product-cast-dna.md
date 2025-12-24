# Tab 2: Product & Cast DNA Backend Logic

This document defines the backend agents responsible for processing Tab 2 (Identity & DNA) inputs. Three agents work together to establish the physical and identity foundations for the entire campaign.

---

# Agent 2.1: Product DNA Visionary

### Role
Analyzes the three uploaded product images to extract high-fidelity geometric metadata and material physics. It defines the **"Physical Soul"** of the product to prevent it from morphing or losing detail during complex camera movements.

### Type
AI Vision Model (GPT-4o Vision / Gemini 1.5 Pro)

---

## Context Input

| Field | Source | Description |
|-------|--------|-------------|
| `heroProfile` | Tab 2 Frontend | Primary product image (front/hero view) |
| `macroDetail` | Tab 2 Frontend | Close-up detail image |
| `materialReference` | Tab 2 Frontend | Material/texture reference image |
| `materialPreset` | Tab 2 Frontend | "metallic" / "translucent" / "soft-organic" / "matte-industrial" |
| `surfaceComplexity` | Tab 2 Frontend | 0-100 slider value |
| `refractionEnabled` | Tab 2 Frontend | Boolean |
| `heroFeature` | Tab 2 Frontend | e.g., "The brushed titanium bezel" |
| `originMetaphor` | Tab 2 Frontend | e.g., "A block of obsidian" |

---

## Processing Logic

The agent performs visual analysis to:

1. **Geometric Extraction**: Identifies shape landmarks, silhouette contours, and proportions
2. **Material Analysis**: Determines surface properties, reflectivity, and texture patterns
3. **Anchor Point Mapping**: Locates key visual landmarks for focus (logo, buttons, edges)
4. **Light Response Modeling**: Predicts how materials will react to different lighting conditions

---

## Output Structure

```json
{
  "geometry_profile": "Mathematical description of shape/silhouette landmarks (e.g., 'Rectangular body with 2.3:1 aspect ratio, chamfered edges at 15°, circular crown at 3 o'clock position')",
  
  "material_spec": "Technical prompt-layer for textures (e.g., 'Anisotropic brushed metal with linear grain direction, micro-scratches at 5% density, PBR roughness 0.3')",
  
  "hero_anchor_points": [
    "Logo position: center-top, 15% from edge",
    "Button: right side, 40% from top",
    "Bezel edge: continuous ring, high specular"
  ],
  
  "lighting_response": "Instruction on how materials react to light (e.g., 'Specular highlights at angles >45°, diffuse scatter on matte surfaces, caustic refraction through crystal')"
}
```

---

## Output Field Definitions

### `geometry_profile`
Precise mathematical description of the product's physical form. Used by downstream agents to maintain shape consistency.

### `material_spec`
Technical texture specifications that can be injected into image generation prompts. Ensures consistent material rendering across all shots.

### `hero_anchor_points`
List of visual landmarks that cameras should focus on. These become the `focus_anchor` targets in shot planning.

### `lighting_response`
Physics-based rules for how the product interacts with light. Ensures consistent reflections, shadows, and highlights.

---

# Agent 2.2: Cast & Character Curator

### Role
Acts as the **Lead Casting Director and VFX Identity Supervisor**. It bridges the gap between the campaign strategy and the human element, ensuring that the persona fits the brand world perfectly while maintaining a stable identity across all shots.

### Type
AI Multi-Modal Reasoning Agent

---

## Context Input

| Field | Source | Description |
|-------|--------|-------------|
| `strategic_directives` | Agent 1.1 Output | Visual/cultural laws |
| `targetAudience` | Tab 1 Frontend | Audience context |
| `optimized_image_instruction` | Agent 1.1 Output | Visual style "Bible" |
| `character_mode` | Tab 2 Frontend | "UPLOAD" (reference image) or "PROMPT" (AI description) |
| `characterReferenceUrl` | Tab 2 Frontend | Reference image URL (if UPLOAD mode) |
| `character_description` | Tab 2 Frontend | Text description of desired character |
| `characterMode` | Tab 2 Frontend | "hand-model" / "full-body" / "silhouette" |
| `includeHumanElement` | Tab 2 Frontend | Boolean toggle |

### Static System Prompt
> "Mission: Nike/Apple cinematic production standards. Create characters that feel authentic to the target demographic while maintaining VFX-friendly consistency."

---

## Processing Logic

The agent:

1. **Persona Generation**: Creates detailed physical specifications matching audience expectations
2. **Cultural Fit Analysis**: Ensures character resonates with target region/demographic
3. **Interaction Protocol**: Defines how character physically interacts with product
4. **Identity Locking**: Establishes technical strategies for maintaining consistency

---

## Output Structure

```json
{
  "character_profile": {
    "identity_id": "Unique Reference (e.g., 'AERO_RUNNER_V1')",
    "detailed_persona": "Physical specs: skin texture, eyes, bone structure, attire, age-range (e.g., 'Female, early 20s, warm olive skin with subtle freckling, dark almond eyes, athletic build, minimalist athleisure')",
    "cultural_fit": "Reasoning on how this person matches the Target Audience & Region (e.g., 'Represents aspirational Gen Z MENA youth: confident, modern, globally-aware')"
  },
  
  "interaction_protocol": {
    "product_engagement": "Technical rules (e.g., 'Maintain a 3-point finger grip on @Product edge, wrist angle 15° for elegance')",
    "motion_limitations": "Physics rules (e.g., 'No fast head-turns to avoid AI facial distortion, hand movements below 0.5m/s')"
  },
  
  "identity_locking": {
    "strategy": "IP_ADAPTER_STRICT | LORA_INJECT | SEED_CONSISTENCY",
    "vfx_anchor_tags": "Specific keywords to force consistency (e.g., 'same_face_v1, consistent_hands, identity_lock')"
  }
}
```

---

## Output Field Definitions

### `character_profile`
Complete character specification including physical details and cultural reasoning.

### `interaction_protocol`
Rules for how the character physically interacts with the product. Prevents unnatural poses and AI artifacts.

### `identity_locking`
Technical strategies for maintaining character consistency across shots:

| Strategy | Description |
|----------|-------------|
| `IP_ADAPTER_STRICT` | Use IP-Adapter with high fidelity weight |
| `LORA_INJECT` | Apply custom LoRA for face consistency |
| `SEED_CONSISTENCY` | Maintain same seed across generations |

---

# Agent 2.3: Brand Identity Guardian

### Role
Converts brand settings (logo integrity, depth, colors) into generation-ready parameters.

### Type
Non-AI (Algorithmic Logic)

---

## Context Input

| Field | Source | Description |
|-------|--------|-------------|
| `logoUrl` | Tab 2 Frontend | High-res logo image URL |
| `brandPrimaryColor` | Tab 2 Frontend | Hex color (e.g., "#FF6B35") |
| `brandSecondaryColor` | Tab 2 Frontend | Hex color (e.g., "#1A1A2E") |
| `logoIntegrity` | Tab 2 Frontend | Slider value 1-10 |
| `logoDepth` | Tab 2 Frontend | Slider value 1-5 (flat to embossed) |

---

## Processing Logic

Pure algorithmic conversion (no AI needed):

1. **Logo Integrity Conversion**: Slider 1-10 → semantic level (flexible/moderate/strict/exact)
2. **Logo Depth Conversion**: Slider 1-5 → depth descriptor (flat/subtle/moderate/embossed/extruded)
3. **Brand Colors Pass-Through**: Direct pass of hex values

---

## Output Structure

```json
{
  "logo_integrity": "flexible | moderate | strict | exact",
  "logo_depth": "flat | subtle | moderate | embossed | extruded",
  "brand_colors": {
    "primary": "#C0A060",
    "secondary": "#1A1A2E"
  }
}
```

---

## Output Field Definitions

### `logo_integrity`
Semantic level derived from `logoIntegrity` slider:

| Integrity Slider | Level | Effect |
|------------------|-------|--------|
| 1-3 | `flexible` | Logo can be stylized/abstracted |
| 4-6 | `moderate` | Logo maintains general shape |
| 7-9 | `strict` | Logo is strictly preserved |
| 10 | `exact` | Logo is pixel-perfect locked |

### `logo_depth`
Depth descriptor derived from `logoDepth` slider:

| Depth Slider | Level | Visual Effect |
|--------------|-------|---------------|
| 1 | `flat` | Logo appears printed on surface |
| 2 | `subtle` | Slight emboss/deboss |
| 3 | `moderate` | Clear 3D presence |
| 4 | `embossed` | Strong 3D embossed effect |
| 5 | `extruded` | Maximum 3D extrusion |

### `brand_colors`
Direct pass-through of brand primary and secondary colors for use in prompts.

---

# Downstream Usage

The combined output of Tab 2 agents is consumed by:

| Downstream Agent | Fields Used | Purpose |
|------------------|-------------|---------|
| Agent 3.0 (Creative Catalyst) | `geometry_profile`, `material_spec`, `heroFeature` | Creative spark inspiration |
| Agent 3.1 (World-Builder) | `brandPrimaryColor` | Environment color sync |
| Agent 3.3 (Harmonizer) | `geometry_profile`, `material_spec`, `character_profile` | Physics interactions |
| Agent 4.1 (Media Planner) | All fields | Shot identity references |
| Agent 5.1 (Prompt Architect) | `geometry_profile`, `material_spec`, `logo_integrity`, `logo_depth` | Technical prompts |
| Tab 5 (Media Planning) | `heroProfile`, `macroDetail`, `materialReference`, `logoUrl`, `characterReferenceUrl` | @ Tag asset injection |

---

# Complete Example

## Input (Tab 2 Frontend)
```json
{
  "heroProfile": "https://uploads/watch-hero.jpg",
  "macroDetail": "https://uploads/watch-macro.jpg",
  "materialReference": "https://uploads/watch-material.jpg",
  "materialPreset": "metallic",
  "surfaceComplexity": 75,
  "refractionEnabled": false,
  "heroFeature": "The brushed titanium bezel",
  "originMetaphor": "A block of obsidian",
  "logoUrl": "https://uploads/brand-logo.svg",
  "brandPrimaryColor": "#C0A060",
  "brandSecondaryColor": "#1A1A2E",
  "logoIntegrity": 8,
  "logoDepth": 4,
  "includeHumanElement": true,
  "characterMode": "hand-model",
  "character_description": "Elegant feminine hands with natural manicure"
}
```

## Output (Combined from all 3 agents)

### Agent 2.1 Output
```json
{
  "geometry_profile": "Circular watch face, 42mm diameter, 11mm thickness. Rectangular case with 1.8:1 aspect ratio. Crown at 3 o'clock, 4mm protrusion. Lugs at 20mm width, curved ergonomic profile.",
  "material_spec": "Anisotropic brushed titanium with radial grain on bezel, polished chamfers at 45°. Sapphire crystal with AR coating (0.5% reflectivity). PBR roughness: bezel 0.4, case 0.2, crystal 0.05.",
  "hero_anchor_points": [
    "Bezel edge: continuous ring, primary specular",
    "Crown: right side, interaction point",
    "Logo: dial center, 8mm height",
    "Crystal edge: refraction boundary"
  ],
  "lighting_response": "Titanium shows elongated specular highlights along grain direction. Crystal creates subtle caustics at angles >60°. Polished surfaces require controlled lighting to avoid blown highlights."
}
```

### Agent 2.2 Output
```json
{
  "character_profile": {
    "identity_id": "ELEGANT_HANDS_V1",
    "detailed_persona": "Female hands, age 25-35, warm ivory skin tone, slender fingers with natural oval nails, subtle rose undertone, no jewelry, professional manicure with nude polish",
    "cultural_fit": "Represents sophisticated luxury consumer: refined, understated elegance, appeals to premium market across cultures"
  },
  "interaction_protocol": {
    "product_engagement": "Three-finger grip on case side, thumb resting on crown. Wrist angle 20° for elegance. Fingers should frame but not obscure dial.",
    "motion_limitations": "Hand movements below 0.3m/s to maintain sharpness. No finger spreading (causes AI distortion). Maintain consistent hand orientation across shots."
  },
  "identity_locking": {
    "strategy": "IP_ADAPTER_STRICT",
    "vfx_anchor_tags": "same_hands_v1, consistent_skin_tone, nail_style_lock"
  }
}
```

### Agent 2.3 Output
```json
{
  "logo_integrity": "strict",
  "logo_depth": "embossed",
  "brand_colors": {
    "primary": "#C0A060",
    "secondary": "#1A1A2E"
  }
}
```

