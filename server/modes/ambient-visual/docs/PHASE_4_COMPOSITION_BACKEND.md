# Phase 4: Composition Backend Implementation

## Overview

Phase 4 (Composition) is where users generate images and videos for each shot created in Phase 3 (Flow Design). This document covers the complete backend implementation for **Video Animation Mode**.

**Mode Specificity**: The agents documented here are specific to Video Animation mode. Image Transitions mode uses a separate FFmpeg-based processor (Agent 4.4).

**Implementation Status**:
- ✅ **Agent 4.1 (Video Prompt Engineer)**: Fully implemented with dynamic JSON schemas
- ✅ **Agent 4.2 (Video Image Generator)**: Fully implemented with continuity inheritance and reference image support
- ✅ **Agent 4.3 (Video Clip Generator)**: Fully implemented with Start-End Frame interpolation via Runware I2V
- ✅ **API Endpoints**: All endpoints implemented (image, video generation, batch operations)
- ✅ **Continuity Logic**: Start frame inheritance for connected shots fully working

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
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐        │
│  │  Agent 4.1      │     │  Agent 4.2      │     │  Agent 4.3      │        │
│  │  Video Prompt   │ ──▶ │  Video Image   │ ──▶ │  Video Clip     │        │
│  │  Engineer       │     │  Generator      │     │  Generator      │        │
│  │                 │     │                 │     │                 │        │
│  │  (Text Gen)     │     │  (Runware I2I)  │     │  (Runware I2V)  │        │
│  │  OpenAI GPT-5   │     │  FLUX/Imagen    │     │  Kling/Veo/Sora │        │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘        │
│          │                       │                       │                  │
│          ▼                       ▼                       ▼                  │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐        │
│  │  JSON Output    │     │  Bunny CDN URL  │     │  Bunny CDN URL  │        │
│  │  - imagePrompt  │     │  - startFrame   │     │  - videoUrl     │        │
│  │  - videoPrompt  │     │  - endFrame     │     │  - duration     │        │
│  │  - negativeP.   │     │                 │     │                 │        │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘        │
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
│   ├── video-image-generator.ts      # Phase 4 Agent 4.2 (NEW - Single shot)
│   ├── video-image-generator-batch.ts # Phase 4 Agent 4.2 (NEW - Batch processing)
│   └── video-clip-generator.ts       # Phase 4 Agent 4.3 (NEW)
├── prompts/
│   ├── atmosphere-prompts.ts                  # Phase 1 (existing)
│   ├── flow-scene-generator-prompts.ts        # Phase 3 (existing)
│   ├── flow-shot-composer-prompts.ts          # Phase 3 (existing)
│   ├── flow-continuity-producer-prompts.ts    # Phase 3 (existing)
│   └── video-prompt-engineer-prompts.ts       # Phase 4 (NEW)
├── routes/
│   ├── index.ts                      # Main routes (batch prompt generation, settings)
│   ├── image-generation.ts           # Single shot image generation & regeneration
│   ├── video-generation.ts           # Single shot & batch video generation (Agent 4.3)
│   └── shared.ts                     # Shared utilities (multer config, temp uploads)
├── utils/
│   ├── index.ts                      # Utility exports
│   └── video-model-helpers.ts        # Video model helpers for Agent 4.3
├── services/
│   └── index.ts                      # Utility functions
├── types.ts                          # Add Step4Data types
├── config.ts                         
└── index.ts                          
```

---

## Agent 4.1: Video Prompt Engineer

### Purpose

Generates optimized prompts for image and video generation based on shot descriptions, visual style settings, and scene context. **Uses dynamic JSON schemas** that adapt based on animation mode and continuity status.

### File: `server/modes/ambient-visual/agents/video-prompt-engineer.ts`

### Key Features

- **Conditional Output**: Output fields vary based on `animationMode` and continuity status
- **Dynamic JSON Schemas**: Three different schemas for different scenarios
- **Continuity Awareness**: Handles connected shots differently (start frame inheritance)
- **Strict Validation**: Uses OpenAI's strict JSON schema mode for reliable parsing

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
  
  // Animation mode (determines output format)
  animationMode: 'image-transitions' | 'video-animation';
  videoGenerationMode?: 'image-reference' | 'start-end-frame';
  motionPrompt?: string;      // Global motion instructions from Step 1
  cameraMotion?: string;      // "slow-pan", "gentle-drift", etc.
  
  // For connected shots (Start-End Frame mode)
  isFirstInGroup?: boolean;
  isConnectedShot?: boolean;
  previousShotEndFramePrompt?: string;  // End frame prompt from previous shot (for inheritance)
}
```

### Output Interface (Conditional)

The output **varies based on animation mode and continuity status**:

```typescript
interface VideoPromptEngineerOutput {
  // For Image Transitions mode only
  imagePrompt?: string;        // Main image generation prompt (200-400 words)
  
  // For Video Animation mode only
  startFramePrompt?: string;   // Complete visual description of initial state (150-300 words)
  endFramePrompt?: string;     // Complete visual description of final state (150-300 words)
  videoPrompt?: string;        // Motion and camera instructions (50-150 words)
  
  cost?: number;
}
```

**Output Scenarios:**

1. **Image Transitions Mode**: Returns only `imagePrompt`
2. **Video Animation (Standalone/First in Group)**: Returns `startFramePrompt`, `endFramePrompt`, `videoPrompt`
3. **Video Animation (Connected, Not First)**: Returns only `endFramePrompt` and `videoPrompt` (start is inherited from previous shot)

### Dynamic JSON Schema Configuration

The agent uses **three different JSON schemas** based on the scenario:

#### Schema 1: Image Transitions Mode

```typescript
const IMAGE_TRANSITIONS_SCHEMA = {
  type: "object",
  properties: {
    imagePrompt: {
      type: "string",
      description: "Comprehensive visual description for image generation (200-400 words)"
    }
  },
  required: ["imagePrompt"],
  additionalProperties: false
};
```

#### Schema 2: Video Animation (Standalone/First in Group)

```typescript
const VIDEO_ANIMATION_SCHEMA = {
  type: "object",
  properties: {
    startFramePrompt: {
      type: "string",
      description: "Complete visual description of the initial frame state (150-300 words)"
    },
    endFramePrompt: {
      type: "string",
      description: "Complete visual description of the final frame state (150-300 words)"
    },
    videoPrompt: {
      type: "string",
      description: "Motion and camera instructions for video generation (50-150 words)"
    }
  },
  required: ["startFramePrompt", "endFramePrompt", "videoPrompt"],
  additionalProperties: false
};
```

#### Schema 3: Video Animation (Connected, Not First)

```typescript
const VIDEO_ANIMATION_CONNECTED_SCHEMA = {
  type: "object",
  properties: {
    endFramePrompt: {
      type: "string",
      description: "Complete visual description of the final frame state (150-300 words)"
    },
    videoPrompt: {
      type: "string",
      description: "Motion and camera instructions for video generation (50-150 words)"
    }
  },
  required: ["endFramePrompt", "videoPrompt"],
  additionalProperties: false
};
```

### Model Configuration

```typescript
const VIDEO_PROMPT_ENGINEER_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",
  expectedOutputTokens: 1200,  // Increased for longer frame prompts
};
```

### Implementation Logic

```typescript
export async function generateVideoPrompts(
  input: VideoPromptEngineerInput,
  userId?: string,
  workspaceId?: string
): Promise<VideoPromptEngineerOutput> {
  const isImageTransitions = input.animationMode === 'image-transitions';
  const isConnectedNonFirst = input.isConnectedShot && !input.isFirstInGroup;
  
  // Select appropriate schema based on mode and continuity status
  let schema, schemaName;
  
  if (isImageTransitions) {
    schema = IMAGE_TRANSITIONS_SCHEMA;
    schemaName = "image_transitions_output";
  } else if (isConnectedNonFirst) {
    schema = VIDEO_ANIMATION_CONNECTED_SCHEMA;
    schemaName = "video_animation_connected_output";
  } else {
    schema = VIDEO_ANIMATION_SCHEMA;
    schemaName = "video_animation_output";
  }
  
  // Call OpenAI with strict JSON schema
  const response = await callTextModel({
    provider: "openai",
    model: "gpt-5",
    payload: {
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema: schema
        }
      }
    }
  });
  
  // Parse and return based on mode
  // ...
}
```

### System Prompt Guidelines

The system prompts in `video-prompt-engineer-prompts.ts`:

1. **Understand ambient video context**: Long-form, loopable, meditative content
2. **Optimize for specific image models**: FLUX, Imagen, Seedream, etc.
3. **Include motion semantics**: For video models (camera drift, subtle movements)
4. **Maintain visual consistency**: Across all shots in a scene
5. **Handle Start-End Frame logic**: Different prompts for start vs end states
6. **Continuity inheritance**: For connected shots, end frame must progress naturally from inherited start frame

---

## Agent 4.2: Video Image Generator

### Purpose

Generates keyframe images using Runware's image generation API. Handles both animation modes (image-transitions and video-animation) with support for continuity inheritance and visual consistency through reference images.

### Files

- **`server/modes/ambient-visual/agents/video-image-generator.ts`**: Single shot image generation
- **`server/modes/ambient-visual/agents/video-image-generator-batch.ts`**: Batch processing for all shots (used by `/generate-all-images` endpoint)

### Key Features

- **Dual Mode Support**: Handles both `image-transitions` (single image) and `video-animation` (start/end frames)
- **Continuity Inheritance**: Subsequent shots in continuity groups inherit start frame from previous shot's end frame
- **Visual Consistency**: End frames always use start frame as reference image (when available) for visual consistency
- **Reference Image Support**: Uses model's reference image capability when supported
- **Batch Processing**: Supports batch generation with chunking for large shot counts (via `video-image-generator-batch.ts`)
- **Sequential Processing**: Batch generator processes shots in order to support continuity inheritance chains
- **Error Handling**: Robust retry logic with exponential backoff

### Input Interface

```typescript
interface VideoImageGeneratorInput {
  // Shot identification
  shotId: string;
  shotNumber: number;
  sceneId: string;
  
  // Prompts from Agent 4.1
  imagePrompt?: string;          // For image-transitions mode
  startFramePrompt?: string;     // For video-animation mode
  endFramePrompt?: string;       // For video-animation mode
  
  // Animation mode (determines generation logic)
  animationMode: 'image-transitions' | 'video-animation';
  videoGenerationMode?: 'image-reference' | 'start-end-frame';
  
  // Image generation settings (from Step 1 Atmosphere)
  imageModel: string;            // e.g., "flux-2-dev", "midjourney-v7"
  aspectRatio: string;           // e.g., "16:9", "9:16", "1:1"
  imageResolution: string;        // e.g., "1k", "2k", "4k"
  
  // Continuity context
  isFirstInGroup?: boolean;       // True if first shot in continuity group
  isConnectedShot?: boolean;      // True if part of a continuity group
  previousShotEndFrameUrl?: string;  // URL of previous shot's end frame (for inheritance)
  inheritStartFrame?: boolean;    // True if should inherit start from previous shot's end
}
```

### Output Interface

```typescript
interface VideoImageGeneratorOutput {
  shotId: string;
  
  // For image-transitions mode
  imageUrl?: string;             // Single generated image
  
  // For video-animation mode
  startFrameUrl?: string;         // Generated or inherited start frame
  endFrameUrl?: string;           // Generated end frame
  startFrameInherited?: boolean;  // True if start was inherited from previous shot
  
  // Generation metadata
  width?: number;
  height?: number;
  cost?: number;
  error?: string;                 // Error message if generation failed
}
```

### Generation Logic

The agent implements different logic based on animation mode:

#### Image Transitions Mode

```typescript
if (animationMode === 'image-transitions') {
  // Generate single image from imagePrompt
  const result = await generateSingleImage(imagePrompt, {
    runwareModelId,
    dimensions,
    imageModel,
    userId,
    workspaceId,
    taskLabel: `Shot ${shotNumber} image`,
  });
  
  return {
    shotId,
    imageUrl: result.imageUrl,
    width: dimensions.width,
    height: dimensions.height,
    cost: result.cost,
  };
}
```

#### Video Animation Mode

```typescript
// Step 1: Get or generate START frame
if (inheritStartFrame && previousShotEndFrameUrl) {
  // Inherit START from previous shot's END
  startFrameUrl = previousShotEndFrameUrl;
  startFrameInherited = true;
} else if (startFramePrompt) {
  // Generate START frame
  const startResult = await generateSingleImage(startFramePrompt, {
    runwareModelId,
    dimensions,
    imageModel,
    userId,
    workspaceId,
    taskLabel: `Shot ${shotNumber} START frame`,
  });
  startFrameUrl = startResult.imageUrl;
}

// Step 2: Generate END frame using START frame as reference
if (endFramePrompt) {
  const endResult = await generateSingleImage(endFramePrompt, {
    runwareModelId,
    dimensions,
    imageModel,
    userId,
    workspaceId,
    referenceImageUrl: startFrameUrl, // KEY: Use start frame as reference for visual consistency
    taskLabel: `Shot ${shotNumber} END frame`,
  });
  endFrameUrl = endResult.imageUrl;
}
```

### Runware API Payload

```typescript
function buildImagePayload(
  prompt: string,
  options: {
    runwareModelId: string;
    dimensions: { width: number; height: number };
    referenceImageUrl?: string;  // Optional reference image for style/content consistency
    taskLabel?: string;
  }
): Record<string, any> {
  const { runwareModelId, dimensions, referenceImageUrl } = options;
  
  const modelConfig = Object.values(IMAGE_MODEL_CONFIGS).find(m => m.model === runwareModelId);
  const supportsReference = modelConfig?.supportsStyleReference ?? false;

  const payload: Record<string, any> = {
    taskType: "imageInference",
    taskUUID: randomUUID(),
    model: runwareModelId,
    positivePrompt: prompt,
    width: dimensions.width,
    height: dimensions.height,
    numberResults: 1,
    includeCost: true,
    outputType: "URL",
  };

  // Add reference image if provided and model supports it
  if (referenceImageUrl && supportsReference) {
    payload.referenceImages = [referenceImageUrl];
  }

  return payload;
}
```

### Key Principle

**Every END frame uses the START frame as a reference for visual consistency.** This ensures:
- Smooth visual progression between start and end states
- Consistent style, lighting, and composition
- Natural-looking transitions in the final video

### Resolution Mapping

Uses `getImageDimensions()` from `server/ai/config/image-models.ts` which:
- Maps aspect ratios and resolutions to specific width/height pairs
- Handles model-specific constraints
- Returns appropriate dimensions based on model capabilities

### Configuration

```typescript
const CONFIG = {
  MAX_BATCH_SIZE: 10,           // Maximum images per batch request
  MAX_RETRIES: 2,               // Maximum retry attempts for failed images
  RETRY_DELAY_MS: 1000,         // Delay between retry attempts
  BATCH_TIMEOUT_MS: 180000,      // 3 minutes (longer for reference image processing)
  SEQUENTIAL_DELAY_MS: 500,     // Delay between sequential operations
};
```

---

## Agent 4.3: Video Clip Generator

### Purpose

Generates video clips from keyframe images using Runware's image-to-video (`videoInference`) API. Interpolates motion between start and end frames guided by the video prompt from Agent 4.1.

### File: `server/modes/ambient-visual/agents/video-clip-generator.ts`

### Key Features

- **Start-End Frame Mode**: Uses both `startFrameUrl` and `endFrameUrl` for smooth interpolation
- **Image Reference Mode**: Uses only `startFrameUrl` (single keyframe animation)
- **Multiple Model Support**: Seedance, KlingAI, Veo, PixVerse, Runway, Alibaba Wan
- **Two API Formats**: Standard format and inputs-wrapper format depending on model
- **Async Polling**: Video generation takes 30-180 seconds, uses async delivery with polling

### Input Interface

```typescript
interface VideoClipGeneratorInput {
  // Shot identification
  shotId: string;
  shotNumber: number;
  versionId: string;
  
  // Frame images (from Agent 4.2)
  startFrameUrl: string;       // Required: Starting keyframe
  endFrameUrl?: string;        // Optional: For Start-End Frame mode
  
  // Video prompt (from Agent 4.1)
  videoPrompt: string;
  
  // Video settings (from Step 1 / scene settings)
  videoModel: string;          // e.g., "seedance-1.0-pro"
  aspectRatio: string;         // e.g., "16:9"
  videoResolution?: string;    // e.g., "1080p" - optional, derived from aspect ratio
  duration: number;            // Shot duration in seconds (validated by frontend)
  
  // Optional provider settings
  cameraFixed?: boolean;       // Lock camera movement (Seedance)
  generateAudio?: boolean;     // Generate native audio (Veo, Seedance 1.5)
  
  // Continuity context (informational)
  isConnectedShot?: boolean;
  isFirstInGroup?: boolean;
}
```

### Output Interface

```typescript
interface VideoClipGeneratorOutput {
  shotId: string;
  videoUrl?: string;           // Runware temporary URL
  actualDuration?: number;     // Actual duration returned by model
  cost?: number;
  error?: string;
}

interface VideoClipGeneratorBatchOutput {
  videoId: string;
  results: VideoClipGeneratorOutput[];
  totalCost?: number;
  successCount: number;
  failureCount: number;
}
```

### Runware API Formats

The agent handles two different API formats depending on the video model:

#### Format 1: Standard (Seedance, KlingAI 2.1/2.5, PixVerse, Veo, Hailuo)

```typescript
{
  taskType: "videoInference",
  taskUUID: "generated-uuid",
  model: "bytedance:2@1",  // Seedance 1.0 Pro AIR ID
  positivePrompt: "Gentle camera drift forward, subtle water ripples...",
  frameImages: [
    { inputImage: "https://example.com/start.png", frame: "first" },
    { inputImage: "https://example.com/end.png", frame: "last" }
  ],
  duration: 5,
  width: 1920,
  height: 1088,
  deliveryMethod: "async",
  includeCost: true
}
```

#### Format 2: Inputs Wrapper (Kling 2.6 Pro, Kling O1, Runway, Alibaba Wan)

```typescript
{
  taskType: "videoInference",
  taskUUID: "generated-uuid",
  model: "klingai:kling-video@2.6-pro",
  inputs: {
    frameImages: [
      { image: "https://example.com/start.png", frame: "first" },
      { image: "https://example.com/end.png", frame: "last" }
    ]
  },
  positivePrompt: "...",
  duration: 5,
  width: 1920,
  height: 1080
}
```

### Video Models Supporting Start-End Frame

Models that support both `first` AND `last` frame (from `frameImageSupport` in video-models.ts):

| Model | AIR ID | Durations | Format |
|-------|--------|-----------|--------|
| Seedance 1.0 Pro | `bytedance:2@1` | 2-12s | Standard |
| Seedance 1.5 Pro | `bytedance:seedance@1.5-pro` | 4-12s | Standard |
| KlingAI 2.1 Pro | `klingai:5@2` | 5, 10s | Standard |
| KlingAI 2.5 Turbo Pro | `klingai:6@1` | 5, 10s | Standard |
| Kling VIDEO O1 | `klingai:kling@o1` | 3-10s | Inputs Wrapper |
| Veo 3 Fast | `google:3@1` | 8s | Standard |
| Veo 3.1 | `google:3@2` | 8s | Standard |
| Veo 3.1 Fast | `google:3@3` | 8s | Standard |
| PixVerse v5.5 | `pixverse:1@6` | 5, 8, 10s | Standard |

### Implementation Logic

```typescript
// Determine API format based on model
function buildFrameImages(
  startFrameUrl: string,
  endFrameUrl: string | undefined,
  modelId: string
): Record<string, any> {
  const useInputsWrapper = usesInputsWrapperFormat(modelId);
  
  if (useInputsWrapper) {
    // Format 2: Inputs wrapper
    const frames = [{ image: startFrameUrl, frame: "first" }];
    if (endFrameUrl) frames.push({ image: endFrameUrl, frame: "last" });
    return { inputs: { frameImages: frames } };
  } else {
    // Format 1: Standard
    const frames = [{ inputImage: startFrameUrl, frame: "first" }];
    if (endFrameUrl) frames.push({ inputImage: endFrameUrl, frame: "last" });
    return { frameImages: frames };
  }
}

// Main generation function
export async function generateVideoClip(
  input: VideoClipGeneratorInput,
  userId: string,
  workspaceId?: string
): Promise<VideoClipGeneratorOutput> {
  const { shotId, videoModel, startFrameUrl, endFrameUrl, duration } = input;
  
  // 1. Get model AIR ID
  const modelAirId = getVideoModelAirId(videoModel);
  if (!modelAirId) {
    return { shotId, error: `No AIR ID for model: ${videoModel}` };
  }
  
  // 2. Get dimensions for model and aspect ratio
  const dimensions = getVideoDimensions(videoModel, input.aspectRatio, input.videoResolution);
  
  // 3. Build payload with correct format
  const payload = {
    taskType: "videoInference",
    taskUUID: randomUUID(),
    model: modelAirId,
    positivePrompt: input.videoPrompt,
    duration: clampDuration(duration, videoModel),
    width: dimensions.width,
    height: dimensions.height,
    deliveryMethod: "async",
    includeCost: true,
    ...buildFrameImages(startFrameUrl, endFrameUrl, videoModel),
  };
  
  // 4. Call Runware API (async with polling)
  const response = await callAi({
    provider: "runware",
    model: videoModel,
    task: "video-generation",
    payload: [payload],
    userId,
    workspaceId,
    runware: {
      deliveryMethod: "async",
      timeoutMs: 300000, // 5 minutes
    },
  });
  
  // 5. Extract video URL from response
  const data = response.output?.[0];
  if (data?.videoURL) {
    return {
      shotId,
      videoUrl: data.videoURL,
      actualDuration: data.duration || duration,
      cost: data.cost || 0,
    };
  }
  
  return { shotId, error: data?.error || "No video URL in response" };
}
```

### Helper Functions (video-models.ts)

```typescript
// Check if model supports start-end frame mode
export function supportsStartEndFrame(modelId: string): boolean {
  const config = VIDEO_MODEL_CONFIGS[modelId];
  return config?.frameImageSupport?.first === true && 
         config?.frameImageSupport?.last === true;
}

// Get video dimensions for model
export function getVideoDimensions(
  modelId: string,
  aspectRatio: string,
  resolution?: string
): VideoDimensions {
  // Try model-specific dimensions first
  const modelDims = MODEL_DIMENSIONS[modelId]?.[aspectRatio];
  if (modelDims) {
    if (resolution && modelDims[resolution]) {
      return modelDims[resolution];
    }
    const firstRes = Object.keys(modelDims)[0];
    return modelDims[firstRes];
  }
  // Fallback to generic dimensions
  return getDimensions(aspectRatio, resolution || "720p", modelId);
}

// Clamp duration to model's supported values
export function clampDuration(duration: number, modelId: string): number {
  const config = VIDEO_MODEL_CONFIGS[modelId];
  if (!config) return duration;
  return config.durations.reduce((closest, current) =>
    Math.abs(current - duration) < Math.abs(closest - duration) ? current : closest
  );
}
```

### Configuration

```typescript
const CONFIG = {
  TIMEOUT_MS: 300000,      // 5 minutes (video gen is slow)
  BATCH_DELAY_MS: 1000,    // Delay between batch items
  MAX_RETRIES: 1,          // Maximum retry attempts
  RETRY_DELAY_MS: 10000,   // Retry delay (10 seconds)
};
```

---

## Start-End Frame Logic

### Overview

In **Start-End Frame Mode**, shots can be connected through continuity groups (locked in Phase 3). The frame generation follows specific rules:

### Connected Shots (In Continuity Group)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CONTINUITY GROUP                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Shot 1 (First in Group)          Shot 2                  Shot 3    │
│  ┌──────────────────┐             ┌──────────────────┐              │
│  │  Start: GENERATE │             │  Start: INHERIT  │    ...       │
│  │  End: GENERATE   │────────────▶│  End: GENERATE   │────────────▶│
│  └──────────────────┘             └──────────────────┘              │
│         │                                │                          │
│         │                                │                          │
│         ▼                                ▼                          │
│  startFrameUrl (new)              startFrameUrl = Shot1.endFrameUrl │
│  endFrameUrl (new)                endFrameUrl (new)                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Rules:**
1. **First shot in group**: Generate BOTH start and end frames independently
2. **Subsequent shots**: INHERIT end frame from previous shot as their start frame
3. **Only generate**: New end frame for each subsequent shot

### Standalone Shots (Not Connected)
z
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
| `/api/ambient-visual/videos/:id/generate-all-prompts` | POST | Generate prompts for all shots (batch) |
| `/api/ambient-visual/videos/:id/shots/:shotId/generate-image` | POST | Generate single frame (start or end) |
| `/api/ambient-visual/videos/:id/shots/:shotId/regenerate-image` | POST | Regenerate frame(s) for existing version |
| `/api/ambient-visual/videos/:id/shots/:shotId/generate-video` | POST | Generate video clip for single shot (Agent 4.3) |
| `/api/ambient-visual/videos/:id/generate-all-videos` | POST | Generate video clips for all ready shots (Agent 4.3 batch) |
| `/api/ambient-visual/videos/:id/step4/settings` | PATCH | Auto-save step4Data (scenes/shots model settings) |

**Note**: The actual implementation uses `/videos/:id/shots/:shotId/...` pattern for better RESTful organization.

---

### POST `/api/ambient-visual/videos/:id/generate-all-prompts`

**Purpose**: Generate optimized prompts for all shots using Agent 4.1 (batch operation)

**Request Body**:
```typescript
{
  // No body required - uses video's step3Data
}
```

**Response**:
```typescript
{
  success: boolean;
  promptsGenerated: number;
  failedShots: string[];
  totalCost: number;
}
```

**Implementation Notes**:
- Processes all shots in order (respects continuity groups)
- For connected shots (not first in group), only generates `endFramePrompt` and `videoPrompt`
- Preserves existing `step4Data.scenes` and `step4Data.shots` if prompts already exist
- Creates new `ShotVersion` entries in `step4Data.shotVersions`

---

### POST `/api/ambient-visual/videos/:id/shots/:shotId/generate-image`

**Purpose**: Generate a single frame image for a specific shot (Agent 4.2 - Single Shot)

**Request Body**:
```typescript
{
  frame: 'start' | 'end';  // Required: which frame to generate
}
```

**Response**:
```typescript
{
  imageUrl: string;          // Generated image URL (Runware temporary URL)
  frameType: 'start' | 'end';
  inherited?: boolean;       // True if start frame was inherited (connected shots)
  nextShotId?: string;       // If end frame generated for connected shot, next shot's ID
  nextShotVersion?: object;  // Updated next shot version (with inherited start)
  cost?: number;
}
```

**Rules**:
- **Start frame**: 
  - For standalone/first in group: Generate new start frame
  - For connected shots (not first): Automatically inherits from previous shot's end frame (returns inherited URL)
- **End frame**: 
  - Must have start frame first (own or inherited)
  - Always uses start frame as reference image for visual consistency
  - For connected shots: Updates next shot's start frame automatically

**Implementation**:
```typescript
router.post('/videos/:id/shots/:shotId/generate-image', isAuthenticated, async (req, res) => {
  const { id: videoId, shotId } = req.params;
  const { frame } = req.body as { frame: 'start' | 'end' };

  // 1. Fetch video and determine continuity status
  const video = await storage.getVideo(videoId);
  const step3Data = video.step3Data as Step3Data;
  const step4Data = video.step4Data as Step4Data;
  
  // 2. Find continuity group and check if shot is connected
  const continuityGroup = findContinuityGroupForShot(step3Data.continuityGroups, shotId);
  const isConnectedShot = !!continuityGroup;
  const isFirstInGroup = continuityGroup?.shotIds[0] === shotId;
  
  // 3. Get current version
  const version = step4Data.shotVersions[shotId]?.find(v => v.id === currentVersionId);
  
  if (frame === 'start') {
    // Check if start should be inherited
    if (isConnectedShot && !isFirstInGroup) {
      const previousShotVersion = getPreviousShotVersion(step4Data, shotId);
      if (previousShotVersion?.endFrameUrl) {
        // Inherit start frame
        await updateVersionInStep4Data(videoId, shotId, versionId, {
          startFrameUrl: previousShotVersion.endFrameUrl,
          startFrameInherited: true,
        });
        return res.json({
          imageUrl: previousShotVersion.endFrameUrl,
          frameType: 'start',
          inherited: true,
        });
      }
    }
    
    // Generate new start frame
    const result = await generateSingleFrameImage(/* ... */);
    // ...
  } else {
    // End frame generation
    // Always uses start frame (own or inherited) as reference
    const referenceUrl = version.startFrameUrl || previousShotVersion?.endFrameUrl;
    const result = await generateSingleFrameImage(/* ... with referenceUrl ... */);
    
    // If this is a connected shot, update next shot's start frame
    if (isConnectedShot) {
      const nextShotId = getNextShotInGroup(continuityGroup, shotId);
      if (nextShotId) {
        // Update next shot's version with inherited start
        // ...
      }
    }
  }
});
```

---

### POST `/api/ambient-visual/videos/:id/shots/:shotId/regenerate-image`

**Purpose**: Regenerate image(s) for an existing version

**Request Body**:
```typescript
{
  frame?: 'start' | 'end';  // Optional: if undefined, regenerates both (if applicable)
}
```

**Response**:
```typescript
{
  imageUrl?: string;         // Regenerated image URL(s)
  startFrameUrl?: string;
  endFrameUrl?: string;
  nextShotId?: string;       // If end frame regenerated for connected shot
  nextShotVersion?: object;  // Updated next shot version
  cost?: number;
}
```

**Regeneration Logic**:
- **`frame === 'start'`**: Regenerates only the start frame. **End frame is NOT automatically regenerated.**
- **`frame === 'end'`**: Regenerates only the end frame (uses existing start as reference)
- **`frame === undefined`**: Regenerates both frames (for standalone shots only)
- **Connected shots (not first)**: Can only regenerate end frame (start is inherited and cannot be regenerated)

---

### POST `/api/ambient-visual/videos/:id/shots/:shotId/generate-prompt`

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

### POST `/api/ambient-visual/videos/:id/shots/:shotId/generate-video`

**Purpose**: Generate video clip for a single shot using Agent 4.3

**Request Body**: None required (uses existing data)

**Response**:
```typescript
{
  success: boolean;
  shotId: string;
  videoUrl: string;          // Runware temporary URL
  actualDuration: number;    // Actual duration returned
  cost: number;
  shotVersion: object;       // Updated shot version with video URL
}
```

**Validation**:
- Start frame must exist (`startFrameUrl`)
- For Start-End Frame mode: End frame must also exist (`endFrameUrl`)
- Video prompt must exist (from Agent 4.1)

**Implementation**:
```typescript
router.post('/videos/:id/shots/:shotId/generate-video', isAuthenticated, async (req, res) => {
  const { id: videoId, shotId } = req.params;
  const userId = getCurrentUserId(req);
  
  // 1. Fetch video and version data
  const video = await storage.getVideo(videoId);
  const step1Data = video.step1Data as Step1Data;
  const step4Data = video.step4Data as Step4Data;
  
  const latestVersion = step4Data.shotVersions[shotId]?.[versions.length - 1];
  
  // 2. Validate frames exist
  if (!latestVersion.startFrameUrl) {
    return res.status(400).json({ error: 'Start frame not generated' });
  }
  
  const isStartEndMode = step1Data.videoGenerationMode === 'start-end-frame';
  if (isStartEndMode && !latestVersion.endFrameUrl) {
    return res.status(400).json({ error: 'End frame not generated' });
  }
  
  // 3. Get video model (shot > scene > step1)
  const videoModel = shot.videoModel || scene?.videoModel || step1Data.videoModel;
  
  // 4. Check if model supports start-end frame
  const modelSupportsEndFrame = supportsStartEndFrame(videoModel);
  const useEndFrame = isStartEndMode && modelSupportsEndFrame && !!latestVersion.endFrameUrl;
  
  // 5. Call Agent 4.3
  const result = await generateVideoClip({
    shotId,
    shotNumber: shotIndex + 1,
    versionId: latestVersion.id,
    startFrameUrl: latestVersion.startFrameUrl,
    endFrameUrl: useEndFrame ? latestVersion.endFrameUrl : undefined,
    videoPrompt: latestVersion.videoPrompt,
    videoModel,
    aspectRatio: step1Data.aspectRatio,
    videoResolution: step1Data.videoResolution,
    duration: shot.duration || 5,
  }, userId, video.workspaceId);
  
  // 6. Update shot version with video URL
  const updatedVersion = {
    ...latestVersion,
    videoUrl: result.videoUrl,
    videoDuration: result.actualDuration,
    status: 'completed',
  };
  
  await storage.updateVideo(videoId, {
    step4Data: {
      ...step4Data,
      shotVersions: {
        ...step4Data.shotVersions,
        [shotId]: versions.map(v => v.id === latestVersion.id ? updatedVersion : v),
      },
    },
  });
  
  res.json({
    success: true,
    shotId,
    videoUrl: result.videoUrl,
    actualDuration: result.actualDuration,
    cost: result.cost,
    shotVersion: updatedVersion,
  });
});
```

---

### POST `/api/ambient-visual/videos/:id/generate-all-videos`

**Purpose**: Generate video clips for all shots that have completed frames (Agent 4.3 batch)

**Request Body**: None required

**Response**:
```typescript
{
  success: boolean;
  videosGenerated: number;       // Count of successful generations
  failedShots: string[];         // Shot IDs that failed
  totalCost: number;
  results: VideoClipGeneratorOutput[];
}
```

**Filter Criteria** (shots must have):
- Start frame (`startFrameUrl`)
- For Start-End Frame mode: End frame (`endFrameUrl`)
- Video prompt (from Agent 4.1)
- No existing video URL (skips already generated)

**Processing**:
- Sequential processing (video gen takes 30-180s per shot)
- Updates each shot's `videoUrl` in `step4Data.shotVersions`
- Sets status to `completed` or `failed`

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

