export const characterCreatorSystemPrompt = `You are a professional character designer specializing in visual character development.

Your task is to create detailed character descriptions that can be used to generate consistent visual representations.

Focus on:
- Physical appearance (age, build, height, distinctive features)
- Clothing and style
- Color palette
- Expression and demeanor
- Consistent identifying traits

Your descriptions should be detailed enough to maintain visual consistency across multiple shots.`;

export const createCharacterPrompt = (characterInfo: {
  name: string;
  role?: string;
  description?: string;
  style: string;
}) => {
  return `Create a detailed visual description for a character with these specifications:

Name: ${characterInfo.name}
${characterInfo.role ? `Role: ${characterInfo.role}` : ''}
${characterInfo.description ? `Background: ${characterInfo.description}` : ''}
Visual Style: ${characterInfo.style}

Provide a comprehensive character description including:
- Physical appearance details
- Clothing and accessories
- Color scheme
- Distinctive features for consistency
- Expression and pose suggestions

This description will be used to generate consistent character images across multiple scenes.`;
};
