/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AMBIENT-VISUAL MODE AGENTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Mode-specific agents for ambient-visual video generation in auto-video campaigns.
 * 
 * Phase 1 (Current): Database save only
 * - Creates video records with step1Data and step2Data
 * - Each video has same settings but different userStory (idea)
 * 
 * Phase 2 (Future): AI generation
 * - Generate moodDescription via AI
 * - Generate scenes/shots (step3Data)
 * - Generate images/videos
 * - Compose final video
 */

import type { AmbientCampaignSettings, VideoGenerationResult } from '../../../types';
import { buildStep1Data, buildStep2Data } from '../services/step-data-generator';
import { createAmbientVideo } from '../services/video-initializer';

/**
 * Generate an ambient-visual video from an idea
 * 
 * This function is called ONCE PER IDEA by the batch-processor.
 * Each call creates ONE video record in the database with:
 * - Same settings (from campaignSettings)
 * - Different userStory (the specific idea/topic)
 * 
 * @param idea - ONE video topic/idea (becomes step1Data.userStory)
 * @param settings - Ambient campaign settings (same for all videos in campaign)
 * @param userId - User ID
 * @param workspaceId - Workspace ID
 * @returns Video generation result with videoId
 */
export async function generateAmbientVideoFromIdea(
  idea: string,
  settings: AmbientCampaignSettings,
  userId: string,
  workspaceId: string
): Promise<VideoGenerationResult> {
  console.log('[ambient-visual:agents] Creating video record for:', idea);
  
  try {
    // ─────────────────────────────────────────────────────────────
    // 1. CONVERT CAMPAIGN SETTINGS TO STEP DATA FORMAT
    // ─────────────────────────────────────────────────────────────
    // The idea is set as step1Data.userStory - UNIQUE per video
    // All other settings are the same for all videos in the campaign
    const step1Data = buildStep1Data(idea, settings);
    const step2Data = buildStep2Data(settings);
    
    console.log('[ambient-visual:agents] Step data built:', {
      userStory: step1Data.userStory,
      animationMode: step1Data.animationMode,
      mood: step1Data.mood,
      theme: step1Data.theme,
      duration: step1Data.duration,
      artStyle: step2Data.artStyle,
    });
    
    // ─────────────────────────────────────────────────────────────
    // 2. CREATE ONE VIDEO RECORD IN DATABASE
    // ─────────────────────────────────────────────────────────────
    // Use idea as video title
    const title = idea;
    const videoId = await createAmbientVideo(title, workspaceId, step1Data, step2Data);
    
    console.log('[ambient-visual:agents] Video saved to database:', videoId);
    
    // ─────────────────────────────────────────────────────────────
    // 3. RETURN SUCCESS WITH VIDEO ID
    // ─────────────────────────────────────────────────────────────
    // This videoId will be stored in campaign.itemStatuses[index]
    return {
      success: true,
      videoId,
      metadata: {
        title,
        mode: 'ambient',
        currentStep: 2,
        userStory: idea,  // The specific topic for this video
      }
    };
    
  } catch (error: any) {
    console.error('[ambient-visual:agents] Error creating video:', error);
    return {
      success: false,
      error: error.message || 'Failed to create ambient video record'
    };
  }
}
