/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHARACTER VLOG - SOUND GENERATION ROUTES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * API endpoints for voiceover and background music generation (Step 5).
 */

import { Router, Request, Response } from 'express';
import { isAuthenticated, getCurrentUserId } from '../../../auth';
import { storage } from '../../../storage';
import {
  generateVoiceoverScript,
  generateVoiceoverAudio,
  generateBackgroundMusic,
  generateSoundEffectPrompt,
  generateSoundEffect,
  calculateTotalDuration,
  CHARACTER_VLOG_VOICES,
} from '../agents';
import type {
  Step1Data,
  Step3Data,
  Step4Data,
  Step5Data,
  ShotSoundEffect,
  ShotVersion,
  VoiceoverScriptGeneratorInput,
  VoiceoverAudioGeneratorInput,
  BackgroundMusicGeneratorInput,
  SoundEffectPromptGeneratorInput,
  SoundEffectGeneratorInput,
  MusicStyle,
} from '../types';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// GET AVAILABLE VOICES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/character-vlog/voices
 * Get available voices for voiceover generation
 */
router.get('/voices', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const language = req.query.language as string || 'en';
    
    // Return voices filtered by language
    const voices = language === 'ar' ? CHARACTER_VLOG_VOICES.ar : CHARACTER_VLOG_VOICES.en;
    
    res.json({ voices });
  } catch (error) {
    console.error('[character-vlog:sound-routes] Voices fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch voices' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VOICEOVER SCRIPT GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/character-vlog/videos/:id/voiceover/generate-script
 * Generate voiceover script from existing story script
 */
router.post('/videos/:id/voiceover/generate-script', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const video = await storage.getVideo(id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = video.step1Data as Step1Data;
    const step3Data = video.step3Data as Step3Data;
    const step4Data = video.step4Data as Step4Data;

    // Validate voiceover is enabled
    if (!step1Data?.voiceOverEnabled) {
      return res.status(400).json({ error: 'Voiceover is not enabled for this video' });
    }

    // Validate script exists
    if (!step1Data?.script) {
      return res.status(400).json({ error: 'No script found. Please generate a script first.' });
    }

    // Validate scenes exist
    if (!step3Data?.scenes || step3Data.scenes.length === 0) {
      return res.status(400).json({ error: 'No scenes found. Please complete the Scenes phase first.' });
    }

    // Calculate total duration using version durations when available (no loops in character vlog)
    const scenes = step3Data.scenes;
    const shots = step3Data.shots || {};
    const shotVersions = step4Data?.shotVersions;
    const totalDuration = calculateTotalDuration(scenes, shots, shotVersions);

    if (totalDuration === 0) {
      return res.status(400).json({ error: 'No shots found or total duration is zero' });
    }

    console.log('[character-vlog:sound-routes] Generating voiceover script:', {
      videoId: id,
      scriptLength: step1Data.script.length,
      totalDuration,
      scenesCount: scenes.length,
    });

    // Build input for voiceover script generator
    // Helper to get effective duration for a shot (from version if available)
    const getEffectiveShotDuration = (shotId: string, fallbackDuration: number) => {
      const versions = shotVersions?.[shotId];
      const latestVersion = versions && versions.length > 0 ? versions[versions.length - 1] : null;
      return (latestVersion as any)?.actualDuration || fallbackDuration;
    };

    const input: VoiceoverScriptGeneratorInput = {
      language: step1Data.voiceoverLanguage || 'en',
      script: step1Data.script,
      totalDuration,
      scenes: scenes.map((scene: any, idx: number) => ({
        id: scene.id,
        sceneNumber: idx + 1,
        title: scene.title || scene.name || `Scene ${idx + 1}`,
        description: scene.description,
        duration: scene.duration,
      })),
      shots: Object.fromEntries(
        Object.entries(shots).map(([sceneId, sceneShots]: [string, any]) => [
          sceneId,
          (sceneShots as any[]).map((shot: any, idx: number) => ({
            id: shot.id,
            shotNumber: idx + 1,
            duration: getEffectiveShotDuration(shot.id, shot.duration),
            description: shot.description,
          })),
        ])
      ),
      characterPersonality: step1Data.characterPersonality,
      narrationStyle: step1Data.narrationStyle,
    };

    // Generate voiceover script
    const result = await generateVoiceoverScript(
      input,
      userId,
      video.workspaceId
    );

    // Update step5Data with the generated script
    const existingStep5Data = (video.step5Data as Step5Data) || {};
    const updatedStep5Data: Step5Data = {
      ...existingStep5Data,
      voiceoverScript: result.script,
      voiceoverStatus: 'script_generated',
    };

    await storage.updateVideo(id, { step5Data: updatedStep5Data });

    console.log('[character-vlog:sound-routes] Voiceover script generated:', {
      videoId: id,
      scriptLength: result.script.length,
      estimatedDuration: result.estimatedDuration,
      cost: result.cost,
    });

    res.json({
      script: result.script,
      estimatedDuration: result.estimatedDuration,
      cost: result.cost,
    });
  } catch (error) {
    console.error('[character-vlog:sound-routes] Voiceover script generation error:', error);
    res.status(500).json({ error: 'Failed to generate voiceover script' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VOICEOVER AUDIO GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/character-vlog/videos/:id/voiceover/generate-audio
 * Generate voiceover audio from script
 */
router.post('/videos/:id/voiceover/generate-audio', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { script, voiceId } = req.body;  // Allow passing edited script and voice
    
    const video = await storage.getVideo(id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = video.step1Data as Step1Data;
    const step5Data = video.step5Data as Step5Data || {};

    // Validate voiceover is enabled
    if (!step1Data?.voiceOverEnabled) {
      return res.status(400).json({ error: 'Voiceover is not enabled for this video' });
    }

    // Use provided script or saved script
    const scriptToUse = script || step5Data.voiceoverScript;
    if (!scriptToUse || scriptToUse.trim().length === 0) {
      return res.status(400).json({ error: 'No voiceover script available. Generate a script first.' });
    }

    // Use provided voice or saved voice or default
    const voiceIdToUse = voiceId || step5Data.voiceId;
    if (!voiceIdToUse) {
      return res.status(400).json({ error: 'No voice selected. Please select a voice first.' });
    }

    // Get workspace info for CDN path
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const currentWorkspace = workspaces.find(w => w.id === video.workspaceId) || workspaces[0];
    const workspaceName = currentWorkspace?.name || 'default';

    console.log('[character-vlog:sound-routes] Generating voiceover audio:', {
      videoId: id,
      scriptLength: scriptToUse.length,
      voiceId: voiceIdToUse,
    });

    // Build input for audio generator
    const input: VoiceoverAudioGeneratorInput = {
      script: scriptToUse,
      voiceId: voiceIdToUse,
      language: step1Data.voiceoverLanguage || 'en',
      videoId: id,
      videoTitle: video.title || 'untitled',
      videoCreatedAt: video.createdAt,
      userId,
      workspaceId: video.workspaceId || currentWorkspace?.id || '',
      workspaceName,
    };

    // Generate audio
    const result = await generateVoiceoverAudio(input, 'video', 'character-vlog');

    // Update step5Data with the generated audio
    const freshVideo = await storage.getVideo(id);
    const freshStep5Data = (freshVideo?.step5Data as Step5Data) || {};
    
    const updatedStep5Data: Step5Data = {
      ...freshStep5Data,
      voiceoverScript: scriptToUse,
      voiceoverAudioUrl: result.audioUrl,
      voiceoverDuration: result.duration,
      voiceoverStatus: 'audio_generated',
      voiceId: voiceIdToUse,
    };

    await storage.updateVideo(id, { step5Data: updatedStep5Data });

    console.log('[character-vlog:sound-routes] Voiceover audio generated:', {
      videoId: id,
      audioUrl: result.audioUrl,
      duration: result.duration,
      cost: result.cost,
    });

    res.json({
      audioUrl: result.audioUrl,
      duration: result.duration,
      cost: result.cost,
    });
  } catch (error) {
    console.error('[character-vlog:sound-routes] Voiceover audio generation error:', error);
    res.status(500).json({ error: 'Failed to generate voiceover audio' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE VOICEOVER SCRIPT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PATCH /api/character-vlog/videos/:id/voiceover/script
 * Update/save edited voiceover script
 */
router.patch('/videos/:id/voiceover/script', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { script } = req.body;

    if (!script || typeof script !== 'string') {
      return res.status(400).json({ error: 'Script is required' });
    }

    const video = await storage.getVideo(id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Update step5Data with edited script
    const existingStep5Data = video.step5Data as Step5Data || {};
    const updatedStep5Data: Step5Data = {
      ...existingStep5Data,
      voiceoverScript: script,
      voiceoverStatus: 'script_generated',  // Reset status since script changed
      // Clear audio since script changed
      voiceoverAudioUrl: undefined,
      voiceoverDuration: undefined,
    };

    await storage.updateVideo(id, { step5Data: updatedStep5Data });

    console.log('[character-vlog:sound-routes] Voiceover script updated:', {
      videoId: id,
      scriptLength: script.length,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[character-vlog:sound-routes] Voiceover script update error:', error);
    res.status(500).json({ error: 'Failed to update voiceover script' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE VOICE SELECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PATCH /api/character-vlog/videos/:id/voiceover/voice
 * Update selected voice
 */
router.patch('/videos/:id/voiceover/voice', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { voiceId } = req.body;

    if (!voiceId || typeof voiceId !== 'string') {
      return res.status(400).json({ error: 'Voice ID is required' });
    }

    const video = await storage.getVideo(id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Update step5Data with selected voice
    const existingStep5Data = video.step5Data as Step5Data || {};
    const updatedStep5Data: Step5Data = {
      ...existingStep5Data,
      voiceId,
    };

    await storage.updateVideo(id, { step5Data: updatedStep5Data });

    console.log('[character-vlog:sound-routes] Voice selection updated:', {
      videoId: id,
      voiceId,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[character-vlog:sound-routes] Voice selection update error:', error);
    res.status(500).json({ error: 'Failed to update voice selection' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// BACKGROUND MUSIC GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/character-vlog/videos/:id/music/generate
 * Generate AI background music
 */
router.post('/videos/:id/music/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { musicStyle } = req.body;  // Allow overriding music style

    const video = await storage.getVideo(id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = video.step1Data as Step1Data;
    const step3Data = video.step3Data as Step3Data;
    const step4Data = video.step4Data as Step4Data;

    // Validate music is enabled
    if (!step1Data?.backgroundMusicEnabled) {
      return res.status(400).json({ error: 'Background music is not enabled for this video' });
    }

    // Calculate total duration using version durations when available (no loops in character vlog)
    const scenes = step3Data?.scenes || [];
    const shots = step3Data?.shots || {};
    const shotVersions = step4Data?.shotVersions;
    const totalDuration = calculateTotalDuration(scenes, shots, shotVersions);

    if (totalDuration === 0) {
      return res.status(400).json({ error: 'No shots found or total duration is zero' });
    }

    // Get workspace info for CDN path
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const currentWorkspace = workspaces.find(w => w.id === video.workspaceId) || workspaces[0];
    const workspaceName = currentWorkspace?.name || 'default';

    // Use provided music style or default to cinematic
    const styleToUse: MusicStyle = musicStyle || 'cinematic';

    console.log('[character-vlog:sound-routes] Generating background music:', {
      videoId: id,
      musicStyle: styleToUse,
      totalDuration,
    });

    // Build input for music generator
    const input: BackgroundMusicGeneratorInput = {
      musicStyle: styleToUse,
      theme: step1Data.theme,
      characterPersonality: step1Data.characterPersonality,
      genres: step1Data.genres,
      tones: step1Data.tones,
      totalDuration,
      scenes: scenes.map((scene: any, idx: number) => ({
        sceneNumber: idx + 1,
        title: scene.title || scene.name || `Scene ${idx + 1}`,
        description: scene.description,
      })),
      videoId: id,
      videoTitle: video.title || 'untitled',
      videoCreatedAt: video.createdAt,
      userId,
      workspaceId: video.workspaceId || currentWorkspace?.id || '',
      workspaceName,
    };

    // Generate music
    const result = await generateBackgroundMusic(input, 'video', 'character-vlog');

    // Update step5Data with the generated music
    const freshVideo = await storage.getVideo(id);
    const freshStep5Data = (freshVideo?.step5Data as Step5Data) || {};
    
    const updatedStep5Data: Step5Data = {
      ...freshStep5Data,
      generatedMusicUrl: result.musicUrl,
      generatedMusicDuration: result.duration,
      generatedMusicStyle: result.style,
    };

    await storage.updateVideo(id, { step5Data: updatedStep5Data });

    console.log('[character-vlog:sound-routes] Background music generated:', {
      videoId: id,
      musicUrl: result.musicUrl,
      duration: result.duration,
      style: result.style,
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
    console.error('[character-vlog:sound-routes] Music generation error:', error);
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
 * DELETE /api/character-vlog/videos/:id/music/generated
 * Remove generated music from step5Data
 */
router.delete('/videos/:id/music/generated', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const video = await storage.getVideo(id);
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

    await storage.updateVideo(id, {
      step5Data: updatedStep5Data,
    });

    console.log('[character-vlog:sound-routes] Generated music deleted:', { videoId: id });

    res.json({ success: true });

  } catch (error) {
    console.error('[character-vlog:sound-routes] Delete music error:', error);
    res.status(500).json({ error: 'Failed to delete generated music' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND EFFECT PROMPT GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/character-vlog/videos/:id/sound-effects/:shotId/generate-prompt
 * Generate recommended sound effect prompt for a shot
 */
router.post('/videos/:id/sound-effects/:shotId/generate-prompt', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, shotId } = req.params;
    const video = await storage.getVideo(id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = video.step1Data as Step1Data;
    const step3Data = video.step3Data as Step3Data;

    // Find the shot across all scenes
    let targetShot: any = null;
    let targetScene: any = null;

    for (const scene of (step3Data?.scenes || [])) {
      const sceneShots = step3Data?.shots?.[scene.id] || [];
      const foundShot = sceneShots.find((s: any) => s.id === shotId);
      if (foundShot) {
        targetShot = foundShot;
        targetScene = scene;
        break;
      }
    }

    if (!targetShot) {
      return res.status(404).json({ error: 'Shot not found' });
    }

    console.log('[character-vlog:sound-routes] Generating sound effect prompt:', {
      videoId: id,
      shotId,
      shotDescription: targetShot.description?.substring(0, 50),
    });

    // Get version duration from step4Data if available
    const step4Data = video.step4Data as Step4Data;
    const shotVersions = step4Data?.shotVersions?.[shotId] || [];
    const latestVersion = shotVersions[shotVersions.length - 1] as ShotVersion | undefined;
    const effectiveDuration = latestVersion?.actualDuration || targetShot.duration || 4;

    // Build input for prompt generator
    const input: SoundEffectPromptGeneratorInput = {
      shotDescription: targetShot.description || '',
      shotType: targetShot.shotType,
      duration: effectiveDuration,
      sceneTitle: targetScene?.title || targetScene?.name,
      sceneDescription: targetScene?.description,
      theme: step1Data?.theme,
      characterPersonality: step1Data?.characterPersonality,
    };

    // Generate sound effect prompt
    const result = await generateSoundEffectPrompt(
      input,
      userId,
      video.workspaceId,
      'video',
      'character-vlog'
    );

    // Update step5Data with the generated prompt
    const existingStep5Data = (video.step5Data as Step5Data) || {};
    const existingSoundEffects = existingStep5Data.soundEffects || {};
    
    const updatedSoundEffects: Record<string, ShotSoundEffect> = {
      ...existingSoundEffects,
      [shotId]: {
        ...(existingSoundEffects[shotId] || {}),
        prompt: result.prompt,
      },
    };

    const updatedStep5Data: Step5Data = {
      ...existingStep5Data,
      soundEffects: updatedSoundEffects,
    };

    await storage.updateVideo(id, { step5Data: updatedStep5Data });

    console.log('[character-vlog:sound-routes] Sound effect prompt generated:', {
      videoId: id,
      shotId,
      promptLength: result.prompt.length,
      cost: result.cost,
    });

    res.json({
      prompt: result.prompt,
      cost: result.cost,
    });
  } catch (error) {
    console.error('[character-vlog:sound-routes] Sound effect prompt generation error:', error);
    res.status(500).json({ error: 'Failed to generate sound effect prompt' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE SOUND EFFECT PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PATCH /api/character-vlog/videos/:id/sound-effects/:shotId/prompt
 * Update/save edited sound effect prompt
 */
router.patch('/videos/:id/sound-effects/:shotId/prompt', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, shotId } = req.params;
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const video = await storage.getVideo(id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Update step5Data with edited prompt
    const existingStep5Data = (video.step5Data as Step5Data) || {};
    const existingSoundEffects = existingStep5Data.soundEffects || {};
    
    const updatedSoundEffects: Record<string, ShotSoundEffect> = {
      ...existingSoundEffects,
      [shotId]: {
        ...(existingSoundEffects[shotId] || {}),
        prompt,
        // Clear generated audio since prompt changed
        audioUrl: undefined,
        duration: undefined,
      },
    };

    const updatedStep5Data: Step5Data = {
      ...existingStep5Data,
      soundEffects: updatedSoundEffects,
    };

    await storage.updateVideo(id, { step5Data: updatedStep5Data });

    console.log('[character-vlog:sound-routes] Sound effect prompt updated:', {
      videoId: id,
      shotId,
      promptLength: prompt.length,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[character-vlog:sound-routes] Sound effect prompt update error:', error);
    res.status(500).json({ error: 'Failed to update sound effect prompt' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND EFFECT AUDIO GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/character-vlog/videos/:id/sound-effects/:shotId/generate-audio
 * Generate sound effect audio for a shot using MMAudio
 */
router.post('/videos/:id/sound-effects/:shotId/generate-audio', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, shotId } = req.params;
    const { prompt: overridePrompt } = req.body;
    
    const video = await storage.getVideo(id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step3Data = video.step3Data as Step3Data;
    const step4Data = video.step4Data as Step4Data;
    const step5Data = video.step5Data as Step5Data || {};

    // Find the shot in step3Data to get scene context
    let targetShot: any = null;
    let targetSceneId: string | null = null;

    for (const scene of (step3Data?.scenes || [])) {
      const sceneShots = step3Data?.shots?.[scene.id] || [];
      const foundShot = sceneShots.find((s: any) => s.id === shotId);
      if (foundShot) {
        targetShot = foundShot;
        targetSceneId = scene.id;
        break;
      }
    }

    if (!targetShot) {
      return res.status(404).json({ error: 'Shot not found' });
    }

    // Get the shot's video URL from step4Data.shotVersions (where videos are stored)
    const shotVersions = step4Data?.shotVersions?.[shotId] || [];
    const latestVersion = shotVersions[shotVersions.length - 1] as ShotVersion | undefined;
    const shotVideoUrl = latestVersion?.videoUrl;
    
    if (!shotVideoUrl) {
      return res.status(400).json({ error: 'Shot does not have a generated video. Please generate the video first.' });
    }

    // Get sound effect prompt (from request override or stored)
    const existingSoundEffect = step5Data.soundEffects?.[shotId] || {};
    const promptToUse = overridePrompt || existingSoundEffect.prompt;
    
    if (!promptToUse || promptToUse.trim().length === 0) {
      return res.status(400).json({ error: 'No sound effect prompt available. Generate or enter a prompt first.' });
    }

    // Get workspace info for CDN path
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const currentWorkspace = workspaces.find(w => w.id === video.workspaceId) || workspaces[0];
    const workspaceName = currentWorkspace?.name || 'default';

    console.log('[character-vlog:sound-routes] Generating sound effect audio:', {
      videoId: id,
      shotId,
      videoUrl: shotVideoUrl.substring(0, 50) + '...',
      prompt: promptToUse.substring(0, 50) + '...',
    });

    // Mark as generating
    const markGeneratingStep5Data: Step5Data = {
      ...step5Data,
      soundEffects: {
        ...step5Data.soundEffects,
        [shotId]: {
          ...existingSoundEffect,
          isGenerating: true,
        },
      },
    };
    await storage.updateVideo(id, { step5Data: markGeneratingStep5Data });

    try {
      // Use version's actual duration (from generated video) or fall back to shot.duration
      const effectiveDuration = latestVersion?.actualDuration || targetShot.duration || 4;

      // Build input for audio generator
      const input: SoundEffectGeneratorInput = {
        videoUrl: shotVideoUrl,
        prompt: promptToUse,
        duration: effectiveDuration,
        videoId: id,
        videoTitle: video.title || 'untitled',
        videoCreatedAt: video.createdAt,
        shotId,
        sceneId: targetSceneId || 'unknown',
        userId,
        workspaceId: video.workspaceId || currentWorkspace?.id || '',
        workspaceName,
      };

      // Generate audio
      const result = await generateSoundEffect(input, 'video', 'character-vlog');

      // Update step5Data with the generated audio
      const freshVideo = await storage.getVideo(id);
      const freshStep5Data = (freshVideo?.step5Data as Step5Data) || {};
      
      const updatedSoundEffects: Record<string, ShotSoundEffect> = {
        ...freshStep5Data.soundEffects,
        [shotId]: {
          ...(freshStep5Data.soundEffects?.[shotId] || {}),
          prompt: promptToUse,
          audioUrl: result.audioUrl,
          duration: result.duration,
          isGenerating: false,
        },
      };

      const updatedStep5Data: Step5Data = {
        ...freshStep5Data,
        soundEffects: updatedSoundEffects,
      };

      await storage.updateVideo(id, { step5Data: updatedStep5Data });

      console.log('[character-vlog:sound-routes] Sound effect audio generated:', {
        videoId: id,
        shotId,
        audioUrl: result.audioUrl,
        duration: result.duration,
        cost: result.cost,
      });

      res.json({
        audioUrl: result.audioUrl,
        duration: result.duration,
        cost: result.cost,
      });
    } catch (genError) {
      // Clear generating state on error
      const freshVideo = await storage.getVideo(id);
      const freshStep5Data = (freshVideo?.step5Data as Step5Data) || {};
      
      const updatedSoundEffects: Record<string, ShotSoundEffect> = {
        ...freshStep5Data.soundEffects,
        [shotId]: {
          ...(freshStep5Data.soundEffects?.[shotId] || {}),
          isGenerating: false,
        },
      };

      await storage.updateVideo(id, {
        step5Data: {
          ...freshStep5Data,
          soundEffects: updatedSoundEffects,
        },
      });

      throw genError;
    }
  } catch (error) {
    console.error('[character-vlog:sound-routes] Sound effect audio generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate sound effect audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE SOUND EFFECT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DELETE /api/character-vlog/videos/:id/sound-effects/:shotId
 * Remove sound effect from a shot
 */
router.delete('/videos/:id/sound-effects/:shotId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, shotId } = req.params;

    const video = await storage.getVideo(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step5Data = (video.step5Data as Step5Data) || {};
    const existingSoundEffects = step5Data.soundEffects || {};

    // Remove the shot's sound effect
    const { [shotId]: removed, ...remainingSoundEffects } = existingSoundEffects;

    const updatedStep5Data: Step5Data = {
      ...step5Data,
      soundEffects: remainingSoundEffects,
    };

    await storage.updateVideo(id, {
      step5Data: updatedStep5Data,
    });

    console.log('[character-vlog:sound-routes] Sound effect deleted:', { videoId: id, shotId });

    res.json({ success: true });

  } catch (error) {
    console.error('[character-vlog:sound-routes] Delete sound effect error:', error);
    res.status(500).json({ error: 'Failed to delete sound effect' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET SOUND STATUS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/character-vlog/videos/:id/sound/status
 * Get current sound status for a video
 */
router.get('/videos/:id/sound/status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const video = await storage.getVideo(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = video.step1Data as Step1Data;
    const step5Data = video.step5Data as Step5Data;

    // Count sound effects
    const soundEffects = step5Data?.soundEffects || {};
    const soundEffectCount = Object.keys(soundEffects).length;
    const soundEffectsWithAudio = Object.values(soundEffects).filter((sf: ShotSoundEffect) => sf.audioUrl).length;

    res.json({
      // Voiceover status
      voiceoverEnabled: step1Data?.voiceOverEnabled ?? false,
      voiceoverLanguage: step1Data?.voiceoverLanguage || 'en',
      hasVoiceoverScript: !!step5Data?.voiceoverScript,
      voiceoverScript: step5Data?.voiceoverScript || null,
      hasVoiceoverAudio: !!step5Data?.voiceoverAudioUrl,
      voiceoverAudioUrl: step5Data?.voiceoverAudioUrl || null,
      voiceoverDuration: step5Data?.voiceoverDuration || null,
      voiceoverStatus: step5Data?.voiceoverStatus || 'pending',
      selectedVoiceId: step5Data?.voiceId || null,
      
      // Sound Effects status
      soundEffects: step5Data?.soundEffects || {},
      soundEffectCount,
      soundEffectsWithAudio,
      
      // Music status
      backgroundMusicEnabled: step1Data?.backgroundMusicEnabled ?? false,
      hasGeneratedMusic: !!step5Data?.generatedMusicUrl,
      generatedMusicUrl: step5Data?.generatedMusicUrl || null,
      generatedMusicDuration: step5Data?.generatedMusicDuration || null,
      generatedMusicStyle: step5Data?.generatedMusicStyle || null,
    });

  } catch (error) {
    console.error('[character-vlog:sound-routes] Status error:', error);
    res.status(500).json({ error: 'Failed to get sound status' });
  }
});

export default router;
