// Upload Management Types

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Request to create an upload (metadata only, file sent separately)
 */
export interface CreateUploadRequest {
  workspaceId: string;
  name: string;
  description?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageUrl: string;
}

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
 * Response from upload operations
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

