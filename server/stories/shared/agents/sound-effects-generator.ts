// Sound Effects Generation Agent
// Generates sound effects audio using ElevenLabs Sound Effects API
// Works with auto-asmr mode when video model doesn't support native audio
// Generates sound effects from soundDescription for each scene

import { callAi } from "../../../ai/service";
import { bunnyStorage, buildStoryModePath } from "../../../storage/bunny-storage";
import { getAudioDurationFromUrl } from "../services/ffmpeg-helpers";
import type { StoryMode } from "./idea-generator";

/**
 * Create sound effects generator function for a specific story mode
 * 
 * @param mode - Story mode (currently only auto-asmr uses this)
 * @returns generateSoundEffects function configured for the specified mode
 */
export async function createSoundEffectsGenerator(mode: StoryMode) {
  // All story modes use the same types from shared
  const typesModule = await import(`../types`);
  
  // Types will be inferred from usage
  type SoundEffectsGeneratorInput = any;
  type SoundEffectsGeneratorOutput = any;
  type SoundEffectGenerationResult = any;

  /**
   * Generate sound effect audio for a single scene with retry logic
   */
  async function generateSceneSoundEffect(
    scene: SoundEffectsGeneratorInput['scenes'][0],
    userId: string,
    workspaceId: string,
    workspaceName: string,
    projectName: string,
    maxRetries = 2
  ): Promise<SoundEffectGenerationResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[${mode}:sound-effects-generator] Retry ${attempt}/${maxRetries} for Scene ${scene.sceneNumber}`);
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }

        console.log(`[${mode}:sound-effects-generator] Generating sound effect for Scene ${scene.sceneNumber}...`);
        console.log(`[${mode}:sound-effects-generator] Sound description: "${scene.soundDescription}"`);

        // Validate sound description
        if (!scene.soundDescription || scene.soundDescription.trim().length === 0) {
          throw new Error("Empty sound description");
        }

        // Call ElevenLabs Sound Effects API
        // Use scene duration as duration_seconds for better matching
        const response = await callAi(
          {
            provider: "elevenlabs",
            model: "sound-effects", // Model name for sound effects
            task: "sound-effects",
            payload: {
              text: scene.soundDescription.trim(),
              duration_seconds: scene.duration, // Match scene duration
              prompt_influence: 0.7, // Balance between prompt and natural sound (0.0-1.0)
            },
            userId,
            workspaceId,
          },
          {
            skipCreditCheck: false,
          }
        );

        // Get audio buffer from response
        let audioBuffer: Buffer;
        const output = response.output as any;

        if (output && output.audio_base64) {
          // Sound Effects API returns audio_base64
          audioBuffer = Buffer.from(output.audio_base64, 'base64');
          console.log(`[${mode}:sound-effects-generator] Audio decoded: ${(audioBuffer.length / 1024).toFixed(2)}KB`);
        } else if (Buffer.isBuffer(response.output)) {
          // Fallback: Direct buffer
          audioBuffer = response.output;
          console.log(`[${mode}:sound-effects-generator] Audio received: ${(audioBuffer.length / 1024).toFixed(2)}KB`);
        } else {
          throw new Error("Invalid audio output received from ElevenLabs");
        }

        if (!audioBuffer || audioBuffer.length === 0) {
          throw new Error("Empty audio buffer received");
        }

        // Upload to Bunny Storage with timestamp to avoid conflicts
        const timestamp = Date.now();
        const filename = `sound_effect_scene_${scene.sceneNumber}_${timestamp}.mp3`;

        // Truncate project name to avoid path length issues (max 50 chars)
        const truncatedProjectName = projectName.length > 50 
          ? projectName.substring(0, 50) 
          : projectName;

        const bunnyPath = buildStoryModePath({
          userId,
          workspaceName,
          toolMode: mode,
          projectName: truncatedProjectName,
          subfolder: "SoundEffects", // Store in SoundEffects folder instead of VoiceOver
          filename: filename,
        });

        // Upload to CDN first
        console.log(`[${mode}:sound-effects-generator] Uploading Scene ${scene.sceneNumber} to CDN...`);
        console.log(`[${mode}:sound-effects-generator] Filename: ${filename}`);

        const cdnUrl = await bunnyStorage.uploadFile(
          bunnyPath,
          audioBuffer,
          "audio/mpeg"
        );

        console.log(`[${mode}:sound-effects-generator] CDN URL: ${cdnUrl}`);

        // Calculate actual audio duration from CDN URL (more reliable)
        console.log(`[${mode}:sound-effects-generator] Calculating audio duration for Scene ${scene.sceneNumber}...`);
        let actualDuration = scene.duration; // Default to original duration

        try {
          actualDuration = await getAudioDurationFromUrl(cdnUrl);
          console.log(`[${mode}:sound-effects-generator] Scene ${scene.sceneNumber} - Expected: ${scene.duration}s, Actual: ${actualDuration}s`);

          // Warn if duration mismatch is significant (>2 seconds)
          const durationDiff = Math.abs(actualDuration - scene.duration);
          if (durationDiff > 2) {
            console.warn(`[${mode}:sound-effects-generator] ⚠️ Scene ${scene.sceneNumber} duration mismatch: ${durationDiff}s difference!`);
          }
        } catch (error) {
          console.warn(`[${mode}:sound-effects-generator] Could not calculate duration for Scene ${scene.sceneNumber}, using original: ${scene.duration}s`);
          console.warn(`[${mode}:sound-effects-generator] Error:`, error instanceof Error ? error.message : String(error));
        }

        const cost = response.usage?.totalCostUsd || 0;

        console.log(`[${mode}:sound-effects-generator] Scene ${scene.sceneNumber} completed ✓ (cost: $${cost.toFixed(4)})`);

        return {
          sceneNumber: scene.sceneNumber,
          audioUrl: cdnUrl,
          duration: actualDuration,  // Use actual audio duration!
          status: "generated",
          cost,
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(
          `[${mode}:sound-effects-generator] Scene ${scene.sceneNumber} attempt ${attempt + 1} failed:`,
          lastError.message
        );

        // Don't retry on certain errors
        if (lastError.message.includes("insufficient credits") || 
            lastError.message.includes("Empty sound description")) {
          break;
        }
      }
    }

    // All retries failed
    const errorMessage = lastError?.message || "Unknown error";
    console.error(`[${mode}:sound-effects-generator] Scene ${scene.sceneNumber} failed after ${maxRetries + 1} attempts`);

    return {
      sceneNumber: scene.sceneNumber,
      audioUrl: "",
      duration: scene.duration,
      status: "failed",
      error: errorMessage,
      cost: 0,
    };
  }

  /**
   * Generate sound effects for all scenes
   */
  async function generateSoundEffects(
    input: any,
    userId?: string,
    workspaceName?: string
  ): Promise<any> {
    const { scenes, projectName } = input;

    console.log(`[${mode}:sound-effects-generator] Starting sound effects generation:`, {
      sceneCount: scenes.length,
      projectName,
    });

    const startTime = Date.now();
    const results: SoundEffectGenerationResult[] = [];

    // Process scenes sequentially to avoid "too_many_concurrent_requests" error
    for (const scene of scenes) {
      // Skip scenes without soundDescription (shouldn't happen, but safety check)
      if (!scene.soundDescription || scene.soundDescription.trim().length === 0) {
        console.warn(`[${mode}:sound-effects-generator] Scene ${scene.sceneNumber} has no soundDescription, skipping...`);
        results.push({
          sceneNumber: scene.sceneNumber,
          audioUrl: "",
          duration: scene.duration,
          status: "skipped",
          error: "No sound description",
          cost: 0,
        });
        continue;
      }

      const result = await generateSceneSoundEffect(
        scene,
        userId || "",
        input.workspaceId || "",
        workspaceName || "",
        projectName
      );
      results.push(result);
    }

    // Calculate statistics
    const successfulCount = results.filter(r => r.status === "generated").length;
    const failedCount = results.filter(r => r.status === "failed").length;
    const skippedCount = results.filter(r => r.status === "skipped").length;
    const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);
    const errors = results
      .filter(r => (r.status === "failed" || r.status === "skipped") && r.error)
      .map(r => `Scene ${r.sceneNumber}: ${r.error}`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`[${mode}:sound-effects-generator] Batch generation complete:`, {
      total: scenes.length,
      successful: successfulCount,
      failed: failedCount,
      skipped: skippedCount,
      totalCost: `$${totalCost.toFixed(4)}`,
      duration: `${duration}s`,
    });

    return {
      scenes: results,
      totalCost,
      errors,
    };
  }

  return generateSoundEffects;
}

/**
 * Generate sound effects (backward compatibility - uses auto-asmr mode by default)
 */
export async function generateSoundEffects(
  input: any,
  userId?: string,
  workspaceName?: string
): Promise<any> {
  const generator = await createSoundEffectsGenerator("auto-asmr");
  return generator(input, userId, workspaceName);
}

