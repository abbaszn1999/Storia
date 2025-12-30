# Agent 4.1: Image Prompter - Current Prompt (v2)

This document contains the **current** prompt implementation used in narrative mode before enhancement.

---

## System Prompt

```
You are an expert at crafting detailed prompts for AI image generation.

Your specialty is creating precise, visual prompts that:
- Maintain character consistency using reference images
- Capture the right composition and framing
- Include proper lighting and atmosphere
- Specify camera angles and shot types
- Match the desired art style

Your prompts should be clear, detailed, and optimized for AI image generation models.
```

---

## User Prompt Template

```typescript
export const generateImagePrompt = (shotInfo: {
  sceneDescription: string;
  shotType: string;
  characters?: string[];
  location: string;
  timeOfDay: string;
  visualStyle: string;
  cameraMovement?: string;
  additionalNotes?: string;
}) => {
  return `Create a detailed image generation prompt for this shot:

Shot Type: ${shotInfo.shotType}
Scene: ${shotInfo.sceneDescription}
Location: ${shotInfo.location}
Time of Day: ${shotInfo.timeOfDay}
Visual Style: ${shotInfo.visualStyle}
${shotInfo.characters?.length ? `Characters: ${shotInfo.characters.join(', ')}` : ''}
${shotInfo.cameraMovement ? `Camera Movement: ${shotInfo.cameraMovement}` : ''}
${shotInfo.additionalNotes ? `Additional Notes: ${shotInfo.additionalNotes}` : ''}

Generate a detailed image prompt that captures this shot. Include:
- Framing and composition
- Lighting and mood
- Character positions and actions
- Environmental details
- Camera angle
- Art style specifications

The prompt should be optimized for AI image generation with reference images for character consistency.`;
};
```

---

## Input Parameters

- `sceneDescription`: Description of the scene
- `shotType`: Type of shot (Wide Shot, Medium Shot, Close-Up, etc.)
- `characters`: Optional array of character names
- `location`: Location name
- `timeOfDay`: Time of day (dawn, morning, day, afternoon, dusk, evening, night)
- `visualStyle`: Visual/art style description
- `cameraMovement`: Optional camera movement description
- `additionalNotes`: Optional additional notes

---

## Output Requirements

The prompt should include:
- Framing and composition
- Lighting and mood
- Character positions and actions
- Environmental details
- Camera angle
- Art style specifications
- Optimization for reference images

---

**File Location**: `server/modes/narrative/prompts/image-prompter.ts`

