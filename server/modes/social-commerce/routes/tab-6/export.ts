/**
 * Export Routes (Tab 6)
 * 
 * Handles export status checking, render triggering, and export management
 * for Social Commerce mode.
 */

import { Router, Request, Response } from 'express';
import { isAuthenticated, getCurrentUserId } from '../../../../auth';
import { storage } from '../../../../storage';
import {
  getShotstackClient,
  buildShotstackTimeline,
  isShotstackConfigured,
  type TimelineBuilderInput,
  type VolumeSettings,
  type OutputSettings,
} from '../../../../integrations/shotstack';
import { bunnyStorage, buildVideoModePath } from '../../../../storage/bunny-storage';
import type {
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
  Step5Data,
  Step6Data,
  NarrativeOutput,
} from '../../types';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Normalize voiceover duration to seconds
 * Handles both seconds (normal) and milliseconds (legacy) formats
 * Duration is ALWAYS stored in seconds according to VoiceoverAudioData interface
 */
function normalizeVoiceoverDuration(duration: number | undefined, defaultValue: number = 12): number {
  if (!duration || duration <= 0) {
    return defaultValue;
  }
  
  // If duration is unreasonably large (> 1000), assume it's in milliseconds (legacy data)
  if (duration > 1000) {
    const seconds = duration / 1000;
    console.warn(`[Export] Legacy duration format detected: ${duration}ms → ${seconds}s`);
    return Math.max(0, Math.min(seconds, 300)); // Clamp to 0-300s
  }
  
  // Duration is in seconds (normal case)
  // Clamp to reasonable range (0-300 seconds)
  return Math.max(0, Math.min(duration, 300));
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER STEPS FOR PROGRESS TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

const RENDER_STATUS_PROGRESS: Record<string, number> = {
  pending: 0,
  queued: 10,
  fetching: 30,
  rendering: 60,
  saving: 85,
  uploading: 95,
  done: 100,
  failed: 0,
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET /status/:videoId - Get export status
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/status/:videoId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { videoId } = req.params;

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step5Data = video.step5Data as Step5Data | undefined;
    const animaticRender = step5Data?.animatic?.render;

    // If render is already done, return cached status
    if (animaticRender?.status === 'done') {
      return res.json({
        renderStatus: 'done',
        renderProgress: 100,
        exportUrl: animaticRender.url || step5Data?.exportUrl || video.exportUrl,
        thumbnailUrl: animaticRender.thumbnailUrl || step5Data?.thumbnailUrl || video.thumbnailUrl,
      });
    }

    // If render failed, return error status
    if (animaticRender?.status === 'failed') {
      return res.json({
        renderStatus: 'failed',
        renderProgress: 0,
        error: animaticRender.error || 'Render failed',
      });
    }

    // If no render ID, render hasn't started
    if (!animaticRender?.id) {
      return res.json({
        renderStatus: 'pending',
        renderProgress: 0,
        message: 'Render not started yet',
      });
    }

    // Check Shotstack status
    if (!isShotstackConfigured()) {
      return res.json({
        renderStatus: animaticRender.status || 'pending',
        renderProgress: RENDER_STATUS_PROGRESS[animaticRender.status || 'pending'],
        message: 'Shotstack not configured',
      });
    }

    // Poll Shotstack for current status
    const client = getShotstackClient();
    const statusResponse = await client.getRenderStatus(animaticRender.id);

    const shotstackStatus = statusResponse.response.status;
    const shotstackUrl = statusResponse.response.url;
    const thumbnailUrl = statusResponse.response.thumbnail;

    // Map status to progress
    let renderProgress = RENDER_STATUS_PROGRESS[shotstackStatus] || 0;
    let renderStatus = shotstackStatus;

    // If done, update database with export URL
    if (shotstackStatus === 'done' && shotstackUrl) {
      // Upload to Bunny CDN if configured
      let finalUrl = shotstackUrl;
      let finalThumbnail = thumbnailUrl;

      if (bunnyStorage.isBunnyConfigured()) {
        try {
          // Download from Shotstack and upload to Bunny
          console.log('[Export] Uploading to Bunny CDN...');
          
          const videoResponse = await fetch(shotstackUrl);
          const videoBuffer = await videoResponse.arrayBuffer();
          
          // Get workspace name for path
          const workspaces = await storage.getWorkspacesByUserId(userId);
          const workspace = workspaces.find(w => w.id === video.workspaceId);
          const workspaceName = workspace?.name || video.workspaceId || 'default';
          
          const exportPath = buildVideoModePath({
            userId,
            workspaceName,
            toolMode: 'commerce',
            projectName: video.title || videoId,
            subFolder: 'Export',
            filename: `final-export-${Date.now()}.mp4`
          });
          
          const cdnUrl = await bunnyStorage.uploadFile(
            exportPath,
            Buffer.from(videoBuffer),
            'video/mp4'
          );
          
          if (cdnUrl) {
            finalUrl = cdnUrl;
            console.log('[Export] Uploaded to Bunny:', finalUrl);
          }

          // Upload thumbnail if available
          if (thumbnailUrl) {
            const thumbResponse = await fetch(thumbnailUrl);
            const thumbBuffer = await thumbResponse.arrayBuffer();
            
            const thumbPath = buildVideoModePath({
              userId,
              workspaceName,
              toolMode: 'commerce',
              projectName: video.title || videoId,
              subFolder: 'Export',
              filename: `thumbnail-${Date.now()}.jpg`
            });
            
            const thumbCdnUrl = await bunnyStorage.uploadFile(
              thumbPath,
              Buffer.from(thumbBuffer),
              'image/jpeg'
            );
            
            if (thumbCdnUrl) {
              finalThumbnail = thumbCdnUrl;
            }
          }
        } catch (uploadError) {
          console.error('[Export] Bunny upload failed, using Shotstack URL:', uploadError);
        }
      }

      // Update database
      await storage.updateVideo(videoId, {
        step5Data: {
          ...step5Data,
          animatic: {
            ...step5Data?.animatic,
            render: {
              ...animaticRender,
              status: 'done',
              progress: 100,
              url: finalUrl,
              thumbnailUrl: finalThumbnail,
              completedAt: new Date().toISOString(),
            },
          },
          exportUrl: finalUrl,
          thumbnailUrl: finalThumbnail,
        },
        exportUrl: finalUrl,
        thumbnailUrl: finalThumbnail,
        status: 'completed',
      });

      return res.json({
        renderStatus: 'done',
        renderProgress: 100,
        exportUrl: finalUrl,
        thumbnailUrl: finalThumbnail,
      });
    }

    // Update progress in database
    if (animaticRender.status !== shotstackStatus) {
      await storage.updateVideo(videoId, {
        step5Data: {
          ...step5Data,
          animatic: {
            ...step5Data?.animatic,
            render: {
              ...animaticRender,
              status: shotstackStatus as any,
              progress: renderProgress,
            },
          },
        },
      });
    }

    res.json({
      renderStatus,
      renderProgress,
      exportUrl: null,
      thumbnailUrl: null,
    });
  } catch (error) {
    console.error('[Export] Status error:', error);
    res.status(500).json({
      error: 'Failed to get export status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /start-render/:videoId - Start Shotstack render
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/start-render/:videoId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!isShotstackConfigured()) {
      return res.status(503).json({
        error: 'Shotstack not configured. Set SHOTSTACK_API_KEY environment variable.',
      });
    }

    const { videoId } = req.params;
    const { quality = 'final' } = req.body;

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step5Data = video.step5Data as Step5Data | undefined;
    const animaticRender = step5Data?.animatic?.render;

    // If already rendering or done, return current state
    if (animaticRender?.status && !['pending', 'failed'].includes(animaticRender.status)) {
      return res.json({
        success: true,
        renderId: animaticRender.id,
        renderStatus: animaticRender.status,
        renderProgress: animaticRender.progress || RENDER_STATUS_PROGRESS[animaticRender.status],
      });
    }

    // Get required data for building timeline
    const step1Data = video.step1Data as Step1Data | undefined;
    const step2Data = video.step2Data as Step2Data | undefined;
    const step3Data = video.step3Data as Step3Data | undefined;
    const step4Data = video.step4Data as Step4Data | undefined;

    const narrative = step2Data?.narrative as NarrativeOutput | undefined;
    const visualBeats = narrative?.visual_beats || [];
    const beatVideos = step3Data?.beatVideos || {};
    const voiceoverAudios = step4Data?.voiceoverAudios || {};

    // Build scenes and shots for timeline
    const scenes: any[] = [];
    const shots: Record<string, any[]> = {};
    const shotVersions: Record<string, any[]> = {};

    const beatIds: Array<'beat1' | 'beat2' | 'beat3'> = ['beat1', 'beat2', 'beat3'];
    let sceneNumber = 1;

    for (const beatId of beatIds) {
      const beatVideo = beatVideos[beatId];
      const beatInfo = visualBeats.find(b => b.beatId === beatId);

      if (beatVideo?.videoUrl) {
        const sceneId = `scene-${beatId}`;
        const shotId = `shot-${beatId}`;

        scenes.push({
          id: sceneId,
          sceneNumber,
          title: beatInfo?.beatName || `Beat ${sceneNumber}`,
          description: beatInfo?.beatDescription || '',
          duration: 12,
          loopCount: 1,
        });

        shots[sceneId] = [{
          id: shotId,
          sceneId,
          shotNumber: 1,
          duration: 12,
          loopCount: 1,
          transition: sceneNumber < beatIds.filter(id => beatVideos[id]?.videoUrl).length ? 'fade' : undefined,
        }];

        shotVersions[shotId] = [{
          id: `${shotId}-v1`,
          shotId,
          videoUrl: beatVideo.videoUrl,
        }];

        sceneNumber++;
      }
    }

    if (scenes.length === 0) {
      return res.status(400).json({ error: 'No beat videos found. Generate beats first.' });
    }

    // Get saved volumes or use defaults
    // Note: 'video' controls embedded Sora audio (applied to video clips)
    const savedVolumes = step5Data?.animatic?.volumes || {
      voiceover: 1,
      video: 1,
    };

    // For Shotstack, video embedded audio is part of the clip itself
    // Ensure master is never 0 (to preserve embedded video audio)
    // If user set video volume to 0, use minimum 0.01 to ensure audio track is created
    const volumes: VolumeSettings = {
      master: Math.max(0.01, savedVolumes.video), // Ensure video audio is always present
      sfx: 0,
      voiceover: savedVolumes.voiceover,
      music: 0, // No separate music track - Sora videos have embedded audio
      ambient: 0,
    };

    // Build audio tracks
    const audioTracks: TimelineBuilderInput['audioTracks'] = {};

    // Build voiceover clips for each beat (using sfxClips for multiple clips)
    const voiceoverClips: Array<{ id: string; src: string; start: number; duration: number; shotId: string }> = [];
    
    // Debug: Log voiceover and video data
    console.log('[Export] Voiceover data check:', {
      voiceOverEnabled: step1Data?.voiceOverEnabled,
      voiceoverAudiosKeys: Object.keys(voiceoverAudios),
      beatVideosKeys: Object.keys(beatVideos),
      voiceoverAudios: Object.entries(voiceoverAudios).map(([key, val]: [string, any]) => ({
        beatId: key,
        hasAudioUrl: !!val?.audioUrl,
        audioUrl: val?.audioUrl,
        duration: val?.duration,
      })),
    });
    
    if (step1Data?.voiceOverEnabled) {
      let currentTime = 0;
      const beatIds: Array<'beat1' | 'beat2' | 'beat3'> = ['beat1', 'beat2', 'beat3'];
      
      for (const beatId of beatIds) {
        const voiceoverAudio = voiceoverAudios[beatId];
        const beatVideo = beatVideos[beatId];
        
        // Debug logging for each beat
        console.log(`[Export] Processing ${beatId}:`, {
          hasVoiceoverAudio: !!voiceoverAudio,
          voiceoverAudioUrl: voiceoverAudio?.audioUrl,
          voiceoverDuration: voiceoverAudio?.duration,
          hasBeatVideo: !!beatVideo,
          beatVideoUrl: beatVideo?.videoUrl,
          currentTime,
        });
        
        // Add voiceover if it exists (even if video doesn't exist yet)
        // But only add it at the correct time position matching the video timeline
        if (voiceoverAudio?.audioUrl) {
          // Duration is ALWAYS stored in seconds (see VoiceoverAudioData interface)
          // Use helper function to normalize and validate duration
          const rawDuration = normalizeVoiceoverDuration(voiceoverAudio.duration, 12);
          
          // Use currentTime if video exists (to match video timeline)
          // Otherwise calculate position based on beat index
          const startTime = beatVideo?.videoUrl 
            ? currentTime 
            : (beatIds.indexOf(beatId) * 12);
          
          // Cap duration at beat duration (12 seconds) but log if it's longer
          const finalDuration = Math.min(rawDuration, 12);
          if (rawDuration > 12) {
            console.log(`[Export] Warning: ${beatId} voiceover duration (${rawDuration}s) exceeds beat duration (12s), capping to 12s`);
          }
          
          voiceoverClips.push({
            id: `voiceover-${beatId}`,
            src: voiceoverAudio.audioUrl,
            start: startTime,
            duration: finalDuration,
            shotId: `shot-${beatId}`, // Match the shot ID from scenes/shots
          });
          
          console.log(`[Export] ✓ Added voiceover for ${beatId} at ${startTime}s (duration: ${finalDuration}s, raw: ${voiceoverAudio.duration}s)`);
        } else {
          console.log(`[Export] ✗ Skipping voiceover for ${beatId}:`, {
            reason: !voiceoverAudio ? 'no voiceoverAudio object' : !voiceoverAudio.audioUrl ? 'no audioUrl' : 'unknown',
          });
        }
        
        // Move to next beat position (each beat is 12 seconds)
        // Only advance time if video exists (to match video timeline)
        if (beatVideo?.videoUrl) {
          currentTime += 12;
        }
      }
      
      console.log('[Export] Voiceover clips summary:', {
        totalClips: voiceoverClips.length,
        clips: voiceoverClips.map(c => ({
          id: c.id,
          start: c.start,
          duration: c.duration,
          shotId: c.shotId,
        })),
      });
      
      // If we have voiceover clips, use sfxClips to add them
      // Otherwise, use single voiceover track (backward compatibility)
      if (voiceoverClips.length === 0) {
        const firstVoiceover = voiceoverAudios['beat1']?.audioUrl ||
                              voiceoverAudios['beat2']?.audioUrl ||
                              voiceoverAudios['beat3']?.audioUrl;
        
        if (firstVoiceover) {
          audioTracks.voiceover = {
            src: firstVoiceover,
            volume: savedVolumes.voiceover,
            fadeIn: true,
            fadeOut: true,
          };
        }
      }
    }

    // Output settings
    const output: OutputSettings = {
      format: 'mp4',
      resolution: quality === 'final' ? '1080' : 'hd',
      aspectRatio: step1Data?.aspectRatio || '9:16',
      fps: 30,
      thumbnail: {
        capture: 1,
        scale: 0.5,
      },
    };

    // Build timeline
    // If we have multiple voiceover clips, use sfxClips (which uses volumes.sfx)
    // Otherwise, use audioTracks.voiceover (which uses volumes.voiceover)
    // Note: sfxVolume in timeline-builder is calculated as sfx * master
    // So we need to divide voiceover by master (video) to get the correct sfx value
    // This ensures: sfx * master = voiceover (the desired volume)
    const finalVolumes: VolumeSettings = voiceoverClips.length > 0
      ? {
          ...volumes,
          // Calculate sfx so that sfx * master = voiceover
          // sfx = voiceover / master (where master = video volume)
          sfx: volumes.master > 0 
            ? savedVolumes.voiceover / volumes.master 
            : savedVolumes.voiceover,
        }
      : volumes;

    const input: TimelineBuilderInput = {
      scenes,
      shots,
      shotVersions,
      audioTracks,
      sfxClips: voiceoverClips.length > 0 ? voiceoverClips.map(clip => ({
        id: clip.id,
        src: clip.src,
        start: clip.start,
        duration: clip.duration,
        shotId: clip.shotId,
      })) : undefined,
      volumes: finalVolumes,
      output,
    };

    const result = buildShotstackTimeline(input);

    // Submit to Shotstack
    const client = getShotstackClient();
    const renderResponse = await client.render(result.edit);

    console.log('[Export] Render started:', {
      videoId,
      renderId: renderResponse.response.id,
      status: renderResponse.response.status,
      quality,
    });

    // Update step5Data with render state
    const renderState = {
      id: renderResponse.response.id,
      status: renderResponse.response.status as 'queued' | 'rendering' | 'done' | 'failed',
      progress: 10,
      startedAt: new Date().toISOString(),
    };

    await storage.updateVideo(videoId, {
      step5Data: {
        ...step5Data,
        animatic: {
          ...step5Data?.animatic,
          volumes: savedVolumes,
          render: renderState,
        },
      },
      status: 'rendering',
    });

    // Also update step6Data with render trigger
    const step6Data = (video.step6Data as Step6Data) || {};
    await storage.updateVideo(videoId, {
      step6Data: {
        ...step6Data,
        renderTriggeredAt: new Date().toISOString(),
        exportSettings: {
          resolution: quality === 'final' ? '1080p' : '720p',
          format: 'mp4',
        },
      },
    });

    res.json({
      success: true,
      renderId: renderResponse.response.id,
      renderStatus: 'queued',
      renderProgress: 10,
      totalDuration: result.totalDuration,
    });
  } catch (error) {
    console.error('[Export] Start render error:', error);

    // Update step5Data with error
    const video = await storage.getVideo(req.params.videoId);
    if (video?.step5Data) {
      await storage.updateVideo(req.params.videoId, {
        step5Data: {
          ...(video.step5Data as Step5Data),
          animatic: {
            ...(video.step5Data as Step5Data).animatic,
            render: {
              ...(video.step5Data as Step5Data).animatic?.render,
              id: '',
              status: 'failed',
              progress: 0,
              error: error instanceof Error ? error.message : 'Failed to start render',
            },
          },
        },
      });
    }

    res.status(500).json({
      error: 'Failed to start export render',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /settings/:videoId - Save export/publish settings
// ═══════════════════════════════════════════════════════════════════════════════
router.patch('/settings/:videoId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { videoId } = req.params;
    const { publishSettings } = req.body;

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step6Data = (video.step6Data as Step6Data) || {};

    await storage.updateVideo(videoId, {
      step6Data: {
        ...step6Data,
        publishSettings: {
          ...step6Data.publishSettings,
          ...publishSettings,
        },
      },
    });

    res.json({
      success: true,
      publishSettings: {
        ...step6Data.publishSettings,
        ...publishSettings,
      },
    });
  } catch (error) {
    console.error('[Export] Settings error:', error);
    res.status(500).json({
      error: 'Failed to save settings',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
