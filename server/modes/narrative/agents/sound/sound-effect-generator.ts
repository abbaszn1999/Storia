/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NARRATIVE MODE - SOUND EFFECT GENERATOR AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates sound effects for narrative video content using MMAudio + Shotstack.
 * 
 * Process:
 * 1. MMAudio generates video with embedded audio (but at low resolution)
 * 2. Shotstack extracts audio from MMAudio's video output
 * 3. Audio is uploaded to Bunny CDN for permanent storage
 * 
 * This preserves original video quality by storing only the audio separately.
 * The final render will combine the original high-res video with this audio.
 */

import { callAi } from "../../../../ai/service";
import { bunnyStorage, buildVideoModePath } from "../../../../storage/bunny-storage";
import { getShotstackClient } from "../../../../integrations/shotstack/client";
import type { NarrativeSoundEffectGeneratorInput } from "../../types";

const SOUND_EFFECT_GENERATOR_CONFIG = {
  provider: "mmaudio" as const,
  model: "video-to-audio",
  maxRetries: 2,
  defaultDuration: 8,
  defaultNumSteps: 25,
  defaultCfgStrength: 4.5,
};

interface SoundEffectGeneratorOutput {
  audioUrl: string;
  originalMMAudioUrl: string;
  fileSize: number;
  cost?: number;
}

/**
 * Generate sound effects for a video using MMAudio + Shotstack.
 * 
 * @param input - Video URL, prompt, and generation settings
 * @returns CDN URL of extracted audio, and cost
 */
export async function generateNarrativeSoundEffect(
  input: NarrativeSoundEffectGeneratorInput
): Promise<SoundEffectGeneratorOutput> {
  const {
    videoUrl,
    prompt,
    duration,
    videoId,
    videoTitle,
    shotId,
    sceneId,
    userId,
    workspaceId,
    workspaceName,
  } = input;

  console.log('[narrative:sound-effect] Generating sound effect:', {
    videoUrl: videoUrl.substring(0, 50) + '...',
    prompt: prompt.substring(0, 100),
    duration: duration || SOUND_EFFECT_GENERATOR_CONFIG.defaultDuration,
    videoId,
    shotId,
  });

  // Validate inputs
  if (!videoUrl) {
    throw new Error("Video URL is required");
  }
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt is required");
  }

  let lastError: Error | null = null;

  // Retry logic for sound effect generation
  for (let attempt = 0; attempt <= SOUND_EFFECT_GENERATOR_CONFIG.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[narrative:sound-effect] Retry ${attempt}/${SOUND_EFFECT_GENERATOR_CONFIG.maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt - 1)));
      }

      console.log('[narrative:sound-effect] Calling MMAudio API...');

      // Build payload for MMAudio
      const payload: Record<string, unknown> = {
        video_url: videoUrl,
        prompt: prompt,
      };

      // Add optional parameters if provided
      if (duration !== undefined) {
        payload.duration = duration;
      }

      // Call MMAudio via AI service
      const response = await callAi(
        {
          provider: SOUND_EFFECT_GENERATOR_CONFIG.provider,
          model: SOUND_EFFECT_GENERATOR_CONFIG.model,
          task: "video-to-audio",
          payload,
          userId,
          workspaceId,
        },
        {
          skipCreditCheck: false,
        }
      );

      // Extract output
      const output = response.output as {
        videoUrl: string;
        fileName: string;
        fileSize: number;
        contentType: string;
      };

      if (!output?.videoUrl) {
        throw new Error("No video URL in MMAudio response");
      }

      console.log('[narrative:sound-effect] MMAudio response received:', {
        videoUrl: output.videoUrl.substring(0, 50) + '...',
        fileSize: output.fileSize,
      });

      // Use Shotstack to extract audio from MMAudio's video
      console.log('[narrative:sound-effect] Extracting audio using Shotstack...');
      const shotstackClient = getShotstackClient();
      
      const actualDuration = duration || SOUND_EFFECT_GENERATOR_CONFIG.defaultDuration;
      const audioUrl = await shotstackClient.extractAudioFromVideo(
        output.videoUrl,
        actualDuration
      );

      console.log('[narrative:sound-effect] Audio extracted:', {
        audioUrl: audioUrl.substring(0, 50) + '...',
      });

      // Download the MP3 from Shotstack's temporary URL
      console.log('[narrative:sound-effect] Downloading extracted audio...');
      const audioResponse = await fetch(audioUrl);
      
      if (!audioResponse.ok) {
        throw new Error(`Failed to download audio from Shotstack: ${audioResponse.status}`);
      }

      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
      console.log(`[narrative:sound-effect] Downloaded: ${(audioBuffer.length / 1024 / 1024).toFixed(2)}MB`);

      // Build Bunny storage path
      const timestamp = Date.now();
      const filename = `sfx_shot_${shotId}_${timestamp}.mp3`;
      
      const truncatedTitle = videoTitle.length > 50 
        ? videoTitle.substring(0, 50) 
        : videoTitle;

      const dateLabel = new Date().toISOString().slice(0, 10).replace(/-/g, "");

      // Organize by scene ID
      const subFolder = `Sound-Effects/Scene-${sceneId}`;

      const bunnyPath = buildVideoModePath({
        userId,
        workspaceName,
        toolMode: "narrative",
        projectName: truncatedTitle,
        subFolder,
        filename,
        dateLabel,
      });

      console.log('[narrative:sound-effect] Uploading to CDN...');
      console.log('[narrative:sound-effect] Path:', bunnyPath);

      // Upload MP3 to Bunny CDN for permanent storage
      const cdnUrl = await bunnyStorage.uploadFile(
        bunnyPath,
        audioBuffer,
        "audio/mpeg"
      );

      console.log('[narrative:sound-effect] CDN URL:', cdnUrl);

      const cost = response.usage?.totalCostUsd || 0;

      console.log('[narrative:sound-effect] Generation complete:', {
        cdnUrl,
        originalUrl: output.videoUrl.substring(0, 50) + '...',
        fileSize: audioBuffer.length,
        cost,
      });

      return {
        audioUrl: cdnUrl,
        originalMMAudioUrl: output.videoUrl,
        fileSize: audioBuffer.length,
        cost,
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[narrative:sound-effect] Attempt ${attempt + 1} failed:`, lastError.message);

      // Don't retry on certain errors
      if (lastError.message.includes("insufficient credits") ||
          lastError.message.includes("Video URL is required") ||
          lastError.message.includes("Prompt is required")) {
        break;
      }
    }
  }

  // All retries failed
  console.error('[narrative:sound-effect] All attempts failed');
  throw lastError || new Error("Failed to generate sound effect");
}



