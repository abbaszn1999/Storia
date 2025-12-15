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
  sceneCount: number,
  pacing: string
): string {
  const avgDuration = getAverageSceneDuration(duration, sceneCount);

  const pacingGuide = {
    slow: 'Longer scenes (8-10s), detailed and calm',
    medium: 'Balanced scenes (5-8s), clear pacing',
    fast: 'Quick scenes (3-5s), rapid cuts'
  }[pacing] || 'balanced pacing';
  
  return `You are a professional video scene breakdown specialist.

Your task: Break the story into EXACTLY ${sceneCount} scenes for a ${duration}-second video.

SCENE REQUIREMENTS:
- Total scenes: ${sceneCount}
- Total duration: ${duration} seconds
- Average per scene: ~${avgDuration} seconds
- Maximum scene duration: 10 seconds (CRITICAL - never exceed)
- Pacing style: ${pacing} (${pacingGuide})

OUTPUT FOR EACH SCENE:
1. sceneNumber: Sequential number (1, 2, 3...)
2. duration: Scene length in seconds
3. narration: Text shown/spoken in this scene

CRITICAL:
- Durations must sum to EXACTLY ${duration} seconds
- Each scene MUST be 10 seconds or less (maximum 10s per scene)
- First scene: Strong hook to grab attention (3-5s)
- Last scene: Clear conclusion or CTA
- Maintain natural flow and pacing throughout

Return ONLY valid JSON matching the schema.`;
}

export function buildSceneUserPrompt(
  storyText: string,
  duration: number,
  pacing: string
): string {
  return `Break down this story into scenes:

STORY:
${storyText}

REQUIREMENTS:
- Total duration: ${duration} seconds
- Pacing: ${pacing}

Generate the scene breakdown as JSON with:
- sceneNumber
- duration
- narration`;
}

