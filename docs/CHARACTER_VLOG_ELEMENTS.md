# Character Vlog Mode - Elements Step Documentation

## Overview

The **Elements** step is where creators build the visual foundation for their character vlog. This step comes after Script creation and involves:

1. **Configuring global settings** (image model, style, aspect ratio)
2. **Building the cast** (primary and secondary characters)
3. **Defining locations** (scene settings)

All visual generation uses the configured settings to maintain consistency throughout the project.

---

## Table of Contents

1. [Workflow Context](#workflow-context)
2. [Step 1: Configure Settings](#step-1-configure-settings)
3. [Step 2: Character Recommendations (AI)](#step-2-character-recommendations-ai)
4. [Step 3: Character Image Generation](#step-3-character-image-generation)
5. [Step 4: Location Recommendations](#step-4-location-recommendations)
6. [Step 5: Location Image Generation](#step-5-location-image-generation)
7. [Data Models](#data-models)
8. [UI/UX Design](#uiux-design)

---

## Workflow Context


**Step 2 of 6**: Elements

**Inputs from Script Step**:
- `script` - Full script text
- `characterPersonality` - Main character personality trait
- `theme` - Visual environment theme
- `narrationStyle` - First-person or third-person

**Outputs to Scenes Step**:
- `characters[]` - All created characters (primary + secondary)
- `locations[]` - All created locations
- `worldSettings` - Global visual settings
- Character images
- Location images

---

## Step 1: Configure Settings

### Purpose
Set global visual configuration that applies to all generated content in the project.

### User Flow

1. User arrives at Elements step from Script
2. **Configure settings first** (before creating characters/locations):
   - Select Image Model
   - Select Aspect Ratio
   - Select Style (preset or custom)
   - Write World Description
3. Settings saved and applied to all future generations

### Settings

#### 1.1 Image Model

**Purpose**: Choose the AI image generation model for all visual content.

**Type**: Dropdown selection

**Options**:
- Flux (default)
- Midjourney
- Nano Banana
- GPT Image
- DALL-E 3
- Stable Diffusion

**Impact**: Determines image quality, style capabilities, and generation speed.

---

#### 1.2 Aspect Ratio

**Purpose**: Set video frame dimensions for all generated images.

**Type**: Button selection (3 options)

**Options**:

| Value | Label | Best For | Description |
|-------|-------|----------|-------------|
| `16:9` | 16:9 | YouTube | Horizontal/Landscape |
| `9:16` | 9:16 | TikTok, Reels | Vertical/Portrait |
| `1:1` | 1:1 | Instagram | Square |

**Default**: `9:16`

**Impact**: All character and location images generated in this ratio.

---

#### 1.3 Style

**Purpose**: Define the visual aesthetic for all generated content.

**Type**: Exclusive selection (preset OR custom)

**Option A: Preset Styles** (Carousel with 11 options):

| Style | Description |
|-------|-------------|
| None | Natural/photorealistic |
| Cinematic | Film-quality dramatic look |
| Vintage | Retro film aesthetic |
| Storybook | Illustrated book style |
| 3D Cartoon | 3D animated character style |
| Pixar | Pixar animation style |
| Disney | Disney animation style |
| Ghibli | Studio Ghibli anime style |
| Clay | Claymation style |
| Comic | Comic book illustration |
| Anime | Japanese anime style |

**Option B: Custom Reference**:
- Upload 1 custom style reference image
- When uploaded, preset styles are disabled
- User must use custom reference OR preset (not both)

**Default**: None (photorealistic)

**Impact**: Applied to all character and location image generation prompts.

---

#### 1.4 World Description

**Purpose**: Provide context about the world/universe for consistent generation.

**Type**: Textarea (multiline)

**Placeholder**: "Describe the world setting, era, atmosphere..."

**Max Length**: Unlimited

**Examples**:
- "A vibrant modern city where technology and nature coexist"
- "A cozy small-town with 90s nostalgia and warm colors"
- "A mystical fantasy realm with magical elements and ethereal lighting"

**Impact**: Added to all character and location generation prompts for consistency.

---

## Step 2: Character Recommendations (AI)

### Purpose
Use AI to analyze the script and suggest ALL characters: 1 primary character (narrator/main character) AND up to 4 secondary characters (supporting cast) in a single recommendation.

### AI Agent
**Character Analyzer** (Single unified agent for all characters)

### User Flow

1. User navigates to **Cast** section
2. User clicks `[AI Recommend Characters]` button (one button for all characters)
3. **AI analyzes script** (2-3 seconds)
4. Modal displays **character suggestions in two labeled sections**:
   - **PRIMARY CHARACTER** (1 suggestion - labeled "PRIMARY")
   - **SECONDARY CHARACTERS** (0-4 suggestions - labeled "SECONDARY")
5. User reviews all suggestions with their details:
   - Character name
   - Description
   - Appearance details
   - Mention count
   - Role label (PRIMARY or SECONDARY)
6. User can:
   - ✅ `[Add to Cast]` on individual characters (primary and/or secondary)
   - ❌ Close modal - Skip all recommendations

### AI Agent: Character Analyzer

**Type**: Text Analysis AI  
**Model**: GPT-4 or equivalent

#### Inputs

| Input | Source | Description |
|-------|--------|-------------|
| `script` | Script step | Full vlog script text |
| `narrationStyle` | Script step | "first-person" or "third-person" |
| `characterPersonality` | Script step | Personality trait (e.g., "energetic") |
| `theme` | Script step | Visual environment theme |
| `style` | Elements settings | Selected visual style (preset or custom) |
| `worldDescription` | Elements settings | Custom world/atmosphere description |

#### Process

1. **Analyze Primary Character**:
   - First-person: Narrator = primary character
   - Third-person: Identify most mentioned character
   - Extract character name (or generate appropriate name)
   - Identify character traits from context
   - Generate appearance based on personality, theme, style, and world description

2. **Analyze Secondary Characters**:
   - Parse script for additional character mentions
   - Extract proper nouns (names)
   - Identify role references (e.g., "the barista", "my friend")
   - Count frequency of each mention
   - Rank by mention frequency
   - Generate details for top 4 (excluding primary)
   - Apply consistent style and world atmosphere to appearances

3. **Return structured suggestions** with both primary and secondary characters clearly labeled

#### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `primaryCharacter` | object | The main character suggestion |
| └─ `name` | string | Character name |
| └─ `description` | string | Brief description (50-100 words) |
| └─ `appearance` | string | Physical appearance (100-150 words) |
| └─ `mentionCount` | number or "implicit" | Frequency in script |
| `secondaryCharacters` | array | List of 0-4 supporting character suggestions |
| └─ `name` | string | Character name |
| └─ `description` | string | Brief description (30-50 words) |
| └─ `appearance` | string | Physical appearance (50-80 words) |
| └─ `mentionCount` | number | Times mentioned in script |

#### Example

**Input Script** (First-Person):
```
"I wake up every morning at 6 AM and head to my favorite coffee shop.
Sarah, the owner, always has my order ready. The new barista, Marcus,
is still learning the ropes. Later, my friend Jake joined us for a chat..."
```

**Output**:
```json
{
  "primaryCharacter": {
    "name": "Narrator",
    "description": "An energetic young professional with a structured morning routine and love for coffee. Regular customer who has built relationships at the local coffee shop.",
    "appearance": "Young adult in their late 20s, casual urban style, bright eyes showing enthusiasm for daily adventures, comfortable modern clothing, approachable demeanor",
    "mentionCount": "implicit"
  },
  "secondaryCharacters": [
    {
      "name": "Sarah",
      "description": "The coffee shop owner who knows the narrator well and anticipates their order",
      "appearance": "Warm, professional appearance with a welcoming smile, business casual attire suitable for running a cafe",
      "mentionCount": 3
    },
    {
      "name": "Jake",
      "description": "The narrator's close friend who joins for casual conversations at the coffee shop",
      "appearance": "Relaxed, friendly style with approachable personality, casual clothing",
      "mentionCount": 2
    },
    {
      "name": "Marcus",
      "description": "New barista at the coffee shop, still learning but eager to improve",
      "appearance": "Young, enthusiastic with a trainee's nervous energy, wearing cafe uniform",
      "mentionCount": 1
    }
  ]
}
```

---

## Step 3: Character Image Generation

### Purpose
Generate visual representation (portrait) of a character using AI image model.

### AI Model
**Character Image Model** (uses static prompt template)

### User Flow

**Manual Character Creation**:

1. User clicks `[+ Add Character]` (in Primary or Secondary section)
2. Character creation dialog opens
3. User fills form:
   - **Name** (required)
   - **Age** (optional)
   - **Role** (required) - e.g., "Brave protector"
   - **Appearance** (required) - Physical description
   - **Personality** (optional) - Traits and mannerisms
4. User optionally uploads **1 reference image**
5. User clicks `[Generate Character Image]`
6. **Image model generates portrait** (10-30 seconds)
7. Generated image displays in preview
8. User clicks `[Add To Cast]` to save character

**OR from AI Recommendation**:

1. User accepts AI-recommended character
2. Character added with AI-generated details
3. User can click `[Generate Image]` on character card
4. Follow generation flow above

### Character Image Model

**Type**: Text-to-Image AI  
**Model**: User-selected (Flux, Midjourney, etc.)  
**Method**: Static prompt template with variable substitution

#### Inputs

| Input | Source | Description |
|-------|--------|-------------|
| `name` | User/AI | Character name |
| `appearance` | User/AI | Physical appearance description |
| `personality` | User/AI | Personality traits (optional) |
| `style` | Settings | Selected style (preset or custom) |
| `worldDescription` | Settings | World context |
| `aspectRatio` | Settings | Image dimensions |
| `referenceImage` | User upload | Optional visual reference |

#### Prompt Template

```
Portrait of {name}, {appearance}
{personality_visual_interpretation}
{style_keywords}
{world_description}
Aspect ratio: {aspect_ratio}
Professional character portrait, clear facial features, 
centered composition, detailed rendering
{if reference_image: "Match style and aesthetic from reference image"}
```

**Variable Substitution Example**:
```
Portrait of Alex, young adult in late 20s with bright eyes and casual urban style
Energetic and enthusiastic demeanor, confident posture
Cinematic style, dramatic lighting, film-quality rendering
A vibrant modern city where technology and nature coexist
Aspect ratio: 9:16
Professional character portrait, clear facial features,
centered composition, detailed rendering
```

#### Process

1. **Build prompt** using template + variables
2. **Add style modifiers**:
   - If preset style: Add style-specific keywords
   - If custom reference: Include reference image
3. **Send to image model** (Flux, Midjourney, etc.)
4. **Receive generated image URL**
5. **Return image to frontend**

#### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `imageUrl` | string | URL to generated character portrait |

---

## Step 4: Location Recommendations

### Purpose
Use AI to analyze script and theme to suggest scene locations (up to 5).

### AI Agent
**Location Analyzer** (AI Agent)

### User Flow

1. User navigates to **Location** section
2. User clicks `[Recommend]` button
3. **AI analyzes script + theme + genre** (2-3 seconds)
4. Modal displays **up to 5 location suggestions**
5. User reviews each location:
   - Location name
   - Description
   - Visual details
6. User can:
   - ✅ `[Add Location]` on individual locations
   - ❌ Close modal - Skip all

### AI Agent: Location Analyzer

**Type**: Text Analysis AI  
**Model**: GPT-4 or equivalent

#### Inputs

| Input | Source | Description |
|-------|--------|-------------|
| `script` | Script step | Full vlog script text |
| `theme` | Script step | Visual theme (urban, nature, etc.) |
| `genre` | Script step | Selected genres (array, up to 3) |
| `worldDescription` | Settings | World context |
| `duration` | Script step | Target video duration |
| `maxResults` | Fixed | 5 |

#### Process

1. **Extract explicit location mentions**:
   - Parse script for location names
   - Identify scene transitions
   - Detect setting descriptions

2. **Apply genre-based location filtering**:
   - Filter locations based on selected genres
   - Example: "Horror" → dark, mysterious locations; "Comedy" → light, social spaces
   - Genre influences location atmosphere and visual style

3. **Add theme-based defaults**:
   - Load location suggestions for theme type
   - Example: "urban" → coffee shop, street, park, rooftop
   - Combine with genre requirements

4. **Consider video duration**:
   - Short (30s-1min): 2-3 locations
   - Medium (3-5min): 3-5 locations
   - Long (10min+): 4-5 locations

5. **Generate detailed descriptions**:
   - Location name
   - Brief description
   - Visual details (lighting, atmosphere, key features)
   - Incorporate genre-appropriate atmosphere

6. **Return prioritized suggestions** (script mentions first, then theme/genre defaults)

#### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `locations` | array | List of 2-5 location suggestions |
| Each location: | | |
| └─ `name` | string | Location name |
| └─ `description` | string | Brief description (30-50 words) |
| └─ `details` | string | Visual details (50-100 words) |

#### Theme-Based Defaults

| Theme | Default Location Suggestions |
|-------|------------------------------|
| **Urban** | Street Corner, Coffee Shop, Rooftop, City Park, Subway |
| **Nature** | Forest Trail, Lakeside, Mountain Peak, Open Field, Waterfall |
| **Home** | Living Room, Kitchen, Bedroom, Home Office, Backyard |
| **Studio** | Clean Studio, Colorful Backdrop, Minimalist Space, White Cyc |
| **Fantasy** | Enchanted Forest, Magic Castle, Mystical Cave, Crystal Garden |
| **Tech** | Server Room, Modern Office, Tech Lab, Cyber Cafe |
| **Retro** | Vintage Diner, Old Theater, Arcade, Record Shop |
| **Anime** | School Rooftop, Sakura Park, City Street, Cafe |

#### Example

**Input**:
```
Script: "I walked into the downtown coffee shop, then headed to the park..."
Theme: "urban"
Genre: ["Lifestyle", "Comedy"]
Duration: 60 seconds
```

**Output**:
```json
{
  "locations": [
    {
      "name": "Downtown Coffee Shop",
      "description": "A cozy urban cafe with warm atmosphere and modern interior",
      "details": "Large windows showing city street, wooden tables, exposed brick walls, warm lighting from hanging Edison bulbs, espresso machine sounds, comfortable booth seating"
    },
    {
      "name": "City Park",
      "description": "A peaceful urban park with green spaces and walking paths",
      "details": "Mature trees providing shade, well-maintained grass, wooden benches along paths, flower beds, natural daylight, people passing by in background"
    },
    {
      "name": "City Street",
      "description": "A busy urban street with modern buildings and pedestrian activity",
      "details": "Tall buildings lining the street, crosswalks, streetlights, storefronts, urban energy, daytime lighting with slight shadows from buildings"
    }
  ]
}
```

---

## Step 5: Location Image Generation

### Purpose
Generate visual representation (environment shot) of a location using AI image model.

### AI Model
**Location Image Model** (uses static prompt template)

### User Flow

**Manual Location Creation**:

1. User clicks `[+ Add Location]`
2. Location creation dialog opens
3. User fills form:
   - **Name** (required)
   - **Description** (required) - Brief overview
   - **Details** (required) - Visual specifics
4. User optionally uploads **1 reference image**
5. User clicks `[Generate Location Image]`
6. **Image model generates environment** (10-30 seconds)
7. Generated image displays in preview
8. User clicks `[Add Location]` to save

**OR from AI Recommendation**:

1. User accepts AI-recommended location
2. Location added with AI-generated details
3. User can click `[Generate Image]` on location card
4. Follow generation flow above

### Location Image Model

**Type**: Text-to-Image AI  
**Model**: User-selected (Flux, Midjourney, etc.)  
**Method**: Static prompt template with variable substitution

#### Inputs

| Input | Source | Description |
|-------|--------|-------------|
| `name` | User/AI | Location name |
| `description` | User/AI | Brief description |
| `details` | User/AI | Visual details and atmosphere |
| `style` | Settings | Selected style (preset or custom) |
| `worldDescription` | Settings | World context |
| `aspectRatio` | Settings | Image dimensions |
| `referenceImage` | User upload | Optional visual reference |

#### Prompt Template

```
Environment shot of {name}, {description}
{details}
{style_keywords}
{world_description}
Aspect ratio: {aspect_ratio}
Architectural photography, environmental shot, atmospheric lighting,
detailed rendering, depth of field, professional composition
{if reference_image: "Match style and aesthetic from reference image"}
```

**Variable Substitution Example**:
```
Environment shot of Downtown Coffee Shop, a cozy urban cafe with warm atmosphere
Large windows showing city street, wooden tables, exposed brick walls, 
warm lighting from hanging Edison bulbs, comfortable booth seating
Cinematic style, dramatic lighting, film-quality rendering
A vibrant modern city where technology and nature coexist
Aspect ratio: 9:16
Architectural photography, environmental shot, atmospheric lighting,
detailed rendering, depth of field, professional composition
```

#### Process

1. **Build prompt** using template + variables
2. **Add style modifiers**:
   - If preset style: Add style-specific keywords
   - If custom reference: Include reference image
3. **Send to image model** (Flux, Midjourney, etc.)
4. **Receive generated image URL**
5. **Return image to frontend**

#### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `imageUrl` | string | URL to generated location image |


---

## Data Models

### Character Schema

```typescript
interface Character {
  id: string;
  videoId: string;
  workspaceId: string;
  name: string;
  description: string | null;         // Role/personality
  appearance: string | null;           // Physical description
  personality: string | null;          // Traits
  section: 'primary' | 'secondary';    // Character type
  imageUrl: string | null;             // Generated image
  referenceImageUrl: string | null;    // User-uploaded reference
  createdAt: Date;
}
```

### Location Schema

```typescript
interface Location {
  id: string;
  videoId: string;
  workspaceId: string;
  name: string;
  description: string | null;          // Brief description
  details: string | null;              // Visual details
  imageUrl: string | null;             // Generated image
  referenceImageUrl: string | null;    // User-uploaded reference
  createdAt: Date;
}
```

### World Settings Schema

```typescript
interface WorldSettings {
  imageModel: string;                  // Flux, Midjourney, etc.
  aspectRatio: '16:9' | '9:16' | '1:1';
  styleType: 'preset' | 'custom';
  stylePreset: string | null;          // If preset selected
  styleReferenceUrl: string | null;    // If custom uploaded
  worldDescription: string;
}
```

---

## UI/UX Design

### Page Layout

```
┌─────────────────────────────────────────────────┐
│  ELEMENTS STEP                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  LEFT COLUMN (35%)      │  RIGHT COLUMN (65%)  │
│  ────────────────────── │  ──────────────────  │
│                         │                       │
│  SETTINGS:              │  CAST:                │
│  • Image Model          │  ┌──────────────────┐│
│  • Aspect Ratio         │  │ Primary          ││
│  • Style                │  │ [Browse Library] ││
│  • World Description    │  │ [Recommend]      ││
│                         │  │ [+ Add Character]││
│                         │  └──────────────────┘│
│                         │                       │
│                         │  ┌──────────────────┐│
│                         │  │ Secondary        ││
│                         │  │ [Browse Library] ││
│                         │  │ [Recommend]      ││
│                         │  │ [+ Add Character]││
│                         │  └──────────────────┘│
│                         │                       │
│                         │  LOCATIONS:           │
│                         │  [Browse Library]     │
│                         │  [Recommend]          │
│                         │  [+ Add Location]     │
│                         │                       │
└─────────────────────────────────────────────────┘
```

### Character Card Design

```
┌─────────────────────┐
│  ┌───────────────┐  │
│  │               │  │
│  │  [Character   │  │
│  │   Image]      │  │
│  │               │  │
│  └───────────────┘  │
│                     │
│  Character Name     │
│  Brief description  │
│                     │
│  [Edit] [Export]    │
└─────────────────────┘
```

### Location Card Design

```
┌─────────────────────┐
│  ┌───────────────┐  │
│  │               │  │
│  │  [Location    │  │
│  │   Image]      │  │
│  │               │  │
│  └───────────────┘  │
│                     │
│  Location Name      │
│  Brief description  │
│                     │
│  [Edit] [Export]    │
└─────────────────────┘
```

### Color Scheme

**Accent Gradient**: `#FF4081` → `#FF5C8D` → `#FF6B4A` (Pink to Orange)

**Backgrounds**:
- Primary: `#1a1a1a`
- Cards: `#252525`
- Inputs: `#0f0f0f`

**Buttons**:
- Recommend: Gradient with Sparkles icon
- Generate: Gradient with Sparkles icon
- Browse Library: Outline with cyan icon
- Add: Dashed border with gradient icon

---

## Complete Workflow Summary

### Phase 1: Settings (Do First)
1. Select Image Model
2. Select Aspect Ratio
3. Select Style (preset OR custom upload - 1 image)
4. Write World Description

### Phase 2: Cast

**Primary Character** (1 required):
- **Manual**: Add → fill form → upload 1 reference (optional) → generate
- **AI Recommend**: Click Recommend → AI returns 1 suggestion → accept/decline

**Secondary Characters** (0-4 optional):
- **Manual**: Add → fill form → upload 1 reference (optional) → generate
- **AI Recommend**: Click Recommend → AI returns up to 4 suggestions → pick which to add

### Phase 3: Locations (1+ required)

- **Manual**: Add → fill form → upload 1 reference (optional) → generate
- **AI Recommend**: Click Recommend → AI returns up to 5 suggestions → pick which to add

---

## AI Components Summary

### AI Agents (2)
1. **Character Analyzer** - Script analysis for character recommendations
   - Primary mode: Returns 1 primary character
   - Secondary mode: Returns up to 4 secondary characters

2. **Location Analyzer** - Script + theme analysis for location recommendations
   - Returns up to 5 location suggestions

### AI Models (2)
1. **Character Image Model** - Portrait generation using static prompt template
2. **Location Image Model** - Environment generation using static prompt template

**Total AI Components**: 4 (2 agents + 2 models)

---

## Navigation Flow

### Entry Requirements
- Script completed
- Script settings configured

### Continue Requirements
- ✅ Settings configured (image model, aspect ratio, style, world description)
- ✅ At least 1 primary character created
- ✅ At least 1 location created
- ⚠️ Images optional (can generate later in Storyboard)

### Next Step
**Destination**: Step 3 - Scenes (Scene Breakdown)

**Data Passed Forward**:
- All characters (primary + secondary)
- All locations
- World settings
- Character images (if generated)
- Location images (if generated)

---

**Document Version**: 3.0 (Step-based)  
**Last Updated**: December 23, 2024  
**Authors**: Storia Development Team
