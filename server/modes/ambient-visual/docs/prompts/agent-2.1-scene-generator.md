# Agent 2.1: Scene Generator

## Overview

| Attribute | Value |
|-----------|-------|
| **Role** | Ambient Video Architect |
| **Type** | AI Text Model (Structured Generation) |
| **Models** | GPT-4o, Claude 3.5 Sonnet |
| **Temperature** | 0.5 (balanced: creative yet structured) |
| **Purpose** | Break down mood description into distinct visual segments/scenes |

### Critical Mission

This agent transforms the atmospheric mood description into a structured sequence of visual segments. Each segment represents a distinct moment in the ambient journey, with specific duration, lighting, and atmospheric conditions.

---

## System Prompt

```
═══════════════════════════════════════════════════════════════════════════════
SYSTEM: AGENT 2.1 — SCENE GENERATOR
═══════════════════════════════════════════════════════════════════════════════

You are an expert ambient video architect specializing in creating meditative, atmospheric visual experiences.
Your task is to break down an atmospheric mood description into {{segmentCount}} distinct visual SEGMENTS for a {{durationMinutes}}-minute ambient video.

═══════════════════════════════════════════════════════════════════════════════
AMBIENT VISUAL PHILOSOPHY
═══════════════════════════════════════════════════════════════════════════════

Unlike narrative videos, ambient visuals are about:
• Creating a continuous, immersive atmosphere
• Gradual visual evolution and mood progression
• Meditative, calming transitions between moments
• Environmental storytelling through visual elements alone
• Seamless looping capability (end flows back to beginning)

═══════════════════════════════════════════════════════════════════════════════
PACING STYLE: {{pacingCategory}} ({{pacing}}/100)
═══════════════════════════════════════════════════════════════════════════════

{{#if slow}}
SLOW PACING CHARACTERISTICS:
• Fewer segments with longer, contemplative moments
• Each segment holds for {{avgDuration}}+ seconds
• Subtle, gradual changes within segments
• Deep immersion in each atmosphere
• Perfect for: meditation, sleep, deep focus
{{/if}}

{{#if fast}}
FAST PACING CHARACTERISTICS:
• More segments with quicker visual changes
• Each segment ~{{avgDuration}} seconds
• More variety in visual content
• Dynamic transitions between atmospheres
• Perfect for: creative work, ambient entertainment
{{/if}}

{{#if medium}}
MEDIUM PACING CHARACTERISTICS:
• Balanced segment duration (~{{avgDuration}} seconds)
• Natural rhythm of visual changes
• Good mix of immersion and variety
• Perfect for: general relaxation, background ambiance
{{/if}}

═══════════════════════════════════════════════════════════════════════════════
ANIMATION MODE: {{animationModeLabel}}
═══════════════════════════════════════════════════════════════════════════════

{{#if videoAnimation}}
Each segment will be converted to AI-generated video clips.
• Consider natural motion possibilities (water flowing, leaves rustling, clouds drifting)
• Suggest camera movements (slow pan, gentle drift, static with motion elements)
• Think about what would animate beautifully
{{/if}}

{{#if imageTransitions}}
Each segment will use static images with motion effects (Ken Burns, pan, zoom).
• Focus on compositionally strong images
• Consider how zoom and pan effects would work
• Think about visual depth for parallax effects
{{/if}}

═══════════════════════════════════════════════════════════════════════════════
SEGMENT STRUCTURE REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

OPENING SEGMENT (First segment):
• Set the initial atmosphere and mood
• Establish the visual world
• Should feel like an invitation into the experience

MIDDLE SEGMENTS:
• Each segment should have ONE primary visual focus
• Progress through variations of the theme/mood
• Create visual interest through subtle evolution
• Maintain atmospheric consistency while adding variety

CLOSING SEGMENT (Last segment):
• Should naturally flow back to the opening (for looping)
• Conclude the visual journey gracefully
• Consider how it would transition to segment 1

═══════════════════════════════════════════════════════════════════════════════
CRITICAL CONSTRAINTS
═══════════════════════════════════════════════════════════════════════════════

MUST:
✓ Generate EXACTLY {{segmentCount}} segments
✓ Total duration = EXACTLY {{totalDuration}} seconds
✓ Each segment: 15-120 seconds (adjust based on pacing)
✓ Average duration target: ~{{avgDuration}} seconds per segment
✓ Each segment has a unique, evocative title
✓ Descriptions focus on VISUAL elements (not narrative)

NEVER:
✗ Include dialogue, narration, or story beats
✗ Reference specific characters or actions
✗ Create segments shorter than 15 seconds
✗ Create segments longer than 120 seconds
✗ Skip any part of the mood description's atmosphere

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY valid JSON with this exact structure:
{
  "segments": [
    {
      "sceneNumber": 1,
      "title": "<evocative 2-4 word title>",
      "description": "<detailed visual description, 2-3 sentences>",
      "duration": <seconds>,
      "lighting": "<lighting description>",
      "weather": "<weather/atmospheric conditions>"
    }
  ],
  "totalSegments": {{segmentCount}},
  "totalDuration": {{totalDuration}}
}
```

---

## User Prompt Template

```
═══════════════════════════════════════════════════════════════════════════════
AMBIENT VISUAL SEGMENT BREAKDOWN REQUEST
═══════════════════════════════════════════════════════════════════════════════

MOOD DESCRIPTION (the atmosphere to visualize):
"""
{{moodDescription}}
"""

═══════════════════════════════════════════════════════════════════════════════
ATMOSPHERE SETTINGS
═══════════════════════════════════════════════════════════════════════════════

• Theme: {{theme}}
• Primary Mood: {{mood}}
• Visual Rhythm: {{visualRhythm}}
• Art Style: {{artStyle}}
{{#if visualElements}}
• Key Visual Elements: {{visualElements.join(', ')}}
{{/if}}

═══════════════════════════════════════════════════════════════════════════════
TECHNICAL PARAMETERS
═══════════════════════════════════════════════════════════════════════════════

• Total Duration: {{totalDurationSeconds}} seconds ({{duration}})
• Target Segment Count: {{segmentCount}} segments
• Pacing: {{pacing}}/100 ({{pacingCategory}})
• Animation Mode: {{animationModeLabel}}

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

1. Read the mood description carefully
2. Identify natural visual transitions and evolution points
3. Create {{segmentCount}} segments that:
   - Flow smoothly from one to the next
   - Capture different aspects/moments of the atmosphere
   - Sum to EXACTLY {{totalDurationSeconds}} seconds
   - Enable seamless looping (last → first)
4. Each description should paint a vivid visual picture

Generate the segment breakdown as JSON now.
```

---

## Output JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["segments", "totalSegments", "totalDuration"],
  "properties": {
    "segments": {
      "type": "array",
      "description": "Array of visual segments",
      "minItems": 2,
      "maxItems": 30,
      "items": {
        "type": "object",
        "required": ["sceneNumber", "title", "description", "duration", "lighting", "weather"],
        "properties": {
          "sceneNumber": {
            "type": "integer",
            "minimum": 1,
            "description": "Sequential segment number"
          },
          "title": {
            "type": "string",
            "minLength": 2,
            "maxLength": 50,
            "description": "Evocative 2-4 word title for the segment"
          },
          "description": {
            "type": "string",
            "minLength": 50,
            "maxLength": 500,
            "description": "Detailed visual description, 2-3 sentences"
          },
          "duration": {
            "type": "integer",
            "minimum": 15,
            "maximum": 120,
            "description": "Segment duration in seconds"
          },
          "lighting": {
            "type": "string",
            "description": "Lighting description (e.g., 'soft dawn light', 'dramatic shadows')"
          },
          "weather": {
            "type": "string",
            "description": "Weather/atmospheric conditions (e.g., 'clear', 'misty', 'gentle rain')"
          }
        }
      }
    },
    "totalSegments": {
      "type": "integer",
      "minimum": 2,
      "maximum": 30,
      "description": "Total number of segments generated"
    },
    "totalDuration": {
      "type": "integer",
      "description": "Total duration in seconds (must match sum of all segment durations)"
    }
  },
  "additionalProperties": false
}
```

---

## Example Input/Output

### Example 1: Calm Forest Dawn (Slow Pacing)

**Input:**
```json
{
  "moodDescription": "The gentle break of dawn filters through a misty forest...",
  "theme": "nature",
  "mood": "calm",
  "visualRhythm": "breathing",
  "artStyle": "cinematic",
  "visualElements": ["trees", "mist", "light"],
  "duration": "10min",
  "totalDurationSeconds": 600,
  "segmentCount": 4,
  "pacing": 25,
  "pacingCategory": "slow",
  "animationMode": "video-animation",
  "animationModeLabel": "AI Video Generation"
}
```

**Output:**
```json
{
  "segments": [
    {
      "sceneNumber": 1,
      "title": "Misty Dawn Awakening",
      "description": "The forest emerges from darkness as first light filters through dense mist. Ancient tree trunks stand as dark silhouettes against the glowing horizon. The mist hovers low, creating layers of depth that shift imperceptibly.",
      "duration": 180,
      "lighting": "soft golden dawn light filtering through mist",
      "weather": "misty, calm"
    },
    {
      "sceneNumber": 2,
      "title": "Light Through Canopy",
      "description": "The sun rises higher, casting dappled light through the spring canopy. Individual leaves catch and refract the warm rays, creating a mosaic of green and gold. The mist begins to lift, revealing more detail in the undergrowth.",
      "duration": 150,
      "lighting": "dappled sunlight through leaves",
      "weather": "clearing mist"
    },
    {
      "sceneNumber": 3,
      "title": "Forest Floor Details",
      "description": "A close view of the forest floor where dewdrops cling to delicate ferns and fallen leaves. The morning light catches each drop, creating tiny prisms of color. The texture of bark, moss, and earth becomes the focus.",
      "duration": 120,
      "lighting": "warm side lighting highlighting textures",
      "weather": "clear, dewy"
    },
    {
      "sceneNumber": 4,
      "title": "Full Morning Light",
      "description": "The forest is now fully illuminated, with soft shadows creating depth and dimension. The scene returns to a wider view, showing the complete transformation from dawn to morning. This moment naturally flows back to the misty beginning.",
      "duration": 150,
      "lighting": "full soft morning light",
      "weather": "clear, bright"
    }
  ],
  "totalSegments": 4,
  "totalDuration": 600
}
```

---

## Quality Checklist

Before accepting Agent 2.1 output, verify:

| Criterion | Check |
|-----------|-------|
| **Segment Count** | Does it match the requested count exactly? |
| **Total Duration** | Does the sum equal the target duration? |
| **Duration Range** | Are all segments between 15-120 seconds? |
| **Visual Focus** | Does each segment have a clear visual focus? |
| **Flow** | Do segments flow naturally from one to the next? |
| **Loop Capability** | Does the last segment flow back to the first? |
| **No Narrative** | Are there no characters, dialogue, or story elements? |
| **Atmospheric Consistency** | Do all segments maintain the mood description's atmosphere? |

---

## Downstream Dependencies

This agent's output is consumed by:

| Agent | Fields Used | Purpose |
|-------|-------------|---------|
| 2.2 Shot Composer | `segments` (each scene) | Generate shots within each segment |
| 3.1 Video Prompt Engineer | `segments` (via shots) | Generate prompts for each shot |

---

## Implementation Notes

### API Call Structure

```typescript
const systemPrompt = buildSceneGeneratorSystemPrompt(
  durationSeconds,
  segmentCount,
  pacing,
  animationMode
);

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  temperature: 0.5,
  response_format: { type: "json_object" },
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: buildSceneGeneratorUserPrompt(input) }
  ]
});

const output = JSON.parse(response.choices[0].message.content);
```

### Validation

```typescript
function validateSceneGeneratorOutput(output: SceneGeneratorOutput): boolean {
  // Check required fields
  if (!output.segments || !Array.isArray(output.segments)) return false;
  if (output.totalSegments !== output.segments.length) return false;
  
  // Check segment count matches request
  if (output.segments.length !== expectedSegmentCount) return false;
  
  // Check total duration
  const sumDuration = output.segments.reduce((sum, s) => sum + s.duration, 0);
  if (sumDuration !== expectedTotalDuration) return false;
  
  // Check each segment
  for (const segment of output.segments) {
    if (segment.duration < 15 || segment.duration > 120) return false;
    if (!segment.title || segment.title.length < 2) return false;
    if (!segment.description || segment.description.length < 50) return false;
    if (segment.sceneNumber < 1) return false;
  }
  
  // Check scene numbers are sequential
  const sceneNumbers = output.segments.map(s => s.sceneNumber).sort();
  for (let i = 0; i < sceneNumbers.length; i++) {
    if (sceneNumbers[i] !== i + 1) return false;
  }
  
  return true;
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-29 | Initial comprehensive prompt |

