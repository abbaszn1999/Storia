/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VISUAL PROMPTER AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates detailed image prompts for each scene.
 * Reuses storyboard enhancement logic from existing stories.
 */

import { callAI } from '../services/ai-helper';
import { 
  buildStoryboardEnhancerSystemPrompt,
  buildStoryboardUserPrompt
} from '../../../stories/problem-solution/prompts/storyboard-prompts';
import type { Scene, StoryGenerationSettings } from '../types';

/**
 * Generate visual prompts for all scenes
 */
export async function generateVisualPrompts(
  scenes: Scene[],
  settings: StoryGenerationSettings
): Promise<Scene[]> {
  console.log('[visual-prompter] Generating visual prompts for', scenes.length, 'scenes');
  
  // Build prompts
  const systemPrompt = buildStoryboardEnhancerSystemPrompt(
    settings.aspectRatio,
    settings.imageStyle as any,
    settings.hasVoiceover,
    settings.language,
    'key-points',
    settings.mediaType === 'animated',
    settings.mediaType === 'animated' ? 'image-to-video' : 'transition'
  );
  
  const scenesForPrompt = scenes.map(s => ({
    sceneNumber: s.sceneNumber,
    duration: s.duration,
    description: s.description,
    narration: s.narration,
  }));
  
  const userPrompt = buildStoryboardUserPrompt(
    scenesForPrompt,
    settings.aspectRatio,
    settings.imageStyle as any,
    settings.hasVoiceover,
    settings.language,
    'key-points',
    settings.mediaType === 'animated',
    settings.mediaType === 'animated' ? 'image-to-video' : 'transition'
  );
  
  // Call AI
  const response = await callAI({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  });
  
  // Parse response
  const result = JSON.parse(response.content);
  const enhancedScenes = result.scenes || [];
  
  console.log('[visual-prompter] ✓ Generated visual prompts');
  
  return enhancedScenes;
}
