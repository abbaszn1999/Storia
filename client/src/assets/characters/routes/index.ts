// Character API Client Functions (mirrors backend routes)

import { apiRequest } from "@/lib/queryClient";
import type {
  CreateCharacterRequest,
  UpdateCharacterRequest,
  CharacterResponse,
  UploadImageResponse,
} from "../types";

/**
 * List characters by workspace
 */
export async function listCharacters(workspaceId: string): Promise<CharacterResponse[]> {
  const response = await apiRequest("GET", `/api/characters?workspaceId=${workspaceId}`);
  return response.json();
}

/**
 * Get single character by ID
 */
export async function getCharacter(id: string): Promise<CharacterResponse> {
  const response = await apiRequest("GET", `/api/characters/${id}`);
  return response.json();
}

/**
 * Create a new character
 */
export async function createCharacter(
  data: CreateCharacterRequest
): Promise<CharacterResponse> {
  const response = await apiRequest("POST", "/api/characters", data);
  return response.json();
}

/**
 * Update a character
 */
export async function updateCharacter(
  id: string,
  data: UpdateCharacterRequest
): Promise<CharacterResponse> {
  const response = await apiRequest("PUT", `/api/characters/${id}`, data);
  return response.json();
}

/**
 * Delete a character
 */
export async function deleteCharacter(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/characters/${id}`);
}

/**
 * Upload main character image
 */
export async function uploadMainImage(
  characterId: string,
  file: File
): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/characters/${characterId}/upload-image`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to upload image");
  }

  return response.json();
}


