// Voice Management Types

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

/**
 * Request to upload a voice audio sample
 */
export interface UploadAudioRequest {
  voiceId: string;
  workspaceId: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Response from voice operations
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

