// Calendar Routes
// ═══════════════════════════════════════════════════════════════════════════
// API endpoints for the content calendar
// All calendar data comes from Late.dev - we enrich it with Storia content data

import { Router, Request, Response } from 'express';
import { calendarService } from '../services/calendar-service';
import type { CalendarQueryParams, SchedulePostInput, ReschedulePostInput } from '../types';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/calendar/:workspaceId
// List calendar posts for a workspace
// ─────────────────────────────────────────────────────────────────────────────

router.get('/:workspaceId', async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    
    // Parse query parameters
    const params: CalendarQueryParams = {
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      status: req.query.status as any,
      platform: req.query.platform as any,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };
    
    console.log(`[CalendarRoutes] GET /calendar/${workspaceId}`, params);
    
    const response = await calendarService.getCalendarPosts(workspaceId, params);
    
    res.json(response);
  } catch (error: any) {
    console.error('[CalendarRoutes] Error listing posts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch calendar posts',
      message: error.message 
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/calendar/:workspaceId/:postId
// Get a single calendar post
// ─────────────────────────────────────────────────────────────────────────────

router.get('/:workspaceId/:postId', async (req: Request, res: Response) => {
  try {
    const { workspaceId, postId } = req.params;
    
    console.log(`[CalendarRoutes] GET /calendar/${workspaceId}/${postId}`);
    
    const post = await calendarService.getPost(workspaceId, postId);
    
    res.json({ post });
  } catch (error: any) {
    console.error('[CalendarRoutes] Error getting post:', error);
    res.status(500).json({ 
      error: 'Failed to fetch calendar post',
      message: error.message 
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/calendar/:workspaceId/schedule
// Schedule a video/story for publishing
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:workspaceId/schedule', async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const input: SchedulePostInput = req.body;
    
    console.log(`[CalendarRoutes] POST /calendar/${workspaceId}/schedule`);
    console.log(`[CalendarRoutes] Scheduling ${input.contentType} for ${input.scheduledFor}`);
    
    // Validate required fields
    if (!input.videoUrl) {
      return res.status(400).json({ error: 'videoUrl is required' });
    }
    if (!input.contentType) {
      return res.status(400).json({ error: 'contentType is required' });
    }
    if (!input.contentMode) {
      return res.status(400).json({ error: 'contentMode is required' });
    }
    if (!input.scheduledFor) {
      return res.status(400).json({ error: 'scheduledFor is required' });
    }
    if (!input.platforms || input.platforms.length === 0) {
      return res.status(400).json({ error: 'At least one platform is required' });
    }
    
    const result = await calendarService.schedulePost(workspaceId, input);
    
    res.status(201).json(result);
  } catch (error: any) {
    console.error('[CalendarRoutes] Error scheduling post:', error);
    res.status(500).json({ 
      error: 'Failed to schedule post',
      message: error.message 
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/calendar/:workspaceId/:postId
// Reschedule a post
// ─────────────────────────────────────────────────────────────────────────────

router.put('/:workspaceId/:postId', async (req: Request, res: Response) => {
  try {
    const { workspaceId, postId } = req.params;
    const input: ReschedulePostInput = req.body;
    
    console.log(`[CalendarRoutes] PUT /calendar/${workspaceId}/${postId}`);
    console.log(`[CalendarRoutes] Rescheduling to ${input.scheduledFor}`);
    
    if (!input.scheduledFor) {
      return res.status(400).json({ error: 'scheduledFor is required' });
    }
    
    const result = await calendarService.reschedulePost(workspaceId, postId, input);
    
    res.json(result);
  } catch (error: any) {
    console.error('[CalendarRoutes] Error rescheduling post:', error);
    res.status(500).json({ 
      error: 'Failed to reschedule post',
      message: error.message 
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/calendar/:workspaceId/:postId
// Cancel (delete) a scheduled post
// ─────────────────────────────────────────────────────────────────────────────

router.delete('/:workspaceId/:postId', async (req: Request, res: Response) => {
  try {
    const { workspaceId, postId } = req.params;
    
    console.log(`[CalendarRoutes] DELETE /calendar/${workspaceId}/${postId}`);
    
    await calendarService.cancelPost(workspaceId, postId);
    
    res.json({ success: true, message: 'Post canceled successfully' });
  } catch (error: any) {
    console.error('[CalendarRoutes] Error canceling post:', error);
    res.status(500).json({ 
      error: 'Failed to cancel post',
      message: error.message 
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/calendar/:workspaceId/:postId/retry
// Retry a failed post
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:workspaceId/:postId/retry', async (req: Request, res: Response) => {
  try {
    const { workspaceId, postId } = req.params;
    
    console.log(`[CalendarRoutes] POST /calendar/${workspaceId}/${postId}/retry`);
    
    const post = await calendarService.retryPost(workspaceId, postId);
    
    res.json({ post, message: 'Retry initiated successfully' });
  } catch (error: any) {
    console.error('[CalendarRoutes] Error retrying post:', error);
    res.status(500).json({ 
      error: 'Failed to retry post',
      message: error.message 
    });
  }
});

export default router;
