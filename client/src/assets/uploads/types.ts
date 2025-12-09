// Upload Management Types (mirrors backend)

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Request to update an upload
 */
export interface UpdateUploadRequest {
  name?: string;
  description?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Upload response from API
 */
export interface UploadResponse {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageUrl: string;
  createdAt: Date;
}

/**
 * Response from file upload
 */
export interface FileUploadResponse {
  upload: UploadResponse;
  success: boolean;
}

