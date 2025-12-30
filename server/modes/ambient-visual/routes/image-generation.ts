/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * IMAGE GENERATION ROUTES - Agent 4.2 Single Shot & Regeneration
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Handles individual shot image generation and regeneration.
 * Separated from main routes to reduce file size.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { storage } from '../../../storage';
import { isAuthenticated, getCurrentUserId } from '../../../auth';
import type { 
  Step1Data,
  Step3Data,
  Step4Data,
  ContinuityGroup
} from '../types';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Helper function to generate a single frame image
 */
async function generateSingleFrameImage(
  input: any,
  frame: 'start' | 'end',
  currentVersion: any,
  userId: string,
  workspaceId?: string
): Promise<{ startFrameUrl?: string; endFrameUrl?: string; error?: string }> {
  const { getImageDimensions } = await import('../../../ai/config/image-models');
  const { getRunwareModelId } = await import('../../../ai/config');
  const { callAi } = await import('../../../ai/service');
  const { randomUUID } = await import('crypto');
  
  const dimensions = getImageDimensions(input.aspectRatio, input.imageResolution, input.imageModel);
  const runwareModelId = getRunwareModelId(input.imageModel);
  
  if (!runwareModelId) {
    return { error: `No Runware mapping for model: ${input.imageModel}` };
  }

  try {
    if (frame === 'start') {
      if (!input.startFramePrompt) {
        return { error: 'No start frame prompt available' };
      }

      const payload = {
        taskType: "imageInference",
        taskUUID: randomUUID(),
        model: runwareModelId,
        positivePrompt: input.startFramePrompt,
        width: dimensions.width,
        height: dimensions.height,
        numberResults: 1,
        includeCost: true,
        outputType: "URL",
      };

      const response = await callAi({
        provider: "runware",
        model: input.imageModel,
        task: "image-generation",
        payload: [payload],
        userId,
        workspaceId,
        runware: { timeoutMs: 180000 },
      }, { skipCreditCheck: false });

      const outputData = response.output as any[];
      const data = outputData[0];

      if (data?.imageURL) {
        return { startFrameUrl: data.imageURL };
      } else {
        return { error: data?.error || 'No image URL in response' };
      }

    } else {
      // End frame
      if (!input.endFramePrompt) {
        return { error: 'No end frame prompt available' };
      }

      // Use start frame (own or inherited) as reference
      const referenceUrl = input.previousShotEndFrameUrl || currentVersion.startFrameUrl;

      const payload: any = {
        taskType: "imageInference",
        taskUUID: randomUUID(),
        model: runwareModelId,
        positivePrompt: input.endFramePrompt,
        width: dimensions.width,
        height: dimensions.height,
        numberResults: 1,
        includeCost: true,
        outputType: "URL",
      };

      // Add reference image if available (for visual consistency)
      if (referenceUrl) {
        payload.referenceImages = [referenceUrl];
      }

      const response = await callAi({
        provider: "runware",
        model: input.imageModel,
        task: "image-generation",
        payload: [payload],
        userId,
        workspaceId,
        runware: { timeoutMs: 180000 },
      }, { skipCreditCheck: false });

      const outputData = response.output as any[];
      const data = outputData[0];

      if (data?.imageURL) {
        return { endFrameUrl: data.imageURL };
      } else {
        return { error: data?.error || 'No image URL in response' };
      }
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/ambient-visual/videos/:id/shots/:shotId/generate-image
 * Generate a single frame image for a specific shot (Agent 4.2 - Single Shot)
 * 
 * @param frame - 'start' or 'end' - which frame to generate
 * 
 * Rules:
 * - Start frame: Generate new start frame (or inherit from previous for connected shots)
 * - End frame: Must have start frame first; uses start as reference for visual consistency
 * - For connected shots (not first in group): Start frame cannot be generated, only inherited
 */
router.post('/videos/:id/shots/:shotId/generate-image', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId, shotId } = req.params;
    const { frame } = req.body as { frame: 'start' | 'end' };

    if (!frame || !['start', 'end'].includes(frame)) {
      return res.status(400).json({ error: 'Invalid frame parameter. Must be "start" or "end".' });
    }

    console.log('[ambient-visual:routes] Single shot image generation:', { videoId, shotId, frame });

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

    if (!step4Data?.shotVersions?.[shotId]) {
      return res.status(400).json({ error: 'No version data found for this shot. Generate prompts first.' });
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

    // 3. Get the latest version
    const versions = step4Data.shotVersions[shotId];
    const latestVersion = versions[versions.length - 1];

    // 4. Check continuity status
    const continuityGroups = step3Data?.continuityGroups?.[sceneId] || [];
    const approvedGroups = continuityGroups.filter((g: ContinuityGroup) => g.status === 'approved');
    
    let isConnectedShot = false;
    let isFirstInGroup = false;
    let previousShotEndFrameUrl: string | undefined;
    let nextShotId: string | undefined; // Track next shot in continuity group
    
    for (const group of approvedGroups) {
      const shotIds = group.shotIds as string[];
      const idx = shotIds.indexOf(shotId);
      if (idx !== -1) {
        isConnectedShot = true;
        isFirstInGroup = idx === 0;
        
        // Get previous shot's end frame URL if not first in group
        if (idx > 0) {
          const previousShotId = shotIds[idx - 1];
          const previousVersions = step4Data.shotVersions[previousShotId];
          if (previousVersions?.length > 0) {
            const prevLatest = previousVersions[previousVersions.length - 1];
            previousShotEndFrameUrl = prevLatest.endFrameUrl || undefined;
          }
        }
        
        // Get next shot ID if not last in group
        if (idx < shotIds.length - 1) {
          nextShotId = shotIds[idx + 1];
        }
        
        break;
      }
    }

    // 5. Validate generation rules
    if (frame === 'start' && isConnectedShot && !isFirstInGroup) {
      // Connected shot (not first) - start frame is inherited, cannot generate
      return res.status(400).json({ 
        error: 'Start frame is inherited from previous shot for connected shots.',
        inherited: true,
        previousShotEndFrameUrl
      });
    }

    if (frame === 'end') {
      // End frame needs start frame to exist first
      const hasStartFrame = latestVersion.startFrameUrl || latestVersion.imageUrl;
      
      if (!hasStartFrame && !(isConnectedShot && !isFirstInGroup && previousShotEndFrameUrl)) {
        return res.status(400).json({ 
          error: 'Start frame must be generated before end frame.' 
        });
      }
    }

    // 6. Determine image model
    const imageModel = shot.imageModel || scene?.imageModel || step1Data.imageModel;

    // 7. Prepare generation input
    const input: any = {
      shotId,
      shotNumber: shot.shotNumber,
      sceneId,
      animationMode: step1Data.animationMode,
      imageModel,
      aspectRatio: step1Data.aspectRatio,
      imageResolution: step1Data.imageResolution,
      isConnectedShot,
      isFirstInGroup,
    };

    // Set prompts based on which frame we're generating
    if (frame === 'start') {
      input.startFramePrompt = latestVersion.startFramePrompt;
      // Will only generate start frame
    } else {
      // End frame - needs start frame as reference
      input.endFramePrompt = latestVersion.endFramePrompt;
      input.startFramePrompt = null; // Don't generate start
      
      // Use existing start frame (or inherited) as reference
      if (isConnectedShot && !isFirstInGroup && previousShotEndFrameUrl) {
        input.previousShotEndFrameUrl = previousShotEndFrameUrl;
        input.inheritStartFrame = true;
      } else {
        // Use the shot's own start frame as reference
        input.previousShotEndFrameUrl = latestVersion.startFrameUrl;
      }
    }

    // 8. Generate the image
    console.log('[ambient-visual:routes] Calling generateSingleFrameImage:', input);
    
    const result = await generateSingleFrameImage(
      input, 
      frame, 
      latestVersion,
      userId, 
      video.workspaceId
    );

    if (result.error && !result.startFrameUrl && !result.endFrameUrl) {
      return res.status(500).json({ 
        error: result.error,
        shotId 
      });
    }

    // 9. Update the shot version with new image URL
    const updatedVersion = { ...latestVersion };
    
    if (frame === 'start') {
      updatedVersion.startFrameUrl = result.startFrameUrl;
      // If start is regenerated, clear end frame as it should be regenerated too
      if (result.startFrameUrl) {
        updatedVersion.endFrameUrl = null;
      }
    } else {
      updatedVersion.endFrameUrl = result.endFrameUrl;
    }
    
    updatedVersion.status = 'completed';

    // Update the version in step4Data
    const updatedShotVersions = {
      ...step4Data.shotVersions,
      [shotId]: versions.map((v: any) => 
        v.id === latestVersion.id ? updatedVersion : v
      )
    };

    // 10. If end frame was generated and there's a next connected shot, update its start frame
    let nextShotVersion: any = null;
    if (frame === 'end' && result.endFrameUrl && nextShotId) {
      const nextVersions = step4Data.shotVersions[nextShotId];
      if (nextVersions && nextVersions.length > 0) {
        const nextLatest = nextVersions[nextVersions.length - 1];
        const updatedNextVersion = {
          ...nextLatest,
          startFrameUrl: result.endFrameUrl, // Inherit from current shot's end frame
          startFrameInherited: true,
        };
        
        updatedShotVersions[nextShotId] = nextVersions.map((v: any) =>
          v.id === nextLatest.id ? updatedNextVersion : v
        );
        
        nextShotVersion = updatedNextVersion;
        
        console.log('[ambient-visual:routes] Updated next connected shot start frame:', {
          nextShotId,
          inheritedFromShotId: shotId,
          startFrameUrl: result.endFrameUrl,
        });
      }
    }

    const updatedStep4Data: Step4Data = {
      ...step4Data,
      shotVersions: updatedShotVersions,
    };

    await storage.updateVideo(videoId, { step4Data: updatedStep4Data });

    console.log('[ambient-visual:routes] Single image generated:', {
      shotId,
      frame,
      hasStartFrame: !!updatedVersion.startFrameUrl,
      hasEndFrame: !!updatedVersion.endFrameUrl,
      nextShotUpdated: !!nextShotVersion,
    });

    res.json({
      success: true,
      shotId,
      frame,
      shotVersion: updatedVersion,
      nextShotId: nextShotId || undefined, // Include next shot ID if it was updated
      nextShotVersion: nextShotVersion || undefined, // Include if next shot was updated
    });

  } catch (error) {
    console.error('[ambient-visual:routes] Single shot generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/ambient-visual/videos/:id/shots/:shotId/regenerate-image
 * Regenerate image(s) for a specific shot
 * 
 * @param frame - Optional: 'start' or 'end'
 *   - 'start': Regenerate ONLY start frame (end frame remains unchanged)
 *   - 'end': Regenerate ONLY end frame (uses existing start as reference)
 *   - undefined: Regenerate both frames
 */
router.post('/videos/:id/shots/:shotId/regenerate-image', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId, shotId } = req.params;
    const { frame } = req.body as { frame?: 'start' | 'end' };

    console.log('[ambient-visual:routes] Regenerate image:', { videoId, shotId, frame });

    // 1. Fetch video with all step data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = video.step1Data as Step1Data;
    const step3Data = video.step3Data as Step3Data;
    const step4Data = video.step4Data as Step4Data;

    if (!step1Data) {
      return res.status(400).json({ error: 'No atmosphere data found.' });
    }

    if (!step4Data?.shotVersions?.[shotId]) {
      return res.status(400).json({ error: 'No version data found for this shot.' });
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

    // 3. Get the latest version
    const versions = step4Data.shotVersions[shotId];
    const latestVersion = versions[versions.length - 1];

    // 4. Check continuity status
    const continuityGroups = step3Data?.continuityGroups?.[sceneId] || [];
    const approvedGroups = continuityGroups.filter((g: ContinuityGroup) => g.status === 'approved');
    
    let isConnectedShot = false;
    let isFirstInGroup = true;
    let previousShotEndFrameUrl: string | undefined;
    let nextShotId: string | undefined; // Track next shot in continuity group
    
    for (const group of approvedGroups) {
      const shotIds = group.shotIds as string[];
      const idx = shotIds.indexOf(shotId);
      if (idx !== -1) {
        isConnectedShot = true;
        isFirstInGroup = idx === 0;
        
        if (idx > 0) {
          const previousShotId = shotIds[idx - 1];
          const previousVersions = step4Data.shotVersions[previousShotId];
          if (previousVersions?.length > 0) {
            const prevLatest = previousVersions[previousVersions.length - 1];
            previousShotEndFrameUrl = prevLatest.endFrameUrl || undefined;
          }
        }
        
        // Get next shot ID if not last in group
        if (idx < shotIds.length - 1) {
          nextShotId = shotIds[idx + 1];
        }
        
        break;
      }
    }

    // 5. Determine what to regenerate based on frame parameter and rules
    let regenerateStart = false;
    let regenerateEnd = false;
    
    if (frame === 'end') {
      // Only regenerate end frame
      regenerateEnd = true;
    } else if (frame === 'start') {
      // Only regenerate start frame (end frame remains unchanged)
      // For connected shots (not first), start cannot be regenerated
      if (isConnectedShot && !isFirstInGroup) {
        // Can only regenerate end, start is inherited
        regenerateEnd = true;
      } else {
        regenerateStart = true;
        // Don't regenerate end - keep existing end frame
      }
    } else {
      // frame === undefined: regenerate both (for backward compatibility)
      // For connected shots (not first), start cannot be regenerated
      if (isConnectedShot && !isFirstInGroup) {
        // Can only regenerate end, start is inherited
        regenerateEnd = true;
      } else {
        regenerateStart = true;
        regenerateEnd = true;
      }
    }

    // 6. Determine image model
    const imageModel = shot.imageModel || scene?.imageModel || step1Data.imageModel;

    // 7. Prepare and call generation
    const input: any = {
      shotId,
      shotNumber: shot.shotNumber,
      sceneId,
      animationMode: step1Data.animationMode,
      imageModel,
      aspectRatio: step1Data.aspectRatio,
      imageResolution: step1Data.imageResolution,
      isConnectedShot,
      isFirstInGroup,
    };

    const updatedVersion = { ...latestVersion };

    // Regenerate start if needed
    if (regenerateStart && latestVersion.startFramePrompt) {
      input.startFramePrompt = latestVersion.startFramePrompt;
      
      const startResult = await generateSingleFrameImage(
        input,
        'start',
        latestVersion,
        userId,
        video.workspaceId
      );
      
      if (startResult.startFrameUrl) {
        updatedVersion.startFrameUrl = startResult.startFrameUrl;
      } else if (startResult.error) {
        console.warn('[ambient-visual:routes] Start frame regeneration failed:', startResult.error);
      }
    }

    // Regenerate end if needed
    if (regenerateEnd && latestVersion.endFramePrompt) {
      // Use the (possibly new) start frame as reference
      const referenceUrl = regenerateStart 
        ? updatedVersion.startFrameUrl 
        : (isConnectedShot && !isFirstInGroup && previousShotEndFrameUrl)
          ? previousShotEndFrameUrl
          : latestVersion.startFrameUrl;
      
      input.endFramePrompt = latestVersion.endFramePrompt;
      input.startFramePrompt = null;
      input.previousShotEndFrameUrl = referenceUrl;
      input.inheritStartFrame = !regenerateStart;
      
      const endResult = await generateSingleFrameImage(
        input,
        'end',
        { ...latestVersion, startFrameUrl: referenceUrl },
        userId,
        video.workspaceId
      );
      
      if (endResult.endFrameUrl) {
        updatedVersion.endFrameUrl = endResult.endFrameUrl;
      } else if (endResult.error) {
        console.warn('[ambient-visual:routes] End frame regeneration failed:', endResult.error);
      }
    }

    updatedVersion.status = 'completed';
    updatedVersion.needsRerender = false;

    // 8. Update the version in step4Data
    const updatedShotVersions = {
      ...step4Data.shotVersions,
      [shotId]: versions.map((v: any) => 
        v.id === latestVersion.id ? updatedVersion : v
      )
    };

    // 9. If end frame was regenerated and there's a next connected shot, update its start frame
    let nextShotVersion: any = null;
    if (regenerateEnd && updatedVersion.endFrameUrl && nextShotId) {
      const nextVersions = step4Data.shotVersions[nextShotId];
      if (nextVersions && nextVersions.length > 0) {
        const nextLatest = nextVersions[nextVersions.length - 1];
        const updatedNextVersion = {
          ...nextLatest,
          startFrameUrl: updatedVersion.endFrameUrl, // Inherit from current shot's end frame
          startFrameInherited: true,
        };
        
        updatedShotVersions[nextShotId] = nextVersions.map((v: any) =>
          v.id === nextLatest.id ? updatedNextVersion : v
        );
        
        nextShotVersion = updatedNextVersion;
        
        console.log('[ambient-visual:routes] Updated next connected shot start frame (regenerate):', {
          nextShotId,
          inheritedFromShotId: shotId,
          startFrameUrl: updatedVersion.endFrameUrl,
        });
      }
    }

    const updatedStep4Data: Step4Data = {
      ...step4Data,
      shotVersions: updatedShotVersions,
    };

    await storage.updateVideo(videoId, { step4Data: updatedStep4Data });

    console.log('[ambient-visual:routes] Image regenerated:', {
      shotId,
      frame,
      regeneratedStart: regenerateStart,
      regeneratedEnd: regenerateEnd,
      hasStartFrame: !!updatedVersion.startFrameUrl,
      hasEndFrame: !!updatedVersion.endFrameUrl,
      nextShotUpdated: !!nextShotVersion,
    });

    res.json({
      success: true,
      shotId,
      frame,
      regeneratedStart: regenerateStart,
      regeneratedEnd: regenerateEnd,
      shotVersion: updatedVersion,
      nextShotId: nextShotId || undefined, // Include next shot ID if it was updated
      nextShotVersion: nextShotVersion || undefined, // Include if next shot was updated
    });

  } catch (error) {
    console.error('[ambient-visual:routes] Regenerate image error:', error);
    res.status(500).json({ 
      error: 'Failed to regenerate image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// NOTE: Video generation routes have been moved to ./video-generation.ts
// The following routes are now handled by the videoGenerationRouter:
// - POST /videos/:id/shots/:shotId/generate-video
// - POST /videos/:id/generate-all-videos

export default router;

