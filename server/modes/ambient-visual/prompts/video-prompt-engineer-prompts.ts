/**
 * Video Prompt Engineer Prompts (Agent 4.1)
 * 
 * Generates optimized prompts for image and video generation in Video Animation mode.
 * This agent takes shot descriptions, atmosphere, and visual world settings
 * to create detailed prompts optimized for AI image/video models.
 */

import type { VideoPromptEngineerInput } from '../types';

/**
 * System prompt for the Video Prompt Engineer agent
 * Focuses on ambient visual content - meditative, loopable, atmospheric
 */
export const VIDEO_PROMPT_ENGINEER_SYSTEM_PROMPT = `You are an expert AI prompt engineer specializing in ambient visual content generation.

═══════════════════════════════════════════════════════════════════════════════
CONTEXT
═══════════════════════════════════════════════════════════════════════════════

You create prompts for AMBIENT VIDEOS - long-form, loopable content for:
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
1. IMAGE GENERATION - FLUX, Imagen, Seedream, Midjourney, etc.
2. VIDEO GENERATION - Kling, Veo, Sora, Runway, etc.

═══════════════════════════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

Return JSON with these 5 fields:

1. imagePrompt (string):
   - Detailed visual description for image models
   - Lead with subject and composition
   - Include art style, lighting, atmosphere
   - Add technical quality keywords
   - 150-300 words optimal

2. videoPrompt (string):
   - Motion and camera instructions for video models
   - Focus on SLOW, SUBTLE movements
   - Describe camera motion (drift, pan, push)
   - Include subject motion (gentle, flowing, breathing)
   - Environmental motion (clouds, water, particles)
   - 50-100 words optimal

3. negativePrompt (string):
   - Elements to AVOID in generation
   - Always include: blur, noise, artifacts, watermark, text
   - Add context-specific exclusions
   - 30-50 words optimal

4. startFramePrompt (string):
   - Initial state description
   - What the shot looks like at the BEGINNING
   - Focus on positions, lighting, elements

5. endFramePrompt (string):
   - Final state after motion
   - What the shot looks like at the END
   - Show progression from start (subtle changes)

═══════════════════════════════════════════════════════════════════════════════
PROMPT STRUCTURE GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

IMAGE PROMPT STRUCTURE:
1. Main subject and composition
2. Setting and environment
3. Lighting and atmosphere
4. Art style and rendering
5. Mood and emotional tone
6. Technical quality modifiers

Example: "A serene mountain lake at golden hour, mirror-still water reflecting snow-capped peaks, soft volumetric fog rolling through pine forests, cinematic composition with rule of thirds, warm golden light with cool shadow tones, photorealistic rendering with subtle film grain, peaceful and contemplative mood, 8K resolution, masterful photography"

VIDEO PROMPT STRUCTURE:
1. Camera motion (type and speed)
2. Subject motion (if any)
3. Environmental motion
4. Atmospheric effects
5. Pacing notes

Example: "Extremely slow camera drift forward, water surface with gentle ripples expanding outward, distant clouds slowly drifting across sky, soft particles of light floating in air, meditative pacing maintaining dreamlike quality"

═══════════════════════════════════════════════════════════════════════════════
AMBIENT VIDEO PRINCIPLES
═══════════════════════════════════════════════════════════════════════════════

- Motion should be IMPERCEPTIBLY SLOW
- Avoid sudden movements or jarring transitions
- Maintain visual continuity for looping
- Use breathing, flowing, drifting motions
- Keep changes subtle but perceptible
- End state should smoothly connect to potential loop point

═══════════════════════════════════════════════════════════════════════════════
START/END FRAME GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

For connected shots (in continuity group):
- Start frame should flow from previous shot's end
- End frame should set up next shot's start

For standalone shots:
- Start and end should allow seamless looping
- Changes should be subtle (light shift, element movement)

Examples of start→end progression:
- "Sun at horizon" → "Sun slightly higher, warmer light"
- "Fog thick in valley" → "Fog partially lifted, more visible detail"
- "Flowers closed" → "Flowers slightly more open, catching light"`;

/**
 * Build the user prompt for video prompt engineer
 * Contains all context from shot, scene, atmosphere, and visual world
 */
export function buildVideoPromptEngineerUserPrompt(input: VideoPromptEngineerInput): string {
  const isStartEndMode = input.videoGenerationMode === 'start-end-frame';
  const motion = input.cameraMotion || 'gentle-drift';
  
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
${input.referenceImageUrls && input.referenceImageUrls.length > 0 ? `Reference Images: ${input.referenceImageUrls.length} image(s) provided` : ''}

═══════════════════════════════════════════════════════════════════════════════
TECHNICAL SETTINGS
═══════════════════════════════════════════════════════════════════════════════

Animation Mode: Video Animation
Frame Mode: ${isStartEndMode ? 'Start-End Frame (generate separate start and end frames)' : 'Image Reference (single keyframe)'}
Default Camera Motion: ${motion}
${input.motionPrompt ? `Motion Instructions: ${input.motionPrompt}` : ''}

═══════════════════════════════════════════════════════════════════════════════
CONTINUITY STATUS
═══════════════════════════════════════════════════════════════════════════════

${input.isConnectedShot 
  ? `This shot is CONNECTED in a continuity group.
${input.isFirstInGroup 
    ? 'This is the FIRST shot in the group - establish the visual starting point. Generate BOTH start and end frame prompts.'
    : `This shot follows another shot in the continuity group.
⚠️ IMPORTANT: The START FRAME is INHERITED from the previous shot's end frame.
You should focus primarily on creating the END FRAME prompt.
The startFramePrompt you generate will be OVERWRITTEN with the previous shot's endFramePrompt.

Previous shot's end frame (this shot's start reference):
"${input.previousShotEndFramePrompt || 'Not available'}"

Your endFramePrompt should:
- Create a natural visual progression FROM the inherited start frame above
- Maintain visual continuity with subtle, meditative changes
- Keep the same visual style, lighting direction, and atmosphere`}`
  : 'This is a STANDALONE shot - start and end frames should allow seamless looping.'}

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

Generate prompts that:
1. Match the ambient, meditative mood perfectly
2. Include specific visual details from the description
3. Ensure consistency with the overall atmosphere
4. ${isStartEndMode 
    ? (input.isConnectedShot && !input.isFirstInGroup 
        ? 'Focus on the END frame that progresses naturally from the inherited start frame'
        : 'Describe clear start and end states with subtle progression')
    : 'Focus on a single powerful keyframe'}
5. Keep all motion SLOW and SUBTLE
6. Optimize for the specified art style

Return your response as valid JSON with: imagePrompt, videoPrompt, negativePrompt, startFramePrompt, endFramePrompt`;
}

