import { callTextModel } from '../../../ai/service';
import { getModelConfig } from '../../../ai/config';
import { appendFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { scriptWriterSystemPrompt, generateScriptPrompt } from '../prompts/script-writer';
import { characterAnalyzerSystemPrompt, analyzeCharactersPrompt } from '../prompts/character-analyzer';
import { locationAnalyzerSystemPrompt, analyzeLocationsPrompt } from '../prompts/location-analyzer';
import { sceneAnalyzerSystemPrompt, analyzeScriptPrompt } from '../prompts/scene-analyzer';
import { characterCreatorSystemPrompt, createCharacterPrompt } from '../prompts/character-creator';
import { imagePrompterSystemPrompt, generateImagePrompt } from '../prompts/image-prompter';
import { videoAnimatorSystemPrompt, generateVideoPrompt } from '../prompts/video-animator';
import { promptEngineerSystemPrompt, generatePromptEngineerPrompt } from '../prompts/prompt-engineer';
import type { PromptEngineerUserPromptInput } from '../prompts/prompt-engineer';

const DEBUG_LOG_PATH = join(process.cwd(), '.cursor', 'debug.log');
function debugLog(location: string, message: string, data: any, hypothesisId: string) {
  try {
    // Ensure directory exists
    const logDir = dirname(DEBUG_LOG_PATH);
    mkdirSync(logDir, { recursive: true });
    
    const logEntry = JSON.stringify({
      location,
      message,
      data,
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId,
    }) + '\n';
    appendFileSync(DEBUG_LOG_PATH, logEntry, 'utf8');
    // Also log to console as backup
    console.log(`[DEBUG] ${location}: ${message}`, data);
  } catch (e) {
    // Log to console if file logging fails
    console.error(`[DEBUG LOG ERROR] ${location}: ${message}`, data, e);
  }
}
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
import {
  editStoryboardImage as editStoryboardImageAgent,
  type ImageEditorInput,
  type ImageEditorOutput,
} from './image-editor';

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

export interface ShotInput {
  id: string;
  sceneId: string;
  sceneTitle: string;
  shotNumber: number;
  duration: number;
  shotType: string;
  cameraMovement: string;
  actionDescription: string;  // Contains @tags - visual action only, NO narration
  characters: string[];  // Array of @{CharacterName} tags
  location: string;  // @{LocationName} tag
  frameMode?: "image-reference" | "start-end";  // For auto mode
}

export interface ContinuityContext {
  inGroup: boolean;
  groupId: string | null;
  isFirstInGroup: boolean;
  previousEndFrameSummary?: string;  // Not used in batch mode, kept for backward compatibility
  continuityConstraints?: string;
}

export interface PromptEngineerInput {
  sceneId: string;
  sceneTitle: string;
  shots: ShotInput[];  // Array of shots in the scene
  narrativeMode: "image-reference" | "start-end" | "auto";
  continuity: ContinuityContext[];  // Array of continuity contexts, one per shot (in same order as shots)
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

// Batch output: array of prompts, one per shot
export type PromptEngineerBatchOutput = PromptEngineerOutput[];

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
    workspaceId?: string,
    usageType?: string,
    usageMode?: string
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
          metadata: { usageType, usageMode },
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
    model?: string,
    usageType?: string,
    usageMode?: string
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
          metadata: { usageType, usageMode },
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
    model?: string,
    usageType?: string,
    usageMode?: string
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
          metadata: { usageType, usageMode },
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
    workspaceId?: string,
    usageType?: string,
    usageMode?: string
  ): Promise<{
    scenes: any[];
    totalDuration: number;
    cost?: number;
  }> {
    const { generateScenes } = await import('./breakdown/scene-analyzer');
    return generateScenes(input, videoId, userId, workspaceId, usageType, usageMode);
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
    workspaceId?: string,
    usageType?: string,
    usageMode?: string
  ): Promise<{
    shots: Record<string, any[]>;
    totalCost: number;
  }> {
    const { composeShotsForScenes } = await import('./breakdown/shot-composer');
    return composeShotsForScenes(scenes, input, userId, workspaceId, usageType, usageMode);
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
   * Generates both image and video prompts for all shots in a scene in a single AI call
   */
  static async generatePrompts(
    input: PromptEngineerInput,
    userId?: string,
    workspaceId?: string,
    usageType?: string,
    usageMode?: string
  ): Promise<PromptEngineerBatchOutput> {
    // Sort shots by shotNumber to ensure correct order
    const sortedShots = [...input.shots].sort((a, b) => a.shotNumber - b.shotNumber);
    
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
    
    // Build user prompt input
    const userPromptInput: PromptEngineerUserPromptInput = {
      sceneId: input.sceneId,
      sceneTitle: input.sceneTitle,
      shots: sortedShots.map(shot => ({
        sceneId: shot.sceneId,
        sceneTitle: shot.sceneTitle,
        shotNumber: shot.shotNumber,
        duration: shot.duration,
        shotType: shot.shotType,
        cameraMovement: shot.cameraMovement,
        actionDescription: shot.actionDescription,
        characters: shot.characters,
        location: shot.location,
        frameMode: shot.frameMode,
        // Pass through additional fields that may be needed for transformation
        id: shot.id,
      } as any)),
      narrativeMode: input.narrativeMode,
      continuity: input.continuity,
      characterReferences: input.characterReferences,
      locationReferences: input.locationReferences,
      styleReference: input.styleReference,
      generationTargets: input.generationTargets,
    };
    
    const userPrompt = generatePromptEngineerPrompt(userPromptInput);
    
    console.log('[narrative:agents] Generating prompts (Agent 4.1 - Batch Mode):', {
      sceneId: input.sceneId,
      sceneTitle: input.sceneTitle,
      shotCount: sortedShots.length,
      shotNumbers: sortedShots.map(s => s.shotNumber),
      model: modelName,
      provider,
      supportsReasoning,
      userId,
      workspaceId,
    });
    
    try {
      // Calculate expected output tokens
      // Estimate: ~1000 tokens per shot (image + video + negative prompts)
      const expectedOutputTokens = sortedShots.length * 1000;
      
      // Build payload with JSON schema for structured output
      // New format: { scene_id, scene_title, image_model, video_model, narrative_mode, aspect_ratio, style_anchor, shots: [...] }
      const payload: any = {
        input: [
          { role: "system", content: promptEngineerSystemPrompt },
          { role: "user", content: userPrompt },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "prompt_engineer_batch_output",
            strict: true,
            schema: {
              type: "object",
              properties: {
                scene_id: { type: "string" },
                scene_title: { type: "string" },
                image_model: { type: "string" },
                video_model: { type: "string" },
                narrative_mode: { type: "string" },
                aspect_ratio: { type: "string" },
                style_anchor: { type: "string" },
                shots: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      shot_id: { type: "string" },
                      shot_index: { type: "number" },
                      scene_shot_index: { type: "number" },
                      finalFrameMode: { 
                        type: "string",
                        enum: ["image-reference", "start-end"]
                      },
                      isLinkedToPrevious: { type: "boolean" },
                      characterTags: {
                        type: "array",
                        items: { type: "string" }
                      },
                      locationTag: { type: "string" },
                      imagePrompt: { type: "string" },
                      startFramePrompt: { type: "string" },
                      endFramePrompt: { type: "string" },
                      videoPrompt: { type: "string" },
                      negativePrompt: { type: "string" },
                      visualContinuityNotes: { type: "string" },
                    },
                    required: [
                      "shot_id",
                      "shot_index",
                      "scene_shot_index",
                      "finalFrameMode",
                      "isLinkedToPrevious",
                      "characterTags",
                      "locationTag",
                      "imagePrompt",
                      "startFramePrompt",
                      "endFramePrompt",
                      "videoPrompt",
                      "negativePrompt",
                      "visualContinuityNotes",
                    ],
                    additionalProperties: false,
                  },
                },
              },
              required: ["scene_id", "scene_title", "image_model", "video_model", "narrative_mode", "aspect_ratio", "style_anchor", "shots"],
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
          metadata: { usageType, usageMode },
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
      
      // Parse JSON response (new format: { scene_id, scene_title, ..., shots: [...] })
      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(rawOutput);
      } catch (parseError) {
        console.error('[narrative:agents] Failed to parse JSON response:', rawOutput);
        throw new Error('AI returned invalid JSON format');
      }
      
      // Extract the shots array from the response object
      let parsedData: any[];
      if (parsedResponse && typeof parsedResponse === 'object' && Array.isArray(parsedResponse.shots)) {
        // Expected format: object with "shots" property
        parsedData = parsedResponse.shots;
      } else if (Array.isArray(parsedResponse)) {
        // Fallback: if response is directly an array (old format), use it
        parsedData = parsedResponse;
      } else if (parsedResponse && typeof parsedResponse === 'object' && Array.isArray(parsedResponse.prompts)) {
        // Old format fallback: object with "prompts" property
        parsedData = parsedResponse.prompts;
      } else {
        console.error('[narrative:agents] Invalid response structure - expected object with "shots" array, got:', typeof parsedResponse, parsedResponse);
        throw new Error('AI response must be an object with a "shots" array property');
      }
      
      // Validate array length matches input shots
      if (parsedData.length !== sortedShots.length) {
        console.warn('[narrative:agents] Response array length mismatch:', {
          expected: sortedShots.length,
          received: parsedData.length,
        });
      }
      
      // Collect reference image URLs (same for all shots)
      const referenceImageUrls = collectReferenceUrls(
        input.characterReferences,
        input.locationReferences,
        input.styleReference
      );
      
      // Transform array to output format (convert new format to internal format)
      const outputs: PromptEngineerBatchOutput = parsedData.map((item: any, index: number) => {
        // Validate structure - handle both new format (shot_id, shot_index) and old format (shotNumber)
        let shotNumber: number;
        if (typeof item.shot_index === 'number') {
          // New format: use shot_index (may need to map back to shotNumber)
          shotNumber = item.shot_index;
          // Try to find matching shot by ID first, then by index
          const matchingShot = sortedShots.find(s => (s as any).id === item.shot_id || 
            (s as any).shot_id === item.shot_id) || 
            sortedShots[item.scene_shot_index - 1];
          if (matchingShot) {
            shotNumber = matchingShot.shotNumber;
          }
        } else if (typeof item.shotNumber === 'number') {
          // Old format fallback
          shotNumber = item.shotNumber;
        } else {
          console.error('[narrative:agents] Invalid item structure at index', index, ':', item);
          throw new Error(`AI response item at index ${index} missing shot_id/shot_index or shotNumber`);
        }
        
        // Find corresponding shot
        const correspondingShot = sortedShots.find(s => s.shotNumber === shotNumber) || sortedShots[index];
        if (!correspondingShot) {
          console.warn('[narrative:agents] Response item shotNumber', shotNumber, 'not found in input shots');
        }
        
        // Determine continuity info from corresponding shot's continuity context
        const cont = input.continuity[index] || input.continuity.find((_, i) => sortedShots[i]?.shotNumber === shotNumber) || {
          inGroup: item.isLinkedToPrevious || false,
          groupId: null,
          isFirstInGroup: false,
        };
        
        const output: PromptEngineerOutput = {
          sceneId: item.scene_id || input.sceneId,
          shotNumber: shotNumber,
          finalFrameMode: item.finalFrameMode || (item.frame_mode || (input.narrativeMode === 'auto' ? 'image-reference' : input.narrativeMode)),
          continuity: {
            inGroup: item.isLinkedToPrevious || cont.inGroup,
            groupId: cont.groupId,
            isFirstInGroup: !item.isLinkedToPrevious || cont.isFirstInGroup,
          },
          imagePrompt: item.imagePrompt || '',
          startFramePrompt: item.startFramePrompt || '',
          endFramePrompt: item.endFramePrompt || '',
          videoPrompt: item.videoPrompt || '',
          negativePrompt: item.negativePrompt || '',
          referenceImageUrls,
          // Cost is shared across all shots, so divide by shot count
          cost: response.usage?.totalCostUsd ? response.usage.totalCostUsd / parsedData.length : undefined,
        };
        
        // Validate frame mode logic
        if (output.finalFrameMode === "image-reference") {
          if (output.startFramePrompt || output.endFramePrompt) {
            console.warn(`[narrative:agents] Warning: Shot ${output.shotNumber} - image-reference mode should have empty start/end frames`);
          }
        } else if (output.finalFrameMode === "start-end") {
          if (output.imagePrompt) {
            console.warn(`[narrative:agents] Warning: Shot ${output.shotNumber} - start-end mode should have empty imagePrompt`);
          }
          if (output.continuity.inGroup && !output.continuity.isFirstInGroup) {
            if (output.startFramePrompt) {
              console.warn(`[narrative:agents] Warning: Shot ${output.shotNumber} - subsequent shot in group should have empty startFramePrompt`);
            }
          }
        }
        
        return output;
      });
      
      // Sort outputs by shotNumber to ensure correct order
      outputs.sort((a, b) => a.shotNumber - b.shotNumber);
      
      console.log('[narrative:agents] Prompts generated successfully (batch):', {
        sceneId: input.sceneId,
        shotCount: outputs.length,
        shotNumbers: outputs.map(o => o.shotNumber),
        totalCost: response.usage?.totalCostUsd,
        averageCostPerShot: response.usage?.totalCostUsd ? response.usage.totalCostUsd / outputs.length : undefined,
      });
      
      return outputs;
    } catch (error) {
      console.error('[narrative:agents] Failed to generate prompts (batch):', error);
      throw new Error(`Failed to generate prompts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async generateImage(prompt: string, referenceImages?: string[]): Promise<string> {
    return `[PLACEHOLDER] Image will be generated with Nano Banana/Gemini 2.5 Flash`;
  }

  /**
   * Agent 4.5: Generate video from storyboard images
   * Supports both image-reference and start-end narrative modes
   */
  static async generateVideo(
    request: {
      narrativeMode: "image-reference" | "start-end" | "auto";
      shotId: string;
      shotVersionId: string;
      videoModel: string;
      aspectRatio: string;
      resolution: string;
      duration: number;
      videoPrompt: string;
      imageUrl?: string;  // For image-reference mode
      startFrameUrl?: string;  // For start-end mode
      endFrameUrl?: string;  // For start-end mode
      effectiveMode?: "image-reference" | "start-end";  // For auto mode
    },
    userId?: string,
    workspaceId?: string,
    usageType?: string,
    usageMode?: string
  ): Promise<{
    taskId: string;
    status: "processing" | "completed" | "failed";
    videoUrl?: string;
    videoDuration?: number;
    cost?: number;
    error?: string;
  }> {
    const { generateVideo: generateVideoImpl } = await import('./video-generator');
    
    return generateVideoImpl(
      {
        narrativeMode: request.narrativeMode,
        videoModel: request.videoModel,
        aspectRatio: request.aspectRatio,
        resolution: request.resolution,
        duration: request.duration,
        videoPrompt: request.videoPrompt,
        imageUrl: request.imageUrl,
        startFrameUrl: request.startFrameUrl,
        endFrameUrl: request.endFrameUrl,
        effectiveMode: request.effectiveMode,
      },
      userId,
      workspaceId,
      usageType,
      usageMode
    );
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
    workspaceId?: string,
    usageType?: string,
    usageMode?: string
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
          personality: personality || '', // Ensure personality is always a string
          artStyleDescription,
          model: model || getDefaultCharacterImageModel(),
          negativePrompt,
          referenceImages,
          styleReferenceImage,
        },
        userId,
        workspaceId,
        usageType,
        usageMode
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
    workspaceId?: string,
    usageType?: string,
    usageMode?: string
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
        workspaceId,
        usageType,
        usageMode
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
    workspaceId?: string,
    usageType?: string,
    usageMode?: string
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
        workspaceId,
        usageType,
        usageMode
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

  /**
   * Agent 4.3: Image Editor
   * 
   * Edits generated storyboard images based on user feedback
   * Supports iterative refinement without full regeneration
   */
  static async editImage(
    input: ImageEditorInput,
    userId?: string,
    workspaceId?: string,
    usageType?: string,
    usageMode?: string
  ): Promise<ImageEditorOutput> {
    console.log('[narrative:agents] Editing image (Agent 4.3):', {
      shotId: input.shotId,
      videoId: input.videoId,
      editCategory: input.editCategory,
      model: input.imageModel,
      hasOriginalImage: !!input.originalImageUrl,
      referenceCount: input.referenceImages?.length || 0,
      userId,
      workspaceId,
    });

    try {
      const result = await editStoryboardImageAgent(
        input,
        userId,
        workspaceId,
        usageType,
        usageMode
      );

      if (result.error) {
        console.error('[narrative:agents] Image editing failed:', result.error);
        return result;
      }

      console.log('[narrative:agents] Image edited successfully:', {
        shotId: input.shotId,
        hasEditedImage: !!result.editedImageUrl,
        cost: result.cost,
      });

      return result;
    } catch (error) {
      console.error('[narrative:agents] Image editing error:', error);
      return {
        editedImageUrl: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
