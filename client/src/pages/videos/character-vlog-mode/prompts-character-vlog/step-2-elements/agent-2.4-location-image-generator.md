# Agent 2.4: Location Image Generator

## Overview

| Attribute | Value |
|-----------|-------|
| **Role** | Location Environment Image Generation Executor |
| **Type** | Image Generation Model (Text-to-Image) |
| **Model** | User-selected (Flux, Midjourney, DALL-E, etc.) |
| **Method** | Static prompt template with variable substitution |
| **Purpose** | Generate location environment images using AI image models |
| **Input Source** | Agent 2.3 (Location Analyzer) output or manual user input |

---

## Inputs

**Primary Source: Agent 2.3 (Location Analyzer) Output**

| Input | Type | Source | Description |
|-------|------|--------|-------------|
| `name` | string | Agent 2.3 output or User | Location name (from `locations[].name`) |
| `description` | string | Agent 2.3 output or User | Brief description (from `locations[].description`) |
| `details` | string | Agent 2.3 output or User | Visual details (from `locations[].details`) |
| `style` | string | Settings | Selected style: preset name or "custom_image" |
| `styleImageUrl` | string | User upload | Style reference image URL (when style is "custom_image") |
| `worldDescription` | string | Settings | World context and atmosphere |
| `aspectRatio` | string | Settings | Image dimensions (e.g., "9:16", "16:9", "1:1") |
| `imageModel` | string | Settings | Selected image model (e.g., "Flux", "Midjourney") |
| `referenceImageUrl` | string | User upload | Optional location reference image URL |

**Note:** When location comes from Agent 2.3, use the `description` and `details` fields directly. For manually created locations, user provides all fields directly.

### Input Mapping from Agent 2.3

When using Agent 2.3 output:

| Agent 2.3 Output Field | Agent 2.4 Input Field | Notes |
|------------------------|----------------------|-------|
| `locations[].name` | `name` | Location name |
| `locations[].description` | `description` | Brief description (30-50 words) |
| `locations[].details` | `details` | Visual details (50-100 words) |

**Workflow:**
1. Agent 2.3 analyzes script → outputs location data with `description` and `details`
2. User selects location from recommendations or creates manually
3. Agent 2.4 receives location data → builds prompt → generates image
4. Returns `imageUrl` for location card

---

## Output

```json
{
  "imageUrl": "string - URL to generated location environment image"
}
```

---

## Static Prompt Template

```
Environment shot of {name}, {description}
{details}
{style_keywords}
{world_description}
Aspect ratio: {aspect_ratio}
Architectural photography, environmental shot, atmospheric lighting,
detailed rendering, depth of field, professional composition
{style_image_guidance}
{reference_image_guidance}
```

**Note:** When `styleImageUrl` or `referenceImageUrl` are provided, the prompt should indicate that reference images are being used, and the actual images will be sent to the image model along with the prompt.

---

## Variable Substitution Rules

### 1. Location Subject
- `{name}` → Location name
- `{description}` → Brief description (30-50 words)
- `{details}` → Visual details (50-100 words)

### 2. Style Keywords

**If style is preset name:**

**REALISTIC / PHOTOREALISTIC:**
- "Photorealistic, 8K ultra-detailed, professional photography, natural lighting, true-to-life features, high-resolution, DSLR quality, sharp focus, realistic textures"

**CINEMATIC:**
- "Cinematic lighting, dramatic shadows, film-quality rendering, cinematic composition, movie still aesthetic, professional cinematography, depth of field, atmospheric lighting"

**ILLUSTRATED / ARTISTIC:**
- "Illustrated environment, artistic interpretation, stylized design, digital art, concept art style, illustration quality, artistic rendering, creative interpretation"

**3D RENDERED:**
- "3D rendered, CGI quality, perfect symmetry, polished 3D model, rendered environment, 3D art style, smooth surfaces, perfect lighting, 3D graphics"

**ANIME / ANIMATED:**
- "Anime style, anime environment design, manga art style, anime aesthetic, Japanese animation style, expressive anime features, anime rendering"

**VINTAGE / RETRO:**
- "Vintage environment, retro aesthetic, classic photography style, period-appropriate styling, nostalgic look, vintage film grain, retro color grading, classic style"

**If style is "custom_image":**
- "Matching the style and aesthetic of the uploaded style reference image, consistent with style reference image, maintaining visual consistency from style reference image"

### 3. World Description
- `{world_description}` → World description text
- Include atmosphere, lighting, and mood from worldDescription

### 4. Aspect Ratio
- `{aspect_ratio}` → Aspect ratio value (e.g., "9:16", "16:9", "1:1")
- Add composition guidance based on aspect ratio:
  - **9:16**: "Vertical composition, portrait orientation, tall framing, environmental depth"
  - **16:9**: "Wide composition, landscape orientation, cinematic framing, environmental context"
  - **1:1**: "Square composition, balanced framing, square format, centered environment"
  - **4:3**: "Standard composition, classic framing, 4:3 aspect ratio, traditional format"

### 5. Style Image Guidance (if styleImageUrl provided)
- "Using the uploaded style reference image for visual style, matching the aesthetic and rendering technique from the style reference image"
- **Note:** The style reference image will be sent to the image model

### 6. Reference Image Guidance (if referenceImageUrl provided)
- "Using the uploaded location reference image for appearance consistency, matching location features and atmosphere from the reference image"
- **Note:** The location reference image will be sent to the image model

---

## Process

1. **Build prompt** using static template + variable substitution
2. **Substitute variables** in order:
   - Location name, description, and details
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
   - Location reference image: `referenceImageUrl` (if provided)
   - **Note:** Both images are sent to the model when available (style image + location reference image)
   - Negative prompt: "blurry, distorted, low quality, people, text, watermark, logo"
4. **Receive generated image URL** from API
5. **Return image URL** to frontend

---

## Example 1: Urban Coffee Shop (Preset Style)

**Input from Agent 2.3 Output:**
```json
{
  "locations": [
    {
      "name": "Downtown Coffee Shop",
      "description": "A cozy urban cafe with warm atmosphere and modern interior, perfect for casual conversations and morning routines.",
      "details": "Large windows showing city street, wooden tables, exposed brick walls, warm lighting from hanging Edison bulbs, espresso machine sounds, comfortable booth seating, morning sunlight streaming through windows, urban energy visible outside"
    }
  ]
}
```

**Agent 2.4 Inputs (extracted from Agent 2.3 output + settings):**
```json
{
  "name": "Downtown Coffee Shop",
  "description": "A cozy urban cafe with warm atmosphere and modern interior, perfect for casual conversations and morning routines.",
  "details": "Large windows showing city street, wooden tables, exposed brick walls, warm lighting from hanging Edison bulbs, espresso machine sounds, comfortable booth seating, morning sunlight streaming through windows, urban energy visible outside",
  "style": "Realistic Cinematic",
  "styleImageUrl": null,
  "worldDescription": "Modern city life, warm morning light, bustling urban energy",
  "aspectRatio": "16:9",
  "imageModel": "Flux",
  "referenceImageUrl": null
}
```

**Built Prompt:**
```
Environment shot of Downtown Coffee Shop, a cozy urban cafe with warm atmosphere and modern interior, perfect for casual conversations and morning routines.
Large windows showing city street, wooden tables, exposed brick walls, warm lighting from hanging Edison bulbs, espresso machine sounds, comfortable booth seating, morning sunlight streaming through windows, urban energy visible outside
Photorealistic, 8K ultra-detailed, professional photography, natural lighting, true-to-life features, high-resolution, DSLR quality, sharp focus, realistic textures, cinematic lighting, dramatic shadows, film-quality rendering, cinematic composition, movie still aesthetic, professional cinematography, depth of field, atmospheric lighting
Modern city life, warm morning light, bustling urban energy
Aspect ratio: 16:9
Architectural photography, environmental shot, atmospheric lighting, detailed rendering, depth of field, professional composition
Wide composition, landscape orientation, cinematic framing, environmental context
```

**Output:**
```json
{
  "imageUrl": "https://example.com/generated-location-image.jpg"
}
```

---

## Example 2: Nature Forest Trail (Anime Style)

**Input from Agent 2.3 Output:**
```json
{
  "locations": [
    {
      "name": "Forest Trail",
      "description": "A winding forest trail through natural landscapes, providing exploration opportunities and scenic beauty.",
      "details": "Dirt path winding through trees, dappled sunlight filtering through canopy, natural vegetation on both sides, peaceful atmosphere, golden hour lighting creating warm patches, adventure exploration setting, natural outdoor environment"
    }
  ]
}
```

**Agent 2.4 Inputs (extracted from Agent 2.3 output + settings):**
```json
{
  "name": "Forest Trail",
  "description": "A winding forest trail through natural landscapes, providing exploration opportunities and scenic beauty.",
  "details": "Dirt path winding through trees, dappled sunlight filtering through canopy, natural vegetation on both sides, peaceful atmosphere, golden hour lighting creating warm patches, adventure exploration setting, natural outdoor environment",
  "style": "Anime Style",
  "styleImageUrl": null,
  "worldDescription": "Natural landscapes, golden hour lighting, peaceful outdoor atmosphere",
  "aspectRatio": "9:16",
  "imageModel": "Flux",
  "referenceImageUrl": null
}
```

**Built Prompt:**
```
Environment shot of Forest Trail, a winding forest trail through natural landscapes, providing exploration opportunities and scenic beauty.
Dirt path winding through trees, dappled sunlight filtering through canopy, natural vegetation on both sides, peaceful atmosphere, golden hour lighting creating warm patches, adventure exploration setting, natural outdoor environment
Anime style, anime environment design, manga art style, anime aesthetic, Japanese animation style, expressive anime features, anime rendering
Natural landscapes, golden hour lighting, peaceful outdoor atmosphere
Aspect ratio: 9:16
Architectural photography, environmental shot, atmospheric lighting, detailed rendering, depth of field, professional composition
Vertical composition, portrait orientation, tall framing, environmental depth
```

**Output:**
```json
{
  "imageUrl": "https://example.com/generated-location-image-2.jpg"
}
```

---

## Example 3: Custom Style + Reference Image

**Inputs:**
```json
{
  "name": "Enchanted Forest",
  "description": "A mystical ancient forest with magical properties, where reality blends with fantasy and adventure awaits.",
  "details": "Ancient towering trees with mystical presence, dappled magical light filtering through canopy, ethereal atmosphere, mystical ancient forest setting, magical atmosphere throughout, glowing elements suggesting enchantment, adventure exploration path, otherworldly beauty",
  "style": "custom_image",
  "styleImageUrl": "https://example.com/style-reference-image.jpg",
  "worldDescription": "Mystical ancient forest, dappled light through trees, magical atmosphere",
  "aspectRatio": "16:9",
  "imageModel": "Flux",
  "referenceImageUrl": "https://example.com/location-reference-image.jpg"
}
```

**Built Prompt:**
```
Environment shot of Enchanted Forest, a mystical ancient forest with magical properties, where reality blends with fantasy and adventure awaits.
Ancient towering trees with mystical presence, dappled magical light filtering through canopy, ethereal atmosphere, mystical ancient forest setting, magical atmosphere throughout, glowing elements suggesting enchantment, adventure exploration path, otherworldly beauty
Matching the style and aesthetic of the uploaded style reference image, consistent with style reference image, maintaining visual consistency from style reference image
Mystical ancient forest, dappled light through trees, magical atmosphere
Aspect ratio: 16:9
Architectural photography, environmental shot, atmospheric lighting, detailed rendering, depth of field, professional composition
Wide composition, landscape orientation, cinematic framing, environmental context
Using the uploaded style reference image for visual style, matching the aesthetic and rendering technique from the style reference image
Using the uploaded location reference image for appearance consistency, matching location features and atmosphere from the reference image
```

**Note:** Both `styleImageUrl` and `referenceImageUrl` will be sent to the image model along with this prompt.

**Output:**
```json
{
  "imageUrl": "https://example.com/generated-location-image-3.jpg"
}
```

---

## Example 4: Horror Mystery Location (Cinematic)

**Inputs:**
```json
{
  "name": "Abandoned Building",
  "description": "An old, abandoned building with mysterious history and eerie atmosphere, perfect for horror and mystery narratives.",
  "details": "Dilapidated interior with peeling paint, broken windows allowing dim light, shadowy corners creating mystery, dark urban setting with mysterious atmosphere, creaking floorboards, dust particles visible in dim light, shadowy lighting enhancing horror mood, atmospheric tension",
  "style": "Cinematic",
  "styleImageUrl": null,
  "worldDescription": "Dark urban setting, mysterious atmosphere, shadowy lighting",
  "aspectRatio": "16:9",
  "imageModel": "Flux",
  "referenceImageUrl": null
}
```

**Built Prompt:**
```
Environment shot of Abandoned Building, an old, abandoned building with mysterious history and eerie atmosphere, perfect for horror and mystery narratives.
Dilapidated interior with peeling paint, broken windows allowing dim light, shadowy corners creating mystery, dark urban setting with mysterious atmosphere, creaking floorboards, dust particles visible in dim light, shadowy lighting enhancing horror mood, atmospheric tension
Cinematic lighting, dramatic shadows, film-quality rendering, cinematic composition, movie still aesthetic, professional cinematography, depth of field, atmospheric lighting
Dark urban setting, mysterious atmosphere, shadowy lighting
Aspect ratio: 16:9
Architectural photography, environmental shot, atmospheric lighting, detailed rendering, depth of field, professional composition
Wide composition, landscape orientation, cinematic framing, environmental context
```

**Output:**
```json
{
  "imageUrl": "https://example.com/generated-location-image-4.jpg"
}
```

---

## Implementation Notes

### Prompt Building
- Use exact template structure
- Substitute variables in order
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
- Include `referenceImageUrl` in API call if provided (location reference image)
- **Both images are sent to the model when available** (style image + location reference image)
- Include negative prompt: "blurry, distorted, low quality, people, text, watermark, logo"

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

### Reference Image Support
- **Style Reference Image**: When `style` is "custom_image" and `styleImageUrl` is provided, the style reference image is sent to the model
- **Location Reference Image**: When `referenceImageUrl` is provided, the location reference image is sent to the model
- Both images can be sent simultaneously (style image + location reference image)
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

### Location Details Usage
- Use full `details` field from Agent 2.3 (50-100 words)
- Contains visual specifics needed for image generation
- Includes lighting, atmosphere, key features

