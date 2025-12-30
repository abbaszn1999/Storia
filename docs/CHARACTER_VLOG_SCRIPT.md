# Character Vlog Mode - Script Step Documentation

## Overview

The **Character Vlog Mode** is a specialized video creation tool designed for creating character-driven narrative vlogs. These are short-form to medium-form videos featuring a character exploring topics, telling stories, or sharing experiences from their unique perspective.

The Script step is the foundation of the entire Character Vlog workflow, where creators define:
- The vlog concept and script
- Character personality and voice
- Visual theme and environment
- Duration and structure
- Creative direction (genres, tones)

---

## Table of Contents

1. [Workflow Overview](#workflow-overview)
2. [Step 1: Script](#step-1-script)
3. [AI Agent Architecture](#ai-agent-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Data Models](#data-models)
6. [UI/UX Design](#uiux-design)
7. [Technical Considerations](#technical-considerations)

---

## Workflow Overview

Character Vlog Mode follows a 6-step workflow:


### Workflow Steps

| Step | Name | Purpose |
|------|------|---------|
| **1. Script** | Script Editor | Define vlog concept, character personality, and generate script |
| **2. Elements** | Elements | Create character, locations, and world settings |
| **3. Scenes** | Scene Breakdown | Break script into scenes and shots |
| **4. Storyboard** | Storyboard | Generate images/videos for each shot |
| **5. Animatic** | Animatic Preview | Preview assembled video |
| **6. Export** | Export & Publish | Export final video and publish to platforms |

---

## Step 1: Script

**Purpose**: Create the narrative foundation for your character vlog by defining personality, theme, and generating a complete script from your concept.

### UI Layout

The Script step features a **two-column layout**:

- **Left Column (40%)**: All settings and configuration options
- **Right Column (60%)**: Vlog idea input and generated script

Both columns are independently scrollable to accommodate all content.

### Settings Structure

---

#### 1.1 Character Personality

**Purpose**: Define your character's vibe, energy, and overall persona.

- **Type**: Button grid selection (2 columns)
- **Default**: `energetic`
- **Backend Field**: `characterPersonality: string`
- **UI Behavior**: Selected personality shows gradient background (pink-to-orange)

**Options**:

| Value | Label | Description |
|-------|-------|-------------|
| `energetic` | Energetic | Upbeat, enthusiastic, and dynamic |
| `calm` | Calm | Relaxed, soothing, and peaceful |
| `humorous` | Humorous | Funny, witty, and entertaining |
| `serious` | Serious | Professional, focused, and informative |
| `mysterious` | Mysterious | Enigmatic, intriguing, and curious |
| `inspirational` | Inspirational | Motivating, uplifting, and empowering |
| `friendly` | Friendly | Warm, approachable, and relatable |
| `adventurous` | Adventurous | Bold, daring, and exploratory |

**Impact**: Influences script tone, character behavior, and narration style.

---

#### 1.2 Narration Style

**Purpose**: Choose the narrative perspective for your vlog.

- **Type**: Radio selection (single choice)
- **Default**: `first-person`
- **Backend Field**: `narrationStyle: 'third-person' | 'first-person'`
- **UI Behavior**: Selected style shows gradient background

**Options**:

| Value | Label | Description |
|-------|-------|-------------|
| `first-person` | First Person | The character narrates their own story |
| `third-person` | Third Person | The narrator describes the character's actions |

**Examples**:
- **First Person**: "I walked into the coffee shop and ordered my usual latte..."
- **Third Person**: "She walked into the coffee shop and ordered her usual latte..."

**Impact**: Determines pronoun usage and narrative voice throughout the script.

---

#### 1.3 Theme / Environment

**Purpose**: Set the visual world and environment for your vlog.

- **Type**: Button grid selection (4 columns)
- **Default**: `urban`
- **Backend Field**: `theme: string`
- **UI Display**: Each theme has an icon and label

**Options**:

| Value | Label | Icon | Description |
|-------|-------|------|-------------|
| `urban` | Urban / City | Building2 | City environments, streets, urban architecture |
| `nature` | Nature / Outdoors | TreePine | Natural landscapes, forests, parks, outdoor settings |
| `home` | Home / Interior | Home | Indoor residential spaces, cozy home environments |
| `studio` | Studio / Minimal | MonitorPlay | Clean studio backgrounds, minimal settings |
| `fantasy` | Fantasy / Magical | Wand | Magical, fantastical, otherworldly environments |
| `tech` | Tech / Futuristic | Cpu | Futuristic, technological, sci-fi settings |
| `retro` | Retro / Vintage | Radio | Vintage, nostalgic, retro-styled environments |
| `anime` | Anime / Animated | Paintbrush | Anime-style, animated aesthetic environments |

**Impact**: Guides scene generation, location creation, and visual aesthetic.

---

#### 1.4 Audio Layer

**Purpose**: Configure voice narration settings for the vlog.

##### 1.4.1 Voice Over Toggle

- **Type**: Toggle switch (On/Off)
- **Default**: `true` (On)
- **Backend Field**: `voiceOverEnabled: boolean`
- **UI Display**: Segmented control with gradient for active state

**Options**:
- **On**: Enable AI-generated voice narration
- **Off**: Silent video (visuals only, can add music)

##### 1.4.2 Language (Conditional)

**Visibility**: Only shown when `voiceOverEnabled === true`

- **Type**: Dropdown selection
- **Default**: `English`
- **Backend Field**: `language: string`

**Options**:

| Language | Voice Support |
|----------|---------------|
| English | ✓ |
| Spanish | ✓ |
| French | ✓ |
| German | ✓ |
| Italian | ✓ |
| Portuguese | ✓ |
| Japanese | ✓ |
| Korean | ✓ |
| Chinese | ✓ |
| Arabic | ✓ |

**Impact**: Determines the language for AI-generated voiceover synthesis.

---

#### 1.5 Target Duration

**Purpose**: Set the desired length for your character vlog.

- **Type**: Dropdown selection
- **Default**: `60` (1 minute)
- **Backend Field**: `duration: string` (stored as seconds on backend)

**Options**:

| Value (seconds) | Display Label | Use Case |
|-----------------|---------------|----------|
| `30` | 30s | Quick social media clips |
| `60` | 1min | Standard TikTok/Reels length |
| `180` | 3min | Extended social content |
| `300` | 5min | Mini vlog episodes |
| `600` | 10min | Full vlog episodes |
| `1200` | 20min+ | Long-form content |

**Backend Processing**: The value is converted to seconds (e.g., `"60"` → `60` seconds).

**Impact**: Influences:
- Number of scenes generated
- Scene duration allocation
- Script length
- Shot pacing

---

#### 1.6 Video Model Selection

**Purpose**: Choose the default AI model for video generation

- **Type**: Dropdown selection
- **Default**: `kling-ai-10s`
- **Backend Field**: `videoModel: string`, `videoModelMaxDuration: number`

**Options**:

| Value | Display Label | Max Duration | Description |
|-------|---------------|--------------|-------------|
| `kling-ai-10s` | Kling AI (10s) | 10 seconds | High quality, smooth motion |
| `kling-ai-5s` | Kling AI (5s) | 5 seconds | High quality, shorter clips |
| `runway-10s` | Runway Gen-4 (10s) | 10 seconds | Creative, artistic style |
| `runway-5s` | Runway Gen-4 (5s) | 5 seconds | Creative, shorter clips |
| `luma-5s` | Luma Dream Machine | 5 seconds | Fast generation |
| `pika-3s` | Pika 2.0 | 3 seconds | Quick results, stylized |
| `veo-8s` | Veo 2 | 8 seconds | Long duration, realistic |
| `minimax-6s` | Minimax | 6 seconds | Balanced quality/speed |

**Impact on Shot Duration**:
- Shot durations will be constrained by the model's maximum capability
- Example: Pika 2.0 (max 3s) → all shots will be 2-3s
- Example: Kling AI (max 10s) → shots can be 2-10s
- Affects how the Timing Calculator distributes duration across shots

**Can be changed later**: In Storyboard step (Step 4), you can change the model per scene for customization

**Backend Processing**:
- Stores both the model identifier and its max duration
- `videoModel`: Model identifier string
- `videoModelMaxDuration`: Maximum duration in seconds (3-10s depending on model)

---

#### 1.7 Genres

**Purpose**: Define the content category and style (up to 3 selections).

- **Type**: Multi-select badges
- **Max Selections**: 3
- **Default**: `["Lifestyle"]`
- **Backend Field**: `genres: string[]`
- **UI Behavior**: 
  - Selected genres show gradient background
  - Counter badge shows `X/3`
  - Attempting 4th selection shows error toast

**Options**:

| Genre Options |
|---------------|
| Adventure |
| Fantasy |
| Sci-Fi |
| Comedy |
| Drama |
| Horror |
| Mystery |
| Romance |
| Thriller |
| Educational |
| Documentary |
| Action |
| Lifestyle |
| Travel |
| Gaming |

**Validation**: 
- Minimum: 0 selections (optional)
- Maximum: 3 selections
- Error message: "You can select up to 3 genres maximum."

**Impact**: Guides AI script generation style and content direction.

---

#### 1.8 Tones

**Purpose**: Define the emotional atmosphere and mood (up to 3 selections).

- **Type**: Multi-select badges
- **Max Selections**: 3
- **Default**: `["Energetic"]`
- **Backend Field**: `tones: string[]`
- **UI Behavior**: Same as Genres (gradient, counter, validation)

**Options**:

| Tone Options |
|--------------|
| Dramatic |
| Lighthearted |
| Mysterious |
| Inspirational |
| Dark |
| Whimsical |
| Serious |
| Playful |
| Epic |
| Nostalgic |
| Uplifting |
| Suspenseful |
| Energetic |
| Chill |

**Validation**: 
- Minimum: 0 selections (optional)
- Maximum: 3 selections
- Error message: "You can select up to 3 tones maximum."

**Impact**: Influences:
- Script writing style
- Emotional pacing
- Character performance direction
- Visual mood

---

#### 1.8 Structure Settings

**Purpose**: Control the breakdown of your vlog into scenes and shots.

##### 1.8.1 Number of Scenes

- **Type**: Auto button / Number input
- **Range**: 1-20 (when manual)
- **Default**: `'auto'`
- **Backend Field**: `numberOfScenes: 'auto' | number`

**Options**:
- **Auto**: AI determines optimal scene count based on duration and script content
- **Manual (1-20)**: Fixed number of scenes

**AI Auto Logic**:
- 30s-1min: 2-4 scenes
- 3min: 3-6 scenes
- 5min: 5-8 scenes
- 10min+: 6-12 scenes

**Help Text**: "AI will determine optimal scene count if set to Auto"

##### 1.8.2 Shots per Scene

- **Type**: Auto button / Number input
- **Range**: 1-10 (when manual)
- **Default**: `'auto'`
- **Backend Field**: `shotsPerSegment: 'auto' | number`

**Options**:
- **Auto**: AI varies shot count per scene based on content complexity
- **Manual (1-10)**: Fixed shots per scene

**AI Auto Logic**:
- Simple scenes: 2-4 shots
- Complex scenes: 5-8 shots
- Action scenes: 6-10 shots

**Help Text**: "AI will vary shot count per scene if set to Auto"

**Impact**: Determines granularity of scene breakdown in Step 3 (Scenes).

---

#### 1.9 Script Generation Interface

The right column contains the script creation interface:

##### 1.9.1 Your Vlog Idea

- **Type**: Textarea (multiline)
- **Placeholder**: "Describe your vlog concept... AI will expand it into a full script."
- **Min Height**: 120px
- **Character Counter**: Live count displayed
- **Backend Field**: `vlogIdea: string` (temporary, not saved)

**Purpose**: User provides a brief concept or outline that AI will expand into a full script.

**Example Inputs**:
- "A day in the life of a barista in Tokyo"
- "Exploring abandoned places in my city"
- "Teaching viewers how to cook the perfect pasta"
- "Gaming tips for beginners in Valorant"

##### 1.9.2 Generate Full Script Button

- **Type**: Action button
- **State**: Disabled when idea is empty or during generation
- **Backend Trigger**: `POST /api/narrative/script/generate`

**Button States**:
- **Default**: "Generate Full Script" (with Wand2 icon)
- **Loading**: "Generating Script..." (with spinning Loader2 icon)
- **Disabled**: Opacity 50%, cursor not-allowed

**Validation**: Requires non-empty `storyIdea` before enabling.

##### 1.9.3 Generated Script

- **Type**: Large textarea (multiline, editable)
- **Min Height**: 300px
- **Placeholder** (before generation): "Generate a script from your vlog idea first. The AI-generated script will appear here and you can edit it."
- **Placeholder** (after generation): "Edit your AI-generated script here..."
- **Disabled**: Until first generation completes
- **Backend Field**: `script: string`

**Features**:
- **Live Metrics**: Character count and word count displayed
- **Fully Editable**: Users can manually refine AI-generated script
- **Persists**: Script saves to state and persists across navigation

**Metrics Display**:
- Character count: `{count} chars`
- Word count: `{count} words`
- Separator: `•`

---

## AI Agent Architecture

Character Vlog Mode uses **1 AI agent** in the Script step.

### Agent 1.1: Script Generator

**Type**: AI (Text Generation)  
**Role**: Expand user's vlog idea into a complete, narrated script based on all configured settings.

#### Inputs

| Input | Type | Description |
|-------|------|-------------|
| `userPrompt` | string | User's vlog idea/concept |
| `characterPersonality` | string | Selected personality (e.g., "energetic") |
| `narrationStyle` | string | "first-person" or "third-person" |
| `theme` | string | Visual environment theme |
| `duration` | number | Target duration in seconds |
| `genres` | string[] | Selected genres (max 3) |
| `tones` | string[] | Selected tones (max 3) |
| `language` | string | Target language for script |

#### Output

| Output | Type | Description |
|--------|------|-------------|
| `script` | string | Complete vlog script with narration |

#### Supported Model: Only GPT5

| Model | Provider | Capabilities | Badge |
|-------|----------|--------------|-------|
| `gpt-5` | OpenAI | Latest model, fast and capable | 

**Default**: `gpt-5`

#### Generation Process

1. **User Input**: User provides vlog idea and configures all settings
2. **Validation**: System checks that `userPrompt` is non-empty
3. **API Call**: Send all parameters to script generation endpoint
4. **AI Processing**: 
   - Analyze vlog concept
   - Apply personality and narration style
   - Structure content based on duration/scenes/shots
   - Match genre and tone requirements
   - Generate in specified language
5. **Output**: Return complete script with narrative flow
6. **UI Update**: Populate generated script textarea
7. **User Refinement**: User can manually edit the generated script

#### Prompt Engineering

The backend constructs a detailed prompt that includes:

```
System: You are a creative vlog script writer specializing in character-driven narratives.

Task: Write a {duration}-second vlog script in {language} with {narrationStyle} narration.

Character: {characterPersonality} personality
Theme: {theme} environment
Genres: {genres}
Tones: {tones}
Structure: {numberOfScenes} scenes with {shotsPerScene} shots each

Vlog Concept: {userPrompt}

Requirements:
- Write in {narrationStyle} perspective
- Match the {characterPersonality} personality throughout
- Set scenes in {theme} environments
- Incorporate {genres} genre elements
- Maintain {tones} emotional tones
- Structure for approximately {numberOfScenes} distinct scenes
- Each scene should have roughly {shotsPerScene} visual moments
- Total duration: {duration} seconds

Output only the script text, ready for narration.
```

---

