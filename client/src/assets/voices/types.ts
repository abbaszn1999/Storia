// Voice Management Types (mirrors backend)

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Request to create a voice
 */
export interface CreateVoiceRequest {
  workspaceId: string;
  name: string;
  description?: string;
}

/**
 * Request to update a voice
 */
export interface UpdateVoiceRequest {
  name?: string;
  description?: string;
  sampleUrl?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Voice response from API
 */
export interface VoiceResponse {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  sampleUrl?: string | null;
  createdAt: Date;
}

/**
 * Response from audio upload
 */
export interface UploadAudioResponse {
  audioUrl: string;
  voiceId: string;
  success: boolean;
}

