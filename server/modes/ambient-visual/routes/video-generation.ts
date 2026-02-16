/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VIDEO GENERATION ROUTES - Agent 4.3 Single Shot & Batch
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Handles video clip generation from keyframe images using Runware I2V.
 * Separated from main routes for better organization.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { storage } from '../../../storage';
import { isAuthenticated, getCurrentUserId } from '../../../auth';
import type { 
  Step1Data,
  Step3Data,
  Step4Data,
} from '../types';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE SHOT VIDEO GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/ambient-visual/videos/:id/shots/:shotId/generate-video
 * Generate a video clip for a specific shot (Agent 4.3 - Single Shot)
 * 
 * Requires:
 * - Start frame must exist (startFrameUrl)
 * - For Start-End Frame mode: End frame must also exist (endFrameUrl)
 * - Video prompt must exist (from Agent 4.1)
 */
router.post('/videos/:id/shots/:shotId/generate-video', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId, shotId } = req.params;

    console.log('[ambient-visual:routes] Single shot video generation:', { videoId, shotId });

    // 1. Fetch video with all step data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = video.step1Data as Step1Data;
    const step3Data = video.step3Data as Step3Data;
    const step4Data = video.step4Data as Step4Data;

    if (!step1Data) {
      return res.status(400).json({ error: 'No atmosphere data found. Complete Phase 1 first.' });
    }

    // Skip video generation for image-transitions mode
    const isImageTransitionsMode = step1Data.animationMode === 'image-transitions';
    if (isImageTransitionsMode) {
      return res.json({
        message: 'Image-transitions mode: Videos will be created by Shotstack during final render with motion effects applied.',
        skipped: true,
        reason: 'image-transitions-mode',
      });
    }

    if (!step4Data?.shotVersions?.[shotId]) {
      return res.status(400).json({ error: 'No version data found for this shot. Generate prompts and images first.' });
    }

    // 2. Find the shot and its scene
    const step4Shots = step4Data.shots || step3Data?.shots || {};
    const step4Scenes = step4Data.scenes || step3Data?.scenes || [];
    
    let shot: any = null;
    let scene: any = null;
    let sceneId: string = '';
    
    for (const [sId, sceneShots] of Object.entries(step4Shots)) {
      const foundShot = sceneShots.find((s: any) => s.id === shotId);
      if (foundShot) {
        shot = foundShot;
        sceneId = sId;
        scene = step4Scenes.find(s => s.id === sId);
        break;
      }
    }

    if (!shot) {
      return res.status(404).json({ error: 'Shot not found' });
    }

    // 3. Get the latest version for this shot
    const versions = step4Data.shotVersions[shotId];
    if (!versions || versions.length === 0) {
      return res.status(400).json({ error: 'No version found for this shot' });
    }
    
    const latestVersion = versions[versions.length - 1];

    // 4. Validate frames exist
    if (!latestVersion.startFrameUrl) {
      return res.status(400).json({ error: 'Start frame not generated. Generate images first.' });
    }

    // 5. Check if this is Start-End Frame mode and validate end frame
    const isStartEndFrame = step1Data.videoGenerationMode === 'start-end-frame';
    const isImageReference = step1Data.videoGenerationMode === 'image-reference';
    
    // Only require end frame for start-end-frame mode, not for image-reference mode
    if (isStartEndFrame && !latestVersion.endFrameUrl) {
      return res.status(400).json({ error: 'End frame not generated. Generate end frame first.' });
    }
    
    // Image-reference mode doesn't need end frame
    if (isImageReference && latestVersion.endFrameUrl) {
      console.warn(`[ambient-visual:routes] Shot ${shotId} in image-reference mode has endFrameUrl, which should not exist`);
    }

    // 6. Get video prompt
    if (!latestVersion.videoPrompt) {
      return res.status(400).json({ error: 'No video prompt found. Generate prompts first.' });
    }

    // 7. Get video model (prioritize shot > scene > step1)
    const videoModel = shot.videoModel || scene?.videoModel || step1Data.videoModel;
    if (!videoModel) {
      return res.status(400).json({ error: 'No video model configured' });
    }

    // 8. Import and call Agent 4.3
    const { generateVideoClip } = await import('../agents/video-clip-generator');
    const { supportsStartEndFrame } = await import('../utils/video-model-helpers');

    // Check if model supports start-end frame mode
    const modelSupportsEndFrame = supportsStartEndFrame(videoModel);
    // Only use end frame for start-end-frame mode (not for image-reference mode)
    const useEndFrame = isStartEndFrame && modelSupportsEndFrame && !!latestVersion.endFrameUrl;

    console.log('[ambient-visual:routes] Video generation config:', {
      shotId,
      videoModel,
      videoGenerationMode: step1Data.videoGenerationMode,
      isStartEndFrame,
      isImageReference,
      modelSupportsEndFrame,
      useEndFrame,
      hasStartFrame: !!latestVersion.startFrameUrl,
      hasEndFrame: !!latestVersion.endFrameUrl,
      duration: shot.duration,
    });

    // Get shot number for logging
    const allShots = Object.values(step4Shots).flat();
    const shotIndex = allShots.findIndex((s: any) => s.id === shotId);

    const result = await generateVideoClip(
      {
        shotId,
        shotNumber: shotIndex + 1,
        versionId: latestVersion.id,
        startFrameUrl: latestVersion.startFrameUrl,
        endFrameUrl: useEndFrame && latestVersion.endFrameUrl ? latestVersion.endFrameUrl : undefined,
        videoPrompt: latestVersion.videoPrompt,
        videoModel,
        aspectRatio: step1Data.aspectRatio,
        videoResolution: step1Data.videoResolution,
        duration: shot.duration || 5,
        cameraFixed: shot.cameraMovement === 'static',
        generateAudio: false, // Could be configurable
      },
      userId,
      video.workspaceId || undefined,
      'video',
      'ambient'
    );

    if (result.error) {
      console.error('[ambient-visual:routes] Video generation failed:', result.error);
      return res.status(500).json({
        error: 'Video generation failed',
        details: result.error,
      });
    }

    // 9. Update the shot version with video URL
    const updatedVersion = {
      ...latestVersion,
      videoUrl: result.videoUrl,
      videoDuration: result.actualDuration,
      status: 'completed',
    };

    const updatedShotVersions = {
      ...step4Data.shotVersions,
      [shotId]: versions.map((v: any) => 
        v.id === latestVersion.id ? updatedVersion : v
      )
    };

    const updatedStep4Data: Step4Data = {
      ...step4Data,
      shotVersions: updatedShotVersions,
    };

    await storage.updateVideo(videoId, { step4Data: updatedStep4Data });

    console.log('[ambient-visual:routes] Video generated successfully:', {
      shotId,
      videoUrl: result.videoUrl?.substring(0, 50) + '...',
      duration: result.actualDuration,
      cost: result.cost,
    });

    res.json({
      success: true,
      shotId,
      videoUrl: result.videoUrl,
      actualDuration: result.actualDuration,
      cost: result.cost,
      shotVersion: updatedVersion,
    });

  } catch (error) {
    console.error('[ambient-visual:routes] Generate video error:', error);
    res.status(500).json({ 
      error: 'Failed to generate video',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH VIDEO GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/ambient-visual/videos/:id/generate-all-videos
 * Generate video clips for all shots that have completed frames (Agent 4.3 - Batch)
 * 
 * This processes shots sequentially since video generation is slow (30-180 seconds per shot).
 * Only processes shots that have:
 * - Start frame generated (startFrameUrl)
 * - For Start-End Frame mode: End frame also generated (endFrameUrl)
 * - Video prompt available (from Agent 4.1)
 */
router.post('/videos/:id/generate-all-videos', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const videoId = req.params.id;

    console.log('[ambient-visual:routes] Batch video generation starting:', { videoId });

    // 1. Fetch video with all step data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = video.step1Data as Step1Data;
    const step3Data = video.step3Data as Step3Data;
    const step4Data = video.step4Data as Step4Data;

    if (!step1Data) {
      return res.status(400).json({ error: 'No atmosphere data found. Complete Phase 1 first.' });
    }

    if (!step4Data?.shotVersions) {
      return res.status(400).json({ error: 'No shot versions found. Generate prompts and images first.' });
    }

    // 2. Get all shots
    const step4Shots = step4Data.shots || step3Data?.shots || {};
    const step4Scenes = step4Data.scenes || step3Data?.scenes || [];

    // Determine if we're in Start-End Frame mode (only check videoGenerationMode, not animationMode)
    const isStartEndMode = step1Data.videoGenerationMode === 'start-end-frame';
    const isImageReferenceMode = step1Data.videoGenerationMode === 'image-reference';
    const isImageTransitionsMode = step1Data.animationMode === 'image-transitions';

    // Skip video generation for image-transitions mode
    if (isImageTransitionsMode) {
      return res.json({
        message: 'Image-transitions mode: Videos will be created by Shotstack during final render. No intermediate videos needed.',
        skipped: true,
        totalShots: 0,
        shotsProcessed: 0,
        reason: 'image-transitions-mode',
      });
    }

    // 3. Filter shots that are ready for video generation
    const shotsToProcess: Array<{
      shotId: string;
      shotNumber: number;
      shot: any;
      scene: any;
      version: any;
    }> = [];

    // Track statistics for logging
    let totalShots = 0;
    let shotsWithVideo = 0;
    let shotsWithoutVideo = 0;
    let shotsMissingFrames = 0;
    let shotsMissingPrompt = 0;

    let shotNumber = 0;
    for (const [sceneId, sceneShots] of Object.entries(step4Shots)) {
      const scene = step4Scenes.find(s => s.id === sceneId);
      
      for (const shot of sceneShots as any[]) {
        shotNumber++;
        totalShots++;
        const versions = step4Data.shotVersions[shot.id];
        
        if (!versions || versions.length === 0) {
          console.log(`[ambient-visual:routes] Shot ${shotNumber} (${shot.id}): No versions, skipping`);
          continue;
        }

        const latestVersion = versions[versions.length - 1];

        // Check if shot already has a video (robust check for string, null, undefined, empty string)
        const hasVideo = latestVersion.videoUrl && 
                        typeof latestVersion.videoUrl === 'string' && 
                        latestVersion.videoUrl.trim().length > 0;
        
        if (hasVideo) {
          shotsWithVideo++;
          const videoUrlPreview = typeof latestVersion.videoUrl === 'string' 
            ? latestVersion.videoUrl.substring(0, 50) + '...'
            : String(latestVersion.videoUrl);
          console.log(`[ambient-visual:routes] Shot ${shotNumber} (${shot.id}): Already has video (${videoUrlPreview}), skipping`);
          continue;
        }
        
        shotsWithoutVideo++;
        console.log(`[ambient-visual:routes] Shot ${shotNumber} (${shot.id}): No video found (videoUrl: ${latestVersion.videoUrl}), checking requirements...`);

        // Check for required frames based on mode
        if (isImageTransitionsMode) {
          // Image transitions mode: needs imageUrl
          if (!latestVersion.imageUrl) {
            shotsMissingFrames++;
            console.log(`[ambient-visual:routes] Shot ${shotNumber} (${shot.id}): No image (Image Transitions mode), skipping`);
            continue;
          }
        } else if (isImageReferenceMode) {
          // Image-reference mode: only needs startFrameUrl (no end frame)
          if (!latestVersion.startFrameUrl) {
            shotsMissingFrames++;
            console.log(`[ambient-visual:routes] Shot ${shotNumber} (${shot.id}): No start frame (Image-Reference mode), skipping`);
            continue;
          }
        } else if (isStartEndMode) {
          // Start-end frame mode: needs both startFrameUrl and endFrameUrl
          if (!latestVersion.startFrameUrl) {
            shotsMissingFrames++;
            console.log(`[ambient-visual:routes] Shot ${shotNumber} (${shot.id}): No start frame (Start-End mode), skipping`);
            continue;
          }
          if (!latestVersion.endFrameUrl) {
            shotsMissingFrames++;
            console.log(`[ambient-visual:routes] Shot ${shotNumber} (${shot.id}): No end frame (Start-End mode), skipping`);
            continue;
          }
        } else {
          // Fallback: check for startFrameUrl
          if (!latestVersion.startFrameUrl) {
            shotsMissingFrames++;
            console.log(`[ambient-visual:routes] Shot ${shotNumber} (${shot.id}): No start frame, skipping`);
            continue;
          }
        }

        if (!latestVersion.videoPrompt) {
          shotsMissingPrompt++;
          console.log(`[ambient-visual:routes] Shot ${shotNumber} (${shot.id}): No video prompt, skipping`);
          continue;
        }
        
        console.log(`[ambient-visual:routes] Shot ${shotNumber} (${shot.id}): Ready for video generation, adding to queue`);

        shotsToProcess.push({
          shotId: shot.id,
          shotNumber,
          shot,
          scene,
          version: latestVersion,
        });
      }
    }

    console.log(`[ambient-visual:routes] Video generation summary: ${totalShots} total shots, ${shotsWithVideo} already have videos, ${shotsWithoutVideo} need videos, ${shotsMissingFrames} missing frames, ${shotsMissingPrompt} missing prompts, ${shotsToProcess.length} ready to process`);

    if (shotsToProcess.length === 0) {
      return res.json({
        success: true,
        message: 'No shots ready for video generation',
        videosGenerated: 0,
        failedShots: [],
        totalCost: 0,
      });
    }

    console.log('[ambient-visual:routes] Shots to process for video generation:', {
      total: shotsToProcess.length,
      isStartEndMode,
    });

    // 4. Import Agent 4.3
    const { generateVideoClipBatch } = await import('../agents/video-clip-generator');
    const { supportsStartEndFrame } = await import('../utils/video-model-helpers');

    // 5. Build batch input
    const batchInput = {
      videoId,
      shots: shotsToProcess.map(({ shotId, shotNumber, shot, scene, version }) => {
        const videoModel = shot.videoModel || scene?.videoModel || step1Data.videoModel;
        const modelSupportsEndFrame = supportsStartEndFrame(videoModel);
        const useEndFrame = isStartEndMode && modelSupportsEndFrame && !!version.endFrameUrl;

        return {
          shotId,
          shotNumber,
          versionId: version.id,
          startFrameUrl: version.startFrameUrl,
          endFrameUrl: useEndFrame ? version.endFrameUrl : undefined,
          videoPrompt: version.videoPrompt,
          videoModel,
          aspectRatio: step1Data.aspectRatio,
          videoResolution: step1Data.videoResolution,
          duration: shot.duration || 5,
          cameraFixed: shot.cameraMovement === 'static',
          generateAudio: false,
        };
      }),
    };

    // 6. Call batch generation
    const batchResult = await generateVideoClipBatch(
      batchInput,
      userId,
      video.workspaceId || undefined,
      'video',
      'ambient'
    );

    // 7. Update shot versions with video URLs
    const updatedShotVersions = { ...step4Data.shotVersions };
    const failedShots: string[] = [];

    for (const result of batchResult.results) {
      const versions = updatedShotVersions[result.shotId];
      if (!versions || versions.length === 0) continue;

      const latestVersion = versions[versions.length - 1];

      if (result.error) {
        failedShots.push(result.shotId);
        // Update status to failed
        const updatedVersion = {
          ...latestVersion,
          status: 'failed',
          errorMessage: result.error,
        };
        updatedShotVersions[result.shotId] = versions.map((v: any) =>
          v.id === latestVersion.id ? updatedVersion : v
        );
      } else if (result.videoUrl) {
        // Update with video URL
        const updatedVersion = {
          ...latestVersion,
          videoUrl: result.videoUrl,
          videoDuration: result.actualDuration,
          status: 'completed',
        };
        updatedShotVersions[result.shotId] = versions.map((v: any) =>
          v.id === latestVersion.id ? updatedVersion : v
        );
      }
    }

    // 8. Save updated step4Data
    const updatedStep4Data: Step4Data = {
      ...step4Data,
      shotVersions: updatedShotVersions,
    };

    await storage.updateVideo(videoId, { step4Data: updatedStep4Data });

    console.log('[ambient-visual:routes] Batch video generation complete:', {
      videoId,
      videosGenerated: batchResult.successCount,
      failed: batchResult.failureCount,
      totalCost: batchResult.totalCost,
    });

    res.json({
      success: true,
      videosGenerated: batchResult.successCount,
      failedShots,
      totalCost: batchResult.totalCost,
      results: batchResult.results,
    });

  } catch (error) {
    console.error('[ambient-visual:routes] Batch video generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate videos',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

