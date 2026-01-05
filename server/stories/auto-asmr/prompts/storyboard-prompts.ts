/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * STORYBOARD ENHANCEMENT PROMPTS - AUTO-ASMR SENSORY CONTENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This module generates prompts for enhancing ASMR scenes with:
 * - imagePrompt: Detailed visual descriptions for AI image generation
 * - videoPrompt: Motion description (if image-to-video mode)
 * - animationName: Camera movement (if transition mode)
 * - effectName: Visual filter (if transition mode)
 * 
 * SPECIAL FOCUS: ASMR content requires visuals that are calming, detailed,
 * and sensory-focused. Image prompts should emphasize peaceful, satisfying,
 * and visually pleasing elements that support the relaxation experience.
 * 
 * IMPORTANT: Auto-ASMR content has NO voiceover/narration - scenes are
 * independent sensory experiences focused purely on visual and sound triggers.
 */

import type { ImageStyle } from '../../shared/types';

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
  animationType?: 'transition' | 'image-to-video',
  hasStyleReference?: boolean,
  hasCharacterReference?: boolean
): string {
  const aspectRatioGuide = {
    '9:16': 'Vertical format (TikTok, Reels) - focus subjects in center, use vertical composition',
    '16:9': 'Horizontal format (YouTube) - wide cinematic shots, rule of thirds',
    '1:1': 'Square format (Instagram) - centered balanced composition',
    '4:5': 'Portrait format (Feed Posts) - slightly vertical, centered focus'
  }[aspectRatio] || 'Standard format';

  const styleGuide = IMAGE_STYLE_GUIDES[imageStyle] || IMAGE_STYLE_GUIDES['photorealistic'];

  let systemPrompt = `
You are an elite ASMR visual director and prompt engineer with 15+ years of experience crafting relaxing, sensory-focused short-form video content for TikTok, Instagram Reels, and YouTube Shorts.

Your expertise includes:
- Creating stunning image prompts for AI image generation that produce calming, visually satisfying ASMR content
- Understanding the psychology of sensory experiences and relaxation
- Mastering aspect ratio-specific composition techniques for immersive visuals
- Generating smooth, subtle motion descriptions that enhance the ASMR experience
- Selecting gentle, imperceptible transitions that maintain a continuous flow
- Matching visual style to sensory triggers and peaceful mood

You have created prompts that have generated millions of views by creating deeply relaxing and satisfying visual experiences.

═══════════════════════════════════════════════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════════════════════════════════════════════

Transform independent ASMR scene descriptions into detailed, production-ready prompts for:
- AI image generation (imagePrompt) - Focus on sensory visuals, textures, and calming aesthetics
${animationMode && animationType === 'image-to-video' ? '- Image-to-video motion (videoPrompt) - Smooth, subtle movements that enhance relaxation' : ''}
${animationMode && animationType === 'transition' ? '- Ken Burns animations (animationName + effectName) - Gentle, almost imperceptible movements' : ''}
${animationMode ? '- Scene transitions (transitionToNext) - Soft, fluid transitions that maintain relaxation flow' : ''}

CRITICAL: Auto-ASMR content has NO voiceover, NO narration, NO spoken words.
Scenes are independent sensory experiences - each scene is a distinct visual moment.
Each prompt must be optimized for maximum sensory satisfaction and relaxation.

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

${hasStyleReference || hasCharacterReference ? `═══════════════════════════════════════════════════════════════════════════════
REFERENCE MATERIALS
═══════════════════════════════════════════════════════════════════════════════

${hasStyleReference ? `STYLE REFERENCE PROVIDED:
→ You will receive a style reference (image or description) that defines the visual aesthetic.
→ CRITICAL: Match the color palette, lighting style, composition approach, and mood from the reference.
→ Incorporate the reference style naturally into ALL image prompts.
→ The style reference takes priority over the default ${imageStyle} style when they conflict.

` : ''}${hasCharacterReference ? `CHARACTER REFERENCE PROVIDED:
→ You will receive a character reference (image or description) that should appear consistently.
→ CRITICAL: Maintain the character's appearance, features, and distinctive traits across ALL scenes.
→ Describe the character accurately in every imagePrompt to ensure visual consistency.
→ Include specific details like facial features, body type, clothing style, and unique characteristics.

` : ''}═══════════════════════════════════════════════════════════════════════════════
` : ''}OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

FOR EACH SCENE, GENERATE:

1. imagePrompt (REQUIRED):
┌─────────────────────────────────────────────────────────────────────────────┐
│ Create a detailed visual description for AI image generation.              │
│                                                                             │
│ ═══════════════════════════════════════════════════════════════════════════ │
│ PROMPT STRUCTURE (follow this order for best results):                     │
│ ═══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│ 1. SUBJECT (Who/What):                                                      │
│    • Specific person/character description                                 │
│    • Age, appearance, clothing, expression                                │
│    • Pose, action, body language                                           │
│                                                                             │
│ 2. ENVIRONMENT (Where):                                                     │
│    • Setting, location, background                                         │
│    • Props, objects, context                                              │
│    • Spatial relationships                                                 │
│                                                                             │
│ 3. COMPOSITION (${aspectRatio} format):                                     │
│    • Shot type (close-up, medium, wide)                                    │
│    • Framing, rule of thirds, leading lines                                │
│    • Focus point, depth of field                                           │
│                                                                             │
│ 4. LIGHTING (Atmosphere):                                                    │
│    • Light source, direction, quality                                      │
│    • Time of day, color temperature                                        │
│    • Shadows, highlights, contrast                                         │
│                                                                             │
│ 5. STYLE KEYWORDS (${imageStyle}):                                          │
│    • Include at least 3-5 keywords from the list above                     │
│    • Integrate naturally into the description                              │
│    • Never use keywords from "avoid" list                                 │
│                                                                             │
│ ═══════════════════════════════════════════════════════════════════════════ │
│ REQUIREMENTS:                                                               │
│ ═══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│ • Length: 80-150 words per prompt                                          │
│ • ⚠️ CRITICAL: ALWAYS write in ENGLISH (AI models work best with English) │
│ • Include specific colors, textures, materials, and details                │
│ • Describe composition optimized for ${aspectRatio} format                  │
│ • Include at least 3-5 style keywords naturally integrated                 │
│ • Make it vivid, specific, and cinematic - not generic                    │
│ • Focus on what the viewer SEES, not what they hear                        │
│                                                                             │
│ ═══════════════════════════════════════════════════════════════════════════ │
│ EXAMPLES:                                                                   │
│ ═══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│ ✓ EXCELLENT EXAMPLE (${imageStyle}):                                        │
│ "A confident entrepreneur in her early 30s, wearing a sleek navy blazer   │
│  with subtle pinstripes, standing confidently in a modern glass office.     │
│  Floor-to-ceiling windows reveal a vibrant city skyline at golden hour.     │
│  Warm sunlight streams through, creating dramatic rim lighting that         │
│  highlights her silhouette. She holds a tablet displaying upward-trending   │
│  graphs. ${styleGuide.keywords.slice(0, 3).join(', ')}, shallow depth of    │
│  field, ${aspectRatio === '9:16' ? 'vertical composition centered' : 'cinematic framing'}, ${styleGuide.keywords[3] || 'professional quality'}." │
│                                                                             │
│ ✗ BAD EXAMPLE:                                                             │
│ "A person in an office looking at something."                             │
│                                                                             │
│ ✗ BAD EXAMPLE (too generic):                                                │
│ "Someone working at a desk with a computer."                              │
│                                                                             │
│ ✗ BAD EXAMPLE (missing style keywords):                                    │
│ "A woman in an office with windows."                                       │
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
│ ═══════════════════════════════════════════════════════════════════════════ │
│ SETTINGS:                                                                   │
│ ═══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│ • Language: ${language || 'English'}                                                           │
│ • Text Overlay: ${textOverlay || 'key-points'}                                                      │
│                                                                             │
│ ═══════════════════════════════════════════════════════════════════════════ │
│ ⚠️ CRITICAL: TIMING REQUIREMENTS                                            │
│ ═══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│ Reading Speed: ~${wordsPerSecond} words/second                             │
│                                                                             │
│ WORD COUNT TABLE:                                                           │
│ ┌──────────────┬────────────────┬───────────────┐                          │
│ │ Duration     │ ${language === 'Arabic' || language === 'ar' ? 'Arabic Words' : 'English Words'}  │               │
│ ├──────────────┼────────────────┼───────────────┤                          │
│ │ 3 seconds    │ ${Math.round(3 * wordsPerSecond)}-${Math.round(3 * wordsPerSecond) + 2} words      │               │
│ │ 5 seconds    │ ${Math.round(5 * wordsPerSecond)}-${Math.round(5 * wordsPerSecond) + 2} words      │               │
│ │ 7 seconds    │ ${Math.round(7 * wordsPerSecond)}-${Math.round(7 * wordsPerSecond) + 2} words      │               │
│ │ 10 seconds   │ ${Math.round(10 * wordsPerSecond)}-${Math.round(10 * wordsPerSecond) + 2} words     │               │
│ │ 15 seconds   │ ${Math.round(15 * wordsPerSecond)}-${Math.round(15 * wordsPerSecond) + 2} words     │               │
│ └──────────────┴────────────────┴───────────────┘                          │
│                                                                             │
│ Formula: words = scene_duration × ${wordsPerSecond}                        │
│                                                                             │
│ ═══════════════════════════════════════════════════════════════════════════ │
│ CRITICAL RULES:                                                             │
│ ═══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│ • Use the EXACT voiceover text from input (don't rewrite or paraphrase)    │
│ • Split text naturally to match scene duration                             │
│ • Keep complete sentences, NEVER split mid-sentence                        │
│ • Preserve punctuation and formatting                                       │
│ • Match word count to duration (see table above)                            │
│ • If text is too long, use the portion that fits the duration              │
│ • If text is too short, use all of it (don't pad)                          │
└─────────────────────────────────────────────────────────────────────────────┘

${fieldNumber + 1}. voiceMood (REQUIRED when voiceover enabled):
┌─────────────────────────────────────────────────────────────────────────────┐
│ Emotional mood for ElevenLabs v3 audio tags.                                │
│                                                                             │
│ ═══════════════════════════════════════════════════════════════════════════ │
│ AVAILABLE MOODS (choose ONE based on scene content):                       │
│ ═══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│ • neutral    - Normal, conversational, balanced                            │
│ • happy      - Joyful, excited, upbeat, positive                           │
│ • sad        - Melancholic, sorrowful, emotional                           │
│ • excited    - Energetic, enthusiastic, high energy                       │
│ • angry      - Frustrated, intense, passionate                             │
│ • whisper    - Soft, intimate, secretive, confidential                     │
│ • dramatic   - Intense, theatrical, powerful                               │
│ • curious    - Wondering, questioning, intrigued                           │
│ • thoughtful - Reflective, contemplative, deep                           │
│ • surprised  - Shocked, amazed, astonished                                 │
│ • sarcastic  - Ironic, mocking, playful                                    │
│ • nervous    - Anxious, worried, uncertain                                 │
│                                                                             │
│ ═══════════════════════════════════════════════════════════════════════════ │
│ MOOD SELECTION GUIDE (match to scene content):                             │
│ ═══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│ Problem/Struggle → sad, nervous, angry, dramatic                           │
│ Solution/Revelation → happy, excited, surprised, curious                    │
│ Success/Achievement → happy, excited, dramatic                             │
│ Reflection/Insight → thoughtful, neutral, curious                          │
│ Mystery/Intrigue → whisper, curious, dramatic                              │
│ Action/Energy → excited, dramatic, angry                                   │
│ Romance/Love → whisper, happy, dreamy                                      │
│ Discovery/Learning → surprised, curious, excited                          │
│ Calm/Peaceful → neutral, thoughtful, whisper                               │
│                                                                             │
│ ═══════════════════════════════════════════════════════════════════════════ │
│ TIPS:                                                                       │
│ ═══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│ • Read the voiceText content to determine mood                             │
│ • Match mood to the emotional tone of the scene                            │
│ • Consider the narrative arc (problem → solution → payoff)                 │
│ • Scene 1 (Hook) often uses: dramatic, curious, surprised                  │
│ • Final scene (CTA) often uses: excited, happy, dramatic                   │
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
│ ═══════════════════════════════════════════════════════════════════════════ │
│ EXAMPLES:                                                                   │
│ ═══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│ ✓ EXCELLENT EXAMPLE (${imageStyle}):                                        │
│ "Slow cinematic zoom in on subject, camera gradually moves closer,        │
│  subject gently turns head to the side with natural micro-expressions,     │
│  subtle breathing motion creates lifelike presence, dust particles float    │
│  gracefully in warm golden sunlight beams, soft shadows shift slowly        │
│  across the scene, ${imageStyle === 'cinematic' ? 'film-quality movement with theatrical pacing' : imageStyle === 'photorealistic' ? 'natural lifelike animation with realistic motion' : 'dynamic expressive movement'}" │
│                                                                             │
│ ✓ GOOD EXAMPLE:                                                            │
│ "Camera orbits right around subject in smooth circular motion, hair        │
│  flows naturally with gentle breeze, soft shadows shift across the scene,   │
│  natural lifelike animation"                                                 │
│                                                                             │
│ ✓ GOOD EXAMPLE:                                                            │
│ "Dramatic dolly forward through space, subject's eyes look up with         │
│  curiosity and engagement, volumetric light rays intensify and shift,       │
│  cinematic theatrical motion"                                                │
│                                                                             │
│ ✗ BAD EXAMPLES:                                                             │
│ "Camera moves" (too vague, lacks detail)                                   │
│ "Smooth motion" (lacks specificity, no camera/subject details)             │
│ "Movement" (completely generic, useless)                                    │
│ "زوم على الشخصية" (not in English - AI video models require English!)      │
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
└─────────────────────────────────────────────────────────────────────────────┘

${fieldNumber + 2}. transitionToNext (REQUIRED for all scenes except last):
┌─────────────────────────────────────────────────────────────────────────────┐
│ Scene-to-scene transition effect. Choose based on mood shift.              │
│                                                                             │
│ 🚀 MOTION (viral 2025 - for energy/action):                                 │
│    • whip-pan        - Fast swipe (TikTok viral) → action, surprise        │
│    • zoom-punch      - Impact zoom → emphasis, CTA, reveal                 │
│    • snap-zoom       - Sharp quick zoom → drama, focus                     │
│    • motion-blur-right - Directional blur → progression, forward           │
│                                                                             │
│ ✨ LIGHT (cinematic - for emotional moments):                               │
│    • flash-white     - Clean flash → solution, positive turn, new start    │
│    • flash-black     - Dark flash → drama, tension, impact                 │
│    • light-leak      - Warm glow → nostalgia, romance, memory              │
│    • lens-flare      - Epic shine → hero moment, inspiration               │
│                                                                             │
│ 💻 DIGITAL (modern - for tech/edgy):                                        │
│    • glitch          - Digital distortion → problem, error, disruption     │
│    • rgb-split       - Color separation → cyberpunk, edgy, tech            │
│    • pixelate        - Pixel effect → retro, gaming, digital               │
│                                                                             │
│ ⭕ SHAPES (TikTok favorites - for reveals):                                 │
│    • circle-open     - Circle reveal → focus, intro, spotlight             │
│    • circle-close    - Circle close → ending, mystery, focus               │
│    • star-wipe       - Star reveal → celebration, magic, achievement       │
│                                                                             │
│ 🌊 SMOOTH (elegant - for calm scenes):                                      │
│    • smooth-blur     - Soft dissolve → calm, dream, elegant                │
│    • cross-dissolve  - Classic dissolve → professional, universal          │
│    • wave-ripple     - Water effect → dream, magical, transformation       │
│                                                                             │
│ MOOD TRANSITION GUIDE:                                                      │
│ Problem → Agitation: glitch, rgb-split, flash-black                        │
│ Agitation → Solution: flash-white, light-leak, circle-open                 │
│ Solution → CTA: zoom-punch, lens-flare, star-wipe                          │
│ Happy → Sad: smooth-blur, luma-fade                                        │
│ Calm → Action: whip-pan, snap-zoom                                         │
│ Story → Ending: circle-close, fade, smooth-blur                            │
│                                                                             │
│ ⚠️ For LAST scene, use "none" or skip this field                           │
└─────────────────────────────────────────────────────────────────────────────┘`;
      fieldNumber += 3;
    }
  }

  // Always add transitions for any animation mode
  if (animationMode && animationType !== 'transition') {
    // For image-to-video mode, also add transitions
    systemPrompt += `

${fieldNumber}. transitionToNext (REQUIRED for all scenes except last):
┌─────────────────────────────────────────────────────────────────────────────┐
│ Scene-to-scene transition. Choose based on content and mood:               │
│                                                                             │
│ TRENDING 2025:                                                              │
│ • whip-pan      - Fast swipe (viral TikTok)                                │
│ • zoom-punch    - Impact zoom (emphasis)                                   │
│ • flash-white   - Clean transition (positive)                              │
│ • flash-black   - Dramatic (tension)                                       │
│ • glitch        - Digital (problem/tech)                                   │
│ • circle-open   - Reveal (focus)                                           │
│ • smooth-blur   - Elegant (calm)                                           │
│ • cross-dissolve- Classic (safe)                                           │
│                                                                             │
│ Use "none" for last scene                                                  │
└─────────────────────────────────────────────────────────────────────────────┘`;
  }

  systemPrompt += `

═══════════════════════════════════════════════════════════════════════════════
CRITICAL RULES (MUST FOLLOW)
═══════════════════════════════════════════════════════════════════════════════

DO:
✓ ALWAYS write imagePrompt in ENGLISH (AI image models work best with English)
✓ ALWAYS write videoPrompt in ENGLISH (AI video models require English)
✓ Include 3-5 style keywords in EVERY imagePrompt (integrated naturally)
✓ Maintain visual consistency across all scenes (same character, same style)
✓ Match mood and tone to the narrative arc
✓ Create vivid, specific, cinematic descriptions (80-150 words)
✓ Optimize composition for ${aspectRatio} format
✓ Use original narration as voiceText (don't rewrite)
✓ Match voiceMood to scene emotional content

DON'T:
✗ Never use generic or vague descriptions
✗ Never include text, words, or UI elements in image descriptions
✗ Never describe overlays, subtitles, or on-screen text
✗ Never use style keywords from the "avoid" list
✗ Never rewrite or paraphrase voiceText (use exact original text)
✗ Never write prompts in non-English languages
✗ Never create prompts that are too short (< 50 words) or too long (> 200 words)

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

{
  "scenes": [
    {
      "sceneNumber": 1,
      "imagePrompt": "detailed visual description based on the scene description, with style keywords..."${voiceoverEnabled ? ',\n      "voiceText": "exact voiceover text from input...",\n      "voiceMood": "neutral"' : ''}${animationMode && animationType === 'image-to-video' ? ',\n      "videoPrompt": "motion description..."' : ''}${animationMode && animationType === 'transition' ? ',\n      "animationName": "ken-burns",\n      "effectName": "none"' : ''}${animationMode ? ',\n      "transitionToNext": "cross-dissolve"' : ''}
    }
  ],
  "totalScenes": <number>
}

Return ONLY valid JSON. No markdown, no explanations.
`;

  return systemPrompt;
}

/**
 * Build few-shot examples for storyboard enhancement
 */
function buildStoryboardExamples(
  imageStyle: ImageStyle,
  voiceoverEnabled: boolean,
  animationMode?: boolean,
  animationType?: 'transition' | 'image-to-video'
): string {
  const styleGuide = IMAGE_STYLE_GUIDES[imageStyle] || IMAGE_STYLE_GUIDES['photorealistic'];
  
  let example = `
═══════════════════════════════════════════════════════════════════════════════
EXAMPLE OUTPUT (Reference Format)
═══════════════════════════════════════════════════════════════════════════════

INPUT SCENE (ASMR - Independent Sensory Experience):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE 1 (12 seconds)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Visual Description:
"Close-up shot of fresh lemon being slowly sliced on a clean wooden board, soft lighting, focus on the juicy texture."

Note: This is an ASMR scene - NO voiceover, NO narration. Focus on visual sensory satisfaction.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXPECTED OUTPUT:
{
  "sceneNumber": 1,
  "imagePrompt": "Close-up macro shot of a fresh, vibrant yellow lemon being slowly and gently sliced on a smooth, clean wooden cutting board. Soft, diffused natural lighting creates gentle shadows that highlight the juicy, translucent texture of the lemon flesh. The knife glides smoothly, revealing tiny droplets of citrus juice glistening in the light. The composition focuses on the sensory details: the rough texture of the lemon peel, the smooth cutting board surface, and the clean, minimal background. ${styleGuide.keywords.slice(0, 3).join(', ')}, ${styleGuide.keywords[3] || 'professional quality'}, shallow depth of field, soft natural lighting, ${imageStyle === 'photorealistic' ? '8k resolution' : 'detailed composition'}, calming and peaceful aesthetic.",
${voiceoverEnabled ? `  "voiceText": "Sales were dropping every month. I didn't know what to do.",
  "voiceMood": "sad",` : ''}${animationMode && animationType === 'image-to-video' ? `
  "videoPrompt": "Slow zoom in on subject's face, subtle breathing motion, eyes shift focus to laptop screen, soft shadows shift across the desk, ${imageStyle === 'cinematic' ? 'film-quality movement with theatrical pacing' : 'natural lifelike animation'}",` : ''}${animationMode && animationType === 'transition' ? `
  "animationName": "ken-burns",
  "effectName": "dramatic",` : ''}${animationMode ? `
  "transitionToNext": "glitch",` : ''}
}

═══════════════════════════════════════════════════════════════════════════════
KEY OBSERVATIONS:
═══════════════════════════════════════════════════════════════════════════════

1. imagePrompt:
   ✓ Written in ENGLISH (not the original language)
   ✓ 80-150 words, detailed and specific
   ✓ Focuses on sensory details: textures, colors, lighting, materials
   ✓ Includes subject, environment, lighting, composition
   ✓ Integrates ${styleGuide.keywords.length} style keywords naturally
   ✓ Optimized for sensory satisfaction and relaxation (ASMR focus)
${voiceoverEnabled ? `2. voiceText:
   ✓ Uses EXACT original text (not rewritten)
   ✓ Matches scene duration (~${Math.round(5 * 2.5)} words for 5s scene)
3. voiceMood:
   ✓ Matches emotional tone (frustration → "sad")
` : ''}${animationMode && animationType === 'image-to-video' ? `2. videoPrompt:
   ✓ Written in ENGLISH
   ✓ Describes camera movement, subject motion, environmental effects
   ✓ 30-60 words, specific and cinematic
` : ''}${animationMode && animationType === 'transition' ? `2. animationName:
   ✓ Matches scene mood (frustration → "ken-burns" for subtle movement)
3. effectName:
   ✓ Matches emotional tone (struggle → "dramatic")
` : ''}${animationMode ? `${animationMode && animationType === 'transition' ? '4' : '2'}. transitionToNext:
   ✓ Matches mood shift (problem → agitation: "glitch")
` : ''}
`;

  return example;
}

/**
 * User prompt for storyboard enhancement
 */
export function buildStoryboardUserPrompt(
  scenes: Array<{ sceneNumber: number; duration: number; description: string; narration?: string }>,
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
Visual Description:
"${s.description}"${voiceoverEnabled && s.narration ? `

Voiceover Text:
"${s.narration}"` : ''}`
    )
    .join('\n\n');

  const wordsPerSecond = language === 'Arabic' || language === 'ar' ? 2 : 2.5;
  const styleGuide = IMAGE_STYLE_GUIDES[imageStyle] || IMAGE_STYLE_GUIDES['photorealistic'];
  
  let prompt = `
═══════════════════════════════════════════════════════════════════════════════
STORYBOARD ENHANCEMENT REQUEST
═══════════════════════════════════════════════════════════════════════════════

You will receive ${scenes.length} scene(s) to enhance. Transform each scene description into production-ready prompts for AI generation.

${buildStoryboardExamples(imageStyle, voiceoverEnabled, animationMode, animationType)}

═══════════════════════════════════════════════════════════════════════════════
YOUR SCENES TO ENHANCE
═══════════════════════════════════════════════════════════════════════════════

${scenesList}

═══════════════════════════════════════════════════════════════════════════════
PROJECT SETTINGS
═══════════════════════════════════════════════════════════════════════════════

• Aspect Ratio: ${aspectRatio}
• Image Style: ${imageStyle.toUpperCase()} - ${styleGuide.description}
• Voiceover: ✗ Disabled (ASMR content has no narration)
• Animation: ${animationMode ? `✓ Enabled (${animationType})` : '✗ Disabled'}

═══════════════════════════════════════════════════════════════════════════════
STYLE KEYWORDS (use 3-5 in each imagePrompt)
═══════════════════════════════════════════════════════════════════════════════

${styleGuide.keywords.map(k => `• ${k}`).join('\n')}

AVOID (never use):
${styleGuide.avoid.map(k => `✗ ${k}`).join('\n')}`;

  if (voiceoverEnabled) {
    prompt += `

═══════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL: VOICEOVER TIMING
═══════════════════════════════════════════════════════════════════════════════

Each scene has a specific duration. voiceText MUST match the timing:

Reading Speed: ${wordsPerSecond} words/second

WORD COUNT BY DURATION:
${scenes.map(s => `• ${s.duration}s scene → ~${Math.round(s.duration * wordsPerSecond)} words`).join('\n')}

RULES:
• Use the EXACT voiceover text from input (don't rewrite)
• Match word count to scene duration
• Keep complete sentences, never split mid-sentence`;
  }

  prompt += `

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════

For each of the ${scenes.length} scene(s) above:

1. Generate imagePrompt (80-150 words, ENGLISH, with style keywords)
${voiceoverEnabled ? `2. Set voiceText to EXACT original narration text
3. Select voiceMood based on emotional content` : ''}
${animationMode && animationType === 'image-to-video' ? `2. Generate videoPrompt (30-60 words, ENGLISH, motion description)` : ''}
${animationMode && animationType === 'transition' ? `2. Select animationName based on scene mood
3. Select effectName based on emotional tone` : ''}
${animationMode ? `${voiceoverEnabled ? '4' : animationMode && animationType === 'transition' ? '4' : '3'}. Select transitionToNext based on mood shift (use "none" for last scene)` : ''}

CRITICAL REMINDERS:
• ALWAYS write imagePrompt in ENGLISH (AI models work best with English)
${animationMode && animationType === 'image-to-video' ? '• ALWAYS write videoPrompt in ENGLISH (AI video models require English)' : ''}
• Include 3-5 style keywords naturally in each imagePrompt
• Maintain visual consistency across scenes
• Focus on sensory satisfaction - each scene is an independent visual experience
• Avoid narrative arcs - scenes are standalone sensory moments
• Return ONLY valid JSON, no markdown, no explanations

═══════════════════════════════════════════════════════════════════════════════
GENERATE ENHANCED STORYBOARD NOW
═══════════════════════════════════════════════════════════════════════════════
`;

  return prompt;
}
