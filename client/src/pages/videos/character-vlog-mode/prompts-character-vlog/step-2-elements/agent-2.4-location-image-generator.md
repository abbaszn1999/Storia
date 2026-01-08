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
| `artStyleDescription` | string | Settings | Art style text description (e.g., "Photorealistic, 8K ultra-detailed" or "Anime style, anime environment design"). If user uploaded a custom image, this will be null/empty and `styleReferenceImage` will be provided instead. |
| `styleReferenceImage` | string | User upload | Style reference image URL (when user uploaded a custom image as style reference). This image will be sent to the image model along with the prompt. |
| `worldDescription` | string | Settings | World context and atmosphere. **This should be integrated into the prompt.** |
| `model` | string | Settings | Selected image model (e.g., "Flux", "Midjourney", "nano-banana"). Default: "nano-banana" |
| `referenceImages` | string[] | User upload | Optional array of location reference image URLs. These images will be sent to the image model along with the prompt if provided. Can contain multiple reference images for location consistency. |

**Note:** Location images use a fixed 16:9 aspect ratio (1344x768). The aspect ratio is not configurable.

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
Environmental reference image of {name}, {description}
{details}
{art_style_description}
{world_description}
Wide 16:9 landscape composition, establishing shot showcasing the full environment and atmosphere. Natural or atmospheric lighting that reflects the time of day and mood. Clear, detailed view of the setting with emphasis on architecture, landscape features, or environmental elements. Cinematic depth and perspective, high-resolution, professionally composed, immersive environmental design.
{style_reference_image_guidance}
{reference_images_guidance}
```

**Note:** 
- When `styleReferenceImage` is provided, it will be sent to the image model along with the prompt
- When `referenceImages` array contains URLs, they will be sent to the image model along with the prompt
- Both style reference and location reference images can be sent simultaneously

---

## Variable Substitution Rules

### 1. Location Subject
- `{name}` → Location name
- `{description}` → Brief description (30-50 words)
- `{details}` → Visual details (50-100 words)

### 2. Art Style Description
- `{art_style_description}` → Art style text from `artStyleDescription`
- If `artStyleDescription` is provided and not empty, include it
- If `artStyleDescription` is null/empty, skip this section (style reference image will be used instead)

### 3. World Description
- `{world_description}` → World description text from `worldDescription`
- Include atmosphere, lighting, and mood from worldDescription
- Always include if worldDescription is provided

### 4. Style Reference Image Guidance (if styleReferenceImage provided)
- "Using the uploaded style reference image for visual style, matching the aesthetic and rendering technique from the style reference image"
- **Note:** The style reference image will be sent to the image model

### 5. Reference Images Guidance (if referenceImages array provided)
- "Using the uploaded location reference images for appearance consistency, matching location features and atmosphere from the reference images"
- **Note:** All reference images in the array will be sent to the image model

---

## Process

1. **Build prompt** using static template + variable substitution
2. **Substitute variables** in order:
   - Location name, description, and details
   - Art style description (if artStyleDescription provided)
   - World description (if worldDescription provided)
   - Style reference image guidance (if styleReferenceImage provided)
   - Reference images guidance (if referenceImages array provided)
3. **Call image generation API** with:
   - Model: `model` (Flux, Midjourney, nano-banana, etc.)
   - Prompt: Built prompt from template
   - Aspect ratio: Fixed 16:9 (1344x768) - not configurable
   - Style reference image: `styleReferenceImage` (if provided)
   - Location reference images: `referenceImages` array (if provided)
   - **Note:** Both style reference and location reference images can be sent simultaneously
   - Negative prompt: "blurry, low quality, distorted, watermark, text, logo, people, characters, humans, animals, cropped, out of frame, bad composition, oversaturated, low resolution, pixelated"
4. **Receive generated image URL** from API
5. **Return image URL** to frontend

**Prompt Building:**
- Use exact template structure
- Substitute variables in order
- Skip art style description if `artStyleDescription` is null/empty (style reference image will be used)
- Skip style reference image guidance if `styleReferenceImage` is null/empty
- Skip reference images guidance if `referenceImages` array is empty
- Always include world description if provided

**Style Handling:**
- If `artStyleDescription` is provided: Use it in the prompt
- If `styleReferenceImage` is provided: Send it as reference image and include guidance text
- Both can be used together (text description + reference image)
- Default to "Photorealistic, 8K ultra-detailed, professional photography" if neither is provided

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
  "artStyleDescription": "Photorealistic, 8K ultra-detailed, professional photography, natural lighting, true-to-life features, high-resolution, DSLR quality, sharp focus, realistic textures, cinematic lighting, dramatic shadows, film-quality rendering, cinematic composition, movie still aesthetic, professional cinematography, depth of field, atmospheric lighting",
  "styleReferenceImage": null,
  "worldDescription": "Modern city life, warm morning light, bustling urban energy",
  "model": "Flux",
  "referenceImages": []
}
```

**Built Prompt:**
```
Environmental reference image of Downtown Coffee Shop, a cozy urban cafe with warm atmosphere and modern interior, perfect for casual conversations and morning routines.
Large windows showing city street, wooden tables, exposed brick walls, warm lighting from hanging Edison bulbs, espresso machine sounds, comfortable booth seating, morning sunlight streaming through windows, urban energy visible outside
Photorealistic, 8K ultra-detailed, professional photography, natural lighting, true-to-life features, high-resolution, DSLR quality, sharp focus, realistic textures, cinematic lighting, dramatic shadows, film-quality rendering, cinematic composition, movie still aesthetic, professional cinematography, depth of field, atmospheric lighting
Modern city life, warm morning light, bustling urban energy
Wide 16:9 landscape composition, establishing shot showcasing the full environment and atmosphere. Natural or atmospheric lighting that reflects the time of day and mood. Clear, detailed view of the setting with emphasis on architecture, landscape features, or environmental elements. Cinematic depth and perspective, high-resolution, professionally composed, immersive environmental design.
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
  "artStyleDescription": "Anime style, anime environment design, manga art style, anime aesthetic, Japanese animation style, expressive anime features, anime rendering",
  "styleReferenceImage": null,
  "worldDescription": "Natural landscapes, golden hour lighting, peaceful outdoor atmosphere",
  "model": "Flux",
  "referenceImages": []
}
```

**Built Prompt:**
```
Environmental reference image of Forest Trail, a winding forest trail through natural landscapes, providing exploration opportunities and scenic beauty.
Dirt path winding through trees, dappled sunlight filtering through canopy, natural vegetation on both sides, peaceful atmosphere, golden hour lighting creating warm patches, adventure exploration setting, natural outdoor environment
Anime style, anime environment design, manga art style, anime aesthetic, Japanese animation style, expressive anime features, anime rendering
Natural landscapes, golden hour lighting, peaceful outdoor atmosphere
Wide 16:9 landscape composition, establishing shot showcasing the full environment and atmosphere. Natural or atmospheric lighting that reflects the time of day and mood. Clear, detailed view of the setting with emphasis on architecture, landscape features, or environmental elements. Cinematic depth and perspective, high-resolution, professionally composed, immersive environmental design.
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
  "artStyleDescription": null,
  "styleReferenceImage": "https://example.com/style-reference-image.jpg",
  "worldDescription": "Mystical ancient forest, dappled light through trees, magical atmosphere",
  "model": "Flux",
  "referenceImages": ["https://example.com/location-reference-image.jpg"]
}
```

**Built Prompt:**
```
Environmental reference image of Enchanted Forest, a mystical ancient forest with magical properties, where reality blends with fantasy and adventure awaits.
Ancient towering trees with mystical presence, dappled magical light filtering through canopy, ethereal atmosphere, mystical ancient forest setting, magical atmosphere throughout, glowing elements suggesting enchantment, adventure exploration path, otherworldly beauty
Mystical ancient forest, dappled light through trees, magical atmosphere
Wide 16:9 landscape composition, establishing shot showcasing the full environment and atmosphere. Natural or atmospheric lighting that reflects the time of day and mood. Clear, detailed view of the setting with emphasis on architecture, landscape features, or environmental elements. Cinematic depth and perspective, high-resolution, professionally composed, immersive environmental design.
Using the uploaded style reference image for visual style, matching the aesthetic and rendering technique from the style reference image
Using the uploaded location reference images for appearance consistency, matching location features and atmosphere from the reference images
```

**Note:** Both `styleReferenceImage` and `referenceImages` array will be sent to the image model along with this prompt.

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
  "artStyleDescription": "Cinematic lighting, dramatic shadows, film-quality rendering, cinematic composition, movie still aesthetic, professional cinematography, depth of field, atmospheric lighting",
  "styleReferenceImage": null,
  "worldDescription": "Dark urban setting, mysterious atmosphere, shadowy lighting",
  "model": "Flux",
  "referenceImages": []
}
```

**Built Prompt:**
```
Environmental reference image of Abandoned Building, an old, abandoned building with mysterious history and eerie atmosphere, perfect for horror and mystery narratives.
Dilapidated interior with peeling paint, broken windows allowing dim light, shadowy corners creating mystery, dark urban setting with mysterious atmosphere, creaking floorboards, dust particles visible in dim light, shadowy lighting enhancing horror mood, atmospheric tension
Cinematic lighting, dramatic shadows, film-quality rendering, cinematic composition, movie still aesthetic, professional cinematography, depth of field, atmospheric lighting
Dark urban setting, mysterious atmosphere, shadowy lighting
Wide 16:9 landscape composition, establishing shot showcasing the full environment and atmosphere. Natural or atmospheric lighting that reflects the time of day and mood. Clear, detailed view of the setting with emphasis on architecture, landscape features, or environmental elements. Cinematic depth and perspective, high-resolution, professionally composed, immersive environmental design.
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
- Skip art style description if `artStyleDescription` is null/empty (style reference image will be used)
- Skip style reference image guidance if `styleReferenceImage` is null/empty
- Skip reference images guidance if `referenceImages` array is empty
- Always include world description if provided

### Style Handling
- If `artStyleDescription` is provided: Use it in the prompt
- If `styleReferenceImage` is provided: Send it as reference image and include guidance text
- Both can be used together (text description + reference image)
- Default to "Photorealistic, 8K ultra-detailed, professional photography" if neither is provided

### Image Model API Call
- Use `model` parameter to select API endpoint
- Pass built prompt as `positivePrompt`
- Pass aspect ratio: Fixed 16:9 (1344x768) - not configurable
- Include `styleReferenceImage` in API call if provided (style reference image)
- Include `referenceImages` array in API call if provided (location reference images)
- **Both style reference and location reference images can be sent simultaneously**
- Include negative prompt: "blurry, low quality, distorted, watermark, text, logo, people, characters, humans, animals, cropped, out of frame, bad composition, oversaturated, low resolution, pixelated"

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
- **Style Reference Image**: When `styleReferenceImage` is provided, the style reference image is sent to the model
- **Location Reference Images**: When `referenceImages` array contains URLs, all location reference images are sent to the model
- Both can be sent simultaneously (style image + location reference images)
- Use image-to-image generation when reference images are provided
- Pass all reference images to API along with prompt
- Ensure API supports multiple reference image inputs

### Aspect Ratio
- Fixed 16:9 aspect ratio (1344x768) - not configurable
- This matches the existing location image generator implementation

### Model Compatibility
- Different models may require different prompt formats
- Adjust template slightly if needed for specific models
- Maintain core structure across all models

### Location Details Usage
- Use full `details` field from Agent 2.3 (50-100 words)
- Contains visual specifics needed for image generation
- Includes lighting, atmosphere, key features

