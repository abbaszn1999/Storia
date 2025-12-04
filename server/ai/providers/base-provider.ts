import type {
  AiProviderConfig,
  AiProviderName,
  AiModelConfig,
  AiRequest,
  AiResponse,
  AiUsage,
} from "../types";

export interface ProviderCallParams {
  request: AiRequest;
  providerConfig: AiProviderConfig;
  modelConfig: AiModelConfig;
}

export interface ProviderCallResult extends AiResponse {
  usage?: AiUsage;
  rawResponse?: unknown;
}

export interface AiProviderAdapter {
  name: AiProviderName;
  supports(model: string): boolean;
  call(params: ProviderCallParams): Promise<ProviderCallResult>;
}

const registry = new Map<AiProviderName, AiProviderAdapter>();

export function registerProvider(adapter: AiProviderAdapter): void {
  registry.set(adapter.name, adapter);
}

export function getProviderAdapter(
  provider: AiProviderName,
): AiProviderAdapter {
  const adapter = registry.get(provider);
  if (!adapter) {
    throw new Error(`Provider adapter not registered: ${provider}`);
  }
  return adapter;
}

export function listRegisteredProviders(): AiProviderName[] {
  return Array.from(registry.keys());
}

