/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MODE DELEGATOR SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Routes video generation to the correct mode-specific agents.
 * Each mode has its own agents under auto-video/modes/{mode}/agents.
 * 
 * Unlike auto-story (which uses the same agents for all modes), auto-video
 * uses separate agents per mode.
 */

import type { 
  VideoMode, 
  CampaignSettings,
  AmbientCampaignSettings,
  NarrativeSettings,
  VlogSettings,
  CommerceSettings,
  LogoSettings,
  PodcastSettings,
  VideoGenerationResult,
  GenerationOptions,
} from '../types';

// Import mode-specific orchestrators
import { generateFullVideo } from '../modes/ambient-visual/services/agent-orchestrator';

// ═══════════════════════════════════════════════════════════════
// MAIN DELEGATOR
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a video using the appropriate mode-specific agents
 * 
 * @param videoMode - Video mode to use
 * @param idea - Video topic/idea
 * @param campaignSettings - Campaign settings
 * @param userId - User ID
 * @param workspaceId - Workspace ID
 * @param options - Retry options (isRetry, failedStep)
 */
export async function generateVideoForMode(
  videoMode: VideoMode,
  idea: string,
  campaignSettings: CampaignSettings,
  userId: string,
  workspaceId: string,
  options: GenerationOptions = {}
): Promise<VideoGenerationResult> {
  console.log(`[mode-delegator] Routing to ${videoMode} mode for idea: "${idea}"`, options.isRetry ? '(retry)' : '');

  try {
    // Normalize 'ambient' to 'ambient-visual' for internal routing
    const normalizedMode = videoMode === 'ambient' ? 'ambient-visual' : videoMode;
    
    switch (normalizedMode) {
      case 'ambient-visual':
        return await generateAmbientVideo(
          idea, 
          campaignSettings as AmbientCampaignSettings, 
          userId, 
          workspaceId,
          options
        );
      
      case 'narrative':
        return await generateNarrativeVideo(
          idea,
          campaignSettings as NarrativeSettings,
          userId,
          workspaceId
        );
      
      case 'character-vlog':
        return await generateVlogVideo(
          idea,
          campaignSettings as VlogSettings,
          userId,
          workspaceId
        );
      
      case 'social-commerce':
        return await generateCommerceVideo(
          idea,
          campaignSettings as CommerceSettings,
          userId,
          workspaceId
        );
      
      case 'logo-animation':
        return await generateLogoVideo(
          idea,
          campaignSettings as LogoSettings,
          userId,
          workspaceId
        );
      
      case 'podcast':
        return await generatePodcastVideo(
          idea,
          campaignSettings as PodcastSettings,
          userId,
          workspaceId
        );
      
      default:
        throw new Error(`Unknown video mode: ${videoMode}`);
    }
  } catch (error: any) {
    console.error(`[mode-delegator] Error generating ${videoMode} video:`, error);
    return {
      success: false,
      error: error.message || 'Video generation failed'
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// MODE-SPECIFIC GENERATORS
// ═══════════════════════════════════════════════════════════════

/**
 * Generate ambient-visual video via full 7-step orchestrator
 */
async function generateAmbientVideo(
  idea: string,
  settings: AmbientCampaignSettings,
  userId: string,
  workspaceId: string,
  options: GenerationOptions = {}
): Promise<VideoGenerationResult> {
  console.log('[mode-delegator:ambient] Starting full ambient video generation');
  
  // Call the full 7-step orchestrator
  return await generateFullVideo(idea, settings, userId, workspaceId, options);
}

/**
 * Generate narrative video via auto-video/modes/narrative/agents
 */
async function generateNarrativeVideo(
  idea: string,
  settings: NarrativeSettings,
  userId: string,
  workspaceId: string
): Promise<VideoGenerationResult> {
  console.log('[mode-delegator:narrative] Starting narrative video generation');
  
  // TODO: Import and call narrative agents from auto-video/modes/narrative/agents
  throw new Error('Narrative mode not yet implemented. Agents location: auto-video/modes/narrative/agents');
}

/**
 * Generate character-vlog video via auto-video/modes/character-vlog/agents
 */
async function generateVlogVideo(
  idea: string,
  settings: VlogSettings,
  userId: string,
  workspaceId: string
): Promise<VideoGenerationResult> {
  console.log('[mode-delegator:vlog] Starting vlog video generation');
  
  // TODO: Import and call vlog agents from auto-video/modes/character-vlog/agents
  throw new Error('Character-vlog mode not yet implemented. Agents location: auto-video/modes/character-vlog/agents');
}

/**
 * Generate social-commerce video via auto-video/modes/social-commerce/agents
 */
async function generateCommerceVideo(
  idea: string,
  settings: CommerceSettings,
  userId: string,
  workspaceId: string
): Promise<VideoGenerationResult> {
  console.log('[mode-delegator:commerce] Starting commerce video generation');
  
  // TODO: Import and call commerce agents from auto-video/modes/social-commerce/agents
  throw new Error('Social-commerce mode not yet implemented. Agents location: auto-video/modes/social-commerce/agents');
}

/**
 * Generate logo-animation video via auto-video/modes/logo-animation/agents
 */
async function generateLogoVideo(
  idea: string,
  settings: LogoSettings,
  userId: string,
  workspaceId: string
): Promise<VideoGenerationResult> {
  console.log('[mode-delegator:logo] Starting logo animation generation');
  
  // TODO: Import and call logo agents from auto-video/modes/logo-animation/agents
  throw new Error('Logo-animation mode not yet implemented. Agents location: auto-video/modes/logo-animation/agents');
}

/**
 * Generate podcast video via auto-video/modes/podcast/agents
 */
async function generatePodcastVideo(
  idea: string,
  settings: PodcastSettings,
  userId: string,
  workspaceId: string
): Promise<VideoGenerationResult> {
  console.log('[mode-delegator:podcast] Starting podcast video generation');
  
  // TODO: Import and call podcast agents from auto-video/modes/podcast/agents
  throw new Error('Podcast mode not yet implemented. Agents location: auto-video/modes/podcast/agents');
}
