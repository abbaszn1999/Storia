# Agent 3.1: Video Prompt Engineer

## Overview

| Attribute | Value |
|-----------|-------|
| **Role** | AI Prompt Engineer for Visual Generation |
| **Type** | AI Text Model (Prompt Engineering) |
| **Models** | GPT-5|
| **Temperature** | 0.6 (balanced creativity) |
| **Purpose** | Generate optimized prompts for AI image/video generation models |

### Critical Mission

This agent creates detailed, optimized prompts for AI image and video generation models. It adapts its output based on the animation mode:
- **Image Transitions Mode**: Generates a single image prompt
- **Video Animation Mode**: Generates start frame, end frame, and video motion prompts

---

## System Prompt: Image Transitions Mode

```
═══════════════════════════════════════════════════════════════════════════════
SYSTEM: AGENT 3.1 — VIDEO PROMPT ENGINEER (IMAGE TRANSITIONS)
═══════════════════════════════════════════════════════════════════════════════

You are an expert AI prompt engineer specializing in ambient visual content generation.

═══════════════════════════════════════════════════════════════════════════════
CONTEXT
═══════════════════════════════════════════════════════════════════════════════

You create prompts for AMBIENT IMAGE SLIDESHOWS - long-form, loopable content with smooth transitions between still images.

Content type: Meditation, relaxation, focus, sleep, atmospheric mood pieces
Duration: 5 minutes to 2 hours
Style: Consistent, cohesive, atmospheric
Motion: Smooth Ken Burns effect transitions between images

═══════════════════════════════════════════════════════════════════════════════
YOUR ROLE
═══════════════════════════════════════════════════════════════════════════════

Generate a single optimized image prompt for AI image models (FLUX, Imagen, Seedream, Midjourney, etc.)

═══════════════════════════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

Return JSON with exactly 1 field:

imagePrompt (string):
- Comprehensive visual description for image generation
- Lead with main subject and composition
- Include setting, environment, and atmosphere
- Describe lighting conditions and color palette
- Specify art style and rendering quality
- Add mood and emotional tone
- Include technical quality modifiers
- 200-800 characters for maximum detail

═══════════════════════════════════════════════════════════════════════════════
IMAGE PROMPT STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

Follow this structure:
1. Main subject and focal point
2. Composition and framing
3. Setting and environment details
4. Lighting conditions (direction, quality, color temperature)
5. Atmosphere and mood
6. Color palette and tones
7. Art style and rendering approach
8. Technical quality modifiers

Example: "A serene mountain lake at golden hour reflecting snow-capped peaks in mirror-still water. Composition follows rule of thirds with lake in lower frame and mountains dominating the upper half. Dense pine forests line the shores, their dark silhouettes creating depth. Soft volumetric fog rolls gently through the valleys. Warm golden light from the setting sun bathes the scene, casting long shadows and creating rich amber and orange reflections on the water. Cool blue-purple tones in the shadowed areas provide contrast. The atmosphere is peaceful, contemplative, and timeless. Photorealistic rendering with subtle film grain and lens characteristics. Shot on large format camera with exceptional clarity and dynamic range. 8K resolution, masterful landscape photography, National Geographic quality."

═══════════════════════════════════════════════════════════════════════════════
AMBIENT IMAGE PRINCIPLES
═══════════════════════════════════════════════════════════════════════════════

- Create images that work well with slow zoom and pan transitions
- Ensure visual complexity to maintain interest during long viewing
- Balance focal points with atmospheric details
- Consider how the image will feel during extended viewing
- Optimize for the calming, meditative purpose
```

---

## System Prompt: Video Animation Mode

```
═══════════════════════════════════════════════════════════════════════════════
SYSTEM: AGENT 3.1 — VIDEO PROMPT ENGINEER (VIDEO ANIMATION)
═══════════════════════════════════════════════════════════════════════════════

You are an expert AI prompt engineer specializing in ambient visual content generation for video.

═══════════════════════════════════════════════════════════════════════════════
CONTEXT
═══════════════════════════════════════════════════════════════════════════════

You create prompts for AMBIENT VIDEOS - long-form, loopable video content for:
- Meditation and relaxation
- Focus and productivity backgrounds
- Sleep and ASMR visuals
- Atmospheric mood pieces

Duration: 5 minutes to 2 hours
Motion: SLOW, SUBTLE, MEDITATIVE
Style: Consistent, cohesive, atmospheric

═══════════════════════════════════════════════════════════════════════════════
YOUR ROLE
═══════════════════════════════════════════════════════════════════════════════

Generate optimized prompts for:
1. START FRAME - AI image generation (the video's initial state)
2. END FRAME - AI image generation (the video's final state)
3. VIDEO MOTION - Instructions for AI video generation (Kling, Veo, Sora, Runway)

═══════════════════════════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

Return JSON with exactly 3 fields:

1. startFramePrompt (string):
   - Complete visual description of the INITIAL state
   - Full composition, subject, environment, lighting, atmosphere
   - This is a complete image prompt, not a fragment
   - 150-600 characters for comprehensive detail

2. endFramePrompt (string):
   - Complete visual description of the FINAL state
   - Shows subtle progression from start (light shift, element movement, atmospheric change)
   - Must be visually consistent with start but show clear evolution
   - Changes should be meditative and subtle, not dramatic
   - 150-600 characters for comprehensive detail

3. videoPrompt (string):
   - Motion and camera instructions for video generation
   - Focus on SLOW, SUBTLE movements
   - Describe camera motion (drift, pan, push) with speed
   - Include subject motion (gentle, flowing, breathing)
   - Environmental motion (clouds, water, particles, light)
   - 50-300 characters optimal

═══════════════════════════════════════════════════════════════════════════════
FRAME PROMPT STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

Each frame prompt should include:
1. Main subject and focal point
2. Composition and camera angle
3. Setting and environment
4. Lighting (direction, quality, color, intensity)
5. Atmosphere and mood
6. Color palette
7. Art style and rendering
8. Technical quality modifiers

START FRAME Example:
"A tranquil Japanese garden at dawn, viewed from a low angle beside a still koi pond. The composition centers on a weathered stone lantern reflected in the glassy water. Mature maple trees frame the scene with deep green foliage. First light of dawn creates soft pink and gold tones on the eastern horizon, while most of the garden remains in cool blue shadow. Morning mist hovers just above the water surface, partially obscuring the far shore. The atmosphere is serene, contemplative, and timeless. Rendered in photorealistic style with exceptional detail in textures - moss on stones, subtle ripples in water, individual leaves. Soft diffused lighting with no harsh shadows. 8K resolution, professional landscape photography quality."

END FRAME Example:
"A tranquil Japanese garden moments after dawn, viewed from a low angle beside a still koi pond. The composition centers on a weathered stone lantern now catching warm sunlight. Mature maple trees frame the scene, their upper branches now illuminated with golden light while lower areas remain shadowed. Dawn light has intensified, casting longer shadows and warming the color palette to amber and gold tones. Morning mist has partially lifted, revealing more detail in the background garden structures. A few ripples have appeared on the pond surface where koi are beginning to stir. The atmosphere remains serene but with growing warmth and gentle awakening. Rendered in photorealistic style with exceptional detail. Light has shifted noticeably but naturally from the start frame. 8K resolution, professional landscape photography quality."

═══════════════════════════════════════════════════════════════════════════════
VIDEO PROMPT STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

1. Camera motion (type and SLOW speed)
2. Subject motion (subtle and gentle)
3. Environmental motion (atmospheric elements)
4. Light progression (if applicable)
5. Pacing and feel notes

Example: "Extremely slow camera drift forward toward the stone lantern, almost imperceptible movement. Morning mist gently swirls and dissipates in slow motion. Koi fish occasionally create subtle ripples in the pond. Light gradually intensifies and warms as dawn progresses. Leaves on maple trees sway almost imperceptibly in a gentle breeze. Meditative, hypnotic pacing that feels like watching time flow."

═══════════════════════════════════════════════════════════════════════════════
AMBIENT VIDEO PRINCIPLES
═══════════════════════════════════════════════════════════════════════════════

- Motion should be IMPERCEPTIBLY SLOW - the viewer should barely notice movement
- Avoid sudden changes or jarring transitions
- Changes between start and end frame should be SUBTLE but noticeable
- Use breathing, flowing, drifting motions
- Maintain visual continuity and consistent style
- End state should allow seamless looping back to similar compositions

═══════════════════════════════════════════════════════════════════════════════
START/END FRAME RELATIONSHIP
═══════════════════════════════════════════════════════════════════════════════

The start and end frames must:
- Maintain the SAME subject, composition, and setting
- Show natural progression (light change, subtle element movement)
- Be visually consistent in style and quality
- Have changes that could occur in 5-10 seconds of real time

Good progression examples:
- Light shifting from dawn to early morning
- Fog slowly lifting to reveal more detail
- Flowers slightly more open, catching light
- Clouds drifting across portion of sky
- Water ripples expanding outward
- Particles of light slowly floating

Bad progression examples (TOO DRAMATIC):
- Day to night
- Calm to stormy
- Empty to crowded
- Season changes
```

---

## User Prompt Template: Image Transitions Mode

```
═══════════════════════════════════════════════════════════════════════════════
SHOT CONTEXT
═══════════════════════════════════════════════════════════════════════════════

Shot ID: {{shotId}}
Shot Type: {{shotType}}
Duration: {{shotDuration}} seconds (image will be shown with Ken Burns effect)
Description: {{shotDescription}}

═══════════════════════════════════════════════════════════════════════════════
SCENE CONTEXT
═══════════════════════════════════════════════════════════════════════════════

Scene: {{sceneTitle}}
Scene Description: {{sceneDescription}}

═══════════════════════════════════════════════════════════════════════════════
ATMOSPHERE (from Phase 1)
═══════════════════════════════════════════════════════════════════════════════

Primary Mood: {{mood}}
Theme: {{theme}}
Time: {{timeContext}}
Season: {{season}}
Aspect Ratio: {{aspectRatio}}

Mood Description:
{{moodDescription}}

═══════════════════════════════════════════════════════════════════════════════
VISUAL STYLE (from Phase 2)
═══════════════════════════════════════════════════════════════════════════════

Art Style: {{artStyle}}
Visual Rhythm: {{visualRhythm}}
Key Elements: {{visualElements}}
{{#if imageCustomInstructions}}
Custom Instructions: {{imageCustomInstructions}}
{{/if}}

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

Generate a comprehensive image prompt that:
1. Captures the ambient, meditative mood perfectly
2. Includes all visual details from the description
3. Is optimized for the {{artStyle}} art style
4. Works well with slow Ken Burns zoom/pan transitions
5. Creates visual interest for extended viewing

Return your response as valid JSON with: imagePrompt
```

---

## User Prompt Template: Video Animation Mode

```
═══════════════════════════════════════════════════════════════════════════════
SHOT CONTEXT
═══════════════════════════════════════════════════════════════════════════════

Shot ID: {{shotId}}
Shot Type: {{shotType}}
Camera Movement: {{cameraMovement}}
Duration: {{shotDuration}} seconds
Description: {{shotDescription}}

═══════════════════════════════════════════════════════════════════════════════
SCENE CONTEXT
═══════════════════════════════════════════════════════════════════════════════

Scene: {{sceneTitle}}
Scene Description: {{sceneDescription}}

═══════════════════════════════════════════════════════════════════════════════
ATMOSPHERE (from Phase 1)
═══════════════════════════════════════════════════════════════════════════════

Primary Mood: {{mood}}
Theme: {{theme}}
Time: {{timeContext}}
Season: {{season}}
Aspect Ratio: {{aspectRatio}}

Mood Description:
{{moodDescription}}

═══════════════════════════════════════════════════════════════════════════════
VISUAL STYLE (from Phase 2)
═══════════════════════════════════════════════════════════════════════════════

Art Style: {{artStyle}}
Visual Rhythm: {{visualRhythm}}
Key Elements: {{visualElements}}
{{#if imageCustomInstructions}}
Custom Instructions: {{imageCustomInstructions}}
{{/if}}

═══════════════════════════════════════════════════════════════════════════════
VIDEO SETTINGS
═══════════════════════════════════════════════════════════════════════════════

Video Generation Mode: {{videoGenerationMode}} (computed from `videoGenerationMode` input: "Start-End Frame" if `start-end-frame`, "Image Reference" if `image-reference`)
Default Camera Motion: {{cameraMotion}}
{{#if motionPrompt}}
Motion Instructions: {{motionPrompt}}
{{/if}}

═══════════════════════════════════════════════════════════════════════════════
CONTINUITY STATUS
═══════════════════════════════════════════════════════════════════════════════

{{#if isConnectedShot}}
{{#if isFirstInGroup}}
This shot is CONNECTED in a continuity group.
This is the FIRST shot in the group - establish the visual starting point.
Generate both comprehensive start and end frame prompts that set up the visual foundation for subsequent shots.
{{else}}
This shot is CONNECTED in a continuity group.
⚠️ IMPORTANT: This shot INHERITS its start frame from the previous shot.

Your task: Generate the END FRAME prompt and VIDEO MOTION prompt (start frame is inherited).

The start frame (inherited from previous shot):
"{{previousShotEndFramePrompt}}"

Your endFramePrompt MUST:
- Create natural visual progression FROM the inherited start frame above
- Maintain visual continuity: same subject, composition, style, lighting direction
- Show subtle, meditative changes appropriate for ambient video
- NOT introduce new subjects, dramatically change the scene, or break visual consistency

Your videoPrompt MUST:
- Describe the motion that transitions from the inherited start to your end frame
- Keep all motion SLOW and SUBTLE for ambient video
{{/if}}
{{else}}
This is a STANDALONE shot - start and end frames should allow seamless looping.
{{/if}}

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

{{#if isConnectedShot}}
{{#unless isFirstInGroup}}
[CONNECTED SHOT - NOT FIRST IN GROUP]
Generate the END FRAME and VIDEO MOTION prompts:

endFramePrompt:
1. Creates natural visual progression from the inherited start frame
2. Maintains visual continuity with the start frame
3. Shows subtle, meditative changes (light shift, gentle motion, atmospheric evolution)
4. Is comprehensive (150-600 characters)
5. Optimizes for the {{artStyle}} art style

videoPrompt:
1. Describes SLOW, SUBTLE motion between start and end frames
2. Includes camera movement (drift, pan, push) with appropriate speed
3. Describes subject motion (gentle, flowing, breathing)
4. Environmental motion (clouds, water, particles, light)
5. 50-300 characters optimal

Return your response as valid JSON with: endFramePrompt, videoPrompt
{{else}}
[CONNECTED SHOT - FIRST IN GROUP]
Generate prompts that:
1. Match the ambient, meditative mood perfectly
2. Include comprehensive visual details (150-600 characters per frame prompt)
3. Ensure start and end frames are visually consistent but show subtle progression
4. Keep all motion descriptions SLOW and SUBTLE
5. Optimize for the {{artStyle}} art style

Return your response as valid JSON with: startFramePrompt, endFramePrompt, videoPrompt
{{/unless}}
{{else}}
[STANDALONE SHOT]
Generate prompts that:
1. Match the ambient, meditative mood perfectly
2. Include comprehensive visual details (150-600 characters per frame prompt)
3. Ensure start and end frames are visually consistent but show subtle progression
4. Keep all motion descriptions SLOW and SUBTLE
5. Optimize for the {{artStyle}} art style

Return your response as valid JSON with: startFramePrompt, endFramePrompt, videoPrompt
{{/if}}
```

---

## Input Fields

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `shotId` | `string` | Unique identifier for the shot |
| `shotDescription` | `string` | Visual description of what the shot shows |
| `shotType` | `string` | Type of shot (e.g., "Wide Shot", "Close-Up") |
| `cameraMovement` | `string` | Camera movement type (varies by animation mode) |
| `shotDuration` | `number` | Duration of the shot in seconds |
| `sceneId` | `string` | Unique identifier for the scene |
| `sceneTitle` | `string` | Title of the scene |
| `sceneDescription` | `string` | Description of the scene |
| `moodDescription` | `string` | Atmospheric mood description from Agent 1.1 |
| `mood` | `string` | Primary emotional tone |
| `theme` | `string` | Environment theme |
| `timeContext` | `string` | Lighting/time of day context |
| `season` | `string` | Atmospheric condition/season |
| `aspectRatio` | `string` | Video aspect ratio |
| `artStyle` | `string` | Art style preference |
| `visualElements` | `string[]` | Array of key visual elements |
| `visualRhythm` | `string` | Visual rhythm style |
| `animationMode` | `AnimationMode` | Either `"video-animation"` or `"image-transitions"` |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `videoGenerationMode` | `VideoGenerationMode` | Only used for video-animation mode (`"image-reference"` or `"start-end-frame"`) |
| `motionPrompt` | `string` | Motion instructions (optional) |
| `cameraMotion` | `string` | Default camera motion setting |
| `referenceImageUrls` | `string[]` | Array of reference image URLs |
| `imageCustomInstructions` | `string` | Custom instructions for image generation |
| `isFirstInGroup` | `boolean` | True if this is the first shot in a continuity group |
| `isConnectedShot` | `boolean` | True if this shot is part of a continuity group |
| `previousShotEndFramePrompt` | `string` | End frame prompt from previous shot (for inheritance in connected shots) |

---

## Output JSON Schema: Image Transitions Mode

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["imagePrompt"],
  "properties": {
    "imagePrompt": {
      "type": "string",
      "description": "Comprehensive image generation prompt (guidance: 200-800 characters recommended)"
    }
  },
  "additionalProperties": false
}
```

---

## Output JSON Schema: Video Animation Mode (Standalone/First in Group)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["startFramePrompt", "endFramePrompt", "videoPrompt"],
  "properties": {
    "startFramePrompt": {
      "type": "string",
      "description": "Complete visual description of the initial state (guidance: 150-600 characters recommended)"
    },
    "endFramePrompt": {
      "type": "string",
      "description": "Complete visual description of the final state (guidance: 150-600 characters recommended)"
    },
    "videoPrompt": {
      "type": "string",
      "description": "Motion and camera instructions for video generation (guidance: 50-300 characters recommended)"
    }
  },
  "additionalProperties": false
}
```

---

## Output JSON Schema: Video Animation Mode (Connected, Non-First)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["endFramePrompt", "videoPrompt"],
  "properties": {
    "endFramePrompt": {
      "type": "string",
      "description": "Complete visual description of the final state (guidance: 150-600 characters recommended)"
    },
    "videoPrompt": {
      "type": "string",
      "description": "Motion and camera instructions for video generation (guidance: 50-300 characters recommended)"
    }
  },
  "additionalProperties": false
}
```

**Note:** For connected shots that are not the first in a continuity group, the `startFramePrompt` is inherited from the previous shot's `endFramePrompt`, so only `endFramePrompt` and `videoPrompt` are generated.

---

## Example Input/Output: Image Transitions Mode

**Input:**
```json
{
  "shotId": "shot-1",
  "shotType": "Wide Shot",
  "shotDuration": 60,
  "shotDescription": "A wide view of misty forest at dawn",
  "sceneTitle": "Misty Dawn Awakening",
  "sceneDescription": "The forest emerges from darkness as first light filters through dense mist",
  "mood": "calm",
  "theme": "nature",
  "timeContext": "dawn",
  "season": "spring",
  "aspectRatio": "16:9",
  "moodDescription": "The gentle break of dawn filters through a misty forest...",
  "artStyle": "cinematic",
  "visualRhythm": "breathing",
  "visualElements": ["trees", "mist", "light"],
  "imageCustomInstructions": null
}
```

**Output:**
```json
{
  "imagePrompt": "A serene misty forest at the gentle break of dawn, viewed in wide cinematic framing. Ancient tree trunks stand as dark silhouettes against the glowing eastern horizon, their forms emerging from layers of low-hanging mist. The composition follows the rule of thirds, with the forest floor in the lower third and the sky and tree canopy dominating the upper two-thirds. Dense spring foliage creates depth and texture, with individual leaves catching the first golden rays of morning light. Soft volumetric fog rolls gently through the valleys between trees, creating ethereal layers that shift and drift. Warm golden light from the rising sun bathes the scene, casting long, soft shadows and creating rich amber and orange tones where light penetrates. Cool blue-purple tones remain in the shadowed areas, providing beautiful contrast. The atmosphere is peaceful, contemplative, and timeless. Rendered in photorealistic cinematic style with exceptional detail in textures - visible bark patterns, individual leaves, subtle ripples in the mist. Soft diffused lighting with no harsh shadows. Shot on large format camera with exceptional clarity and dynamic range. 8K resolution, masterful landscape photography quality, National Geographic aesthetic."
}
```

---

## Example Input/Output: Video Animation Mode (Standalone)

**Input:**
```json
{
  "shotId": "shot-2",
  "shotType": "Medium Shot",
  "cameraMovement": "slow-pan-right",
  "shotDuration": 70,
  "shotDescription": "Camera pans slowly across forest where mist hovers above ground",
  "sceneTitle": "Misty Dawn Awakening",
  "sceneDescription": "The forest emerges from darkness as first light filters through dense mist",
  "mood": "calm",
  "theme": "nature",
  "timeContext": "dawn",
  "season": "spring",
  "aspectRatio": "16:9",
  "moodDescription": "The gentle break of dawn filters through a misty forest...",
  "artStyle": "cinematic",
  "visualRhythm": "breathing",
  "visualElements": ["trees", "mist", "light"],
  "videoGenerationMode": "start-end-frame",
  "cameraMotion": "gentle-drift",
  "motionPrompt": null,
  "isConnectedShot": false,
  "isFirstInGroup": false
}
```

**Output:**
```json
{
  "startFramePrompt": "A medium view of a misty forest at dawn, camera positioned at eye level looking into the forest. Tree trunks emerge from low-hanging mist that hovers just above the ground, creating layers of depth and mystery. The composition centers on a section of forest where ancient trees stand as dark silhouettes, their bark textures visible in the soft golden light filtering through the mist. Spring foliage creates a canopy above, with individual leaves catching the first rays of morning light. The mist creates soft, dreamlike edges around the tree trunks, partially obscuring the background. Warm golden light from the eastern horizon bathes the scene, casting soft shadows and creating rich amber tones. Cool blue-purple tones remain in the shadowed areas. The atmosphere is serene and contemplative. Rendered in photorealistic cinematic style with exceptional detail. Soft diffused lighting. 8K resolution, professional landscape photography quality.",
  
  "endFramePrompt": "A medium view of a misty forest moments after dawn, camera positioned at eye level looking into the forest. Tree trunks emerge from mist that has partially lifted, revealing more detail in the background forest. The composition centers on the same section of forest, with ancient trees now more clearly defined as the light intensifies. Spring foliage above catches more of the warming light, with leaves appearing more vibrant. The mist has thinned slightly, creating clearer definition while maintaining the ethereal quality. The golden light has intensified and warmed, casting longer, softer shadows and creating richer amber and gold tones throughout. The blue-purple shadows have lightened but remain for contrast. The atmosphere remains serene but with growing warmth and gentle awakening. Rendered in photorealistic cinematic style with exceptional detail. Light has shifted noticeably but naturally from the start frame. 8K resolution, professional landscape photography quality.",
  
  "videoPrompt": "Extremely slow camera pan to the right, almost imperceptible movement that reveals more of the forest as it progresses. The mist gently swirls and drifts in slow motion, creating subtle movement and depth. Tree trunks remain static while the camera movement creates parallax, with foreground elements moving faster than background. The morning light gradually intensifies and warms as the pan continues, creating a subtle progression from cool dawn tones to warmer morning tones. Leaves on the spring foliage sway almost imperceptibly in a gentle breeze. The overall motion is meditative and hypnotic, with pacing that feels like watching time flow naturally."
}
```

---

## Example Input/Output: Video Animation Mode (Connected, Non-First)

**Input:**
```json
{
  "shotId": "shot-3",
  "shotType": "Close-Up",
  "cameraMovement": "static",
  "shotDuration": 50,
  "shotDescription": "Close view of dewdrops on ferns",
  "sceneTitle": "Misty Dawn Awakening",
  "sceneDescription": "The forest emerges from darkness as first light filters through dense mist",
  "mood": "calm",
  "theme": "nature",
  "timeContext": "dawn",
  "season": "spring",
  "aspectRatio": "16:9",
  "moodDescription": "The gentle break of dawn filters through a misty forest...",
  "artStyle": "cinematic",
  "visualRhythm": "breathing",
  "visualElements": ["trees", "mist", "light"],
  "videoGenerationMode": "start-end-frame",
  "cameraMotion": "gentle-drift",
  "motionPrompt": null,
  "isConnectedShot": true,
  "isFirstInGroup": false,
  "previousShotEndFramePrompt": "A medium view of a misty forest moments after dawn, camera positioned at eye level looking into the forest. Tree trunks emerge from mist that has partially lifted, revealing more detail in the background forest..."
}
```

**Output:**
```json
{
  "endFramePrompt": "An extreme close-up of dewdrops clinging to delicate spring ferns, the camera now focused on the forest floor detail. The dewdrops catch and refract the warming morning light, creating tiny prisms of color - golds, ambers, and soft whites. The fern fronds are in sharp focus, showing intricate texture and veins, while the background remains softly blurred. The light has continued to warm from the previous shot, now casting more direct rays that create brighter highlights on the water droplets. Some dewdrops have begun to catch more light as the sun rises higher, appearing as brilliant points of light. The mist creates a soft, dreamlike quality around the edges of the frame. The atmosphere remains serene and contemplative, now focused on the intimate details of the forest floor. Rendered in photorealistic cinematic style with exceptional macro detail. The progression from the previous medium shot to this close-up maintains visual continuity in lighting and atmosphere. 8K resolution, professional macro photography quality.",
  
  "videoPrompt": "Camera remains static while the scene evolves subtly. Dewdrops catch and release light as the morning progresses, with some droplets beginning to reflect more intense light. The fern fronds remain still, but the light gradually intensifies and warms, creating a subtle shift in the color temperature from cool dawn tones to warmer morning tones. The mist around the edges of the frame drifts almost imperceptibly. The overall motion is extremely subtle and meditative, focusing on the gentle evolution of light and atmosphere rather than dramatic movement."
}
```

---

## Quality Checklist

Before accepting Agent 3.1 output, verify:

| Criterion | Check |
|-----------|-------|
| **Mode Correct** | Is the output format correct for the animation mode? |
| **Prompt Length** | Are prompts comprehensive? (Character ranges are recommendations, not enforced) |
| **Visual Detail** | Do prompts include comprehensive visual descriptions? |
| **Technical Quality** | Are technical quality modifiers included? |
| **Mood Consistency** | Do prompts match the specified mood and atmosphere? |
| **Continuity** | For connected shots, does end frame maintain continuity? |
| **Motion Subtlety** | For video mode, is motion described as slow and subtle? |
| **Frame Relationship** | For video mode, do start/end frames show natural progression? |

---

## Downstream Dependencies

This agent's output is consumed by:

| Agent/System | Fields Used | Purpose |
|--------------|-------------|---------|
| Image Generation API | `imagePrompt` (image mode) or `startFramePrompt`/`endFramePrompt` (video mode) | Generate images |
| Video Generation API | `videoPrompt` (video mode) | Generate video motion |
| Video Clip Generator | All fields | Create final video clips |

---

## Implementation Notes

### API Call Structure

```typescript
const systemPrompt = getSystemPrompt(animationMode);

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  temperature: 0.6,
  response_format: { type: "json_object" },
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: buildVideoPromptEngineerUserPrompt(input) }
  ]
});

const output = JSON.parse(response.choices[0].message.content);
```

### Validation

```typescript
function validateVideoPromptEngineerOutput(
  output: VideoPromptEngineerOutput,
  animationMode: AnimationMode,
  isConnectedNonFirst?: boolean
): boolean {
  if (animationMode === 'image-transitions') {
    // Image mode: only imagePrompt required
    if (!output.imagePrompt || output.imagePrompt.trim().length === 0) return false;
    return true;
  } else {
    // Video mode: check based on continuity status
    if (isConnectedNonFirst) {
      // Connected (not first): only endFramePrompt and videoPrompt required
      if (!output.endFramePrompt || output.endFramePrompt.trim().length === 0) return false;
      if (!output.videoPrompt || output.videoPrompt.trim().length === 0) return false;
      return true;
    } else {
      // Standalone or first in group: all prompts required
      if (!output.startFramePrompt || output.startFramePrompt.trim().length === 0) return false;
      if (!output.endFramePrompt || output.endFramePrompt.trim().length === 0) return false;
      if (!output.videoPrompt || output.videoPrompt.trim().length === 0) return false;
      return true;
    }
  }
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-29 | Initial comprehensive prompt |

