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
import {
  buildMusicPrompt,
  calculateMusicDuration,
  isValidMusicStyle,
  type MusicStyle,
} from "../prompts/music-prompts";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface MusicGeneratorInput {
  musicStyle: MusicStyle;
  durationMs: number;           // Video duration in milliseconds
  storyTopic?: string;          // Story topic for context
  storyNarration?: string;      // Full story narration for deep understanding
  projectName: string;
  workspaceId: string;
}

export interface MusicGeneratorOutput {
  musicUrl: string;             // CDN URL
  durationMs: number;           // Actual duration
  cost: number;                 // Cost in USD
  style: MusicStyle;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate AI background music using ElevenLabs Music API
 * 
 * @param input - Music generation parameters
 * @param userId - User ID for storage path and billing
 * @param workspaceName - Workspace name for storage path
 * @returns Generated music URL and metadata
 */
export async function generateMusic(
  input: MusicGeneratorInput,
  userId: string,
  workspaceName: string
): Promise<MusicGeneratorOutput> {
  const { musicStyle, durationMs, storyTopic, storyNarration, projectName, workspaceId } = input;

  // Validate style
  if (!isValidMusicStyle(musicStyle)) {
    throw new Error(`Invalid music style: ${musicStyle}`);
  }

  // Skip if no music
  if (musicStyle === 'none') {
    console.log('[music-generator] Music disabled, skipping generation');
    return {
      musicUrl: '',
      durationMs: 0,
      cost: 0,
      style: 'none',
    };
  }

  console.log('[music-generator] ═══════════════════════════════════════════════');
  console.log('[music-generator] Starting music generation');
  console.log('[music-generator] ═══════════════════════════════════════════════');
  console.log('[music-generator] Style:', musicStyle);
  console.log('[music-generator] Duration:', durationMs, 'ms');
  console.log('[music-generator] Topic:', storyTopic || 'N/A');
  console.log('[music-generator] Has story narration:', !!storyNarration);

  // Calculate actual music duration (with buffer, clamped to limits)
  const musicDurationSeconds = calculateMusicDuration(durationMs / 1000);
  const musicDurationMs = musicDurationSeconds * 1000;

  console.log('[music-generator] Calculated duration:', musicDurationSeconds, 'seconds');

  // Build the enhanced prompt with story understanding
  const prompt = buildMusicPrompt(musicStyle, {
    storyTopic,
    storyNarration,  // Pass full narration for context analysis
    duration: musicDurationSeconds,
  });

  console.log('[music-generator] Prompt length:', prompt.length, 'characters');
  console.log('[music-generator] Prompt preview:', prompt.substring(0, 150) + '...');

  try {
    // Call ElevenLabs Music API
    console.log('[music-generator] Calling ElevenLabs Music API...');
    
    const response = await callAi(
      {
        provider: "elevenlabs",
        model: "music-v1",
        task: "music-generation",
        payload: {
          prompt,
          music_length_ms: musicDurationMs,
          force_instrumental: true,      // Always instrumental
          output_format: "mp3_44100_128", // High quality MP3
        },
        userId,
        workspaceId,
      },
      {
        skipCreditCheck: false,
      }
    );

    // Get audio buffer
    const audioBuffer = response.output as Buffer;
    
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error("Empty audio buffer received from ElevenLabs");
    }

    console.log('[music-generator] Music generated:', {
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
      userId,
      workspaceName,
      toolMode: "problem-solution",
      projectName: truncatedProjectName,
      subfolder: "Music",
      filename: filename,
    });

    console.log('[music-generator] Uploading to CDN...');

    const cdnUrl = await bunnyStorage.uploadFile(
      bunnyPath,
      audioBuffer,
      "audio/mpeg"
    );

    const cost = response.usage?.totalCostUsd || 0;

    console.log('[music-generator] ═══════════════════════════════════════════════');
    console.log('[music-generator] ✓ Music generation complete!');
    console.log('[music-generator] ═══════════════════════════════════════════════');
    console.log('[music-generator] URL:', cdnUrl);
    console.log('[music-generator] Duration:', musicDurationSeconds, 's');
    console.log('[music-generator] Cost:', `$${cost.toFixed(4)}`);

    return {
      musicUrl: cdnUrl,
      durationMs: musicDurationMs,
      cost,
      style: musicStyle,
    };

  } catch (error) {
    console.error('[music-generator] Generation failed:', error);
    throw error;
  }
}

