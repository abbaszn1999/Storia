// Logo Animation Idea Generator Prompts
// Generates creative visual prompts for logo animations

/**
 * Build system prompt for logo idea generation
 */
export function buildLogoIdeaSystemPrompt(hasReferenceImage?: boolean): string {
  return `
You are an elite logo animation concept generator with 10+ years of experience crafting compelling, dynamic, and brand-focused animation ideas for logos.

═══════════════════════════════════════════════════════════════════════════════
YOUR ROLE & EXPERTISE
═══════════════════════════════════════════════════════════════════════════════
- You understand the psychology of brand animation: impact, memorability, and emotional connection
- You know how to transform simple logo concepts into dynamic, engaging animation descriptions
- You write detailed visual prompts that describe how a logo should move and animate
- Your concepts create memorable brand moments through motion
- You maintain consistency with the user's input language (English only for output)

═══════════════════════════════════════════════════════════════════════════════
PIPELINE CONTEXT
═══════════════════════════════════════════════════════════════════════════════
Your visual prompt will be used directly by VEO 3.1 video generation model to create the logo animation. Your description must be:
- Detailed enough for the AI to understand the motion
- Specific about camera movements, logo transformations, and visual effects
- Focused on the logo itself and how it moves
- Suitable for 4-8 second animations

═══════════════════════════════════════════════════════════════════════════════
CONSTRAINTS & BOUNDARIES
═══════════════════════════════════════════════════════════════════════════════
DO:
- Describe logo motion and transformations in detail
- Include camera movements (zoom, pan, rotate, etc.)
- Mention visual effects (glow, particles, light rays, etc.)
- Describe timing and pacing of the animation
- Include color transitions or lighting changes
- Mention background elements if relevant
- Write in English only (all outputs must be in English)

DO NOT:
- Mention sound or audio
- Include narration or voiceover
- Use technical jargon that the video model won't understand
- Write more than 200-300 words
- Include multiple unrelated concepts
- Use formatting markers or bullet points

═══════════════════════════════════════════════════════════════════════════════
THINKING PROCESS (Chain of Thought)
═══════════════════════════════════════════════════════════════════════════════
When processing an idea, follow this logical sequence:

1. ANALYZE: Identify the core animation concept
   - What type of motion fits this logo?
   - What emotional impact should it have?
   - What brand personality does it convey?

2. EXPAND: Determine animation elements
   - How should the logo enter the frame?
   - What transformations should occur?
   - What camera movements enhance the impact?

3. REFINE: Add visual details
   - Lighting and color effects
   - Background elements
   - Particle effects or glows
   - Timing and pacing

4. VALIDATE: Check before outputting
   - Is it detailed enough for video generation?
   - Does it focus on the logo animation?
   - Is it in English?
   - Is it suitable for 4-8 seconds?

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════
Take the user's simple idea or logo description and create a detailed visual prompt that describes how the logo should animate. Focus on motion, transformations, camera movements, and visual effects.

${hasReferenceImage ? "IMPORTANT: A reference logo image has been provided. You MUST:\n- Analyze the logo's design, colors, shapes, and style\n- Create an animation that showcases THIS specific logo\n- Maintain the logo's visual identity and design integrity\n- Describe how THIS logo moves and transforms\n- Match the animation style to the logo's aesthetic\n" : ""}

The prompt should:
- Be detailed and specific about motion
- Describe camera movements and angles
- Include visual effects and lighting
- Be ready for direct use in video generation
- Be written in English only
- Be 200-300 words maximum
${hasReferenceImage ? "- Accurately represent the provided logo in the animation description" : ""}

═══════════════════════════════════════════════════════════════════════════════
WRITING STYLE
═══════════════════════════════════════════════════════════════════════════════
- Detailed and descriptive (200-300 words)
- Focus on visual motion and effects
- Clear, cinematic language
- Professional animation terminology
- English only
- Natural, flowing description
`;
}

/**
 * Validate and sanitize input parameters
 */
function validateInput(params: {
  idea: string;
  duration: number;
}): { idea: string; duration: number } {
  let { idea, duration } = params;

  // Sanitize idea: trim and validate length
  idea = idea.trim();
  if (!idea || idea.length === 0) {
    throw new Error('Idea cannot be empty');
  }

  // Limit idea length
  const MAX_IDEA_LENGTH = 500;
  if (idea.length > MAX_IDEA_LENGTH) {
    idea = idea.substring(0, MAX_IDEA_LENGTH).trim() + '...';
  }

  // Validate duration: VEO 3.1 supports 4, 6, or 8 seconds
  const VALID_DURATIONS = [4, 6, 8];
  if (!VALID_DURATIONS.includes(duration)) {
    // Round to nearest valid duration
    duration = VALID_DURATIONS.reduce((prev, curr) => 
      Math.abs(curr - duration) < Math.abs(prev - duration) ? curr : prev
    );
  }

  return { idea, duration };
}

/**
 * Build examples for few-shot learning
 */
function buildExamples(): string {
  return `
Example 1 (Simple Logo):
Idea: "Tech company logo"
Output: "A sleek tech company logo materializes from particles of light in the center of the frame. The camera slowly zooms in as the logo forms, with glowing blue and white particles converging to create the geometric shapes. The logo then rotates 360 degrees smoothly while emitting a subtle glow. Soft light rays emanate from behind the logo, creating depth. The background is a dark gradient from deep blue to black. The animation ends with the logo pulsing gently, as if breathing, with a final bright flash that settles into a steady glow."

Example 2 (Brand Logo):
Idea: "Fashion brand logo reveal"
Output: "An elegant fashion brand logo emerges from a cascade of golden particles that flow upward like confetti. The camera starts wide and slowly pushes in, revealing the logo's intricate details. The logo appears to be carved from light, with smooth edges that catch and reflect warm golden light. As it fully forms, the logo performs a graceful rotation, showing its 3D depth. Delicate light rays sweep across the frame from left to right. The background transitions from a soft cream color to a rich gold gradient. The animation concludes with the logo gently floating upward while maintaining its elegant presence."

Example 3 (Creative Logo):
Idea: "Creative agency logo animation"
Output: "A vibrant creative agency logo bursts into view through a kaleidoscope of colorful geometric shapes that fragment and reassemble. The camera orbits around the logo in a smooth circular motion, revealing its dynamic form from multiple angles. The logo's colors transition through a spectrum: starting with deep purple, shifting to electric blue, then to vibrant magenta. Particle effects swirl around the logo, creating a sense of energy and creativity. The background pulses with complementary colors that react to the logo's movements. Light rays shoot outward from the logo's center, creating a starburst effect. The animation ends with the logo locking into place with a satisfying snap, surrounded by a subtle glow."
`;
}

/**
 * Get context guidance based on video duration
 */
function getDurationContext(duration: number): string {
  if (duration === 4) {
    return "Keep the animation concise and impactful. Focus on one main motion sequence.";
  } else if (duration === 6) {
    return "You can include a bit more detail and a secondary motion element.";
  } else {
    return "You can include more complex sequences with multiple motion elements and transitions.";
  }
}

/**
 * Build the user prompt with parameters and examples
 */
export function buildLogoIdeaUserPrompt(params: {
  idea: string;
  duration: number;
  hasReferenceImage?: boolean;
}): string {
  // Validate and sanitize inputs
  const { idea, duration } = validateInput(params);
  const durationContext = getDurationContext(duration);
  const examples = buildExamples();
  const hasReferenceImage = params.hasReferenceImage || false;

  return `
═══════════════════════════════════════════════════════════════════════════════
TASK: Generate Logo Animation Visual Prompt
═══════════════════════════════════════════════════════════════════════════════

INPUT IDEA: "${idea}"
VIDEO DURATION: ${duration} seconds
DURATION GUIDANCE: ${durationContext}
${hasReferenceImage ? "\nREFERENCE IMAGE: A logo reference image has been provided above. Analyze it carefully and create an animation prompt that showcases this specific logo with its design, colors, and style." : ""}

═══════════════════════════════════════════════════════════════════════════════
EXAMPLES
═══════════════════════════════════════════════════════════════════════════════
${examples}

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════
1. ANALYZE the user's idea and determine what type of logo animation would be most effective
2. EXPAND the concept into detailed motion descriptions
3. REFINE by adding camera movements, visual effects, and lighting details
4. VALIDATE that your output is detailed, visual, and ready for video generation

Generate a detailed visual prompt (200-300 words) that describes how the logo should animate. Focus on:
- Logo motion and transformations
- Camera movements and angles
- Visual effects (glow, particles, light rays, etc.)
- Background and lighting
- Timing and pacing

Remember: Output MUST be in English only, regardless of input language.
`;
}