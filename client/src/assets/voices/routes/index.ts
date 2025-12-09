// Voice API Client Functions (mirrors backend routes)

import { apiRequest } from "@/lib/queryClient";
import type {
  CreateVoiceRequest,
  UpdateVoiceRequest,
  VoiceResponse,
  UploadAudioResponse,
} from "../types";

/**
 * List voices by workspace
 */
export async function listVoices(workspaceId: string): Promise<VoiceResponse[]> {
  const response = await apiRequest("GET", `/api/voices?workspaceId=${workspaceId}`);
  return response.json();
}

/**
 * Get single voice by ID
 */
export async function getVoice(id: string): Promise<VoiceResponse> {
  const response = await apiRequest("GET", `/api/voices/${id}`);
  return response.json();
}

/**
 * Create a new voice
 */
export async function createVoice(
  data: CreateVoiceRequest
): Promise<VoiceResponse> {
  const response = await apiRequest("POST", "/api/voices", data);
  return response.json();
}

/**
 * Update a voice
 */
export async function updateVoice(
  id: string,
  data: UpdateVoiceRequest
): Promise<VoiceResponse> {
  const response = await apiRequest("PUT", `/api/voices/${id}`, data);
  return response.json();
}

/**
 * Delete a voice
 */
export async function deleteVoice(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/voices/${id}`);
}

/**
 * Upload voice audio sample
 */
export async function uploadAudioSample(
  voiceId: string,
  file: File
): Promise<UploadAudioResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/voices/${voiceId}/upload-sample`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to upload audio sample");
  }

  return response.json();
}

