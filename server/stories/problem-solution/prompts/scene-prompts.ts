// Problem-Solution Scene Breakdown Prompts

/**
 * Calculate optimal scene count based on video duration
 */
export function getOptimalSceneCount(duration: number): number {
  if (duration <= 20) return 2;
  if (duration <= 30) return 3;
  if (duration <= 45) return 4;
  if (duration <= 60) return 5;
  return 6;
}

/**
 * Calculate average scene duration
 */
export function getAverageSceneDuration(duration: number, sceneCount: number): number {
  return Math.round(duration / sceneCount);
}

export function buildSceneBreakdownSystemPrompt(
  duration: number,
  aspectRatio: string,
  voiceoverEnabled: boolean,
  sceneCount: number
): string {
  const avgDuration = getAverageSceneDuration(duration, sceneCount);
  
  return `You are a professional short-form video scriptwriter specialized in breaking stories into engaging scenes.

Your task is to analyze the provided story and divide it into exactly ${sceneCount} perfectly timed scenes for a ${duration}-second video.

CRITICAL RULES:
- Create EXACTLY ${sceneCount} scenes (no more, no less)
- Total duration MUST equal ${duration} seconds
- First scene: Strong hook to grab attention (3-5 seconds)
- Middle scenes: Develop the narrative naturally
- Last scene: Climax or strong call-to-action
- Each scene must have clear, concise narration text
- Each scene needs a detailed visual description for ${aspectRatio} format
${voiceoverEnabled ? '- Write narration suitable for voice-over delivery' : '- Focus on visual storytelling (minimal text)'}

SCENE STRUCTURE:
- Average duration per scene: ~${avgDuration} seconds
- Narration: What is said/shown (max 2-3 sentences)
- Visual: Detailed description for AI video generation

${aspectRatio === '9:16' ? 'VERTICAL FORMAT (9:16): Use vertical composition, stack elements, hands from bottom' : 
  aspectRatio === '16:9' ? 'HORIZONTAL FORMAT (16:9): Cinematic widescreen, guide eye left-to-right' : 
  'SQUARE FORMAT (1:1): Centered subjects, symmetrical compositions'}

OUTPUT FORMAT:
Return a JSON object with this exact structure (matching the schema):
{
  "scenes": [
    {
      "sceneNumber": 1,
      "narration": "Clear text for this scene",
      "duration": 8,
      "visualDescription": "Detailed visual description"
    }
  ],
  "totalScenes": ${sceneCount},
  "totalDuration": ${duration}
}`;
}

export function buildSceneUserPrompt(
  storyText: string,
  duration: number,
  aspectRatio: string
): string {
  return `Break down this story into scenes:

STORY:
${storyText}

REQUIREMENTS:
- Total video duration: ${duration} seconds
- Aspect ratio: ${aspectRatio}
- Create engaging, well-paced scenes
- Ensure scene durations sum to ${duration} seconds exactly

Generate the scene breakdown as JSON.`;
}

