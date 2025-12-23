// Character Management Types (mirrors backend)

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Request to create a character
 */
export interface CreateCharacterRequest {
  workspaceId: string;
  name: string;
  description?: string;
  personality?: string;
  appearance?: string;
  imageUrl?: string;
  referenceImages?: string[];
  voiceSettings?: Record<string, unknown>;
}

/**
 * Request to update a character
 */
export interface UpdateCharacterRequest {
  name?: string;
  description?: string;
  personality?: string;
  appearance?: string;
  imageUrl?: string;
  referenceImages?: string[];
  voiceSettings?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Character response from API
 */
export interface CharacterResponse {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  personality?: string | null;
  appearance?: string | null;
  imageUrl?: string | null;
  referenceImages?: string[] | null;
  voiceSettings?: Record<string, unknown> | null;
  createdAt: Date;
}

/**
 * Response from image upload
 */
export interface UploadImageResponse {
  imageUrl: string;
  characterId: string;
  imageType: "main" | "reference";
  success: boolean;
}

