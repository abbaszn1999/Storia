import { randomUUID } from "crypto";
import {
  MissingApiKeyError,
  ProviderRequestError,
} from "../errors";
import { getProviderConfig } from "../config";
import type { AiProviderAdapter } from "./base-provider";
import { registerProvider } from "./base-provider";
import type { AiRequest } from "../types";

const DEFAULT_POLL_INTERVAL_MS = 3000; // 3 seconds
const DEFAULT_POLL_TIMEOUT_MS = 600000; // 10 minutes (video generation can take a while)
const RUNWARE_DEFAULT_BASE = "https://api.runware.ai/v1";

function trimTrailingSlash(url: string | undefined): string {
  if (!url) return "";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function ensureArrayPayload(
  payload: Record<string, unknown> | Record<string, unknown>[],
): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.slice();
  }
  return [payload];
}

function injectDefaultsIntoTask(
  task: Record<string, any>,
  request: AiRequest,
): Record<string, any> {
  if (!task.taskUUID) {
    task.taskUUID = randomUUID();
  }
  if (!task.taskType) {
    task.taskType =
      request.task === "video-generation"
        ? "videoInference"
        : "imageInference";
  }
  if (!task.deliveryMethod && request.runware?.deliveryMethod) {
    task.deliveryMethod = request.runware.deliveryMethod;
  }
  if (!task.outputType && request.task === "image-generation") {
    task.outputType = "URL";
  }
  return task;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollRunwareTasks({
  pollUrl,
  apiKey,
  refs,
  intervalMs,
  timeoutMs,
}: {
  pollUrl: string;
  apiKey: string;
  refs: Array<Pick<Record<string, any>, "taskUUID" | "taskType">>;
  intervalMs: number;
  timeoutMs: number;
}) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  const start = Date.now();
  const maxRetryAttempts = 3; // Maximum retries per polling request
  const requestTimeout = 30000; // 30 seconds timeout per request

  while (true) {
    await sleep(intervalMs);
    
    // Retry logic للتعامل مع network errors
    let res: Response | undefined;
    let retryAttempt = 0;
    
    while (retryAttempt < maxRetryAttempts) {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), requestTimeout);
        
        // For polling, we use taskType: "getResponse" with the original taskUUID
        res = await fetch(pollUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(
            refs.map((ref) => ({
              taskType: "getResponse",
              taskUUID: ref.taskUUID,
            })),
          ),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        break; // نجح - اخرج من retry loop
      } catch (fetchError: any) {
        retryAttempt++;
        const isNetworkError = 
          fetchError.code === 'ECONNRESET' || 
          fetchError.code === 'ETIMEDOUT' ||
          fetchError.message?.includes('fetch failed') ||
          fetchError.name === 'AbortError' ||
          fetchError.message?.includes('aborted');
        
        if (isNetworkError && retryAttempt < maxRetryAttempts) {
          console.warn(`[runware] Polling request failed (attempt ${retryAttempt}/${maxRetryAttempts}), retrying...`, {
            error: fetchError.message,
            code: fetchError.code,
            name: fetchError.name,
          });
          // Exponential backoff
          await sleep(intervalMs * retryAttempt);
          continue;
        } else {
          // إما أنه ليس network error، أو وصلنا للحد الأقصى
          console.error('[runware] Polling request failed after retries:', {
            error: fetchError.message,
            code: fetchError.code,
            name: fetchError.name,
            retryAttempt,
          });
          throw fetchError;
        }
      }
    }

    // If res is still undefined after all retries, throw an error
    if (!res) {
      throw new Error("Runware polling request failed: no response after all retry attempts");
    }

    if (!res.ok) {
      const details = await res.text();
      throw new ProviderRequestError("runware", details);
    }

    const data = await res.json();
    const tasks = data?.data ?? [];
    const done = tasks.every(
      (task: any) => task.status && task.status !== "processing",
    );
    if (done) {
      return tasks;
    }

    if (Date.now() - start > timeoutMs) {
      throw new Error("Runware polling timeout exceeded");
    }
  }
}

const runwareAdapter: AiProviderAdapter = {
  name: "runware",
  supports(model: string) {
    const provider = getProviderConfig("runware");
    return Boolean(provider.models[model]);
  },
  async call({ request, providerConfig, modelConfig }) {
    if (!providerConfig.apiKey) {
      throw new MissingApiKeyError("runware");
    }

    const tasks = ensureArrayPayload(request.payload).map((task) =>
      injectDefaultsIntoTask({ ...task }, request),
    );

    const baseUrl =
      trimTrailingSlash(providerConfig.baseUrl) || RUNWARE_DEFAULT_BASE;
    const endpoint = baseUrl;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${providerConfig.apiKey}`,
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // DEBUG: Log the full request details
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('[runware] Sending request:', {
      endpoint,
      taskCount: tasks.length,
      tasks: tasks.map((t: any) => ({
        taskType: t.taskType,
        taskUUID: t.taskUUID?.substring(0, 8) + '...',
        model: t.model,
        promptLength: t.positivePrompt?.length,
        promptPreview: t.positivePrompt?.substring(0, 80) + '...',
        hasReferenceImages: Boolean(t.referenceImages?.length),
        referenceImagesCount: t.referenceImages?.length || 0,
        width: t.width,
        height: t.height,
      })),
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(tasks),
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // DEBUG: Log response status
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('[runware] Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const details = await response.text();
      console.error('[runware] Request failed with details:', details);
      throw new ProviderRequestError("runware", details);
    }

    const initialPayload = await response.json();
    
    // ═══════════════════════════════════════════════════════════════════════════
    // DEBUG: Log full response structure
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('[runware] Response payload:', {
      hasData: Boolean(initialPayload?.data),
      dataCount: initialPayload?.data?.length || 0,
      hasErrors: Boolean(initialPayload?.errors),
      errorCount: initialPayload?.errors?.length || 0,
      // Log each data item's key fields
      dataItems: initialPayload?.data?.map((d: any) => ({
        taskUUID: d.taskUUID?.substring(0, 8) + '...',
        hasImageURL: Boolean(d.imageURL),
        status: d.status,
        cost: d.cost,
      })),
      // Log error details
      errors: initialPayload?.errors?.map((e: any) => ({
        code: e.code,
        message: e.message,
        taskUUID: e.taskUUID?.substring(0, 8) + '...',
      })),
    });
    
    // ═══════════════════════════════════════════════════════════════════════════
    // HANDLE PARTIAL ERRORS: Some tasks may succeed while others fail
    // Runware returns { data: [...successes], errors: [...failures] }
    // ═══════════════════════════════════════════════════════════════════════════
    if (initialPayload?.errors && initialPayload.errors.length > 0) {
      const hasData = initialPayload?.data && initialPayload.data.length > 0;
      
      if (!hasData) {
        // Complete failure - all tasks failed
        const errorDetails = JSON.stringify(initialPayload, null, 4);
        throw new ProviderRequestError("runware", errorDetails);
      }
      
      // Partial failure - log warning but continue with available data
      console.warn('[runware] Partial failure detected:', {
        successCount: initialPayload.data.length,
        errorCount: initialPayload.errors.length,
        errors: initialPayload.errors.map((e: any) => ({
          code: e.code,
          message: e.message?.substring(0, 100),
          taskUUID: e.taskUUID,
        })),
      });
      
      // Merge errors into data array so we can match them by taskUUID
      // Add error info to each failed task
      for (const error of initialPayload.errors) {
        if (error.taskUUID) {
          initialPayload.data.push({
            taskUUID: error.taskUUID,
            error: error.message || error.code || 'Unknown error',
            status: 'failed',
          });
        }
      }
    }
    
    let results = initialPayload?.data ?? [];

    // Only poll if there are tasks still processing (not for already completed/failed tasks)
    // "processing" means the task is still being worked on
    // "failed" or undefined status with imageURL means the task is complete
    const needsPolling =
      tasks.some((task) => task.deliveryMethod === "async") ||
      results.some((item: any) => item?.status === "processing");

    if (needsPolling) {
      const refs = tasks.map((task, idx) => ({
        taskUUID:
          (results[idx] && results[idx].taskUUID) || task.taskUUID,
        taskType: task.taskType,
      }));

      // Polling uses the same endpoint with taskType: "getResponse"
      const pollEndpoint = request.runware?.getResponsePath ?? baseUrl;

      results = await pollRunwareTasks({
        pollUrl: pollEndpoint,
        apiKey: providerConfig.apiKey,
        refs,
        intervalMs:
          request.runware?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS,
        timeoutMs:
          request.runware?.timeoutMs ?? DEFAULT_POLL_TIMEOUT_MS,
      });
    }

    const totalCost = results.reduce(
      (acc: number, item: any) => acc + (item.cost ?? 0),
      0,
    );

    return {
      provider: "runware",
      model: modelConfig.name,
      output: results,
      usage: totalCost
        ? {
            totalCostUsd: totalCost,
          }
        : undefined,
      rawResponse: results,
    };
  },
};

registerProvider(runwareAdapter);

export { runwareAdapter };

