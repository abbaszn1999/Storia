/**
 * Shotstack API Client
 * 
 * HTTP client wrapper for Shotstack Edit, Ingest, and Serve APIs.
 */

import { getShotstackConfig, SHOTSTACK_ENDPOINTS } from './config';
import type {
  ShotstackEdit,
  RenderResponse,
  RenderStatusResponse,
  IngestRequest,
  IngestResponse,
} from './types';

/**
 * Shotstack API Client
 */
export class ShotstackClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    const config = getShotstackConfig();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
  }

  /**
   * Make an authenticated request to Shotstack API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new ShotstackAPIError(
        `Shotstack API error: ${response.status} ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    return response.json();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // EDIT API
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Submit a video edit for rendering
   * 
   * @param edit The edit definition with timeline and output settings
   * @returns Render response with render ID
   */
  async render(edit: ShotstackEdit): Promise<RenderResponse> {
    console.log('[ShotstackClient] Submitting render:', {
      trackCount: edit.timeline.tracks.length,
      clipCount: edit.timeline.tracks.reduce((sum, t) => sum + t.clips.length, 0),
      format: edit.output.format,
      resolution: edit.output.resolution,
      hasCallback: !!edit.callback,
    });

    return this.request<RenderResponse>(SHOTSTACK_ENDPOINTS.render, {
      method: 'POST',
      body: JSON.stringify(edit),
    });
  }

  /**
   * Get the status of a render
   * 
   * @param renderId The render ID from the render response
   * @returns Current render status
   */
  async getRenderStatus(renderId: string): Promise<RenderStatusResponse> {
    return this.request<RenderStatusResponse>(
      SHOTSTACK_ENDPOINTS.renderStatus(renderId),
      { method: 'GET' }
    );
  }

  /**
   * Poll render status until complete or failed
   * 
   * @param renderId The render ID
   * @param intervalMs Polling interval in milliseconds (default: 3000)
   * @param maxAttempts Maximum polling attempts (default: 120 = 6 minutes)
   * @param onProgress Optional callback for progress updates
   * @returns Final render status
   */
  async pollRenderStatus(
    renderId: string,
    intervalMs = 3000,
    maxAttempts = 120,
    onProgress?: (status: RenderStatusResponse) => void
  ): Promise<RenderStatusResponse> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const status = await this.getRenderStatus(renderId);
      
      if (onProgress) {
        onProgress(status);
      }

      const renderStatus = status.response.status;

      if (renderStatus === 'done') {
        console.log('[ShotstackClient] Render complete:', {
          renderId,
          url: status.response.url,
          duration: status.response.duration,
          renderTime: status.response.renderTime,
        });
        return status;
      }

      if (renderStatus === 'failed') {
        console.error('[ShotstackClient] Render failed:', {
          renderId,
          error: status.response.error,
        });
        throw new ShotstackAPIError(
          `Render failed: ${status.response.error || 'Unknown error'}`,
          500,
          JSON.stringify(status)
        );
      }

      // Still processing, wait and try again
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      attempts++;
    }

    throw new ShotstackAPIError(
      `Render timed out after ${maxAttempts} attempts`,
      408,
      ''
    );
  }

  /**
   * Extract audio from a video file
   * 
   * Creates a minimal Shotstack timeline with the video and renders it as MP3.
   * This is used to extract audio from MMAudio's low-res video output without
   * re-encoding the original high-quality video.
   * 
   * @param videoUrl URL of the video to extract audio from
   * @param duration Duration of the video in seconds
   * @returns URL of the extracted MP3 audio file
   */
  async extractAudioFromVideo(videoUrl: string, duration: number): Promise<string> {
    console.log('[ShotstackClient] Extracting audio from video:', {
      videoUrl: videoUrl.substring(0, 50) + '...',
      duration,
    });

    // Create a minimal timeline with just the video
    const edit: ShotstackEdit = {
      timeline: {
        tracks: [
          {
            clips: [
              {
                asset: {
                  type: 'video',
                  src: videoUrl,
                },
                start: 0,
                length: duration,
              },
            ],
          },
        ],
      },
      output: {
        format: 'mp3', // Extract audio only
        resolution: 'sd', // Required by Shotstack even for audio-only output
      },
    };

    // Submit the render
    const renderResponse = await this.render(edit);
    const renderId = renderResponse.response.id;

    console.log('[ShotstackClient] Audio extraction render submitted:', { renderId });

    // Poll for completion
    const finalStatus = await this.pollRenderStatus(renderId);

    if (!finalStatus.response.url) {
      throw new ShotstackAPIError(
        'Audio extraction completed but no URL returned',
        500,
        JSON.stringify(finalStatus)
      );
    }

    console.log('[ShotstackClient] Audio extracted successfully:', {
      audioUrl: finalStatus.response.url,
    });

    return finalStatus.response.url;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // INGEST API
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Ingest a media file from URL
   * 
   * @param request Ingest request with source URL
   * @returns Ingest response with asset ID
   */
  async ingest(request: IngestRequest): Promise<IngestResponse> {
    console.log('[ShotstackClient] Ingesting asset:', { url: request.url });

    // Ingest API uses a different base URL
    const ingestBaseUrl = this.baseUrl.replace('/v1', '/ingest/stage').replace('/stage', '/ingest/stage');
    
    const response = await fetch(`${ingestBaseUrl}/sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new ShotstackAPIError(
        `Shotstack Ingest API error: ${response.status} ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    return response.json();
  }

  /**
   * Get the status of an ingested asset
   * 
   * @param assetId The asset ID from the ingest response
   * @returns Current ingest status
   */
  async getIngestStatus(assetId: string): Promise<IngestResponse> {
    const ingestBaseUrl = this.baseUrl.replace('/v1', '/ingest/stage').replace('/stage', '/ingest/stage');
    
    const response = await fetch(`${ingestBaseUrl}/sources/${assetId}`, {
      method: 'GET',
      headers: {
        'x-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new ShotstackAPIError(
        `Shotstack Ingest API error: ${response.status} ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    return response.json();
  }
}

/**
 * Custom error class for Shotstack API errors
 */
export class ShotstackAPIError extends Error {
  statusCode: number;
  responseBody: string;

  constructor(message: string, statusCode: number, responseBody: string) {
    super(message);
    this.name = 'ShotstackAPIError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

/**
 * Singleton instance
 */
let clientInstance: ShotstackClient | null = null;

/**
 * Get the Shotstack client instance
 */
export function getShotstackClient(): ShotstackClient {
  if (!clientInstance) {
    clientInstance = new ShotstackClient();
  }
  return clientInstance;
}

