import { callTextModel } from '../../../ai/service';
import { getModelConfig } from '../../../ai/config';
import { scriptWriterSystemPrompt, generateScriptPrompt } from '../prompts/script-writer';
import { characterAnalyzerSystemPrompt, analyzeCharactersPrompt } from '../prompts/character-analyzer';
import { locationAnalyzerSystemPrompt, analyzeLocationsPrompt } from '../prompts/location-analyzer';
import { sceneAnalyzerSystemPrompt, analyzeScriptPrompt } from '../prompts/scene-analyzer';
import { characterCreatorSystemPrompt, createCharacterPrompt } from '../prompts/character-creator';
import { imagePrompterSystemPrompt, generateImagePrompt } from '../prompts/image-prompter';
import { videoAnimatorSystemPrompt, generateVideoPrompt } from '../prompts/video-animator';
import { promptEngineerSystemPrompt, generatePromptEngineerPrompt, type PromptEngineerUserPromptInput } from '../prompts/prompt-engineer';
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
import {
  generateStoryboardImage as generateStoryboardImageAgent,
  type StoryboardImageInput,
  type StoryboardImageOutput,
} from './image-generator';

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

export interface PromptEngineerInput {
  shot: {
    id: string;
    sceneId: string;
    sceneTitle: string;
    shotNumber: number;
    duration: number;
    shotType: string;
    cameraMovement: string;
    narrationText: string;  // May contain @tags
    actionDescription: string;  // Contains @tags
    characters: string[];  // Array of @{CharacterName} tags
    location: string;  // @{LocationName} tag
    frameMode?: "image-reference" | "start-end";  // For auto mode
  };
  narrativeMode: "image-reference" | "start-end" | "auto";
  continuity: {
    inGroup: boolean;
    groupId: string | null;
    isFirstInGroup: boolean;
    previousEndFrameSummary?: string;
    continuityConstraints?: string;
  };
  characterReferences: Array<{
    name: string;
    anchor: string;  // Short stable identity descriptor
    currentOutfit?: string;
    keyTraits?: string;
    refImageUrl?: string;  // CDN URL for reference image
  }>;
  locationReferences: Array<{
    name: string;
    anchor: string;  // Short stable location descriptor
    refImageUrl?: string;  // CDN URL for reference image
  }>;
  styleReference?: {
    anchor?: string;  // Text description (if available)
    negativeStyle?: string;
    refImageUrl?: string;  // Style reference image URL
  };
  generationTargets: {
    imageModel: string;  // e.g., "flux-2-dev", "nano-banana", "seedream-4.0"
    videoModel: string;  // e.g., "kling", "runway", "luma"
    aspectRatio: string;  // e.g., "16:9", "9:16", "1:1"
    realismLevel?: string;  // e.g., "photoreal", "stylized", "anime", "3d"
  };
  model?: string;  // AI model for prompt generation (e.g., "gpt-5", "gpt-4o")
}

export interface PromptEngineerOutput {
  sceneId: string;
  shotNumber: number;
  finalFrameMode: "image-reference" | "start-end";
  continuity: {
    inGroup: boolean;
    groupId: string | null;
    isFirstInGroup: boolean;
  };
  imagePrompt: string;  // For image-reference mode
  startFramePrompt: string;  // For start-end mode (empty if not applicable)
  endFramePrompt: string;  // For start-end mode
  videoPrompt: string;
  negativePrompt: string;
  referenceImageUrls: string[];  // All character + location + style reference URLs
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS FOR PROMPT ENGINEER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract character and location names from @tags in text
 */
function extractTagNames(text: string): { characterNames: string[]; locationNames: string[] } {
  const characterNames: string[] = [];
  const locationNames: string[] = [];
  
  // Match @{Name} or @Name patterns
  const tagPattern = /@\{?([^}]+)\}?/g;
  let match;
  
  while ((match = tagPattern.exec(text)) !== null) {
    const name = match[1].trim();
    // Heuristic: if it starts with capital and is in characters array, it's a character
    // Otherwise, we'll match against provided references
    if (name) {
      // We'll determine if it's character or location based on context
      // For now, collect all and let the caller match
      if (!characterNames.includes(name) && !locationNames.includes(name)) {
        // Default to character if starts with capital (common pattern)
        if (name[0] === name[0].toUpperCase()) {
          characterNames.push(name);
        } else {
          locationNames.push(name);
        }
      }
    }
  }
  
  return { characterNames, locationNames };
}

/**
 * Collect all reference image URLs from character, location, and style references
 */
function collectReferenceUrls(
  characterReferences: PromptEngineerInput['characterReferences'],
  locationReferences: PromptEngineerInput['locationReferences'],
  styleReference?: PromptEngineerInput['styleReference']
): string[] {
  const urls: string[] = [];
  
  // Collect character reference images
  for (const charRef of characterReferences) {
    if (charRef.refImageUrl) {
      urls.push(charRef.refImageUrl);
    }
  }
  
  // Collect location reference images
  for (const locRef of locationReferences) {
    if (locRef.refImageUrl) {
      urls.push(locRef.refImageUrl);
    }
  }
  
  // Collect style reference image
  if (styleReference?.refImageUrl) {
    urls.push(styleReference.refImageUrl);
  }
  
  return urls;
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

  /**
   * Agent 4.1: Shot Prompt Engineer
   * Generates both image and video prompts for a shot in a single AI call
   */
  static async generatePrompts(
    input: PromptEngineerInput,
    userId?: string,
    workspaceId?: string
  ): Promise<PromptEngineerOutput> {
    // Determine effective frame mode
    const effectiveMode = input.narrativeMode === "auto"
      ? (input.shot.frameMode || "image-reference")
      : input.narrativeMode;
    
    // Determine provider and model
    let provider: "openai" | "gemini" = "openai";
    let modelName = input.model || "gpt-4o";  // Default to gpt-4o for prompt engineering
    
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
    
    // Build user prompt
    const userPromptInput: PromptEngineerUserPromptInput = {
      shot: {
        sceneId: input.shot.sceneId,
        sceneTitle: input.shot.sceneTitle,
        shotNumber: input.shot.shotNumber,
        duration: input.shot.duration,
        shotType: input.shot.shotType,
        cameraMovement: input.shot.cameraMovement,
        narrationText: input.shot.narrationText,
        actionDescription: input.shot.actionDescription,
        characters: input.shot.characters,
        location: input.shot.location,
        frameMode: input.shot.frameMode,
      },
      narrativeMode: input.narrativeMode,
      continuity: input.continuity,
      characterReferences: input.characterReferences,
      locationReferences: input.locationReferences,
      styleReference: input.styleReference,
      generationTargets: input.generationTargets,
    };
    
    const userPrompt = generatePromptEngineerPrompt(userPromptInput);
    
    
    console.log('[narrative:agents] Generating prompts (Agent 4.1):', {
      shotId: input.shot.id,
      shotNumber: input.shot.shotNumber,
      effectiveMode,
      model: modelName,
      provider,
      supportsReasoning,
      inGroup: input.continuity.inGroup,
      isFirstInGroup: input.continuity.isFirstInGroup,
      userId,
      workspaceId,
    });
    
    try {
      // Calculate expected output tokens
      // Estimate: ~500 tokens for prompts (image + video + negative)
      const expectedOutputTokens = 1000;
      
      // Build payload with JSON schema for structured output
      const payload: any = {
        input: [
          { role: "system", content: promptEngineerSystemPrompt },
          { role: "user", content: userPrompt },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "prompt_engineer_output",
            strict: true,
            schema: {
              type: "object",
              properties: {
                scene_id: { type: "string" },
                shotNumber: { type: "number" },
                finalFrameMode: { 
                  type: "string",
                  enum: ["image-reference", "start-end"]
                },
                continuity: {
                  type: "object",
                  properties: {
                    in_group: { type: "boolean" },
                    group_id: { type: ["string", "null"] },
                    is_first_in_group: { type: "boolean" },
                  },
                  required: ["in_group", "group_id", "is_first_in_group"],
                  additionalProperties: false,
                },
                imagePrompt: { type: "string" },
                startFramePrompt: { type: "string" },
                endFramePrompt: { type: "string" },
                videoPrompt: { type: "string" },
                negativePrompt: { type: "string" },
              },
              required: [
                "scene_id",
                "shotNumber",
                "finalFrameMode",
                "continuity",
                "imagePrompt",
                "startFramePrompt",
                "endFramePrompt",
                "videoPrompt",
                "negativePrompt",
              ],
              additionalProperties: false,
            },
          },
        },
      };
      
      // Only add reasoning parameter for models that support it
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
      
      // Parse JSON response
      let parsedData: any;
      try {
        parsedData = JSON.parse(rawOutput);
      } catch (parseError) {
        console.error('[narrative:agents] Failed to parse JSON response:', rawOutput);
        throw new Error('AI returned invalid JSON format');
      }
      
      // Validate structure
      if (!parsedData.scene_id || typeof parsedData.shotNumber !== 'number') {
        console.error('[narrative:agents] Invalid response structure:', parsedData);
        throw new Error('AI response missing required fields');
      }
      
      // Collect reference image URLs
      const referenceImageUrls = collectReferenceUrls(
        input.characterReferences,
        input.locationReferences,
        input.styleReference
      );
      
      
      // Transform to output format (convert snake_case to camelCase for continuity)
      const output: PromptEngineerOutput = {
        sceneId: parsedData.scene_id,
        shotNumber: parsedData.shotNumber,
        finalFrameMode: parsedData.finalFrameMode,
        continuity: {
          inGroup: parsedData.continuity.in_group,
          groupId: parsedData.continuity.group_id,
          isFirstInGroup: parsedData.continuity.is_first_in_group,
        },
        imagePrompt: parsedData.imagePrompt || '',
        startFramePrompt: parsedData.startFramePrompt || '',
        endFramePrompt: parsedData.endFramePrompt || '',
        videoPrompt: parsedData.videoPrompt || '',
        negativePrompt: parsedData.negativePrompt || '',
        referenceImageUrls,
        cost: response.usage?.totalCostUsd,
      };
      
      // Validate frame mode logic
      if (output.finalFrameMode === "image-reference") {
        if (output.startFramePrompt || output.endFramePrompt) {
          console.warn('[narrative:agents] Warning: image-reference mode should have empty start/end frames');
        }
      } else if (output.finalFrameMode === "start-end") {
        if (output.imagePrompt) {
          console.warn('[narrative:agents] Warning: start-end mode should have empty imagePrompt');
        }
        if (output.continuity.inGroup && !output.continuity.isFirstInGroup) {
          if (output.startFramePrompt) {
            console.warn('[narrative:agents] Warning: subsequent shot in group should have empty startFramePrompt');
          }
        }
      }
      
      console.log('[narrative:agents] Prompts generated successfully:', {
        shotNumber: output.shotNumber,
        finalFrameMode: output.finalFrameMode,
        hasImagePrompt: !!output.imagePrompt,
        hasStartFrame: !!output.startFramePrompt,
        hasEndFrame: !!output.endFramePrompt,
        hasVideoPrompt: !!output.videoPrompt,
        referenceCount: referenceImageUrls.length,
        cost: output.cost,
      });
      
      return output;
    } catch (error) {
      console.error('[narrative:agents] Failed to generate prompts:', error);
      throw new Error(`Failed to generate prompts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

  /**
   * Agent 4.2: Storyboard Image Generator
   * 
   * Generates storyboard frame images using prompts from Agent 4.1
   * Supports both image-reference mode (single image) and start-end mode (paired keyframes)
   * Uses reference images for visual consistency (characters, locations, style, previous frames)
   */
  static async generateStoryboardImage(
    input: StoryboardImageInput,
    userId?: string,
    workspaceId?: string
  ): Promise<StoryboardImageOutput> {
    console.log('[narrative:agents] Generating storyboard image (Agent 4.2):', {
      shotId: input.shotId,
      videoId: input.videoId,
      narrativeMode: input.narrativeMode,
      frameType: input.frameType,
      model: input.imageModel,
      aspectRatio: input.aspectRatio,
      referenceCount: input.referenceImages.length,
      userId,
      workspaceId,
    });

    try {
      const result = await generateStoryboardImageAgent(
        input,
        userId,
        workspaceId
      );

      if (result.error) {
        console.error('[narrative:agents] Storyboard image generation failed:', result.error);
        return result;
      }

      console.log('[narrative:agents] Storyboard image generated successfully:', {
        shotId: input.shotId,
        hasImageUrl: !!result.imageUrl,
        hasStartFrame: !!result.startFrameUrl,
        hasEndFrame: !!result.endFrameUrl,
        cost: result.cost,
      });

      return result;
    } catch (error) {
      console.error('[narrative:agents] Storyboard image generation error:', error);
      return {
        imageUrl: null,
        startFrameUrl: null,
        endFrameUrl: null,
        shotVersionId: input.shotId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
