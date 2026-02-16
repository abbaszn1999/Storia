// Voiceover Generation Agent
// Generates voiceover audio using ElevenLabs TTS with batch processing
// Supports ElevenLabs v3 audio tags and dynamic stability settings
// Works with all story modes: problem-solution, before-after, myth-busting, tease-reveal

import { callAi } from "../../../ai/service";
import { bunnyStorage, buildStoryModePath } from "../../../storage/bunny-storage";
import { getAudioDurationFromUrl } from "../services/ffmpeg-helpers";
import type { StoryMode } from "./idea-generator";

/**
 * Create voiceover generator function for a specific story mode
 * 
 * @param mode - Story mode (problem-solution, before-after, myth-busting, tease-reveal)
 * @returns generateVoiceover function configured for the specified mode
 */
export async function createVoiceoverGenerator(mode: StoryMode) {
  // All story modes use the same types from shared
  const typesModule = await import(`../types`);
  
  // Types will be inferred from usage
  type VoiceoverGeneratorInput = any;
  type VoiceoverGeneratorOutput = any;
  type VoiceoverGenerationResult = any;
  type VoiceMood = any;
  type WordTimestamp = any;

  /**
   * Alignment data from ElevenLabs (character-level)
   */
  interface AlignmentData {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  }

  /**
   * Convert character-level timestamps to word-level timestamps
   * Groups characters into words based on spaces
   */
  function convertToWordTimestamps(alignment: AlignmentData): WordTimestamp[] {
  if (!alignment || !alignment.characters || alignment.characters.length === 0) {
    return [];
  }

  const words: WordTimestamp[] = [];
  let currentWord = '';
  let wordStart: number | null = null;
  let wordEnd = 0;

  for (let i = 0; i < alignment.characters.length; i++) {
    const char = alignment.characters[i];
    const startTime = alignment.character_start_times_seconds[i];
    const endTime = alignment.character_end_times_seconds[i];

    // Check if this is a space or newline (word boundary)
    if (char === ' ' || char === '\n' || char === '\r') {
      // Save the current word if we have one
      if (currentWord.trim() && wordStart !== null) {
        words.push({
          word: currentWord.trim(),
          startTime: wordStart,
          endTime: wordEnd,
        });
      }
      // Reset for next word
      currentWord = '';
      wordStart = null;
    } else {
      // Add character to current word
      if (wordStart === null) {
        wordStart = startTime;
      }
      currentWord += char;
      wordEnd = endTime;
    }
  }

  // Don't forget the last word
  if (currentWord.trim() && wordStart !== null) {
    words.push({
      word: currentWord.trim(),
      startTime: wordStart,
      endTime: wordEnd,
    });
  }

    console.log(`[${mode}:voiceover-generator] Converted ${alignment.characters.length} chars → ${words.length} words`);
  
  return words;
}

  /**
   * Voice mood to ElevenLabs v3 audio tag mapping
   * These tags enhance emotional expression in the generated audio
   * 
   * NOTE: ElevenLabs v3 (Alpha) only accepts 3 stability values:
   * - 0.0 = Creative (most expressive, responds to audio tags)
   * - 0.5 = Natural (balanced)
   * - 1.0 = Robust (most stable, less responsive to tags)
   */
  const MOOD_TO_AUDIO_TAGS: Record<VoiceMood, { prefix: string; stability: number }> = {
  neutral: { prefix: '', stability: 0.5 },              // Natural - balanced
  happy: { prefix: '[happy] ', stability: 0.0 },        // Creative - expressive
  sad: { prefix: '[sad] ', stability: 0.5 },            // Natural - emotional but stable
  excited: { prefix: '[excited] ', stability: 0.0 },    // Creative - energetic
  angry: { prefix: '[angry] ', stability: 0.0 },        // Creative - intense
  whisper: { prefix: '[whispers] ', stability: 1.0 },   // Robust - stable whisper
  dramatic: { prefix: '[dramatically] ', stability: 0.0 }, // Creative - theatrical
  curious: { prefix: '[curious] ', stability: 0.5 },    // Natural - wondering
  thoughtful: { prefix: '[thoughtful] ', stability: 0.5 }, // Natural - reflective
  surprised: { prefix: '[surprised] ', stability: 0.0 }, // Creative - expressive
  sarcastic: { prefix: '[sarcastic] ', stability: 0.5 }, // Natural - ironic
  nervous: { prefix: '[nervously] ', stability: 0.0 },  // Creative - anxious
};

  /**
   * Enhance text with ElevenLabs v3 audio tags based on mood
   */
  function enhanceTextWithMood(text: string, mood?: VoiceMood): { enhancedText: string; stability: number } {
  const moodConfig = mood ? MOOD_TO_AUDIO_TAGS[mood] : MOOD_TO_AUDIO_TAGS.neutral;
  
  // Add mood prefix tag
  let enhancedText = moodConfig.prefix + text;
  
  // Add natural pauses for longer sentences (using ... for hesitation)
  // Only for certain moods where pauses enhance delivery
  if (mood === 'thoughtful' || mood === 'sad' || mood === 'nervous') {
    // Add subtle pauses after commas for these moods
    enhancedText = enhancedText.replace(/،\s*/g, '، ... ');
    enhancedText = enhancedText.replace(/,\s*/g, ', ... ');
  }
  
  // Add sighs for sad/thoughtful moods at the end
  if (mood === 'sad') {
    enhancedText = enhancedText + ' [sighs]';
  }
  
  // Add laugh for happy mood if text seems humorous
  if (mood === 'happy' && (text.includes('!') || text.includes('😊'))) {
    enhancedText = enhancedText.replace(/!/, '! [chuckles]');
  }
  
    console.log(`[${mode}:voiceover-generator] Enhanced text with mood "${mood || 'neutral'}": stability=${moodConfig.stability}`);
  
  return {
    enhancedText,
    stability: moodConfig.stability,
  };
}

  /**
   * Generate voiceover audio for a single scene with retry logic
   */
  async function generateSceneVoiceover(
    scene: VoiceoverGeneratorInput['scenes'][0],
    voiceId: string,
    userId: string,
    workspaceId: string,
    workspaceName: string,
    projectName: string,
    maxRetries = 2
  ): Promise<VoiceoverGenerationResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
          console.log(`[${mode}:voiceover-generator] Retry ${attempt}/${maxRetries} for Scene ${scene.sceneNumber}`);
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }

        console.log(`[${mode}:voiceover-generator] Generating Scene ${scene.sceneNumber}...`);

      // Prepare base text with voice instructions
      const baseText = scene.voiceInstructions
        ? `${scene.voiceInstructions}\n\n${scene.narration}`
        : scene.narration;

      // Validate text
      if (!baseText || baseText.trim().length === 0) {
        throw new Error("Empty narration text");
      }

      // Enhance text with ElevenLabs v3 audio tags based on mood
      const voiceMood = (scene as any).voiceMood as VoiceMood | undefined;
      const { enhancedText, stability } = enhanceTextWithMood(baseText, voiceMood);
      
        console.log(`[${mode}:voiceover-generator] Scene ${scene.sceneNumber} mood: ${voiceMood || 'neutral'}, stability: ${stability}`);

      // Call ElevenLabs TTS with timestamps for synchronized subtitles
      const response = await callAi(
        {
          provider: "elevenlabs",
          model: "eleven-v3",
          task: "text-to-speech",
          payload: {
            text: enhancedText,
            voice_id: voiceId,
            model_id: "eleven_v3",  // Latest model with richest emotional expression (70+ languages)
            with_timestamps: true,  // ← Request word-level timestamps!
            voice_settings: {
              stability: stability,           // Dynamic stability based on mood
              similarity_boost: 0.75,
              style: voiceMood === 'dramatic' ? 0.3 : 0,  // More style for dramatic scenes
              use_speaker_boost: true,
            },
          },
          userId,
          workspaceId,
        },
        {
          skipCreditCheck: false,
          metadata: { usageType, usageMode },
        }
      );

      // Get audio buffer and alignment data
      let audioBuffer: Buffer;
      let wordTimestamps: WordTimestamp[] = [];
      
      const output = response.output as any;
      
      if (output && output.audio && output.alignment) {
        // TTS with timestamps returns { audio: Buffer, alignment: AlignmentData }
        audioBuffer = output.audio;
        wordTimestamps = convertToWordTimestamps(output.alignment);
          console.log(`[${mode}:voiceover-generator] Audio with timestamps: ${(audioBuffer.length / 1024).toFixed(2)}KB, ${wordTimestamps.length} words`);
      } else if (Buffer.isBuffer(response.output)) {
        // Fallback: TTS without timestamps returns Buffer directly
        audioBuffer = response.output;
          console.log(`[${mode}:voiceover-generator] Audio received (no timestamps): ${(audioBuffer.length / 1024).toFixed(2)}KB`);
      } else if (output && output.audio_base64) {
        // Sound Effects returns object with base64
        audioBuffer = Buffer.from(output.audio_base64, 'base64');
          console.log(`[${mode}:voiceover-generator] Audio decoded: ${(audioBuffer.length / 1024).toFixed(2)}KB`);
      } else {
        throw new Error("Invalid audio output received from ElevenLabs");
      }
      
      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error("Empty audio buffer received");
      }

      // Upload to Bunny Storage with timestamp to avoid conflicts
      const timestamp = Date.now();
      const filename = `voiceover_scene_${scene.sceneNumber}_${timestamp}.mp3`;
      
      // Truncate project name to avoid path length issues (max 50 chars)
      const truncatedProjectName = projectName.length > 50 
        ? projectName.substring(0, 50) 
        : projectName;
      
      const bunnyPath = buildStoryModePath({
        userId,
        workspaceName,
        toolMode: mode,
        projectName: truncatedProjectName,
        subfolder: "VoiceOver",
        filename: filename,
      });

      // Upload to CDN first
        console.log(`[${mode}:voiceover-generator] Uploading Scene ${scene.sceneNumber} to CDN...`);
        console.log(`[${mode}:voiceover-generator] Filename: ${filename}`);
      
      const cdnUrl = await bunnyStorage.uploadFile(
        bunnyPath,
        audioBuffer,
        "audio/mpeg"
      );

        console.log(`[${mode}:voiceover-generator] CDN URL: ${cdnUrl}`);

      // Calculate actual audio duration from CDN URL (more reliable)
        console.log(`[${mode}:voiceover-generator] Calculating audio duration for Scene ${scene.sceneNumber}...`);
      let actualDuration = scene.duration; // Default to original duration
      
      try {
        actualDuration = await getAudioDurationFromUrl(cdnUrl);
          console.log(`[${mode}:voiceover-generator] Scene ${scene.sceneNumber} - Expected: ${scene.duration}s, Actual: ${actualDuration}s`);
        
        // Warn if duration mismatch is significant (>2 seconds)
        const durationDiff = Math.abs(actualDuration - scene.duration);
        if (durationDiff > 2) {
          console.warn(`[${mode}:voiceover-generator] ⚠️ Scene ${scene.sceneNumber} duration mismatch: ${durationDiff}s difference!`);
        }
      } catch (error) {
        console.warn(`[${mode}:voiceover-generator] Could not calculate duration for Scene ${scene.sceneNumber}, using original: ${scene.duration}s`);
        console.warn(`[${mode}:voiceover-generator] Error:`, error instanceof Error ? error.message : String(error));
      }

      const cost = response.usage?.totalCostUsd || 0;

        console.log(`[${mode}:voiceover-generator] Scene ${scene.sceneNumber} completed ✓ (cost: $${cost.toFixed(4)}, words: ${wordTimestamps.length})`);

      return {
        sceneNumber: scene.sceneNumber,
        audioUrl: cdnUrl,
        duration: actualDuration,  // Use actual audio duration!
        status: "generated",
        cost,
        wordTimestamps,  // ← Word-level timestamps for synchronized subtitles!
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[${mode}:voiceover-generator] Scene ${scene.sceneNumber} attempt ${attempt + 1} failed:`,
        lastError.message
      );

      // Don't retry on certain errors
      if (lastError.message.includes("insufficient credits") || 
          lastError.message.includes("Empty narration")) {
        break;
      }
    }
  }

  // All retries failed
  const errorMessage = lastError?.message || "Unknown error";
    console.error(`[${mode}:voiceover-generator] Scene ${scene.sceneNumber} failed after ${maxRetries + 1} attempts`);

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
   * Generate voiceover for all scenes
   */
  async function generateVoiceover(
    input: any,
    userId?: string,
    workspaceName?: string,
    usageType?: string,
    usageMode?: string
  ): Promise<any> {
    const { scenes, voiceId, projectName } = input;

    console.log(`[${mode}:voiceover-generator] Starting voiceover generation:`, {
      sceneCount: scenes.length,
      voiceId,
      projectName,
    });

    const startTime = Date.now();
    const results: VoiceoverGenerationResult[] = [];

    // Process scenes sequentially to avoid "too_many_concurrent_requests" error
    for (const scene of scenes) {
      const result = await generateSceneVoiceover(
        scene,
        voiceId,
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
    const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);
    const errors = results
      .filter(r => r.status === "failed" && r.error)
      .map(r => `Scene ${r.sceneNumber}: ${r.error}`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`[${mode}:voiceover-generator] Batch generation complete:`, {
      total: scenes.length,
      successful: successfulCount,
      failed: failedCount,
      totalCost: `$${totalCost.toFixed(4)}`,
      duration: `${duration}s`,
    });

    return {
      scenes: results,
      totalCost,
      errors,
    };
  }

  return generateVoiceover;
}

/**
 * Generate voiceover (backward compatibility - uses problem-solution mode by default)
 */
export async function generateVoiceover(
  input: any,
  userId?: string,
  workspaceName?: string,
  usageType?: string,
  usageMode?: string
): Promise<any> {
  const generator = await createVoiceoverGenerator("problem-solution");
  return generator(input, userId, workspaceName, usageType, usageMode);
}

