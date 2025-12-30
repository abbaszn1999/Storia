# Agent 3.2: Shot Composer - Current Prompt (v2)

This document contains the **current** prompt implementation used in narrative mode before enhancement.

---

## System Prompt Builder

The system prompt is dynamically built based on input parameters. Here's the structure:

```typescript
export function buildShotComposerSystemPrompt(
  sceneDuration: number,
  shotCount: number,
  isAuto: boolean,
  genre: string,
  tone?: string,
  availableDurations?: number[],
  narrativeMode?: "image-reference" | "start-end" | "auto"
): string
```

### Key Features:
- Dynamic shot count (auto or exact)
- Support for available video model durations
- Frame mode decision in auto mode
- Reference tagging system for characters and locations

---

## User Prompt Builder

```typescript
export function buildShotComposerUserPrompt(
  input: ShotComposerInput,
  shotCount: number,
  narrativeMode?: "image-reference" | "start-end" | "auto"
): string
```

### Key Features:
- Includes full script context
- Previous scenes context for narrative continuity
- Character and location tagging
- Available video model durations
- Frame mode instructions for auto mode

---

## Helper Functions

```typescript
/**
 * Calculate optimal shot count when set to 'auto'
 * Formula: ~1 shot per 5-15 seconds, adjusted for scene complexity
 */
export function calculateOptimalShotCount(sceneDuration: number): number {
  // Base calculation: 1 shot per 10 seconds (middle ground)
  const baseCount = Math.round(sceneDuration / 10);
  
  // Adjust based on scene duration (longer scenes can have more shots)
  const complexityFactor = sceneDuration > 60 ? 1.3 : 1.0;
  
  const optimalCount = Math.round(baseCount * complexityFactor);
  
  // Clamp to reasonable range (2-8 shots per scene)
  return Math.max(2, Math.min(8, optimalCount));
}
```

---

## Key Prompt Sections

### 1. Cinematic Shot Composition Principles
- Each shot represents a distinct visual moment
- Natural flow between shots
- Visual variety (wide, medium, close-up)
- Camera movements match narrative mood

### 2. Shot Types Available
- Wide Shot / Establishing Shot
- Medium Wide Shot
- Medium Shot
- Close-Up
- Extreme Close-Up
- Detail Shot

### 3. Camera Movements Available
- Static (no movement)
- Pan Left / Pan Right
- Zoom In / Zoom Out
- Dolly Forward / Dolly Back
- Tilt Up / Tilt Down
- Track Left / Track Right

### 4. Reference Tagging System
- Characters: `@{CharacterName}` (e.g., @The Wolf, @Sarah)
- Locations: `@{LocationName}` (e.g., @Dark Wood, @Ancient Temple)
- Tags used in both narration text and action descriptions

### 5. Frame Mode Decision (Auto Mode)
- **image-reference**: Simple, static shots with minimal movement
- **start-end**: Complex shots with camera movement, smooth transitions

### 6. Continuity Groups
- Shots that should connect seamlessly
- First shot in group must be start-end mode
- Transition types and descriptions

---

**File Location**: `server/modes/narrative/prompts/shot-composer.ts`

