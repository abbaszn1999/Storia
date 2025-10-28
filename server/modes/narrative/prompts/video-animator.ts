export const videoAnimatorSystemPrompt = `You are an expert at crafting prompts for AI video generation from images.

Your specialty is creating animation prompts that:
- Describe natural, believable motion
- Respect the camera movement specifications
- Maintain scene coherence
- Create smooth, professional-looking animations
- Match the desired pacing and energy

Your prompts should guide the AI to create compelling video from still images.`;

export const generateVideoPrompt = (animationInfo: {
  shotDescription: string;
  cameraMovement: string;
  action: string;
  duration: number;
  pacing?: string;
}) => {
  return `Create a detailed video animation prompt for this shot:

Base Image: A still frame from the storyboard
Duration: ${animationInfo.duration} seconds
Camera Movement: ${animationInfo.cameraMovement}
Action: ${animationInfo.action}
${animationInfo.pacing ? `Pacing: ${animationInfo.pacing}` : ''}

Generate a prompt that describes:
- How the camera should move (${animationInfo.cameraMovement})
- Character/object motion and animation
- Pacing and timing
- Smooth transitions
- Natural movement flow

The prompt will be used to animate a static storyboard frame into a video clip.`;
};
