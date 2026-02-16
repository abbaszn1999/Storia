/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MUSIC GENERATION AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates AI background music using ElevenLabs Music API.
 * Creates story-aware music that complements the narrative.
 * 
 * INPUT:
 * - musicStyle: The selected music style (e.g., "cinematic", "upbeat")
 * - durationMs: Total duration in milliseconds
 * - storyTopic: Topic for context-aware prompt
 * - storyNarration: Full story text for deep understanding (NEW)
 * 
 * OUTPUT:
 * - musicUrl: CDN URL to the generated music file
 * - durationMs: Actual duration of generated music
 * - cost: Generation cost in USD
 * 
 * FLOW:
 * 1. Analyze story content for musical context
 * 2. Build enhanced prompt from style + story understanding
 * 3. Call ElevenLabs Music API
 * 4. Upload to Bunny CDN
 * 5. Return URL
 */

import { callAi } from "../../../ai/service";
import { bunnyStorage, buildStoryModePath } from "../../../storage/bunny-storage";
import type { StoryMode } from "./idea-generator";
import { getMusicPrompts } from "../prompts-loader";
import type { StoryModeForPrompts } from "../prompts-loader";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create music generator function for a specific story mode
 * 
 * @param mode - Story mode (problem-solution, before-after, myth-busting, tease-reveal)
 * @returns generateMusic function configured for the specified mode
 */
export async function createMusicGenerator(mode: StoryMode) {
  const modeForPrompts = mode as StoryModeForPrompts;
  const musicPromptsModule = getMusicPrompts(modeForPrompts);

  const {
    buildMusicPrompt,
    calculateMusicDuration,
    isValidMusicStyle,
  } = musicPromptsModule;
  type MusicStyle = any;

  /**
   * Generate AI background music
   */
  async function generateMusic(
    input: any,
    userId?: string,
    workspaceName?: string,
    usageType?: string,
    usageMode?: string
  ): Promise<any> {
    const { musicStyle, durationMs, storyTopic, storyNarration, projectName, workspaceId } = input;

    // Validate style
    if (!isValidMusicStyle(musicStyle)) {
      throw new Error(`Invalid music style: ${musicStyle}`);
    }

    // Skip if no music
    if (musicStyle === 'none') {
      console.log(`[${mode}:music-generator] Music disabled, skipping generation`);
      return {
        musicUrl: '',
        durationMs: 0,
        cost: 0,
        style: 'none',
      };
    }

    console.log(`[${mode}:music-generator] ═══════════════════════════════════════════════`);
    console.log(`[${mode}:music-generator] Starting music generation`);
    console.log(`[${mode}:music-generator] ═══════════════════════════════════════════════`);
    console.log(`[${mode}:music-generator] Style:`, musicStyle);
    console.log(`[${mode}:music-generator] Duration:`, durationMs, `ms`);
    console.log(`[${mode}:music-generator] Topic:`, storyTopic || 'N/A');
    console.log(`[${mode}:music-generator] Has story narration:`, !!storyNarration);

    // Calculate actual music duration (with buffer, clamped to limits)
    const musicDurationSeconds = calculateMusicDuration(durationMs / 1000);
    const musicDurationMs = musicDurationSeconds * 1000;

    console.log(`[${mode}:music-generator] Calculated duration:`, musicDurationSeconds, `seconds`);

    // Build the enhanced prompt with story understanding
    const prompt = buildMusicPrompt(musicStyle, {
      storyTopic,
      storyNarration,  // Pass full narration for context analysis
      duration: musicDurationSeconds,
    });

    console.log(`[${mode}:music-generator] Prompt length:`, prompt.length, `characters`);
    console.log(`[${mode}:music-generator] Prompt preview:`, prompt.substring(0, 150) + '...');

    try {
      // Call ElevenLabs Music API
      console.log(`[${mode}:music-generator] Calling ElevenLabs Music API...`);
      
      const response = await callAi(
        {
          provider: "elevenlabs",
          model: "music-v1",
          task: "music-generation",
          payload: {
            prompt,
            music_length_ms: musicDurationMs,
            force_instrumental: true,      // Always instrumental
            output_format: "mp3_44100_192", // High quality MP3
          },
          userId,
          workspaceId,
        },
        {
          skipCreditCheck: false,
          metadata: { usageType, usageMode },
        }
      );

      // Get audio buffer
      const audioBuffer = response.output as Buffer;
      
      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error("Empty audio buffer received from ElevenLabs");
      }

      console.log(`[${mode}:music-generator] Music generated:`, {
        size: `${(audioBuffer.length / 1024).toFixed(2)} KB`,
        duration: `${musicDurationSeconds}s`,
      });

      // Upload to Bunny CDN
      const timestamp = Date.now();
      const filename = `music_${musicStyle}_${timestamp}.mp3`;
      
      // Truncate project name to avoid path issues
      const truncatedProjectName = projectName.length > 50 
        ? projectName.substring(0, 50) 
        : projectName;

      const bunnyPath = buildStoryModePath({
        userId: userId || "",
        workspaceName: workspaceName || "",
        toolMode: mode,
        projectName: truncatedProjectName,
        subfolder: "Music",
        filename: filename,
      });

      console.log(`[${mode}:music-generator] Uploading to CDN...`);

      const cdnUrl = await bunnyStorage.uploadFile(
        bunnyPath,
        audioBuffer,
        "audio/mpeg"
      );

      const cost = response.usage?.totalCostUsd || 0;

      console.log(`[${mode}:music-generator] ═══════════════════════════════════════════════`);
      console.log(`[${mode}:music-generator] ✓ Music generation complete!`);
      console.log(`[${mode}:music-generator] ═══════════════════════════════════════════════`);
      console.log(`[${mode}:music-generator] URL:`, cdnUrl);
      console.log(`[${mode}:music-generator] Duration:`, musicDurationSeconds, `s`);
      console.log(`[${mode}:music-generator] Cost:`, `$${cost.toFixed(4)}`);

      return {
        musicUrl: cdnUrl,
        durationMs: musicDurationMs,
        cost,
        style: musicStyle,
      };

    } catch (error) {
      console.error(`[${mode}:music-generator] Generation failed:`, error);
      throw error;
    }
  }

  return generateMusic;
}

/**
 * Generate music (backward compatibility - uses problem-solution mode by default)
 */
export async function generateMusic(
  input: any,
  userId?: string,
  workspaceName?: string,
  usageType?: string,
  usageMode?: string
): Promise<any> {
  const generator = await createMusicGenerator("problem-solution");
  return generator(input, userId, workspaceName, usageType, usageMode);
}

