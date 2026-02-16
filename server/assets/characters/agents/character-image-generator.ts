// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Agent 2.3: Character Image Generator
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Creates character portrait reference images for visual consistency
// Used by: Character Assets Library (hard-coded nano-banana)
//          Narrative Mode World & Cast (user-selectable model)

import { callAi } from "../../../ai/service";
import { runwareModelIdMap } from "../../../ai/config";

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TYPES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export interface CharacterImageInput {
  name: string;
  appearance: string;
  personality: string;
  artStyleDescription?: string;
  model?: string;
  negativePrompt?: string;
  referenceImages?: string[];
  styleReferenceImage?: string;
}

export interface CharacterImageOutput {
  imageUrl: string;
  cost?: number;
  error?: string;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CONFIGURATION
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const DEFAULT_MODEL = "nano-banana";

const PORTRAIT_DIMENSIONS = {
  width: 1024,
  height: 1024,
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STYLE SYSTEM
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

interface StyleConfig {
  keywords: string[];
  negatives: string[];
  lighting: string;
  quality: string;
}

const STYLE_CONFIGS: Record<string, StyleConfig> = {
  photorealistic: {
    keywords: [
      "natural skin texture with visible pores",
      "subsurface scattering on skin",
      "individual hair strands with natural texture",
      "fabric with visible weave texture",
      "shot on 85mm portrait lens f/2.8",
      "subtle film grain",
      "professional portrait photography",
      "8K ultra-detailed",
    ],
    negatives: [
      "anime", "cartoon", "3D render", "CGI", "stylized", "illustration",
      "airbrushed", "plastic skin", "perfect symmetry", "oversaturated colors",
      "video game", "digital painting", "smooth skin", "poreless",
      "drawing", "concept art", "painting",
    ],
    lighting: "professional portrait lighting, soft key light at 45 degrees with subtle fill, gentle rim light separating subject from background, natural warm color temperature 5600K, subtle catchlights in eyes",
    quality: "8K ultra-detailed, professional portrait photography, hyper-realistic, natural color grading, cinematic quality",
  },
  cinematic: {
    keywords: [
      "anamorphic lens bokeh",
      "cinematic color grading teal and orange",
      "shallow depth of field",
      "natural skin texture with visible pores",
      "subsurface scattering on skin",
      "subtle film grain 35mm",
      "shot on Arri Alexa 85mm",
      "8K cinematic quality",
    ],
    negatives: [
      "anime", "cartoon", "3D render", "CGI", "stylized", "illustration",
      "airbrushed", "plastic skin", "flat lighting", "home video look",
      "bright oversaturated", "TV aesthetic", "digital painting",
    ],
    lighting: "cinematic portrait lighting, dramatic key light with controlled shadow, subtle warm rim light, shallow depth of field f/2.0, lens flare hint, cinematic color temperature",
    quality: "8K cinematic quality, shot on Arri Alexa, professional film production, natural color grading, subtle film grain",
  },
  pixar: {
    keywords: [
      "Pixar-quality 3D character render",
      "stylized appealing proportions",
      "soft subsurface scattering",
      "rim lighting on character edges",
      "vibrant saturated colors",
      "soft ambient occlusion",
      "character appeal and charm",
      "expressive large eyes",
    ],
    negatives: [
      "photorealistic", "realistic skin texture", "photograph", "film grain",
      "lens flare", "muted colors", "gritty", "raw", "documentary",
      "pores", "wrinkles", "skin imperfections", "realistic proportions",
    ],
    lighting: "soft Pixar-style studio lighting, bright key light with colorful fill, rim lighting on character edges, soft ambient occlusion, vibrant clean shadows",
    quality: "Pixar-quality 3D render, Disney-grade character design, smooth stylized skin, appealing character proportions",
  },
  anime: {
    keywords: [
      "anime character illustration",
      "cel shading with clean edges",
      "large expressive anime eyes",
      "detailed iris with anime highlights",
      "clean sharp outlines",
      "flat color fills with subtle gradients",
      "dynamic anime hair with distinct strands",
      "Japanese animation aesthetic",
    ],
    negatives: [
      "photorealistic", "3D render", "photograph", "film grain",
      "subsurface scattering", "realistic skin texture", "pores", "wrinkles",
      "western cartoon", "chibi", "deformed",
    ],
    lighting: "clean anime-style lighting, soft cel-shaded shadows, bright even illumination, anime highlight spots on hair, clean shadow edges",
    quality: "high-quality anime illustration, manga-inspired character design, vibrant anime color palette, professional Japanese animation aesthetic",
  },
  vintage: {
    keywords: [
      "vintage film stock aesthetic",
      "35mm film grain texture",
      "muted color palette with faded tones",
      "warm analog color grading",
      "soft vignette",
      "nostalgic atmosphere",
      "retro portrait photography",
    ],
    negatives: [
      "digital clarity", "HDR", "modern camera", "oversaturated",
      "crisp sharp", "4K", "8K", "contemporary", "clean digital",
    ],
    lighting: "warm vintage portrait lighting, single-source side light with soft falloff, warm analog color temperature, gentle lens softness at edges, slight vignette",
    quality: "vintage film stock quality, retro portrait photography, aged photograph aesthetic, nostalgic warmth",
  },
};

function detectStyleCategory(artStyleDescription?: string): string {
  if (!artStyleDescription) return "photorealistic";
  const desc = artStyleDescription.toLowerCase();
  if (desc.includes("anime") || desc.includes("manga") || desc.includes("2d animation")) return "anime";
  if (desc.includes("pixar") || desc.includes("3d animation") || desc.includes("3d render")) return "pixar";
  if (desc.includes("vintage") || desc.includes("retro")) return "vintage";
  if (desc.includes("cinematic") || desc.includes("film")) return "cinematic";
  if (desc.includes("photo") || desc.includes("realistic") || desc.includes("realism")) return "photorealistic";
  return "photorealistic";
}

function buildNegativePrompt(styleCategory: string, customNegative?: string): string {
  const style = STYLE_CONFIGS[styleCategory] || STYLE_CONFIGS.photorealistic;
  const baseNegatives = [
    "blurry", "low quality", "distorted face", "extra limbs", "watermark",
    "text", "signature", "cropped", "out of frame", "bad anatomy",
    "deformed", "disfigured", "mutated", "ugly", "duplicate",
    "morbid", "mutilated", "bad proportions", "malformed",
    "worst quality", "low resolution", "poorly drawn",
    "multiple views", "character sheet", "grid", "collage",
    "split image", "multiple angles", "model sheet",
  ];
  const allNegatives = [
    ...baseNegatives,
    ...style.negatives,
    ...(customNegative ? customNegative.split(",").map(s => s.trim()) : []),
  ];
  return [...new Set(allNegatives)].join(", ");
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PROMPT CONSTRUCTION
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function deriveExpressionFromPersonality(personality: string): string {
  const p = personality.toLowerCase();
  if (p.includes("confident") || p.includes("commanding") || p.includes("bold")) {
    return "confident steady gaze, slight upward chin, assured subtle smile";
  }
  if (p.includes("shy") || p.includes("timid") || p.includes("humble")) {
    return "gentle soft expression, slightly lowered gaze, quiet warmth in eyes";
  }
  if (p.includes("kind") || p.includes("warm") || p.includes("caring") || p.includes("wholesome")) {
    return "warm genuine smile, soft approachable eyes, relaxed friendly expression";
  }
  if (p.includes("mysterious") || p.includes("enigmatic") || p.includes("secretive")) {
    return "enigmatic slight smile, knowing eyes, composed unreadable expression";
  }
  if (p.includes("fierce") || p.includes("aggressive") || p.includes("dangerous")) {
    return "intense focused gaze, strong jaw set, determined expression";
  }
  if (p.includes("wise") || p.includes("thoughtful") || p.includes("intellectual")) {
    return "thoughtful contemplative expression, intelligent aware eyes, serene composure";
  }
  if (p.includes("playful") || p.includes("mischievous") || p.includes("fun")) {
    return "playful slight smirk, bright lively eyes, amused expression";
  }
  if (p.includes("sad") || p.includes("melancholy") || p.includes("brooding")) {
    return "pensive expression, subtle weariness in eyes, quiet emotional depth";
  }
  if (p.includes("cold") || p.includes("calculating") || p.includes("stoic")) {
    return "composed neutral expression, piercing direct gaze, controlled demeanor";
  }
  if (p.includes("anxious") || p.includes("nervous") || p.includes("worried")) {
    return "slightly tense expression, alert watchful eyes, subtle tension in brow";
  }
  return "natural relaxed expression, calm steady gaze, approachable demeanor";
}

function buildCharacterPrompt(input: CharacterImageInput): string {
  const { name, appearance, personality, artStyleDescription } = input;
  const styleCategory = detectStyleCategory(artStyleDescription);
  const style = STYLE_CONFIGS[styleCategory] || STYLE_CONFIGS.photorealistic;
  const parts: string[] = [];

  // LAYER 1: Subject & Identity
  parts.push("Single character reference portrait of " + name + ".");

  // LAYER 2: Physical Appearance (CHARACTER DNA)
  parts.push(appearance);

  // LAYER 3: Pose & Composition
  parts.push(
    "Single portrait, one image only. " +
    "Medium shot, waist-up framing showing face and upper body clearly. " +
    "Slight 3/4 angle facing camera, natural relaxed standing pose. " +
    "Hands visible at waist level if in frame. " +
    "Eyes looking toward camera with slight off-center gaze."
  );

  // LAYER 4: Expression (derived from personality)
  if (personality && personality.trim()) {
    const expressionHint = deriveExpressionFromPersonality(personality);
    if (expressionHint) {
      parts.push("Expression: " + expressionHint + ".");
    }
  }

  // LAYER 5: Background
  parts.push(
    "Clean neutral studio background, smooth gradient from light to slightly darker tone. " +
    "Background color complements the character's skin tone and outfit. " +
    "No distracting elements, studio isolation for character extraction."
  );

  // LAYER 6: Lighting
  parts.push(style.lighting);

  // LAYER 7: Art Style (user-provided text, if any)
  if (artStyleDescription && artStyleDescription.trim()) {
    parts.push(artStyleDescription);
  }

  // LAYER 8: Style Keywords (MANDATORY)
  const selectedKeywords = style.keywords.slice(0, 7);
  parts.push(selectedKeywords.join(", ") + ".");

  // LAYER 9: Quality & Technical
  parts.push(style.quality);

  // LAYER 10: Anti-grid reinforcement
  parts.push("Single image, single character, single viewpoint, no collage, no grid, no multiple angles.");

  return parts.join("\n");
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MAIN FUNCTION
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function generateCharacterImage(
  input: CharacterImageInput,
  userId?: string,
  workspaceId?: string
): Promise<CharacterImageOutput> {
  const {
    model = DEFAULT_MODEL,
    negativePrompt,
    referenceImages,
    styleReferenceImage,
    artStyleDescription,
  } = input;

  const positivePrompt = buildCharacterPrompt(input);
  const styleCategory = detectStyleCategory(artStyleDescription);
  const finalNegativePrompt = buildNegativePrompt(styleCategory, negativePrompt);

  const runwareModelId = runwareModelIdMap[model];
  if (!runwareModelId) {
    return {
      imageUrl: "",
      error: "No Runware mapping for model: " + model,
    };
  }

  try {
    console.log("[agent-2.3:character-image] Starting image generation:", {
      model,
      runwareModelId,
      characterName: input.name,
      styleCategory,
      promptLength: positivePrompt.length,
      negativePromptLength: finalNegativePrompt.length,
      hasReferenceImages: referenceImages && referenceImages.length > 0,
      referenceCount: referenceImages?.length || 0,
      hasStyleReference: !!styleReferenceImage,
    });

    const payload: Record<string, any> = {
      taskType: "imageInference",
      model: runwareModelId,
      positivePrompt,
      negativePrompt: finalNegativePrompt,
      width: PORTRAIT_DIMENSIONS.width,
      height: PORTRAIT_DIMENSIONS.height,
      numberResults: 1,
      includeCost: true,
    };

    const allReferenceUrls: string[] = [];

    if (referenceImages && referenceImages.length > 0) {
      referenceImages.forEach((url) => {
        allReferenceUrls.push(url);
      });
      console.log("[agent-2.3:character-image] Added character reference images:", {
        count: referenceImages.length,
      });
    }

    if (styleReferenceImage) {
      allReferenceUrls.push(styleReferenceImage);
      console.log("[agent-2.3:character-image] Added style reference image");
    }

    if (allReferenceUrls.length > 0) {
      payload.referenceImages = allReferenceUrls;
    }

    const response = await callAi(
      {
        provider: "runware",
        model,
        task: "image-generation",
        payload,
        userId,
        workspaceId,
      },
      {
        skipCreditCheck: false,
      }
    );

    const results = response.output as any[];
    const data = Array.isArray(results) ? results[0] : results;

    console.log("[agent-2.3:character-image] Response received:", {
      hasData: !!data,
      imageURL: data?.imageURL ? "present" : "missing",
      cost: response.usage?.totalCostUsd || data?.cost,
    });

    const imageUrl = data?.imageURL || data?.outputURL || data?.url || data?.image;

    if (imageUrl) {
      return {
        imageUrl,
        cost: response.usage?.totalCostUsd || data?.cost,
      };
    }

    return {
      imageUrl: "",
      error: "No image URL in response",
    };
  } catch (error) {
    console.error("[agent-2.3:character-image] Generation failed:", error);
    return {
      imageUrl: "",
      error: error instanceof Error ? error.message : "Character image generation failed",
    };
  }
}

export function getDefaultCharacterImageModel(): string {
  return DEFAULT_MODEL;
}

export function getPortraitDimensions(): { width: number; height: number } {
  return { ...PORTRAIT_DIMENSIONS };
}
