## AI Calling Layer

This folder hosts the internal service that centralizes all outbound AI provider calls (OpenAI + Google Gemini + Runware). The goal is to keep every mode/agent in the project decoupled from provider-specific logic.


### Directory structure

- `config.ts` – Loads provider/model metadata from environment variables and defines pricing metadata that the credit system can consume.
- `types.ts` – Shared types for requests, responses, pricing, and usage.
- `errors.ts` – Common error types (missing API key, unsupported model, credit failures, etc.).
- `service.ts` – Central entry point (`callAi`, `callTextModel`, `safeCallAi`) that enforces credit checks, selects the provider adapter, and records usage costs.
- `providers/` – Contains the base adapter contract plus concrete adapters for OpenAI, Gemini, and Runware. Importing `providers/index.ts` registers every adapter automatically.
- `credits/` – In-memory credit balance manager (`credit-manager.ts`) and utility calculators (`cost-calculators.ts`). Designed to be swapped with a persistent store later.

### Provider references

All adapters mirror the latest public HTTP interfaces:

1. **OpenAI Responses API**  
   `POST https://api.openai.com/v1/responses` with `Authorization: Bearer <OPENAI_API_KEY>` and payloads such as:
   ```json
   {
     "model": "gpt-5-nano",
     "input": "Write a one-sentence bedtime story about a unicorn."
   }
   ```
   The response’s `output` array may mix text, tool calls, or reasoning tokens, so the adapter aggregates `output_text` when available.

2. **Google Gemini Function Calling**  
   `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent` with header `x-goog-api-key`. Requests can include `tools`/`functionDeclarations` for function calling, and responses contain `candidates[].content.parts`. The adapter extracts text snippets but also returns the raw JSON for advanced flows.

### Usage from other modules

```ts
import { callTextModel } from "@/ai";

const result = await callTextModel({
  provider: "openai",
  model: "gpt-5-nano",
  payload: {
    instructions: "You are a helpful assistant.",
    input: [{ role: "user", content: "Hello!" }],
  },
});

console.log(result.output); // aggregated string
```

Set the required environment variables (e.g., `OPENAI_API_KEY`, `GEMINI_API_KEY`, `RUNWARE_API_KEY`). Optional overrides such as `OPENAI_BASE_URL`, `OPENAI_ORG_ID`, `GEMINI_API_BASE`, or `RUNWARE_BASE_URL` are supported for on-prem proxies.

> **Note:** To respect the current request, no files outside `server/ai/` were modified. Consumers can adopt the service by importing from `server/ai` when ready.

## Prompt caching (OpenAI)

Recent OpenAI models (GPT‑4o and newer) automatically cache the first 1k+ tokens of a prompt. To maximize cache hits:

- Put static instructions/system prompts/examples at the start of the prompt and append per-user data at the end. Cache matches require identical prefixes.
- Optionally supply a `prompt_cache_key` (via `AiRequest.cache.key`) so related workloads are routed to the same cache shard. Keep each unique key + prefix combination below ~15 req/min to avoid overflow.
- Choose a retention policy via `AiRequest.cache.retention` (`"in_memory"` default, `"24h"` extended for GPT‑5.x / GPT‑4.1). Extended caching may keep prefixes for up to 24h but is not ZDR-eligible.
- Monitor `usage.prompt_tokens_details.cached_tokens` (logged automatically) to see how many input tokens benefited from the cache. A higher cached count indicates reduced cost/latency.
- Requests under 1024 tokens will report `cached_tokens: 0`; they still run normally but without cache savings.

Example:

```ts
await callTextModel(
  {
    provider: "openai",
    model: "gpt-5",
    cache: {
      key: "storyboard-v1",
      retention: "24h",
    },
    payload: {
      instructions: STATIC_PROMPT,
      input: dynamicInput,
    },
  },
  { metadata: { agent: "storyboard" } },
);
```

No extra billing is incurred for caching, but cached prompts still count toward rate limits.

## Prompt caching (Gemini)

Gemini 2.5 models already include implicit caching—Google automatically discounts requests when identical prefixes are seen (see `usage_metadata.cached_content_token_count`). To take advantage:

- Keep long, repeated context (system instructions, documents) at the start of your `contents`.
- Send similar prefixes in bursts so they land on warm caches (see token minimums: Flash 1024, Pro 4096, etc.).

For guaranteed savings you can opt into explicit caching:

- Use the Gemini Files + Caches APIs to upload large context once, then call `client.caches.create(...)` with `ttl`/`display_name`.
- Pass the resulting cache name into `GenerateContent` via `config.cached_content` (this value can be forwarded through `AiRequest.payload.config.cached_content`).
- The adapter surfaces `cachedTokens` from `usageMetadata` so you can observe how many tokens were served from cache inside your logs.

Explicit caching is ideal for massive, mostly-static prompts (docs, video transcripts, repository dumps). Remember that cached tokens still count toward the model’s token limit and rate limits, but they are billed at the reduced cached rate shown on [ai.google.dev/pricing](https://ai.google.dev/pricing).

### Gemini pricing reference (per 1K tokens, ≤200k tier)

| Model | Input | Output | Cache input | Storage (per 1M tokens·hr) |
| --- | --- | --- | --- | --- |
| `gemini-2.5-flash` | $0.00030 | $0.00250 | $0.00003 | $1.00 |
| `gemini-2.5-pro` | $0.00125 | $0.01000 | $0.000125 | $4.50 |
| `gemini-3-pro-preview` | $0.00200 | $0.01200 | $0.000200 | $4.50 |

> When prompts exceed 200k tokens, Google bills at the higher tier (roughly double the prices above). Update your `pricing` metadata if you plan to operate primarily in that range.

### OpenAI pricing reference (per 1K tokens)

| Model | Input | Cached input | Output |
| --- | --- | --- | --- |
| `gpt-5.1` | $0.00125 | $0.000125 | $0.0100 |
| `gpt-5` | $0.00125 | $0.000125 | $0.0100 |
| `gpt-5-mini` | $0.00025 | $0.000025 | $0.0020 |
| `gpt-5-nano` | $0.00005 | $0.000005 | $0.0004 |
| `gpt-4o` | $0.00250 | $0.00125 | $0.0100 |
| `o4-mini` | $0.00110 | $0.000275 | $0.0044 |

## Runware image/video inference

- **Image workflows**: set `task: "image-generation"`, pick `provider: "runware"` / `model: "runware-image"`, and pass an array shaped like Runware’s `imageInference` payloads. The adapter auto-generates `taskUUID` and defaults to URL outputs when unspecified.
- **Video workflows**: set `task: "video-generation"` with `taskType: "videoInference"` and `deliveryMethod: "async"` (required for long-form processing). The adapter polls `tasks/getResponse` until the video is ready; customize timing via `runware` options on `AiRequest`.
- **Async controls**: `runware: { deliveryMethod: "async", pollIntervalMs, timeoutMs, getResponsePath }` lets you fine-tune polling behavior. When polling resolves, the adapter returns the final response array so you can read `imageURL` / `videoURL`, `cost`, seeds, etc.

Image example:

```ts
await callAi({
  provider: "runware",
  model: "runware-image",
  task: "image-generation",
  payload: [
    {
      taskType: "imageInference",
      positivePrompt: "a serene mountain landscape at sunrise",
      model: "runware:101@1",
      numberResults: 1,
      deliveryMethod: "sync",
    },
  ],
  runware: { deliveryMethod: "sync" },
});
```

Video example:

```ts
await callAi({
  provider: "runware",
  model: "runware-video",
  task: "video-generation",
  payload: [
    {
      taskType: "videoInference",
      positivePrompt: "A cinematic drone shot over snowy mountains",
      model: "klingai:5@3",
      duration: 8,
      numberResults: 1,
      deliveryMethod: "async",
    },
  ],
  runware: { deliveryMethod: "async", timeoutMs: 180000 },
});
```

### Runware image pricing (per image, USD)

| Model | Resolution | Steps | Price |
| --- | --- | --- | --- |
| FLUX.2 dev (medium accel) | 1024×1024 | 28 | $0.0134 |
| FLUX.2 dev (high accel) | 1024×1024 | 28 | $0.0122 |
| FLUX.1 schnell | 1024×1024 | 4 | $0.0013 |
| FLUX.1 dev | 1024×1024 | 28 | $0.0038 |
| FLUX.1 Kontext dev | 1024×1024 | 28 | $0.0105 |
| Nano Banana 2 Pro (Gemini 3 Pro Image Preview) | 1024×1024 | – | $0.134 |
| Nano Banana 2 Pro (Gemini 3 Pro Image Preview) | 2048×2048 | – | $0.134 |
| Nano Banana 2 Pro (Gemini 3 Pro Image Preview) | 4096×4096 | – | $0.24 |
| Nano Banana (Gemini Flash Image 2.5) | 1024×1024 | – | $0.039 |
| Bria FIBO | 1024×1024 | 50 | $0.04 |
| Bria 3.2 | 1024×1024 | 8 | $0.04 |
| Midjourney (V6/V7) | 1024×1024 | – | $0.025 |
| SDXL 1.0 / SD 3 | 1024×1024 | 30 | $0.0019 |
| SD 1.5 | 512×512 | 30 | $0.0006 |
| Qwen-Image | 1024×1024 | 20 | $0.0058 |
| Qwen-Image-Edit | 1024×1024 | 8 | $0.0032 |
| Riverflow 1.1 Mini | 1024×1024 | – | $0.03 |
| Riverflow 1.1 | 1024×1024 | – | $0.039 |
| Riverflow 1.1 Pro | 1024×1024 | – | $0.077 |
| Riverflow 2 Preview Fast | 1024×1024 | – | $0.02525 |
| Riverflow 2 Preview Standard | 1024×1024 | – | $0.02945 |
| Riverflow 2 Preview Max | 1024×1024 | – | $0.06358 |
| HiDream-I1 Fast | 1024×1024 | 16 | $0.0032 |
| HiDream-I1 Dev | 1024×1024 | 28 | $0.0045 |
| HiDream-I1 Full | 1024×1024 | 30 | $0.009 |
| Seedream 3.0 | 1024×1024 | – | $0.018 |
| Seedream 4.0 / SeedEdit | 1024×1024 | – | $0.03 |
| FLUX.1 Kontext pro | 1024×1024 | – | $0.04 |
| FLUX.1 Kontext max | 1024×1024 | – | $0.08 |
| FLUX.1 Krea dev | 1024×1024 | 28 | $0.0098 |
| Google Imagen 4 Preview | 1024×1024 | – | $0.04 |
| Google Imagen 4 Ultra | 1024×1024 | – | $0.06 |

> بعض النماذج تشير إلى “view pricing docs” في لوحة Runware (مثل FLUX.2 pro/flex)؛ هذه تتطلب تواصلًا مباشرًا أو اشتراكًا مخصصًا لتحديد الرسوم.

### Runware video pricing (per clip, USD)

| Model | Resolution | Duration | Price |
| --- | --- | --- | --- |
| Sora 2 | 720p | 8s | $0.80 |
| Sora 2 Pro | 720p | 8s | $2.40 |
| Sora 2 Pro | 1080p | 8s | $4.00 |
| MiniMax Hailuo 2.3 | 768p | 6s | $0.28 |
| MiniMax Hailuo 2.3 Fast | 768p | 6s | $0.19 |
| MiniMax Hailuo 2.3 | 1080p | 6s | $0.49 |
| MiniMax Hailuo 2.3 Fast | 1080p | 6s | $0.33 |
| Seedance 1.0 Pro Fast | 720p | 5s | $0.0668 |
| Seedance 1.0 Pro Fast | 1080p | 10s | $0.3177 |
| Wan 2.5 | 720p | 5s | $0.473 |
| Wan 2.5 | 1080p | 5s | $0.738 |
| LTX-2 Pro | 1080p | 6s | $0.36 |
| LTX-2 Pro | 4K | 10s | $2.40 |
| LTX-2 Fast | 1080p | 6s | $0.24 |
| LTX-2 Fast | 4K | 10s | $1.60 |
| LTX-2 Retake | – | – | $0.10 / sec |
| Vidu Q2 Turbo | 720p | 8s | $0.165 |
| Vidu Q2 Pro | 1080p | 8s | $0.55 |
| MiniMax Hailuo 02 | 768p | 10s | $0.56 |
| MiniMax Hailuo 02 | 1080p | 6s | $0.49 |
| Seedance 1.0 Lite | 720p | 5s | $0.173 |
| Seedance 1.0 Pro | 1080p | 5s | $0.484 |
| Kling 2.5 Turbo Standard | 720p | 5s | $0.21 |
| Kling 2.5 Turbo Pro | 1080p | 5s | $0.35 |
| Kling 2.1 Master | 1080p | 5s | $0.924 |
| Google Veo 3/3.1 Fast | 1080p | 8s | $0.80 |
| Google Veo 3/3.1 Fast + Audio | 1080p | 8s | $1.20 |
| MiniMax 01 Director/Live | 720p | 5s | $0.28 |
| Vidu Q1 I2V | 1080p | 5s | $0.22 |
| Kling 2.1 Pro | 1080p | 5s | $0.323 |
| Kling 2.1 Standard | 1080p | 5s | $0.185 |
| Kling 2.0 Master | 1080p | 5s | $0.924 |
| PixVerse v3.5/v4/v4.5/v5 | 1080p | 5s | $0.299 |
| Google Veo 3/3.1 | 720p | 8s | $1.60 |
| Google Veo 3/3.1 + Audio | 720p | 8s | $3.20 |
| Kling 1.6 Pro | 1080p | 5s | $0.323 |
| Kling 1.6 Standard | 720p | 5s | $0.185 |
| Google Veo 2 | 720p | 5s | $2.50 |
| Vidu 2.0 | 720p | 4s | $0.11 |
| Vidu 2.0 | 720p | 8s | $0.275 |

> في حال عدم ذكر مدة/دقة معينة (مثل بعض الإصدارات الاحترافية)، راجع لوحة Runware أو وثائق المزود لأن الأسعار قد تتغيّر أو تُعرض في “pricing docs”.

