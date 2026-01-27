/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BATCH PROCESSOR SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Handles batch generation of multiple stories from topics.
 * 
 * Process:
 * 1. Get campaign settings
 * 2. For each topic (1-10):
 *    - Update progress
 *    - Generate story
 *    - Save result
 *    - Handle errors
 * 3. Mark campaign as completed
 */

import { storage } from '../../../storage';
import { generateStory } from './story-generator';
import type { StoryCampaign } from '@shared/schema';
import type { StoryGenerationSettings, BatchGenerationProgress } from '../types';

// In-memory progress tracking (TODO: move to Redis for production)
const batchProgress = new Map<string, BatchGenerationProgress>();

// Type for storyTopics array items
interface StoryTopic {
  topic: string;
  index: number;
}

// Type for itemStatuses
interface ItemStatus {
  status: 'pending' | 'generating' | 'completed' | 'failed';
  storyId?: string;
  error?: string;
}

/**
 * Start batch generation for a story campaign
 */
export async function startBatchGeneration(campaignId: string): Promise<{ jobId: string }> {
  console.log('[batch-processor] Starting batch generation for campaign:', campaignId);
  
  // Get campaign
  const campaign = await storage.getStoryCampaign(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }
  
  // Update campaign status
  await storage.updateStoryCampaign(campaignId, {
    status: 'generating',
  });
  
  // Get topics from storyTopics JSONB field
  const topics = (campaign.storyTopics as StoryTopic[]) || [];
  
  // Initialize progress tracking
  batchProgress.set(campaignId, {
    campaignId,
    total: topics.length,
    completed: 0,
    failed: 0,
    inProgress: 0,
    pending: topics.length,
  });
  
  // Start generation asynchronously (don't await)
  processBatch(campaignId, campaign).catch((error) => {
    console.error('[batch-processor] Batch generation failed:', error);
  });
  
  return { jobId: `batch-${campaignId}` };
}

/**
 * Process batch generation
 */
async function processBatch(campaignId: string, campaign: StoryCampaign) {
  const topics = (campaign.storyTopics as StoryTopic[]) || [];
  const settings = (campaign.campaignSettings as Record<string, unknown>) || {};
  
  // Build settings from campaign's campaignSettings JSONB
  const baseSettings: Omit<StoryGenerationSettings, 'topic'> = {
    template: campaign.template as any,
    duration: (settings.duration as number) || 45,
    aspectRatio: (settings.aspectRatio as string) || '9:16',
    language: (settings.language as string) || 'en',
    imageStyle: (settings.imageStyle as string) || 'photorealistic',
    imageModel: (settings.imageModel as string) || 'nano-banana',
    videoModel: settings.videoModel as string | undefined,
    mediaType: (settings.mediaType as any) || 'static',
    transitionStyle: settings.transitionStyle as string | undefined,
    hasVoiceover: (settings.hasVoiceover as boolean) ?? true,
    voiceProfile: settings.voiceProfile as string | undefined,
    voiceVolume: (settings.voiceVolume as number) || 80,
    backgroundMusic: settings.backgroundMusicTrack as string | undefined,
    musicVolume: (settings.musicVolume as number) || 40,
  };
  
  // Get current itemStatuses
  let itemStatuses = (campaign.itemStatuses as Record<string, ItemStatus>) || {};
  const generatedStoryIds: string[] = campaign.generatedStoryIds || [];
  
  // Process each topic
  for (let i = 0; i < topics.length; i++) {
    const topicData = topics[i];
    const topic = topicData.topic;
    const topicIndex = String(topicData.index);
    
    // Skip if already completed
    if (itemStatuses[topicIndex]?.status === 'completed') {
      console.log(`[batch-processor] Topic ${i + 1} already completed, skipping`);
      continue;
    }
    
    try {
      console.log(`[batch-processor] Processing topic ${i + 1}/${topics.length}: ${topic}`);
      
      // Update progress
      updateProgress(campaignId, {
        inProgress: 1,
        pending: topics.length - i - 1,
        currentIndex: i,
        currentTopic: topic,
        currentStage: 'script',
        currentProgress: 0,
      });
      
      // Update itemStatuses to generating
      itemStatuses[topicIndex] = { status: 'generating' };
      await storage.updateStoryCampaign(campaignId, {
        itemStatuses: itemStatuses,
      });
      
      // Generate story
      const storySettings: StoryGenerationSettings = {
        ...baseSettings,
        topic,
      };
      
      const result = await generateStory(storySettings);
      
      if (result.success && result.story) {
        // Create story in stories table
        // Note: videoUrl and thumbnailUrl will be set after video rendering
        const story = await storage.createStory({
          userId: campaign.userId,
          workspaceId: campaign.workspaceId,
          projectName: result.story.title || topic,
          projectFolder: `campaign-${campaignId}-${topicIndex}`,
          storyMode: campaign.template,
          duration: baseSettings.duration,
          aspectRatio: baseSettings.aspectRatio,
        });
        
        // Update itemStatuses with completed status and storyId
        itemStatuses[topicIndex] = { 
          status: 'completed', 
          storyId: story.id 
        };
        
        // Add to generatedStoryIds array
        generatedStoryIds.push(story.id);
        
        await storage.updateStoryCampaign(campaignId, {
          itemStatuses: itemStatuses,
          generatedStoryIds: generatedStoryIds,
        });
        
        // Update progress
        updateProgress(campaignId, {
          completed: (batchProgress.get(campaignId)?.completed || 0) + 1,
          inProgress: 0,
        });
        
        console.log(`[batch-processor] ✓ Topic ${i + 1} completed, story ID: ${story.id}`);
      } else {
        // Handle failure
        itemStatuses[topicIndex] = { 
          status: 'failed', 
          error: result.error 
        };
        
        await storage.updateStoryCampaign(campaignId, {
          itemStatuses: itemStatuses,
        });
        
        // Update progress
        updateProgress(campaignId, {
          failed: (batchProgress.get(campaignId)?.failed || 0) + 1,
          inProgress: 0,
        });
        
        console.error(`[batch-processor] ✗ Topic ${i + 1} failed:`, result.error);
      }
      
    } catch (error) {
      console.error(`[batch-processor] Error processing topic ${i + 1}:`, error);
      
      // Update itemStatuses with error
      itemStatuses[topicIndex] = { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      await storage.updateStoryCampaign(campaignId, {
        itemStatuses: itemStatuses,
      });
      
      // Update progress
      updateProgress(campaignId, {
        failed: (batchProgress.get(campaignId)?.failed || 0) + 1,
        inProgress: 0,
      });
    }
  }
  
  // Mark campaign as completed or review based on results
  const finalProgress = batchProgress.get(campaignId);
  const finalStatus = finalProgress?.failed === topics.length ? 'failed' : 'review';
  
  await storage.updateStoryCampaign(campaignId, {
    status: finalStatus,
  });
  
  console.log('[batch-processor] Batch generation completed with status:', finalStatus);
}

/**
 * Update progress tracking
 */
function updateProgress(campaignId: string, updates: Partial<BatchGenerationProgress>) {
  const current = batchProgress.get(campaignId);
  if (current) {
    batchProgress.set(campaignId, { ...current, ...updates });
  }
}

/**
 * Get current progress
 */
export function getBatchProgress(campaignId: string): BatchGenerationProgress | undefined {
  return batchProgress.get(campaignId);
}

/**
 * Cancel batch generation
 */
export async function cancelBatchGeneration(campaignId: string): Promise<void> {
  // TODO: Implement proper cancellation with abort controller
  batchProgress.delete(campaignId);
  
  await storage.updateStoryCampaign(campaignId, {
    status: 'paused',
  });
  
  console.log('[batch-processor] Batch generation cancelled');
}
