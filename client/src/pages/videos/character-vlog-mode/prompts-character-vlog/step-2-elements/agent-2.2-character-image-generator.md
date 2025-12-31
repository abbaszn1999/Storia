# Agent 2.2: Character Image Generator

## Overview

| Attribute | Value |
|-----------|-------|
| **Role** | Character Portrait Image Generation Executor |
| **Type** | Image Generation Model (Text-to-Image) |
| **Model** | User-selected (Flux, Midjourney, DALL-E, etc.) |
| **Method** | Static prompt template with variable substitution |
| **Purpose** | Generate character portrait images using AI image models |
| **Input Source** | Agent 2.1 (Character Analyzer) output or manual user input |

---

## Inputs

**Primary Source: Agent 2.1 (Character Analyzer) Output**

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| `name` | string | Agent 2.1 output or User | Character name (from `primaryCharacter.name` or `secondaryCharacters[].name`) |
| `appearance` | string | Agent 2.1 output or User | Physical appearance description (from `primaryCharacter.appearance` or `secondaryCharacters[].appearance`) |
| `personality` | string | Agent 2.1 output or User | Personality traits (from `primaryCharacter.personality`, optional, primary character only) |
| `age` | number | Agent 2.1 output or User | Character age (from `primaryCharacter.age` or `secondaryCharacters[].age`, required) |
| `style` | string | Settings | Selected style: preset name or "custom_image" |
| `styleImageUrl` | string | User upload | Style reference image URL (when style is "custom_image") |
| `worldDescription` | string | Settings | World context and atmosphere |
| `aspectRatio` | string | Settings | Image dimensions (e.g., "9:16", "16:9", "1:1") |
| `imageModel` | string | Settings | Selected image model (e.g., "Flux", "Midjourney") |
| `referenceImageUrl` | string | User upload | Optional character reference image URL |

**Note:** When character comes from Agent 2.1, use the full `appearance` field (not `summaryAppearance`). For manually created characters, user provides all fields directly.

### Input Mapping from Agent 2.1

When using Agent 2.1 output:

| Agent 2.1 Output Field | Agent 2.2 Input Field | Notes |
|------------------------|----------------------|-------|
| `primaryCharacter.name` | `name` | Character name |
| `primaryCharacter.appearance` | `appearance` | **Use full appearance, not summaryAppearance** |
| `primaryCharacter.personality` | `personality` | Only for primary characters |
| `primaryCharacter.age` | `age` | Required |
| `secondaryCharacters[].name` | `name` | For secondary characters |
| `secondaryCharacters[].appearance` | `appearance` | **Use full appearance, not summaryAppearance** |
| `secondaryCharacters[].age` | `age` | Required (secondary characters don't have personality) |

**Workflow:**
1. Agent 2.1 analyzes script → outputs character data with `appearance` (full version)
2. User selects character from recommendations or creates manually
3. Agent 2.2 receives character data → builds prompt → generates image
4. Returns `imageUrl` for character card

---

## Output

```json
{
  "imageUrl": "string - URL to generated character portrait"
}
```

---

## Static Prompt Template

```
Portrait of {name}, {appearance}
{personality_visual_interpretation}
{style_keywords}
{world_description}
Aspect ratio: {aspect_ratio}
Professional character portrait, clear facial features, 
centered composition, detailed rendering
{style_image_guidance}
{reference_image_guidance}
```

**Note:** When `styleImageUrl` or `referenceImageUrl` are provided, the prompt should indicate that reference images are being used, and the actual images will be sent to the image model along with the prompt.

---

## Variable Substitution Rules

### 1. Character Subject
- `{name}` → Character name
- `{appearance}` → Full appearance description (from character data)

### 2. Personality Visual Interpretation (if personality provided)
- Only include if `personality` field exists (primary characters)
- Translate personality traits into visual elements:

**ENERGETIC:**
- "Energetic and enthusiastic demeanor, confident posture, bright alert eyes, dynamic stance"

**CALM:**
- "Serene expression, relaxed posture, peaceful demeanor, gentle gaze"

**HUMOROUS:**
- "Playful expression, warm smile, animated features, approachable look"

**SERIOUS:**
- "Focused gaze, composed posture, authoritative presence, professional demeanor"

**MYSTERIOUS:**
- "Enigmatic expression, intriguing features, shadowed aesthetic, captivating presence"

**INSPIRATIONAL:**
- "Confident stance, warm smile, uplifting presence, motivational energy"

**FRIENDLY:**
- "Welcoming smile, approachable style, open body language, warm features"

**ADVENTUROUS:**
- "Rugged appearance, confident posture, explorative energy, bold expression"

### 3. Style Keywords

**If style is preset name:**

**REALISTIC / PHOTOREALISTIC:**
- "Photorealistic, 8K ultra-detailed, professional photography, natural lighting, true-to-life features, high-resolution portrait, DSLR quality, sharp focus, realistic skin texture"

**CINEMATIC:**
- "Cinematic lighting, dramatic shadows, film-quality rendering, cinematic portrait, movie still aesthetic, professional cinematography, depth of field, atmospheric lighting, cinematic composition"

**ILLUSTRATED / ARTISTIC:**
- "Illustrated portrait, artistic interpretation, stylized character design, digital art, concept art style, illustration quality, artistic rendering, creative interpretation"

**3D RENDERED:**
- "3D rendered, CGI quality, perfect symmetry, polished 3D model, rendered character, 3D art style, smooth surfaces, perfect lighting, 3D graphics"

**ANIME / ANIMATED:**
- "Anime style, anime character design, manga art style, anime portrait, Japanese animation style, anime aesthetic, expressive anime features, anime rendering"

**VINTAGE / RETRO:**
- "Vintage portrait, retro aesthetic, classic photography style, period-appropriate styling, nostalgic look, vintage film grain, retro color grading, classic portrait style"

**If style is "custom_image":**
- "Matching the style and aesthetic of the uploaded style reference image, consistent with style reference image, maintaining visual consistency from style reference image"
- **Note:** The style reference image (`styleImageUrl`) will be sent to the image model along with the prompt

### 4. World Description
- `{world_description}` → World description text
- Include atmosphere, lighting, and mood from worldDescription

### 5. Aspect Ratio
- `{aspect_ratio}` → Aspect ratio value (e.g., "9:16", "16:9", "1:1")
- Add composition guidance based on aspect ratio:
  - **9:16**: "Full body portrait, vertical composition, portrait orientation, centered vertical framing"
  - **16:9**: "Wide portrait, environmental portrait, horizontal composition, landscape orientation, wider framing with context"
  - **1:1**: "Square composition, centered portrait, balanced framing, square format, symmetrical composition"
  - **4:3**: "Standard portrait, classic composition, 4:3 aspect ratio, traditional framing"

### 6. Style Image Guidance (if styleImageUrl provided)
- "Using the uploaded style reference image for visual style, matching the aesthetic and rendering technique from the style reference image"
- **Note:** The style reference image will be sent to the image model

### 7. Reference Image Guidance (if referenceImageUrl provided)
- "Using the uploaded character reference image for appearance consistency, matching character features and appearance from the reference image"
- **Note:** The character reference image will be sent to the image model

---

## Process

1. **Build prompt** using static template + variable substitution
2. **Substitute variables** in order:
   - Character name and appearance
   - Personality visual interpretation (if provided)
   - Style keywords (preset or custom image)
   - World description
   - Aspect ratio and composition guidance
   - Style image guidance (if `styleImageUrl` provided)
   - Reference image guidance (if `referenceImageUrl` provided)
3. **Call image generation API** with:
   - Model: `imageModel` (Flux, Midjourney, etc.)
   - Prompt: Built prompt from template
   - Aspect ratio: `aspectRatio`
   - Style reference image: `styleImageUrl` (if style is "custom_image")
   - Character reference image: `referenceImageUrl` (if provided)
   - Negative prompt: "blurry, distorted, low quality, multiple people, text, watermark, logo"
   - **Note:** Both images (style and character reference) are sent to the image model along with the prompt when available
4. **Receive generated image URL** from API
5. **Return image URL** to frontend

---

## Example 1: Primary Character with Personality (Realistic Cinematic)

**Input from Agent 2.1 Output:**
```json
{
  "primaryCharacter": {
    "name": "Narrator",
    "appearance": "Young adult in late 20s with bright, alert eyes showing energetic enthusiasm. Athletic build with dynamic posture suggesting constant motion and vitality. Dressed in modern urban casual wear - fitted jeans, stylish sneaker-boots, layered clothing suitable for city commuting. Expressive face with animated features and warm smile.",
    "personality": "Energetic and enthusiastic, always in motion, builds connections easily, structured and organized",
    "age": 28
  }
}
```

**Agent 2.2 Inputs (extracted from Agent 2.1 output + settings):**
```json
{
  "name": "Narrator",
  "appearance": "Young adult in late 20s with bright, alert eyes showing energetic enthusiasm. Athletic build with dynamic posture suggesting constant motion and vitality. Dressed in modern urban casual wear - fitted jeans, stylish sneaker-boots, layered clothing suitable for city commuting. Expressive face with animated features and warm smile.",
  "personality": "Energetic and enthusiastic, always in motion, builds connections easily, structured and organized",
  "age": 28,
  "style": "Realistic Cinematic",
  "styleImageUrl": null,
  "worldDescription": "Modern city life, warm morning light, bustling urban energy",
  "aspectRatio": "9:16",
  "imageModel": "Flux",
  "referenceImageUrl": null
}
```

**Built Prompt:**
```
Portrait of Narrator, young adult in late 20s with bright, alert eyes showing energetic enthusiasm. Athletic build with dynamic posture suggesting constant motion and vitality. Dressed in modern urban casual wear - fitted jeans, stylish sneaker-boots, layered clothing suitable for city commuting. Expressive face with animated features and warm smile.
Energetic and enthusiastic demeanor, confident posture, bright alert eyes, dynamic stance
Photorealistic, 8K ultra-detailed, professional photography, natural lighting, true-to-life features, high-resolution portrait, DSLR quality, sharp focus, realistic skin texture, cinematic lighting, dramatic shadows, film-quality rendering, cinematic portrait, movie still aesthetic, professional cinematography, depth of field, atmospheric lighting, cinematic composition
Modern city life, warm morning light, bustling urban energy
Aspect ratio: 9:16
Professional character portrait, clear facial features, centered composition, detailed rendering
Full body portrait, vertical composition, portrait orientation, centered vertical framing
```

**Output:**
```json
{
  "imageUrl": "https://example.com/generated-character-portrait.jpg"
}
```

---

## Example 2: Secondary Character (Anime Style)

**Input from Agent 2.1 Output:**
```json
{
  "secondaryCharacters": [
    {
      "name": "Sarah",
      "appearance": "Woman in her mid-30s with warm, professional appearance and welcoming smile. Business casual attire suitable for running a cafe - comfortable yet polished. Natural, friendly expression showing years of customer service experience.",
      "age": 34
    }
  ]
}
```

**Agent 2.2 Inputs (extracted from Agent 2.1 output + settings):**
```json
{
  "name": "Sarah",
  "appearance": "Woman in her mid-30s with warm, professional appearance and welcoming smile. Business casual attire suitable for running a cafe - comfortable yet polished. Natural, friendly expression showing years of customer service experience.",
  "personality": null,
  "age": 34,
  "style": "Anime Style",
  "styleImageUrl": null,
  "worldDescription": "Modern city life, warm morning light, bustling urban energy",
  "aspectRatio": "1:1",
  "imageModel": "Flux",
  "referenceImageUrl": null
}
```

**Built Prompt:**
```
Portrait of Sarah, woman in her mid-30s with warm, professional appearance and welcoming smile. Business casual attire suitable for running a cafe - comfortable yet polished. Natural, friendly expression showing years of customer service experience.
Anime style, anime character design, manga art style, anime portrait, Japanese animation style, anime aesthetic, expressive anime features, anime rendering
Modern city life, warm morning light, bustling urban energy
Aspect ratio: 1:1
Professional character portrait, clear facial features, centered composition, detailed rendering
Square composition, centered portrait, balanced framing, square format, symmetrical composition
```

**Output:**
```json
{
  "imageUrl": "https://example.com/generated-character-portrait-2.jpg"
}
```

---

## Example 3: Primary Character with Custom Image Style + Reference

**Inputs:**
```json
{
  "name": "Elena",
  "appearance": "Young woman in mid-20s with confident, adventurous stance and determined expression. Rugged outdoor clothing including practical hiking boots, weather-resistant jacket, and cargo pants with multiple pockets. Athletic build suggesting physical fitness and outdoor experience.",
  "personality": "Adventurous and bold, determined and fearless, driven by curiosity",
  "age": 25,
  "style": "custom_image",
  "styleImageUrl": "https://example.com/style-reference-image.jpg",
  "worldDescription": "Mystical ancient forest, dappled light through trees, magical atmosphere",
  "aspectRatio": "16:9",
  "imageModel": "Flux",
  "referenceImageUrl": "https://example.com/character-reference-image.jpg"
}
```

**Built Prompt:**
```
Portrait of Elena, young woman in mid-20s with confident, adventurous stance and determined expression. Rugged outdoor clothing including practical hiking boots, weather-resistant jacket, and cargo pants with multiple pockets. Athletic build suggesting physical fitness and outdoor experience.
Rugged appearance, confident posture, explorative energy, bold expression
Matching the style and aesthetic of the uploaded style reference image, consistent with style reference image, maintaining visual consistency from style reference image
Mystical ancient forest, dappled light through trees, magical atmosphere
Aspect ratio: 16:9
Professional character portrait, clear facial features, centered composition, detailed rendering
Wide portrait, environmental portrait, horizontal composition, landscape orientation, wider framing with context
Using the uploaded style reference image for visual style, matching the aesthetic and rendering technique from the style reference image
Using the uploaded character reference image for appearance consistency, matching character features and appearance from the reference image
```

**Note:** Both `styleImageUrl` and `referenceImageUrl` will be sent to the image model along with this prompt.

**Output:**
```json
{
  "imageUrl": "https://example.com/generated-character-portrait-3.jpg"
}
```

---

## Example 4: Calm Personality (Soft Illustrated)

**Inputs:**
```json
{
  "name": "Narrator",
  "appearance": "Person in their 30s-40s with serene, peaceful expression and soft features. Relaxed, flowing posture suggesting complete ease and mindfulness. Dressed in comfortable, muted-color casual wear - soft cardigan or light jacket, loose-fitting pants, comfortable walking shoes.",
  "personality": "Calm and mindful, contemplative and serene, appreciates quiet moments",
  "age": 36,
  "style": "Soft Illustrated",
  "styleImageUrl": null,
  "worldDescription": "Tranquil park setting, soft morning light, peaceful atmosphere",
  "aspectRatio": "9:16",
  "imageModel": "Flux",
  "referenceImageUrl": null
}
```

**Built Prompt:**
```
Portrait of Narrator, person in their 30s-40s with serene, peaceful expression and soft features. Relaxed, flowing posture suggesting complete ease and mindfulness. Dressed in comfortable, muted-color casual wear - soft cardigan or light jacket, loose-fitting pants, comfortable walking shoes.
Serene expression, relaxed posture, peaceful demeanor, gentle gaze
Illustrated portrait, artistic interpretation, stylized character design, digital art, concept art style, illustration quality, artistic rendering, creative interpretation
Tranquil park setting, soft morning light, peaceful atmosphere
Aspect ratio: 9:16
Professional character portrait, clear facial features, centered composition, detailed rendering
Full body portrait, vertical composition, portrait orientation, centered vertical framing
```

**Output:**
```json
{
  "imageUrl": "https://example.com/generated-character-portrait-4.jpg"
}
```

---

## Implementation Notes

### Prompt Building
- Use exact template structure
- Substitute variables in order
- Skip personality section if `personality` is null/empty
- Skip style image guidance if `styleImageUrl` is null/empty (or style is not "custom_image")
- Skip reference image guidance if `referenceImageUrl` is null/empty

### Style Handling
- Check if `style` is "custom_image" → use custom image keywords and include `styleImageUrl`
- Otherwise, map preset style name to keyword set
- Default to "Photorealistic" if style not recognized

### Image Model API Call
- Use `imageModel` parameter to select API endpoint
- Pass built prompt as `positivePrompt`
- Pass aspect ratio dimensions (calculate from `aspectRatio` string)
- Include `styleImageUrl` in API call if style is "custom_image" (style reference image)
- Include `referenceImageUrl` in API call if provided (character reference image)
- **Both images are sent to the model when available** (style image + character reference image)
- Include negative prompt: "blurry, distorted, low quality, multiple people, text, watermark, logo"

### Error Handling
- If image generation fails, return error message
- Retry logic (optional): 1 retry on failure
- Timeout: 60 seconds maximum

---

## Notes

### Template Structure
- Static template ensures consistency
- Variable substitution is deterministic
- No AI model needed for prompt building (just substitution)

### Personality Application
- Only apply when `personality` field is provided
- Use predefined personality-to-visual mappings
- Secondary characters typically don't have personality field

### Reference Image Support
- **Style Reference Image**: When `style` is "custom_image" and `styleImageUrl` is provided, the style reference image is sent to the model
- **Character Reference Image**: When `referenceImageUrl` is provided, the character reference image is sent to the model
- Both images can be sent simultaneously (style image + character reference image)
- Use image-to-image generation when reference images are provided
- Pass all reference images to API along with prompt
- Ensure API supports multiple reference image inputs

### Aspect Ratio Calculation
- Convert aspect ratio string to dimensions:
  - "9:16" → width: 576, height: 1024
  - "16:9" → width: 1920, height: 1080
  - "1:1" → width: 1024, height: 1024
  - "4:3" → width: 1024, height: 768

### Model Compatibility
- Different models may require different prompt formats
- Adjust template slightly if needed for specific models
- Maintain core structure across all models

