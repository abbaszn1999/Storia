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
  wordTimestamps?: WordTimestamp[];  // NEW: Word-level timestamps from ElevenLabs
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
    
    // ═══════════════════════════════════════════════════════════════════════════
    // OPTION A: Use word-level timestamps if available (PRECISE SYNC)
    // ═══════════════════════════════════════════════════════════════════════════
    if (scene.wordTimestamps && scene.wordTimestamps.length > 0) {
      hasTimestamps = true;
      segments = splitByWordTimestamps(scene.wordTimestamps);
      console.log(`[subtitle-generator] Scene ${scene.sceneNumber}: Using ${scene.wordTimestamps.length} word timestamps → ${segments.length} subtitle(s)`);
    } else {
      // ═══════════════════════════════════════════════════════════════════════════
      // OPTION B: Fall back to duration-based splitting
      // ═══════════════════════════════════════════════════════════════════════════
      segments = splitTextIntoSegments(scene.narration, scene.duration);
      console.log(`[subtitle-generator] Scene ${scene.sceneNumber}: Fallback mode → ${segments.length} subtitle(s)`);
    }
    
    for (const segment of segments) {
      // For word timestamps, times are already absolute within scene
      // For fallback, add scene start time
      const absoluteStart = scene.wordTimestamps?.length 
        ? sceneStartTime + segment.startTime 
        : sceneStartTime + segment.startTime;
      const absoluteEnd = scene.wordTimestamps?.length
        ? sceneStartTime + segment.endTime
        : sceneStartTime + segment.endTime;
      
      const start = formatSrtTime(absoluteStart);
      const end = formatSrtTime(absoluteEnd);
      
      allSubtitles.push(`${subtitleIndex}\n${start} --> ${end}\n${segment.text}\n`);
      subtitleIndex++;
    }
    
    sceneStartTime += scene.duration;
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
 */
export async function burnSubtitles(
  videoPath: string,
  scenes: Scene[]
): Promise<string> {
  const outputPath = path.join(TEMP_DIR, `${randomUUID()}_with_subs.mp4`);
  
  console.log('[subtitle-generator] ═══════════════════════════════════════════════');
  console.log('[subtitle-generator] Burning subtitles into video...');
  console.log('[subtitle-generator] Input video:', videoPath);
  console.log('[subtitle-generator] Scenes count:', scenes.length);
  
  // Create SRT file
  const srtPath = createSrtFile(scenes);
  
  // Escape the path for FFmpeg on Windows
  let escapedSrtPath = srtPath.replace(/\\/g, '/');
  if (process.platform === 'win32') {
    escapedSrtPath = escapedSrtPath.replace(/^([A-Z]):/, '$1\\:');
  }
  
  console.log('[subtitle-generator] SRT path:', srtPath);
  console.log('[subtitle-generator] Escaped SRT path:', escapedSrtPath);
  
  // Use subtitles filter with force_style for better control
  // FontName=Cairo for beautiful Arabic, FontSize=20 for compact look
  const subtitleFilter = `subtitles='${escapedSrtPath}':force_style='FontName=Cairo,FontSize=20,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Shadow=1,MarginV=25,Alignment=2'`;
  
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

