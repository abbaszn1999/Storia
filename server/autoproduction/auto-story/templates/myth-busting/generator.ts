/**
 * MYTH-BUSTING TEMPLATE GENERATOR
 * Structure: Common Myth → Why It's Wrong → The Truth → Takeaway
 * Duration: 30-60s
 */

import { generateScript as baseGenerateScript } from '../../agents/script-writer';
import type { StoryGenerationSettings } from '../../types';

export async function generateScript(
  topic: string,
  settings: StoryGenerationSettings
): Promise<string> {
  return await baseGenerateScript(topic, settings);
}
