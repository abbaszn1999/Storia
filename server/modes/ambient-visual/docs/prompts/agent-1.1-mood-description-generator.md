# Agent 1.1: Mood Description Generator

## Overview

| Attribute | Value |
|-----------|-------|
| **Role** | Atmospheric Writer & Visual Poet |
| **Type** | AI Text Model (Creative Writing) |
| **Models** | GPT-5 |
| **Temperature** | 0.7 (creative, evocative) |
| **Purpose** | Generate rich, atmospheric mood descriptions for ambient visual content |

### Critical Mission

This agent creates the foundational mood description that guides all downstream visual generation. It transforms user inputs (mood, theme, season, duration, aspectRatio, timeContext, userStory) into evocative, sensory-rich prose that captures the emotional and visual essence of the ambient experience.

---

## System Prompt

```
═══════════════════════════════════════════════════════════════════════════════
SYSTEM: AGENT 1.1 — MOOD DESCRIPTION GENERATOR
═══════════════════════════════════════════════════════════════════════════════

You are an expert in crafting atmospheric mood descriptions for ambient visual content.
Your descriptions should evoke the emotional and sensory experience of the visual journey.

═══════════════════════════════════════════════════════════════════════════════
YOUR ROLE
═══════════════════════════════════════════════════════════════════════════════

You create mood descriptions for long-form ambient videos used for:
• Meditation and mindfulness
• Focus and productivity backgrounds
• Relaxation and sleep
• Atmospheric ambiance

═══════════════════════════════════════════════════════════════════════════════
WRITING GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

Your descriptions should:
• Capture the emotional essence and atmosphere
• Paint a vivid sensory picture (visual, auditory, tactile)
• Guide the visual generation in later steps
• Be concise but evocative (2-4 paragraphs)
• Use present tense for immediacy
• Avoid clichés and generic phrases

Focus on:
• Color palettes and light qualities
• Movement and rhythm
• Textures and materials
• Ambient sounds implied by the scene
• Emotional journey through the duration

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY the mood description text.
No headers, labels, or formatting markers.
Just flowing, evocative prose that sets the visual tone.
```

---

## Input Fields

All input fields are **required**:

| Field | Type | Description |
|-------|------|-------------|
| `mood` | string | Primary emotional tone |
| `theme` | string | Environment theme |
| `season` | string | Atmospheric condition/season |
| `duration` | string | Video duration |
| `aspectRatio` | string | Video aspect ratio |
| `timeContext` | string | Lighting/time of day context |
| `userStory` | string | User's original concept/idea to build upon |

---

## User Prompt Template

```
═══════════════════════════════════════════════════════════════════════════════
ATMOSPHERE SETTINGS
═══════════════════════════════════════════════════════════════════════════════

PRIMARY MOOD: {{mood}}
THEME/ENVIRONMENT: {{theme}}
LIGHTING/TIME: {{timeContext}}
ATMOSPHERE/CONDITION: {{season}}

DURATION: {{duration}}
ASPECT RATIO: {{aspectRatio}}

═══════════════════════════════════════════════════════════════════════════════
USER'S CONCEPT
═══════════════════════════════════════════════════════════════════════════════

The user has provided this initial concept to build upon:
"{{userStory}}"

Enhance and expand this concept while maintaining its core vision.

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

Write a rich, evocative mood description (2-4 paragraphs) that:
1. Captures the {{mood}} emotional tone throughout
2. Describes the {{theme}} environment vividly
3. Incorporates {{timeContext}} lighting and atmosphere
4. Suggests {{season}} conditions naturally
5. Builds upon the user's concept: "{{userStory}}"
6. Is suitable for {{duration}} duration
7. Works with {{aspectRatio}} aspect ratio

Focus on sensory details: colors, light quality, textures, implied sounds, and the emotional journey.
```

---

## Output Format

The agent returns a plain text string (no JSON) containing the mood description.

**Expected Output:**
- 2-4 paragraphs of flowing prose
- No headers, labels, or formatting
- Evocative and sensory-rich
- Present tense
- 200-600 words

---

## Example Input/Output

### Example 1: Calm Nature Scene

**Input:**
```json
{
  "mood": "calm",
  "theme": "nature",
  "season": "spring",
  "duration": "10min",
  "aspectRatio": "16:9",
  "timeContext": "dawn",
  "userStory": "A peaceful forest at sunrise"
}
```

**Output:**
```
The gentle break of dawn filters through a misty forest, where ancient trees stand as silent guardians. Soft golden light creeps between branches, painting the forest floor in warm amber and cool shadow. Morning mist hovers just above the ground, creating layers of depth that shift and drift with imperceptible motion. The air feels still, yet alive with the promise of a new day.

Delicate spring foliage catches the first rays, each leaf a tiny prism refracting light into subtle greens and yellows. Dewdrops cling to spiderwebs strung between branches, catching and releasing light like scattered diamonds. The forest breathes slowly—a gentle rhythm that matches the viewer's own breath. Time seems to stretch and slow, inviting deep contemplation.

As dawn progresses, the light gradually intensifies, warming from cool blue-gray to soft gold. Shadows shorten and soften, revealing more detail in the undergrowth. The mist begins to lift, creating a sense of gentle awakening. This is a moment of transition—not dramatic, but profound in its subtlety. The scene invites you to pause, breathe, and find peace in nature's quiet ceremony.
```

---

### Example 2: Cozy Interior Night

**Input:**
```json
{
  "mood": "calm",
  "theme": "nature",
  "season": "rainy",
  "duration": "5min",
  "aspectRatio": "16:9",
  "timeContext": "night",
  "userStory": "window with rainy and thunder weather outside having a small chemine"
}
```

**Output:**
```
Through the window, a storm rages silently in the darkness. Rain streaks down the glass in constant streams, catching and distorting the warm light that spills from inside. Thunder rumbles in the distance, a low growl that shakes the very air, while lightning occasionally illuminates the scene in brief, brilliant flashes that reveal the silhouette of trees bending in the wind.

Inside, a small fireplace casts flickering orange and gold light across the room. The flames dance and leap, creating shadows that move and shift on the walls. The warmth from the fire contrasts beautifully with the cold, wet darkness outside. The sound of rain hitting the window creates a steady, rhythmic pattern—nature's own lullaby.

The window becomes a threshold between two worlds: the chaotic, powerful storm outside and the peaceful, intimate sanctuary within. The fireplace crackles softly, its flames casting a warm, inviting glow that makes the storm outside feel distant and contained. This is a moment of perfect comfort, where the elements rage beyond while warmth and safety reign within.
```

---

## Quality Checklist

Before accepting Agent 1.1 output, verify:

| Criterion | Check |
|-----------|-------|
| **Length** | Is it 2-4 paragraphs (200-600 words)? |
| **Sensory Detail** | Does it describe colors, light, textures, implied sounds? |
| **Emotional Tone** | Does it capture the specified mood throughout? |
| **Visual Guidance** | Can downstream agents use this to generate visuals? |
| **Present Tense** | Is it written in present tense? |
| **No Clichés** | Does it avoid generic phrases? |
| **User Story Integration** | Does it build upon the user's concept? |
| **Duration Appropriate** | Is the description suitable for the specified duration? |

---

## Downstream Dependencies

This agent's output is consumed by:

| Agent | Fields Used | Purpose |
|-------|-------------|---------|
| 2.1 Scene Generator | `moodDescription` | Break down into visual segments |
| 2.2 Shot Composer | `moodDescription` (via scenes) | Create individual shots |
| 3.1 Video Prompt Engineer | `moodDescription` (via shots) | Generate image/video prompts |

---

## Implementation Notes

### API Call Structure

```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  temperature: 0.7,
  messages: [
    { role: "system", content: MOOD_DESCRIPTION_SYSTEM_PROMPT },
    { role: "user", content: buildMoodDescriptionUserPrompt(input) }
  ]
});

const moodDescription = response.choices[0].message.content.trim();
```

### Validation

```typescript
function validateMoodDescription(description: string): boolean {
  // Check minimum length
  if (description.length < 200) return false;
  
  // Check maximum length
  if (description.length > 2000) return false;
  
  // Check for present tense indicators (basic check)
  const pastTenseIndicators = /\b(was|were|had|went|did)\b/gi;
  const pastCount = (description.match(pastTenseIndicators) || []).length;
  if (pastCount > 3) return false; // Allow some past tense for context
  
  // Check paragraph count (rough estimate)
  const paragraphs = description.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  if (paragraphs.length < 2 || paragraphs.length > 6) return false;
  
  return true;
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-29 | Initial comprehensive prompt |
| 1.1 | 2024-12-29 | Simplified to 7 required input fields only |

