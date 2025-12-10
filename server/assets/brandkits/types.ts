// Brand Kit Management Types

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Request to create a brand kit
 */
export interface CreateBrandkitRequest {
  workspaceId: string;
  name: string;
  description?: string;
  colors?: string[];
  fonts?: string[];
  guidelines?: string;
}

/**
 * Request to update a brand kit
 */
export interface UpdateBrandkitRequest {
  name?: string;
  description?: string;
  colors?: string[];
  fonts?: string[];
  logoUrl?: string;
  guidelines?: string;
}

/**
 * Request to upload a brand kit logo
 */
export interface UploadLogoRequest {
  brandkitId: string;
  workspaceId: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Response from brand kit operations
 */
export interface BrandkitResponse {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  colors?: string[] | null;
  fonts?: string[] | null;
  logoUrl?: string | null;
  guidelines?: string | null;
  createdAt: Date;
}

/**
 * Response from logo upload
 */
export interface UploadLogoResponse {
  logoUrl: string;
  brandkitId: string;
  success: boolean;
}

