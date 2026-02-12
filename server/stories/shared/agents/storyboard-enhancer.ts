import { callTextModel } from "../../../ai/service";
import type { StoryMode } from "./idea-generator";
import { getStoryboardPrompts, getTransitionPrompts } from "../prompts-loader";
import type { StoryModeForPrompts } from "../prompts-loader";

const STORYBOARD_CONFIG = {
  provider: "openai" as const,
  model: "gpt-4o", // Vision capable for image analysis
};

/**
 * Validation constants
 * 
 * Note: Image prompts are 80-150 words (avg 5 chars/word = 400-750 chars)
 * Video prompts are 30-60 words (avg 5 chars/word = 150-300 chars)
 */
const VALIDATION = {
  MIN_SCENES: 1,
  MAX_SCENES: 20,
  MIN_DURATION: 1,
  MAX_DURATION: 60,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_IMAGE_PROMPT_LENGTH: 50,
  MAX_IMAGE_PROMPT_LENGTH: 1200, // 150 words × 8 chars/word = 1200 (safe margin)
  MIN_VIDEO_PROMPT_LENGTH: 20,
  MAX_VIDEO_PROMPT_LENGTH: 400, // 60 words × 6.5 chars/word = 390 (safe margin)
} as const;

/**
 * Create storyboard enhancer function for a specific story mode
 * 
 * @param mode - Story mode (problem-solution, before-after, myth-busting, tease-reveal)
 * @returns enhanceStoryboard function configured for the specified mode
 */
export async function createStoryboardEnhancer(mode: StoryMode) {
  const modeForPrompts = mode as StoryModeForPrompts;
  const storyboardPromptsModule = getStoryboardPrompts(modeForPrompts);
  const transitionPromptsModule = getTransitionPrompts(modeForPrompts);
  const typesModule = await import(`../types`);

  const {
    buildStoryboardEnhancerSystemPrompt,
    buildStoryboardUserPrompt,
  } = storyboardPromptsModule;
  const {
    selectTransitionForScene,
    getTransitionDuration,
  } = transitionPromptsModule;
  
  // Types will be inferred from usage
  type StoryboardEnhancerInput = any;
  type StoryboardEnhancerOutput = any;
  type EnhancedSceneOutput = any;
  type SceneTransition = any;
  type VoiceMood = any;

  /**
   * Validate input before processing
   */
  function validateInput(input: any): void {
  const { scenes, aspectRatio, imageStyle } = input;

  // Validate scenes array
  if (!scenes || !Array.isArray(scenes)) {
    throw new Error("Invalid input: scenes must be an array");
  }

  if (scenes.length < VALIDATION.MIN_SCENES) {
    throw new Error(`Invalid input: must have at least ${VALIDATION.MIN_SCENES} scene`);
  }

  if (scenes.length > VALIDATION.MAX_SCENES) {
    throw new Error(`Invalid input: cannot have more than ${VALIDATION.MAX_SCENES} scenes`);
  }

  // Validate each scene
  scenes.forEach((scene, index) => {
    if (!scene.sceneNumber || scene.sceneNumber < 1) {
      throw new Error(`Invalid scene ${index + 1}: sceneNumber must be >= 1`);
    }

    if (scene.sceneNumber !== index + 1) {
      throw new Error(`Invalid scene ${index + 1}: sceneNumber must be ${index + 1}`);
    }

    if (!scene.duration || scene.duration < VALIDATION.MIN_DURATION) {
      throw new Error(`Invalid scene ${index + 1}: duration must be >= ${VALIDATION.MIN_DURATION} seconds`);
    }

    if (scene.duration > VALIDATION.MAX_DURATION) {
      throw new Error(`Invalid scene ${index + 1}: duration cannot exceed ${VALIDATION.MAX_DURATION} seconds`);
    }

    if (!scene.description || scene.description.trim().length < VALIDATION.MIN_DESCRIPTION_LENGTH) {
      throw new Error(`Invalid scene ${index + 1}: description must be at least ${VALIDATION.MIN_DESCRIPTION_LENGTH} characters`);
    }

    if (scene.description.length > VALIDATION.MAX_DESCRIPTION_LENGTH) {
      throw new Error(`Invalid scene ${index + 1}: description cannot exceed ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`);
    }

    // Validate narration if voiceover is enabled
    // For auto-asmr mode (voiceoverEnabled = false), narration is always empty string - skip validation
    if (input.voiceoverEnabled) {
      if (!scene.narration || scene.narration.trim().length === 0) {
        throw new Error(`Invalid scene ${index + 1}: narration is required when voiceover is enabled`);
      }
    }
  });

  // Validate aspect ratio
  const validAspectRatios = ['9:16', '16:9', '1:1', '4:5'];
  if (!aspectRatio || !validAspectRatios.includes(aspectRatio)) {
    throw new Error(`Invalid aspect ratio: must be one of ${validAspectRatios.join(', ')}`);
  }

  // Validate image style
  const validImageStyles = ['photorealistic', 'cinematic', '3d-render', 'digital-art', 'anime', 'illustration', 'watercolor', 'minimalist'];
  if (!imageStyle || !validImageStyles.includes(imageStyle)) {
    throw new Error(`Invalid image style: must be one of ${validImageStyles.join(', ')}`);
  }
}

/**
 * Validate output after generation
 */
function validateOutput(
  output: any,
  input: StoryboardEnhancerInput
): void {
  if (!output || typeof output !== 'object') {
    throw new Error("Invalid response: output must be an object");
  }

  if (!output.scenes || !Array.isArray(output.scenes)) {
    throw new Error("Invalid response: missing scenes array");
  }

  if (output.scenes.length !== input.scenes.length) {
    throw new Error(`Invalid response: expected ${input.scenes.length} scenes, got ${output.scenes.length}`);
  }

  if (output.totalScenes !== input.scenes.length) {
    throw new Error(`Invalid response: totalScenes must be ${input.scenes.length}, got ${output.totalScenes}`);
  }

  // Validate each enhanced scene
  output.scenes.forEach((scene: any, index: number) => {
    if (scene.sceneNumber !== index + 1) {
      throw new Error(`Invalid scene ${index + 1}: sceneNumber must be ${index + 1}, got ${scene.sceneNumber}`);
    }

    // Validate imagePrompt
    if (!scene.imagePrompt || typeof scene.imagePrompt !== 'string') {
      throw new Error(`Invalid scene ${index + 1}: imagePrompt is required and must be a string`);
    }

    if (scene.imagePrompt.length < VALIDATION.MIN_IMAGE_PROMPT_LENGTH) {
      throw new Error(`Invalid scene ${index + 1}: imagePrompt must be at least ${VALIDATION.MIN_IMAGE_PROMPT_LENGTH} characters`);
    }

    if (scene.imagePrompt.length > VALIDATION.MAX_IMAGE_PROMPT_LENGTH) {
      throw new Error(`Invalid scene ${index + 1}: imagePrompt cannot exceed ${VALIDATION.MAX_IMAGE_PROMPT_LENGTH} characters`);
    }

    // Validate voiceover fields if enabled
    // For auto-asmr mode (voiceoverEnabled = false), voiceText and voiceMood are not required - skip validation
    if (input.voiceoverEnabled) {
      if (!scene.voiceText || typeof scene.voiceText !== 'string') {
        throw new Error(`Invalid scene ${index + 1}: voiceText is required when voiceover is enabled`);
      }

      if (!scene.voiceMood || typeof scene.voiceMood !== 'string') {
        throw new Error(`Invalid scene ${index + 1}: voiceMood is required when voiceover is enabled`);
      }

      const validMoods = ['neutral', 'happy', 'sad', 'excited', 'angry', 'whisper', 'dramatic', 'curious', 'thoughtful', 'surprised', 'sarcastic', 'nervous'];
      if (!validMoods.includes(scene.voiceMood)) {
        throw new Error(`Invalid scene ${index + 1}: voiceMood must be one of ${validMoods.join(', ')}`);
      }
    }

    // Validate animation fields if enabled
    if (input.animationMode && input.animationType) {
      if (input.animationType === 'image-to-video') {
        if (!scene.videoPrompt || typeof scene.videoPrompt !== 'string') {
          throw new Error(`Invalid scene ${index + 1}: videoPrompt is required for image-to-video mode`);
        }

        if (scene.videoPrompt.length < VALIDATION.MIN_VIDEO_PROMPT_LENGTH) {
          throw new Error(`Invalid scene ${index + 1}: videoPrompt must be at least ${VALIDATION.MIN_VIDEO_PROMPT_LENGTH} characters`);
        }

        if (scene.videoPrompt.length > VALIDATION.MAX_VIDEO_PROMPT_LENGTH) {
          throw new Error(`Invalid scene ${index + 1}: videoPrompt cannot exceed ${VALIDATION.MAX_VIDEO_PROMPT_LENGTH} characters`);
        }
      } else if (input.animationType === 'transition') {
        if (!scene.animationName || typeof scene.animationName !== 'string') {
          throw new Error(`Invalid scene ${index + 1}: animationName is required for transition mode`);
        }

        if (!scene.effectName || typeof scene.effectName !== 'string') {
          throw new Error(`Invalid scene ${index + 1}: effectName is required for transition mode`);
        }
      }

      // Validate transition (optional for last scene)
      if (index < output.scenes.length - 1) {
        if (!scene.transitionToNext || typeof scene.transitionToNext !== 'string') {
          throw new Error(`Invalid scene ${index + 1}: transitionToNext is required for non-last scenes`);
        }
      }
    }
  });
}

/**
 * Build JSON Schema dynamically based on settings
 */
function buildStoryboardSchema(
  voiceoverEnabled: boolean,
  animationMode: boolean,
  animationType?: 'transition' | 'image-to-video'
) {
  const sceneProperties: any = {
    sceneNumber: {
      type: "number",
      description: "Scene number (must match input)",
    },
    imagePrompt: {
      type: "string",
      description: "Detailed visual description for AI image generation",
    },
  };

  const requiredFields = ["sceneNumber", "imagePrompt"];

  // Add voiceText and voiceMood if voiceover is enabled
  if (voiceoverEnabled) {
    sceneProperties.voiceText = {
      type: "string",
      description: "Exact text to be read by voice synthesis",
    };
    sceneProperties.voiceMood = {
      type: "string",
      description: "Emotional mood for voice delivery - used for ElevenLabs v3 audio tags",
      enum: [
        "neutral",      // Normal, conversational
        "happy",        // Joyful, excited, upbeat
        "sad",          // Melancholic, sorrowful
        "excited",      // Energetic, enthusiastic
        "angry",        // Frustrated, intense
        "whisper",      // Soft, intimate, secretive
        "dramatic",     // Intense, theatrical
        "curious",      // Wondering, questioning
        "thoughtful",   // Reflective, contemplative
        "surprised",    // Shocked, amazed
        "sarcastic",    // Ironic, mocking
        "nervous",      // Anxious, worried
      ],
    };
    requiredFields.push("voiceText", "voiceMood");
  }

  // Add animation fields if animation mode is enabled
  if (animationMode && animationType) {
    if (animationType === 'transition') {
      // Camera movement animation
      sceneProperties.animationName = {
        type: "string",
        description: "Camera movement animation - choose based on scene action and mood",
        enum: [
          "zoom-in",      // Dramatic focus, tension
          "zoom-out",     // Reveal, conclusion
          "pan-right",    // Journey forward, progress
          "pan-left",     // Looking back, reflection
          "pan-up",       // Hope, aspiration
          "pan-down",     // Discovery, grounding
          "ken-burns",    // Subtle movement, neutral
          "rotate-cw",    // Time passing, magical
          "rotate-ccw",   // Flashback, reversal
          "slide-left",   // Transition, movement
          "slide-right",  // Arrival, revelation
        ],
      };
      requiredFields.push("animationName");
      
      // Visual effect filter
      sceneProperties.effectName = {
        type: "string",
        description: "Visual effect filter - choose based on scene mood and emotion",
        enum: [
          "none",         // Default, neutral scenes
          "vignette",     // Focus on center, intimate
          "sepia",        // Flashback, memories, old times
          "black-white",  // Dramatic, sadness, historical
          "warm",         // Happy, love, sunset, comfort
          "cool",         // Sad, night, cold, mystery
          "grain",        // Vintage, nostalgic, film-like
          "dramatic",     // Tension, action, conflict
          "cinematic",    // Epic, grand, movie-like
          "dreamy",       // Fantasy, dreams, soft
          "glow",         // Magic, romance, ethereal
        ],
      };
      requiredFields.push("effectName");
      
      // Scene-to-scene transition (2025 trending)
      // Note: transitionToNext is optional (especially for last scene), but OpenAI strict mode requires it in required array
      // We'll handle it as optional in post-processing
      sceneProperties.transitionToNext = {
        type: "string",
        description: "Transition to next scene - based on mood shift and content. Use 'none' for last scene.",
        enum: [
          // Motion-based (viral 2025)
          "whip-pan", "zoom-punch", "snap-zoom", 
          "motion-blur-left", "motion-blur-right", "motion-blur-up", "motion-blur-down",
          // Light & Glow
          "flash-white", "flash-black", "light-leak", "lens-flare", "luma-fade",
          // Digital / Glitch
          "glitch", "rgb-split", "pixelate", "vhs-noise",
          // Shape reveals
          "circle-open", "circle-close", "heart-reveal", "diamond-wipe", "star-wipe", "diagonal-tl", "diagonal-br",
          // Smooth & Elegant
          "smooth-blur", "cross-dissolve", "wave-ripple", "zoom-blur",
          // Classic
          "fade", "wipe-left", "wipe-right", "wipe-up", "wipe-down", "none",
        ],
      };
      requiredFields.push("transitionToNext"); // Required by OpenAI strict mode, but we'll handle 'none' for last scene
      
    } else if (animationType === 'image-to-video') {
      sceneProperties.videoPrompt = {
        type: "string",
        description: "Description of motion/animation for image-to-video",
      };
      requiredFields.push("videoPrompt");
      
      // Scene-to-scene transition (2025 trending) - also for image-to-video mode
      // Note: transitionToNext is optional (especially for last scene), but OpenAI strict mode requires it in required array
      sceneProperties.transitionToNext = {
        type: "string",
        description: "Transition to next scene - based on mood shift and content. Use 'none' for last scene.",
        enum: [
          // Motion-based (viral 2025)
          "whip-pan", "zoom-punch", "snap-zoom", 
          "motion-blur-left", "motion-blur-right",
          // Light & Glow
          "flash-white", "flash-black", "light-leak", "lens-flare",
          // Digital / Glitch
          "glitch", "rgb-split", "pixelate",
          // Shape reveals
          "circle-open", "circle-close", "star-wipe",
          // Smooth & Elegant
          "smooth-blur", "cross-dissolve", "wave-ripple",
          // Classic
          "fade", "none",
        ],
      };
      requiredFields.push("transitionToNext"); // Required by OpenAI strict mode, but we'll handle 'none' for last scene
    }
  }

  return {
    type: "object",
    properties: {
      scenes: {
        type: "array",
        items: {
          type: "object",
          properties: sceneProperties,
          required: requiredFields,
          additionalProperties: false,
        },
      },
      totalScenes: {
        type: "number",
        description: "Total number of scenes",
      },
    },
    required: ["scenes", "totalScenes"],
    additionalProperties: false,
  };
}

/**
 * Build interleaved content array with images based on style and character references
 * Uses the same pattern as product-dna-visionary.ts for consistency
 */
async function buildImageAttachments(
  styleReferenceUrl?: string,
  styleReferenceDescription?: string,
  characterReferenceUrl?: string,
  characterReferenceDescription?: string
): Promise<Array<{ type: "input_text"; text: string } | { type: "input_image"; image_url: string }>> {
  const contentArray: Array<
    { type: "input_text"; text: string } | { type: "input_image"; image_url: string }
  > = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // STYLE REFERENCE (Image or Description)
  // ═══════════════════════════════════════════════════════════════════════════
  if (styleReferenceUrl) {
    // Image provided - add image with label
    contentArray.push({
      type: "input_text",
      text: "--- STYLE REFERENCE IMAGE ---\nAnalyze this image for visual style, color palette, lighting, composition, mood, and artistic techniques. Use this as the primary reference for matching the visual aesthetic in all generated image prompts."
    });
    contentArray.push({
      type: "input_image",
      image_url: styleReferenceUrl
    });
  } else if (styleReferenceDescription) {
    // Description only - add text description
    contentArray.push({
      type: "input_text",
      text: `--- STYLE REFERENCE DESCRIPTION ---\n${styleReferenceDescription}\n\nUse this description as the primary reference for matching the visual aesthetic in all generated image prompts.`
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHARACTER REFERENCE (Image or Description)
  // ═══════════════════════════════════════════════════════════════════════════
  if (characterReferenceUrl) {
    // Image provided - add image with label
    contentArray.push({
      type: "input_text",
      text: "--- CHARACTER REFERENCE IMAGE ---\nThis is the character that should appear consistently across all scenes. Analyze facial features, body type, clothing style, and distinctive characteristics. Ensure this character's appearance is maintained in all generated image prompts."
    });
    contentArray.push({
      type: "input_image",
      image_url: characterReferenceUrl
    });
  } else if (characterReferenceDescription) {
    // Description only - add text description
    contentArray.push({
      type: "input_text",
      text: `--- CHARACTER REFERENCE DESCRIPTION ---\n${characterReferenceDescription}\n\nUse this description to maintain character consistency across all scenes in the generated image prompts.`
    });
  }

  return contentArray;
}

  /**
   * Enhance storyboard with image prompts, voice text, and animation details
   */
  async function enhanceStoryboard(
    input: any,
    userId?: string,
    workspaceId?: string
  ): Promise<any> {
  console.log('[storyboard-enhancer] ═══════════════════════════════════════════════');
  console.log('[storyboard-enhancer] Starting storyboard enhancement');
  console.log('[storyboard-enhancer] ═══════════════════════════════════════════════');

  // ═══════════════════════════════════════════════════════════════════════════
  // INPUT VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    validateInput(input);
    console.log(`[${mode}:storyboard-enhancer] ✓ Input validation passed`);
  } catch (error) {
    console.error(`[${mode}:storyboard-enhancer] ✗ Input validation failed:`, error);
    throw error;
  }

  const { 
    scenes, 
    aspectRatio,
    imageStyle,
    voiceoverEnabled, 
    language,
    textOverlay,
    animationMode,
    animationType,
    styleReferenceUrl,
    styleReferenceDescription,
    characterReferenceUrl,
    characterReferenceDescription
  } = input;

  console.log('[storyboard-enhancer] Input parameters:', {
    sceneCount: scenes.length,
    aspectRatio,
    imageStyle,
    voiceoverEnabled,
    animationMode,
    styleReferenceUrl: styleReferenceUrl ? styleReferenceUrl.substring(0, 50) + '...' : undefined,
    styleReferenceDescription: styleReferenceDescription ? styleReferenceDescription.substring(0, 50) + '...' : undefined,
    characterReferenceUrl: characterReferenceUrl ? characterReferenceUrl.substring(0, 50) + '...' : undefined,
    characterReferenceDescription: characterReferenceDescription ? characterReferenceDescription.substring(0, 50) + '...' : undefined,
    hasStyleReference: !!(styleReferenceUrl || styleReferenceDescription),
    hasCharacterReference: !!(characterReferenceUrl || characterReferenceDescription),
  });

  const systemPrompt = buildStoryboardEnhancerSystemPrompt(
    aspectRatio,
    imageStyle,
    voiceoverEnabled,
    language,
    textOverlay,
    animationMode,
    animationType,
    !!(styleReferenceUrl || styleReferenceDescription),
    !!(characterReferenceUrl || characterReferenceDescription)
  );
  const userPrompt = buildStoryboardUserPrompt(
    scenes,
    aspectRatio,
    imageStyle,
    voiceoverEnabled,
    language,
    textOverlay,
    animationMode,
    animationType
  );

  const schema = buildStoryboardSchema(voiceoverEnabled, animationMode, animationType);

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD INTERLEAVED CONTENT ARRAY (Images + Text)
  // ═══════════════════════════════════════════════════════════════════════════
  const imageAttachments = await buildImageAttachments(
    styleReferenceUrl,
    styleReferenceDescription,
    characterReferenceUrl,
    characterReferenceDescription
  );

  console.log('[storyboard-enhancer] Image attachments result:', {
    attachmentCount: imageAttachments.length,
    imageCount: imageAttachments.filter((item) => item.type === "input_image").length,
    textCount: imageAttachments.filter((item) => item.type === "input_text").length,
    attachmentTypes: imageAttachments.map(item => item.type),
    firstAttachment: imageAttachments[0] ? {
      type: imageAttachments[0].type,
      hasImageUrl: imageAttachments[0] && imageAttachments[0].type === "input_image" ? !!(imageAttachments[0] as any).image_url : undefined,
      textPreview: imageAttachments[0] && imageAttachments[0].type === "input_text" ? (imageAttachments[0] as any).text.substring(0, 100) + '...' : undefined,
    } : undefined,
  });

  // Build content array (images first, then text prompt)
  const contentArray: Array<
    { type: "input_text"; text: string } | { type: "input_image"; image_url: string }
  > = [...imageAttachments];

  // Add user prompt at the end
  contentArray.push({
    type: "input_text",
    text: userPrompt
  });

  const imageCount = imageAttachments.filter((item) => item.type === "input_image").length;
  
  console.log('[storyboard-enhancer] Content array prepared:', {
    totalItems: contentArray.length,
    imageCount,
    textReferenceCount: imageAttachments.length,
    contentTypes: contentArray.map(item => item.type),
    willSendImages: imageCount > 0,
    willUseContentArray: true, // Always using contentArray now
  });

  if (imageCount > 0) {
    console.log(`[storyboard-enhancer] Sending ${imageCount} image(s) to GPT-4o Vision with interleaved pattern`);
  } else if (imageAttachments.length > 0) {
    // Has text descriptions but no images
    console.log(`[storyboard-enhancer] Sending ${imageAttachments.length} text reference(s) with interleaved pattern`);
  } else {
    console.log(`[${mode}:storyboard-enhancer] No images or text references - using text-only prompt`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CALL AI MODEL
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('[storyboard-enhancer] ═══════════════════════════════════════════════');
  console.log('[storyboard-enhancer] Calling AI model:', {
    provider: STORYBOARD_CONFIG.provider,
    model: STORYBOARD_CONFIG.model,
    sceneCount: scenes.length,
    hasImages: imageCount > 0,
    hasTextReferences: imageAttachments.length > 0,
  });
  console.log('[storyboard-enhancer] ═══════════════════════════════════════════════');

  try {
    const response = await callTextModel(
      {
        provider: STORYBOARD_CONFIG.provider,
        model: STORYBOARD_CONFIG.model,
        payload: {
          input: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              // Always use contentArray since userPrompt is already included as the last item
              // This matches the pattern used in product-dna-visionary.ts
              content: contentArray,
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "storyboard_output",
              strict: true,
              schema: schema,
            },
          },
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: 1500,
      }
    );

    console.log(`[${mode}:storyboard-enhancer] ✓ AI model response received`);
    console.log(`[${mode}:storyboard-enhancer] Response length:`, response.output.length, `characters`);
    console.log(`[${mode}:storyboard-enhancer] Usage:`, {
      inputTokens: response.usage?.inputTokens,
      outputTokens: response.usage?.outputTokens,
      totalCostUsd: response.usage?.totalCostUsd,
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // PARSE AND VALIDATE RESPONSE
    // ═══════════════════════════════════════════════════════════════════════════
    let parsed: any;
    try {
      parsed = JSON.parse(response.output.trim());
      console.log(`[${mode}:storyboard-enhancer] ✓ JSON parsed successfully`);
    } catch (parseError) {
      console.error(`[${mode}:storyboard-enhancer] ✗ JSON parsing failed:`, parseError);
      console.error(`[${mode}:storyboard-enhancer] Raw response (first 500 chars):`, response.output.substring(0, 500));
      throw new Error("Failed to parse AI response as JSON. The model may have returned invalid JSON.");
    }

    // Validate the response structure
    try {
      validateOutput(parsed, input);
      console.log(`[${mode}:storyboard-enhancer] ✓ Output validation passed`);
    } catch (validationError) {
      console.error(`[${mode}:storyboard-enhancer] ✗ Output validation failed:`, validationError);
      throw validationError;
    }

    // Log the enhanced scenes for debugging
    console.log(`[${mode}:storyboard-enhancer] Voiceover enabled:`, voiceoverEnabled);
    console.log(`[${mode}:storyboard-enhancer] Enhanced scenes:`, JSON.stringify(parsed.scenes, null, 2));

    // ═══════════════════════════════════════════════════════════════════════════
    // CRITICAL FIX: Use original narration as voiceText to ensure timing match
    // ═══════════════════════════════════════════════════════════════════════════
    if (voiceoverEnabled) {
      const wordsPerSecond = language === 'Arabic' || language === 'ar' ? 2 : 2.5;
      console.log(`[${mode}:storyboard-enhancer] ═══════════════════════════════════════════════`);
      console.log(`[${mode}:storyboard-enhancer] Voiceover Timing Validation & Fix:`);
      
      parsed.scenes.forEach((scene: any, index: number) => {
        const originalScene = scenes[index];
        const originalDuration = originalScene?.duration || 0;
        const originalNarration = originalScene?.narration || '';
        
        // ALWAYS use original narration as voiceText for timing accuracy
        // The AI-generated voiceText may be too long or too short
        if (originalNarration) {
          scene.voiceText = originalNarration;
        }
        
        const wordCount = scene.voiceText?.split(/\s+/).filter((w: string) => w.length > 0).length || 0;
        const expectedWords = Math.round(originalDuration * wordsPerSecond);
        const actualDuration = wordCount / wordsPerSecond;
        const difference = Math.abs(actualDuration - originalDuration);
        
        console.log(`[storyboard-enhancer] Scene ${scene.sceneNumber}:`);
        console.log(`[storyboard-enhancer]   Target duration: ${originalDuration}s`);
        console.log(`[storyboard-enhancer]   Expected words: ~${expectedWords}`);
        console.log(`[storyboard-enhancer]   Actual words: ${wordCount}`);
        console.log(`[storyboard-enhancer]   Estimated voiceover: ${actualDuration.toFixed(1)}s`);
        console.log(`[storyboard-enhancer]   Difference: ${difference > 0 ? '+' : ''}${difference.toFixed(1)}s`);
        
        if (difference > 2) {
          console.warn(`[${mode}:storyboard-enhancer]   ⚠️ WARNING: Duration mismatch > 2s - video sync will adjust`);
        } else {
          console.log(`[storyboard-enhancer]   ✓ Timing looks good`);
        }
      });
      console.log(`[${mode}:storyboard-enhancer] ═══════════════════════════════════════════════`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUTO-FILL TRANSITIONS: If AI didn't provide transitions, auto-select them
    // ═══════════════════════════════════════════════════════════════════════════
    if (animationMode) {
      console.log(`[${mode}:storyboard-enhancer] ═══════════════════════════════════════════════`);
      console.log(`[${mode}:storyboard-enhancer] Scene Transitions (2025 Trending):`);
      
      parsed.scenes.forEach((scene: any, index: number) => {
        const isLastScene = index === parsed.scenes.length - 1;
        
        // If no transition was provided or it's the last scene
        if (isLastScene) {
          scene.transitionToNext = 'none';
          scene.transitionDuration = 0;
        } else if (!scene.transitionToNext) {
          // Auto-select transition based on mood
          const currentMood = (scene.voiceMood || 'neutral') as VoiceMood;
          const nextScene = parsed.scenes[index + 1];
          const nextMood = nextScene?.voiceMood || null;
          
          // Detect content type for smarter selection
          let contentType: string | undefined;
          if (index === 0) {
            contentType = 'intro';
          } else if (index === parsed.scenes.length - 2) {
            contentType = 'cta'; // Second to last is often CTA
          }
          
          scene.transitionToNext = selectTransitionForScene(
            currentMood,
            nextMood,
            contentType,
            'medium', // Default pacing
            false
          );
          scene.transitionDuration = getTransitionDuration(scene.transitionToNext, 'medium');
        } else {
          // Transition was provided, calculate duration
          scene.transitionDuration = getTransitionDuration(scene.transitionToNext as SceneTransition, 'medium');
        }
        
        const nextSceneLabel = index < parsed.scenes.length - 1 ? `Scene ${scene.sceneNumber + 1}` : 'END';
        console.log(`[${mode}:storyboard-enhancer] Scene ${scene.sceneNumber} → ${nextSceneLabel}: ${scene.transitionToNext} (${scene.transitionDuration?.toFixed(2) || 0}s)`);
      });
      
      console.log(`[${mode}:storyboard-enhancer] ═══════════════════════════════════════════════`);
    }

    return {
      scenes: parsed.scenes,
      totalScenes: parsed.totalScenes || parsed.scenes.length,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error: any) {
    console.error(`[${mode}:storyboard-enhancer] ═══════════════════════════════════════════════`);
    console.error(`[${mode}:storyboard-enhancer] ✗ Storyboard enhancement failed`);
    console.error(`[${mode}:storyboard-enhancer] ═══════════════════════════════════════════════`);
    
    // Handle specific error types
    if (error.message?.includes('rate limit')) {
      console.error(`[${mode}:storyboard-enhancer] Rate limit error detected`);
      throw new Error("Rate limit exceeded. Please try again in a moment.");
    }

    if (error.message?.includes('insufficient credits') || error.message?.includes('quota')) {
      console.error(`[${mode}:storyboard-enhancer] Insufficient credits/quota error detected`);
      throw new Error("Insufficient credits or quota exceeded. Please check your account.");
    }

    if (error.message?.includes('JSON')) {
      console.error(`[${mode}:storyboard-enhancer] JSON parsing/validation error`);
      throw new Error(`Invalid response format: ${error.message}`);
    }

    // Generic error
    console.error(`[${mode}:storyboard-enhancer] Error details:`, {
      message: error.message,
      stack: error.stack?.substring(0, 500),
    });
    
    throw new Error(`Failed to enhance storyboard: ${error.message || 'Unknown error'}`);
  }
  }

  return enhanceStoryboard;
}

/**
 * Enhance storyboard (backward compatibility - uses problem-solution mode by default)
 */
export async function enhanceStoryboard(
  input: any,
  userId?: string,
  workspaceId?: string
): Promise<any> {
  const enhancer = await createStoryboardEnhancer("problem-solution");
  return enhancer(input, userId, workspaceId);
}

