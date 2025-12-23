# Phase 4: Composition Backend Implementation

## Overview

Phase 4 (Composition) is where users generate images and videos for each shot created in Phase 3 (Flow Design). This document covers the complete backend implementation for **Video Animation Mode**.

**Mode Specificity**: The agents documented here are specific to Video Animation mode. Image Transitions mode uses a separate FFmpeg-based processor (Agent 4.4).

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [Agent 4.1: Video Prompt Engineer](#agent-41-video-prompt-engineer)
4. [Agent 4.2: Video Image Generator](#agent-42-video-image-generator)
5. [Agent 4.3: Video Clip Generator](#agent-43-video-clip-generator)
6. [Start-End Frame Logic](#start-end-frame-logic)
7. [API Endpoints](#api-endpoints)
8. [Database Structure](#database-structure)
9. [CDN Storage Integration](#cdn-storage-integration)
10. [Frontend Integration](#frontend-integration)
11. [Complete Flow Diagram](#complete-flow-diagram)

---

## Architecture Overview

Phase 4 uses **3 AI agents** triggered as **separate manual steps**, giving users control to review and edit prompts between each generation stage:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 4: COMPOSITION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │  Agent 4.1      │     │  Agent 4.2      │     │  Agent 4.3      │       │
│  │  Video Prompt   │ ──▶ │  Video Image    │ ──▶ │  Video Clip     │       │
│  │  Engineer       │     │  Generator      │     │  Generator      │       │
│  │                 │     │                 │     │                 │       │
│  │  (Text Gen)     │     │  (Runware I2I)  │     │  (Runware I2V)  │       │
│  │  OpenAI GPT-5   │     │  FLUX/Imagen    │     │  Kling/Veo/Sora │       │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│          │                       │                       │                 │
│          ▼                       ▼                       ▼                 │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │  JSON Output    │     │  Bunny CDN URL  │     │  Bunny CDN URL  │       │
│  │  - imagePrompt  │     │  - startFrame   │     │  - videoUrl     │       │
│  │  - videoPrompt  │     │  - endFrame     │     │  - duration     │       │
│  │  - negativeP.   │     │                 │     │                 │       │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│                                                                             │
│                        All saved to step4Data (JSON)                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why Separate Steps?

1. **User Control**: Users can review and edit AI-generated prompts before image generation
2. **Cost Efficiency**: Users only generate images/videos for shots they're satisfied with
3. **Iterative Refinement**: Users can regenerate just the prompt, or just the image, without redoing everything
4. **Error Recovery**: If video generation fails, the image is preserved

---

## File Structure

```
server/modes/ambient-visual/
├── agents/
│   ├── index.ts                      # Export all agents
│   ├── mood-description-generator.ts # Phase 1 (existing)
│   ├── scene-generator.ts            # Phase 3 (existing)
│   ├── shot-composer.ts              # Phase 3 (existing)
│   ├── continuity-producer.ts        # Phase 3 (existing)
│   ├── video-prompt-engineer.ts      # Phase 4 Agent 4.1 (NEW)
│   ├── video-image-generator.ts      # Phase 4 Agent 4.2 (NEW)
│   └── video-clip-generator.ts       # Phase 4 Agent 4.3 (NEW)
├── prompts/
│   ├── atmosphere-prompts.ts                  # Phase 1 (existing)
│   ├── flow-scene-generator-prompts.ts        # Phase 3 (existing)
│   ├── flow-shot-composer-prompts.ts          # Phase 3 (existing)
│   ├── flow-continuity-producer-prompts.ts    # Phase 3 (existing)
│   ├── video-prompt-engineer-prompts.ts       # Phase 4 (NEW)
│   └── video-clip-generator-prompts.ts        # Phase 4 (NEW)
├── routes/
│   └── index.ts                      # Add composition endpoints
├── services/
│   └── index.ts                      # Utility functions
├── types.ts                          # Add Step4Data types
├── config.ts                         
└── index.ts                          
```

---

## Agent 4.1: Video Prompt Engineer

### Purpose

Generates optimized prompts for image and video generation based on shot descriptions, visual style settings, and scene context.

### File: `video-prompt-engineer.ts`

### Input Interface

```typescript
interface VideoPromptEngineerInput {
  // Shot context
  shotId: string;
  shotDescription: string;
  shotType: string;           // "Wide Shot", "Close-up", etc.
  cameraMovement: string;     // "Static", "Pan Left", "Dolly In", etc.
  shotDuration: number;       // in seconds
  
  // Scene context
  sceneId: string;
  sceneTitle: string;
  sceneDescription: string;
  
  // From Step 1 (Atmosphere)
  moodDescription: string;
  mood: string;               // "calm", "mysterious", etc.
  theme: string;              // "nature", "urban", etc.
  timeContext: string;        // "dawn", "night", etc.
  season: string;             // "spring", "winter", etc.
  aspectRatio: string;        // "16:9", "9:16", etc.
  
  // From Step 2 (Visual World)
  artStyle: string;           // "cinematic", "anime", etc.
  visualElements: string[];   // ["Mountains", "Ocean", etc.]
  visualRhythm: string;       // "constant", "breathing", etc.
  referenceImageUrls?: string[];
  imageCustomInstructions?: string;
  
  // Video Animation specific
  animationMode: 'video-animation';
  videoGenerationMode: 'image-reference' | 'start-end-frame';
  motionPrompt?: string;      // Global motion instructions from Step 1
  cameraMotion?: string;      // "slow-pan", "gentle-drift", etc.
  
  // For connected shots (Start-End Frame mode)
  isFirstInGroup?: boolean;
  isConnectedShot?: boolean;
  previousShotEndFrameUrl?: string;
}
```

### Output Interface (JSON Schema)

```typescript
interface VideoPromptEngineerOutput {
  imagePrompt: string;        // Main image generation prompt
  videoPrompt: string;        // Motion/animation instructions
  negativePrompt: string;     // Elements to avoid
  startFramePrompt: string;   // Specific prompt for start frame
  endFramePrompt: string;     // Specific prompt for end frame
}
```

### JSON Schema Configuration

```typescript
text: {
  format: {
    type: "json_schema",
    name: "video_prompt_engineer_output",
    strict: true,
    schema: {
      type: "object",
      properties: {
        imagePrompt: {
          type: "string",
          description: "Optimized prompt for image generation. Should include art style, lighting, composition, and visual details."
        },
        videoPrompt: {
          type: "string",
          description: "Motion and animation instructions for video generation. Describes camera movement, subject motion, and atmospheric changes."
        },
        negativePrompt: {
          type: "string",
          description: "Elements to avoid in generation. Common: blur, distortion, text, watermark, extra limbs, bad anatomy."
        },
        startFramePrompt: {
          type: "string",
          description: "Specific prompt modifications for the start frame. Describes initial state."
        },
        endFramePrompt: {
          type: "string",
          description: "Specific prompt modifications for the end frame. Describes final state after motion."
        }
      },
      required: ["imagePrompt", "videoPrompt", "negativePrompt", "startFramePrompt", "endFramePrompt"],
      additionalProperties: false
    }
  }
}
```

### Model Configuration

```typescript
const VIDEO_PROMPT_ENGINEER_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",
  expectedOutputTokens: 800,
};
```

### System Prompt Guidelines

The system prompt in `video-prompt-engineer-prompts.ts` should:

1. **Understand ambient video context**: Long-form, loopable, meditative content
2. **Optimize for specific image models**: FLUX, Imagen, Seedream, etc.
3. **Include motion semantics**: For video models (camera drift, subtle movements)
4. **Maintain visual consistency**: Across all shots in a scene
5. **Handle Start-End Frame logic**: Different prompts for start vs end states

---

## Agent 4.2: Video Image Generator

### Purpose

Generates keyframe images using Runware's image generation API. Handles both start and end frames for Start-End Frame mode.

### File: `video-image-generator.ts`

### Input Interface

```typescript
interface VideoImageGeneratorInput {
  // Prompt data (from Agent 4.1)
  prompt: string;             // imagePrompt or startFramePrompt/endFramePrompt
  negativePrompt?: string;
  
  // Image settings (from Step 1)
  imageModel: string;         // "flux-2-dev", "imagen-4-ultra", etc.
  aspectRatio: string;        // "16:9", "9:16", "1:1", "4:5"
  resolution: string;         // "auto", "1k", "2k", "4k"
  
  // Reference images
  referenceImageUrls?: string[];
  
  // Frame type
  frameType: 'start' | 'end' | 'single';
  
  // For end frame generation (Start-End Frame mode)
  startFrameUrl?: string;     // Used as reference context
  
  // Metadata
  shotId: string;
  versionId: string;
  userId?: string;
  workspaceId?: string;
}
```

### Output Interface

```typescript
interface VideoImageGeneratorOutput {
  imageUrl: string;           // Bunny CDN URL after upload
  runwareImageUrl: string;    // Original Runware URL (temporary)
  cost?: number;              // Generation cost in USD
}
```

### Runware API Payload

```typescript
const runwarePayload = {
  taskType: "imageInference",
  taskUUID: randomUUID(),
  positivePrompt: input.prompt,
  negativePrompt: input.negativePrompt || "blur, noise, artifacts, watermark",
  model: input.imageModel,
  width: getWidthFromAspectRatio(input.aspectRatio, input.resolution),
  height: getHeightFromAspectRatio(input.aspectRatio, input.resolution),
  numberResults: 1,
  outputType: "URL",
  outputFormat: "PNG",
  includeCost: true,
  
  // If reference images provided
  ...(input.referenceImageUrls?.length && {
    controlNet: {
      model: "reference",
      guideImages: input.referenceImageUrls,
      weight: 0.7,
    }
  }),
  
  // If generating end frame with start frame as reference
  ...(input.frameType === 'end' && input.startFrameUrl && {
    seedImage: input.startFrameUrl,
    strength: 0.6,  // Keep similarity to start frame
  })
};
```

### Resolution Mapping

```typescript
function getResolutionDimensions(aspectRatio: string, resolution: string): { width: number; height: number } {
  const resolutionMap = {
    "16:9": {
      "1k": { width: 1024, height: 576 },
      "2k": { width: 2048, height: 1152 },
      "4k": { width: 4096, height: 2304 },
    },
    "9:16": {
      "1k": { width: 576, height: 1024 },
      "2k": { width: 1152, height: 2048 },
      "4k": { width: 2304, height: 4096 },
    },
    "1:1": {
      "1k": { width: 1024, height: 1024 },
      "2k": { width: 2048, height: 2048 },
      "4k": { width: 4096, height: 4096 },
    },
    "4:5": {
      "1k": { width: 896, height: 1120 },
      "2k": { width: 1792, height: 2240 },
      "4k": { width: 3584, height: 4480 },
    },
  };
  
  return resolutionMap[aspectRatio]?.[resolution] || resolutionMap["16:9"]["1k"];
}
```

---

## Agent 4.3: Video Clip Generator

### Purpose

Generates video clips from keyframe images using Runware's image-to-video API. Supports both single-image and start-end frame generation.

### File: `video-clip-generator.ts`

### Input Interface

```typescript
interface VideoClipGeneratorInput {
  // Frame images
  startFrameUrl: string;      // Required: Starting keyframe
  endFrameUrl?: string;       // Optional: For Start-End Frame mode
  
  // Video prompt (from Agent 4.1)
  videoPrompt: string;
  
  // Video settings (from Step 1)
  videoModel: string;         // "klingai-2.5-turbo-pro", "veo-3.0", etc.
  videoResolution: string;    // "720p", "1080p", "4k"
  duration: number;           // Shot duration in seconds
  cameraMotion: string;       // "static", "slow-pan", "gentle-drift", etc.
  
  // Metadata
  shotId: string;
  versionId: string;
  userId?: string;
  workspaceId?: string;
}
```

### Output Interface

```typescript
interface VideoClipGeneratorOutput {
  videoUrl: string;           // Bunny CDN URL after upload
  runwareVideoUrl: string;    // Original Runware URL (temporary)
  actualDuration: number;     // Actual video duration (may differ from requested)
  cost?: number;              // Generation cost in USD
}
```

### Runware API Payload (Image-to-Video)

```typescript
const runwarePayload = {
  taskType: "videoInference",
  taskUUID: randomUUID(),
  inputImage: input.startFrameUrl,
  prompt: input.videoPrompt,
  model: input.videoModel,
  duration: Math.min(input.duration, getMaxDuration(input.videoModel)),
  fps: 24,
  resolution: input.videoResolution,
  outputType: "URL",
  includeCost: true,
  deliveryMethod: "async",  // Video generation is async
  
  // For Start-End Frame mode with end frame
  ...(input.endFrameUrl && {
    endImage: input.endFrameUrl,
    interpolationMode: "smooth",
  }),
  
  // Camera motion hints (model-specific)
  ...(input.cameraMotion !== "auto" && {
    cameraMotion: input.cameraMotion,
  }),
};
```

### Video Model Duration Limits

```typescript
const VIDEO_MODEL_DURATIONS: Record<string, { min: number; max: number; default: number }> = {
  "klingai-2.5-turbo-pro": { min: 5, max: 10, default: 5 },
  "klingai-2.1-master": { min: 5, max: 10, default: 5 },
  "veo-3.0": { min: 4, max: 8, default: 8 },
  "veo-3.1": { min: 4, max: 8, default: 8 },
  "sora-2": { min: 4, max: 12, default: 8 },
  "sora-2-pro": { min: 4, max: 12, default: 8 },
  "hailuo-2.3": { min: 6, max: 10, default: 6 },
  "pixverse-v5.5": { min: 5, max: 10, default: 5 },
  "runway-gen4-turbo": { min: 2, max: 10, default: 10 },
  "vidu-q2-pro": { min: 1, max: 8, default: 8 },
  "seedance-1.0-pro": { min: 2, max: 12, default: 5 },
};
```

### Video Prompt Guidelines (System Prompt)

The system prompt in `video-clip-generator-prompts.ts` should guide the AI to generate motion-focused prompts:

```
MOTION TYPES:
- Camera: slow pan, gentle drift, push in, pull out, orbit, floating
- Subject: subtle breathing, swaying, rippling, flowing
- Environment: clouds drifting, water flowing, leaves rustling
- Atmospheric: light rays moving, fog rolling, particles floating

AMBIENT VIDEO PRINCIPLES:
- Motion should be SLOW and MEDITATIVE
- Avoid sudden movements or jarring transitions
- Maintain visual continuity with previous/next shots
- Loop-friendly: end state should smoothly connect to start
```

---

## Start-End Frame Logic

### Overview

In **Start-End Frame Mode**, shots can be connected through continuity groups (locked in Phase 3). The frame generation follows specific rules:

### Connected Shots (In Continuity Group)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CONTINUITY GROUP                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Shot 1 (First in Group)          Shot 2                  Shot 3    │
│  ┌──────────────────┐             ┌──────────────────┐              │
│  │  Start: GENERATE │             │  Start: INHERIT  │    ...       │
│  │  End: GENERATE   │────────────▶│  End: GENERATE   │────────────▶ │
│  └──────────────────┘             └──────────────────┘              │
│         │                                │                           │
│         │                                │                           │
│         ▼                                ▼                           │
│  startFrameUrl (new)              startFrameUrl = Shot1.endFrameUrl │
│  endFrameUrl (new)                endFrameUrl (new)                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Rules:**
1. **First shot in group**: Generate BOTH start and end frames independently
2. **Subsequent shots**: INHERIT end frame from previous shot as their start frame
3. **Only generate**: New end frame for each subsequent shot

### Standalone Shots (Not Connected)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STANDALONE SHOT                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐                                               │
│  │  Start: GENERATE │                                               │
│  │       ↓          │                                               │
│  │  End: GENERATE   │ (uses start frame as reference/context)      │
│  │  (with ref)      │                                               │
│  └──────────────────┘                                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Rules:**
1. Generate start frame first
2. Generate end frame using start frame as reference (for visual consistency)
3. End frame prompt describes the "after motion" state

### Implementation Logic

```typescript
async function generateFramesForShot(
  shot: Shot,
  continuityGroup: ContinuityGroup | null,
  previousShot: Shot | null,
  previousShotVersion: ShotVersion | null,
  prompts: VideoPromptEngineerOutput,
  settings: ImageGeneratorSettings
): Promise<{ startFrameUrl: string; endFrameUrl: string }> {
  
  const isConnected = continuityGroup !== null;
  const isFirstInGroup = isConnected && continuityGroup.shotIds[0] === shot.id;
  
  let startFrameUrl: string;
  let endFrameUrl: string;
  
  if (isConnected && !isFirstInGroup && previousShotVersion?.endFrameUrl) {
    // INHERIT start frame from previous shot's end frame
    startFrameUrl = previousShotVersion.endFrameUrl;
    
    // Generate only end frame
    endFrameUrl = await generateImage({
      ...settings,
      prompt: prompts.endFramePrompt,
      frameType: 'end',
      startFrameUrl: startFrameUrl, // Use as reference
    });
  } else {
    // Generate both frames (first in group OR standalone)
    startFrameUrl = await generateImage({
      ...settings,
      prompt: prompts.startFramePrompt,
      frameType: 'start',
    });
    
    endFrameUrl = await generateImage({
      ...settings,
      prompt: prompts.endFramePrompt,
      frameType: 'end',
      startFrameUrl: startFrameUrl, // Use as reference for consistency
    });
  }
  
  return { startFrameUrl, endFrameUrl };
}
```

### Image-Reference Mode (Simpler)

In **Image-Reference Mode**, there's no start/end distinction:
- Generate a single image per shot
- Video generator animates that single image
- No continuity group handling needed

---

## API Endpoints

### Endpoint Overview

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ambient-visual/shots/:shotId/generate-prompt` | POST | Generate optimized prompts |
| `/api/ambient-visual/shots/:shotId/generate-image` | POST | Generate start/end frame |
| `/api/ambient-visual/shots/:shotId/generate-video` | POST | Generate video clip |
| `/api/ambient-visual/shots/:shotId/regenerate` | POST | Create new version |
| `/api/ambient-visual/videos/:id/step/4/continue` | PATCH | Save step4Data, advance |

---

### POST `/api/ambient-visual/shots/:shotId/generate-prompt`

**Purpose**: Generate optimized prompts using Agent 4.1

**Request Body**:
```typescript
{
  videoId: string;
  versionId?: string;  // If regenerating for existing version
}
```

**Response**:
```typescript
{
  versionId: string;
  prompts: {
    imagePrompt: string;
    videoPrompt: string;
    negativePrompt: string;
    startFramePrompt: string;
    endFramePrompt: string;
  };
  cost?: number;
}
```

**Implementation**:
```typescript
router.post('/shots/:shotId/generate-prompt', isAuthenticated, async (req, res) => {
  const { shotId } = req.params;
  const { videoId, versionId } = req.body;
  const userId = getCurrentUserId(req);
  
  // 1. Fetch video with all step data
  const video = await storage.getVideo(videoId);
  const step1Data = video.step1Data as Step1Data;
  const step2Data = video.step2Data as Step2Data;
  const step3Data = video.step3Data as Step3Data;
  
  // 2. Find the shot and its scene
  const shot = findShotById(step3Data.shots, shotId);
  const scene = step3Data.scenes.find(s => s.id === shot.sceneId);
  
  // 3. Check continuity status
  const continuityGroup = findContinuityGroupForShot(
    step3Data.continuityGroups, 
    shotId
  );
  const isFirstInGroup = continuityGroup?.shotIds[0] === shotId;
  const previousShotId = getPreviousShotInGroup(continuityGroup, shotId);
  
  // 4. Build input for Agent 4.1
  const input: VideoPromptEngineerInput = {
    shotId,
    shotDescription: shot.description || '',
    shotType: shot.shotType,
    cameraMovement: shot.cameraMovement,
    shotDuration: shot.duration,
    sceneId: scene.id,
    sceneTitle: scene.title,
    sceneDescription: scene.description || '',
    moodDescription: step1Data.moodDescription,
    mood: step1Data.mood,
    theme: step1Data.theme,
    timeContext: step1Data.timeContext,
    season: step1Data.season,
    aspectRatio: step1Data.aspectRatio,
    artStyle: step2Data.artStyle,
    visualElements: step2Data.visualElements,
    visualRhythm: step2Data.visualRhythm,
    referenceImageUrls: step2Data.referenceImages,
    imageCustomInstructions: step2Data.imageCustomInstructions,
    animationMode: 'video-animation',
    videoGenerationMode: step1Data.videoGenerationMode,
    motionPrompt: step1Data.motionPrompt,
    cameraMotion: step1Data.cameraMotion,
    isFirstInGroup,
    isConnectedShot: !!continuityGroup,
  };
  
  // 5. Call Agent 4.1
  const result = await generateVideoPrompts(input, userId, video.workspaceId);
  
  // 6. Create or update version
  const newVersionId = versionId || `version-${Date.now()}`;
  const shotVersion: Partial<ShotVersion> = {
    id: newVersionId,
    shotId,
    versionNumber: getNextVersionNumber(step3Data.shotVersions, shotId),
    imagePrompt: result.imagePrompt,
    videoPrompt: result.videoPrompt,
    startFramePrompt: result.startFramePrompt,
    endFramePrompt: result.endFramePrompt,
    status: 'prompt_generated',
    needsRerender: false,
    createdAt: new Date(),
  };
  
  // 7. Save to step4Data
  await saveToStep4Data(videoId, shotId, shotVersion);
  
  res.json({
    versionId: newVersionId,
    prompts: result,
    cost: result.cost,
  });
});
```

---

### POST `/api/ambient-visual/shots/:shotId/generate-image`

**Purpose**: Generate keyframe image using Agent 4.2

**Request Body**:
```typescript
{
  videoId: string;
  versionId: string;
  frameType: 'start' | 'end' | 'single';
  prompt?: string;           // Override prompt (if user edited)
  negativePrompt?: string;   // Override negative prompt
}
```

**Response**:
```typescript
{
  imageUrl: string;          // Bunny CDN URL
  frameType: 'start' | 'end' | 'single';
  cost?: number;
}
```

**Implementation**:
```typescript
router.post('/shots/:shotId/generate-image', isAuthenticated, async (req, res) => {
  const { shotId } = req.params;
  const { videoId, versionId, frameType, prompt, negativePrompt } = req.body;
  const userId = getCurrentUserId(req);
  
  // 1. Fetch video and version data
  const video = await storage.getVideo(videoId);
  const step1Data = video.step1Data as Step1Data;
  const step4Data = video.step4Data as Step4Data || { shotVersions: {} };
  
  const version = step4Data.shotVersions[shotId]?.find(v => v.id === versionId);
  if (!version) {
    return res.status(404).json({ error: 'Version not found. Generate prompt first.' });
  }
  
  // 2. Determine prompt to use
  const imagePrompt = prompt || (
    frameType === 'start' ? version.startFramePrompt :
    frameType === 'end' ? version.endFramePrompt :
    version.imagePrompt
  );
  
  // 3. Check if this is an inherited start frame (connected shot)
  if (frameType === 'start' && version.isConnectedShot && !version.isFirstInGroup) {
    const previousVersion = await getPreviousShotVersion(step4Data, shotId);
    if (previousVersion?.endFrameUrl) {
      // Use previous shot's end frame as this shot's start frame
      await updateVersionInStep4Data(videoId, shotId, versionId, {
        startFrameUrl: previousVersion.endFrameUrl,
        startFrameInherited: true,
      });
      
      return res.json({
        imageUrl: previousVersion.endFrameUrl,
        frameType: 'start',
        inherited: true,
      });
    }
  }
  
  // 4. Get start frame URL for end frame generation (consistency)
  let referenceUrl: string | undefined;
  if (frameType === 'end' && version.startFrameUrl) {
    referenceUrl = version.startFrameUrl;
  }
  
  // 5. Build input for Agent 4.2
  const input: VideoImageGeneratorInput = {
    prompt: imagePrompt,
    negativePrompt: negativePrompt || version.negativePrompt,
    imageModel: step1Data.imageModel,
    aspectRatio: step1Data.aspectRatio,
    resolution: step1Data.imageResolution || 'auto',
    referenceImageUrls: video.step2Data?.referenceImages,
    frameType,
    startFrameUrl: referenceUrl,
    shotId,
    versionId,
    userId,
    workspaceId: video.workspaceId,
  };
  
  // 6. Call Agent 4.2 (Runware)
  const result = await generateVideoImage(input);
  
  // 7. Upload to Bunny CDN
  const cdnUrl = await uploadToBunnyCDN(
    result.runwareImageUrl,
    buildCompositionPath(video, shotId, versionId, frameType)
  );
  
  // 8. Update version in step4Data
  const updateField = frameType === 'start' ? 'startFrameUrl' : 
                      frameType === 'end' ? 'endFrameUrl' : 'imageUrl';
  
  await updateVersionInStep4Data(videoId, shotId, versionId, {
    [updateField]: cdnUrl,
    status: frameType === 'end' ? 'images_generated' : version.status,
  });
  
  res.json({
    imageUrl: cdnUrl,
    frameType,
    cost: result.cost,
  });
});
```

---

### POST `/api/ambient-visual/shots/:shotId/generate-video`

**Purpose**: Generate video clip using Agent 4.3

**Request Body**:
```typescript
{
  videoId: string;
  versionId: string;
  videoPrompt?: string;      // Override prompt (if user edited)
}
```

**Response**:
```typescript
{
  videoUrl: string;          // Bunny CDN URL
  duration: number;          // Actual duration
  cost?: number;
}
```

**Implementation**:
```typescript
router.post('/shots/:shotId/generate-video', isAuthenticated, async (req, res) => {
  const { shotId } = req.params;
  const { videoId, versionId, videoPrompt } = req.body;
  const userId = getCurrentUserId(req);
  
  // 1. Fetch video and version data
  const video = await storage.getVideo(videoId);
  const step1Data = video.step1Data as Step1Data;
  const step3Data = video.step3Data as Step3Data;
  const step4Data = video.step4Data as Step4Data;
  
  const version = step4Data.shotVersions[shotId]?.find(v => v.id === versionId);
  if (!version) {
    return res.status(404).json({ error: 'Version not found' });
  }
  
  // 2. Verify images are generated
  const isStartEndMode = step1Data.videoGenerationMode === 'start-end-frame';
  
  if (isStartEndMode) {
    if (!version.startFrameUrl || !version.endFrameUrl) {
      return res.status(400).json({ 
        error: 'Both start and end frames must be generated first' 
      });
    }
  } else {
    if (!version.imageUrl && !version.startFrameUrl) {
      return res.status(400).json({ 
        error: 'Image must be generated first' 
      });
    }
  }
  
  // 3. Find shot for duration
  const shot = findShotById(step3Data.shots, shotId);
  
  // 4. Build input for Agent 4.3
  const input: VideoClipGeneratorInput = {
    startFrameUrl: version.startFrameUrl || version.imageUrl,
    endFrameUrl: isStartEndMode ? version.endFrameUrl : undefined,
    videoPrompt: videoPrompt || version.videoPrompt,
    videoModel: step1Data.videoModel,
    videoResolution: step1Data.videoResolution || '1080p',
    duration: shot.duration,
    cameraMotion: step1Data.cameraMotion || 'auto',
    shotId,
    versionId,
    userId,
    workspaceId: video.workspaceId,
  };
  
  // 5. Call Agent 4.3 (Runware I2V - async)
  const result = await generateVideoClip(input);
  
  // 6. Upload to Bunny CDN
  const cdnUrl = await uploadToBunnyCDN(
    result.runwareVideoUrl,
    buildCompositionPath(video, shotId, versionId, 'video')
  );
  
  // 7. Update version in step4Data
  await updateVersionInStep4Data(videoId, shotId, versionId, {
    videoUrl: cdnUrl,
    videoDuration: result.actualDuration,
    status: 'completed',
  });
  
  res.json({
    videoUrl: cdnUrl,
    duration: result.actualDuration,
    cost: result.cost,
  });
});
```

---

### PATCH `/api/ambient-visual/videos/:id/step/4/continue`

**Purpose**: Save final step4Data and advance to Step 5 (Preview)

**Request Body**:
```typescript
{
  // Optional: any final updates to step4Data
  sceneSettings?: Record<string, {
    imageModel?: string;
    videoModel?: string;
  }>;
}
```

**Response**:
```typescript
{
  success: true;
  currentStep: 5;
}
```

---

## Database Structure

### step4Data Schema

```typescript
interface Step4Data {
  // Per-shot version data (keyed by shotId)
  shotVersions: Record<string, ShotVersion[]>;
  
  // Per-scene model overrides
  sceneSettings: Record<string, {
    imageModel?: string;
    videoModel?: string;
    animationMode?: 'smooth-image' | 'animate';
  }>;
  
  // Reference images uploaded during composition
  shotReferenceImages: Array<{
    shotId: string;
    imageUrl: string;
    type: 'style' | 'character' | 'environment';
  }>;
}
```

### ShotVersion Schema (Extended)

```typescript
interface ShotVersion {
  id: string;
  shotId: string;
  versionNumber: number;
  
  // From Agent 4.1 (Prompt Engineer)
  imagePrompt?: string;
  videoPrompt?: string;
  negativePrompt?: string;
  startFramePrompt?: string;
  endFramePrompt?: string;
  
  // From Agent 4.2 (Image Generator)
  imageUrl?: string;           // For Image-Reference mode
  startFrameUrl?: string;      // For Start-End Frame mode
  endFrameUrl?: string;        // For Start-End Frame mode
  startFrameInherited?: boolean; // True if inherited from previous shot
  
  // From Agent 4.3 (Video Generator)
  videoUrl?: string;
  videoDuration?: number;
  
  // Status tracking
  status: 'pending' | 'prompt_generated' | 'images_generated' | 'completed' | 'failed';
  needsRerender: boolean;
  errorMessage?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt?: Date;
}
```

### Example step4Data in Database

```json
{
  "shotVersions": {
    "shot-abc123": [
      {
        "id": "version-1703123456789",
        "shotId": "shot-abc123",
        "versionNumber": 1,
        "imagePrompt": "A serene mountain lake at golden hour, cinematic style, soft volumetric lighting...",
        "videoPrompt": "Gentle camera drift forward, subtle water ripples expanding outward, clouds slowly drifting...",
        "negativePrompt": "blur, noise, harsh shadows, people, text, watermark",
        "startFramePrompt": "Mountain lake in early morning calm, mist rising gently from water surface...",
        "endFramePrompt": "Mountain lake with sun fully risen, mist cleared, golden light on peaks...",
        "startFrameUrl": "https://storia.b-cdn.net/user123/workspace/video_mode/ambient/video_title_2024-12-22/Rendered/Composition/shot-abc123/v1-start.png",
        "endFrameUrl": "https://storia.b-cdn.net/user123/workspace/video_mode/ambient/video_title_2024-12-22/Rendered/Composition/shot-abc123/v1-end.png",
        "videoUrl": "https://storia.b-cdn.net/user123/workspace/video_mode/ambient/video_title_2024-12-22/Rendered/Composition/shot-abc123/v1-clip.mp4",
        "videoDuration": 5.0,
        "status": "completed",
        "needsRerender": false,
        "createdAt": "2024-12-22T10:30:00.000Z"
      }
    ],
    "shot-def456": [
      {
        "id": "version-1703123500000",
        "shotId": "shot-def456",
        "versionNumber": 1,
        "startFrameUrl": "https://storia.b-cdn.net/.../shot-abc123/v1-end.png",
        "startFrameInherited": true,
        "endFrameUrl": "https://storia.b-cdn.net/.../shot-def456/v1-end.png",
        "videoUrl": "https://storia.b-cdn.net/.../shot-def456/v1-clip.mp4",
        "status": "completed"
      }
    ]
  },
  "sceneSettings": {
    "scene-xyz789": {
      "imageModel": "flux-2-pro",
      "videoModel": "veo-3.1"
    }
  },
  "shotReferenceImages": []
}
```

---

## CDN Storage Integration

### Bunny CDN Path Structure

```
{userId}/{workspaceName}/video_mode/ambient/{videoTitle}_{date}/Rendered/Composition/
├── {shotId}/
│   ├── v1-start.png
│   ├── v1-end.png
│   ├── v1-clip.mp4
│   ├── v2-start.png
│   ├── v2-end.png
│   └── v2-clip.mp4
├── {shotId2}/
│   └── ...
```

### Upload Function

```typescript
async function uploadToBunnyCDN(
  sourceUrl: string,
  destinationPath: string
): Promise<string> {
  // 1. Download from Runware temporary URL
  const response = await fetch(sourceUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  
  // 2. Upload to Bunny CDN
  const bunnyUrl = await bunnyStorage.uploadFile(
    buffer,
    destinationPath,
    getContentType(sourceUrl)
  );
  
  return bunnyUrl;
}

function buildCompositionPath(
  video: Video,
  shotId: string,
  versionId: string,
  assetType: 'start' | 'end' | 'video'
): string {
  const ext = assetType === 'video' ? 'mp4' : 'png';
  const suffix = assetType === 'start' ? 'start' :
                 assetType === 'end' ? 'end' : 'clip';
  
  const versionNum = versionId.split('-').pop();
  
  return `${video.userId}/${video.workspaceName}/video_mode/ambient/${video.title}_${formatDate(video.createdAt)}/Rendered/Composition/${shotId}/v${versionNum}-${suffix}.${ext}`;
}
```

---

## Frontend Integration

### Updated handleGenerateShot Flow

The current mock implementation:

```typescript
// BEFORE (Mock)
const handleGenerateShot = (shotId: string) => {
  const newVersion = {
    imageUrl: `https://picsum.photos/seed/${Date.now()}/640/360`,
    // ...mock data
  };
};
```

Will be replaced with:

```typescript
// AFTER (Real API calls)
const handleGeneratePrompt = async (shotId: string) => {
  setGeneratingPrompt(shotId, true);
  
  const response = await fetch(`/api/ambient-visual/shots/${shotId}/generate-prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId }),
  });
  
  const { versionId, prompts } = await response.json();
  
  // Update local state with prompts
  setShotVersions(prev => ({
    ...prev,
    [shotId]: [...(prev[shotId] || []), {
      id: versionId,
      ...prompts,
      status: 'prompt_generated',
    }]
  }));
  
  setGeneratingPrompt(shotId, false);
};

const handleGenerateImage = async (shotId: string, versionId: string, frameType: 'start' | 'end') => {
  setGeneratingImage(shotId, frameType, true);
  
  const response = await fetch(`/api/ambient-visual/shots/${shotId}/generate-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId, versionId, frameType }),
  });
  
  const { imageUrl } = await response.json();
  
  // Update version with new image URL
  updateShotVersion(shotId, versionId, {
    [frameType === 'start' ? 'startFrameUrl' : 'endFrameUrl']: imageUrl,
  });
  
  setGeneratingImage(shotId, frameType, false);
};

const handleGenerateVideo = async (shotId: string, versionId: string) => {
  setGeneratingVideo(shotId, true);
  
  const response = await fetch(`/api/ambient-visual/shots/${shotId}/generate-video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId, versionId }),
  });
  
  const { videoUrl, duration } = await response.json();
  
  updateShotVersion(shotId, versionId, {
    videoUrl,
    videoDuration: duration,
    status: 'completed',
  });
  
  setGeneratingVideo(shotId, false);
};
```

### UI State Machine

```
Shot Card States:
┌─────────────────────────────────────────────────────────────────┐
│  EMPTY                                                          │
│  [Generate Prompt] button                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │ Click
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  PROMPT_GENERATING                                              │
│  Spinner + "Generating prompt..."                               │
└────────────────────────────┬────────────────────────────────────┘
                             │ Complete
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  PROMPT_READY                                                   │
│  Show prompts (editable)                                        │
│  [Generate Start Frame] [Generate End Frame] buttons            │
└────────────────────────────┬────────────────────────────────────┘
                             │ Click Generate
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  IMAGES_GENERATING                                              │
│  Spinner on frame being generated                               │
└────────────────────────────┬────────────────────────────────────┘
                             │ Both Complete
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  IMAGES_READY                                                   │
│  Show Start/End tabs with images                                │
│  [Generate Video] button                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │ Click
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  VIDEO_GENERATING                                               │
│  Spinner + "Generating video..." (may take 30-120s)             │
└────────────────────────────┬────────────────────────────────────┘
                             │ Complete
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  COMPLETED                                                      │
│  Show video player + all tabs                                   │
│  [Regenerate] option for new version                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PHASE 3: FLOW DESIGN                                │
│                                                                              │
│  Scenes + Shots generated → Continuity locked (Start-End mode)              │
│                                                                              │
│  [Continue] clicked                                                          │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 4: COMPOSITION                                 │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ StoryboardEditor loaded with scenes/shots from step3Data              │ │
│  │ shotVersions initially empty or restored from step4Data               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  For each shot, user can:                                                    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Step A: Generate Prompt                                                │ │
│  │                                                                        │ │
│  │   POST /shots/:id/generate-prompt                                      │ │
│  │        ↓                                                               │ │
│  │   video-prompt-engineer.ts (GPT-5, JSON Schema)                        │ │
│  │        ↓                                                               │ │
│  │   Returns: imagePrompt, videoPrompt, negativePrompt,                   │ │
│  │            startFramePrompt, endFramePrompt                            │ │
│  │        ↓                                                               │ │
│  │   Saved to step4Data.shotVersions[shotId]                              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                        │
│                                     ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Step B: Generate Start Frame                                           │ │
│  │                                                                        │ │
│  │   If connected shot (not first) → INHERIT from previous.endFrameUrl   │ │
│  │   Else:                                                                │ │
│  │     POST /shots/:id/generate-image { frameType: 'start' }              │ │
│  │          ↓                                                             │ │
│  │     video-image-generator.ts (Runware: FLUX/Imagen/etc.)               │ │
│  │          ↓                                                             │ │
│  │     Upload to Bunny CDN                                                │ │
│  │          ↓                                                             │ │
│  │     Saved: startFrameUrl                                               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                        │
│                                     ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Step C: Generate End Frame                                             │ │
│  │                                                                        │ │
│  │   POST /shots/:id/generate-image { frameType: 'end' }                  │ │
│  │        ↓                                                               │ │
│  │   video-image-generator.ts (uses startFrameUrl as reference)           │ │
│  │        ↓                                                               │ │
│  │   Upload to Bunny CDN                                                  │ │
│  │        ↓                                                               │ │
│  │   Saved: endFrameUrl                                                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                        │
│                                     ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Step D: Generate Video                                                 │ │
│  │                                                                        │ │
│  │   POST /shots/:id/generate-video                                       │ │
│  │        ↓                                                               │ │
│  │   video-clip-generator.ts (Runware I2V: Kling/Veo/Sora/etc.)           │ │
│  │        ↓                                                               │ │
│  │   Poll for completion (async, 30-120s)                                 │ │
│  │        ↓                                                               │ │
│  │   Upload to Bunny CDN                                                  │ │
│  │        ↓                                                               │ │
│  │   Saved: videoUrl, videoDuration                                       │ │
│  │   Status: 'completed'                                                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Repeat for all shots...                                                     │
│                                                                              │
│  [Continue to Preview] clicked                                               │
│        ↓                                                                     │
│  PATCH /videos/:id/step/4/continue                                           │
│        ↓                                                                     │
│  currentStep = 5, completedSteps includes 4                                  │
│                                                                              │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 5: PREVIEW                                   │
│                                                                              │
│  All video clips concatenated for preview                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Error Handling

### Generation Failures

```typescript
try {
  const result = await generateVideoImage(input);
} catch (error) {
  // Update version with error status
  await updateVersionInStep4Data(videoId, shotId, versionId, {
    status: 'failed',
    errorMessage: error.message,
  });
  
  // Return error to frontend
  res.status(500).json({
    error: 'Image generation failed',
    details: error.message,
    retryable: true,
  });
}
```

### Runware Polling Timeout

```typescript
const RUNWARE_VIDEO_TIMEOUT_MS = 180000; // 3 minutes

// In video-clip-generator.ts
const result = await callAi({
  provider: 'runware',
  model: input.videoModel,
  task: 'image-to-video',
  runware: {
    deliveryMethod: 'async',
    pollIntervalMs: 3000,
    timeoutMs: RUNWARE_VIDEO_TIMEOUT_MS,
  },
  // ...
});
```

---

## Cost Tracking

Each agent returns a `cost` field that should be:
1. Logged for analytics
2. Charged to user's credit balance (via `chargeCredits`)
3. Stored in version metadata for transparency

```typescript
// In each endpoint
if (result.cost && result.cost > 0) {
  await chargeCredits({
    userId,
    workspaceId: video.workspaceId,
    amountUsd: result.cost,
    metadata: {
      type: 'composition',
      agent: 'video-image-generator',
      shotId,
      versionId,
    },
  });
}
```

---

## Testing Checklist

- [ ] Generate prompt for standalone shot
- [ ] Generate prompt for connected shot (first in group)
- [ ] Generate prompt for connected shot (not first)
- [ ] Generate start frame (new)
- [ ] Generate start frame (inherited from previous)
- [ ] Generate end frame with start as reference
- [ ] Generate video in Image-Reference mode
- [ ] Generate video in Start-End Frame mode
- [ ] Regenerate (create new version)
- [ ] Per-scene model override
- [ ] Error handling and retry
- [ ] CDN upload and URL persistence
- [ ] State restoration on page refresh
- [ ] Continue to Preview phase

---

**Document Version**: 1.0  
**Created**: December 22, 2024  
**Authors**: Storia Development Team

