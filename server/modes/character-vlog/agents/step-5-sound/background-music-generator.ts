/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHARACTER VLOG - BACKGROUND MUSIC GENERATOR AGENT (Agent 5.4)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates AI background music using ElevenLabs Music API.
 * Creates atmospheric music that complements the character vlog experience.
 * 
 * FLOW:
 * 1. Analyze video context (personality, theme, scenes)
 * 2. Generate detailed music prompt using OpenAI
 * 3. Call ElevenLabs Music API to generate audio
 * 4. Upload to Bunny CDN
 * 5. Return URL and metadata
 */

import { callAi, callTextModel } from "../../../../ai/service";
import { bunnyStorage, buildVideoModePath } from "../../../../storage/bunny-storage";
import type {
  BackgroundMusicGeneratorInput,
  BackgroundMusicGeneratorOutput,
  MusicStyle,
} from "../../types";
import {
  MUSIC_PROMPT_SYSTEM_PROMPT,
  buildMusicPromptUserPrompt,
  buildDirectMusicPrompt,
  calculateMusicDuration,
  isValidMusicStyle,
  type MusicPromptGeneratorInput,
} from "../../prompts/step-5-sound/background-music-prompts";

const MUSIC_CONFIG = {
  provider: "elevenlabs" as const,
  model: "music-v1",
  openAiProvider: "openai" as const,
  openAiModel: "gpt-5",  // For prompt generation
  maxRetries: 2,
};

/**
 * Generate background music for character vlog content.
 * 
 * @param input - Music style and video context
 * @returns Music URL, duration, and cost
 */
export async function generateBackgroundMusic(
  input: BackgroundMusicGeneratorInput
): Promise<BackgroundMusicGeneratorOutput> {
  const {
    musicStyle,
    theme,
    characterPersonality,
    genres,
    tones,
    totalDuration,
    scenes,
    videoId,
    videoTitle,
    videoCreatedAt,
    userId,
    workspaceId,
    workspaceName,
  } = input;

  console.log('[character-vlog:background-music] ═══════════════════════════════════════════════');
  console.log('[character-vlog:background-music] Starting music generation');
  console.log('[character-vlog:background-music] ═══════════════════════════════════════════════');
  console.log('[character-vlog:background-music] Style:', musicStyle);
  console.log('[character-vlog:background-music] Theme:', theme);
  console.log('[character-vlog:background-music] Character Personality:', characterPersonality);
  console.log('[character-vlog:background-music] Total Duration:', totalDuration, 'seconds');
  console.log('[character-vlog:background-music] Scenes:', scenes?.length || 0);

  // Validate style
  if (!isValidMusicStyle(musicStyle)) {
    throw new Error(`Invalid music style: ${musicStyle}`);
  }

  // Calculate optimal music duration (with buffer, clamped to ElevenLabs limits)
  const musicDurationSeconds = calculateMusicDuration(totalDuration);
  const musicDurationMs = musicDurationSeconds * 1000;

  console.log('[character-vlog:background-music] Calculated music duration:', musicDurationSeconds, 'seconds');

  // Build prompt generator input
  const promptInput: MusicPromptGeneratorInput = {
    musicStyle,
    theme,
    characterPersonality,
    genres,
    tones,
    duration: musicDurationSeconds,
    sceneDescriptions: scenes?.map(s => s.description || s.title).filter(Boolean) as string[],
  };

  let totalCost = 0;
  let musicPrompt: string;

  // Step 1: Generate detailed music prompt using OpenAI
  try {
    console.log('[character-vlog:background-music] Generating music prompt with OpenAI...');
    
    const userPrompt = buildMusicPromptUserPrompt(promptInput);
    
    const promptResponse = await callTextModel(
      {
        provider: MUSIC_CONFIG.openAiProvider,
        model: MUSIC_CONFIG.openAiModel,
        payload: {
          reasoning: { effort: "low" },
          input: [
            { role: "system", content: MUSIC_PROMPT_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: 500,
      }
    );

    musicPrompt = promptResponse.output.trim();
    totalCost += promptResponse.usage?.totalCostUsd || 0;

    console.log('[character-vlog:background-music] Generated prompt:', musicPrompt.substring(0, 200) + '...');
    console.log('[character-vlog:background-music] Prompt generation cost: $' + (promptResponse.usage?.totalCostUsd || 0).toFixed(4));

  } catch (promptError) {
    console.warn('[character-vlog:background-music] OpenAI prompt generation failed, using direct prompt:', promptError);
    // Fallback to direct prompt builder
    musicPrompt = buildDirectMusicPrompt(promptInput);
    console.log('[character-vlog:background-music] Using fallback prompt:', musicPrompt.substring(0, 200) + '...');
  }

  // Step 2: Call ElevenLabs Music API
  console.log('[character-vlog:background-music] Calling ElevenLabs Music API...');
  console.log('[character-vlog:background-music] Duration:', musicDurationMs, 'ms');

  let audioBuffer: Buffer;

  try {
    const musicResponse = await callAi(
      {
        provider: MUSIC_CONFIG.provider,
        model: MUSIC_CONFIG.model,
        task: "music-generation",
        payload: {
          prompt: musicPrompt,
          music_length_ms: musicDurationMs,
          force_instrumental: true,      // Always instrumental
          output_format: "mp3_44100_192", // High quality MP3
        },
        userId,
        workspaceId,
      },
      {
        skipCreditCheck: false,
      }
    );

    audioBuffer = musicResponse.output as Buffer;
    totalCost += musicResponse.usage?.totalCostUsd || 0;

    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error("Empty audio buffer received from ElevenLabs");
    }

    console.log('[character-vlog:background-music] Music generated:', {
      size: `${(audioBuffer.length / 1024).toFixed(2)} KB`,
      duration: `${musicDurationSeconds}s`,
      cost: `$${(musicResponse.usage?.totalCostUsd || 0).toFixed(4)}`,
    });

  } catch (musicError) {
    console.error('[character-vlog:background-music] ElevenLabs Music API failed:', musicError);
    throw new Error(`Music generation failed: ${musicError instanceof Error ? musicError.message : 'Unknown error'}`);
  }

  // Step 3: Upload to Bunny CDN
  console.log('[character-vlog:background-music] Uploading to Bunny CDN...');

  // Build path
  const truncatedTitle = (videoTitle || 'untitled').slice(0, 50).replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateLabel = videoCreatedAt
    ? new Date(typeof videoCreatedAt === 'string' ? videoCreatedAt : videoCreatedAt.toISOString()).toISOString().slice(0, 10).replace(/-/g, "")
    : new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const timestamp = Date.now();
  const filename = `generated_music_${musicStyle}_${timestamp}.mp3`;

  const bunnyPath = buildVideoModePath({
    userId,
    workspaceName,
    toolMode: "vlog",
    projectName: truncatedTitle,
    subFolder: "Background-Music",
    filename,
    dateLabel,
  });

  console.log('[character-vlog:background-music] CDN path:', bunnyPath);

  const cdnUrl = await bunnyStorage.uploadFile(
    bunnyPath,
    audioBuffer,
    "audio/mpeg"
  );

  console.log('[character-vlog:background-music] ═══════════════════════════════════════════════');
  console.log('[character-vlog:background-music] ✓ Music generation complete!');
  console.log('[character-vlog:background-music] ═══════════════════════════════════════════════');
  console.log('[character-vlog:background-music] URL:', cdnUrl);
  console.log('[character-vlog:background-music] Duration:', musicDurationSeconds, 's');
  console.log('[character-vlog:background-music] Total Cost:', `$${totalCost.toFixed(4)}`);

  return {
    musicUrl: cdnUrl,
    duration: musicDurationSeconds,
    style: musicStyle,
    cost: totalCost,
  };
}
