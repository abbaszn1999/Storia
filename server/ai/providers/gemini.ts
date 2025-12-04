import { ProviderRequestError, MissingApiKeyError } from "../errors";
import { getProviderConfig } from "../config";
import type { AiProviderAdapter } from "./base-provider";
import { registerProvider } from "./base-provider";

function trimTrailingSlash(url: string | undefined): string {
  if (!url) return "";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function extractGeminiText(data: any): string | undefined {
  const candidates = data?.candidates;
  if (!Array.isArray(candidates)) return undefined;

  const texts: string[] = [];
  for (const candidate of candidates) {
    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts)) continue;
    for (const part of parts) {
      if (typeof part?.text === "string") {
        texts.push(part.text);
      }
    }
  }
  return texts.length ? texts.join("\n").trim() : undefined;
}

const geminiAdapter: AiProviderAdapter = {
  name: "gemini",
  supports(model: string) {
    const provider = getProviderConfig("gemini");
    return Boolean(provider.models[model]);
  },
  async call({ request, providerConfig, modelConfig }) {
    if (!providerConfig.apiKey) {
      throw new MissingApiKeyError("gemini");
    }

    const baseUrl = trimTrailingSlash(providerConfig.baseUrl);
    const url = `${baseUrl}/models/${modelConfig.name}:generateContent`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-goog-api-key": providerConfig.apiKey,
    };

    const payload = {
      ...request.payload,
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new ProviderRequestError("gemini", details);
    }

    const data = await response.json();

    return {
      provider: "gemini",
      model: modelConfig.name,
      output: extractGeminiText(data) ?? data,
      rawResponse: data,
      usage: data.usageMetadata
        ? {
            inputTokens: data.usageMetadata.promptTokenCount,
            outputTokens: data.usageMetadata.candidatesTokenCount,
            cachedTokens:
              data.usageMetadata.cachedContentTokenCount ??
              data.usageMetadata.cachedTokens,
          }
        : undefined,
    };
  },
};

registerProvider(geminiAdapter);

export { geminiAdapter };

