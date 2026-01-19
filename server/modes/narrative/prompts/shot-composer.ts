/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NARRATIVE MODE - SHOT COMPOSER PROMPTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Prompts for Agent 3.2: Shot Composer
 * Breaks scenes into individual shots with camera framing, timing, and action descriptions.
 */

import type { ShotComposerInput } from "../agents/breakdown/shot-composer";

/**
 * Calculate optimal shot count when set to 'auto'
 * Formula: ~1 shot per 5-15 seconds, adjusted for scene complexity
 */
export function calculateOptimalShotCount(sceneDuration: number): number {
  // Base calculation: 1 shot per 10 seconds (middle ground)
  const baseCount = Math.round(sceneDuration / 10);
  
  // Adjust based on scene duration (longer scenes can have more shots)
  const complexityFactor = sceneDuration > 60 ? 1.3 : 1.0;
  
  const optimalCount = Math.round(baseCount * complexityFactor);
  
  // Clamp to reasonable range (2-8 shots per scene)
  return Math.max(2, Math.min(8, optimalCount));
}

/**
 * Build system prompt for shot composer
 */
export function buildShotComposerSystemPrompt(
  sceneDuration: number,
  shotCount: number,
  isAuto: boolean,
  genre: string,
  tone?: string,
  availableDurations?: number[],
  narrativeMode?: "image-reference" | "start-end" | "auto"
): string {
  const avgShotDuration = Math.round(sceneDuration / shotCount);
  
  return `You are a professional cinematographer and video editor specializing in narrative video production.

Your task is to break down a scene into ${isAuto ? 'an optimal number of' : 'EXACTLY'} ${shotCount} individual shots that maintain narrative flow, visual variety, and cinematic quality.

═══════════════════════════════════════════════════════════════════════════════
CINEMATIC SHOT COMPOSITION PRINCIPLES
═══════════════════════════════════════════════════════════════════════════════

• Each shot should represent a distinct visual moment or narrative beat
• Shots should flow naturally from one to the next, maintaining visual continuity
• Vary shot types (wide, medium, close-up) for visual interest
• Match camera movements to narrative mood and action
• Each shot must have clear narrative purpose and visual composition

═══════════════════════════════════════════════════════════════════════════════
SHOT COUNT REQUIREMENT
═══════════════════════════════════════════════════════════════════════════════

${isAuto ? `
You must determine the optimal number of shots based on the scene's duration, content complexity, and narrative beats. Aim for approximately ${shotCount} shots, but adjust based on:
• Scene duration and pacing needs
• Narrative beats and story moments
• Visual variety requirements

Typical range: 2-8 shots per scene. Longer or more complex scenes may need more shots.
` : `
⚠️ CRITICAL: You MUST generate EXACTLY ${shotCount} shots for this scene. No more, no less.

The user has explicitly requested ${shotCount} shots per scene. Your output must contain exactly this number of shots, regardless of scene content. If the scene naturally suggests a different number, you must still create exactly ${shotCount} shots by:
• Splitting longer narrative moments into multiple shots
• Combining shorter moments when needed
• Adjusting shot boundaries to meet the exact count requirement
`}

═══════════════════════════════════════════════════════════════════════════════
SCENE PARAMETERS
═══════════════════════════════════════════════════════════════════════════════

• Scene Duration: ${sceneDuration} seconds
• Target Shot Count: ${shotCount} shots
• Average Shot Duration: ~${avgShotDuration} seconds per shot
• Genre: ${genre}
${tone ? `• Tone: ${tone}` : ''}

REASONING PROCESS:

Follow these steps when composing shots for a scene:

1. **Analyze** the current_scene to understand narrative beats and visual requirements
2. **Determine** optimal shot count per scene based on duration_seconds and content complexity
3. **Plan** shot sequence maintaining visual flow and continuity between shots
4. **Assign** shot types, sizes, angles, and movements based on storytelling needs and genre/tone
5. **Extract** action descriptions from script excerpt for each shot
6. **Link** characters and locations using @{CharacterName} and @{LocationName} tags in action descriptions
7. **Validate** that total shot durations match scene duration_seconds (±2 seconds tolerance)

═══════════════════════════════════════════════════════════════════════════════
REFERENCE TAGGING SYSTEM
═══════════════════════════════════════════════════════════════════════════════

You MUST use a consistent tagging system for characters and locations in action descriptions:

CRITICAL RULES:
• If characters are provided in the list: Use @{CharacterName} format (e.g., @Little Red Riding Hood, @The Wolf)
• If NO characters are provided: Use descriptive text instead of character names (e.g., "young girl wearing a vibrant red cloak" instead of "Little Red Riding Hood")
• If locations are provided in the list: Use @{LocationName} format (e.g., @Dark Wood, @Ancient Temple)
• If NO locations are provided: Use descriptive text instead of location names (e.g., "dense forest with tall trees" instead of "Dark Wood")

Examples WITH characters/locations provided:
- Action: "@Little Red Riding Hood enters @Ancient Temple and approaches the window"

Examples WITHOUT characters/locations provided:
- Action: "A young girl wearing a vibrant red cloak enters an ancient stone temple and approaches the window"

These tags will be provided in the user prompt. You must:
• ONLY use @{CharacterName} tags if characters are provided in the list - otherwise use descriptive text
• ONLY use @{LocationName} tags if locations are provided in the list - otherwise use descriptive text
• Use these tags in "actionDescription" field when available
• When characters/locations are NOT provided, describe them visually instead of using names

═══════════════════════════════════════════════════════════════════════════════
SHOT TYPES AND CAMERA MOVEMENTS
═══════════════════════════════════════════════════════════════════════════════

Available Shot Types:
• Wide Shot / Establishing Shot
• Medium Wide Shot
• Medium Shot
• Close-Up
• Extreme Close-Up
• Detail Shot

Available Camera Movements:
• Static (no movement)
• Pan Left / Pan Right
• Zoom In / Zoom Out
• Dolly Forward / Dolly Back
• Tilt Up / Tilt Down
• Track Left / Track Right

Choose shot types and movements that:
• Support the narrative moment
• Create visual variety
• Match the genre and tone
• Flow naturally from previous shots

═══════════════════════════════════════════════════════════════════════════════
DURATION DISTRIBUTION
═══════════════════════════════════════════════════════════════════════════════

• Total shot durations must sum to EXACTLY ${sceneDuration} seconds
• Allow small tolerance (±2 seconds) for rounding
• Distribute duration proportionally based on:
  - Shot importance and narrative weight
  - Visual complexity (complex actions may need more time)
${availableDurations && availableDurations.length > 0 ? `
⚠️ CRITICAL: Available Video Model Durations
The selected video model only supports these specific durations: ${availableDurations.join(', ')} seconds

You MUST choose shot durations from this list only. When assigning durations to shots:
• Select the closest available duration that fits the narrative needs
• If a shot needs 7 seconds but only [5, 10] are available, choose 5 or 10 (prefer the closer one)
• The sum of all shot durations should still approximate ${sceneDuration} seconds
• You may need to adjust shot boundaries to accommodate available durations
` : `
• Each shot should have a minimum of 2 seconds and maximum of 60 seconds
`}
• Average shot duration should be around ${avgShotDuration} seconds

${narrativeMode === "auto" ? `
═══════════════════════════════════════════════════════════════════════════════
FRAME MODE DECISION (AUTO MODE)
═══════════════════════════════════════════════════════════════════════════════

⚠️ CRITICAL: You are operating in AUTO MODE. For each shot, you MUST decide whether to use "image-reference" or "start-end" frame mode.

Decision Criteria:
• Use "image-reference" for:
  - Simple, static shots with minimal movement
  - Isolated narrative moments
  - Shots with static camera (no pan/track/dolly)
  - Hard cuts or transitions that don't require smooth continuity
  - Shots that work well with a single reference image

• Use "start-end" for:
  - Complex shots with camera movement (pan, track, dolly, zoom)
  - Shots requiring smooth transitions
  - Continuous action that flows from one state to another
  - Shots that benefit from defining both start and end states
  - Shots that are part of continuity groups (first shot in group MUST be start-end)

Continuity Rules:
- If a shot should connect to the next shot for continuity, the PREVIOUS shot MUST be "start-end" (has end frame to inherit)
- First shot in a continuity group MUST be "start-end" (needs both frames to start the chain)
- Subsequent shots in continuity groups can be either mode, but only generate end frame (start inherited)

For each shot, include a "frameMode" field with value "image-reference" or "start-end".
` : ''}
═══════════════════════════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

For each shot, provide:
1. Shot number (sequential, starting from 1)
2. Duration (in seconds, must sum to ~${sceneDuration}s)
3. Shot type (Wide Shot, Medium Shot, Close-Up, etc.)
4. Camera movement (Static, Pan, Zoom, Dolly, etc.)
5. Action description (use @tags ONLY if characters/locations provided, otherwise use descriptive text)
6. Characters (array of @{CharacterName} tags if provided, or empty array [] if not - do NOT create character names)
7. Location (@{LocationName} tag if provided, or empty string "" if not - do NOT create location names)
${narrativeMode === "auto" ? '8. Frame mode ("image-reference" or "start-end") - REQUIRED in auto mode' : ''}

Be precise, cinematic, and ensure narrative flow between shots.`;
}

/**
 * Build user prompt for shot composer
 */
export function buildShotComposerUserPrompt(
  input: ShotComposerInput,
  shotCount: number,
  narrativeMode?: "image-reference" | "start-end" | "auto"
): string {
  // Build available durations context if provided
  const durationsContext = input.availableDurations && input.availableDurations.length > 0
    ? `\n⚠️ AVAILABLE VIDEO MODEL DURATIONS: ${input.availableDurations.join(', ')} seconds\nYou MUST use only these durations for each shot. Choose the closest available duration to your intended shot length.\n`
    : '';
  // Build character list with name-based tags
  const characterList = input.characters
    .map((char) => {
      const tag = `@${char.name}`;
      return `- ${tag}${char.description ? ` - ${char.description}` : ''}`;
    })
    .join('\n');

  // Build location list with name-based tags
  const locationList = input.locations
    .map((loc) => {
      const tag = `@${loc.name}`;
      return `- ${tag}${loc.description ? ` - ${loc.description}` : ''}`;
    })
    .join('\n');

  // Build previous scenes context
  let previousScenesContext = '';
  if (input.previousScenes.length > 0) {
    previousScenesContext = '\n═══════════════════════════════════════════════════════════════════════════════\nPREVIOUS SCENES (for narrative context)\n═══════════════════════════════════════════════════════════════════════════════\n\n';
    previousScenesContext += input.previousScenes.map((prev, idx) => {
      const scene = prev.scene;
      const shots = prev.shots;
      return `Scene ${scene.sceneNumber}: ${scene.title}
Duration: ${scene.duration || 0}s
Shots: ${shots.length}
${scene.description ? `Content: ${scene.description.substring(0, 200)}...` : ''}`;
    }).join('\n\n');
    previousScenesContext += '\n';
  }

  return `═══════════════════════════════════════════════════════════════════════════════
SHOT COMPOSITION REQUEST
═══════════════════════════════════════════════════════════════════════════════

FULL SCRIPT:
"""
${input.script}
"""

${previousScenesContext}═══════════════════════════════════════════════════════════════════════════════
CURRENT SCENE TO BREAK DOWN
═══════════════════════════════════════════════════════════════════════════════

Scene ${input.scene.sceneNumber}: ${input.scene.title}
Duration: ${input.scene.duration || 0} seconds
${input.scene.description ? `Script Excerpt:\n"""\n${input.scene.description}\n"""` : ''}

═══════════════════════════════════════════════════════════════════════════════
VIDEO SETTINGS
═══════════════════════════════════════════════════════════════════════════════

• Genre: ${input.genre}
${input.tone ? `• Tone: ${input.tone}` : ''}
• Narrative Mode: ${narrativeMode || 'image-reference'}
${narrativeMode === "auto" ? `⚠️ AUTO MODE: You must decide the frame mode (image-reference or start-end) for each shot based on shot characteristics, camera movement, and transition needs.` : ''}
• Shots per Scene: ${input.shotsPerScene === 'auto' ? 'Auto (determine optimal count)' : `Exactly ${input.shotsPerScene} shots (MUST match this count)`}

═══════════════════════════════════════════════════════════════════════════════
AVAILABLE CHARACTERS
═══════════════════════════════════════════════════════════════════════════════

${input.characters.length > 0 ? characterList : '⚠️ NO CHARACTERS DEFINED: Use descriptive text instead of character names (e.g., "young girl wearing a vibrant red cloak" instead of "Little Red Riding Hood"). Do NOT create or use character names.'}

═══════════════════════════════════════════════════════════════════════════════
AVAILABLE LOCATIONS
═══════════════════════════════════════════════════════════════════════════════

${input.locations.length > 0 ? locationList : '⚠️ NO LOCATIONS DEFINED: Use descriptive text instead of location names (e.g., "dense forest with tall trees" instead of "Dark Wood"). Do NOT create or use location names.'}

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

1. Read the full script and current scene excerpt carefully
2. ${input.shotsPerScene === 'auto' ? `Determine the optimal number of shots (aim for ~${shotCount} shots)` : `Create EXACTLY ${input.shotsPerScene} shots - this is a hard requirement`}
3. For each shot:
   - Create a clear action description of what visually happens in this shot
   - Assign appropriate shot type and camera movement
   - Estimate duration (sum must equal ~${input.scene.duration || 0} seconds)
   - Identify characters present:
     * If characters are provided in the list: use @{CharacterName} tags (e.g., @Little Red Riding Hood)
     * If NO characters provided: use descriptive text (e.g., "young girl wearing a vibrant red cloak") - do NOT use character names
   - Identify location:
     * If locations are provided in the list: use @{LocationName} tag (e.g., @Dark Wood)
     * If NO locations provided: use descriptive text (e.g., "dense forest with tall trees") - do NOT use location names
   - Use @tags ONLY when characters/locations are provided in the list
   - When characters/locations are NOT provided, use visual descriptions instead of names in actionDescription
   ${narrativeMode === "auto" ? `- Decide frame mode: "image-reference" for simple/static shots, "start-end" for complex/moving shots` : ''}
4. Ensure shots flow naturally and maintain narrative coherence
5. Vary shot types and camera movements for visual interest
6. Match the genre and tone in your shot choices
7. CRITICAL: If the AVAILABLE CHARACTERS section says "NO CHARACTERS DEFINED", you MUST:
   - Use descriptive text in actionDescription (e.g., "young girl", "a woman", "the protagonist")
   - Do NOT use character names like "Little Red Riding Hood", "Sarah", etc.
   - Return empty array [] for the characters field
8. CRITICAL: If the AVAILABLE LOCATIONS section says "NO LOCATIONS DEFINED", you MUST:
   - Use descriptive text in actionDescription (e.g., "dense forest", "ancient temple", "city street")
   - Do NOT use location names like "Dark Wood", "Ancient Temple", etc.
   - Return empty string "" for the location field
${(narrativeMode === "start-end" || narrativeMode === "auto") ? `
7. After composing shots, analyze continuity and propose continuity groups:
   - Identify shots that should connect seamlessly
   - Ensure first shot in each group is start-end mode (if in auto mode)
   - Only connect shots within this scene
   - Provide transition type and description for each group
` : ''}

Generate the shot breakdown as JSON now.`;
}

