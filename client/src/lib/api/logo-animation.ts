// Logo Animation API Client

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface LogoGenerateRequest {
  /** Project name (required for saving to Bunny/DB) */
  title: string;
  /** Workspace ID (required) */
  workspaceId: string;
  /** Visual prompt describing the logo animation */
  visualPrompt: string;
  /** Reference image (base64 or URL) - optional */
  referenceImage?: string;
  /** Aspect ratio (16:9 or 9:16) */
  aspectRatio: string;
  /** Resolution (720p or 1080p) */
  resolution: string;
  /** Duration in seconds (4, 6, or 8) */
  duration: number;
}

export interface LogoGenerateResponse {
  taskId: string;
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  cost?: number;
  error?: string;
  /** Story ID from database */
  storyId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// API BASE
// ═══════════════════════════════════════════════════════════════════════════

const API_BASE = "/api/videos/logo-animation";

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `API Error: ${response.status}`);
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a creative visual prompt for logo animation
 */
export async function generateIdea(
  idea: string,
  duration: number,
  referenceImage?: string
): Promise<{ visualPrompt: string; cost?: number }> {
  return fetchAPI<{ visualPrompt: string; cost?: number }>("/generate-idea", {
    method: "POST",
    body: JSON.stringify({ 
      idea, 
      duration,
      ...(referenceImage && { referenceImage }),
    }),
  });
}

/**
 * Start logo animation video generation
 */
export async function generateVideo(
  request: LogoGenerateRequest
): Promise<LogoGenerateResponse> {
  return fetchAPI<LogoGenerateResponse>("/generate", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Check video generation status
 */
export async function checkVideoStatus(
  taskId: string
): Promise<LogoGenerateResponse> {
  return fetchAPI<LogoGenerateResponse>(`/status/${taskId}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// POLLING HELPER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Poll for video completion
 */
export async function pollVideoStatus(
  taskId: string,
  options: {
    intervalMs?: number;
    maxAttempts?: number;
    onProgress?: (status: LogoGenerateResponse) => void;
  } = {}
): Promise<LogoGenerateResponse> {
  const { intervalMs = 3000, maxAttempts = 100, onProgress } = options;

  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await checkVideoStatus(taskId);
    onProgress?.(status);

    if (status.status === "completed" || status.status === "failed") {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    attempts++;
  }

  throw new Error("Video generation timed out");
}

