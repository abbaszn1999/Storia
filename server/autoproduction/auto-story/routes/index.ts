/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUTO STORY ROUTES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * API endpoints for Auto Story functionality.
 */

import { Router } from 'express';
import { isAuthenticated, getCurrentUserId } from '../../../auth';
import { storage } from '../../../storage';
import { startBatchGeneration, getBatchProgress, cancelBatchGeneration } from '../services/batch-processor';
import { TEMPLATE_STRUCTURES } from '../templates/template-structures';

const router = Router();

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

// ═══════════ BATCH GENERATION ═══════════

// Start batch generation
router.post('/:id/generate-batch', isAuthenticated, async (req: any, res) => {
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
    
    const result = await startBatchGeneration(id);
    res.json(result);
  } catch (error: any) {
    console.error('[auto-story] Error starting batch generation:', error);
    res.status(500).json({ error: error.message || 'Failed to start generation' });
  }
});

// Get batch progress
router.get('/:id/batch-progress', isAuthenticated, async (req: any, res) => {
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
    
    const progress = getBatchProgress(id);
    
    // If no progress in memory, calculate from campaign itemStatuses
    if (!progress) {
      const itemStatuses = (campaign.itemStatuses as Record<string, ItemStatus>) || {};
      const statuses = Object.values(itemStatuses);
      const total = statuses.length;
      
      return res.json({
        campaignId: id,
        total,
        completed: statuses.filter(s => s.status === 'completed').length,
        failed: statuses.filter(s => s.status === 'failed').length,
        inProgress: statuses.filter(s => s.status === 'generating').length,
        pending: statuses.filter(s => s.status === 'pending').length,
      });
    }
    
    res.json(progress);
  } catch (error) {
    console.error('[auto-story] Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Cancel batch generation
router.post('/:id/cancel-batch', isAuthenticated, async (req: any, res) => {
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
    
    await cancelBatchGeneration(id);
    res.json({ success: true });
  } catch (error) {
    console.error('[auto-story] Error cancelling batch:', error);
    res.status(500).json({ error: 'Failed to cancel generation' });
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
    const itemStatuses = (campaign.itemStatuses as Record<string, ItemStatus>) || {};
    const storyTopics = (campaign.storyTopics as StoryTopic[]) || [];
    
    // Build response with both generated stories and pending items info
    const response = storyTopics.map((topicData, index) => {
      const status = itemStatuses[String(topicData.index)] || { status: 'pending' };
      const generatedStory = status.storyId 
        ? stories.find(s => s?.id === status.storyId) || null
        : null;
      
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
    
    const itemStatuses = (campaign.itemStatuses as Record<string, ItemStatus>) || {};
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
    
    const itemStatuses = (campaign.itemStatuses as Record<string, ItemStatus>) || {};
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
