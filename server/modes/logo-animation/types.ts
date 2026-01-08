// Logo Animation Types


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

