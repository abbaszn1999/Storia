/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHARACTER VLOG - SOUND EFFECT GENERATOR AGENT (Agent 5.4b)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates sound effects for video content using MMAudio + Shotstack.
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
import type {
  SoundEffectGeneratorInput,
  SoundEffectGeneratorOutput,
} from "../../types";

const SOUND_EFFECT_GENERATOR_CONFIG = {
  provider: "mmaudio" as const,
  model: "video-to-audio",
  maxRetries: 2,
  // Default MMAudio parameters
  defaultDuration: 8,
  defaultNumSteps: 25,
  defaultCfgStrength: 4.5,
};

/**
 * Generate sound effects for a video using MMAudio + Shotstack.
 * 
 * @param input - Video URL, prompt, and generation settings
 * @returns CDN URL of extracted audio, duration, and cost
 */
export async function generateSoundEffect(
  input: SoundEffectGeneratorInput
): Promise<SoundEffectGeneratorOutput> {
  const {
    videoUrl,
    prompt,
    duration,
    numSteps,
    cfgStrength,
    seed,
    videoId,
    videoTitle,
    videoCreatedAt,
    shotId,
    sceneId,
    userId,
    workspaceId,
    workspaceName,
  } = input;

  console.log('[character-vlog:sound-effect] Generating sound effect:', {
    videoUrl: videoUrl.substring(0, 50) + '...',
    prompt: prompt.substring(0, 100),
    duration: duration || SOUND_EFFECT_GENERATOR_CONFIG.defaultDuration,
    numSteps: numSteps || SOUND_EFFECT_GENERATOR_CONFIG.defaultNumSteps,
    cfgStrength: cfgStrength || SOUND_EFFECT_GENERATOR_CONFIG.defaultCfgStrength,
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
        console.log(`[character-vlog:sound-effect] Retry ${attempt}/${SOUND_EFFECT_GENERATOR_CONFIG.maxRetries}...`);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt - 1)));
      }

      console.log('[character-vlog:sound-effect] Calling MMAudio API...');

      // Build payload for MMAudio
      const payload: Record<string, unknown> = {
        video_url: videoUrl,
        prompt: prompt,
      };

      // Add optional parameters if provided
      if (duration !== undefined) {
        payload.duration = duration;
      }
      if (numSteps !== undefined) {
        payload.num_steps = numSteps;
      }
      if (cfgStrength !== undefined) {
        payload.cfg_strength = cfgStrength;
      }
      if (seed !== undefined) {
        payload.seed = seed;
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

      console.log('[character-vlog:sound-effect] MMAudio response received:', {
        videoUrl: output.videoUrl.substring(0, 50) + '...',
        fileSize: output.fileSize,
      });

      // Use Shotstack to extract audio from MMAudio's video
      console.log('[character-vlog:sound-effect] Extracting audio using Shotstack...');
      const shotstackClient = getShotstackClient();
      
      const actualDuration = duration || SOUND_EFFECT_GENERATOR_CONFIG.defaultDuration;
      const audioUrl = await shotstackClient.extractAudioFromVideo(
        output.videoUrl,
        actualDuration
      );

      console.log('[character-vlog:sound-effect] Audio extracted:', {
        audioUrl: audioUrl.substring(0, 50) + '...',
      });

      // Download the MP3 from Shotstack's temporary URL
      console.log('[character-vlog:sound-effect] Downloading extracted audio...');
      const audioResponse = await fetch(audioUrl);
      
      if (!audioResponse.ok) {
        throw new Error(`Failed to download audio from Shotstack: ${audioResponse.status}`);
      }

      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
      console.log(`[character-vlog:sound-effect] Downloaded: ${(audioBuffer.length / 1024 / 1024).toFixed(2)}MB`);

      // Build Bunny storage path organized by scene ID
      // Path structure: /{userId}/{workspaceName}/video_mode/vlog/{videoTitle}_{date}/Rendered/Sound-Effects/Scene-{sceneId}/{filename}
      const timestamp = Date.now();
      const filename = `sfx_shot_${shotId}_${timestamp}.mp3`;
      
      // Truncate video title to avoid path length issues
      const truncatedTitle = videoTitle.length > 50 
        ? videoTitle.substring(0, 50) 
        : videoTitle;

      // Format video creation date as YYYYMMDD for path
      const dateLabel = videoCreatedAt 
        ? (typeof videoCreatedAt === 'string' 
            ? new Date(videoCreatedAt).toISOString().slice(0, 10).replace(/-/g, "")
            : videoCreatedAt.toISOString().slice(0, 10).replace(/-/g, ""))
        : new Date().toISOString().slice(0, 10).replace(/-/g, "");

      // Organize by scene ID: Sound-Effects/Scene-{sceneId}
      const subFolder = `Sound-Effects/Scene-${sceneId}`;

      const bunnyPath = buildVideoModePath({
        userId,
        workspaceName,
        toolMode: "vlog", // Use "vlog" to save in existing vlog folder
        projectName: truncatedTitle,
        subFolder,
        filename,
        dateLabel,
      });

      console.log('[character-vlog:sound-effect] Uploading to CDN...');
      console.log('[character-vlog:sound-effect] Path:', bunnyPath);

      // Upload MP3 to Bunny CDN for permanent storage
      const cdnUrl = await bunnyStorage.uploadFile(
        bunnyPath,
        audioBuffer,
        "audio/mpeg"
      );

      console.log('[character-vlog:sound-effect] CDN URL:', cdnUrl);

      const cost = response.usage?.totalCostUsd || 0;

      console.log('[character-vlog:sound-effect] Generation complete:', {
        cdnUrl,
        originalUrl: output.videoUrl.substring(0, 50) + '...',
        fileSize: audioBuffer.length,
        cost,
        duration: actualDuration,
      });

      return {
        audioUrl: cdnUrl,
        duration: actualDuration,
        fileSize: audioBuffer.length,
        cost,
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[character-vlog:sound-effect] Attempt ${attempt + 1} failed:`, lastError.message);

      // Don't retry on certain errors
      if (lastError.message.includes("insufficient credits") ||
          lastError.message.includes("Video URL is required") ||
          lastError.message.includes("Prompt is required")) {
        break;
      }
    }
  }

  // All retries failed
  console.error('[character-vlog:sound-effect] All attempts failed');
  throw lastError || new Error("Failed to generate sound effect");
}
