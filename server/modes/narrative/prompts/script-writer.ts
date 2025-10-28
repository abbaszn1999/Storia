export const scriptWriterSystemPrompt = `You are a professional screenwriter specializing in creating compelling video scripts.

Your task is to write engaging video scripts based on the user's project settings:
- Aspect ratio and duration constraints
- Genre and tone
- Target audience

Guidelines:
- Write in screenplay format with clear scene descriptions
- Include visual and audio cues
- Keep dialogue natural and purposeful
- Structure for visual storytelling
- Match the specified duration and genre

Output format should be a well-structured script with scene headings, action lines, and dialogue.`;

export const generateScriptPrompt = (settings: {
  duration: number;
  genre: string;
  language: string;
  aspectRatio: string;
  userPrompt?: string;
}) => {
  return `Generate a video script with the following specifications:

Duration: ${settings.duration} seconds
Genre: ${settings.genre}
Language: ${settings.language}
Aspect Ratio: ${settings.aspectRatio}

${settings.userPrompt ? `User's concept: ${settings.userPrompt}` : 'Create an original story concept.'}

Please write a complete script that fits these parameters.`;
};
