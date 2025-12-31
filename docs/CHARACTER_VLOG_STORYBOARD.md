# Character Vlog Mode - Storyboard Step Documentation

## Overview

The **Storyboard** step is where shots are automatically transformed into visual frames through AI-powered image generation. This step comes after Scenes creation and involves:

1. **Automatic Image Generation** - AI generates images for all shots upon entry
2. **Manual Prompt Editing** - Refine prompts and regenerate specific shots
3. **Advanced Image Editing** - Modify existing images (clothes, expression, camera, etc.)
4. **Video Animation** (Optional) - Animate static images into video clips
5. **Voiceover Generation** (Optional) - Generate narration script if enabled

The Reference Mode (1F/2F/AI) selected at project creation determines how many images are generated per shot, and continuity links from the Scenes step enable seamless visual transitions.

**Note on Image Replacement**: Each shot maintains only one image at a time. When regenerating or editing, the new image permanently replaces the previous one—no version history is kept.

---

## Table of Contents

1. [Workflow Context](#workflow-context)
2. [Phase 1 Step 1: Prompt Generation](#phase-1-step-1-prompt-generation)
3. [Phase 1 Step 2: Image Generation](#phase-1-step-2-image-generation)
4. [Phase 1 Step 3: Voiceover Script Generation](#phase-1-step-3-voiceover-script-generation)
5. [Phase 2: Manual Prompt Editing](#phase-2-manual-prompt-editing)
6. [Phase 3: Advanced Image Editing](#phase-3-advanced-image-editing)
7. [Phase 4: Video Animation](#phase-4-video-animation)
8. [Scene Settings](#scene-settings)
9. [Audio & Voiceover Settings](#audio--voiceover-settings)
10. [Shot Management](#shot-management)
11. [Data Models](#data-models)
12. [UI/UX Design](#uiux-design)
13. [Complete Workflow Summary](#complete-workflow-summary)
14. [AI Components Summary](#ai-components-summary)
15. [Navigation Flow](#navigation-flow)

---

## Workflow Context

**Step 4 of 6**: Storyboard

**Inputs from Scenes Step**:
- `scenes[]` - All scenes with metadata
- `shots[]` - All shots with descriptions, camera angles, frame types
- `characters[]` - Character references from Elements
- `locations[]` - Location references from Elements
- `worldSettings` - Style, art style, world description
- `referenceMode` - "1F", "2F", or "AI" (from project creation)
- `continuityGroups` - Linked shot groups (if continuity was analyzed)

**Outputs to Animatic Step**:
- `shots[]` - All shots with generated images
- `videoUrls` - Animated videos (if animation was run)
- `voiceoverScript` - Voice over text per shot (if enabled)

---

## Phase 1 Step 1: Prompt Generation

### Purpose
Automatically generate context-aware image and video prompts for all shots, considering continuity, references, and world settings.

### User Flow

**Triggered when**: User clicks "Continue" from Scenes step

**Process**:
1. Unified Prompt Producer processes each shot sequentially
2. For each shot, generates image prompt(s) and video prompt
3. Considers continuity links from Scenes step
4. Respects Reference Mode (1F/2F/AI) for frame count
5. Maintains visual consistency across shots

### AI Agent: Unified Prompt Producer (Agent 4.0)

#### Role
Context-aware prompt engineering for both image and video generation, with scene-level continuity awareness.

#### AI Model
GPT-4 / Claude (Prompt Engineering)

#### Inputs (per shot)

| Parameter | Type | Description |
|-----------|------|-------------|
| `shotDescription` | string | Shot description from Scenes step |
| `frameType` | "1F" \| "2F" | Frame type from Reference Mode or AI decision |
| `cameraShot` | string | Camera angle (Close-up, Wide Shot, etc.) |
| `cameraMovement` | string | Camera movement (Static, Pan, Zoom, etc.) |
| `referenceTags` | string[] | Character/location tags (e.g., @PrimaryCharacter, @Location1) |
| `characterReferences` | Map<id, URL> | Character reference images from Elements |
| `locationReferences` | Map<id, URL> | Location reference images from Elements |
| `artStyle` | string | Art style description from world settings |
| `worldDescription` | string | World description from Elements |
| `aspectRatio` | string | Project aspect ratio (9:16, 16:9, 1:1) |
| `continuityInfo` | object | Continuity link info (if shot is linked) |
| `previousShotOutput` | object | Previous shot's prompt output (for continuity) |
| `isFirstInGroup` | boolean | Whether shot is first in continuity group |
| `isLinkedToPrevious` | boolean | Whether shot is linked to previous shot |

#### Outputs (per shot)

| Field | Type | Description |
|-------|------|-------------|
| `imagePrompts` | object | Image prompts (varies by scenario) |
| └─ `single` | string | Single image prompt (1F mode) |
| └─ `start` | string | Start frame prompt (2F mode, if applicable) |
| └─ `end` | string | End frame prompt (2F mode, always present) |
| `negativePrompt` | string | Elements to avoid in generation |
| `videoPrompts` | object | Video animation prompts |
| └─ `single` | string | Single keyframe video prompt (1F mode) |
| └─ `start` | string | Start video prompt (2F mode, if applicable) |
| └─ `end` | string | End video prompt (2F mode, always present) |
| `motionParameters` | object | Technical video generation settings |
| └─ `motionStrength` | number | Movement intensity (0.0-1.0) |
| └─ `cameraMovementType` | string | Primary camera motion |
| `visualContinuityNotes` | string | Notes for next shot (continuity handoff) |
| `lastFrameDescription` | string | Description of last frame (for next shot) |

#### Logic by Reference Mode and Continuity

---

### Scenario 1: 1F Mode (Image Reference Mode)

**Behavior**: ALL shots are 1F (single frame)

**Prompt Generation**:
- Generates 1 image prompt per shot
- Generates 1 video prompt (for camera movement/zoom)
- No continuity considerations (all shots standalone)

**Example**:
- Shot 1.1: Generates prompt for single static frame
- Shot 1.2: Generates prompt for single static frame
- No connection between shots

---

### Scenario 2: 2F Mode - No Continuity

**Behavior**: ALL shots are 2F, but no continuity links

**Prompt Generation**:
- Generates 2 image prompts per shot (start + end)
- Generates 1 video prompts (start and end context)
- Start and end prompts maintain visual consistency within shot
- Each shot is independent (no connection to previous)

**Example**:
- Shot 1.1: Start prompt + End prompt (independent)
- Shot 1.2: Start prompt + End prompt (independent)

---

### Scenario 3: 2F Mode - First in Continuity Group

**Behavior**: 2F shot that starts a continuity group

**Prompt Generation**:
- Generates 2 image prompts (start + end)
- End frame designed to transition to next shot
- Includes `visualContinuityNotes` for next shot
- `lastFrameDescription` passed to next shot

**Example**:
- Shot 1.1 (first in group): Start + End (with continuity notes)
- Shot 1.2 (linked): Uses Shot 1.1's end as start

---

### Scenario 4: 2F Mode - Linked Shot (Continuity)

**Behavior**: 2F shot linked to previous shot in continuity group

**Prompt Generation**:
- Generates ONLY 1 image prompt (end frame)
- Start frame inherited from previous shot's end frame
- Receives `previousShotOutput` with continuity notes
- Uses `lastFrameDescription` to match previous shot

**Critical**: 
- **No start frame generation** - image reuse from previous shot
- Start frame = Previous shot's end frame (same image file)
- Only end frame needs new prompt and generation

**Example**:
- Shot 1.1: Start + End
- Shot 1.2 (linked): **Start = Shot 1.1 End** (reuse) + New End

---

### Scenario 5: AI Mode - Mixed Frame Types

**Behavior**: Mix of 1F and 2F shots based on AI decision from Scenes

**Prompt Generation Logic**:

**For 1F shots**:
- Same as Scenario 1 (single frame)

**For 2F shots (unlinked)**:
- Same as Scenario 2 (start + end)

**For 2F shots (first in group)**:
- Same as Scenario 3 (start + end with continuity)

**For 2F shots (linked)**:
- Same as Scenario 4 (end only, start inherited)

**Example mixed sequence**:
- Shot 1.1 (1F): Single prompt
- Shot 1.2 (2F, first): Start + End (with continuity notes)
- Shot 1.3 (2F, linked): Start = Shot 1.2 End (reuse) + New End
- Shot 1.4 (1F): Single prompt (no continuity, previous was 2F but breaks chain)

---

### Prompt Engineering Considerations

**Character Integration**:
- Uses character reference images as visual guides
- Includes character appearance details from Elements
- Tags like `@PrimaryCharacter` resolved to character names and attributes

**Location Integration**:
- Uses location reference images for environment context
- Includes location descriptions from Elements
- Tags like `@Location1` resolved to location details

**Style Consistency**:
- Incorporates art style description throughout
- Applies world description for atmosphere
- Maintains consistent lighting and color palette

**Continuity Awareness**:
- When generating linked shots, uses previous shot's end state
- Ensures character positions, lighting, and setting match
- Smooth transitions between consecutive frames

---

## Phase 1 Step 2: Image Generation

### Purpose
Generate storyboard frame images from AI-generated prompts, respecting continuity links and Reference Mode.

### User Flow

**Triggered automatically** after prompt generation completes

**Process**:
1. Image Generator processes each shot sequentially
2. For each shot, generates 1 or 2 images based on prompts
3. For linked shots, reuses previous shot's end frame as start frame
4. Stores images directly in shot object
5. Timeline displays with all generated images

### AI Model: Storyboard Image Generator (Agent 4.2)

#### Role
Generate storyboard frame images (single or paired keyframes) from detailed prompts.

#### AI Model
Flux, Midjourney, Nano Banana, GPT Image (user-selected per scene)

#### Inputs (per shot)

| Parameter | Type | Description |
|-----------|------|-------------|
| `imagePrompts` | object | Prompts from Prompt Producer |
| `negativePrompt` | string | Elements to avoid |
| `characterReferences` | Map<id, URL> | Character reference images |
| `locationReferences` | Map<id, URL> | Location reference images |
| `artStyleReference` | string \| URL | Art style description or image |
| `previousEndFrame` | URL | Previous shot's end frame (if linked) |
| `aspectRatio` | string | Image dimensions |
| `imageModel` | string | Model selection (Flux, Midjourney, etc.) |
| `frameType` | "1F" \| "2F" | Frame type from Reference Mode |
| `isLinkedToPrevious` | boolean | Continuity flag |

#### Outputs (per shot)

| Field | Type | Description |
|-------|------|-------------|
| `imageUrl` | URL | Generated start frame (or single frame for 1F) |
| `endImageUrl` | URL | Generated end frame (2F shots only, if not linked) |
| `generationMetadata` | object | Generation details |
| └─ `model` | string | Model used |
| └─ `generationTime` | number | Seconds taken |
| └─ `seed` | number | Random seed (for reproducibility) |

#### Generation Behavior by Reference Mode

---

### 1F Mode: Single Frame Generation

**For each shot**:
1. Receives 1 image prompt
2. Generates 1 image
3. Stores in `imageUrl`

**Output**:
- 1 image per shot
- All shots independent

---

### 2F Mode: Dual Frame Generation (No Continuity)

**For unlinked shots**:
1. Receives 2 image prompts (start + end)
2. Generates 2 images
3. Stores start in `imageUrl`, end in `endImageUrl`

**Output**:
- 2 images per shot
- Each shot independent

---

### 2F Mode: Dual Frame Generation (First in Group)

**For first shot in continuity group**:
1. Receives 2 image prompts (start + end)
2. Generates 2 images
3. End frame designed for smooth transition to next shot
4. Stores start in `imageUrl`, end in `endImageUrl`

**Output**:
- 2 images generated
- End frame becomes next shot's start frame

---

### 2F Mode: Single Frame Generation (Linked Shot)

**For linked shots (critical behavior)**:
1. Receives ONLY 1 image prompt (end frame)
2. **DOES NOT generate start frame**
3. Start frame = Previous shot's `endImageUrl` (image reuse)
4. Generates ONLY end frame
5. Stores previous end in `imageUrl` (reference), new end in `endImageUrl`

**Output**:
- 1 new image generated (end frame)
- Start frame reused from previous shot (no generation cost)

**Continuity Mechanism**:
```
Shot A: [Generate Start] [Generate End]
            ↓                 ↓
        imageUrl         endImageUrl
                              ↓
Shot B (linked):         [Start = Shot A's End]  [Generate End]
                              ↓                        ↓
                          imageUrl (reused)       endImageUrl (new)
```

---

### AI Mode: Mixed Generation

**Behavior varies per shot**:

**1F shots**: Generate 1 image (single frame)

**2F shots (unlinked)**: Generate 2 images (start + end)

**2F shots (first in group)**: Generate 2 images (start + end with continuity)

**2F shots (linked)**: Generate 1 image (end only, start reused)

---

### Technical Implementation Notes

**Image Quality Settings**:
- Resolution based on aspect ratio
- Model-specific quality settings
- Seed for reproducibility

**Reference Image Usage**:
- Character references used for character consistency
- Location references used for environment matching
- Art style reference applied to all generations

**Error Handling**:
- Failed generations retry with fallback model
- Partial failures allow continuation
- User notified of any generation failures

---

## Phase 1 Step 3: Voiceover Script Generation

### Purpose
Generate cohesive, per-shot narration script for voiceover synthesis (only if voiceover is enabled in settings).

### User Flow

**Triggered**: Automatically after image generation IF voiceover is enabled

**Process**:
1. VoiceOver Script Writer analyzes full script
2. Generates narration text for each shot
3. Matches narration to shot duration
4. Ensures narrative flow across all shots
5. Script stored per shot for later synthesis

**Can be skipped**: If voiceover toggle is disabled, this step doesn't run

### AI Agent: VoiceOver Script Writer (Agent 4.8)

#### Status
⚠️ **CONDITIONAL** - Only runs if VoiceOver is enabled

#### Role
Write cohesive, per-shot narration script for voiceover synthesis

#### AI Model
GPT-4 / Claude (Creative Writing)

#### Inputs

| Parameter | Type | Description |
|-----------|------|-------------|
| `fullScript` | string | Complete script from Script step |
| `shots` | Shot[] | All shots with descriptions and durations |
| └─ `shotId` | string | Shot identifier |
| └─ `sceneId` | string | Parent scene |
| └─ `sequenceOrder` | number | Shot position |
| └─ `duration` | number | Target duration in seconds |
| └─ `actionDescription` | string | Visual action happening |
| └─ `characters` | string[] | Characters in shot |
| `tone` | string | Narration style (narrative, dramatic, upbeat, etc.) |
| `language` | string | ISO language code |
| `narrationStyle` | string | First-person or third-person (from Script step) |

#### Outputs

| Field | Type | Description |
|-------|------|-------------|
| `voiceoverSegments` | object[] | Per-shot narration text |
| └─ `shotId` | string | Shot identifier |
| └─ `narrationText` | string | Voiceover text for this shot |
| └─ `estimatedDuration` | number | Seconds (based on word count) |
| └─ `paceNote` | string | "slow" / "normal" / "fast" |
| `totalWordCount` | number | Full script word count |
| `totalEstimatedDuration` | number | Seconds (WPM estimation) |
| `coherenceScore` | number | Internal consistency rating |

#### Writing Guidelines

**Narrative Flow**:
- Writes ENTIRE voiceover script in one pass for consistency
- Ensures smooth transitions between shots
- Avoids repetitive phrases across adjacent shots
- Considers connected shots as one continuous narrative beat

**Pacing**:
- Matches narration to visual action described in each shot
- Uses target duration to guide appropriate text length per shot
- Shorter shots = fewer words
- Creates natural pauses at shot transitions

**Style Consistency**:
- Maintains consistent voice, tone, and vocabulary throughout
- Respects narration style (first-person vs third-person)
- Matches character personality (from Script settings)

**Visual Complement**:
- Narration complements visuals, not describes them literally
- Adds context or inner thoughts rather than stating obvious actions
- Enhances emotional beats

**Example Output**:
```json
{
  "voiceoverSegments": [
    {
      "shotId": "shot-1-1",
      "narrationText": "Every morning starts the same way...",
      "estimatedDuration": 2.5,
      "paceNote": "normal"
    },
    {
      "shotId": "shot-1-2",
      "narrationText": "But today felt different.",
      "estimatedDuration": 1.8,
      "paceNote": "slow"
    }
  ]
}
```

---

## Phase 2: Manual Prompt Editing

### Purpose
Allow users to refine shot prompts and regenerate specific images without starting from scratch.

### User Flow

1. User clicks on shot card thumbnail or edit button
2. Shot edit dialog opens with current prompt
3. User modifies image prompt (shot description)
4. User clicks "Regenerate" button
5. ⚠️ **Confirmation dialog appears**: "This will replace your current image. Continue?" [Cancel] [Regenerate]
6. **Prompt Producer** runs again for this shot only (with updated description)
7. **Image Generator** creates new image with new prompt
8. **New image permanently replaces the previous one**

---

## Phase 3: Advanced Image Editing

### Purpose
Modify existing generated images with specific changes without full regeneration, using AI-powered image editing.

### User Flow

**Prerequisites**: Shot must have at least one generated image

**Process**:
1. User selects shot with existing image
2. User chooses editing category from bottom toolbar
3. User enters text instruction for desired change
4. User clicks "Apply Edit" button
5. ⚠️ **Warning**: Edits permanently replace the current image
6. **Image Editor** modifies existing image
7. **Edited image replaces the current image**
8. User can continue editing with additional modifications

### AI Model: Image Editor (Agent 4.3)

#### Role
AI-powered image editing with text-based instructions

#### AI Model
Image Editing Model (e.g., InstructPix2Pix, ControlNet-based)

#### Editing Categories

**1. Clothes**
- Change character clothing
- Examples: "change shirt to blue", "add jacket", "make dress formal"

**2. Expression**
- Modify facial expressions
- Examples: "make character smile", "angry expression", "surprised face"

**3. Figure**
- Adjust body pose/position
- Examples: "character sitting", "arms crossed", "looking left"

**4. Camera**
- Change camera angle/perspective
- Examples: "zoom in closer", "bird's eye view", "rotate 45 degrees"

**5. Lighting**
- Adjust lighting conditions
- Examples: "golden hour lighting", "darker atmosphere", "add spotlight"

**6. Weather**
- Modify weather/atmosphere
- Examples: "add rain", "foggy morning", "clear sunny day"

**7. Effects**
- Add visual effects
- Examples: "add lens flare", "motion blur", "add fire"

---

### Inputs (per edit)

| Parameter | Type | Description |
|-----------|------|-------------|
| `originalImage` | URL | Current shot image |
| `editingInstruction` | string | User's text instruction |
| `editingCategory` | string | Category (clothes, expression, etc.) |
| `frameType` | "start" \| "end" \| "single" | Which frame to edit (2F shots) |
| `referenceImages` | URL[] | Original generation references (optional) |

### Outputs

| Field | Type | Description |
|-------|------|-------------|
| `editedImageUrl` | URL | Modified image |
| `editMetadata` | object | Edit details |
| └─ `instruction` | string | What was changed |
| └─ `category` | string | Editing category used |
| └─ `timestamp` | date | When edit was made |

---

### UI Implementation

**Bottom Control Bar**:
- Category toolbar with icons (centered)
- Categories: Prompt (edit), Clothes, Expression, Figure, Camera, Lighting, Weather, Effects
- Active category highlighted

**Edit Panel** (appears when category selected):
- Text input for instruction
- Apply button
- Preview of current image
- Loading indicator during processing

---

### Technical Notes

**Editing Behavior**:
- Edits are applied to the current shot image
- **Edited image permanently replaces the original** (no undo available)
- Multiple edits can be applied sequentially (each replaces the previous)
- ⚠️ **Caution**: Previous images cannot be recovered after editing

**For 2F Shots**:
- User specifies which frame to edit (start or end)
- Can edit both frames separately
- Edits don't affect continuity links (linked frames unchanged)

**Performance**:
- Faster than full regeneration
- Preserves most of original composition
- More targeted changes

---

## Phase 4: Video Animation

### Purpose
Animate static storyboard images into video clips with motion and transitions.

### User Flow

**Prerequisites**: Shot must have at least one generated image

**Trigger Options**:
1. **Individual**: Click "Animate" button on specific shot
2. **Bulk**: Click "Animate All" button in header

**Process**:
1. User triggers animation
2. **Video Generator** receives image(s) and video prompt
3. Model generates animated video clip
4. **Video URL stored in shot object** (replaces any previous video)
5. Video thumbnail displayed on shot card
6. User can play/preview video

**Note**: Re-animating a shot replaces the previous video file.

**Optional**: Users can skip animation and proceed with static images only

### AI Model: Video Generator (Agent 4.5)

#### Role
Generate animated video clips from static storyboard images (single or paired keyframes)

#### AI Model
Kling AI, Runway Gen-4, Luma Dream Machine, Pika 2.0, Veo 2, Minimax (user-selected per scene)

#### Inputs (per shot)

| Parameter | Type | Description |
|-----------|------|-------------|
| `referenceMode` | "1F" \| "2F" | Frame mode |
| **1F Mode Inputs** | | |
| └─ `storyboardImage` | URL | Single keyframe |
| **2F Mode Inputs** | | |
| └─ `startFrame` | URL | Start keyframe (or inherited) |
| └─ `endFrame` | URL | End keyframe |
| `videoPrompt` | string | Motion description from Prompt Producer |
| `motionParameters` | object | Technical settings |
| └─ `motionStrength` | number | Movement intensity (0.0-1.0) |
| └─ `cameraMovementType` | string | Camera motion type |
| `shotDuration` | number | Target duration from Scenes step (validated against model max) |
| `videoModel` | string | Model selection (per scene, default from Script) |
| `aspectRatio` | string | Video dimensions |

#### Outputs

| Field | Type | Description |
|-------|------|-------------|
| `videoUrl` | URL | Generated animated video |
| `thumbnailUrl` | URL | Video thumbnail |
| `actualDuration` | number | Final video length (seconds) |
| `generationMetadata` | object | Generation details |
| └─ `model` | string | Model used |
| └─ `generationTime` | number | Seconds taken |

**Duration Validation**:
- Shot duration must not exceed video model's maximum capability
- If shot duration > model max, user is prompted to:
  1. Reduce shot duration to fit model
  2. Choose different video model with higher max duration
  3. Split shot into multiple shorter shots

---

### Video Model Options

| Model | Duration Options | Strengths |
|-------|-----------------|-----------|
| Kling AI | 5s, 10s | High quality, smooth motion |
| Runway Gen-4 | 5s, 10s | Creative, artistic style |
| Luma Dream Machine | 5s | Fast generation, consistent |
| Pika 2.0 | 3s | Quick results, stylized |
| Veo 2 | 8s | Long duration, realistic |
| Minimax | 6s | Balanced quality/speed |

**User selects per scene**: Different scenes can use different models


## Scene Settings

### Purpose
Configure image and video generation models and parameters on a per-scene basis for customized output.

### User Flow

**Location**: Left sidebar within each scene card

**Editable Settings**:
1. Image Model selection
2. Video Model selection
3. Video Duration (model-specific options)

**Changes apply to**:
- All shots within that scene
- Future generations and regenerations

### Settings

#### Image Model Selection

**Purpose**: Choose AI model for image generation

**Type**: Dropdown selector

**Options**:
- Flux (default)
- Midjourney
- Nano Banana
- GPT Image

**Impact**:
- Image quality and style characteristics
- Generation speed
- Artistic interpretation
- Prompt handling differences

**Per-scene customization allows**:
- Action scenes with model optimized for motion
- Landscape scenes with model optimized for environments
- Character close-ups with model optimized for faces

---

#### Video Model Selection

**Purpose**: Choose AI model for video animation

**Type**: Dropdown selector

**Options**:
- Kling AI
- Runway Gen-4
- Luma Dream Machine
- Pika 2.0
- Veo 2
- Minimax

**Impact**:
- Animation quality and style
- Motion smoothness
- Available duration options
- Generation time

**Per-scene customization allows**:
- High-action scenes with model optimized for movement
- Subtle scenes with model optimized for camera motion
- Different aesthetic styles per scene

**Default Model**:
- All scenes start with the default video model selected in Script step (Step 1)
- User can change model per scene for customization

**Duration Impact**:
- Changing to a model with lower max duration may require shot duration adjustments
- Example: Switching from Kling (10s) to Pika (3s) will flag shots > 3s
- System will show warnings for shots exceeding new model's capabilities
- User can manually adjust shot durations or switch back to original model

---

## Audio & Voiceover Settings

### Purpose
Configure voice narration for the video, including voice actor selection and voiceover enable/disable.

### User Flow

**Location**: Header controls (top of Storyboard page)

**Settings**:
1. Voice Actor Selection (dropdown with previews)
2. Voiceover Toggle (enable/disable switch)

**Impact**:
- Voiceover toggle determines if Agent 4.8 runs
- Voice actor selection used in Animatic step for synthesis
- Settings apply to entire video (not per-shot)

---
### Voiceover Toggle

**Purpose**: Enable or disable voiceover narration

**Type**: Switch toggle (on/off)

**Behavior**:

**When ENABLED (ON)**:
- VoiceOver Script Writer (Agent 4.8) runs automatically in Storyboard
- Generates narration text for all shots
- Voice synthesis happens in Animatic step
- Final video includes voiceover audio

**When DISABLED (OFF)**:
- VoiceOver Script Writer does NOT run
- No narration text generated
- Final video has no voiceover (background music only)
- Saves processing time and cost

**Default**: Typically ON (from Script step settings)

**Use Cases**:
- Enable: Narrative vlogs, documentaries, explanatory content
- Disable: Music videos, ambient content, visual-only stories

---

## Shot Management

### Purpose
Allow users to manually add, delete, reorder, and manage shots and scenes.

### User Actions

---

### Add Shot

**Purpose**: Create new shot within a scene

**Trigger**: Click "+ Add Shot" button at end of scene's shot list

**Dialog Content**:
- Shot name (auto-generated: "Shot X.Y: New")
- Shot description (required)
- Frame type (inherits from Reference Mode or selectable in AI mode)
- Camera angle (dropdown)
- Camera movement (dropdown)

**Behavior**:
1. User fills in shot details
2. Click "Add Shot"
3. Shot added to scene
4. **No automatic image generation** - shot appears with placeholder
5. User must click "Generate" to create image
6. Alternatively, click "Generate All" to generate all pending shots

**Position**: New shot added at end of scene's shot list

---

### Delete Shot

**Purpose**: Remove unwanted shot from scene

**Trigger**: Click trash icon on shot card

**Validation**:
- ⚠️ **Minimum requirement**: Each scene must have at least 1 shot
- Cannot delete if scene only has 1 shot

**Confirmation Dialog**:
- "Delete this shot?"
- "This will permanently delete the shot and its image."
- Warns if shot is linked in continuity group
- [Cancel] [Delete] buttons

**Behavior on Delete**:
1. Shot removed from scene
2. Shot image and video deleted
3. Continuity links recalculated:
   - If deleted shot was linked to next shot, link is broken
   - If deleted shot was end of continuity chain, chain ends earlier
4. Shot sequence numbers updated

---

### Reorder Shots

**Purpose**: Change shot sequence within a scene

**Trigger**: Drag and drop shot cards

**UI Implementation**:
- Drag handle (grip icon) on shot card
- Horizontal sortable list
- Drop indicators show insert position
- Smooth animation on reorder

**Behavior**:
1. User drags shot card to new position
2. Other shots shift to make space
3. Shot sequence updated
4. Continuity links automatically recalculated:
   - Links may break if order changes
   - User warned if reorder affects continuity

**Use Cases**:
- Fix shot sequence mistakes
- Improve narrative flow
- Adjust pacing

**Limitation**: Can only reorder within same scene (cannot move to different scene)

---

### Add Scene

**Purpose**: Create new scene manually

**Trigger**: Click "+ Add Scene" button (if available)

**Dialog Content**:
- Scene name (default: "Scene X: Custom")
- Scene description
- Image Model selection
- Video Model selection

**Behavior**:
1. User fills in scene details
2. Click "Add Scene"
3. Scene added to end of scene list
4. Scene starts with 0 shots
5. User must add shots to scene

**Position**: New scene added at end of scenes list

---

### Delete Scene

**Purpose**: Remove entire scene and all its shots

**Trigger**: Click trash icon on scene card

**Validation**:
- ⚠️ **Minimum requirement**: Must have at least 1 scene in project
- Cannot delete if only 1 scene exists

**Confirmation Dialog**:
- "Delete scene [Scene Name]?"
- "This will also delete all X shot(s) in this scene."
- "This action cannot be undone."
- [Cancel] [Delete Scene] buttons

**Behavior on Delete**:
1. Scene removed from project
2. All shots in scene deleted
3. All images/videos in those shots deleted
4. Continuity groups recalculated across remaining scenes
5. Scene numbering updated

---

### Scene/Shot Count Validation

**Requirements enforced**:
- Minimum 1 scene per project
- Minimum 1 shot per scene
- Delete buttons disabled when minimums reached
- User cannot proceed to Animatic without meeting requirements

---

## Data Models

### Shot Object (Simplified)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique shot identifier |
| `sceneId` | string | Parent scene ID |
| `shotNumber` | number | Sequential within scene |
| `name` | string | Shot name |
| `description` | string | Shot description (editable) |
| `shotType` | string | Frame type: "1F" or "2F" |
| `cameraShot` | string | Camera angle (Close-up, Wide Shot, etc.) |
| `cameraMovement` | string | Camera movement (Static, Pan, etc.) |
| `isLinkedToPrevious` | boolean | Continuity flag |
| `referenceTags` | string[] | Character/location tags |
| `duration` | number | Shot duration in seconds |
| `videoModel` | string | Video model for this shot |
| `videoModelMaxDuration` | number | Max duration for selected model |
| | | |
| **Single active image (no version history)** | | |
| `imageUrl` | string | Start frame or single frame URL |
| `endImageUrl` | string \| null | End frame URL (2F shots only) |
| `videoUrl` | string \| null | Animated video URL (if animated) |
| `thumbnailUrl` | string | Thumbnail for quick display |
| `imagePrompt` | string | Current image prompt |
| `videoPrompt` | string | Current video prompt |
| | | |
| **Metadata** | | |
| `lastRegeneratedAt` | timestamp \| null | When last regenerated |
| `generationType` | string | "auto" \| "regenerate" \| "edit" |
| `generationMetadata` | object | Generation details |
| └─ `imageModel` | string | Model used for image |
| └─ `videoModel` | string \| null | Model used for video (if animated) |
| └─ `seed` | number | Random seed |
| └─ `generationTime` | number | Seconds taken |

**Example**:
```json
{
  "id": "shot-1-1",
  "sceneId": "scene-1",
  "shotNumber": 1,
  "name": "Morning Wake Up",
  "description": "Character waking up in bed",
  "shotType": "2F",
  "cameraShot": "Medium Close-up",
  "cameraMovement": "Static",
  "isLinkedToPrevious": false,
  "referenceTags": ["@PrimaryCharacter", "@Bedroom"],
  "duration": 5,
  "videoModel": "Kling AI",
  "videoModelMaxDuration": 10,
  
  "imageUrl": "https://cdn.storia.ai/images/shot-1-1-start.png",
  "endImageUrl": "https://cdn.storia.ai/images/shot-1-1-end.png",
  "videoUrl": "https://cdn.storia.ai/videos/shot-1-1.mp4",
  "thumbnailUrl": "https://cdn.storia.ai/thumbs/shot-1-1.jpg",
  "imagePrompt": "Character waking up in bed, medium close-up...",
  "videoPrompt": "Smooth motion as character sits up...",
  
  "lastRegeneratedAt": null,
  "generationType": "auto",
  "generationMetadata": {
    "imageModel": "Flux",
    "videoModel": "Kling AI",
    "seed": 42,
    "generationTime": 12.5
  }
}
```

---

### Scene Object (Updated)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique scene identifier |
| `sceneNumber` | number | Sequential scene number |
| `title` | string | Scene name |
| `description` | string | Scene description |
| `duration` | number | Estimated duration |
| `imageModel` | string | Image model selection |
| `videoModel` | string | Video model selection |
| `videoDuration` | number | Video duration setting |
| `shots` | Shot[] | All shots in scene (for reference) |

---

## Complete Workflow Summary

### Phase 1: Automatic Generation (On Entry)

**Triggered when**: User clicks "Continue" from Scenes step

**Duration**: ~5-30 seconds (depends on shot count)

**Process**:
1. **Prompt Producer** generates prompts for all shots
   - Processes shots sequentially
   - Considers Reference Mode (1F/2F/AI)
   - Respects continuity links from Scenes
   - Outputs image prompts and video prompts per shot
2. **Image Generator** creates images for all shots
   - 1 image for 1F shots
   - 2 images for 2F shots (unless linked)
   - 1 image for linked 2F shots (reuses previous end as start)
   - Stores images in shot object
3. **VoiceOver Script Writer** generates narration (if enabled)
   - Only runs if voiceover toggle is ON
   - Generates text for all shots at once
   - Ensures narrative coherence
   - Stores text per shot
4. **Timeline displays** with all generated images
   - All scenes expanded by default
   - Images visible in shot thumbnails
   - Ready for manual editing or animation

---

### Phase 2: Manual Editing (Optional)

**User can customize**:

**Prompt Editing**:
- Click shot to edit prompt
- Modify description text
- Regenerate image with new prompt
- **New image replaces current image**

**Advanced Editing**:
- Select editing category (clothes, expression, etc.)
- Enter text instruction
- Image Editor modifies existing image
- **Edited image replaces current image**

**Shot Management**:
- Add new shots to scenes
- Delete unwanted shots
- Reorder shots within scenes
- Add or delete entire scenes

**Scene Settings**:
- Change image model per scene
- Change video model per scene
- Adjust video duration settings

**Typical Edits**:
- Fix character appearance issues
- Adjust lighting or atmosphere
- Change camera angles
- Refine specific visual elements
- Try different style variations

---

### Phase 3: Video Animation (Optional)

**User can animate**:

**Individual Animation**:
1. Click "Animate" button on specific shot
2. Video Generator creates animated clip
3. **Video stored in shot object**
4. Video thumbnail displayed on card
5. Can play/preview inline

**Bulk Animation**:
1. Click "Animate All" button in header
2. Video Generator processes all shots
3. Progress indicator shows status
4. Videos stored as they complete
5. Can continue editing while animating

**Animation Behavior**:
- 1F shots: Single keyframe animation
- 2F shots (unlinked): Start-to-end interpolation
- 2F shots (linked): Previous end → Current end (seamless)

**Optional**: Users can skip animation entirely and proceed with static images

---

### Phase 4: Validation & Continue

**Requirements to proceed**:
- ✅ At least 1 scene exists
- ✅ Each scene has at least 1 shot
- ✅ Each shot has at least 1 generated image
- ⚠️ Videos are optional (not required)
- ⚠️ Voiceover script optional (depends on toggle)

**Click "Continue"** → Proceed to **Step 5: Animatic Preview**

---

## AI Components Summary

### AI Agents & Models (5)

#### 1. Unified Prompt Producer (Agent 4.0)
**Type**: AI Agent (GPT-4 / Claude)  
**Purpose**: Context-aware prompt engineering for image and video generation  
**Triggers**: Automatically on entry, on regeneration, on new shot  
**Input**: Shot description + references + world settings + continuity info  
**Output**: Image prompts + video prompts + continuity notes  

#### 2. Storyboard Image Generator (Agent 4.2)
**Type**: AI Model (Flux, Midjourney, Nano Banana, GPT Image)  
**Purpose**: Generate storyboard frame images from prompts  
**Triggers**: Automatically after prompt generation, on regeneration  
**Input**: Image prompts + references + settings  
**Output**: Generated images (1 or 2 per shot)  

#### 3. Image Editor (Agent 4.3)
**Type**: AI Model (Image Editing Model)  
**Purpose**: Modify existing images with text instructions  
**Triggers**: User-initiated (advanced editing)  
**Input**: Original image + editing instruction + category  
**Output**: Edited image (replaces current)  

#### 4. Video Generator (Agent 4.5)
**Type**: AI Model (Kling AI, Runway, Luma, Pika, Veo 2, Minimax)  
**Purpose**: Animate static images into video clips  
**Triggers**: User-initiated (individual or bulk animate)  
**Input**: Image(s) + video prompt + motion parameters  
**Output**: Animated video  

#### 5. VoiceOver Script Writer (Agent 4.8)
**Type**: AI Agent (GPT-4 / Claude)  
**Purpose**: Generate cohesive narration script for all shots  
**Triggers**: Automatically on entry IF voiceover enabled  
**Input**: Full script + shots + durations + tone  
**Output**: Narration text per shot  
**Status**: ⚠️ Conditional (only if voiceover toggle ON)

---


### Sequential Processing (Phase 1)

1. **Prompt Producer** runs for Shot 1 → outputs prompts
2. **Image Generator** generates images for Shot 1
3. **Prompt Producer** runs for Shot 2 (using Shot 1's continuity notes if linked) → outputs prompts
4. **Image Generator** generates images for Shot 2
5. ...continues for all shots...
6. **VoiceOver Writer** runs once for all shots (if enabled) → outputs narration script

**Total Time**: ~5-30 seconds depending on:
- Number of shots
- Image model speed
- Whether voiceover is enabled
- Server load

---

### On-Demand Processing (Phases 2-3)

**User-triggered events**:
- Edit prompt → Prompt Producer (for 1 shot) → Image Generator (for 1 shot)
- Advanced edit → Image Editor (for 1 shot)
- Animate shot → Video Generator (for 1 shot)
- Animate all → Video Generator (for all shots sequentially)

**Time per action**:
- Image generation: ~5-15 seconds
- Image editing: ~3-8 seconds
- Video animation: ~30-90 seconds (varies by model and duration)

