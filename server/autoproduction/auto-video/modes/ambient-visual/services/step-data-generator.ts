/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * STEP DATA GENERATOR SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Converts AmbientCampaignSettings (from campaign) to Step1Data and Step2Data
 * formats (used by the original ambient-visual mode).
 * 
 * The mapping produces IDENTICAL structures to manually created ambient videos.
 * 
 * Phase 1: Database save only - NO AI generation.
 * 
 * NOTE: Publishing settings (campaignSettings.publishing) are NOT mapped to step data.
 * They are accessed directly by the orchestrator in Step 8 (executeStep8_Publish).
 */

import type { 
  Step1Data, 
  Step2Data,
  AnimationMode,
  VideoGenerationMode,
  LoopType,
  MusicStyle,
  Language,
  TextOverlayStyle
} from '../../../../../modes/ambient-visual/types';
import type { AmbientCampaignSettings } from '../../../types';

/**
 * Convert AmbientCampaignSettings to Step1Data format
 * 
 * Maps campaign settings to the exact structure used by the original
 * ambient-visual mode's Atmosphere phase.
 * 
 * @param idea - The video topic/idea (becomes userStory)
 * @param settings - Campaign settings
 * @returns Step1Data compatible object
 */
export function buildStep1Data(
  idea: string,
  settings: AmbientCampaignSettings
): Partial<Step1Data> {
  return {
    // ─────────────────────────────────────────────────────────────
    // USER STORY - UNIQUE PER VIDEO
    // ─────────────────────────────────────────────────────────────
    userStory: idea,
    
    // ─────────────────────────────────────────────────────────────
    // ANIMATION MODE
    // ─────────────────────────────────────────────────────────────
    animationMode: settings.animationMode as AnimationMode,
    videoGenerationMode: settings.videoGenerationMode as VideoGenerationMode | undefined,
    
    // ─────────────────────────────────────────────────────────────
    // CORE ATMOSPHERE
    // ─────────────────────────────────────────────────────────────
    mood: settings.mood,
    theme: settings.theme,
    timeContext: settings.timeContext,
    season: settings.season,
    
    // ─────────────────────────────────────────────────────────────
    // DURATION & FORMAT
    // ─────────────────────────────────────────────────────────────
    duration: settings.duration,
    aspectRatio: settings.aspectRatio,
    language: settings.language as Language,
    
    // ─────────────────────────────────────────────────────────────
    // IMAGE GENERATION SETTINGS
    // ─────────────────────────────────────────────────────────────
    imageModel: settings.imageModel,
    imageResolution: settings.imageResolution,
    
    // ─────────────────────────────────────────────────────────────
    // VIDEO GENERATION SETTINGS (for video-animation mode)
    // ─────────────────────────────────────────────────────────────
    videoModel: settings.videoModel,
    videoResolution: settings.videoResolution,
    motionPrompt: settings.motionPrompt,
    
    // ─────────────────────────────────────────────────────────────
    // IMAGE TRANSITIONS SETTINGS (for image-transitions mode)
    // ─────────────────────────────────────────────────────────────
    defaultEasingStyle: settings.defaultEasingStyle,
    transitionStyle: settings.transitionStyle,
    
    // ─────────────────────────────────────────────────────────────
    // PACING & SEGMENTS
    // ─────────────────────────────────────────────────────────────
    pacing: settings.pacing?.pacing ?? 30,
    segmentEnabled: settings.pacing?.segmentEnabled ?? true,
    segmentCount: settings.pacing?.segmentCount ?? 'auto',
    shotsPerSegment: settings.pacing?.shotsPerSegment ?? 'auto',
    
    // ─────────────────────────────────────────────────────────────
    // LOOP SETTINGS
    // ─────────────────────────────────────────────────────────────
    loopMode: settings.loops?.loopMode ?? true,
    loopType: (settings.loops?.loopType ?? 'seamless') as LoopType,
    segmentLoopEnabled: settings.loops?.segmentLoopEnabled ?? false,
    segmentLoopCount: settings.loops?.segmentLoopCount ?? 'auto',
    shotLoopEnabled: settings.loops?.shotLoopEnabled ?? false,
    shotLoopCount: settings.loops?.shotLoopCount ?? 'auto',
    
    // ─────────────────────────────────────────────────────────────
    // BACKGROUND MUSIC TOGGLE
    // ─────────────────────────────────────────────────────────────
    backgroundMusicEnabled: settings.soundscape?.backgroundMusicEnabled ?? false,
    
    // ─────────────────────────────────────────────────────────────
    // VOICEOVER SETTINGS
    // ─────────────────────────────────────────────────────────────
    voiceoverEnabled: settings.soundscape?.voiceoverEnabled ?? false,
    voiceoverStory: settings.soundscape?.voiceoverStory,
    voiceId: settings.soundscape?.voiceId,
    textOverlayEnabled: settings.soundscape?.textOverlayEnabled ?? false,
    textOverlayStyle: settings.soundscape?.textOverlayStyle as TextOverlayStyle | undefined,
    
    // ─────────────────────────────────────────────────────────────
    // MOOD DESCRIPTION (NOT SET - Phase 2 will generate via AI)
    // ─────────────────────────────────────────────────────────────
    // moodDescription is intentionally set to empty string
    // It will be generated by the AI in Phase 2
    moodDescription: '',
  };
}

/**
 * Convert AmbientCampaignSettings to Step2Data format
 * 
 * Maps campaign settings to the exact structure used by the original
 * ambient-visual mode's Visual World phase.
 * 
 * @param settings - Campaign settings
 * @returns Step2Data compatible object
 */
export function buildStep2Data(
  settings: AmbientCampaignSettings
): Partial<Step2Data> {
  // Extract reference image URLs from the visual settings
  // The frontend may send either string URLs or objects with previewUrl
  const referenceImages = extractReferenceImageUrls(settings.visual?.referenceImages);
  
  return {
    // ─────────────────────────────────────────────────────────────
    // VISUAL WORLD SETTINGS
    // ─────────────────────────────────────────────────────────────
    artStyle: settings.visual?.artStyle ?? 'cinematic',
    visualElements: settings.visual?.visualElements ?? [],
    visualRhythm: settings.visual?.visualRhythm ?? 'breathing',
    referenceImages,
    imageCustomInstructions: settings.visual?.imageCustomInstructions,
    
    // ─────────────────────────────────────────────────────────────
    // BACKGROUND MUSIC SETTINGS (from soundscape)
    // ─────────────────────────────────────────────────────────────
    musicStyle: settings.soundscape?.musicStyle as MusicStyle | undefined,
    customMusicUrl: settings.soundscape?.customMusicUrl,
    customMusicDuration: settings.soundscape?.customMusicDuration,
    hasCustomMusic: settings.soundscape?.hasCustomMusic ?? false,
  };
}

/**
 * Extract reference image URLs from various formats
 * 
 * The frontend may send reference images as:
 * - Array of strings (direct URLs)
 * - Array of objects with previewUrl property
 * 
 * @param images - Reference images in various formats
 * @returns Array of URL strings
 */
function extractReferenceImageUrls(
  images: Array<{ tempId?: string; previewUrl?: string; originalName?: string }> | string[] | undefined
): string[] {
  if (!images || !Array.isArray(images)) {
    return [];
  }
  
  return images.map(img => {
    if (typeof img === 'string') {
      return img;
    }
    if (img && typeof img === 'object' && 'previewUrl' in img) {
      return img.previewUrl || '';
    }
    return '';
  }).filter(url => url.length > 0);
}
