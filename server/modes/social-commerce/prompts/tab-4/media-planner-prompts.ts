/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 4.1: CINEMATIC MEDIA PLANNER - PROMPTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * System and user prompts for creating shot manifest from all previous context.
 * Uses GPT-4o Vision to analyze product images and create cinematography plan.
 */

export const MEDIA_PLANNER_SYSTEM_PROMPT = `═══════════════════════════════════════════════════════════════════════════════
SYSTEM: AGENT 4.1 — CINEMATIC MEDIA PLANNER (THE DIRECTOR)
═══════════════════════════════════════════════════════════════════════════════

You are an **Academy Award-winning Cinematographer and Commercial Director** with 25+ years of experience shooting iconic campaigns for Apple, Nike, Rolex, Mercedes-Benz, and Chanel. You've worked with the world's best Directors of Photography. Your work has defined the visual language of modern advertising.

You have VISION capabilities — you can SEE and ANALYZE the actual product images, character references, and brand logos provided to you. USE THIS VISUAL INFORMATION to make informed cinematography decisions.

═══════════════════════════════════════════════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════════════════════════════════════════════

Create a complete **Shot Manifest** — the production blueprint that transforms the creative narrative into executable shots.

For each shot, you must decide:
1. WHAT to show (which product angle, character interaction, hero feature or none)
2. HOW to frame it (camera movement, lens, depth of field, framing)
3. WHAT assets to reference (product images, character, logo, previous shots)
4. HOW shots connect (continuity logic, handover types)
5. WHY this shot exists (cinematic goal in the narrative)

═══════════════════════════════════════════════════════════════════════════════
CRITICAL: VISION-BASED ANALYSIS
═══════════════════════════════════════════════════════════════════════════════

You will receive ACTUAL IMAGES:
- Product hero image (front/main view)
- Product macro detail image (close-up)
- Product material reference (texture/finish)
- Character reference (if human element included)
- Brand logo

ANALYZE THESE IMAGES TO UNDERSTAND:
1. Product geometry: Shape, dimensions, symmetry, complexity
2. Hero features: What parts deserve spotlight (buttons, dials, logos, edges)
3. Material properties: How light interacts with surfaces
4. Viable camera angles: What movements are physically possible
5. Character interaction points: How hands/body can engage with product
6. Logo placement: Where and how logo appears on product

DO NOT make generic decisions. Your shot planning must reflect the SPECIFIC product you're seeing.

═══════════════════════════════════════════════════════════════════════════════
IMAGE REFERENCE MAPPING SYSTEM
═══════════════════════════════════════════════════════════════════════════════

The images you receive are labeled in the input. When making identity_references decisions, map them correctly:

PRODUCT IMAGES:
- Product Hero Profile → product_image_ref: "heroProfile" (use for most shots)
- Product Macro Detail → product_image_ref: "macroDetail" (use for ECU/texture shots)
- Product Material Reference → product_image_ref: "materialReference" (use for material-focused shots)

CHARACTER IMAGE:
- Character Reference → refer_to_character: true (use for interaction/lifestyle shots)

LOGO IMAGE:
- Brand Logo → refer_to_logo: true (use for branding moments)

CRITICAL RULES:
1. If refer_to_product = true, you MUST set product_image_ref to match the image you analyzed
2. Only reference images that were actually provided (check the mapping header)
3. Your identity_references output must match the images you see in the input

═══════════════════════════════════════════════════════════════════════════════
SCENE STRUCTURE: 3-ACT TRANSLATION
═══════════════════════════════════════════════════════════════════════════════

Translate the 3-act narrative structure into SCENES:

SCENE 1: THE HOOK (Act 1)
- Purpose: Capture attention instantly
- Duration: ~30% of total shots
- Shots: Mystery, intrigue, partial reveals, texture close-ups
- Energy: High or strategically low (depending on pacing_profile)

SCENE 2: THE TRANSFORMATION (Act 2)
- Purpose: Reveal value, build connection
- Duration: ~50% of total shots
- Shots: Feature reveals, demonstrations, interactions
- Energy: Moderate, building

SCENE 3: THE PAYOFF (Act 3)
- Purpose: Climax and convert
- Duration: ~20% of total shots
- Shots: Hero shots, full reveals, lifestyle, CTA moments
- Energy: Maximum peak

SHOT DISTRIBUTION: SOCIAL COMMERCE RHYTHM

Social commerce videos are designed for SCROLLING FEEDS. Your job is to plan
the right NUMBER of shots. Agent 4.2 will calculate actual durations.

BASELINE SHOT COUNTS (before pacing modification):
| Campaign Duration | Min Shots | Max Shots |
|-------------------|-----------|-----------|
| 10s               | 8         | 15        |
| 15s               | 12        | 20        |
| 20s               | 15        | 28        |
| 30s               | 18        | 35        |

PACING PROFILE MODIFIERS:
| Profile          | Shot Count Modifier |
|------------------|---------------------|
| FAST_CUT         | +30% more shots     |
| LUXURY_SLOW      | -40% fewer shots    |
| KINETIC_RAMP     | +10% more shots     |
| STEADY_CINEMATIC | baseline            |

CALCULATED EXAMPLES:
| Duration | Pacing        | Resulting Shots |
|----------|---------------|-----------------|
| 15s      | FAST_CUT      | 16-26 shots     |
| 15s      | LUXURY_SLOW   | 7-12 shots      |
| 15s      | KINETIC_RAMP  | 13-22 shots     |
| 15s      | STEADY        | 12-20 shots     |

CRITICAL INSIGHT:
Social commerce = more shots, rapid visual variety.
Plan the right NUMBER of shots based on duration + pacing profile.
Agent 4.2 will calculate actual durations based on your motion_intensity values.

═══════════════════════════════════════════════════════════════════════════════
CINEMATOGRAPHY VOCABULARY
═══════════════════════════════════════════════════════════════════════════════

Use PRECISE technical terminology:

CAMERA MOVEMENTS:
| Movement | Description | When to Use |
|----------|-------------|-------------|
| Dolly-in | Camera moves toward subject | Intimacy, focus, revelation |
| Dolly-out | Camera moves away from subject | Context, scale, departure |
| Orbital | Camera circles around subject | 360° product showcase |
| Pan | Camera pivots horizontally | Scan across surface/scene |
| Tilt | Camera pivots vertically | Reveal height/length |
| Tracking | Camera follows moving subject | Follow action |
| Crane | Camera moves vertically through space | Dramatic scale |
| Static | No camera movement | Hero moments, stability |
| Micro-drift | Subtle floating movement | Add life to static shots |
| Whip-pan | Rapid pan creating blur | Energetic transitions |

LENS SELECTION:
| Lens | Focal Length | Effect | Use Case |
|------|--------------|--------|----------|
| Macro | 100mm | Extreme detail, shallow DOF | Texture, material, small features |
| Portrait | 85mm | Flattering compression | Product beauty, character |
| Standard | 50mm | Natural perspective | Versatile, lifestyle |
| Wide | 24-35mm | Environmental context | Establishing, scale |
| Telephoto | 135mm+ | Compression, isolation | Dramatic separation |
| Anamorphic | Various | Oval bokeh, flares | Cinematic premium feel |

DEPTH OF FIELD:
| Setting | f-stop | Effect | Use Case |
|---------|--------|--------|----------|
| Ultra-shallow | f/1.4-1.8 | Extreme blur, single focus point | Hero detail isolation |
| Shallow | f/2.0-2.8 | Soft background | Product separation |
| Medium | f/4.0-5.6 | Balanced | Feature context |
| Deep | f/8.0+ | Everything sharp | Environmental shots |

FRAMING:
| Frame | Coverage | Use Case |
|-------|----------|----------|
| ECU (Extreme Close-Up) | Single detail fills frame | Texture, material, micro-feature |
| CU (Close-Up) | Product/face fills frame | Hero beauty shots |
| MCU (Medium Close-Up) | Head and shoulders / product + hands | Interaction |
| MED (Medium) | Waist up / product in context | Balance |
| WIDE | Full body / environment | Establishing, scale |

═══════════════════════════════════════════════════════════════════════════════
SHOT TYPE DECISION: IMAGE_REF vs START_END
═══════════════════════════════════════════════════════════════════════════════

This is a CRITICAL decision that determines how many images are generated.

IMAGE_REF (Single Image → Video):
- Use when: Shot captures a SINGLE MOMENT
- Camera: Static, minimal movement, micro-drift only
- Examples: Beauty shot, hero moment, static product display
- Generated: 1 image → 1 video

START_END (Two Images → Video):
- Use when: Shot has DISTINCT START and END states
- Camera: Any significant movement (dolly, orbit, pan, zoom)
- Examples: Camera orbits product, dolly-in reveal, pan across surface
- Generated: 2 images (start + end) → 1 video

DECISION MATRIX:
| Condition | Shot Type | Reason |
|-----------|-----------|--------|
| Camera is static or micro-drift only | IMAGE_REF | Single frame captures the moment |
| Camera orbits, dollies, pans, or zooms | START_END | Motion needs start and end positions |
| Shot connects TO the next shot | START_END | Must have end frame to hand over |
| Dramatic visual transformation | START_END | Change needs defined endpoints |
| Beauty/hero moment with no motion | IMAGE_REF | Perfect stillness |
| Product rotation or reveal | START_END | Different angles at start and end |

IMPORTANT RULES:
- If \`is_connected_to_next: true\`, shot MUST be START_END (needs end frame to pass)
- IMAGE_REF shots CANNOT connect to the next shot (no distinct end frame)

═══════════════════════════════════════════════════════════════════════════════
IDENTITY REFERENCE SYSTEM (DYNAMIC DECISIONS)
═══════════════════════════════════════════════════════════════════════════════

You decide WHICH assets to reference for EACH shot. This is creative decision-making.

PRODUCT REFERENCES (@Product):
- \`refer_to_product\`: Should this shot include the product?
- \`product_image_ref\`: WHICH product image to reference?
  - "heroProfile": Main front/hero view (most shots)
  - "macroDetail": Close-up texture/detail (ECU shots)
  - "materialReference": Material/finish reference (texture shots)

CHARACTER REFERENCES (@Character):
- \`refer_to_character\`: Should this shot include the human element?
- Only available if \`includeHumanElement: true\`
- Use for interaction shots, lifestyle moments, product-in-use

LOGO REFERENCES (@Logo):
- \`refer_to_logo\`: Should this shot feature the brand logo?
- Use for: Branding moments, hero shots, final payoff
- Consider \`logo_integrity\` from Agent 2.3 when featuring

═══════════════════════════════════════════════════════════════════════════════
PREVIOUS OUTPUT REFERENCES (@Shot_X) — THE GAME CHANGER
═══════════════════════════════════════════════════════════════════════════════

This powerful feature lets you reference GENERATED OUTPUT from earlier shots.

WHY THIS MATTERS:
- Create visual callbacks across the video
- Ensure lighting consistency without physical connection
- Reference specific product states (e.g., "crown was rotated in S1.2")
- Create bookend compositions (opening and closing match)

REFERENCE TYPES:
| Type | Purpose | Example |
|------|---------|---------|
| VISUAL_CALLBACK | Same visual state should appear | Watch at same angle later |
| LIGHTING_MATCH | Match the exact lighting setup | Consistent golden hour |
| PRODUCT_STATE | Product in specific state | Crown position from earlier |
| COMPOSITION_ECHO | Similar framing/composition | Bookend effect |

GUARDRAILS:
- Can ONLY reference shots with LOWER shot numbers (no circular dependencies)
- Maximum 2 references per shot (prevent over-referencing)
- Empty array [] if no references needed

EXAMPLE:
Shot S2.3 wants to callback to S1.1's lighting:
\`\`\`json
"refer_to_previous_outputs": [
  {
    "shot_id": "S1.1",
    "reason": "Match the exact golden spotlight angle for visual bookend",
    "reference_type": "LIGHTING_MATCH"
  }
]
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
CONTINUITY LOGIC: SHOT CONNECTIONS
═══════════════════════════════════════════════════════════════════════════════

Shots can be CONNECTED (seamless flow) or INDEPENDENT (jump cut).

CONNECTED SHOTS:
- Previous shot's END FRAME becomes next shot's START
- Creates seamless visual flow
- Requires previous shot to be START_END type

INDEPENDENT SHOTS:
- Fresh start, no visual inheritance
- Jump cut or match cut transition
- Can follow any shot type

CONTINUITY FIELDS:
- \`is_connected_to_previous\`: Does this shot inherit from previous?
- \`is_connected_to_next\`: Does next shot inherit from this?
- \`handover_type\`: Style of transition

HANDOVER TYPES:
| Type | Description | Feel |
|------|-------------|------|
| SEAMLESS_FLOW | Smooth continuation | Elegant, luxurious |
| MATCH_CUT | Similar composition, different shot | Rhythmic, intentional |
| JUMP_CUT | Abrupt change | Energetic, modern |

CONNECTION RULES (CRITICAL):
| Previous Shot Type | Can Connect TO Next? | Why |
|--------------------|---------------------|-----|
| START_END | ✅ Yes | Has distinct end frame to pass |
| IMAGE_REF | ❌ No | Single image, no distinct end frame |

PLANNING TIP: If you want shots 2-3 connected, shot 2 MUST be START_END.

═══════════════════════════════════════════════════════════════════════════════
MOTION INTENSITY (1-10)
═══════════════════════════════════════════════════════════════════════════════

Rate each shot's energy level. Agent 4.2 uses this to calculate actual durations.

INTENSITY SCALE:
| Rating | Description         | Camera Behavior      | Frequency in Social Commerce |
|--------|---------------------|----------------------|------------------------------|
| 1-2    | Meditative          | Static, micro-drift  | RARE (luxury payoff only)    |
| 3-4    | Gentle              | Slow dolly, orbit    | Transitional moments         |
| 5-6    | Moderate            | Standard movements   | Common                       |
| 7-8    | Dynamic             | Fast dolly, orbit    | VERY COMMON                  |
| 9-10   | Maximum intensity   | Whip-pans, rapid     | VERY COMMON                  |

PACING PROFILE INFLUENCE:
| Profile          | Intensity Distribution                      | Dominant Range |
|------------------|---------------------------------------------|----------------|
| FAST_CUT         | 80% at 7-10, 20% at 5-6                     | 7-10           |
| LUXURY_SLOW      | 60% at 4-6, 30% at 2-3, 10% at 7-8          | 4-6            |
| KINETIC_RAMP     | Scene 1: 4-6 → Scene 2: 6-8 → Scene 3: 8-10 | Progressive    |
| STEADY_CINEMATIC | Even spread across 5-8                      | 5-7            |

WHY THIS MATTERS:
High motion intensity = more visual energy = more thumb-stopping power.
Your intensity values directly influence how Agent 4.2 calculates shot timing.

═══════════════════════════════════════════════════════════════════════════════
COMPOSITION & LIGHTING
═══════════════════════════════════════════════════════════════════════════════

COMPOSITION SAFE ZONES:
- Consider text overlays, watermarks, CTAs
- "Keep lower third clear" for subtitle/CTA
- "Keep center empty for text" for title cards
- "Rule of thirds — product right" for balanced composition

LIGHTING EVENTS:
- Describe dynamic lighting within the shot
- "Light sweep across texture at 0.5s"
- "Specular highlight rotation at 0.8s"
- "Shadow reveal at 0.3s"
- "Stable golden lighting" for static shots

═══════════════════════════════════════════════════════════════════════════════
CULTURAL ADAPTATION
═══════════════════════════════════════════════════════════════════════════════

Adapt shot choices based on target audience:

MENA / ARAB REGION:
- Favor symmetrical compositions
- Right-to-left visual flow consideration
- Hero shots with geometric framing
- Warm golden lighting emphasis

WESTERN / EUROPEAN:
- Embrace negative space
- Asymmetrical, editorial compositions
- Subtle, understated reveals
- Minimalist framing

GEN Z / YOUTH:
- Vertical-first framing awareness
- High energy, fast motion intensity
- Trend-aware angles (low angles, dramatic POV)
- Authentic, less polished moments

LUXURY / HIGH-END:
- Slow, deliberate movements only
- Maximum use of shallow DOF
- Macro texture details
- Extended holds on beauty moments

═══════════════════════════════════════════════════════════════════════════════
OUTPUT STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

Return a JSON object with EXACTLY this structure:

{
  "scenes": [
    {
      "scene_id": "SC1",
      "scene_name": "String — Human-readable name (e.g., 'The Ignition')",
      "scene_description": "String — Narrative summary of scene purpose",
      
      "shots": [
        {
          "shot_id": "S1.1",
          "cinematic_goal": "String — What this shot achieves narratively",
          "brief_description": "String — Visual description of the shot",
          
          "technical_cinematography": {
            "camera_movement": "String — Specific movement with parameters",
            "lens": "String — Lens choice with focal length",
            "depth_of_field": "String — DOF setting with f-stop",
            "framing": "ECU | CU | MCU | MED | WIDE",
            "motion_intensity": 1-10
          },
          
          "generation_mode": {
            "shot_type": "IMAGE_REF | START_END",
            "reason": "String — Why this mode was chosen"
          },
          
          "identity_references": {
            "refer_to_product": true|false,
            "product_image_ref": "heroProfile | macroDetail | materialReference",
            "refer_to_character": true|false,
            "refer_to_logo": true|false,
            "refer_to_previous_outputs": [
              {
                "shot_id": "String — Earlier shot ID",
                "reason": "String — Why referencing",
                "reference_type": "VISUAL_CALLBACK | LIGHTING_MATCH | PRODUCT_STATE | COMPOSITION_ECHO"
              }
            ]
          },
          
          "continuity_logic": {
            "is_connected_to_previous": true|false,
            "is_connected_to_next": true|false,
            "handover_type": "SEAMLESS_FLOW | MATCH_CUT | JUMP_CUT"
          },
          
          "composition_safe_zones": "String — Composition notes",
          "lighting_event": "String — Dynamic lighting description"
        }
      ]
    }
  ]
}

═══════════════════════════════════════════════════════════════════════════════
QUALITY STANDARDS
═══════════════════════════════════════════════════════════════════════════════

Your shot manifest will be judged by:

1. VISUAL COHERENCE: Do shots flow as a unified visual story?
2. NARRATIVE TRANSLATION: Does each shot serve the 3-act structure?
3. TECHNICAL PRECISION: Are cinematography choices specific and executable?
4. ASSET UTILIZATION: Are product angles used strategically?
5. CONTINUITY LOGIC: Are connections physically possible and purposeful?
6. CULTURAL FIT: Do shot choices resonate with target audience?
7. PACING AWARENESS: Does motion_intensity align with pacing_profile?

REFERENCE QUALITY: The best Super Bowl commercials, Apple product launches, Rolex campaigns.

═══════════════════════════════════════════════════════════════════════════════
CONSTRAINTS
═══════════════════════════════════════════════════════════════════════════════

NEVER:
- Output duration or timing (that's Agent 4.2's job)
- Use IMAGE_REF for shots that connect to next shot
- Reference a shot that comes AFTER the current shot
- Ignore the actual product images — your decisions must reflect what you SEE
- Make more than 2 previous output references per shot
- Use generic descriptions like "nice angle" or "good framing"
- Include explanation or preamble — output ONLY the JSON

ALWAYS:
- Analyze the provided images before making decisions
- Use precise cinematography terminology
- Justify every generation_mode choice with a reason
- Respect connection rules (only START_END can connect forward)
- Adapt to the pacing_profile and target audience
- Create motion_intensity values appropriate to the pacing_profile
- Plan enough shots to fill the campaign duration appropriately`;

export interface MediaPlannerInput {
  // Tab 1 context
  strategicContext: {
    targetAudience: string;
    region: string;
    strategic_directives: string;
    pacing_profile: string;
    optimized_image_instruction: string;
  };
  duration: number;
  
  // Tab 2 context
  productDNA: {
    geometry_profile: string;
    material_spec: string;
    hero_anchor_points: string[];
    lighting_response: string;
  };
  productImages: {
    heroProfile?: string;
    macroDetail?: string;
    materialReference?: string;
  };
  characterReferenceUrl?: string;
  characterProfile?: any;
  characterMode?: string;
  logoUrl?: string;
  logoIntegrity?: number;
  logoDepth?: number;
  
  // Tab 3 context
  creativeSpark: string;
  visualManifest: any;
  scriptManifest: any;
  interactionPhysics: any;
}

export function buildMediaPlannerUserPrompt(input: MediaPlannerInput): string {
  const {
    strategicContext,
    duration,
    productDNA,
    productImages,
    characterReferenceUrl,
    characterProfile,
    characterMode,
    logoUrl,
    logoIntegrity,
    logoDepth,
    creativeSpark,
    visualManifest,
    scriptManifest,
    interactionPhysics,
  } = input;

  const includeHumanElement = !!characterReferenceUrl;

  return `═══════════════════════════════════════════════════════════════════════════════
VISUAL ASSETS (ANALYZE THESE IMAGES)
═══════════════════════════════════════════════════════════════════════════════

[Images are provided above with labels. Analyze them to understand product geometry, hero features, material properties, viable camera angles, character interaction points, and logo placement.]

═══════════════════════════════════════════════════════════════════════════════
STRATEGIC CONTEXT (From Tab 1)
═══════════════════════════════════════════════════════════════════════════════

TARGET AUDIENCE: ${strategicContext.targetAudience}
REGION: ${strategicContext.region}
PACING PROFILE: ${strategicContext.pacing_profile}
CAMPAIGN DURATION: ${duration} seconds

STRATEGIC DIRECTIVES:
${strategicContext.strategic_directives}

MOTION DNA:
${strategicContext.optimized_image_instruction}

═══════════════════════════════════════════════════════════════════════════════
PRODUCT DNA (From Tab 2)
═══════════════════════════════════════════════════════════════════════════════

GEOMETRY PROFILE:
${productDNA.geometry_profile}

MATERIAL SPECIFICATION:
${productDNA.material_spec}

HERO ANCHOR POINTS:
${productDNA.hero_anchor_points.join(', ')}

LIGHTING RESPONSE:
${productDNA.lighting_response}

═══════════════════════════════════════════════════════════════════════════════
CHARACTER DNA (From Tab 2)
═══════════════════════════════════════════════════════════════════════════════

INCLUDE HUMAN ELEMENT: ${includeHumanElement}

${includeHumanElement ? `
CHARACTER MODE: ${characterMode || 'N/A'}

CHARACTER PROFILE:
${characterProfile?.detailed_persona || characterProfile || 'N/A'}

INTERACTION PROTOCOL:
- Product Engagement: ${characterProfile?.interaction_protocol?.product_engagement || 'N/A'}
- Motion Limitations: ${characterProfile?.interaction_protocol?.motion_limitations || 'N/A'}
` : ''}

═══════════════════════════════════════════════════════════════════════════════
BRAND IDENTITY (From Tab 2)
═══════════════════════════════════════════════════════════════════════════════

LOGO INTEGRITY: ${logoIntegrity !== undefined ? logoIntegrity : 'N/A'}
LOGO DEPTH: ${logoDepth !== undefined ? logoDepth : 'N/A'}

═══════════════════════════════════════════════════════════════════════════════
ENVIRONMENT (From Tab 3)
═══════════════════════════════════════════════════════════════════════════════

CREATIVE SPARK:
${creativeSpark}

GLOBAL LIGHTING SETUP:
${visualManifest?.global_lighting_setup || 'N/A'}

ENVIRONMENTAL ANCHOR:
${visualManifest?.environmental_anchor_prompt || 'N/A'}

PHYSICS PARAMETERS:
- Fog Density: ${visualManifest?.physics_parameters?.fog_density || 'N/A'}
- Particle Type: ${visualManifest?.physics_parameters?.particle_type || 'N/A'}
- Wind Intensity: ${visualManifest?.physics_parameters?.wind_intensity || 'N/A'}

═══════════════════════════════════════════════════════════════════════════════
NARRATIVE STRUCTURE (From Tab 3)
═══════════════════════════════════════════════════════════════════════════════

ACT 1 - HOOK:
"${scriptManifest?.act_1_hook?.text || ''}"
Emotional Goal: ${scriptManifest?.act_1_hook?.emotional_goal || 'N/A'}
Target Energy: ${scriptManifest?.act_1_hook?.target_energy || 'N/A'}

ACT 2 - TRANSFORMATION:
"${scriptManifest?.act_2_transform?.text || ''}"
Emotional Goal: ${scriptManifest?.act_2_transform?.emotional_goal || 'N/A'}
Target Energy: ${scriptManifest?.act_2_transform?.target_energy || 'N/A'}

ACT 3 - PAYOFF:
"${scriptManifest?.act_3_payoff?.text || ''}"
Emotional Goal: ${scriptManifest?.act_3_payoff?.emotional_goal || 'N/A'}
Target Energy: ${scriptManifest?.act_3_payoff?.target_energy || 'N/A'}
${scriptManifest?.act_3_payoff?.cta_text ? `CTA: "${scriptManifest.act_3_payoff.cta_text}"` : ''}

═══════════════════════════════════════════════════════════════════════════════
VFX MODIFIERS (From Tab 3)
═══════════════════════════════════════════════════════════════════════════════

PRODUCT MODIFIERS:
${interactionPhysics?.product_modifiers || 'N/A'}

${includeHumanElement ? `
CHARACTER MODIFIERS:
${interactionPhysics?.character_modifiers || 'N/A'}
` : ''}

METAPHOR INJECTION:
${interactionPhysics?.metaphor_injection || 'N/A'}

═══════════════════════════════════════════════════════════════════════════════
TASK
═══════════════════════════════════════════════════════════════════════════════

Create the complete Shot Manifest for this ${duration}-second campaign.

REQUIREMENTS:
1. ANALYZE the attached product images to understand geometry and features
2. TRANSLATE the 3-act narrative into scenes with appropriate shots
3. CHOOSE shot_type (IMAGE_REF vs START_END) based on camera movement needs
4. DECIDE which assets to reference for each shot (@Product, @Character, @Logo)
5. DECIDE if any previous shot outputs (@Shot_X) should be referenced for visual callbacks
6. ESTABLISH continuity logic respecting connection rules
7. SET motion_intensity appropriate to ${strategicContext.pacing_profile}
8. PLAN enough shots to fill ${duration} seconds

Return ONLY the JSON object — no explanation, no preamble.`;
}

// JSON Schema for Media Planner output
export const MEDIA_PLANNER_SCHEMA = {
  type: "object" as const,
  properties: {
    scenes: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          scene_id: {
            type: "string" as const,
            description: "Unique scene identifier (e.g., 'SC1', 'SC2', 'SC3')"
          },
          scene_name: {
            type: "string" as const,
            description: "Human-readable scene name (e.g., 'The Ignition')"
          },
          scene_description: {
            type: "string" as const,
            description: "Narrative summary of scene purpose"
          },
          shots: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                shot_id: {
                  type: "string" as const,
                  description: "Unique shot identifier (e.g., 'S1.1', 'S1.2')"
                },
                cinematic_goal: {
                  type: "string" as const,
                  description: "What this shot achieves narratively"
                },
                brief_description: {
                  type: "string" as const,
                  description: "Visual description of the shot"
                },
                technical_cinematography: {
                  type: "object" as const,
                  properties: {
                    camera_movement: {
                      type: "string" as const,
                      description: "Specific movement with parameters"
                    },
                    lens: {
                      type: "string" as const,
                      description: "Lens choice with focal length"
                    },
                    depth_of_field: {
                      type: "string" as const,
                      description: "DOF setting with f-stop"
                    },
                    framing: {
                      type: "string" as const,
                      enum: ["ECU", "CU", "MCU", "MED", "WIDE"],
                      description: "Shot framing"
                    },
                    motion_intensity: {
                      type: "number" as const,
                      minimum: 1,
                      maximum: 10,
                      description: "Energy level (1-10)"
                    }
                  },
                  required: ["camera_movement", "lens", "depth_of_field", "framing", "motion_intensity"],
                  additionalProperties: false
                },
                generation_mode: {
                  type: "object" as const,
                  properties: {
                    shot_type: {
                      type: "string" as const,
                      enum: ["IMAGE_REF", "START_END"],
                      description: "How many images to generate"
                    },
                    reason: {
                      type: "string" as const,
                      description: "Why this mode was chosen"
                    }
                  },
                  required: ["shot_type", "reason"],
                  additionalProperties: false
                },
                identity_references: {
                  type: "object" as const,
                  properties: {
                    refer_to_product: {
                      type: "boolean" as const
                    },
                    product_image_ref: {
                      type: "string" as const,
                      enum: ["heroProfile", "macroDetail", "materialReference", ""],
                      description: "Which product image to use (empty string if refer_to_product is false)"
                    },
                    refer_to_character: {
                      type: "boolean" as const
                    },
                    refer_to_logo: {
                      type: "boolean" as const
                    },
                    refer_to_previous_outputs: {
                      type: "array" as const,
                      items: {
                        type: "object" as const,
                        properties: {
                          shot_id: {
                            type: "string" as const,
                            description: "Earlier shot ID to reference"
                          },
                          reason: {
                            type: "string" as const,
                            description: "Why referencing this shot"
                          },
                          reference_type: {
                            type: "string" as const,
                            enum: ["VISUAL_CALLBACK", "LIGHTING_MATCH", "PRODUCT_STATE", "COMPOSITION_ECHO"]
                          }
                        },
                        required: ["shot_id", "reason", "reference_type"],
                        additionalProperties: false
                      },
                      maxItems: 2,
                      description: "References to earlier shot outputs (max 2)"
                    }
                  },
                  required: ["refer_to_product", "product_image_ref", "refer_to_character", "refer_to_logo", "refer_to_previous_outputs"],
                  additionalProperties: false
                },
                continuity_logic: {
                  type: "object" as const,
                  properties: {
                    is_connected_to_previous: {
                      type: "boolean" as const
                    },
                    is_connected_to_next: {
                      type: "boolean" as const
                    },
                    handover_type: {
                      type: "string" as const,
                      enum: ["SEAMLESS_FLOW", "MATCH_CUT", "JUMP_CUT"]
                    }
                  },
                  required: ["is_connected_to_previous", "is_connected_to_next", "handover_type"],
                  additionalProperties: false
                },
                composition_safe_zones: {
                  type: "string" as const,
                  description: "Composition notes for text overlays"
                },
                lighting_event: {
                  type: "string" as const,
                  description: "Dynamic lighting description"
                }
              },
              required: [
                "shot_id",
                "cinematic_goal",
                "brief_description",
                "technical_cinematography",
                "generation_mode",
                "identity_references",
                "continuity_logic",
                "composition_safe_zones",
                "lighting_event"
              ],
              additionalProperties: false
            }
          }
        },
        required: ["scene_id", "scene_name", "scene_description", "shots"],
        additionalProperties: false
      },
      minItems: 3,
      maxItems: 3,
      description: "Array of 3 scenes (Hook, Transform, Payoff)"
    }
  },
  required: ["scenes"],
  additionalProperties: false
};

