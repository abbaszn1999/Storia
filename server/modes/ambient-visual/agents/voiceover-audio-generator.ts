/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AMBIENT VISUAL - VOICEOVER AUDIO GENERATOR AGENT (Agent 5.2)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates voiceover audio from approved narration scripts using ElevenLabs TTS.
 * Uses eleven_v3 model for best quality and 70+ language support.
 * Uploads generated audio to Bunny CDN.
 */

import { callAi } from "../../../ai/service";
import { bunnyStorage, buildVideoModePath } from "../../../storage/bunny-storage";
import { getAudioDurationFromUrl, concatenateAudioFiles } from "../../../stories/shared/services/ffmpeg-helpers";
import { writeFileSync, readFileSync, unlinkSync, existsSync, mkdirSync } from "fs";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import type {
  VoiceoverAudioGeneratorInput,
  VoiceoverAudioGeneratorOutput,
} from "../types";

const VOICEOVER_AUDIO_CONFIG = {
  provider: "elevenlabs" as const,
  model: "eleven-v3",
  modelId: "eleven_v3",  // Best quality model with 70+ language support
  maxRetries: 2,
  maxCharsPerRequest: 5000,  // ElevenLabs character limit
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR =
  process.env.TEMP_DIR || path.join(os.tmpdir(), "storia-temp");

// Ensure temp directory exists
if (!existsSync(TEMP_DIR)) {
  mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Split text into chunks at sentence boundaries, respecting the 5000 character limit.
 * Never cuts mid-word or mid-sentence, even if it means chunks are smaller than 5000.
 * 
 * @param text - The full script text
 * @param maxChars - Maximum characters per chunk (default: 5000)
 * @returns Array of text chunks
 */
function splitTextAtSentenceBoundaries(text: string, maxChars: number = VOICEOVER_AUDIO_CONFIG.maxCharsPerRequest): string[] {
  if (text.length <= maxChars) {
    return [text];
  }

  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    // If remaining text fits in one chunk, add it and break
    if (text.length - currentIndex <= maxChars) {
      chunks.push(text.substring(currentIndex));
      break;
    }

    // Find the end of the current chunk (maxChars from currentIndex)
    const chunkEnd = currentIndex + maxChars;
    
    // Look backwards from chunkEnd to find the last sentence boundary
    // Sentence boundaries: . ! ? followed by space/newline, or [pause] markers
    let splitIndex = chunkEnd;
    let foundBoundary = false;

    // Search backwards for sentence endings
    for (let i = chunkEnd; i > currentIndex + maxChars * 0.5; i--) {
      // Check for pause markers [pause] or [long pause] (check before punctuation to prioritize)
      const remainingText = text.substring(Math.max(0, i - 12), i + 1).toLowerCase();
      if (remainingText.includes('[long pause]')) {
        const pauseIndex = text.lastIndexOf('[long pause]', i);
        if (pauseIndex >= currentIndex) {
          splitIndex = pauseIndex + '[long pause]'.length;
          foundBoundary = true;
          break;
        }
      } else if (remainingText.includes('[pause]')) {
        const pauseIndex = text.lastIndexOf('[pause]', i);
        if (pauseIndex >= currentIndex) {
          splitIndex = pauseIndex + '[pause]'.length;
          foundBoundary = true;
          break;
        }
      }
      
      // Check for sentence-ending punctuation followed by whitespace
      // Supports: . ! ? (English) and Arabic punctuation: ؟ ؛ (question mark, semicolon)
      if (i > 0 && i < text.length - 1) {
        const char = text[i - 1];
        const nextChar = text[i];
        if ((/[.!?؟]/.test(char) && /\s/.test(nextChar)) || 
            (char === '؛' && /\s/.test(nextChar))) {
          splitIndex = i;
          foundBoundary = true;
          break;
        }
      }
      
      // Check for newline (paragraph break)
      if (text[i] === '\n' && i > currentIndex + 100) {
        splitIndex = i + 1;
        foundBoundary = true;
        break;
      }
    }

    // If no sentence boundary found, look for word boundary (space)
    if (!foundBoundary) {
      for (let i = chunkEnd; i > currentIndex + maxChars * 0.5; i--) {
        if (/\s/.test(text[i])) {
          splitIndex = i + 1;
          foundBoundary = true;
          break;
        }
      }
    }

    // If still no boundary found, split at maxChars (shouldn't happen often)
    if (!foundBoundary) {
      splitIndex = chunkEnd;
    }

    // Extract chunk and move forward
    const chunk = text.substring(currentIndex, splitIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    currentIndex = splitIndex;
  }

  return chunks;
}

/**
 * Generate voiceover audio from a narration script.
 * 
 * @param input - Script and voice settings
 * @returns Audio URL, duration, and cost
 */
export async function generateVoiceoverAudio(
  input: VoiceoverAudioGeneratorInput,
  usageType?: string,
  usageMode?: string
): Promise<VoiceoverAudioGeneratorOutput> {
  const {
    script,
    voiceId,
    language,
    videoId,
    videoTitle,
    videoCreatedAt,
    userId,
    workspaceId,
    workspaceName,
  } = input;

  console.log('[ambient-visual:voiceover-audio] Generating voiceover audio:', {
    scriptLength: script.length,
    voiceId,
    language,
    videoId,
    videoTitle,
  });

  // Validate inputs
  if (!script || script.trim().length === 0) {
    throw new Error("Empty script text");
  }
  if (!voiceId) {
    throw new Error("Voice ID is required");
  }

  // Split script into chunks if it exceeds character limit
  const chunks = splitTextAtSentenceBoundaries(script);
  console.log('[ambient-visual:voiceover-audio] Script split into chunks:', {
    totalLength: script.length,
    chunksCount: chunks.length,
    chunkSizes: chunks.map(c => c.length),
  });

  // If script fits in one request, use the original single-request flow
  if (chunks.length === 1) {
    return await generateSingleChunkAudio(
      {
        script: chunks[0],
        voiceId,
        language,
        videoId,
        videoTitle,
        videoCreatedAt,
        userId,
        workspaceId,
        workspaceName,
      },
      usageType,
      usageMode
    );
  }

  // Multiple chunks: generate audio for each, then concatenate
  const tempAudioFiles: string[] = [];
  let totalCost = 0;
  let mergedAudioPath: string | null = null;

  try {
    // Configure voice settings for meditation-style narration
    const voiceSettings = {
      stability: 0.5,          // Must be 0.0, 0.5, or 1.0 (0.5 = Natural)
      similarity_boost: 0.75,  // Good voice consistency
      style: 0.1,              // Subtle style variation
      use_speaker_boost: true, // Enhanced audio quality
    };

    // Generate audio for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[ambient-visual:voiceover-audio] Generating chunk ${i + 1}/${chunks.length} (${chunk.length} chars)...`);

      let chunkAudioBuffer: Buffer | null = null;
      let lastError: Error | null = null;

      // Retry logic for each chunk
      for (let attempt = 0; attempt <= VOICEOVER_AUDIO_CONFIG.maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`[ambient-visual:voiceover-audio] Retry ${attempt}/${VOICEOVER_AUDIO_CONFIG.maxRetries} for chunk ${i + 1}...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
          }

          const response = await callAi(
            {
              provider: VOICEOVER_AUDIO_CONFIG.provider,
              model: VOICEOVER_AUDIO_CONFIG.model,
              task: "text-to-speech",
              payload: {
                text: chunk,
                voice_id: voiceId,
                model_id: VOICEOVER_AUDIO_CONFIG.modelId,
                with_timestamps: false,
                voice_settings: voiceSettings,
              },
              userId,
              workspaceId,
            },
            {
              skipCreditCheck: false,
              metadata: { usageType, usageMode },
            }
          );

          // Extract audio buffer
          const output = response.output as any;
          if (output && output.audio) {
            chunkAudioBuffer = output.audio;
          } else if (Buffer.isBuffer(response.output)) {
            chunkAudioBuffer = response.output;
          } else if (output && output.audio_base64) {
            chunkAudioBuffer = Buffer.from(output.audio_base64, 'base64');
          } else {
            throw new Error("Invalid audio output received from ElevenLabs");
          }

          if (!chunkAudioBuffer || chunkAudioBuffer.length === 0) {
            throw new Error("Empty audio buffer received");
          }

          totalCost += response.usage?.totalCostUsd || 0;
          break; // Success, exit retry loop

        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.error(`[ambient-visual:voiceover-audio] Chunk ${i + 1} attempt ${attempt + 1} failed:`, lastError.message);

          if (lastError.message.includes("insufficient credits") || 
              lastError.message.includes("Empty script")) {
            break; // Don't retry on these errors
          }
        }
      }

      if (!chunkAudioBuffer) {
        throw lastError || new Error(`Failed to generate audio for chunk ${i + 1}`);
      }

      // Save chunk to temp file
      const tempFilePath = path.join(TEMP_DIR, `voiceover_chunk_${i + 1}_${randomUUID()}.mp3`);
      writeFileSync(tempFilePath, chunkAudioBuffer);
      tempAudioFiles.push(tempFilePath);
      console.log(`[ambient-visual:voiceover-audio] Chunk ${i + 1} saved: ${(chunkAudioBuffer.length / 1024).toFixed(2)}KB`);
    }

    // Concatenate all audio chunks
    console.log('[ambient-visual:voiceover-audio] Concatenating audio chunks...');
    mergedAudioPath = await concatenateAudioFiles(tempAudioFiles);
    console.log('[ambient-visual:voiceover-audio] Audio concatenated successfully');

    // Read merged audio file (we'll clean it up in finally block)
    const mergedAudioBuffer = readFileSync(mergedAudioPath);

    // Build Bunny storage path
    const timestamp = Date.now();
    const filename = `voiceover_${timestamp}.mp3`;
    const truncatedTitle = videoTitle.length > 50 
      ? videoTitle.substring(0, 50) 
      : videoTitle;

    // Format video creation date as YYYYMMDD for path
    // IMPORTANT: Ensure dateLabel is always defined to prevent fallback to current date
    const dateLabel = videoCreatedAt 
      ? (typeof videoCreatedAt === 'string' 
          ? new Date(videoCreatedAt).toISOString().slice(0, 10).replace(/-/g, "")
          : videoCreatedAt.toISOString().slice(0, 10).replace(/-/g, ""))
      : new Date().toISOString().slice(0, 10).replace(/-/g, ""); // Fallback to current date (same as buildVideoModePath default)

    const bunnyPath = buildVideoModePath({
      userId,
      workspaceName,
      toolMode: "ambient",
      projectName: truncatedTitle,
      subFolder: "Voice-Over",
      filename,
      dateLabel,
    });

    console.log('[ambient-visual:voiceover-audio] Uploading merged audio to CDN...');
    const audioUrl = await bunnyStorage.uploadFile(
      bunnyPath,
      mergedAudioBuffer,
      "audio/mpeg"
    );

    console.log('[ambient-visual:voiceover-audio] CDN URL:', audioUrl);

    // Calculate actual audio duration
    let duration = 0;
    try {
      duration = await getAudioDurationFromUrl(audioUrl);
      console.log(`[ambient-visual:voiceover-audio] Audio duration: ${duration}s`);
    } catch (durationError) {
      console.warn('[ambient-visual:voiceover-audio] Could not calculate duration:', durationError);
      const wordCount = script.split(/\s+/).length;
      duration = Math.round((wordCount / 110) * 60);
      console.log(`[ambient-visual:voiceover-audio] Estimated duration: ${duration}s (${wordCount} words)`);
    }

    console.log('[ambient-visual:voiceover-audio] Generation complete:', {
      audioUrl,
      duration,
      cost: totalCost,
      chunksProcessed: chunks.length,
    });

    return {
      audioUrl,
      duration,
      cost: totalCost,
    };

  } finally {
    // Clean up temp chunk files
    for (const tempFile of tempAudioFiles) {
      try {
        if (existsSync(tempFile)) {
          unlinkSync(tempFile);
          console.log(`[ambient-visual:voiceover-audio] Cleaned up temp file: ${path.basename(tempFile)}`);
        }
      } catch (cleanupError) {
        console.warn(`[ambient-visual:voiceover-audio] Failed to cleanup temp file ${tempFile}:`, cleanupError);
      }
    }
    
    // Clean up merged audio file (if it was created)
    try {
      if (mergedAudioPath && existsSync(mergedAudioPath)) {
        unlinkSync(mergedAudioPath);
        console.log(`[ambient-visual:voiceover-audio] Cleaned up merged file: ${path.basename(mergedAudioPath)}`);
      }
    } catch (cleanupError) {
      console.warn(`[ambient-visual:voiceover-audio] Failed to cleanup merged file:`, cleanupError);
    }
  }
}

/**
 * Generate audio for a single chunk (original flow for scripts under 5000 chars)
 */
async function generateSingleChunkAudio(
  input: VoiceoverAudioGeneratorInput,
  usageType?: string,
  usageMode?: string
): Promise<VoiceoverAudioGeneratorOutput> {
  const {
    script,
    voiceId,
    language,
    videoId,
    videoTitle,
    videoCreatedAt,
    userId,
    workspaceId,
    workspaceName,
  } = input;

  const effectiveUsageType = usageType ?? "video";
  const effectiveUsageMode = usageMode ?? "ambient";

  let lastError: Error | null = null;

  // Retry logic for TTS generation
  for (let attempt = 0; attempt <= VOICEOVER_AUDIO_CONFIG.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[ambient-visual:voiceover-audio] Retry ${attempt}/${VOICEOVER_AUDIO_CONFIG.maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }

      const voiceSettings = {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.1,
        use_speaker_boost: true,
      };

      console.log('[ambient-visual:voiceover-audio] Calling ElevenLabs TTS...');

      const response = await callAi(
        {
          provider: VOICEOVER_AUDIO_CONFIG.provider,
          model: VOICEOVER_AUDIO_CONFIG.model,
          task: "text-to-speech",
          payload: {
            text: script,
            voice_id: voiceId,
            model_id: VOICEOVER_AUDIO_CONFIG.modelId,
            with_timestamps: false,
            voice_settings: voiceSettings,
          },
          userId,
          workspaceId,
        },
        {
          skipCreditCheck: false,
          metadata: { usageType: effectiveUsageType, usageMode: effectiveUsageMode },
        }
      );

      let audioBuffer: Buffer;
      const output = response.output as any;

      if (output && output.audio) {
        audioBuffer = output.audio;
        console.log(`[ambient-visual:voiceover-audio] Audio with timestamps: ${(audioBuffer.length / 1024).toFixed(2)}KB`);
      } else if (Buffer.isBuffer(response.output)) {
        audioBuffer = response.output;
        console.log(`[ambient-visual:voiceover-audio] Audio received: ${(audioBuffer.length / 1024).toFixed(2)}KB`);
      } else if (output && output.audio_base64) {
        audioBuffer = Buffer.from(output.audio_base64, 'base64');
        console.log(`[ambient-visual:voiceover-audio] Audio decoded: ${(audioBuffer.length / 1024).toFixed(2)}KB`);
      } else {
        throw new Error("Invalid audio output received from ElevenLabs");
      }

      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error("Empty audio buffer received");
      }

      const timestamp = Date.now();
      const filename = `voiceover_${timestamp}.mp3`;
      const truncatedTitle = videoTitle.length > 50 
        ? videoTitle.substring(0, 50) 
        : videoTitle;

      // Format video creation date as YYYYMMDD for path
      // IMPORTANT: Ensure dateLabel is always defined to prevent fallback to current date
      const dateLabel = videoCreatedAt 
        ? (typeof videoCreatedAt === 'string' 
            ? new Date(videoCreatedAt).toISOString().slice(0, 10).replace(/-/g, "")
            : videoCreatedAt.toISOString().slice(0, 10).replace(/-/g, ""))
        : new Date().toISOString().slice(0, 10).replace(/-/g, ""); // Fallback to current date (same as buildVideoModePath default)

      const bunnyPath = buildVideoModePath({
        userId,
        workspaceName,
        toolMode: "ambient",
        projectName: truncatedTitle,
        subFolder: "Voice-Over",
        filename,
        dateLabel,
      });

      console.log('[ambient-visual:voiceover-audio] Uploading to CDN...');
      const audioUrl = await bunnyStorage.uploadFile(
        bunnyPath,
        audioBuffer,
        "audio/mpeg"
      );

      console.log('[ambient-visual:voiceover-audio] CDN URL:', audioUrl);

      let duration = 0;
      try {
        duration = await getAudioDurationFromUrl(audioUrl);
        console.log(`[ambient-visual:voiceover-audio] Audio duration: ${duration}s`);
      } catch (durationError) {
        console.warn('[ambient-visual:voiceover-audio] Could not calculate duration:', durationError);
        const wordCount = script.split(/\s+/).length;
        duration = Math.round((wordCount / 110) * 60);
        console.log(`[ambient-visual:voiceover-audio] Estimated duration: ${duration}s (${wordCount} words)`);
      }

      const cost = response.usage?.totalCostUsd || 0;

      console.log('[ambient-visual:voiceover-audio] Generation complete:', {
        audioUrl,
        duration,
        cost,
      });

      return {
        audioUrl,
        duration,
        cost,
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[ambient-visual:voiceover-audio] Attempt ${attempt + 1} failed:`, lastError.message);

      if (lastError.message.includes("insufficient credits") || 
          lastError.message.includes("Empty script")) {
        break;
      }
    }
  }

  console.error('[ambient-visual:voiceover-audio] All attempts failed');
  throw lastError || new Error("Failed to generate voiceover audio");
}

/**
 * Available ElevenLabs voices for ambient voiceover.
 * These are curated for meditation/ambient style narration.
 */
export const AMBIENT_VOICES = {
  // Arabic voices
  ar: [
    { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", gender: "female", style: "calm" },
    { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", gender: "male", style: "warm" },
    { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", gender: "female", style: "soothing" },
  ],
  // English voices
  en: [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "female", style: "calm" },
    { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", gender: "female", style: "gentle" },
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", gender: "female", style: "warm" },
    { id: "ErXwobaYiN019PkySvjV", name: "Antoni", gender: "male", style: "deep" },
    { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", gender: "male", style: "warm" },
    { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", gender: "male", style: "calm" },
  ],
} as const;

