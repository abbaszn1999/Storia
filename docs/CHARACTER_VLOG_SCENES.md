# Character Vlog Mode - Scenes Step Documentation

## Overview

The **Scenes** step is where the script is automatically transformed into a structured visual timeline. This step comes after Elements creation and involves:

1. **AI Scene Generation** - Script automatically divided into logical scenes
2. **AI Shot Creation** - Detailed shots generated for each scene with camera angles (frame types determined by Reference Mode)
3. **AI Continuity Analysis** (Optional) - Intelligent linking of consecutive shots for seamless transitions (available in 2F and AI modes only)
4. **Manual Editing** (Optional) - User customization of scenes, shots, and continuity

The behavior of this step is heavily influenced by the **Reference Mode** selected at project creation (1F, 2F, or AI), which determines frame types and continuity analysis availability.

---

## Table of Contents

1. [Workflow Context](#workflow-context)
2. [Reference Mode Context](#reference-mode-context)
3. [Step 1: AI Scene Generation](#step-1-ai-scene-generation)
4. [Step 2: AI Shot Generation](#step-2-ai-shot-generation)
5. [Step 2.5: Timing Calculation](#step-25-timing-calculation)
6. [Step 3: AI Continuity Analysis](#step-3-ai-continuity-analysis)
7. [Step 4: Manual Scene Editing](#step-4-manual-scene-editing)
8. [Step 5: Manual Shot Editing](#step-5-manual-shot-editing)
9. [Data Models](#data-models)
10. [UI/UX Design](#uiux-design)
11. [Complete Workflow Summary](#complete-workflow-summary)
12. [AI Components Summary](#ai-components-summary)
13. [Navigation Flow](#navigation-flow)

---

## Workflow Context

**Step 3 of 6**: Scenes

**Inputs from Script & Elements Steps**:
- `script` - Full script text
- `targetDuration` - Target video duration from Script step
- `videoModel` - Default video model selected in Script step
- `videoModelMaxDuration` - Maximum shot duration for selected model
- `characters[]` - Primary + secondary characters
- `locations[]` - All locations
- `theme` - Visual environment theme
- `worldSettings` - Global visual settings (image model, style, aspect ratio, world description)

**Outputs to Storyboard Step**:
- `scenes[]` - All scenes with shots
- `shots[]` - All shots with continuity links (if continuity analysis was run)
- `continuityGroups` - Linked shot groups for seamless transitions (if applicable)

---

## Reference Mode Context

### What is Reference Mode?

**Reference Mode** is a project-wide setting selected during **project creation** (before the Script step) that determines how frame generation works throughout the entire video production workflow.

This mode fundamentally affects:
- How many frames are generated per shot (1 or 2)
- Whether continuity analysis is available
- User's ability to customize frame types

### The Three Modes

#### 1F Mode: Image Reference Mode

**Concept**: Generate video from a single reference image per shot

**Frame Behavior**:
- ✅ **ALL shots are 1F** (single image per shot)
- ❌ Frame type is **locked** - user cannot change to 2F
- 📷 Each shot generates 1 image only

**Continuity**:
- ❌ Continuity analysis **NOT available**
- No shot-to-shot linking possible (requires 2F for end frame)

**Use Case**: Static, photo-based storytelling, slideshows, simple presentations

---

#### 2F Mode: Start/End Frame Mode

**Concept**: Generate video with start and end frames for smooth motion

**Frame Behavior**:
- ✅ **ALL shots are 2F** (start + end frames per shot)
- ❌ Frame type is **locked** - user cannot change to 1F
- 📷📷 Each shot generates 2 images (start state and end state)

**Continuity**:
- ✅ Continuity analysis **AVAILABLE** via "Analyze Continuity" button
- Can link all consecutive shots (all are eligible)

**Use Case**: Smooth character animations, action sequences, fluid motion

---

#### AI Mode: AI-Determined Mixed Mode

**Concept**: AI intelligently decides frame type per shot based on content

**Frame Behavior**:
- 🤖 **AI decides per shot**: Some shots are 1F, others are 2F
- ✅ Frame type is **customizable** - user can toggle any shot between 1F ↔ 2F
- 📷/📷📷 Each shot generates 1 or 2 images based on its type

**Continuity**:
- ✅ Continuity analysis **AVAILABLE** via "Analyze Continuity" button
- Only links shots where previous shot is 2F

**Use Case**: Optimal balance of static and motion shots, dynamic storytelling, AI-optimized pacing

---

### How Reference Mode Affects the Scenes Step

| Feature | 1F Mode | 2F Mode | AI Mode |
|---------|---------|---------|---------|
| **Frame Type Assignment** | All 1F (locked) | All 2F (locked) | AI decides (editable) |
| **Frame Type Toggle** | Hidden | Hidden | Visible |
| **Continuity Button** | Hidden | Visible | Visible |
| **Continuity Analysis** | Not available | Available | Available (2F shots only) |
| **Manual Continuity Toggle** | Not available | Available | Available (when prev is 2F) |

**Selected at**: Project creation (before Step 1: Script)  
**Stored in**: Project settings (passed through all steps)  
**Cannot be changed**: Once project is created, mode is locked

---

## Step 1: AI Scene Generation

### Purpose
Automatically divide the script into logical scenes based on narrative structure, character presence, and location changes.

### User Flow

1. User clicks "Continue" from Elements step
2. **Scene Generator Agent** immediately analyzes the script
3. AI returns a structured breakdown of scenes
4. Scenes displayed in timeline UI (all expanded by default)
5. User can proceed to manual editing or continue to next step

### AI Agent: Scene Generator

#### Inputs

| Parameter | Type | Description |
|-----------|------|-------------|
| `script` | string | Full script text from Step 1 |
| `theme` | string | Visual environment theme (e.g., "urban", "fantasy") |
| `duration` | number | Target video duration in seconds from Script step |
| `worldDescription` | string | World context and atmosphere from Elements settings |
| `numberOfScenes` | 'auto' \| number | Number of scenes (from Script step): 'auto' or specific number (1-20) |
| `shotsPerScene` | 'auto' \| number | Shots per scene (from Script step): 'auto' or specific number (1-10) |
| `primaryCharacter` | Character | Main character object with name and personality |
| `secondaryCharacters` | Character[] | Array of up to 4 secondary characters |
| `locations` | Location[] | All available locations from Elements step |

#### Outputs

Array of Scene objects, each containing:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Descriptive scene title (e.g., "Scene 1: The Morning Rush") |
| `description` | string | Brief scene summary (2-3 sentences) |
| `duration` | number | Estimated duration in seconds |

#### Logic

**Scene Breakdown Strategy**:
- Analyzes script narrative structure
- Identifies natural scene breaks (location changes, time jumps, character shifts)
- Names scenes descriptively based on content
- Estimates duration based on script length, dialogue density, and target duration
- Considers character presence and location context
- Incorporates world description atmosphere into scene context
- **If `numberOfScenes` is a number**: Creates exactly that many scenes (adjusts breakdown to match)
- **If `numberOfScenes` is 'auto'**: Generates scenes based on natural narrative breaks (no fixed range)
- **If `shotsPerScene` is provided**: Considers shot count when planning scene complexity (used by Shot Generator later)

---

## Step 2: AI Shot Generation

### Purpose
Create detailed shots for each scene with camera angles and reference tags. Frame type assignment depends on the Reference Mode.

### User Flow

1. After scenes are generated, **Shot Generator Agent** processes each scene sequentially
2. For each scene, AI creates 2-5 shots based on scene complexity
3. Each shot includes frame type (based on Reference Mode), camera angle, and character/location tags
4. Shots displayed within collapsible scene cards in the timeline

### AI Agent: Shot Generator

#### Inputs (per scene)

| Parameter | Type | Description |
|-----------|------|-------------|
| `sceneName` | string | Scene name from Scene Generator (e.g., "Scene 1: The Morning Rush") |
| `sceneDescription` | string | Scene description from Scene Generator |
| `sceneDuration` | number | Scene duration in seconds from Scene Generator (used to divide duration among shots) |
| `script` | string | Full script text from Script Generator (Agent 1.1 output) |
| `characters` | Character[] | Available characters (primary + secondary) |
| `locations` | Location[] | Available locations |
| `theme` | string | Visual environment theme |
| `worldDescription` | string | World context and atmosphere from Elements settings |
| `referenceMode` | string | Reference Mode selected at project creation (before Script step): "1F" (all shots single frame), "2F" (all shots start/end frames), or "AI" (AI decides per shot). **CRITICAL** - determines frame type assignment for all shots. |
| `videoModel` | string | Default video model from Script step |
| `videoModelDurations` | number[] | Array of available durations for the selected model (e.g., [2, 4, 5, 6, 8, 10, 12]) |
| `targetDuration` | number | Target video duration in seconds from Script step (context for duration estimation) |
| `shotsPerScene` | 'auto' \| number | Shots per scene (from Script step): 'auto' or specific number (1-10) |

#### Outputs

Array of Shot objects for each scene, each containing:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Shot identifier (e.g., "Shot 1.1: Opening") |
| `description` | string | Detailed shot description (action, composition, focus) |
| `shotType` | string | Frame type: "1F" (single image) or "2F" (start/end frames) |
| `cameraShot` | string | Camera angle from 10 preset options |
| `referenceTags` | string[] | Tags like "@PrimaryCharacter", "@Location1" |
| `duration` | number | Initial duration estimate in seconds (2-15s, will be adjusted by Timing Calculator) |

#### Logic

### Frame Type Selection (Mode-Based)

**CRITICAL**: Frame type assignment **depends entirely on the Reference Mode** selected at project creation (before Script step). This is a project-wide setting that determines how all shots are generated throughout the entire video.

---

#### In 1F Mode (Image Reference Mode)

**Behavior**: ALL shots assigned **1F** (single frame)

**AI Decision**: None - frame type is predetermined by mode

**Characteristics**:
- Every shot generates 1 image
- Static, photo-based visual style
- No motion between frames
- Suitable for slideshows, static storytelling

**Example**: All shots like "Character at desk", "View of city", "Close-up of face" → All 1F

---

#### In 2F Mode (Start/End Frame Mode)

**Behavior**: ALL shots assigned **2F** (start/end frames)

**AI Decision**: None - frame type is predetermined by mode

**Characteristics**:
- Every shot generates 2 images (start state + end state)
- Smooth motion/transitions between frames
- Consistent animation style throughout
- Suitable for fluid character animations, action sequences

**Example**: All shots like "Character walks to door", "Camera zooms in", "Character sits down" → All 2F

---

#### In AI Mode (AI-Determined Mixed Mode)

**Behavior**: AI **intelligently decides per shot** whether to use 1F or 2F

**AI Decision Logic**:

**Assigns 1F (Single Frame)** when:
- Shot is a **static moment**: Character paused, looking at something, standing still
- Shot is an **establishing shot**: Wide view of location without character movement
- Shot is a **pause**: Emotional beat, contemplation, frozen moment
- Shot is **B-roll**: Supporting imagery without movement
- **Requirement**: Needs 1 generated image

**Assigns 2F (Start/End Frames)** when:
- Shot has **action**: Character walking, running, gesturing, moving
- Shot has **camera movement**: Pan, zoom, tracking, entering/exiting frame
- Shot has **transitions**: Moving from one position/pose to another
- Shot has **emotional changes**: Facial expression shifts, reactions, realization
- **Requirement**: Needs 2 generated images (start and end state)

**Example Mixed Output**:
- Shot 1.1: "Character wakes up and sits up" → **2F** (movement)
- Shot 1.2: "Wide shot of bedroom" → **1F** (static establishing)
- Shot 1.3: "Character walks to window" → **2F** (walking action)
- Shot 1.4: "Close-up of character's face" → **1F** (static emotional beat)

**Optimization**: AI balances 1F and 2F shots for optimal pacing and image generation efficiency

### Camera Angle Selection

**10 Preset Options**:
1. **Extreme Close-up** - Face detail, emotions
2. **Close-up** - Head and shoulders, intimacy
3. **Medium Close-up** - Chest up, conversation
4. **Medium Shot** - Waist up, standard framing
5. **Medium Wide Shot** - Knees up, body language
6. **Wide Shot** - Full body, environment context
7. **Extreme Wide Shot** - Tiny subject, vast environment
8. **Over-the-Shoulder** - Conversation perspective
9. **Point of View** - First-person perspective
10. **Establishing Shot** - Location overview

**Selection Criteria**:
- Based on shot purpose (establishing, action, emotion)
- Based on narrative focus (character vs environment)
- Varies camera angles across shots for visual interest
- Matches angle to frame type (e.g., Wide Shot often 1F, Close-up often 2F for expressions)

### Reference Tagging

**Tag Format**:
- `@PrimaryCharacter` - Main character present
- `@SecondaryCharacter1`, `@SecondaryCharacter2`, etc. - Secondary characters present
- `@Location1`, `@Location2`, etc. - Location reference

**Tagging Logic**:
- Tags shots with all characters visible/present
- Tags shots with the location setting
- Used later in Storyboard step to map shots to generated images

### Duration Estimation

**Initial Duration Assignment**:
- Shot Generator provides **initial duration estimates** based on action complexity
- Complex actions (walking, gesturing, transitions) → longer durations
- Simple moments (static poses, establishing shots) → shorter durations
- Dialogue-heavy shots → medium durations

**Model-Specific Constraints**:
- Durations must be selected from `videoModelDurations` array (available options for the model)
- Durations must not exceed the maximum value in `videoModelDurations` array
- Example: Kling AI (durations: [5, 10]) → shots can be 5s or 10s
- Example: Seedance 1.0 Pro (durations: [2, 4, 5, 6, 8, 10, 12]) → shots can be any of these values
- Shot Generator considers model limits and available durations when assigning initial estimates

**Scene Duration Distribution**:
- Total shot durations for the scene should approximate `sceneDuration` (±10% acceptable)
- Divide `sceneDuration` among shots proportionally based on shot complexity and importance
- Use `sceneDuration` as the primary constraint when assigning shot durations
- Use `targetDuration` as secondary context for overall video pacing
- Example: If sceneDuration is 20s and creating 4 shots, distribute approximately 5s per shot (adjust based on complexity)

**Shot Count Control**:
- **If `shotsPerScene` is a number**: Creates exactly that many shots for the scene
- **If `shotsPerScene` is 'auto'**: Determines optimal shot count based on scene complexity and content
- Shot naming uses `sceneName` to maintain hierarchy (e.g., "Shot 1.1" for Scene 1)

**World Description Integration**:
- Incorporates `worldDescription` into shot descriptions to maintain atmosphere consistency
- Ensures visual style aligns with world context across all shots

**Note**: These are **initial estimates only** - durations are validated and adjusted by the Timing Calculator (Step 2.5) to match the target video duration from Script step.

---

## Step 2.5: Timing Calculation

### Purpose
Calculate and validate shot timings to ensure total duration matches the target video duration specified by the user in Step 1 (Script).

### User Flow

**Triggered automatically** after Shot Generator completes

**Process**:
1. Timing Calculator analyzes all shots with initial durations
2. Sums total initial duration across all shots
3. If total ≠ target duration, redistributes time proportionally
4. Enforces minimum (2s) and maximum (15s) constraints per shot
5. Flags warnings for shots adjusted significantly
6. Updated durations saved to shot objects
7. User proceeds to next step

### Timing Calculator (Agent 3.3)

#### Role
Non-AI algorithmic processor that validates and adjusts shot durations

#### Type
Algorithmic (Non-AI)

#### Inputs

| Parameter | Type | Description |
|-----------|------|-------------|
| `shots[]` | Shot[] | All shots with initial duration estimates from Agent 3.2 |
| `targetDuration` | number | Target video duration in seconds (from Script step) |
| `videoModelMaxDuration` | number | Maximum shot duration for selected video model |

#### Outputs

| Field | Type | Description |
|-------|------|-------------|
| `adjustedShots[]` | Shot[] | Shots with adjusted durations |
| └─ `duration` | number | Final duration in seconds (2-15s) |
| └─ `initialDuration` | number | Original AI estimate (for reference) |
| `totalCalculatedDuration` | number | Sum of all adjusted shot durations |
| `timingWarnings` | string[] | Warnings for problematic shots |

#### Algorithm

**Step-by-Step Process**:

1. **Sum Initial Durations**
   - Calculate total: `sum(shot.duration for all shots)`
   - Example: 10 shots × 5s each = 50s total

2. **Calculate Adjustment Factor**
   - If `totalInitial ≠ targetDuration`, compute factor
   - Factor = `targetDuration / totalInitial`
   - Example: Target 60s / Initial 50s = 1.2x factor

3. **Redistribute Proportionally**
   - Multiply each shot's duration by factor
   - `adjusted = shot.duration × factor`
   - Example: 5s shot × 1.2 = 6s adjusted

4. **Enforce Constraints**
   - Apply min (2s) and max (model-specific) boundaries
   - `final = max(2, min(videoModelMaxDuration, adjusted))`
   - Example (Kling AI, max 10s): If adjusted = 12s → clamped to 10s
   - Example (Pika 2.0, max 3s): If adjusted = 4s → clamped to 3s

5. **Flag Warnings**
   - Shots adjusted by >50% from initial
   - Shots at min (2s) or max (15s) boundaries
   - Total duration mismatch >5% from target

**Algorithm Pseudocode**:
```javascript
function calculateTimings(shots, targetDuration, videoModelMaxDuration) {
  // 1. Sum initial durations
  const totalInitial = shots.reduce((sum, shot) => sum + shot.duration, 0);
  
  // 2. Calculate adjustment factor
  const factor = targetDuration / totalInitial;
  
  // 3. Adjust each shot proportionally
  const adjusted = shots.map(shot => ({
    ...shot,
    initialDuration: shot.duration,
    duration: Math.min(videoModelMaxDuration, Math.max(2, shot.duration * factor))
  }));
  
  // 4. Flag warnings
  const warnings = adjusted.filter(shot => 
    Math.abs(shot.duration - shot.initialDuration) / shot.initialDuration > 0.5 ||
    shot.duration <= 2 || 
    shot.duration >= videoModelMaxDuration
  );
  
  return { adjustedShots: adjusted, warnings };
}
```

#### Duration Constraints

| Constraint | Value | Reason |
|------------|-------|--------|
| **Minimum** | 2 seconds | Visual comprehension - viewer needs time to process |
| **Maximum** | **Model-specific** | Constrained by selected video model's capabilities |
| | • Kling AI: 10s | High quality long-form |
| | • Runway Gen-4: 10s | Creative long-form |
| | • Luma: 5s | Fast generation medium length |
| | • Pika 2.0: 3s | Quick short clips |
| | • Veo 2: 8s | Realistic medium-long |
| | • Minimax: 6s | Balanced medium length |
| **Recommended** | 2 to (model max - 1s) | Optimal range for most shot types |

#### Warning Conditions

**Warnings are flagged when**:
- Shot duration adjusted by >50% from initial estimate
- Shot duration at minimum boundary (2s)
- Shot duration at maximum boundary (15s)
- Total calculated duration differs from target by >5%

**User Experience**:
- Warnings displayed as toast notifications or inline alerts
- User can review warnings and manually adjust problematic shots
- User can proceed despite warnings (not blocking)

#### Implementation Notes

**Timing Sequence**:
- Runs **after** Shot Generator (Agent 3.2)
- Runs **before** Continuity Analyzer (Agent 3.3, optional)
- Runs **before** voiceover script generation (Agent 4.8 in Storyboard)

**Voiceover Interaction**:
- Initial timing based on **visual action complexity only**
- Voiceover Script Writer (Agent 4.8) may produce narration longer than shot duration
- If mismatch occurs in Storyboard step, user can:
  - Extend shot duration to fit narration
  - Edit narration text to be shorter
  - Adjust speaking pace

**Manual Overrides**:
- User can manually edit shot durations in manual editing phase (Step 5)
- Manual changes override Timing Calculator adjustments
- Total duration may drift from target if user makes many manual adjustments

**Model Change Impact**:
- If user changes video model in Storyboard step (per scene/shot)
- Shot durations may need re-validation
- Shots exceeding new model's max duration will be flagged
- User can manually adjust or re-run timing calculation

---

## Step 3: AI Continuity Analysis (Optional)

### Purpose
Optionally analyze shots and create continuity links for seamless visual transitions. **This step is manual and optional** - user must click a button to trigger analysis.

### Availability by Reference Mode

| Mode | Continuity Button | Behavior |
|------|-------------------|----------|
| **1F Mode** | ❌ Hidden | Not available - all shots are 1F (no end frames to link) |
| **2F Mode** | ✅ Visible | Analyzes all shots (all are 2F and eligible) |
| **AI Mode** | ✅ Visible | Analyzes only 2F shots (skips 1F shots) |

### User Flow

1. After shots are generated, user sees **"🔗 Analyze Continuity" button** in header (if in 2F or AI mode)
2. User **optionally clicks** the button to run continuity analysis
3. **Continuity Analyzer Agent** processes eligible shots (2F shots only)
4. AI determines which consecutive shots should link
5. Continuity indicators displayed visually between linked shots
6. "Continuity Locked" badge appears in header if any links created
7. User can **skip this step entirely** if they don't want continuity linking

### AI Agent: Continuity Analyzer

#### Trigger

**Manual**: User clicks "🔗 Analyze Continuity" button in header

**Availability**:
- 1F Mode: Button hidden (not available)
- 2F Mode: Button visible
- AI Mode: Button visible

#### Inputs

| Parameter | Type | Description |
|-----------|------|-------------|
| `scenes[]` | Scene[] | All scenes. Each scene object includes: `id`, `name`, `description`, `duration`, and `shots[]` array |
| `shots[]` | Shot[] | All shots from all scenes. Each shot must include: `id`, `name`, `description`, **`shotType`** ("1F" or "2F" from Shot Generator output), `cameraShot`, `referenceTags`, and `sceneId` to identify which scene it belongs to |
| `characters[]` | Character[] | Character context for continuity decisions |
| `locations[]` | Location[] | Location context for continuity decisions |
| `referenceMode` | string | "1F", "2F", or "AI" - determines eligible shots |

**Critical**: 
- Each shot in `shots[]` must include the **`shotType`** field from Shot Generator output. This is essential for AI mode to determine which shots are 1F vs 2F for eligibility and linking decisions.
- Each shot must include `sceneId` to identify which scene it belongs to.

**Note**: This agent receives **all scenes at once** in a single API call when the user clicks "Analyze Continuity". However, continuity is analyzed **per scene** - shots only link to other shots within the same scene. When analyzing Scene 1, only use Scene 1's shots (not Scene 2's shots).

#### Outputs

For each scene, returns links grouped by scene:

| Field | Type | Description |
|-------|------|-------------|
| `sceneLinks[]` | array | Array of continuity links grouped by scene |
| └─ `sceneId` | string | Scene ID from input |
| └─ `links[]` | array | Array of linking decisions for eligible shots in this scene |
|   └─ `shotId` | string | Shot ID from input |
|   └─ `isLinkedToPrevious` | boolean | Whether this shot links to the previous shot in the same scene |

**Output Rules**:
- Links are grouped by scene (continuity is within scenes, not across scenes)
- First shot in each scene is **never included in output** (it cannot link to a previous shot since there isn't one)
- **However**: The first shot CAN be the first shot in a continuity group if it's 2F (meaning the second shot can link to it)
- In 2F mode, all shots except first in each scene are eligible (all are 2F, but first shot can start continuity groups)
- In AI mode, only 2F shots are analyzed, except 1F shots can be linked if they're the second shot in a continuity group (first shot must be 2F). Other 1F shots automatically set to `isLinkedToPrevious: false`.

#### Continuity Linking Logic

### Eligibility Check (Pre-Analysis)

**Before analyzing**, the agent filters shots:

**In 2F Mode**:
- ✅ ALL shots are eligible (all are 2F)
- Analyzes all consecutive shot pairs

**In AI Mode**:
- ✅ Only **2F shots** where previous shot is also **2F** are eligible for linking
- ✅ **Exception**: A 1F shot can be linked if it's the second shot in a continuity group (first shot must be 2F)
- ❌ Skips first shot in each scene (cannot link to nothing)

**In 1F Mode**:
- ❌ Continuity analysis not available (button hidden)

---

### Rule 0: Continuity Group First Shot Requirement

**CRITICAL CONSTRAINT - MUST BE ENFORCED**:
- **The FIRST shot in any continuity group MUST be 2F (start/end frames)**
- **Reasoning**: Only 2F shots have an "end frame" that can serve as the "start frame" for the next shot
- **Implication**: A 1F shot can NEVER be the first shot in a continuity group

**Chain Continuation Rules**:
- If first shot in continuity group is 2F → second shot can be 1F or 2F
  - If second shot is 1F: Chain ends (no third shot can link)
  - If second shot is 2F: Chain can continue to third shot (which can be 1F or 2F)
- If first shot in continuity group is 1F → Cannot start a continuity group

**Important**: The first shot in a scene CAN be the first shot in a continuity group (if it's 2F).

**Examples**:
- Scene 1, Shot 1 (2F) → Shot 2 (1F) ✅ CAN link (first shot in scene is 2F, starts continuity group, second can be 1F, chain ends)
- Scene 1, Shot 1 (2F) → Shot 2 (2F) → Shot 3 (1F) ✅ CAN link (first shot in scene is 2F, starts continuity group, chain continues, third can be 1F, chain ends)
- Scene 1, Shot 1 (1F) → Shot 2 (2F) ❌ CANNOT link (first shot in scene is 1F, cannot start continuity group)

---

### Rule 1: Frame Type Requirement

**Critical Constraint**:
- A shot can **ONLY** link to a previous shot if the previous shot is **2F (start/end frames)**
- **Reasoning**: The "end frame" of the previous shot becomes the "start frame" of the current shot
- **Implication**: A 1F shot can NEVER have a shot linked to it (unless it's the second shot in a group where first is 2F)

**Examples**:
- Shot A (2F) → Shot B (2F) ✅ CAN link (both eligible, chain continues)
- Shot A (2F) → Shot B (1F) ✅ CAN link (first is 2F, second can be 1F, chain ends)
- Shot A (1F) → Shot B (any) ❌ CANNOT link (A has no end frame, violates Rule 0)

---

### Rule 2: Continuity Conditions

For eligible shot pairs, links are created when **ALL** of these are true:

1. **Previous shot is 2F** (mandatory - already filtered in eligibility check)
2. **Same setting/location**: Both shots in the same physical space
3. **Same character(s)**: Both shots feature the same character(s)
4. **Narrative flow continues**: No time jump or scene break
5. **Frame type compatibility**:
   - **In 2F Mode**: Current shot must be 2F (all shots are 2F)
   - **In AI Mode**: 
     - Current shot can be 1F **ONLY if** it's the second shot in a continuity group (chain ends)
     - Otherwise, current shot must be 2F to continue the chain

**Examples of Link Decisions**:

**✅ LINK** (2F → 2F):
- Shot 1.1: Character walking (2F) + Shot 1.2: Character arriving (2F)
- Same location, same character, continuous action, chain continues

**✅ LINK** (2F → 1F, chain ends):
- Shot 1.1: Character walking (2F) + Shot 1.2: Character paused, looking (1F)
- Same location, same character, continuous action, but second is 1F so chain ends

**❌ NO LINK**:
- Shot 1.1: Character in bedroom (1F) + Shot 1.2: Character in kitchen (2F)
- Previous shot is 1F (fails Rule 0 - first shot in group must be 2F)

**❌ NO LINK**:
- Shot 1.1: Character indoors (2F) + Shot 1.2: Character outdoors (2F)
- Different locations (fails Rule 2, condition 2)


## Step 4: Manual Scene Editing

### Purpose
Allow users to customize AI-generated scenes after initial generation.

### User Actions

#### Edit Scene

**Trigger**: Click scene name or pencil icon on scene card

**Editable Fields**:
- **Scene Name**: Text input, up to 100 characters
- **Scene Description**: Textarea, up to 500 characters

**Behavior**:
- Opens modal dialog with scene form
- Changes saved in real-time on submit
- Scene card updates immediately

**Use Cases**:
- Rename scene for clarity
- Expand or refine scene description
- Adjust scene focus

---

#### Add Scene

**Trigger**: Click "+ Add Scene" button in header

**Required Fields**:
- **Scene Name**: Default "Scene X: Custom" (X = next scene number)
- **Scene Description**: Empty by default

**Behavior**:
- Opens modal dialog with empty scene form
- New scene added to end of timeline
- Scene starts with no shots (user must add shots manually)
- Timeline auto-scrolls to new scene

**Use Cases**:
- Add additional scenes not captured by AI
- Create custom scene for specific content
- Extend narrative beyond AI generation

---

#### Delete Scene

**Trigger**: Click trash icon on scene card

**Validation**:
- ⚠️ **Minimum requirement**: Must have at least 1 scene in project
- Cannot delete if only one scene exists

**Behavior**:
- Shows confirmation dialog: "This will permanently delete this scene and all its shots. This action cannot be undone."
- On confirm: Scene and all its shots removed
- Continuity links automatically recalculated

**Use Cases**:
- Remove unnecessary scenes
- Simplify narrative structure
- Remove AI-generated scenes that don't fit

---

## Step 5: Manual Shot Editing

### Purpose
Allow users to customize individual shots with full control over all properties.

### User Actions

#### Edit Shot Properties

**Trigger**: Click pencil icon on shot card

**Editable Fields**:
1. **Shot Name**: Text input, up to 100 characters
2. **Shot Description**: Textarea, up to 200 characters
3. **Frame Type**: Toggle between 1F ↔ 2F (only visible in AI Mode)
4. **Camera Angle**: Dropdown with 10 preset options

**Behavior**:
- Opens modal dialog with shot form
- All fields editable simultaneously
- Changes saved on submit
- Shot card updates immediately
- Continuity links automatically recalculated if frame type changed

---

#### Toggle Frame Type

**Availability by Reference Mode**:

| Mode | Toggle Visibility | Behavior |
|------|------------------|----------|
| **1F Mode** | ❌ Hidden/Disabled | All shots locked to 1F - cannot change |
| **2F Mode** | ❌ Hidden/Disabled | All shots locked to 2F - cannot change |
| **AI Mode** | ✅ Visible/Enabled | User can toggle any shot between 1F ↔ 2F |

---

**In AI Mode Only**:

**Trigger**: Click frame type toggle button (1F ⟷ 2F) on shot card

**Behavior**:
- Instantly switches between 1F and 2F
- No confirmation required
- **Impact**: Affects continuity possibilities:
  - Changing from 2F → 1F removes any links TO the next shot
  - Changing from 1F → 2F enables potential link TO the next shot
- If continuity has been analyzed, may need to re-run "Analyze Continuity"

**Visual Feedback**:
- Badge color changes (Pink for 1F, Purple for 2F)
- Badge text changes ("Single Image" vs "Start/End Frame")
- Toggle button updates active state

---

**In 1F or 2F Modes**:
- Frame type toggle is **hidden** or **disabled**
- Frame type badge still displays (shows 1F or 2F based on mode)
- User cannot change frame type (locked by Reference Mode)

---

#### Change Camera Angle

**Trigger**: Click camera angle badge or edit button

**Options** (dropdown selector):
1. Extreme Close-up
2. Close-up
3. Medium Close-up
4. Medium Shot
5. Medium Wide Shot
6. Wide Shot
7. Extreme Wide Shot
8. Over-the-Shoulder
9. Point of View
10. Establishing Shot

**Behavior**:
- Dropdown appears inline or in edit dialog
- Selection updates immediately
- Badge updates with new camera angle name

---

#### Toggle Continuity Link

**Availability by Reference Mode**:

| Mode | Continuity Toggle | Requirements |
|------|------------------|--------------|
| **1F Mode** | ❌ Not Available | No continuity possible (all shots are 1F) |
| **2F Mode** | ✅ Available | For all non-first shots (all are 2F) |
| **AI Mode** | ✅ Available | Only when previous shot is 2F |

---

**In 2F or AI Modes**:

**Trigger**: Click "Linked" / "Unlinked" button on shot card

**Availability**:
- ⚠️ **Only available for non-first shots** (cannot link first shot in scene)
- ⚠️ **Only available if previous shot is 2F** (disabled otherwise in AI mode)
- ⚠️ **Only available in 2F or AI modes** (hidden in 1F mode)

**Behavior**:
- Manual override of AI decision (if continuity was analyzed)
- Toggle between linked ↔ unlinked states
- Visual indicator appears/disappears between shots
- Can break AI-created links or create new links manually

**Button States**:
- **Linked** (green): "🔗 Linked" - Click to unlink
- **Unlinked** (gray): "Unlink" - Click to link
- **Disabled** (gray, faded): Previous shot is 1F, cannot link (AI mode only)

---

**In 1F Mode**:
- Continuity toggle button is **hidden**
- No continuity functionality available

---

#### Edit Description Inline

**Trigger**: Click inside shot description textarea

**Behavior**:
- Directly editable without opening modal
- Max 200 characters
- Auto-saves on blur (clicking outside)
- Character count shown on focus

**Use Cases**:
- Quick description refinements
- Add visual details
- Clarify shot intent

---

#### Add Shot

**Trigger**: Click "+ Add Shot" button within a scene card

**Default Values**:
- **Name**: "Shot X.Y: New" (X = scene number, Y = shot number)
- **Description**: Empty
- **Frame Type**: 1F (default)
- **Camera Angle**: "Medium Shot" (default)
- **Linked**: `false` if first shot, otherwise check if previous is 2F

**Behavior**:
- Opens shot creation dialog
- User specifies all properties
- Shot added to end of scene
- Continuity automatically analyzed for new shot

---

#### Delete Shot

**Trigger**: Click trash icon on shot card

**Validation**:
- ⚠️ **Minimum requirement**: Each scene must have at least 1 shot
- Cannot delete if only one shot in scene

**Behavior**:
- Shows confirmation dialog: "This will permanently delete this shot. Continuity links may be affected."
- On confirm: Shot removed
- Continuity links automatically recalculated:
  - If deleted shot was linked, next shot becomes unlinked
  - If deleted shot had a link TO it, that link is removed

---

## Complete Workflow Summary

### Phase 1: AI Generation (Automatic on Continue)

**Triggered when**: User clicks "Continue" from Elements step

**Process**:
1. **Scene Generator** analyzes script and creates scenes based on natural narrative breaks
   - Uses script, theme, characters, locations as input
   - Outputs scene names, descriptions, durations
2. **Shot Generator** processes each scene sequentially
   - Creates shots based on `shotsPerScene` setting (if number, creates exactly that many; if 'auto', determines optimal count)
   - **Frame type assignment based on Reference Mode**:
     - **1F Mode**: All shots assigned 1F
     - **2F Mode**: All shots assigned 2F
     - **AI Mode**: AI decides per shot (mix of 1F and 2F)
   - Assigns camera angles based on purpose
   - Tags shots with character/location references
   - Provides initial duration estimates per shot
3. **Timing Calculator** validates and adjusts shot durations
   - Ensures total duration matches user's target from Script step
   - Redistributes time proportionally across shots
   - Enforces 2-15 second constraints per shot
   - Flags warnings for review
4. **Timeline displays** with all scenes expanded
   - Scenes and shots visible with adjusted durations
   - **In 2F/AI modes**: "🔗 Analyze Continuity" button appears in header
   - **In 1F mode**: No continuity button (not applicable)

**Duration**: ~3-5 seconds for typical script

---

### Phase 1.5: Continuity Analysis (Optional - Manual Trigger)

**Available in**: 2F Mode and AI Mode only (not available in 1F Mode)

**Triggered when**: User clicks "🔗 Analyze Continuity" button

**Process**:
1. **Continuity Analyzer** processes eligible shots
   - **In 2F Mode**: Analyzes all shots (all are 2F)
   - **In AI Mode**: Analyzes only 2F shots (skips 1F shots)
   - Creates links where: previous is 2F + same setting + same characters
   - Outputs boolean flags for each shot
2. **Visual updates**:
   - Continuity indicators appear between linked shots
   - "Continuity Locked" badge appears in header
3. **User can skip**: This step is entirely optional

**Duration**: ~2-3 seconds

**Note**: User can proceed to next step without running continuity analysis

---

### Phase 2: Manual Editing (Optional)

**User can customize**:

**Scenes**:
- ✏️ Edit scene names and descriptions
- ➕ Add new scenes manually
- 🗑️ Delete scenes (minimum 1 required)

**Shots**:
- ✏️ Edit shot names, descriptions, camera angles
- ✏️ Edit frame types **(AI Mode only)**: Toggle between 1F ↔ 2F
- ➕ Add new shots to any scene
- 🗑️ Delete shots (minimum 1 per scene required)
- 🔗 Toggle continuity links manually **(2F/AI modes only)** (if previous shot is 2F)
- 🏷️ Adjust reference tags (future feature)

**Typical Edits**:
- Rename scenes for clarity
- Adjust shot descriptions for specificity
- **(AI Mode)**: Change frame types (1F ↔ 2F) for different pacing
- **(2F/AI modes)**: Override AI continuity decisions or create manual links
- Add custom shots for specific content
- **(2F/AI modes)**: Re-run continuity analysis after major edits

---

### Phase 3: Validation & Continue

**Requirements to proceed**:
- ✅ At least 1 scene exists
- ✅ Each scene has at least 1 shot
- ✅ Each shot has a valid duration (2-15 seconds)
- ✅ Total shot durations approximately match target video duration
- ⚠️ Continuity analysis **optional** (user can skip)
- ⚠️ Timing warnings (if any) reviewed by user (not blocking)

**Optional Recommendations**:
- **(2F/AI modes)**: Run continuity analysis for seamless transitions
- Review shot descriptions for accuracy
- Verify frame types match desired pacing (AI mode only)
- Review timing warnings and adjust problematic shot durations manually

**Click "Continue"** → Proceed to **Step 4: Storyboard**

---

## AI Components Summary

### AI Agents & Processors (4)

#### 1. Scene Generator (AI Agent)
**Purpose**: Divide script into logical scenes  
**Model Type**: GPT-5 (Large Language Model)  
**Input**: Script + theme + duration + worldDescription + characters + locations  
**Output**: Scene names, descriptions, durations  

#### 2. Shot Generator (AI Agent)
**Purpose**: Create detailed shots with frame types and camera angles  
**Model Type**: GPT-5 (Large Language Model)  
**Input**: Scene description + script (full script from Agent 1.1) + characters + locations + theme + **referenceMode**  
**Output**: Shot names, descriptions, frame types (based on mode), camera angles, reference tags, **initial duration estimates**  
**Frame Type Logic**:
- 1F Mode: All shots → 1F
- 2F Mode: All shots → 2F
- AI Mode: Intelligent per-shot decision (1F or 2F)

#### 3. Timing Calculator (Non-AI Processor)
**Purpose**: Calculate and validate shot timings to match target duration  
**Type**: Algorithmic (Non-AI)  
**Trigger**: Automatically after Shot Generator  
**Input**: All shots with initial durations + target duration from Script step  
**Output**: Adjusted shot durations + timing warnings  
**Constraints**: 2-15 seconds per shot  

#### 4. Continuity Analyzer (AI Agent - Optional)
**Purpose**: Determine which shots should link for seamless transitions  
**Model Type**: GPT-5 (Large Language Model)  
**Trigger**: **Manual** - User clicks "🔗 Analyze Continuity" button  
**Availability**: 2F Mode and AI Mode only (not available in 1F Mode)  
**Input**: All shots + frame types + scene context + characters + locations + referenceMode  
**Output**: Boolean continuity flags (isLinkedToPrevious) for eligible shots (2F shots only)  

---

### Total Components
**3 AI Agents** (all using GPT-5) + **1 Non-AI Processor** (algorithmic)

---

## Data Models

### Scene Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique scene identifier |
| `sceneNumber` | number | Sequential scene number (1, 2, 3...) |
| `name` | string | Scene title (e.g., "Scene 1: Morning Rush") |
| `description` | string | Scene summary (2-3 sentences) |
| `duration` | number | Estimated scene duration in seconds |
| `shots` | Shot[] | Array of shots in this scene |

---

### Shot Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique shot identifier |
| `sceneId` | string | Parent scene ID |
| `shotNumber` | number | Sequential shot number within scene |
| `name` | string | Shot identifier (e.g., "Shot 1.1: Opening") |
| `description` | string | Detailed shot description |
| `shotType` | string | Frame type: "1F" or "2F" |
| `cameraShot` | string | Camera angle preset |
| `referenceTags` | string[] | Character/location tags |
| `duration` | number | Shot duration in seconds (2-15s, adjusted by Timing Calculator) |
| `initialDuration` | number | Original AI estimate before timing adjustment (optional, for reference) |
| `videoModel` | string | Video model for this shot (default from Script, can be changed in Storyboard) |
| `videoModelMaxDuration` | number | Maximum duration for this shot's video model |
| `isLinkedToPrevious` | boolean | Continuity flag - whether this shot links to previous shot's end frame |

---

## Navigation Flow

### Entry Requirements

**From Script Step**:
- ✅ Script created (from Step 1)
- ✅ Target duration selected
- ✅ Video model selected (default for all shots)

**From Elements Step**:
- ✅ At least 1 character (primary required)
- ✅ At least 1 location created
- ✅ Theme selected
- ✅ World settings configured
- ✅ Reference Mode selected (at project creation)

**Reference Mode Awareness**:
- 1F Mode: All shots will be 1F, no continuity
- 2F Mode: All shots will be 2F, continuity available
- AI Mode: Mixed 1F/2F, continuity available for 2F shots

---

### Automatic on Entry

**What happens automatically**:

1. **Scene Generator** analyzes script (~2-3 seconds)
2. **Shot Generator** creates shots for all scenes (~2-4 seconds)
3. **Timing Calculator** validates and adjusts shot durations (~1 second)
4. **Timeline displays** with all scenes/shots expanded

**User sees**:
- Progress indicator during generation
- All scenes expanded by default
- All shots with durations displayed
- Frame type badges (based on Reference Mode)
- "🔗 Analyze Continuity" button (if 2F or AI mode)
- Timing warnings (if any duration adjustments were significant)

**Duration**: ~5-10 seconds total

---

### Continue Requirements

**Validation checks before proceeding**:
- ✅ At least 1 scene exists
- ✅ Each scene has at least 1 shot
- ✅ Each shot has a valid duration (2-15 seconds)
- ✅ Total shot durations approximately match target video duration
- ⚠️ Continuity analysis **optional** (user can skip)
- ⚠️ Timing warnings (if any) reviewed by user (not blocking)

**Optional but recommended**:
- Run continuity analysis for seamless transitions (2F/AI modes)
- Review and adjust shot descriptions
- Verify frame types match desired pacing (AI mode)
- Review timing warnings and manually adjust problematic shots

---

