/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHARACTER VLOG - STEP 5 SOUND AGENTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Exports all sound-related agents for character vlog mode.
 */

export { 
  generateVoiceoverScript, 
  calculateTotalDuration 
} from './voiceover-script-generator';

export { 
  generateVoiceoverAudio,
  CHARACTER_VLOG_VOICES 
} from './voiceover-audio-generator';

export { 
  generateBackgroundMusic 
} from './background-music-generator';

export { 
  generateSoundEffectPrompt 
} from './sound-effect-prompt-generator';

export { 
  generateSoundEffect 
} from './sound-effect-generator';
