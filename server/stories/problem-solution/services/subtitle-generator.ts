// Subtitle Generation Service for Text Overlay
// Supports word-level synchronized subtitles (karaoke-style)
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { randomUUID } from "crypto";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import path from "path";
import { execSync } from "child_process";
import { getTempDir } from "./ffmpeg-helpers";
import type { WordTimestamp } from "../types";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const TEMP_DIR = getTempDir();

interface Scene {
  sceneNumber: number;
  narration: string;
  duration: number;
  wordTimestamps?: WordTimestamp[];  // Word-level timestamps from ElevenLabs
  audioSpeed?: number;               // Audio speed adjustment (for timestamp correction)
}

interface SubtitleSegment {
  text: string;
  startTime: number;
  endTime: number;
}

// Configuration for karaoke-style subtitles (3-4 words at a time)
const SEGMENT_CONFIG = {
  WORDS_PER_SEGMENT: 4,       // Show 3-4 words at a time (TikTok/Reels style)
  MIN_SEGMENT_DURATION: 0.5,  // Minimum seconds per segment
  MAX_SEGMENT_DURATION: 3.0,  // Maximum seconds per segment
  // Legacy fallback settings
  LEGACY_MAX_WORDS: 12,
  LEGACY_MIN_WORDS: 4,
  LEGACY_IDEAL_DURATION: 3.5,
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUBTITLE STYLE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

type SubtitleStyle = 'modern' | 'cinematic' | 'bold';

interface StyleConfig {
  fontSize: number;
  primaryColor: string;      // ASS format: &HBBGGRR (BGR, not RGB!)
  outlineColor: string;
  outline: number;
  shadow: number;
  marginV: number;
  bold: boolean;
}

// Fonts by language
const FONTS = {
  ar: 'Cairo',              // Beautiful Arabic font
  en: 'Montserrat',         // Clean modern English font (widely available)
  default: 'Arial',         // Fallback
};

// Style configurations for each style type
const STYLE_CONFIGS: Record<SubtitleStyle, StyleConfig> = {
  modern: {
    fontSize: 20,
    primaryColor: '&HFFFFFF',    // White
    outlineColor: '&H000000',    // Black outline
    outline: 2,
    shadow: 1,
    marginV: 25,
    bold: false,
  },
  cinematic: {
    fontSize: 22,
    primaryColor: '&HFFFFFF',    // White
    outlineColor: '&H222222',    // Dark gray outline
    outline: 3,
    shadow: 2,
    marginV: 30,
    bold: false,
  },
  bold: {
    fontSize: 26,
    primaryColor: '&H00FFFF',    // Yellow (BGR: 00FFFF = Yellow)
    outlineColor: '&H000000',    // Black outline
    outline: 4,
    shadow: 2,
    marginV: 35,
    bold: true,
  },
};

// Subtitle options interface
export interface SubtitleOptions {
  style?: SubtitleStyle;
  language?: string;
}

/**
 * Get font name based on language
 */
function getFontForLanguage(language: string): string {
  if (language === 'ar') return FONTS.ar;
  if (language === 'en') return FONTS.en;
  // Auto-detect: if language code starts with 'ar', use Arabic font
  if (language.startsWith('ar')) return FONTS.ar;
  return FONTS.en;  // Default to English font
}

/**
 * Build FFmpeg force_style string from style config
 */
function buildForceStyle(style: SubtitleStyle, language: string): string {
  const config = STYLE_CONFIGS[style] || STYLE_CONFIGS.modern;
  const fontName = getFontForLanguage(language);
  
  const parts = [
    `FontName=${fontName}`,
    `FontSize=${config.fontSize}`,
    `PrimaryColour=${config.primaryColor}`,
    `OutlineColour=${config.outlineColor}`,
    `Outline=${config.outline}`,
    `Shadow=${config.shadow}`,
    `MarginV=${config.marginV}`,
    `Alignment=2`,  // Center bottom
  ];
  
  if (config.bold) {
    parts.push('Bold=1');
  }
  
  return parts.join(',');
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARABIC DIACRITICS REMOVAL
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Removes Arabic tashkeel/harakat from text for clean subtitle display.
 * The voiceover uses diacritics for correct pronunciation, but subtitles
 * should show clean text without them for better readability.
 * 
 * Diacritics removed:
 * - Fatha (فَتْحة) ◌َ U+064E
 * - Damma (ضَمَّة) ◌ُ U+064F
 * - Kasra (كَسْرة) ◌ِ U+0650
 * - Sukun (سُكُون) ◌ْ U+0652
 * - Shadda (شَدَّة) ◌ّ U+0651
 * - Fathatan (تَنْوِين فَتْح) ◌ً U+064B
 * - Dammatan (تَنْوِين ضَمّ) ◌ٌ U+064C
 * - Kasratan (تَنْوِين كَسْر) ◌ٍ U+064D
 * - Superscript Alef ◌ٰ U+0670
 * - Maddah ◌ٓ U+0653
 * - Hamza Above ◌ٔ U+0654
 * - Hamza Below ◌ٕ U+0655
 */
function removeArabicDiacritics(text: string): string {
  // Arabic diacritics Unicode range: U+064B to U+065F, plus some extras
  const arabicDiacriticsRegex = /[\u064B-\u065F\u0670\u0653-\u0655]/g;
  return text.replace(arabicDiacriticsRegex, '');
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUDIO TAGS REMOVAL
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Removes ElevenLabs v3 audio tags from text.
 * Tags like [happy], [sighs], [chuckles], [whispers] etc. are used for
 * voice emotion control but should NOT appear in subtitles.
 * 
 * Examples:
 * - "[happy] Hello world" → "Hello world"
 * - "He said [whispers] be quiet" → "He said be quiet"
 * - "[sighs] I'm tired [sad]" → "I'm tired"
 */
function removeAudioTags(text: string): string {
  // Remove all [tag] patterns (ElevenLabs audio tags)
  // Matches: [word] or [multiple words]
  const audioTagsRegex = /\[[^\]]+\]/g;
  return text.replace(audioTagsRegex, '').replace(/\s+/g, ' ').trim();
}

/**
 * Clean text for subtitle display
 * Removes both Arabic diacritics and audio tags
 */
function cleanTextForSubtitle(text: string): string {
  let cleaned = text;
  
  // Step 1: Remove audio tags like [happy], [sighs], etc.
  cleaned = removeAudioTags(cleaned);
  
  // Step 2: Remove Arabic diacritics (harakat/tashkeel)
  cleaned = removeArabicDiacritics(cleaned);
  
  // Step 3: Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OPTION A: Create segments from word-level timestamps (PRECISE)
 * Uses ElevenLabs alignment data for 100% synchronized subtitles
 * Groups words into chunks of 3-4 words each
 * ═══════════════════════════════════════════════════════════════════════════════
 */
function splitByWordTimestamps(wordTimestamps: WordTimestamp[]): SubtitleSegment[] {
  if (!wordTimestamps || wordTimestamps.length === 0) {
    return [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Step 1: Clean words - remove audio tags and filter empty words
  // ═══════════════════════════════════════════════════════════════════════════
  const cleanedTimestamps = wordTimestamps
    .map(wt => ({
      ...wt,
      // Clean each word: remove audio tags and diacritics
      word: cleanTextForSubtitle(wt.word),
    }))
    // Filter out empty words (audio tags become empty after cleaning)
    .filter(wt => wt.word.length > 0);

  if (cleanedTimestamps.length === 0) {
    console.warn('[subtitle-generator] All words were filtered out after cleaning');
    return [];
  }

  console.log(`[subtitle-generator] Cleaned words: ${wordTimestamps.length} → ${cleanedTimestamps.length} (removed ${wordTimestamps.length - cleanedTimestamps.length} audio tags)`);

  const segments: SubtitleSegment[] = [];
  const wordsPerGroup = SEGMENT_CONFIG.WORDS_PER_SEGMENT; // 3-4 words

  for (let i = 0; i < cleanedTimestamps.length; i += wordsPerGroup) {
    const group = cleanedTimestamps.slice(i, i + wordsPerGroup);
    
    if (group.length === 0) continue;

    const text = group.map(w => w.word).join(' ');
    const startTime = group[0].startTime;
    const endTime = group[group.length - 1].endTime;

    // Ensure minimum duration
    const actualEnd = Math.max(endTime, startTime + SEGMENT_CONFIG.MIN_SEGMENT_DURATION);

    segments.push({
      text: text.trim(),
      startTime,
      endTime: actualEnd,
    });
  }

  console.log(`[subtitle-generator] ✓ Created ${segments.length} segments from ${cleanedTimestamps.length} clean words (${wordsPerGroup} words/segment)`);
  
  return segments;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OPTION B: Split text into segments based on duration (FALLBACK)
 * Used when word timestamps are not available
 * ═══════════════════════════════════════════════════════════════════════════════
 */
function splitTextIntoSegments(text: string, duration: number): SubtitleSegment[] {
  // ═══════════════════════════════════════════════════════════════════════════
  // Clean text: remove audio tags and Arabic diacritics for subtitle display
  // ═══════════════════════════════════════════════════════════════════════════
  const cleanText = cleanTextForSubtitle(text);
  
  // For very short durations (< 3s), show full text
  if (duration <= 3) {
    return [{
      text: cleanText,
      startTime: 0,
      endTime: duration,
    }];
  }
  
  // Split by words and group into chunks of 3-4 words
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  const wordsPerSegment = SEGMENT_CONFIG.WORDS_PER_SEGMENT;
  
  const segments: SubtitleSegment[] = [];
  const segmentCount = Math.ceil(words.length / wordsPerSegment);
  const timePerSegment = duration / segmentCount;
  let currentTime = 0;
  
  for (let i = 0; i < words.length; i += wordsPerSegment) {
    const segmentWords = words.slice(i, i + wordsPerSegment);
    const segmentText = segmentWords.join(' ');
    
    if (segmentText.trim()) {
      segments.push({
        text: segmentText.trim(),
        startTime: currentTime,
        endTime: Math.min(currentTime + timePerSegment, duration),
      });
      currentTime += timePerSegment;
    }
  }
  
  console.log(`[subtitle-generator] Split by words (fallback): ${segments.length} segments (${wordsPerSegment} words each)`);
  return segments;
}

/**
 * Create SRT subtitle file from scenes
 * Uses word-level timestamps if available (100% sync)
 * Falls back to duration-based splitting otherwise
 */
function createSrtFile(scenes: Scene[]): string {
  const srtPath = path.join(TEMP_DIR, `${randomUUID()}.srt`);
  let sceneStartTime = 0;
  let subtitleIndex = 1;
  
  const formatSrtTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  };
  
  const allSubtitles: string[] = [];
  let hasTimestamps = false;
  
  console.log('[subtitle-generator] ═══════════════════════════════════════════════');
  console.log('[subtitle-generator] Creating synchronized subtitles...');
  
  for (const scene of scenes) {
    let segments: SubtitleSegment[];
    
    // Get audio speed adjustment factor (default 1.0 = no change)
    const audioSpeed = scene.audioSpeed || 1.0;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // OPTION A: Use word-level timestamps if available (PRECISE SYNC)
    // ═══════════════════════════════════════════════════════════════════════════
    if (scene.wordTimestamps && scene.wordTimestamps.length > 0) {
      hasTimestamps = true;
      segments = splitByWordTimestamps(scene.wordTimestamps);
      
      // Log audio speed adjustment if applicable
      if (Math.abs(audioSpeed - 1.0) > 0.01) {
        console.log(`[subtitle-generator] Scene ${scene.sceneNumber}: Audio speed ${audioSpeed.toFixed(3)}x - adjusting timestamps`);
      }
      console.log(`[subtitle-generator] Scene ${scene.sceneNumber}: Using ${scene.wordTimestamps.length} word timestamps → ${segments.length} subtitle(s)`);
    } else {
      // ═══════════════════════════════════════════════════════════════════════════
      // OPTION B: Fall back to duration-based splitting
      // ═══════════════════════════════════════════════════════════════════════════
      segments = splitTextIntoSegments(scene.narration, scene.duration);
      console.log(`[subtitle-generator] Scene ${scene.sceneNumber}: Fallback mode → ${segments.length} subtitle(s)`);
    }
    
    for (const segment of segments) {
      // ═══════════════════════════════════════════════════════════════════════════
      // AUDIO SPEED TIMESTAMP ADJUSTMENT
      // ═══════════════════════════════════════════════════════════════════════════
      // If audio was slowed down (speed < 1.0), timestamps need to be stretched
      // If audio was sped up (speed > 1.0), timestamps need to be compressed
      // Formula: adjustedTime = originalTime / audioSpeed
      // Example: 
      //   - Audio slowed to 0.9x → 2.0s becomes 2.0/0.9 = 2.22s
      //   - Audio sped to 1.1x → 2.0s becomes 2.0/1.1 = 1.82s
      // ═══════════════════════════════════════════════════════════════════════════
      
      const adjustedStartTime = segment.startTime / audioSpeed;
      const adjustedEndTime = segment.endTime / audioSpeed;
      
      const absoluteStart = sceneStartTime + adjustedStartTime;
      const absoluteEnd = sceneStartTime + adjustedEndTime;
      
      const start = formatSrtTime(absoluteStart);
      const end = formatSrtTime(absoluteEnd);
      
      allSubtitles.push(`${subtitleIndex}\n${start} --> ${end}\n${segment.text}\n`);
      subtitleIndex++;
    }
    
    // Scene duration also needs to be adjusted by audio speed
    const adjustedSceneDuration = scene.duration / audioSpeed;
    sceneStartTime += adjustedSceneDuration;
  }
  
  const srtContent = allSubtitles.join('\n');
  
  // Write with UTF-8 BOM for Arabic support
  const bom = '\uFEFF';
  writeFileSync(srtPath, bom + srtContent, 'utf-8');
  
  console.log('[subtitle-generator] ═══════════════════════════════════════════════');
  console.log(`[subtitle-generator] ✓ SRT created: ${subtitleIndex - 1} subtitles`);
  console.log(`[subtitle-generator] Mode: ${hasTimestamps ? '🎯 Word-level sync (precise)' : '⏱️ Duration-based (estimated)'}`);
  console.log(`[subtitle-generator] Path: ${srtPath}`);
  
  return srtPath;
}

/**
 * Burn subtitles into video using subtitles filter with SRT
 * This properly supports RTL languages like Arabic
 * 
 * @param videoPath - Path to input video
 * @param scenes - Array of scenes with narration and timing
 * @param options - Subtitle style and language options
 */
export async function burnSubtitles(
  videoPath: string,
  scenes: Scene[],
  options: SubtitleOptions = {}
): Promise<string> {
  const outputPath = path.join(TEMP_DIR, `${randomUUID()}_with_subs.mp4`);
  
  // Extract options with defaults
  const style = options.style || 'modern';
  const language = options.language || 'en';
  
  console.log('[subtitle-generator] ═══════════════════════════════════════════════');
  console.log('[subtitle-generator] Burning subtitles into video...');
  console.log('[subtitle-generator] Input video:', videoPath);
  console.log('[subtitle-generator] Scenes count:', scenes.length);
  console.log('[subtitle-generator] Style:', style);
  console.log('[subtitle-generator] Language:', language);
  console.log('[subtitle-generator] Font:', getFontForLanguage(language));
  
  // Create SRT file
  const srtPath = createSrtFile(scenes);
  
  // Escape the path for FFmpeg on Windows
  let escapedSrtPath = srtPath.replace(/\\/g, '/');
  if (process.platform === 'win32') {
    escapedSrtPath = escapedSrtPath.replace(/^([A-Z]):/, '$1\\:');
  }
  
  console.log('[subtitle-generator] SRT path:', srtPath);
  console.log('[subtitle-generator] Escaped SRT path:', escapedSrtPath);
  
  // Build force_style based on selected style and language
  const forceStyle = buildForceStyle(style, language);
  const subtitleFilter = `subtitles='${escapedSrtPath}':force_style='${forceStyle}'`;
  
  console.log('[subtitle-generator] Force style:', forceStyle);
  console.log('[subtitle-generator] Subtitle filter:', subtitleFilter);
  
  // Cleanup function
  const cleanup = () => {
    try {
      if (existsSync(srtPath)) unlinkSync(srtPath);
      console.log('[subtitle-generator] ✓ Cleaned up SRT file');
    } catch (e) {
      console.warn('[subtitle-generator] Failed to cleanup SRT file:', e);
    }
  };
  
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .videoFilters(subtitleFilter)
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-c:a', 'copy',
        '-movflags', '+faststart',
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('[subtitle-generator] FFmpeg subtitle command:', cmd);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          const percent = Math.round(progress.percent);
          if (percent % 10 === 0) {
            console.log(`[subtitle-generator] Progress: ${percent}%`);
          }
        }
      })
      .on('end', () => {
        console.log('[subtitle-generator] ✓ Subtitles burned successfully');
        console.log('[subtitle-generator] Output:', outputPath);
        cleanup();
        resolve();
      })
      .on('error', (err) => {
        console.error('[subtitle-generator] ✗ Subtitle error:', err);
        console.error('[subtitle-generator] Video path:', videoPath);
        cleanup();
        reject(err);
      })
      .run();
  });
  
  return outputPath;
}

