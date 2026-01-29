/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BATCH PROCESSOR SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Orchestrates batch generation of N videos in a campaign.
 * Manages progress tracking, error handling, and status updates.
 */

import { generateVideoForMode } from './mode-delegator';
import { 
  getVideoCampaign, 
  updateVideoCampaign 
} from '../../shared/services/campaign-manager';
import type { 
  VideoMode,
  CampaignSettings,
  BatchGenerationProgress,
  ItemStatus,
  VideoGenerationJob 
} from '../types';
import type { VideoCampaign } from '@shared/schema';

// ═══════════════════════════════════════════════════════════════
// SCHEDULING HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate the scheduled publish time for a video based on campaign settings
 * 
 * Continuous mode: Space videos evenly based on maxVideosPerDay
 * Scheduled mode: Use per-topic date from itemSchedules
 * 
 * @param campaign - The video campaign with scheduling settings
 * @param videoIndex - Index of the video in the batch
 * @returns ISO date string for scheduled publish time, or undefined for immediate
 */
function calculateScheduledTime(
  campaign: VideoCampaign,
  videoIndex: number
): string | undefined {
  const platforms = (campaign.selectedPlatforms as string[]) || [];
  if (platforms.length === 0) return undefined; // No publishing

  const automationMode = campaign.automationMode;
  const itemSchedules = (campaign.itemSchedules as Record<string, any>) || {};
  
  if (automationMode === 'continuous') {
    const startDate = campaign.scheduleStartDate;
    const maxPerDay = campaign.maxVideosPerDay || 1;
    if (!startDate) return undefined;
    
    // Calculate hours between each video
    const hoursPerVideo = 24 / maxPerDay;
    const scheduled = new Date(startDate);
    scheduled.setHours(scheduled.getHours() + Math.floor(videoIndex * hoursPerVideo));
    
    console.log(`[batch-processor] Continuous schedule for video ${videoIndex}: ${scheduled.toISOString()} (${hoursPerVideo}h spacing)`);
    return scheduled.toISOString();
    
  } else if (automationMode === 'scheduled') {
    const itemSchedule = itemSchedules[String(videoIndex)];
    const scheduledDate = itemSchedule?.scheduledDate;
    
    if (scheduledDate) {
      console.log(`[batch-processor] Scheduled date for video ${videoIndex}: ${scheduledDate}`);
      return typeof scheduledDate === 'string' ? scheduledDate : new Date(scheduledDate).toISOString();
    }
    return undefined;
  }
  
  // 'manual' or unknown mode - no automatic scheduling
  return undefined;
}

/**
 * Build enriched campaign settings with publishing configuration
 * 
 * Merges top-level campaign fields (selectedPlatforms, automationMode, etc.)
 * into campaignSettings.publishing for the orchestrator
 * 
 * @param campaign - The video campaign
 * @param videoIndex - Index of the video being generated
 * @returns Campaign settings with publishing config merged in
 */
function buildEnrichedSettings(
  campaign: VideoCampaign,
  videoIndex: number
): CampaignSettings {
  const platforms = (campaign.selectedPlatforms as string[]) || [];
  const scheduledFor = calculateScheduledTime(campaign, videoIndex);
  
  // Determine schedule mode
  let scheduleMode: 'immediate' | 'scheduled' | 'continuous' = 'immediate';
  if (campaign.automationMode === 'continuous') {
    scheduleMode = 'continuous';
  } else if (campaign.automationMode === 'scheduled') {
    scheduleMode = 'scheduled';
  }
  
  const enrichedSettings = {
    ...(campaign.campaignSettings as CampaignSettings),
    publishing: {
      enabled: platforms.length > 0,
      platforms: platforms as Array<'youtube' | 'tiktok' | 'instagram' | 'facebook'>,
      scheduleMode,
      scheduledFor,
    }
  };
  
  console.log(`[batch-processor] Publishing settings for video ${videoIndex}:`, {
    enabled: enrichedSettings.publishing.enabled,
    platforms: enrichedSettings.publishing.platforms,
    scheduleMode: enrichedSettings.publishing.scheduleMode,
    scheduledFor: enrichedSettings.publishing.scheduledFor,
  });
  
  return enrichedSettings;
}

// ═══════════════════════════════════════════════════════════════
// MAIN BATCH PROCESSOR
// ═══════════════════════════════════════════════════════════════

/**
 * Process all videos in a campaign batch
 * Updates campaign status and itemStatuses as it progresses
 */
export async function processCampaignBatch(campaignId: string): Promise<void> {
  console.log(`[batch-processor] Starting batch generation for campaign: ${campaignId}`);

  try {
    // Load campaign
    const campaign = await getVideoCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    // Validate campaign status
    if (campaign.status !== 'draft' && campaign.status !== 'paused') {
      throw new Error(`Cannot start generation: campaign status is ${campaign.status}`);
    }

    // Get video ideas
    const videoIdeas = (campaign.videoIdeas as any[]) || [];
    if (videoIdeas.length === 0) {
      throw new Error('No video ideas found in campaign');
    }

    console.log(`[batch-processor] Processing ${videoIdeas.length} videos`);

    // Initialize itemStatuses if not exists
    const itemStatuses = (campaign.itemStatuses as Record<string, ItemStatus>) || {};
    const generatedVideoIds = campaign.generatedVideoIds || [];

    // Update campaign status to generating
    await updateVideoCampaign(campaignId, {
      status: 'generating',
      itemStatuses,
    });

    // Process each video idea sequentially
    for (let i = 0; i < videoIdeas.length; i++) {
      const ideaItem = videoIdeas[i];
      const idea = typeof ideaItem === 'string' ? ideaItem : ideaItem.idea || ideaItem.topic;
      const index = typeof ideaItem === 'string' ? i : (ideaItem.index ?? i);

      console.log(`[batch-processor] Processing video ${index + 1}/${videoIdeas.length}: "${idea}"`);

      // Skip if already completed
      if (itemStatuses[index]?.status === 'completed') {
        console.log(`[batch-processor] Video ${index} already completed, skipping`);
        continue;
      }

      // Update status to generating
      itemStatuses[index] = {
        status: 'generating',
        startedAt: new Date(),
      };
      
      await updateVideoCampaign(campaignId, { itemStatuses });

      try {
        // Build enriched settings with publishing configuration
        const enrichedSettings = buildEnrichedSettings(campaign, index);
        
        // First attempt - Generate video via mode-delegator
        let result = await generateVideoForMode(
          campaign.videoMode as VideoMode,
          idea,
          enrichedSettings,
          campaign.userId,
          campaign.workspaceId
        );

        // Retry once if failed and retryable
        if (!result.success && result.retryable) {
          console.log(`[batch-processor] Retrying video ${index}...`);
          
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          result = await generateVideoForMode(
            campaign.videoMode as VideoMode,
            idea,
            enrichedSettings,
            campaign.userId,
            campaign.workspaceId,
            { isRetry: true, failedStep: result.failedStep }
          );
        }

        if (result.success && result.videoId) {
          // Success
          itemStatuses[index] = {
            status: 'completed',
            videoId: result.videoId,
            completedAt: new Date(),
            metadata: result.metadata,
          };
          
          generatedVideoIds.push(result.videoId);
          
          console.log(`[batch-processor] ✓ Video ${index} completed: ${result.videoId}`);
        } else {
          // Failed
          itemStatuses[index] = {
            status: 'failed',
            error: result.error || 'Unknown error',
            failedStep: result.failedStep,
            completedAt: new Date(),
          };
          
          console.error(`[batch-processor] ✗ Video ${index} failed:`, result.error);
        }
      } catch (error: any) {
        // Exception during generation
        itemStatuses[index] = {
          status: 'failed',
          error: error.message || 'Generation error',
          completedAt: new Date(),
        };
        
        console.error(`[batch-processor] ✗ Video ${index} error:`, error);
      }

      // Update campaign after each video
      await updateVideoCampaign(campaignId, {
        itemStatuses,
        generatedVideoIds,
      });
    }

    // All videos processed - update final status
    const progress = calculateProgress(itemStatuses);
    const finalStatus = progress.failed > 0 && progress.completed === 0 
      ? 'failed' 
      : progress.failed > 0 
        ? 'review' 
        : 'review'; // Always go to review for user to check

    await updateVideoCampaign(campaignId, {
      status: finalStatus,
      itemStatuses,
      generatedVideoIds,
    });

    console.log(`[batch-processor] ✓ Batch complete for campaign ${campaignId}`);
    console.log(`[batch-processor] Progress:`, progress);

  } catch (error: any) {
    console.error(`[batch-processor] Batch processing failed:`, error);
    
    // Update campaign status to failed
    await updateVideoCampaign(campaignId, {
      status: 'failed',
    });
    
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// RETRY FAILED ITEMS
// ═══════════════════════════════════════════════════════════════

/**
 * Retry a single failed video in a campaign
 */
export async function retryFailedItem(
  campaignId: string,
  itemIndex: number
): Promise<void> {
  console.log(`[batch-processor] Retrying item ${itemIndex} in campaign ${campaignId}`);

  const campaign = await getVideoCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  const itemStatuses = (campaign.itemStatuses as Record<string, ItemStatus>) || {};
  const videoIdeas = (campaign.videoIdeas as any[]) || [];
  
  if (!itemStatuses[itemIndex] || itemStatuses[itemIndex].status !== 'failed') {
    throw new Error(`Item ${itemIndex} is not in failed status`);
  }

  const ideaItem = videoIdeas[itemIndex];
  const idea = typeof ideaItem === 'string' ? ideaItem : ideaItem.idea || ideaItem.topic;

  // Update status to generating
  itemStatuses[itemIndex] = {
    status: 'generating',
    startedAt: new Date(),
  };
  
  await updateVideoCampaign(campaignId, { itemStatuses });

  try {
    // Generate video
    const result = await generateVideoForMode(
      campaign.videoMode as VideoMode,
      idea,
      campaign.campaignSettings as CampaignSettings,
      campaign.userId,
      campaign.workspaceId
    );

    const generatedVideoIds = campaign.generatedVideoIds || [];

    if (result.success && result.videoId) {
      itemStatuses[itemIndex] = {
        status: 'completed',
        videoId: result.videoId,
        completedAt: new Date(),
      };
      
      generatedVideoIds.push(result.videoId);
      
      console.log(`[batch-processor] ✓ Retry successful for item ${itemIndex}`);
    } else {
      itemStatuses[itemIndex] = {
        status: 'failed',
        error: result.error || 'Unknown error',
        completedAt: new Date(),
      };
      
      console.error(`[batch-processor] ✗ Retry failed for item ${itemIndex}:`, result.error);
    }

    await updateVideoCampaign(campaignId, {
      itemStatuses,
      generatedVideoIds,
    });

  } catch (error: any) {
    itemStatuses[itemIndex] = {
      status: 'failed',
      error: error.message || 'Generation error',
      completedAt: new Date(),
    };
    
    await updateVideoCampaign(campaignId, { itemStatuses });
    
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// PROGRESS TRACKING
// ═══════════════════════════════════════════════════════════════

/**
 * Get current progress for a campaign with detailed step information
 */
export async function getBatchProgress(campaignId: string): Promise<BatchGenerationProgress> {
  const campaign = await getVideoCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  const itemStatuses = (campaign.itemStatuses as Record<string, ItemStatus>) || {};
  const videoIdeas = (campaign.videoIdeas as any[]) || [];
  const progress = calculateProgress(itemStatuses);

  // Find current video being processed
  const currentIndex = Object.keys(itemStatuses).find(
    key => itemStatuses[key].status === 'generating'
  );
  
  let currentItem = undefined;
  if (currentIndex) {
    const statusEntry = itemStatuses[currentIndex];
    const videoIdea = videoIdeas[parseInt(currentIndex)];
    const idea = typeof videoIdea === 'string' ? videoIdea : videoIdea?.idea || videoIdea?.topic;
    
    // Try to get current step from video if we have a videoId
    let currentStep = 1;
    let stageName = 'Starting';
    
    if (statusEntry.videoId) {
      try {
        const { storage } = await import('../../../storage');
        const video = await storage.getVideo(statusEntry.videoId);
        if (video) {
          currentStep = video.currentStep || 1;
          stageName = getStageFromStep(currentStep);
        }
      } catch (e) {
        // Ignore errors - just use defaults
      }
    }
    
    currentItem = {
      index: parseInt(currentIndex),
      topic: idea,
      stage: stageName,
      progress: calculateStepProgress(currentStep),
    };
  }

  return {
    campaignId: campaign.id,
    status: campaign.status || 'draft',
    ...progress,
    itemStatuses,
    currentItem,
  };
}

/**
 * Map step number to human-readable stage name
 */
function getStageFromStep(step: number): string {
  const stepNames: Record<number, string> = {
    1: 'Generating mood description',
    2: 'Visual settings applied',
    3: 'Generating scenes & shots',
    4: 'Generating images & videos',
    5: 'Generating audio',
    6: 'Building timeline',
    7: 'Finalizing export',
  };
  return stepNames[step] || 'Processing';
}

/**
 * Calculate rough progress percentage within current step
 */
function calculateStepProgress(currentStep: number): number {
  // Approximate progress based on step (each step is ~14% of total)
  return Math.min(currentStep * 14, 100);
}

/**
 * Calculate progress stats from itemStatuses
 */
function calculateProgress(itemStatuses: Record<string, ItemStatus>): {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  inProgress: number;
} {
  const statuses = Object.values(itemStatuses);
  const total = statuses.length;

  return {
    total,
    completed: statuses.filter(s => s.status === 'completed').length,
    failed: statuses.filter(s => s.status === 'failed').length,
    pending: statuses.filter(s => s.status === 'pending').length,
    inProgress: statuses.filter(s => s.status === 'generating').length,
  };
}
