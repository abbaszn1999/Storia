// Location Management Types

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Request to create a location
 */
export interface CreateLocationRequest {
  workspaceId: string;
  name: string;
  description?: string;
  details?: string;
}

/**
 * Request to update a location
 */
export interface UpdateLocationRequest {
  name?: string;
  description?: string;
  details?: string;
  imageUrl?: string;
  referenceImages?: string[];
}

/**
 * Request to upload a location image
 */
export interface UploadImageRequest {
  locationId: string;
  workspaceId: string;
  imageType: "main" | "reference";
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Response from location operations
 */
export interface LocationResponse {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  details?: string | null;
  imageUrl?: string | null;
  referenceImages?: string[] | null;
  createdAt: Date;
}

/**
 * Response from image upload
 */
export interface UploadImageResponse {
  imageUrl: string;
  locationId: string;
  imageType: "main" | "reference";
  success: boolean;
}

