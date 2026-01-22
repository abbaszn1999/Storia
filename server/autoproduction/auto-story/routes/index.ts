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

// ═══════════ BATCH GENERATION ═══════════

// Start batch generation
router.post('/:id/generate-batch', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const campaign = await storage.getProductionCampaign(id);
    
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
    const campaign = await storage.getProductionCampaign(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const progress = getBatchProgress(id);
    
    // If no progress in memory, return default based on campaign
    if (!progress) {
      return res.json({
        campaignId: id,
        total: campaign.totalItems || 0,
        completed: campaign.itemsGenerated || 0,
        failed: 0,
        inProgress: 0,
        pending: (campaign.totalItems || 0) - (campaign.itemsGenerated || 0),
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
    const campaign = await storage.getProductionCampaign(id);
    
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
    const campaign = await storage.getProductionCampaign(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const stories = await storage.getCampaignItems(id);
    res.json(stories);
  } catch (error) {
    console.error('[auto-story] Error fetching stories:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// Get single story
router.get('/:id/stories/:itemId', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id, itemId } = req.params;
    const campaign = await storage.getProductionCampaign(id);
    
    if (!campaign || campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const story = await storage.getCampaignItem(itemId);
    
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    res.json(story);
  } catch (error) {
    console.error('[auto-story] Error fetching story:', error);
    res.status(500).json({ error: 'Failed to fetch story' });
  }
});

// Update story (approve/reject)
router.patch('/:id/stories/:itemId', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id, itemId } = req.params;
    const campaign = await storage.getProductionCampaign(id);
    
    if (!campaign || campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updated = await storage.updateCampaignItem(itemId, req.body);
    res.json(updated);
  } catch (error) {
    console.error('[auto-story] Error updating story:', error);
    res.status(500).json({ error: 'Failed to update story' });
  }
});

// ═══════════ BULK ACTIONS ═══════════

// Approve all stories
router.post('/:id/approve-all', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const campaign = await storage.getProductionCampaign(id);
    
    if (!campaign || campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const stories = await storage.getCampaignItems(id);
    
    // Update all completed stories to approved
    for (const story of stories) {
      if (story.status === 'completed') {
        await storage.updateCampaignItem(story.id, { status: 'approved' });
      }
    }
    
    res.json({ success: true, count: stories.length });
  } catch (error) {
    console.error('[auto-story] Error approving all:', error);
    res.status(500).json({ error: 'Failed to approve all' });
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
