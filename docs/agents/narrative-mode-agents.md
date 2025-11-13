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

The Narrative Mode workflow consists of **22 specialized agents** (AI and non-AI) that guide users from initial concept to final published video. Each agent has specific inputs, outputs, and responsibilities designed to create a seamless creative experience.

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
| Suggested pacing notes | String | Recommendations for pacing (slow/medium/fast sections) |

**Implementation Notes**:
- Use structured prompting to enforce duration constraints
- Include pacing notes for later timing calculations
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
- Include pacing suggestions (mark slower/faster sections)
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

### Agent 2.2: Character Prompt Engineer (AI)

**Role**: Generate image generation prompts for character reference images

**AI Model**: GPT-4 / Claude (Prompt Engineering)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Character details | Object | Agent 2.1 output OR user-created character | ✓ |
| └─ Name | String | Character identifier | ✓ |
| └─ Appearance description | String | Physical traits | ✓ |
| └─ Personality traits | String | Behavioral info | ✓ |
| Art style reference | Image URL | Agent 2.5 output (@style) | ✗ |
| Additional reference images | Array[Image URL] | User uploads | ✗ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Image generation prompt | String | Optimized prompt for character image |
| Negative prompt | String | Elements to avoid |

**Implementation Notes**:
- **If art style reference exists**: Incorporate style cues into prompt
- **If character reference images exist**: Note "use reference image for consistency"
- Remove "key visual traits list" and "color palette" (not needed downstream)
- Focus on clear, detailed physical descriptions suitable for image models

**Prompt Engineering Strategy**:
```
Character: {name}
Physical: {appearance_description}
Personality: {personality_traits}
Style: {art_style_cues if @style exists}
Reference: {note_if_reference_images_exist}

Generate a detailed image prompt optimized for character consistency.
```

---

### Agent 2.3: Character Image Generator (AI)

**Role**: Generate character reference images for visual consistency

**AI Model**: Imagen 4 / DALL-E 3 / Stable Diffusion (Image Generation with Character Consistency)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Image prompt | String | Agent 2.2 output | ✓ |
| Negative prompt | String | Agent 2.2 output | ✗ |
| Character reference images | Array[Image URL] | User uploads | ✗ |
| Aspect ratio | Enum | Fixed: "1:1" (square portraits) | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Generated image URL | String | Character reference image |
| Character ID | String | Unique identifier (@character{id}) |

**Implementation Notes**:
- **No art style in input** - already incorporated in Agent 2.2's prompt
- Use character reference images if provided for better consistency
- Generate square 1:1 portraits for character sheets
- Modern image models (Imagen 4, DALL-E 3) support character consistency natively
- **No separate consistency checker needed** - model handles this

---

### Agent 2.4: Voice Generator (AI)
**Status**: ⚠️ **DEFERRED** - Not needed for MVP

**Reason**: No character voices in current scope, only narrator voice

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
| Style description | String | Detailed text description of art style |
| Key visual elements | Array[String] | Important style characteristics |
| Color palette notes | String | Dominant colors and schemes |
| Artistic technique | String | Rendering style (watercolor, 3D, anime, etc.) |

**Implementation Notes**:
- This text description becomes **@style** for all subsequent image generation
- Extract: artistic medium, color schemes, lighting style, mood, rendering technique
- Use in Agents 2.2, 2.6, 4.2 to maintain consistent visual style

**Prompt Template**:
```
Analyze this style reference image and provide:
1. Overall artistic style description
2. Key visual characteristics
3. Color palette and mood
4. Rendering technique

This description will be used to generate images in the same style.
```

---

### Agent 2.6: Location Prompt Engineer (AI)

**Role**: Generate image prompts for location reference images

**AI Model**: GPT-4 / Claude (Prompt Engineering)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Location details | Object | User-created location | ✓ |
| └─ Name | String | Location identifier | ✓ |
| └─ Description | String | Physical environment | ✓ |
| └─ Atmosphere/Mood | String | Emotional tone | ✗ |
| Art style description | String | Agent 2.5 output (@style) | ✗ |
| Additional reference images | Array[Image URL] | User uploads | ✗ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Image generation prompt | String | Optimized location prompt |
| Negative prompt | String | Elements to avoid |

**Implementation Notes**:
- Similar to Agent 2.2 but for environments/locations
- Incorporate @style description if available
- Focus on architectural details, lighting, atmosphere
- No characters should appear in location shots

---

### Agent 2.7: Location Image Generator (AI)

**Role**: Generate location reference images for environmental consistency

**AI Model**: Imagen 4 / DALL-E 3 / Stable Diffusion (Image Generation)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Image prompt | String | Agent 2.6 output | ✓ |
| Negative prompt | String | Agent 2.6 output | ✗ |
| Location reference images | Array[Image URL] | User uploads | ✗ |
| Aspect ratio | Enum | User's video aspect ratio (16:9, 9:16, etc.) | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Generated image URL | String | Location reference image |
| Location ID | String | Unique identifier (@location{id}) |

**Implementation Notes**:
- Generate in video's aspect ratio for easier composition
- Use reference images if provided
- Focus on establishing shots and environment

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
| Pacing notes | String | Agent 1.1 output | ✗ |
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
- Consider pacing notes when allocating time
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
| └─ Camera angle | Enum | Close-up, Medium, Wide, Extreme Wide, etc. |
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

## Step 4: Storyboard Editor

**Purpose**: Generate and refine images for each shot

### Agent 4.1: Shot Prompt Engineer (AI)

**Role**: Generate optimized image prompts for each storyboard frame

**AI Model**: GPT-4 / Claude (Prompt Engineering)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Shot data | Object | Agent 3.2 output | ✓ |
| └─ Camera angle | String | Framing info | ✓ |
| └─ Action description | String | With @tags | ✓ |
| └─ Characters | Array[String] | @character{id} list | ✓ |
| └─ Location | String | @location{id} | ✓ |
| Character reference images | Map[ID→URL] | Agent 2.3 outputs | ✓ |
| Location reference images | Map[ID→URL] | Agent 2.7 outputs | ✓ |
| Art style description | String | Agent 2.5 output (@style) | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Image generation prompt | String | Detailed prompt with all references |
| Negative prompt | String | Elements to avoid |
| Reference image URLs | Array[String] | Character/location images to use |

**Implementation Notes**:
- **No "Technical parameters" needed** - aspect ratio already set in Step 1
- Parse @tags from action description
- Inject corresponding reference images automatically
- Combine: camera angle + action + character refs + location ref + art style
- **Art style already in prompt** - came from previous agents

**Prompt Construction**:
```
{camera_angle} shot of {action_description_with_resolved_tags}
Characters: [reference images for @character1, @character2...]
Location: [reference image for @location1]
Style: {art_style_description}
Technical: {aspect_ratio from Step 1}
```

---

### Agent 4.2: Storyboard Image Generator (AI)

**Role**: Generate storyboard frame images

**AI Model**: Imagen 4 / DALL-E 3 (Image Generation with Reference)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Image prompt | String | Agent 4.1 output | ✓ |
| Negative prompt | String | Agent 4.1 output | ✗ |
| Reference images | Array[Image URL] | Agent 4.1 output | ✓ |
| Aspect ratio | Enum | From Step 1 | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Generated image URL | String | Storyboard frame |
| Shot version ID | String | Unique version identifier |

**Implementation Notes**:
- Modern image models (Imagen 4) handle character consistency with reference images
- **No separate consistency checker needed** - model guarantees this
- **No quality validator needed** - user can regenerate if unsatisfied
- Use all reference images (characters + location + style) as model input

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

### Agent 4.4: Camera Movement Applicator (AI - Video Generation)

**Role**: Apply camera movements to static storyboard images (generate short video clips)

**AI Model**: Kling / Veo / Runway (Image-to-Video)

**Inputs**:
| Field | Type | Source | Required |
|-------|------|--------|----------|
| Storyboard image | Image URL | Agent 4.2 or 4.3 output | ✓ |
| Camera movement | Enum | Agent 3.2 output | ✓ |
| Shot duration | Integer | Agent 3.3 output | ✓ |
| Motion prompt | String | Auto-generated from movement type | ✓ |

**Outputs**:
| Field | Type | Description |
|-------|------|-------------|
| Animated video clip URL | String | Short video with camera movement |
| Clip duration | Integer | Actual video length |

**Implementation Notes**:
- Convert camera movement enum to motion prompt:
  - "Static" → minimal motion, hold frame
  - "Pan Left/Right" → horizontal camera movement
  - "Zoom In/Out" → camera zoom effect
  - "Dolly Forward/Back" → camera track movement
- Target duration = shot duration from Agent 3.3
- This runs in Step 4 (Storyboard page) when user clicks "Animate Shot"

**Motion Prompt Templates**:
- Static: "Camera holds steady on the scene"
- Zoom In: "Slow zoom in towards the subject"
- Pan Right: "Smooth pan from left to right"
- Dolly Forward: "Camera slowly moves forward into the scene"

---

### Agent 4.5: Regeneration Manager (Non-AI)

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
│                                              → Pacing Notes      │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                       STEP 2: WORLD & CAST                      │
├─────────────────────────────────────────────────────────────────┤
│  Script → Agent 2.1 (Character Analyzer) → Character List       │
│                                                                  │
│  Character List → Agent 2.2 (Char Prompt Eng) → Image Prompts   │
│  + @style                                                        │
│                                                                  │
│  Image Prompts → Agent 2.3 (Char Image Gen) → @character{id}    │
│  + References                                  Reference Images  │
│                                                                  │
│  Style Image → Agent 2.5 (Style Descriptor) → @style Text       │
│                                                                  │
│  Location + @style → Agent 2.6 (Loc Prompt) → Location Prompts  │
│                                                                  │
│  Location Prompts → Agent 2.7 (Loc Image Gen) → @location{id}   │
│                                                  Reference Images│
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
│  Image + Movement → Agent 4.4 (Camera Movement) → Video Clips   │
│                                                                  │
│  User Actions → Agent 4.5 (Regen Manager) → Version Control     │
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
3. **Agent 2.5** - Style Descriptor ✓ Critical for consistency
4. **Agent 2.2** - Character Prompt Engineer ✓ Critical
5. **Agent 2.3** - Character Image Generator ✓ Critical
6. **Agent 2.6** - Location Prompt Engineer ✓ Critical
7. **Agent 2.7** - Location Image Generator ✓ Critical
8. **Agent 3.1** - Scene Analyzer ✓ Critical
9. **Agent 3.2** - Shot Composer ✓ Critical
10. **Agent 3.3** - Timing Calculator ✓ Validation

### Phase 2: Visual Generation
**Goal**: Storyboard image generation with consistency

11. **Agent 4.1** - Shot Prompt Engineer ✓ Critical
12. **Agent 4.2** - Storyboard Image Generator ✓ Critical
13. **Agent 4.5** - Regeneration Manager ✓ Version control

### Phase 3: Animation & Preview
**Goal**: Animated shots and complete preview

14. **Agent 4.4** - Camera Movement Applicator ✓ Animation
15. **Agent 5.1** - Voiceover Synthesizer ✓ Audio
16. **Agent 5.2** - Background Music Composer ✓ Music
17. **Agent 5.3** - Video Compositor ✓ Final assembly

### Phase 4: Polish & Publishing
**Goal**: Export and distribution

18. **Agent 4.3** - Image Editor ⚠️ Enhancement (nice-to-have)
19. **Agent 6.1** - Final Video Renderer ✓ Export
20. **Agent 6.2** - Platform Publisher ✓ Distribution

### Deferred (Future Enhancement)
- **Agent 2.4** - Voice Generator (character voices)
- Advanced quality validators
- Batch processing optimization

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Total Agents** | 22 |
| **AI Agents** | 16 |
| **Non-AI Agents** | 4 |
| **Deferred Agents** | 1 |
| **Critical Path Agents** | 17 |

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
