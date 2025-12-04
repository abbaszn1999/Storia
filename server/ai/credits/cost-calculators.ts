import type { AiModelConfig, AiRequest, AiUsage } from "../types";

export interface CostEstimateInput {
  modelConfig: AiModelConfig;
  expectedInputTokens?: number;
  expectedOutputTokens?: number;
  request?: AiRequest;
}

export interface CostFromUsageInput {
  modelConfig: AiModelConfig;
  usage?: AiUsage;
}

function costPerTokens(tokens: number | undefined, rate: number | undefined) {
  if (!tokens || !rate) return 0;
  return (tokens / 1000) * rate;
}

/**
 * Determines the resolution tier based on pixel dimensions.
 * - 1k: ≤ 1024×1024 (1,048,576 pixels)
 * - 2k: ≤ 2048×2048 (4,194,304 pixels)
 * - 4k: > 2048×2048
 */
function getResolutionTier(
  width: number,
  height: number,
): "1k" | "2k" | "4k" {
  const pixels = width * height;
  if (pixels <= 1048576) return "1k"; // ≤ 1024×1024
  if (pixels <= 4194304) return "2k"; // ≤ 2048×2048
  return "4k"; // > 2048×2048
}

/**
 * Normalizes video resolution to standard format (720p, 768p, 1080p, 4k)
 */
function normalizeVideoResolution(
  resolution?: string | number,
  height?: number,
): "720p" | "768p" | "1080p" | "4k" {
  // If resolution string provided (e.g., "1080p", "720p")
  if (typeof resolution === "string") {
    const normalized = resolution.toLowerCase().replace("p", "");
    if (normalized === "4k" || normalized === "2160") return "4k";
    if (normalized === "1080") return "1080p";
    if (normalized === "768") return "768p";
    return "720p";
  }
  // If height provided as number
  if (typeof height === "number") {
    if (height >= 2160) return "4k";
    if (height >= 1080) return "1080p";
    if (height >= 768) return "768p";
    return "720p";
  }
  // Default
  return "720p";
}

/**
 * Gets video price based on resolution and duration.
 * Returns the price for the exact or nearest configuration.
 */
function getVideoPriceByConfig(
  pricing: import("../types").AiModelPricing,
  resolution: "720p" | "768p" | "1080p" | "4k",
  duration: number,
): number | null {
  const config = pricing.pricePerVideoByConfig;
  if (!config) return null;

  const resConfig = config[resolution];
  if (!resConfig) {
    // Try fallback resolutions
    const fallbacks: ("720p" | "768p" | "1080p" | "4k")[] =
      resolution === "4k"
        ? ["1080p", "768p", "720p"]
        : resolution === "1080p"
          ? ["768p", "720p"]
          : resolution === "768p"
            ? ["720p", "1080p"]
            : ["768p", "1080p"];
    for (const fb of fallbacks) {
      if (config[fb]) {
        return getVideoPriceByConfig(pricing, fb, duration);
      }
    }
    return null;
  }

  // Try exact duration match
  if (resConfig[duration] !== undefined) {
    return resConfig[duration];
  }

  // Find closest duration and scale proportionally
  const durations = Object.keys(resConfig)
    .map(Number)
    .sort((a, b) => a - b);
  if (durations.length === 0) return null;

  const closest = durations.reduce((prev, curr) =>
    Math.abs(curr - duration) < Math.abs(prev - duration) ? curr : prev,
  );

  // Calculate price per second from closest config, then multiply by actual duration
  const basePrice = resConfig[closest];
  const pricePerSecond = basePrice / closest;
  return pricePerSecond * duration;
}

export function estimateRequestCost({
  modelConfig,
  expectedInputTokens = 0,
  expectedOutputTokens = 0,
  request,
}: CostEstimateInput): number {
  const fixed = estimateFixedPriceCost(modelConfig, request);
  if (fixed !== null) {
    return fixed;
  }

  const { pricing } = modelConfig;
  const inputCost = costPerTokens(
    expectedInputTokens,
    pricing.inputCostPer1KTokens,
  );
  const outputCost = costPerTokens(
    expectedOutputTokens,
    pricing.outputCostPer1KTokens,
  );
  return (
    inputCost +
    outputCost +
    (pricing.flatCostPerCall ? pricing.flatCostPerCall : 0)
  );
}

export function calculateCostFromUsage({
  modelConfig,
  usage,
}: CostFromUsageInput): number {
  if (!usage) return 0;
  if (usage.totalCostUsd !== undefined) {
    return usage.totalCostUsd;
  }
  const { pricing } = modelConfig;
  const inputCost = costPerTokens(
    usage.inputTokens,
    pricing.inputCostPer1KTokens,
  );
  const outputCost = costPerTokens(
    usage.outputTokens,
    pricing.outputCostPer1KTokens,
  );
  return (
    inputCost +
    outputCost +
    (pricing.flatCostPerCall ? pricing.flatCostPerCall : 0)
  );
}

function estimateFixedPriceCost(
  modelConfig: AiModelConfig,
  request?: AiRequest,
): number | null {
  if (!request) return null;
  const pricing = modelConfig.pricing;
  if (!pricing) return null;

  const payload = request.payload as any;
  const items: any[] = Array.isArray(payload)
    ? payload
    : typeof payload === "object" && payload !== null
      ? [payload]
      : [];

  // Handle image generation with resolution-based pricing
  if (request.task === "image-generation") {
    if (pricing.pricePerImageByResolution) {
      // Calculate cost per item based on its resolution
      return items.reduce((total, task) => {
        const width = typeof task?.width === "number" ? task.width : 1024;
        const height = typeof task?.height === "number" ? task.height : 1024;
        const tier = getResolutionTier(width, height);
        const numResults =
          typeof task?.numberResults === "number" && task.numberResults > 0
            ? task.numberResults
            : 1;
        const price =
          pricing.pricePerImageByResolution?.[tier] ??
          pricing.pricePerImage ??
          0;
        return total + price * numResults;
      }, 0);
    }
    // Fallback to flat price per image
    if (pricing.pricePerImage) {
      const totalVariants =
        items.reduce((acc, task) => {
          const value =
            typeof task?.numberResults === "number" && task.numberResults > 0
              ? task.numberResults
              : 1;
          return acc + value;
        }, 0) || 1;
      return totalVariants * pricing.pricePerImage;
    }
  }

  // Handle video generation with resolution+duration pricing
  if (request.task === "video-generation") {
    return items.reduce((total, task) => {
      const numResults =
        typeof task?.numberResults === "number" && task.numberResults > 0
          ? task.numberResults
          : 1;

      // Try pricePerSecond first (e.g., LTX-2 Retake: $0.10/sec)
      if (pricing.pricePerSecond && typeof task?.duration === "number") {
        return total + pricing.pricePerSecond * task.duration * numResults;
      }

      // Try resolution+duration pricing
      if (pricing.pricePerVideoByConfig) {
        const resolution = normalizeVideoResolution(
          task?.resolution,
          task?.height,
        );
        const duration =
          typeof task?.duration === "number"
            ? task.duration
            : modelConfig.metadata.defaultDuration ?? 5;
        const configPrice = getVideoPriceByConfig(pricing, resolution, duration);
        if (configPrice !== null) {
          return total + configPrice * numResults;
        }
      }

      // Fallback to flat price per video
      if (pricing.pricePerVideo) {
        return total + pricing.pricePerVideo * numResults;
      }

      return total;
    }, 0);
  }

  return null;
}

