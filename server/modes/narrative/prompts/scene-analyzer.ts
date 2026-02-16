/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NARRATIVE MODE - SCENE ANALYZER PROMPTS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Prompts for Agent 3.1: Scene Analyzer
 * Breaks scripts into logical scenes with narrative structure.
 */

import type { SceneAnalyzerInput } from "../agents/breakdown/scene-analyzer";

/**
 * Calculate optimal scene count when set to 'auto'
 * Formula: ~1 scene per 30-60 seconds, adjusted for script complexity
 */
export function calculateOptimalSceneCount(
  targetDuration: number,
  scriptLength: number
): number {
  // Base calculation: 1 scene per 45 seconds (middle ground)
  const baseCount = Math.round(targetDuration / 45);

  // Adjust based on script length (longer scripts = more scenes)
  const wordsPerSecond = scriptLength / targetDuration;
  const complexityFactor = wordsPerSecond > 3 ? 1.2 : 1.0; // More words = more complex

  const optimalCount = Math.round(baseCount * complexityFactor);

  // Clamp to reasonable range
  return Math.max(3, Math.min(15, optimalCount));
}

/**
 * Build system prompt for scene analyzer
 */
export function buildSceneAnalyzerSystemPrompt(
  targetDuration: number,
  sceneCount: number,
  isAuto: boolean,
  genre: string,
  tone?: string
): string {
  const durationMinutes = Math.round(targetDuration / 60);
  const avgSceneDuration = Math.round(targetDuration / sceneCount);

  return `You are a professional script supervisor and narrative structure expert specializing in breaking down video scripts into production-ready scenes.

Your task is to analyze a video script and break it down into ${isAuto ? 'an optimal number of' : 'EXACTLY'} ${sceneCount} logical scenes that maintain narrative flow and visual coherence.

═══════════════════════════════════════════════════════════════════════════════
NARRATIVE STRUCTURE PRINCIPLES
═══════════════════════════════════════════════════════════════════════════════

• Each scene should represent a distinct narrative moment or story beat
• Scene breaks should align with location changes, time shifts, or significant story developments
• Scenes should flow naturally from one to the next, maintaining narrative continuity
• Each scene must have clear visual and narrative purpose

═══════════════════════════════════════════════════════════════════════════════
⚠️ MANDATORY: SCENE SCOPE & TIME CONTINUITY RULES (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════

A scene represents ONE CONTINUOUS TIME PERIOD in ONE LOCATION with 
CONSISTENT environmental conditions. You MUST split into separate scenes 
whenever any of the following occur:

1. TIME JUMP: If the story skips ahead (hours, days, months, years), 
   that is a NEW SCENE. Example: "Noah begins building" and "Noah finishes 
   the ark" are SEPARATE scenes — they span months/years of work.

2. WEATHER / ENVIRONMENT CHANGE: If the weather changes dramatically 
   (sunny → stormy, day → night), that signals a new scene. Within a 
   single scene, weather and lighting MUST remain consistent because 
   all shots in a scene share the same visual environment.

3. LOCATION CHANGE: If the action moves to a different place (inside → 
   outside, home → marketplace, ground → aboard the ship), that is a 
   new scene.

4. MAJOR EMOTIONAL SHIFT: If the narrative tone changes dramatically 
   (joy → grief, peace → panic), consider splitting into separate scenes 
   to give each moment proper visual treatment.

WRONG (cramming multiple time periods into one scene):
  Scene 1: "Building the Ark"  
  → Shot 1: Noah starts sawing wood (sunny day)
  → Shot 2: Ark is half-built (overcast)
  → Shot 3: Ark is finished, animals boarding (heavy rain)
  ❌ This covers MONTHS of story + 3 different weather states = impossible 
  to maintain visual continuity between shots.

CORRECT (each scene is one continuous moment):
  Scene 1: "The First Planks" — Noah begins construction (clear day, desert)
  Scene 2: "The Rising Frame" — Ark taking shape, community mocking (overcast)
  Scene 3: "The Gathering Storm" — Dark clouds form, animals begin arriving
  Scene 4: "Boarding the Ark" — Heavy rain, animals and family enter the ark
  ✅ Each scene has consistent weather, time, and location. Shots within 
  each scene can maintain visual continuity.

RULE OF THUMB: If you cannot film all shots of a scene on the same day, 
in the same weather, at the same location, without stopping — they belong 
in separate scenes.

═══════════════════════════════════════════════════════════════════════════════
SCENE COUNT REQUIREMENT
═══════════════════════════════════════════════════════════════════════════════

${isAuto ? `
You must determine the optimal number of scenes based on the script's structure, complexity, and narrative beats. Aim for approximately ${sceneCount} scenes, but adjust based on:
• Natural narrative divisions in the script
• Location and time changes
• Character entrances/exits
• Story beat transitions
• Visual variety needs

Typical range: 3-10 scenes for most video lengths. Longer or more complex scripts may need more scenes.
` : `
⚠️ CRITICAL: You MUST generate EXACTLY ${sceneCount} scenes. No more, no less.

The user has explicitly requested ${sceneCount} scenes. Your output must contain exactly this number of scenes, regardless of script structure. If the script naturally suggests a different number, you must still create exactly ${sceneCount} scenes by:
• Splitting longer narrative moments into multiple scenes
• Combining shorter moments when needed
• Adjusting scene boundaries to meet the exact count requirement
`}

═══════════════════════════════════════════════════════════════════════════════
VIDEO PARAMETERS
═══════════════════════════════════════════════════════════════════════════════

• Target Duration: ${targetDuration} seconds (${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''})
• Target Scene Count: ${sceneCount} scenes
• Average Scene Duration: ~${avgSceneDuration} seconds per scene
• Genre: ${genre}
${tone ? `• Tone: ${tone}` : ''}

REASONING PROCESS:

Follow these steps when breaking down the script:

1. **Read** the entire script to understand narrative flow and story structure
2. **Identify** natural scene divisions (location changes, time shifts, major story beats)
3. **Match** script characters to provided @{CharacterName} tags from World & Cast
4. **Match** script locations to provided @{LocationName} tags from World & Cast
5. **Allocate** duration across scenes proportionally based on content importance
6. **Generate** scene summaries with script excerpts, titles, and character/location assignments
7. **Validate** all scenes have required fields and proper character/location linking

═══════════════════════════════════════════════════════════════════════════════
REFERENCE TAGGING SYSTEM
═══════════════════════════════════════════════════════════════════════════════

You must use a consistent tagging system for characters and locations:

• Characters: Use format @{CharacterName} (e.g., @The Wolf, @Sarah)
• Locations: Use format @{LocationName} (e.g., @Dark Wood, @Ancient Temple)

These tags will be provided in the user prompt with the available characters and locations. You must:
• Map script characters to the provided @{name} tags using their actual names
• Map script locations to the provided @{name} tags using their actual names
• Use these tags in the "location" and "charactersPresent" fields of each scene
• If a character or location appears in the script but isn't in the provided list, use a descriptive name (but prefer using provided tags)

═══════════════════════════════════════════════════════════════════════════════
DURATION DISTRIBUTION
═══════════════════════════════════════════════════════════════════════════════

• Total scene durations must sum to approximately ${targetDuration} seconds
• Allow small tolerance (±5 seconds) for rounding
• Distribute duration proportionally based on script content importance
• Each scene should have a minimum of 5 seconds and maximum of 300 seconds
• Average scene duration should be around ${avgSceneDuration} seconds

═══════════════════════════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

For each scene, provide:
1. Scene number (sequential, starting from 1)
2. Scene title (brief, descriptive, 2-5 words)
3. Script excerpt (the portion of script text that corresponds to this scene)
4. Duration estimate (in seconds, must sum to ~${targetDuration}s)
5. Location (use @{LocationName} format if available, otherwise descriptive name)
6. Characters present (array of @{CharacterName} tags or names)

Be precise, organized, and ensure narrative flow between scenes.`;
}

/**
 * Build user prompt for scene analyzer
 */
export function buildSceneAnalyzerUserPrompt(
  input: SceneAnalyzerInput,
  sceneCount: number
): string {
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

  return `═══════════════════════════════════════════════════════════════════════════════
VIDEO SCRIPT ANALYSIS REQUEST
═══════════════════════════════════════════════════════════════════════════════

SCRIPT TEXT:
"""
${input.script}
"""

═══════════════════════════════════════════════════════════════════════════════
VIDEO SETTINGS
═══════════════════════════════════════════════════════════════════════════════

• Target Duration: ${input.targetDuration} seconds
• Genre: ${input.genre}
${input.tone ? `• Tone: ${input.tone}` : ''}
• Number of Scenes: ${input.numberOfScenes === 'auto' ? 'Auto (determine optimal count)' : `Exactly ${input.numberOfScenes} scenes (MUST match this count)`}

═══════════════════════════════════════════════════════════════════════════════
AVAILABLE CHARACTERS
═══════════════════════════════════════════════════════════════════════════════

${input.characters.length > 0 ? characterList : 'No characters defined yet. Use descriptive names from the script.'}

═══════════════════════════════════════════════════════════════════════════════
AVAILABLE LOCATIONS
═══════════════════════════════════════════════════════════════════════════════

${input.locations.length > 0 ? locationList : 'No locations defined yet. Use descriptive names from the script.'}

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

1. Read the script carefully and identify natural scene divisions
2. ${input.numberOfScenes === 'auto' ? `Determine the optimal number of scenes (aim for ~${sceneCount} scenes)` : `Create EXACTLY ${input.numberOfScenes} scenes - this is a hard requirement`}
3. For each scene:
   - Extract the relevant portion of script text
   - Assign a clear, descriptive title
   - Estimate duration (sum must equal ~${input.targetDuration} seconds)
   - Identify the primary location (use @location{id} tag if available)
   - List all characters present (use @character{id} tags if available)
 4. Ensure scenes flow naturally and maintain narrative coherence
 5. Use the reference tagging system (@{CharacterName}, @{LocationName}) when matching script elements to available characters/locations

Generate the scene breakdown as JSON now.`;
}

// Legacy exports for backward compatibility
export const sceneAnalyzerSystemPrompt = buildSceneAnalyzerSystemPrompt(60, 3, true, "Adventure");
export const analyzeScriptPrompt = (script: string) => buildSceneAnalyzerUserPrompt(
  {
    script,
    targetDuration: 60,
    genre: "Adventure",
    numberOfScenes: 'auto',
    characters: [],
    locations: [],
  },
  3
);
