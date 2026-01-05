/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MUSIC GENERATION PROMPTS - AUTO-ASMR
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This module defines music styles and builds powerful prompts for ElevenLabs Music API.
 * Each style is mapped to detailed prompt keywords for high-quality AI music
 * that complements Auto-ASMR storytelling.
 * 
 * SPECIAL FOCUS: ASMR content benefits from calm, ambient, and peaceful music
 * that enhances relaxation. Music should be minimal, non-intrusive, and support
 * the meditative, sensory experience without overwhelming the visuals or sounds.
 * 
 * PROMPT ENGINEERING BEST PRACTICES:
 * - Structured prompts: Clear sections for identity, quality, instrumentation, structure
 * - Story-aware context: Analyze narration to match emotional arc
 * - Musical dynamics: Intro → Build → Climax → Resolution
 * - Technical specifications: BPM, tempo, duration guidance
 * - Quality markers: Professional production terms
 * 
 * KEY FEATURES:
 * 1. Professional-grade prompt construction with weighted emphasis
 * 2. Musical structure guidance (intro → build → climax → resolution)
 * 3. Advanced story analysis for context-aware music
 * 4. Dynamic range specifications and instrument layering
 * 5. Duration-aware structure recommendations
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
 * Uses advanced pattern matching to understand narrative structure
 * 
 * NOTE: We analyze the narration but don't include raw text in the prompt
 * to avoid policy violations with non-English content
 */
function analyzeStoryForMusic(narration: string): {
  theme: string;
  emotionalJourney: string;
  keyMoments: string;
  intensity: 'low' | 'medium' | 'high';
  pacing: 'slow' | 'moderate' | 'fast';
} {
  if (!narration || narration.trim().length === 0) {
    return {
      theme: 'storytelling narrative',
      emotionalJourney: 'starting with tension and uncertainty, building through struggle, reaching resolution and hope',
      keyMoments: 'problem revelation, emotional low point, solution discovery, triumphant resolution',
      intensity: 'medium',
      pacing: 'moderate',
    };
  }

  const lowerNarration = narration.toLowerCase();
  
  // ═══════════════════════════════════════════════════════════════════════════
  // THEME DETECTION (Enhanced pattern matching)
  // ═══════════════════════════════════════════════════════════════════════════
  let theme = 'storytelling narrative';
  
  // Problem/Challenge themes
  if (lowerNarration.includes('problem') || lowerNarration.includes('struggle') || 
      lowerNarration.includes('challenge') || lowerNarration.includes('difficult') ||
      lowerNarration.includes('obstacle') || lowerNarration.includes('hardship')) {
    theme = 'overcoming challenges';
  }
  // Success/Achievement themes
  else if (lowerNarration.includes('success') || lowerNarration.includes('achieve') || 
           lowerNarration.includes('win') || lowerNarration.includes('victory') ||
           lowerNarration.includes('triumph') || lowerNarration.includes('accomplish')) {
    theme = 'journey to success';
  }
  // Transformation themes
  else if (lowerNarration.includes('change') || lowerNarration.includes('transform') ||
           lowerNarration.includes('evolve') || lowerNarration.includes('growth')) {
    theme = 'personal transformation';
  }
  // Learning/Discovery themes
  else if (lowerNarration.includes('learn') || lowerNarration.includes('discover') ||
           lowerNarration.includes('realize') || lowerNarration.includes('understand') ||
           lowerNarration.includes('insight') || lowerNarration.includes('wisdom')) {
    theme = 'discovery and learning';
  }
  // Emotional themes
  else if (lowerNarration.includes('love') || lowerNarration.includes('heart') || 
           lowerNarration.includes('feel') || lowerNarration.includes('emotion') ||
           lowerNarration.includes('passion') || lowerNarration.includes('connection')) {
    theme = 'emotional journey';
  }
  // Business/Professional themes
  else if (lowerNarration.includes('business') || lowerNarration.includes('professional') ||
           lowerNarration.includes('work') || lowerNarration.includes('career') ||
           lowerNarration.includes('company') || lowerNarration.includes('enterprise')) {
    theme = 'professional achievement';
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // EMOTIONAL JOURNEY DETECTION (Problem-Solution specific)
  // ═══════════════════════════════════════════════════════════════════════════
  let emotionalJourney = 'starting with tension and uncertainty, building through struggle, reaching resolution and hope';
  
  // Detect if story has clear problem-solution structure
  const hasProblem = lowerNarration.includes('problem') || lowerNarration.includes('struggle') || 
                     lowerNarration.includes('challenge') || lowerNarration.includes('difficult');
  const hasSolution = lowerNarration.includes('solution') || lowerNarration.includes('solve') ||
                      lowerNarration.includes('fix') || lowerNarration.includes('resolve');
  const hasSuccess = lowerNarration.includes('success') || lowerNarration.includes('achieve') ||
                     lowerNarration.includes('win') || lowerNarration.includes('triumph');
  
  if (hasProblem && hasSolution && hasSuccess) {
    emotionalJourney = 'tension and uncertainty building through struggle, discovering solution, reaching triumphant resolution';
  } else if (hasProblem && hasSolution) {
    emotionalJourney = 'starting with challenge and tension, building through discovery, reaching hopeful resolution';
  } else if (hasSuccess) {
    emotionalJourney = 'building from humble beginnings to triumphant achievement';
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // KEY MOMENTS DETECTION
  // ═══════════════════════════════════════════════════════════════════════════
  let keyMoments = 'problem revelation, emotional low point, solution discovery, triumphant resolution';
  
  if (hasProblem && hasSolution && hasSuccess) {
    keyMoments = 'problem revelation, emotional struggle, solution discovery, triumphant resolution';
  } else if (hasProblem && hasSolution) {
    keyMoments = 'challenge introduction, emotional tension, solution discovery, hopeful resolution';
  } else if (hasSuccess) {
    keyMoments = 'beginning, steady progress, breakthrough moment, triumphant achievement';
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INTENSITY DETECTION
  // ═══════════════════════════════════════════════════════════════════════════
  let intensity: 'low' | 'medium' | 'high' = 'medium';
  
  const highIntensityWords = ['dramatic', 'powerful', 'intense', 'epic', 'thrilling', 'explosive', 'triumphant'];
  const lowIntensityWords = ['calm', 'peaceful', 'gentle', 'soft', 'quiet', 'serene', 'tranquil'];
  
  const hasHighIntensity = highIntensityWords.some(word => lowerNarration.includes(word));
  const hasLowIntensity = lowIntensityWords.some(word => lowerNarration.includes(word));
  
  if (hasHighIntensity) {
    intensity = 'high';
  } else if (hasLowIntensity) {
    intensity = 'low';
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PACING DETECTION
  // ═══════════════════════════════════════════════════════════════════════════
  let pacing: 'slow' | 'moderate' | 'fast' = 'moderate';
  
  const fastPacingWords = ['quick', 'fast', 'rapid', 'urgent', 'energetic', 'dynamic'];
  const slowPacingWords = ['slow', 'gradual', 'patient', 'calm', 'peaceful', 'meditative'];
  
  const hasFastPacing = fastPacingWords.some(word => lowerNarration.includes(word));
  const hasSlowPacing = slowPacingWords.some(word => lowerNarration.includes(word));
  
  if (hasFastPacing) {
    pacing = 'fast';
  } else if (hasSlowPacing) {
    pacing = 'slow';
  }
  
  return { theme, emotionalJourney, keyMoments, intensity, pacing };
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

  // Build professional prompt with optimized structure
  const promptParts: string[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. CORE IDENTITY (Primary sound description)
  // ═══════════════════════════════════════════════════════════════════════════
  promptParts.push(config.coreSound);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 2. QUALITY STANDARDS (Professional production markers)
  // ═══════════════════════════════════════════════════════════════════════════
  const qualityMarkers = config.qualityKeywords.slice(0, 2).join(' and ');
  promptParts.push(`Professional production quality with ${qualityMarkers}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. INSTRUMENTATION (Layered instrument description)
  // ═══════════════════════════════════════════════════════════════════════════
  const primaryInstruments = config.instruments.primary.slice(0, 2).join(' and ');
  const secondaryInstruments = config.instruments.secondary.slice(0, 1)[0];
  const instrumentDescription = secondaryInstruments 
    ? `Featuring ${primaryInstruments}, with ${secondaryInstruments}`
    : `Featuring ${primaryInstruments}`;
  promptParts.push(instrumentDescription);

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. MUSICAL STRUCTURE (Critical for storytelling - Problem-Solution arc)
  // ═══════════════════════════════════════════════════════════════════════════
  const structureDescription = `Musical structure: ${config.dynamics.intro} (intro), ${config.dynamics.build} (development), ${config.dynamics.climax} (peak moment), ${config.dynamics.resolution} (resolution)`;
  promptParts.push(structureDescription);

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. EMOTIONAL ARC (Story-aware emotional journey)
  // ═══════════════════════════════════════════════════════════════════════════
  // Use story context if available, otherwise use style default
  const emotionalArc = storyContext 
    ? storyContext.emotionalJourney 
    : config.emotionalArc;
  promptParts.push(`Emotional journey: ${emotionalArc}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. STORY CONTEXT (Uses analyzed theme, not raw text for compliance)
  // ═══════════════════════════════════════════════════════════════════════════
  if (storyContext) {
    // Use analyzed theme (safe English keywords only)
    promptParts.push(`Narrative theme: ${storyContext.theme}`);
    promptParts.push(`Key narrative moments to support: ${storyContext.keyMoments}`);
    
    // Add intensity and pacing guidance if detected
    if (storyContext.intensity !== 'medium') {
      promptParts.push(`${storyContext.intensity} intensity throughout`);
    }
    if (storyContext.pacing !== 'moderate') {
      promptParts.push(`${storyContext.pacing} pacing to match narrative rhythm`);
    }
  } else if (options?.storyTopic) {
    // Sanitize topic to remove non-English text and problematic content
    const sanitizedTopic = sanitizeForMusicApi(options.storyTopic);
    if (sanitizedTopic.length > 5) {
      promptParts.push(`Suitable for story about: ${sanitizedTopic}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. TEMPO & TECHNICAL SPECIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  const avgBpm = Math.round((config.bpmRange[0] + config.bpmRange[1]) / 2);
  const bpmRange = `${config.bpmRange[0]}-${config.bpmRange[1]}`;
  promptParts.push(`${config.tempo} tempo, ${avgBpm} BPM (range: ${bpmRange} BPM)`);
  promptParts.push(`Mood: ${config.mood}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. DURATION-AWARE STRUCTURE GUIDANCE
  // ═══════════════════════════════════════════════════════════════════════════
  if (options?.duration) {
    if (options.duration <= 30) {
      promptParts.push('Compact structure with clear emotional arc in short duration, efficient transitions between sections');
    } else if (options.duration > 30 && options.duration < 60) {
      promptParts.push('Well-paced structure with balanced sections, smooth transitions');
    } else if (options.duration >= 60 && options.duration < 120) {
      promptParts.push('Well-developed structure with breathing room for each section, natural progression');
    } else if (options.duration >= 120) {
      promptParts.push('Extended arrangement with natural progression, subtle variations, and dynamic ebb and flow');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. ADDITIONAL KEYWORDS (User-specified enhancements)
  // ═══════════════════════════════════════════════════════════════════════════
  if (options?.additionalKeywords && options.additionalKeywords.length > 0) {
    const additionalText = options.additionalKeywords.join(', ');
    promptParts.push(`Additional characteristics: ${additionalText}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. ESSENTIAL REQUIREMENTS (API compliance)
  // ═══════════════════════════════════════════════════════════════════════════
  promptParts.push('Instrumental only, no vocals or lyrics');
  promptParts.push('Clean ending suitable for video editing, smooth fade-out');

  // ═══════════════════════════════════════════════════════════════════════════
  // FINAL PROMPT ASSEMBLY
  // ═══════════════════════════════════════════════════════════════════════════
  // Join with proper formatting (period + space, clean up double periods)
  let prompt = promptParts.join('. ').replace(/\.\.+/g, '.').trim();
  
  // Ensure prompt ends with a period
  if (!prompt.endsWith('.')) {
    prompt += '.';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGGING (Enhanced debugging information)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`[music-prompts] ═══════════════════════════════════════════════`);
  console.log(`[music-prompts] Built enhanced prompt for style "${style}":`);
  console.log(`[music-prompts] Length: ${prompt.length} characters`);
  console.log(`[music-prompts] Parts: ${promptParts.length} sections`);
  console.log(`[music-prompts] Preview: ${prompt.substring(0, 200)}...`);
  if (storyContext) {
    console.log(`[music-prompts] Story analysis:`);
    console.log(`[music-prompts]   Theme: ${storyContext.theme}`);
    console.log(`[music-prompts]   Intensity: ${storyContext.intensity}`);
    console.log(`[music-prompts]   Pacing: ${storyContext.pacing}`);
    console.log(`[music-prompts]   Key moments: ${storyContext.keyMoments}`);
  }
  if (options?.duration) {
    console.log(`[music-prompts] Duration: ${options.duration}s`);
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
 * Uses enhanced pattern matching for better accuracy
 */
export function recommendMusicStyle(storyNarration: string): MusicStyle {
  if (!storyNarration || storyNarration.trim().length === 0) {
    return 'cinematic'; // Default for empty narration
  }

  const lower = storyNarration.toLowerCase();
  
  // ═══════════════════════════════════════════════════════════════════════════
  // EMOTIONAL CONTENT (High priority - check first)
  // ═══════════════════════════════════════════════════════════════════════════
  const emotionalKeywords = ['sad', 'loss', 'cry', 'heart', 'pain', 'grief', 'sorrow', 'tears', 'lonely'];
  if (emotionalKeywords.some(keyword => lower.includes(keyword))) {
    return 'emotional';
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SUCCESS/ACHIEVEMENT CONTENT
  // ═══════════════════════════════════════════════════════════════════════════
  const successKeywords = ['success', 'win', 'achieve', 'goal', 'victory', 'triumph', 'accomplish', 'breakthrough', 'milestone'];
  if (successKeywords.some(keyword => lower.includes(keyword))) {
    return 'inspiring';
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CALM/PEACEFUL CONTENT
  // ═══════════════════════════════════════════════════════════════════════════
  const calmKeywords = ['peace', 'calm', 'relax', 'meditation', 'serene', 'tranquil', 'zen', 'mindful', 'quiet'];
  if (calmKeywords.some(keyword => lower.includes(keyword))) {
    return 'calm';
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BUSINESS/PROFESSIONAL CONTENT
  // ═══════════════════════════════════════════════════════════════════════════
  const businessKeywords = ['business', 'company', 'professional', 'work', 'corporate', 'enterprise', 'office', 'career', 'executive'];
  if (businessKeywords.some(keyword => lower.includes(keyword))) {
    return 'corporate';
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TECH/MODERN CONTENT
  // ═══════════════════════════════════════════════════════════════════════════
  const techKeywords = ['tech', 'future', 'digital', 'innovation', 'technology', 'ai', 'software', 'startup', 'modern'];
  if (techKeywords.some(keyword => lower.includes(keyword))) {
    return 'electronic';
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HAPPY/FUN CONTENT
  // ═══════════════════════════════════════════════════════════════════════════
  const happyKeywords = ['happy', 'fun', 'joy', 'celebrate', 'excited', 'cheerful', 'laugh', 'smile', 'positive'];
  if (happyKeywords.some(keyword => lower.includes(keyword))) {
    return 'upbeat';
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DRAMATIC/EPIC CONTENT (Check for cinematic keywords)
  // ═══════════════════════════════════════════════════════════════════════════
  const dramaticKeywords = ['dramatic', 'epic', 'powerful', 'intense', 'thrilling', 'adventure', 'journey', 'quest'];
  if (dramaticKeywords.some(keyword => lower.includes(keyword))) {
    return 'cinematic';
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DEFAULT: Cinematic works for most storytelling
  // ═══════════════════════════════════════════════════════════════════════════
  return 'cinematic';
}
