# Tab 1: Strategic Context - Sora Integration Plan

## Current Tab 1 Overview

**Purpose**: Transform raw user inputs into professional "Visual Bible" that guides all downstream agents.

**Current Components**:
- User inputs: Product info, target audience, region, duration, aspect ratio, custom instructions
- Agent 1.1: Strategic Context Optimizer
- Output: Strategic directives, pacing profile, optimized motion DNA, optimized image instruction

---

## What Tab 1 Currently Does

### User Inputs (Step1Data)

- `productTitle`: Product name
- `productDescription`: Product description
- `productCategory`: Product category
- `targetAudience`: Target audience
- `region`: Geographic region
- `aspectRatio`: Video aspect ratio (9:16, 16:9, 1:1, 4:5)
- `duration`: Video duration (10, 15, 20, 30, 45, 60 seconds)
- `customImageInstructions`: User's custom image generation instructions
- `customMotionInstructions`: User's custom motion instructions
- `imageModel`: Image generation model selection
- `imageResolution`: Image resolution
- `videoModel`: Video generation model selection
- `videoResolution`: Video resolution
- `language`: Language selection (ar/en)
- `voiceOverEnabled`: Voiceover toggle

### Agent 1.1 Output (StrategicContextOutput)

- `strategic_directives`: Cultural and visual laws (4-8 sentences)
- `pacing_profile`: FAST_CUT | LUXURY_SLOW | KINETIC_RAMP | STEADY_CINEMATIC
- `optimized_motion_dna`: Professional cinematic movement description (3-5 sentences)
- `optimized_image_instruction`: SOTA technical prompt for image generation (3-5 sentences)

---

## Changes Needed for Sora Integration

### 1. Video Model Selection (COMPLETE SHIFT TO SORA ONLY)

**Current**: `videoModel` field with multiple options (PixVerse, Seedance, etc.)

**Change Required**: **COMPLETE SHIFT TO SORA ONLY**
- **Remove all other video model options**
- Users can **ONLY choose between Sora 2 and Sora 2 Pro**
- Update UI to show only Sora models
- Store selection in `step1Data.videoModel`

**Options**:
- `"sora-2"` (openai:3@1) - Standard quality
- `"sora-2-pro"` (openai:3@2) - Premium quality
- **No other models available**

### 2. Duration Constraints (SORA ONLY)

**Current**: Durations [10, 15, 20, 30, 45, 60] seconds

**Change Required**: **RESTRICT TO SORA DURATIONS ONLY**
- Remove all other duration options
- Only allow [4, 8, 12] seconds (Sora constraint)
- Update `DURATION_OPTIONS` to [4, 8, 12]

**Implementation**:
- Update duration dropdown to show only [4, 8, 12]
- Remove longer duration options
- Update type definitions

### 3. Aspect Ratio Constraints (DYNAMIC BASED ON MODEL)

**Current**: Aspect ratios [9:16, 16:9, 1:1, 4:5]

**Change Required**: **DYNAMIC ASPECT RATIOS BASED ON SELECTED MODEL**
- When **Sora 2** selected: Show only [16:9, 9:16]
- When **Sora 2 Pro** selected: Show [16:9, 9:16, 7:4, 4:7]
- **Aspect ratio options update automatically when model changes**

**Implementation**:
- Conditional aspect ratio dropdown that updates on model selection
- If Sora 2 → Show [16:9, 9:16]
- If Sora 2 Pro → Show [16:9, 9:16, 7:4, 4:7]
- Update `ASPECT_RATIOS` to be model-specific
- Clear UI indication of which options are available
- Auto-select first option if current selection becomes invalid

### 4. Resolution Selection (DYNAMIC BASED ON MODEL + ASPECT RATIO)

**Current**: `videoResolution` field exists

**Change Required**: **DYNAMIC RESOLUTION OPTIONS**
- **Resolution dropdown updates automatically when model + aspect ratio change**
- Show available resolutions for selected model + aspect ratio combination
- Sora 2: 720p only (1280×720 or 720×1280)
- Sora 2 Pro: 720p for standard ratios, additional options for 7:4/4:7
- Clear indication of resolution options with dimensions

**Implementation**:
- Conditional resolution dropdown
- Updates when model or aspect ratio changes
- Show dimensions (e.g., "720p (1280×720)")

### 5. Remove Image Model Selection

**Current**: `imageModel` and `imageResolution` fields for image generation

**Change Required**: **REMOVE IMAGE MODEL SELECTION**
- Not needed for Sora workflow
- Product images are uploaded (not generated)
- Character images are optional preview only (not sent to Sora)
- First frame is uploaded product hero (not generated)

**Implementation**:
- Remove `imageModel` from `Step1Data` type
- Remove `imageResolution` from `Step1Data` type
- Remove image model selector from Tab 1 UI
- Remove image resolution selector from Tab 1 UI

### 6. Smart Audio Settings Panel (Right Side Panel)

**Current**: Basic voiceover toggle and language selection

**Change Required**: **COMPREHENSIVE AUDIO SETTINGS PANEL**
- Create dedicated "Audio & Quality Settings" panel on the right side
- Organize audio settings into logical, conditional sections
- Use progressive disclosure (show sections only when enabled)

**New Structure**:

**🎤 Voiceover Section** (conditional - shown when `voiceOverEnabled = true`):
- Language selector: [Dropdown: ar/en]
- Audio Volume: [Buttons: Low | Medium | High]
- Dialogue: [Add Dialogue +] (for multiple dialogue lines)
- Custom Voiceover Instructions: [Textarea] (tone, style, delivery guidance)

**🔊 Sound Effects Section** (conditional - shown when `soundEffectsEnabled = true`):
- Preset Selection: [Dropdown] OR
- Custom Instructions: [Textarea] (radio toggle between preset/custom)
- Preset options: "Ambient", "Impact", "Nature", "Urban", "Cinematic", etc.

**🎵 Music Section** (conditional - shown when `musicEnabled = true`):
- Music Preset: [Dropdown] OR
- Custom Instructions: [Textarea] (radio toggle between preset/custom)
- Music Mood: [Text Input] (e.g., "Uplifting", "Tense", "Emotional")
- Preset options: "Orchestral", "Electronic", "Acoustic", "Cinematic", etc.

**Implementation**:
- Remove `customImageInstructions` from `Step1Data` type
- Add `soundEffectsEnabled: boolean` to `Step1Data` type
- Add `musicEnabled: boolean` to `Step1Data` type
- Add `audioVolume: 'low' | 'medium' | 'high'` to `Step1Data` type
- Add `soundEffectsPreset?: string` to `Step1Data` type
- Add `soundEffectsCustomInstructions?: string` to `Step1Data` type
- Add `musicPreset?: string` to `Step1Data` type
- Add `musicCustomInstructions?: string` to `Step1Data` type
- Add `musicMood?: string` to `Step1Data` type
- Add `customVoiceoverInstructions?: string` to `Step1Data` type
- Add `dialogue?: Array<{character?: string, line: string}>` to `Step1Data` type
- Each audio section uses radio toggle: "Use Preset" OR "Custom Instructions"
- Sections appear/disappear based on their respective enable toggles

### 7. Quality Settings Section (Right Side Panel)

**Current**: No quality control settings

**Change Required**: **PRODUCTION LEVEL CONTROL**
- Add "Quality Settings" section in right panel
- Production Level slider: Raw → Casual → Balanced → Cinematic → Ultra
- Affects Sora output quality and detail level
- Always visible (not conditional)

**Implementation**:
- Add `productionLevel: 'raw' | 'casual' | 'balanced' | 'cinematic' | 'ultra'` to `Step1Data` type
- Default: 'balanced'
- Slider with 5 discrete positions
- Tooltip explaining each level's impact on Sora output

### 8. Visual Style Section (Right Side Panel)

**Current**: No visual style override controls

**Change Required**: **PACING OVERRIDE CONTROL**
- Add "Visual Style" section in right panel
- Pacing Override slider: Calm → Moderate → Chaotic
- Allows users to override AI-generated pacing profile
- Always visible (not conditional)
- **Note**: Visual style preset (Photorealistic, Cinematic, etc.) is handled in Tab 3 (`visualPreset`)

**Implementation**:
- Add `pacingOverride?: number` (0-100, maps to Calm-Moderate-Chaotic) to `Step1Data` type
- Default: null (use AI pacing profile)
- When provided, Agent 1.1 fine-tunes pacing profile based on override value
- Pacing override fine-tunes the AI-generated pacing profile

### 9. Agent 1.1 Output Modifications

**Keep**:
- `strategic_directives`: Still needed for prompt synthesis
- `pacing_profile`: Still needed for timing calculations
- `optimized_motion_dna`: Still needed for motion descriptions

**Modify**:
- `optimized_image_instruction`: 
  - Current: For image generation models
  - With Sora: Still useful for first frame generation (product hero)
  - Keep but note it's for first frame only

**Add** (Optional):
- `sora_prompt_guidance`: Specific instructions for Sora prompt synthesis
- Or: Enhance `optimized_motion_dna` to include Sora-specific motion descriptions

---

## What to Keep

### ✅ Keep All User Inputs (Except Removed Fields)

- Product info (title, description, category)
- Target audience and region
- Custom motion instructions
- Language and voiceover settings

### ✅ Keep Agent 1.1

- Still essential for creating strategic context
- Output guides all downstream agents
- No changes to agent logic needed

### ✅ Keep Strategic Outputs

- `strategic_directives`: Cultural/visual laws
- `pacing_profile`: Rhythmic profile
- `optimized_motion_dna`: Motion descriptions
- `optimized_image_instruction`: For first frame generation

---

## What to Remove

### ❌ Remove Other Video Models

- Remove PixVerse, Seedance, KlingAI, Veo, etc. from options
- **Only Sora 2 and Sora 2 Pro available**

### ❌ Remove Longer Durations

- Remove [10, 15, 20, 30, 45, 60] seconds
- **Only [4, 8, 12] seconds available**

### ❌ Remove Unsupported Aspect Ratios

- Remove 1:1, 4:5 aspect ratios
- **Only Sora-supported ratios available**
- Ratios update dynamically based on model selection

### ❌ Remove Image Model Selection

- Remove `imageModel` field
- Remove `imageResolution` field
- Not needed for Sora workflow (product images uploaded, character images optional preview)

### ❌ Remove Custom Image Instructions

- Remove `customImageInstructions` field
- Not applicable to Sora (uses text prompts, not image generation)
- Replace with audio instructions

---

## What to Add

### ➕ Video Model Selection UI (SORA ONLY)

- Radio buttons or card selector for video model
- **Only 2 options**: Sora 2, Sora 2 Pro
- Visual indicators (quality, aspect ratios, cost, features)
- Clear comparison between models
- Default: Sora 2 Pro (recommended)

### ➕ Duration Options (SORA ONLY)

- Duration dropdown with [4, 8, 12] seconds only
- No conditional logic needed (always Sora durations)
- Clear messaging: "Sora supports 4, 8, or 12 seconds"
- Default: 8 seconds (middle option)

### ➕ Dynamic Aspect Ratio Options

- **Aspect ratio dropdown updates automatically when model changes**
- When Sora 2 selected → Show [16:9, 9:16]
- When Sora 2 Pro selected → Show [16:9, 9:16, 7:4, 4:7]
- Clear indication of which options are available
- Auto-select first option if current selection becomes invalid
- Show labels: "16:9 (Landscape)", "9:16 (Portrait)", "7:4 (Wide)", "4:7 (Tall)"
- Default: 9:16 (vertical, social media standard)

### ➕ Dynamic Resolution Selection

- **Resolution dropdown updates automatically when model + aspect ratio change**
- Show available resolutions for selected model + aspect ratio combination
- Sora 2: 720p only (1280×720 or 720×1280)
- Sora 2 Pro: 720p for standard ratios, additional options for 7:4/4:7
- Clear indication of resolution options
- Show dimensions: "720p (1280×720)" or "720p (720×1280)"
- Default: 720p (matches aspect ratio)

### ➕ Audio Settings Panel (Right Side)

**Smart Organization with Progressive Disclosure**:

**🎤 Voiceover Section** (conditional):
- Enable toggle: `voiceOverEnabled`
- When enabled, shows:
  - Language selector: [Dropdown: ar/en]
  - Audio Volume: [Buttons: Low | Medium | High]
  - Dialogue: [Add Dialogue +] button (adds dialogue entry)
  - Custom Voiceover Instructions: [Textarea] (tone, style, delivery)
- Passed to Agent 1.1 and Sora Prompt Synthesizer

**🔊 Sound Effects Section** (conditional):
- Enable toggle: `soundEffectsEnabled`
- When enabled, shows:
  - Radio toggle: "Use Preset" OR "Custom Instructions"
  - If Preset: [Dropdown] with options (Ambient, Impact, Nature, Urban, Cinematic, etc.)
  - If Custom: [Textarea] for custom sound effects description
- Passed to Agent 1.1 and Sora Prompt Synthesizer

**🎵 Music Section** (conditional):
- Enable toggle: `musicEnabled`
- When enabled, shows:
  - Radio toggle: "Use Preset" OR "Custom Instructions"
  - If Preset: [Dropdown] with options (Orchestral, Electronic, Acoustic, Cinematic, etc.)
  - If Custom: [Textarea] for custom music description
  - Music Mood: [Text Input] (e.g., "Uplifting", "Tense", "Emotional")
- Passed to Agent 1.1 and Sora Prompt Synthesizer

### ➕ Quality Settings Section (Right Side)

- **Production Level Slider**: Raw → Casual → Balanced → Cinematic → Ultra
- Always visible (affects Sora output quality)
- Default: Balanced
- Tooltip explains each level's impact
- Passed to Sora Prompt Synthesizer for quality hints

### ➕ Visual Style Section (Right Side)

- **Pacing Override Slider**: Calm → Moderate → Chaotic
- Default: null (use AI pacing profile)
- Fine-tunes AI-generated pacing profile
- **Note**: Visual style preset (Photorealistic, Cinematic, Anime, Editorial) is handled in Tab 3 (`visualPreset`)
- Always visible

### ➕ Model-Specific Help Text

- Tooltips explaining Sora capabilities
- Duration/aspect ratio constraints per model
- Cost and quality information
- Link to documentation

---

## UI Layout Structure

### Two-Zone Layout

**Left Zone (60-70% width)**: Main Content
- Product information inputs
- Campaign settings
- Video model selection
- Duration, aspect ratio, resolution
- Custom motion instructions

**Right Zone (30-40% width)**: Audio & Quality Settings Panel
- Collapsible section
- Fixed width (~400px)
- Scrollable content
- Organized into logical sections

### Right Panel Structure

```
┌─────────────────────────────────────┐
│ Audio & Quality Settings            │
│ [Collapse/Expand]                   │
├─────────────────────────────────────┤
│                                     │
│ 🎤 Voiceover                        │
│ ☑ Enable Voiceover                 │
│   └─ Language: [Dropdown: ar/en]   │
│   └─ Audio Volume: [Low|Med|High]   │
│   └─ Dialogue: [Add Dialogue +]     │
│   └─ Custom Instructions: [Textarea] │
│                                     │
│ 🔊 Sound Effects                    │
│ ☑ Enable Sound Effects             │
│   └─ ○ Use Preset  ● Custom        │
│   └─ [Dropdown] OR [Textarea]      │
│                                     │
│ 🎵 Music                            │
│ ☑ Enable Music                      │
│   └─ ○ Use Preset  ● Custom        │
│   └─ [Dropdown] OR [Textarea]      │
│   └─ Music Mood: [Text Input]      │
│                                     │
│ ⚙️ Quality Settings                 │
│   └─ Production Level: [Slider]    │
│      Raw → Casual → Balanced →     │
│      Cinematic → Ultra              │
│                                     │
│ 🎨 Visual Style                     │
│   └─ Pacing Override: [Slider]      │
│      Calm → Moderate → Chaotic      │
│                                     │
└─────────────────────────────────────┘
```

## Implementation Details

### Frontend Changes

**Tab 1 UI Updates**:

1. Video model selector (SORA ONLY)
   - Radio buttons or card selector
   - **Only 2 options**: Sora 2, Sora 2 Pro
   - Show model features (quality, aspect ratios, cost)
   - Default: Sora 2 Pro (recommended)

2. Duration selector (SORA ONLY)
   - Dropdown with [4, 8, 12] seconds only
   - No conditional logic (always same options)
   - Default: 8 seconds

3. Aspect ratio selector (DYNAMIC)
   - **Updates automatically when model changes**
   - If Sora 2 selected → Show [16:9, 9:16]
   - If Sora 2 Pro selected → Show [16:9, 9:16, 7:4, 4:7]
   - Auto-select first option if current becomes invalid
   - Clear indication: "Available for Sora 2 Pro only" for 7:4/4:7
   - Default: 9:16 (vertical, social media standard)

4. Resolution selector (DYNAMIC)
   - **Updates automatically when model + aspect ratio change**
   - Show available resolutions for current model + aspect ratio
   - Sora 2: 720p (1280×720 or 720×1280)
   - Sora 2 Pro: 720p for standard, additional for 7:4/4:7
   - Clear dimension display (e.g., "1280×720")
   - Default: 720p (matches aspect ratio)

5. Right Side Panel: "Audio & Quality Settings"
   
   **Layout**: Collapsible section on right side of Tab 1
   
   **🎤 Voiceover Section** (conditional):
   - Enable toggle: "Enable Voiceover"
   - When enabled:
     - Language selector: [Dropdown: ar/en]
     - Audio Volume: [Button Group: Low | Medium | High]
     - Dialogue: [Add Dialogue +] button (opens dialogue entry form)
     - Custom Voiceover Instructions: [Textarea]
       - Placeholder: "e.g., 'warm and inviting narration' or 'energetic and confident'"
   
   **🔊 Sound Effects Section** (conditional):
   - Enable toggle: "Enable Sound Effects"
   - When enabled:
     - Radio toggle: "Use Preset" | "Custom Instructions"
     - If Preset: [Dropdown] with options
     - If Custom: [Textarea] for custom description
   
   **🎵 Music Section** (conditional):
   - Enable toggle: "Enable Music"
   - When enabled:
     - Radio toggle: "Use Preset" | "Custom Instructions"
     - If Preset: [Dropdown] with options
     - If Custom: [Textarea] for custom description
     - Music Mood: [Text Input]
       - Placeholder: "e.g., Uplifting, tense, emotional..."
   
   **⚙️ Quality Settings** (always visible):
   - Production Level: [Slider]
     - Labels: Raw | Casual | Balanced | Cinematic | Ultra
     - Default: Balanced
     - Tooltip: Explains each level's impact
   
   **🎨 Visual Style** (always visible):
   - Pacing Override: [Slider]
     - Labels: Calm | Moderate | Chaotic
     - Default: null (use AI pacing)
     - Tooltip: "Fine-tune the AI-generated pacing profile"
     - Note: Visual style preset (Photorealistic, Cinematic, etc.) is set in Tab 3

6. Help text and tooltips
   - Explain Sora capabilities
   - Show constraints per model
   - Link to documentation

### Backend Changes

**Step 1 Route Updates**:

1. Validate video model selection (must be sora-2 or sora-2-pro)
2. Validate duration matches Sora constraints (4, 8, or 12)
3. Validate aspect ratio matches model constraints
4. Validate resolution matches model + aspect ratio
5. Validate voiceover instructions only when voiceover enabled
6. Store all selections in `step1Data`

**Type Updates**:

```typescript
// SORA ONLY - Remove other models
type VideoModel = 'sora-2' | 'sora-2-pro';

// SORA ONLY - Remove longer durations
type DurationOption = 4 | 8 | 12;

// Dynamic aspect ratios based on model
type Sora2AspectRatio = '16:9' | '9:16';
type Sora2ProAspectRatio = '16:9' | '9:16' | '7:4' | '4:7';
type AspectRatio = Sora2AspectRatio | Sora2ProAspectRatio;

// Dynamic resolutions based on model + aspect ratio
type Resolution = '720p'; // Add more as needed for Sora 2 Pro

// Updated Step1Data interface
export interface Step1Data {
  // Product basics
  productTitle: string;
  productDescription?: string;
  productCategory?: string;
  
  // Campaign settings
  targetAudience: string;
  region?: string;
  
  // Technical settings
  aspectRatio: AspectRatio;
  duration: DurationOption;
  videoModel: VideoModel;
  videoResolution: Resolution;
  
  // Custom instructions
  customMotionInstructions?: string;  // Motion guidance
  
  // Audio Settings (Right Panel)
  voiceOverEnabled?: boolean;
  language?: 'ar' | 'en';
  audioVolume?: 'low' | 'medium' | 'high';
  dialogue?: Array<{character?: string; line: string}>;
  customVoiceoverInstructions?: string;
  
  soundEffectsEnabled?: boolean;
  soundEffectsPreset?: string;
  soundEffectsCustomInstructions?: string;
  
  musicEnabled?: boolean;
  musicPreset?: string;
  musicCustomInstructions?: string;
  musicMood?: string;
  
  // Quality Settings (Right Panel)
  productionLevel?: 'raw' | 'casual' | 'balanced' | 'cinematic' | 'ultra';
  
  // Visual Style (Right Panel)
  pacingOverride?: number; // 0-100, maps to Calm-Moderate-Chaotic
  // Note: Visual style preset (Photorealistic, Cinematic, etc.) is in Tab 3 (visualPreset)
  
  // Agent 1.1 output
  strategicContext?: StrategicContextOutput;
}
```

**Agent 1.1**:
- Include audio settings (voiceover, sound effects, music) in strategic context
- Include `customVoiceoverInstructions` in strategic context (only if voiceover enabled)
- Include `productionLevel` for quality guidance
- Include `pacingOverride` to fine-tune pacing profile (if provided)
- Guide audio descriptions in `optimized_motion_dna` or separate audio guidance
- No changes needed to agent logic structure
- Note: Visual style preset is handled in Tab 3 by Agent 3.1 (World Builder)

---

## Validation Rules

### When Sora 2 Selected

- ✅ Duration must be 4, 8, or 12
- ✅ Aspect ratio must be 16:9 or 9:16
- ✅ Resolution must be 720p (1280×720 or 720×1280)
- ✅ All other inputs valid

### When Sora 2 Pro Selected

- ✅ Duration must be 4, 8, or 12
- ✅ Aspect ratio must be 16:9, 9:16, 7:4, or 4:7
- ✅ Resolution must match selected aspect ratio
  - 16:9 or 9:16 → 720p
  - 7:4 or 4:7 → Available resolutions for these ratios
- ✅ All other inputs valid

### Audio Settings Validation

- ✅ `customVoiceoverInstructions` only valid when `voiceOverEnabled: true`
- ✅ `customVoiceoverInstructions` only valid when `language` is selected
- ✅ If voiceover enabled but no language selected, show warning
- ✅ `soundEffectsPreset` and `soundEffectsCustomInstructions` are mutually exclusive (radio toggle)
- ✅ `musicPreset` and `musicCustomInstructions` are mutually exclusive (radio toggle)
- ✅ `productionLevel` must be one of: raw, casual, balanced, cinematic, ultra
- ✅ `pacingOverride` must be 0-100 if provided

---

## Migration Considerations

### Existing Videos

- Videos created before Sora integration
- May have different video models (PixVerse, etc.)
- May have `imageModel` and `customImageInstructions` fields
- Need to handle gracefully
- Show message: "This video uses a different model. Please select Sora 2 or Sora 2 Pro for new videos."
- Don't break existing workflows
- Old fields can be ignored (not used in Sora workflow)

### Default Behavior

- **Default video model**: Sora 2 Pro (recommended, higher quality)
- **Default duration**: 8 seconds (middle option)
- **Default aspect ratio**: 9:16 (vertical, social media standard)
- **Default resolution**: 720p (matches aspect ratio)
- **Default voiceover**: Disabled
- **Default language**: Not selected (required if voiceover enabled)
- **Default audio volume**: Medium
- **Default sound effects**: Disabled
- **Default music**: Disabled
- **Default production level**: Balanced
- **Default pacing override**: null (use AI pacing profile)
- **Note**: Visual style preset is set in Tab 3 (default handled by Agent 3.1)

---

## Testing Checklist

- [ ] Video model selection works (only Sora 2 and Sora 2 Pro available)
- [ ] Duration options show only [4, 8, 12]
- [ ] Aspect ratio options update when model changes
- [ ] Resolution options update when model + aspect ratio change
- [ ] Image model selection removed from UI
- [ ] Image resolution selection removed from UI
- [ ] Custom image instructions removed from UI
- [ ] Right side panel "Audio & Quality Settings" created
- [ ] Voiceover section shows/hides based on toggle
- [ ] Sound Effects section shows/hides based on toggle
- [ ] Music section shows/hides based on toggle
- [ ] Radio toggles work correctly (Preset vs Custom)
- [ ] Audio volume buttons work correctly
- [ ] Dialogue add/remove functionality works
- [ ] Production Level slider works correctly
- [ ] Pacing Override slider works correctly
- [ ] All conditional sections appear/disappear correctly
- [ ] Validation prevents invalid combinations
- [ ] Agent 1.1 still works correctly with new fields
- [ ] Strategic context output is valid
- [ ] Existing videos don't break
- [ ] UI is clear and intuitive
- [ ] Auto-selection works when options become invalid

---

## Next Steps

After Tab 1 plan is approved:

1. Create Tab 2 plan (Product/Cast DNA)
2. Create Tab 3 plan (Environment/Story)
3. Create Tab 4 plan (Shot Orchestrator)
4. Create Sora Prompt Synthesizer plan

---

## Questions to Resolve

1. **Model Selection UI**: Radio buttons, cards, or dropdown? (Recommendation: Cards with comparison)
2. **Help Text**: How detailed should model information be? (Recommendation: Tooltips with key differences)
3. **Migration**: How to handle existing videos with old models? (Recommendation: Show message, require model selection)
4. **Cost Display**: Should we show cost estimates per model? (Recommendation: Yes, in tooltips)
5. **Resolution Display**: Show dimensions (1280×720) or just label (720p)? (Recommendation: Both)
6. **Right Panel Layout**: Fixed width or responsive? (Recommendation: Fixed ~400px, collapsible)
7. **Audio Section Order**: Voiceover → Sound Effects → Music? (Recommendation: Yes, logical flow)
8. **Production Level Default**: Balanced or Cinematic? (Recommendation: Balanced)
9. **Pacing Override Impact**: How does it affect Agent 1.1 pacing profile? (Recommendation: Fine-tune multiplier)
10. **Visual Style Preset**: Handled in Tab 3 (`visualPreset`) - no duplication needed
