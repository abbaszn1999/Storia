/**
 * ElevenLabs Provider
 * 
 * Supports:
 * - Text-to-Speech (TTS): POST /v1/text-to-speech/{voice_id}
 * - Sound Effects: POST /v1/sound-generation
 * - Music Generation: POST /v1/music/compose (NEW)
 * 
 * Docs: https://elevenlabs.io/docs/api-reference
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * AVAILABLE TTS MODELS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Model ID                    | Description                                          | Languages
 * ----------------------------|------------------------------------------------------|------------------
 * eleven_v3                   | Human-like and expressive speech generation          | 70+ languages
 * eleven_ttv_v3               | Human-like and expressive voice design (Text to Voice) | 70+ languages
 * eleven_multilingual_v2     | Most lifelike model with rich emotional expression    | 29 languages (en, ja, zh, de, hi, fr, ko, pt, it, es, id, nl, tr, fil, pl, sv, bg, ro, ar, cs, el, fi, hr, ms, sk, da, ta, uk, ru)
 * eleven_flash_v2_5          | Ultra-fast model optimized for real-time (~75ms)     | All multilingual_v2 languages plus: hu, no, vi
 * eleven_flash_v2            | Ultra-fast model optimized for real-time (~75ms)     | en
 * eleven_turbo_v2_5          | High quality, low-latency (~250ms-300ms)            | All multilingual_v2 languages plus: hu, no, vi
 * eleven_turbo_v2            | High quality, low-latency (~250ms-300ms)            | en
 * eleven_multilingual_sts_v2 | State-of-the-art multilingual voice changer (Speech to Speech) | 29 languages (same as multilingual_v2)
 * eleven_multilingual_ttv_v2 | State-of-the-art multilingual voice designer (Text to Voice) | 29 languages (same as multilingual_v2)
 * 
 * DEFAULT MODEL: eleven_v3 (used when model_id is not specified)
 * 
 * USAGE:
 * - For best quality and emotional expression: eleven_v3 or eleven_multilingual_v2
 * - For real-time/low-latency: eleven_flash_v2_5 or eleven_turbo_v2_5
 * - For voice design: eleven_ttv_v3 or eleven_multilingual_ttv_v2
 * - For voice changing: eleven_multilingual_sts_v2
 */

import { ProviderRequestError, MissingApiKeyError } from "../errors";
import { getProviderConfig } from "../config";
import type { AiProviderAdapter } from "./base-provider";
import { registerProvider } from "./base-provider";

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

// ═══════════════════════════════════════════════════════════════════════════════
// ELEVENLABS TTS MODEL IDENTIFIERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Available ElevenLabs TTS Model IDs
 * Use these constants when specifying model_id in TTS requests
 */
export const ELEVENLABS_MODELS = {
  // Latest and most expressive models
  V3: "eleven_v3",                          // Human-like and expressive (70+ languages)
  TTV_V3: "eleven_ttv_v3",                  // Voice design model (70+ languages)
  
  // Multilingual models (29 languages)
  MULTILINGUAL_V2: "eleven_multilingual_v2", // Most lifelike with rich emotional expression
  MULTILINGUAL_STS_V2: "eleven_multilingual_sts_v2", // Voice changer (Speech to Speech)
  MULTILINGUAL_TTV_V2: "eleven_multilingual_ttv_v2", // Voice designer (Text to Voice)
  
  // Ultra-fast models (real-time optimized)
  FLASH_V2_5: "eleven_flash_v2_5",          // Ultra-fast (~75ms) - 32 languages
  FLASH_V2: "eleven_flash_v2",              // Ultra-fast (~75ms) - English only
  
  // Balanced quality/speed models
  TURBO_V2_5: "eleven_turbo_v2_5",          // High quality, low-latency (~250-300ms) - 32 languages
  TURBO_V2: "eleven_turbo_v2",              // High quality, low-latency (~250-300ms) - English only
} as const;

/**
 * Default model to use when model_id is not specified
 */
export const DEFAULT_TTS_MODEL = ELEVENLABS_MODELS.V3;

interface SoundEffectsPayload {
  text: string;
  duration_seconds?: number;
  prompt_influence?: number;
}

interface SoundEffectsResponse {
  audio_base64?: string;
  // The API returns audio stream, we'll convert to base64
}

interface TTSPayload {
  text: string;
  voice_id: string;
  model_id?: string;
  with_timestamps?: boolean;  // Request word-level timestamps
  voice_settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

/**
 * Alignment data from ElevenLabs (character-level timestamps)
 */
interface AlignmentData {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

/**
 * TTS response with timestamps
 */
interface TTSWithTimestampsResponse {
  audio_base64: string;
  alignment: AlignmentData;
}

/**
 * Music Generation Payload
 * API: POST /v1/music/compose
 * Docs: https://elevenlabs.io/docs/api-reference/music/compose
 */
interface MusicPayload {
  prompt: string;                    // Text description of the music
  music_length_ms?: number;          // Duration: 10000-300000 (10s-5min)
  force_instrumental?: boolean;      // true = no vocals
  output_format?: string;            // e.g., "mp3_44100_128"
  model_id?: string;                 // Default: "music_v1"
}

const elevenlabsAdapter: AiProviderAdapter = {
  name: "elevenlabs",
  supports(model: string) {
    const provider = getProviderConfig("elevenlabs");
    return Boolean(provider.models[model]);
  },
  async call({ request, providerConfig, modelConfig }) {
    if (!providerConfig.apiKey) {
      throw new MissingApiKeyError("elevenlabs");
    }

    const baseUrl = providerConfig.baseUrl || ELEVENLABS_BASE_URL;

    // Handle Text-to-Speech
    if (request.task === "text-to-speech") {
      const payload = request.payload as unknown as TTSPayload;
      
      if (!payload.text) {
        throw new ProviderRequestError("elevenlabs", "Missing 'text' parameter for TTS");
      }
      if (!payload.voice_id) {
        throw new ProviderRequestError("elevenlabs", "Missing 'voice_id' parameter for TTS");
      }

      // ═══════════════════════════════════════════════════════════════════════════
      // OPTION A: TTS with timestamps (for synchronized subtitles)
      // Uses /v1/text-to-speech/{voice_id}/with-timestamps endpoint
      // ═══════════════════════════════════════════════════════════════════════════
      if (payload.with_timestamps) {
        const endpoint = `${baseUrl}/text-to-speech/${payload.voice_id}/with-timestamps`;
        
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "xi-api-key": providerConfig.apiKey,
        };

        const body: Record<string, unknown> = {
          text: payload.text,
          model_id: payload.model_id || DEFAULT_TTS_MODEL,
          voice_settings: payload.voice_settings || {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0,
            use_speaker_boost: true,
          },
        };

        console.log("[elevenlabs] Generating TTS with timestamps:", {
          voice_id: payload.voice_id,
          text_length: payload.text.length,
          model: body.model_id,
        });

        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[elevenlabs] TTS with timestamps API error:", errorText);
          throw new ProviderRequestError("elevenlabs", errorText);
        }

        // Response is JSON with audio_base64 and alignment data
        const jsonResponse = await response.json() as TTSWithTimestampsResponse;
        
        if (!jsonResponse.audio_base64) {
          throw new ProviderRequestError("elevenlabs", "No audio_base64 in response");
        }

        const audioBuffer = Buffer.from(jsonResponse.audio_base64, 'base64');

        console.log("[elevenlabs] TTS with timestamps generated:", {
          size: audioBuffer.byteLength,
          format: "mp3",
          hasAlignment: !!jsonResponse.alignment,
          characterCount: jsonResponse.alignment?.characters?.length || 0,
        });

        // Calculate cost
        const characterCount = payload.text.length;
        const costPer1KChars = modelConfig.pricing?.inputCostPer1KTokens || 0.30;
        const totalCost = (characterCount / 1000) * costPer1KChars;

        return {
          provider: "elevenlabs",
          model: modelConfig.name,
          output: {
            audio: audioBuffer,
            alignment: jsonResponse.alignment,
          },
          usage: {
            totalCostUsd: totalCost,
          },
          rawResponse: {
            status: response.status,
            contentType: "audio/mpeg",
            size: audioBuffer.byteLength,
          },
        };
      }

      // ═══════════════════════════════════════════════════════════════════════════
      // OPTION B: Standard TTS (without timestamps)
      // ═══════════════════════════════════════════════════════════════════════════
      const endpoint = `${baseUrl}/text-to-speech/${payload.voice_id}`;
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "xi-api-key": providerConfig.apiKey,
      };

      const body: Record<string, unknown> = {
        text: payload.text,
        model_id: payload.model_id || DEFAULT_TTS_MODEL,
        voice_settings: payload.voice_settings || {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0,
          use_speaker_boost: true,
        },
      };

      console.log("[elevenlabs] Generating TTS:", {
        voice_id: payload.voice_id,
        text_length: payload.text.length,
        model: body.model_id,
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[elevenlabs] TTS API error:", errorText);
        throw new ProviderRequestError("elevenlabs", errorText);
      }

      // ElevenLabs returns audio data as binary stream
      const audioBuffer = await response.arrayBuffer();
      const audioBufferNode = Buffer.from(audioBuffer);

      console.log("[elevenlabs] TTS generated successfully:", {
        size: audioBuffer.byteLength,
        format: "mp3",
      });

      // Calculate cost based on character count
      const characterCount = payload.text.length;
      const costPer1KChars = modelConfig.pricing?.inputCostPer1KTokens || 0.30;
      const totalCost = (characterCount / 1000) * costPer1KChars;

      return {
        provider: "elevenlabs",
        model: modelConfig.name,
        output: audioBufferNode,
        usage: {
          totalCostUsd: totalCost,
        },
        rawResponse: {
          status: response.status,
          contentType: "audio/mpeg",
          size: audioBuffer.byteLength,
        },
      };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Handle Music Generation
    // API: POST /v1/music/compose
    // ═══════════════════════════════════════════════════════════════════════════
    if (request.task === "music-generation") {
      const payload = request.payload as unknown as MusicPayload;
      
      if (!payload.prompt) {
        throw new ProviderRequestError("elevenlabs", "Missing 'prompt' parameter for music generation");
      }

      const endpoint = `${baseUrl}/music/compose`;
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "xi-api-key": providerConfig.apiKey,
      };

      // Build request body
      const body: Record<string, unknown> = {
        prompt: payload.prompt,
        model_id: payload.model_id || "music_v1",
        force_instrumental: payload.force_instrumental ?? true, // Default: no vocals
        output_format: payload.output_format || "mp3_44100_192", // 192kbps for higher quality
      };

      // Add duration if specified (10s - 5min)
      if (payload.music_length_ms !== undefined) {
        // Clamp to valid range: 10000ms (10s) to 300000ms (5min)
        const clampedDuration = Math.max(10000, Math.min(300000, payload.music_length_ms));
        body.music_length_ms = clampedDuration;
      }

      console.log("[elevenlabs] Generating music:", {
        prompt: payload.prompt.substring(0, 80) + (payload.prompt.length > 80 ? "..." : ""),
        duration_ms: body.music_length_ms,
        force_instrumental: body.force_instrumental,
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[elevenlabs] Music API error:", errorText);
        throw new ProviderRequestError("elevenlabs", `Music generation failed: ${errorText}`);
      }

      // ElevenLabs Music returns audio data as binary stream
      const audioBuffer = await response.arrayBuffer();
      const audioBufferNode = Buffer.from(audioBuffer);

      // Calculate actual duration from response or use requested
      const actualDurationMs = (body.music_length_ms as number) || 30000;

      console.log("[elevenlabs] Music generated successfully:", {
        size: audioBuffer.byteLength,
        format: "mp3",
        duration_ms: actualDurationMs,
      });

      // Calculate cost based on duration
      // Pricing: ~$0.50 per 1000ms (1 second)
      const costPerSecond = modelConfig.pricing?.inputCostPer1KTokens || 0.50;
      const durationSeconds = actualDurationMs / 1000;
      const totalCost = durationSeconds * (costPerSecond / 1000) * 1000;

      return {
        provider: "elevenlabs",
        model: modelConfig.name,
        output: audioBufferNode,
        usage: {
          totalCostUsd: totalCost,
        },
        rawResponse: {
          status: response.status,
          contentType: "audio/mpeg",
          size: audioBuffer.byteLength,
          duration_ms: actualDurationMs,
        },
      };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Handle Sound Effects
    // API: POST /v1/sound-generation
    // ═══════════════════════════════════════════════════════════════════════════
    if (request.task === "sound-effects") {
      const endpoint = `${baseUrl}/sound-generation`;
      const payload = request.payload as unknown as SoundEffectsPayload;
      
      if (!payload.text) {
        throw new ProviderRequestError("elevenlabs", "Missing 'text' parameter for sound effects generation");
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "xi-api-key": providerConfig.apiKey,
      };

      // Build request body
      const body: Record<string, unknown> = {
        text: payload.text,
      };

      // Optional parameters
      if (payload.duration_seconds !== undefined) {
        body.duration_seconds = payload.duration_seconds;
      }
      if (payload.prompt_influence !== undefined) {
        body.prompt_influence = payload.prompt_influence;
      }

      console.log("[elevenlabs] Generating sound effect:", {
        text: payload.text.substring(0, 50) + (payload.text.length > 50 ? "..." : ""),
        duration_seconds: payload.duration_seconds,
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[elevenlabs] API error:", errorText);
        throw new ProviderRequestError("elevenlabs", errorText);
      }

      // ElevenLabs returns audio data as binary stream
      const audioBuffer = await response.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString("base64");
      
      // Get content type for format detection
      const contentType = response.headers.get("content-type") || "audio/mpeg";
      const audioFormat = contentType.includes("wav") ? "wav" : "mp3";

      console.log("[elevenlabs] Sound effect generated successfully:", {
        format: audioFormat,
        size: audioBuffer.byteLength,
      });

      return {
        provider: "elevenlabs",
        model: modelConfig.name,
        output: {
          audio_base64: audioBase64,
          format: audioFormat,
          content_type: contentType,
          size_bytes: audioBuffer.byteLength,
        },
        usage: {
          // ElevenLabs charges per generation, not per token/character
          totalCostUsd: modelConfig.pricing?.flatCostPerCall || 0.05,
        },
        rawResponse: {
          status: response.status,
          contentType,
        },
      };
    }

    // Unsupported task type
    throw new ProviderRequestError(
      "elevenlabs",
      `Unsupported task type: ${request.task}. Supported tasks: text-to-speech, music-generation, sound-effects`
    );
  },
};

registerProvider(elevenlabsAdapter);

export { elevenlabsAdapter };

