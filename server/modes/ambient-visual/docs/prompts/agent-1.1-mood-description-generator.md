# Agent 1.1: Mood Description Generator

## Overview

| Attribute | Value |
|-----------|-------|
| **Role** | Atmospheric Writer & Visual Poet |
| **Type** | AI Text Model (Creative Writing) |
| **Models** | GPT-4o, Claude 3.5 Sonnet |
| **Temperature** | 0.7 (creative, evocative) |
| **Purpose** | Generate rich, atmospheric mood descriptions for ambient visual content |

### Critical Mission

This agent creates the foundational mood description that guides all downstream visual generation. It transforms user inputs (mood, theme, time, season) into evocative, sensory-rich prose that captures the emotional and visual essence of the ambient experience.

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
• Movement and rhythm (matching loop settings)
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

## User Prompt Template

```
═══════════════════════════════════════════════════════════════════════════════
ATMOSPHERE SETTINGS
═══════════════════════════════════════════════════════════════════════════════

PRIMARY MOOD: {{mood}}
THEME/ENVIRONMENT: {{theme}}
LIGHTING/TIME: {{timeContext}}
ATMOSPHERE/CONDITION: {{season}}

DURATION: {{durationContext}}
ASPECT RATIO: {{aspectRatio}} ({{aspectRatioDescription}})

VISUAL STYLE: {{animationContext}}
RHYTHM: {{loopContext}}

═══════════════════════════════════════════════════════════════════════════════
USER'S CONCEPT (if provided)
═══════════════════════════════════════════════════════════════════════════════

{{#if userPrompt}}
The user has provided this initial concept to build upon:
"{{userPrompt}}"

Enhance and expand this concept while maintaining its core vision.
{{/if}}

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

Write a rich, evocative mood description (2-4 paragraphs) that:
1. Captures the {{mood}} emotional tone throughout
2. Describes the {{theme}} environment vividly
3. Incorporates {{timeContext}} lighting and atmosphere
4. Suggests {{season}} conditions naturally
5. Accounts for the {{loopContext}} visual rhythm
6. Is suitable for {{durationContext}}

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
  "timeContext": "dawn",
  "season": "spring",
  "duration": "10min",
  "aspectRatio": "16:9",
  "animationMode": "video-animation",
  "videoGenerationMode": "start-end-frame",
  "loopMode": true,
  "loopType": "seamless",
  "segmentLoopEnabled": false,
  "shotLoopEnabled": false,
  "userPrompt": "A peaceful forest at sunrise"
}
```

**Output:**
```
The gentle break of dawn filters through a misty forest, where ancient trees stand as silent guardians. Soft golden light creeps between branches, painting the forest floor in warm amber and cool shadow. Morning mist hovers just above the ground, creating layers of depth that shift and drift with imperceptible motion. The air feels still, yet alive with the promise of a new day.

Delicate spring foliage catches the first rays, each leaf a tiny prism refracting light into subtle greens and yellows. Dewdrops cling to spiderwebs strung between branches, catching and releasing light like scattered diamonds. The forest breathes slowly—a gentle rhythm that matches the viewer's own breath. Time seems to stretch and slow, inviting deep contemplation.

As dawn progresses, the light gradually intensifies, warming from cool blue-gray to soft gold. Shadows shorten and soften, revealing more detail in the undergrowth. The mist begins to lift, creating a sense of gentle awakening. This is a moment of transition—not dramatic, but profound in its subtlety. The scene invites you to pause, breathe, and find peace in nature's quiet ceremony.
```

---

### Example 2: Mysterious Urban Night

**Input:**
```json
{
  "mood": "mysterious",
  "theme": "urban",
  "timeContext": "night",
  "season": "winter",
  "duration": "30min",
  "aspectRatio": "16:9",
  "animationMode": "image-transitions",
  "loopMode": true,
  "loopType": "fade",
  "segmentLoopEnabled": true,
  "shotLoopEnabled": false,
  "userPrompt": ""
}
```

**Output:**
```
The city sleeps, but never truly rests. Neon signs cast electric blues and purples across rain-slicked streets, their reflections stretching into infinity. Steam rises from manholes, creating ghostly columns that catch and scatter the artificial light. The urban landscape becomes a canvas of shadow and illumination, where darkness and light dance in perfect balance.

Winter's chill hangs in the air, visible in the breath of the city itself. Frost patterns form on windows, creating intricate lacework that catches the glow from streetlamps. The architecture looms—towering glass and steel structures that seem to reach for the starless sky. Each building becomes a monolith, its windows dark or lit in random patterns like a vast, sleeping organism.

The rhythm is slow, contemplative. Headlights streak by occasionally, painting brief trails of light. The city's pulse is subdued but present—a low hum of distant traffic, the whisper of wind between buildings, the occasional distant siren. This is the city's secret hour, when it reveals its quieter, more introspective nature. The urban environment transforms into a meditative space, where solitude and connection coexist in the same frame.
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
| **Loop Awareness** | Does it account for looping if enabled? |
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

