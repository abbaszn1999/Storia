// Upload API Client Functions (mirrors backend routes)

import { apiRequest } from "@/lib/queryClient";
import type {
  UpdateUploadRequest,
  UploadResponse,
  FileUploadResponse,
} from "../types";

/**
 * List uploads by workspace
 */
export async function listUploads(workspaceId: string): Promise<UploadResponse[]> {
  const response = await apiRequest("GET", `/api/uploads?workspaceId=${workspaceId}`);
  return response.json();
}

/**
 * Get single upload by ID
 */
export async function getUpload(id: string): Promise<UploadResponse> {
  const response = await apiRequest("GET", `/api/uploads/${id}`);
  return response.json();
}

/**
 * Upload a file (creates record and uploads to Bunny)
 */
export async function uploadFile(
  workspaceId: string,
  file: File,
  name?: string,
  description?: string
): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("workspaceId", workspaceId);
  if (name) formData.append("name", name);
  if (description) formData.append("description", description);

  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to upload file");
  }

  return response.json();
}

/**
 * Update an upload's metadata
 */
export async function updateUpload(
  id: string,
  data: UpdateUploadRequest
): Promise<UploadResponse> {
  const response = await apiRequest("PUT", `/api/uploads/${id}`, data);
  return response.json();
}

/**
 * Delete an upload
 */
export async function deleteUpload(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/uploads/${id}`);
}

