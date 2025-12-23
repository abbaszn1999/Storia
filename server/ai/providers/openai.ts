import { ProviderRequestError, MissingApiKeyError } from "../errors";
import { getProviderConfig } from "../config";
import type { AiProviderAdapter } from "./base-provider";
import { registerProvider } from "./base-provider";

function trimTrailingSlash(url: string | undefined): string {
  if (!url) return "";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function extractOutputText(data: any): string | undefined {
  if (typeof data?.output_text === "string") {
    return data.output_text;
  }

  if (Array.isArray(data?.output)) {
    const textSegments: string[] = [];
    for (const message of data.output) {
      if (!message?.content) continue;
      for (const part of message.content) {
        if (part?.type === "output_text" && typeof part.text === "string") {
          textSegments.push(part.text);
        }
      }
    }
    if (textSegments.length > 0) {
      return textSegments.join("\n").trim();
    }
  }
  return undefined;
}

const openAiAdapter: AiProviderAdapter = {
  name: "openai",
  supports(model: string) {
    const provider = getProviderConfig("openai");
    return Boolean(provider.models[model]);
  },
  async call({ request, providerConfig, modelConfig }) {
    if (!providerConfig.apiKey) {
      throw new MissingApiKeyError("openai");
    }

    const baseUrl = trimTrailingSlash(providerConfig.baseUrl);
    const url = `${baseUrl}/responses`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${providerConfig.apiKey}`,
    };

    if (providerConfig.organizationId) {
      headers["OpenAI-Organization"] = providerConfig.organizationId;
    }

    const basePayload: Record<string, unknown> = {
      model: modelConfig.name,
      ...request.payload,
    };

    if (request.cache?.key) {
      basePayload.prompt_cache_key = request.cache.key;
    }

    if (request.cache?.retention === "24h") {
      basePayload.prompt_cache_retention = request.cache.retention;
    }

    const body = JSON.stringify(basePayload);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dce8bcc2-d9cf-48dc-80b9-5e2289140a64',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:68',message:'Request body being sent to OpenAI',data:{url,body:body.substring(0,2000),payloadKeys:Object.keys(basePayload),inputStructure:basePayload.input?JSON.stringify(basePayload.input).substring(0,500):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      const details = await response.text();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/dce8bcc2-d9cf-48dc-80b9-5e2289140a64',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:77',message:'OpenAI API error response',data:{status:response.status,statusText:response.statusText,details,bodyPreview:body.substring(0,1000)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      throw new ProviderRequestError("openai", details);
    }

    const data = await response.json();
    const output = extractOutputText(data) ?? data.output ?? data;

    return {
      provider: "openai",
      model: modelConfig.name,
      output,
      rawResponse: data,
      usage: data.usage
        ? {
            inputTokens: data.usage.input_tokens,
            outputTokens: data.usage.output_tokens,
            reasoningTokens: data.usage.reasoning_tokens,
            cachedTokens: data.usage.prompt_tokens_details?.cached_tokens,
          }
        : undefined,
    };
  },
};

registerProvider(openAiAdapter);

export { openAiAdapter };

