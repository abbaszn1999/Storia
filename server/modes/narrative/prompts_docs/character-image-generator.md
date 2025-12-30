# Agent 2.3: Character Image Generator - Enhanced Prompt Template

## Overview

**Agent 2.3: CHARACTER IMAGE GENERATOR** uses a **static prompt template** with variables that are filled in from character data. This document defines the enhanced prompt template structure and how variables should be integrated.

**Important Note**: This agent does **NOT** use an AI model to generate prompts. It uses a **template-based approach** where character data (name, appearance, personality, art style) is inserted into a predefined prompt structure using string interpolation.

---

## Template Purpose

The prompt template transforms character data into optimized image generation prompts that produce consistent, high-quality character reference portraits. The template must:

1. **Maintain Visual Consistency**: Enable the same character to be recognized across multiple images
2. **Reflect Personality**: Capture character traits through pose, expression, and composition
3. **Integrate Art Style**: Seamlessly incorporate the selected art style
4. **Optimize for Models**: Work effectively across different image generation models (Flux, Midjourney, Nano Banana, GPT Image)
5. **Produce Professional Quality**: Generate reference images suitable for production use

---

## Workflow Context

This agent operates in the **"World & Cast" step** of a video creation workflow. It receives:

- **Input**: Character data from Agent 2.1 (Character Analyzer) or user-created characters
- **Output**: Optimized image generation prompt + negative prompt (via template filling)

The generated prompts are used by:
- **Image Generation API** (Runware): Generates the actual character portrait
- **Storyboard Generation**: Character reference images maintain consistency across shots
- **Video Generation**: Character appearance remains consistent throughout the video

---

## Input Requirements

The template function receives these inputs:

### Required Fields
- **name**: Character name (e.g., "Sarah", "Dr. Maya Lee")
- **appearance**: Physical description (age, build, hair, clothing, distinctive features)

### Optional Fields
- **personality**: Behavioral traits (e.g., "shy but determined", "sarcastic and loyal")
- **artStyleDescription**: Art style from Agent 2.5 (e.g., "watercolor painting style with soft edges")
- **referenceImages**: Array of character reference image URLs (for consistency)
- **styleReferenceImage**: Style reference image URL (for art style)
- **model**: Image generation model (default: "nano-banana")
- **negativePrompt**: Custom negative prompt (optional, uses default if not provided)

---

## Prompt Template Architecture: 6-Layer Structure

The static prompt template follows this layered architecture. Variables are inserted at appropriate points:

### LAYER 1: CHARACTER SUBJECT DEFINITION
**Purpose**: Establish who we're creating a portrait of

**Template Structure:**
```
Character reference portrait of ${name}, ${appearance}.
```

**Variable Usage:**
- `${name}` - Character name (required, always included)
- `${appearance}` - Physical description (required, always included)

**Guidelines:**
- Start with "Character reference portrait of" to establish purpose
- Include character name for context
- Use the exact appearance description provided
- Keep it concise but complete

**Examples:**
- ✅ "Character reference portrait of Sarah, a young woman in her late twenties with shoulder-length brown hair and green eyes, wearing practical hiking gear."
- ✅ "Character reference portrait of Dr. Maya Lee, a professional woman in her thirties or forties wearing a crisp white lab coat."
- ❌ "A person with brown hair" (too vague, missing name)

---

### LAYER 2: PERSONALITY INTEGRATION
**Purpose**: Reflect character personality through visual cues

**Template Structure:**
```
${personality ? `\nPersonality: ${personality}.` : ''}
```

**Variable Usage:**
- `${personality}` - Behavioral traits (optional, conditionally included)

**Conditional Logic:**
- Only include if `personality` is provided and not empty
- Prepend with "Personality: " label
- Add period at end

**Guidelines:**
- Translate personality traits into visual elements when possible
- Keep it brief (1-2 sentences max)
- Focus on traits that affect visual appearance

**Examples:**
- ✅ "Personality: Professional, methodical, and observant."
- ✅ "Personality: Shy but determined, with a gentle expression that shows inner strength."
- ❌ "Personality: She likes pizza and has a dog" (not visual, not relevant)

---

### LAYER 3: ART STYLE INTEGRATION
**Purpose**: Apply the selected art style consistently

**Template Structure:**
```
${artStyleDescription ? `\n${artStyleDescription}` : ''}
```

**Variable Usage:**
- `${artStyleDescription}` - Art style from Agent 2.5 (optional, conditionally included)

**Conditional Logic:**
- Only include if `artStyleDescription` is provided and not empty
- Use exact description from Agent 2.5
- Place after personality, before composition

**Guidelines:**
- Use the exact description from Agent 2.5
- Ensure style doesn't conflict with portrait requirements
- Place after personality layer

**Examples:**
- ✅ "Watercolor painting style with soft edges and muted colors."
- ✅ "Digital art style with clean lines and vibrant colors, anime-inspired character design."
- ❌ "Make it look good" (too vague)

---

### LAYER 4: COMPOSITION & FRAMING
**Purpose**: Define the portrait composition and camera angle

**Template Structure:**
```
Square 1:1 waist-up composition, character centered in the frame, facing slightly toward the viewer with a natural pose that reflects their personality.
```

**Static Component**: This layer is always included (no variables)

**Guidelines:**
- **Aspect Ratio**: Always "Square 1:1" (1024x1024 for character portraits)
- **Framing**: "waist-up composition" (shows head, shoulders, upper torso)
- **Positioning**: "character centered in the frame"
- **Pose**: "natural pose that reflects their personality" (generic, works for all)
- **Camera Angle**: "facing slightly toward the viewer"

**Note**: The pose description is generic ("natural pose that reflects their personality") to work for all characters. More specific pose descriptions could be added based on personality if needed.

---

### LAYER 5: LIGHTING & ATMOSPHERE
**Purpose**: Create professional portrait lighting

**Template Structure:**
```
Soft studio lighting with gentle key light and subtle rim light, clean and flattering, with clear detail in face, hair, and clothing.
```

**Static Component**: This layer is always included (no variables)

**Guidelines:**
- Use professional portrait lighting terminology
- Ensure lighting is flattering and clear
- Keep it professional and clean
- Standard lighting setup works for all character types

**Lighting Description:**
- "Soft studio lighting" - Professional, flattering
- "Gentle key light" - Main light source
- "Subtle rim light" - Edge highlight for separation
- "Clean and flattering" - Mood description
- "Clear detail in face, hair, and clothing" - Quality requirement

---

### LAYER 6: QUALITY & TECHNICAL SPECIFICATIONS
**Purpose**: Ensure high-quality output

**Template Structure:**
```
Minimal, uncluttered neutral studio background with a soft gradient, cinematic but simple composition, high-resolution, finely detailed, consistent character design.
```

**Static Component**: This layer is always included (no variables)

**Components:**
- **Background**: "Minimal, uncluttered neutral studio background with a soft gradient"
- **Composition**: "Cinematic but simple composition"
- **Quality Keywords**: "High-resolution, finely detailed, consistent character design"

**Quality Keywords Included:**
- "High-resolution"
- "Finely detailed"
- "Consistent character design"
- "Cinematic but simple composition"

---

## Complete Prompt Template Structure

Here's the complete template structure with variable placeholders:

```typescript
function buildCharacterPrompt(input: CharacterImageInput): string {
  const { name, appearance, personality, artStyleDescription } = input;

  // Layer 1: Character Subject Definition
  let prompt = `Character reference portrait of ${name}, ${appearance}.`;

  // Layer 2: Personality Integration (conditional)
  if (personality && personality.trim()) {
    prompt += `\nPersonality: ${personality}.`;
  }

  // Layer 3: Art Style Integration (conditional)
  if (artStyleDescription && artStyleDescription.trim()) {
    prompt += `\n${artStyleDescription}`;
  }

  // Layer 4: Composition & Framing (static)
  // Layer 5: Lighting & Atmosphere (static)
  // Layer 6: Quality & Technical Specifications (static)
  prompt += `\nSquare 1:1 waist-up composition, character centered in the frame, facing slightly toward the viewer with a natural pose that reflects their personality. Soft studio lighting with gentle key light and subtle rim light, clean and flattering, with clear detail in face, hair, and clothing. Minimal, uncluttered neutral studio background with a soft gradient, cinematic but simple composition, high-resolution, finely detailed, consistent character design.`;

  return prompt;
}
```

**Template Variables:**
- `${name}` - Character name (required, always included)
- `${appearance}` - Physical description (required, always included)
- `${personality}` - Behavioral traits (optional, conditionally included)
- `${artStyleDescription}` - Art style from Agent 2.5 (optional, conditionally included)

**Static Components:**
- Composition guidelines (always appended)
- Lighting description (always appended)
- Background description (always appended)
- Quality keywords (always appended)

---

## Template Implementation

### Current Implementation Location
The template is implemented in:
- **File**: `server/assets/characters/agents/character-image-generator.ts`
- **Function**: `buildCharacterPrompt(input: CharacterImageInput): string`

### Template Function Logic
1. Takes character data as input (`CharacterImageInput`)
2. Fills in required variables (name, appearance)
3. Conditionally includes optional variables (personality, artStyleDescription)
4. Appends static composition, lighting, and quality guidelines
5. Returns the complete prompt string

### Variable Handling
- **Required Variables**: Always included (name, appearance)
- **Optional Variables**: Only included if provided and not empty
- **Conditional Logic**: Uses `if` statements to check for optional fields
- **String Interpolation**: Uses template literals (backticks) for variable insertion

---

## Negative Prompt Strategy

### Default Negative Prompt

The default negative prompt is defined as a constant:

```typescript
export const DEFAULT_CHARACTER_NEGATIVE_PROMPT = 
  "blurry, low quality, distorted face, extra limbs, watermark, text, " +
  "multiple characters, cropped, out of frame, bad anatomy, deformed, " +
  "disfigured, mutated, ugly, duplicate, morbid, mutilated";
```

### When to Customize

The negative prompt can be customized per request:
- Character has specific features to avoid (e.g., "no glasses" if character shouldn't have them)
- Art style requires specific exclusions
- Model-specific issues need addressing

### Negative Prompt Categories

**Quality Issues:**
- "blurry, low quality, distorted, pixelated, grainy"

**Anatomy Problems:**
- "bad anatomy, deformed, disfigured, extra limbs, missing limbs, mutated"

**Composition Issues:**
- "cropped, out of frame, multiple characters, duplicate"

**Unwanted Elements:**
- "watermark, text, logo, signature"

**Character-Specific:**
- Add specific exclusions based on character description (e.g., "no beard" if character is clean-shaven)

---

## Reference Image Integration

### Character Reference Images

**Purpose**: Maintain visual consistency across generations

**Usage:**
- Passed separately to image generation API (not in text prompt)
- Include up to 8 reference images (model-dependent)
- Use character reference images from previous generations
- Helps maintain facial features, hair, clothing style

**Implementation:**
- Reference images are passed as an array to the image generation API
- Combined with style reference image if provided
- Not included in the text prompt template

### Style Reference Images

**Purpose**: Apply consistent art style

**Usage:**
- Passed separately to image generation API (not in text prompt)
- Include style reference image from Agent 2.5
- Helps maintain art style consistency
- Can be combined with character references

**Implementation:**
- Style reference image is passed separately to the API
- Combined with character reference images
- Not included in the text prompt template

---

## Model-Specific Considerations

### Nano Banana (Default)
- Supports up to 8 reference images
- Good character consistency
- Works well with detailed prompts
- Square 1:1 portraits work excellently

### Flux
- Strong character consistency
- Supports reference images
- Responds well to detailed descriptions
- High-quality output

### Midjourney
- Excellent artistic quality
- Supports style references well
- May need more artistic language in prompts
- Strong composition understanding

### GPT Image (DALL-E)
- Good character consistency
- Supports reference images
- Clear, descriptive prompts work best
- Professional quality output

---

## Template Examples

### Example 1: Simple Character (No Personality, No Art Style)

**Input Variables:**
```typescript
{
  name: "Sarah",
  appearance: "A young woman in her late twenties with shoulder-length brown hair and green eyes, wearing practical hiking gear—khaki pants, a worn leather jacket, and sturdy boots. Has a small scar above her left eyebrow."
  // personality: undefined (not provided)
  // artStyleDescription: undefined (not provided)
}
```

**Template Output (Filled):**
```
Character reference portrait of Sarah, a young woman in her late twenties with shoulder-length brown hair and green eyes, wearing practical hiking gear—khaki pants, a worn leather jacket, and sturdy boots. Has a small scar above her left eyebrow.
Square 1:1 waist-up composition, character centered in the frame, facing slightly toward the viewer with a natural pose that reflects their personality. Soft studio lighting with gentle key light and subtle rim light, clean and flattering, with clear detail in face, hair, and clothing. Minimal, uncluttered neutral studio background with a soft gradient, cinematic but simple composition, high-resolution, finely detailed, consistent character design.
```

**Analysis:**
- ✅ Includes character name and full appearance (Layer 1)
- ✅ Personality layer skipped (not provided)
- ✅ Art style layer skipped (not provided)
- ✅ Square 1:1 waist-up composition specified (Layer 4)
- ✅ Professional lighting described (Layer 5)
- ✅ Quality keywords included (Layer 6)
- ✅ Clean background specified (Layer 6)

---

### Example 2: Character with Personality

**Input Variables:**
```typescript
{
  name: "Dr. Maya Lee",
  appearance: "A professional woman wearing a crisp white lab coat. Likely in her thirties or forties, with a serious, focused expression. Professional appearance suitable for a laboratory setting.",
  personality: "Professional, methodical, and observant. Maintains composure under pressure and demonstrates leadership qualities."
  // artStyleDescription: undefined (not provided)
}
```

**Template Output (Filled):**
```
Character reference portrait of Dr. Maya Lee, a professional woman wearing a crisp white lab coat. Likely in her thirties or forties, with a serious, focused expression. Professional appearance suitable for a laboratory setting.
Personality: Professional, methodical, and observant. Maintains composure under pressure and demonstrates leadership qualities.
Square 1:1 waist-up composition, character centered in the frame, facing slightly toward the viewer with a natural pose that reflects their personality. Soft studio lighting with gentle key light and subtle rim light, clean and flattering, with clear detail in face, hair, and clothing. Minimal, uncluttered neutral studio background with a soft gradient, cinematic but simple composition, high-resolution, finely detailed, consistent character design.
```

**Analysis:**
- ✅ Includes personality layer (Layer 2)
- ✅ Personality included as provided (no transformation needed)
- ✅ Art style layer skipped (not provided)
- ✅ All other layers included
- ✅ Template correctly handles conditional inclusion

---

### Example 3: Character with Art Style

**Input Variables:**
```typescript
{
  name: "Elias",
  appearance: "An elderly man with weathered hands, showing signs of age. Likely in his sixties or seventies, dressed in simple, comfortable clothing suitable for visiting a place from his past.",
  personality: "Nostalgic, reflective, and emotionally connected to his past.",
  artStyleDescription: "Watercolor painting style with soft edges, muted colors, and gentle brushstrokes. Nostalgic and dreamy atmosphere with a vintage feel."
}
```

**Template Output (Filled):**
```
Character reference portrait of Elias, an elderly man with weathered hands, showing signs of age. Likely in his sixties or seventies, dressed in simple, comfortable clothing suitable for visiting a place from his past.
Personality: Nostalgic, reflective, and emotionally connected to his past.
Watercolor painting style with soft edges, muted colors, and gentle brushstrokes. Nostalgic and dreamy atmosphere with a vintage feel.
Square 1:1 waist-up composition, character centered in the frame, facing slightly toward the viewer with a natural pose that reflects their personality. Soft studio lighting with gentle key light and subtle rim light, clean and flattering, with clear detail in face, hair, and clothing. Minimal, uncluttered neutral studio background with a soft gradient, cinematic but simple composition, high-resolution, finely detailed, consistent character design.
```

**Analysis:**
- ✅ Includes all layers (subject, personality, art style, composition, lighting, quality)
- ✅ Art style integrated naturally (Layer 3)
- ✅ Personality included as provided (Layer 2)
- ✅ All technical specifications included (Layers 4-6)
- ✅ Template correctly handles all conditional fields

---

## Quality Standards

### Portrait Requirements

1. **Consistency**: Character must be recognizable across multiple generations
2. **Clarity**: Face, hair, and clothing must be clearly visible and detailed
3. **Composition**: Character centered, waist-up, properly framed
4. **Lighting**: Professional, flattering, clear detail
5. **Background**: Clean, uncluttered, doesn't distract from character
6. **Style**: Matches art style description if provided

### Common Issues to Avoid

1. **Inconsistent Features**: Character looks different in each generation
   - **Solution**: Use reference images, be specific in appearance description

2. **Poor Composition**: Character off-center, cropped, or poorly framed
   - **Solution**: Always specify "centered in the frame, waist-up composition"

3. **Bad Lighting**: Harsh shadows, unclear features, unflattering light
   - **Solution**: Use "soft studio lighting" with key, fill, and rim lights

4. **Cluttered Background**: Distracting elements, busy backgrounds
   - **Solution**: Specify "minimal, uncluttered neutral studio background"

5. **Low Quality**: Blurry, pixelated, or distorted images
   - **Solution**: Include quality keywords and use appropriate negative prompt

---

## Template Optimization Tips

### For Better Consistency

1. **Be Specific in Appearance**: Include all distinctive features (scars, eye color, hair style)
2. **Use Reference Images**: Include character reference images when available (passed to API)
3. **Consistent Terminology**: Use the same descriptive terms across generations
4. **Complete Appearance Data**: Ensure appearance field from Character Analyzer is detailed

### For Better Quality

1. **Quality Keywords**: Always include "high-resolution, finely detailed" (in static layer)
2. **Professional Terms**: Use photography/art terminology (in static layers)
3. **Clear Structure**: Follow the 6-layer architecture
4. **Appropriate Negative Prompt**: Use default or customize as needed

### For Art Style Integration

1. **Placement**: Art style goes after personality, before composition (Layer 3)
2. **Compatibility**: Ensure art style doesn't conflict with portrait requirements
3. **Style Reference**: Use style reference image when available (passed to API)
4. **Balance**: Don't let style override character consistency

---

## Technical Specifications

### Image Dimensions
- **Width**: 1024 pixels
- **Height**: 1024 pixels
- **Aspect Ratio**: 1:1 (square)
- **Format**: JPEG, PNG, or WebP (model-dependent)

### Composition Guidelines
- **Framing**: Waist-up (head, shoulders, upper torso)
- **Positioning**: Centered in frame
- **Camera Angle**: Slightly toward viewer
- **Background**: Minimal, neutral, soft gradient

### Lighting Specifications
- **Type**: Soft studio lighting
- **Key Light**: Gentle, flattering
- **Fill Light**: Subtle, reduces harsh shadows
- **Rim Light**: Subtle edge highlight
- **Mood**: Clean, professional, clear detail

---

## Error Prevention

### Common Template Mistakes

1. **Missing Character Name**
   - ❌ Template: `"Character reference portrait of ${appearance}."`
   - ✅ Template: `"Character reference portrait of ${name}, ${appearance}."`

2. **Not Checking Optional Fields**
   - ❌ Always including personality even when undefined
   - ✅ Using conditional: `${personality ? `\nPersonality: ${personality}.` : ''}`

3. **Incorrect Variable Order**
   - ❌ Art style before personality
   - ✅ Correct order: name/appearance → personality → art style → static layers

4. **Missing Static Layers**
   - ❌ Only including variables, missing composition/lighting/quality
   - ✅ Always append static layers after variables

5. **Poor String Formatting**
   - ❌ Missing newlines between layers
   - ✅ Use `\n` to separate layers for readability

---

## Template Enhancement Recommendations

### Potential Improvements

1. **Personality-Based Pose Variation**
   - Currently uses generic "natural pose that reflects their personality"
   - Could add personality-based pose descriptions:
     - Shy → "gentle pose with hands resting naturally"
     - Confident → "open, confident pose with direct gaze"
     - Professional → "upright, composed pose"

2. **Enhanced Art Style Integration**
   - Currently just inserts art style description
   - Could add compatibility checks or style-specific adjustments

3. **Model-Specific Optimizations**
   - Currently uses same template for all models
   - Could add model-specific prompt adjustments

4. **Dynamic Quality Keywords**
   - Currently uses static quality keywords
   - Could vary based on model or user preferences

---

**This template structure ensures consistent, high-quality character portrait generation across all use cases.**
