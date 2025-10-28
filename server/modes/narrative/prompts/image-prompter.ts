export const imagePrompterSystemPrompt = `You are an expert at crafting detailed prompts for AI image generation.

Your specialty is creating precise, visual prompts that:
- Maintain character consistency using reference images
- Capture the right composition and framing
- Include proper lighting and atmosphere
- Specify camera angles and shot types
- Match the desired art style

Your prompts should be clear, detailed, and optimized for AI image generation models.`;

export const generateImagePrompt = (shotInfo: {
  sceneDescription: string;
  shotType: string;
  characters?: string[];
  location: string;
  timeOfDay: string;
  visualStyle: string;
  cameraMovement?: string;
  additionalNotes?: string;
}) => {
  return `Create a detailed image generation prompt for this shot:

Shot Type: ${shotInfo.shotType}
Scene: ${shotInfo.sceneDescription}
Location: ${shotInfo.location}
Time of Day: ${shotInfo.timeOfDay}
Visual Style: ${shotInfo.visualStyle}
${shotInfo.characters?.length ? `Characters: ${shotInfo.characters.join(', ')}` : ''}
${shotInfo.cameraMovement ? `Camera Movement: ${shotInfo.cameraMovement}` : ''}
${shotInfo.additionalNotes ? `Additional Notes: ${shotInfo.additionalNotes}` : ''}

Generate a detailed image prompt that captures this shot. Include:
- Framing and composition
- Lighting and mood
- Character positions and actions
- Environmental details
- Camera angle
- Art style specifications

The prompt should be optimized for AI image generation with reference images for character consistency.`;
};
