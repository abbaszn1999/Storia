import type { AiRequest, AiResponse } from "./types";
import { getModelConfig, getProviderConfig } from "./config";
import { UnsupportedModelError } from "./errors";
import {
  ensureBalance,
  chargeCredits,
  refundCredits,
} from "./credits/credit-manager";
import {
  estimateRequestCost,
  calculateCostFromUsage,
} from "./credits/cost-calculators";
import { getProviderAdapter } from "./providers";
import "./providers";

export interface CallAiOptions {
  expectedInputTokens?: number;
  expectedOutputTokens?: number;
  skipCreditCheck?: boolean;
  metadata?: Record<string, unknown>;
}

export async function callAi<T = unknown>(
  request: AiRequest,
  options: CallAiOptions = {},
): Promise<AiResponse<T>> {
  const providerConfig = getProviderConfig(request.provider);
  if (!providerConfig.enabled) {
    throw new Error(`Provider ${request.provider} is disabled`);
  }

  const modelConfig = getModelConfig(request.provider, request.model);
  const adapter = getProviderAdapter(request.provider);

  if (!adapter.supports(modelConfig.name)) {
    throw new UnsupportedModelError(request.provider, modelConfig.name);
  }

  const estimatedCostUsd = options.skipCreditCheck
    ? 0
    : estimateRequestCost({
        modelConfig,
        expectedInputTokens: options.expectedInputTokens,
        expectedOutputTokens: options.expectedOutputTokens,
        request,
      });

  if (!options.skipCreditCheck) {
    await ensureBalance({
      userId: request.userId,
      workspaceId: request.workspaceId,
      estimatedCostUsd,
    });
  }

  const startedAt = Date.now();
  let result: AiResponse<T>;
  try {
    const providerResult = await adapter.call({
      request,
      providerConfig,
      modelConfig,
    });

    result = {
      provider: providerResult.provider,
      model: providerResult.model,
      output: providerResult.output as T,
      usage: providerResult.usage,
      rawResponse: providerResult.rawResponse,
    };
  } catch (error) {
    throw error;
  }

  const actualCostUsd = calculateCostFromUsage({
    modelConfig,
    usage: result.usage,
  });

  const durationMs = Date.now() - startedAt;

  if (actualCostUsd > 0) {
    await chargeCredits({
      userId: request.userId,
      workspaceId: request.workspaceId,
      amountUsd: actualCostUsd,
      metadata: {
        provider: request.provider,
        model: request.model,
        durationMs,
        ...options.metadata,
      },
    });
  } else if (estimatedCostUsd > 0) {
    await chargeCredits({
      userId: request.userId,
      workspaceId: request.workspaceId,
      amountUsd: estimatedCostUsd,
      metadata: {
        provider: request.provider,
        model: request.model,
        durationMs,
        fallback: true,
        ...options.metadata,
      },
    });
  }

  if (result.usage) {
    const logCost = actualCostUsd || estimatedCostUsd;
    const usageDetails = [
      result.usage.inputTokens
        ? `input=${result.usage.inputTokens}`
        : undefined,
      result.usage.outputTokens
        ? `output=${result.usage.outputTokens}`
        : undefined,
      result.usage.reasoningTokens
        ? `reasoning=${result.usage.reasoningTokens}`
        : undefined,
      result.usage.cachedTokens
        ? `cached=${result.usage.cachedTokens}`
        : undefined,
    ]
      .filter(Boolean)
      .join(", ");
    console.log(
      `[ai] ${request.provider}/${request.model} (${durationMs}ms) usage{${usageDetails}} cost=$${logCost.toFixed(
        6,
      )}`,
    );
  }

  return result;
}

export async function callTextModel(
  request: Omit<AiRequest, "task">,
  options?: CallAiOptions,
): Promise<AiResponse<string>> {
  return callAi<string>(
    {
      ...request,
      task: "text-generation",
    },
    options,
  );
}

export async function safeCallAi<T = unknown>(
  request: AiRequest,
  options?: CallAiOptions,
): Promise<AiResponse<T> | null> {
  try {
    return await callAi<T>(request, options);
  } catch (error) {
    console.error("[ai-service] call failed", error);
    try {
      await refundCredits({
        userId: request.userId,
        workspaceId: request.workspaceId,
        amountUsd: options?.expectedInputTokens
          ? options.expectedInputTokens / 1000
          : 0,
      });
    } catch {
      // swallow refund issues in safe mode
    }
    return null;
  }
}

