# Runware AI Models - Pricing Reference

> **Note:** This file is for documentation purposes only.  
> Actual costs are returned by Runware API using `includeCost: true`.  
> Last Updated: 2024-12-04

---

## Image Models

| Model | AIR ID | Price per Image | Notes |
|-------|--------|-----------------|-------|
| **FLUX.2 Dev** | `runware:400@1` | $0.0134 | Default image model |
| **FLUX.2 Pro** | `bfl:5@1` | $0.05 | Professional quality |
| **FLUX.2 Flex** | `bfl:6@1` | $0.0134 | Best text rendering |
| **Google Imagen 3.0** | `google:1@1` | $0.04 | High-quality images |
| **Google Imagen 4.0 Ultra** | `google:2@2` | $0.06 | Most advanced |
| **Nano Banana** | `google:4@1` | $0.039 | Gemini Flash Image 2.5 |
| **Nano Banana 2 Pro** | `google:4@2` | $0.134 (1K/2K), $0.24 (4K) | Gemini 3 Pro Image |
| **Midjourney V7** | `midjourney:3@1` | $0.025 | Cinematic style |
| **GPT Image 1** | `openai:1@1` | $0.04 | GPT-4o architecture |
| **Seedream 4.0** | `bytedance:5@0` | $0.03 | ByteDance |
| **Seedream 4.5** | `bytedance:seedream@4.5` | $0.03 | Production-focused |
| **Ideogram 3.0** | `ideogram:4@1` | $0.04 | Design-level |
| **Riverflow 2 Max** | `sourceful:2@3` | $0.06358 | Maximum detail |

---

## Video Models

| Model | AIR ID | Default Price | Duration | Resolution | Has Audio |
|-------|--------|---------------|----------|------------|-----------|
| **Sora 2** | `openai:3@1` | $0.80 | 8s | 720p | ✅ |
| **Sora 2 Pro** | `openai:3@2` | $2.40 (720p), $4.00 (1080p) | 8s | 720p/1080p | ✅ |
| **Runway Gen-4 Turbo** | `runway:1@1` | $0.50 | 2-10s | 720p | ✅ |
| **Runway Aleph** | `runway:2@1` | $0.80 | 8s | 720p | ✅ |
| **Vidu Q2 Pro** | `vidu:3@1` | $0.55 | 8s | 1080p | ❌ |
| **PixVerse v5.5** | `pixverse:1@6` | $0.299 | 5s | 1080p | ✅ |
| **MiniMax Hailuo 2.3** | `minimax:4@1` | $0.28 (768p), $0.49 (1080p) | 6s | 768p/1080p | ❌ |
| **KlingAI 2.5 Turbo Pro** | `klingai:6@1` | $0.21 (720p), $0.35 (1080p) | 5s | 720p/1080p | ❌ |
| **KlingAI 2.1 Master** | `klingai:5@3` | $0.924 | 5s | 1080p | ❌ |
| **Google Veo 3.0** | `google:3@0` | $1.60 (720p), $0.80 (1080p Fast) | 8s | 720p/1080p | ✅ |
| **Google Veo 3.1** | `google:3@2` | $1.60 (720p), $0.80 (1080p Fast) | 8s | 720p/1080p | ✅ |
| **Seedance 1.0 Pro** | `bytedance:2@1` | TBD (use includeCost) | 1.2-12s | up to 1080p | ❌ |

---

## Video Pricing Details

### Price per Second (Estimated)

| Model | $/second |
|-------|----------|
| Sora 2 | $0.10/s |
| Sora 2 Pro | $0.30/s (720p), $0.50/s (1080p) |
| Runway Gen-4 Turbo | $0.05/s |
| Runway Aleph | $0.10/s |
| Vidu Q2 Pro | $0.069/s |
| PixVerse v5.5 | $0.06/s |
| Hailuo 2.3 | $0.047/s (768p), $0.082/s (1080p) |
| KlingAI 2.5 Turbo Pro | $0.07/s |
| KlingAI 2.1 Master | $0.185/s |
| Veo 3.0/3.1 | $0.20/s (720p), $0.10/s (1080p Fast) |

---

## Text Models (Token-based)

These models use token-based pricing (calculated locally, not via `includeCost`).

### OpenAI

| Model | Input (per 1K) | Output (per 1K) | Cached Input |
|-------|----------------|-----------------|--------------|
| GPT-5.1 | $0.00125 | $0.01 | $0.000125 |
| GPT-5 | $0.00125 | $0.01 | $0.000125 |
| GPT-5 Mini | $0.00025 | $0.002 | $0.000025 |
| GPT-5 Nano | $0.00005 | $0.0004 | $0.000005 |
| GPT-4o | $0.0025 | $0.01 | $0.00125 |
| o4 Mini | $0.0011 | $0.0044 | $0.000275 |

### Gemini

| Model | Input (per 1K) | Output (per 1K) | Cached Input | Cache Storage |
|-------|----------------|-----------------|--------------|---------------|
| Gemini 2.5 Flash | $0.0003 | $0.0025 | $0.00003 | $1.00/1M/hr |
| Gemini 2.5 Pro | $0.00125 | $0.01 | $0.000125 | $4.50/1M/hr |
| Gemini 3 Pro Preview | $0.002 | $0.012 | $0.0002 | $4.50/1M/hr |

---

## How Pricing Works

### For Image & Video (Runware)
```javascript
// Cost is returned automatically by Runware API
const response = await runware.videoInference({
  // ... params
  includeCost: true,  // ⬅️ Always include this
});

console.log(response.cost); // Actual cost in USD
```

### For Text (OpenAI/Gemini)
```javascript
// Cost is calculated locally based on token usage
const cost = (inputTokens * inputCostPer1K / 1000) + 
             (outputTokens * outputCostPer1K / 1000);
```

---

## Notes

- Prices may change. Always verify with provider documentation.
- `includeCost: true` returns the actual cost from Runware API.
- Video models with "Has Audio ✅" generate synchronized audio automatically.
- Some models support multiple resolutions with different pricing tiers.

