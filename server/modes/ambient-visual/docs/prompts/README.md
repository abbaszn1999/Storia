# Ambient Visual Mode - Prompt Documentation

This directory contains comprehensive documentation for all AI agent prompts used in the Ambient Visual mode.

## Overview

The Ambient Visual mode uses a series of specialized AI agents to transform user inputs into long-form, loopable ambient videos. Each agent has a specific role and uses carefully crafted prompts to ensure high-quality, consistent outputs.

## Agent Workflow

```
User Input (Mood, Theme, Settings)
    ↓
Agent 1.1: Mood Description Generator
    ↓
Agent 2.1: Scene Generator
    ↓
Agent 2.2: Shot Composer
    ↓
Agent 2.3: Continuity Producer (Start-End Frame mode only)
    ↓
Agent 3.1: Video Prompt Engineer
    ↓
Image/Video Generation
```

## Prompt Files

### Phase 1: Atmosphere

- **[agent-1.1-mood-description-generator.md](./agent-1.1-mood-description-generator.md)**
  - **Role**: Atmospheric Writer & Visual Poet
  - **Purpose**: Generate rich, evocative mood descriptions from user inputs
  - **Output**: Plain text mood description (2-4 paragraphs)
  - **Temperature**: 0.7 (creative)

### Phase 2: Flow Design

- **[agent-2.1-scene-generator.md](./agent-2.1-scene-generator.md)**
  - **Role**: Ambient Video Architect
  - **Purpose**: Break down mood description into distinct visual segments/scenes
  - **Output**: JSON with array of segments (title, description, duration, lighting, weather)
  - **Temperature**: 0.5 (balanced)

- **[agent-2.2-shot-composer.md](./agent-2.2-shot-composer.md)**
  - **Role**: Ambient Cinematographer
  - **Purpose**: Generate individual shots within each scene/segment
  - **Output**: JSON with array of shots (shotType, cameraMovement, duration, description)
  - **Temperature**: 0.5 (balanced)

- **[agent-2.3-continuity-producer.md](./agent-2.3-continuity-producer.md)**
  - **Role**: Video Editor & Continuity Specialist
  - **Purpose**: Propose continuity groups for seamless visual flow (Start-End Frame mode only)
  - **Output**: JSON with continuity groups and transition types
  - **Temperature**: 0.4 (analytical)
  - **Note**: Only used in Start-End Frame video generation mode

### Phase 3: Composition

- **[agent-3.1-video-prompt-engineer.md](./agent-3.1-video-prompt-engineer.md)**
  - **Role**: AI Prompt Engineer for Visual Generation
  - **Purpose**: Generate optimized prompts for AI image/video generation models
  - **Output**: 
    - Image Transitions Mode: JSON with `imagePrompt`
    - Video Animation Mode: JSON with `startFramePrompt`, `endFramePrompt`, `videoPrompt`
  - **Temperature**: 0.6 (balanced creativity)
  - **Special**: Has two distinct modes with different system prompts

## Prompt Structure

Each prompt file follows a consistent structure:

1. **Overview**: Role, type, models, temperature, purpose
2. **System Prompt**: Complete system prompt with all instructions
3. **User Prompt Template**: Template showing how user prompts are constructed
4. **Output JSON Schema**: JSON schema for validation
5. **Example Input/Output**: Real examples showing expected behavior
6. **Quality Checklist**: Criteria for validating outputs
7. **Downstream Dependencies**: How outputs are used by other agents
8. **Implementation Notes**: API call structure and validation code
9. **Version History**: Change log

## Best Practices

These prompts follow industry best practices for prompt engineering:

- ✅ **Clear Role Definition**: Each agent has a specific, well-defined role
- ✅ **Structured Format**: Visual separators and organized sections
- ✅ **Specific Instructions**: Technical, actionable language
- ✅ **Output Format Specification**: Exact JSON schemas with validation
- ✅ **Context and Examples**: Few-shot examples and use cases
- ✅ **Constraints and Guardrails**: Explicit NEVER/ALWAYS sections
- ✅ **Quality Standards**: Success criteria and checklists

## Animation Modes

The Ambient Visual mode supports two animation approaches:

### Image Transitions Mode
- Uses static images with motion effects (Ken Burns, pan, zoom)
- Agent 3.1 generates a single `imagePrompt`
- Faster generation, simpler workflow

### Video Animation Mode
- Uses AI-generated video clips
- Agent 3.1 generates `startFramePrompt`, `endFramePrompt`, and `videoPrompt`
- Supports two sub-modes:
  - **Image Reference**: Single reference image
  - **Start-End Frame**: Connected frames for seamless transitions

## Continuity Groups

In Start-End Frame mode, Agent 2.3 (Continuity Producer) identifies shots that should be visually connected:

- **Connected Shots**: End frame of shot N = Start frame of shot N+1
- **Transition Types**: flow, pan, zoom, match-cut, environment, light-transition
- **Group Size**: 2-5 shots per group
- **Scene Boundaries**: Shots only connect within the same scene

## Usage

These prompts are used in the TypeScript implementation:

```typescript
// Example: Using Agent 1.1
import { MOOD_DESCRIPTION_SYSTEM_PROMPT, buildMoodDescriptionUserPrompt } from '../prompts/atmosphere-prompts';

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  temperature: 0.7,
  messages: [
    { role: "system", content: MOOD_DESCRIPTION_SYSTEM_PROMPT },
    { role: "user", content: buildMoodDescriptionUserPrompt(input) }
  ]
});
```

## Maintenance

When updating prompts:

1. Update the markdown file in this directory
2. Update the corresponding TypeScript file in `server/modes/ambient-visual/prompts/`
3. Update the version history in both files
4. Test with real inputs to ensure quality
5. Update examples if behavior changes

## Related Documentation

- [AMBIENT_VISUALIZER.md](../AMBIENT_VISUALIZER.md) - Complete technical documentation
- [PHASE_4_COMPOSITION_BACKEND.md](../../PHASE_4_COMPOSITION_BACKEND.md) - Backend architecture

---

**Last Updated**: 2024-12-29  
**Version**: 1.0

