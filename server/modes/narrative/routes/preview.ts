/**
 * Narrative Preview & Export Routes
 * 
 * Handles Shotstack preview generation, timeline management, and export functionality
 * for the Preview and Export steps in Narrative mode.
 */

import { Router, Request, Response } from 'express';
import { isAuthenticated, getCurrentUserId } from '../../../auth';
import { storage } from '../../../storage';
import { bunnyStorage, buildVideoModePath } from '../../../storage/bunny-storage';
import {
  getShotstackClient,
  isShotstackConfigured,
  buildShotstackTimeline,
  validateTimelineInput,
  type TimelineBuilderInput,
  type TimelineScene,
  type TimelineShot,
  type TimelineShotVersion,
  type VolumeSettings as ShotstackVolumeSettings,
  type OutputSettings,
} from '../../../integrations/shotstack';
import type { Step3Data, Step5Data } from '../types';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 7 DATA TYPE - EXPORT PHASE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Step 7 Data - Export Phase for Narrative Mode
 * 
 * Contains:
 * - Render state and progress tracking
 * - Final export URLs (video and thumbnail)
 * - Export metadata (resolution, format, duration)
 */
interface Step7Data {
  // Render identification
  renderId?: string;                 // Shotstack render ID
  
  // Render status tracking
  // 'uploading' prevents multiple Bunny uploads while large file upload is in progress
  renderStatus: 'pending' | 'queued' | 'fetching' | 'rendering' | 'saving' | 'uploading' | 'done' | 'failed';
  renderProgress: number;            // 0-100 percentage
  
  // Final export URLs (after Bunny CDN upload)
  exportUrl?: string;                // Final video URL on Bunny CDN
  thumbnailUrl?: string;             // Thumbnail URL on Bunny CDN
  
  // Export settings
  resolution: string;                // '720p' | '1080p' | '4k'
  format: string;                    // 'mp4'
  
  // Video metadata
  duration: number;                  // Total duration in seconds
  aspectRatio?: string;              // '16:9', '9:16', etc.
  sceneCount?: number;               // Number of scenes
  
  // Timestamps
  startedAt?: string;                // ISO timestamp when render started
  completedAt?: string;              // ISO timestamp when render completed
  
  // Error handling
  error?: string;                    // Error message if failed
}

// Types for Step1Data and Step4Data (narrative-specific)
interface NarrativeStep1Data {
  narrativeMode?: 'image-reference' | 'start-end' | 'auto';
  aspectRatio?: string;
  script?: string;
  duration?: string;
}

interface ShotVersion {
  id: string;
  shotId: string;
  imageUrl?: string | null;
  startFrameUrl?: string | null;
  endFrameUrl?: string | null;
  videoUrl?: string | null;
  imagePrompt?: string;
  videoPrompt?: string;
  status?: string;
}

interface NarrativeStep4Data {
  shotVersions?: Record<string, ShotVersion[]>;
  prompts?: Record<string, any>;
}

interface VolumeSettings {
  master: number;
  sfx: number;
  voiceover: number;
  music: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHOTSTACK STUDIO EDIT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/narrative/videos/:id/preview/studio-edit
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

    const step1Data = video.step1Data as NarrativeStep1Data | undefined;
    const step3Data = video.step3Data as Step3Data | undefined;
    const step4Data = video.step4Data as NarrativeStep4Data | undefined;
    const step5Data = video.step5Data as Step5Data | undefined;

    // Check required data
    if (!step3Data?.scenes || !step3Data?.shots) {
      return res.status(400).json({ 
        error: 'Missing required data',
        details: {
          hasScenes: !!step3Data?.scenes,
          hasShots: !!step3Data?.shots,
        }
      });
    }

    const shotVersions = step4Data?.shotVersions || {};
    
    console.log('[narrative-preview:studio-edit] Building timeline:', {
      narrativeMode: step1Data?.narrativeMode,
      sceneCount: step3Data.scenes.length,
      shotCount: Object.values(step3Data.shots).flat().length,
      shotVersionsCount: Object.keys(shotVersions).length,
    });

    // Determine animation mode based on narrative mode
    // image-reference uses images, start-end uses videos
    const narrativeMode = step1Data?.narrativeMode || 'image-reference';
    const animationMode = narrativeMode === 'start-end' ? 'video-animation' : 'image-transitions';

    // Get aspect ratio
    const aspectRatio = step1Data?.aspectRatio || '16:9';
    const [width, height] = getResolutionFromAspectRatio(aspectRatio);

    // Build tracks array for Shotstack Edit
    const tracks: Array<{
      clips: Array<{
        asset: {
          type: string;
          src?: string;
          [key: string]: unknown;
        };
        start: number;
        length: number;
        [key: string]: unknown;
      }>;
    }> = [];

    // Build video/image clips
    const mediaClips: Array<{
      asset: {
        type: string;
        src?: string;
        [key: string]: unknown;
      };
      start: number;
      length: number;
      [key: string]: unknown;
    }> = [];

    let currentTime = 0;
    let clipCount = 0;

    // Process scenes in order
    const sortedScenes = [...step3Data.scenes].sort((a, b) => a.sceneNumber - b.sceneNumber);
    
    for (const scene of sortedScenes) {
      const sceneShots = step3Data.shots[scene.id] || [];
      const sortedShots = [...sceneShots].sort((a, b) => a.shotNumber - b.shotNumber);
      
      for (const shot of sortedShots) {
        const versions = shotVersions[shot.id] || [];
        const currentVersion = versions.length > 0 ? versions[versions.length - 1] : null;
        
        // Get media URL based on narrative mode
        let mediaUrl: string | null = null;
        let mediaType: 'video' | 'image' = 'image';
        
        if (currentVersion) {
          if (narrativeMode === 'start-end' && currentVersion.videoUrl) {
            mediaUrl = currentVersion.videoUrl;
            mediaType = 'video';
          } else {
            // For image-reference mode or fallback
            mediaUrl = currentVersion.imageUrl || currentVersion.startFrameUrl || null;
            mediaType = 'image';
          }
        }
        
        if (mediaUrl) {
          const clipDuration = shot.duration || 5;
          
          mediaClips.push({
            asset: {
              type: mediaType,
              src: mediaUrl,
            },
            start: currentTime,
            length: clipDuration,
            fit: 'contain',
            transition: shot.transition ? {
              in: shot.transition,
              out: shot.transition,
            } : undefined,
          });
          
          currentTime += clipDuration;
          clipCount++;
        }
      }
    }

    // Add video/image track
    if (mediaClips.length > 0) {
      tracks.push({ clips: mediaClips });
    }

    // Build audio tracks
    // SFX clips track
    const sfxClips: Array<{
      asset: { type: string; src?: string };
      start: number;
      length: number;
    }> = [];
    
    if (step5Data?.shotsWithSFX) {
      let sfxTime = 0;
      for (const scene of sortedScenes) {
        const sceneShots = step3Data.shots[scene.id] || [];
        const sortedShots = [...sceneShots].sort((a, b) => a.shotNumber - b.shotNumber);
        
        for (const shot of sortedShots) {
          const sfxData = step5Data.shotsWithSFX[shot.id];
          if (sfxData?.soundEffectUrl) {
            sfxClips.push({
              asset: {
                type: 'audio',
                src: sfxData.soundEffectUrl,
              },
              start: sfxTime,
              length: shot.duration || 5,
            });
          }
          sfxTime += shot.duration || 5;
        }
      }
    }
    
    if (sfxClips.length > 0) {
      tracks.push({ clips: sfxClips });
    }

    // Voiceover track
    if (step5Data?.voiceoverAudioUrl) {
      tracks.push({
        clips: [{
          asset: {
            type: 'audio',
            src: step5Data.voiceoverAudioUrl,
          },
          start: 0,
          length: step5Data.voiceoverDuration || currentTime,
        }],
      });
    }

    // Music track
    const musicUrl = step5Data?.customMusicUrl || step5Data?.generatedMusicUrl;
    if (musicUrl) {
      tracks.push({
        clips: [{
          asset: {
            type: 'audio',
            src: musicUrl,
          },
          start: 0,
          length: step5Data?.generatedMusicDuration || currentTime,
        }],
      });
    }

    // Build the complete Shotstack Edit JSON
    const shotstackEdit = {
      timeline: {
        tracks,
        background: '#000000',
      },
      output: {
        format: 'mp4',
        resolution: 'hd',
        fps: 30,
        size: {
          width,
          height,
        },
      },
    };

    // Default volume settings
    const savedVolumes: VolumeSettings = {
      master: 1,
      sfx: 0.8,
      voiceover: 0.9,
      music: 0.3,
    };

    console.log('[narrative-preview:studio-edit] Built Shotstack Edit:', {
      trackCount: tracks.length,
      totalDuration: currentTime,
      clipCount,
      hasVoiceover: !!step5Data?.voiceoverAudioUrl,
      hasMusic: !!musicUrl,
      sfxCount: sfxClips.length,
    });

    res.json({
      edit: shotstackEdit,
      totalDuration: currentTime,
      clipCount,
      savedVolumes,
      animationMode,
    });
  } catch (error) {
    console.error('[narrative-preview:studio-edit] Error:', error);
    res.status(500).json({ error: 'Failed to build preview data' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get width and height from aspect ratio string
 */
function getResolutionFromAspectRatio(aspectRatio: string): [number, number] {
  switch (aspectRatio) {
    case '16:9':
      return [1920, 1080];
    case '9:16':
      return [1080, 1920];
    case '1:1':
      return [1080, 1080];
    case '4:3':
      return [1440, 1080];
    case '4:5':
      return [1080, 1350];
    default:
      return [1920, 1080];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT PHASE - TRANSITION FROM PREVIEW
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PATCH /api/narrative/videos/:id/step/preview/continue-to-export
 * Transition from Preview to Export phase
 * 
 * Called when user confirms export from Preview phase
 * - Saves final audio volume settings
 * - Creates step7Data with render state
 * - Updates currentStep to export, adds preview to completedSteps
 */
router.patch('/videos/:id/step/preview/continue-to-export', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId } = req.params;
    const { volumes } = req.body; // Audio volumes from mixer

    console.log('[narrative-preview:export] Step preview -> export transition requested:', {
      videoId,
      hasVolumes: !!volumes,
      receivedVolumes: volumes,
    });

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = video.step1Data as NarrativeStep1Data | null;
    const step3Data = video.step3Data as Step3Data | undefined;
    const step5Data = video.step5Data as Step5Data | undefined;

    if (!step3Data?.scenes || !step3Data?.shots) {
      return res.status(400).json({ error: 'No timeline data found. Complete preview step first.' });
    }

    // Calculate total duration from scenes and shots
    let totalDuration = 0;
    for (const scene of step3Data.scenes) {
      const sceneShots = step3Data.shots[scene.id] || [];
      for (const shot of sceneShots) {
        totalDuration += shot.duration || 5;
      }
    }

    // Create initial step7Data
    const step7Data: Step7Data = {
      renderStatus: 'pending',
      renderProgress: 0,
      resolution: '1080p',
      format: 'mp4',
      duration: totalDuration,
      aspectRatio: step1Data?.aspectRatio || '16:9',
      sceneCount: step3Data.scenes.length,
      startedAt: new Date().toISOString(),
    };

    // Build completed steps array
    const completedSteps = Array.isArray(video.completedSteps)
      ? [...video.completedSteps]
      : [];

    // Add preview step if not already completed (assuming preview is step 5 or 6)
    // Note: Narrative mode uses different step naming, adjust as needed
    const currentStep = video.currentStep || 5;
    if (!completedSteps.includes(currentStep)) {
      completedSteps.push(currentStep);
    }

    // Update video: mark preview complete, move to export, save step7Data
    await storage.updateVideo(videoId, {
      currentStep: currentStep + 1,
      completedSteps,
      step7Data,
      status: 'rendering',
    });

    console.log('[narrative-preview:export] Preview completed, moved to Export:', {
      videoId,
      currentStep: currentStep + 1,
      completedSteps,
      totalDuration,
      renderStatus: 'pending',
    });

    res.json({
      success: true,
      step7Data,
      message: 'Moved to export phase. Render will start shortly.',
    });
  } catch (error) {
    console.error('[narrative-preview:export] Transition error:', error);
    res.status(500).json({ error: 'Failed to continue to export' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT PHASE - START RENDER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/narrative/videos/:id/export/start-render
 * Start the Shotstack final render
 * 
 * Called after step7Data is created to trigger the actual render
 */
router.post('/videos/:id/export/start-render', isAuthenticated, async (req: Request, res: Response) => {
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

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step7Data = video.step7Data as Step7Data | undefined;
    if (!step7Data) {
      return res.status(400).json({ error: 'Export not initialized. Call continue-to-export first.' });
    }

    // If already rendering or done, return current state
    if (step7Data.renderStatus !== 'pending' && step7Data.renderStatus !== 'failed') {
      return res.json({
        renderId: step7Data.renderId,
        renderStatus: step7Data.renderStatus,
        renderProgress: step7Data.renderProgress,
      });
    }

    console.log('[narrative-preview:export] Starting render for video:', videoId);

    const step1Data = video.step1Data as NarrativeStep1Data | undefined;
    const step3Data = video.step3Data as Step3Data | undefined;
    const step4Data = video.step4Data as NarrativeStep4Data | undefined;
    const step5Data = video.step5Data as Step5Data | undefined;

    if (!step3Data?.scenes || !step3Data?.shots) {
      return res.status(400).json({ error: 'Missing scene/shot data' });
    }

    const shotVersions = step4Data?.shotVersions || {};
    const narrativeMode = step1Data?.narrativeMode || 'image-reference';
    const animationMode = narrativeMode === 'start-end' ? 'video-animation' : 'image-transitions';
    const aspectRatio = step1Data?.aspectRatio || '16:9';

    // Build timeline scenes
    const timelineScenes: TimelineScene[] = step3Data.scenes.map((scene, idx) => ({
      id: scene.id,
      sceneNumber: idx + 1,
      title: scene.title || `Scene ${idx + 1}`,
      description: scene.description,
      duration: scene.duration,
      loopCount: 1,
    }));

    // Build timeline shots
    const timelineShots: Record<string, TimelineShot[]> = {};
    for (const sceneId of Object.keys(step3Data.shots)) {
      const sceneShots = step3Data.shots[sceneId] || [];
      timelineShots[sceneId] = sceneShots.map((shot, idx) => ({
        id: shot.id,
        sceneId: shot.sceneId,
        shotNumber: idx + 1,
        duration: shot.duration || 5,
        loopCount: 1,
        transition: shot.transition,
        soundEffectDescription: null,
        soundEffectUrl: null,
        cameraMovement: shot.cameraMovement,
      }));
    }

    // Build shot versions for timeline
    const timelineShotVersions: Record<string, TimelineShotVersion[]> = {};
    for (const shotId of Object.keys(shotVersions)) {
      const versions = shotVersions[shotId] || [];
      timelineShotVersions[shotId] = versions.map((v) => {
        let imageUrl: string | null = null;
        if (narrativeMode === 'start-end') {
          // For start-end mode, prefer videoUrl
          imageUrl = v.videoUrl || v.imageUrl || v.startFrameUrl || null;
        } else {
          // For image-reference mode
          imageUrl = v.imageUrl || v.startFrameUrl || null;
        }
        
        return {
          id: v.id,
          shotId: v.shotId,
          videoUrl: v.videoUrl,
          imageUrl: imageUrl,
          soundEffectPrompt: null,
        };
      });
    }

    // Build audio tracks
    const audioTracks: TimelineBuilderInput['audioTracks'] = {};
    
    // Voiceover
    if (step5Data?.voiceoverAudioUrl) {
      audioTracks.voiceover = {
        src: step5Data.voiceoverAudioUrl,
        volume: 1,
        fadeIn: true,
        fadeOut: true,
      };
    }

    // Music
    const musicUrl = step5Data?.customMusicUrl || step5Data?.generatedMusicUrl;
    if (musicUrl) {
      audioTracks.music = {
        src: musicUrl,
        volume: 0.5,
        fadeIn: true,
        fadeOut: true,
      };
    }

    // Volume settings
    const volumes: ShotstackVolumeSettings = {
      master: 1,
      sfx: 0.8,
      voiceover: 0.9,
      music: 0.3,
      ambient: 0,
    };

    // Output settings (final quality)
    const outputSettings: OutputSettings = {
      format: 'mp4',
      resolution: '1080',
      aspectRatio: aspectRatio,
      fps: 30,
      thumbnail: {
        capture: 1,
        scale: 0.5,
      },
    };

    // Build SFX clips from step5Data
    const sfxClips: Array<{
      id: string;
      src: string;
      start: number;
      duration: number;
      shotId: string;
      volume: number;
    }> = [];
    
    if (step5Data?.shotsWithSFX) {
      let sfxTime = 0;
      for (const scene of step3Data.scenes) {
        const sceneShots = step3Data.shots[scene.id] || [];
        const sortedShots = [...sceneShots].sort((a, b) => a.shotNumber - b.shotNumber);
        
        for (const shot of sortedShots) {
          const sfxData = step5Data.shotsWithSFX[shot.id];
          if (sfxData?.soundEffectUrl) {
            sfxClips.push({
              id: `sfx-${shot.id}`,
              src: sfxData.soundEffectUrl,
              start: sfxTime,
              duration: shot.duration || 5,
              shotId: shot.id,
              volume: 0.8,
            });
          }
          sfxTime += shot.duration || 5;
        }
      }
    }

    // Build timeline input
    const timelineInput: TimelineBuilderInput = {
      scenes: timelineScenes,
      shots: timelineShots,
      shotVersions: timelineShotVersions,
      audioTracks,
      sfxClips,
      volumes,
      output: outputSettings,
      animationMode,
    };

    // Validate input
    const errors = validateTimelineInput(timelineInput);
    if (errors.length > 0) {
      console.error('[narrative-preview:export] Timeline validation errors:', errors);
      return res.status(400).json({ 
        error: 'Invalid timeline data', 
        details: errors 
      });
    }

    // Build Shotstack timeline
    const result = buildShotstackTimeline(timelineInput);

    console.log('[narrative-preview:export] Built Shotstack timeline:', {
      trackCount: result.edit.timeline.tracks.length,
      totalDuration: result.totalDuration,
      clipCount: result.clipCount,
    });

    // Submit to Shotstack
    const client = getShotstackClient();
    const renderResponse = await client.render(result.edit);

    console.log('[narrative-preview:export] Render submitted:', {
      renderId: renderResponse.response.id,
      status: renderResponse.response.status,
    });

    // Update step7Data with render ID
    const updatedStep7Data: Step7Data = {
      ...step7Data,
      renderId: renderResponse.response.id,
      renderStatus: 'queued',
      renderProgress: 5,
    };

    await storage.updateVideo(videoId, {
      step7Data: updatedStep7Data,
    });

    res.json({
      success: true,
      renderId: renderResponse.response.id,
      renderStatus: 'queued',
      renderProgress: 5,
    });
  } catch (error) {
    console.error('[narrative-preview:export] Render error:', error);
    
    // Update step7Data with error
    const video = await storage.getVideo(req.params.id);
    if (video?.step7Data) {
      await storage.updateVideo(req.params.id, {
        step7Data: {
          ...(video.step7Data as Step7Data),
          renderStatus: 'failed',
          error: error instanceof Error ? error.message : 'Failed to start render',
        },
      });
    }
    
    res.status(500).json({ error: 'Failed to start export render' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT PHASE - STATUS POLLING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/narrative/videos/:id/export/status
 * Get export status and handle completion
 * 
 * Polls Shotstack render status and when complete:
 * - Downloads video from Shotstack temporary URL
 * - Uploads to Bunny CDN
 * - Updates exportUrl, thumbnailUrl, status columns
 */
router.get('/videos/:id/export/status', isAuthenticated, async (req: Request, res: Response) => {
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

    const step7Data = video.step7Data as Step7Data | undefined;
    if (!step7Data) {
      return res.status(400).json({ error: 'Export not initialized' });
    }

    // If already done, uploading, or failed, return current state (prevents duplicate uploads)
    if (step7Data.renderStatus === 'done' || step7Data.renderStatus === 'failed' || step7Data.renderStatus === 'uploading') {
      return res.json({
        renderStatus: step7Data.renderStatus,
        renderProgress: step7Data.renderProgress,
        exportUrl: step7Data.exportUrl || video.exportUrl,
        thumbnailUrl: step7Data.thumbnailUrl || video.thumbnailUrl,
        error: step7Data.error,
      });
    }

    // If no render ID yet, render hasn't started
    if (!step7Data.renderId) {
      return res.json({
        renderStatus: step7Data.renderStatus,
        renderProgress: step7Data.renderProgress,
        message: 'Render not started yet',
      });
    }

    // Check Shotstack configuration
    if (!isShotstackConfigured()) {
      return res.status(503).json({ error: 'Shotstack not configured' });
    }

    // Get status from Shotstack
    const client = getShotstackClient();
    const statusResponse = await client.getRenderStatus(step7Data.renderId);

    const shotstackStatus = statusResponse.response.status;
    const shotstackUrl = statusResponse.response.url;
    const thumbnailUrl = statusResponse.response.thumbnail;

    console.log('[narrative-preview:export] Status check:', {
      renderId: step7Data.renderId,
      status: shotstackStatus,
      hasUrl: !!shotstackUrl,
      hasThumbnail: !!thumbnailUrl,
    });

    // Map Shotstack status to progress
    let renderProgress = step7Data.renderProgress;
    let renderStatus: Step7Data['renderStatus'] = step7Data.renderStatus;

    switch (shotstackStatus) {
      case 'queued':
        renderProgress = 10;
        renderStatus = 'queued';
        break;
      case 'fetching':
        renderProgress = 30;
        renderStatus = 'fetching';
        break;
      case 'rendering':
        renderProgress = 60;
        renderStatus = 'rendering';
        break;
      case 'saving':
        renderProgress = 85;
        renderStatus = 'saving';
        break;
      case 'done':
        renderProgress = 95;
        renderStatus = 'done';
        break;
      case 'failed':
        renderProgress = 0;
        renderStatus = 'failed';
        break;
    }

    // If render is complete, upload to Bunny CDN
    if (shotstackStatus === 'done' && shotstackUrl) {
      try {
        // IMMEDIATELY set status to 'uploading' to prevent duplicate uploads
        await storage.updateVideo(videoId, {
          step7Data: {
            ...step7Data,
            renderStatus: 'uploading',
            renderProgress: 95,
          },
        });

        console.log('[narrative-preview:export] Render complete, uploading to Bunny CDN:', {
          videoId,
          shotstackUrl,
        });

        // Get workspace info
        const workspaces = await storage.getWorkspacesByUserId(userId);
        const currentWorkspace = workspaces.find(w => w.id === video.workspaceId) || workspaces[0];
        const workspaceName = currentWorkspace?.name || 'default';

        // Build Bunny CDN path
        const videoTitle = video.title || 'untitled';
        const truncatedTitle = videoTitle.slice(0, 50).replace(/[^a-zA-Z0-9_-]/g, '_') || 'export';
        const dateLabel = video.createdAt
          ? new Date(video.createdAt).toISOString().slice(0, 10).replace(/-/g, "")
          : new Date().toISOString().slice(0, 10).replace(/-/g, "");

        // Download video from Shotstack
        const videoResponse = await fetch(shotstackUrl);
        if (!videoResponse.ok) {
          throw new Error('Failed to download video from Shotstack');
        }
        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

        // Upload video to Bunny CDN
        const videoFilename = `final_video_${Date.now()}.mp4`;
        const videoBunnyPath = buildVideoModePath({
          userId,
          workspaceName,
          toolMode: 'narrative',
          projectName: truncatedTitle,
          subFolder: 'Final',
          filename: videoFilename,
          dateLabel,
        });

        const exportUrl = await bunnyStorage.uploadFile(videoBunnyPath, videoBuffer, 'video/mp4');
        console.log('[narrative-preview:export] Video uploaded to Bunny CDN:', exportUrl);

        // Handle thumbnail if available from Shotstack
        let finalThumbnailUrl: string | undefined;
        if (thumbnailUrl) {
          try {
            const thumbResponse = await fetch(thumbnailUrl);
            if (thumbResponse.ok) {
              const thumbBuffer = Buffer.from(await thumbResponse.arrayBuffer());
              const thumbFilename = `thumbnail_${Date.now()}.jpg`;
              const thumbBunnyPath = buildVideoModePath({
                userId,
                workspaceName,
                toolMode: 'narrative',
                projectName: truncatedTitle,
                subFolder: 'Final',
                filename: thumbFilename,
                dateLabel,
              });
              finalThumbnailUrl = await bunnyStorage.uploadFile(thumbBunnyPath, thumbBuffer, 'image/jpeg');
              console.log('[narrative-preview:export] Thumbnail uploaded to Bunny CDN:', finalThumbnailUrl);
            }
          } catch (thumbError) {
            console.error('[narrative-preview:export] Thumbnail upload error:', thumbError);
            // Continue without thumbnail
          }
        }

        // Update step7Data with final URLs
        const completedStep7Data: Step7Data = {
          ...step7Data,
          renderStatus: 'done',
          renderProgress: 100,
          exportUrl,
          thumbnailUrl: finalThumbnailUrl,
          completedAt: new Date().toISOString(),
        };

        // Update video with final data
        await storage.updateVideo(videoId, {
          step7Data: completedStep7Data,
          exportUrl,
          thumbnailUrl: finalThumbnailUrl,
          status: 'completed',
        });

        console.log('[narrative-preview:export] Export completed:', {
          videoId,
          exportUrl,
          thumbnailUrl: finalThumbnailUrl,
        });

        return res.json({
          renderStatus: 'done',
          renderProgress: 100,
          exportUrl,
          thumbnailUrl: finalThumbnailUrl,
        });
      } catch (uploadError) {
        console.error('[narrative-preview:export] Upload error:', uploadError);
        
        // Update step7Data with error
        await storage.updateVideo(videoId, {
          step7Data: {
            ...step7Data,
            renderStatus: 'failed',
            error: uploadError instanceof Error ? uploadError.message : 'Failed to upload to CDN',
          },
        });

        return res.status(500).json({
          renderStatus: 'failed',
          error: 'Failed to upload to CDN',
        });
      }
    }

    // If failed, update step7Data
    if (shotstackStatus === 'failed') {
      await storage.updateVideo(videoId, {
        step7Data: {
          ...step7Data,
          renderStatus: 'failed',
          error: statusResponse.response.error || 'Render failed',
        },
        status: 'failed',
      });

      return res.json({
        renderStatus: 'failed',
        renderProgress: 0,
        error: statusResponse.response.error || 'Render failed',
      });
    }

    // Update progress in step7Data
    if (renderProgress !== step7Data.renderProgress || renderStatus !== step7Data.renderStatus) {
      await storage.updateVideo(videoId, {
        step7Data: {
          ...step7Data,
          renderStatus,
          renderProgress,
        },
      });
    }

    res.json({
      renderStatus,
      renderProgress,
    });
  } catch (error) {
    console.error('[narrative-preview:export] Status error:', error);
    res.status(500).json({ error: 'Failed to get export status' });
  }
});

export default router;

