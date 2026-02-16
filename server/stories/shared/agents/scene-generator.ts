import { callTextModel } from "../../../ai/service";
import { getVideoModelConstraints, getDefaultVideoModel } from "../../../ai/config";
import type { StoryMode } from "./idea-generator";
import { getScenePrompts } from "../prompts-loader";
import type { StoryModeForPrompts } from "../prompts-loader";

const SCENE_CONFIG = {
  provider: "openai" as const,
  model: "gpt-4o",
};

/**
 * Scene count limits
 */
const SCENE_LIMITS = {
  MIN: 3,
  MAX: 10,
};

/**
 * Create scene generator function for a specific story mode
 * 
 * @param mode - Story mode (problem-solution, before-after, myth-busting, tease-reveal)
 * @returns generateScenes function configured for the specified mode
 */
export async function createSceneGenerator(mode: StoryMode) {
  const modeForPrompts = mode as StoryModeForPrompts;
  const promptsModule = getScenePrompts(modeForPrompts);
  const typesModule = await import(`../types`);

  const {
    buildSceneBreakdownSystemPrompt,
    buildSceneUserPrompt,
    buildSceneSchema,
    getOptimalSceneCount,
  } = promptsModule;

  // Types from shared/types are not value exports, must use typeof import and key lookup
  type SceneGeneratorInput = import("../types").SceneGeneratorInput;
  type SceneGeneratorOutput = import("../types").SceneGeneratorOutput;
  type SceneOutput = import("../types").SceneOutput;

  // Guard VideoModelConstraints in case it does not exist in prompts module
  type VideoModelConstraints = typeof promptsModule.VideoModelConstraints extends undefined
    ? unknown
    : typeof promptsModule.VideoModelConstraints;

  /**
   * Validate input parameters
   */
  function validateInput(input: any): void {
    const { storyText, duration, pacing } = input;

    if (!storyText || !storyText.trim()) {
      throw new Error("Story text is required");
    }

    if (!duration || duration < 10 || duration > 120) {
      throw new Error("Duration must be between 10 and 120 seconds");
    }

    // Pacing is optional for auto-asmr mode
    if (mode !== 'auto-asmr' && !['slow', 'medium', 'fast'].includes(pacing)) {
      throw new Error("Pacing must be 'slow', 'medium', or 'fast'");
    }
  }

  /**
   * Fix duration mismatch by adjusting scene durations
   * Tries to add/subtract from scenes to match expected duration
   */
  function fixDuration(
    scenes: any[],
    expectedDuration: number,
    modelConstraints?: VideoModelConstraints | null
  ): boolean {
    const totalDuration = scenes.reduce(
      (sum: number, s: any) => sum + (s.duration || 0),
      0
    );

    const difference = expectedDuration - totalDuration;

    // If difference is too large, can't fix
    if (Math.abs(difference) > 10) {
      return false;
    }

    // If difference is 0 or very small, already fixed
    if (Math.abs(difference) < 0.5) {
      return true;
    }

    const supportedDurations = modelConstraints?.supportedDurations || [];
    if (supportedDurations.length === 0) {
      // No constraints, can adjust freely
      if (difference > 0) {
        // Need to add duration - add to longest scenes first
        scenes.sort((a, b) => b.duration - a.duration);
        let remaining = difference;
        for (const scene of scenes) {
          if (remaining <= 0) break;
          const currentDuration = scene.duration;
          const increase = Math.min(remaining, 2);
          const newDuration = currentDuration + increase;
          scene.duration = newDuration;
          remaining -= increase;
        }
      } else {
        // Need to subtract duration - subtract from longest scenes first
        scenes.sort((a, b) => b.duration - a.duration);
        let remaining = Math.abs(difference);
        for (const scene of scenes) {
          if (remaining <= 0) break;
          const currentDuration = scene.duration;
          const reduction = Math.min(remaining, 2);
          const newDuration = Math.max(3, currentDuration - reduction);
          const actualReduction = currentDuration - newDuration;
          scene.duration = newDuration;
          remaining -= actualReduction;
        }
      }
      return true;
    }

    // With constraints, try to adjust using supported durations
    if (difference > 0) {
      // Need to add - try to increase scene durations
      // Strategy: Try to add to multiple scenes to reach target
      let remaining = difference;
      let attempts = 0;
      const maxAttempts = scenes.length * 2; // Prevent infinite loops
      
      while (remaining > 0.5 && attempts < maxAttempts) {
        attempts++;
        let madeProgress = false;
        
        // Try each scene to see if we can increase it
        for (const scene of scenes) {
          if (remaining <= 0) break;
          
          const currentDuration = scene.duration;
          const nextSupported = supportedDurations.find((d: number) => d > currentDuration);
          
          if (nextSupported) {
            const increase = nextSupported - currentDuration;
            if (increase <= remaining) {
              scene.duration = nextSupported;
              remaining -= increase;
              madeProgress = true;
            }
          }
        }
        
        // If no progress, try sorting by duration and trying again
        if (!madeProgress && remaining > 0.5) {
          scenes.sort((a, b) => a.duration - b.duration);
          for (const scene of scenes) {
            if (remaining <= 0) break;
            
            const currentDuration = scene.duration;
            const nextSupported = supportedDurations.find((d: number) => d > currentDuration);
            
            if (nextSupported) {
              const increase = nextSupported - currentDuration;
              if (increase <= remaining) {
                scene.duration = nextSupported;
                remaining -= increase;
                madeProgress = true;
              }
            }
          }
        }
        
        // If still no progress, break to avoid infinite loop
        if (!madeProgress) break;
      }
    } else {
      // Need to subtract - try to decrease scene durations
      let remaining = Math.abs(difference);
      let attempts = 0;
      const maxAttempts = scenes.length * 2;
      
      while (remaining > 0.5 && attempts < maxAttempts) {
        attempts++;
        let madeProgress = false;
        
        // Try to decrease longest scenes first
        scenes.sort((a, b) => b.duration - a.duration);
        
        for (const scene of scenes) {
          if (remaining <= 0) break;
          
          const currentDuration = scene.duration;
          const prevSupported = [...supportedDurations].reverse().find(d => d < currentDuration);
          
          if (prevSupported && prevSupported >= modelConstraints!.minDuration) {
            const decrease = currentDuration - prevSupported;
            if (decrease <= remaining) {
              scene.duration = prevSupported;
              remaining -= decrease;
              madeProgress = true;
            }
          }
        }
        
        if (!madeProgress) break;
      }
    }

    // Verify final duration
    const finalDuration = scenes.reduce(
      (sum: number, s: any) => sum + (s.duration || 0),
      0
    );

    return Math.abs(finalDuration - expectedDuration) <= 1;
  }

  /**
   * Validate and fix output scenes
   */
  function validateOutput(
    parsed: any,
    expectedSceneCount: number,
    expectedDuration: number,
    modelConstraints?: VideoModelConstraints | null
  ): void {
    // Validate structure
    if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
      throw new Error("Invalid response: missing scenes array");
    }

    // Validate scene count
    if (parsed.scenes.length !== expectedSceneCount) {
      throw new Error(
        `Scene count mismatch: expected ${expectedSceneCount}, got ${parsed.scenes.length}`
      );
    }

    // Validate durations
    const totalDuration = parsed.scenes.reduce(
      (sum: number, s: any) => sum + (s.duration || 0),
      0
    );

    const durationDiff = Math.abs(totalDuration - expectedDuration);

    // If duration mismatch is small, try to fix it automatically
    if (durationDiff > 0.5 && durationDiff <= 10) {
      console.warn(
        `[${mode}:scene-generator] Duration mismatch detected: expected ${expectedDuration}s, got ${totalDuration}s (diff: ${durationDiff}s). Attempting to fix...`
      );
      
      const fixed = fixDuration(parsed.scenes, expectedDuration, modelConstraints);
      
      if (fixed) {
        const newTotal = parsed.scenes.reduce(
          (sum: number, s: any) => sum + (s.duration || 0),
          0
        );
        const finalDiff = Math.abs(newTotal - expectedDuration);
        console.log(
          `[${mode}:scene-generator] ✓ Duration fixed: ${totalDuration}s → ${newTotal}s (target: ${expectedDuration}s, final diff: ${finalDiff}s)`
        );
        
        // If still not perfect but close enough (within 2 seconds), accept it
        if (finalDiff > 1 && finalDiff <= 2) {
          console.warn(
            `[${mode}:scene-generator] ⚠ Duration is close but not exact (diff: ${finalDiff}s). Accepting result.`
          );
        }
      } else {
        // If can't fix but difference is small (≤5s), accept it with warning
        if (durationDiff <= 5) {
          console.warn(
            `[${mode}:scene-generator] ⚠ Could not automatically fix duration, but difference is small (${durationDiff}s). Accepting result.`
          );
        } else {
          console.warn(
            `[${mode}:scene-generator] ⚠ Could not automatically fix duration. Difference: ${durationDiff}s`
          );
          // Only throw error if difference is significant
          throw new Error(
            `Duration mismatch: expected ${expectedDuration}s, got ${totalDuration}s (difference: ${durationDiff}s)`
          );
        }
      }
    } else if (durationDiff > 10) {
      // Too large to fix automatically
      throw new Error(
        `Duration mismatch too large: expected ${expectedDuration}s, got ${totalDuration}s (difference: ${durationDiff}s)`
      );
    }

    // Validate model constraints
    if (modelConstraints) {
      for (const scene of parsed.scenes) {
        if (!modelConstraints.supportedDurations.includes(scene.duration)) {
          throw new Error(
            `Invalid duration ${scene.duration}s for scene ${scene.sceneNumber}. ` +
            `Must be one of: [${modelConstraints.supportedDurations.join(', ')}]`
          );
        }
      }
    }

    // Validate word counts (skip for auto-asmr mode - no narration)
    if (mode !== 'auto-asmr') {
      const isArabic = /[\u0600-\u06FF]/.test(parsed.scenes[0]?.narration || '');
      const wordsPerSecond = isArabic ? 2.0 : 2.5;

      for (const scene of parsed.scenes) {
        const wordCount = (scene.narration || '').split(/\s+/).filter((w: string) => w.length > 0).length;
        const expectedWords = Math.round(scene.duration * wordsPerSecond);
        const tolerance = Math.round(expectedWords * 0.2); // 20% tolerance

        if (wordCount > expectedWords + tolerance) {
          console.warn(
            `[${mode}:scene-generator] Scene ${scene.sceneNumber}: Too many words (${wordCount} vs expected ~${expectedWords})`
          );
        }
      }
    }
  }

  /**
   * Generate scenes from story text
   */
  async function generateScenes(
    input: any,
    userId?: string,
    workspaceId?: string,
    usageType?: string,
    usageMode?: string
  ): Promise<any> {
    const { storyText, duration, pacing, videoModel } = input;

    // Validate input
    validateInput(input);

    // Get video model constraints for duration limits
    const modelId = videoModel || getDefaultVideoModel().id;
    const modelConstraints = getVideoModelConstraints(modelId);
    
    // Calculate optimal scene count based on duration (and pacing if available)
    // For auto-asmr, pacing is not used
    const sceneCount = mode === 'auto-asmr' 
      ? getOptimalSceneCount(duration)
      : getOptimalSceneCount(duration, pacing);
    
    console.log(`[${mode}:scene-generator] ═══════════════════════════════════════════════`);
    console.log(`[${mode}:scene-generator] Generating scenes`);
    console.log(`[${mode}:scene-generator] ═══════════════════════════════════════════════`);
    console.log(`[${mode}:scene-generator] Duration:`, duration, 'seconds');
    if (mode !== 'auto-asmr') {
      console.log(`[${mode}:scene-generator] Pacing:`, pacing);
    }
    console.log(`[${mode}:scene-generator] Target scene count:`, sceneCount);
    console.log(`[${mode}:scene-generator] Story length:`, storyText.length, 'characters');
    console.log(`[${mode}:scene-generator] Video model:`, modelId);
    console.log(`[${mode}:scene-generator] Supported durations:`, modelConstraints?.supportedDurations || 'default');

    // Build prompts
    // For auto-asmr, pacing parameter is not used
    const systemPrompt = mode === 'auto-asmr'
      ? buildSceneBreakdownSystemPrompt(duration, sceneCount, modelConstraints)
      : buildSceneBreakdownSystemPrompt(duration, sceneCount, pacing, modelConstraints);
    
    const userPrompt = mode === 'auto-asmr'
      ? buildSceneUserPrompt(storyText, duration, modelConstraints)
      : buildSceneUserPrompt(storyText, duration, pacing);

    const schema = buildSceneSchema(sceneCount, duration, modelConstraints);

  try {
    const response = await callTextModel(
      {
        provider: SCENE_CONFIG.provider,
        model: SCENE_CONFIG.model,
        payload: {
          input: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "scene_output",
              strict: true,
              schema: schema,
            },
          },
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: 800,
        metadata: { usageType, usageMode },
      }
    );

    // Parse the JSON response
    let parsed: any;
    try {
      parsed = JSON.parse(response.output.trim());
      } catch (parseError) {
        console.error(`[${mode}:scene-generator] JSON parse error:`, parseError);
        throw new Error("Invalid JSON response from model");
      }

      // Validate output
      validateOutput(parsed, sceneCount, duration, modelConstraints);

      // Validate and fix scene numbers
      parsed.scenes = parsed.scenes.map((scene: any, index: number) => ({
        ...scene,
        sceneNumber: index + 1, // Ensure sequential numbering
      }));

      const totalDuration = parsed.scenes.reduce(
        (sum: number, s: any) => sum + s.duration,
        0
      );

      console.log(`[${mode}:scene-generator] ═══════════════════════════════════════════════`);
      console.log(`[${mode}:scene-generator] ✓ Scenes generated successfully`);
      console.log(`[${mode}:scene-generator] ═══════════════════════════════════════════════`);
      console.log(`[${mode}:scene-generator] Scene count:`, parsed.scenes.length);
      console.log(`[${mode}:scene-generator] Total duration:`, totalDuration, 'seconds');
      console.log(`[${mode}:scene-generator] Cost:`, `$${response.usage?.totalCostUsd?.toFixed(4) || '0.0000'}`);

    return {
      scenes: parsed.scenes,
      totalScenes: parsed.scenes.length,
      totalDuration: parsed.totalDuration || totalDuration,
      cost: response.usage?.totalCostUsd,
    };
    } catch (error) {
      console.error(`[${mode}:scene-generator] ═══════════════════════════════════════════════`);
      console.error(`[${mode}:scene-generator] ✗ Scene generation failed`);
      console.error(`[${mode}:scene-generator] ═══════════════════════════════════════════════`);
      console.error(`[${mode}:scene-generator] Error:`, error);
      
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          throw new Error("Rate limit exceeded. Please try again in a moment.");
        }
        if (error.message.includes('insufficient credits')) {
          throw new Error("Insufficient credits. Please check your account balance.");
        }
        throw new Error(`Failed to generate scenes: ${error.message}`);
      }
      
      throw new Error("Failed to generate scenes: Unknown error occurred");
    }
  }

  return generateScenes;
}

/**
 * Generate scenes from story text (backward compatibility - uses problem-solution mode by default)
 */
export async function generateScenes(
  input: any,
  userId?: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<any> {
  const generator = await createSceneGenerator("problem-solution");
  return generator(input, userId, workspaceId, usageType, usageMode);
}

