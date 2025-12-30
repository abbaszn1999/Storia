import { callTextModel } from '../../../ai/service';
import { getModelConfig } from '../../../ai/config';
import { scriptWriterSystemPrompt, generateScriptPrompt } from '../prompts/script-writer';
import { characterAnalyzerSystemPrompt, analyzeCharactersPrompt } from '../prompts/character-analyzer';
import { locationAnalyzerSystemPrompt, analyzeLocationsPrompt } from '../prompts/location-analyzer';
import { sceneAnalyzerSystemPrompt, analyzeScriptPrompt } from '../prompts/scene-analyzer';
import { characterCreatorSystemPrompt, createCharacterPrompt } from '../prompts/character-creator';
import { imagePrompterSystemPrompt, generateImagePrompt } from '../prompts/image-prompter';
import { videoAnimatorSystemPrompt, generateVideoPrompt } from '../prompts/video-animator';
import { 
  generateCharacterImage as generateCharacterImageAgent,
  type CharacterImageInput,
  type CharacterImageOutput,
  getDefaultCharacterImageModel
} from '../../../assets/characters/agents/character-image-generator';
import { 
  generateLocationImage as generateLocationImageAgent,
  type LocationImageInput,
  type LocationImageOutput,
  getDefaultLocationImageModel
} from '../../../assets/locations/agents/location-image-generator';

export interface ScriptSettings {
  duration: number;
  genre: string;  // Can be comma-separated string like "Adventure, Fantasy"
  language: string;
  tone?: string;  // Can be comma-separated string like "Cinematic, Dramatic"
  userPrompt?: string;  // User's story idea/concept
  model?: string;  // AI model selection (e.g., "gpt-5", "gemini-2.5-flash")
}

export interface ScriptGeneratorOutput {
  script: string;
  estimatedDuration: number;
  metadata: {
    wordCount: number;
    characterCount: number;
    cost?: number;
  };
}

export interface CharacterAnalysisOutput {
  characters: Array<{
    name: string;
    description: string;
    personality: string;
    appearance: string;
    importanceScore: number;  // 1-10
  }>;
  metadata: {
    totalCharacters: number;
    cost?: number;
  };
}

export interface LocationAnalysisOutput {
  locations: Array<{
    name: string;
    description: string;
    atmosphere: string;
    timeOfDay: string;
    importanceScore: number;  // 1-10
  }>;
  metadata: {
    totalLocations: number;
    cost?: number;
  };
}

export interface CharacterInfo {
  name: string;
  role?: string;
  description?: string;
  style: string;
}

export interface ShotInfo {
  sceneDescription: string;
  shotType: string;
  characters?: string[];
  location: string;
  timeOfDay: string;
  visualStyle: string;
  cameraMovement?: string;
  additionalNotes?: string;
}

export interface AnimationInfo {
  shotDescription: string;
  cameraMovement: string;
  action: string;
  duration: number;
  pacing?: string;
}

export interface CharacterImageSettings {
  name: string;
  appearance: string;
  personality?: string;
  artStyleDescription?: string;
  model?: string;  // User-selectable in narrative mode (default: nano-banana)
  negativePrompt?: string;
  referenceImages?: string[];
  styleReferenceImage?: string;  // Style reference image URL (optional)
}

export interface CharacterImageGeneratorOutput {
  imageUrl: string;
  cost?: number;
  error?: string;
}

export interface LocationImageSettings {
  name: string;
  description: string;
  details?: string;
  artStyleDescription?: string;
  model?: string;  // User-selectable in narrative mode (default: nano-banana)
  negativePrompt?: string;
  referenceImages?: string[];
  styleReferenceImage?: string;  // Style reference image URL (optional)
}

export interface LocationImageGeneratorOutput {
  imageUrl: string;
  cost?: number;
  error?: string;
}

export class NarrativeAgents {
  static async generateScript(
    settings: ScriptSettings,
    userId?: string,
    workspaceId?: string
  ): Promise<ScriptGeneratorOutput> {
    const { duration, genre, language, tone, userPrompt, model } = settings;
    
    // Determine provider and model
    let provider: "openai" | "gemini" = "openai";
    let modelName = model || "gpt-5";  // Use provided model or default to gpt-5
    
    // Parse model string to determine provider
    if (modelName.startsWith("gemini")) {
      provider = "gemini";
    }
    
    // Build user prompt with parameters
    const userPromptText = generateScriptPrompt(settings);
    
    // Check if the model supports reasoning
    let supportsReasoning = false;
    try {
      const modelConfig = getModelConfig(provider, modelName);
      supportsReasoning = modelConfig.metadata?.reasoning === true;
    } catch {
      // Model not found in config, assume no reasoning support
    }
    
    console.log('[narrative:agents] Generating script:', {
      duration,
      genre,
      language,
      tone,
      model: modelName,
      provider,
      supportsReasoning,
      hasUserPrompt: !!userPrompt,
    });
    
    try {
      // Calculate expected output tokens based on duration
      // Formula: ~25 words per second of video * 4 tokens per word
      // Add 20% buffer for formatting and structure
      const expectedOutputTokens = Math.ceil(duration * 25 * 4 * 1.2);
      
      // Build payload - only include reasoning for models that support it
      const payload: any = {
        input: [
          { role: "system", content: scriptWriterSystemPrompt },
          { role: "user", content: userPromptText },
        ],
      };
      
      // Only add reasoning parameter for models that support it (gpt-5, gpt-5.1)
      if (supportsReasoning) {
        payload.reasoning = { effort: "low" };
      }
      
      const response = await callTextModel(
        {
          provider,
          model: modelName,
          payload,
          userId,
          workspaceId,
        },
        {
          expectedOutputTokens,
        }
      );
      
      const script = response.output.trim();
      const words = script.split(/\s+/);
      const wordCount = words.length;
      
      // Calculate estimated duration based on average speaking rate (150 words per minute)
      const estimatedDuration = Math.ceil((wordCount / 150) * 60);
      
      console.log('[narrative:agents] Script generated successfully:', {
        wordCount,
        charCount: script.length,
        estimatedDuration,
        targetDuration: duration,
        cost: response.usage?.totalCostUsd,
      });
      
      return {
        script,
        estimatedDuration,
        metadata: {
          wordCount,
          characterCount: script.length,
          cost: response.usage?.totalCostUsd,
        },
      };
    } catch (error) {
      console.error('[narrative:agents] Failed to generate script:', error);
      throw new Error(`Failed to generate script: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async analyzeCharacters(
    script: string,
    genre: string,
    userId?: string,
    workspaceId?: string,
    model?: string
  ): Promise<CharacterAnalysisOutput> {
    // Determine provider and model
    let provider: "openai" | "gemini" = "openai";
    let modelName = model || "gpt-5";  // Use provided model or default to gpt-5
    
    // Parse model string to determine provider
    if (modelName.startsWith("gemini")) {
      provider = "gemini";
    }
    
    // Check if the model supports reasoning
    let supportsReasoning = false;
    try {
      const modelConfig = getModelConfig(provider, modelName);
      supportsReasoning = modelConfig.metadata?.reasoning === true;
    } catch {
      // Model not found in config, assume no reasoning support
    }
    
    // Build user prompt with script and genre
    const userPromptText = analyzeCharactersPrompt(script, genre);
    
    console.log('[narrative:agents] Analyzing characters:', {
      scriptLength: script.length,
      genre,
      model: modelName,
      provider,
      supportsReasoning,
      userId,
      workspaceId,
    });
    
    try {
      // Calculate expected output tokens
      // Estimate: ~200 tokens per character, assume max 10 characters
      const expectedOutputTokens = 2000;
      
      // Build payload with JSON schema for structured output
      const payload: any = {
        input: [
          { role: "system", content: characterAnalyzerSystemPrompt },
          { role: "user", content: userPromptText },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "character_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                characters: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      personality: { type: "string" },
                      appearance: { type: "string" },
                      importanceScore: { type: "number" },
                    },
                    required: ["name", "description", "personality", "appearance", "importanceScore"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["characters"],
              additionalProperties: false,
            },
          },
        },
      };
      
      // Only add reasoning parameter for models that support it (gpt-5, gpt-5.1)
      if (supportsReasoning) {
        payload.reasoning = { effort: "low" };
      }
      
      const response = await callTextModel(
        {
          provider,
          model: modelName,
          payload,
          userId,
          workspaceId,
        },
        {
          expectedOutputTokens,
        }
      );
      
      // Parse the JSON response
      let rawOutput = response.output.trim();
      
      // Strip markdown code fences if present
      if (rawOutput.startsWith('```')) {
        rawOutput = rawOutput
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/```\s*$/, '')
          .trim();
      }
      
      // Parse JSON response (JSON schema enforces camelCase structure)
      let parsedData: any;
      try {
        parsedData = JSON.parse(rawOutput);
      } catch (parseError) {
        console.error('[narrative:agents] Failed to parse JSON response:', rawOutput);
        throw new Error('AI returned invalid JSON format');
      }
      
      // Validate structure
      if (!parsedData.characters || !Array.isArray(parsedData.characters)) {
        console.error('[narrative:agents] Invalid response structure:', parsedData);
        throw new Error('AI response missing characters array');
      }
      
      // Validate and transform characters (schema ensures correct structure)
      const transformedCharacters = parsedData.characters.map((char: any) => {
        if (!char.name || !char.description || !char.personality || !char.appearance || typeof char.importanceScore !== 'number') {
          console.warn('[narrative:agents] Character missing required fields:', char);
        }
        
        return {
          name: char.name || 'Unknown Character',
          description: char.description || '',
          personality: char.personality || '',
          appearance: char.appearance || '',
          importanceScore: char.importanceScore || 5,
        };
      });
      
      // Sort by importance score (descending)
      transformedCharacters.sort((a: typeof transformedCharacters[0], b: typeof transformedCharacters[0]) => 
        b.importanceScore - a.importanceScore
      );
      
      console.log('[narrative:agents] Characters analyzed successfully:', {
        totalCharacters: transformedCharacters.length,
        cost: response.usage?.totalCostUsd,
      });
      
      return {
        characters: transformedCharacters,
        metadata: {
          totalCharacters: transformedCharacters.length,
          cost: response.usage?.totalCostUsd,
        },
      };
    } catch (error) {
      console.error('[narrative:agents] Failed to analyze characters:', error);
      throw new Error(`Failed to analyze characters: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async analyzeLocations(
    script: string,
    genre: string,
    userId?: string,
    workspaceId?: string,
    model?: string
  ): Promise<LocationAnalysisOutput> {
    // Determine provider and model
    let provider: "openai" | "gemini" = "openai";
    let modelName = model || "gpt-4o";  // Default to gpt-4o for analysis
    
    // Parse model string to determine provider
    if (modelName.startsWith("gemini")) {
      provider = "gemini";
    }
    
    // Check if the model supports reasoning
    let supportsReasoning = false;
    try {
      const modelConfig = getModelConfig(provider, modelName);
      supportsReasoning = modelConfig.metadata?.reasoning === true;
    } catch {
      // Model not found in config, assume no reasoning support
    }
    
    // Build user prompt with script and genre
    const userPromptText = analyzeLocationsPrompt(script, genre);
    
    console.log('[narrative:agents] Analyzing locations:', {
      scriptLength: script.length,
      genre,
      model: modelName,
      provider,
      supportsReasoning,
      userId,
      workspaceId,
    });
    
    try {
      // Calculate expected output tokens
      // Estimate: ~150 tokens per location, assume max 10 locations
      const expectedOutputTokens = 1500;
      
      // Build payload with JSON schema for structured output
      const payload: any = {
        input: [
          { role: "system", content: locationAnalyzerSystemPrompt },
          { role: "user", content: userPromptText },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "location_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                locations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      atmosphere: { type: "string" },
                      timeOfDay: { type: "string" },
                      importanceScore: { type: "number" },
                    },
                    required: ["name", "description", "atmosphere", "timeOfDay", "importanceScore"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["locations"],
              additionalProperties: false,
            },
          },
        },
      };
      
      // Only add reasoning parameter for models that support it (gpt-5, gpt-5.1)
      if (supportsReasoning) {
        payload.reasoning = { effort: "low" };
      }
      
      const response = await callTextModel(
        {
          provider,
          model: modelName,
          payload,
          userId,
          workspaceId,
        },
        {
          expectedOutputTokens,
        }
      );
      
      // Parse the JSON response
      let rawOutput = response.output.trim();
      
      // Strip markdown code fences if present
      if (rawOutput.startsWith('```')) {
        rawOutput = rawOutput
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/```\s*$/, '')
          .trim();
      }
      
      // Parse JSON response (JSON schema enforces camelCase structure)
      let parsedData: any;
      try {
        parsedData = JSON.parse(rawOutput);
      } catch (parseError) {
        console.error('[narrative:agents] Failed to parse JSON response:', rawOutput);
        throw new Error('AI returned invalid JSON format');
      }
      
      // Validate structure
      if (!parsedData.locations || !Array.isArray(parsedData.locations)) {
        console.error('[narrative:agents] Invalid response structure:', parsedData);
        throw new Error('AI response missing locations array');
      }
      
      // Validate and transform locations (schema ensures correct structure)
      const transformedLocations = parsedData.locations.map((loc: any) => {
        if (!loc.name || !loc.description || !loc.atmosphere || !loc.timeOfDay || typeof loc.importanceScore !== 'number') {
          console.warn('[narrative:agents] Location missing required fields:', loc);
        }
        
        return {
          name: loc.name || 'Unknown Location',
          description: loc.description || '',
          atmosphere: loc.atmosphere || '',
          timeOfDay: loc.timeOfDay || 'unspecified',
          importanceScore: loc.importanceScore || 5,
        };
      });
      
      // Sort by importance score (descending)
      transformedLocations.sort((a: typeof transformedLocations[0], b: typeof transformedLocations[0]) => 
        b.importanceScore - a.importanceScore
      );
      
      console.log('[narrative:agents] Locations analyzed successfully:', {
        totalLocations: transformedLocations.length,
        cost: response.usage?.totalCostUsd,
      });
      
      return {
        locations: transformedLocations,
        metadata: {
          totalLocations: transformedLocations.length,
          cost: response.usage?.totalCostUsd,
        },
      };
    } catch (error) {
      console.error('[narrative:agents] Failed to analyze locations:', error);
      throw new Error(`Failed to analyze locations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async analyzeScript(script: string): Promise<any[]> {
    const systemPrompt = sceneAnalyzerSystemPrompt;
    const userPrompt = analyzeScriptPrompt(script);
    
    return [];
  }

  /**
   * Agent 3.1: Scene Analyzer
   * Breaks script into logical scenes with narrative structure
   */
  static async generateScenes(
    input: {
      script: string;
      targetDuration: number;
      genre: string;
      tone?: string;
      numberOfScenes: number | 'auto';
      characters: Array<{ id: string; name: string; description?: string }>;
      locations: Array<{ id: string; name: string; description?: string }>;
      model?: string;
    },
    videoId: string,
    userId?: string,
    workspaceId?: string
  ): Promise<{
    scenes: any[];
    totalDuration: number;
    cost?: number;
  }> {
    const { generateScenes } = await import('./breakdown/scene-analyzer');
    return generateScenes(input, videoId, userId, workspaceId);
  }

  /**
   * Agent 3.2: Shot Composer
   * Breaks scenes into individual shots with camera framing, timing, narration, and action descriptions
   */
  static async composeShots(
    input: {
      script: string;
      scene: {
        id: string;
        sceneNumber: number;
        title: string;
        description?: string | null;
        duration?: number | null;
      };
      previousScenes: Array<{
        scene: {
          id: string;
          sceneNumber: number;
          title: string;
          description?: string | null;
          duration?: number | null;
        };
        shots: any[];
      }>;
      shotsPerScene: number | 'auto';
      characters: Array<{ id: string; name: string; description?: string }>;
      locations: Array<{ id: string; name: string; description?: string }>;
      genre: string;
      tone?: string;
      model?: string;
    },
    userId?: string,
    workspaceId?: string
  ): Promise<{
    shots: any[];
    cost?: number;
  }> {
    const { composeShots } = await import('./breakdown/shot-composer');
    return composeShots(input, userId, workspaceId);
  }

  /**
   * Agent 3.2: Shot Composer (for multiple scenes)
   * Composes shots for all scenes sequentially
   */
  static async composeShotsForScenes(
    scenes: Array<{
      id: string;
      sceneNumber: number;
      title: string;
      description?: string | null;
      duration?: number | null;
    }>,
    input: {
      script: string;
      shotsPerScene: number | 'auto';
      characters: Array<{ id: string; name: string; description?: string }>;
      locations: Array<{ id: string; name: string; description?: string }>;
      genre: string;
      tone?: string;
      model?: string;
    },
    userId?: string,
    workspaceId?: string
  ): Promise<{
    shots: Record<string, any[]>;
    totalCost: number;
  }> {
    const { composeShotsForScenes } = await import('./breakdown/shot-composer');
    return composeShotsForScenes(scenes, input, userId, workspaceId);
  }

  static async createCharacter(characterInfo: CharacterInfo): Promise<string> {
    const systemPrompt = characterCreatorSystemPrompt;
    const userPrompt = createCharacterPrompt(characterInfo);
    
    return `[PLACEHOLDER] Character description will be generated with AI`;
  }

  static async generateImagePrompt(shotInfo: ShotInfo): Promise<string> {
    const systemPrompt = imagePrompterSystemPrompt;
    const userPrompt = generateImagePrompt(shotInfo);
    
    return `[PLACEHOLDER] Image prompt will be generated with AI`;
  }

  static async generateVideoPrompt(animationInfo: AnimationInfo): Promise<string> {
    const systemPrompt = videoAnimatorSystemPrompt;
    const userPrompt = generateVideoPrompt(animationInfo);
    
    return `[PLACEHOLDER] Video prompt will be generated with AI`;
  }

  static async generateImage(prompt: string, referenceImages?: string[]): Promise<string> {
    return `[PLACEHOLDER] Image will be generated with Nano Banana/Gemini 2.5 Flash`;
  }

  static async generateVideo(imageUrl: string, prompt: string): Promise<string> {
    return `[PLACEHOLDER] Video will be generated from image`;
  }

  /**
   * Agent 2.3: Generate character reference portrait image
   * 
   * In narrative mode, users can select the image model.
   * Default model is nano-banana if not specified.
   */
  static async generateCharacterImage(
    settings: CharacterImageSettings,
    userId?: string,
    workspaceId?: string
  ): Promise<CharacterImageGeneratorOutput> {
    const { 
      name, 
      appearance, 
      personality, 
      artStyleDescription, 
      model, 
      negativePrompt, 
      referenceImages,
      styleReferenceImage 
    } = settings;

    console.log('[narrative:agents] Generating character image (Agent 2.3):', {
      characterName: name,
      model: model || getDefaultCharacterImageModel(),
      hasArtStyle: !!artStyleDescription,
      hasReferenceImages: referenceImages && referenceImages.length > 0,
      hasStyleReference: !!styleReferenceImage,
      userId,
      workspaceId,
    });

    try {
      const result = await generateCharacterImageAgent(
        {
          name,
          appearance,
          personality,
          artStyleDescription,
          model: model || getDefaultCharacterImageModel(),
          negativePrompt,
          referenceImages,
          styleReferenceImage,
        },
        userId,
        workspaceId
      );

      if (result.error) {
        console.error('[narrative:agents] Character image generation failed:', result.error);
        return {
          imageUrl: '',
          error: result.error,
        };
      }

      console.log('[narrative:agents] Character image generated successfully:', {
        characterName: name,
        imageUrl: result.imageUrl ? result.imageUrl.substring(0, 50) + '...' : 'none',
        cost: result.cost,
      });

      return {
        imageUrl: result.imageUrl,
        cost: result.cost,
      };
    } catch (error) {
      console.error('[narrative:agents] Character image generation error:', error);
      return {
        imageUrl: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Agent 2.4: Location Image Generator
   * 
   * Generates consistent location reference images using AI
   * Supports user-selectable models in narrative mode
   */
  static async generateLocationImage(
    settings: LocationImageSettings,
    userId?: string,
    workspaceId?: string
  ): Promise<LocationImageGeneratorOutput> {
    const { 
      name, 
      description,
      details, 
      artStyleDescription, 
      model, 
      negativePrompt, 
      referenceImages,
      styleReferenceImage 
    } = settings;

    console.log('[narrative:agents] Generating location image (Agent 2.4):', {
      locationName: name,
      model: model || getDefaultLocationImageModel(),
      hasArtStyle: !!artStyleDescription,
      hasReferenceImages: referenceImages && referenceImages.length > 0,
      hasStyleReference: !!styleReferenceImage,
      userId,
      workspaceId,
    });

    try {
      const result = await generateLocationImageAgent(
        {
          name,
          description,
          details,
          artStyleDescription,
          model: model || getDefaultLocationImageModel(),
          negativePrompt,
          referenceImages,
          styleReferenceImage,
        },
        userId,
        workspaceId
      );

      if (result.error) {
        console.error('[narrative:agents] Location image generation failed:', result.error);
        return {
          imageUrl: '',
          error: result.error,
        };
      }

      console.log('[narrative:agents] Location image generated successfully:', {
        locationName: name,
        imageUrl: result.imageUrl ? result.imageUrl.substring(0, 50) + '...' : 'none',
        cost: result.cost,
      });

      return {
        imageUrl: result.imageUrl,
        cost: result.cost,
      };
    } catch (error) {
      console.error('[narrative:agents] Location image generation error:', error);
      return {
        imageUrl: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
