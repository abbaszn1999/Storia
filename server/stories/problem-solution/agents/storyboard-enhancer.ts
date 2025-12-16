import { callTextModel } from "../../../ai/service";
import {
  buildStoryboardEnhancerSystemPrompt,
  buildStoryboardUserPrompt,
} from "../prompts/storyboard-prompts";
import type {
  StoryboardEnhancerInput,
  StoryboardEnhancerOutput,
  EnhancedSceneOutput,
} from "../types";

const STORYBOARD_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",
};

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
      
    } else if (animationType === 'image-to-video') {
      sceneProperties.videoPrompt = {
        type: "string",
        description: "Description of motion/animation for image-to-video",
      };
      requiredFields.push("videoPrompt");
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

export async function enhanceStoryboard(
  input: StoryboardEnhancerInput,
  userId?: string,
  workspaceId?: string
): Promise<StoryboardEnhancerOutput> {
  const { 
    scenes, 
    aspectRatio,
    imageStyle,
    voiceoverEnabled, 
    language,
    textOverlay,
    animationMode,
    animationType 
  } = input;

  console.log('[storyboard-enhancer] Enhancing storyboard:', {
    sceneCount: scenes.length,
    aspectRatio,
    imageStyle,
    voiceoverEnabled,
    animationMode,
  });

  const systemPrompt = buildStoryboardEnhancerSystemPrompt(
    aspectRatio,
    imageStyle,
    voiceoverEnabled,
    language,
    textOverlay,
    animationMode,
    animationType
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

  try {
    const response = await callTextModel(
      {
        provider: STORYBOARD_CONFIG.provider,
        model: STORYBOARD_CONFIG.model,
        payload: {
          input: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          text: {
            format: {
              type: "json_object",
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

    // Parse the JSON response
    const parsed = JSON.parse(response.output.trim());

    // Validate the response
    if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
      throw new Error("Invalid response: missing scenes array");
    }

    // Log the enhanced scenes for debugging
    console.log('[storyboard-enhancer] Voiceover enabled:', voiceoverEnabled);
    console.log('[storyboard-enhancer] Enhanced scenes:', JSON.stringify(parsed.scenes, null, 2));

    // ═══════════════════════════════════════════════════════════════════════════
    // CRITICAL FIX: Use original narration as voiceText to ensure timing match
    // ═══════════════════════════════════════════════════════════════════════════
    if (voiceoverEnabled) {
      const wordsPerSecond = language === 'Arabic' || language === 'ar' ? 2 : 2.5;
      console.log('[storyboard-enhancer] ═══════════════════════════════════════════════');
      console.log('[storyboard-enhancer] Voiceover Timing Validation & Fix:');
      
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
          console.warn(`[storyboard-enhancer]   ⚠️ WARNING: Duration mismatch > 2s - video sync will adjust`);
        } else {
          console.log(`[storyboard-enhancer]   ✓ Timing looks good`);
        }
      });
      console.log('[storyboard-enhancer] ═══════════════════════════════════════════════');
    }

    return {
      scenes: parsed.scenes,
      totalScenes: parsed.totalScenes || parsed.scenes.length,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error(
      "[problem-solution:storyboard-enhancer] Failed to enhance storyboard:",
      error
    );
    throw new Error("Failed to enhance storyboard");
  }
}

