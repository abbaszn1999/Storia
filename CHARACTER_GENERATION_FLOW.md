# Character Generation Flow - Complete Explanation

## Overview

The character generation system in Social Commerce mode uses a **two-agent architecture**:

1. **Agent 2.2a (Character Planning)** - Generates 3 character recommendations with structured data
2. **Agent 2.2b (Character Execution)** - Generates the actual character image using the recommendation data

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: User Selects Character Mode                            │
│  • hand-model (close-up hands only)                             │
│  • full-body (complete person visible)                           │
│  • silhouette (dramatic shadow outline)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: User Provides Input (Optional)                         │
│  • Text description (characterDescription)                       │
│  • Reference image (referenceImageFile)                         │
│  • OR both                                                        │
│  • OR neither (uses campaign context from Tab 1)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: User Clicks "AI Recommend" Button                        │
│  → Frontend calls: POST /api/social-commerce/videos/:id/        │
│                    characters/recommend                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  AGENT 2.2a: CHARACTER PLANNING                                  │
│  ────────────────────────────────────────────────────────────── │
│                                                                   │
│  Input:                                                          │
│  • characterMode (hand-model | full-body | silhouette)         │
│  • character_description (optional text)                         │
│  • referenceImageUrl (optional, uploaded to Bunny CDN)           │
│  • Campaign context from Tab 1 (targetAudience, region, etc.)  │
│                                                                   │
│  Process:                                                        │
│  1. If reference image provided → Upload to Bunny CDN temporarily│
│  2. Build user prompt with interleaved image pattern:          │
│     - Text label: "--- CHARACTER REFERENCE IMAGE ---"          │
│     - Image: referenceImageUrl                                  │
│     - Text: Main analysis instructions                           │
│  3. Call GPT-4o with multimodal input                            │
│  4. Parse JSON response with strict schema                      │
│                                                                   │
│  Output: CharacterPlanningOutput                                │
│  • recommendations: CharacterRecommendation[] (exactly 3)     │
│    Each recommendation contains:                                │
│    - id: "REC_ASPIRATIONAL_001"                                │
│    - name: "Elegant Minimalist"                                 │
│    - mode: 'hand-model' | 'full-body' | 'silhouette'            │
│    - character_profile: {                                       │
│        identity_id: "LUXURY_ELEGANT_F1"                         │
│        detailed_persona: "4-6 sentences..."                    │
│        cultural_fit: "2-3 sentences..."                         │
│      }                                                           │
│    - appearance: {                                              │
│        age_range: "25-35"                                       │
│        skin_tone: "warm olive..."                               │
│        build: "athletic"                                        │
│        style_notes: "Key visual characteristics"                │
│      }                                                           │
│    - interaction_protocol: {                                    │
│        product_engagement: "Technical rules..."                │
│        motion_limitations: "AI-safe constraints..."             │
│      }                                                           │
│    - identity_locking: {                                        │
│        strategy: 'IP_ADAPTER_STRICT' | 'PROMPT_EMBEDDING' |     │
│                 'SEED_CONSISTENCY' | 'COMBINED'                 │
│        vfx_anchor_tags: ["@Hand_Shape", "@Skin_Tone", ...]     │
│        reference_image_required: boolean                        │
│      }                                                           │
│  • reasoning: "Brief explanation of choices"                     │
│  • cost: number (USD)                                           │
│                                                                   │
│  NOTE: NO image_generation_prompt or thumbnail_prompt!          │
│        Agent 2.2b constructs these algorithmically.             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Frontend Displays 3 Recommendations                     │
│  • User sees 3 cards with character details                    │
│  • Each card shows: name, mode, persona preview                 │
│  • User can select one recommendation                           │
│  • selectedRecommendation state is set                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: User Optionally Uploads Reference Image               │
│  • User can upload a reference image for identity locking       │
│  • Stored in referenceImagePreviewUrl (local preview)           │
│  • This is DIFFERENT from the reference used in Agent 2.2a      │
│  • This reference is for Agent 2.2b image generation            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: User Clicks "Generate Image" Button                    │
│  → Frontend calls: POST /api/social-commerce/videos/:id/        │
│                    characters/generate-image                      │
│                                                                   │
│  Frontend Request Body:                                         │
│  {                                                               │
│    recommendation: CharacterRecommendation (full object)         │
│    referenceImageUrl?: string (optional, from user upload)     │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND ROUTE HANDLER                                          │
│  POST /api/social-commerce/videos/:id/characters/generate-image │
│  ────────────────────────────────────────────────────────────── │
│                                                                   │
│  1. Validates recommendation object exists                       │
│  2. Gets video from database                                    │
│  3. Extracts image settings from step1Data:                    │
│     • imageModel (e.g., 'nano-banana')                          │
│     • imageResolution (e.g., '1k', '2k')                         │
│     • aspectRatio (e.g., '9:16', '3:4')                          │
│  4. Calls Agent 2.2b: generateCharacterImage()                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  AGENT 2.2b: CHARACTER EXECUTION                                  │
│  ────────────────────────────────────────────────────────────── │
│                                                                   │
│  Input: CharacterExecutionInput                                  │
│  • recommendation: CharacterRecommendation (full object)         │
│  • referenceImageUrl?: string (optional)                         │
│  • imageModel: string (from Tab 1)                              │
│  • imageResolution: string (from Tab 1)                          │
│  • aspectRatio: string (from Tab 1)                             │
│                                                                   │
│  Process:                                                        │
│                                                                   │
│  1. EXTRACT DATA FROM RECOMMENDATION:                             │
│     • strategy = recommendation.identity_locking.strategy         │
│     • vfxAnchorTags = recommendation.identity_locking.vfx_anchor_tags│
│     • identityId = recommendation.character_profile.identity_id  │
│                                                                   │
│  2. BUILD IMAGE GENERATION PROMPT (Algorithmically):            │
│     Function: buildImageGenerationPrompt(recommendation, model) │
│                                                                   │
│     Mode: hand-model                                             │
│     → "Close-up photograph of {age_range} hands, {skin_tone}.    │
│        {detailed_persona} {style_notes}.                        │
│        Professional product photography, macro lens,            │
│        soft diffused lighting, high detail, sharp focus on      │
│        hands and wrists, elegant composition,                   │
│        commercial quality, studio lighting setup"                │
│                                                                   │
│     Mode: full-body                                              │
│     → "Portrait of {age_range} person, {skin_tone}, {build}.    │
│        {detailed_persona} {style_notes}.                        │
│        High-end fashion photography, 85mm lens,                │
│        shallow depth of field, cinematic lighting,             │
│        professional studio setup, commercial quality,           │
│        sharp focus on subject, elegant composition"            │
│                                                                   │
│     Mode: silhouette                                             │
│     → "Dramatic silhouette of {build} figure, {age_range}.    │
│        {detailed_persona}                                      │
│        High contrast lighting, figure completely in shadow      │
│        against bright background, clean profile line,           │
│        distinctive outline, dramatic cinematic lighting,        │
│        studio setup, commercial quality, minimalist composition"│
│                                                                   │
│     Then append VFX anchor tags if present:                     │
│     → ", @Hand_Shape, @Skin_Tone, @Nail_Style"                  │
│                                                                   │
│  3. BUILD PAYLOAD FOR RUNWARE API:                               │
│     {                                                             │
│       taskType: 'imageInference',                                │
│       model: runwareModelId,                                     │
│       positivePrompt: prompt (from step 2),                      │
│       negativePrompt: CHARACTER_NEGATIVE_PROMPT,                │
│       width: dimensions.width,                                   │
│       height: dimensions.height,                                 │
│       numberResults: 1,                                          │
│       includeCost: true,                                         │
│       outputType: 'URL',                                         │
│     }                                                             │
│                                                                   │
│  4. APPLY IDENTITY LOCKING STRATEGY:                             │
│                                                                   │
│     Strategy: IP_ADAPTER_STRICT                                  │
│     → If referenceImageUrl provided:                             │
│        payload.referenceImages = [referenceImageUrl]             │
│        (Uses reference image for identity preservation)          │
│                                                                   │
│     Strategy: SEED_CONSISTENCY                                   │
│     → payload.seed = hashToSeed(identityId)                      │
│        (Uses consistent seed based on identity ID)               │
│                                                                   │
│     Strategy: COMBINED                                           │
│     → payload.referenceImages = [referenceImageUrl] (if provided)│
│        payload.seed = hashToSeed(identityId)                     │
│        (Maximum consistency: reference + seed + anchor tags)      │
│                                                                   │
│     Strategy: PROMPT_EMBEDDING (default)                        │
│     → Pure prompt-based (anchor tags already in prompt)          │
│                                                                   │
│  5. CALL RUNWARE API:                                            │
│     → callAi({ provider: 'runware', ... })                       │
│     → Returns image URL from Runware                             │
│                                                                   │
│  Output: CharacterExecutionOutput                               │
│  • imageUrl: string (Runware CDN URL)                            │
│  • cost?: number (USD)                                           │
│  • error?: string                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND: DOWNLOAD & UPLOAD TO BUNNY CDN                        │
│  ────────────────────────────────────────────────────────────── │
│                                                                   │
│  1. Download image from Runware URL                              │
│  2. Upload to Bunny CDN:                                         │
│     Path: /workspace/{workspaceName}/videos/{videoId}/           │
│           characters/{characterName}.jpg                         │
│  3. Create database asset record                                 │
│  4. Save to step2Data.character:                                │
│     {                                                             │
│       referenceUrl: bunnyCdnUrl,                                 │
│       assetId: assetId,                                          │
│       name: recommendation.name,                                 │
│     }                                                             │
│  5. Return to frontend:                                          │
│     {                                                             │
│       imageUrl: bunnyCdnUrl,                                    │
│       assetId: assetId,                                          │
│     }                                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND: DISPLAY GENERATED IMAGE                              │
│  ────────────────────────────────────────────────────────────── │
│                                                                   │
│  1. Update characterReferenceUrl state                          │
│  2. Update characterAssetId state                               │
│  3. Update characterName state                                  │
│  4. Display image in UI                                          │
│  5. User can proceed to next step                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Concepts

### 1. **Two-Agent Architecture**

- **Agent 2.2a (Planning)**: Outputs structured JSON data only (no prompts)
- **Agent 2.2b (Execution)**: Constructs image generation prompts algorithmically from the data

**Why this separation?**
- Better modularity: Planning focuses on character design, Execution focuses on prompt engineering
- Flexibility: Can change prompt construction logic without affecting planning
- Maintainability: Clear separation of concerns

### 2. **Reference Image Handling**

There are **TWO different reference images** in the flow:

1. **Reference for Agent 2.2a (Planning)**:
   - Uploaded when user clicks "AI Recommend"
   - Used by Agent 2.2a to analyze character characteristics
   - Sent as multimodal input to GPT-4o
   - Temporary (uploaded to Bunny CDN, can be cleaned up)

2. **Reference for Agent 2.2b (Execution)**:
   - Uploaded separately by user (optional)
   - Used for identity locking strategies (IP_ADAPTER_STRICT, COMBINED)
   - Sent to Runware API as `referenceImages` array
   - Stored permanently if character is saved

**When is reference image sent to Agent 2.2b?**
- ✅ **YES** - If user uploads a reference image, it's always sent in the request
- Agent 2.2b decides whether to use it based on the strategy:
  - `IP_ADAPTER_STRICT` → Uses reference image
  - `COMBINED` → Uses reference image + seed
  - `PROMPT_EMBEDDING` → Ignores reference image (prompt-based only)
  - `SEED_CONSISTENCY` → Ignores reference image (seed-based only)

### 3. **Identity Locking Strategies**

| Strategy | How It Works | When to Use |
|----------|-------------|-------------|
| **IP_ADAPTER_STRICT** | Uses reference image for identity preservation | When user provides reference image and wants exact match |
| **PROMPT_EMBEDDING** | Pure prompt-based with VFX anchor tags | Default, works without reference image |
| **SEED_CONSISTENCY** | Fixed seed based on identity ID | For silhouette mode, ensures consistent shape |
| **COMBINED** | Reference image + seed + anchor tags | Maximum consistency across all shots |

### 4. **Prompt Construction (Agent 2.2b)**

The prompt is built algorithmically based on:
- **Character mode** (hand-model, full-body, silhouette)
- **Appearance data** (age_range, skin_tone, build)
- **Character profile** (detailed_persona, style_notes)
- **VFX anchor tags** (for consistency)

**Example for hand-model:**
```
Close-up photograph of 25-35 hands, warm olive with golden undertones. 
Professional product photographer with refined aesthetic, minimalist style, 
precise gestures. Professional product photography, macro lens, 
soft diffused lighting, high detail, sharp focus on hands and wrists, 
elegant composition, commercial quality, studio lighting setup, 
@Hand_Shape, @Skin_Tone, @Nail_Style
```

### 5. **Data Flow**

```
User Input
    ↓
Agent 2.2a (Planning)
    ↓
CharacterRecommendation (structured JSON)
    ↓
Frontend Selection
    ↓
Agent 2.2b (Execution)
    ↓
buildImageGenerationPrompt() → prompt string
    ↓
Runware API → image URL
    ↓
Bunny CDN → permanent storage
    ↓
Database (step2Data)
```

---

## Backward Compatibility

The system supports **legacy CharacterAIProfile** format:

- If user manually creates character (without using "AI Recommend")
- Frontend constructs a `CharacterRecommendation` from `CharacterAIProfile`
- Uses default values for missing fields (age_range, skin_tone, build)
- Still works with Agent 2.2b

---

## Error Handling

1. **No recommendation available**: Error thrown, user must use "AI Recommend" first
2. **Missing reference image for IP_ADAPTER_STRICT**: Warning logged, falls back to prompt-based
3. **Runware API failure**: Error returned, user can retry
4. **Bunny CDN upload failure**: Error returned, image URL still available from Runware

---

## Summary

**When user uploads a reference image:**
1. ✅ It's sent to Agent 2.2b in the `referenceImageUrl` field
2. ✅ Agent 2.2b uses it if strategy is `IP_ADAPTER_STRICT` or `COMBINED`
3. ✅ It's included in the Runware API payload as `referenceImages: [url]`
4. ✅ Runware uses it for identity preservation during image generation

**The reference image is always sent if provided**, but Agent 2.2b only uses it when the strategy requires it.

