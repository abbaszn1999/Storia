// ═══════════════════════════════════════════════════════════════════════════
// Agent 4.3: Image Editor
// ═══════════════════════════════════════════════════════════════════════════
// Edits generated storyboard images based on user feedback
// Supports iterative refinement without full regeneration
// Maintains character consistency through reference images

import { callAi } from "../../../ai/service";
import { getRunwareModelId } from "../../../ai/config";
import { IMAGE_MODEL_CONFIGS, getImageDimensions } from "../../../ai/config/image-models";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ImageEditorInput {
  originalImageUrl: string;  // Selected version's image URL
  editingInstruction: string;  // User's editing instruction
  editCategory: "prompt" | "clothes" | "remove" | "expression" | "figure" | "effects";
  referenceImages?: string[];  // Optional reference images (character, location, style refs)
  characterId?: string;  // For character-specific edits
  characterName?: string;  // Character name for context
  characterAppearance?: string;  // Character appearance description for identification
  shotId: string;
  videoId: string;
  aspectRatio: string;
  imageModel: string;  // User-selected editing model (required)
}

export interface ImageEditorOutput {
  editedImageUrl: string;
  cost?: number;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get dimensions for aspect ratio and image model
 */
function getDimensions(aspectRatio: string, imageModel: string): { width: number; height: number } {
  const modelConfig = IMAGE_MODEL_CONFIGS[imageModel];
  
  if (modelConfig) {
    // For SeaDream 4.5, use 2K resolution (minimum required)
    if (imageModel === "seedream-4.5") {
      return getImageDimensions(aspectRatio, "2k", imageModel);
    }
    
    // For SeaDream 4.0, default to 2K if available, fallback to 1K
    if (imageModel === "seedream-4.0") {
      const dims2k = getImageDimensions(aspectRatio, "2k", imageModel);
      if (dims2k && dims2k.width > 0 && dims2k.height > 0 && dims2k.width * dims2k.height >= 1024 * 1024) {
        return dims2k;
      }
      return getImageDimensions(aspectRatio, "1k", imageModel);
    }
    
    // For other models with model-specific dimensions, use the first available resolution
    if (modelConfig.resolutions && modelConfig.resolutions.length > 0) {
      const resolution = modelConfig.resolutions[0];
      const modelDims = getImageDimensions(aspectRatio, resolution, imageModel);
      if (modelDims && modelDims.width > 0 && modelDims.height > 0) {
        return modelDims;
      }
    }
  }
  
  // Fallback to standard dimensions
  return getImageDimensions(aspectRatio, "1k", imageModel);
}

/**
 * Build the editing prompt based on category and instruction
 */
function buildEditingPrompt(
  category: string,
  instruction: string,
  characterName?: string,
  characterAppearance?: string
): string {
  switch (category) {
    case "prompt":
      return instruction;
    case "clothes":
      // Build character identifier if appearance is available
      const characterIdentifier = characterAppearance 
        ? `${characterName || "the character"} (${characterAppearance})`
        : characterName || "the character";
      
      // The instruction already contains "Change [character]'s clothes to: [description]"
      // Just wrap it with editing context and preservation instructions
      return `Edit the existing image: ${instruction}. Identify ${characterIdentifier} in the scene and change only their clothing. Keep the same scene, background, composition, camera angle, lighting, all other characters, and all other elements unchanged.`;
    case "remove":
      // Build a highly specific removal prompt that targets only the mentioned object
      // Use precise language to avoid removing similar objects or related elements
      const removalTarget = instruction.trim();
      
      return `Remove ONLY the specific ${removalTarget} from the image. Be extremely precise: identify and remove ONLY the exact ${removalTarget} mentioned, nothing else. Preserve all other objects, elements, characters, background, scenery, lighting, composition, and details exactly as they are. Do not remove any similar objects, related items, or anything else. Only remove the specific ${removalTarget} and seamlessly fill the area where it was removed with appropriate background that matches the surrounding scene. Keep everything else completely unchanged.`;
    case "expression":
      // Build character identifier if appearance is available
      const expressionIdentifier = characterAppearance 
        ? `${characterName || "the character"} (${characterAppearance})`
        : characterName || "the character";
      
      // The instruction already contains "Change [character]'s expression to: [description]"
      return `Edit the existing image: ${instruction}. Identify ${expressionIdentifier} in the scene and change only their facial expression. Keep the same scene, background, composition, camera angle, lighting, all other characters, and all other elements unchanged.`;
    case "figure":
      // Build character identifier if appearance is available
      const figureIdentifier = characterAppearance 
        ? `${characterName || "the character"} (${characterAppearance})`
        : characterName || "the character";
      
      // The instruction already contains "Change [character]'s view to: [description]"
      return `Edit the existing image: ${instruction}. Identify ${figureIdentifier} in the scene and change only their pose/view. Keep the same scene, background, composition, camera angle, lighting, all other characters, and all other elements unchanged.`;
    case "effects":
      return `Add ${instruction} effect to the image`;
    default:
      return instruction;
  }
}

/**
 * Edit an image using image-to-image API
 */
async function editImage(
  originalImageUrl: string,
  editingPrompt: string,
  referenceImages: string[],
  width: number,
  height: number,
  model: string,
  editCategory?: string,
  userId?: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<{ imageUrl: string; cost?: number }> {
  // Get Runware model ID from friendly name
  const runwareModelId = getRunwareModelId(model);
  
  // Log model mapping for debugging
  if (runwareModelId !== model) {
    console.log(`[agent-4.3:image-editor] Model mapping: ${model} → ${runwareModelId}`);
  } else {
    console.warn(`[agent-4.3:image-editor] Model "${model}" not found in mapping, using as-is (may be AIR ID)`);
  }

  // Get model config to check capabilities
  const modelConfig = IMAGE_MODEL_CONFIGS[model];
  const supportsNegativePrompt = modelConfig?.supportsNegativePrompt ?? false;

  // Build the payload for image-to-image editing
  // CRITICAL: The original image MUST be the first reference image for image-to-image editing to work
  // This is the image that will be edited/modified
  const allReferenceImages = [originalImageUrl, ...referenceImages];

  // Log for debugging
  console.log('[agent-4.3:image-editor] Image-to-image editing:', {
    originalImageUrl,
    referenceImagesCount: referenceImages.length,
    totalReferenceImagesCount: allReferenceImages.length,
    firstImageIsOriginal: allReferenceImages[0] === originalImageUrl,
  });

  const payload: Record<string, any> = {
    taskType: "imageInference",
    model: runwareModelId,
    positivePrompt: editingPrompt,
    width,
    height,
    numberResults: 1,
    includeCost: true,
    referenceImages: allReferenceImages,
  };

  // Only include negativePrompt if the model supports it
  if (supportsNegativePrompt) {
    // Use category-specific negative prompts for better results
    if (editCategory === "remove") {
      // For removal, emphasize preserving all other objects and elements
      payload.negativePrompt = "removing other objects, deleting multiple items, changing background, altering scene, modifying other elements, removing similar objects, deleting related items, blurry, low quality, distorted, watermark, text, logo, cropped, out of frame, bad composition, incomplete removal, artifacts";
    } else {
      // Default negative prompt for other editing operations
      payload.negativePrompt = "blurry, low quality, distorted, watermark, text, logo, cropped, out of frame, bad composition";
    }
  }

  // For image-to-image editing, we typically want lower strength to preserve original
  // But this depends on the model - some models handle this automatically
  // For now, we'll let the model use its defaults

  console.log('[agent-4.3:image-editor] Calling image-to-image API:', {
    model: runwareModelId,
    promptLength: editingPrompt.length,
    referenceImagesCount: allReferenceImages.length,
    dimensions: { width, height },
  });

  const response = await callAi(
    {
      provider: "runware",
      model,
      task: "image-to-image",
      payload,
      userId,
      workspaceId,
    },
    {
      skipCreditCheck: false,
      metadata: { usageType, usageMode },
    }
  );

  // Extract image URL from response
  const results = response.output as any[];
  const data = Array.isArray(results) ? results[0] : results;

  const imageUrl = data?.imageURL || data?.outputURL || data?.url || data?.image;
  
  if (!imageUrl) {
    throw new Error("No image URL in response from image editing API");
  }

  return {
    imageUrl,
    cost: response.usage?.totalCostUsd || data?.cost,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Edit a storyboard image based on user instructions
 * 
 * Agent 4.3: Image Editor
 * 
 * Processes editing requests and returns modified images using image-to-image API.
 * Supports various editing categories (prompt, clothes, remove, expression, figure, effects).
 * 
 * @param input - Editing request details
 * @param userId - User ID for billing/tracking
 * @param workspaceId - Workspace ID for billing/tracking
 * @returns Edited image URL and cost
 */
export async function editStoryboardImage(
  input: ImageEditorInput,
  userId?: string,
  workspaceId?: string,
  usageType?: string,
  usageMode?: string
): Promise<ImageEditorOutput> {
  const {
    originalImageUrl,
    editingInstruction,
    editCategory,
    referenceImages = [],
    characterName,
    characterAppearance,
    shotId,
    videoId,
    aspectRatio,
    imageModel,
  } = input;

  try {
    console.log("[agent-4.3:image-editor] Starting image editing:", {
      shotId,
      videoId,
      editCategory,
      model: imageModel,
      aspectRatio,
      hasOriginalImage: !!originalImageUrl,
      referenceCount: referenceImages.length,
      characterName,
      userId,
      workspaceId,
    });

    // Validate inputs
    if (!originalImageUrl || originalImageUrl.trim() === "") {
      return {
        editedImageUrl: "",
        error: "Original image URL is required",
      };
    }

    if (!editingInstruction || editingInstruction.trim() === "") {
      return {
        editedImageUrl: "",
        error: "Editing instruction is required",
      };
    }

    // Build the editing prompt based on category
    const editingPrompt = buildEditingPrompt(
      editCategory,
      editingInstruction,
      characterName,
      characterAppearance
    );

    // Log removal operations with extra detail for debugging
    if (editCategory === "remove") {
      console.log("[agent-4.3:image-editor] Removal operation:", {
        removalTarget: editingInstruction.trim(),
        fullPrompt: editingPrompt.substring(0, 200) + "...",
        shotId,
        videoId,
      });
    }

    // Get dimensions for aspect ratio and image model
    const dimensions = getDimensions(aspectRatio, imageModel);

    // Call image-to-image API to edit the image
    const result = await editImage(
      originalImageUrl,
      editingPrompt,
      referenceImages,
      dimensions.width,
      dimensions.height,
      imageModel,
      editCategory, // Pass category for category-specific negative prompts
      userId,
      workspaceId,
      usageType,
      usageMode
    );

    console.log("[agent-4.3:image-editor] Image edited successfully:", {
      shotId,
      hasEditedImage: !!result.imageUrl,
      cost: result.cost,
    });

    return {
      editedImageUrl: result.imageUrl,
      cost: result.cost,
    };
  } catch (error) {
    console.error("[agent-4.3:image-editor] Image editing failed:", error);
    return {
      editedImageUrl: "",
      error: error instanceof Error ? error.message : "Image editing failed",
    };
  }
}


