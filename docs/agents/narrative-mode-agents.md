# Narrative Mode - AI Agent Architecture

**Document Version:** 1.0  
**Last Updated:** November 13, 2025  
**Status:** Technical Specification - Approved

## Table of Contents
1. [Overview](#overview)
2. [Reference Tagging System](#reference-tagging-system)
3. [Step 1: Script Editor](#step-1-script-editor)
4. [Step 2: World & Cast](#step-2-world--cast)
5. [Step 3: Scene Breakdown](#step-3-scene-breakdown)
6. [Step 4: Storyboard Editor](#step-4-storyboard-editor)
7. [Step 5: Animatic Preview](#step-5-animatic-preview)
8. [Step 6: Export & Publish](#step-6-export--publish)
9. [Data Flow Diagram](#data-flow-diagram)
10. [Implementation Priority](#implementation-priority)

---

## Overview

The Narrative Mode workflow consists of **22 specialized agents** (16 AI, 6 non-AI) that guide users from initial concept to final published video. Each agent has specific inputs, outputs, and responsibilities designed to create a seamless creative experience with support for both image-reference and start-end frame continuity workflows.

### Key Design Principles
- **Modularity**: Each agent handles one specific task
- **Reference Tagging**: Consistent entity referencing across all stages (@character1, @location2)
- **Character Consistency**: Reference images ensure visual coherence
- **User Control**: AI suggestions with full manual override capability
- **Progressive Enhancement**: Each step builds on previous outputs

---

## Reference Tagging System

Throughout the workflow, we use a **consistent tagging system** to reference entities:

| Entity Type | Tag Format | Example |
|------------|------------|---------|
| Character | `@character{id}` | `@character1`, `@character2` |
| Location | `@location{id}` | `@location1`, `@location2` |
| Style | `@style` | `@style` (global art style reference) |

### Usage in Outputs
- **Action descriptions**: "@character1 walks into @location2"
- **Narration**: "@character1 discovers the secret in @location3"
- **Image prompts**: "Show @character2 standing in @location1 at sunset"

This enables:
- Automatic entity recognition across workflow steps
- Easy reference image injection into prompts
- Consistent character/location appearance
- Simplified prompt engineering

---

## Step 1: Script Editor

**Purpose**: Generate or refine the video script with AI assistance

### Agent 1.1: Script Generator (AI)

**Role**: Generate initial video script based on user concept

**AI Model**: GPT-4 / Claude / Gemini (Text Generation)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| User concept/idea | String | User input | ✓ |
| Duration | Integer (seconds) | User selection | ✓ |
| Genre | Enum | User selection | ✓ |
| Language | ISO code | User selection | ✓ |
| Tone/Style | String | User selection | ✗ |
| Target audience | String | User input | ✗ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Script text | String | Complete narration script |
| Estimated duration | Integer | Calculated script duration (seconds) |

**Implementation Notes**:
- Use structured prompting to enforce duration constraints
- Support iterative refinement (user edits → regenerate)
- **No separate feedback agent needed** - user can edit script manually and re-run Agent 1.1

**Prompt Template**:
```
Generate a {duration}-second video script for a {genre} video in {language}.
Concept: {user_concept}
Tone: {tone}
Target audience: {target_audience}

Requirements:
- Natural narration flow
- Clear narrative arc
- Time-appropriate content length
```

---

## Step 2: World & Cast

**Purpose**: Define characters, locations, and visual style for the video

### Agent 2.1: Character Analyzer (AI)

**Role**: Analyze script and suggest key characters that need character sheets

**AI Model**: GPT-4 / Claude (Text Analysis)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Script text | String | Agent 1.1 output | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Character list | Array | List of suggested characters |
| └─ Character name | String | Character identifier |
| └─ Role in story | String | Narrative function |
| └─ Appearance description | String | Physical description |
| └─ Personality traits | String | Behavioral characteristics |
| └─ Importance score | Integer (1-10) | Story significance |

**Implementation Notes**:
- Only suggest characters that appear **more than once** in the story
- Prioritize by narrative importance (protagonists, antagonists, key supporting roles)
- Exclude one-off background characters
- Sort by importance score (highest first)

**Selection Criteria**:
- Appears multiple times in script
- Has dialogue or significant actions
- Drives narrative forward
- Visual presence is important

---

### Agent 2.2: Location Analyzer (AI)

**Role**: Analyze script and suggest key locations/environments that need reference images

**AI Model**: GPT-4 / Claude (Text Analysis)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Script text | String | Agent 1.1 output | ✓ |
| Genre | String | Step 1 user selection | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Location list | Array | List of suggested locations |
| └─ Location name | String | Location identifier |
| └─ Description | String | Physical environment description |
| └─ Atmosphere/Mood | String | Emotional tone and lighting |
| └─ Time of day | String | Lighting context (dawn, day, dusk, night) |
| └─ Importance score | Integer (1-10) | Story significance |

**Implementation Notes**:
- Only suggest locations that appear **in multiple scenes** OR are narratively significant
- Prioritize by story importance (main setting, key dramatic locations)
- Merge similar locations (e.g., "kitchen" and "home kitchen" → single location)
- Include both interior and exterior locations
- Sort by importance score (highest first)

**Selection Criteria**:
- Appears in multiple shots/scenes
- Has significant narrative importance (climax location, recurring setting)
- Unique visual requirements
- Establishes story mood or context

**Prompt Template**:
```
Analyze this script and identify key locations that need visual reference images:

Script: {script_text}
Genre: {genre}

For each location, provide:
1. Clear, descriptive name
2. Physical environment details (architecture, furnishings, natural elements)
3. Atmosphere and mood (emotional tone, lighting quality)
4. Time of day if specified
5. Importance score (1-10) based on narrative significance

Focus on locations that:
- Appear in multiple scenes
- Are important to the story's mood or plot
- Have distinctive visual characteristics

Exclude generic, unnamed, or transitional locations.
```

---

### Agent 2.3: Character Image Generator (AI)

**Role**: Generate character reference images for visual consistency

**AI Model**: Imagen 4 / DALL-E 3 / Nano Banana (Image Generation with Character Consistency)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Character details | Object | Agent 2.1 output OR user-created | ✓ |
| └─ Name | String | Character identifier | ✓ |
| └─ Appearance description | String | Physical traits | ✓ |
| └─ Personality traits | String | Behavioral info | ✗ |
| Art style description | String | Agent 2.5 output (@style) | ✗ |
| Character reference images | Array[Image URL] | User uploads | ✗ |
| Image model | String | User selection (default: nano-banana) | ✓ |
| Aspect ratio | Enum | Fixed: "1:1" (square portraits) | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Generated image URL | String | Character reference image |
| Character ID | String | Unique identifier (@character{id}) |
| Cost | Float | Generation cost in USD |

**Implementation Notes**:
- Prompt is built directly from character details (no separate prompt engineer agent)
- Simple template: "{appearance}, {personality traits if provided}, {art style if provided}"
- Use character reference images if provided for better consistency
- Generate square 1:1 portraits for character sheets
- Modern image models support character consistency natively
- **No separate consistency checker needed** - model handles this
- User can select image model in narrative mode (Flux, Midjourney, Nano Banana, GPT Image)

---

### Agent 2.4: Location Image Generator (AI)

**Role**: Generate location reference images for environmental consistency

**AI Model**: Imagen 4 / DALL-E 3 / Nano Banana (Image Generation)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Location details | Object | Agent 2.2 output OR user-created | ✓ |
| └─ Name | String | Location identifier | ✓ |
| └─ Description | String | Physical environment | ✓ |
| └─ Details | String | Additional details/atmosphere | ✗ |
| Art style description | String | Agent 2.5 output (@style) | ✗ |
| Location reference images | Array[Image URL] | User uploads (max 2) | ✗ |
| Image model | String | User selection (default: nano-banana) | ✓ |
| Aspect ratio | Enum | Fixed: "16:9" (landscape) | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Generated image URL | String | Location reference image (1344x768) |
| Location ID | String | Unique identifier (@location{id}) |
| Cost | Float | Generation cost in USD |

**Implementation Notes**:
- Prompt is built directly from location details (no separate prompt engineer agent)
- Simple template: "{description}, {details if provided}, {art style if provided}"
- Use location reference images if provided for better consistency
- Generate 16:9 landscape images for environmental establishing shots
- Wide establishing shot composition with atmospheric lighting
- User can select image model in narrative mode (Flux, Midjourney, Nano Banana, GPT Image)
- In Location Assets Library: hard-coded to "nano-banana" model
- In Narrative Mode: user-selectable model from UI

**Prompt Structure**:
```
Environmental reference image of {name}, {description}.
Details: {details if provided}.
{artStyleDescription if provided}

Wide 16:9 landscape composition, establishing shot showcasing the full environment and atmosphere. Natural or atmospheric lighting that reflects the time of day and mood. Clear, detailed view of the setting with emphasis on architecture, landscape features, or environmental elements. Cinematic depth and perspective, high-resolution, professionally composed, immersive environmental design.
```

**Default Negative Prompt**:
```
blurry, low quality, distorted, watermark, text, logo, people, characters, humans, animals, cropped, out of frame, bad composition, oversaturated, low resolution, pixelated
```

---

### Agent 2.5: Style Reference Descriptor (AI)

**Role**: Convert user-uploaded style reference image to text description

**AI Model**: GPT-4 Vision / Claude Vision (Image-to-Text)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Style reference image | Image URL | User upload | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Style description | String | Comprehensive text description including key visual elements, color palette, and artistic technique |

**Implementation Notes**:
- This text description becomes **@style** for all subsequent image generation
- Single consolidated description includes: artistic medium, key visual elements, color schemes, lighting style, mood, rendering technique
- Use in Agents 2.3, 2.6, 4.1 to maintain consistent visual style

**Prompt Template**:
```
Analyze this style reference image and provide a comprehensive style description that includes:
1. Overall artistic style (medium, technique, rendering approach)
2. Key visual characteristics and elements
3. Color palette, mood, and lighting
4. Any distinctive stylistic features

Format as a single cohesive description that can be injected into image generation prompts.
```

---

## Step 3: Scene Breakdown

**Purpose**: Analyze script and break it into scenes and shots with timing

### Agent 3.1: Scene Analyzer (AI)

**Role**: Break script into logical scenes with narrative structure

**AI Model**: GPT-4 / Claude (Text Analysis)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Script text | String | Agent 1.1 output (or edited) | ✓ |
| Target duration | Integer | User input (Step 1) | ✓ |
| Characters available | Array[Object] | Agent 2.1/user-created | ✓ |
| Locations available | Array[Object] | User-created locations | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Scenes | Array[Object] | List of scenes |
| └─ Scene number | Integer | Sequential scene ID |
| └─ Scene title | String | Brief descriptive title |
| └─ Script excerpt | String | Relevant portion of script |
| └─ Duration estimate | Integer | Seconds allocated to scene |
| └─ Location | String | Primary location (@location{id}) |
| └─ Characters present | Array[String] | Characters in scene (@character{id}) |

**Implementation Notes**:
- Use available characters and locations to tag entities
- Distribute total duration across scenes proportionally
- Scene breaks should align with narrative shifts

---

### Agent 3.2: Shot Composer (AI)

**Role**: Break scenes into individual shots with camera framing and timing

**AI Model**: GPT-4 / Claude (Cinematic Analysis)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Full script | String | Agent 1.1 output | ✓ |
| Scene data | Object | Agent 3.1 output (single scene) | ✓ |
| Characters available | Array[Object] | From World & Cast | ✓ |
| Locations available | Array[Object] | From World & Cast | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Shots | Array[Object] | List of shots for this scene |
| └─ Shot number | Integer | Sequential shot ID within scene |
| └─ Duration | Integer | Shot duration (seconds) |
| └─ Shot type | Enum | Close-up, Medium, Wide, Extreme Wide, etc. |
| └─ Camera movement | Enum | Static, Pan, Zoom, Dolly, etc. |
| └─ Narration text | String | Voiceover for this shot (with @tags) |
| └─ Action description | String | Visual action (with @tags) |
| └─ Characters | Array[String] | Characters visible (@character{id}) |
| └─ Location | String | Location reference (@location{id}) |

**Implementation Notes**:
- **Use @character and @location tags** in narration and action descriptions
  - Example: "@character1 walks through @location2 at sunset"
- Include full script for context and story flow understanding
- Shot durations should sum to scene duration
- Ensure visual variety (mix of angles and movements)
- Reference tags enable automatic injection of character/location images

**Shot Composition Guidelines**:
- Vary shot types for visual interest
- Match camera work to narrative mood
- Consider dialogue/narration timing

---

### Agent 3.3: Timing Calculator (Non-AI)

**Role**: Calculate and validate shot timings to match target duration

**Type**: Algorithmic (Non-AI)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| All shots | Array[Object] | Agent 3.2 output (all scenes) | ✓ |
| Target total duration | Integer | User input (Step 1) | ✓ |
| Narration text | Array[String] | From all shots | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Adjusted shot durations | Array[Integer] | Normalized durations |
| Total calculated duration | Integer | Sum of all shots |
| Timing warnings | Array[String] | Shots that may be too short/long |

**Implementation Notes**:
- Use text-to-speech estimation (words per minute) to calculate narration duration
- Ensure each shot duration ≥ narration duration
- Distribute extra time proportionally
- Flag shots with very short or very long durations
- **Keep for now** - provides useful validation

**Algorithm**:
1. Calculate narration duration for each shot (WPM estimation)
2. Compare to assigned shot duration
3. If total duration ≠ target, redistribute proportionally
4. Flag issues for user review

---

### Agent 3.4: Continuity Producer (AI)
**Status**: ⚠️ **START-END FRAME MODE ONLY**

**Role**: Analyze shots and propose continuity groups for seamless shot-to-shot transitions

**AI Model**: GPT-4 / Claude (Narrative Analysis)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Narrative mode | Enum | Video settings ("image-reference" \| "start-end") | ✓ |
| All scenes | Array[Object] | Agent 3.2 output | ✓ |
| └─ Scene number | Integer | Scene identifier | ✓ |
| └─ Shots | Array[Object] | List of shots in scene | ✓ |
|   └─ Shot number | Integer | Sequential shot ID | ✓ |
|   └─ Shot type | String | Framing (close-up, medium, wide, etc.) | ✓ |
|   └─ Camera movement | String | Static, Pan, Zoom, etc. | ✓ |
|   └─ Action description | String | Visual action with @tags | ✓ |
|   └─ Location | String | @location{id} | ✓ |
|   └─ Characters | Array[String] | @character{id} list | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Continuity groups | Array[Object] | Proposed shot connections by scene |
| └─ Scene ID | UUID | Parent scene identifier |
| └─ Group number | Integer | Sequential group ID within scene |
| └─ Connected shot IDs | Array[String] | Ordered list of shots to connect |
| └─ Connection type | String | "flow", "pan", "character-movement", etc. |
| └─ Description | String | Reason for connection |
| User guidance | String | Explanation of continuity proposal |

**Implementation Notes**:
- **Only runs in "start-end" narrative mode** - skipped entirely in "image-reference" mode
- Analyzes narrative flow, camera movements, and spatial relationships
- Proposes groups of shots that should connect seamlessly (start→end frame matching)
- User can edit/approve before proceeding to storyboard step
- Once approved, continuity is **locked** - cannot be changed in storyboard

**Selection Criteria for Connected Shots**:
- Same location/environment with continuous action
- Camera movements that naturally flow (pan across room, follow character)
- Character movement from one position to another
- Spatial continuity (character walks from A to B)
- Avoid connections across time/location jumps

**Example Output**:
```
Scene 1: Kitchen Morning
- Group 1: Shots 1→2→3 (continuous pan across kitchen)
  Type: "pan"
  Description: "Camera pans from window to door, following morning light"
  
- Shot 4: Separate (cut to close-up)
  
- Group 2: Shots 5→6 (character walks to door)
  Type: "character-movement"
  Description: "Character walks from table to exit"
```

**Prompt Template**:
```
Analyze these shots and identify which should be connected for seamless continuity:
[Shot data with shot types, movements, actions, locations]

Propose continuity groups where:
- Shots share the same location and time
- Camera movement or subject movement creates natural flow
- Visual continuity is maintained across shots

For each group, explain WHY these shots should connect.
```

---

## Step 4: Storyboard Editor

**Purpose**: Generate and refine images for each shot

### Agent 4.1: Shot Prompt Engineer (AI)

**Role**: Generate optimized image prompts for each storyboard frame

**AI Model**: GPT-4 / Claude (Prompt Engineering)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Narrative mode | Enum | Video settings ("image-reference" \| "start-end") | ✓ |
| Continuity groups | Array[Object] | Agent 3.4 output (start-end mode only) | Conditional |
| Shot data | Object | Agent 3.2 output | ✓ |
| └─ Shot ID | UUID | Unique identifier | ✓ |
| └─ Shot type | String | Framing (close-up, medium, wide, etc.) | ✓ |
| └─ Action description | String | With @tags | ✓ |
| └─ Characters | Array[String] | @character{id} list | ✓ |
| └─ Location | String | @location{id} | ✓ |
| Character reference images | Map[ID→URL] | Agent 2.3 outputs | ✓ |
| Location reference images | Map[ID→URL] | Agent 2.7 outputs | ✓ |
| Art style description | String | Agent 2.5 output (@style) | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| **Image-Reference Mode:** | | Single frame per shot |
| └─ Image generation prompt | String | Detailed prompt with all references |
| └─ Negative prompt | String | Elements to avoid |
| └─ Reference image URLs | Array[String] | Character/location images to use |
| **Start-End Mode:** | | Smart frame generation |
| └─ Frame type | Enum | "start-only" \| "start-and-end" |
| └─ Start frame prompt | String | Beginning state of shot |
| └─ End frame prompt | String | Ending state (if not connected) |
| └─ Negative prompt | String | Elements to avoid |
| └─ Reference image URLs | Array[String] | Character/location images to use |

**Implementation Notes**:
- **Image-Reference Mode**: Generate 1 prompt per shot (current behavior)
- **Start-End Mode**: Smart frame generation based on continuity
  - **Connected shots** (middle of group): Generate start frame only
  - **Last shot in group**: Generate start + end frames
  - **Non-connected shots**: Generate start + end frames
- Parse @tags from action description
- Inject corresponding reference images automatically
- Combine: shot type + action + character refs + location ref + art style

**Dual-Mode Logic**:
```javascript
if (narrativeMode === "image-reference") {
  // Generate single prompt
  return { imagePrompt, negativePrompt, references };
}

if (narrativeMode === "start-end") {
  const isConnected = findContinuityGroup(shot.id, continuityGroups);
  const isLastInGroup = isLastShotInGroup(shot.id, continuityGroups);
  
  if (isConnected && !isLastInGroup) {
    // Middle of connected group: start frame only
    return { frameType: "start-only", startPrompt, negativePrompt, references };
  } else {
    // Last in group OR non-connected: start + end
    return { frameType: "start-and-end", startPrompt, endPrompt, negativePrompt, references };
  }
}
```

**Prompt Construction**:
```
{camera_angle} shot of {action_description_with_resolved_tags}
Characters: [reference images for @character1, @character2...]
Location: [reference image for @location1]
Style: {art_style_description}
Technical: {aspect_ratio from Step 1}

For Start-End Mode:
- Start frame: Initial state/composition
- End frame: Final state/position (progression of action)
```

---

### Agent 4.2: Storyboard Image Generator (AI)

**Role**: Generate storyboard frame images (single or paired keyframes)

**AI Model**: Imagen 4 / DALL-E 3 (Image Generation with Reference)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Narrative mode | Enum | Video settings | ✓ |
| Frame type | Enum | Agent 4.1 output ("start-only" \| "start-and-end") | Conditional |
| Image prompt(s) | String OR Object | Agent 4.1 output | ✓ |
| └─ Image prompt (image-reference) | String | Single prompt | - |
| └─ Start frame prompt (start-end) | String | Beginning state | - |
| └─ End frame prompt (start-end) | String | Ending state (if applicable) | - |
| Negative prompt | String | Agent 4.1 output | ✗ |
| Reference images | Array[Image URL] | Agent 4.1 output | ✓ |
| Aspect ratio | Enum | From Step 1 | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| **Image-Reference Mode:** | | Single image per shot |
| └─ Generated image URL | String | Storyboard frame |
| └─ Shot version ID | String | Unique version identifier |
| **Start-End Mode:** | | Smart keyframe generation |
| └─ Start frame URL | String | Beginning keyframe |
| └─ End frame URL | String | Ending keyframe (null if start-only) |
| └─ Shot version ID | String | Unique version identifier |

**Implementation Notes**:
- **Image-Reference Mode**: Generate 1 image per shot (backward compatible)
- **Start-End Mode**: Generate frames based on continuity
  - **start-only**: Generate 1 frame (middle of connected group)
  - **start-and-end**: Generate 2 frames (last in group or non-connected)
- Modern image models (Imagen 4) handle character consistency with reference images
- **No separate consistency checker needed** - model guarantees this
- **No quality validator needed** - user can regenerate if unsatisfied
- Use all reference images (characters + location + style) as model input

**Dual-Mode Logic**:
```javascript
if (narrativeMode === "image-reference") {
  const imageUrl = await generateImage(imagePrompt, negativePrompt, references, aspectRatio);
  return { imageUrl, shotVersionId };
}

if (narrativeMode === "start-end") {
  const startFrameUrl = await generateImage(startFramePrompt, negativePrompt, references, aspectRatio);
  
  if (frameType === "start-only") {
    // Connected shot (middle of group): start frame only
    return { startFrameUrl, endFrameUrl: null, shotVersionId };
  } else {
    // Last in group OR non-connected: both frames
    const endFrameUrl = await generateImage(endFramePrompt, negativePrompt, references, aspectRatio);
    return { startFrameUrl, endFrameUrl, shotVersionId };
  }
}
```

---

### Agent 4.3: Image Editor (AI)

**Role**: Edit generated storyboard images based on user feedback

**AI Model**: Imagen 4 Editor / DALL-E Edit / Stable Diffusion Inpainting

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Original image | Image URL | Agent 4.2 output | ✓ |
| Editing instruction | String | User input | ✓ |
| Reference images | Array[Image URL] | Same as original generation | ✗ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Edited image URL | String | Modified storyboard frame |
| New version ID | String | Version identifier |

**Implementation Notes**:
- Supports iterative refinement without full regeneration
- Maintains character consistency through reference images
- Faster than full regeneration for small changes

---

### Agent 4.4: Video Prompt Engineer (AI)

**Role**: Convert shot description and camera movement into detailed video generation prompt

**AI Model**: GPT-4 / Claude (Prompt Engineering)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Storyboard image | Image URL | Agent 4.2 or 4.3 output | ✓ |
| Shot description | String | Agent 3.2 output | ✓ |
| Camera movement | Enum | Agent 3.2 output | ✓ |
| Shot duration | Integer | Agent 3.3 output | ✓ |
| Characters in shot | Array[String] | Agent 3.2 output (@tags) | ✗ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Video generation prompt | String | Detailed motion/action description |
| Motion parameters | Object | Technical video generation settings |
| └─ Motion strength | Float | How much movement (0.0-1.0) |
| └─ Camera movement type | String | Primary camera motion |

**Implementation Notes**:
- Convert camera movement enum into natural language motion description
- Include action from shot description for more dynamic videos
- Consider shot duration when specifying motion speed
- This runs in Step 4 (Storyboard page) when user clicks "Animate Shot"

**Motion Prompt Templates**:
- Static: "Camera holds steady on the scene with minimal natural movement"
- Zoom In: "Slow cinematic zoom towards the subject, smooth and gradual"
- Pan Right: "Smooth horizontal pan from left to right across the scene"
- Pan Left: "Smooth horizontal pan from right to left across the scene"
- Dolly Forward: "Camera slowly tracks forward into the scene, revealing depth"
- Dolly Back: "Camera slowly pulls back from the scene"

---

### Agent 4.5: Video Generator (AI - Video Model)

**Role**: Generate animated video clips from static storyboard images (single or paired keyframes)

**AI Model**: Kling / Veo / Runway (Image-to-Video)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Narrative mode | Enum | Video settings | ✓ |
| **Image-Reference Mode:** | | Single keyframe input |
| └─ Storyboard image | Image URL | Agent 4.2 or 4.3 output | - |
| **Start-End Mode:** | | Paired keyframe input |
| └─ Start frame | Image URL | Agent 4.2 output | - |
| └─ End frame | Image URL | Agent 4.2 output OR next shot's start | - |
| Video generation prompt | String | Agent 4.4 output | ✓ |
| Motion parameters | Object | Agent 4.4 output | ✓ |
| Shot duration | Integer | Agent 3.3 output | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Animated video clip URL | String | Generated video with motion |
| Actual clip duration | Integer | Final video length (seconds) |

**Implementation Notes**:
- **Image-Reference Mode**: 
  - Use single storyboard image as reference
  - Apply camera movement prompt for motion
  - Generate video with Ken Burns effect or camera movement
  
- **Start-End Mode**:
  - Use **paired keyframes** (start frame → end frame)
  - Video model interpolates motion between frames
  - For connected shots: end frame = next shot's start frame (seamless continuity)
  - For non-connected shots: use shot's own start/end frames
  - **No camera movement prompt needed** - motion is defined by keyframe pair
  
- Modern image-to-video models (Kling, Veo) support:
  - Single image-to-video (image-reference mode)
  - Paired keyframe interpolation (start-end mode)
- Target duration = shot duration from Agent 3.3
- Maintains character/location consistency through reference frames

**Dual-Mode Logic**:
```javascript
if (narrativeMode === "image-reference") {
  // Traditional single-image video generation
  const videoUrl = await generateVideo({
    referenceImage: storyboardImage,
    prompt: videoPrompt,
    motionParams,
    duration: shotDuration
  });
  return { videoUrl, duration: actualDuration };
}

if (narrativeMode === "start-end") {
  // Paired keyframe video generation
  const videoUrl = await generateVideo({
    startFrame,
    endFrame,  // Either shot's own end OR next shot's start
    duration: shotDuration
  });
  // No camera movement needed - interpolation handles motion
  return { videoUrl, duration: actualDuration };
}
```

---

### Agent 4.6: Regeneration Manager (Non-AI)

**Role**: Track and manage multiple versions of storyboard frames

**Type**: Algorithmic (Non-AI)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Shot ID | String | Shot identifier | ✓ |
| Regeneration request | Object | User action | ✓ |
| Previous versions | Array[Object] | Shot version history | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| New version created | Boolean | Success status |
| Current version pointer | String | Active version ID |
| Version history | Array[Object] | All versions for this shot |

**Implementation Notes**:
- Manages shot_versions table
- Tracks which version is currently approved
- Maintains version history for user browsing
- Enforces mutual exclusivity (only one approved version per shot)
- Automatically updates currentVersionId pointer

---

### Agent 4.7: Continuity Manager (Non-AI)
**Status**: ⚠️ **START-END FRAME MODE ONLY**

**Role**: Track dependencies and manage re-rendering warnings for connected shots

**Type**: Algorithmic (Non-AI)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Shot ID | String | Modified shot identifier | ✓ |
| Regeneration action | Enum | "regenerate-frame" \| "edit-frame" | ✓ |
| Frame type | Enum | "start" \| "end" | ✓ |
| Continuity groups | Array[Object] | Agent 3.4 output | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Affected shots | Array[String] | Shot IDs that need re-rendering |
| Warning message | String | User-facing dependency warning |
| Cascade update required | Boolean | Whether dependent videos need regeneration |

**Implementation Notes**:
- **Only runs in "start-end" narrative mode** - not needed in image-reference mode
- Tracks frame dependencies in connected shot groups
- When a shot's start frame is regenerated:
  - Find if previous shot in group uses this as end frame
  - Mark previous shot's video as "needs re-render"
  - Warn user about cascade effect
- Validates chronological ordering within continuity groups
- Prevents continuity breaks by surfacing dependency conflicts

**Dependency Tracking Logic**:
```javascript
function handleFrameRegeneration(shotId, frameType, continuityGroups) {
  if (frameType === "start") {
    // Find if any previous shot uses this as end frame
    const prevShot = findPreviousConnectedShot(shotId, continuityGroups);
    if (prevShot) {
      // Mark previous shot's video for re-render
      markNeedsRerender(prevShot.id);
      return {
        affectedShots: [prevShot.id],
        warning: `Regenerating this frame will affect Shot ${prevShot.number}'s video. Proceed?`,
        cascadeRequired: true
      };
    }
  }
  
  if (frameType === "end") {
    // Find if this is last shot in group
    const isLastInGroup = findIfLastInGroup(shotId, continuityGroups);
    if (!isLastInGroup) {
      // This shot's end is next shot's start - cannot regenerate
      return {
        affectedShots: [],
        warning: "This frame is shared with the next shot. Cannot regenerate independently.",
        cascadeRequired: false
      };
    }
  }
  
  return { affectedShots: [], warning: null, cascadeRequired: false };
}
```

**User Experience**:
- When regenerating start frame of Shot N:
  - If Shot N-1 connects to Shot N: Show warning dialog
  - After confirming: Mark Shot N-1 video with "⚠️ Re-render needed" badge
  - User must manually re-generate Shot N-1's video
- Prevents silent continuity breaks
- Maintains visual consistency across connected shots

---

## Step 5: Animatic Preview

**Purpose**: Combine all shots into timed video sequence with audio

### Agent 5.1: Voiceover Synthesizer (AI)

**Role**: Generate narrator voiceover for the script

**AI Model**: Eleven Labs / Google Text-to-Speech (Voice Synthesis)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Full script text | String | Agent 1.1 output | ✓ |
| Voice settings | Object | User selection | ✓ |
| └─ Voice ID | String | Selected narrator voice | ✓ |
| └─ Speed | Float | Playback speed multiplier | ✗ |
| └─ Pitch | Integer | Voice pitch adjustment | ✗ |
| Language | ISO code | From Step 1 | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Audio file URL | String | Complete narration audio |
| Actual duration | Integer | Total audio length (seconds) |
| Word timestamps | Array[Object] | Timing for each word |
| └─ Word | String | Text |
| └─ Start time | Float | Seconds from beginning |
| └─ End time | Float | Seconds from beginning |

**Implementation Notes**:
- **No character voices for MVP** - only narrator
- **No phoneme timing needed** - no lip-sync in current scope
- Word timestamps enable subtitle synchronization
- Actual duration may differ from estimated - use for final timing adjustment

---

### Agent 5.2: Background Music Composer (AI)

**Role**: Generate background music for the video

**AI Model**: Suno / MusicGen / Stable Audio (Music Generation)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Music style | String | User selection | ✓ |
| Duration | Integer | Total video duration | ✓ |
| Mood/Tone | String | From script genre/style | ✗ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Music file URL | String | Background music track |
| Duration | Integer | Track length |

**Implementation Notes**:
- Music styles from UI: "Cinematic Epic", "Upbeat Pop", "Ambient Chill", etc.
- Should loop seamlessly if video is longer than generated track
- Volume controlled by user in Animatic page

---

### Agent 5.3: Video Compositor (Non-AI)

**Role**: Combine all shot videos into single timeline with audio

**Type**: Video Processing (FFmpeg / Cloud Video API)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Shot video clips | Array[Object] | Agent 4.4 outputs | ✓ |
| └─ Video URL | String | Animated shot clip | ✓ |
| └─ Duration | Integer | Clip length | ✓ |
| └─ Sequence order | Integer | Position in timeline | ✓ |
| Voiceover audio | Audio URL | Agent 5.1 output | ✓ |
| Background music | Audio URL | Agent 5.2 output | ✗ |
| Music volume | Float | User setting (0-100) | ✗ |
| Subtitle data | Array[Object] | Agent 5.1 word timestamps | ✗ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Animatic video URL | String | Complete preview video |
| Total duration | Integer | Final video length |
| Processing status | Enum | "processing" / "ready" / "error" |

**Implementation Notes**:
- **Videos are already generated** in Step 4 (Agent 4.4)
- If shot not animated: apply simple zoom in/out effect for its duration
- Concatenate all shots in sequence order
- Mix voiceover (100% volume) + background music (user-controlled volume)
- Burn subtitles if enabled (position/size from user settings)
- **Rendering time**: Typically <30 seconds for MVP length videos
- Use cloud processing (AWS MediaConvert, Cloudflare Stream, etc.)

**Fallback for Non-Animated Shots**:
- Use static storyboard image
- Apply subtle zoom (Ken Burns effect) for shot duration
- Ensures complete video even if user skips animation step

---

## Step 6: Export & Publish

**Purpose**: Render final video and publish to platforms

### Agent 6.1: Final Video Renderer (Non-AI)

**Role**: Generate final high-quality export video

**Type**: Video Processing (FFmpeg / Cloud Rendering)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Animatic video | Video URL | Agent 5.3 output | ✓ |
| Export settings | Object | User selections | ✓ |
| └─ Resolution | Enum | 1080p, 4K, etc. | ✓ |
| └─ Format | Enum | MP4, MOV, WebM | ✓ |
| └─ Quality | Enum | Low, Medium, High | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Final video URL | String | Downloadable video file |
| File size | Integer | Bytes |
| Processing time | Integer | Render duration (seconds) |

**Implementation Notes**:
- This is the **final export-quality render**
- Higher bitrate and resolution than animatic preview
- Optimized for download and platform upload
- May take longer than animatic preview (1-2 minutes)

---

### Agent 6.2: Platform Publisher (Non-AI + API)

**Role**: Upload and publish video to social media platforms

**Type**: API Integration (YouTube, TikTok, Instagram, Facebook)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Final video | Video URL | Agent 6.1 output | ✓ |
| Platform | Enum | YouTube, TikTok, Instagram, Facebook | ✓ |
| Publishing metadata | Object | User input | ✓ |
| └─ Title | String | Video title | ✓ |
| └─ Description | String | Video description | ✗ |
| └─ Tags/Hashtags | Array[String] | Keywords | ✗ |
| └─ Thumbnail | Image URL | Custom thumbnail | ✗ |
| └─ Privacy | Enum | Public, Unlisted, Private | ✓ |
| └─ Schedule time | DateTime | Publish timestamp | ✗ |
| Platform credentials | OAuth Token | User authorization | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Upload status | Enum | "uploading" / "published" / "scheduled" / "error" |
| Published URL | String | Live video link |
| Platform video ID | String | Platform-specific identifier |

**Implementation Notes**:
- Requires OAuth authentication for each platform
- Support immediate publish OR scheduled publish
- Different platforms have different requirements:
  - **YouTube**: Supports all features, long-form content
  - **TikTok**: Max 10 min, vertical preferred (9:16)
  - **Instagram Reels**: Max 90 seconds, vertical only (9:16)
  - **Facebook**: Similar to YouTube
- Store published URLs in content_calendar table
- Handle platform-specific errors and restrictions

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         STEP 1: SCRIPT EDITOR                   │
├─────────────────────────────────────────────────────────────────┤
│  User Input → Agent 1.1 (Script Generator) → Script Text        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                       STEP 2: WORLD & CAST                      │
├─────────────────────────────────────────────────────────────────┤
│  Script → Agent 2.1 (Character Analyzer) → Character List       │
│                                                                  │
│  Script → Agent 2.2 (Location Analyzer) → Location List         │
│                                                                  │
│  Character + @style → Agent 2.3 (Char Image Gen) → @character   │
│  + References                                   Reference Images │
│                                                                  │
│  Location + @style → Agent 2.6 (Loc Image Gen) → @location{id}  │
│  + References                                   Reference Images │
│                                                                  │
│  Style Image → Agent 2.5 (Style Descriptor) → @style Text       │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                     STEP 3: SCENE BREAKDOWN                     │
├─────────────────────────────────────────────────────────────────┤
│  Script + Characters + Locations                                │
│      → Agent 3.1 (Scene Analyzer) → Scenes with @tags           │
│                                                                  │
│  Scenes + Full Script                                           │
│      → Agent 3.2 (Shot Composer) → Shots with @tags             │
│                                    (narration + action)          │
│                                                                  │
│  All Shots → Agent 3.3 (Timing Calc) → Adjusted Durations       │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 4: STORYBOARD EDITOR                    │
├─────────────────────────────────────────────────────────────────┤
│  Shot + @tags + References                                      │
│      → Agent 4.1 (Shot Prompt Eng) → Image Prompts              │
│                                       + Ref URLs                 │
│                                                                  │
│  Prompts + Refs → Agent 4.2 (Image Gen) → Storyboard Images     │
│                                                                  │
│  Image + Edit Request → Agent 4.3 (Editor) → Edited Image       │
│                                                                  │
│  Image + Shot Data → Agent 4.4 (Video Prompt Eng) → Video       │
│                                                      Prompt      │
│                                                                  │
│  Image + Video Prompt → Agent 4.5 (Video Gen) → Video Clips     │
│                                                                  │
│  User Actions → Agent 4.6 (Regen Manager) → Version Control     │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 5: ANIMATIC PREVIEW                     │
├─────────────────────────────────────────────────────────────────┤
│  Script → Agent 5.1 (Voiceover) → Narration Audio               │
│                                   + Word Timestamps              │
│                                                                  │
│  Music Style → Agent 5.2 (Music Gen) → Background Music         │
│                                                                  │
│  Video Clips + Audio + Subtitles                                │
│      → Agent 5.3 (Video Compositor) → Animatic Preview          │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 6: EXPORT & PUBLISH                     │
├─────────────────────────────────────────────────────────────────┤
│  Animatic + Settings → Agent 6.1 (Renderer) → Final Video       │
│                                                                  │
│  Final Video + Metadata → Agent 6.2 (Publisher) → Published URL │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Priority

### Phase 1: Core Narrative Pipeline (MVP)
**Goal**: End-to-end script → storyboard → video flow

1. **Agent 1.1** - Script Generator ✓ Critical
2. **Agent 2.1** - Character Analyzer ✓ Critical
3. **Agent 2.2** - Location Analyzer ✓ Critical
4. **Agent 2.5** - Style Descriptor ✓ Critical for consistency
5. **Agent 2.3** - Character Image Generator ✓ Critical
6. **Agent 2.6** - Location Image Generator ✓ Critical
7. **Agent 3.1** - Scene Analyzer ✓ Critical
8. **Agent 3.2** - Shot Composer ✓ Critical
9. **Agent 3.3** - Timing Calculator ✓ Validation
10. **Agent 3.4** - Continuity Producer ⚠️ Start-End Mode only

### Phase 2: Visual Generation
**Goal**: Storyboard image generation with consistency

12. **Agent 4.1** - Shot Prompt Engineer ✓ Critical (dual-mode support)
13. **Agent 4.2** - Storyboard Image Generator ✓ Critical (dual-mode support)
14. **Agent 4.6** - Regeneration Manager ✓ Version control
15. **Agent 4.7** - Continuity Manager ⚠️ Start-End Mode only

### Phase 3: Animation & Preview
**Goal**: Animated shots and complete preview

16. **Agent 4.4** - Video Prompt Engineer ✓ Critical
17. **Agent 4.5** - Video Generator ✓ Animation (dual-mode support)
18. **Agent 5.1** - Voiceover Synthesizer ✓ Audio
19. **Agent 5.2** - Background Music Composer ✓ Music
20. **Agent 5.3** - Video Compositor ✓ Final assembly

### Phase 4: Polish & Publishing
**Goal**: Export and distribution

19. **Agent 4.3** - Image Editor ⚠️ Enhancement (nice-to-have)
20. **Agent 6.1** - Final Video Renderer ✓ Export
21. **Agent 6.2** - Platform Publisher ✓ Distribution

### Deferred (Future Enhancement)
- **Agent 2.4** - Voice Generator (character voices)
- Advanced quality validators
- Batch processing optimization

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Total Agents** | 22 |
| **AI Agents** | 16 (15 active + 1 deferred) |
| **Non-AI Agents** | 6 |
| **Deferred Agents** | 1 (Agent 2.4) |
| **Active Agents** | 21 |
| **Critical Path Agents** | 17 |
| **Start-End Mode Only** | 2 (Agent 3.4, 4.7) |

### AI Model Requirements

| Model Type | Use Cases | Suggested Providers |
|------------|-----------|-------------------|
| Text Generation | Script writing, analysis | GPT-4, Claude, Gemini |
| Text-to-Image | Characters, locations, storyboards | Imagen 4, DALL-E 3, SD |
| Image-to-Text | Style description | GPT-4 Vision, Claude Vision |
| Image-to-Video | Camera movements | Kling, Veo, Runway |
| Text-to-Speech | Voiceover | Eleven Labs, Google TTS |
| Text-to-Music | Background music | Suno, MusicGen, Stable Audio |

---

**End of Document**
