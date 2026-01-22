/**
 * BEFORE-AFTER TEMPLATE GENERATOR
 * Structure: Before State → Transformation → After State → Results
 * Duration: 30-90s
 */

import { generateScript as baseGenerateScript } from '../../agents/script-writer';
import type { StoryGenerationSettings } from '../../types';

export async function generateScript(
  topic: string,
  settings: StoryGenerationSettings
): Promise<string> {
  return await baseGenerateScript(topic, settings);
}
