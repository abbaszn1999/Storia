/**
 * Animatic Preview Routes (Tab 5)
 * 
 * Handles animatic preview data, timeline building, volume settings,
 * and Shotstack export for Social Commerce mode.
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
import type {
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
  Step5Data,
  NarrativeOutput,
} from '../../types';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimaticBeat {
  beatId: 'beat1' | 'beat2' | 'beat3';
  beatName: string;
  videoUrl: string;
  lastFrameUrl?: string;
  duration: number;
  voiceover?: {
    audioUrl: string;
    duration: number;
  };
}

interface AnimaticData {
  beats: AnimaticBeat[];
  totalDuration: number;
  hasVoiceover: boolean;
  volumes: {
    voiceover: number;
    video: number; // Controls embedded audio from Sora video
  };
  render?: {
    id: string;
    status: 'queued' | 'rendering' | 'done' | 'failed';
    progress: number;
    url?: string;
    thumbnailUrl?: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET /data - Fetch animatic data (beats, videos, audio)
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/data/:videoId', isAuthenticated, async (req: Request, res: Response) => {
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

    const step1Data = video.step1Data as Step1Data | undefined;
    const step2Data = video.step2Data as Step2Data | undefined;
    const step3Data = video.step3Data as Step3Data | undefined;
    const step4Data = video.step4Data as Step4Data | undefined;
    const step5Data = video.step5Data as Step5Data | undefined;

    // Get beat information from step2Data (narrative/visual beats)
    const narrative = step2Data?.narrative as NarrativeOutput | undefined;
    const visualBeats = narrative?.visual_beats || [];

    // Get beat videos from step3Data
    const beatVideos = step3Data?.beatVideos || {};

    // Get voiceover audios from step4Data
    const voiceoverAudios = step4Data?.voiceoverAudios || {};
    
    console.log('[Animatic] DEBUG step4Data:', JSON.stringify(step4Data, null, 2));
    console.log('[Animatic] DEBUG voiceoverAudios:', JSON.stringify(voiceoverAudios, null, 2));
    console.log('[Animatic] DEBUG voiceOverEnabled:', step1Data?.voiceOverEnabled);

    // Build animatic beats array
    const beats: AnimaticBeat[] = [];
    const beatIds: Array<'beat1' | 'beat2' | 'beat3'> = ['beat1', 'beat2', 'beat3'];

    for (const beatId of beatIds) {
      const beatInfo = visualBeats.find(b => b.beatId === beatId);
      const beatVideo = beatVideos[beatId];
      const voiceoverAudio = voiceoverAudios[beatId];

      if (beatVideo?.videoUrl) {
        beats.push({
          beatId,
          beatName: beatInfo?.beatName || `Beat ${beatId.replace('beat', '')}`,
          videoUrl: beatVideo.videoUrl,
          lastFrameUrl: beatVideo.lastFrameUrl,
          duration: 12, // Each beat is 12 seconds
          voiceover: voiceoverAudio?.audioUrl ? {
            audioUrl: voiceoverAudio.audioUrl,
            duration: voiceoverAudio.duration || 12,
          } : undefined,
        });
      }
    }

    // Calculate total duration
    const totalDuration = beats.length * 12;

    // Check if voiceover is enabled
    const hasVoiceover = step1Data?.voiceOverEnabled === true && beats.some(b => b.voiceover);

    // Get saved volumes or use defaults
    // Note: 'video' controls the embedded audio from Sora videos
    const savedVolumes = step5Data?.animatic?.volumes || {
      voiceover: 1,
      video: 1, // Sora videos have embedded audio
    };

    // Get render state if exists
    const render = step5Data?.animatic?.render;

    const animaticData: AnimaticData = {
      beats,
      totalDuration,
      hasVoiceover,
      volumes: savedVolumes,
      render,
    };

    console.log('[Animatic] Data fetched:', {
      videoId,
      beatCount: beats.length,
      totalDuration,
      hasVoiceover,
    });

    res.json(animaticData);
  } catch (error) {
    console.error('[Animatic] Error fetching data:', error);
    res.status(500).json({
      error: 'Failed to fetch animatic data',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /volumes - Save volume settings
// ═══════════════════════════════════════════════════════════════════════════════
router.patch('/volumes/:videoId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { videoId } = req.params;
    const { voiceover, video: videoVolume } = req.body;

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step5Data = (video.step5Data as Step5Data) || {};

    // Update volumes in animatic state
    // Note: 'video' controls the embedded audio from Sora videos
    const updatedAnimatic = {
      ...step5Data.animatic,
      volumes: {
        voiceover: typeof voiceover === 'number' ? Math.max(0, Math.min(1, voiceover)) : step5Data.animatic?.volumes?.voiceover ?? 1,
        video: typeof videoVolume === 'number' ? Math.max(0, Math.min(1, videoVolume)) : step5Data.animatic?.volumes?.video ?? 1,
      },
    };

    await storage.updateVideo(videoId, {
      step5Data: {
        ...step5Data,
        animatic: updatedAnimatic,
      },
    });

    console.log('[Animatic] Volumes saved:', updatedAnimatic.volumes);

    res.json({
      success: true,
      volumes: updatedAnimatic.volumes,
    });
  } catch (error) {
    console.error('[Animatic] Error saving volumes:', error);
    res.status(500).json({
      error: 'Failed to save volumes',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /timeline - Build Shotstack Edit JSON for preview
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/timeline/:videoId', isAuthenticated, async (req: Request, res: Response) => {
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

    const step1Data = video.step1Data as Step1Data | undefined;
    const step2Data = video.step2Data as Step2Data | undefined;
    const step3Data = video.step3Data as Step3Data | undefined;
    const step4Data = video.step4Data as Step4Data | undefined;
    const step5Data = video.step5Data as Step5Data | undefined;

    // Get beat data
    const narrative = step2Data?.narrative as NarrativeOutput | undefined;
    const visualBeats = narrative?.visual_beats || [];
    const beatVideos = step3Data?.beatVideos || {};
    const voiceoverAudios = step4Data?.voiceoverAudios || {};

    // Build scenes and shots for timeline builder
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
          transition: sceneNumber < beatIds.length ? 'fade' : undefined,
        }];

        shotVersions[shotId] = [{
          id: `${shotId}-v1`,
          shotId,
          videoUrl: beatVideo.videoUrl,
        }];

        sceneNumber++;
      }
    }

    // Get volumes
    // Note: 'video' controls embedded Sora audio (applied to video clips)
    const savedVolumes = step5Data?.animatic?.volumes || {
      voiceover: 1,
      video: 1,
    };

    // For Shotstack, video embedded audio is part of the clip itself
    const volumes: VolumeSettings = {
      master: savedVolumes.video, // Use video volume as master for the clip audio
      sfx: 0, // No SFX in commerce mode
      voiceover: savedVolumes.voiceover,
      music: 0, // No separate music track - Sora videos have embedded audio
      ambient: 0, // No ambient in commerce mode
    };

    // Build audio tracks
    const audioTracks: TimelineBuilderInput['audioTracks'] = {};

    // Add voiceover tracks (combine all beat voiceovers into one timeline)
    // For now, each beat's voiceover plays during its beat
    // In a more advanced version, we'd combine them into a single track
    const firstVoiceover = voiceoverAudios['beat1']?.audioUrl || 
                          voiceoverAudios['beat2']?.audioUrl || 
                          voiceoverAudios['beat3']?.audioUrl;
    
    if (firstVoiceover && step1Data?.voiceOverEnabled) {
      // For preview, we'll just use the first voiceover as a placeholder
      // The actual implementation should concatenate all voiceovers
      audioTracks.voiceover = {
        src: firstVoiceover,
        volume: savedVolumes.voiceover,
        fadeIn: true,
        fadeOut: true,
      };
    }

    // Output settings
    const output: OutputSettings = {
      format: 'mp4',
      resolution: step1Data?.videoResolution === '1080p' ? '1080' : 'hd',
      aspectRatio: step1Data?.aspectRatio || '9:16',
      fps: 30,
    };

    // Build timeline
    const input: TimelineBuilderInput = {
      scenes,
      shots,
      shotVersions,
      audioTracks,
      volumes,
      output,
    };

    const result = buildShotstackTimeline(input);

    console.log('[Animatic] Timeline built:', {
      videoId,
      sceneCount: scenes.length,
      totalDuration: result.totalDuration,
      trackCount: result.edit.timeline.tracks.length,
    });

    res.json({
      edit: result.edit,
      totalDuration: result.totalDuration,
      clipCount: result.clipCount,
      savedVolumes,
    });
  } catch (error) {
    console.error('[Animatic] Error building timeline:', error);
    res.status(500).json({
      error: 'Failed to build timeline',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /export - Trigger Shotstack render
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/export/:videoId', isAuthenticated, async (req: Request, res: Response) => {
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
    const { quality = 'preview' } = req.body; // 'preview' or 'final'

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = video.step1Data as Step1Data | undefined;
    const step2Data = video.step2Data as Step2Data | undefined;
    const step3Data = video.step3Data as Step3Data | undefined;
    const step4Data = video.step4Data as Step4Data | undefined;
    const step5Data = (video.step5Data as Step5Data) || {};

    // Get beat data
    const narrative = step2Data?.narrative as NarrativeOutput | undefined;
    const visualBeats = narrative?.visual_beats || [];
    const beatVideos = step3Data?.beatVideos || {};
    const voiceoverAudios = step4Data?.voiceoverAudios || {};

    // Build scenes and shots
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
          transition: sceneNumber < beatIds.length ? 'fade' : undefined,
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

    // Get volumes
    // Note: 'video' controls embedded Sora audio (applied to video clips)
    const savedVolumes = step5Data.animatic?.volumes || {
      voiceover: 1,
      video: 1,
    };

    // For Shotstack, video embedded audio is part of the clip itself
    const volumes: VolumeSettings = {
      master: savedVolumes.video, // Use video volume as master for the clip audio
      sfx: 0,
      voiceover: savedVolumes.voiceover,
      music: 0, // No separate music track - Sora videos have embedded audio
      ambient: 0,
    };

    // Build audio tracks
    const audioTracks: TimelineBuilderInput['audioTracks'] = {};

    const firstVoiceover = voiceoverAudios['beat1']?.audioUrl || 
                          voiceoverAudios['beat2']?.audioUrl || 
                          voiceoverAudios['beat3']?.audioUrl;
    
    if (firstVoiceover && step1Data?.voiceOverEnabled) {
      audioTracks.voiceover = {
        src: firstVoiceover,
        volume: savedVolumes.voiceover,
        fadeIn: true,
        fadeOut: true,
      };
    }

    // Output settings
    const output: OutputSettings = {
      format: 'mp4',
      resolution: quality === 'final' ? '1080' : 'hd',
      aspectRatio: step1Data?.aspectRatio || '9:16',
      fps: quality === 'final' ? 30 : 24,
      ...(quality === 'final' ? {
        thumbnail: {
          capture: 1,
          scale: 0.5,
        },
      } : {}),
    };

    // Build timeline
    const input: TimelineBuilderInput = {
      scenes,
      shots,
      shotVersions,
      audioTracks,
      volumes,
      output,
    };

    const result = buildShotstackTimeline(input);

    // Submit to Shotstack
    const client = getShotstackClient();
    const renderResponse = await client.render(result.edit);

    console.log('[Animatic] Render submitted:', {
      videoId,
      renderId: renderResponse.response.id,
      status: renderResponse.response.status,
      quality,
    });

    // Update step5Data with render state
    const renderState = {
      id: renderResponse.response.id,
      status: renderResponse.response.status as 'queued' | 'rendering' | 'done' | 'failed',
      progress: 0,
      startedAt: new Date().toISOString(),
    };

    await storage.updateVideo(videoId, {
      step5Data: {
        ...step5Data,
        animatic: {
          ...step5Data.animatic,
          volumes: savedVolumes,
          render: renderState,
        },
      },
    });

    res.json({
      renderId: renderResponse.response.id,
      status: renderResponse.response.status,
      totalDuration: result.totalDuration,
    });
  } catch (error) {
    console.error('[Animatic] Export error:', error);
    res.status(500).json({
      error: 'Failed to start export',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /export/:videoId/:renderId - Check render status
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/export/:videoId/:renderId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!isShotstackConfigured()) {
      return res.status(503).json({ error: 'Shotstack not configured' });
    }

    const { videoId, renderId } = req.params;

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get status from Shotstack
    const client = getShotstackClient();
    const statusResponse = await client.getRenderStatus(renderId);

    const status = statusResponse.response.status;
    const url = statusResponse.response.url;
    const thumbnail = statusResponse.response.thumbnail;

    // Calculate progress
    let progress = 0;
    switch (status) {
      case 'queued': progress = 10; break;
      case 'fetching': progress = 30; break;
      case 'rendering': progress = 60; break;
      case 'saving': progress = 90; break;
      case 'done': progress = 100; break;
      case 'failed': progress = 0; break;
    }

    // Update step5Data if status changed
    if (status === 'done' && url) {
      const step5Data = (video.step5Data as Step5Data) || {};
      await storage.updateVideo(videoId, {
        step5Data: {
          ...step5Data,
          animatic: {
            ...step5Data.animatic,
            render: {
              id: renderId,
              status: 'done',
              progress: 100,
              url,
              thumbnailUrl: thumbnail,
              completedAt: new Date().toISOString(),
            },
          },
          exportUrl: url,
          thumbnailUrl: thumbnail,
        },
      });
    }

    console.log('[Animatic] Status check:', { renderId, status, progress });

    res.json({
      renderId,
      status,
      progress,
      url: url || null,
      thumbnail: thumbnail || null,
      error: statusResponse.response.error || null,
    });
  } catch (error) {
    console.error('[Animatic] Status error:', error);
    res.status(500).json({
      error: 'Failed to get render status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
