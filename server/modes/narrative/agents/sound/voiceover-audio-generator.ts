/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NARRATIVE MODE - VOICEOVER AUDIO GENERATOR AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates voiceover audio from approved narration scripts using ElevenLabs TTS.
 * Uses eleven_v3 model for best quality and 70+ language support.
 * Uploads generated audio to Bunny CDN.
 */

import { callAi } from "../../../../ai/service";
import { bunnyStorage, buildVideoModePath } from "../../../../storage/bunny-storage";
import { getAudioDurationFromUrl, concatenateAudioFiles } from "../../../../stories/shared/services/ffmpeg-helpers";
import { writeFileSync, readFileSync, unlinkSync, existsSync, mkdirSync } from "fs";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import type { NarrativeVoiceoverAudioInput } from "../../types";

const VOICEOVER_AUDIO_CONFIG = {
  provider: "elevenlabs" as const,
  model: "eleven-v3",
  modelId: "eleven_v3",
  maxRetries: 2,
  maxCharsPerRequest: 5000,
};

/**
 * Mapping of internal voice IDs to ElevenLabs voice IDs.
 * Must be kept in sync with client/src/constants/voice-library.ts
 */
const VOICE_ID_MAP: Record<string, string> = {
  // English voices
  "voice-brock": "DGzg6RaUqxGRTHSBjfgF",
  "voice-xavier": "YOq2y2Up4RgXP2HyXjE5",
  "voice-carter": "qNkzaJoHLLdpvgh5tISm",
  "voice-bartholomeus": "L5Oo1OjjHdbIvJDQFgmN",
  "voice-andrea": "Crm8VULvkVs5ZBDa1Ixm",
  "voice-ingmar": "xrNwYO0xeioXswMCcFNF",
  "voice-ian": "e5WNhrdI30aXpS2RSGm1",
  "voice-martin": "Vpv1YgvVd6CHIzOTiTt8",
  "voice-lily": "qBDvhofpxp92JgXJxDjB",
  "voice-clara": "wNvqdMNs9MLd1PG6uWuY",
  "voice-frederick": "g298lY8JIucgBDyOpRLj",
  "voice-dio": "CV4xD6M8z1X1kya4Pepj",
  "voice-david": "y1adqrqs4jNaANXsIZnD",
  "voice-ivanna": "tQ4MEZFJOzsahSEEZtHK",
  "voice-mark": "UgBBYS2sOqTuMpoF3BR0",
  "voice-kelly": "9sjP3TfMlzEjAa6uXh3A",
  "voice-arthur": "TtRFBnwQdH1k01vR0hMz",
  "voice-joey": "mUfWEBhcigm8YlCDbmGP",
  "voice-gian": "wytO3xyllSDjJKHNkchr",
  // Arabic voices
  "voice-haytham-ar": "IES4nrmZdUBHByLBde0P",
  "voice-abrar-ar": "VwC51uc4PUblWEJSPzeo",
  "voice-ghaida-ar": "rFDdsCQRZCUL8cPOWtnP",
  "voice-mo-ar": "DPd861uv5p6zeVV94qOT",
  "voice-maged-ar": "amSNjVC0vWYiE8iGimVb",
  "voice-sara-educational-ar": "gMB389pj77Qe5nErWNjd",
  "voice-ghaida-conversational-ar": "Wim44P0dU9HtjyzNnFsv",
  "voice-farah-ar": "4wf10lgibMnboGJGCLrP",
  "voice-mazen-ar": "rPNcQ53R703tTmtue1AT",
  "voice-sara-social-ar": "jAAHNNqlbAX9iWjJPEtE",
  "voice-khaled-ar": "drMurExmkWVIH5nW8snR",
};

/**
 * Convert internal voice ID to ElevenLabs voice ID.
 * If the ID is already an ElevenLabs ID (not in our map), return it as-is.
 */
function getElevenLabsVoiceId(voiceId: string): string {
  // Check if it's an internal ID that needs mapping
  if (VOICE_ID_MAP[voiceId]) {
    return VOICE_ID_MAP[voiceId];
  }
  // If not in map, assume it's already an ElevenLabs ID
  return voiceId;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR =
  process.env.TEMP_DIR || path.join(os.tmpdir(), "storia-temp");

// Ensure temp directory exists
if (!existsSync(TEMP_DIR)) {
  mkdirSync(TEMP_DIR, { recursive: true });
}

interface VoiceoverAudioGeneratorOutput {
  audioUrl: string;
  duration: number;
  cost?: number;
}

/**
 * Split text into chunks at sentence boundaries, respecting the 5000 character limit.
 */
function splitTextAtSentenceBoundaries(text: string, maxChars: number = VOICEOVER_AUDIO_CONFIG.maxCharsPerRequest): string[] {
  if (text.length <= maxChars) {
    return [text];
  }

  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    if (text.length - currentIndex <= maxChars) {
      chunks.push(text.substring(currentIndex));
      break;
    }

    const chunkEnd = currentIndex + maxChars;
    let splitIndex = chunkEnd;
    let foundBoundary = false;

    // Search backwards for sentence endings
    for (let i = chunkEnd; i > currentIndex + maxChars * 0.5; i--) {
      // Check for pause markers
      const remainingText = text.substring(Math.max(0, i - 12), i + 1).toLowerCase();
      if (remainingText.includes('[pause]')) {
        const pauseIndex = text.lastIndexOf('[pause]', i);
        if (pauseIndex >= currentIndex) {
          splitIndex = pauseIndex + '[pause]'.length;
          foundBoundary = true;
          break;
        }
      } else if (remainingText.includes('[beat]')) {
        const beatIndex = text.lastIndexOf('[beat]', i);
        if (beatIndex >= currentIndex) {
          splitIndex = beatIndex + '[beat]'.length;
          foundBoundary = true;
          break;
        }
      }
      
      // Check for sentence-ending punctuation
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
      
      // Check for newline
      if (text[i] === '\n' && i > currentIndex + 100) {
        splitIndex = i + 1;
        foundBoundary = true;
        break;
      }
    }

    // If no sentence boundary found, look for word boundary
    if (!foundBoundary) {
      for (let i = chunkEnd; i > currentIndex + maxChars * 0.5; i--) {
        if (/\s/.test(text[i])) {
          splitIndex = i + 1;
          foundBoundary = true;
          break;
        }
      }
    }

    if (!foundBoundary) {
      splitIndex = chunkEnd;
    }

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
export async function generateNarrativeVoiceoverAudio(
  input: NarrativeVoiceoverAudioInput,
  usageType?: string,
  usageMode?: string
): Promise<VoiceoverAudioGeneratorOutput> {
  const {
    script,
    voiceId,
    language,
    videoId,
    videoTitle,
    userId,
    workspaceId,
    workspaceName,
  } = input;

  console.log('[narrative:voiceover-audio] Generating voiceover audio:', {
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
  console.log('[narrative:voiceover-audio] Script split into chunks:', {
    totalLength: script.length,
    chunksCount: chunks.length,
    chunkSizes: chunks.map(c => c.length),
  });

  // If script fits in one request, use the single-request flow
  if (chunks.length === 1) {
    return await generateSingleChunkAudio(
      {
        script: chunks[0],
        voiceId,
        language,
        videoId,
        videoTitle,
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
    const voiceSettings = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.2,  // Slightly more style for narrative
      use_speaker_boost: true,
    };

    // Generate audio for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[narrative:voiceover-audio] Generating chunk ${i + 1}/${chunks.length} (${chunk.length} chars)...`);

      let chunkAudioBuffer: Buffer | null = null;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= VOICEOVER_AUDIO_CONFIG.maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`[narrative:voiceover-audio] Retry ${attempt}/${VOICEOVER_AUDIO_CONFIG.maxRetries} for chunk ${i + 1}...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
          }

          const response = await callAi(
            {
              provider: VOICEOVER_AUDIO_CONFIG.provider,
              model: VOICEOVER_AUDIO_CONFIG.model,
              task: "text-to-speech",
              payload: {
                text: chunk,
                voice_id: getElevenLabsVoiceId(voiceId),
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
          break;

        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.error(`[narrative:voiceover-audio] Chunk ${i + 1} attempt ${attempt + 1} failed:`, lastError.message);

          if (lastError.message.includes("insufficient credits") || 
              lastError.message.includes("Empty script")) {
            break;
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
      console.log(`[narrative:voiceover-audio] Chunk ${i + 1} saved: ${(chunkAudioBuffer.length / 1024).toFixed(2)}KB`);
    }

    // Concatenate all audio chunks
    console.log('[narrative:voiceover-audio] Concatenating audio chunks...');
    mergedAudioPath = await concatenateAudioFiles(tempAudioFiles);
    console.log('[narrative:voiceover-audio] Audio concatenated successfully');

    const mergedAudioBuffer = readFileSync(mergedAudioPath);

    // Build Bunny storage path
    const timestamp = Date.now();
    const filename = `voiceover_${timestamp}.mp3`;
    const truncatedTitle = videoTitle.length > 50 
      ? videoTitle.substring(0, 50) 
      : videoTitle;

    const dateLabel = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    const bunnyPath = buildVideoModePath({
      userId,
      workspaceName,
      toolMode: "narrative",
      projectName: truncatedTitle,
      subFolder: "Voice-Over",
      filename,
      dateLabel,
    });

    console.log('[narrative:voiceover-audio] Uploading merged audio to CDN...');
    const audioUrl = await bunnyStorage.uploadFile(
      bunnyPath,
      mergedAudioBuffer,
      "audio/mpeg"
    );

    console.log('[narrative:voiceover-audio] CDN URL:', audioUrl);

    // Calculate actual audio duration
    let duration = 0;
    try {
      duration = await getAudioDurationFromUrl(audioUrl);
      console.log(`[narrative:voiceover-audio] Audio duration: ${duration}s`);
    } catch (durationError) {
      console.warn('[narrative:voiceover-audio] Could not calculate duration:', durationError);
      const wordCount = script.split(/\s+/).length;
      duration = Math.round((wordCount / 140) * 60);
      console.log(`[narrative:voiceover-audio] Estimated duration: ${duration}s (${wordCount} words)`);
    }

    console.log('[narrative:voiceover-audio] Generation complete:', {
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
        }
      } catch (cleanupError) {
        console.warn(`[narrative:voiceover-audio] Failed to cleanup temp file:`, cleanupError);
      }
    }
    
    // Clean up merged audio file
    try {
      if (mergedAudioPath && existsSync(mergedAudioPath)) {
        unlinkSync(mergedAudioPath);
      }
    } catch (cleanupError) {
      console.warn(`[narrative:voiceover-audio] Failed to cleanup merged file:`, cleanupError);
    }
  }
}

/**
 * Generate audio for a single chunk
 */
async function generateSingleChunkAudio(
  input: NarrativeVoiceoverAudioInput,
  usageType?: string,
  usageMode?: string
): Promise<VoiceoverAudioGeneratorOutput> {
  const {
    script,
    voiceId,
    videoId,
    videoTitle,
    userId,
    workspaceId,
    workspaceName,
  } = input;

  const effectiveUsageType = usageType ?? "video";
  const effectiveUsageMode = usageMode ?? "narrative";

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= VOICEOVER_AUDIO_CONFIG.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[narrative:voiceover-audio] Retry ${attempt}/${VOICEOVER_AUDIO_CONFIG.maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }

      const voiceSettings = {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.2,
        use_speaker_boost: true,
      };

      console.log('[narrative:voiceover-audio] Calling ElevenLabs TTS...');

      const response = await callAi(
        {
          provider: VOICEOVER_AUDIO_CONFIG.provider,
          model: VOICEOVER_AUDIO_CONFIG.model,
          task: "text-to-speech",
          payload: {
            text: script,
            voice_id: getElevenLabsVoiceId(voiceId),
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
      } else if (Buffer.isBuffer(response.output)) {
        audioBuffer = response.output;
      } else if (output && output.audio_base64) {
        audioBuffer = Buffer.from(output.audio_base64, 'base64');
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

      const dateLabel = new Date().toISOString().slice(0, 10).replace(/-/g, "");

      const bunnyPath = buildVideoModePath({
        userId,
        workspaceName,
        toolMode: "narrative",
        projectName: truncatedTitle,
        subFolder: "Voice-Over",
        filename,
        dateLabel,
      });

      console.log('[narrative:voiceover-audio] Uploading to CDN...');
      const audioUrl = await bunnyStorage.uploadFile(
        bunnyPath,
        audioBuffer,
        "audio/mpeg"
      );

      console.log('[narrative:voiceover-audio] CDN URL:', audioUrl);

      let duration = 0;
      try {
        duration = await getAudioDurationFromUrl(audioUrl);
        console.log(`[narrative:voiceover-audio] Audio duration: ${duration}s`);
      } catch (durationError) {
        console.warn('[narrative:voiceover-audio] Could not calculate duration:', durationError);
        const wordCount = script.split(/\s+/).length;
        duration = Math.round((wordCount / 140) * 60);
        console.log(`[narrative:voiceover-audio] Estimated duration: ${duration}s (${wordCount} words)`);
      }

      const cost = response.usage?.totalCostUsd || 0;

      console.log('[narrative:voiceover-audio] Generation complete:', {
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
      console.error(`[narrative:voiceover-audio] Attempt ${attempt + 1} failed:`, lastError.message);

      if (lastError.message.includes("insufficient credits") || 
          lastError.message.includes("Empty script")) {
        break;
      }
    }
  }

  console.error('[narrative:voiceover-audio] All attempts failed');
  throw lastError || new Error("Failed to generate voiceover audio");
}

/**
 * Available ElevenLabs voices for narrative voiceover.
 * Curated for cinematic/narrative style narration.
 */
export const NARRATIVE_VOICES = {
  // Arabic voices
  ar: [
    { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", gender: "female", style: "expressive" },
    { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", gender: "male", style: "authoritative" },
    { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", gender: "female", style: "warm" },
  ],
  // English voices
  en: [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "female", style: "expressive" },
    { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", gender: "female", style: "warm" },
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", gender: "female", style: "engaging" },
    { id: "ErXwobaYiN019PkySvjV", name: "Antoni", gender: "male", style: "deep" },
    { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", gender: "male", style: "warm" },
    { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", gender: "male", style: "authoritative" },
    { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", gender: "male", style: "narrator" },
    { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", gender: "male", style: "confident" },
  ],
} as const;

