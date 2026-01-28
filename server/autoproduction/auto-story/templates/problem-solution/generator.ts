/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROBLEM-SOLUTION TEMPLATE GENERATOR
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Template Structure: Hook → Problem → Solution → Call-to-Action
 * Duration: 30-60s
 * Optimal Scenes: 4
 */

import { generateScript as baseGenerateScript } from '../../agents/script-writer';
import type { StoryGenerationSettings } from '../../types';

/**
 * Generate script specifically for problem-solution template
 */
export async function generateScript(
  topic: string,
  settings: StoryGenerationSettings
): Promise<string> {
  // For now, use the base script writer
  // In the future, we can add template-specific customizations here
  return await baseGenerateScript(topic, settings);
}
