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
import { storage } from '../../../storage';
import { bunnyStorage } from '../../../storage/bunny-storage';
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
    
    const body = req.body;
    
    // Map wizard field names to DB schema columns
    // The wizard sends flat fields; we need to split them into:
    //   - Top-level DB columns (name, template, storyTopics, etc.)
    //   - campaignSettings JSONB (all the detailed settings)
    
    // Transform storyTopics: string[] → [{topic, index}][]
    const rawTopics = body.storyTopics || [];
    const storyTopics = Array.isArray(rawTopics) 
      ? rawTopics.map((t: any, i: number) => 
          typeof t === 'string' ? { topic: t, index: i } : t
        )
      : [];
    
    // Extract template from wizard's 'storyTemplate' field
    const template = body.storyTemplate || body.template || 'problem-solution';
    
    // Pack all detailed settings into campaignSettings JSONB
    const campaignSettings: Record<string, any> = {};
    const settingsKeys = [
      'storyTemplateType', 'storyDuration', 'storyAspectRatio', 'storyLanguage',
      'storyPacing', 'storyTextOverlayEnabled', 'storyTextOverlayStyle',
      'imageStyle', 'storyImageModel', 'storyVideoModel', 'storyMediaType',
      'storyTransition', 'storyImageResolution', 'storyVideoResolution',
      'storyStyleReferenceUrl', 'storyCharacterReferenceUrl',
      'storyHasVoiceover', 'storyVoiceId', 'storyVoiceVolume',
      'storyBackgroundMusicTrack', 'storyMusicVolume',
      'storyAsmrCategory', 'storySoundIntensity', 'storyLoopMultiplier',
    ];
    for (const key of settingsKeys) {
      if (body[key] !== undefined) {
        campaignSettings[key] = body[key];
      }
    }
    
    console.log('[autoproduction] Campaign settings to store:', {
      storyHasVoiceover: campaignSettings.storyHasVoiceover,
      storyBackgroundMusicTrack: campaignSettings.storyBackgroundMusicTrack,
      storyVideoModel: campaignSettings.storyVideoModel,
      storyMediaType: campaignSettings.storyMediaType,
    });
    
    const campaignData = {
      userId,
      workspaceId: body.workspaceId,
      name: body.name,
      template,
      storyTopics,
      campaignSettings,
      automationMode: body.automationMode || 'manual',
      scheduleStartDate: body.scheduleStartDate || undefined,
      scheduleEndDate: body.scheduleEndDate || undefined,
      maxStoriesPerDay: body.maxStoriesPerDay || 1,
      selectedPlatforms: body.selectedPlatforms || [],
      itemSchedules: body.itemSchedules || {},
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

// Delete story campaign (deep delete: stories + Bunny CDN assets + campaign)
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

    // Deep cleanup: delete generated stories and their Bunny CDN assets
    const storyIds = campaign.generatedStoryIds || [];
    const cdnUrl = process.env.BUNNY_CDN_URL?.replace(/\/+$/, '') || '';
    
    for (const storyId of storyIds) {
      try {
        const story = await storage.getStory(storyId);
        if (!story) continue;
        
        // Delete video and thumbnail from Bunny CDN
        if (cdnUrl && bunnyStorage.isBunnyConfigured()) {
          const urlsToDelete = [story.videoUrl, story.thumbnailUrl].filter(Boolean) as string[];
          for (const url of urlsToDelete) {
            if (url.startsWith(cdnUrl)) {
              const storagePath = url.slice(cdnUrl.length + 1); // +1 for the '/'
              try {
                await bunnyStorage.deleteFile(storagePath);
                console.log(`[autoproduction] Deleted CDN asset: ${storagePath}`);
              } catch (cdnErr) {
                console.warn(`[autoproduction] Failed to delete CDN asset ${storagePath}:`, cdnErr);
              }
            }
          }
        }
        
        // Delete story record from DB
        await storage.deleteStory(storyId);
        console.log(`[autoproduction] Deleted story: ${storyId}`);
      } catch (storyErr) {
        console.warn(`[autoproduction] Failed to cleanup story ${storyId}:`, storyErr);
      }
    }
    
    // Delete the campaign record
    await deleteStoryCampaign(id);
    console.log(`[autoproduction] Deleted campaign ${id} with ${storyIds.length} stories`);
    
    res.json({ success: true, deletedStories: storyIds.length });
  } catch (error) {
    console.error('[autoproduction] Error deleting story campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

export const autoProductionSharedRoutes = router;
