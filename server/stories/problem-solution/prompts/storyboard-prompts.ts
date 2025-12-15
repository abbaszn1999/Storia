// Storyboard Enhancement Prompts

/**
 * System prompt for storyboard enhancement agent
 */
export function buildStoryboardEnhancerSystemPrompt(
  aspectRatio: string,
  voiceoverEnabled: boolean,
  language?: string,
  textOverlay?: string,
  animationMode?: boolean,
  animationType?: 'transition' | 'image-to-video'
): string {
  const aspectRatioGuide = {
    '9:16': 'Vertical format (TikTok, Reels) - focus on vertical composition',
    '16:9': 'Horizontal format (YouTube) - wide cinematic shots',
    '1:1': 'Square format (Instagram) - centered balanced composition'
  }[aspectRatio] || 'Standard format';

  let systemPrompt = `You are a professional visual content creator and prompt engineer specialized in creating detailed image prompts and voice directions for short-form video content.

Your task: Enhance each scene with detailed, actionable prompts optimized for AI image generation and voice synthesis.

ASPECT RATIO: ${aspectRatio} - ${aspectRatioGuide}

OUTPUT REQUIREMENTS FOR EACH SCENE:
1. sceneNumber: The scene number (must match input)
2. imagePrompt: Detailed visual description for AI image generation
   - Be specific about composition, lighting, colors, mood
   - Consider the ${aspectRatio} aspect ratio in composition
   - Make it vivid and actionable for image AI models
   - Length: 50-150 words`;

  let fieldNumber = 3;

  // Add voiceText and voiceMood if voiceover is enabled
  if (voiceoverEnabled) {
    const wordsPerSecond = language === 'Arabic' || language === 'ar' ? 2 : 2.5;
    systemPrompt += `
${fieldNumber}. voiceText: The exact text to be read by voice synthesis
   - Language: ${language || 'English'}
   - Text overlay style: ${textOverlay || 'key-points'}
   - **CRITICAL TIMING REQUIREMENT**: Match the scene duration EXACTLY
   - Reading speed: ~${wordsPerSecond} words per second
   - Formula: voiceText words = scene.duration × ${wordsPerSecond}
   - Examples:
     * 5 second scene → write ${Math.round(5 * wordsPerSecond)}-${Math.round(5 * wordsPerSecond) + 2} words
     * 10 second scene → write ${Math.round(10 * wordsPerSecond)}-${Math.round(10 * wordsPerSecond) + 2} words
     * 15 second scene → write ${Math.round(15 * wordsPerSecond)}-${Math.round(15 * wordsPerSecond) + 3} words
   - Keep sentences natural and complete
   - Prioritize clarity and natural speech flow
   - Remove any text that doesn't sound natural when spoken

${fieldNumber + 1}. voiceMood: Emotional mood for voice delivery (for ElevenLabs v3 audio tags)
   - Choose ONE mood that best matches the scene's emotional tone:
   - "neutral": Normal, conversational delivery
   - "happy": Joyful, excited, upbeat tone
   - "sad": Melancholic, sorrowful delivery
   - "excited": Energetic, enthusiastic
   - "angry": Frustrated, intense
   - "whisper": Soft, intimate, secretive
   - "dramatic": Intense, theatrical delivery
   - "curious": Wondering, questioning tone
   - "thoughtful": Reflective, contemplative
   - "surprised": Shocked, amazed
   - "sarcastic": Ironic, mocking tone
   - "nervous": Anxious, worried
   
   MOOD SELECTION GUIDE:
   | Scene Content              | Recommended Mood     |
   |----------------------------|----------------------|
   | Happy moments, celebration | happy, excited       |
   | Sad moments, loss          | sad, thoughtful      |
   | Suspense, tension          | dramatic, nervous    |
   | Mystery, secrets           | whisper, curious     |
   | Comedy, humor              | happy, sarcastic     |
   | Action, conflict           | angry, dramatic      |
   | Romance, love              | whisper, happy       |
   | Discovery, revelation      | surprised, curious   |`;
    fieldNumber += 2;
  }

  // Add animation fields if animation mode is enabled
  if (animationMode && animationType) {
    if (animationType === 'image-to-video') {
      systemPrompt += `
${fieldNumber}. videoPrompt: Description of motion/animation for image-to-video
   - Describe camera movements (zoom, pan, tilt)
   - Describe subject movements or transformations
   - Keep it realistic and achievable with image-to-video AI
   - Length: 20-50 words`;
    } else if (animationType === 'transition') {
      systemPrompt += `
${fieldNumber}. animationName: Choose ONE camera animation from this list:
   - "zoom-in": Dramatic focus, builds tension, emotional close-up
   - "zoom-out": Reveal, conclusion, showing the big picture
   - "pan-right": Journey forward, progress, moving ahead
   - "pan-left": Looking back, reflection, remembering
   - "pan-up": Hope, aspiration, looking up to something
   - "pan-down": Discovery, grounding, settling down
   - "ken-burns": Subtle movement, neutral, documentary style
   - "rotate-cw": Time passing, magical, transformation
   - "rotate-ccw": Flashback, reversal, going back
   - "slide-left": Transition, movement, change
   - "slide-right": Arrival, revelation, discovery

${fieldNumber + 1}. effectName: Choose ONE visual effect based on scene MOOD:
   - "none": Neutral scenes, normal look
   - "vignette": Focus on center, intimate moments
   - "sepia": Flashback, memories, old times, nostalgia
   - "black-white": Dramatic, sadness, historical, powerful
   - "warm": Happy, love, sunset, comfort, joy
   - "cool": Sad, night, cold, mystery, loneliness
   - "grain": Vintage, nostalgic, film-like, retro
   - "dramatic": Tension, action, conflict, intensity
   - "cinematic": Epic, grand, movie-like, professional
   - "dreamy": Fantasy, dreams, soft, ethereal
   - "glow": Magic, romance, ethereal, beautiful

   EFFECT SELECTION GUIDE:
   | Scene Mood      | Recommended Effects              |
   |-----------------|----------------------------------|
   | Happy/Joyful    | warm, glow, none                 |
   | Sad/Melancholic | cool, black-white, vignette      |
   | Nostalgic       | sepia, grain, vignette           |
   | Tense/Action    | dramatic, cool, cinematic        |
   | Romantic        | warm, glow, dreamy               |
   | Epic/Grand      | cinematic, dramatic              |
   | Dream/Fantasy   | dreamy, glow                     |
   | Night/Dark      | cool, vignette                   |
   
   CRITICAL: Return ONLY exact names from the lists. No variations.`;
    }
  }

  systemPrompt += `

GUIDELINES:
- Maintain consistency across scenes for the same video
- Consider the narrative flow and scene transitions
- Be creative but realistic
- Focus on visual storytelling
- Match animation and effect to the scene's mood

JSON OUTPUT FORMAT:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "imagePrompt": "detailed visual description..."${voiceoverEnabled ? ',\n      "voiceText": "exact text to be spoken..."' : ''}${animationMode && animationType === 'image-to-video' ? ',\n      "videoPrompt": "motion description..."' : ''}${animationMode && animationType === 'transition' ? ',\n      "animationName": "zoom-in",\n      "effectName": "warm"' : ''}
    }
  ],
  "totalScenes": number
}

Return ONLY valid JSON matching this exact structure.`;

  return systemPrompt;
}

/**
 * User prompt for storyboard enhancement
 */
export function buildStoryboardUserPrompt(
  scenes: Array<{ sceneNumber: number; duration: number; narration: string }>,
  aspectRatio: string,
  voiceoverEnabled: boolean,
  language?: string,
  textOverlay?: string,
  animationMode?: boolean,
  animationType?: 'transition' | 'image-to-video'
): string {
  const scenesList = scenes
    .map(
      (s) =>
        `Scene ${s.sceneNumber} (${s.duration}s):\nNarration: ${s.narration}`
    )
    .join('\n\n');

  const wordsPerSecond = language === 'Arabic' || language === 'ar' ? 2 : 2.5;
  
  let prompt = `Enhance these scenes with detailed prompts:

${scenesList}

SETTINGS:
- Aspect Ratio: ${aspectRatio}
- Voiceover: ${voiceoverEnabled ? `Enabled (${language || 'English'}, ${textOverlay || 'key-points'})` : 'Disabled'}
- Animation: ${animationMode ? `Enabled (${animationType || 'none'})` : 'Disabled'}`;

  if (voiceoverEnabled) {
    prompt += `

⚠️ CRITICAL TIMING INSTRUCTIONS:
Each scene has a specific duration. Your voiceText MUST match this duration exactly.
- Reading speed: ${wordsPerSecond} words per second
- Calculate: voiceText words = scene duration × ${wordsPerSecond}
- Example: A 5-second scene needs ${Math.round(5 * wordsPerSecond)}-${Math.round(5 * wordsPerSecond) + 2} words

Review each scene duration above and write voiceText accordingly.`;
  }

  prompt += `

Generate enhanced data for all ${scenes.length} scenes.`;

  return prompt;
}

