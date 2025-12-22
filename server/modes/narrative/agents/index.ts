import { callTextModel } from '../../../ai/service';
import { scriptWriterSystemPrompt, generateScriptPrompt } from '../prompts/script-writer';
import { sceneAnalyzerSystemPrompt, analyzeScriptPrompt } from '../prompts/scene-analyzer';
import { characterCreatorSystemPrompt, createCharacterPrompt } from '../prompts/character-creator';
import { imagePrompterSystemPrompt, generateImagePrompt } from '../prompts/image-prompter';
import { videoAnimatorSystemPrompt, generateVideoPrompt } from '../prompts/video-animator';

export interface ScriptSettings {
  duration: number;
  genre: string;
  language: string;
  aspectRatio: string;
  userPrompt?: string;
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

// AI Model Configuration
const SCRIPT_GENERATOR_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",
};

export class NarrativeAgents {
  static async generateScript(
    settings: ScriptSettings,
    userId?: string,
    workspaceId?: string
  ): Promise<string> {
    const { duration, genre, language, aspectRatio, userPrompt } = settings;
    
    // Build user prompt with parameters
    const userPromptText = generateScriptPrompt(settings);
    
    console.log('[narrative:agents] Generating script:', {
      duration,
      genre,
      language,
      aspectRatio,
      hasUserPrompt: !!userPrompt,
    });
    
    try {
      // Calculate expected output tokens based on duration
      // Formula: ~25 words per second of video * 4 tokens per word
      // Add 20% buffer for formatting and structure
      const expectedOutputTokens = Math.ceil(duration * 25 * 4 * 1.2);
      
      const response = await callTextModel(
        {
          provider: SCRIPT_GENERATOR_CONFIG.provider,
          model: SCRIPT_GENERATOR_CONFIG.model,
          payload: {
            reasoning: { effort: "low" },
            input: [
              { role: "system", content: scriptWriterSystemPrompt },
              { role: "user", content: userPromptText },
            ],
          },
          userId,
          workspaceId,
        },
        {
          expectedOutputTokens,
        }
      );
      
      const script = response.output.trim();
      
      console.log('[narrative:agents] Script generated successfully:', {
        wordCount: script.split(/\s+/).length,
        charCount: script.length,
        cost: response.usage?.totalCostUsd,
      });
      
      return script;
    } catch (error) {
      console.error('[narrative:agents] Failed to generate script:', error);
      throw new Error('Failed to generate script');
    }
  }

  static async analyzeScript(script: string): Promise<any[]> {
    const systemPrompt = sceneAnalyzerSystemPrompt;
    const userPrompt = analyzeScriptPrompt(script);
    
    return [];
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
}
