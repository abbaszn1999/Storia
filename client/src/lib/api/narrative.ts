// Narrative Mode API Client
// Functions for video generation and status checking

import { apiRequest } from '../queryClient';

export interface AnimateShotRequest {
  shotVersionId: string;
  videoModel?: string;
  aspectRatio: string;
  resolution?: string;
  duration: number;
  videoPrompt: string;
  narrativeMode: "image-reference" | "start-end" | "auto";
}

export interface AnimateShotResponse {
  taskId: string;
  status: "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

export interface VideoStatusResponse {
  status: "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

/**
 * Generate video for a shot
 */
export async function animateShot(
  videoId: string,
  shotId: string,
  request: AnimateShotRequest
): Promise<AnimateShotResponse> {
  const response = await apiRequest(
    "POST",
    `/api/narrative/videos/${videoId}/shots/${shotId}/animate`,
    request
  );
  return response.json();
}

/**
 * Check video generation status
 */
export async function checkVideoStatus(
  videoId: string,
  shotId: string,
  taskId: string
): Promise<VideoStatusResponse> {
  const response = await apiRequest(
    "GET",
    `/api/narrative/videos/${videoId}/shots/${shotId}/video-status/${taskId}`
  );
  return response.json();
}

