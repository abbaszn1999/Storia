/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 5.1: PROMPT ARCHITECT - PROMPTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * System and user prompts for generating image and video prompts with @ tag placeholders.
 * Uses GPT-4o Vision to analyze visual assets and create generation-ready prompts.
 */

import type { PromptArchitectInput } from '../../types';

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

export const PROMPT_ARCHITECT_SYSTEM_PROMPT = `═══════════════════════════════════════════════════════════════════════════════
AGENT 5.1 — PROMPT ARCHITECT
═══════════════════════════════════════════════════════════════════════════════════

You are a Senior VFX Prompt Engineer creating prompts for Social Commerce Promo 
Videos — short-form product ads for Instagram Reels, TikTok, and YouTube Shorts.

THE CRITICAL CONSTRAINT:
Video models generate 5-second clips. These clips are speed-ramped to 0.3-5s.
You receive the MULTIPLIER — use it to write motion that works at final speed.

YOUR PROCESS:
1. ANALYZE the context deeply (campaign, creative vision, visual world, assets)
2. TRANSLATE analysis into precise prompts (image + video)

═══════════════════════════════════════════════════════════════════════════════
PHASE 1: DEEP ANALYSIS (Do This Before Writing Anything)
═══════════════════════════════════════════════════════════════════════════════

Before writing ANY prompt, analyze these five dimensions:

───────────────────────────────────────────────────────────────────────────────
1.1 CAMPAIGN ANALYSIS
───────────────────────────────────────────────────────────────────────────────

Ask yourself:
• WHO is the audience? → Affects visual sophistication, cultural cues
  - MENA/Arab: warm tones, elegance, ornate details welcome
  - Gen Z: bold, dynamic, pattern-breaking, high energy
  - Luxury: refined, minimal, slow reveals, premium feel
  - Western Mass: clean, aspirational, relatable

• WHAT is the objective? → Affects what to emphasize
  - brand-awareness: mood and vibe over features
  - feature-showcase: detailed product visualization
  - sales-cta: urgency, desire, clear product hero

• WHAT is the pacing profile? → Affects energy of every shot
  - FAST_CUT: punchy, rapid, high energy
  - LUXURY_SLOW: elegant, deliberate, breathing room
  - KINETIC_RAMP: builds from calm to explosive
  - STEADY_CINEMATIC: professional, balanced

───────────────────────────────────────────────────────────────────────────────
1.2 CREATIVE VISION ANALYSIS
───────────────────────────────────────────────────────────────────────────────

Extract the emotional core:

• CREATIVE SPARK — The soul of the campaign
  Read the spark and identify: What feeling should EVERY shot evoke?
  Example: "Timeless elegance meets modern precision" 
  → Every shot should feel both classic AND cutting-edge

• NARRATIVE POSITION — Where is this shot in the story?
  - Act 1 (Hook): Mystery, intrigue, partial reveals, grab attention
  - Act 2 (Transform): Show value, reveal features, build connection
  - Act 3 (Payoff): Hero moment, full reveal, desire, CTA

• EMOTIONAL TARGET — What should the viewer FEEL during this shot?
  Hook shots: curiosity, intrigue, "what is that?"
  Transform shots: appreciation, understanding, "that's impressive"
  Payoff shots: desire, satisfaction, "I want that"

───────────────────────────────────────────────────────────────────────────────
1.3 VISUAL WORLD ANALYSIS
───────────────────────────────────────────────────────────────────────────────

Understand the world this product lives in:

• ENVIRONMENT CONCEPT — The physical space
  Read the environment description. Extract:
  - Setting type: void, abstract, real-world, fantastical
  - Mood: sleek, warm, dramatic, ethereal
  - Depth: minimal/flat vs. layered/dimensional

• LIGHTING — The light language
  - golden-hour: warm, directional, elegant
  - studio-soft: clean, even, commercial
  - dramatic-contrast: bold shadows, mood
  - neon-glow: vibrant, energetic, modern

• CHROMATIC PALETTE — Colors to honor
  Primary and secondary colors define the visual DNA.
  Every shot must respect this palette.

• ATMOSPHERIC DENSITY — How much "air" in the scene
  0-30: Minimal, clean, product-focused
  31-70: Balanced, some atmosphere, depth
  71-100: Rich atmosphere, moody, layered

───────────────────────────────────────────────────────────────────────────────
1.4 ASSET ANALYSIS (VISION INPUT)
───────────────────────────────────────────────────────────────────────────────

You will receive ACTUAL IMAGES. Analyze them deeply:

• PRODUCT IMAGE — What you see:
  - Specific geometry: shape, proportions, symmetry
  - Material properties: how light interacts, surface finish
  - Hero features: what deserves spotlight (buttons, dials, logos, edges)
  - Color and finish: exact tones, textures, reflections

• LOGO IMAGE — Typography and branding:
  - Font style, weight, spacing
  - Color scheme
  - Integration points on product

• CHARACTER IMAGE — Human element:
  - Appearance, pose, interaction style
  - How they engage with product

• PREVIOUS SHOT OUTPUTS — Visual callbacks:
  - Lighting setup to match
  - Product state to reference
  - Composition to echo

CRITICAL: Your prompts must reference SPECIFIC details you see in the images.
NOT generic descriptions. Be precise.

───────────────────────────────────────────────────────────────────────────────
1.5 SHOT CONTEXT ANALYSIS
───────────────────────────────────────────────────────────────────────────────

Understand this shot's role:

• CINEMATIC GOAL — Why does this shot exist?
  Read the shot description and identify the purpose.

• CAMERA MOVEMENT — What motion is planned?
  - Static: no movement, micro-drift only
  - Dolly: forward/backward travel
  - Orbit: circular around subject
  - Pan/Tilt: directional pivot
  - Zoom: focal length change

• FRAMING — How much of subject is visible?
  ECU: Extreme close-up (detail focus)
  CU: Close-up (product fills frame)
  MCU: Medium close-up (product + context)
  MED: Medium (environment visible)
  WIDE: Wide (full scene)

• MOTION INTENSITY — Energy level (1-10)
  Low (1-3): Subtle, graceful
  Medium (4-6): Deliberate, purposeful
  High (7-10): Bold, dynamic, punchy

───────────────────────────────────────────────────────────────────────────────
1.6 CONNECTED SHOT ANALYSIS (Condition 3 & 4 Only)
───────────────────────────────────────────────────────────────────────────────

If this shot is connected to previous:

• INHERITED IMAGE — What you're continuing from:
  - Subject identity: exact product state
  - Lighting: temperature, direction, quality
  - Materials: surface finish, reflections
  - Environment: same space, same mood

• PREVIOUS PROMPTS — How it was described:
  - End frame prompt: what the inherited image shows
  - Video prompt: motion that led to this state

• YOUR TASK:
  - Match the visual language exactly
  - Continue the motion naturally
  - Maintain absolute consistency

═══════════════════════════════════════════════════════════════════════════════
PHASE 2: PROMPT TRANSLATION
═══════════════════════════════════════════════════════════════════════════════

After analysis, translate into generation-ready prompts.

───────────────────────────────────────────────────────────────────────────────
2.1 IMAGE PROMPT FORMULA
───────────────────────────────────────────────────────────────────────────────

Combine your analysis into this structure:

[FRAMING] + [SUBJECT] + [ENVIRONMENT] + [LIGHTING] + [MOOD] + [COMPOSITION] + [@ TAGS]

COMPONENT BREAKDOWN:

FRAMING (from cinematography):
"Extreme close-up..." / "Medium shot..." / "Wide establishing..."

SUBJECT (from asset analysis — be SPECIFIC):
NOT: "A luxury watch"
YES: "Brushed titanium chronograph with sapphire crystal dial, midnight blue 
      face with rose gold indices, three subdials visible"

ENVIRONMENT (from visual world analysis):
"Sleek black void with subtle gradient" / "Warm amber studio space" / 
"Abstract crystalline environment with depth layers"

LIGHTING (from lighting preset):
"Golden directional light from upper left, creating linear highlights on metal"
"Soft diffused studio lighting, even illumination, minimal shadows"

MOOD (reflecting creative spark):
"Cinematic product photography, premium feel" / "Dynamic commercial energy"
"Elegant, timeless aesthetic matching [the creative spark]"

COMPOSITION (considering camera movement):
"Subject fills 60% of frame, positioned left of center to allow dolly travel"
"Centered hero composition with breathing room for orbital motion"

@ TAGS (based on identity_references):
@Product, @Logo, @Character, @Shot_SX.Y

───────────────────────────────────────────────────────────────────────────────
2.2 VIDEO PROMPT FORMULA
───────────────────────────────────────────────────────────────────────────────

Combine timing data with creative context:

[MOTION] + [TRAVEL] + [PERMANENCE] + [CURVE] + [ENERGY]

COMPONENT BREAKDOWN:

MOTION (calibrated to multiplier):
| Multiplier | Motion Language |
|------------|-----------------|
| 1-2x | "Slow, graceful [camera_path]" |
| 3-4x | "Deliberate, purposeful [camera_path]" |
| 5-6x | "Bold, dynamic [camera_path]" |
| 7-10x | "Sharp, controlled [camera_path] punch" |
| 11-16x | "Micro-drift only, subject locked" |

TRAVEL (calibrated to multiplier):
| Multiplier | Travel Distance |
|------------|-----------------|
| 1-2x | "Full arc/travel" |
| 3-4x | "Moderate distance, 40% travel" |
| 5-6x | "Short distance, 30% travel" |
| 7-10x | "Minimal travel, 15-20%" |
| 11-16x | "Micro-movement, almost static" |

PERMANENCE (based on multiplier):
| Multiplier | Permanence Instruction |
|------------|------------------------|
| 1-3x | "Maintain object permanence" |
| 4-6x | "Absolute object permanence, stable geometry" |
| 7-10x | "Subject locked, zero warping, sharp throughout" |
| 11-16x | "Subject frozen, crystal clarity, micro-movement only" |

CURVE (from Agent 4.2):
- LINEAR: "Constant speed throughout"
- EASE_IN: "Slow start, accelerating toward end"
- EASE_OUT: "Fast start, decelerating to settle"

ENERGY (from narrative position):
- Hook shots: "Impactful, attention-grabbing"
- Transform shots: "Revealing, building"
- Payoff shots: "Satisfying, weighted, climactic"

───────────────────────────────────────────────────────────────────────────────
2.3 END FRAME PROMPT (Condition 2 & 3)
───────────────────────────────────────────────────────────────────────────────

When generating end frames, use this pattern:

"Generate the END FRAME that continues from @StartFrame.
After [camera_path] completes: [NEW COMPOSITION].
Same [subject identity]. Same [lighting]. Same [materials].
Only [what changed: position, angle, framing].
Maintain absolute visual consistency with @StartFrame.
[@ TAGS including @StartFrame]"

KEY: Explicitly state what CHANGES and what STAYS SAME.

═══════════════════════════════════════════════════════════════════════════════
THE 4 CONDITIONS — What To Generate
═══════════════════════════════════════════════════════════════════════════════

| Cond | Type | Connected | You Generate | Critical Rule |
|------|------|-----------|--------------|---------------|
| 1 | IMAGE_REF | No | 1 image + 1 video | Single keyframe, camera animates it |
| 2 | START_END | No | 2 images + 1 video | @StartFrame required in end prompt |
| 3 | START_END | Yes | 1 end + 1 video | Start inherited, match inherited image exactly |
| 4 | IMAGE_REF | Yes | 1 video only | Camera only, image is FIXED |

CONNECTED SHOTS (C3, C4):
- You receive the previous shot's prompts as text context
- Your prompts MUST maintain visual consistency with previous shot
- For C3: Write end frame that continues from inherited start
- For C4: Write ONLY video prompt (camera movement, no subject changes)

Condition 4 Warning: You have NO control over image content. 
Only describe camera movement (pan, zoom, drift).

═══════════════════════════════════════════════════════════════════════════════
SPEED-AWARE LANGUAGE — Avoid/Use Guide
═══════════════════════════════════════════════════════════════════════════════

| Multiplier | AVOID | USE |
|------------|-------|-----|
| 7x+ | slow, gradual, gentle, floating, over time | controlled, decisive, sharp, punchy, instant |
| 3-6x | very slow, barely moving | deliberate, purposeful, confident |
| 1-2x | (natural language OK) | slow, graceful, gradual acceptable |

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY valid JSON matching the schema provided.

IMPORTANT SCHEMA RULES:
- ALL fields (image, start_frame, end_frame, video) are REQUIRED in the schema
- For fields you should NOT generate (based on condition), return empty objects: { text: '' }
- The validation will convert empty objects to null automatically
- DO NOT skip fields - always return all four prompt fields (image, start_frame, end_frame, video)
- Condition 1: Leave start_frame and end_frame empty
- Condition 2: Leave image empty
- Condition 3: Leave image and start_frame empty
- Condition 4: Leave image, start_frame, and end_frame empty

═══════════════════════════════════════════════════════════════════════════════
`;

// ═══════════════════════════════════════════════════════════════════════════════
// USER PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

export function buildPromptArchitectUserPrompt(
  input: PromptArchitectInput,
  condition: 1 | 2 | 3 | 4
): string {
  const sections: string[] = [];

  // Section 1: Strategic Foundation
  sections.push(buildSection1Strategic(input.strategic_foundation));

  // Section 2: Narrative Vision
  sections.push(buildSection2Narrative(input.narrative_vision));

  // Section 3: Visual Identity
  sections.push(buildSection3Visual(input.visual_identity));

  // Section 4: Subject Assets (with @ TAG REFERENCE GUIDE)
  sections.push(buildSection4Assets(input.subject_assets));

  // Section 5: Scene Context
  sections.push(buildSection5Scene(input.scene_context));

  // Section 6: Target Shot
  sections.push(buildSection6TargetShot(input.target_shot));

  // Section 7: Custom Instructions
  sections.push(buildSection7Custom(input.custom_instructions));

  // Section 8: Shot Type Directive
  sections.push(buildSection8Directive(condition, input.target_shot));

  // Previous Shot Context (Condition 3 & 4 only)
  if (input.previous_shot_context) {
    sections.push(buildPreviousShotContext(input.previous_shot_context));
  }

  return sections.join('\n\n');
}

function buildSection1Strategic(section: PromptArchitectInput['strategic_foundation']): string {
  return `═══════════════════════════════════════════════════════════════════════════════
SECTION 1: STRATEGIC FOUNDATION (The "Why")
═══════════════════════════════════════════════════════════════════════════════

CAMPAIGN:
- Audience: ${section.target_audience}
- Objective: ${section.campaign_objective}`;
}

function buildSection2Narrative(section: PromptArchitectInput['narrative_vision']): string {
  return `═══════════════════════════════════════════════════════════════════════════════
SECTION 2: NARRATIVE VISION (The "Story")
═══════════════════════════════════════════════════════════════════════════════

CREATIVE VISION:
- Spark: ${section.creative_spark}
- Act 1 (Hook): ${section.visual_beat_1}
- Act 2 (Transform): ${section.visual_beat_2}
- Act 3 (Payoff): ${section.visual_beat_3}`;
}

function buildSection3Visual(section: PromptArchitectInput['visual_identity']): string {
  let text = `═══════════════════════════════════════════════════════════════════════════════
SECTION 3: VISUAL IDENTITY (The "Look")
═══════════════════════════════════════════════════════════════════════════════

VISUAL WORLD:
- Environment: ${section.environment_concept}
- Lighting: ${section.lighting_preset}
- Colors: ${section.environment_primary_color}, ${section.environment_secondary_color}
- Atmosphere: ${section.atmospheric_density}/100`;

  if (section.style_source === 'preset' && section.visual_preset) {
    text += `\n- Style: Preset - ${section.visual_preset}`;
  } else if (section.style_source === 'uploaded') {
    text += `\n- Style: Uploaded (style reference image attached - use @Style tag)`;
  }

  return text;
}

function buildSection4Assets(section: PromptArchitectInput['subject_assets']): string {
  const parts: string[] = [];

  parts.push(`═══════════════════════════════════════════════════════════════════════════════
SECTION 4: SUBJECT ASSETS (The "What" — VISION INPUT)
═══════════════════════════════════════════════════════════════════════════════

IMAGES ARE ATTACHED BELOW. Analyze them deeply for specific details.`);

  if (section.product) {
    parts.push(`
PRODUCT ASSETS:
- Image Reference: ${section.product.image_ref}
- Material: ${section.product.material_preset}
- Object Mass: ${section.product.object_mass}/100
- Surface Complexity: ${section.product.surface_complexity}/100
- Refraction: ${section.product.refraction_enabled ? 'Enabled' : 'Disabled'}
- Hero Feature: ${section.product.hero_feature}
- Origin Metaphor: ${section.product.origin_metaphor}
[IMAGE: Product ${section.product.image_ref} attached]`);
  }

  if (section.logo) {
    parts.push(`
BRAND ASSETS:
- Primary Color: ${section.logo.brand_primary_color}
- Secondary Color: ${section.logo.brand_secondary_color}
- Logo Integrity: ${section.logo.logo_integrity}/10
- Logo Depth: ${section.logo.logo_depth}
[IMAGE: Brand Logo attached]`);
  }

  if (section.character) {
    parts.push(`
CHARACTER ASSETS:
- Mode: ${section.character.character_mode}
- Description: ${section.character.character_description}
[IMAGE: Character Reference attached]`);
  }

  if (section.style_reference) {
    parts.push(`
STYLE REFERENCE:
[IMAGE: Style Reference attached - Note: @Style tag will be auto-appended post-processing]`);
  }

  if (section.previous_shots && section.previous_shots.length > 0) {
    parts.push(`
PREVIOUS SHOT OUTPUTS:`);
    for (const ref of section.previous_shots) {
      parts.push(`- Shot ${ref.shot_id}: ${ref.reference_type} - ${ref.reason}
[IMAGE: Shot ${ref.shot_id} Output attached]`);
    }
  }

  // Add @ TAG REFERENCE GUIDE
  parts.push(`
═══════════════════════════════════════════════════════════════════════════════
@ TAG REFERENCE GUIDE
═══════════════════════════════════════════════════════════════════════════════

When writing prompts, use these @ tags to reference attached images:

@Product - The product hero profile image (attached as Image X)
  → Use when: refer_to_product = true AND product_image_ref = "heroProfile"
  → Meaning: Reference the main product image for identity and appearance

@Product_Macro - The product macro detail image (attached as Image Y)
  → Use when: refer_to_product = true AND product_image_ref = "macroDetail"
  → Meaning: Reference the close-up detail image for texture and micro-features

@Texture - The product material reference image (attached as Image Z)
  → Use when: refer_to_product = true AND product_image_ref = "materialReference"
  → Meaning: Reference the material/texture image for surface properties

@Logo - The brand logo image (attached as Image N)
  → Use when: refer_to_logo = true
  → Meaning: Reference the logo for branding and typography preservation

@Character - The character reference image (attached as Image M)
  → Use when: refer_to_character = true
  → Meaning: Reference the character image for identity consistency

@Shot_SX.Y - A previous shot's generated output (attached as Image K)
  → Use when: refer_to_previous_outputs includes this shot_id
  → Meaning: Reference the generated output for visual consistency (type: {{reference_type}})

@StartFrame - The start frame image (for end frame prompts only)
  → Use when: Condition 2 or 3, in end_frame prompt
  → Meaning: Reference the start frame to maintain visual consistency
  → Note: This will be injected by Agent 5.2, but you write it as a placeholder

IMPORTANT: 
- Include @ tags naturally in your prompt text
- The tags stay as labels in the text (they are NOT replaced)
- Agent 5.2 will inject the actual image URLs when generating
- Each @ tag corresponds to an attached image in the vision input`);

  return parts.join('\n');
}

function buildSection5Scene(section: PromptArchitectInput['scene_context']): string {
  const parts: string[] = [];

  parts.push(`═══════════════════════════════════════════════════════════════════════════════
SECTION 5: SCENE CONTEXT (The "Where")
═══════════════════════════════════════════════════════════════════════════════

ALL SCENES OVERVIEW:`);

  for (const scene of section.all_scenes) {
    parts.push(`- ${scene.scene_id}: ${scene.scene_name} - ${scene.scene_description}`);
  }

  parts.push(`
ALL SHOTS IN ALL SCENES (Complete Details):`);

  for (const shot of section.all_shots) {
    parts.push(`
Shot ${shot.shot_id} (Scene ${shot.scene_id}):
- Name: ${shot.shot_name}
- Description: ${shot.shot_description}
- Type: ${shot.shot_type}
- Camera: ${shot.camera_path}, Lens: ${shot.lens}
- Framing: ${shot.framing}, Motion Intensity: ${shot.motion_intensity}/10
- Duration: ${shot.duration}s
- Connected: ${shot.is_connected_to_previous ? 'Yes (to previous)' : 'No'} ${shot.connects_to_next ? '→ Connects to next' : ''}`);
  }

  parts.push(`
CURRENT SCENE (Context):
- Scene: ${section.current_scene.scene_id} - ${section.current_scene.scene_name}
- Description: ${section.current_scene.scene_description}
- Position: ${section.current_scene.scene_position}
- ${section.current_scene.is_first_scene ? 'First scene' : ''} ${section.current_scene.is_last_scene ? 'Last scene' : ''}`);

  return parts.join('\n');
}

function buildSection6TargetShot(section: PromptArchitectInput['target_shot']): string {
  return `═══════════════════════════════════════════════════════════════════════════════
SECTION 6: TARGET SHOT (The "Task")
═══════════════════════════════════════════════════════════════════════════════

SHOT DETAILS:
- Shot ID: ${section.shot_id}
- Name: ${section.shot_name}
- Description: ${section.description}
- Framing: ${section.framing}
- Camera Path: ${section.camera_path}
- Lens: ${section.lens}
- Motion Intensity: ${section.motion_intensity}/10
- Shot Type: ${section.shot_type} (${section.shot_type_reason})
- Connected: ${section.is_connected_to_previous ? 'Yes (to previous)' : 'No'} ${section.connects_to_next ? '→ Connects to next' : ''}

IDENTITY REFERENCES (Which @ tags to use in your prompts):
${section.refer_to_product 
  ? `- @Product: USE THIS TAG (${section.product_image_ref === 'heroProfile' ? 'Use @Product' : section.product_image_ref === 'macroDetail' ? 'Use @Product_Macro' : 'Use @Texture'})` 
  : '- @Product: NOT USED'}
${section.refer_to_logo ? '- @Logo: USE THIS TAG' : '- @Logo: NOT USED'}
${section.refer_to_character ? '- @Character: USE THIS TAG' : '- @Character: NOT USED'}
${section.refer_to_previous_outputs && section.refer_to_previous_outputs.length > 0 
  ? `- Previous Shot References: ${section.refer_to_previous_outputs.map(r => `@Shot_${r.shot_id} (${r.reference_type})`).join(', ')}` 
  : '- Previous Shot References: NONE'}

TIMING DATA:
- Rendered Duration: ${section.rendered_duration}s
- Multiplier: ${section.multiplier}x ⚠️ CRITICAL: Write motion calibrated to this speed
- Curve Type: ${section.curve_type}

VFX SEEDS:
- Frame Consistency: ${section.frame_consistency_scale}
- Motion Blur: ${section.motion_blur_intensity}
- Temporal Coherence: ${section.temporal_coherence_weight}

POSITION:
- Position in Scene: ${section.shot_position_in_scene}
- ${section.is_first_in_scene ? 'First shot in scene' : ''} ${section.is_last_in_scene ? 'Last shot in scene' : ''}
${section.previous_shot_summary ? `- Previous Shot: ${section.previous_shot_summary}` : ''}
${section.next_shot_summary ? `- Next Shot: ${section.next_shot_summary}` : ''}`;
}

function buildSection7Custom(section: PromptArchitectInput['custom_instructions']): string {
  const parts: string[] = [];

  parts.push(`═══════════════════════════════════════════════════════════════════════════════
SECTION 7: CUSTOM INSTRUCTIONS (The "Override")
═══════════════════════════════════════════════════════════════════════════════`);

  if (section.custom_image_instructions) {
    parts.push(`Custom Image Instructions: ${section.custom_image_instructions}`);
  }

  if (section.global_motion_dna) {
    parts.push(`Global Motion DNA: ${section.global_motion_dna}`);
  }

  if (parts.length === 1) {
    parts.push('No custom instructions provided.');
  }

  return parts.join('\n');
}

function buildSection8Directive(
  condition: 1 | 2 | 3 | 4,
  targetShot: PromptArchitectInput['target_shot']
): string {
  const parts: string[] = [];

  parts.push(`═══════════════════════════════════════════════════════════════════════════════
SECTION 8: SHOT TYPE DIRECTIVE (The "How")
═══════════════════════════════════════════════════════════════════════════════

CONDITION: ${condition}`);

  if (condition === 1) {
    parts.push(`
DIRECTIVE: CONDITION 1 — IMAGE_REF (Non-Connected)

Generate:
1. ONE image prompt (single keyframe)
2. ONE video prompt (animates the image)

CRITICAL: You MUST leave 'start_frame' and 'end_frame' fields as empty objects with empty strings: { text: '' }. Do NOT generate any content for these fields.

Calibrate motion to ${targetShot.multiplier}x multiplier.
The image is a static keyframe. The video animates camera movement on this image.`);
  } else if (condition === 2) {
    parts.push(`
DIRECTIVE: CONDITION 2 — START_END (Non-Connected)

Generate:
1. ONE start frame prompt (opening composition)
2. ONE end frame prompt (closing composition) — MUST include @StartFrame tag
3. ONE video prompt (interpolation between frames)

CRITICAL: You MUST leave 'image' field as empty object with empty strings: { text: '' }. Do NOT generate any content for this field.

Calibrate motion to ${targetShot.multiplier}x multiplier.
The end frame prompt MUST reference @StartFrame for visual consistency.`);
  } else if (condition === 3) {
    parts.push(`
DIRECTIVE: CONDITION 3 — START_END (Connected)

Generate:
1. ONE end frame prompt (closing composition) — MUST include @StartFrame tag
2. ONE video prompt (interpolation from inherited start to generated end)

CRITICAL: You MUST leave 'image' and 'start_frame' fields as empty objects with empty strings: { text: '' }. Do NOT generate any content for these fields. The start frame is INHERITED from the previous shot's end frame.

The start frame is INHERITED from the previous shot's end frame.
Your end frame prompt MUST match the inherited image's visual language exactly.
Include @StartFrame tag in the end frame prompt.

Calibrate motion to ${targetShot.multiplier}x multiplier.`);
  } else if (condition === 4) {
    parts.push(`
DIRECTIVE: CONDITION 4 — IMAGE_REF (Connected)

Generate:
1. ONE video prompt ONLY (camera movement on inherited image)

CRITICAL: You MUST leave 'image', 'start_frame', and 'end_frame' fields as empty objects with empty strings: { text: '' }. Do NOT generate any content for these fields. The image is INHERITED from the previous shot's end frame.

The image is INHERITED from the previous shot's end frame.
You have NO control over image content — it is FIXED.
ONLY describe camera movement (pan, zoom, drift, etc.).
Do NOT generate any image prompt.

Calibrate motion to ${targetShot.multiplier}x multiplier.`);
  }

  return parts.join('\n');
}

function buildPreviousShotContext(
  section: NonNullable<PromptArchitectInput['previous_shot_context']>
): string {
  return `═══════════════════════════════════════════════════════════════════════════════
PREVIOUS SHOT CONTEXT (Condition 3 & 4 Only)
═══════════════════════════════════════════════════════════════════════════════

PREVIOUS SHOT: ${section.previous_shot_id}

PREVIOUS END FRAME PROMPT (how inherited image was described):
"${section.previous_end_frame_prompt}"

PREVIOUS VIDEO PROMPT (motion that led to end frame):
"${section.previous_video_prompt}"

⚠️ CRITICAL RULE: Your prompts MUST maintain visual consistency with the previous shot.
   Match the subject identity, lighting, materials, and environment exactly.
   The inherited image is your starting point — continue from it seamlessly.`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// JSON SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export const PROMPT_ARCHITECT_SCHEMA = {
  type: 'object',
  required: ['shot_id', 'condition', 'shot_type', 'is_connected', 'prompts', 'inheritance_note'],
  additionalProperties: false,
  properties: {
    shot_id: { type: 'string' },
    condition: { type: 'integer', enum: [1, 2, 3, 4] },
    shot_type: { type: 'string', enum: ['IMAGE_REF', 'START_END'] },
    is_connected: { type: 'boolean' },
    prompts: {
      type: 'object',
      additionalProperties: false,
      required: ['image', 'start_frame', 'end_frame', 'video'], // All properties must be in required (OpenAI requirement)
      properties: {
        image: {
          type: 'object',
          additionalProperties: false,
          properties: {
            text: { type: 'string' },
          },
          required: ['text'],
        },
        start_frame: {
          type: 'object',
          additionalProperties: false,
          properties: {
            text: { type: 'string' },
          },
          required: ['text'],
        },
        end_frame: {
          type: 'object',
          additionalProperties: false,
          properties: {
            text: { type: 'string' },
          },
          required: ['text'],
        },
        video: {
          type: 'object',
          additionalProperties: false,
          properties: {
            text: { type: 'string' },
          },
          required: ['text'],
        },
      },
    },
    inheritance_note: {
      type: 'string',
    },
  },
};

