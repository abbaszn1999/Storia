// Location Management Types (mirrors backend)

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

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Location response from API
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

