/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MUSIC GENERATION PROMPTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This module defines music styles and builds powerful prompts for ElevenLabs Music API.
 * Each style is mapped to detailed prompt keywords for high-quality AI music
 * that complements Problem-Solution storytelling.
 * 
 * KEY FEATURES:
 * 1. Professional-grade prompt construction
 * 2. Musical structure guidance (intro → build → climax → resolution)
 * 3. Story-aware context integration
 * 4. Dynamic range specifications
 * 5. Instrument layering details
 * 
 * USAGE:
 * 1. User selects a music style in the UI (e.g., "cinematic")
 * 2. Story narration is passed for context understanding
 * 3. buildMusicPrompt() creates a detailed, story-aware prompt
 * 4. ElevenLabs Music API generates instrumental music
 */

// ═══════════════════════════════════════════════════════════════════════════════
// MUSIC STYLE TYPE
// ═══════════════════════════════════════════════════════════════════════════════

export type MusicStyle = 
  | 'none'
  | 'cinematic'
  | 'upbeat'
  | 'calm'
  | 'corporate'
  | 'electronic'
  | 'emotional'
  | 'inspiring';

// ═══════════════════════════════════════════════════════════════════════════════
// ENHANCED MUSIC STYLE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface MusicStyleConfig {
  id: MusicStyle;
  name: string;
  description: string;
  icon: string;
  // Core sound identity
  coreSound: string;
  // Detailed prompt template
  promptTemplate: string;
  // Instruments with layering
  instruments: {
    primary: string[];
    secondary: string[];
    accents: string[];
  };
  // Musical dynamics
  dynamics: {
    intro: string;      // How to start
    build: string;      // How to develop
    climax: string;     // Peak moment
    resolution: string; // How to end
  };
  // Emotional journey
  emotionalArc: string;
  // Technical specs
  tempo: 'slow' | 'medium' | 'fast';
  bpmRange: [number, number];
  mood: string;
  // Quality markers
  qualityKeywords: string[];
}

export const MUSIC_STYLES: Record<MusicStyle, MusicStyleConfig> = {
  none: {
    id: 'none',
    name: 'No Music',
    description: 'Voice only',
    icon: '🔇',
    coreSound: '',
    promptTemplate: '',
    instruments: { primary: [], secondary: [], accents: [] },
    dynamics: { intro: '', build: '', climax: '', resolution: '' },
    emotionalArc: '',
    tempo: 'medium',
    bpmRange: [0, 0],
    mood: 'none',
    qualityKeywords: [],
  },

  cinematic: {
    id: 'cinematic',
    name: 'Cinematic Epic',
    description: 'Dramatic, powerful',
    icon: '🎬',
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
    icon: '😊',
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
    icon: '😌',
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
    icon: '💼',
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
    icon: '🎸',
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
    icon: '❤️',
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
    icon: '🔥',
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
// CONTENT SANITIZATION FOR ELEVENLABS COMPLIANCE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sanitize text for ElevenLabs Music API to avoid policy violations
 * - Removes non-ASCII characters (non-English text)
 * - Removes potentially problematic content
 * - Keeps only safe, descriptive text
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
// STORY ANALYSIS FOR MUSIC CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyze story narration to extract musical context
 * NOTE: We analyze the narration but don't include raw text in the prompt
 * to avoid policy violations with non-English content
 */
function analyzeStoryForMusic(narration: string): {
  theme: string;
  emotionalJourney: string;
  keyMoments: string;
} {
  const lowerNarration = narration.toLowerCase();
  
  // Detect main theme
  let theme = 'storytelling narrative';
  
  if (lowerNarration.includes('problem') || lowerNarration.includes('struggle') || lowerNarration.includes('challenge')) {
    theme = 'overcoming challenges';
  } else if (lowerNarration.includes('success') || lowerNarration.includes('achieve') || lowerNarration.includes('win')) {
    theme = 'journey to success';
  } else if (lowerNarration.includes('change') || lowerNarration.includes('transform')) {
    theme = 'personal transformation';
  } else if (lowerNarration.includes('learn') || lowerNarration.includes('discover')) {
    theme = 'discovery and learning';
  } else if (lowerNarration.includes('love') || lowerNarration.includes('heart') || lowerNarration.includes('feel')) {
    theme = 'emotional journey';
  }
  
  // Detect emotional journey (Problem-Solution specific)
  const emotionalJourney = 'starting with tension and uncertainty, building through struggle, reaching resolution and hope';
  
  // Key moments for music to emphasize
  const keyMoments = 'problem revelation, emotional low point, solution discovery, triumphant resolution';
  
  return { theme, emotionalJourney, keyMoments };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENHANCED PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build a professional, story-aware music prompt for ElevenLabs Music API
 * 
 * @param style - The selected music style
 * @param options - Additional context for prompt customization
 * @returns Detailed prompt string for AI music generation
 */
export function buildMusicPrompt(
  style: MusicStyle,
  options?: {
    storyTopic?: string;           // Topic of the story
    storyNarration?: string;       // Full story narration for context
    duration?: number;             // Duration in seconds
    additionalKeywords?: string[]; // Extra keywords to include
  }
): string {
  // No music = no prompt
  if (style === 'none') {
    return '';
  }

  const config = MUSIC_STYLES[style];
  if (!config) {
    console.warn(`[music-prompts] Unknown style: ${style}, defaulting to cinematic`);
    return buildMusicPrompt('cinematic', options);
  }

  // Analyze story for context
  const storyContext = options?.storyNarration 
    ? analyzeStoryForMusic(options.storyNarration)
    : null;

  // Build professional prompt
  const promptParts: string[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. CORE IDENTITY
  // ═══════════════════════════════════════════════════════════════════════════
  promptParts.push(config.coreSound);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 2. QUALITY STANDARDS
  // ═══════════════════════════════════════════════════════════════════════════
  promptParts.push(`Professional production quality with ${config.qualityKeywords.slice(0, 2).join(' and ')}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. INSTRUMENTATION
  // ═══════════════════════════════════════════════════════════════════════════
  const instruments = [
    ...config.instruments.primary.slice(0, 2),
    ...config.instruments.secondary.slice(0, 1),
  ].join(', ');
  promptParts.push(`Featuring ${instruments}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. MUSICAL STRUCTURE (Critical for storytelling)
  // ═══════════════════════════════════════════════════════════════════════════
  const structurePart = `Structure: ${config.dynamics.intro} (intro), ${config.dynamics.build} (middle), ${config.dynamics.climax} (peak)`;
  promptParts.push(structurePart);

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. EMOTIONAL ARC
  // ═══════════════════════════════════════════════════════════════════════════
  promptParts.push(`Emotional journey: ${config.emotionalArc}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. STORY CONTEXT (Uses analyzed theme, not raw text for compliance)
  // ═══════════════════════════════════════════════════════════════════════════
  if (storyContext) {
    // Use analyzed theme (safe English keywords only)
    promptParts.push(`Theme: ${storyContext.theme}`);
    promptParts.push(`Supporting narrative moments: ${storyContext.keyMoments}`);
  } else if (options?.storyTopic) {
    // Sanitize topic to remove non-English text and problematic content
    const sanitizedTopic = sanitizeForMusicApi(options.storyTopic);
    if (sanitizedTopic.length > 5) {
      promptParts.push(`Suitable for story about: ${sanitizedTopic}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. TEMPO & TECHNICAL
  // ═══════════════════════════════════════════════════════════════════════════
  const avgBpm = Math.round((config.bpmRange[0] + config.bpmRange[1]) / 2);
  promptParts.push(`${config.tempo} tempo around ${avgBpm} BPM`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. DURATION GUIDANCE
  // ═══════════════════════════════════════════════════════════════════════════
  if (options?.duration) {
    if (options.duration <= 30) {
      promptParts.push('Compact structure with clear arc in short duration');
    } else if (options.duration >= 60 && options.duration < 120) {
      promptParts.push('Well-developed structure with breathing room for each section');
    } else if (options.duration >= 120) {
      promptParts.push('Extended arrangement with natural progression and subtle variations');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. ADDITIONAL KEYWORDS
  // ═══════════════════════════════════════════════════════════════════════════
  if (options?.additionalKeywords && options.additionalKeywords.length > 0) {
    promptParts.push(options.additionalKeywords.join(', '));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. ESSENTIAL REQUIREMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  promptParts.push('Instrumental only, no vocals or lyrics');
  promptParts.push('Clean ending suitable for video');

  // Join with proper formatting
  const prompt = promptParts.join('. ').replace(/\.\./g, '.');

  console.log(`[music-prompts] ═══════════════════════════════════════════════`);
  console.log(`[music-prompts] Built enhanced prompt for style "${style}":`);
  console.log(`[music-prompts] Length: ${prompt.length} characters`);
  console.log(`[music-prompts] Preview: ${prompt.substring(0, 150)}...`);
  if (storyContext) {
    console.log(`[music-prompts] Story theme detected: ${storyContext.theme}`);
  }
  console.log(`[music-prompts] ═══════════════════════════════════════════════`);

  return prompt;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get all available music styles (excluding 'none')
 */
export function getAvailableMusicStyles(): MusicStyleConfig[] {
  return Object.values(MUSIC_STYLES).filter(s => s.id !== 'none');
}

/**
 * Get music style config by ID
 */
export function getMusicStyleConfig(style: MusicStyle): MusicStyleConfig {
  return MUSIC_STYLES[style] || MUSIC_STYLES.cinematic;
}

/**
 * Validate if a string is a valid music style
 */
export function isValidMusicStyle(style: string): style is MusicStyle {
  return style in MUSIC_STYLES;
}

/**
 * Calculate recommended music duration based on video duration
 * Adds a small buffer for crossfade
 */
export function calculateMusicDuration(videoDurationSeconds: number): number {
  // Add 2 seconds buffer for fade in/out
  const withBuffer = videoDurationSeconds + 2;
  
  // Clamp to ElevenLabs limits: 10s - 300s (5 min)
  return Math.max(10, Math.min(300, withBuffer));
}

/**
 * Get style recommendation based on story content
 */
export function recommendMusicStyle(storyNarration: string): MusicStyle {
  const lower = storyNarration.toLowerCase();
  
  // Emotional content
  if (lower.includes('sad') || lower.includes('loss') || lower.includes('cry') || lower.includes('heart')) {
    return 'emotional';
  }
  
  // Success/Achievement content
  if (lower.includes('success') || lower.includes('win') || lower.includes('achieve') || lower.includes('goal')) {
    return 'inspiring';
  }
  
  // Calm/Peaceful content
  if (lower.includes('peace') || lower.includes('calm') || lower.includes('relax') || lower.includes('meditation')) {
    return 'calm';
  }
  
  // Business/Professional content
  if (lower.includes('business') || lower.includes('company') || lower.includes('professional') || lower.includes('work')) {
    return 'corporate';
  }
  
  // Tech/Modern content
  if (lower.includes('tech') || lower.includes('future') || lower.includes('digital') || lower.includes('innovation')) {
    return 'electronic';
  }
  
  // Happy/Fun content
  if (lower.includes('happy') || lower.includes('fun') || lower.includes('joy') || lower.includes('celebrate')) {
    return 'upbeat';
  }
  
  // Default: cinematic works for most storytelling
  return 'cinematic';
}
