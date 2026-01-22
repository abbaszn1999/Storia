/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * STORY GENERATOR SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Core service for generating complete stories from topics.
 * 
 * Process:
 * 1. Generate script based on template structure
 * 2. Break script into scenes
 * 3. Generate visual prompts for each scene
 * 4. Generate voiceover audio
 * 5. Compose final video
 */

import type { StoryGenerationSettings, StoryGenerationResult, Scene } from '../types';
import { getTemplateStructure } from '../templates/template-structures';

/**
 * Generate a complete story from a topic
 */
export async function generateStory(
  settings: StoryGenerationSettings
): Promise<StoryGenerationResult> {
  try {
    console.log('[story-generator] Starting generation for:', settings.topic);
    
    // Step 1: Generate script based on template
    const script = await generateScript(settings);
    if (!script) {
      return { success: false, error: 'Failed to generate script' };
    }
    
    // Step 2: Break script into scenes
    const scenes = await breakIntoScenes(script, settings);
    if (!scenes || scenes.length === 0) {
      return { success: false, error: 'Failed to break into scenes' };
    }
    
    // Step 3: Generate visual prompts
    const scenesWithPrompts = await generateVisualPrompts(scenes, settings);
    
    // Step 4: Generate voiceover (if enabled)
    let scenesWithAudio = scenesWithPrompts;
    if (settings.hasVoiceover) {
      scenesWithAudio = await generateVoiceover(scenesWithPrompts, settings);
    }
    
    // Step 5: Compose video (this will generate images/videos and combine)
    // TODO: Implement video composition
    
    const result: StoryGenerationResult = {
      success: true,
      story: {
        title: settings.topic,
        script,
        scenes: scenesWithAudio,
        duration: settings.duration,
      },
    };
    
    console.log('[story-generator] Generation completed successfully');
    return result;
    
  } catch (error) {
    console.error('[story-generator] Generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate script based on template structure
 */
async function generateScript(settings: StoryGenerationSettings): Promise<string> {
  const template = getTemplateStructure(settings.template);
  if (!template) {
    throw new Error(`Unknown template: ${settings.template}`);
  }
  
  // Import the template-specific generator
  const templateGenerator = await import(`../templates/${settings.template}/generator`);
  return await templateGenerator.generateScript(settings.topic, settings);
}

/**
 * Break script into scenes
 */
async function breakIntoScenes(script: string, settings: StoryGenerationSettings): Promise<Scene[]> {
  // Import scene-breaker agent
  const { breakIntoScenes: sceneBreaker } = await import('../agents/scene-breaker');
  return await sceneBreaker(script, settings);
}

/**
 * Generate visual prompts for all scenes
 */
async function generateVisualPrompts(scenes: Scene[], settings: StoryGenerationSettings): Promise<Scene[]> {
  // Import visual-prompter agent
  const { generateVisualPrompts: visualPrompter } = await import('../agents/visual-prompter');
  return await visualPrompter(scenes, settings);
}

/**
 * Generate voiceover for all scenes
 */
async function generateVoiceover(scenes: Scene[], settings: StoryGenerationSettings): Promise<Scene[]> {
  // Import narrator agent
  const { generateVoiceover: narrator } = await import('../agents/narrator');
  return await narrator(scenes, settings);
}
