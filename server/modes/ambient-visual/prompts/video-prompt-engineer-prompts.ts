/**
 * Video Prompt Engineer Prompts (Agent 4.1)
 * 
 * Generates optimized prompts based on animation mode:
 * - Image Transitions: imagePrompt only
 * - Video Animation: startFramePrompt, endFramePrompt, videoPrompt
 */

import type { VideoPromptEngineerInput, AnimationMode } from '../types';

/**
 * System prompt for IMAGE TRANSITIONS mode
 * Generates a single detailed image prompt for slideshow-style transitions
 */
const IMAGE_TRANSITIONS_SYSTEM_PROMPT = `You are an expert AI prompt engineer specializing in ambient visual content generation.

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
- 200-400 words for maximum detail

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
- Optimize for the calming, meditative purpose`;

/**
 * System prompt for VIDEO ANIMATION mode
 * Generates start frame, end frame, and video motion prompts
 */
const VIDEO_ANIMATION_SYSTEM_PROMPT = `You are an expert AI prompt engineer specializing in ambient visual content generation for video.

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
   - 150-300 words for comprehensive detail

2. endFramePrompt (string):
   - Complete visual description of the FINAL state
   - Shows subtle progression from start (light shift, element movement, atmospheric change)
   - Must be visually consistent with start but show clear evolution
   - Changes should be meditative and subtle, not dramatic
   - 150-300 words for comprehensive detail

3. videoPrompt (string):
   - Motion and camera instructions for video generation
   - Focus on SLOW, SUBTLE movements
   - Describe camera motion (drift, pan, push) with speed
   - Include subject motion (gentle, flowing, breathing)
   - Environmental motion (clouds, water, particles, light)
   - 50-150 words optimal

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
- Season changes`;

/**
 * Get the appropriate system prompt based on animation mode
 */
export function getSystemPrompt(animationMode: AnimationMode): string {
  return animationMode === 'image-transitions' 
    ? IMAGE_TRANSITIONS_SYSTEM_PROMPT 
    : VIDEO_ANIMATION_SYSTEM_PROMPT;
}

/**
 * Build the user prompt for IMAGE TRANSITIONS mode
 */
function buildImageTransitionsUserPrompt(input: VideoPromptEngineerInput): string {
  return `Generate an optimized image prompt for this ambient visual shot:

═══════════════════════════════════════════════════════════════════════════════
SHOT CONTEXT
═══════════════════════════════════════════════════════════════════════════════

Shot ID: ${input.shotId}
Shot Type: ${input.shotType}
Duration: ${input.shotDuration} seconds (image will be shown with Ken Burns effect)
Description: ${input.shotDescription || 'No description provided'}

═══════════════════════════════════════════════════════════════════════════════
SCENE CONTEXT
═══════════════════════════════════════════════════════════════════════════════

Scene: ${input.sceneTitle}
Scene Description: ${input.sceneDescription || 'No description provided'}

═══════════════════════════════════════════════════════════════════════════════
ATMOSPHERE (from Phase 1)
═══════════════════════════════════════════════════════════════════════════════

Primary Mood: ${input.mood}
Theme: ${input.theme}
Time: ${input.timeContext}
Season: ${input.season}
Aspect Ratio: ${input.aspectRatio}

Mood Description:
${input.moodDescription}

═══════════════════════════════════════════════════════════════════════════════
VISUAL STYLE (from Phase 2)
═══════════════════════════════════════════════════════════════════════════════

Art Style: ${input.artStyle}
Visual Rhythm: ${input.visualRhythm}
Key Elements: ${input.visualElements.length > 0 ? input.visualElements.join(', ') : 'None specified'}
${input.imageCustomInstructions ? `Custom Instructions: ${input.imageCustomInstructions}` : ''}

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

Generate a comprehensive image prompt that:
1. Captures the ambient, meditative mood perfectly
2. Includes all visual details from the description
3. Is optimized for the ${input.artStyle} art style
4. Works well with slow Ken Burns zoom/pan transitions
5. Creates visual interest for extended viewing

Return your response as valid JSON with: imagePrompt`;
}

/**
 * Build the user prompt for VIDEO ANIMATION mode
 * Dynamically adjusts output requirements based on continuity status
 */
function buildVideoAnimationUserPrompt(input: VideoPromptEngineerInput): string {
  const motion = input.cameraMotion || 'gentle-drift';
  const isConnectedNonFirst = input.isConnectedShot && !input.isFirstInGroup;
  
  // Build continuity section
  let continuitySection = '';
  if (input.isConnectedShot) {
    if (input.isFirstInGroup) {
      continuitySection = `This shot is CONNECTED in a continuity group.
This is the FIRST shot in the group - establish the visual starting point.
Generate both comprehensive start and end frame prompts that set up the visual foundation for subsequent shots.`;
    } else {
      continuitySection = `This shot is CONNECTED in a continuity group.
⚠️ IMPORTANT: This shot INHERITS its start frame from the previous shot.

Your task: Generate the END FRAME prompt and VIDEO MOTION prompt (start frame is inherited).

The start frame (inherited from previous shot):
"${input.previousShotEndFramePrompt || 'Not available'}"

Your endFramePrompt MUST:
- Create natural visual progression FROM the inherited start frame above
- Maintain visual continuity: same subject, composition, style, lighting direction
- Show subtle, meditative changes appropriate for ambient video
- NOT introduce new subjects, dramatically change the scene, or break visual consistency

Your videoPrompt MUST:
- Describe the motion that transitions from the inherited start to your end frame
- Keep all motion SLOW and SUBTLE for ambient video`;
    }
  } else {
    continuitySection = 'This is a STANDALONE shot - start and end frames should allow seamless looping.';
  }

  // Dynamic instructions and output fields based on continuity status
  const instructions = isConnectedNonFirst
    ? `Generate the END FRAME and VIDEO MOTION prompts:

endFramePrompt:
1. Creates natural visual progression from the inherited start frame
2. Maintains visual continuity with the start frame
3. Shows subtle, meditative changes (light shift, gentle motion, atmospheric evolution)
4. Is comprehensive (150-300 words)
5. Optimizes for the ${input.artStyle} art style

videoPrompt:
1. Describes SLOW, SUBTLE motion between start and end frames
2. Includes camera movement (drift, pan, push) with appropriate speed
3. Describes subject motion (gentle, flowing, breathing)
4. Environmental motion (clouds, water, particles, light)
5. 50-150 words optimal

Return your response as valid JSON with: endFramePrompt, videoPrompt`
    : `Generate prompts that:
1. Match the ambient, meditative mood perfectly
2. Include comprehensive visual details (150-300 words per frame prompt)
3. Ensure start and end frames are visually consistent but show subtle progression
4. Keep all motion descriptions SLOW and SUBTLE
5. Optimize for the ${input.artStyle} art style

Return your response as valid JSON with: startFramePrompt, endFramePrompt, videoPrompt`;

  return `Generate optimized prompts for this ambient visual shot:

═══════════════════════════════════════════════════════════════════════════════
SHOT CONTEXT
═══════════════════════════════════════════════════════════════════════════════

Shot ID: ${input.shotId}
Shot Type: ${input.shotType}
Camera Movement: ${input.cameraMovement}
Duration: ${input.shotDuration} seconds
Description: ${input.shotDescription || 'No description provided'}

═══════════════════════════════════════════════════════════════════════════════
SCENE CONTEXT
═══════════════════════════════════════════════════════════════════════════════

Scene: ${input.sceneTitle}
Scene Description: ${input.sceneDescription || 'No description provided'}

═══════════════════════════════════════════════════════════════════════════════
ATMOSPHERE (from Phase 1)
═══════════════════════════════════════════════════════════════════════════════

Primary Mood: ${input.mood}
Theme: ${input.theme}
Time: ${input.timeContext}
Season: ${input.season}
Aspect Ratio: ${input.aspectRatio}

Mood Description:
${input.moodDescription}

═══════════════════════════════════════════════════════════════════════════════
VISUAL STYLE (from Phase 2)
═══════════════════════════════════════════════════════════════════════════════

Art Style: ${input.artStyle}
Visual Rhythm: ${input.visualRhythm}
Key Elements: ${input.visualElements.length > 0 ? input.visualElements.join(', ') : 'None specified'}
${input.imageCustomInstructions ? `Custom Instructions: ${input.imageCustomInstructions}` : ''}

═══════════════════════════════════════════════════════════════════════════════
VIDEO SETTINGS
═══════════════════════════════════════════════════════════════════════════════

Video Generation Mode: ${input.videoGenerationMode === 'start-end-frame' ? 'Start-End Frame' : 'Image Reference'}
Default Camera Motion: ${motion}
${input.motionPrompt ? `Motion Instructions: ${input.motionPrompt}` : ''}

═══════════════════════════════════════════════════════════════════════════════
CONTINUITY STATUS
═══════════════════════════════════════════════════════════════════════════════

${continuitySection}

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

${instructions}`;
}

/**
 * Build the user prompt based on animation mode
 */
export function buildVideoPromptEngineerUserPrompt(input: VideoPromptEngineerInput): string {
  return input.animationMode === 'image-transitions'
    ? buildImageTransitionsUserPrompt(input)
    : buildVideoAnimationUserPrompt(input);
}

// Export for backwards compatibility (will be removed in future)
export const VIDEO_PROMPT_ENGINEER_SYSTEM_PROMPT = VIDEO_ANIMATION_SYSTEM_PROMPT;
