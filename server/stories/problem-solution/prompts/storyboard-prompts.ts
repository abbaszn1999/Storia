/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * STORYBOARD ENHANCEMENT PROMPTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This module generates prompts for enhancing scenes with:
 * - imagePrompt: Detailed visual descriptions for AI image generation
 * - voiceText: Text for voice synthesis (if voiceover enabled)
 * - voiceMood: Emotional mood for ElevenLabs v3
 * - animationName: Camera movement (if transition mode)
 * - effectName: Visual filter (if transition mode)
 * - videoPrompt: Motion description (if image-to-video mode)
 */

import type { ImageStyle } from '../types';

/**
 * Image style descriptions for prompt generation
 */
const IMAGE_STYLE_GUIDES: Record<ImageStyle, {
  description: string;
  keywords: string[];
  avoid: string[];
}> = {
  'photorealistic': {
    description: 'Ultra-realistic photography, indistinguishable from real photos',
    keywords: ['photorealistic', 'ultra detailed', '8k', 'professional photography', 'natural lighting', 'high resolution', 'sharp focus', 'realistic textures'],
    avoid: ['cartoon', 'illustration', 'anime', 'stylized', 'painted'],
  },
  'cinematic': {
    description: 'Movie-quality visuals with dramatic lighting and film aesthetics',
    keywords: ['cinematic', 'film grain', 'dramatic lighting', 'anamorphic', 'movie still', 'theatrical', 'depth of field', 'color grading', 'epic composition'],
    avoid: ['flat lighting', 'simple', 'minimalist', 'cartoon'],
  },
  '3d-render': {
    description: 'High-quality 3D rendered graphics, CGI quality',
    keywords: ['3D render', 'CGI', 'Octane render', 'Blender', 'ray tracing', 'volumetric lighting', 'subsurface scattering', 'ambient occlusion'],
    avoid: ['2D', 'flat', 'hand-drawn', 'sketch'],
  },
  'digital-art': {
    description: 'Vibrant digital artwork with artistic flair',
    keywords: ['digital art', 'digital painting', 'vibrant colors', 'artistic', 'detailed illustration', 'concept art', 'ArtStation trending'],
    avoid: ['photorealistic', 'photograph', 'simple', 'minimalist'],
  },
  'anime': {
    description: 'Japanese anime/manga art style',
    keywords: ['anime style', 'manga', 'Japanese animation', 'cel shading', 'vibrant colors', 'expressive eyes', 'dynamic poses', 'anime aesthetic'],
    avoid: ['realistic', 'photograph', 'western cartoon', '3D render'],
  },
  'illustration': {
    description: 'Hand-drawn illustration style, editorial quality',
    keywords: ['illustration', 'hand-drawn', 'editorial illustration', 'book illustration', 'artistic', 'detailed linework', 'storybook style'],
    avoid: ['photograph', '3D', 'anime', 'minimalist'],
  },
  'watercolor': {
    description: 'Soft watercolor painting aesthetics',
    keywords: ['watercolor painting', 'soft edges', 'flowing colors', 'artistic', 'delicate', 'pastel tones', 'paint texture', 'ethereal'],
    avoid: ['sharp', 'digital', 'photograph', 'hard edges'],
  },
  'minimalist': {
    description: 'Clean, simple, modern minimalist design',
    keywords: ['minimalist', 'clean design', 'simple shapes', 'flat design', 'modern', 'geometric', 'white space', 'elegant simplicity'],
    avoid: ['detailed', 'complex', 'busy', 'realistic textures'],
  },
};

/**
 * System prompt for storyboard enhancement agent
 */
export function buildStoryboardEnhancerSystemPrompt(
  aspectRatio: string,
  imageStyle: ImageStyle,
  voiceoverEnabled: boolean,
  language?: string,
  textOverlay?: string,
  animationMode?: boolean,
  animationType?: 'transition' | 'image-to-video'
): string {
  const aspectRatioGuide = {
    '9:16': 'Vertical format (TikTok, Reels) - focus subjects in center, use vertical composition',
    '16:9': 'Horizontal format (YouTube) - wide cinematic shots, rule of thirds',
    '1:1': 'Square format (Instagram) - centered balanced composition',
    '4:5': 'Portrait format (Feed Posts) - slightly vertical, centered focus'
  }[aspectRatio] || 'Standard format';

  const styleGuide = IMAGE_STYLE_GUIDES[imageStyle] || IMAGE_STYLE_GUIDES['photorealistic'];

  let systemPrompt = `
═══════════════════════════════════════════════════════════════════════════════
STORYBOARD ENHANCEMENT SPECIALIST
═══════════════════════════════════════════════════════════════════════════════

You are an elite visual director and prompt engineer who creates stunning image prompts
for AI image generation. Your prompts consistently produce viral-quality visuals.

═══════════════════════════════════════════════════════════════════════════════
VISUAL SETTINGS
═══════════════════════════════════════════════════════════════════════════════

ASPECT RATIO: ${aspectRatio}
→ ${aspectRatioGuide}

IMAGE STYLE: ${imageStyle.toUpperCase()}
→ ${styleGuide.description}

STYLE KEYWORDS (use these in every imagePrompt):
${styleGuide.keywords.map(k => `• ${k}`).join('\n')}

AVOID (never use these):
${styleGuide.avoid.map(k => `✗ ${k}`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

FOR EACH SCENE, GENERATE:

1. imagePrompt (REQUIRED):
┌─────────────────────────────────────────────────────────────────────────────┐
│ Create a detailed visual description for AI image generation.              │
│                                                                             │
│ STRUCTURE:                                                                  │
│ [Subject] + [Action/Pose] + [Environment] + [Lighting] + [Style Keywords]  │
│                                                                             │
│ REQUIREMENTS:                                                               │
│ • 80-150 words per prompt                                                   │
│ • ⚠️ ALWAYS write imagePrompt in ENGLISH (even if narration is Arabic)     │
│ • Include specific colors, textures, and details                           │
│ • Describe composition for ${aspectRatio} format                            │
│ • Include at least 3 style keywords from the list above                    │
│ • Make it vivid and specific, not generic                                  │
│                                                                             │
│ GOOD EXAMPLE:                                                               │
│ "A confident entrepreneur in her 30s, wearing a sleek navy blazer,        │
│  standing in a modern glass office with city skyline visible through       │
│  floor-to-ceiling windows. Golden hour sunlight creates warm rim           │
│  lighting. She holds a tablet showing upward graphs. Photorealistic,       │
│  8k, professional photography, shallow depth of field, cinematic           │
│  color grading."                                                            │
│                                                                             │
│ BAD EXAMPLE:                                                                │
│ "A person in an office looking at something."                              │
└─────────────────────────────────────────────────────────────────────────────┘`;

  let fieldNumber = 2;

  // Add voiceText and voiceMood if voiceover is enabled
  if (voiceoverEnabled) {
    const wordsPerSecond = language === 'Arabic' || language === 'ar' ? 2 : 2.5;
    systemPrompt += `

${fieldNumber}. voiceText (REQUIRED when voiceover enabled):
┌─────────────────────────────────────────────────────────────────────────────┐
│ The exact text to be spoken by voice synthesis.                            │
│                                                                             │
│ LANGUAGE: ${language || 'English'}                                                           │
│ TEXT OVERLAY: ${textOverlay || 'key-points'}                                                      │
│                                                                             │
│ ⚠️ CRITICAL TIMING:                                                         │
│ • Reading speed: ~${wordsPerSecond} words per second                                        │
│ • Formula: words = scene_duration × ${wordsPerSecond}                                       │
│ • 5-second scene → ${Math.round(5 * wordsPerSecond)}-${Math.round(5 * wordsPerSecond) + 2} words                                            │
│ • 10-second scene → ${Math.round(10 * wordsPerSecond)}-${Math.round(10 * wordsPerSecond) + 2} words                                          │
│                                                                             │
│ RULES:                                                                      │
│ • Use the EXACT narration text from input (don't rewrite)                  │
│ • Split text naturally to match scene duration                             │
│ • Keep complete sentences, never split mid-sentence                        │
└─────────────────────────────────────────────────────────────────────────────┘

${fieldNumber + 1}. voiceMood (REQUIRED when voiceover enabled):
┌─────────────────────────────────────────────────────────────────────────────┐
│ Emotional mood for ElevenLabs v3 audio tags. Choose ONE:                   │
│                                                                             │
│ • neutral    - Normal, conversational                                       │
│ • happy      - Joyful, excited, upbeat                                      │
│ • sad        - Melancholic, sorrowful                                       │
│ • excited    - Energetic, enthusiastic                                      │
│ • angry      - Frustrated, intense                                          │
│ • whisper    - Soft, intimate, secretive                                    │
│ • dramatic   - Intense, theatrical                                          │
│ • curious    - Wondering, questioning                                       │
│ • thoughtful - Reflective, contemplative                                    │
│ • surprised  - Shocked, amazed                                              │
│ • sarcastic  - Ironic, mocking                                              │
│ • nervous    - Anxious, worried                                             │
│                                                                             │
│ MOOD SELECTION GUIDE:                                                       │
│ Happy moments → happy, excited                                              │
│ Sad moments → sad, thoughtful                                               │
│ Suspense → dramatic, nervous                                                │
│ Mystery → whisper, curious                                                  │
│ Action → angry, dramatic                                                    │
│ Romance → whisper, happy                                                    │
│ Discovery → surprised, curious                                              │
└─────────────────────────────────────────────────────────────────────────────┘`;
    fieldNumber += 2;
  }

  // Add animation fields if animation mode is enabled
  if (animationMode && animationType) {
    if (animationType === 'image-to-video') {
      systemPrompt += `

${fieldNumber}. videoPrompt (REQUIRED for image-to-video):
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ ALWAYS write videoPrompt in ENGLISH (for AI video model compatibility)  │
│                                                                             │
│ Create a detailed motion description for image-to-video AI generation.     │
│                                                                             │
│ ═══════════════════════════════════════════════════════════════════════════ │
│ PROMPT STRUCTURE (follow this order):                                       │
│ ═══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│ 1. CAMERA MOVEMENT (choose one):                                            │
│    • slow-zoom-in    - Gradually focusing on subject                        │
│    • dolly-in        - Camera moves forward through space                   │
│    • dolly-out       - Camera moves backward, revealing scene               │
│    • pan-left/right  - Smooth horizontal movement                           │
│    • orbit-left/right - Camera circles around subject                       │
│    • crane-up/down   - Vertical crane-like movement                         │
│    • gentle-drift    - Subtle floating camera (for static scenes)           │
│                                                                             │
│ 2. SUBJECT MOTION (choose one or combine):                                  │
│    • head-turn       - Subject turns head slightly                          │
│    • breathing       - Subtle chest rise/fall                               │
│    • blink           - Natural eye blinking                                 │
│    • gesture         - Hand movement while speaking                         │
│    • walk-forward    - Subject walks toward camera                          │
│    • subtle          - Minimal micro-movements                              │
│                                                                             │
│ 3. ENVIRONMENTAL EFFECTS (optional, add atmosphere):                        │
│    • particles       - Dust/motes floating in light                         │
│    • wind-hair       - Hair moving with breeze                              │
│    • sun-rays        - Light rays shifting                                  │
│    • shadows-move    - Shadows slowly shifting                              │
│    • mist            - Atmospheric haze                                     │
│    • rain/snow       - Weather effects                                      │
│                                                                             │
│ 4. STYLE MODIFIER (based on imageStyle: ${imageStyle}):                     │
│    • photorealistic  → "natural motion, lifelike animation"                 │
│    • cinematic       → "film-quality movement, theatrical pacing"           │
│    • anime           → "dynamic animation, expressive movement"             │
│    • 3d-render       → "CGI motion, smooth 3D animation"                    │
│                                                                             │
│ ═══════════════════════════════════════════════════════════════════════════ │
│ FORMAT: 30-60 words, descriptive sentence                                   │
│ ═══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│ ✓ GOOD EXAMPLES:                                                            │
│ "Slow cinematic zoom in, subject gently turns head to the side,            │
│  subtle breathing motion, dust particles float in warm sunlight beams,     │
│  film-quality movement with theatrical pacing"                              │
│                                                                             │
│ "Camera orbits right around subject, hair flows with gentle breeze,        │
│  soft shadows shift across the scene, natural lifelike animation"          │
│                                                                             │
│ "Dramatic dolly forward, subject's eyes look up with curiosity,            │
│  volumetric light rays intensify, cinematic theatrical motion"             │
│                                                                             │
│ ✗ BAD EXAMPLES:                                                             │
│ "Camera moves" (too vague)                                                  │
│ "زوم على الشخصية" (not in English!)                                        │
│ "Smooth motion" (lacks specificity)                                         │
└─────────────────────────────────────────────────────────────────────────────┘`;
    } else if (animationType === 'transition') {
      systemPrompt += `

${fieldNumber}. animationName (REQUIRED for transition mode):
┌─────────────────────────────────────────────────────────────────────────────┐
│ Camera movement animation. Choose ONE:                                      │
│                                                                             │
│ • zoom-in     - Dramatic focus, builds tension                             │
│ • zoom-out    - Reveal, conclusion, big picture                            │
│ • pan-right   - Journey forward, progress                                  │
│ • pan-left    - Looking back, reflection                                   │
│ • pan-up      - Hope, aspiration                                           │
│ • pan-down    - Discovery, grounding                                       │
│ • ken-burns   - Subtle movement, documentary (DEFAULT)                     │
│ • rotate-cw   - Time passing, magical                                      │
│ • rotate-ccw  - Flashback, reversal                                        │
│ • slide-left  - Transition, movement                                       │
│ • slide-right - Arrival, revelation                                        │
└─────────────────────────────────────────────────────────────────────────────┘

${fieldNumber + 1}. effectName (REQUIRED for transition mode):
┌─────────────────────────────────────────────────────────────────────────────┐
│ Visual filter based on scene mood. Choose ONE:                             │
│                                                                             │
│ • none        - Neutral, normal look                                        │
│ • vignette    - Focus on center, intimate                                  │
│ • sepia       - Flashback, memories, nostalgia                             │
│ • black-white - Dramatic, powerful                                         │
│ • warm        - Happy, love, comfort                                       │
│ • cool        - Sad, night, mystery                                        │
│ • grain       - Vintage, nostalgic                                         │
│ • dramatic    - Tension, intensity                                         │
│ • cinematic   - Epic, movie-like                                           │
│ • dreamy      - Fantasy, soft                                              │
│ • glow        - Magic, romantic                                            │
│                                                                             │
│ MATCHING GUIDE:                                                             │
│ Happy → warm, glow, none                                                   │
│ Sad → cool, black-white, vignette                                          │
│ Nostalgic → sepia, grain                                                   │
│ Tense → dramatic, cinematic                                                │
│ Romantic → warm, dreamy, glow                                              │
│ Epic → cinematic, dramatic                                                 │
└─────────────────────────────────────────────────────────────────────────────┘`;
    }
  }

  systemPrompt += `

═══════════════════════════════════════════════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════════════════════════════════════════════

DO:
✓ ALWAYS write imagePrompt in ENGLISH (AI image models work best with English)
✓ Include style keywords in EVERY imagePrompt
✓ Maintain visual consistency across all scenes
✓ Match mood and tone to the narrative
✓ Create vivid, specific descriptions

DON'T:
✗ Never use generic descriptions
✗ Never include text/words in the image description
✗ Never describe UI elements or overlays
✗ Never use style keywords from the "avoid" list

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

{
  "scenes": [
    {
      "sceneNumber": 1,
      "imagePrompt": "detailed visual description with style keywords..."${voiceoverEnabled ? ',\n      "voiceText": "text from narration...",\n      "voiceMood": "neutral"' : ''}${animationMode && animationType === 'image-to-video' ? ',\n      "videoPrompt": "motion description..."' : ''}${animationMode && animationType === 'transition' ? ',\n      "animationName": "ken-burns",\n      "effectName": "none"' : ''}
    }
  ],
  "totalScenes": <number>
}

Return ONLY valid JSON. No markdown, no explanations.
`;

  return systemPrompt;
}

/**
 * User prompt for storyboard enhancement
 */
export function buildStoryboardUserPrompt(
  scenes: Array<{ sceneNumber: number; duration: number; narration: string }>,
  aspectRatio: string,
  imageStyle: ImageStyle,
  voiceoverEnabled: boolean,
  language?: string,
  textOverlay?: string,
  animationMode?: boolean,
  animationType?: 'transition' | 'image-to-video'
): string {
  const scenesList = scenes
    .map(
      (s) =>
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE ${s.sceneNumber} (${s.duration} seconds)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Narration:
"${s.narration}"`
    )
    .join('\n\n');

  const wordsPerSecond = language === 'Arabic' || language === 'ar' ? 2 : 2.5;
  const styleGuide = IMAGE_STYLE_GUIDES[imageStyle] || IMAGE_STYLE_GUIDES['photorealistic'];
  
  let prompt = `
═══════════════════════════════════════════════════════════════════════════════
STORYBOARD ENHANCEMENT REQUEST
═══════════════════════════════════════════════════════════════════════════════

${scenesList}

═══════════════════════════════════════════════════════════════════════════════
SETTINGS
═══════════════════════════════════════════════════════════════════════════════

• Aspect Ratio: ${aspectRatio}
• Image Style: ${imageStyle.toUpperCase()} - ${styleGuide.description}
• Voiceover: ${voiceoverEnabled ? `✓ Enabled (${language || 'English'})` : '✗ Disabled'}
• Animation: ${animationMode ? `✓ Enabled (${animationType})` : '✗ Disabled'}

═══════════════════════════════════════════════════════════════════════════════
STYLE KEYWORDS TO USE
═══════════════════════════════════════════════════════════════════════════════

${styleGuide.keywords.join(', ')}`;

  if (voiceoverEnabled) {
    prompt += `

═══════════════════════════════════════════════════════════════════════════════
⚠️ TIMING REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

Each scene has a specific duration. voiceText MUST match:
• Reading speed: ${wordsPerSecond} words/second
• Example: ${scenes[0]?.duration || 5}s scene → ~${Math.round((scenes[0]?.duration || 5) * wordsPerSecond)} words`;
  }

  prompt += `

═══════════════════════════════════════════════════════════════════════════════
GENERATE NOW
═══════════════════════════════════════════════════════════════════════════════

Create enhanced data for all ${scenes.length} scenes.
Remember: ALWAYS write imagePrompt in ENGLISH for best AI image generation results.
`;

  return prompt;
}
