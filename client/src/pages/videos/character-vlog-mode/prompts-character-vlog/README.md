# Character Vlog Mode - AI Agent Prompts

## Overview

This directory contains the comprehensive prompt engineering files for all AI agents used in the Character Vlog Mode workflow. Each agent has a dedicated prompt file with detailed instructions, examples, and quality guidelines.

---

## Directory Structure

```
prompts-character-vlog/
├── README.md (this file)
├── step-1-script/
│   └── agent-1.1-script-generator.md
├── step-2-elements/
│   ├── agent-2.1-character-analyzer.md
│   ├── agent-2.2-character-image-generator.md
│   ├── agent-2.3-location-analyzer.md
│   └── agent-2.4-location-image-generator.md
├── step-3-scenes/
│   ├── agent-3.1-scene-generator.md
│   ├── agent-3.2-shot-generator.md
│   └── agent-3.3-continuity-analyzer.md
├── step-4-storyboard/
│   └── agent-4.1-unified-prompt-producer.md
├── step-5-animatic/ (coming soon)
└── step-6-export/ (coming soon)
```

---

## Agent 1.1: Script Generator ✅ COMPLETE

**Location:** `step-1-script/agent-1.1-script-generator.md`

**Purpose:** Transform user's vlog idea into a complete, character-driven narrated script

**Key Features:**
- 8 personality types with detailed voice characteristics
- 2 narration styles (first-person, third-person)
- 10 genre-based content patterns
- 10 emotional tone palettes
- Duration-based structural guidelines (15s to 120s)
- Multi-language support with cultural authenticity
- Natural visual scene integration
- Plain text output (not JSON)

**Inputs:**
- `userPrompt` - User's vlog concept
- `characterPersonality` - energetic, calm, humorous, serious, mysterious, inspirational, friendly, adventurous
- `narrationStyle` - first-person, third-person
- `theme` - Visual environment theme
- `duration` - Target duration in seconds
- `genres` - Array of selected genres (max 3)
- `tones` - Array of selected tones (max 3)
- `language` - Target language for script

**Output:**
- Plain text script ready for narration

**Examples Included:**
1. Energetic tech review (English, 30s)
2. Calm nature vlog (Arabic, 45s)
3. Humorous cooking vlog (Spanish, 60s)
4. Mysterious story vlog (English, 75s)
5. Inspirational fitness vlog (Portuguese, 90s)

---

## Agent 2.1: Character Analyzer ✅ COMPLETE

**Location:** `step-2-elements/agent-2.1-character-analyzer.md`

**Purpose:** Analyze script to suggest primary and secondary characters with detailed descriptions

**Key Features:**
- Unified agent for both primary and secondary characters
- Applies characterPersonality to PRIMARY character only
- Secondary characters based on script features only
- Theme, style, and worldDescription integration
- AI-ready appearance descriptions (100-150 words for primary, 50-80 for secondary)
- Mention count tracking

**Inputs:**
- `script` - Full vlog script text
- `narrationStyle` - first-person, third-person
- `characterPersonality` - PRIMARY character only
- `theme` - Visual environment
- `style` - Visual style preset
- `worldDescription` - Custom world atmosphere

**Output:**
- `primaryCharacter` object with name, description, appearance, mentionCount
- `secondaryCharacters` array (0-4 characters) with same structure

**Examples Included:**
1. First-person energetic urban vlog (3 secondary characters)
2. Third-person adventurous nature quest (1 secondary character)
3. Tech serious solo vlog (0 secondary characters)
4. Calm park walk (1 secondary character)

---

## Agent 2.2: Character Image Generator ✅ COMPLETE

**Location:** `step-2-elements/agent-2.2-character-image-generator.md`

**Purpose:** Execute character portrait image generation using static prompt template

**Key Features:**
- Static prompt template with variable substitution
- Direct image generation (not prompt engineering)
- Style handling (preset or custom image)
- Personality visual mapping (primary characters only)
- World description integration
- Aspect ratio optimization
- Reference image support

**Inputs:**
- `name` - Character name
- `appearance` - Full appearance description
- `personality` - Personality traits (optional, primary only)
- `age` - Character age (optional)
- `style` - Preset name or "custom_image"
- `worldDescription` - World context
- `aspectRatio` - Image dimensions
- `imageModel` - Selected image model (Flux, Midjourney, etc.)
- `referenceImageUrl` - Optional reference image URL

**Output:**
- `imageUrl` - URL to generated character portrait
- `cost` - Generation cost in USD (optional)

**Process:**
1. Build prompt using static template + variable substitution
2. Call image generation API with built prompt
3. Return generated image URL

**Examples Included:**
1. Primary character with personality (Realistic Cinematic)
2. Secondary character (Anime Style)
3. Primary character with custom image style + reference
4. Calm personality (Soft Illustrated)

---

## Agent 2.3: Location Analyzer ✅ COMPLETE

**Location:** `step-2-elements/agent-2.3-location-analyzer.md`

**Purpose:** Analyze script to suggest scene locations (2-5) based on script mentions, theme, genre, and world context

**Key Features:**
- Extracts explicit location mentions from script (prioritized)
- Applies genre-based location filtering
- Uses theme-based defaults when needed
- Considers video duration for location count
- Incorporates world description atmosphere
- Generates detailed visual descriptions for image generation

**Inputs:**
- `script` - Full vlog script text
- `theme` - Visual theme (urban, nature, etc.)
- `genre` - Selected genres (array, up to 3)
- `worldDescription` - World context
- `duration` - Target video duration in seconds
- `maxResults` - Maximum locations (default: 5)

**Output:**
- `locations` array (2-5 locations)
- Each location: `name`, `description` (30-50 words), `details` (50-100 words)

**Examples Included:**
1. Urban Lifestyle Comedy (script mentions)
2. Nature Adventure (theme defaults)
3. Horror Mystery (genre filtering)
4. Fantasy Adventure (multiple genres)

---

## Agent 2.4: Location Image Generator ✅ COMPLETE

**Location:** `step-2-elements/agent-2.4-location-image-generator.md`

**Purpose:** Execute location environment image generation using static prompt template

**Key Features:**
- Static prompt template with variable substitution
- Direct image generation executor
- Style handling (preset or custom image)
- World description integration
- Aspect ratio optimization
- Reference image support (style + location)

**Inputs:**
- `name` - Location name
- `description` - Brief description (30-50 words)
- `details` - Visual details (50-100 words)
- `style` - Preset name or "custom_image"
- `styleImageUrl` - Style reference image (when custom)
- `worldDescription` - World context
- `aspectRatio` - Image dimensions
- `imageModel` - Selected image model
- `referenceImageUrl` - Optional location reference image

**Output:**
- `imageUrl` - URL to generated location environment image

**Process:**
1. Build prompt using static template + variable substitution
2. Call image generation API with built prompt
3. Return generated image URL

**Input Source:** Agent 2.3 (Location Analyzer) output or manual user input

**Examples Included:**
1. Urban Coffee Shop (Preset Style)
2. Nature Forest Trail (Anime Style)
3. Custom Style + Reference Image
4. Horror Mystery Location (Cinematic)

## Agent 3.1: Scene Generator ✅ COMPLETE

**Location:** `step-3-scenes/agent-3.1-scene-generator.md`

**Purpose:** Divide script into logical scenes based on narrative structure, character presence, and location changes

**Key Features:**
- Identifies natural scene breaks (location changes, time jumps, character shifts)
- Descriptive scene naming (format: "Scene {number}: {Title}")
- Duration estimation based on script portion, dialogue density, and target duration
- Character and location integration
- World description atmosphere incorporation
- Typically generates 3-5 scenes for standard vlog scripts

**Inputs:**
- `script` - Full vlog script text
- `theme` - Visual environment theme
- `duration` - Target video duration in seconds
- `worldDescription` - World context and atmosphere
- `numberOfScenes` - 'auto' or specific number (1-20), optional
- `shotsPerScene` - 'auto' or specific number (1-10), optional (informational)
- `primaryCharacter` - Main character object
- `secondaryCharacters` - Array of up to 4 secondary characters
- `locations` - All available locations

**Output:**
- `scenes` array (flexible count based on narrative breaks, or exact number if numberOfScenes specified)
- Each scene: `name`, `description` (2-3 sentences), `duration` (seconds)

**Key Features:**
- Respects `numberOfScenes`: If number provided, creates exactly that many scenes
- Auto mode: Determines optimal scene count (typically 3-5)
- Considers `shotsPerScene` for planning scene complexity

**Examples Included:**
1. Urban Lifestyle Vlog (Short Duration, 3 scenes, auto)
2. Nature Adventure Vlog (Medium Duration, 3 scenes, auto)
3. Home Lifestyle Vlog (Multiple Characters, 4 scenes, auto)
4. Fixed Number of Scenes (numberOfScenes = 4, forced breakdown)

---

## Agent 3.2: Shot Generator ✅ COMPLETE

**Location:** `step-3-scenes/agent-3.2-shot-generator.md`

**Purpose:** Generate detailed shots for each scene based on script content, reference mode, and visual storytelling principles

**Key Features:**
- Breaks down scenes into detailed, actionable shots
- Assigns frame types (1F or 2F) based on reference mode rules
- Selects camera angles from 10 preset options
- Tags characters and locations for image mapping
- Assigns durations from available model options
- Incorporates world description for atmosphere consistency

**Inputs:**
- `sceneName` - Scene name from Scene Generator
- `sceneDescription` - Scene description
- `scriptPortion` - Script text for this specific scene
- `characters` - Available characters (primary + secondary)
- `locations` - Available locations
- `theme` - Visual environment theme
- `worldDescription` - World context and atmosphere
- `referenceMode` - "1F", "2F", or "AI"
- `videoModel` - Default video model selected
- `videoModelDurations` - Array of available durations (e.g., [2, 4, 5, 6, 8, 10, 12])
- `videoModelMaxDuration` - Maximum shot duration constraint
- `targetDuration` - Target video duration in seconds (context)
- `shotsPerScene` - 'auto' or specific number (1-10)

**Output:**
- `shots` array (exact count if shotsPerScene is number, or optimal count if 'auto')
- Each shot: `name`, `description`, `shotType` ("1F" or "2F"), `cameraShot` (10 preset options), `referenceTags` (character/location tags), `duration` (from videoModelDurations array)

**Key Features:**
- **Reference Mode Handling:**
  - 1F Mode: All shots assigned 1F (single frame)
  - 2F Mode: All shots assigned 2F (start/end frames)
  - AI Mode: Intelligently decides per shot (mix of 1F and 2F)
- **Camera Angles:** 10 preset options (Extreme Close-up, Close-up, Medium Close-up, Medium Shot, Medium Wide Shot, Wide Shot, Extreme Wide Shot, Over-the-Shoulder, Point of View, Establishing Shot)
- **Duration Selection:** Must be from videoModelDurations array
- **Shot Count Control:** Respects shotsPerScene setting (exact number or auto)
- **World Description Integration:** Incorporates atmosphere into shot descriptions

**Examples Included:**
1. Urban Lifestyle Vlog (1F Mode, Auto Shot Count)
2. Nature Adventure Vlog (2F Mode, Fixed Shot Count)
3. Home Lifestyle Vlog (AI Mode, Auto Shot Count)

---

## Agent 3.2: Shot Generator ✅ COMPLETE

**Location:** `step-3-scenes/agent-3.2-shot-generator.md`

**Purpose:** Generate detailed shots for each scene based on script content, reference mode, and visual storytelling principles

**Key Features:**
- Breaks down scenes into detailed, actionable shots
- Assigns frame types (1F or 2F) based on reference mode rules
- Selects camera angles from 10 preset options
- Tags characters and locations for image mapping
- Assigns durations from available model options
- Incorporates world description for atmosphere consistency

**Inputs:**
- `sceneName` - Scene name from Scene Generator
- `sceneDescription` - Scene description
- `scriptPortion` - Script text for this specific scene
- `characters` - Available characters (primary + secondary)
- `locations` - Available locations
- `theme` - Visual environment theme
- `worldDescription` - World context and atmosphere
- `referenceMode` - "1F", "2F", or "AI"
- `videoModel` - Default video model selected
- `videoModelDurations` - Array of available durations (e.g., [2, 4, 5, 6, 8, 10, 12])
- `videoModelMaxDuration` - Maximum shot duration constraint
- `targetDuration` - Target video duration in seconds (context)
- `shotsPerScene` - 'auto' or specific number (1-10)

**Output:**
- `shots` array (exact count if shotsPerScene is number, or optimal count if 'auto')
- Each shot: `name`, `description`, `shotType` ("1F" or "2F"), `cameraShot` (10 preset options), `referenceTags` (character/location tags), `duration` (from videoModelDurations array)

**Key Features:**
- **Reference Mode Handling:**
  - 1F Mode: All shots assigned 1F (single frame)
  - 2F Mode: All shots assigned 2F (start/end frames)
  - AI Mode: Intelligently decides per shot (mix of 1F and 2F)
- **Camera Angles:** 10 preset options (Extreme Close-up, Close-up, Medium Close-up, Medium Shot, Medium Wide Shot, Wide Shot, Extreme Wide Shot, Over-the-Shoulder, Point of View, Establishing Shot)
- **Duration Selection:** Must be from videoModelDurations array
- **Shot Count Control:** Respects shotsPerScene setting (exact number or auto)
- **World Description Integration:** Incorporates atmosphere into shot descriptions

**Examples Included:**
1. Urban Lifestyle Vlog (1F Mode, Auto Shot Count)
2. Nature Adventure Vlog (2F Mode, Fixed Shot Count)
3. Home Lifestyle Vlog (AI Mode, Auto Shot Count)

## Agent 3.3: Continuity Analyzer ✅ COMPLETE

**Location:** `step-3-scenes/agent-3.3-continuity-analyzer.md`

**Purpose:** Analyze shots within scenes to identify potential visual continuity chains for seamless frame-to-frame transitions

**Key Features:**
- Single API call processes all scenes (per-scene analysis)
- Only links shots within the same scene (no cross-scene linking)
- Rule 0: First shot in continuity group MUST be 2F
- Rule 1: 2F can link to 2F (seamless continuation)
- Rule 2: 2F can link to 1F (smooth to simpler)
- Rule 3: 1F cannot link to another shot (no distinct end frame)
- First shot in each scene CAN be first in group if 2F
- Outputs `isLinkedToPrevious` and `isFirstInGroup` flags per shot

**Inputs:**
- `scenes[]` - All scenes in the project
- `shots[]` - All shots with `sceneId` for grouping
- `characters[]` - Character list
- `locations[]` - Location list
- `referenceMode` - "1F", "2F", or "AI"

**Output:**
- `sceneLinks[]` - Array grouped by scene
- Each link: `shotId`, `isLinkedToPrevious`, `isFirstInGroup`

**Examples Included:**
1. 2F Mode (all shots 2F, continuity chains)
2. 1F Mode (no continuity, all standalone)
3. AI Mixed Mode (complex 2F→2F→1F chains)

---

## Agent 4.1: Unified Prompt Producer ✅ COMPLETE

**Location:** `step-4-storyboard/agent-4.1-unified-prompt-producer.md`

**Purpose:** Generate context-aware image and video prompts for character vlog shots, respecting reference modes and visual continuity

**Key Features:**
- **Two-Phase Process**: Deep Analysis → Prompt Translation
- **Vision-based**: Analyzes character, location, and art style reference images
- **6 Scenarios**: 1F standalone, 1F linked, 2F standalone, 2F first in group, 2F linked, AI mixed
- **Continuity Management**: Handles inherited frames for seamless shot-to-shot flow
- **Camera Movement**: Determined by agent through shot analysis
- **Single Video Prompt**: One unified video prompt (not separate for start/end)

**Inputs:**
- `shotId`, `shotDescription`, `frameType`, `cameraShot`, `shotDuration`
- `characterReferences`, `locationReferences` (images)
- `artStyle`, `artStyleImageUrl`, `worldDescription`
- `isFirstInGroup`, `isLinkedToPrevious`, `previousShotOutput`
- `referenceTags`, `aspectRatio`

**Output:**
- `imagePrompts`: `single` (1F), `start` (2F), `end` (2F)
- `negativePrompt`: Elements to avoid
- `videoPrompt`: Single unified motion/action prompt
- `motionParameters`: `motionStrength`, `cameraMovementType`
- `visualContinuityNotes`: For next shot (if first in group)
- `lastFrameDescription`: For inheritance

**Critical Rules:**
- 1F linked: NO image prompt (inherited), only video prompt
- 2F linked: NO start prompt (inherited), only end + video
- Video prompt: ALWAYS one prompt for both frames
- Inherited frames: NEVER generate prompts for them

**Examples Included:**
1. 1F Standalone (character at desk)
2. 1F Linked (inherits reference frame)
3. 2F First in Group (movement with continuity notes)
4. 2F Linked (inherits start frame)
5. Environmental Motion (no character)

---

## Agent 4.2: Storyboard Image Generator ✅ COMPLETE

**Location:** `step-4-storyboard/agent-4.2-storyboard-image-generator.md`

**Purpose:** Generate storyboard frame images from AI prompts with continuity awareness and reference image support

**Key Features:**
- **Executor Agent**: Receives prompts from Agent 4.1, calls image generation APIs
- **5 Generation Scenarios**: 1F standalone, 1F linked, 2F standalone, 2F first in group, 2F linked
- **Continuity Frame Reuse**: Linked shots reuse previous end frames (cost savings)
- **Multi-Model Support**: Flux, Midjourney, DALL-E 3, Ideogram, Nano Banana
- **Reference Images**: Character, location, and style references for consistency
- **Cost Efficiency**: Tracks generated frame count (0, 1, or 2) for accurate costs

**Inputs:**
- `shotId`, `frameType`, `imagePrompts` (from Agent 4.1)
- `negativePrompt`, `characterReferences`, `locationReferences`
- `styleImageUrl`, `styleDescription`, `aspectRatio`, `imageModel`, `quality`
- `isLinkedToPrevious`, `isFirstInGroup`, `previousEndFrame`

**Output:**
- `imagePrompts`: single, start, end (text prompts)
- `negativePrompt`: Elements to avoid
- `videoPrompt`: Single unified prompt with camera movement and motion intensity
- `visualContinuityNotes`: For next shot (if first in group)

**Critical Logic:**
- 1F linked: NO generation (reference frame inherited) → 0 frames generated
- 2F linked: Generate end only (start inherited) → 1 frame generated
- 1F standalone: Generate single → 1 frame generated
- 2F standalone/first: Generate start + end → 2 frames generated

**Examples Included:**
1. 1F Standalone (generates 1 image)
2. 1F Linked (0 images, frame inherited)
3. 2F Standalone (generates 2 images)
4. 2F First in Group (generates 2 images)
5. 2F Linked (generates 1 image, start inherited)
6. Error Handling (partial failure)

---

## Agent 4.3: VoiceOver Script Writer ✅ COMPLETE

**Location:** `step-4-storyboard/agent-4.3-voiceover-script-writer.md`

**Purpose:** Generate cohesive, per-shot narration script for voiceover synthesis, matching shot durations and maintaining narrative flow

**Key Features:**
- **Conditional Agent**: Only runs if VoiceOver is enabled in settings
- **One-Pass Generation**: Writes entire script in one pass for consistency
- **Duration Matching**: Calculates word count to match shot durations (150-160 WPM)
- **Visual Complement**: Adds context and emotion, doesn't describe obvious visuals
- **Style Consistency**: Maintains character personality, narration style, and tone throughout
- **Smooth Transitions**: Natural flow between shots, especially connected shots

**Inputs:**
- `fullScript`: Complete script from Script step
- `shots[]`: All shots with shotId, sceneId, sequenceOrder, duration, shotDescription, characters
- `characterPersonality`: Character personality type (energetic, calm, humorous, etc.)
- `narrationStyle`: "first-person" or "third-person"
- `tone`: Array of emotional tones (max 3)
- `language`: Target language (ISO code)

**Output:**
- `voiceoverSegments[]`: Per-shot narration with shotId, narrationText, estimatedDuration, paceNote
- `totalWordCount`: Total words across all segments
- `totalEstimatedDuration`: Total estimated duration in seconds

**Critical Principles:**
- Narration complements visuals (adds context, not literal description)
- Matches shot durations (word count = duration × WPM)
- Maintains consistent voice throughout
- Smooth transitions between shots
- Respects character personality and narration style

**Examples Included:**
1. First-Person Energetic Urban Vlog (3 shots)
2. Third-Person Calm Nature Vlog (2 shots)
3. First-Person Humorous Cooking Vlog (2 shots)
4. Third-Person Mysterious Story Vlog (3 shots)
5. First-Person Inspirational Fitness Vlog (2 shots)

---

## Coming Soon

### Agent 4.4: Image Editor
- Modify existing images with text instructions
- Preserve character/style consistency
- Targeted edits only

### Agent 4.3: Image Editor
- Modify existing images with text instructions
- Preserve character/style consistency
- Targeted edits only

### Agent 4.4: Video Generator
- Animate static images into video clips
- Control motion and camera movement
- Match specified duration

### Agent 4.5: VoiceOver Script Writer
- Generate narration scripts for shots
- Match character personality and tone
- Sync with visual content

---

## Prompt Engineering Standards

All agent prompts in this directory follow these standards:

### Structure
1. **Overview** - Role, Type, Models, Temperature, Purpose
2. **System Prompt** - Comprehensive instructions with databases, guides, and constraints
3. **User Prompt Template** - Input formatting specifications
4. **Output Format** - Expected output structure (JSON, plain text, etc.)
5. **Examples** - Multiple real-world input/output examples
6. **Notes** - Additional context and edge cases
7. **Validation Checklist** - Quality assurance criteria

### Best Practices Applied
- Clear, specific instructions
- Persona/role definition
- Context-rich databases (personality traits, genres, tones)
- Output format specifications
- Constraints (NEVER/ALWAYS sections)
- Multiple diverse examples
- Quality standards and validation

### Temperature Guidelines
- **0.0-0.3**: Deterministic tasks (data extraction, analysis)
- **0.4-0.6**: Balanced tasks (optimization, refinement)
- **0.7-0.9**: Creative tasks (script writing, content generation)
- **1.0+**: Highly creative, experimental (not typically used)

---

## Usage

Each prompt file is designed to be:
1. **Copy-paste ready** for LLM API calls
2. **Self-contained** with all necessary context
3. **Example-rich** for few-shot learning
4. **Version-controlled** for iterative improvement

### Integration Pattern
```typescript
// Example usage pattern
const systemPrompt = readPromptFile('agent-1.1-script-generator.md', 'system');
const userPrompt = formatUserPrompt({
  userPrompt: "My vlog idea...",
  characterPersonality: "energetic",
  // ... other parameters
});

const response = await llm.generate({
  system: systemPrompt,
  user: userPrompt,
  temperature: 0.7,
  model: "gpt-5"
});

const script = response.text; // Plain text output
```

---

## Version History

### v1.0.0 - December 24, 2025
- ✅ Agent 1.1: Script Generator - Complete
- Created base directory structure
- Established prompt engineering standards

### v1.1.0 - December 25, 2025
- ✅ Agent 2.1: Character Analyzer - Complete
- Key feature: characterPersonality applied to PRIMARY only, not secondary

### v1.2.0 - December 25, 2025
- ✅ Agent 2.2: Character Image Generator - Complete
- Static prompt template with variable substitution
- Direct image generation executor
- Style handling (preset and custom image)
- Personality visual mapping
- Aspect ratio optimization

### v1.3.0 - December 25, 2025
- ✅ Agent 2.3: Location Analyzer - Complete
- Script location extraction (prioritized)
- Genre-based location filtering
- Theme-based defaults
- Duration-aware location count
- World description integration

### v1.4.0 - December 25, 2025
- ✅ Agent 2.4: Location Image Generator - Complete
- Static prompt template with variable substitution
- Direct image generation executor
- Style handling (preset and custom image)
- Reference image support (style + location)
- Aspect ratio optimization

### v1.5.0 - December 25, 2025
- ✅ Agent 3.1: Scene Generator - Complete
- Narrative structure analysis
- Scene identification (location, time, character shifts)
- Duration estimation with dialogue density consideration
- Character and location integration
- World description atmosphere incorporation

### v1.6.0 - December 30, 2025
- ✅ Agent 3.2: Shot Generator - Complete
- Reference mode handling (1F, 2F, AI)
- Camera angle selection (10 presets)
- Duration assignment from model capabilities
- Character/location tagging
- World description integration

### v1.7.0 - December 30, 2025
- ✅ Agent 3.3: Continuity Analyzer - Complete
- Single API call, per-scene analysis
- Continuity chain identification
- Frame type rules (2F→2F, 2F→1F, 1F standalone)
- First-in-group detection
- Shot linking within scenes only

### v1.8.0 - December 30, 2025
- ✅ Agent 4.1: Unified Prompt Producer - Complete (REWRITTEN)
- Professional prompt engineering structure
- Two-phase analysis approach (Deep Analysis → Prompt Translation)
- 6 comprehensive scenarios with inherited frame handling
- Vision-based character/location/style analysis
- Agent-determined camera movement
- Single unified video prompt
- Continuity inheritance system
- Reference to Social Commerce Mode best practices

### v1.9.0 - December 30, 2025
- ✅ Agent 4.2: Storyboard Image Generator - Complete
- Executor agent for image generation from prompts
- 5 generation scenarios with continuity handling
- Frame reuse logic (linked shots inherit previous frames)
- Multi-model support (Flux, Midjourney, DALL-E 3, Ideogram, Nano Banana)
- Reference image integration (character, location, style)
- Error handling with retry and fallback logic

### v1.10.0 - December 30, 2025
- ✅ Agent 4.3: VoiceOver Script Writer - Complete
- Conditional agent (only runs if VoiceOver enabled)
- One-pass generation for consistency across all shots
- Duration matching (150-160 WPM calculation)
- Visual complement principle (adds context, not literal description)
- Style consistency (character personality, narration style, tone)
- Smooth transitions between shots
- 5 comprehensive examples covering different personalities and styles

---

## Contributing

When adding new agent prompts:
1. Follow the established structure template
2. Include minimum 3 diverse examples
3. Define clear input/output specifications
4. Add validation checklist
5. Document edge cases in Notes section
6. Use appropriate temperature for task type

