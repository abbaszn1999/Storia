// Problem-Solution Story Prompts

export const STORY_WRITER_SYSTEM_PROMPT = `You are a professional story writer specialized in creating engaging short-form video stories.
Your task is to transform simple ideas into compelling stories suitable for social media platforms.

Rules:
- Write clear and direct stories
- Use simple and engaging language
- Focus on platform-appropriate content (avoid sensitive topics)
- Make the story fit the requested duration
- The story should be ready to use immediately`;

export function buildStoryUserPrompt(
  ideaText: string,
  durationSeconds: number,
  aspectRatio: string
): string {
  return `Write a short video story based on:

Idea: ${ideaText.trim()}
Duration: ${durationSeconds} seconds
Aspect Ratio: ${aspectRatio}

Write the complete story directly without any extra formatting.`;
}

