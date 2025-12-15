// Subtitle Generation Service for Text Overlay
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { randomUUID } from "crypto";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import path from "path";
import { execSync } from "child_process";
import { getTempDir } from "./ffmpeg-helpers";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const TEMP_DIR = getTempDir();

interface Scene {
  sceneNumber: number;
  narration: string;
  duration: number;
}

interface SubtitleSegment {
  text: string;
  startTime: number;
  endTime: number;
}

// Configuration for smart text splitting
const SEGMENT_CONFIG = {
  MIN_SEGMENT_DURATION: 2.5,  // Minimum seconds per segment
  MAX_SEGMENT_DURATION: 4.5,  // Maximum seconds per segment (comfortable reading)
  IDEAL_SEGMENT_DURATION: 3.5, // Ideal duration for each segment
  MAX_WORDS_PER_SEGMENT: 12,   // Maximum words to show at once
  MIN_WORDS_PER_SEGMENT: 4,    // Minimum words per segment
};

/**
 * Split text into readable segments based on duration
 * Uses punctuation and word count for natural breaks
 */
function splitTextIntoSegments(text: string, duration: number): SubtitleSegment[] {
  const cleanText = text.trim().replace(/\r/g, '');
  
  // For short durations (< 5s), show full text
  if (duration <= 5) {
    return [{
      text: cleanText,
      startTime: 0,
      endTime: duration,
    }];
  }
  
  // Calculate ideal number of segments
  const idealSegmentCount = Math.ceil(duration / SEGMENT_CONFIG.IDEAL_SEGMENT_DURATION);
  
  // Split by sentence-ending punctuation first (Arabic and English)
  const sentenceBreaks = cleanText.split(/([.،؟!。?!]+\s*)/);
  
  // Combine into sentences
  const sentences: string[] = [];
  for (let i = 0; i < sentenceBreaks.length; i += 2) {
    const sentence = sentenceBreaks[i] + (sentenceBreaks[i + 1] || '');
    if (sentence.trim()) {
      sentences.push(sentence.trim());
    }
  }
  
  // If we have enough sentences, use them as segments
  if (sentences.length >= idealSegmentCount && sentences.length <= idealSegmentCount * 1.5) {
    const segments: SubtitleSegment[] = [];
    const timePerSegment = duration / sentences.length;
    let currentTime = 0;
    
    for (const sentence of sentences) {
      segments.push({
        text: sentence,
        startTime: currentTime,
        endTime: currentTime + timePerSegment,
      });
      currentTime += timePerSegment;
    }
    
    console.log(`[subtitle-generator] Split by sentences: ${segments.length} segments`);
    return segments;
  }
  
  // Otherwise, split by word count
  const words = cleanText.split(/\s+/);
  const wordsPerSegment = Math.ceil(words.length / idealSegmentCount);
  const actualWordsPerSegment = Math.min(
    Math.max(wordsPerSegment, SEGMENT_CONFIG.MIN_WORDS_PER_SEGMENT),
    SEGMENT_CONFIG.MAX_WORDS_PER_SEGMENT
  );
  
  const segments: SubtitleSegment[] = [];
  const actualSegmentCount = Math.ceil(words.length / actualWordsPerSegment);
  const timePerSegment = duration / actualSegmentCount;
  let currentTime = 0;
  
  for (let i = 0; i < words.length; i += actualWordsPerSegment) {
    const segmentWords = words.slice(i, i + actualWordsPerSegment);
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
  
  console.log(`[subtitle-generator] Split by words: ${segments.length} segments (${actualWordsPerSegment} words each)`);
  return segments;
}

/**
 * Create SRT subtitle file from scenes with smart text splitting
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
  
  for (const scene of scenes) {
    // Split this scene's text into segments
    const segments = splitTextIntoSegments(scene.narration, scene.duration);
    
    console.log(`[subtitle-generator] Scene ${scene.sceneNumber}: ${scene.duration}s → ${segments.length} subtitle(s)`);
    
    for (const segment of segments) {
      const absoluteStart = sceneStartTime + segment.startTime;
      const absoluteEnd = sceneStartTime + segment.endTime;
      
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
  
  console.log(`[subtitle-generator] SRT file created with ${subtitleIndex - 1} subtitles`);
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

