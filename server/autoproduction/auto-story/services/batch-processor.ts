/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BATCH PROCESSOR SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Orchestrates batch generation of N stories in a campaign.
 * Manages progress tracking, error handling, and status updates.
 * 
 * Mirrors auto-video batch-processor pattern:
 * - DB-based progress tracking (no in-memory maps)
 * - Per-item retry support
 * - Sequential processing with error isolation
 * - Scheduling helpers for continuous/scheduled modes
 */

import { generateFullStory, extractCampaignSettings, getStageFromStep, calculateStepProgress, type StoryProgressCallback } from './story-orchestrator';
import { 
  getStoryCampaign, 
  updateStoryCampaign 
} from '../../shared/services/campaign-manager';
import type { 
  StoryItemStatus, 
  BatchGenerationProgress,
  StoryCampaignSettings,
} from '../types';
import type { StoryCampaign } from '@shared/schema';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface StoryTopic {
  topic: string;
  index: number;
}

// ═══════════════════════════════════════════════════════════════
// SCHEDULING HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate the scheduled publish time for a story based on campaign settings
 * 
 * Continuous mode: Space stories evenly based on maxStoriesPerDay
 * Scheduled mode: Use per-topic date from itemSchedules
 */
function calculateScheduledTime(
  campaign: StoryCampaign,
  storyIndex: number
): string | undefined {
  const platforms = (campaign.selectedPlatforms as string[]) || [];
  if (platforms.length === 0) return undefined;

  const automationMode = campaign.automationMode;
  const itemSchedules = (campaign.itemSchedules as Record<string, any>) || {};
  
  if (automationMode === 'continuous') {
    const startDate = campaign.scheduleStartDate;
    const maxPerDay = campaign.maxStoriesPerDay || 1;
    if (!startDate) return undefined;
    
    const hoursPerStory = 24 / maxPerDay;
    const scheduled = new Date(startDate);
    scheduled.setHours(scheduled.getHours() + Math.floor(storyIndex * hoursPerStory));
    
    console.log(`[batch-processor] Continuous schedule for story ${storyIndex}: ${scheduled.toISOString()} (${hoursPerStory}h spacing)`);
    return scheduled.toISOString();
    
  } else if (automationMode === 'scheduled') {
    const itemSchedule = itemSchedules[String(storyIndex)];
    const scheduledDate = itemSchedule?.scheduledDate;
    
    if (scheduledDate) {
      console.log(`[batch-processor] Scheduled date for story ${storyIndex}: ${scheduledDate}`);
      return typeof scheduledDate === 'string' ? scheduledDate : new Date(scheduledDate).toISOString();
    }
    return undefined;
  }
  
  return undefined;
}

/**
 * Build enriched campaign settings with publishing configuration
 * 
 * Merges top-level campaign fields (selectedPlatforms, automationMode, etc.)
 * into settings.publishing for the orchestrator
 */
function buildEnrichedSettings(
  campaign: StoryCampaign,
  storyIndex: number
): StoryCampaignSettings {
  const baseSettings = extractCampaignSettings(campaign);
  const platforms = (campaign.selectedPlatforms as string[]) || [];
  const scheduledFor = calculateScheduledTime(campaign, storyIndex);
  
  let scheduleMode: 'immediate' | 'scheduled' | 'continuous' = 'immediate';
  if (campaign.automationMode === 'continuous') {
    scheduleMode = 'continuous';
  } else if (campaign.automationMode === 'scheduled') {
    scheduleMode = 'scheduled';
  }
  
  const enrichedSettings: StoryCampaignSettings = {
    ...baseSettings,
    publishing: {
      enabled: platforms.length > 0,
      platforms,
      scheduleMode,
      scheduledFor,
    }
  };
  
  console.log(`[batch-processor] Publishing settings for story ${storyIndex}:`, {
    enabled: enrichedSettings.publishing?.enabled,
    platforms: enrichedSettings.publishing?.platforms,
    scheduleMode: enrichedSettings.publishing?.scheduleMode,
    scheduledFor: enrichedSettings.publishing?.scheduledFor,
  });
  
  return enrichedSettings;
}

// ═══════════════════════════════════════════════════════════════
// MAIN BATCH PROCESSOR
// ═══════════════════════════════════════════════════════════════

/**
 * Process all stories in a campaign batch.
 * Updates campaign status and itemStatuses as it progresses.
 */
export async function processCampaignBatch(campaignId: string): Promise<void> {
  console.log(`[batch-processor] Starting batch generation for campaign: ${campaignId}`);

  try {
    // Load campaign
    const campaign = await getStoryCampaign(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    // Validate campaign status
    if (campaign.status !== 'draft' && campaign.status !== 'paused') {
      throw new Error(`Cannot start generation: campaign status is ${campaign.status}`);
    }

    // Get story topics
    const storyTopics = (campaign.storyTopics as StoryTopic[]) || [];
    if (storyTopics.length === 0) {
      throw new Error('No story topics found in campaign');
    }

    console.log(`[batch-processor] Processing ${storyTopics.length} stories`);

    // Settings will be enriched per-story with publishing config

    // Initialize itemStatuses if not exists
    const itemStatuses = (campaign.itemStatuses as Record<string, StoryItemStatus>) || {};
    const generatedStoryIds: string[] = campaign.generatedStoryIds || [];

    // Update campaign status to generating
    await updateStoryCampaign(campaignId, {
      status: 'generating',
      itemStatuses,
    });

    // Process each topic sequentially
    for (let i = 0; i < storyTopics.length; i++) {
      const topicData = storyTopics[i];
      const topic = typeof topicData === 'string' ? topicData : topicData.topic;
      const index = typeof topicData === 'string' ? i : (topicData.index ?? i);

      console.log(`[batch-processor] ══════════════════════════════════════════════════`);
      console.log(`[batch-processor] 📖 Story ${index + 1}/${storyTopics.length}: "${topic}"`);
      console.log(`[batch-processor] ══════════════════════════════════════════════════`);

      // Check for cancellation between items (re-read campaign status from DB)
      const freshCampaign = await getStoryCampaign(campaignId);
      if (freshCampaign && (freshCampaign.status === 'paused' || freshCampaign.status === 'cancelled')) {
        console.log(`[batch-processor] Generation cancelled/paused for campaign ${campaignId}, stopping.`);
        break;
      }

      // Skip if already completed
      if (itemStatuses[index]?.status === 'completed') {
        console.log(`[batch-processor] Story ${index} already completed, skipping`);
        continue;
      }

      // Update status to generating
      itemStatuses[index] = {
        status: 'generating',
        startedAt: new Date(),
      };
      
      await updateStoryCampaign(campaignId, { itemStatuses });

      try {
        // Build enriched settings with publishing configuration for this story
        const enrichedSettings = buildEnrichedSettings(campaign, i);

        // Progress callback — persists currentStep into itemStatuses JSONB
        const onProgress: StoryProgressCallback = async (info) => {
          try {
            itemStatuses[index] = {
              ...itemStatuses[index],
              metadata: {
                ...(itemStatuses[index]?.metadata || {}),
                currentStep: info.step,
                stageName: info.stageName,
                stageProgress: info.progress,
              },
            };
            await updateStoryCampaign(campaignId, { itemStatuses });
          } catch (e) {
            // Don't fail generation if progress update fails
            console.warn(`[batch-processor] Progress update failed for item ${index}:`, e);
          }
        };

        // First attempt - Generate story via orchestrator
        let result = await generateFullStory(
          topic,
          enrichedSettings,
          campaign.userId,
          campaign.workspaceId,
          undefined,
          onProgress
        );

        // Retry once if failed and retryable — resume from last completed step
        if (!result.success && result.retryable) {
          const resumeStep = result.intermediateData?.completedStep 
            ? result.intermediateData.completedStep + 1 
            : 1;
          console.log(`[batch-processor] Retrying story ${index} (resuming from step ${resumeStep}, failed at step ${result.failedStep})...`);
          
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          result = await generateFullStory(
            topic,
            enrichedSettings,
            campaign.userId,
            campaign.workspaceId,
            { 
              isRetry: true, 
              failedStep: result.failedStep,
              intermediateData: result.intermediateData,
            },
            onProgress
          );
        }

        if (result.success && result.storyId) {
          // Success
          itemStatuses[index] = {
            status: 'completed',
            storyId: result.storyId,
            completedAt: new Date(),
            metadata: result.metadata,
          };
          
          generatedStoryIds.push(result.storyId);
          
          console.log(`[batch-processor] ✓ Story ${index} completed: ${result.storyId}`);
        } else {
          // Failed
          itemStatuses[index] = {
            status: 'failed',
            error: result.error || 'Unknown error',
            failedStep: result.failedStep,
            completedAt: new Date(),
          };
          
          console.error(`[batch-processor] ✗ Story ${index} failed:`, result.error);
        }
      } catch (error: any) {
        // Exception during generation
        itemStatuses[index] = {
          status: 'failed',
          error: error.message || 'Generation error',
          completedAt: new Date(),
        };
        
        console.error(`[batch-processor] ✗ Story ${index} error:`, error);
      }

      // Update campaign after each story
      await updateStoryCampaign(campaignId, {
        itemStatuses,
        generatedStoryIds,
      });
    }

    // All stories processed - update final status
    const progress = calculateProgress(itemStatuses);
    const finalStatus = progress.failed > 0 && progress.completed === 0 
      ? 'failed' 
      : 'completed';

    await updateStoryCampaign(campaignId, {
      status: finalStatus,
      itemStatuses,
      generatedStoryIds,
    });

    console.log(`[batch-processor] ✓ Batch complete for campaign ${campaignId}`);
    console.log(`[batch-processor] Progress:`, progress);

  } catch (error: any) {
    console.error(`[batch-processor] Batch processing failed:`, error);
    
    // Update campaign status to failed
    await updateStoryCampaign(campaignId, {
      status: 'failed',
    });
    
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// RETRY FAILED ITEMS
// ═══════════════════════════════════════════════════════════════

/**
 * Retry a single failed story in a campaign
 */
export async function retryFailedItem(
  campaignId: string,
  itemIndex: number
): Promise<void> {
  console.log(`[batch-processor] Retrying item ${itemIndex} in campaign ${campaignId}`);

  const campaign = await getStoryCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  const itemStatuses = (campaign.itemStatuses as Record<string, StoryItemStatus>) || {};
  const storyTopics = (campaign.storyTopics as StoryTopic[]) || [];
  
  if (!itemStatuses[itemIndex] || itemStatuses[itemIndex].status !== 'failed') {
    throw new Error(`Item ${itemIndex} is not in failed status`);
  }

  const topicData = storyTopics[itemIndex];
  const topic = typeof topicData === 'string' ? topicData : topicData.topic;
  const settings = buildEnrichedSettings(campaign, itemIndex);

  // Update status to generating
  itemStatuses[itemIndex] = {
    status: 'generating',
    startedAt: new Date(),
  };
  
  await updateStoryCampaign(campaignId, { itemStatuses });

  try {
    // Progress callback for retry
    const onProgress: StoryProgressCallback = async (info) => {
      try {
        itemStatuses[itemIndex] = {
          ...itemStatuses[itemIndex],
          metadata: {
            ...(itemStatuses[itemIndex]?.metadata || {}),
            currentStep: info.step,
            stageName: info.stageName,
            stageProgress: info.progress,
          },
        };
        await updateStoryCampaign(campaignId, { itemStatuses });
      } catch (e) {
        console.warn(`[batch-processor] Progress update failed for item ${itemIndex}:`, e);
      }
    };

    // Generate story
    const result = await generateFullStory(
      topic,
      settings,
      campaign.userId,
      campaign.workspaceId,
      undefined,
      onProgress
    );

    const generatedStoryIds = campaign.generatedStoryIds || [];

    if (result.success && result.storyId) {
      itemStatuses[itemIndex] = {
        status: 'completed',
        storyId: result.storyId,
        completedAt: new Date(),
        metadata: result.metadata,
      };
      
      generatedStoryIds.push(result.storyId);
      
      console.log(`[batch-processor] ✓ Retry successful for item ${itemIndex}`);
    } else {
      itemStatuses[itemIndex] = {
        status: 'failed',
        error: result.error || 'Unknown error',
        failedStep: result.failedStep,
        completedAt: new Date(),
      };
      
      console.error(`[batch-processor] ✗ Retry failed for item ${itemIndex}:`, result.error);
    }

    await updateStoryCampaign(campaignId, {
      itemStatuses,
      generatedStoryIds,
    });

  } catch (error: any) {
    itemStatuses[itemIndex] = {
      status: 'failed',
      error: error.message || 'Generation error',
      completedAt: new Date(),
    };
    
    await updateStoryCampaign(campaignId, { itemStatuses });
    
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// PROGRESS TRACKING (DB-based, no in-memory maps)
// ═══════════════════════════════════════════════════════════════

/**
 * Get current progress for a campaign with detailed step information.
 * Reads directly from DB (no in-memory state).
 */
export async function getBatchProgress(campaignId: string): Promise<BatchGenerationProgress> {
  const campaign = await getStoryCampaign(campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  const itemStatuses = (campaign.itemStatuses as Record<string, StoryItemStatus>) || {};
  const storyTopics = (campaign.storyTopics as StoryTopic[]) || [];
  const progress = calculateProgress(itemStatuses);

  // Find current story being processed
  const currentIndex = Object.keys(itemStatuses).find(
    key => itemStatuses[key].status === 'generating'
  );
  
  let currentItem = undefined;
  if (currentIndex) {
    const statusEntry = itemStatuses[currentIndex];
    const topicData = storyTopics[parseInt(currentIndex)];
    const topic = typeof topicData === 'string' ? topicData : topicData?.topic;
    
    // Read real step progress from metadata (written by onProgress callback)
    const meta = statusEntry.metadata || {};
    const currentStep = meta.currentStep || 0;
    const stageName = currentStep > 0 
      ? getStageFromStep(currentStep) 
      : 'Starting';
    const stageProgress = meta.stageProgress || (currentStep > 0 ? calculateStepProgress(currentStep) : 0);
    
    currentItem = {
      index: parseInt(currentIndex),
      topic: topic || '',
      stage: stageName,
      progress: stageProgress,
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
 * Calculate progress stats from itemStatuses
 */
function calculateProgress(itemStatuses: Record<string, StoryItemStatus>): {
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
