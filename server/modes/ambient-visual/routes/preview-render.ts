/**
 * Preview Render Routes
 * 
 * Handles Shotstack preview generation and timeline management for Phase 6.
 */

import { Router, Request, Response } from 'express';
import { isAuthenticated, getCurrentUserId } from '../../../auth';
import { storage } from '../../../storage';
import {
  getShotstackClient,
  buildShotstackTimeline,
  validateTimelineInput,
  isShotstackConfigured,
  type TimelineBuilderInput,
  type TimelineScene,
  type TimelineShot,
  type TimelineShotVersion,
  type VolumeSettings,
  type OutputSettings,
} from '../../../integrations/shotstack';
import type {
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
  Step5Data,
  Step6Data,
  TimelineSceneItem,
  TimelineShotItem,
  AudioTrackItem,
  VolumeSettings as Step6VolumeSettings,
  Shot,
} from '../types';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// BUILD TIMELINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/ambient-visual/videos/:id/preview/build-timeline
 * Build Shotstack timeline JSON from current video data
 * 
 * Used to preview what will be sent to Shotstack before rendering
 */
router.post('/videos/:id/preview/build-timeline', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId } = req.params;

    console.log('[preview-render] Building timeline for video:', videoId);

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step6Data = video.step6Data as Step6Data | undefined;
    if (!step6Data?.timeline) {
      return res.status(400).json({ error: 'No timeline data found. Complete step 5 first.' });
    }

    // Build timeline input from Step6Data
    const timelineInput = buildTimelineInputFromStep6(step6Data);

    // Validate input
    const errors = validateTimelineInput(timelineInput);
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid timeline data', 
        details: errors 
      });
    }

    // Build Shotstack timeline
    const result = buildShotstackTimeline(timelineInput);

    res.json({
      timeline: result.edit.timeline,
      output: result.edit.output,
      totalDuration: result.totalDuration,
      clipCount: result.clipCount,
    });
  } catch (error) {
    console.error('[preview-render] Build timeline error:', error);
    res.status(500).json({ error: 'Failed to build timeline' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER PREVIEW
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/ambient-visual/videos/:id/preview/render
 * Submit timeline to Shotstack for preview rendering
 * 
 * Uses lower quality settings for faster preview generation
 */
router.post('/videos/:id/preview/render', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!isShotstackConfigured()) {
      return res.status(503).json({ 
        error: 'Shotstack not configured. Set SHOTSTACK_API_KEY environment variable.' 
      });
    }

    const { id: videoId } = req.params;
    const { quality = 'preview' } = req.body; // 'preview' or 'final'

    console.log('[preview-render] Starting render for video:', videoId, 'quality:', quality);

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step6Data = video.step6Data as Step6Data | undefined;
    if (!step6Data?.timeline) {
      return res.status(400).json({ error: 'No timeline data found. Complete step 5 first.' });
    }

    // Build timeline input from Step6Data
    const timelineInput = buildTimelineInputFromStep6(step6Data, quality);

    // Validate input
    const errors = validateTimelineInput(timelineInput);
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid timeline data', 
        details: errors 
      });
    }

    // Build Shotstack timeline
    const result = buildShotstackTimeline(timelineInput);

    // Add callback URL for webhook (optional)
    const callbackUrl = process.env.SHOTSTACK_WEBHOOK_URL 
      ? `${process.env.SHOTSTACK_WEBHOOK_URL}?videoId=${videoId}&type=${quality}`
      : undefined;
    
    if (callbackUrl) {
      result.edit.callback = callbackUrl;
    }

    // Submit to Shotstack
    const client = getShotstackClient();
    const renderResponse = await client.render(result.edit);

    console.log('[preview-render] Render submitted:', {
      renderId: renderResponse.response.id,
      status: renderResponse.response.status,
    });

    // Update step6Data with render state
    const renderState = {
      id: renderResponse.response.id,
      status: renderResponse.response.status as 'queued' | 'rendering' | 'done' | 'failed',
      progress: 0,
      startedAt: new Date().toISOString(),
    };

    const updatedStep6Data: Step6Data = {
      ...step6Data,
      [quality === 'preview' ? 'previewRender' : 'finalRender']: renderState,
    };

    await storage.updateVideo(videoId, {
      step6Data: updatedStep6Data,
    });

    res.json({
      renderId: renderResponse.response.id,
      status: renderResponse.response.status,
      totalDuration: result.totalDuration,
      clipCount: result.clipCount,
    });
  } catch (error) {
    console.error('[preview-render] Render error:', error);
    res.status(500).json({ error: 'Failed to start render' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER STATUS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/ambient-visual/videos/:id/preview/status/:renderId
 * Check render status from Shotstack
 */
router.get('/videos/:id/preview/status/:renderId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!isShotstackConfigured()) {
      return res.status(503).json({ 
        error: 'Shotstack not configured' 
      });
    }

    const { id: videoId, renderId } = req.params;

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get status from Shotstack
    const client = getShotstackClient();
    const statusResponse = await client.getRenderStatus(renderId);

    const status = statusResponse.response.status;
    const url = statusResponse.response.url;
    // Shotstack returns thumbnail URL when configured in output settings
    const thumbnail = statusResponse.response.thumbnail;

    console.log('[preview-render] Status check:', {
      renderId,
      status,
      hasUrl: !!url,
      hasThumbnail: !!thumbnail,
    });

    // Update step6Data if status changed to done
    if (status === 'done' && url) {
      const step6Data = video.step6Data as Step6Data | undefined;
      if (step6Data) {
        // Determine which render this is
        const isPreviewRender = step6Data.previewRender?.id === renderId;
        const isFinalRender = step6Data.finalRender?.id === renderId;

        if (isPreviewRender) {
          await storage.updateVideo(videoId, {
            step6Data: {
              ...step6Data,
              previewRender: {
                ...step6Data.previewRender!,
                status: 'done',
                url,
                progress: 100,
                completedAt: new Date().toISOString(),
              },
            },
          });
        } else if (isFinalRender) {
          await storage.updateVideo(videoId, {
            step6Data: {
              ...step6Data,
              finalRender: {
                ...step6Data.finalRender!,
                status: 'done',
                url,
                progress: 100,
                completedAt: new Date().toISOString(),
              },
            },
          });
        }
      }
    }

    // Calculate progress based on status
    let progress = 0;
    switch (status) {
      case 'queued':
        progress = 10;
        break;
      case 'fetching':
        progress = 30;
        break;
      case 'rendering':
        progress = 60;
        break;
      case 'saving':
        progress = 90;
        break;
      case 'done':
        progress = 100;
        break;
      case 'failed':
        progress = 0;
        break;
    }

    res.json({
      renderId,
      status,
      progress,
      url: url || null,
      thumbnail: thumbnail || null, // Thumbnail URL from Shotstack
      error: statusResponse.response.error || null,
      duration: statusResponse.response.duration,
      renderTime: statusResponse.response.renderTime,
    });
  } catch (error) {
    console.error('[preview-render] Status error:', error);
    res.status(500).json({ error: 'Failed to get render status' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE TIMELINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PATCH /api/ambient-visual/videos/:id/preview/update-timeline
 * Update timeline data (reorder scenes, shots, SFX, adjust volumes/transitions)
 */
router.patch('/videos/:id/preview/update-timeline', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId } = req.params;
    const {
      scenes,        // Reordered scenes
      shots,         // Reordered shots per scene
      sfxTracks,     // Reordered SFX tracks
      volumes,       // Updated volume settings
      transitions,   // Updated transitions
    } = req.body;

    console.log('[preview-render] Updating timeline for video:', videoId);

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step6Data = video.step6Data as Step6Data | undefined;
    if (!step6Data?.timeline) {
      return res.status(400).json({ error: 'No timeline data found' });
    }

    // Build updated timeline
    const updatedTimeline = { ...step6Data.timeline };

    // Update scenes order
    if (scenes && Array.isArray(scenes)) {
      updatedTimeline.scenes = scenes.map((scene: TimelineSceneItem, index: number) => ({
        ...scene,
        order: index,
      }));
    }

    // Update shots order
    if (shots && typeof shots === 'object') {
      const updatedShots: Record<string, TimelineShotItem[]> = {};
      for (const [sceneId, sceneShots] of Object.entries(shots)) {
        updatedShots[sceneId] = (sceneShots as TimelineShotItem[]).map((shot, index) => ({
          ...shot,
          order: index,
        }));
      }
      updatedTimeline.shots = updatedShots;
    }

    // Update SFX tracks order
    if (sfxTracks && Array.isArray(sfxTracks)) {
      updatedTimeline.audioTracks.sfx = sfxTracks.map((track: AudioTrackItem, index: number) => ({
        ...track,
        order: index,
      }));
    }

    // Update transitions (if provided)
    if (transitions && typeof transitions === 'object') {
      // Apply transitions to shots
      for (const [shotId, transition] of Object.entries(transitions)) {
        for (const sceneId of Object.keys(updatedTimeline.shots)) {
          const shotIndex = updatedTimeline.shots[sceneId].findIndex(s => s.id === shotId);
          if (shotIndex >= 0) {
            updatedTimeline.shots[sceneId][shotIndex] = {
              ...updatedTimeline.shots[sceneId][shotIndex],
              transition: transition as string,
            };
          }
        }
      }
    }

    // Update volumes
    const updatedVolumes = volumes 
      ? { ...step6Data.volumes, ...volumes }
      : step6Data.volumes;

    // Save updated step6Data
    const updatedStep6Data: Step6Data = {
      ...step6Data,
      timeline: updatedTimeline,
      volumes: updatedVolumes,
    };

    await storage.updateVideo(videoId, {
      step6Data: updatedStep6Data,
    });

    res.json({
      success: true,
      timeline: updatedTimeline,
      volumes: updatedVolumes,
    });
  } catch (error) {
    console.error('[preview-render] Update timeline error:', error);
    res.status(500).json({ error: 'Failed to update timeline' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET STEP 6 DATA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/ambient-visual/videos/:id/preview/data
 * Get current Step 6 data (timeline, volumes, render states)
 * 
 * If timeline is missing but we have the necessary data, initialize it automatically.
 */
router.get('/videos/:id/preview/data', isAuthenticated, async (req: Request, res: Response) => {
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

    let step6Data = video.step6Data as Step6Data | undefined;
    const step1Data = video.step1Data as Step1Data;
    const step2Data = video.step2Data as Step2Data;
    const step5Data = video.step5Data as Step5Data;

    // Log what data we have
    console.log('[preview-render:get-data] Checking music data:', {
      videoId,
      backgroundMusicEnabled: step1Data?.backgroundMusicEnabled,
      hasCustomMusic: step2Data?.hasCustomMusic,
      customMusicUrl: step2Data?.customMusicUrl ? 'exists' : 'missing',
      generatedMusicUrl: step5Data?.generatedMusicUrl ? 'exists' : 'missing',
      existingMusicInStep6: step6Data?.timeline?.audioTracks?.music?.src ? 'exists' : 'missing',
    });

    // Check if we need to update music track in existing step6Data
    // Simple logic:
    // 1. step1Data.backgroundMusicEnabled === true means music should exist
    // 2. If hasCustomMusic === true → use customMusicUrl from step2Data
    // 3. If hasCustomMusic === false → use generatedMusicUrl from step5Data
    if (step6Data?.timeline && step1Data?.backgroundMusicEnabled) {
      let musicUrl: string | undefined;
      let musicSource: string | undefined;

      if (step2Data?.hasCustomMusic) {
        musicUrl = step2Data.customMusicUrl;
        musicSource = 'custom';
      } else {
        musicUrl = step5Data?.generatedMusicUrl;
        musicSource = 'generated';
      }
      
      console.log('[preview-render:get-data] Music check:', {
        backgroundMusicEnabled: true,
        hasCustomMusic: step2Data?.hasCustomMusic,
        musicSource,
        musicUrl,
      });

      // Ensure audioTracks exists
      if (!step6Data.timeline.audioTracks) {
        step6Data.timeline.audioTracks = {};
      }
      
      const existingMusicUrl = step6Data.timeline.audioTracks.music?.src;
      
      // If music should exist but doesn't, or if the URL changed, update it
      if (musicUrl && (!existingMusicUrl || musicUrl !== existingMusicUrl)) {
        console.log('[preview-render] Updating music track in step6Data:', {
          videoId,
          musicSource,
          oldUrl: existingMusicUrl || 'none',
          newUrl: musicUrl,
        });

        // Calculate total duration for music
        let totalDuration = 0;
        for (const scene of step6Data.timeline.scenes) {
          const sceneLoopCount = scene.loopCount ?? 1;
          const sceneShots = step6Data.timeline.shots[scene.id] || [];
          for (let i = 0; i < sceneLoopCount; i++) {
            for (const shot of sceneShots) {
              const shotLoopCount = shot.loopCount ?? 1;
              totalDuration += shot.duration * shotLoopCount;
            }
          }
        }

        step6Data.timeline.audioTracks.music = {
          id: 'music-main',
          src: musicUrl,
          start: 0,
          duration: totalDuration,
          volume: 0.5,
          fadeIn: true,
          fadeOut: true,
          order: 0,
        };

        // Also remove ambient from volumes if present (cleanup old data)
        if ('ambient' in (step6Data.volumes as Record<string, unknown>)) {
          const { ambient, ...cleanVolumes } = step6Data.volumes as Record<string, unknown>;
          step6Data.volumes = cleanVolumes as Step6VolumeSettings;
        }

        // Save updated step6Data
        await storage.updateVideo(videoId, { step6Data });
        console.log('[preview-render:get-data] Music saved to step6Data:', {
          videoId,
          musicUrl,
          duration: totalDuration,
        });
      } else if (musicUrl && existingMusicUrl === musicUrl) {
        console.log('[preview-render:get-data] Music already in step6Data, no update needed');
      } else if (!musicUrl) {
        console.log('[preview-render:get-data] No music URL found, cannot add music to step6Data');
      }
    } else if (step6Data?.timeline && !step1Data?.backgroundMusicEnabled) {
      // If music is disabled, remove it from step6Data if present
      if (step6Data.timeline.audioTracks?.music) {
        delete step6Data.timeline.audioTracks.music;
        await storage.updateVideo(videoId, { step6Data });
        console.log('[preview-render:get-data] Music removed from step6Data (backgroundMusicEnabled=false)');
      }
    }

    // Auto-initialize timeline if missing but we have the necessary data
    if (!step6Data?.timeline) {
      const step3Data = video.step3Data as Step3Data;
      const step4Data = video.step4Data as Step4Data;

      // Check if we have enough data to initialize
      const scenesSource = step5Data?.scenesWithLoops || step3Data?.scenes;
      const shotsSource = step5Data?.shotsWithLoops || step3Data?.shots;
      const shotVersions = step4Data?.shotVersions;

      if (scenesSource && shotsSource && shotVersions) {
        console.log('[preview-render] Auto-initializing timeline for video:', videoId);

        // Build timeline scenes
        const timelineScenes: TimelineSceneItem[] = scenesSource.map((scene, index) => ({
          id: scene.id,
          sceneNumber: scene.sceneNumber,
          title: scene.title,
          description: scene.description,
          duration: scene.duration,
          loopCount: scene.loopCount ?? 1,
          order: index,
        }));

        // Build timeline shots
        const timelineShots: Record<string, TimelineShotItem[]> = {};
        for (const [sceneId, sceneShots] of Object.entries(shotsSource)) {
          timelineShots[sceneId] = (sceneShots as Shot[]).map((shot, index) => {
            const versions = shotVersions[shot.id] || [];
            const latestVersion = versions[versions.length - 1];
            return {
              id: shot.id,
              sceneId,
              shotNumber: shot.shotNumber,
              duration: shot.duration,
              loopCount: shot.loopCount ?? 1,
              transition: shot.transition,
              videoUrl: latestVersion?.videoUrl || null,
              order: index,
            };
          });
        }

        // Build SFX tracks
        const sfxTracks: AudioTrackItem[] = [];
        let currentTime = 0;
        
        for (const scene of timelineScenes) {
          const sceneLoopCount = scene.loopCount ?? 1;
          const sceneShots = timelineShots[scene.id] || [];
          
          for (let sceneIter = 0; sceneIter < sceneLoopCount; sceneIter++) {
            for (const shot of sceneShots) {
              const shotLoopCount = shot.loopCount ?? 1;
              
              for (let shotIter = 0; shotIter < shotLoopCount; shotIter++) {
                // SFX is stored in shot's soundEffectUrl (audio-only file)
                const sfxUrl = (shotsSource[scene.id] as Shot[])?.find(s => s.id === shot.id)?.soundEffectUrl;
                
                if (sfxUrl) {
                  sfxTracks.push({
                    id: `sfx-${shot.id}-${sceneIter}-${shotIter}`,
                    shotId: shot.id,
                    src: sfxUrl,
                    start: currentTime,
                    duration: shot.duration,
                    volume: 1,
                    order: sfxTracks.length,
                  });
                }
                
                currentTime += shot.duration;
              }
            }
          }
        }

        // Build voiceover track
        let voiceoverTrack: AudioTrackItem | undefined;
        if (step5Data?.voiceoverAudioUrl) {
          voiceoverTrack = {
            id: 'voiceover-main',
            src: step5Data.voiceoverAudioUrl,
            start: 0,
            duration: step5Data.voiceoverDuration || currentTime,
            volume: 1,
            fadeIn: true,
            fadeOut: true,
            order: 0,
          };
        }

        // Build music track
        // Simple logic: if backgroundMusicEnabled, get music from customMusicUrl or generatedMusicUrl
        let initMusicTrack: AudioTrackItem | undefined;
        
        if (step1Data?.backgroundMusicEnabled) {
          const initMusicUrl = step2Data?.hasCustomMusic 
            ? step2Data.customMusicUrl 
            : step5Data?.generatedMusicUrl;

          if (initMusicUrl) {
            initMusicTrack = {
              id: 'music-main',
              src: initMusicUrl,
              start: 0,
              duration: currentTime,
              volume: 0.5,
              fadeIn: true,
              fadeOut: true,
              order: 0,
            };
            console.log('[preview-render] Adding music to timeline:', initMusicUrl);
          }
        }

        // Default volumes
        const defaultVolumes: Step6VolumeSettings = {
          master: 1,
          sfx: 0.8,
          voiceover: 1,
          music: 0.5,
        };

        // Build and save step6Data
        step6Data = {
          timeline: {
            scenes: timelineScenes,
            shots: timelineShots,
            audioTracks: {
              sfx: sfxTracks,
              voiceover: voiceoverTrack,
              music: initMusicTrack,
            },
          },
          volumes: defaultVolumes,
          previewRender: undefined,
          finalRender: undefined,
        };

        // Save to database
        await storage.updateVideo(videoId, { step6Data });
        console.log('[preview-render] Timeline auto-initialized:', {
          scenes: timelineScenes.length,
          shots: Object.values(timelineShots).flat().length,
          sfxTracks: sfxTracks.length,
          hasMusic: !!initMusicTrack,
        });
      }
    }

    res.json({
      step6Data: step6Data || null,
      hasTimeline: !!step6Data?.timeline,
      hasPreviewRender: !!step6Data?.previewRender,
      hasFinalRender: !!step6Data?.finalRender,
    });
  } catch (error) {
    console.error('[preview-render] Get data error:', error);
    res.status(500).json({ error: 'Failed to get preview data' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SHOTSTACK STUDIO EDIT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/ambient-visual/videos/:id/preview/studio-edit
 * Get Shotstack Edit JSON for Studio SDK preview
 * 
 * This endpoint builds the Shotstack Edit format that can be loaded
 * directly into the Shotstack Studio SDK for client-side preview.
 */
router.get('/videos/:id/preview/studio-edit', isAuthenticated, async (req: Request, res: Response) => {
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
    const step3Data = video.step3Data as Step3Data;
    const step4Data = video.step4Data as Step4Data;
    const step5Data = video.step5Data as Step5Data;
    const step6Data = video.step6Data as Step6Data | undefined;

    // Get scene and shot data (prefer step5 with loops)
    const scenesSource = step5Data?.scenesWithLoops || step3Data?.scenes;
    const shotsSource = step5Data?.shotsWithLoops || step3Data?.shots;
    const shotVersions = step4Data?.shotVersions;

    if (!scenesSource || !shotsSource || !shotVersions) {
      return res.status(400).json({ 
        error: 'Missing required data',
        details: {
          hasScenes: !!scenesSource,
          hasShots: !!shotsSource,
          hasShotVersions: !!shotVersions,
        }
      });
    }

    // Convert to timeline builder format
    const timelineScenes: TimelineScene[] = scenesSource.map((scene: any, idx: number) => ({
      id: scene.id,
      sceneNumber: idx + 1,
      title: scene.title || `Scene ${idx + 1}`,
      description: scene.description,
      duration: scene.duration,
      loopCount: scene.loopCount ?? 1,
    }));

    const timelineShots: Record<string, TimelineShot[]> = {};
    for (const sceneId of Object.keys(shotsSource)) {
      const sceneShots = (shotsSource as Record<string, Shot[]>)[sceneId] || [];
      timelineShots[sceneId] = sceneShots.map((shot: Shot, idx: number) => ({
        id: shot.id,
        sceneId: shot.sceneId,
        shotNumber: idx + 1,
        duration: shot.duration || 5,
        loopCount: shot.loopCount ?? 1,
        transition: shot.transition,
        soundEffectDescription: shot.soundEffectDescription,
        soundEffectUrl: shot.soundEffectUrl,
      }));
    }

    const timelineShotVersions: Record<string, TimelineShotVersion[]> = {};
    for (const shotId of Object.keys(shotVersions)) {
      const versions = shotVersions[shotId] || [];
      timelineShotVersions[shotId] = versions.map((v: any) => ({
        id: v.id,
        shotId: v.shotId,
        videoUrl: v.videoUrl,
        soundEffectPrompt: v.soundEffectPrompt,
      }));
    }

    // Build audio tracks - use step6Data.timeline.audioTracks as source of truth
    const audioTracks: TimelineBuilderInput['audioTracks'] = {};
    
    // Voiceover: prefer step6Data.timeline.audioTracks.voiceover, fallback to step5Data
    const voiceoverSrc = step6Data?.timeline?.audioTracks?.voiceover?.src || step5Data?.voiceoverAudioUrl;
    if (voiceoverSrc) {
      audioTracks.voiceover = {
        src: voiceoverSrc,
        volume: 1,
        fadeIn: true,
        fadeOut: true,
      };
      console.log('[preview-render:studio-edit] Voiceover added:', voiceoverSrc);
    }

    // Music: prefer step6Data.timeline.audioTracks.music, fallback to step2/step5
    let musicSrc = step6Data?.timeline?.audioTracks?.music?.src;
    let musicWasMissing = false;
    
    if (!musicSrc && step1Data?.backgroundMusicEnabled) {
      musicSrc = step2Data?.hasCustomMusic 
        ? step2Data.customMusicUrl 
        : step5Data?.generatedMusicUrl;
      musicWasMissing = !!musicSrc; // Flag to save to DB
    }
    
    if (musicSrc) {
      audioTracks.music = {
        src: musicSrc,
        volume: 0.5,
        fadeIn: true,
        fadeOut: true,
      };
      console.log('[preview-render:studio-edit] Music added:', musicSrc);
      
      // If music was missing from step6Data, save it now
      if (musicWasMissing && step6Data?.timeline) {
        // Calculate total duration
        let totalDuration = 0;
        for (const scene of step6Data.timeline.scenes) {
          const sceneLoopCount = scene.loopCount ?? 1;
          const sceneShots = step6Data.timeline.shots[scene.id] || [];
          for (let i = 0; i < sceneLoopCount; i++) {
            for (const shot of sceneShots) {
              const shotLoopCount = shot.loopCount ?? 1;
              totalDuration += shot.duration * shotLoopCount;
            }
          }
        }
        
        // Ensure audioTracks exists
        if (!step6Data.timeline.audioTracks) {
          step6Data.timeline.audioTracks = {};
        }
        
        step6Data.timeline.audioTracks.music = {
          id: 'music-main',
          src: musicSrc,
          start: 0,
          duration: totalDuration,
          volume: 0.5,
          fadeIn: true,
          fadeOut: true,
          order: 0,
        };
        
        // Remove ambient from volumes if present
        if (step6Data.volumes && 'ambient' in (step6Data.volumes as Record<string, unknown>)) {
          const { ambient, ...cleanVolumes } = step6Data.volumes as Record<string, unknown>;
          step6Data.volumes = cleanVolumes as Step6VolumeSettings;
        }
        
        await storage.updateVideo(videoId, { step6Data });
        console.log('[preview-render:studio-edit] Music saved to step6Data:', musicSrc);
      }
    }
    
    console.log('[preview-render:studio-edit] Audio tracks built:', {
      hasVoiceover: !!audioTracks.voiceover,
      hasMusic: !!audioTracks.music,
    });

    // Get volume settings (add ambient: 0 for shotstack compatibility, but not used in this mode)
    const step6Volumes = step6Data?.volumes || {
      master: 1,
      sfx: 0.8,
      voiceover: 1,
      music: 0.5,
    };
    const volumes: VolumeSettings = {
      ...step6Volumes,
      ambient: 0, // Not used in ambient-visual mode, but required by shotstack type
    };

    // Build output settings (preview quality)
    const outputSettings: OutputSettings = {
      format: 'mp4',
      resolution: 'hd', // 720p for preview
      aspectRatio: '16:9',
      fps: 30,
    };

    // Build SFX clips array from step6Data if available
    const sfxClips = step6Data?.timeline?.audioTracks?.sfx?.map(sfx => ({
      id: sfx.id,
      src: sfx.src,
      start: sfx.start,
      duration: sfx.duration,
      shotId: sfx.shotId,
      volume: sfx.volume,
    })) || [];

    // Build Shotstack Edit
    const input: TimelineBuilderInput = {
      scenes: timelineScenes,
      shots: timelineShots,
      shotVersions: timelineShotVersions,
      audioTracks,
      sfxClips, // Pass SFX clips for ambient-visual mode
      volumes,
      output: outputSettings,
    };

    const result = buildShotstackTimeline(input);

    console.log('[preview-render] Built Studio edit:', {
      trackCount: result.edit.timeline.tracks.length,
      totalDuration: result.totalDuration,
    });

    res.json({
      edit: result.edit,
      totalDuration: result.totalDuration,
      clipCount: result.edit.timeline.tracks.reduce(
        (sum, track) => sum + track.clips.length, 0
      ),
      // Return saved volumes so frontend can initialize correctly
      savedVolumes: step6Volumes,
    });
  } catch (error) {
    console.error('[preview-render] Studio edit error:', error);
    res.status(500).json({ error: 'Failed to build studio edit' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// WEBHOOK HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/webhooks/shotstack
 * Webhook endpoint for Shotstack render completion callbacks
 * 
 * Note: This should be mounted at the root level, not under /api/ambient-visual
 */
router.post('/webhooks/shotstack', async (req: Request, res: Response) => {
  try {
    const { videoId, type } = req.query;
    const payload = req.body;

    console.log('[preview-render:webhook] Received Shotstack webhook:', {
      videoId,
      type,
      status: payload.status,
      id: payload.id,
    });

    // Verify webhook signature if configured
    const webhookSecret = process.env.SHOTSTACK_WEBHOOK_SECRET;
    if (webhookSecret) {
      // Shotstack sends signature in x-shotstack-signature header
      const signature = req.headers['x-shotstack-signature'];
      // TODO: Implement signature verification
      // For now, just log warning if secret is set but no verification
      if (!signature) {
        console.warn('[preview-render:webhook] Webhook secret configured but no signature received');
      }
    }

    if (!videoId || typeof videoId !== 'string') {
      console.warn('[preview-render:webhook] Missing videoId in query params');
      return res.status(400).json({ error: 'Missing videoId' });
    }

    const video = await storage.getVideo(videoId);
    if (!video) {
      console.warn('[preview-render:webhook] Video not found:', videoId);
      return res.status(404).json({ error: 'Video not found' });
    }

    const step6Data = video.step6Data as Step6Data | undefined;
    if (!step6Data) {
      console.warn('[preview-render:webhook] No step6Data for video:', videoId);
      return res.status(400).json({ error: 'No step6Data' });
    }

    // Determine render type
    const renderType = type === 'final' ? 'finalRender' : 'previewRender';
    
    // Map Shotstack status to our status
    let ourStatus: 'queued' | 'rendering' | 'done' | 'failed';
    switch (payload.status) {
      case 'done':
        ourStatus = 'done';
        break;
      case 'failed':
        ourStatus = 'failed';
        break;
      case 'queued':
      case 'fetching':
        ourStatus = 'queued';
        break;
      case 'rendering':
      case 'saving':
        ourStatus = 'rendering';
        break;
      default:
        ourStatus = 'rendering';
    }

    // Update render state
    const updatedRenderState = {
      ...step6Data[renderType],
      id: payload.id,
      status: ourStatus,
      url: payload.url || step6Data[renderType]?.url,
      progress: ourStatus === 'done' ? 100 : (ourStatus === 'failed' ? 0 : 50),
      error: payload.error,
      completedAt: ourStatus === 'done' ? new Date().toISOString() : undefined,
    };

    await storage.updateVideo(videoId, {
      step6Data: {
        ...step6Data,
        [renderType]: updatedRenderState,
      },
    });

    console.log('[preview-render:webhook] Updated render state:', {
      videoId,
      renderType,
      status: ourStatus,
      url: payload.url,
    });

    // Respond quickly to acknowledge webhook
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[preview-render:webhook] Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build TimelineBuilderInput from Step6Data
 */
function buildTimelineInputFromStep6(
  step6Data: Step6Data,
  quality: 'preview' | 'final' = 'preview'
): TimelineBuilderInput {
  const timeline = step6Data.timeline!;
  // Get volumes from step6Data, but ensure we only include the tracks we use
  const step6Volumes = step6Data.volumes || {
    master: 1,
    sfx: 0.8,
    voiceover: 1,
    music: 0.5,
  };

  // Debug: Log what we're reading from step6Data
  console.log('[buildTimelineInputFromStep6] Reading volumes:', {
    rawVolumes: step6Data.volumes,
    step6Volumes,
    quality,
  });
  
  // Convert to shotstack VolumeSettings format (ambient is optional in shotstack)
  const volumes: VolumeSettings = {
    master: step6Volumes.master,
    sfx: step6Volumes.sfx,
    voiceover: step6Volumes.voiceover,
    music: step6Volumes.music,
    ambient: 0, // Not used in ambient-visual mode, but required by shotstack type
  };

  // Convert TimelineSceneItem[] to TimelineScene[]
  const scenes: TimelineScene[] = timeline.scenes.map(scene => ({
    id: scene.id,
    sceneNumber: scene.sceneNumber,
    title: scene.title,
    description: scene.description,
    duration: scene.duration,
    loopCount: scene.loopCount,
  }));

  // Convert TimelineShotItem[] to TimelineShot[]
  const shots: Record<string, TimelineShot[]> = {};
  for (const [sceneId, sceneShots] of Object.entries(timeline.shots)) {
    shots[sceneId] = sceneShots.map(shot => ({
      id: shot.id,
      sceneId: shot.sceneId,
      shotNumber: shot.shotNumber,
      duration: shot.duration,
      loopCount: shot.loopCount,
      transition: shot.transition,
      soundEffectDescription: null,
      soundEffectUrl: null, // SFX is in audioTracks, not shots
    }));
  }

  // Build shot versions from timeline shots (video URLs)
  const shotVersions: Record<string, TimelineShotVersion[]> = {};
  for (const [sceneId, sceneShots] of Object.entries(timeline.shots)) {
    for (const shot of sceneShots) {
      if (shot.videoUrl) {
        shotVersions[shot.id] = [{
          id: `${shot.id}-v1`,
          shotId: shot.id,
          videoUrl: shot.videoUrl,
          soundEffectPrompt: null,
        }];
      }
    }
  }

  // Build output settings
  const outputSettings: OutputSettings = {
    format: 'mp4',
    resolution: quality === 'preview' ? 'sd' : '1080',
    aspectRatio: '16:9', // TODO: Get from step1Data
    fps: quality === 'preview' ? 24 : 30,
    // Add thumbnail for final renders (capture at 1 second, 50% scale)
    ...(quality === 'final' ? {
      thumbnail: {
        capture: 1,
        scale: 0.5,
      },
    } : {}),
  };

  // Build SFX clips array from timeline.audioTracks.sfx
  const sfxClips = (timeline.audioTracks.sfx || []).map(sfx => ({
    id: sfx.id,
    src: sfx.src,
    start: sfx.start,
    duration: sfx.duration,
    shotId: sfx.shotId,
    volume: sfx.volume,
  }));

  console.log('[buildTimelineInputFromStep6] SFX clips:', {
    count: sfxClips.length,
    sample: sfxClips[0] ? { src: sfxClips[0].src.slice(-50), start: sfxClips[0].start } : null,
  });

  return {
    scenes,
    shots,
    shotVersions,
    audioTracks: {
      voiceover: timeline.audioTracks.voiceover,
      music: timeline.audioTracks.music,
      // ambient is not used in ambient-visual mode
    },
    sfxClips, // Pass SFX clips array for ambient-visual mode
    volumes,
    output: outputSettings,
  };
}

export default router;

