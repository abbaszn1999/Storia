/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GENERATION ROUTES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Endpoints for managing video generation lifecycle:
 * - Start batch generation
 * - Get progress
 * - Retry failed videos
 */

import { Router } from 'express';
import { 
  processCampaignBatch, 
  getBatchProgress, 
  retryFailedItem 
} from '../services/batch-processor';
import { getVideoCampaign } from '../../shared/services/campaign-manager';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// START BATCH GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/autoproduction/video/:id/generate
 * Start batch generation for a campaign
 * 
 * Fires processCampaignBatch() async and returns immediately.
 * Client should poll GET /:id/progress to monitor status.
 */
router.post('/:id/generate', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`[generation:routes] Starting generation for campaign: ${id}`);

    // Validate campaign exists
    const campaign = await getVideoCampaign(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Validate campaign status
    if (campaign.status !== 'draft' && campaign.status !== 'paused') {
      return res.status(400).json({ 
        error: `Cannot start generation: campaign status is ${campaign.status}` 
      });
    }

    // Validate has video ideas
    const videoIdeas = (campaign.videoIdeas as any[]) || [];
    if (videoIdeas.length === 0) {
      return res.status(400).json({ error: 'No video ideas in campaign' });
    }

    // Fire batch processor async (don't await)
    processCampaignBatch(id).catch(error => {
      console.error(`[generation:routes] Batch processing error for ${id}:`, error);
    });

    // Return immediately
    res.json({
      success: true,
      started: true,
      campaignId: id,
      message: `Started generation for ${videoIdeas.length} videos`,
    });

  } catch (error: any) {
    console.error('[generation:routes] Error starting generation:', error);
    res.status(500).json({ error: error.message || 'Failed to start generation' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET PROGRESS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/autoproduction/video/:id/progress
 * Get current generation progress for a campaign
 * 
 * Returns progress stats and per-item status
 */
router.get('/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;

    // Note: No logging here to avoid cluttering logs during frequent polling
    const progress = await getBatchProgress(id);

    res.json({
      success: true,
      progress,
    });

  } catch (error: any) {
    console.error('[generation:routes] Error getting progress:', error);
    
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
 * POST /api/autoproduction/video/:id/retry/:itemIndex
 * Retry generation for a specific failed video
 * 
 * Fires retryFailedItem() async and returns immediately.
 * Client should poll GET /:id/progress to monitor retry status.
 */
router.post('/:id/retry/:itemIndex', async (req, res) => {
  try {
    const { id, itemIndex } = req.params;
    const index = parseInt(itemIndex);

    if (isNaN(index)) {
      return res.status(400).json({ error: 'Invalid item index' });
    }

    console.log(`[generation:routes] Retrying item ${index} in campaign ${id}`);

    // Validate campaign exists
    const campaign = await getVideoCampaign(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
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
      console.error(`[generation:routes] Retry error for ${id}/${index}:`, error);
    });

    // Return immediately
    res.json({
      success: true,
      retrying: true,
      campaignId: id,
      itemIndex: index,
      message: `Retrying video ${index}`,
    });

  } catch (error: any) {
    console.error('[generation:routes] Error retrying item:', error);
    res.status(500).json({ error: error.message || 'Failed to retry item' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PAUSE/RESUME (Future)
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/autoproduction/video/:id/pause
 * Pause an ongoing batch generation
 * 
 * TODO: Implement pause mechanism
 */
router.post('/:id/pause', async (req, res) => {
  res.status(501).json({ error: 'Pause not yet implemented' });
});

/**
 * POST /api/autoproduction/video/:id/resume
 * Resume a paused batch generation
 * 
 * TODO: Use processCampaignBatch with 'paused' status validation
 */
router.post('/:id/resume', async (req, res) => {
  res.status(501).json({ error: 'Resume not yet implemented' });
});

export default router;
