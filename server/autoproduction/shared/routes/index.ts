/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUTOPRODUCTION SHARED ROUTES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Shared endpoints for both auto-video and auto-story campaigns.
 */

import { Router } from 'express';
import { isAuthenticated, getCurrentUserId } from '../../../auth';
import { createCampaign, getCampaign, updateCampaign, deleteCampaign, listCampaigns } from '../services';

const router = Router();

// ═══════════ CAMPAIGNS CRUD ═══════════

// List all campaigns for user
router.get('/campaigns', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { type, status } = req.query;
    const campaigns = await listCampaigns(userId, { type, status });
    
    res.json(campaigns);
  } catch (error) {
    console.error('[autoproduction] Error listing campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get single campaign
router.get('/campaigns/:id', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const campaign = await getCampaign(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Verify ownership
    if (campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(campaign);
  } catch (error) {
    console.error('[autoproduction] Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Create campaign
router.post('/campaigns', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const campaignData = {
      ...req.body,
      userId,
    };
    
    const campaign = await createCampaign(campaignData);
    
    res.json(campaign);
  } catch (error) {
    console.error('[autoproduction] Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Update campaign
router.patch('/campaigns/:id', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const campaign = await getCampaign(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updated = await updateCampaign(id, req.body);
    res.json(updated);
  } catch (error) {
    console.error('[autoproduction] Error updating campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Delete campaign
router.delete('/campaigns/:id', isAuthenticated, async (req: any, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const campaign = await getCampaign(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await deleteCampaign(id);
    res.json({ success: true });
  } catch (error) {
    console.error('[autoproduction] Error deleting campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

export const autoProductionSharedRoutes = router;
