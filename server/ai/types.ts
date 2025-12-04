/**
 * Shared type definitions used across the AI calling layer.
 */

export type AiProviderName = "openai" | "gemini" | "runware";

export type AiTask =
  | "text-generation"
  | "function-calling"
  | "vision"
  | "audio"
  | "image-generation"
  | "video-generation"
  | "image-to-image"
  | "image-to-video"
  | "video-to-video"
  | "inpainting";

export interface AiModelMetadata {
  label: string;
  description?: string;
  supports: AiTask[];
  reasoning?: boolean;
  /** Default number of inference steps */
  defaultSteps?: number;
  /** Default resolution (e.g., "1024x1024", "720p", "1080p", "4K") */
  defaultResolution?: string;
  /** Default video duration in seconds */
  defaultDuration?: number;
}

export interface AiModelPricing {
  currency: "usd";
  inputCostPer1KTokens?: number;
  outputCostPer1KTokens?: number;
  flatCostPerCall?: number;
  cacheInputCostPer1KTokens?: number;
  cacheStorageCostPer1MTokensPerHour?: number;
  pricePerImage?: number;
  /** Resolution-based pricing for images (1k=1024², 2k=2048², 4k=4096²) */
  pricePerImageByResolution?: {
    "1k"?: number;
    "2k"?: number;
    "4k"?: number;
  };
  pricePerVideo?: number;
  /** Price per second for video (e.g., LTX-2 Retake) */
  pricePerSecond?: number;
  /** Video pricing by resolution → duration → price */
  pricePerVideoByConfig?: {
    "720p"?: Record<number, number>;
    "768p"?: Record<number, number>;
    "1080p"?: Record<number, number>;
    "4k"?: Record<number, number>;
  };
  videoPriceUnit?: string;
}

export interface RunwareRequestOptions {
  deliveryMethod?: "sync" | "async";
  pollIntervalMs?: number;
  timeoutMs?: number;
  getResponsePath?: string;
}

export interface AiModelConfig {
  name: string;
  provider: AiProviderName;
  default?: boolean;
  pricing: AiModelPricing;
  metadata: AiModelMetadata;
}

export interface AiProviderConfig {
  name: AiProviderName;
  apiKey?: string;
  baseUrl?: string;
  organizationId?: string;
  models: Record<string, AiModelConfig>;
  enabled: boolean;
}

export interface AiUsage {
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  cachedTokens?: number;
  totalCostUsd?: number;
  unit?: "tokens" | "characters" | "seconds";
}

export type CacheRetentionPolicy = "in_memory" | "24h";

export interface AiCacheControls {
  key?: string;
  retention?: CacheRetentionPolicy;
}

export interface AiRequest {
  provider: AiProviderName;
  model: string;
  task: AiTask;
  payload: Record<string, unknown> | Record<string, unknown>[];
  metadata?: Record<string, unknown>;
  userId?: string;
  workspaceId?: string;
  cache?: AiCacheControls;
  runware?: RunwareRequestOptions;
}

export interface AiResponse<TPayload = unknown> {
  provider: AiProviderName;
  model: string;
  output: TPayload;
  usage?: AiUsage;
  rawResponse?: unknown;
}

