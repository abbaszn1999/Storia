/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUTO STORY ROUTES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * API endpoints for Auto Story functionality.
 * Mirrors auto-video route structure for consistency.
 * 
 * Campaign CRUD is in autoproduction/shared/routes (shared with auto-video).
 * These routes handle generation lifecycle:
 * - Start batch generation
 * - Get progress (DB-based)
 * - Retry failed items
 * - Cancel generation
 * - Story item management
 */

import { Router } from 'express';
import { isAuthenticated, getCurrentUserId } from '../../../auth';
import { storage } from '../../../storage';
import { 
  processCampaignBatch, 
  getBatchProgress, 
  retryFailedItem 
} from '../services/batch-processor';
import { getStoryCampaign, updateStoryCampaign } from '../../shared/services/campaign-manager';
import { TEMPLATE_STRUCTURES } from '../templates/template-structures';
import type { StoryItemStatus } from '../types';

const router = Router();

// Type for storyTopics array items
interface StoryTopic {
  topic: string;
  index: number;
}

// ═══════════════════════════════════════════════════════════════
// START BATCH GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/autoproduction/story/:id/generate
 * Start batch generation for a campaign.
 * 
 * Fires processCampaignBatch() async and returns immediately.
 * Client should poll GET /:id/progress to monitor status.
 */
router.post('/:id/generate', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;

    console.log(`[auto-story:routes] Starting generation for campaign: ${id}`);

    // Validate campaign exists and belongs to user
    const campaign = await getStoryCampaign(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate campaign status
    if (campaign.status !== 'draft' && campaign.status !== 'paused') {
      return res.status(400).json({ 
        error: `Cannot start generation: campaign status is ${campaign.status}` 
      });
    }

    // Validate has story topics
    const storyTopics = (campaign.storyTopics as any[]) || [];
    if (storyTopics.length === 0) {
      return res.status(400).json({ error: 'No story topics in campaign' });
    }

    // Fire batch processor async (don't await)
    processCampaignBatch(id).catch(error => {
      console.error(`[auto-story:routes] Batch processing error for ${id}:`, error);
    });

    // Return immediately
    res.json({
      success: true,
      started: true,
      campaignId: id,
      message: `Started generation for ${storyTopics.length} stories`,
    });

  } catch (error: any) {
    console.error('[auto-story:routes] Error starting generation:', error);
    res.status(500).json({ error: error.message || 'Failed to start generation' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET PROGRESS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/autoproduction/story/:id/progress
 * Get current generation progress for a campaign.
 * 
 * Returns progress stats and per-item status (DB-based).
 */
router.get('/:id/progress', isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;

    const progress = await getBatchProgress(id);

    res.json({
      success: true,
      progress,
    });

  } catch (error: any) {
    console.error('[auto-story:routes] Error getting progress:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message || 'Failed to get progress' });
  }
});

// ═══════════════════════════════════════════════════════════════
// RETRY FAILED ITEM
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/autoproduction/story/:id/retry/:itemIndex
 * Retry generation for a specific failed story.
 * 
 * Fires retryFailedItem() async and returns immediately.
 * Client should poll GET /:id/progress to monitor retry status.
 */
router.post('/:id/retry/:itemIndex', isAuthenticated, async (req: any, res) => {
  try {
    const { id, itemIndex } = req.params;
    const index = parseInt(itemIndex);

    if (isNaN(index)) {
      return res.status(400).json({ error: 'Invalid item index' });
    }

    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`[auto-story:routes] Retrying item ${index} in campaign ${id}`);

    // Validate campaign exists and belongs to user
    const campaign = await getStoryCampaign(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate item exists and is failed
    const itemStatuses = (campaign.itemStatuses as Record<string, any>) || {};
    if (!itemStatuses[index]) {
      return res.status(404).json({ error: `Item ${index} not found` });
    }
    
    if (itemStatuses[index].status !== 'failed') {
      return res.status(400).json({ 
        error: `Item ${index} is not in failed status (current: ${itemStatuses[index].status})` 
      });
    }

    // Fire retry async (don't await)
    retryFailedItem(id, index).catch(error => {
      console.error(`[auto-story:routes] Retry error for ${id}/${index}:`, error);
    });

    // Return immediately
    res.json({
      success: true,
      retrying: true,
      campaignId: id,
      itemIndex: index,
      message: `Retrying story ${index}`,
    });

  } catch (error: any) {
    console.error('[auto-story:routes] Error retrying item:', error);
    res.status(500).json({ error: error.message || 'Failed to retry item' });
  }
});

// ═══════════════════════════════════════════════════════════════
// CANCEL GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/autoproduction/story/:id/cancel-batch
 * Cancel ongoing batch generation.
 * 
 * Soft cancel - current item will complete but no new items will start.
 */
router.post('/:id/cancel-batch', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const campaign = await getStoryCampaign(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (campaign.status !== 'generating') {
      return res.status(400).json({ 
        error: `Campaign is not generating (current status: ${campaign.status})`,
      });
    }

    // Update campaign status to paused
    await updateStoryCampaign(id, { status: 'paused' });

    res.json({ 
      success: true, 
      message: 'Generation cancelled. Current item will complete.',
    });
  } catch (error: any) {
    console.error('[auto-story:routes] Error cancelling generation:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel generation' });
  }
});

// ═══════════════════════════════════════════════════════════════
// REGENERATE FAILED
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/autoproduction/story/:id/regenerate-failed
 * Regenerate all failed stories in the campaign
 */
router.post('/:id/regenerate-failed', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const campaign = await getStoryCampaign(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all failed items
    const itemStatuses = (campaign.itemStatuses as Record<string, StoryItemStatus>) || {};
    const failedIndices = Object.keys(itemStatuses)
      .filter(key => itemStatuses[key].status === 'failed')
      .map(key => parseInt(key));

    if (failedIndices.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No failed stories to regenerate',
        retriedCount: 0,
      });
    }

    // Reset failed items to pending
    for (const index of failedIndices) {
      itemStatuses[index.toString()] = {
        status: 'pending',
        storyId: undefined,
        error: undefined,
      };
    }

    // Update campaign and reset to draft so it can be regenerated
    await updateStoryCampaign(id, { 
      itemStatuses,
      status: 'draft',
    });

    res.json({ 
      success: true, 
      retriedCount: failedIndices.length,
      message: `Reset ${failedIndices.length} failed stories. Click "Start Generation" to retry.`,
    });

  } catch (error: any) {
    console.error('[auto-story:routes] Error regenerating failed:', error);
    res.status(500).json({ error: error.message || 'Failed to regenerate failed stories' });
  }
});

// ═══════════════════════════════════════════════════════════════
// APPROVE ALL
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/autoproduction/story/:id/approve-all
 * Approve all completed stories in the campaign
 */
router.post('/:id/approve-all', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const campaign = await getStoryCampaign(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Count completed stories
    const itemStatuses = (campaign.itemStatuses as Record<string, StoryItemStatus>) || {};
    const completedCount = Object.values(itemStatuses)
      .filter(item => item.status === 'completed').length;

    // Update campaign status to completed
    await updateStoryCampaign(id, { 
      status: 'completed',
    });

    res.json({ 
      success: true, 
      approvedCount: completedCount,
    });

  } catch (error: any) {
    console.error('[auto-story:routes] Error approving all:', error);
    res.status(500).json({ error: error.message || 'Failed to approve all stories' });
  }
});

// ═══════════ STORY ITEMS ═══════════

// Get all stories for a campaign
router.get('/:id/stories', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const campaign = await storage.getStoryCampaign(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get all stories from generatedStoryIds
    const storyIds = campaign.generatedStoryIds || [];
    const stories: Awaited<ReturnType<typeof storage.getStory>>[] = [];
    
    for (const storyId of storyIds) {
      const story = await storage.getStory(storyId);
      if (story) {
        stories.push(story);
      }
    }
    
    // Also include itemStatuses info for pending/failed items
    const itemStatuses = (campaign.itemStatuses as Record<string, StoryItemStatus>) || {};
    const storyTopics = (campaign.storyTopics as StoryTopic[]) || [];
    
    // Build response with both generated stories and pending items info
    const response = storyTopics.map((topicData, index) => {
      const status = itemStatuses[String(topicData.index)] || { status: 'pending' };
      const generatedStory = status.storyId 
        ? stories.find(s => s?.id === status.storyId) || null
        : null;
      
      // Debug: trace what the API returns for each story
      if (generatedStory) {
        console.log(`[auto-story] Story ${topicData.index} response:`, {
          storyId: generatedStory.id,
          hasVideoUrl: !!generatedStory.videoUrl,
          videoUrl: generatedStory.videoUrl?.substring(0, 80),
          hasThumbnailUrl: !!generatedStory.thumbnailUrl,
          duration: generatedStory.duration,
        });
      }
      
      return {
        index: topicData.index,
        topic: topicData.topic,
        status: status.status,
        error: status.error,
        story: generatedStory,
      };
    });
    
    res.json(response);
  } catch (error) {
    console.error('[auto-story] Error fetching stories:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// Get single story by index
router.get('/:id/stories/:itemIndex', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id, itemIndex } = req.params;
    const campaign = await storage.getStoryCampaign(id);
    
    if (!campaign || campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const itemStatuses = (campaign.itemStatuses as Record<string, StoryItemStatus>) || {};
    const storyTopics = (campaign.storyTopics as StoryTopic[]) || [];
    
    const topicData = storyTopics.find(t => String(t.index) === itemIndex);
    if (!topicData) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    const status = itemStatuses[itemIndex] || { status: 'pending' };
    let story = null;
    
    if (status.storyId) {
      story = await storage.getStory(status.storyId);
    }
    
    res.json({
      index: topicData.index,
      topic: topicData.topic,
      status: status.status,
      error: status.error,
      story,
    });
  } catch (error) {
    console.error('[auto-story] Error fetching story:', error);
    res.status(500).json({ error: 'Failed to fetch story' });
  }
});

// Update story status/schedule
router.patch('/:id/stories/:itemIndex', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id, itemIndex } = req.params;
    const { scheduledDate, publishedDate } = req.body;
    
    const campaign = await storage.getStoryCampaign(id);
    
    if (!campaign || campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Update itemSchedules if scheduling info provided
    if (scheduledDate || publishedDate) {
      const itemSchedules = (campaign.itemSchedules as Record<string, { scheduledDate?: string; publishedDate?: string }>) || {};
      
      itemSchedules[itemIndex] = {
        ...itemSchedules[itemIndex],
        ...(scheduledDate && { scheduledDate }),
        ...(publishedDate && { publishedDate }),
      };
      
      await storage.updateStoryCampaign(id, {
        itemSchedules,
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('[auto-story] Error updating story:', error);
    res.status(500).json({ error: 'Failed to update story' });
  }
});

// ═══════════ BULK ACTIONS ═══════════

// Schedule all completed stories
router.post('/:id/schedule-all', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const { startDate } = req.body;
    
    const campaign = await storage.getStoryCampaign(id);
    
    if (!campaign || campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const itemStatuses = (campaign.itemStatuses as Record<string, StoryItemStatus>) || {};
    const itemSchedules = (campaign.itemSchedules as Record<string, { scheduledDate?: string; publishedDate?: string }>) || {};
    
    // Get completed items
    const completedIndexes = Object.entries(itemStatuses)
      .filter(([_, status]) => status.status === 'completed')
      .map(([index]) => index);
    
    // Calculate schedule based on campaign settings
    const preferredHours = (campaign.preferredPublishHours as number[]) || [9, 12, 18];
    const maxPerDay = campaign.maxStoriesPerDay || 1;
    
    let currentDate = new Date(startDate || Date.now());
    let itemsScheduledToday = 0;
    let hourIndex = 0;
    
    for (const index of completedIndexes) {
      if (!itemSchedules[index]?.scheduledDate) {
        // Set scheduled time
        const scheduledDate = new Date(currentDate);
        scheduledDate.setHours(preferredHours[hourIndex % preferredHours.length], 0, 0, 0);
        
        itemSchedules[index] = {
          ...itemSchedules[index],
          scheduledDate: scheduledDate.toISOString(),
        };
        
        itemsScheduledToday++;
        hourIndex++;
        
        // Move to next day if max reached
        if (itemsScheduledToday >= maxPerDay) {
          currentDate.setDate(currentDate.getDate() + 1);
          itemsScheduledToday = 0;
          hourIndex = 0;
        }
      }
    }
    
    await storage.updateStoryCampaign(id, { itemSchedules });
    
    res.json({ success: true, count: completedIndexes.length });
  } catch (error) {
    console.error('[auto-story] Error scheduling all:', error);
    res.status(500).json({ error: 'Failed to schedule all' });
  }
});

// ═══════════ TEMPLATES ═══════════

// Get all templates
router.get('/templates', async (_req, res) => {
  try {
    const templates = Object.values(TEMPLATE_STRUCTURES);
    res.json(templates);
  } catch (error) {
    console.error('[auto-story] Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

export const autoStoryRoutes = router;
