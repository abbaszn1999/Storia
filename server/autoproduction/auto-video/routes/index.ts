/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUTO-VIDEO ROUTES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Main router for auto-video campaign generation endpoints.
 * Mounts all sub-routers for different functionality areas.
 * 
 * Note: Campaign CRUD is in autoproduction/shared/routes (shared with auto-story)
 */

import { Router } from 'express';
import generationRouter from './generation';
import videosRouter from './videos';

const router = Router();

// Mount generation routes
// POST /:id/generate - Start batch generation
// GET /:id/progress - Get generation progress
// POST /:id/retry/:itemIndex - Retry failed item
router.use('/', generationRouter);

// Mount video management routes
// GET /:id/videos - Get all videos for campaign
// PATCH /:id/videos/:videoId - Update video status
// POST /:id/approve-all - Approve all videos
// POST /:id/regenerate-failed - Regenerate failed videos
// POST /:id/cancel-batch - Cancel generation
router.use('/', videosRouter);

// Future: scheduling routes
// router.use('/', schedulingRouter);

// Future: publishing routes
// router.use('/', publishingRouter);

export const autoVideoRoutes = router;
