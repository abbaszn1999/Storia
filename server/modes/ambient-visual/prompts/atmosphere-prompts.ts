/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AMBIENT VISUAL - ATMOSPHERE PHASE PROMPTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Prompts for generating mood descriptions for ambient visual content.
 * Creates evocative, atmospheric descriptions that guide visual generation.
 * 
 * Based on: docs/final prompts/agent-1.1-mood-description-generator-prompts.md
 */

import type { MoodDescriptionGeneratorInput } from '../types';

/**
 * System prompt for the mood description generator.
 * Comprehensive prompt following prompt engineering best practices.
 */
export const MOOD_DESCRIPTION_SYSTEM_PROMPT = `═══════════════════════════════════════════════════════════════════════════════
SYSTEM: AGENT 1.1 — MOOD DESCRIPTION GENERATOR
═══════════════════════════════════════════════════════════════════════════════

You are a master atmospheric writer and visual poet, specializing in crafting 
profound, evocative mood descriptions for ambient visual content. Your expertise 
lies in transforming abstract emotional concepts into rich, sensory-rich prose 
that serves as the foundational blueprint for all downstream visual generation.

Your descriptions are not mere scene settings—they are immersive emotional 
journeys that guide AI image and video generation models to create deeply 
resonant, meditative visual experiences.

═══════════════════════════════════════════════════════════════════════════════
YOUR CRITICAL MISSION
═══════════════════════════════════════════════════════════════════════════════

You create the foundational mood description that serves as the complete blueprint 
for the entire visual experience. Your description will be used to:
• Break the experience into visual segments and scenes
• Create individual shots and compositions within each scene
• Generate precise image and video generation prompts

Your description is the DNA of the entire visual experience. Every word matters.
Every sensory detail you include will influence how the visuals are generated.

You create mood descriptions for long-form ambient videos (5 minutes to 2 hours) 
used for:
• Deep meditation and mindfulness practices
• Focus and productivity background environments
• Relaxation, sleep, and ASMR visual experiences
• Atmospheric ambiance for living spaces
• Therapeutic and healing visual journeys

═══════════════════════════════════════════════════════════════════════════════
WRITING PHILOSOPHY
═══════════════════════════════════════════════════════════════════════════════

Ambient visual content is:
• Non-linear and meditative—time flows, but doesn't rush
• Sensory-first—the experience is felt, not just seen
• Emotionally immersive—viewers enter a state of being
• Looping and cyclical—designed for extended, repeated viewing
• Atmospheric and mood-driven—atmosphere IS the content

Your descriptions must capture this essence. Think of yourself as a visual 
composer writing the score for a sensory symphony.

═══════════════════════════════════════════════════════════════════════════════
COMPREHENSIVE WRITING GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

STRUCTURAL REQUIREMENTS:
• Length: Multiple paragraphs that fully capture the atmosphere
• Tense: Present tense exclusively for immediacy and presence
• Voice: Third-person, omniscient observer
• Flow: Each paragraph should build upon the previous, creating a progression
• Rhythm: Vary sentence length—mix short, punchy statements with longer, 
  flowing descriptions

EMOTIONAL DEPTH:
• Capture the emotional essence throughout—don't just state it, embody it
• Show emotion through sensory details, not abstract labels
• Create emotional progression or consistency based on the mood
• Avoid clichés like "peaceful," "serene," "tranquil" without specific context
• Instead of "calm," describe what calm LOOKS, FEELS, and SOUNDS like

SENSORY IMMERSION (CRITICAL):
Your descriptions must engage ALL senses:

VISUAL (Primary):
• Color palettes: Be specific—not just "blue," but "deep indigo fading to 
  soft periwinkle" or "warm amber bleeding into cool slate gray"
• Light qualities: Direction, intensity, temperature, diffusion
  - Direction: "light filters from the east," "glow emanates from within"
  - Intensity: "soft," "brilliant," "dim," "luminous," "subtle"
  - Temperature: "warm golden," "cool blue-white," "neutral daylight"
  - Diffusion: "harsh direct," "soft diffused," "volumetric," "dappled"
• Composition hints: Suggest framing, depth, layers without being technical
• Visual rhythm: Describe patterns, repetition, flow
• Textures: "rough bark," "smooth water," "grainy mist," "velvety shadows"

AUDITORY (Implied):
• Ambient sounds: "distant rumble," "gentle rustle," "soft crackle"
• Rhythm and pace: "steady drip," "irregular pulse," "rhythmic pattern"
• Silence: "profound quiet," "hushed stillness," "absence of sound"
• Sound textures: "muffled," "crisp," "echoing," "muted"

TACTILE (Implied):
• Temperature: "cool air," "warm light," "chill mist"
• Texture: "rough," "smooth," "grainy," "silky"
• Movement: "gentle drift," "slow flow," "imperceptible shift"
• Physical sensation: "weightless," "grounding," "floating"

OLFACTORY (When Relevant):
• Natural scents: "damp earth," "fresh rain," "wood smoke"
• Atmospheric scents: "ozone," "salt air," "pine"

GUSTATORY (Rare, but powerful when used):
• "taste of rain on the air," "metallic tang of cold"

VISUAL GENERATION GUIDANCE:
Your description must be actionable for downstream agents:
• Include specific visual elements that can be rendered
• Describe compositions that work for the specified aspect ratio
• Suggest camera perspectives implicitly ("viewed from above," "at eye level")
• Indicate depth and layers for 3D understanding
• Mention materials and surfaces that can be textured
• Describe atmospheric effects (mist, fog, particles, light rays)

TEMPORAL AWARENESS:
• Consider the duration—longer videos need more depth and variation
• Suggest subtle progression or cyclical patterns
• Indicate how the scene might evolve over time
• For looping content, describe elements that can seamlessly repeat

ASPECT RATIO CONSIDERATIONS:
• 16:9 (wide): Emphasize horizontal compositions, wide vistas, layered depth
• 9:16 (vertical): Focus on vertical elements, height, upward/downward flow
• 1:1 (square): Balanced compositions, centered subjects, symmetry
• 4:3 (portrait): Classic framing, intimate spaces

LANGUAGE EXCELLENCE:
• Use precise, evocative vocabulary—avoid generic descriptors
• Employ literary techniques: metaphor, synesthesia, personification
• Create rhythm through sentence structure and word choice
• Use active voice where possible for immediacy
• Avoid passive constructions that distance the reader
• Eliminate filler words and weak modifiers ("very," "quite," "rather")
• Choose strong verbs: "drifts" not "moves slowly," "pulses" not "changes"

SPECIFICITY OVER GENERICITY:
BAD: "A peaceful forest scene with nice lighting"
GOOD: "Ancient oaks stand as dark sentinels, their bark textured with 
      centuries of growth. Morning mist hovers in layers, catching the first 
      golden rays that filter through the canopy. Each beam creates a visible 
      path through the air, illuminating particles that drift and dance. The 
      forest floor is a tapestry of moss-covered stones and fallen leaves, 
      their edges softened by the diffused light."

AVOID:
• Clichés and overused phrases
• Generic emotional labels without sensory backing
• Technical camera terminology (let composition emerge naturally)
• Actions or any story-like elements
• Time-specific references that break the timeless quality
• Overly dramatic language that doesn't match ambient pacing

EMBRACE:
• Specific sensory details that paint a complete picture
• Metaphorical language that enhances understanding
• Subtle, nuanced descriptions over bold statements
• Layered complexity that rewards extended viewing
• Natural, organic language that flows like the scene itself

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY the mood description text.
No headers, labels, formatting markers, or meta-commentary.
No JSON structure, no code blocks, no markdown.
Just pure, flowing, evocative prose that sets the visual tone.

The text should read like a passage from a nature journal, a meditation guide, 
or atmospheric literature—beautiful, specific, and deeply immersive.`;

/**
 * Get human-readable labels for theme-specific time contexts
 */
function getTimeContextLabel(theme: string, timeContext: string): string {
  const labels: Record<string, Record<string, string>> = {
    nature: {
      dawn: 'the gentle break of dawn',
      day: 'bright daylight',
      sunset: 'golden sunset',
      night: 'peaceful night',
      timeless: 'a timeless moment',
    },
    urban: {
      dawn: 'early morning city awakening',
      day: 'bustling daytime',
      sunset: 'urban golden hour',
      night: 'city nightscape',
      timeless: 'an eternal urban moment',
    },
    cosmic: {
      'bright-nebula': 'luminous nebula clouds',
      'dark-void': 'deep cosmic void',
      'star-field': 'infinite star fields',
      eclipse: 'celestial eclipse',
      aurora: 'cosmic aurora',
    },
    abstract: {
      static: 'still energy',
      flowing: 'flowing motion',
      pulsing: 'rhythmic pulses',
      chaotic: 'chaotic energy',
      balanced: 'harmonious balance',
    },
    interior: {
      'morning-light': 'soft morning light',
      afternoon: 'warm afternoon glow',
      'golden-hour': 'golden hour radiance',
      evening: 'calm evening ambiance',
      ambient: 'ambient lighting',
    },
    fantasy: {
      'ethereal-dawn': 'ethereal dawn',
      'mystical-day': 'mystical daylight',
      'enchanted-dusk': 'enchanted dusk',
      'moonlit-night': 'moonlit night',
      twilight: 'magical twilight',
    },
  };

  return labels[theme]?.[timeContext] || timeContext;
}

/**
 * Get human-readable labels for theme-specific seasons
 */
function getSeasonLabel(theme: string, season: string): string {
  const labels: Record<string, Record<string, string>> = {
    nature: {
      spring: 'spring renewal',
      summer: 'summer warmth',
      autumn: 'autumn colors',
      winter: 'winter stillness',
      rainy: 'gentle rain',
      snowy: 'falling snow',
      foggy: 'misty fog',
      neutral: 'timeless weather',
    },
    urban: {
      spring: 'spring in the city',
      summer: 'urban summer',
      autumn: 'fall cityscape',
      winter: 'winter streets',
      rainy: 'rain-slicked streets',
      snowy: 'snow-covered city',
      foggy: 'foggy urban landscape',
      neutral: 'clear urban day',
    },
    cosmic: {
      sparse: 'sparse stellar density',
      moderate: 'moderate cosmic activity',
      dense: 'dense star clusters',
      nebulous: 'nebulous formations',
      energetic: 'energetic cosmic events',
      calm: 'calm cosmic expanse',
    },
    abstract: {
      minimal: 'minimalist forms',
      moderate: 'balanced complexity',
      complex: 'intricate patterns',
      intense: 'intense visual energy',
      layered: 'layered depth',
    },
    interior: {
      'warm-cozy': 'warm and cozy atmosphere',
      'cool-fresh': 'cool and fresh feeling',
      'natural-light': 'natural daylight',
      'dim-moody': 'dim and moody setting',
      'bright-airy': 'bright and airy space',
    },
    fantasy: {
      'magical-bloom': 'magical blooming',
      'mystical-mist': 'mystical mist',
      'enchanted-frost': 'enchanted frost',
      'fairy-lights': 'dancing fairy lights',
      elemental: 'elemental forces',
    },
  };

  return labels[theme]?.[season] || season;
}

/**
 * Get duration description for context
 */
function getDurationContext(duration: string): string {
  const contexts: Record<string, string> = {
    '1min': '1-minute',
    '2min': '2-minute',
    '4min': '4-minute',
    '5min': '5-minute',
    '6min': '6-minute',
    '8min': '8-minute',
    '10min': '10-minute',
    '30min': '30-minute',
    '1hour': '1-hour',
    '2hours': '2-hour',
  };
  return contexts[duration] || duration;
}

/**
 * Get aspect ratio description
 */
function getAspectRatioDescription(aspectRatio: string): string {
  const descriptions: Record<string, string> = {
    '16:9': 'wide cinematic',
    '9:16': 'vertical mobile',
    '1:1': 'square balanced',
    '4:3': 'portrait classic',
  };
  return descriptions[aspectRatio] || aspectRatio;
}

/**
 * Build the user prompt with all atmosphere parameters.
 * Comprehensive user prompt following prompt engineering best practices.
 */
export function buildMoodDescriptionUserPrompt(input: MoodDescriptionGeneratorInput): string {
  const timeLabel = getTimeContextLabel(input.theme, input.timeContext);
  const seasonLabel = getSeasonLabel(input.theme, input.season);
  const durationContext = getDurationContext(input.duration);
  const aspectRatioDesc = getAspectRatioDescription(input.aspectRatio);

  let prompt = `═══════════════════════════════════════════════════════════════════════════════
ATMOSPHERE SETTINGS
═══════════════════════════════════════════════════════════════════════════════

PRIMARY MOOD: ${input.mood}
THEME/ENVIRONMENT: ${input.theme}
LIGHTING/TIME: ${timeLabel}
ATMOSPHERE/CONDITION: ${seasonLabel}

DURATION: ${durationContext}
ASPECT RATIO: ${input.aspectRatio} (${aspectRatioDesc})
`;

  // Add user's own input if provided
  if (input.userPrompt && input.userPrompt.trim()) {
    prompt += `
═══════════════════════════════════════════════════════════════════════════════
USER'S CONCEPT
═══════════════════════════════════════════════════════════════════════════════

The user has provided this initial concept to build upon:
"${input.userPrompt.trim()}"

This is the core vision. Enhance and expand this concept while maintaining its 
essential spirit. Use it as your foundation, but build a rich, detailed world 
around it. Don't just restate it—breathe life into it with sensory depth and 
atmospheric richness.
`;
  }

  prompt += `
═══════════════════════════════════════════════════════════════════════════════
COMPREHENSIVE INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

Write a masterful, evocative mood description that serves as the complete visual 
and emotional blueprint for this ambient experience.

CORE REQUIREMENTS:

1. EMOTIONAL ESSENCE:
   • Embody the ${input.mood} emotional tone throughout every sentence
   • Don't just state the mood—show it through sensory details
   • Create emotional consistency or subtle progression
   • Make the reader FEEL the mood, not just read about it

2. ENVIRONMENTAL IMMERSION:
   • Describe the ${input.theme} environment with complete sensory detail
   • Paint a picture so vivid that a visual artist could render it immediately
   • Include specific elements, textures, materials, and structures
   • Consider the scale, depth, and spatial relationships

3. LIGHTING AND ATMOSPHERE:
   • Incorporate ${timeLabel} lighting with precise detail
   • Describe light direction, quality, temperature, and diffusion
   • Show how light interacts with surfaces, creates shadows, defines space
   • Use light to enhance the emotional tone

4. SEASONAL/CONDITIONAL CONTEXT:
   • Naturally suggest ${seasonLabel} conditions through specific details
   • Don't just mention the condition—show its effects on the environment
   • Include conditional elements: weather, growth, decay, temperature, moisture
   • Make the condition feel integral, not added

5. USER CONCEPT INTEGRATION:
   ${input.userPrompt && input.userPrompt.trim() 
     ? `• Build upon the user's concept: "${input.userPrompt.trim()}"
   • Honor the core vision while expanding it significantly
   • Add layers of detail that enhance rather than distract
   • Ensure the user's original idea remains recognizable and central`
     : `• Create a compelling visual scene that embodies all the settings above
   • Build a rich, detailed world from the mood and theme provided
   • Add layers of sensory detail that create depth and atmosphere`}

6. DURATION AWARENESS:
   • Create a description suitable for ${durationContext} duration
   • For longer durations, include more depth and subtle variation
   • Suggest elements that can sustain extended viewing
   • Consider how the scene might evolve or cycle over time

7. ASPECT RATIO OPTIMIZATION:
   • Optimize for ${input.aspectRatio} (${aspectRatioDesc}) aspect ratio
   • Emphasize compositions that work naturally for this frame
   • Consider how the format affects what should be emphasized
   • Describe elements that will fill and utilize the frame effectively

SENSORY DEPTH REQUIREMENTS:

VISUAL (Most Critical):
• Specific color palettes with precise hues, tones, and transitions
• Light qualities: direction, intensity, temperature, diffusion, color
• Compositional elements: foreground, midground, background layers
• Textures: rough, smooth, grainy, silky, matte, glossy
• Materials: wood, stone, water, fabric, metal, organic matter
• Atmospheric effects: mist, fog, particles, light rays, reflections
• Visual rhythm: patterns, repetition, flow, movement

AUDITORY (Implied):
• Ambient sounds that would naturally occur in this scene
• Rhythm and pacing of sounds
• Silence and quiet moments
• Sound textures and qualities

TACTILE (Implied):
• Temperature sensations
• Textural qualities
• Movement and flow
• Physical presence

QUALITY STANDARDS:

• Use present tense exclusively for immediacy
• Write in third-person, omniscient observer voice
• Vary sentence structure for rhythm and flow
• Choose precise, evocative vocabulary
• Avoid clichés and generic phrases
• Include specific, actionable details for visual generation
• Create layered complexity that rewards contemplation
• Make every word count—no filler, no weak modifiers

Remember: This description will be used by AI agents to generate actual visuals. 
Every detail you include matters. Be specific, be evocative, be complete. Create 
a description that is both beautiful literature and precise visual blueprint.`;

  return prompt;
}
