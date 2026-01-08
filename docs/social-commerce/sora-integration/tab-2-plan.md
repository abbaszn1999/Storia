# Tab 2: Product & Cast DNA - Sora Integration Plan

## Current Tab 2 Overview

**Purpose**: Extract product physical DNA, generate/curate character profiles, and define brand identity to create the "Visual Assets" foundation for video generation.

**Current Components**:
- User inputs: Product images (hero, macro, material), material settings, character options, brand assets
- Agent 2.1: Product DNA Visionary (analyzes product images)
- Agent 2.2a: Character Planning (generates 3 recommendations)
- Agent 2.2b: Character Execution (generates character image)
- Agent 2.3: Brand Identity Guardian (converts brand settings)
- Output: Product DNA, Character Profile, Brand Identity

---

## What Tab 2 Currently Does

### User Inputs (Step2Data)

**Product Images:**
- `heroProfile`: Primary product view (required)
- `macroDetail`: Close-up texture detail (optional)
- `materialReference`: Material texture focus (optional)

**Product Material Settings:**
- `materialPreset`: "metallic" | "translucent" | "soft-organic" | "matte-industrial"
- `surfaceComplexity`: 0-100 slider
- `refractionEnabled`: boolean
- `heroFeature`: User-specified key feature
- `originMetaphor`: Creative inspiration

**Character Options:**
- `characterMode`: "hand-model" | "full-body" | "silhouette"
- `characterDescription`: User's text description (optional)
- `characterReferenceUrl`: Uploaded character image (optional)
- `includeHumanElement`: boolean

**Brand Assets:**
- `logoUrl`: Brand logo image (optional)
- `brandPrimaryColor`: Hex color
- `brandSecondaryColor`: Hex color
- `logoIntegrity`: 1-10 slider
- `logoDepth`: 1-5 slider

### Agent 2.1 Output (ProductDNAOutput)

- `geometry_profile`: Precise physical description (dimensions, shapes, proportions)
- `material_spec`: PBR-compliant material description (roughness, metalness, patterns)
- `hero_anchor_points`: Array of 4-6 key visual landmarks
- `lighting_response`: How materials react to light (specular, shadows, effects)

### Agent 2.2a Output (CharacterPlanningOutput)

- `recommendations`: Array of 3 character recommendations
  - Each includes: identity_id, character_profile, appearance, interaction_protocol, identity_locking, image_generation_prompt
- `reasoning`: Brief explanation of choices

### Agent 2.2b Output (CharacterExecutionOutput)

- `character_image_url`: Generated character image URL
- `identity_id`: Character identity reference
- `cost`: Generation cost

### Agent 2.3 Output (BrandIdentityOutput)

- `logo_integrity`: "flexible" | "moderate" | "strict" | "exact"
- `logo_depth`: "flat" | "subtle" | "moderate" | "embossed" | "extruded"
- `brand_colors`: { primary: string, secondary: string }

---

## Changes Needed for Sora Integration

### 1. Product Hero Image (FIRST FRAME FOR SORA)

**Current**: Product hero image is used for:
- Product DNA analysis (Agent 2.1)
- Image reference in shot planning (Agent 4.1)
- Image generation for individual shots

**Change Required**: **PRODUCT HERO BECOMES SORA FIRST FRAME**
- Product hero image will be sent to Sora as the first frame (single image input)
- **Only product hero is sent to Sora** (not macro, not material reference)
- Macro and material reference are still analyzed for Product DNA, but not sent to Sora
- Product hero must match Sora's dimension requirements (300-2048px, match output dimensions)

**Implementation**:
- Validate product hero dimensions match selected video resolution
- Store product hero URL for Sora first frame
- Ensure product hero is always present (required field)

### 2. Character Section (SIMPLIFIED - NO IMAGE GENERATION)

**Current**: 
- Agent 2.2a generates 3 character recommendations with image generation prompts
- Agent 2.2b generates character image from selected recommendation
- Character image upload supported

**Change Required**: **SIMPLIFIED CHARACTER WORKFLOW - NO IMAGES**
- Keep Agent 2.2a (Character Planning) - generates 3 persona recommendations
- Remove Agent 2.2b (Character Execution) - no image generation needed
- Remove character image upload - not sent to Sora
- Remove image generation prompts from recommendations
- Remove identity_locking strategies (not needed for Sora)
- User workflow:
  1. Enable "Include Character"
  2. Select mode (hand-model, full-body, silhouette)
  3. Click "AI Recommend Character"
  4. Agent 2.2a generates 3 recommendations with persona details
  5. User selects one recommendation
  6. Persona details displayed in editable text fields
  7. User can manually edit persona
  8. No image placeholder/display

**Simplified Character Recommendation Structure**:
```typescript
interface CharacterRecommendation {
  id: string;
  name: string;
  mode: 'hand-model' | 'full-body' | 'silhouette';
  
  // Persona details (editable by user)
  detailed_persona: string;        // Physical specification
  cultural_fit: string;            // Audience alignment
  interaction_protocol: {
    product_engagement: string;    // How character interacts with product
    motion_limitations: string;    // Movement constraints
  };
  
  // Removed fields:
  // - identity_id (not needed)
  // - identity_locking (not needed for Sora)
  // - image_generation_prompt (no image generation)
  // - thumbnail_prompt (no image generation)
  // - appearance (can be part of detailed_persona)
}
```

### 3. Logo Section (REMOVE ENTIRELY)

**Current**: Logo upload, brand colors, integrity/depth sliders, Agent 2.3 conversion

**Change Required**: **REMOVE LOGO SECTION COMPLETELY**
- Remove logo upload - not sent to Sora
- Remove brand colors - not needed
- Remove logo integrity slider - not needed
- Remove logo depth slider - not needed
- Remove Agent 2.3 (Brand Identity Guardian) - not needed
- Logo can be described in prompt if needed, but no dedicated section

**Implementation**:
- Remove all logo-related UI components
- Remove logo fields from `Step2Data`
- Remove Agent 2.3 from codebase
- Update Agent 4.1 to not expect logo information

### 4. Product DNA (STILL NEEDED FOR PROMPT SYNTHESIS)

**Current**: Product DNA used for shot planning and image generation

**Change Required**: **PRODUCT DNA STILL ESSENTIAL**
- Product DNA (geometry, material, anchor points, lighting) is used in Sora prompt synthesis
- Describes product appearance when not visible in first frame
- Guides product consistency throughout video
- No changes to Agent 2.1 logic needed

**Keep As-Is**:
- Agent 2.1: Product DNA Visionary (no changes)
- All outputs still needed for prompt synthesis

---

## What to Keep

### ✅ Keep All Product Inputs

- Product images (hero, macro, material)
- Material settings (preset, complexity, refraction, hero feature, origin metaphor)

### ✅ Keep Agent 2.1 (Product DNA Visionary)

- Still essential for extracting product physical DNA
- Output guides Sora prompt synthesis
- No changes to agent logic needed
- All outputs still needed (geometry, material, anchor points, lighting)

### ✅ Keep Agent 2.2a (Character Planning) - Simplified

- Still essential for creating character persona recommendations
- Output guides Sora prompt synthesis
- Remove image generation fields from output
- Keep persona details (detailed_persona, cultural_fit, interaction_protocol)

### ✅ Keep Product DNA Outputs

- `geometry_profile`: For product description in prompts
- `material_spec`: For material description in prompts
- `hero_anchor_points`: For shot focus guidance
- `lighting_response`: For lighting descriptions in prompts

### ✅ Keep Character Persona Outputs (Simplified)

- `detailed_persona`: For character appearance description in prompts
- `cultural_fit`: For audience alignment
- `interaction_protocol`: For character-product interaction in prompts
- Remove: `identity_locking`, `image_generation_prompt`, `appearance` (merge into detailed_persona)

---

## What to Remove

### ❌ Remove Character Image Generation

**Current**: Agent 2.2b generates character image for use in shots

**Change Required**: **REMOVE AGENT 2.2B ENTIRELY**
- Character image is not used in Sora generation
- Character is described in prompt, not referenced as image
- Remove Agent 2.2b code and routes

### ❌ Remove Character Image Upload

**Current**: Users can upload character reference images

**Change Required**: **REMOVE CHARACTER UPLOAD**
- Character images not sent to Sora
- Character is described in prompt only
- Remove upload UI and storage logic

### ❌ Remove Logo Section Entirely

**Current**: Logo upload, brand colors, integrity/depth sliders, Agent 2.3

**Change Required**: **REMOVE ALL LOGO FUNCTIONALITY**
- Remove logo upload
- Remove brand colors
- Remove logo integrity slider
- Remove logo depth slider
- Remove Agent 2.3 (Brand Identity Guardian)
- Remove all logo-related UI components
- Remove logo fields from data structures

### ❌ Remove Image Reference Logic for Shots

**Current**: Shots reference product images (hero, macro, material), character image, logo image

**Change Required**: **NO IMAGE REFERENCES IN SORA PROMPTS**
- Sora only receives product hero as first frame
- All other elements (character, logo, macro details) are described in prompt
- Remove image reference logic from prompt synthesis

---

## What to Add

### ➕ Product Hero Dimension Validation

- **Validate product hero matches Sora output dimensions**
- Check: Width 300-2048px, Height 300-2048px
- Check: Dimensions match selected video resolution (1280×720, 720×1280, etc.)
- Show warning if dimensions don't match
- Option: Auto-resize product hero to match output dimensions

**Implementation**:
- Add validation in Tab 2 route
- Check product hero dimensions against `step1Data.videoResolution`
- Show UI warning if mismatch
- Provide resize option if needed

### ➕ First Frame Preparation Logic

- **Prepare product hero as Sora first frame**
- Ensure product hero is always present (required)
- Store product hero URL for Sora API call
- Validate format (JPEG, PNG, WebP)
- Validate file size (max 20MB)

**Implementation**:
- Add first frame preparation in Tab 2 route
- Store `firstFrameUrl` in `step2Data`
- Validate before proceeding to Tab 3

### ➕ Simplified Character Persona Editing

- **Editable persona fields after recommendation selection**
- Display persona details in editable text areas:
  - Detailed Persona (editable textarea)
  - Cultural Fit (editable textarea)
  - Interaction Protocol (editable textarea)
- Allow user to manually edit any field
- Save edited persona to `step2Data.character.persona`

**Implementation**:
- Add persona editing UI after recommendation selection
- Store edited persona in `step2Data.character.persona`
- Use edited persona in Sora prompt synthesis

### ➕ Character Description Extraction

- **Extract character description from Persona for prompts**
- Create helper function to convert Persona to prompt description
- Format: "Character with [detailed_persona], [cultural_fit], [interaction_protocol]"

**Implementation**:
- Add character description formatter
- Use in Sora Prompt Synthesizer (future agent)
- Combine persona fields into prompt text

### ➕ Product Description Extraction

- **Extract product description from Product DNA for prompts**
- Create helper function to convert Product DNA to prompt description
- Format: "Product with [geometry_profile], [material_spec], key features [hero_anchor_points]"

**Implementation**:
- Add product description formatter
- Use in Sora Prompt Synthesizer (future agent)
- Combine `geometry_profile`, `material_spec`, `hero_anchor_points` into prompt text

---

## Implementation Details

### Frontend Changes

**Tab 2 UI Updates**:

1. Product Hero Validation
   - Show dimension requirements based on selected video model + resolution
   - Validate on upload: "Image must be [width]×[height] for selected resolution"
   - Show warning if dimensions don't match
   - Provide resize option: "Resize to match video resolution"
   - Highlight: "This image will be used as the first frame for video generation"

2. Character Section (Simplified)
   - Toggle: "Include Character" (enable/disable)
   - Mode selector: hand-model | full-body | silhouette (when enabled)
   - Button: "AI Recommend Character" (when mode selected)
   - Recommendation cards: Show 3 recommendations with:
     - Name
     - Mode
     - Preview of persona (first 100 chars)
   - Persona editor (after selection):
     - Detailed Persona (editable textarea)
     - Cultural Fit (editable textarea)
     - Interaction Protocol (editable textarea)
   - No image placeholder/display
   - Clear messaging: "Persona details are used to describe character in video prompts"

3. Logo Section
   - **REMOVE ENTIRELY**
   - Remove all logo-related UI components

4. First Frame Indicator
   - Show which image will be used as Sora first frame
   - Highlight product hero: "This image will be used as the first frame for video generation"
   - Show dimension match status

### Backend Changes

**Tab 2 Route Updates**:

1. Product Hero Validation
   ```typescript
   // Validate product hero dimensions match video resolution
   const videoResolution = step1Data.videoResolution; // e.g., "1280×720"
   const heroDimensions = await getImageDimensions(productHeroUrl);
   
   if (!dimensionsMatch(heroDimensions, videoResolution)) {
     // Show warning or auto-resize
   }
   ```

2. First Frame Preparation
   ```typescript
   // Store first frame URL for Sora
   step2Data.firstFrameUrl = productHeroUrl;
   step2Data.firstFrameDimensions = heroDimensions;
   ```

3. Character Recommendations (Simplified)
   ```typescript
   // Agent 2.2a generates recommendations without image fields
   const recommendations = await generateCharacterRecommendations({
     // ... input
     // Remove image generation related fields
   });
   
   // Store selected recommendation's persona
   step2Data.character = {
     mode: selectedRecommendation.mode,
     persona: {
       detailed_persona: selectedRecommendation.detailed_persona,
       cultural_fit: selectedRecommendation.cultural_fit,
       interaction_protocol: selectedRecommendation.interaction_protocol,
     }
   };
   ```

4. Remove Logo Processing
   ```typescript
   // Remove all logo-related code
   // No Agent 2.3 call
   // No logo storage
   ```

**Type Updates**:

```typescript
// Simplified Character Recommendation
export interface CharacterRecommendation {
  id: string;
  name: string;
  mode: 'hand-model' | 'full-body' | 'silhouette';
  detailed_persona: string;
  cultural_fit: string;
  interaction_protocol: {
    product_engagement: string;
    motion_limitations: string;
  };
  // Removed: identity_id, identity_locking, image_generation_prompt, appearance
}

// Updated Step2Data interface
export interface Step2Data {
  product?: {
    images?: {
      heroProfile?: string | null;
      macroDetail?: string | null;
      materialReference?: string | null;
    };
    material?: {
      preset?: string;
      objectMass?: number;
      surfaceComplexity?: number;
      refractionEnabled?: boolean;
      heroFeature?: string;
      originMetaphor?: string;
    };
    dna?: ProductDNAOutput;
  };
  
  character?: {
    mode?: 'hand-model' | 'full-body' | 'silhouette';
    persona?: {
      detailed_persona: string;
      cultural_fit: string;
      interaction_protocol: {
        product_engagement: string;
        motion_limitations: string;
      };
    };
    // Removed: referenceUrl, assetId, aiProfile
  };
  
  // Removed: brand section entirely
  
  // Sora first frame
  firstFrameUrl?: string;
  firstFrameDimensions?: {
    width: number;
    height: number;
  };
}
```

**Agent Updates**:

- **Agent 2.1**: No changes needed
- **Agent 2.2a**: Remove image generation fields from output schema
  - Remove: `identity_id`, `identity_locking`, `image_generation_prompt`, `thumbnail_prompt`
  - Keep: `detailed_persona`, `cultural_fit`, `interaction_protocol`
  - Simplify `appearance` into `detailed_persona`
- **Agent 2.2b**: **REMOVE ENTIRELY**
- **Agent 2.3**: **REMOVE ENTIRELY**

---

## Validation Rules

### Product Hero Requirements

- ✅ Product hero must be present (required)
- ✅ Product hero dimensions must match video resolution
- ✅ Product hero format: JPEG, PNG, or WebP
- ✅ Product hero file size: Maximum 20MB
- ✅ Product hero dimensions: 300-2048px width/height

### Character Persona Requirements

- ✅ If `includeHumanElement` is true, character mode must be selected
- ✅ If character mode selected, user can click "AI Recommend"
- ✅ After recommendation selection, persona must be present
- ✅ User can edit persona fields before proceeding
- ✅ Persona fields are optional (can be empty, but not recommended)

---

## Migration Considerations

### Existing Videos

- Videos created before Sora integration may have:
  - Character images generated
  - Logo images uploaded
  - Brand identity settings
  - Multiple product image references

**Handling**:
- Keep existing data structure (don't break)
- Add `firstFrameUrl` field for new videos
- Ignore old character images and logo data
- Don't break existing workflows

### Default Behavior

- **Product hero**: Always required
- **Character**: Optional, enabled by user
- **Character mode**: Required if character enabled
- **First frame**: Automatically set to product hero
- **Dimension validation**: Show warning, allow continue with mismatch (or auto-resize)

---

## Testing Checklist

- [ ] Product hero validation works (dimensions, format, size)
- [ ] First frame URL stored correctly
- [ ] Character section simplified (no image upload, no image generation)
- [ ] Character recommendations work (3 recommendations with persona only)
- [ ] Persona editing works (user can edit all fields)
- [ ] Logo section removed entirely
- [ ] Character persona extraction works
- [ ] Product DNA extraction works
- [ ] Agent 2.1 still works correctly
- [ ] Agent 2.2a works with simplified output
- [ ] Agent 2.2b removed (no routes/imports)
- [ ] Agent 2.3 removed (no routes/imports)
- [ ] Existing videos don't break
- [ ] UI shows first frame indicator
- [ ] Dimension mismatch warning works

---

## Next Steps

After Tab 2 plan is approved:

1. Create Tab 3 plan (Environment/Story)
2. Create Tab 4 plan (Shot Orchestrator)
3. Create Sora Prompt Synthesizer plan

---

## Questions to Resolve

1. **Product Hero Resize**: Auto-resize on mismatch or show warning only? (Recommendation: Show warning + offer resize)
2. **Dimension Validation**: Block progression if mismatch or allow with warning? (Recommendation: Allow with warning)
3. **Macro/Material Images**: Still analyze for Product DNA but don't send to Sora? (Recommendation: Yes, analyze but don't send)
4. **First Frame Storage**: Store in `step2Data` or `step1Data`? (Recommendation: `step2Data` as it's Tab 2 output)
5. **Persona Editing UI**: Single textarea per field or rich text editor? (Recommendation: Simple textarea)
6. **Character Mode**: Still needed for persona generation? (Recommendation: Yes, guides Agent 2.2a)








