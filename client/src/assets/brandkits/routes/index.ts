// Brand Kit API Client Functions (mirrors backend routes)

import { apiRequest } from "@/lib/queryClient";
import type {
  CreateBrandkitRequest,
  UpdateBrandkitRequest,
  BrandkitResponse,
  UploadLogoResponse,
} from "../types";

/**
 * List brand kits by workspace
 */
export async function listBrandkits(workspaceId: string): Promise<BrandkitResponse[]> {
  const response = await apiRequest("GET", `/api/brandkits?workspaceId=${workspaceId}`);
  return response.json();
}

/**
 * Get single brand kit by ID
 */
export async function getBrandkit(id: string): Promise<BrandkitResponse> {
  const response = await apiRequest("GET", `/api/brandkits/${id}`);
  return response.json();
}

/**
 * Create a new brand kit
 */
export async function createBrandkit(
  data: CreateBrandkitRequest
): Promise<BrandkitResponse> {
  const response = await apiRequest("POST", "/api/brandkits", data);
  return response.json();
}

/**
 * Update a brand kit
 */
export async function updateBrandkit(
  id: string,
  data: UpdateBrandkitRequest
): Promise<BrandkitResponse> {
  const response = await apiRequest("PUT", `/api/brandkits/${id}`, data);
  return response.json();
}

/**
 * Delete a brand kit
 */
export async function deleteBrandkit(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/brandkits/${id}`);
}

/**
 * Upload brand kit logo
 */
export async function uploadLogo(
  brandkitId: string,
  file: File
): Promise<UploadLogoResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/brandkits/${brandkitId}/upload-logo`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to upload logo");
  }

  return response.json();
}

