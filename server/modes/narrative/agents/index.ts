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

export class NarrativeAgents {
  static async generateScript(settings: ScriptSettings): Promise<string> {
    const systemPrompt = scriptWriterSystemPrompt;
    const userPrompt = generateScriptPrompt(settings);
    
    return `[PLACEHOLDER] Script generation will be implemented with AI model integration`;
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
