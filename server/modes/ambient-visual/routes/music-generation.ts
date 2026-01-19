/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AMBIENT VISUAL - MUSIC GENERATION ROUTES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * API endpoints for background music generation (Agent 5.4).
 * Generates AI background music using ElevenLabs Music API.
 */

import { Router, Request, Response } from 'express';
import { isAuthenticated, getCurrentUserId } from '../../../auth';
import { storage } from '../../../storage';
import { generateBackgroundMusic } from '../agents/background-music-generator';
import { calculateTotalDurationWithLoops } from '../agents';
import type {
  Step1Data,
  Step2Data,
  Step3Data,
  Step5Data,
  BackgroundMusicGeneratorInput,
} from '../types';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATE BACKGROUND MUSIC
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/ambient-visual/videos/:id/music/generate
 * Generate AI background music using ElevenLabs Music API
 * 
 * Prerequisites:
 * - step1Data.backgroundMusicEnabled === true
 * - step2Data.hasCustomMusic === false (no custom music uploaded)
 * - step2Data.musicStyle must be set
 * 
 * Saves result to step5Data.generatedMusicUrl
 */
router.post('/videos/:id/music/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId } = req.params;

    // Get video data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = video.step1Data as Step1Data;
    const step2Data = video.step2Data as Step2Data;
    const step3Data = video.step3Data as Step3Data;
    const step5Data = (video.step5Data as Step5Data) || {};

    // Validate prerequisites
    if (!step1Data?.backgroundMusicEnabled) {
      return res.status(400).json({ 
        error: 'Background music is not enabled for this video',
        details: 'Enable background music in the Atmosphere phase first'
      });
    }

    if (step2Data?.hasCustomMusic) {
      return res.status(400).json({ 
        error: 'Custom music already uploaded',
        details: 'You have already uploaded custom music. Delete it first to generate AI music.'
      });
    }

    const musicStyle = step2Data?.musicStyle;
    if (!musicStyle) {
      return res.status(400).json({ 
        error: 'Music style not selected',
        details: 'Select a music style in the Visual World phase first'
      });
    }

    // Get workspace info
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const currentWorkspace = workspaces.find(w => w.id === video.workspaceId) || workspaces[0];
    const workspaceName = currentWorkspace?.name || 'default';

    // Calculate total duration (with loops)
    const scenesSource = step5Data?.scenesWithLoops || step3Data?.scenes;
    const shotsSource = step5Data?.shotsWithLoops || step3Data?.shots;
    
    let totalDuration = 60; // Default fallback
    if (scenesSource && shotsSource) {
      // Convert null loopCounts to undefined for type compatibility
      const scenesForCalc = scenesSource.map(scene => ({
        id: scene.id,
        loopCount: scene.loopCount ?? undefined,
      }));
      
      const shotsForCalc: Record<string, Array<{ duration: number; loopCount?: number }>> = {};
      for (const [sceneId, sceneShots] of Object.entries(shotsSource)) {
        shotsForCalc[sceneId] = sceneShots.map(shot => ({
          duration: shot.duration,
          loopCount: shot.loopCount ?? undefined,
        }));
      }
      
      totalDuration = calculateTotalDurationWithLoops(scenesForCalc, shotsForCalc);
    }

    console.log('[music-generation:routes] Starting music generation:', {
      videoId,
      musicStyle,
      totalDuration,
      mood: step1Data.mood,
      theme: step1Data.theme,
    });

    // Build input for music generator
    const musicInput: BackgroundMusicGeneratorInput = {
      musicStyle,
      mood: step1Data.mood || 'calm',
      theme: step1Data.theme || 'nature',
      timeContext: step1Data.timeContext,
      season: step1Data.season,
      moodDescription: step1Data.moodDescription,
      totalDuration,
      scenes: scenesSource?.map((scene, idx) => ({
        sceneNumber: idx + 1,
        title: scene.title || `Scene ${idx + 1}`,
        description: scene.description,
      })),
      videoId,
      videoTitle: video.title || 'untitled',
      videoCreatedAt: video.createdAt,
      userId,
      workspaceId: video.workspaceId || currentWorkspace?.id || '',
      workspaceName,
    };

    // Generate music
    const result = await generateBackgroundMusic(musicInput);

    // Save to step5Data
    // IMPORTANT: Fetch fresh video data to avoid overwriting concurrent updates (e.g., voiceover generation)
    const freshVideo = await storage.getVideo(videoId);
    const freshStep5Data = (freshVideo?.step5Data as Step5Data) || {};
    
    console.log('[music-generation:routes] Updating music - preserving existing step5Data:', {
      hasVoiceoverAudioUrl: !!freshStep5Data.voiceoverAudioUrl,
      hasVoiceoverScript: !!freshStep5Data.voiceoverScript,
      hasScenesWithLoops: !!freshStep5Data.scenesWithLoops,
      hasShotsWithLoops: !!freshStep5Data.shotsWithLoops,
    });
    
    const updatedStep5Data: Step5Data = {
      ...freshStep5Data,  // Preserve all existing fields (voiceover, loops, etc.)
      generatedMusicUrl: result.musicUrl,
      generatedMusicDuration: result.duration,
      generatedMusicStyle: result.style,
    };

    await storage.updateVideo(videoId, {
      step5Data: updatedStep5Data,
    });

    console.log('[music-generation:routes] Music generation complete:', {
      videoId,
      musicUrl: result.musicUrl,
      duration: result.duration,
      cost: result.cost,
    });

    res.json({
      success: true,
      musicUrl: result.musicUrl,
      duration: result.duration,
      style: result.style,
      cost: result.cost,
    });

  } catch (error) {
    console.error('[music-generation:routes] Generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate background music',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE GENERATED MUSIC
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DELETE /api/ambient-visual/videos/:id/music/generated
 * Remove generated music from step5Data
 */
router.delete('/videos/:id/music/generated', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId } = req.params;

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step5Data = (video.step5Data as Step5Data) || {};

    // Clear generated music fields
    const updatedStep5Data: Step5Data = {
      ...step5Data,
      generatedMusicUrl: undefined,
      generatedMusicDuration: undefined,
      generatedMusicStyle: undefined,
    };

    await storage.updateVideo(videoId, {
      step5Data: updatedStep5Data,
    });

    console.log('[music-generation:routes] Generated music deleted:', { videoId });

    res.json({ success: true });

  } catch (error) {
    console.error('[music-generation:routes] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete generated music' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET MUSIC STATUS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/ambient-visual/videos/:id/music/status
 * Get current music status for a video
 * 
 * Returns:
 * - backgroundMusicEnabled: from step1Data
 * - hasCustomMusic: from step2Data
 * - customMusicUrl: from step2Data (if uploaded)
 * - hasGeneratedMusic: from step5Data
 * - generatedMusicUrl: from step5Data (if generated)
 * - musicStyle: from step2Data
 */
router.get('/videos/:id/music/status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId } = req.params;

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = video.step1Data as Step1Data;
    const step2Data = video.step2Data as Step2Data;
    const step5Data = video.step5Data as Step5Data;

    res.json({
      backgroundMusicEnabled: step1Data?.backgroundMusicEnabled ?? false,
      hasCustomMusic: step2Data?.hasCustomMusic ?? false,
      customMusicUrl: step2Data?.customMusicUrl || null,
      customMusicDuration: step2Data?.customMusicDuration || null,
      hasGeneratedMusic: !!step5Data?.generatedMusicUrl,
      generatedMusicUrl: step5Data?.generatedMusicUrl || null,
      generatedMusicDuration: step5Data?.generatedMusicDuration || null,
      generatedMusicStyle: step5Data?.generatedMusicStyle || null,
      musicStyle: step2Data?.musicStyle || null,
    });

  } catch (error) {
    console.error('[music-generation:routes] Status error:', error);
    res.status(500).json({ error: 'Failed to get music status' });
  }
});

export default router;

