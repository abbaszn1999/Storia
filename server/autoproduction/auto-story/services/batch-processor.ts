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
import type { ProductionCampaign } from '@shared/schema';
import type { StoryGenerationSettings, BatchGenerationProgress } from '../types';

// In-memory progress tracking (TODO: move to Redis for production)
const batchProgress = new Map<string, BatchGenerationProgress>();

/**
 * Start batch generation for a campaign
 */
export async function startBatchGeneration(campaignId: string): Promise<{ jobId: string }> {
  console.log('[batch-processor] Starting batch generation for campaign:', campaignId);
  
  // Get campaign
  const campaign = await storage.getProductionCampaign(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }
  
  if (campaign.type !== 'auto-story') {
    throw new Error('Campaign is not an auto-story campaign');
  }
  
  // Update campaign status
  await storage.updateProductionCampaign(campaignId, {
    status: 'generating',
    generationStartedAt: new Date(),
  });
  
  // Initialize progress tracking
  const topics = campaign.storyTopics || [];
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
async function processBatch(campaignId: string, campaign: ProductionCampaign) {
  const topics = campaign.storyTopics || [];
  
  // Build settings from campaign
  const baseSettings: Omit<StoryGenerationSettings, 'topic'> = {
    template: campaign.storyTemplate as any,
    duration: campaign.storyDuration || 45,
    aspectRatio: campaign.storyAspectRatio || '9:16',
    language: campaign.storyLanguage || 'en',
    imageStyle: campaign.imageStyle || 'photorealistic',
    imageModel: campaign.storyImageModel || 'nano-banana',
    videoModel: campaign.storyVideoModel,
    mediaType: campaign.storyMediaType as any || 'static',
    transitionStyle: campaign.storyTransition,
    hasVoiceover: campaign.storyHasVoiceover ?? true,
    voiceProfile: campaign.storyVoiceProfile,
    voiceVolume: campaign.storyVoiceVolume || 80,
    backgroundMusic: campaign.storyBackgroundMusicTrack,
    musicVolume: campaign.storyMusicVolume || 40,
  };
  
  // Process each topic
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    
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
      
      // Create campaign item
      const item = await storage.createCampaignItem({
        campaignId,
        type: 'story',
        sourceIdea: topic,
        orderIndex: i + 1,
        status: 'generating',
      });
      
      // Generate story
      const settings: StoryGenerationSettings = {
        ...baseSettings,
        topic,
      };
      
      const result = await generateStory(settings);
      
      if (result.success && result.story) {
        // Update item with generated content
        await storage.updateCampaignItem(item.id, {
          title: result.story.title,
          script: result.story.script,
          scenes: result.story.scenes as any,
          status: 'completed',
          generationProgress: 100,
        });
        
        // Update progress
        updateProgress(campaignId, {
          completed: i + 1,
          inProgress: 0,
        });
        
        console.log(`[batch-processor] ✓ Topic ${i + 1} completed`);
      } else {
        // Handle failure
        await storage.updateCampaignItem(item.id, {
          status: 'failed',
          errorMessage: result.error,
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
      
      // Update progress
      updateProgress(campaignId, {
        failed: (batchProgress.get(campaignId)?.failed || 0) + 1,
        inProgress: 0,
      });
    }
  }
  
  // Mark campaign as completed
  await storage.updateProductionCampaign(campaignId, {
    status: 'review',
    generationCompletedAt: new Date(),
    itemsGenerated: batchProgress.get(campaignId)?.completed || 0,
  });
  
  console.log('[batch-processor] Batch generation completed');
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
  // TODO: Implement proper cancellation
  batchProgress.delete(campaignId);
  
  await storage.updateProductionCampaign(campaignId, {
    status: 'paused',
  });
  
  console.log('[batch-processor] Batch generation cancelled');
}
