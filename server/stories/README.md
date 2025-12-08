# Stories Mode - Backend Architecture

> **Version:** 1.0.0  
> **Last Updated:** 2024-12-04  
> **Status:** 🚧 In Development

## Overview

The Stories module provides backend infrastructure for generating short-form video content using AI. It supports 5 distinct story templates, each with its own workflow and AI prompts optimized for specific content types.

---

## Directory Structure

```
server/stories/
│
├── index.ts                    # Main router - combines all template routes
├── types.ts                    # Shared TypeScript interfaces
├── README.md                   # This documentation file
│
├── shared/                     # Shared services & utilities
│   ├── index.ts
│   ├── services/
│   │   ├── ai-models.ts
│   │   ├── image-service.ts
│   │   ├── video-service.ts
│   │   ├── voice-service.ts
│   │   ├── music-service.ts
│   │   └── export-service.ts
│   └── utils/
│       ├── duration-calculator.ts
│       ├── aspect-ratio.ts
│       └── validators.ts
│
├── problem-solution/           # Template 1: Problem-Solution
│   ├── index.ts
│   ├── types.ts
│   ├── config.ts
│   ├── routes/index.ts
│   ├── agents/
│   │   ├── index.ts
│   │   ├── script-generator.ts
│   │   └── scene-builder.ts
│   └── prompts/
│       ├── script-prompts.ts
│       ├── image-prompts.ts
│       └── narration-prompts.ts
│
├── tease-reveal/               # Template 2: Tease & Reveal
│   └── (same structure as problem-solution)
│
├── before-after/               # Template 3: Before & After
│   └── (same structure as problem-solution)
│
├── myth-busting/               # Template 4: Myth-Busting
│   └── (same structure as problem-solution)
│
└── asmr-sensory/               # Template 5: ASMR / Sensory
    ├── index.ts
    ├── types.ts
    ├── config.ts
    ├── routes/index.ts
    ├── agents/
    │   ├── index.ts
    │   ├── video-generator.ts
    │   └── audio-generator.ts
    └── prompts/
        ├── visual-prompts.ts
        └── sound-prompts.ts
```

---

## File Descriptions

### Root Files

| File | Purpose | Status |
|------|---------|--------|
| `index.ts` | Main Express router that imports and mounts all template routes under `/api/stories/*` | ⬜ Not Started |
| `types.ts` | Shared TypeScript interfaces used across all templates (StoryProject, Scene, etc.) | ⬜ Not Started |

---

### Shared Services (`shared/`)

#### `shared/index.ts`
Exports all shared services for easy importing by templates.

#### `shared/services/`

| File | Purpose | Integrates With | Status |
|------|---------|-----------------|--------|
| `ai-models.ts` | Configuration registry for all AI models (image, video, text, voice) | `server/ai/` | ⬜ Not Started |
| `image-service.ts` | Unified image generation interface supporting multiple providers | Flux, DALL-E 3, Midjourney, SD | ⬜ Not Started |
| `video-service.ts` | Video generation from images or prompts | Veo 3, Runway, Kling, Luma, Pika | ⬜ Not Started |
| `voice-service.ts` | Text-to-Speech generation for narration | ElevenLabs, OpenAI TTS | ⬜ Not Started |
| `music-service.ts` | Background music selection/generation | Music library, AI generation | ⬜ Not Started |
| `export-service.ts` | Final video composition and platform publishing | FFmpeg, Platform APIs | ⬜ Not Started |

#### `shared/utils/`

| File | Purpose | Status |
|------|---------|--------|
| `duration-calculator.ts` | Calculate optimal scene durations based on narration length and total video duration | ⬜ Not Started |
| `aspect-ratio.ts` | Utilities for handling 9:16, 16:9, 1:1, 4:5 aspect ratios | ⬜ Not Started |
| `validators.ts` | Zod schemas for validating API request/response data | ⬜ Not Started |

---

### Template Structure (Narrative Templates)

All narrative templates (problem-solution, tease-reveal, before-after, myth-busting) share the same file structure:

#### `{template}/index.ts`
Template entry point. Exports the router and template metadata.

#### `{template}/types.ts`
Template-specific TypeScript interfaces extending shared types.

#### `{template}/config.ts`
Template configuration including:
- Story structure (array of scene types)
- Default duration ranges per scene
- Visual style recommendations
- Category and difficulty metadata

#### `{template}/routes/index.ts`
Express router with template-specific endpoints:
```
POST /api/stories/{template}/create          - Create new story project
POST /api/stories/{template}/script/generate - Generate AI script
POST /api/stories/{template}/scenes/parse    - Parse script into scenes
POST /api/stories/{template}/scenes/:id/image - Generate scene image
POST /api/stories/{template}/scenes/:id/video - Animate scene
POST /api/stories/{template}/audio/voiceover - Generate voiceover
POST /api/stories/{template}/audio/music     - Add background music
POST /api/stories/{template}/export          - Export final video
```

#### `{template}/agents/index.ts`
Main agent class (e.g., `ProblemSolutionAgent`) that orchestrates:
- Script generation using template-specific prompts
- Scene parsing and validation
- Coordination between services

#### `{template}/agents/script-generator.ts`
AI-powered script generation following template structure.

#### `{template}/agents/scene-builder.ts`
Parses generated script into structured scene objects.

#### `{template}/prompts/script-prompts.ts`
System and user prompts for script generation AI.

#### `{template}/prompts/image-prompts.ts`
Prompts for generating scene images with consistent style.

#### `{template}/prompts/narration-prompts.ts`
Prompts for generating/refining narration text.

---

### ASMR Template (Different Structure)

The ASMR/Sensory template has a unique workflow without script generation:

#### `asmr-sensory/config.ts`
Configuration for:
- ASMR categories (Food, Triggers, Nature, Crafts, Unboxing)
- Material/texture options per category
- Sound intensity presets
- Ambient background options

#### `asmr-sensory/agents/video-generator.ts`
Direct video generation using prompts (no image-to-video).
Optimized for Veo 3 and Runway Gen-3 with native audio.

#### `asmr-sensory/agents/audio-generator.ts`
ASMR audio effects generation for models without native audio.
Supports binaural audio and ambient backgrounds.

#### `asmr-sensory/prompts/visual-prompts.ts`
Category-specific visual prompts for satisfying visuals.

#### `asmr-sensory/prompts/sound-prompts.ts`
Sound effect prompts for ASMR audio generation.

---

## Template Specifications

### 1. Problem-Solution
| Property | Value |
|----------|-------|
| Structure | Hook → Problem → Solution → Call-to-Action |
| Duration | 30-60 seconds |
| Difficulty | Beginner |
| Category | Marketing |
| Use Cases | Product launches, Service demos, Pain point marketing |

### 2. Tease & Reveal
| Property | Value |
|----------|-------|
| Structure | Hook → Tease → Buildup → Reveal |
| Duration | 15-45 seconds |
| Difficulty | Intermediate |
| Category | Marketing |
| Use Cases | Product reveals, Announcements, Mystery content |

### 3. Before & After
| Property | Value |
|----------|-------|
| Structure | Before State → Transformation → After State → Results |
| Duration | 30-90 seconds |
| Difficulty | Beginner |
| Category | Educational |
| Use Cases | Testimonials, Tutorials, Case studies |

### 4. Myth-Busting
| Property | Value |
|----------|-------|
| Structure | Common Myth → Why It's Wrong → The Truth → Takeaway |
| Duration | 30-60 seconds |
| Difficulty | Intermediate |
| Category | Educational |
| Use Cases | Educational content, Industry insights, Thought leadership |

### 5. ASMR / Sensory
| Property | Value |
|----------|-------|
| Structure | Single scene (no script) |
| Duration | 5-60 seconds |
| Difficulty | Beginner |
| Category | Entertainment |
| Use Cases | Product showcases, Relaxation content, Visual appeal |

---

## Workflow Diagrams

### Narrative Templates Workflow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Create    │────▶│  Generate   │────▶│   Parse     │────▶│  Generate   │
│   Project   │     │   Script    │     │   Scenes    │     │   Images    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐           │
│   Export    │◀────│    Add      │◀────│  Generate   │◀──────────┘
│   Video     │     │   Music     │     │  Voiceover  │
└─────────────┘     └─────────────┘     └─────────────┘
```

### ASMR Template Workflow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Select    │────▶│  Configure  │────▶│  Generate   │────▶│   Export    │
│  Category   │     │   Options   │     │   Video     │     │   Video     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## API Reference

### Base URL
```
/api/stories
```

### Common Endpoints (All Templates)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/templates` | List all available templates |
| GET | `/templates/:id` | Get template details |
| GET | `/projects` | List user's story projects |
| GET | `/projects/:id` | Get project details |
| DELETE | `/projects/:id` | Delete project |

### Template-Specific Endpoints
See individual template `routes/index.ts` files.

---

## AI Models Used

### Text Generation
- **Gemini 2.5 Flash** - Primary for script generation
- **GPT-4** - Fallback option

### Image Generation
- **Flux** - Fast, versatile (default)
- **DALL-E 3** - Accurate prompts
- **Midjourney** - Artistic style
- **Stable Diffusion** - Open source option

### Video Generation
- **Veo 3** - Best quality with native audio
- **Runway Gen-3** - Cinematic quality
- **Kling AI** - Fast generation
- **Luma Dream Machine** - Creative motion
- **Pika Labs** - Stylized motion

### Voice Generation
- **ElevenLabs** - Premium quality voices
- **OpenAI TTS** - Cost-effective option

---

## Development Progress

### Phase 1: Foundation ⬜
- [ ] Shared types and interfaces
- [ ] AI models configuration
- [ ] Base services implementation

### Phase 2: Shared Services ⬜
- [ ] Image service
- [ ] Video service
- [ ] Voice service
- [ ] Music service
- [ ] Export service

### Phase 3: Templates ⬜
- [ ] Problem-Solution template
- [ ] Tease & Reveal template
- [ ] Before & After template
- [ ] Myth-Busting template
- [ ] ASMR / Sensory template

### Phase 4: Integration ⬜
- [ ] Connect to frontend
- [ ] Testing & validation
- [ ] Performance optimization

---

## Contributing

When adding new features:
1. Update this README with new files/endpoints
2. Follow existing patterns for consistency
3. Add Zod validation for all inputs
4. Include error handling in agents
5. Update progress checklist above

---

## Related Documentation

- [AI Service Documentation](../ai/README.md)
- [Image Models Reference](../ai/docs/image-models.md)
- [Video Models Reference](../ai/docs/video-models.md)


