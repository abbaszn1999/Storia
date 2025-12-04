import { randomUUID } from "crypto";
import {
  MissingApiKeyError,
  ProviderRequestError,
} from "../errors";
import { getProviderConfig } from "../config";
import type { AiProviderAdapter } from "./base-provider";
import { registerProvider } from "./base-provider";
import type { AiRequest } from "../types";

const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_POLL_TIMEOUT_MS = 120000;
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

  while (true) {
    await sleep(intervalMs);
    // For polling, we use taskType: "getResponse" with the original taskUUID
    const res = await fetch(pollUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(
        refs.map((ref) => ({
          taskType: "getResponse",
          taskUUID: ref.taskUUID,
        })),
      ),
    });

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

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(tasks),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new ProviderRequestError("runware", details);
    }

    const initialPayload = await response.json();
    let results = initialPayload?.data ?? [];

    const needsPolling =
      tasks.some((task) => task.deliveryMethod === "async") ||
      results.some((item: any) => item?.status && item.status !== "success");

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

