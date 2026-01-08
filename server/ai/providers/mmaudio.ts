/**
 * MMAudio Provider
 * 
 * Supports:
 * - Video-to-Audio: POST /api/video-to-audio
 * 
 * Docs: https://mmaudio.net/
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * API DETAILS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Endpoint: POST https://mmaudio.net/api/video-to-audio
 * Authentication: Bearer token
 * 
 * Request Parameters:
 * - video_url (required): URL of the video file to generate audio for
 * - prompt (required): Text description of audio to generate
 * - duration (optional): Audio duration in seconds (1-30, default: 8)
 * - num_steps (optional): Inference steps for quality (1-50, default: 25)
 * - cfg_strength (optional): Guidance strength (1-10, default: 4.5)
 * - seed (optional): Random seed for reproducibility
 * 
 * Response:
 * {
 *   "video": {
 *     "url": "https://example.com/video_with_audio.mp4",
 *     "content_type": "application/octet-stream",
 *     "file_name": "video_with_audio.mp4",
 *     "file_size": 2299595
 *   }
 * }
 * 
 * Notes:
 * - 2 credits per video-to-audio generation
 * - Generated files are available for 24 hours
 * - Maximum input file size is approximately 5MB
 */

import { ProviderRequestError, MissingApiKeyError } from "../errors";
import { getProviderConfig } from "../config";
import type { AiProviderAdapter } from "./base-provider";
import { registerProvider } from "./base-provider";

const MMAUDIO_BASE_URL = "https://mmaudio.net/api";

// ═══════════════════════════════════════════════════════════════════════════════
// MMAUDIO REQUEST/RESPONSE INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

interface VideoToAudioPayload {
  video_url: string;
  prompt: string;
  duration?: number;      // 1-30 seconds, default: 8
  num_steps?: number;     // 1-50, default: 25
  cfg_strength?: number;  // 1-10, default: 4.5
  seed?: number;          // For reproducibility
}

interface VideoToAudioResponse {
  video: {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MMAUDIO PROVIDER ADAPTER
// ═══════════════════════════════════════════════════════════════════════════════

const mmaudioAdapter: AiProviderAdapter = {
  name: "mmaudio",
  supports(model: string) {
    const provider = getProviderConfig("mmaudio");
    return Boolean(provider.models[model]);
  },
  async call({ request, providerConfig, modelConfig }) {
    if (!providerConfig.apiKey) {
      throw new MissingApiKeyError("mmaudio");
    }

    const baseUrl = providerConfig.baseUrl || MMAUDIO_BASE_URL;

    // Handle Video-to-Audio
    if (request.task === "video-to-audio") {
      const payload = request.payload as unknown as VideoToAudioPayload;

      if (!payload.video_url) {
        throw new ProviderRequestError("mmaudio", "Missing 'video_url' parameter");
      }
      if (!payload.prompt) {
        throw new ProviderRequestError("mmaudio", "Missing 'prompt' parameter");
      }

      const endpoint = `${baseUrl}/video-to-audio`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${providerConfig.apiKey}`,
      };

      const body: Record<string, unknown> = {
        video_url: payload.video_url,
        prompt: payload.prompt,
      };

      // Add optional parameters if provided
      if (payload.duration !== undefined) {
        body.duration = payload.duration;
      }
      if (payload.num_steps !== undefined) {
        body.num_steps = payload.num_steps;
      }
      if (payload.cfg_strength !== undefined) {
        body.cfg_strength = payload.cfg_strength;
      }
      if (payload.seed !== undefined) {
        body.seed = payload.seed;
      }

      console.log("[mmaudio] Generating audio for video:", {
        video_url: payload.video_url.substring(0, 50) + "...",
        prompt: payload.prompt.substring(0, 100),
        duration: payload.duration || 8,
        num_steps: payload.num_steps || 25,
        cfg_strength: payload.cfg_strength || 4.5,
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[mmaudio] API error:", errorText);
        throw new ProviderRequestError("mmaudio", errorText);
      }

      const jsonResponse = await response.json() as VideoToAudioResponse;

      if (!jsonResponse.video?.url) {
        throw new ProviderRequestError("mmaudio", "No video URL in response");
      }

      console.log("[mmaudio] Audio generated successfully:", {
        url: jsonResponse.video.url.substring(0, 50) + "...",
        file_size: jsonResponse.video.file_size,
        file_name: jsonResponse.video.file_name,
      });

      // Calculate cost (2 credits per generation)
      const flatCost = modelConfig.pricing?.flatCostPerCall || 0;

      return {
        provider: "mmaudio",
        model: modelConfig.name,
        output: {
          videoUrl: jsonResponse.video.url,
          fileName: jsonResponse.video.file_name,
          fileSize: jsonResponse.video.file_size,
          contentType: jsonResponse.video.content_type,
        },
        usage: {
          totalCostUsd: flatCost,
        },
        rawResponse: jsonResponse,
      };
    }

    throw new ProviderRequestError(
      "mmaudio",
      `Unsupported task: ${request.task}. MMAudio only supports 'video-to-audio'.`
    );
  },
};

registerProvider(mmaudioAdapter);

