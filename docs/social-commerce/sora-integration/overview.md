# Sora 2 & Sora 2 Pro - Complete Specification

> **Last Updated**: 2025-01-XX  
> **Purpose**: Comprehensive documentation for Sora 2 and Sora 2 Pro capabilities, API parameters, and best practices for commercial video generation in the social commerce pipeline.

---

## Table of Contents

1. [Model Overview](#1-model-overview)
2. [Technical Specifications](#2-technical-specifications)
3. [Input Capabilities](#3-input-capabilities)
4. [Audio Capabilities](#4-audio-capabilities)
5. [API Parameters (Runware)](#5-api-parameters-runware)
6. [Prompt Engineering Best Practices](#6-prompt-engineering-best-practices)
7. [Limitations](#7-limitations)
8. [Use Cases for Social Commerce](#8-use-cases-for-social-commerce)
9. [Integration Notes](#9-integration-notes)
10. [Example Prompts](#10-example-prompts)

---

## 1. Model Overview

### Sora 2 vs Sora 2 Pro

**Sora 2** (`openai:3@1`)
- Standard variant with core video generation capabilities
- Optimized for general-purpose video creation
- Lower cost option for standard quality needs

**Sora 2 Pro** (`openai:3@2`)
- Higher-quality variant with enhanced capabilities
- Refined control and better consistency
- Additional resolution options (7:4 and 4:7 aspect ratios)
- Better suited for demanding professional use cases
- Ideal for commercial advertising and premium content

### Use Cases

- **Commercial Advertising**: Product showcases, brand campaigns
- **Social Media Content**: Instagram Reels, TikTok, YouTube Shorts
- **Product Demonstrations**: Feature reveals, lifestyle moments
- **Cinematic Content**: Short films, trailers, promotional videos
- **Educational Content**: Tutorials, explainer videos

### Model AIR IDs (Runware)

- **Sora 2**: `openai:3@1`
- **Sora 2 Pro**: `openai:3@2`

---

## 2. Technical Specifications

### Durations

- **Supported**: 4, 8, and 12 seconds
- **API Limitation**: Fixed durations only (no custom durations)
- **Note**: Web interface supports up to 25 seconds for Pro users, but API is limited to 12 seconds

### Resolutions

**Sora 2:**
- 1280×720 (16:9 landscape)
- 720×1280 (9:16 portrait)

**Sora 2 Pro:**
- 1280×720 (16:9 landscape)
- 720×1280 (9:16 portrait)
- 1792×1024 (7:4 landscape) - **Pro only**
- 1024×1792 (4:7 portrait) - **Pro only**

### Aspect Ratios

- **16:9** - Standard landscape (both models)
- **9:16** - Standard portrait (both models)
- **7:4** - Wide landscape (Pro only)
- **4:7** - Tall portrait (Pro only)

### Prompt Specifications

- **Minimum Length**: 1 character
- **Maximum Length**: 4000 characters
- **Best Practice**: Detailed, comprehensive prompts produce premium quality results

### Frame Rate

- **Estimated**: 30 FPS (not explicitly documented, but standard for video generation)

### Input Image Requirements

- **Width**: 300-2048 pixels
- **Height**: 300-2048 pixels
- **File Size**: Maximum 20MB
- **Formats**: JPEG, PNG, WebP
- **Dimension Matching**: Input image dimensions must match output video dimensions

---

## 3. Input Capabilities

### Text-to-Video

**Primary Workflow**
- Generate videos from detailed text prompts
- No image input required
- Full creative control via prompt description

**Best For:**
- Original content creation
- Creative storytelling
- Scenes without specific reference images

### Image-to-Video

**Single Input Image Support**
- **First Frame Only**: Only the first frame can be provided (last frame not supported)
- **Dimension Matching**: Input image dimensions must exactly match output video dimensions
- **Image Formats**: JPEG, PNG, WebP
- **Image Source**: Can be provided via:
  - URL (publicly accessible)
  - Base64-encoded string
  - Image UUID (if uploaded to Runware)

**Use Cases:**
- Animating static product images
- Creating continuity between shots (pass previous shot's last frame)
- Starting from a specific visual state

**Limitations:**
- **Single Image Only**: Cannot provide multiple reference images
- **No Last Frame**: Cannot specify the ending frame of the video
- **Dimension Constraint**: Must match output dimensions exactly

---

## 4. Audio Capabilities

### Synchronized Audio Generation

Sora 2 and Sora 2 Pro generate **synchronized audio** automatically with video generation. No separate audio API call is needed.

### Audio Components

- **Dialogue**: Natural speech synchronized with video
- **Sound Effects**: Environmental sounds, action sounds, impact sounds
- **Background Music**: Ambient music, musical scores
- **Voiceover**: Narration, commentary

### Audio Characteristics

- **Automatic Generation**: Audio is generated automatically based on video content
- **Synchronization**: Audio is perfectly synchronized with video motion
- **Context-Aware**: Audio matches the visual content and mood
- **No Configuration Needed**: Audio generation is automatic (no parameters required)

### Best Practices

- Describe desired audio in the prompt for better results
- Mention sound effects, music style, or dialogue in prompt descriptions
- Example: "with dramatic orchestral music building to crescendo" or "with subtle ambient sounds of nature"

---

## 5. API Parameters (Runware)

### Request Structure

```typescript
{
  "taskType": "videoInference",
  "taskUUID": "unique-task-id",
  "model": "openai:3@1" | "openai:3@2",  // Sora 2 or Sora 2 Pro
  "positivePrompt": "string (1-4000 chars)",
  "duration": 4 | 8 | 12,  // seconds
  "width": number,  // Must match supported dimensions
  "height": number,  // Must match supported dimensions
  "frameImages": [  // Optional, for image-to-video
    {
      "inputImage": "image-uuid-or-url"
    }
  ]
}
```

### Parameter Details

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskType` | string | Yes | Must be `"videoInference"` |
| `taskUUID` | string | Yes | Unique identifier for the task |
| `model` | string | Yes | `"openai:3@1"` (Sora 2) or `"openai:3@2"` (Sora 2 Pro) |
| `positivePrompt` | string | Yes | 1-4000 characters, detailed video description |
| `duration` | number | Yes | 4, 8, or 12 seconds |
| `width` | number | Yes | Must match supported dimensions for selected model |
| `height` | number | Yes | Must match supported dimensions for selected model |
| `frameImages` | array | No | Single object with `inputImage` for image-to-video |

### Example: Text-to-Video

```json
{
  "taskType": "videoInference",
  "taskUUID": "f47ac10b-58cc-4372-a567-0e02b2c3d492",
  "model": "openai:3@1",
  "positivePrompt": "A person walking down a busy city street at sunset, realistic physics and natural movement",
  "duration": 8,
  "width": 1280,
  "height": 720
}
```

### Example: Image-to-Video

```json
{
  "taskType": "videoInference",
  "taskUUID": "6ba7b831-9dad-11d1-80b4-00c04fd430c8",
  "model": "openai:3@2",
  "frameImages": [
    { "inputImage": "c64351d5-4c59-42f7-95e1-eace013eddab" }
  ],
  "positivePrompt": "The scene comes alive with natural movement and realistic physics",
  "duration": 12,
  "width": 1024,
  "height": 1792
}
```

---

## 6. Prompt Engineering Best Practices

### Core Principle

**Detailed prompts lead to premium quality**: Comprehensive, well-structured prompts produce significantly better results than brief descriptions.

### Timeline-Aware Prompts

Sora can understand and generate videos with complex timelines described in a single prompt.

**Format:**
```
Generate a [duration]-second video with this timeline:

0.0s - X.Xs (Shot 1):
- Description of shot 1
- Camera movement, lighting, subject

X.Xs - Y.Ys (Shot 2):
- Description of shot 2
- Continuity from previous shot
```

**Benefits:**
- Generate complete videos in one API call
- Maintain visual continuity across shots
- Control exact timing of each shot
- Create professional multi-shot sequences

### Connected Shots

Describe visual continuity between shots explicitly in the prompt.

**Key Elements:**
- **START FRAME**: Describe what Shot 2 begins with (matching Shot 1's end)
- **CONTINUITY**: Explicitly state what carries over (lighting, position, subject state)
- **SEAMLESS CONNECTION**: Use phrases like "Starts EXACTLY where previous shot ended"
- **END FRAME STATE**: Describe the ending state for next shot reference

**Example:**
```
Shot 2 [CONNECTED]:
Starts EXACTLY where Shot 1 ended. Same cup position, same 45° angle, same golden lighting.
Camera continues dolly-out movement, cup stays centered. Logo visible, steam rising.
```

### Motion Speed Control

Control motion speed via prompt descriptions (no post-processing needed).

**Techniques:**
- **Speed Multipliers**: "10× speed", "rapid dolly-in at 16.7× speed"
- **Relative Speed**: "Camera moves 3× faster than normal"
- **Speed Descriptions**: "Rapid", "slow", "extreme speed", "gentle movement"

**Example:**
```
Rapid dolly-in at 12× speed, camera moves from wide to extreme close-up
```

### Speed Curves

Describe acceleration/deceleration patterns in prompts.

**Curve Types:**
- **EASE_IN**: "Accelerates from slow to fast"
- **EASE_OUT**: "Decelerates from fast to slow"
- **LINEAR**: "Constant speed throughout"

**Example:**
```
Camera dolly-in movement, motion accelerates from slow to fast (EASE_IN curve)
```

### Cinematography Details

Include professional cinematography terminology for better results.

**Elements to Include:**
- **Camera Movement**: Dolly-in, dolly-out, orbital, pan, tilt, tracking, static, micro-drift
- **Lens Selection**: 24mm wide, 50mm standard, 85mm portrait, 100mm macro
- **Depth of Field**: f/1.4 (ultra-shallow), f/2.8 (shallow), f/4.0 (medium), f/8.0+ (deep)
- **Framing**: ECU (extreme close-up), CU (close-up), MCU (medium close-up), MED (medium), WIDE
- **Lighting**: Direction, quality, temperature, intensity

**Example:**
```
85mm portrait lens, shallow depth of field (f/1.8), dolly-in from wide to close-up,
golden hour lighting from upper left, warm tones
```

### Visual Continuity

Explicitly describe how shots connect visually.

**What to Match:**
- **Subject Position**: Same position, same angle, same state
- **Lighting**: Same direction, same temperature, same quality
- **Color Palette**: Same tones, same mood
- **Environment**: Same space, same background
- **Camera Angle**: Continuation of movement or matching position

**Example:**
```
Maintains same golden hour lighting, same warm color palette, same cup position.
Camera continues movement seamlessly from previous shot.
```

### Professional Commercial Structure

Structure prompts like professional video production briefs.

**Recommended Structure:**
1. **Timeline Breakdown**: Exact timings for each shot
2. **Shot Descriptions**: What happens in each shot
3. **Cinematography**: Technical details (camera, lens, lighting)
4. **Motion**: Speed and movement patterns
5. **Continuity**: How shots connect
6. **Style Guide**: Overall aesthetic, mood, color grade

---

## 7. Limitations

### Input Limitations

- **Single Image Input Only**: Cannot provide multiple reference images in one request
- **First Frame Only**: Only the first frame can be provided for image-to-video (last frame not supported)
- **Dimension Matching Required**: Input image dimensions must exactly match output video dimensions

### Duration Limitations

- **Fixed Durations Only**: Only 4, 8, or 12 seconds available via API
- **No Custom Durations**: Cannot request arbitrary durations (e.g., 5.5 seconds, 10 seconds)
- **Web Interface Difference**: Web interface supports up to 25 seconds for Pro users, but API is limited to 12 seconds

### Feature Limitations

- **Storyboard Tool**: Available in web interface but not accessible via API
- **No Last Frame Control**: Cannot specify the ending frame of the video
- **No Multi-Image Composition**: Cannot combine multiple images in one generation

### Resolution Limitations

- **Sora 2**: Limited to 16:9 and 9:16 aspect ratios
- **Sora 2 Pro**: Additional 7:4 and 4:7 ratios, but still limited to specific dimensions
- **No Custom Resolutions**: Must use exact supported dimensions

### Prompt Limitations

- **4000 Character Maximum**: Prompts cannot exceed 4000 characters
- **Single Prompt**: Cannot provide multiple prompts or prompt variations in one request

---

## 8. Use Cases for Social Commerce

### Single Video Generation

**Advantage**: Generate complete commercial videos in one API call instead of multiple shot generations.

**Workflow:**
1. Agent 4.1 creates shot manifest (all shots)
2. Agent 4.2 calculates timing (all shot durations)
3. Sora Prompt Synthesizer creates one comprehensive prompt
4. Single Sora API call generates complete video

**Benefits:**
- Faster generation (one call vs. 10-20 calls)
- Better continuity (Sora sees full timeline)
- Lower cost (one generation vs. many)
- Higher quality (coherent narrative)

### Timeline-Aware Prompts

**Capability**: Describe full video timeline with all shots and exact timings in one prompt.

**Example Structure:**
```
Generate a 15-second commercial with this timeline:

0.0s - 0.3s (Shot 1): [description]
0.3s - 0.8s (Shot 2): [description]
...
14.2s - 15.0s (Shot N): [description]
```

**Benefits:**
- Complete control over shot timing
- Professional video structure
- Efficient single-generation workflow

### Connected Shots

**Capability**: Maintain visual continuity across shots in single generation.

**How It Works:**
- Describe how each shot connects to the previous
- Explicitly state what carries over (lighting, position, subject)
- Use "CONNECTED" markers and continuity descriptions

**Benefits:**
- Seamless visual flow
- Professional commercial quality
- No post-processing needed for transitions

### Speed Ramping

**Capability**: Control motion speed via prompt descriptions.

**How It Works:**
- Describe motion speed in prompt (e.g., "10× speed", "rapid dolly-in")
- Sora generates video with that motion speed
- No post-processing speed adjustment needed

**Benefits:**
- Precise motion control
- Professional speed ramping effects
- Integrated in generation (not post-processed)

### Professional Quality

**Principle**: Detailed, comprehensive prompts produce commercial-grade output.

**Best Practices:**
- Include cinematography terminology
- Describe lighting, composition, movement
- Specify speed, curves, continuity
- Use professional video production language

**Result**: Ultra-premium video quality suitable for commercial advertising.

---

## 9. Integration Notes

### Codebase Integration

**File to Update**: `server/ai/config/video-models.ts`

**Current State:**
- Sora 2 Pro is configured with `hasAudio: false`
- Should be updated to `hasAudio: true` to reflect audio capabilities

**Recommended Update:**
```typescript
"sora-2-pro": {
  // ... existing config
  hasAudio: true,  // ✅ Audio is automatically generated
  // ... rest of config
}
```

### Audio Flag

**Note**: Audio generation is automatic - no separate parameter or API call needed. The `hasAudio: true` flag indicates that the model generates audio, but no configuration is required.

### Future Implementation

**Sora Prompt Synthesizer Agent** will:
- Reference this documentation file
- Use specifications for prompt construction
- Follow best practices for timeline-aware prompts
- Implement connected shots descriptions
- Generate single comprehensive prompts for complete videos

---

## 10. Example Prompts

### Example 1: Timeline Breakdown with Connected Shots

```
Generate a 4-second coffee commercial with this timeline:

0.0s-0.5s (Shot 1):
Rapid dolly-in 10× speed, 85mm lens f/1.8, coffee beans cascading, golden hour lighting upper left, EASE_IN. END: Extreme close-up, beans mid-air, golden light, warm tones.

0.5s-1.5s (Shot 2) [CONNECTED]:
Starts EXACTLY where Shot 1 ended. Same close-up, same golden lighting. Beans transform to pouring liquid. Slow orbital 3× speed, 50mm f/4.0, 90° rotation. Coffee fills cup, steam rises. END: 45° angle, cup centered, steam, golden light.

1.5s-2.5s (Shot 3) [CONNECTED]:
Starts EXACTLY where Shot 2 ended. Same cup position, same 45° angle, same lighting. Camera dolly-out 2× speed, 50mm f/4.0, cup stays centered. Logo visible, steam rising. EASE_OUT. END: Cup centered, logo visible, medium shot, warm lighting.

2.5s-4.0s (Shot 4) [CONNECTED]:
Starts EXACTLY where Shot 3 ended. Same cup, same position, same lighting. Slow zoom-out 1.5× speed, 24mm f/11.0, cup stays centered. Reveals full scene: beans, steam, setup. Maintains continuity.

All shots connected - seamless flow 0.0s-4.0s. Total: 4.0s. Style: Premium, warm golden tones, 9:16 vertical, 720p. Pacing: FAST_CUT with seamless connections.
```

### Example 2: Motion Continuity Test

```
Generate a 4-second video testing connected shots with continuous movement:

0.0s-2.0s (Shot 1 - Movement Start):
Camera dolly-in movement at 3× speed, 85mm lens f/2.0. Starts wide (coffee cup on table, full scene visible). Camera moves forward continuously toward cup. Movement accelerates. END FRAME: Camera at medium-close position, cup filling 60% of frame, camera STILL MOVING FORWARD, movement incomplete - dolly-in continues.

2.0s-4.0s (Shot 2 - Movement Completion) [CONNECTED]:
Starts EXACTLY where Shot 1 ended. Camera CONTINUES the same dolly-in movement from Shot 1. Same forward motion, same speed (3×), same direction. Camera completes the dolly-in, reaching extreme close-up. Cup now fills 90% of frame. Movement completes smoothly. Same lighting, same cup position, continuous motion.

CRITICAL: Shot 2 must continue the EXACT same dolly-in movement that Shot 1 started. No cut, no reset, no jump. The camera movement is ONE continuous motion split across two shots.

Total: 4.0s. Style: Premium, warm tones, 9:16, 720p.
```

### Example 3: Professional Commercial Structure

```
Generate an 8-second premium product commercial with this timeline:

0.0s-0.4s (Shot 1 - The Hook):
Rapid dolly-in at 12× speed, 85mm portrait lens f/1.8, product in golden hour lighting, EASE_IN acceleration. END: Extreme close-up, product centered, warm golden tones.

0.4s-1.2s (Shot 2 - The Reveal) [CONNECTED]:
Starts where Shot 1 ended. Same product, same lighting. Orbital movement 4× speed, 50mm f/4.0, 180° rotation revealing product features. END: 45° angle, product features visible.

1.2s-2.0s (Shot 3 - Detail Focus):
Jump cut. Static with micro-drift, 100mm macro f/1.4, extreme close-up texture detail. Gentle floating movement. END: Texture detail fills frame.

2.0s-3.0s (Shot 4 - Hero Moment):
Match cut. Slow dolly-out 2× speed, 24mm wide f/8.0, product with logo prominent. EASE_OUT deceleration. END: Full product reveal, logo visible.

3.0s-4.5s (Shot 5 - Lifestyle) [CONNECTED]:
Seamless flow. Tracking shot 3× speed, 35mm f/5.6, product in use. Linear motion. END: Product in natural context.

4.5s-5.8s (Shot 6 - Atmosphere):
Jump cut. Static push-in 1.5× speed, 85mm f/2.0, atmospheric elements. END: Mood established.

5.8s-7.0s (Shot 7 - Final Hero):
Match cut. Static beauty shot, 50mm f/4.0, product centered with logo. Micro-drift 0.3× speed. END: Perfect composition, logo prominent.

7.0s-8.0s (Shot 8 - Payoff) [CONNECTED]:
Starts where Shot 7 ended. Same product, same position. Slow zoom-out 1.5× speed, 24mm f/11.0, reveals full scene. Maintains continuity.

Total: 8.0s. Style: Premium, cinematic, warm tones, 9:16 vertical, 720p. Pacing: FAST_CUT with strategic pauses.
```

---

## References

- [Runware OpenAI Documentation](https://runware.ai/docs/en/providers/openai#sora-2)
- [OpenAI Platform Documentation](https://platform.openai.com/docs/models/sora-2-pro)
- Internal: `server/ai/config/video-models.ts`

---

**Document Version**: 1.0  
**Maintained By**: AI Team  
**Last Reviewed**: 2025-01-XX








