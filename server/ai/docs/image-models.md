# Runware Image Models Documentation

This document contains detailed specifications for all supported image generation models.

---

## Table of Contents

- [FLUX.2 Flex](#flux2-flex)
- [Google Imagen 3.0](#google-imagen-30)
- [Google Imagen 4.0 Ultra](#google-imagen-40-ultra)
- [Nano Banana (Gemini Flash Image 2.5)](#nano-banana-gemini-flash-image-25)
- [Nano Banana 2 Pro (Gemini 3 Pro Image Preview)](#nano-banana-2-pro-gemini-3-pro-image-preview)
- [Midjourney V7](#midjourney-v7)
- [GPT Image 1](#gpt-image-1)
- [Seedream 4.0](#seedream-40)
- [Seedream 4.5](#seedream-45)

---

## FLUX.2 Flex

| Property | Value |
|----------|-------|
| **Friendly Name** | `flux-2-flex` |
| **AIR ID** | `bfl:6@1` |
| **Provider** | Black Forest Labs |

### Description
Black Forest Labs' FLUX.2 [flex] model provides the strongest text rendering accuracy in the FLUX family with fine-grained control over composition and layout. Designed specifically for branded design, posters, and typography-driven work, this model maintains character and product consistency across multiple reference images with precise placement and readability.

### Supported Workflows
- Text-to-image
- Reference-to-image

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 1-3000 characters |
| **Supported Dimensions** | 256-1920 pixels (width and height, multiples of 16) |
| **Reference Images** | Supports up to 10 images via `referenceImages` |
| **Total Input Capacity** | 14 megapixels |
| **CFG Scale** | 1-20 (default: 2.5) |
| **Steps** | 1-50 |

---

## Google Imagen 3.0

| Property | Value |
|----------|-------|
| **Friendly Name** | `imagen-3.0` |
| **AIR ID** | `google:1@1` |
| **Provider** | Google |

### Description
Imagen 3.0 creates detailed, high-quality images with better lighting and fewer artifacts. It works well for both realistic scenes and stylized visuals.

### Supported Workflows
- Text-to-image

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 2-3000 characters |

### Supported Dimensions

| Aspect Ratio | Dimensions |
|--------------|------------|
| 1:1 | 1024×1024 |
| 9:16 | 768×1408 |
| 16:9 | 1408×768 |
| 3:4 | 896×1280 |
| 4:3 | 1280×896 |

---

## Google Imagen 4.0 Ultra

| Property | Value |
|----------|-------|
| **Friendly Name** | `imagen-4-ultra` |
| **AIR ID** | `google:2@2` |
| **Provider** | Google |

### Description
Imagen 4.0 Ultra is Google's most advanced image model available, delivering exceptional detail, color accuracy, and prompt adherence. Ideal for demanding use cases where image quality and consistency matter most.

### Supported Workflows
- Text-to-image

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 2-3000 characters |

### Supported Dimensions

| Aspect Ratio | Dimensions |
|--------------|------------|
| 1:1 | 1024×1024 |
| 9:16 | 768×1408 |
| 16:9 | 1408×768 |
| 3:4 | 896×1280 |
| 4:3 | 1280×896 |

---

## Nano Banana (Gemini Flash Image 2.5)

| Property | Value |
|----------|-------|
| **Friendly Name** | `gemini-flash-image` |
| **AIR ID** | `google:4@1` |
| **Provider** | Google DeepMind |

### Description
Google DeepMind's Gemini Flash Image 2.5, nicknamed "Nano Banana", represents a breakthrough in multimodal AI image generation and editing. This model specializes in rapid, interactive image workflows with sophisticated editing capabilities including prompt-based modifications, multi-image fusion, and conversational editing flows. Built with deep real-world understanding, it enables context-aware edits that go beyond simple aesthetic manipulations.

### Supported Workflows
- Text-to-image
- Image-to-image

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 2-3000 characters |
| **Reference Images** | Supports up to 8 images via `referenceImages` |
| **Input Image Requirements** | Width/height: 300-2048px, Max size: 20MB |
| **Watermarking** | Includes invisible SynthID digital watermark |

### Supported Dimensions

#### Text-to-Image

| Aspect Ratio | Dimensions |
|--------------|------------|
| 1:1 | 1024×1024 |
| 3:2 | 1248×832 |
| 2:3 | 832×1248 |
| 4:3 | 1184×864 |
| 3:4 | 864×1184 |
| 5:4 | 1152×896 |
| 4:5 | 896×1152 |
| 16:9 | 1344×768 |
| 9:16 | 768×1344 |
| 21:9 | 1536×672 |

#### Image-to-Image
Automatically matches reference image aspect ratio (width/height parameters ignored).

---

## Nano Banana 2 Pro (Gemini 3 Pro Image Preview)

| Property | Value |
|----------|-------|
| **Friendly Name** | `gemini-pro-image` |
| **AIR ID** | `google:4@2` |
| **Provider** | Google DeepMind |

### Description
Google DeepMind's Gemini 3 Pro Image Preview, nicknamed "Nano Banana 2 Pro", represents the advanced tier of image generation with professional-grade controls and enhanced reasoning capabilities. This model excels at controlled visual creation with sophisticated handling of lighting, camera angles, aspect ratio control, high-resolution output up to 2K, and advanced text rendering for logos, posters, and diagrams.

### Supported Workflows
- Text-to-image
- Image-to-image

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 3-45000 characters |
| **Reference Images** | Supports up to 14 images via `referenceImages` |
| **Input Image Requirements** | Width/height: 300-2048px, Max size: 20MB |
| **Watermarking** | Includes invisible SynthID digital watermark |

### Supported Dimensions

#### 1K Resolution

| Aspect Ratio | Dimensions |
|--------------|------------|
| 1:1 | 1024×1024 |
| 3:2 | 1264×848 |
| 2:3 | 848×1264 |
| 4:3 | 1200×896 |
| 3:4 | 896×1200 |
| 4:5 | 928×1152 |
| 5:4 | 1152×928 |
| 9:16 | 768×1376 |
| 16:9 | 1376×768 |
| 21:9 | 1548×672 or 1584×672 |

#### 2K Resolution

| Aspect Ratio | Dimensions |
|--------------|------------|
| 1:1 | 2048×2048 |
| 3:2 | 2528×1696 |
| 2:3 | 1696×2528 |
| 4:3 | 2400×1792 |
| 3:4 | 1792×2400 |
| 4:5 | 1856×2304 |
| 5:4 | 2304×1856 |
| 9:16 | 1536×2752 |
| 16:9 | 2752×1536 |
| 21:9 | 3168×1344 |

#### 4K Resolution

| Aspect Ratio | Dimensions |
|--------------|------------|
| 1:1 | 4096×4096 |
| 3:2 | 5096×3392 or 5056×3392 |
| 2:3 | 3392×5096 or 3392×5056 |
| 4:3 | 4800×3584 |
| 3:4 | 3584×4800 |
| 4:5 | 3712×4608 |
| 5:4 | 4608×3712 |
| 9:16 | 3072×5504 |
| 16:9 | 5504×3072 |
| 21:9 | 6336×2688 |

### Dimension Behavior

| Mode | Behavior |
|------|----------|
| **Text-to-image** | Requires explicit width and height from supported dimensions |
| **Image-to-image** | Option 1: Specify width/height explicitly. Option 2: Omit dimensions and use `resolution` parameter (1k, 2k, 4k) to match first reference image aspect ratio |

---

## Midjourney V7

| Property | Value |
|----------|-------|
| **Friendly Name** | `midjourney-v7` |
| **AIR ID** | `midjourney:3@1` |
| **Provider** | Midjourney |

### Description
Next-generation Midjourney release emphasizing realism and control. Produces grand, cinematic imagery with fluid brushwork and deeply atmospheric tone. Features significant improvements in visual realism, texture fidelity, lighting, natural-language understanding, and photographic quality.

### Supported Workflows
- Text-to-image
- Image-to-image

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 1-2000 characters |
| **Number of Results** | Must be a multiple of 4 (4, 8, 12, 16, 20, default: 4) |
| **Reference Images** | Supports 1 image via `inputs.referenceImages` |

### Supported Dimensions

| Aspect Ratio | Dimensions |
|--------------|------------|
| 16:9 | 1456×816 |
| 9:16 | 816×1456 |
| 1:1 | 1024×1024 |
| 4:3 | 1232×928 |
| 3:4 | 928×1232 |
| 3:2 | 1344×896 |
| 2:3 | 896×1344 |
| 21:9 | 1680×720 |

---

## GPT Image 1

| Property | Value |
|----------|-------|
| **Friendly Name** | `gpt-image-1` |
| **AIR ID** | `openai:1@1` |
| **Provider** | OpenAI |

### Description
OpenAI's GPT Image 1 model leverages GPT-4o architecture to deliver high-fidelity images with enhanced prompt following, superior text rendering, and advanced multimodal capabilities, including precise inpainting and image editing.

### Supported Workflows
- Text-to-image
- Image-to-image

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 1-32000 characters |
| **Reference Images** | Supports up to 16 images via `referenceImages` |

### Supported Dimensions

| Dimensions |
|------------|
| 1024×1024 |
| 1536×1024 |
| 1024×1536 |

### Provider-Specific Settings

| Parameter | Description |
|-----------|-------------|
| `quality` | Image quality setting |
| `background` | Background handling |

---

## Seedream 4.0

| Property | Value |
|----------|-------|
| **Friendly Name** | `seedream-4.0` |
| **AIR ID** | `bytedance:5@0` |
| **Provider** | ByteDance |

### Description
ByteDance's Seedream 4.0 model represents a major leap in multimodal AI image generation, combining ultra-fast 2K/4K rendering with unique sequential image capabilities. The model excels at maintaining character consistency across multiple outputs while supporting complex editing operations through natural language commands, making it particularly valuable for storyboard creation and professional design workflows.

### Supported Workflows
- Text-to-image
- Image-to-image

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 1-2000 characters |
| **Reference Images** | Supports up to 14 images via `referenceImages` |
| **Sequential Images** | Generates multiple related outputs (configure with `maxSequentialImages`) |
| **Combined Limit** | Reference images + sequential images ≤ 15 total |

### Supported Dimensions

#### 1K Resolution

| Aspect Ratio | Dimensions |
|--------------|------------|
| 1:1 | 1024×1024 |

#### 2K Resolution

| Aspect Ratio | Dimensions |
|--------------|------------|
| 1:1 | 2048×2048 |
| 4:3 | 2304×1728 |
| 3:4 | 1728×2304 |
| 16:9 | 2560×1440 |
| 9:16 | 1440×2560 |
| 3:2 | 2496×1664 |
| 2:3 | 1664×2496 |
| 21:9 | 3024×1296 |

#### 4K Resolution

| Aspect Ratio | Dimensions |
|--------------|------------|
| 1:1 | 4096×4096 |
| 4:3 | 4608×3456 |
| 3:4 | 3456×4608 |
| 16:9 | 5120×2880 |
| 9:16 | 2880×5120 |
| 3:2 | 4992×3328 |
| 2:3 | 3328×4992 |
| 21:9 | 6048×2592 |

---

## Seedream 4.5

| Property | Value |
|----------|-------|
| **Friendly Name** | `seedream-4.5` |
| **AIR ID** | `bytedance:seedream@4.5` |
| **Provider** | ByteDance |

### Description
ByteDance's Seedream 4.5 model focuses on production reliability. Previous versions struggled with distant faces becoming distorted and text rendering poorly. This update solves those core issues, shifting from unpredictable results to consistent output. The model handles multi-image fusion better and produces sharp 2K and 4K images suitable for professional work.

### Supported Workflows
- Text-to-image
- Image-to-image

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 1-2000 characters |
| **Reference Images** | Supports up to 14 images via `inputs.referenceImages` |
| **Sequential Images** | Generates multiple related outputs (configure with `maxSequentialImages`) |
| **Combined Limit** | Reference images + sequential images ≤ 15 total |
| **Input Image Requirements** | Min: 14×14px, Max: 6000×6000px, Aspect ratio: 1:16 to 16:1, Max size: 10MB |

### Dimension Constraints

| Constraint | Value |
|------------|-------|
| **Minimum Total Pixels** | 2560×1440 (3,686,400 pixels) |
| **Maximum Total Pixels** | 4096×4096 (16,777,216 pixels) |
| **Aspect Ratio Range** | 1:16 to 16:1 |

### Recommended 2K Dimensions

| Aspect Ratio | Dimensions |
|--------------|------------|
| 1:1 | 2048×2048 |
| 4:3 | 2304×1728 |
| 3:4 | 1728×2304 |
| 16:9 | 2560×1440 |
| 9:16 | 1440×2560 |
| 3:2 | 2496×1664 |
| 2:3 | 1664×2496 |
| 21:9 | 3024×1296 |

### Recommended 4K Dimensions

| Aspect Ratio | Dimensions |
|--------------|------------|
| 1:1 | 4096×4096 |
| 4:3 | 4608×3456 |
| 3:4 | 3456×4608 |
| 16:9 | 5120×2880 |
| 9:16 | 2880×5120 |
| 3:2 | 4992×3328 |
| 2:3 | 3328×4992 |
| 21:9 | 6048×2592 |

### Dimension Behavior

| Mode | Behavior |
|------|----------|
| **Text-to-image** | Specify explicit width and height from supported dimensions |
| **Image-to-image** | Option 1: Specify width/height explicitly. Option 2: Use `resolution` parameter (2k or 4k) to auto-match first reference image aspect ratio |

---

## Quick Reference Table

| Model | AIR ID | Workflows | Max Resolution | Max Prompt |
|-------|--------|-----------|----------------|------------|
| FLUX.2 Flex | `bfl:6@1` | T2I, Ref2I | 1920px | 3000 chars |
| Imagen 3.0 | `google:1@1` | T2I | 1408×768 | 3000 chars |
| Imagen 4.0 Ultra | `google:2@2` | T2I | 1408×768 | 3000 chars |
| Nano Banana | `google:4@1` | T2I, I2I | 1536×672 | 3000 chars |
| Nano Banana 2 Pro | `google:4@2` | T2I, I2I | 4K | 45000 chars |
| Midjourney V7 | `midjourney:3@1` | T2I, I2I | 1680×720 | 2000 chars |
| GPT Image 1 | `openai:1@1` | T2I, I2I | 1536×1024 | 32000 chars |
| Seedream 4.0 | `bytedance:5@0` | T2I, I2I | 4K | 2000 chars |
| Seedream 4.5 | `bytedance:seedream@4.5` | T2I, I2I | 4K | 2000 chars |

**Legend:** T2I = Text-to-Image, I2I = Image-to-Image, Ref2I = Reference-to-Image

