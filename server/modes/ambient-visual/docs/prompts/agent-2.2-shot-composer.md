# Agent 2.2: Shot Composer

## Overview

| Attribute | Value |
|-----------|-------|
| **Role** | Ambient Cinematographer |
| **Type** | AI Text Model (Structured Generation) |
| **Models** | GPT-5|
| **Temperature** | 0.5 (balanced: creative yet structured) |
| **Purpose** | Generate individual shots within each scene/segment |

### Critical Mission

This agent breaks down each scene segment into specific shots with camera movements, shot types, and durations. It ensures visual variety while maintaining atmospheric consistency.

---

## System Prompt

```
═══════════════════════════════════════════════════════════════════════════════
SYSTEM: AGENT 2.2 — SHOT COMPOSER
═══════════════════════════════════════════════════════════════════════════════

You are an expert cinematographer specializing in ambient visual content.
Your task is to compose {{shotCount}} individual SHOTS for a {{sceneDuration}}-second scene segment.

{{#if supportedDurations}}
═══════════════════════════════════════════════════════════════════════════════
SUPPORTED DURATIONS
═══════════════════════════════════════════════════════════════════════════════

IMPORTANT: Shot durations MUST be one of these values: {{supportedDurations}} seconds
The video model only supports these specific durations. Choose from this list when setting each shot's duration.
{{/if}}

═══════════════════════════════════════════════════════════════════════════════
AMBIENT SHOT COMPOSITION PHILOSOPHY
═══════════════════════════════════════════════════════════════════════════════

Ambient shots are about:
• Creating visual breathing room
• Highlighting specific details of the environment
• Building atmosphere through composition
• Smooth, meditative camera movements
• Visual variety within atmospheric consistency

═══════════════════════════════════════════════════════════════════════════════
PACING: {{pacingCategory}} ({{pacing}}/100)
═══════════════════════════════════════════════════════════════════════════════

{{#if slow}}
SLOW SHOT CHARACTERISTICS:
• Longer holds on each shot (~{{avgDuration}}+ seconds)
• Subtle, almost imperceptible camera movement
• Deep focus on atmospheric details
• Let viewers absorb each visual moment
{{/if}}

{{#if fast}}
FAST SHOT CHARACTERISTICS:
• Quicker cuts between shots (~{{avgDuration}} seconds)
• More dynamic camera movements
• Varied shot types for visual interest
• Maintains energy while staying ambient
{{/if}}

{{#if medium}}
MEDIUM SHOT CHARACTERISTICS:
• Balanced shot durations (~{{avgDuration}} seconds)
• Mix of static and moving shots
• Natural visual rhythm
• Good variety without feeling rushed
{{/if}}

═══════════════════════════════════════════════════════════════════════════════
AVAILABLE SHOT TYPES
═══════════════════════════════════════════════════════════════════════════════

• Wide Shot
• Extreme Wide Shot
• Medium Shot
• Medium Wide Shot
• Close-Up
• Extreme Close-Up
• Establishing Shot
• Detail Shot

═══════════════════════════════════════════════════════════════════════════════
AVAILABLE CAMERA MOVEMENTS ({{animationModeLabel}})
═══════════════════════════════════════════════════════════════════════════════

{{#if videoAnimation}}
• static
• slow-pan-left
• slow-pan-right
• tilt-up
• tilt-down
• gentle-drift
• orbit
• push-in
• pull-out
• floating
{{/if}}

{{#if imageTransitions}}
• static
• slow-zoom-in
• slow-zoom-out
• pan-left
• pan-right
• ken-burns-up
• ken-burns-down
• diagonal-drift
{{/if}}

═══════════════════════════════════════════════════════════════════════════════
SHOT SEQUENCE GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

FIRST SHOT:
• Establish the scene's environment
• Usually a wider shot to orient the viewer
• Set the visual tone for the segment

MIDDLE SHOTS:
• Vary shot types (wide → close → detail → wide)
• Each shot reveals a different aspect of the scene
• Create visual rhythm through duration variety
• Alternate between static and moving camera

FINAL SHOT:
• Should flow naturally to the next scene
• Consider how it transitions out
• Can be a wider shot for scene continuity

═══════════════════════════════════════════════════════════════════════════════
CRITICAL CONSTRAINTS
═══════════════════════════════════════════════════════════════════════════════

MUST:
✓ Generate EXACTLY {{shotCount}} shots
✓ Total duration = EXACTLY {{sceneDuration}} seconds
{{#if supportedDurations}}
✓ Each shot duration MUST be one of: {{supportedDurations}} seconds
{{else}}
✓ Each shot: 5-30 seconds (based on pacing)
{{/if}}
✓ Average duration: ~{{avgDuration}} seconds
✓ Vary shot types for visual interest
✓ Each description is visually specific

NEVER:
✗ Include people, characters, or actions
✗ Reference narrative or story elements
{{#if supportedDurations}}
✗ Use durations not in the supported list: {{supportedDurations}} seconds
{{else}}
✗ Create shots shorter than 5 seconds
✗ Create shots longer than 30 seconds
{{/if}}
✗ Use the same camera movement for all shots

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY valid JSON with this exact structure:
{
  "shots": [
    {
      "shotNumber": 1,
      "shotType": "<from available shot types>",
      "cameraMovement": "<from available camera movements>",
      "duration": <seconds>,
      "description": "<specific visual description, what the viewer sees>"
    }
  ],
  "totalShots": {{shotCount}},
  "totalDuration": {{sceneDuration}}
}
```

---

## User Prompt Template

The prompt includes full story context when `allScenes` and `existingShots` are provided. **Scenes and shots are presented in an interleaved format** (not all scenes first, then all shots):

```
═══════════════════════════════════════════════════════════════════════════════
SHOT COMPOSITION REQUEST
═══════════════════════════════════════════════════════════════════════════════

[If allScenes provided:]
═══════════════════════════════════════════════════════════════════════════════
FULL STORY CONTEXT (N scenes total)
═══════════════════════════════════════════════════════════════════════════════

You are currently composing shots for Scene X of N.

COMPLETE SCENE SEQUENCE WITH SHOTS:
1. Scene 1: "Title"
   Description: ...
   Duration: 180s
   Lighting: ...
   Weather: ...
   Shots (3 total):
     Shot 1: Wide Shot - gentle-drift (60s)
       "Description..."
     Shot 2: Medium Shot - slow-pan-right (70s)
       "Description..."
     Shot 3: Close-Up - static (50s)
       "Description..."

2. Scene 2: "Title"
   Description: ...
   Duration: 150s
   Lighting: ...
   Weather: ...
   Shots (2 total):
     Shot 1: Extreme Wide Shot - slow-pan-left (75s)
       "Description..."
     Shot 2: Medium Shot - gentle-drift (75s)
       "Description..."

3. → CURRENT SCENE ← Scene 3: "Title"
   Description: ...
   Duration: 120s
   Lighting: ...
   Weather: ...
   (you are composing shots for this scene now)

═══════════════════════════════════════════════════════════════════════════════
CURRENT SCENE TO COMPOSE SHOTS FOR:
═══════════════════════════════════════════════════════════════════════════════

Title: {{scene.title}}
Description: {{scene.description}}
Lighting: {{scene.lighting}}
Weather/Atmosphere: {{scene.weather}}

═══════════════════════════════════════════════════════════════════════════════
VISUAL CONTEXT
═══════════════════════════════════════════════════════════════════════════════

• Art Style: {{artStyle}}
• Key Visual Elements: {{visualElements}}
• Animation Mode: {{animationModeLabel}}

═══════════════════════════════════════════════════════════════════════════════
TECHNICAL PARAMETERS
═══════════════════════════════════════════════════════════════════════════════

• Scene Duration: {{sceneDuration}} seconds
• Target Shot Count: {{shotCount}} shots
• Pacing: {{pacing}}/100 ({{pacingCategory}})

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

1. Review the full story context above to understand where this scene fits in the overall flow
2. Consider how your shots will flow from previous scenes and transition to upcoming scenes
3. Maintain visual consistency and pacing with shots already composed for earlier scenes
4. Analyze the current scene's atmosphere and visual elements
5. Create {{shotCount}} shots that:
   - Explore different aspects of the scene
   - Sum to EXACTLY {{sceneDuration}} seconds
   - Use appropriate camera movements
   - Flow naturally from one to the next
6. Each shot should be visually specific and filmable

Generate the shot breakdown as JSON now.
```

---

## Input Fields

| Field | Type | Description |
|-------|------|-------------|
| `scene` | `Scene` object | The current scene/segment to compose shots for. Contains: `id`, `videoId`, `sceneNumber`, `title`, `description`, `duration`, `lighting`, `weather`, `videoModel`, `imageModel`, `cameraMotion`, `createdAt` |
| `shotsPerSegment` | `'auto' \| number` | Target number of shots per segment. If `'auto'`, calculated from pacing and scene duration |
| `pacing` | `number` | Pacing value (0-100) determining shot rhythm and duration |
| `animationMode` | `AnimationMode` | Either `"video-animation"` or `"image-transitions"`. Determines available camera movements |
| `artStyle` | `string` (optional) | Art style preference (e.g., "cinematic", "anime", "realistic") |
| `visualElements` | `string[]` (optional) | Array of key visual elements (e.g., ["trees", "mist", "light"]) |
| `videoModel` | `string` (optional) | Video model from step1Data (used for determining supported durations) |
| `allScenes` | `Scene[]` (optional) | All scenes in the video sequence (for understanding full story context and flow). **Must be ordered sequentially by sceneNumber** |
| `existingShots` | `Record<string, Shot[]>` (optional) | Shots already generated for previous scenes (for maintaining consistency and flow). **Shots should be grouped by scene and ordered sequentially** |

**Important:** When both `allScenes` and `existingShots` are provided, the prompt presents them in an interleaved format:
- Scene 1 + its shots (if any)
- Scene 2 + its shots (if any)
- Scene 3 (current scene, no shots yet)
- Scene 4+ (upcoming scenes, no shots yet)

This ordering helps the agent understand the visual progression and flow from one scene to the next.

---

## Output JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["shots", "totalShots", "totalDuration"],
  "properties": {
    "shots": {
      "type": "array",
      "description": "Array of shots within the scene",
      "minItems": 1,
      "maxItems": 10,
      "items": {
        "type": "object",
        "required": ["shotNumber", "shotType", "cameraMovement", "duration", "description"],
        "properties": {
          "shotNumber": {
            "type": "integer",
            "minimum": 1,
            "description": "Sequential shot number within the scene"
          },
          "shotType": {
            "type": "string",
            "enum": [
              "Wide Shot",
              "Extreme Wide Shot",
              "Medium Shot",
              "Medium Wide Shot",
              "Close-Up",
              "Extreme Close-Up",
              "Establishing Shot",
              "Detail Shot"
            ],
            "description": "Type of shot/framing"
          },
          "cameraMovement": {
            "type": "string",
            "description": "Camera movement type (varies by animation mode)"
          },
          "duration": {
            "type": "integer",
            "minimum": 5,
            "maximum": 30,
            "description": "Shot duration in seconds"
          },
          "description": {
            "type": "string",
            "minLength": 30,
            "maxLength": 300,
            "description": "Specific visual description of what the viewer sees"
          }
        }
      }
    },
    "totalShots": {
      "type": "integer",
      "minimum": 1,
      "maximum": 10,
      "description": "Total number of shots generated"
    },
    "totalDuration": {
      "type": "integer",
      "description": "Total duration in seconds (must match sum of all shot durations)"
    }
  },
  "additionalProperties": false
}
```

---

## Example Input/Output

### Example 1: Forest Scene (Video Animation, Slow Pacing)

**Input:**
```json
{
  "scene": {
    "id": "scene-1",
    "title": "Misty Dawn Awakening",
    "description": "The forest emerges from darkness as first light filters through dense mist.",
    "lighting": "soft golden dawn light filtering through mist",
    "weather": "misty, calm",
    "duration": 180
  },
  "artStyle": "cinematic",
  "visualElements": ["trees", "mist", "light"],
  "animationMode": "video-animation",
  "animationModeLabel": "AI Video Generation",
  "sceneDuration": 180,
  "shotCount": 3,
  "pacing": 25,
  "pacingCategory": "slow",
  "supportedDurations": null
}
```

**Output:**
```json
{
  "shots": [
    {
      "shotNumber": 1,
      "shotType": "Extreme Wide Shot",
      "cameraMovement": "gentle-drift",
      "duration": 60,
      "description": "A wide view of the misty forest at dawn. Ancient trees stand as dark silhouettes against the glowing horizon. The camera drifts slowly forward, revealing layers of mist that shift and drift between the trees."
    },
    {
      "shotNumber": 2,
      "shotType": "Medium Shot",
      "cameraMovement": "slow-pan-right",
      "duration": 70,
      "description": "The camera pans slowly across a section of forest where mist hovers just above the ground. Tree trunks emerge from the mist, their bark textures visible in the soft golden light. The pan reveals the depth and layers of the forest."
    },
    {
      "shotNumber": 3,
      "shotType": "Close-Up",
      "cameraMovement": "static",
      "duration": 50,
      "description": "A close view of dewdrops clinging to delicate ferns and fallen leaves. The morning light catches each drop, creating tiny prisms of color. The mist creates a soft, dreamlike quality around the edges of the frame."
    }
  ],
  "totalShots": 3,
  "totalDuration": 180
}
```

---

### Example 2: Urban Scene (Image Transitions, Fast Pacing)

**Input:**
```json
{
  "scene": {
    "id": "scene-2",
    "title": "Neon Night Streets",
    "description": "Rain-slicked streets reflect neon signs in electric blues and purples.",
    "lighting": "neon and streetlamp lighting",
    "weather": "rainy",
    "duration": 45
  },
  "artStyle": "cinematic",
  "visualElements": ["neon", "reflections", "rain"],
  "animationMode": "image-transitions",
  "animationModeLabel": "Image Transitions",
  "sceneDuration": 45,
  "shotCount": 4,
  "pacing": 80,
  "pacingCategory": "fast",
  "supportedDurations": null
}
```

**Output:**
```json
{
  "shots": [
    {
      "shotNumber": 1,
      "shotType": "Wide Shot",
      "cameraMovement": "ken-burns-up",
      "duration": 12,
      "description": "A wide view of rain-slicked streets reflecting neon signs. The Ken Burns effect slowly zooms upward, revealing the full urban landscape with electric blues and purples painting the wet surfaces."
    },
    {
      "shotNumber": 2,
      "shotType": "Medium Shot",
      "cameraMovement": "pan-left",
      "duration": 10,
      "description": "A medium view of a neon sign reflected in a puddle. The camera pans left, following the reflection as it distorts and ripples with the movement of water."
    },
    {
      "shotNumber": 3,
      "shotType": "Close-Up",
      "cameraMovement": "slow-zoom-in",
      "duration": 11,
      "description": "Extreme close-up of raindrops hitting a reflective surface. Each drop creates expanding ripples that catch and scatter the neon light. The zoom intensifies the abstract, painterly quality."
    },
    {
      "shotNumber": 4,
      "shotType": "Detail Shot",
      "cameraMovement": "diagonal-drift",
      "duration": 12,
      "description": "A detail shot of steam rising from a manhole, catching the neon glow. The diagonal drift creates a sense of movement and energy while maintaining the meditative quality."
    }
  ],
  "totalShots": 4,
  "totalDuration": 45
}
```

---

## Quality Checklist

Before accepting Agent 2.2 output, verify:

| Criterion | Check |
|-----------|-------|
| **Shot Count** | Does it match the requested count exactly? |
| **Total Duration** | Does the sum equal the scene duration? |
| **Duration Range** | Are all shots within valid range (5-30s or supported list)? |
| **Shot Type Variety** | Are shot types varied (not all the same)? |
| **Camera Movement Variety** | Are movements varied (not all static)? |
| **Visual Specificity** | Are descriptions specific and filmable? |
| **No Characters** | Are there no people, characters, or actions? |
| **Flow** | Do shots flow naturally from one to the next? |

---

## Downstream Dependencies

This agent's output is consumed by:

| Agent | Fields Used | Purpose |
|-------|-------------|---------|
| 2.3 Continuity Producer | `shots` (all scenes) | Propose continuity groups |
| 3.1 Video Prompt Engineer | `shots` (individual) | Generate image/video prompts |

---

## Implementation Notes

### API Call Structure

```typescript
const systemPrompt = buildShotComposerSystemPrompt(
  shotCount,
  sceneDuration,
  pacing,
  animationMode,
  supportedDurations
);

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  temperature: 0.5,
  response_format: { type: "json_object" },
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: buildShotComposerUserPrompt(input) }
  ]
});

const output = JSON.parse(response.choices[0].message.content);
```

### Validation

```typescript
function validateShotComposerOutput(
  output: ShotComposerOutput,
  expectedShotCount: number,
  expectedDuration: number,
  supportedDurations?: number[]
): boolean {
  // Check required fields
  if (!output.shots || !Array.isArray(output.shots)) return false;
  if (output.totalShots !== output.shots.length) return false;
  
  // Check shot count
  if (output.shots.length !== expectedShotCount) return false;
  
  // Check total duration
  const sumDuration = output.shots.reduce((sum, s) => sum + s.duration, 0);
  if (sumDuration !== expectedDuration) return false;
  
  // Check each shot
  const validShotTypes = [
    "Wide Shot", "Extreme Wide Shot", "Medium Shot", "Medium Wide Shot",
    "Close-Up", "Extreme Close-Up", "Establishing Shot", "Detail Shot"
  ];
  
  for (const shot of output.shots) {
    // Check duration
    if (supportedDurations && supportedDurations.length > 0) {
      if (!supportedDurations.includes(shot.duration)) return false;
    } else {
      if (shot.duration < 5 || shot.duration > 30) return false;
    }
    
    // Check shot type
    if (!validShotTypes.includes(shot.shotType)) return false;
    
    // Check description
    if (!shot.description || shot.description.length < 30) return false;
    
    // Check shot number
    if (shot.shotNumber < 1) return false;
  }
  
  // Check shot numbers are sequential
  const shotNumbers = output.shots.map(s => s.shotNumber).sort();
  for (let i = 0; i < shotNumbers.length; i++) {
    if (shotNumbers[i] !== i + 1) return false;
  }
  
  return true;
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-29 | Initial comprehensive prompt |

