/**
 * TEASE-REVEAL TEMPLATE GENERATOR
 * Structure: Hook → Tease → Buildup → Reveal
 * Duration: 15-45s
 */

import { generateScript as baseGenerateScript } from '../../agents/script-writer';
import type { StoryGenerationSettings } from '../../types';

export async function generateScript(
  topic: string,
  settings: StoryGenerationSettings
): Promise<string> {
  return await baseGenerateScript(topic, settings);
}
