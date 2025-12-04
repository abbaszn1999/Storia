# Runware Video Models Documentation

This document contains detailed specifications for all supported video generation models.

---

## Table of Contents

- [Sora 2](#sora-2)
- [Sora 2 Pro](#sora-2-pro)
- [Runway Gen-4 Turbo](#runway-gen-4-turbo)
- [Runway Aleph](#runway-aleph)
- [Vidu Q2 Pro](#vidu-q2-pro)
- [PixVerse v5.5](#pixverse-v55)
- [Hailuo 2.3](#hailuo-23)
- [KlingAI 2.5 Turbo Pro](#klingai-25-turbo-pro)
- [KlingAI 2.1 Master](#klingai-21-master)
- [Google Veo 3.0](#google-veo-30)
- [Google Veo 3.1](#google-veo-31)
- [Ideogram 3.0](#ideogram-30)
- [Riverflow 2 Preview Max](#riverflow-2-preview-max)

---

## Sora 2

| Property | Value |
|----------|-------|
| **Friendly Name** | `sora-2` |
| **AIR ID** | `openai:3@1` |
| **Provider** | OpenAI |

### Description
OpenAI's next-generation video generation model, delivering more accurate physics simulation with synchronized dialogue and high-fidelity visuals.

### Supported Workflows
- Text-to-video
- Image-to-video

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 1-4000 characters |
| **Frame Images** | Supports first frame for `frameImages` |
| **Supported Dimensions** | 1280×720 (16:9), 720×1280 (9:16) |
| **Duration** | 4, 8, or 12 seconds |
| **Input Image Requirements** | Width/height: 300-2048px, Max size: 20MB |

---

## Sora 2 Pro

| Property | Value |
|----------|-------|
| **Friendly Name** | `sora-2-pro` |
| **AIR ID** | `openai:3@2` |
| **Provider** | OpenAI |

### Description
Higher-quality variant of Sora 2 with additional resolution options, refined control, and better consistency for demanding professional use cases.

### Supported Workflows
- Text-to-video
- Image-to-video

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 1-4000 characters |
| **Frame Images** | Supports first frame for `frameImages` |
| **Supported Dimensions** | 1280×720 (16:9), 720×1280 (9:16), 1792×1024 (7:4), 1024×1792 (4:7) |
| **Duration** | 4, 8, or 12 seconds |
| **Input Image Requirements** | Width/height: 300-2048px, Max size: 20MB |

---

## Runway Gen-4 Turbo

| Property | Value |
|----------|-------|
| **Friendly Name** | `runway-gen4-turbo` |
| **AIR ID** | `runway:1@1` |
| **Provider** | Runway |

### Description
Runway's Gen-4 Turbo is a high-speed image-to-video model built for instant creative experimentation. It produces dynamic, cinematic motion with exceptional fluidity and detail, transforming a single image into a fully realized video in seconds.

### Supported Workflows
- Image-to-video

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 1-1000 characters (optional) |
| **Frame Images** | Supports first frame for `inputs.frameImages` (required) |
| **Supported Dimensions** | 1280×720 (16:9), 720×1280 (9:16), 1104×832, 832×1104, 960×960 (1:1), 1584×672 (21:9) |
| **Duration** | 2-10 seconds (default: 10) |
| **Input Image Requirements** | Max size: 20MB |

---

## Runway Aleph

| Property | Value |
|----------|-------|
| **Friendly Name** | `runway-aleph` |
| **AIR ID** | `runway:2@1` |
| **Provider** | Runway |

### Description
Runway's flagship video-to-video model is built for realism and expressive storytelling. It transforms videos with cinematic precision and supports one reference image to guide visual style or content direction.

### Supported Workflows
- Video-to-video

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 1-1000 characters (required) |
| **Input Video** | Supports `inputs.video` (required) |
| **Reference Images** | Supports `inputs.referenceImages` with 1 image (optional) |
| **Supported Dimensions** | 1280×720 (16:9), 720×1280 (9:16), 1104×832, 832×1104, 960×960 (1:1), 1584×672 (21:9), 848×480, 640×480 |
| **Input Video Requirements** | Max size: 20MB |
| **Input Image Requirements** | Max size: 20MB |

---

## Vidu Q2 Pro

| Property | Value |
|----------|-------|
| **Friendly Name** | `vidu-q2-pro` |
| **AIR ID** | `vidu:3@1` |
| **Provider** | Vidu |

### Description
Vidu's Q2 Pro model delivers extremely high-quality video generation with more delicate motion portrayal, maintaining exceptional output quality even under large-scale movements and camera operations. Ideal for professional film and television production.

### Supported Workflows
- Text-to-video
- First/last frame to video
- Reference to video

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 2-3000 characters (required for T2V, optional for I2V) |
| **Frame Rate** | 24 FPS |
| **Duration** | 1-8 seconds (default: 5) |
| **Frame Images** | Supports first and last frame for `frameImages` |
| **Reference Images** | Supports `referenceImages` with up to 7 images |
| **Input Image Requirements** | Width/height: 300-2048px, Max size: 20MB |

### Supported Dimensions

| Resolution | Aspect Ratios |
|------------|---------------|
| **360p** | 640×352 (16:9), 544×400 (4:3), 480×480 (1:1), 400×544 (3:4), 352×640 (9:16) |
| **540p** | 960×528 (16:9), 816×608 (4:3), 720×720 (1:1), 608×816 (3:4), 528×960 (9:16) |
| **720p** | 1280×720 (16:9), 1104×816 (4:3), 960×960 (1:1), 816×1104 (3:4), 720×1280 (9:16) |
| **1080p** | 1920×1080 (16:9), 1674×1238 (4:3), 1440×1440 (1:1), 1238×1674 (3:4), 1080×1920 (9:16) |

---

## PixVerse v5.5

| Property | Value |
|----------|-------|
| **Friendly Name** | `pixverse-v5.5` |
| **AIR ID** | `pixverse:1@6` |
| **Provider** | PixVerse |

### Description
PixVerse v5.5 advances video storytelling with multi-image fusion for maintaining character consistency across sequences. The model introduces comprehensive audio generation that includes background music, sound effects, and dialogue, alongside multi-shot camera control for dynamic cinematography.

### Supported Workflows
- Text-to-video
- Image-to-video

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 2-2048 characters |
| **Negative Prompt** | 2-2048 characters (optional) |
| **Duration** | 5, 8, or 10 seconds (default: 5, 10s unavailable at 1080p) |
| **Frame Images** | Supports first and last frame for `frameImages` |
| **Input Image Requirements** | Width/height: 300-4000px, Max size: 20MB |

### Supported Dimensions

| Resolution | Aspect Ratios |
|------------|---------------|
| **360p** | 640×360 (16:9), 480×360 (4:3), 360×360 (1:1), 360×480 (3:4), 360×640 (9:16) |
| **540p** | 960×540 (16:9), 720×540 (4:3), 540×540 (1:1), 540×720 (3:4), 540×960 (9:16) |
| **720p** | 1280×720 (16:9), 960×720 (4:3), 720×720 (1:1), 720×960 (3:4), 720×1280 (9:16) |
| **1080p** | 1920×1080 (16:9), 1440×1080 (4:3), 1080×1080 (1:1), 1080×1440 (3:4), 1080×1920 (9:16) |

---

## Hailuo 2.3

| Property | Value |
|----------|-------|
| **Friendly Name** | `hailuo-2.3` |
| **AIR ID** | `minimax:4@1` |
| **Provider** | MiniMax |

### Description
Built for cinematic storytelling and expressive motion, MiniMax Hailuo 2.3 transforms text or images into visually rich videos with lifelike human physics and precise prompt adherence. It delivers fluid movement and emotional realism with consistent scene composition, ideal for creators seeking artistry and technical polish.

### Supported Workflows
- Text-to-video
- Image-to-video

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 2-2000 characters (optional when using `frameImages`) |
| **Frame Rate** | 25 FPS |
| **Duration** | 6 or 10 seconds (768p), 6 seconds only (1080p) |
| **Frame Images** | Supports first frame for `frameImages` |
| **Input Image Requirements** | Width/height: 300-2048px, Max size: 20MB |

### Supported Dimensions

| Resolution | Dimensions |
|------------|------------|
| **768p** | 1366×768 (16:9) |
| **1080p** | 1920×1080 (16:9) |

---

## KlingAI 2.5 Turbo Pro

| Property | Value |
|----------|-------|
| **Friendly Name** | `kling-2.5-turbo-pro` |
| **AIR ID** | `klingai:6@1` |
| **Provider** | KlingAI |

### Description
KlingAI's 2.5 Turbo Pro model delivers next-level creativity with turbocharged motion and cinematic visuals, featuring precise prompt adherence for both text-to-video and image-to-video workflows. This model combines enhanced motion fluidity with professional-grade cinematic capabilities.

### Supported Workflows
- Text-to-video
- Image-to-video

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 2-2500 characters |
| **Negative Prompt** | 2-2500 characters (optional) |
| **CFG Scale** | 0-1 (default: 0.5) |
| **Frame Rate** | 30 FPS |
| **Duration** | 5 or 10 seconds |
| **Frame Images** | Supports first and last frame for `frameImages` |
| **Input Image Requirements** | Width/height: 300-2048px, Max size: 20MB |

### Supported Dimensions

| Aspect Ratio | Dimensions |
|--------------|------------|
| 16:9 | 1280×720 |
| 1:1 | 720×720 |
| 9:16 | 720×1280 |

---

## KlingAI 2.1 Master

| Property | Value |
|----------|-------|
| **Friendly Name** | `kling-2.1-master` |
| **AIR ID** | `klingai:5@3` |
| **Provider** | KlingAI |

### Description
KlingAI's 2.1 Master model represents the peak of the KlingAI stack with Full HD image-to-video, ultra-fluid motion, and exceptional prompt precision for VFX-grade output.

### Supported Workflows
- Text-to-video
- Image-to-video

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 2-2500 characters |
| **Negative Prompt** | 2-2500 characters (optional) |
| **CFG Scale** | 0-1 (default: 0.5) |
| **Frame Rate** | 24 FPS |
| **Duration** | 5 or 10 seconds |
| **Frame Images** | Supports first frame for `frameImages` |
| **Input Image Requirements** | Width/height: 300-2048px, Max size: 20MB |

### Supported Dimensions

| Aspect Ratio | Dimensions |
|--------------|------------|
| 16:9 | 1920×1080 |
| 1:1 | 1080×1080 |
| 9:16 | 1080×1920 |

---

## Google Veo 3.0

| Property | Value |
|----------|-------|
| **Friendly Name** | `veo-3.0` |
| **AIR ID** | `google:3@0` |
| **Provider** | Google |

### Description
Google's Veo 3 model represents Google's latest video generation technology, featuring native audio generation that creates synchronized dialogue, music, and sound effects alongside high-fidelity video content.

### Supported Workflows
- Text-to-video
- Image-to-video

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 2-3000 characters |
| **Frame Rate** | 24 FPS |
| **Duration** | 8 seconds |
| **Frame Images** | Supports first frame for `frameImages` |
| **Input Image Requirements** | Width/height: 300-2048px, Max size: 20MB |
| **Special Parameters** | `generateAudio` supported |

### Supported Dimensions

| Aspect Ratio | Dimensions |
|--------------|------------|
| 16:9 | 1280×720, 1920×1080 |
| 9:16 | 720×1280, 1080×1920 |

> **Note:** In Veo 3.0, `enhancePrompt` is always enabled and cannot be disabled.

---

## Google Veo 3.1

| Property | Value |
|----------|-------|
| **Friendly Name** | `veo-3.1` |
| **AIR ID** | `google:3@2` |
| **Provider** | Google |

### Description
Google's newest Veo model for cinematic video generation, capable of turning images or text into realistic, story-driven scenes with natural sound and smooth motion.

### Supported Workflows
- Text-to-video
- Image-to-video

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 2-3000 characters |
| **Frame Rate** | 24 FPS |
| **Duration** | 8 seconds |
| **Frame Images** | Supports first and last frame for `frameImages` |
| **Reference Images** | Supports `inputs.references` with typed image roles (asset or style) |
| **Input Image Requirements** | Width/height: 300-2048px, Max size: 20MB |

### Supported Dimensions

| Aspect Ratio | Dimensions |
|--------------|------------|
| 16:9 | 1280×720, 1920×1080 |
| 9:16 | 720×1280, 1080×1920 |

---

## Ideogram 3.0

| Property | Value |
|----------|-------|
| **Friendly Name** | `ideogram-3.0` |
| **AIR ID** | `ideogram:4@1` |
| **Provider** | Ideogram |

### Description
Ideogram 3.0 pushes design-level generation to new heights, with sharper text rendering and better composition. It also adds greater stylistic control, perfect for graphic-driven content.

### Supported Workflows
- Text-to-image

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | 1-2000 characters |
| **Negative Prompt** | 1-2000 characters (optional) |

### Supported Dimensions

Wide range of aspect ratios supported including:
- **3:1** → 1536×512
- **2:1** → 1408×704
- **16:9** → Various sizes
- **4:3** → 1152×864
- **1:1** → 1024×1024
- **3:4** → 864×1152
- **9:16** → Various sizes
- **1:3** → 512×1536
- And many more intermediate ratios

---

## Riverflow 2 Preview Max

| Property | Value |
|----------|-------|
| **Friendly Name** | `riverflow-2-max` |
| **AIR ID** | `sourceful:2@3` |
| **Provider** | Sourceful |

### Description
Highest-quality version of Riverflow 2 focused on maximum detail, lighting control, and accuracy for demanding commercial work and premium product visuals. Delivers visuals that feel close to professionally staged photography.

### Supported Workflows
- Text-to-image
- Image-to-image editing

### Technical Specifications

| Parameter | Details |
|-----------|---------|
| **Positive Prompt** | Required |
| **Reference Images** | Supports `inputs.referenceImages` with 1-3 images (optional for T2I, required for editing) |
| **Input Image Requirements** | Width/height: 300-2048px, Max size: 20MB |

### Supported Dimensions

| Aspect Ratio | 1x | 2x | 4x |
|--------------|-----|-----|-----|
| **1:1** | 1024×1024 | 2048×2048 | 4096×4096 |
| **4:3** | 1152×864 | 2304×1728 | 4608×3456 |
| **3:4** | 864×1152 | 1728×2304 | 3456×4608 |
| **16:9** | 1280×720 | 2560×1440 | 5120×2880 |
| **9:16** | 720×1280 | 1440×2560 | 2880×5120 |
| **3:2** | 1248×832 | 2496×1664 | 4992×3328 |
| **2:3** | 832×1248 | 1664×2496 | 3328×4992 |
| **21:9** | 1512×648 | 3024×1296 | 6048×2592 |

---

## Quick Reference Table

| Model | AIR ID | Workflows | Max Duration | Max Resolution |
|-------|--------|-----------|--------------|----------------|
| Sora 2 | `openai:3@1` | T2V, I2V | 12s | 720p |
| Sora 2 Pro | `openai:3@2` | T2V, I2V | 12s | 720p+ |
| Runway Gen-4 Turbo | `runway:1@1` | I2V | 10s | 720p |
| Runway Aleph | `runway:2@1` | V2V | - | 720p |
| Vidu Q2 Pro | `vidu:3@1` | T2V, I2V, Ref | 8s | 1080p |
| PixVerse v5.5 | `pixverse:1@6` | T2V, I2V | 10s | 1080p |
| Hailuo 2.3 | `minimax:4@1` | T2V, I2V | 10s | 1080p |
| KlingAI 2.5 Turbo Pro | `klingai:6@1` | T2V, I2V | 10s | 720p |
| KlingAI 2.1 Master | `klingai:5@3` | T2V, I2V | 10s | 1080p |
| Veo 3.0 | `google:3@0` | T2V, I2V | 8s | 1080p |
| Veo 3.1 | `google:3@2` | T2V, I2V | 8s | 1080p |
| Ideogram 3.0 | `ideogram:4@1` | T2I | - | 4K+ |
| Riverflow 2 Max | `sourceful:2@3` | T2I, I2I | - | 4K+ |

**Legend:** T2V = Text-to-Video, I2V = Image-to-Video, V2V = Video-to-Video, T2I = Text-to-Image, I2I = Image-to-Image, Ref = Reference-based

