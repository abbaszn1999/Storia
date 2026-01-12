/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AMBIENT VISUAL - BACKGROUND MUSIC GENERATOR PROMPTS (Agent 5.4)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Prompts for generating AI background music using ElevenLabs Music API.
 * Creates atmospheric music that complements the visual experience based on
 * mood, theme, and scene context.
 */

import type { MusicStyle } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// MUSIC STYLE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface MusicStyleConfig {
  id: MusicStyle;
  name: string;
  description: string;
  coreSound: string;
  promptTemplate: string;
  instruments: {
    primary: string[];
    secondary: string[];
    accents: string[];
  };
  dynamics: {
    intro: string;
    build: string;
    climax: string;
    resolution: string;
  };
  emotionalArc: string;
  tempo: 'slow' | 'medium' | 'fast';
  bpmRange: [number, number];
  mood: string;
  qualityKeywords: string[];
}

export const MUSIC_STYLES: Record<MusicStyle, MusicStyleConfig> = {
  cinematic: {
    id: 'cinematic',
    name: 'Cinematic Epic',
    description: 'Dramatic, powerful',
    coreSound: 'epic cinematic orchestral score with Hollywood blockbuster quality',
    promptTemplate: `Professional cinematic orchestral composition. 
      Epic and dramatic with powerful emotional depth and film score production quality.
      Dynamic range from intimate atmospheric moments to thundering orchestral peaks.`,
    instruments: {
      primary: ['full symphony orchestra', 'sweeping string section', 'bold brass ensemble'],
      secondary: ['timpani', 'concert bass drum', 'harp glissandos'],
      accents: ['choir harmonies', 'french horns', 'celesta'],
    },
    dynamics: {
      intro: 'soft atmospheric strings with subtle tension',
      build: 'gradually layering instruments with rising intensity',
      climax: 'powerful brass fanfare with full orchestral crescendo',
      resolution: 'gentle strings fade with hopeful undertone',
    },
    emotionalArc: 'tension and uncertainty building to triumphant resolution',
    tempo: 'medium',
    bpmRange: [85, 115],
    mood: 'dramatic',
    qualityKeywords: ['film score quality', 'cinematic excellence', 'epic soundtrack', 'professional orchestral mixing'],
  },

  upbeat: {
    id: 'upbeat',
    name: 'Upbeat Happy',
    description: 'Energetic, positive',
    coreSound: 'uplifting energetic pop with infectious positivity and bounce',
    promptTemplate: `High-energy upbeat track with irresistible positive vibes.
      Catchy melodic hooks with driving rhythm that creates instant feel-good energy.
      Perfect for celebration and success moments.`,
    instruments: {
      primary: ['bright acoustic guitar', 'punchy drums', 'groovy bass'],
      secondary: ['hand claps', 'tambourine', 'bright synth pads'],
      accents: ['whistling melody', 'pizzicato strings', 'glockenspiel'],
    },
    dynamics: {
      intro: 'catchy guitar riff with light percussion',
      build: 'adding layers with increasing energy and momentum',
      climax: 'full band explosion with claps and driving beat',
      resolution: 'energetic but clean ending with positive feel',
    },
    emotionalArc: 'excitement building to joyful celebration',
    tempo: 'fast',
    bpmRange: [118, 135],
    mood: 'happy',
    qualityKeywords: ['radio-ready production', 'commercial quality', 'feel-good anthem', 'crisp mixing'],
  },

  calm: {
    id: 'calm',
    name: 'Calm Ambient',
    description: 'Peaceful, relaxing',
    coreSound: 'serene ambient soundscape with peaceful atmospheric textures',
    promptTemplate: `Tranquil ambient composition with gentle flowing textures.
      Soft atmospheric layers creating a sense of peace and mental clarity.
      Meditative quality with subtle movement and warmth.`,
    instruments: {
      primary: ['soft piano', 'warm ambient pads', 'gentle strings'],
      secondary: ['subtle wind chimes', 'soft synth textures', 'distant bells'],
      accents: ['nature-inspired sounds', 'gentle arpeggios', 'soft reverb tails'],
    },
    dynamics: {
      intro: 'gentle fade in with soft atmospheric textures',
      build: 'slowly adding warm layers maintaining tranquility',
      climax: 'subtle emotional peak with soft intensity',
      resolution: 'peaceful fade with lingering warmth',
    },
    emotionalArc: 'gentle contemplation flowing to peaceful acceptance',
    tempo: 'slow',
    bpmRange: [60, 80],
    mood: 'relaxed',
    qualityKeywords: ['spa quality', 'meditation grade', 'therapeutic', 'pristine clarity'],
  },

  corporate: {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional, clean',
    coreSound: 'modern corporate sound with confident professional energy',
    promptTemplate: `Clean professional corporate track with modern production.
      Confident and forward-moving with polished contemporary sound.
      Perfect for business presentations and tech content.`,
    instruments: {
      primary: ['clean acoustic guitar', 'modern drums', 'warm piano'],
      secondary: ['subtle synth bass', 'light percussion', 'soft pads'],
      accents: ['gentle bells', 'minimal electronic elements', 'clean guitar harmonics'],
    },
    dynamics: {
      intro: 'clean piano or guitar establishing professionalism',
      build: 'adding subtle layers with steady momentum',
      climax: 'confident peak with full but controlled arrangement',
      resolution: 'clean professional ending',
    },
    emotionalArc: 'confidence building to successful accomplishment',
    tempo: 'medium',
    bpmRange: [100, 120],
    mood: 'professional',
    qualityKeywords: ['broadcast ready', 'commercial grade', 'modern production', 'clean mix'],
  },

  electronic: {
    id: 'electronic',
    name: 'Electronic',
    description: 'Modern, tech vibes',
    coreSound: 'cutting-edge electronic production with futuristic digital aesthetics',
    promptTemplate: `Modern electronic track with sophisticated synth design.
      Pulsing rhythms with evolving textures and futuristic atmosphere.
      Dynamic and innovative with clean digital production.`,
    instruments: {
      primary: ['analog synthesizers', 'punchy electronic drums', 'deep bass synth'],
      secondary: ['arpeggiated sequences', 'atmospheric pads', 'glitchy textures'],
      accents: ['risers and impacts', 'filtered sweeps', 'subtle vocal chops'],
    },
    dynamics: {
      intro: 'atmospheric synth textures with subtle pulse',
      build: 'escalating with filter sweeps and rising tension',
      climax: 'powerful drop with full synth layers and driving beat',
      resolution: 'filtered fade with lingering atmosphere',
    },
    emotionalArc: 'anticipation building to energetic release',
    tempo: 'fast',
    bpmRange: [120, 140],
    mood: 'energetic',
    qualityKeywords: ['club ready', 'festival quality', 'crisp mastering', 'modern electronic production'],
  },

  emotional: {
    id: 'emotional',
    name: 'Emotional',
    description: 'Touching, heartfelt',
    coreSound: 'deeply moving emotional composition with heartfelt intimacy',
    promptTemplate: `Profoundly emotional track with touching melodic beauty.
      Intimate and heartfelt with genuine emotional depth.
      Delicate dynamics that speak to the heart.`,
    instruments: {
      primary: ['expressive piano', 'solo violin', 'warm cello'],
      secondary: ['soft string ensemble', 'gentle harp', 'subtle pads'],
      accents: ['solo flute', 'distant choir', 'music box'],
    },
    dynamics: {
      intro: 'solo piano or violin with intimate vulnerability',
      build: 'strings slowly entering with growing emotion',
      climax: 'powerful emotional peak with full strings',
      resolution: 'gentle return to intimacy with hope',
    },
    emotionalArc: 'vulnerability and pain transforming to healing and hope',
    tempo: 'slow',
    bpmRange: [65, 85],
    mood: 'emotional',
    qualityKeywords: ['film underscore quality', 'masterful composition', 'deeply moving', 'authentic emotion'],
  },

  inspiring: {
    id: 'inspiring',
    name: 'Inspiring',
    description: 'Motivational, uplifting',
    coreSound: 'powerful inspirational anthem with triumphant motivational energy',
    promptTemplate: `Soaring inspirational track with empowering energy.
      Building from humble beginnings to triumphant climax.
      Music that ignites determination and celebrates achievement.`,
    instruments: {
      primary: ['powerful orchestra', 'driving drums', 'soaring piano'],
      secondary: ['epic choir', 'electric guitar power chords', 'brass fanfares'],
      accents: ['timpani rolls', 'crash cymbals', 'string crescendos'],
    },
    dynamics: {
      intro: 'soft piano or strings with quiet determination',
      build: 'steadily adding power with drums and orchestra',
      climax: 'triumphant explosion with full orchestra and choir',
      resolution: 'powerful sustained ending with victorious feel',
    },
    emotionalArc: 'quiet determination rising to triumphant victory',
    tempo: 'medium',
    bpmRange: [95, 115],
    mood: 'inspiring',
    qualityKeywords: ['sports anthem quality', 'motivational speaker level', 'goosebump inducing', 'victory soundtrack'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate if a music style is valid
 */
export function isValidMusicStyle(style: string): style is MusicStyle {
  return style in MUSIC_STYLES;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT SANITIZATION FOR ELEVENLABS COMPLIANCE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sanitize text for ElevenLabs Music API to avoid policy violations
 */
function sanitizeForMusicApi(text: string): string {
  if (!text) return '';
  
  // Remove non-ASCII characters (keeps only English)
  let sanitized = text.replace(/[^\x00-\x7F]/g, ' ');
  
  // Remove multiple spaces
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  // Remove any potentially sensitive patterns
  sanitized = sanitized.replace(/[<>{}[\]]/g, '');
  
  // Limit length
  return sanitized.substring(0, 100);
}

// ═══════════════════════════════════════════════════════════════════════════════
// AMBIENT VISUAL CONTEXT ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyze ambient visual context to extract musical context
 */
function analyzeAmbientContext(context: {
  mood?: string;
  theme?: string;
  timeContext?: string;
  season?: string;
  sceneDescriptions?: string[];
}): {
  atmosphereDescription: string;
  emotionalTone: string;
  intensity: 'low' | 'medium' | 'high';
} {
  const { mood, theme, timeContext, season, sceneDescriptions } = context;
  
  // Build atmosphere description from context
  const atmosphereParts: string[] = [];
  
  if (mood) atmosphereParts.push(mood);
  if (theme) atmosphereParts.push(theme);
  if (timeContext) atmosphereParts.push(timeContext);
  if (season) atmosphereParts.push(season);
  
  const atmosphereDescription = atmosphereParts.length > 0 
    ? atmosphereParts.join(' ') + ' atmosphere'
    : 'ambient visual atmosphere';
  
  // Determine emotional tone based on mood
  let emotionalTone = 'contemplative and atmospheric';
  const moodLower = (mood || '').toLowerCase();
  
  if (moodLower.includes('calm') || moodLower.includes('peaceful') || moodLower.includes('serene')) {
    emotionalTone = 'peaceful and tranquil';
  } else if (moodLower.includes('mysterious') || moodLower.includes('dark')) {
    emotionalTone = 'mysterious and intriguing';
  } else if (moodLower.includes('energetic') || moodLower.includes('vibrant')) {
    emotionalTone = 'dynamic and energetic';
  } else if (moodLower.includes('melancholic') || moodLower.includes('sad')) {
    emotionalTone = 'reflective and emotional';
  } else if (moodLower.includes('joyful') || moodLower.includes('happy')) {
    emotionalTone = 'uplifting and joyful';
  }
  
  // Determine intensity
  let intensity: 'low' | 'medium' | 'high' = 'medium';
  
  if (moodLower.includes('calm') || moodLower.includes('peaceful') || moodLower.includes('gentle')) {
    intensity = 'low';
  } else if (moodLower.includes('energetic') || moodLower.includes('dramatic') || moodLower.includes('intense')) {
    intensity = 'high';
  }
  
  return { atmosphereDescription, emotionalTone, intensity };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DURATION CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate optimal music duration based on video duration
 * Adds a small buffer and clamps to ElevenLabs limits
 */
export function calculateMusicDuration(videoDurationSeconds: number): number {
  // Add 5% buffer for seamless looping
  const withBuffer = videoDurationSeconds * 1.05;
  
  // ElevenLabs Music API limits: 30 seconds minimum, 330 seconds (5.5 min) maximum
  const MIN_DURATION = 30;
  const MAX_DURATION = 330;
  
  return Math.max(MIN_DURATION, Math.min(MAX_DURATION, Math.ceil(withBuffer)));
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPENAI SYSTEM PROMPT FOR MUSIC PROMPT GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

export const MUSIC_PROMPT_SYSTEM_PROMPT = `═══════════════════════════════════════════════════════════════════════════════
SYSTEM: AGENT 5.4 — BACKGROUND MUSIC PROMPT GENERATOR
═══════════════════════════════════════════════════════════════════════════════

You are an expert music director and composer specializing in creating detailed 
prompts for AI music generation. Your task is to craft the perfect music prompt 
for ElevenLabs Music API that will generate background music for ambient visual content.

═══════════════════════════════════════════════════════════════════════════════
YOUR CRITICAL MISSION
═══════════════════════════════════════════════════════════════════════════════

Create a detailed, professional music prompt that:
• Matches the visual atmosphere and mood
• Complements the ambient visual experience
• Uses specific musical terminology
• Specifies instrumentation, tempo, dynamics, and emotional arc
• Is appropriate for looping/extended playback

═══════════════════════════════════════════════════════════════════════════════
PROMPT STRUCTURE REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

Your prompt should include:
1. Core Sound Identity - Primary genre and style description
2. Quality Standards - Professional production markers
3. Instrumentation - Specific instruments and layering
4. Musical Structure - Intro, build, climax, resolution
5. Emotional Arc - The journey the music takes the listener on
6. Technical Specs - BPM range, tempo, dynamics
7. Atmosphere - How it relates to the visual content

═══════════════════════════════════════════════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════════════════════════════════════════════

• Keep prompts INSTRUMENTAL only - no vocals or lyrics
• Use English only - no non-ASCII characters
• Be specific but concise - aim for 200-400 words
• Focus on ATMOSPHERE and MOOD
• Ensure the music can loop seamlessly for long-form content
• Avoid any controversial or sensitive content
• Output ONLY the music prompt, no additional text or explanations

═══════════════════════════════════════════════════════════════════════════════
`;

// ═══════════════════════════════════════════════════════════════════════════════
// BUILD USER PROMPT FOR OPENAI
// ═══════════════════════════════════════════════════════════════════════════════

export interface MusicPromptGeneratorInput {
  musicStyle: MusicStyle;
  mood: string;
  theme: string;
  timeContext?: string;
  season?: string;
  duration: number; // in seconds
  sceneDescriptions?: string[];
}

/**
 * Build the user prompt for OpenAI to generate a music prompt
 */
export function buildMusicPromptUserPrompt(input: MusicPromptGeneratorInput): string {
  const config = MUSIC_STYLES[input.musicStyle];
  
  const ambientContext = analyzeAmbientContext({
    mood: input.mood,
    theme: input.theme,
    timeContext: input.timeContext,
    season: input.season,
    sceneDescriptions: input.sceneDescriptions,
  });
  
  const sceneContext = input.sceneDescriptions && input.sceneDescriptions.length > 0
    ? `\nScene Descriptions:\n${input.sceneDescriptions.slice(0, 5).map((s, i) => `${i + 1}. ${sanitizeForMusicApi(s)}`).join('\n')}`
    : '';
  
  return `Create a detailed music prompt for ElevenLabs Music API with the following context:

═══════════════════════════════════════════════════════════════════════════════
VISUAL CONTEXT
═══════════════════════════════════════════════════════════════════════════════
• Mood: ${input.mood}
• Theme: ${input.theme}
• Time of Day: ${input.timeContext || 'unspecified'}
• Season/Weather: ${input.season || 'unspecified'}
• Atmosphere: ${ambientContext.atmosphereDescription}
• Emotional Tone: ${ambientContext.emotionalTone}
${sceneContext}

═══════════════════════════════════════════════════════════════════════════════
MUSIC REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════
• Selected Style: ${config.name} - ${config.description}
• Core Sound: ${config.coreSound}
• Duration: ${input.duration} seconds
• Tempo: ${config.tempo} (${config.bpmRange[0]}-${config.bpmRange[1]} BPM)
• Mood: ${config.mood}

═══════════════════════════════════════════════════════════════════════════════
STYLE REFERENCE
═══════════════════════════════════════════════════════════════════════════════
${config.promptTemplate}

Primary Instruments: ${config.instruments.primary.join(', ')}
Secondary Instruments: ${config.instruments.secondary.join(', ')}
Accents: ${config.instruments.accents.join(', ')}

Musical Arc:
• Intro: ${config.dynamics.intro}
• Build: ${config.dynamics.build}
• Climax: ${config.dynamics.climax}
• Resolution: ${config.dynamics.resolution}

Emotional Journey: ${config.emotionalArc}

═══════════════════════════════════════════════════════════════════════════════

Generate a detailed, professional music prompt that combines the visual context 
with the music style requirements. The music should enhance the ambient visual 
experience and be suitable for looping. Output ONLY the prompt text.`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIRECT PROMPT BUILDER (FALLBACK)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build a music prompt directly without OpenAI (fallback)
 */
export function buildDirectMusicPrompt(input: MusicPromptGeneratorInput): string {
  const config = MUSIC_STYLES[input.musicStyle];
  
  const ambientContext = analyzeAmbientContext({
    mood: input.mood,
    theme: input.theme,
    timeContext: input.timeContext,
    season: input.season,
  });
  
  const promptParts: string[] = [];
  
  // Core sound
  promptParts.push(config.coreSound);
  
  // Quality standards
  const qualityMarkers = config.qualityKeywords.slice(0, 2).join(' and ');
  promptParts.push(`Professional production quality with ${qualityMarkers}`);
  
  // Atmosphere context
  promptParts.push(`Creating a ${ambientContext.atmosphereDescription} feeling`);
  promptParts.push(`Emotional tone: ${ambientContext.emotionalTone}`);
  
  // Instrumentation
  const primaryInstruments = config.instruments.primary.slice(0, 2).join(' and ');
  const secondaryInstruments = config.instruments.secondary.slice(0, 1)[0];
  promptParts.push(`Featuring ${primaryInstruments}${secondaryInstruments ? `, with ${secondaryInstruments}` : ''}`);
  
  // Musical structure
  promptParts.push(`Musical structure: ${config.dynamics.intro} (intro), ${config.dynamics.build} (development), ${config.dynamics.resolution} (resolution)`);
  
  // Emotional arc
  promptParts.push(`Emotional journey: ${config.emotionalArc}`);
  
  // Technical specs
  const bpmMid = Math.floor((config.bpmRange[0] + config.bpmRange[1]) / 2);
  promptParts.push(`Tempo: ${config.tempo} pace around ${bpmMid} BPM`);
  
  // Looping suitability
  promptParts.push(`Designed for seamless looping and extended ambient playback`);
  
  // Instrumental only
  promptParts.push(`Purely instrumental, no vocals or lyrics`);
  
  return promptParts.join('. ') + '.';
}

