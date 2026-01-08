/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AMBIENT VISUAL - SOUND EFFECT GENERATOR AGENT (Agent 5.4)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates sound effects for video content using MMAudio.
 * Takes a video URL and prompt, generates audio synchronized with the video,
 * and uploads the result to Bunny CDN for persistent storage.
 * 
 * MMAudio returns a video with embedded audio, which expires after 24 hours.
 * This agent downloads and re-uploads to CDN for permanent storage.
 */

import { callAi } from "../../../ai/service";
import { bunnyStorage, buildVideoModePath } from "../../../storage/bunny-storage";
import type {
  SoundEffectGeneratorInput,
  SoundEffectGeneratorOutput,
} from "../types";

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
 * Generate sound effects for a video using MMAudio.
 * 
 * @param input - Video URL, prompt, and generation settings
 * @returns CDN URL of video with embedded audio, and cost
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

  console.log('[ambient-visual:sound-effect] Generating sound effect:', {
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
        console.log(`[ambient-visual:sound-effect] Retry ${attempt}/${SOUND_EFFECT_GENERATOR_CONFIG.maxRetries}...`);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt - 1)));
      }

      console.log('[ambient-visual:sound-effect] Calling MMAudio API...');

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

      console.log('[ambient-visual:sound-effect] MMAudio response received:', {
        videoUrl: output.videoUrl.substring(0, 50) + '...',
        fileSize: output.fileSize,
      });

      // Download the video from MMAudio (expires in 24h)
      console.log('[ambient-visual:sound-effect] Downloading from MMAudio...');
      const videoResponse = await fetch(output.videoUrl);
      
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video from MMAudio: ${videoResponse.status}`);
      }

      const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
      console.log(`[ambient-visual:sound-effect] Downloaded: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB`);

      // Build Bunny storage path organized by scene ID
      // Path structure matches voiceover but with scene organization:
      // /{userId}/{workspaceName}/video_mode/ambient/{videoTitle}_{date}/Rendered/Sound-Effects/Scene-{sceneId}/{filename}
      const timestamp = Date.now();
      const filename = `sfx_shot_${shotId}_${timestamp}.mp4`;
      
      // Truncate video title to avoid path length issues (same as voiceover)
      const truncatedTitle = videoTitle.length > 50 
        ? videoTitle.substring(0, 50) 
        : videoTitle;

      // Format video creation date as YYYYMMDD for path (same as voiceover)
      const dateLabel = videoCreatedAt 
        ? (typeof videoCreatedAt === 'string' 
            ? new Date(videoCreatedAt).toISOString().slice(0, 10).replace(/-/g, "")
            : videoCreatedAt.toISOString().slice(0, 10).replace(/-/g, ""))
        : undefined;

      // Organize by scene ID: Sound-Effects/Scene-{sceneId}
      const subFolder = `Sound-Effects/Scene-${sceneId}`;

      const bunnyPath = buildVideoModePath({
        userId,
        workspaceName,
        toolMode: "ambient",
        projectName: truncatedTitle,
        subFolder,
        filename,
        dateLabel,
      });

      console.log('[ambient-visual:sound-effect] Uploading to CDN...');
      console.log('[ambient-visual:sound-effect] Path:', bunnyPath);

      // Upload to Bunny CDN for permanent storage
      const cdnUrl = await bunnyStorage.uploadFile(
        bunnyPath,
        videoBuffer,
        "video/mp4"
      );

      console.log('[ambient-visual:sound-effect] CDN URL:', cdnUrl);

      const cost = response.usage?.totalCostUsd || 0;

      console.log('[ambient-visual:sound-effect] Generation complete:', {
        cdnUrl,
        originalUrl: output.videoUrl.substring(0, 50) + '...',
        fileSize: videoBuffer.length,
        cost,
      });

      return {
        videoWithAudioUrl: cdnUrl,
        originalMMAudioUrl: output.videoUrl,
        fileSize: videoBuffer.length,
        cost,
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[ambient-visual:sound-effect] Attempt ${attempt + 1} failed:`, lastError.message);

      // Don't retry on certain errors
      if (lastError.message.includes("insufficient credits") ||
          lastError.message.includes("Video URL is required") ||
          lastError.message.includes("Prompt is required")) {
        break;
      }
    }
  }

  // All retries failed
  console.error('[ambient-visual:sound-effect] All attempts failed');
  throw lastError || new Error("Failed to generate sound effect");
}

