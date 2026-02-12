/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VIDEO MANAGEMENT ROUTES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Endpoints for managing videos within a campaign:
 * - Get all videos for a campaign
 * - Update video status (approve/reject)
 * - Bulk actions (approve all, regenerate failed)
 */

import { Router } from 'express';
import { storage } from '../../../storage';
import { getVideoCampaign, updateVideoCampaign } from '../../shared/services/campaign-manager';
import type { ItemStatusEntry, VideoIdea } from '../../shared/types';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// GET VIDEOS FOR CAMPAIGN
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/autoproduction/video/:id/videos
 * Get all videos associated with a campaign
 * 
 * Returns array of video objects with their statuses
 */
router.get('/:id/videos', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`[videos:routes] Getting videos for campaign: ${id}`);

    // Get campaign
    const campaign = await getVideoCampaign(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get video IDs from campaign
    const videoIds = campaign.generatedVideoIds || [];
    
    if (videoIds.length === 0) {
      return res.json([]);
    }

    // Fetch all videos
    const videos = await storage.getVideosByIds(videoIds);

    // Enrich with campaign context
    const videoIdeas = (campaign.videoIdeas as VideoIdea[]) || [];
    const itemStatuses = (campaign.itemStatuses as Record<string, ItemStatusEntry>) || {};

    const enrichedVideos = videos.map((video, idx) => ({
      id: video.id,
      sourceIdea: videoIdeas.find((_, i) => itemStatuses[i]?.videoId === video.id)?.idea || video.title || '',
      title: video.title,
      status: video.status,
      orderIndex: idx,
      previewUrl: video.thumbnailUrl || undefined,
      generationProgress: undefined, // Not tracked at video level
    }));

    res.json(enrichedVideos);

  } catch (error: any) {
    console.error('[videos:routes] Error getting videos:', error);
    res.status(500).json({ error: error.message || 'Failed to get videos' });
  }
});

// ═══════════════════════════════════════════════════════════════
// UPDATE VIDEO STATUS
// ═══════════════════════════════════════════════════════════════

/**
 * PATCH /api/autoproduction/video/:id/videos/:videoId
 * Update a video's status (approve/reject)
 */
router.patch('/:id/videos/:videoId', async (req, res) => {
  try {
    const { id, videoId } = req.params;
    const { status } = req.body;

    console.log(`[videos:routes] Updating video ${videoId} status to: ${status}`);

    // Validate campaign exists
    const campaign = await getVideoCampaign(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Update video status
    await storage.updateVideo(videoId, { status });

    // Update campaign itemStatuses
    const itemStatuses = (campaign.itemStatuses as Record<string, ItemStatusEntry>) || {};
    const itemIndex = Object.keys(itemStatuses).find(key => itemStatuses[key].videoId === videoId);
    
    if (itemIndex) {
      itemStatuses[itemIndex].status = status === 'approved' ? 'completed' : status;
      await updateVideoCampaign(id, { itemStatuses });
    }

    res.json({ success: true, videoId, status });

  } catch (error: any) {
    console.error('[videos:routes] Error updating video:', error);
    res.status(500).json({ error: error.message || 'Failed to update video' });
  }
});

// ═══════════════════════════════════════════════════════════════
// APPROVE ALL
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/autoproduction/video/:id/approve-all
 * Approve all completed videos in the campaign
 */
router.post('/:id/approve-all', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`[videos:routes] Approving all videos for campaign: ${id}`);

    // Get campaign
    const campaign = await getVideoCampaign(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get all completed video IDs
    const itemStatuses = (campaign.itemStatuses as Record<string, ItemStatusEntry>) || {};
    const completedVideoIds = Object.values(itemStatuses)
      .filter(item => item.status === 'completed' && item.videoId)
      .map(item => item.videoId!);

    // Update all completed videos to approved status
    await Promise.all(
      completedVideoIds.map(videoId => 
        storage.updateVideo(videoId, { status: 'approved' })
      )
    );

    // Update campaign status to completed
    await updateVideoCampaign(id, { 
      status: 'completed',
    });

    res.json({ 
      success: true, 
      approvedCount: completedVideoIds.length,
    });

  } catch (error: any) {
    console.error('[videos:routes] Error approving all:', error);
    res.status(500).json({ error: error.message || 'Failed to approve all videos' });
  }
});

// ═══════════════════════════════════════════════════════════════
// REGENERATE FAILED
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/autoproduction/video/:id/regenerate-failed
 * Regenerate all failed videos in the campaign
 */
router.post('/:id/regenerate-failed', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`[videos:routes] Regenerating failed videos for campaign: ${id}`);

    // Get campaign
    const campaign = await getVideoCampaign(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get all failed items
    const itemStatuses = (campaign.itemStatuses as Record<string, ItemStatusEntry>) || {};
    const failedIndices = Object.keys(itemStatuses)
      .filter(key => itemStatuses[key].status === 'failed')
      .map(key => parseInt(key));

    if (failedIndices.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No failed videos to regenerate',
        retriedCount: 0,
      });
    }

    // Reset failed items to pending
    for (const index of failedIndices) {
      itemStatuses[index.toString()] = {
        status: 'pending',
        videoId: undefined,
        error: undefined,
      };
    }

    // Update campaign and restart generation
    await updateVideoCampaign(id, { 
      itemStatuses,
      status: 'draft', // Reset to draft so it can be regenerated
    });

    res.json({ 
      success: true, 
      retriedCount: failedIndices.length,
      message: `Reset ${failedIndices.length} failed videos. Click "Start Generation" to retry.`,
    });

  } catch (error: any) {
    console.error('[videos:routes] Error regenerating failed:', error);
    res.status(500).json({ error: error.message || 'Failed to regenerate failed videos' });
  }
});

// ═══════════════════════════════════════════════════════════════
// CANCEL GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/autoproduction/video/:id/cancel-batch
 * Cancel ongoing batch generation
 * 
 * Note: This is a soft cancel - current item will complete but no new items will start
 */
router.post('/:id/cancel-batch', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`[videos:routes] Cancelling generation for campaign: ${id}`);

    // Get campaign
    const campaign = await getVideoCampaign(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'generating') {
      return res.status(400).json({ 
        error: `Campaign is not generating (current status: ${campaign.status})`,
      });
    }

    // Update campaign status to paused
    await updateVideoCampaign(id, { status: 'paused' });

    res.json({ 
      success: true, 
      message: 'Generation cancelled. Current item will complete.',
    });

  } catch (error: any) {
    console.error('[videos:routes] Error cancelling generation:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel generation' });
  }
});

export default router;
