/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * STORY ORCHESTRATOR SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Orchestrates the full story generation pipeline for auto-story campaigns.
 * Uses the REAL shared agents from server/stories/shared/agents/ — the same
 * agents used by the manual Story Studio.
 * 
 * Mirrors the auto-video agent-orchestrator pattern:
 * - Sequential 8-step pipeline
 * - Cost tracking
 * - Retry support (regenerates from scratch on retry)
 * 
 * PIPELINE:
 * Step 1: Generate story script (idea-generator agent)
 * Step 2: Break into scenes (scene-generator agent)
 * Step 3: Enhance storyboard with image/video prompts (storyboard-enhancer agent)
 * Step 4: Generate images (image-generator agent)
 * Step 5: Generate videos if animated (video-generator agent)
 * Step 6: Generate voiceover if enabled (voiceover-generator agent)
 * Step 7: Generate music (music-generator agent)
 * Step 8: Export final video (video-exporter agent) → creates story record in DB
 */

import { storage } from '../../../storage';
import { createIdeaGenerator, type StoryMode } from '../../../stories/shared/agents/idea-generator';
import { createSceneGenerator } from '../../../stories/shared/agents/scene-generator';
import { createStoryboardEnhancer } from '../../../stories/shared/agents/storyboard-enhancer';
import { createImageGenerator } from '../../../stories/shared/agents/image-generator';
import { createVideoGenerator } from '../../../stories/shared/agents/video-generator';
import { createVoiceoverGenerator } from '../../../stories/shared/agents/voiceover-generator';
import { createMusicGenerator } from '../../../stories/shared/agents/music-generator';
import { createSoundEffectsGenerator } from '../../../stories/shared/agents/sound-effects-generator';
import { getVideoModelConstraints } from '../../../ai/config/video-models';
import { createSrtFile, type SubtitleScene } from '../../../stories/shared/services/subtitle-generator';
import {
  getShotstackClient,
  isShotstackConfigured,
  type ShotstackEdit,
  type Timeline,
  type Track,
  type Clip,
  type VideoAsset,
  type ImageAsset,
  type AudioAsset,
  type CaptionAsset,
  type Transition,
  type TransitionEffect,
  type Effect,
  type Soundtrack,
} from '../../../integrations/shotstack';
import { buildStoryModePath, bunnyStorage } from '../../../storage/bunny-storage';
import { lateService } from '../../../integrations/late';
import { generateSocialMetadata } from '../../../stories/shared/social/agents/metadata-generator';
import type { 
  StoryCampaignSettings, 
  StoryGenerationResult, 
  StoryGenerationOptions,
  StoryTemplate,
  IntermediateData,
} from '../types';

/**
 * Progress callback — called after each pipeline step.
 * The batch processor uses this to persist currentStep into
 * storyCampaigns.itemStatuses so getBatchProgress can read it.
 */
export type StoryProgressCallback = (info: {
  step: number;
  stageName: string;
  progress: number; // 0-100
}) => Promise<void> | void;

// ═══════════════════════════════════════════════════════════════
// SETTINGS EXTRACTION
// ═══════════════════════════════════════════════════════════════

/**
 * Extract structured settings from campaign record.
 * The frontend stores settings across multiple campaign fields.
 * This function normalizes them into a clean StoryCampaignSettings object.
 */
export function extractCampaignSettings(campaign: any): StoryCampaignSettings {
  // campaignSettings JSONB may contain all settings
  const cs = (campaign.campaignSettings || {}) as Record<string, any>;
  const isAutoAsmr = (campaign.template || cs.storyTemplate) === 'auto-asmr';
  
  return {
    // Content
    template: (campaign.template || cs.storyTemplate || 'problem-solution') as StoryTemplate,
    templateType: (cs.storyTemplateType || 'narrative') as any,
    
    // Technical
    duration: cs.storyDuration || 30,
    aspectRatio: cs.storyAspectRatio || '9:16',
    language: cs.storyLanguage || 'en',
    pacing: cs.storyPacing || 'medium',
    
    // Text Overlay
    textOverlayEnabled: cs.storyTextOverlayEnabled ?? false,
    textOverlayStyle: cs.storyTextOverlayStyle,
    
    // Visual
    imageStyle: cs.imageStyle || 'photorealistic',
    imageModel: cs.storyImageModel || 'nano-banana',
    imageResolution: cs.storyImageResolution || '1k',
    videoModel: cs.storyVideoModel,
    videoResolution: cs.storyVideoResolution || '720p',
    mediaType: cs.storyMediaType || 'static',
    transitionStyle: cs.storyTransition,
    
    // References
    styleReferenceUrl: cs.storyStyleReferenceUrl,
    characterReferenceUrl: cs.storyCharacterReferenceUrl,
    
    // Audio
    hasVoiceover: cs.storyHasVoiceover ?? true,
    voiceId: cs.storyVoiceId,
    voiceVolume: cs.storyVoiceVolume ?? 80,
    backgroundMusic: isAutoAsmr ? 'none' : (cs.storyBackgroundMusicTrack || 'none'),
    musicVolume: cs.storyMusicVolume ?? 30,
  };
}

// ═══════════════════════════════════════════════════════════════
// STEP NAME MAPPING
// ═══════════════════════════════════════════════════════════════

const STEP_NAMES: Record<number, string> = {
  1: 'Generating story script',
  2: 'Breaking into scenes',
  3: 'Enhancing storyboard',
  4: 'Generating images',
  5: 'Generating videos',
  6: 'Generating voiceover',
  7: 'Generating music',
  8: 'Exporting final video',
  9: 'Publishing to social media',
};

/**
 * Get human-readable stage name from step number
 */
export function getStageFromStep(step: number): string {
  return STEP_NAMES[step] || 'Processing';
}

/**
 * Calculate rough progress percentage within current step
 */
export function calculateStepProgress(currentStep: number): number {
  return Math.min(currentStep * 12.5, 100);
}

// ═══════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a full story from a topic using the shared agents pipeline.
 * 
 * This is the core function called by the batch processor for each topic.
 * It mirrors the auto-video's generateFullVideo() function.
 * 
 * Intermediate state is kept in memory. The story record is only created
 * at the end when the final video is ready (matching the manual Story Studio
 * pattern where createStory is called after export).
 * 
 * @param topic - The story topic/idea text
 * @param settings - Campaign settings extracted from the campaign record
 * @param userId - User ID for tracking and asset storage
 * @param workspaceId - Workspace ID for asset storage
 * @param options - Optional retry settings
 * @returns StoryGenerationResult with success/failure and metadata
 */
export async function generateFullStory(
  topic: string,
  settings: StoryCampaignSettings,
  userId: string,
  workspaceId: string,
  options?: StoryGenerationOptions,
  onProgress?: StoryProgressCallback
): Promise<StoryGenerationResult> {
  const startTime = Date.now();
  const storyMode = settings.template as StoryMode;
  let currentStep = 0;
  let totalCost = 0;

  console.log('[story-orchestrator] ═══════════════════════════════════════════════');
  console.log('[story-orchestrator] 🎬 Starting story generation');
  console.log('[story-orchestrator] ═══════════════════════════════════════════════');
  console.log('[story-orchestrator] Topic:', topic.substring(0, 80));
  console.log('[story-orchestrator] Template:', settings.template);
  console.log('[story-orchestrator] Duration:', settings.duration, 'seconds');
  console.log('[story-orchestrator] Aspect ratio:', settings.aspectRatio);
  console.log('[story-orchestrator] Language:', settings.language);
  console.log('[story-orchestrator] Pacing:', settings.pacing || 'medium');
  console.log('[story-orchestrator] ── Visual ──');
  console.log('[story-orchestrator] Media type:', settings.mediaType);
  console.log('[story-orchestrator] Image model:', settings.imageModel);
  console.log('[story-orchestrator] Image resolution:', settings.imageResolution || '1k');
  console.log('[story-orchestrator] Image style:', settings.imageStyle);
  console.log('[story-orchestrator] Video model:', settings.videoModel || 'none (static)');
  console.log('[story-orchestrator] Video resolution:', settings.videoResolution || 'N/A');
  console.log('[story-orchestrator] Transition style:', settings.transitionStyle || 'N/A');
  console.log('[story-orchestrator] ── Audio ──');
  console.log('[story-orchestrator] Voiceover:', settings.hasVoiceover);
  console.log('[story-orchestrator] Voice ID:', settings.voiceId || 'none');
  console.log('[story-orchestrator] Voice volume:', settings.voiceVolume);
  console.log('[story-orchestrator] Background music:', settings.backgroundMusic || 'none');
  console.log('[story-orchestrator] Music volume:', settings.musicVolume);
  console.log('[story-orchestrator] ── Text Overlay ──');
  console.log('[story-orchestrator] Text overlay:', settings.textOverlayEnabled ? 'enabled' : 'disabled');
  console.log('[story-orchestrator] Text style:', settings.textOverlayStyle || 'N/A');
  console.log('[story-orchestrator] ── References ──');
  console.log('[story-orchestrator] Style reference:', settings.styleReferenceUrl ? 'yes' : 'none');
  console.log('[story-orchestrator] Character reference:', settings.characterReferenceUrl ? 'yes' : 'none');
  console.log('[story-orchestrator] ═══════════════════════════════════════════════');
  // ─────────────────────────────────────────────────────────────
  // RETRY RESUMPTION: Load cached data from previous failed attempt
  // ─────────────────────────────────────────────────────────────
  const cached = options?.intermediateData;
  const resumeFromStep = (cached?.completedStep || 0) + 1;
  
  if (options?.isRetry && cached) {
    console.log('[story-orchestrator] ⚠️ RETRY — resuming from step', resumeFromStep, '(completed up to step', cached.completedStep, ')');
  } else if (options?.isRetry) {
    console.log('[story-orchestrator] ⚠️ RETRY — no cached data, restarting from step 1');
  }

  // Pipeline state — declared outside try so catch can snapshot them for retry
  let storyScript = cached?.storyScript || '';
  let scenes: any[] = cached?.scenes || [];
  let generatedMusicUrl = cached?.generatedMusicUrl || '';
  totalCost = cached?.totalCost || 0;

  try {
    // ─────────────────────────────────────────────────────────────
    // 1. RESOLVE WORKSPACE & PROJECT INFO
    // ─────────────────────────────────────────────────────────────
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find(w => w.id === workspaceId);
    const resolvedWorkspaceName = cached?.workspaceName || workspace?.name || workspaceId;
    const projectName = cached?.projectName || topic.substring(0, 50).replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '').trim() || 'Auto Story';
    const dateLabel = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const projectFolder = `${projectName}_${dateLabel}`;

    // ─────────────────────────────────────────────────────────────
    // 2. INITIALIZE AGENTS (async factory pattern)
    // ─────────────────────────────────────────────────────────────
    console.log('[story-orchestrator] Initializing agents for mode:', storyMode);
    
    const [
      generateStoryScript,
      generateScenes,
      enhanceStoryboard,
      generateImages,
      generateVideos,
      generateVoiceover,
      generateMusic,
      generateSoundEffects,
    ] = await Promise.all([
      createIdeaGenerator(storyMode),
      createSceneGenerator(storyMode),
      createStoryboardEnhancer(storyMode),
      createImageGenerator(storyMode),
      createVideoGenerator(storyMode),
      createVoiceoverGenerator(storyMode),
      createMusicGenerator(storyMode),
      createSoundEffectsGenerator(storyMode),
    ]);
    
    // ─────────────────────────────────────────────────────────────
    // 2b. AUTO-ASMR: Determine if video model has native audio
    // ─────────────────────────────────────────────────────────────
    const isAutoAsmr = settings.templateType === 'auto-asmr';
    let modelHasNativeAudio = false;
    
    if (isAutoAsmr) {
      // Auto-ASMR always uses image-to-video (animated) mode
      if (settings.mediaType !== 'animated' || !settings.videoModel) {
        console.log('[story-orchestrator] Auto-ASMR: Forcing animated mode with default video model');
        settings.mediaType = 'animated' as any;
        settings.videoModel = settings.videoModel || 'seedance-1.0-pro';
      }
      
      // Check if the selected video model supports native audio
      const modelConstraints = getVideoModelConstraints(settings.videoModel);
      modelHasNativeAudio = modelConstraints?.hasAudio ?? false;
      
      // Auto-ASMR never has voiceover
      settings.hasVoiceover = false;
      
      console.log('[story-orchestrator] Auto-ASMR config:', {
        videoModel: settings.videoModel,
        modelHasNativeAudio,
        hasVoiceover: false,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. EXECUTE PIPELINE STEPS
    // ─────────────────────────────────────────────────────────────
    // On retry, load cached intermediate data and skip completed steps.
    // Steps 1-3 are cheap GPT calls. Steps 4-7 are expensive API calls.

    // ── STEP 1: Generate Story Script ──────────────────────────
    currentStep = 1;
    if (resumeFromStep <= 1) {
      console.log('[story-orchestrator] Step 1: Generating story script...');
      
      const scriptResult = await generateStoryScript(
        {
          ideaText: topic,
          durationSeconds: settings.duration,
        },
        userId,
        workspaceId,
        'story',
        storyMode
      );
      
      storyScript = scriptResult.story;
      totalCost += scriptResult.cost || 0;
      
      console.log('[story-orchestrator] ✓ Step 1 complete. Script length:', storyScript.length);
    } else {
      console.log('[story-orchestrator] Step 1: ⏭ Skipped (cached)');
    }
    await onProgress?.({ step: 1, stageName: STEP_NAMES[1], progress: 12 });

    // ── STEP 2: Break into Scenes ──────────────────────────────
    currentStep = 2;
    if (resumeFromStep <= 2) {
      console.log('[story-orchestrator] Step 2: Breaking into scenes...');
      
      const sceneResult = await generateScenes(
        {
          storyText: storyScript,
          duration: settings.duration,
          pacing: settings.pacing || 'medium',
          videoModel: settings.mediaType === 'animated' ? settings.videoModel : undefined,
        },
        userId,
        workspaceId,
        'story',
        storyMode
      );
      
      scenes = sceneResult.scenes;
      totalCost += sceneResult.cost || 0;
      
      console.log('[story-orchestrator] ✓ Step 2 complete. Scenes:', scenes.length);
    } else {
      console.log('[story-orchestrator] Step 2: ⏭ Skipped (cached,', scenes.length, 'scenes)');
    }
    await onProgress?.({ step: 2, stageName: STEP_NAMES[2], progress: 25 });

    // ── STEP 3: Enhance Storyboard ─────────────────────────────
    currentStep = 3;
    if (resumeFromStep <= 3) {
      console.log('[story-orchestrator] Step 3: Enhancing storyboard...');
      
      const animationType = (settings.mediaType === 'animated' && settings.videoModel) ? 'image-to-video' : 'transition';
      
      const storyboardResult = await enhanceStoryboard(
        {
          scenes: scenes.map((s: any) => ({
            sceneNumber: s.sceneNumber,
            duration: s.duration,
            description: s.description,
            narration: s.narration,
          })),
          aspectRatio: settings.aspectRatio,
          imageStyle: settings.imageStyle,
          voiceoverEnabled: settings.hasVoiceover,
          language: settings.hasVoiceover ? settings.language : undefined,
          textOverlay: settings.textOverlayEnabled ? (settings.textOverlayStyle || 'key-points') : undefined,
          animationMode: true,
          animationType,
          styleReferenceUrl: settings.styleReferenceUrl,
          characterReferenceUrl: settings.characterReferenceUrl,
        },
        userId,
        workspaceId,
        'story',
        storyMode
      );
      
      const enhancedScenes = storyboardResult.scenes;
      totalCost += storyboardResult.cost || 0;
      
      // Merge enhanced data back into scenes
      scenes = scenes.map((scene: any, i: number) => {
        const enhanced = enhancedScenes.find((e: any) => e.sceneNumber === scene.sceneNumber) || enhancedScenes[i];
        return {
          ...scene,
          id: scene.id || `scene-${scene.sceneNumber}`,
          imagePrompt: enhanced?.imagePrompt || scene.description,
          voiceText: enhanced?.voiceText || scene.narration,
          voiceMood: enhanced?.voiceMood || 'neutral',
          videoPrompt: enhanced?.videoPrompt,
          animationName: enhanced?.animationName,
          effectName: enhanced?.effectName,
          transitionToNext: settings.transitionStyle || enhanced?.transitionToNext,
          transitionDuration: enhanced?.transitionDuration,
        };
      });
      
      console.log('[story-orchestrator] ✓ Step 3 complete. Enhanced scenes:', enhancedScenes.length);
    } else {
      console.log('[story-orchestrator] Step 3: ⏭ Skipped (cached)');
    }
    await onProgress?.({ step: 3, stageName: STEP_NAMES[3], progress: 37 });

    // ── STEP 4: Generate Images ────────────────────────────────
    currentStep = 4;
    if (resumeFromStep <= 4) {
      console.log('[story-orchestrator] Step 4: Generating images...');
      
      const imageResults = await generateImages(
        {
          storyId: 'auto-story-temp',
          scenes: scenes.map((s: any) => ({
            id: s.id || `scene-${s.sceneNumber}`,
            sceneNumber: s.sceneNumber,
            imagePrompt: s.imagePrompt || s.description,
            duration: s.duration,
          })),
          aspectRatio: settings.aspectRatio,
          imageStyle: settings.imageStyle,
          styleReferenceUrl: settings.styleReferenceUrl,
          characterReferenceUrl: settings.characterReferenceUrl,
          imageModel: settings.imageModel,
          imageResolution: settings.imageResolution || '1k',
          videoModel: settings.mediaType === 'animated' ? settings.videoModel : undefined,
          videoResolution: settings.videoResolution,
          projectName,
          workspaceId,
        },
        userId,
        resolvedWorkspaceName,
        'story',
        storyMode
      );
      
      totalCost += imageResults.totalCost || 0;
      
      // Update scenes with image URLs
      scenes = scenes.map((scene: any) => {
        const imgResult = imageResults.scenes.find((r: any) => r.sceneNumber === scene.sceneNumber);
        return {
          ...scene,
          imageUrl: imgResult?.imageUrl || scene.imageUrl,
        };
      });
      
      const imgSuccessCount = imageResults.scenes.filter((s: any) => s.status === 'generated').length;
      console.log('[story-orchestrator] ✓ Step 4 complete. Images generated:', imgSuccessCount, '/', scenes.length);
      
      if (imgSuccessCount === 0) {
        throw new Error('All image generation failed (content moderation or provider error) — cannot continue');
      }
    } else {
      console.log('[story-orchestrator] Step 4: ⏭ Skipped (cached,', scenes.filter((s: any) => s.imageUrl).length, 'images)');
    }
    await onProgress?.({ step: 4, stageName: STEP_NAMES[4], progress: 50 });

    // ── STEP 5: Generate Videos (if animated) ──────────────────
    currentStep = 5;
    if (settings.mediaType === 'animated' && settings.videoModel) {
      if (resumeFromStep <= 5) {
        console.log('[story-orchestrator] Step 5: Generating videos...');
        
        const videoResults = await generateVideos(
          {
            storyId: 'auto-story-temp',
            scenes: scenes.map((s: any) => ({
              id: s.id || `scene-${s.sceneNumber}`,
              sceneNumber: s.sceneNumber,
              imageUrl: s.imageUrl,
              videoPrompt: s.videoPrompt,
              narration: s.narration,
              voiceMood: s.voiceMood,
              duration: s.duration,
            })),
            videoModel: settings.videoModel,
            videoResolution: settings.videoResolution || '720p',
            aspectRatio: settings.aspectRatio,
            imageStyle: settings.imageStyle,
            projectName,
            workspaceId,
          },
          userId,
          resolvedWorkspaceName,
          'story',
          storyMode
        );
        
        totalCost += videoResults.totalCost || 0;
        
        // Update scenes with video URLs
        scenes = scenes.map((scene: any) => {
          const vidResult = videoResults.scenes.find((r: any) => r.sceneNumber === scene.sceneNumber);
          return {
            ...scene,
            videoUrl: vidResult?.videoUrl || scene.videoUrl,
            actualDuration: vidResult?.actualDuration || scene.duration,
          };
        });
        
        const vidSuccessCount = videoResults.scenes.filter((s: any) => s.status === 'generated').length;
        console.log('[story-orchestrator] ✓ Step 5 complete. Videos generated:', vidSuccessCount, '/', scenes.length);
      } else {
        console.log('[story-orchestrator] Step 5: ⏭ Skipped (cached,', scenes.filter((s: any) => s.videoUrl).length, 'videos)');
      }
    } else {
      console.log('[story-orchestrator] Step 5: Skipped (static mode or no video model)');
    }
    await onProgress?.({ step: 5, stageName: STEP_NAMES[5], progress: 62 });

    // ── STEP 5b: Generate Sound Effects (auto-asmr + model without native audio) ──
    if (isAutoAsmr && !modelHasNativeAudio) {
      // Check if sound effects are already cached (scenes have audioUrl from previous run)
      const scenesWithAudio = scenes.filter((s: any) => s.audioUrl);
      if (scenesWithAudio.length > 0 && resumeFromStep > 6) {
        console.log('[story-orchestrator] Step 5b: ⏭ Skipped (cached,', scenesWithAudio.length, 'sound effects)');
      } else {
      console.log('[story-orchestrator] Step 5b: Generating sound effects (model has no native audio)...');
      
      // Filter scenes that have soundDescription (generated by scene breakdown AI)
      const scenesNeedingSfx = scenes.filter((s: any) => s.soundDescription && s.soundDescription.trim().length > 0);
      
      if (scenesNeedingSfx.length > 0) {
        try {
          const sfxResults = await generateSoundEffects(
            {
              storyId: 'auto-story-temp',
              scenes: scenesNeedingSfx.map((s: any) => ({
                sceneNumber: s.sceneNumber,
                soundDescription: s.soundDescription,
                duration: s.duration,
              })),
              projectName,
              workspaceId,
            },
            userId,
            resolvedWorkspaceName,
            'story',
            storyMode
          );
          
          totalCost += sfxResults.totalCost || 0;
          
          // Update scenes with sound effect audio URLs
          scenes = scenes.map((scene: any) => {
            const sfxResult = sfxResults.scenes.find((r: any) => r.sceneNumber === scene.sceneNumber);
            if (sfxResult?.audioUrl) {
              return {
                ...scene,
                audioUrl: sfxResult.audioUrl,
                actualDuration: sfxResult.duration || scene.actualDuration || scene.duration,
              };
            }
            return scene;
          });
          
          const sfxSuccessCount = sfxResults.scenes.filter((s: any) => s.status === 'generated').length;
          console.log('[story-orchestrator] ✓ Step 5b complete. Sound effects generated:', sfxSuccessCount, '/', scenesNeedingSfx.length);
        } catch (sfxError: any) {
          console.error('[story-orchestrator] ✗ Sound effects generation failed:', sfxError?.message);
          // Continue without sound effects — video will be silent
        }
      } else {
        console.log('[story-orchestrator] Step 5b: No scenes with soundDescription — skipping');
      }
      } // end else (not cached)
    } else if (isAutoAsmr && modelHasNativeAudio) {
      console.log('[story-orchestrator] Step 5b: Skipped (model has native audio — sound is in video clips)');
    }

    // ── STEP 6: Generate Voiceover (if enabled) ────────────────
    currentStep = 6;
    if (settings.hasVoiceover) {
      if (resumeFromStep <= 6) {
        console.log('[story-orchestrator] Step 6: Generating voiceover...');
        
        const voiceoverResults = await generateVoiceover(
          {
            storyId: 'auto-story-temp',
            scenes: scenes.map((s: any) => ({
              id: s.id || `scene-${s.sceneNumber}`,
              sceneNumber: s.sceneNumber,
              narration: s.voiceText || s.narration || '',
              voiceMood: s.voiceMood,
              duration: s.duration,
            })),
            voiceId: settings.voiceId || 'EXAVITQu4vr4xnSDxMaL', // Default: ElevenLabs Rachel
            projectName,
            workspaceId,
          },
          userId,
          resolvedWorkspaceName,
          'story',
          storyMode
        );
        
        totalCost += voiceoverResults.totalCost || 0;
        
        // Update scenes with audio URLs, actual duration, and word timestamps
        // (same data the manual Story Studio uses for precise subtitle sync)
        scenes = scenes.map((scene: any) => {
          const voResult = voiceoverResults.scenes.find((r: any) => r.sceneNumber === scene.sceneNumber);
          return {
            ...scene,
            audioUrl: voResult?.audioUrl || scene.audioUrl,
            actualDuration: voResult?.duration || scene.actualDuration || scene.duration,
            wordTimestamps: voResult?.wordTimestamps || scene.wordTimestamps,
          };
        });
        
        const voSuccessCount = voiceoverResults.scenes.filter((s: any) => s.status === 'generated').length;
        console.log('[story-orchestrator] ✓ Step 6 complete. Voiceovers generated:', voSuccessCount, '/', scenes.length);
      } else {
        console.log('[story-orchestrator] Step 6: ⏭ Skipped (cached)');
      }
    } else {
      console.log('[story-orchestrator] Step 6: Skipped (voiceover disabled)');
    }
    await onProgress?.({ step: 6, stageName: STEP_NAMES[6], progress: 75 });

    // ── STEP 7: Generate Music ─────────────────────────────────
    currentStep = 7;
    if (settings.backgroundMusic && settings.backgroundMusic !== 'none') {
      if (resumeFromStep <= 7) {
        console.log('[story-orchestrator] Step 7: Generating music...');
        console.log('[story-orchestrator] Music style:', settings.backgroundMusic);
        
        const totalDurationMs = scenes.reduce((sum: number, s: any) => sum + (s.duration || 0), 0) * 1000;
        
        const musicResult = await generateMusic(
          {
            musicStyle: settings.backgroundMusic,
            durationMs: Math.max(totalDurationMs, 10000),
            storyTopic: topic,
            projectName,
            workspaceId,
          },
          userId,
          resolvedWorkspaceName,
          'story',
          storyMode
        );
        
        generatedMusicUrl = musicResult.musicUrl || '';
        totalCost += musicResult.cost || 0;
        
        console.log('[story-orchestrator] ✓ Step 7 complete. Music URL:', generatedMusicUrl ? 'generated' : 'none');
      } else {
        console.log('[story-orchestrator] Step 7: ⏭ Skipped (cached, music URL:', generatedMusicUrl ? 'yes' : 'none', ')');
      }
    } else {
      console.log('[story-orchestrator] Step 7: Skipped (no music)');
    }
    await onProgress?.({ step: 7, stageName: STEP_NAMES[7], progress: 87 });

    // ── STEP 8: Export Final Video via Shotstack (Cloud Rendering) ────
    currentStep = 8;
    
    console.log('[story-orchestrator] ═══════════════════════════════════════════════');
    console.log('[story-orchestrator] Step 8: Exporting via Shotstack (cloud)');
    console.log('[story-orchestrator] ═══════════════════════════════════════════════');
    console.log('[story-orchestrator] mediaType:', settings.mediaType);
    console.log('[story-orchestrator] textOverlayEnabled:', settings.textOverlayEnabled);
    console.log('[story-orchestrator] hasVoiceover:', settings.hasVoiceover);
    console.log('[story-orchestrator] language:', settings.language);
    console.log('[story-orchestrator] aspectRatio:', settings.aspectRatio);
    
    if (!isShotstackConfigured()) {
      throw new Error('Shotstack is not configured. Set SHOTSTACK_API_KEY environment variable.');
    }
    
    let finalVideoUrl: string | undefined;
    let finalThumbnailUrl: string | undefined;
    let exportDuration = 0;
    
    {
      // ── 8a: Filter valid scenes ────────────────────────────────
      const validScenes = scenes.filter((s: any) => {
        if (settings.mediaType === 'animated') return s.videoUrl || s.imageUrl;
        return s.imageUrl;
      });
      
      if (validScenes.length === 0) {
        throw new Error('No scenes have valid media (video or image) — cannot export');
      }
      
      const durations = validScenes.map((s: any, index: number) => {
        const dur = s.actualDuration || s.duration;
        return index === validScenes.length - 1 ? dur + 1 : dur;
      });
      
      const hasVoiceover = validScenes.some((s: any) => s.audioUrl);
      console.log('[story-orchestrator] Valid scenes:', validScenes.length, '| Has voiceover:', hasVoiceover);
      
      // ── 8b: Build Shotstack timeline clips ─────────────────────
      console.log('[story-orchestrator] ═══════════════════════════════════════════════');
      console.log('[story-orchestrator] 8b: Building Shotstack timeline');
      console.log('[story-orchestrator] ═══════════════════════════════════════════════');
      
      const videoTrackClips: Clip[] = [];
      const audioTrackClips: Clip[] = [];
      let timelineCursor = 0;
      
      for (let i = 0; i < validScenes.length; i++) {
        const scene = validScenes[i];
        const sceneDuration = durations[i];
        const isLastScene = i === validScenes.length - 1;
        
        // Build transition for this clip (in + out for smooth blending)
        let transition: Transition | undefined;
        if (!isLastScene) {
          const transEffect = (scene.transitionToNext && scene.transitionToNext !== 'none')
            ? mapStoryTransition(scene.transitionToNext)
            : 'fade' as TransitionEffect;
          transition = { in: transEffect, out: transEffect };
        }
        
        if (settings.mediaType === 'animated' && scene.videoUrl) {
          // ── ANIMATED MODE: VideoAsset with speed sync ──
          // Shotstack handles speed natively — no local FFmpeg needed
          let videoSpeed: number | undefined;
          
          // Dual Speed Sync: adjust video speed to match audio duration
          // For auto-asmr with native audio, no speed sync needed (audio is in video)
          if (!(isAutoAsmr && modelHasNativeAudio) && scene.audioUrl && scene.actualDuration && scene.duration) {
            const originalVideoDuration = scene.duration;
            const audioDuration = scene.actualDuration;
            const ratio = originalVideoDuration / audioDuration;
            // Only apply speed if difference is significant (>5%)
            if (Math.abs(ratio - 1.0) > 0.05) {
              videoSpeed = Math.max(0.3, Math.min(3.0, ratio));
              console.log(`[story-orchestrator]   Scene ${i + 1}: Video speed ${videoSpeed.toFixed(2)}x (video=${originalVideoDuration.toFixed(1)}s → audio=${audioDuration.toFixed(1)}s)`);
            }
          }
          
          // Auto-ASMR with native audio: keep video sound (volume=1)
          // All other cases: mute video (volume=0) — audio is on separate track
          const videoVolume = (isAutoAsmr && modelHasNativeAudio) ? 1 : 0;
          
          const videoClip: Clip = {
            asset: {
              type: 'video',
              src: scene.videoUrl,
              volume: videoVolume,
              ...(videoSpeed && { speed: videoSpeed }),
            } as VideoAsset,
            start: timelineCursor,
            length: sceneDuration,
            fit: 'cover',
          };
          if (transition) videoClip.transition = transition;
          videoTrackClips.push(videoClip);
          
        } else if (scene.imageUrl) {
          // ── STATIC/IMAGE MODE: ImageAsset with Ken Burns ──
          const effect = mapStoryEffect(scene.animationName);
          
          const imageClip: Clip = {
            asset: {
              type: 'image',
              src: scene.imageUrl,
            } as ImageAsset,
            start: timelineCursor,
            length: sceneDuration,
            fit: 'cover',
          };
          if (effect) imageClip.effect = effect;
          if (transition) imageClip.transition = transition;
          videoTrackClips.push(imageClip);
        }
        
        // Audio clip for this scene (voiceover or sound effects)
        // Skip for auto-asmr with native audio — sound is already in the video clip
        if (scene.audioUrl && !(isAutoAsmr && modelHasNativeAudio)) {
          const voiceVol = (settings.voiceVolume || 80) / 100;
          const audioClip: Clip = {
            asset: {
              type: 'audio',
              src: scene.audioUrl,
              volume: voiceVol,
            } as AudioAsset,
            start: timelineCursor,
            length: sceneDuration,
          };
          audioTrackClips.push(audioClip);
        }
        
        timelineCursor += sceneDuration;
      }
      
      const totalDuration = timelineCursor;
      console.log('[story-orchestrator] ✓ Timeline clips built:', {
        videoClips: videoTrackClips.length,
        audioClips: audioTrackClips.length,
        totalDuration: totalDuration.toFixed(1) + 's',
      });
      
      // ── 8c: Generate SRT for subtitles (if enabled) ────────────
      const captionTrackClips: Clip[] = [];
      
      if (settings.textOverlayEnabled && hasVoiceover) {
        console.log('[story-orchestrator] ═══════════════════════════════════════════════');
        console.log('[story-orchestrator] 8c: Generating SRT for Shotstack captions');
        console.log('[story-orchestrator] ═══════════════════════════════════════════════');
        
        try {
          const scenesForSubtitles: SubtitleScene[] = validScenes.map((s: any) => ({
            sceneNumber: s.sceneNumber,
            narration: s.narration || s.voiceText || '',
            duration: s.actualDuration || s.duration,
            wordTimestamps: s.wordTimestamps || [],
            audioSpeed: 1.0, // Shotstack handles speed natively, no timestamp correction needed
          }));
          
          // Generate SRT file locally, then upload to CDN for Shotstack to fetch
          const srtPath = createSrtFile(scenesForSubtitles);
          
          const { readFile, unlink } = await import('fs/promises');
          const srtBuffer = await readFile(srtPath);
          
          const srtUploadPath = buildStoryModePath({
            userId,
            workspaceName: resolvedWorkspaceName,
            toolMode: storyMode,
            projectName,
            subfolder: 'Render',
            filename: `subtitles_${Date.now()}.srt`,
          });
          const srtUrl = await bunnyStorage.uploadFile(srtUploadPath, srtBuffer, 'text/plain');
          
          // Cleanup temp SRT file
          try { await unlink(srtPath); } catch {}
          
          // Build caption clip spanning entire video
          const isArabic = (settings.language || 'en').startsWith('ar');
          const subtitleSize = settings.textOverlayStyle === 'bold' ? 20 : settings.textOverlayStyle === 'cinematic' ? 16 : 18;
          
          captionTrackClips.push({
            asset: {
              type: 'caption',
              src: srtUrl,
              font: {
                family: isArabic ? 'Cairo' : 'Montserrat',
                color: '#ffffff',
                size: subtitleSize,
                stroke: '#000000',
                strokeWidth: 0.8,
              },
              background: {
                color: '#000000',
                opacity: 0.4,
                padding: 20,
                borderRadius: 12,
              },
            } as CaptionAsset,
            start: 0,
            length: totalDuration,
          });
          
          console.log('[story-orchestrator] ✓ SRT uploaded for captions:', srtUrl.substring(0, 60));
        } catch (subErr: any) {
          console.error('[story-orchestrator] ✗ SRT/Caption generation failed:', subErr?.message);
          // Continue without captions
        }
      } else {
        console.log('[story-orchestrator] Captions skipped (overlay:', settings.textOverlayEnabled, ', voiceover:', hasVoiceover, ')');
      }
      
      // ── 8d: Assemble Shotstack Edit JSON ─────────────────────
      console.log('[story-orchestrator] ═══════════════════════════════════════════════');
      console.log('[story-orchestrator] 8d: Assembling Shotstack Edit JSON');
      console.log('[story-orchestrator] ═══════════════════════════════════════════════');
      
      const tracks: Track[] = [];
      
      // Track 1 (top layer): Captions overlay
      if (captionTrackClips.length > 0) {
        tracks.push({ clips: captionTrackClips });
      }
      
      // Track 2: Visual media (images/videos)
      if (videoTrackClips.length > 0) {
        tracks.push({ clips: videoTrackClips });
      }
      
      // Track 3: Voiceover audio per scene
      if (audioTrackClips.length > 0) {
        tracks.push({ clips: audioTrackClips });
      }
      
      // Background music as soundtrack
      let soundtrack: Soundtrack | undefined;
      if (generatedMusicUrl) {
        const effectiveMusicVol = (settings.musicVolume || 40) / 100;
        
        soundtrack = {
          src: generatedMusicUrl,
          effect: 'fadeInFadeOut',
          volume: effectiveMusicVol,
        };
        console.log('[story-orchestrator] Soundtrack:', { volume: effectiveMusicVol.toFixed(2) });
      }
      
      // Arabic font support for captions
      const isArabicLang = (settings.language || 'en').startsWith('ar');
      const fonts: { src: string }[] = [];
      if (isArabicLang && captionTrackClips.length > 0) {
        fonts.push({
          src: 'https://fonts.gstatic.com/s/cairo/v31/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hD45W1Q.ttf',
        });
      }
      
      const timeline: Timeline = {
        tracks,
        background: '#000000',
        ...(soundtrack && { soundtrack }),
        ...(fonts.length > 0 && { fonts }),
        cache: true,
      };
      
      const edit: ShotstackEdit = {
        timeline,
        output: {
          format: 'mp4',
          resolution: '1080',
          aspectRatio: settings.aspectRatio || '9:16',
          fps: 30,
          thumbnail: {
            capture: 1,
            scale: 0.5,
          },
        },
      };
      
      const clipCount = tracks.reduce((sum, t) => sum + t.clips.length, 0);
      console.log('[story-orchestrator] ✓ Edit JSON built:', {
        tracks: tracks.length,
        clips: clipCount,
        duration: totalDuration.toFixed(1) + 's',
        hasSubtitles: captionTrackClips.length > 0,
        hasMusic: !!soundtrack,
      });
      
      // ── 8e: Submit render to Shotstack ──────────────────────────
      console.log('[story-orchestrator] ═══════════════════════════════════════════════');
      console.log('[story-orchestrator] 8e: Submitting render to Shotstack');
      console.log('[story-orchestrator] ═══════════════════════════════════════════════');
      
      const client = getShotstackClient();
      const renderResponse = await client.render(edit);
      const renderId = renderResponse.response.id;
      console.log('[story-orchestrator] Render submitted. ID:', renderId);
      
      // ── 8f: Poll for completion ──────────────────────────────────
      console.log('[story-orchestrator] 8f: Polling render status...');
      
      const finalStatus = await client.pollRenderStatus(
        renderId,
        5000,  // Poll every 5 seconds
        120,   // Max 120 attempts (10 minutes)
        (status) => {
          const s = status.response.status;
          if (s === 'rendering' || s === 'fetching') {
            console.log(`[story-orchestrator] Render status: ${s}`);
          }
        }
      );
      
      if (finalStatus.response.status !== 'done' || !finalStatus.response.url) {
        throw new Error(`Shotstack render failed: ${finalStatus.response.status} — ${finalStatus.response.error || 'Unknown error'}`);
      }
      
      console.log('[story-orchestrator] ✓ Render complete:', {
        url: finalStatus.response.url.substring(0, 60),
        duration: finalStatus.response.duration,
        renderTime: finalStatus.response.renderTime,
      });
      
      exportDuration = finalStatus.response.duration || totalDuration;
      
      // ── 8g: Download from Shotstack & upload to Bunny CDN ──────
      console.log('[story-orchestrator] ═══════════════════════════════════════════════');
      console.log('[story-orchestrator] 8g: Uploading to Bunny CDN');
      console.log('[story-orchestrator] ═══════════════════════════════════════════════');
      
      if (bunnyStorage.isBunnyConfigured()) {
        // Download and re-upload video to Bunny CDN for permanent storage
        const videoResponse = await fetch(finalStatus.response.url);
        if (videoResponse.ok) {
          const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
          console.log(`[story-orchestrator] Video size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB`);
          
          const videoUploadPath = buildStoryModePath({
            userId,
            workspaceName: resolvedWorkspaceName,
            toolMode: storyMode,
            projectName,
            subfolder: 'Render',
            filename: `final_${Date.now()}.mp4`,
          });
          finalVideoUrl = await bunnyStorage.uploadFile(videoUploadPath, videoBuffer, 'video/mp4');
          console.log('[story-orchestrator] ✓ Video uploaded to Bunny CDN');
        } else {
          console.error('[story-orchestrator] ✗ Failed to download rendered video from Shotstack');
          // Fall back to Shotstack URL (temporary)
          finalVideoUrl = finalStatus.response.url;
        }
        
        // Upload thumbnail from Shotstack
        if (finalStatus.response.thumbnail) {
          try {
            const thumbResponse = await fetch(finalStatus.response.thumbnail);
            if (thumbResponse.ok) {
              const thumbBuffer = Buffer.from(await thumbResponse.arrayBuffer());
              const thumbUploadPath = buildStoryModePath({
                userId,
                workspaceName: resolvedWorkspaceName,
                toolMode: storyMode,
                projectName,
                subfolder: 'Render',
                filename: `thumbnail_${Date.now()}.jpg`,
              });
              finalThumbnailUrl = await bunnyStorage.uploadFile(thumbUploadPath, thumbBuffer, 'image/jpeg');
              console.log('[story-orchestrator] ✓ Thumbnail uploaded to Bunny CDN');
            }
          } catch (thumbErr) {
            console.warn('[story-orchestrator] Thumbnail upload failed:', thumbErr);
          }
        }
      } else {
        // Use Shotstack URLs directly (temporary, expires after 24h)
        finalVideoUrl = finalStatus.response.url;
        finalThumbnailUrl = finalStatus.response.thumbnail;
        console.warn('[story-orchestrator] Bunny CDN not configured — using Shotstack URLs (temporary)');
      }
    }
    
    const exportResult = {
      videoUrl: finalVideoUrl,
      thumbnailUrl: finalThumbnailUrl,
      duration: exportDuration,
    };
    
    console.log('[story-orchestrator] ✓ Step 8 complete. Video exported:', exportResult.videoUrl ? 'yes' : 'no');
    await onProgress?.({ step: 8, stageName: STEP_NAMES[8], progress: 100 });

    // ─────────────────────────────────────────────────────────────
    // 4. CREATE STORY RECORD IN DB (after successful export)
    // ─────────────────────────────────────────────────────────────
    const story = await storage.createStory({
      userId,
      workspaceId,
      projectName,
      projectFolder,
      storyMode,
      videoUrl: exportResult.videoUrl || undefined,
      thumbnailUrl: exportResult.thumbnailUrl || undefined,
      duration: Math.round(exportResult.duration || settings.duration),
      aspectRatio: settings.aspectRatio,
    });
    
    // ─────────────────────────────────────────────────────────────
    // 5. STEP 9: PUBLISH TO SOCIAL PLATFORMS (optional, via Late.dev)
    // ─────────────────────────────────────────────────────────────
    currentStep = 9;
    if (settings.publishing?.enabled && exportResult.videoUrl) {
      console.log('[story-orchestrator] ═══════════════════════════════════════════════');
      console.log('[story-orchestrator] Step 9: Publishing to social media');
      console.log('[story-orchestrator] ═══════════════════════════════════════════════');
      console.log('[story-orchestrator] Publishing config:', {
        enabled: settings.publishing.enabled,
        platforms: settings.publishing.platforms,
        scheduleMode: settings.publishing.scheduleMode,
        scheduledFor: settings.publishing.scheduledFor,
      });
      await onProgress?.({ step: 9, stageName: STEP_NAMES[9], progress: 95 });
      
      try {
        const workspace = await storage.getWorkspace(workspaceId);
        const lateProfileId = (workspace as any)?.lateProfileId;
        
        if (!lateProfileId) {
          console.log('[story-orchestrator] No Late.dev profile connected, skipping publishing');
        } else {
          const connectedAccounts = await lateService.getConnectedAccounts(lateProfileId);
          const selectedPlatforms = settings.publishing.platforms || [];
          
          const platformsToPublish = selectedPlatforms.filter(platform => 
            connectedAccounts.some(account => account.platform === platform)
          );
          
          if (platformsToPublish.length === 0) {
            console.log('[story-orchestrator] No matching connected platforms, skipping');
          } else {
            console.log(`[story-orchestrator] Publishing to: ${platformsToPublish.join(', ')}`);
            
            // Generate AI metadata for each platform
            const scriptText = storyScript || topic;
            const duration = Math.round(exportResult.duration || settings.duration);
            const metadata: any = {};
            
            for (const platform of platformsToPublish) {
              try {
                console.log(`[story-orchestrator] Generating metadata for ${platform}...`);
                const metaResult = await generateSocialMetadata(
                  { platform: platform as any, scriptText, duration },
                  userId,
                  workspaceId,
                  'story',
                  storyMode
                );
                totalCost += metaResult.cost || 0;
                
                if (platform === 'youtube') {
                  metadata.youtube = {
                    title: metaResult.title || topic,
                    description: metaResult.description || '',
                    tags: [],
                    visibility: 'public',
                  };
                } else if (platform === 'tiktok') {
                  metadata.tiktok = {
                    caption: metaResult.caption || metaResult.description || '',
                    hashtags: [],
                  };
                } else if (platform === 'instagram') {
                  metadata.instagram = {
                    caption: metaResult.caption || metaResult.description || '',
                    hashtags: [],
                  };
                } else if (platform === 'facebook') {
                  metadata.facebook = {
                    caption: metaResult.caption || metaResult.description || '',
                    hashtags: [],
                  };
                }
                
                console.log(`[story-orchestrator] ✓ Metadata generated for ${platform}`);
              } catch (metaError: any) {
                console.error(`[story-orchestrator] Failed to generate metadata for ${platform}:`, metaError.message);
              }
            }
            
            // Determine schedule time
            let scheduledFor: string | undefined;
            let publishNow = true;
            
            const scheduleMode = settings.publishing.scheduleMode;
            if ((scheduleMode === 'scheduled' || scheduleMode === 'continuous') && settings.publishing.scheduledFor) {
              scheduledFor = settings.publishing.scheduledFor;
              publishNow = false;
              console.log(`[story-orchestrator] Scheduling for: ${scheduledFor} (mode: ${scheduleMode})`);
            } else {
              console.log(`[story-orchestrator] Publishing immediately (mode: ${scheduleMode || 'immediate'})`);
            }
            
            // Build platforms array with account IDs
            const platformsWithAccounts = platformsToPublish.map(platform => {
              const account = connectedAccounts.find(a => a.platform === platform);
              return {
                platform: platform as any,
                accountId: account?._id || '',
              };
            }).filter(p => p.accountId);
            
            if (platformsWithAccounts.length > 0) {
              console.log('[story-orchestrator] Calling Late.dev publish...');
              const publishResult = await lateService.publishVideo({
                workspaceId,
                videoUrl: exportResult.videoUrl,
                platforms: platformsWithAccounts,
                metadata,
                publishNow,
                scheduledFor,
                storiaVideoId: story.id,
                storiaContentType: 'story',
                storiaContentMode: storyMode,
                storiaThumbnailUrl: exportResult.thumbnailUrl,
                storiaDuration: duration,
                storiaAspectRatio: settings.aspectRatio,
              });
              
              console.log('[story-orchestrator] ✓ Publish result:', {
                postId: publishResult.postId,
                status: publishResult.status,
                platforms: publishResult.platforms,
                scheduledFor,
              });
            } else {
              console.log('[story-orchestrator] No valid account IDs found, skipping');
            }
          }
        }
      } catch (publishError: any) {
        // Don't fail the whole generation — publishing is optional
        console.error('[story-orchestrator] Publishing error (non-fatal):', publishError.message);
      }
      
      console.log('[story-orchestrator] ✓ Step 9 complete');
    } else {
      console.log('[story-orchestrator] Step 9: Skipping (publishing not enabled or no video URL)');
    }
    await onProgress?.({ step: 9, stageName: STEP_NAMES[9], progress: 100 });

    const elapsed = Date.now() - startTime;
    console.log('[story-orchestrator] ═══════════════════════════════════════════════');
    console.log('[story-orchestrator] ✓ Story generation completed');
    console.log('[story-orchestrator] ═══════════════════════════════════════════════');
    console.log('[story-orchestrator] Story ID:', story.id);
    console.log('[story-orchestrator] Duration:', `${Math.round(elapsed / 1000)}s`);
    console.log('[story-orchestrator] Total cost:', `$${totalCost.toFixed(4)}`);

    return {
      success: true,
      storyId: story.id,
      videoUrl: story.videoUrl || undefined,
      thumbnailUrl: story.thumbnailUrl || undefined,
      metadata: {
        title: topic,
        template: settings.template,
        currentStep: 9,
        totalCost,
        duration: settings.duration,
      },
    };

  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.error('[story-orchestrator] ═══════════════════════════════════════════════');
    console.error('[story-orchestrator] ✗ Story generation failed at step', currentStep);
    console.error('[story-orchestrator] ═══════════════════════════════════════════════');
    console.error('[story-orchestrator] Error:', error.message);
    console.error('[story-orchestrator] Elapsed:', `${Math.round(elapsed / 1000)}s`);
    console.error('[story-orchestrator] Cost so far:', `$${totalCost.toFixed(4)}`);

    // Build intermediate data snapshot for retry resumption
    // The last COMPLETED step is (currentStep - 1) since currentStep is where we failed
    const lastCompletedStep = Math.max(currentStep - 1, 0);
    const intermediateSnapshot: IntermediateData = {
      completedStep: lastCompletedStep,
      storyScript,
      scenes,
      generatedMusicUrl,
      totalCost,
    };

    console.log('[story-orchestrator] Cached intermediate data up to step', lastCompletedStep, 
      '- retry will resume from step', lastCompletedStep + 1);

    return {
      success: false,
      error: error.message || 'Failed to generate story',
      retryable: true,
      failedStep: currentStep,
      intermediateData: intermediateSnapshot,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHOTSTACK MAPPING HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Map story transition names to Shotstack TransitionEffect values.
 * Story scenes use descriptive names; Shotstack uses specific effect IDs.
 */
function mapStoryTransition(transition: string): TransitionEffect {
  const map: Record<string, TransitionEffect> = {
    'fade': 'fade',
    'cross-dissolve': 'fade',
    'crossfade': 'fade',
    'dissolve': 'fade',
    'wipe-left': 'wipeLeft',
    'wipe-right': 'wipeRight',
    'wipe-up': 'wipeUp',
    'wipe-down': 'wipeDown',
    'slide-left': 'slideLeft',
    'slide-right': 'slideRight',
    'slide-up': 'slideUp',
    'slide-down': 'slideDown',
    'zoom': 'zoom',
    'carousel-left': 'carouselLeft',
    'carousel-right': 'carouselRight',
    'reveal': 'reveal',
  };
  return map[transition] || 'fade';
}

/**
 * Map story animation/Ken Burns names to Shotstack Effect values.
 * Used for static images to add motion (zoom, pan).
 */
function mapStoryEffect(animationName?: string): Effect | undefined {
  if (!animationName) return 'zoomIn'; // Default Ken Burns
  
  const map: Record<string, Effect> = {
    'ken-burns': 'zoomIn',
    'ken-burns-in': 'zoomIn',
    'ken-burns-out': 'zoomOut',
    'zoom-in': 'zoomIn',
    'zoom-out': 'zoomOut',
    'pan-left': 'slideLeft',
    'pan-right': 'slideRight',
    'pan-up': 'slideUp',
    'pan-down': 'slideDown',
    'slide-left': 'slideLeft',
    'slide-right': 'slideRight',
    'none': undefined as unknown as Effect,
  };
  
  const result = map[animationName];
  if (result === undefined && animationName !== 'none') return 'zoomIn';
  return result || undefined;
}
