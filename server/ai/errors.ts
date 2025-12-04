export class MissingApiKeyError extends Error {
  constructor(provider: string) {
    super(`Missing API key for provider: ${provider}`);
    this.name = "MissingApiKeyError";
  }
}

export class UnsupportedModelError extends Error {
  constructor(provider: string, model: string) {
    super(`Model "${model}" is not configured for provider "${provider}"`);
    this.name = "UnsupportedModelError";
  }
}

export class InsufficientCreditsError extends Error {
  constructor(message = "Insufficient credits for this AI request") {
    super(message);
    this.name = "InsufficientCreditsError";
  }
}

export class ProviderRequestError extends Error {
  constructor(provider: string, details?: string) {
    super(
      `Provider "${provider}" call failed${
        details ? `: ${details}` : ""
      }`.trim(),
    );
    this.name = "ProviderRequestError";
  }
}

