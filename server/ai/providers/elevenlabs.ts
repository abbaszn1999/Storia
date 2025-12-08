/**
 * ElevenLabs Sound Effects Provider
 * 
 * API: POST https://api.elevenlabs.io/v1/sound-generation
 * Docs: https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert
 * 
 * Generates sound effects from text descriptions.
 * Returns audio data (MP3/WAV).
 */

import { ProviderRequestError, MissingApiKeyError } from "../errors";
import { getProviderConfig } from "../config";
import type { AiProviderAdapter } from "./base-provider";
import { registerProvider } from "./base-provider";

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

interface SoundEffectsPayload {
  text: string;
  duration_seconds?: number;
  prompt_influence?: number;
}

interface SoundEffectsResponse {
  audio_base64?: string;
  // The API returns audio stream, we'll convert to base64
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
    const endpoint = `${baseUrl}/sound-generation`;

    // Extract payload
    const payload = request.payload as SoundEffectsPayload;
    
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
  },
};

registerProvider(elevenlabsAdapter);

export { elevenlabsAdapter };

