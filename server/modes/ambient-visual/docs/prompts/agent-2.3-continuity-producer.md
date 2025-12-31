# Agent 2.3: Continuity Producer

## Overview

| Attribute | Value |
|-----------|-------|
| **Role** | Video Editor & Continuity Specialist |
| **Type** | AI Text Model (Analysis) |
| **Models** | GPT-5|
| **Temperature** | 0.4 (analytical, precise) |
| **Purpose** | Analyze shots and propose continuity groups for seamless visual flow |

### Critical Mission

This agent identifies sequences of shots that should be visually connected in Start-End Frame mode. When shots are in a continuity group, the end frame of one shot matches the start frame of the next, creating seamless transitions.

**Note:** Only used in Start-End Frame video generation mode.

---

## System Prompt

```
═══════════════════════════════════════════════════════════════════════════════
SYSTEM: AGENT 2.3 — CONTINUITY PRODUCER
═══════════════════════════════════════════════════════════════════════════════

You are an expert video editor and continuity specialist for ambient visual content.
Your task is to analyze a sequence of shots and propose CONTINUITY GROUPS - sets of 2-5 consecutive shots that should be visually connected.

═══════════════════════════════════════════════════════════════════════════════
WHAT IS A CONTINUITY GROUP?
═══════════════════════════════════════════════════════════════════════════════

A continuity group is a sequence of shots where:
• The END frame of shot N should match the START frame of shot N+1
• Visual elements flow naturally between shots
• Camera movement continues logically
• The viewer experiences a seamless visual journey

This is used in START-END FRAME video generation mode, where each shot has:
• A START frame (beginning of the shot)
• An END frame (end of the shot)

When shots are in a continuity group:
• Shot 1's END frame = Shot 2's START frame
• Shot 2's END frame = Shot 3's START frame
• And so on...

═══════════════════════════════════════════════════════════════════════════════
TRANSITION TYPES
═══════════════════════════════════════════════════════════════════════════════

• flow - Smooth camera movement continuation
• pan - Continuous panning across scene
• zoom - Zoom in/out continuation
• match-cut - Visual element matching between shots
• environment - Same environment, different angle
• light-transition - Following light movement (sun, shadows)

WHEN TO USE EACH:

• flow: Camera smoothly continues its movement (pan continues into next shot)
• pan: Wide panoramic movement connecting different areas of the scene
• zoom: Zoom in continues into detail, or zoom out reveals more context
• match-cut: Visual element in end frame matches element in start frame
• environment: Same location from different perspectives
• light-transition: Following natural light movement (sunrise, shadows)

═══════════════════════════════════════════════════════════════════════════════
GROUPING GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

GOOD CANDIDATES FOR CONTINUITY GROUPS:
✓ Shots with complementary camera movements
✓ Shots exploring the same visual area
✓ Shots with similar lighting and mood
✓ Shots that could logically connect visually
✓ Shots with matching visual elements at boundaries

NOT GOOD FOR CONTINUITY GROUPS:
✗ Shots with drastically different environments
✗ Shots with opposing moods/lighting
✗ Shots where visual disconnect is intentional
✗ First and last shots of different scenes

═══════════════════════════════════════════════════════════════════════════════
GROUP SIZE RULES
═══════════════════════════════════════════════════════════════════════════════

• Minimum: 2 shots per group (a single connection)
• Maximum: 5 shots per group (maintain manageability)
• Ideal: 2-4 shots per group

Not every shot needs to be in a group! Leave standalone shots when:
• The shot is a distinct moment
• A visual break is appropriate
• The transition would be too jarring

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY valid JSON with this structure:
{
  "sceneGroups": [
    {
      "sceneId": "<actual scene ID>",
      "groups": [
        {
          "groupNumber": 1,
          "shotIds": ["shot-id-1", "shot-id-2", "shot-id-3"],
          "transitionType": "<from transition types>",
          "description": "<why these shots connect well>"
        }
      ]
    }
  ],
  "analysis": "<brief overall continuity analysis>"
}

IMPORTANT:
• Each scene gets its own entry in the sceneGroups array with its sceneId
• Group shots by their sceneId (shots only connect within same scene)
• Use actual shot IDs provided in the input
• Shots must be CONSECUTIVE (no gaps in shotIds within a group)
• Same shot cannot be in multiple groups
```

---

## User Prompt Template

```
═══════════════════════════════════════════════════════════════════════════════
CONTINUITY ANALYSIS REQUEST
═══════════════════════════════════════════════════════════════════════════════

Analyze the following scenes and shots to propose continuity groups.
Remember: You're identifying shots that should have connected START/END frames.

═══════════════════════════════════════════════════════════════════════════════
SCENE: {{scene.title}} (ID: {{scene.id}})
Description: {{scene.description}}
Lighting: {{scene.lighting}}
Duration: {{scene.duration}} seconds
═══════════════════════════════════════════════════════════════════════════════

SHOTS IN THIS SCENE:

{{#each sceneShots}}
┌─────────────────────────────────────────────────────────────────────────────┐
│ Shot {{shotNumber}} (ID: {{id}})
│ Type: {{shotType}}
│ Camera Movement: {{cameraMovement}}
│ Duration: {{duration}} seconds
│ Description: {{description}}
└─────────────────────────────────────────────────────────────────────────────┘
{{/each}}

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

1. Review each scene's shots in sequence
2. Identify consecutive shots that would benefit from frame continuity
3. Group them by the most appropriate transition type
4. Provide a brief description of why each group connects well
5. Remember: Not all shots need to be grouped!

IMPORTANT REMINDERS:
• Only group shots WITHIN the same scene
• Shots must be consecutive (no gaps)
• Use the exact shot IDs provided
• Group size: 2-5 shots maximum

Generate the continuity proposal as JSON now.
```

---

## Input Fields

| Field | Type | Description |
|-------|------|-------------|
| `scenes` | `Scene[]` | Array of all scenes/segments to analyze for continuity |
| `shots` | `Record<string, Shot[]>` | Object mapping scene IDs to arrays of shots within each scene. Each shot contains: `id`, `shotNumber`, `shotType`, `cameraMovement`, `duration`, `description` |

**Note:** Only used in Start-End Frame video generation mode.

---

## Output JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["sceneGroups", "analysis"],
  "properties": {
    "sceneGroups": {
      "type": "array",
      "description": "Continuity groups organized by scene",
      "items": {
        "type": "object",
        "required": ["sceneId", "groups"],
        "properties": {
          "sceneId": {
            "type": "string",
            "description": "The scene ID these groups belong to"
          },
          "groups": {
            "type": "array",
            "description": "Continuity groups within this scene",
            "items": {
              "type": "object",
              "required": ["groupNumber", "shotIds", "transitionType", "description"],
              "properties": {
                "groupNumber": {
                  "type": "integer",
                  "minimum": 1,
                  "description": "Sequential group number within the scene"
                },
                "shotIds": {
                  "type": "array",
                  "description": "Array of shot IDs in this continuity group",
                  "minItems": 2,
                  "maxItems": 5,
                  "items": {
                    "type": "string"
                  }
                },
                "transitionType": {
                  "type": "string",
                  "enum": [
                    "flow",
                    "pan",
                    "zoom",
                    "match-cut",
                    "environment",
                    "light-transition"
                  ],
                  "description": "Type of transition connecting these shots"
                },
                "description": {
                  "type": "string",
                  "minLength": 50,
                  "maxLength": 300,
                  "description": "Explanation of why these shots connect well"
                }
              }
            }
          }
        }
      }
    },
    "analysis": {
      "type": "string",
      "minLength": 100,
      "maxLength": 500,
      "description": "Brief overall continuity analysis of all scenes"
    }
  },
  "additionalProperties": false
}
```

---

## Example Input/Output

### Example 1: Forest Scene with Continuity

**Input:**
```json
{
  "scenes": [
    {
      "id": "scene-1",
      "title": "Misty Dawn Awakening",
      "description": "The forest emerges from darkness as first light filters through dense mist.",
      "lighting": "soft golden dawn light",
      "duration": 180
    }
  ],
  "shots": {
    "scene-1": [
      {
        "id": "shot-1",
        "shotNumber": 1,
        "shotType": "Extreme Wide Shot",
        "cameraMovement": "gentle-drift",
        "duration": 60,
        "description": "A wide view of the misty forest at dawn, camera drifts slowly forward."
      },
      {
        "id": "shot-2",
        "shotNumber": 2,
        "shotType": "Medium Shot",
        "cameraMovement": "slow-pan-right",
        "duration": 70,
        "description": "Camera pans slowly across forest where mist hovers above ground."
      },
      {
        "id": "shot-3",
        "shotNumber": 3,
        "shotType": "Close-Up",
        "cameraMovement": "static",
        "duration": 50,
        "description": "Close view of dewdrops on ferns, morning light catches each drop."
      }
    ]
  }
}
```

**Output:**
```json
{
  "sceneGroups": [
    {
      "sceneId": "scene-1",
      "groups": [
        {
          "groupNumber": 1,
          "shotIds": ["shot-1", "shot-2"],
          "transitionType": "flow",
          "description": "The gentle drift forward in shot 1 naturally flows into the pan-right movement of shot 2. Both shots explore the same misty forest environment with similar lighting, creating a seamless visual continuation as the camera movement evolves."
        }
      ]
    }
  ],
  "analysis": "The forest scene has strong continuity potential between shots 1 and 2, which share the same environment and complementary camera movements. Shot 3 stands alone as a distinct detail moment that provides visual variety. The overall flow maintains atmospheric consistency while allowing for natural visual progression."
}
```

---

### Example 2: Multiple Scenes with Mixed Continuity

**Input:**
```json
{
  "scenes": [
    {
      "id": "scene-1",
      "title": "Dawn Forest",
      "description": "Misty forest at dawn",
      "lighting": "soft golden light",
      "duration": 120
    },
    {
      "id": "scene-2",
      "title": "Morning Light",
      "description": "Forest in full morning light",
      "lighting": "bright morning light",
      "duration": 90
    }
  ],
  "shots": {
    "scene-1": [
      {
        "id": "shot-1",
        "shotNumber": 1,
        "shotType": "Wide Shot",
        "cameraMovement": "slow-pan-left",
        "duration": 40,
        "description": "Wide pan across misty forest."
      },
      {
        "id": "shot-2",
        "shotNumber": 2,
        "shotType": "Medium Shot",
        "cameraMovement": "slow-pan-left",
        "duration": 40,
        "description": "Continuing pan through forest."
      },
      {
        "id": "shot-3",
        "shotNumber": 3,
        "shotType": "Close-Up",
        "cameraMovement": "static",
        "duration": 40,
        "description": "Static close-up of tree bark."
      }
    ],
    "scene-2": [
      {
        "id": "shot-4",
        "shotNumber": 1,
        "shotType": "Wide Shot",
        "cameraMovement": "gentle-drift",
        "duration": 45,
        "description": "Wide view of sunlit forest."
      },
      {
        "id": "shot-5",
        "shotNumber": 2,
        "shotType": "Medium Shot",
        "cameraMovement": "gentle-drift",
        "duration": 45,
        "description": "Drifting through sunlit trees."
      }
    ]
  }
}
```

**Output:**
```json
{
  "sceneGroups": [
    {
      "sceneId": "scene-1",
      "groups": [
        {
          "groupNumber": 1,
          "shotIds": ["shot-1", "shot-2"],
          "transitionType": "pan",
          "description": "Both shots use slow-pan-left movement, creating a continuous panoramic exploration of the misty forest. The pan naturally continues from shot 1 to shot 2, maintaining the same environment and lighting."
        }
      ]
    },
    {
      "sceneId": "scene-2",
      "groups": [
        {
          "groupNumber": 1,
          "shotIds": ["shot-4", "shot-5"],
          "transitionType": "flow",
          "description": "The gentle drift movement flows seamlessly from shot 4 to shot 5, both exploring the sunlit forest environment. The camera movement creates a natural continuation as it drifts through the scene."
        }
      ]
    }
  ],
  "analysis": "Scene 1 has a strong continuity group with shots 1-2 using continuous pan movement. Shot 3 stands alone as a detail moment. Scene 2 has a continuity group with shots 4-5 using flowing drift movement. The scenes themselves are distinct (dawn vs. morning), so no cross-scene continuity is proposed."
}
```

---

## Quality Checklist

Before accepting Agent 2.3 output, verify:

| Criterion | Check |
|-----------|-------|
| **Scene Coverage** | Are all scenes with shots represented? |
| **Group Size** | Are all groups 2-5 shots? |
| **Consecutive Shots** | Are shot IDs consecutive within each group? |
| **No Duplicates** | Is each shot ID in at most one group? |
| **Valid Transition Types** | Are transition types from the allowed list? |
| **Scene Boundaries** | Are shots only grouped within the same scene? |
| **Description Quality** | Do descriptions explain why shots connect? |
| **Analysis Present** | Is there an overall analysis? |

---

## Downstream Dependencies

This agent's output is consumed by:

| Agent | Fields Used | Purpose |
|-------|-------------|---------|
| 3.1 Video Prompt Engineer | `sceneGroups` | Generate connected start/end frames |
| UI Flow Design | `sceneGroups` | Display continuity connections to user |

---

## Implementation Notes

### API Call Structure

```typescript
const systemPrompt = buildContinuityProducerSystemPrompt();

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  temperature: 0.4,
  response_format: { type: "json_object" },
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: buildContinuityProducerUserPrompt(input) }
  ]
});

const output = JSON.parse(response.choices[0].message.content);
```

### Validation

```typescript
function validateContinuityProducerOutput(
  output: ContinuityProducerOutput,
  scenes: Scene[],
  shots: Record<string, Shot[]>
): boolean {
  // Check required fields
  if (!output.sceneGroups || !Array.isArray(output.sceneGroups)) return false;
  if (!output.analysis || output.analysis.length < 100) return false;
  
  const validTransitionTypes = [
    "flow", "pan", "zoom", "match-cut", "environment", "light-transition"
  ];
  
  const allShotIds = new Set<string>();
  
  // Validate each scene group
  for (const sceneGroup of output.sceneGroups) {
    // Check scene exists
    const scene = scenes.find(s => s.id === sceneGroup.sceneId);
    if (!scene) return false;
    
    // Check groups array
    if (!sceneGroup.groups || !Array.isArray(sceneGroup.groups)) return false;
    
    // Get shots for this scene
    const sceneShots = shots[sceneGroup.sceneId] || [];
    const sceneShotIds = new Set(sceneShots.map(s => s.id));
    
    // Validate each group
    for (const group of sceneGroup.groups) {
      // Check group size
      if (group.shotIds.length < 2 || group.shotIds.length > 5) return false;
      
      // Check transition type
      if (!validTransitionTypes.includes(group.transitionType)) return false;
      
      // Check shot IDs exist and are in this scene
      for (const shotId of group.shotIds) {
        if (!sceneShotIds.has(shotId)) return false;
        if (allShotIds.has(shotId)) return false; // No duplicates
        allShotIds.add(shotId);
      }
      
      // Check shots are consecutive
      const shotNumbers = group.shotIds
        .map(id => sceneShots.find(s => s.id === id)?.shotNumber)
        .filter((n): n is number => n !== undefined)
        .sort((a, b) => a - b);
      
      for (let i = 1; i < shotNumbers.length; i++) {
        if (shotNumbers[i] !== shotNumbers[i - 1] + 1) return false;
      }
      
      // Check description
      if (!group.description || group.description.length < 50) return false;
    }
  }
  
  return true;
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-29 | Initial comprehensive prompt |

