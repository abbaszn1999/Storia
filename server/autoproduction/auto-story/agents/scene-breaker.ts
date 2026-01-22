/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SCENE BREAKER AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Breaks a script into timed scenes with narration.
 * Reuses logic from existing stories/problem-solution prompts.
 */

import { callAI } from '../services/ai-helper';
import { 
  buildSceneBreakdownSystemPrompt,
  buildSceneUserPrompt,
  buildSceneSchema,
  getOptimalSceneCount
} from '../../../stories/problem-solution/prompts/scene-prompts';
import type { Scene, StoryGenerationSettings } from '../types';

/**
 * Break script into scenes
 */
export async function breakIntoScenes(
  script: string,
  settings: StoryGenerationSettings
): Promise<Scene[]> {
  console.log('[scene-breaker] Breaking script into scenes');
  console.log(`[scene-breaker] Duration: ${settings.duration}s`);
  
  // Calculate optimal scene count
  const pacing = 'medium'; // Default to medium pacing
  const sceneCount = getOptimalSceneCount(settings.duration, pacing as any);
  
  console.log(`[scene-breaker] Target scene count: ${sceneCount}`);
  
  // Build prompts
  const systemPrompt = buildSceneBreakdownSystemPrompt(settings.duration, sceneCount, pacing as any);
  const userPrompt = buildSceneUserPrompt(script, settings.duration, pacing as any);
  const schema = buildSceneSchema(sceneCount, settings.duration);
  
  // Call AI with structured output
  const response = await callAI({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_schema', json_schema: { name: 'scenes', schema } } as any,
  });
  
  // Parse response
  const result = JSON.parse(response.content);
  const scenes = result.scenes || [];
  
  console.log(`[scene-breaker] ✓ Generated ${scenes.length} scenes`);
  
  return scenes;
}
