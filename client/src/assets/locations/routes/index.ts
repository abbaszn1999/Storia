// Location API Client Functions (mirrors backend routes)

import { apiRequest } from "@/lib/queryClient";
import type {
  CreateLocationRequest,
  UpdateLocationRequest,
  LocationResponse,
  UploadImageResponse,
} from "../types";

/**
 * List locations by workspace
 */
export async function listLocations(workspaceId: string): Promise<LocationResponse[]> {
  const response = await apiRequest("GET", `/api/locations?workspaceId=${workspaceId}`);
  return response.json();
}

/**
 * Get single location by ID
 */
export async function getLocation(id: string): Promise<LocationResponse> {
  const response = await apiRequest("GET", `/api/locations/${id}`);
  return response.json();
}

/**
 * Create a new location
 */
export async function createLocation(
  data: CreateLocationRequest
): Promise<LocationResponse> {
  const response = await apiRequest("POST", "/api/locations", data);
  return response.json();
}

/**
 * Update a location
 */
export async function updateLocation(
  id: string,
  data: UpdateLocationRequest
): Promise<LocationResponse> {
  const response = await apiRequest("PUT", `/api/locations/${id}`, data);
  return response.json();
}

/**
 * Delete a location
 */
export async function deleteLocation(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/locations/${id}`);
}

/**
 * Upload main location image
 */
export async function uploadMainImage(
  locationId: string,
  file: File
): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/locations/${locationId}/upload-image`, {
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

