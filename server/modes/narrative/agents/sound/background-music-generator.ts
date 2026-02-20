/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NARRATIVE MODE - BACKGROUND MUSIC GENERATOR AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates AI background music using ElevenLabs Music API.
 * Creates cinematic music that complements the narrative storytelling.
 * 
 * FLOW:
 * 1. Analyze video context (genre, tone, scenes)
 * 2. Generate detailed music prompt using OpenAI
 * 3. Call ElevenLabs Music API to generate audio
 * 4. Upload to Bunny CDN
 * 5. Return URL and metadata
 */

import { callAi, callTextModel } from "../../../../ai/service";
import { bunnyStorage, buildVideoModePath } from "../../../../storage/bunny-storage";
import type { NarrativeBackgroundMusicInput, MusicStyle } from "../../types";

const MUSIC_CONFIG = {
  provider: "elevenlabs" as const,
  model: "music-v1",
  openAiProvider: "openai" as const,
  openAiModel: "gpt-5",
  maxRetries: 2,
  // ElevenLabs music duration limits (in seconds)
  minDuration: 15,
  maxDuration: 330, // 5.5 minutes
};

interface BackgroundMusicGeneratorOutput {
  musicUrl: string;
  duration: number;
  style: MusicStyle;
  cost?: number;
}

/**
 * System prompt for generating music prompts
 */
const MUSIC_PROMPT_SYSTEM_PROMPT = `You are an expert film composer and music supervisor. Your task is to create detailed, evocative prompts for AI music generation that will serve as cinematic background music for narrative films.

Your prompts should describe:
- Overall mood and emotional journey
- Instrumentation (strings, piano, electronic, orchestral, etc.)
- Tempo and rhythm characteristics
- Dynamic arc (builds, crescendos, quiet moments)
- Reference styles or influences (without naming specific artists)

Keep prompts focused, specific, and under 500 characters. Always specify "instrumental only" to avoid vocals.

Example output:
"Cinematic orchestral score, sweeping strings with subtle piano accents. Starts contemplative and builds to an emotional crescendo. Moderate tempo with dramatic pauses. Influences: modern film scores, epic fantasy soundtracks. Instrumental only."`;

/**
 * Build a music prompt based on video context
 */
function buildMusicPromptUserPrompt(input: {
  musicStyle: MusicStyle;
  genre?: string;
  tone?: string;
  duration: number;
  script?: string;
  sceneDescriptions?: string[];
}): string {
  const styleMappings: Record<MusicStyle, string> = {
    cinematic: 'Epic, sweeping orchestral with dramatic builds and emotional depth',
    upbeat: 'Energetic, positive, driving rhythm with modern production',
    calm: 'Gentle, soothing, minimalist with soft textures',
    dramatic: 'Intense, tension-building with powerful crescendos',
    mysterious: 'Atmospheric, enigmatic, sparse with subtle dissonance',
    epic: 'Grand, heroic, full orchestra with triumphant themes',
    romantic: 'Tender, emotional, strings-focused with heartfelt melodies',
    suspenseful: 'Tense, edge-of-seat, building anticipation with sharp accents',
    inspirational: 'Uplifting, hopeful, building from soft to triumphant',
    melancholic: 'Bittersweet, reflective, gentle piano with subtle strings',
  };

  const styleDescription = styleMappings[input.musicStyle] || styleMappings.cinematic;
  const durationMinutes = Math.ceil(input.duration / 60);

  let prompt = `Create a music prompt for a ${durationMinutes}-minute narrative video.

STYLE: ${input.musicStyle}
STYLE DESCRIPTION: ${styleDescription}`;

  if (input.genre) {
    prompt += `\nGENRE: ${input.genre}`;
  }
  if (input.tone) {
    prompt += `\nTONE: ${input.tone}`;
  }
  if (input.script) {
    const truncatedScript = input.script.substring(0, 300);
    prompt += `\n\nSTORY CONTEXT:\n${truncatedScript}${input.script.length > 300 ? '...' : ''}`;
  }
  if (input.sceneDescriptions && input.sceneDescriptions.length > 0) {
    prompt += `\n\nSCENE FLOW:\n${input.sceneDescriptions.slice(0, 5).join('\n')}`;
  }

  prompt += `\n\nGenerate a detailed music prompt (under 500 characters) that captures this mood and supports the narrative. Specify instrumental only.`;

  return prompt;
}

/**
 * Build a direct music prompt without AI (fallback)
 */
function buildDirectMusicPrompt(input: {
  musicStyle: MusicStyle;
  genre?: string;
  duration: number;
}): string {
  const stylePrompts: Record<MusicStyle, string> = {
    cinematic: 'Cinematic orchestral score with sweeping strings, dramatic piano, and building emotional crescendos. Modern film score influences. Instrumental only.',
    upbeat: 'Upbeat, energetic track with driving rhythm, positive synths, and modern pop production. Feel-good vibes. Instrumental only.',
    calm: 'Gentle ambient track with soft piano, subtle strings, and peaceful atmosphere. Relaxing and contemplative. Instrumental only.',
    dramatic: 'Dramatic orchestral piece with intense percussion, powerful brass, and tension-building strings. Epic and impactful. Instrumental only.',
    mysterious: 'Atmospheric, enigmatic composition with sparse textures, subtle dissonance, and haunting melodies. Intriguing and suspenseful. Instrumental only.',
    epic: 'Grand, heroic orchestral score with triumphant brass, soaring strings, and powerful percussion. Inspiring and majestic. Instrumental only.',
    romantic: 'Tender romantic piece with emotive strings, gentle piano, and heartfelt melodies. Warm and emotional. Instrumental only.',
    suspenseful: 'Tense, suspenseful track with building anticipation, sharp accents, and nervous energy. Edge-of-seat atmosphere. Instrumental only.',
    inspirational: 'Uplifting, inspirational composition building from gentle beginnings to triumphant heights. Hopeful and moving. Instrumental only.',
    melancholic: 'Bittersweet, reflective piece with gentle piano, subtle strings, and a sense of longing. Emotional and introspective. Instrumental only.',
  };

  return stylePrompts[input.musicStyle] || stylePrompts.cinematic;
}

/**
 * Calculate optimal music duration
 */
function calculateMusicDuration(totalVideoDuration: number): number {
  // Add 10% buffer, clamp to ElevenLabs limits
  const withBuffer = Math.ceil(totalVideoDuration * 1.1);
  return Math.max(MUSIC_CONFIG.minDuration, Math.min(MUSIC_CONFIG.maxDuration, withBuffer));
}

/**
 * Validate music style
 */
function isValidMusicStyle(style: string): style is MusicStyle {
  const validStyles: MusicStyle[] = [
    'cinematic', 'upbeat', 'calm', 'dramatic', 'mysterious',
    'epic', 'romantic', 'suspenseful', 'inspirational', 'melancholic'
  ];
  return validStyles.includes(style as MusicStyle);
}

/**
 * Generate background music for narrative visual content.
 * 
 * @param input - Music style and video context
 * @returns Music URL, duration, and cost
 */
export async function generateNarrativeBackgroundMusic(
  input: NarrativeBackgroundMusicInput,
  usageType?: string,
  usageMode?: string
): Promise<BackgroundMusicGeneratorOutput> {
  const {
    musicStyle,
    totalDuration,
    genre,
    tone,
    script,
    scenes,
    videoId,
    videoTitle,
    userId,
    workspaceId,
    workspaceName,
  } = input;

  console.log('[narrative:background-music] ═══════════════════════════════════════════════');
  console.log('[narrative:background-music] Starting music generation');
  console.log('[narrative:background-music] ═══════════════════════════════════════════════');
  console.log('[narrative:background-music] Style:', musicStyle);
  console.log('[narrative:background-music] Genre:', genre);
  console.log('[narrative:background-music] Tone:', tone);
  console.log('[narrative:background-music] Total Duration:', totalDuration, 'seconds');

  // Validate style
  if (!isValidMusicStyle(musicStyle)) {
    throw new Error(`Invalid music style: ${musicStyle}`);
  }

  // Calculate optimal music duration
  const musicDurationSeconds = calculateMusicDuration(totalDuration);
  const musicDurationMs = musicDurationSeconds * 1000;

  console.log('[narrative:background-music] Calculated music duration:', musicDurationSeconds, 'seconds');

  let totalCost = 0;
  let musicPrompt: string;

  // Step 1: Generate detailed music prompt using OpenAI
  try {
    console.log('[narrative:background-music] Generating music prompt with OpenAI...');
    
    const userPrompt = buildMusicPromptUserPrompt({
      musicStyle,
      genre,
      tone,
      duration: musicDurationSeconds,
      script,
      sceneDescriptions: scenes?.map(s => s.description || s.title).filter(Boolean) as string[],
    });
    
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
        metadata: { usageType, usageMode },
      }
    );

    musicPrompt = promptResponse.output.trim();
    totalCost += promptResponse.usage?.totalCostUsd || 0;

    console.log('[narrative:background-music] Generated prompt:', musicPrompt.substring(0, 200) + '...');

  } catch (promptError) {
    console.warn('[narrative:background-music] OpenAI prompt generation failed, using direct prompt:', promptError);
    musicPrompt = buildDirectMusicPrompt({ musicStyle, genre, duration: musicDurationSeconds });
  }

  // Step 2: Call ElevenLabs Music API
  console.log('[narrative:background-music] Calling ElevenLabs Music API...');
  console.log('[narrative:background-music] Duration:', musicDurationMs, 'ms');

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
          force_instrumental: true,
          output_format: "mp3_44100_192",
        },
        userId,
        workspaceId,
      },
      {
        skipCreditCheck: false,
        metadata: { usageType, usageMode },
      }
    );

    audioBuffer = musicResponse.output as Buffer;
    totalCost += musicResponse.usage?.totalCostUsd || 0;

    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error("Empty audio buffer received from ElevenLabs");
    }

    console.log('[narrative:background-music] Music generated:', {
      size: `${(audioBuffer.length / 1024).toFixed(2)} KB`,
      duration: `${musicDurationSeconds}s`,
    });

  } catch (musicError) {
    console.error('[narrative:background-music] ElevenLabs Music API failed:', musicError);
    throw new Error(`Music generation failed: ${musicError instanceof Error ? musicError.message : 'Unknown error'}`);
  }

  // Step 3: Upload to Bunny CDN
  console.log('[narrative:background-music] Uploading to Bunny CDN...');

  const truncatedTitle = (videoTitle || 'untitled').slice(0, 50).replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateLabel = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const timestamp = Date.now();
  const filename = `generated_music_${musicStyle}_${timestamp}.mp3`;

  const bunnyPath = buildVideoModePath({
    userId,
    workspaceName,
    toolMode: "narrative",
    projectName: truncatedTitle,
    subFolder: "Background-Music",
    filename,
    dateLabel,
  });

  console.log('[narrative:background-music] CDN path:', bunnyPath);

  const cdnUrl = await bunnyStorage.uploadFile(
    bunnyPath,
    audioBuffer,
    "audio/mpeg"
  );

  console.log('[narrative:background-music] ═══════════════════════════════════════════════');
  console.log('[narrative:background-music] ✓ Music generation complete!');
  console.log('[narrative:background-music] ═══════════════════════════════════════════════');
  console.log('[narrative:background-music] URL:', cdnUrl);
  console.log('[narrative:background-music] Duration:', musicDurationSeconds, 's');
  console.log('[narrative:background-music] Total Cost:', `$${totalCost.toFixed(4)}`);

  return {
    musicUrl: cdnUrl,
    duration: musicDurationSeconds,
    style: musicStyle,
    cost: totalCost,
  };
}









