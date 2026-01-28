/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUTOPRODUCTION SHARED ROUTES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Shared endpoints for both auto-video and auto-story campaigns.
 * Provides separate routes for video campaigns and story campaigns.
 */

import { Router } from 'express';
import { isAuthenticated, getCurrentUserId } from '../../../auth';
import { 
  createVideoCampaign, 
  getVideoCampaign, 
  updateVideoCampaign, 
  deleteVideoCampaign, 
  listVideoCampaignsByUser,
  createStoryCampaign,
  getStoryCampaign,
  updateStoryCampaign,
  deleteStoryCampaign,
  listStoryCampaignsByUser,
} from '../services';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// VIDEO CAMPAIGNS
// ═══════════════════════════════════════════════════════════════

// List all video campaigns for user
router.get('/video-campaigns', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { status } = req.query;
    const campaigns = await listVideoCampaignsByUser(userId, { status });
    
    res.json(campaigns);
  } catch (error) {
    console.error('[autoproduction] Error listing video campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch video campaigns' });
  }
});

// Get single video campaign
router.get('/video-campaigns/:id', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const campaign = await getVideoCampaign(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Verify ownership
    if (campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(campaign);
  } catch (error) {
    console.error('[autoproduction] Error fetching video campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Create video campaign
router.post('/video-campaigns', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const campaignData = {
      ...req.body,
      userId,
    };
    
    const campaign = await createVideoCampaign(campaignData);
    
    res.json(campaign);
  } catch (error) {
    console.error('[autoproduction] Error creating video campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Update video campaign
router.patch('/video-campaigns/:id', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const campaign = await getVideoCampaign(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updated = await updateVideoCampaign(id, req.body);
    res.json(updated);
  } catch (error) {
    console.error('[autoproduction] Error updating video campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Delete video campaign
router.delete('/video-campaigns/:id', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const campaign = await getVideoCampaign(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await deleteVideoCampaign(id);
    res.json({ success: true });
  } catch (error) {
    console.error('[autoproduction] Error deleting video campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// ═══════════════════════════════════════════════════════════════
// STORY CAMPAIGNS
// ═══════════════════════════════════════════════════════════════

// List all story campaigns for user
router.get('/story-campaigns', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { status } = req.query;
    const campaigns = await listStoryCampaignsByUser(userId, { status });
    
    res.json(campaigns);
  } catch (error) {
    console.error('[autoproduction] Error listing story campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch story campaigns' });
  }
});

// Get single story campaign
router.get('/story-campaigns/:id', isAuthenticated, async (req: any, res) => {
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
    
    // Verify ownership
    if (campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(campaign);
  } catch (error) {
    console.error('[autoproduction] Error fetching story campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Create story campaign
router.post('/story-campaigns', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const campaignData = {
      ...req.body,
      userId,
    };
    
    const campaign = await createStoryCampaign(campaignData);
    
    res.json(campaign);
  } catch (error) {
    console.error('[autoproduction] Error creating story campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Update story campaign
router.patch('/story-campaigns/:id', isAuthenticated, async (req: any, res) => {
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
    
    const updated = await updateStoryCampaign(id, req.body);
    res.json(updated);
  } catch (error) {
    console.error('[autoproduction] Error updating story campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Delete story campaign
router.delete('/story-campaigns/:id', isAuthenticated, async (req: any, res) => {
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
    
    await deleteStoryCampaign(id);
    res.json({ success: true });
  } catch (error) {
    console.error('[autoproduction] Error deleting story campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

export const autoProductionSharedRoutes = router;
