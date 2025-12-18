import { Router } from 'express';
import type { Request, Response } from 'express';
import { storage } from '../../../storage';
import { AMBIENT_VISUAL_CONFIG } from '../config';
import type { CreateAmbientVideoRequest, Step1Data } from '../types';

const router = Router();

// POST /api/ambient-visual/videos - Create new ambient video
router.post('/videos', async (req: Request, res: Response) => {
  try {
    const { workspaceId, title, animationMode, videoGenerationMode } = 
      req.body as CreateAmbientVideoRequest;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }
    
    if (!animationMode) {
      return res.status(400).json({ error: 'animationMode is required' });
    }
    
    const step1Data: Step1Data = {
      animationMode,
      videoGenerationMode: videoGenerationMode || undefined,
    };
    
    const video = await storage.createVideo({
      workspaceId,
      title: title || AMBIENT_VISUAL_CONFIG.defaultTitle,
      mode: AMBIENT_VISUAL_CONFIG.mode,
      status: 'draft',
      currentStep: AMBIENT_VISUAL_CONFIG.initialStep,
      completedSteps: [],
      step1Data,
    });

    res.json(video);
  } catch (error) {
    console.error('Ambient video creation error:', error);
    res.status(500).json({ error: 'Failed to create ambient video' });
  }
});

// GET /api/ambient-visual/videos/:id - Get video by ID
router.get('/videos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const video = await storage.getVideo(id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    res.json(video);
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Failed to get video' });
  }
});

export default router;

