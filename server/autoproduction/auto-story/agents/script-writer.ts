/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SCRIPT WRITER AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates story scripts based on template structure.
 * Uses template-specific prompts to create engaging narratives.
 */

import { callAI } from '../services/ai-helper';
import { getTemplateStructure } from '../templates/template-structures';
import type { StoryGenerationSettings } from '../types';

/**
 * Generate script for a topic based on template
 */
export async function generateScript(
  topic: string,
  settings: StoryGenerationSettings
): Promise<string> {
  const template = getTemplateStructure(settings.template);
  if (!template) {
    throw new Error(`Unknown template: ${settings.template}`);
  }
  
  console.log(`[script-writer] Generating script for: ${topic}`);
  console.log(`[script-writer] Template: ${template.name}`);
  console.log(`[script-writer] Duration: ${settings.duration}s`);
  console.log(`[script-writer] Language: ${settings.language}`);
  
  // Build system prompt
  const systemPrompt = buildSystemPrompt(template, settings);
  
  // Build user prompt
  const userPrompt = buildUserPrompt(topic, template, settings);
  
  // Call AI
  const response = await callAI({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 1000,
  });
  
  const script = response.content.trim();
  console.log(`[script-writer] ✓ Script generated (${script.length} chars)`);
  
  return script;
}

/**
 * Build system prompt for script generation
 */
function buildSystemPrompt(template: any, settings: StoryGenerationSettings): string {
  const wordsPerSecond = settings.language === 'ar' ? 2.0 : 2.5;
  const targetWords = Math.round(settings.duration * wordsPerSecond);
  
  return `You are an expert scriptwriter specializing in viral short-form content for social media.

You have 10+ years of experience creating scripts that:
- Hook viewers in the first 2 seconds
- Maintain engagement throughout
- Drive shares, saves, and comments
- Follow proven narrative structures

YOUR MISSION:
Generate a ${settings.duration}-second script following the "${template.name}" template structure.

TEMPLATE STRUCTURE:
${template.stages.join(' → ')}

REQUIREMENTS:
- Language: ${settings.language}
- Duration: ${settings.duration} seconds
- Target word count: ${targetWords} words (±10%)
- Aspect ratio: ${settings.aspectRatio}
- Must follow the template structure exactly
- Each stage should be clearly defined
- Script should be engaging and viral-worthy

CRITICAL RULES:
✓ Write in ${settings.language} language
✓ Keep to ~${targetWords} words total
✓ Follow ${template.stages.length}-part structure
✓ Make it conversational and engaging
✓ Strong hook in first 5 seconds
✓ Clear call-to-action at end
✗ Don't exceed word count significantly
✗ Don't skip any template stages
✗ Don't make it too formal or boring

Return ONLY the script text, no formatting, no explanations.`;
}

/**
 * Build user prompt
 */
function buildUserPrompt(topic: string, template: any, settings: StoryGenerationSettings): string {
  return `Generate a ${settings.duration}-second script for this topic:

TOPIC: "${topic}"

Follow the ${template.name} structure:
${template.stages.map((stage: string, i: number) => `${i + 1}. ${stage}`).join('\n')}

Write the complete script now.`;
}
