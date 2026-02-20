/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT ORCHESTRATOR SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Orchestrates the full 8-step ambient-visual agent pipeline for a single video.
 * Calls existing agents in sequence:
 * 
 * Step 1: Atmosphere   → Mood Description Generator
 * Step 3: Flow Design  → Scene Generator, Shot Composer, Continuity Producer
 * Step 4: Composition  → Video Prompt Engineer, Video Image Generator, Video Clip Generator
 * Step 5: Soundscape   → Voiceover, SFX, Music Generators
 * Step 6: Preview      → Timeline Builder
 * Step 7: Export       → Shotstack Rendering
 * Step 8: Publish      → Late.dev Social Publishing (optional)
 * 
 * Sequential execution with retry support on failures.
 */

import { storage } from '../../../../../storage';
import type { AmbientCampaignSettings, VideoGenerationResult } from '../../../types';
import type {
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
  Scene,
  Shot,
  ShotVersion,
  ContinuityGroup,
  MoodDescriptionGeneratorInput,
  SceneGeneratorInput,
  ShotComposerInput,
  ContinuityProducerInput,
  VideoPromptEngineerInput,
  VideoImageGeneratorBatchInput,
  VideoClipGeneratorBatchInput,
} from '../../../../../modes/ambient-visual/types';

// Import existing agents from server/modes/ambient-visual/agents
// Note: These are in the main modes folder, not autoproduction
import { generateMoodDescription } from '../../../../../modes/ambient-visual/agents/mood-description-generator';
import { generateScenes } from '../../../../../modes/ambient-visual/agents/scene-generator';
import { composeShots } from '../../../../../modes/ambient-visual/agents/shot-composer';
import { proposeContinuity } from '../../../../../modes/ambient-visual/agents/continuity-producer';
import { generateVideoPrompts } from '../../../../../modes/ambient-visual/agents/video-prompt-engineer';
// Use BATCH functions for images/videos - same as original routes
import { generateAllShotImages, mergeResultsIntoShotVersions } from '../../../../../modes/ambient-visual/agents/video-image-generator-batch';
import { generateVideoClipBatch } from '../../../../../modes/ambient-visual/agents/video-clip-generator';
import { generateVoiceoverScript, calculateTotalDurationWithLoops } from '../../../../../modes/ambient-visual/agents/voiceover-script-generator';
import { generateVoiceoverAudio } from '../../../../../modes/ambient-visual/agents/voiceover-audio-generator';
import { generateSoundEffectPrompt } from '../../../../../modes/ambient-visual/agents/sound-effect-prompt-generator';
import { generateSoundEffect } from '../../../../../modes/ambient-visual/agents/sound-effect-generator';
import { generateBackgroundMusic } from '../../../../../modes/ambient-visual/agents/background-music-generator';


// Import step data helpers
import { buildStep1Data, buildStep2Data } from './step-data-generator';
import { createAmbientVideo } from './video-initializer';

// Import Shotstack for video rendering
import {
  getShotstackClient,
  buildShotstackTimeline,
  isShotstackConfigured,
  type TimelineBuilderInput,
  type TimelineScene,
  type TimelineShot,
  type TimelineShotVersion,
  type VolumeSettings,
  type OutputSettings,
} from '../../../../../integrations/shotstack';

// Import Bunny CDN for permanent video storage
import { bunnyStorage, buildVideoModePath } from '../../../../../storage/bunny-storage';

// Import Late.dev for publishing
import { lateService } from '../../../../../integrations/late';

// Import social metadata generator
import { generateSocialMetadata } from '../../../../../stories/shared/social/agents/metadata-generator';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface GenerationOptions {
  isRetry?: boolean;
  failedStep?: number;
}

export interface StepResult {
  success: boolean;
  error?: string;
  cost?: number;
}

interface GenerationState {
  videoId: string;
  currentStep: number;
  totalCost: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate actual loop count from settings
 * 
 * This mirrors the original workflow's calculateLoopCount function
 * from server/modes/ambient-visual/routes/index.ts
 * 
 * @param enabled - Whether looping is enabled
 * @param countSetting - Either 'auto' or a specific number
 * @returns Actual loop count to use
 */
function calculateLoopCount(enabled: boolean, countSetting: 'auto' | number): number {
  if (!enabled) {
    return 1; // No looping
  }
  if (countSetting === 'auto') {
    // Random number between 2 and 10 (inclusive)
    return Math.floor(Math.random() * 9) + 2;
  }
  return countSetting;
}

/**
 * Build Bunny CDN path parameters matching original ambient workflow
 * 
 * Gets the actual workspace name from database and prepares video metadata
 * for consistent CDN path structure across all uploads (audio, video, thumbnails).
 * 
 * The buildVideoModePath function handles sanitization automatically, so we just
 * need to pass the correct raw values.
 * 
 * @param video - Video record from database
 * @returns Object with userId, workspaceName, videoTitle, and dateLabel
 */
async function buildBunnyCdnParams(video: any): Promise<{
  userId: string;
  workspaceName: string;
  videoTitle: string;
  dateLabel: string;
}> {
  // Get actual workspace from database (which contains userId)
  // The videos table doesn't have userId - it's derived from workspace.userId
  const workspace = video.workspaceId ? await storage.getWorkspace(video.workspaceId) : null;
  const workspaceName = workspace?.name || 'default';
  const userId = workspace?.userId || 'unknown-user';
  
  // Use raw video title (buildVideoModePath cleans it automatically)
  const videoTitle = video.title || 'untitled';
  
  // Use video creation date (not current date)
  const dateLabel = video.createdAt
    ? new Date(video.createdAt).toISOString().slice(0, 10).replace(/-/g, "")
    : new Date().toISOString().slice(0, 10).replace(/-/g, "");
  
  return {
    userId,  // From workspace.userId (matches original ambient mode pattern)
    workspaceName,
    videoTitle,
    dateLabel,
  };
}

/**
 * Apply loop counts to scenes and shots based on step1Data settings
 * 
 * This applies the segmentLoopCount and shotLoopCount settings from
 * step1Data to the generated scenes and shots. In the original workflow,
 * this happens during the continue-to-step-5 transition.
 * 
 * @param scenes - Generated scenes
 * @param shots - Generated shots keyed by scene ID
 * @param step1Data - Settings containing loop configuration
 * @returns Updated scenes and shots with loop counts applied
 */
function applyLoopCounts(
  scenes: Scene[],
  shots: Record<string, Shot[]>,
  step1Data: Step1Data
): { scenes: Scene[]; shots: Record<string, Shot[]> } {
  // Check if loop mode is enabled
  const loopModeEnabled = step1Data.loopMode ?? false;
  
  // Get segment loop settings
  const segmentLoopEnabled = loopModeEnabled && (step1Data.segmentLoopEnabled ?? false);
  const segmentLoopCount = step1Data.segmentLoopCount ?? 1;
  const calculatedSegmentLoop = calculateLoopCount(segmentLoopEnabled, segmentLoopCount);
  
  // Get shot loop settings
  const shotLoopEnabled = loopModeEnabled && (step1Data.shotLoopEnabled ?? false);
  const shotLoopCount = step1Data.shotLoopCount ?? 1;
  const calculatedShotLoop = calculateLoopCount(shotLoopEnabled, shotLoopCount);
  
  console.log('[agent-orchestrator] Applying loop counts:', {
    loopModeEnabled,
    segmentLoopEnabled,
    segmentLoopCount,
    calculatedSegmentLoop,
    shotLoopEnabled,
    shotLoopCount,
    calculatedShotLoop,
  });
  
  // Apply to scenes
  const scenesWithLoops = scenes.map(scene => ({
    ...scene,
    loopCount: calculatedSegmentLoop,
  }));
  
  // Apply to shots
  const shotsWithLoops: Record<string, Shot[]> = {};
  for (const [sceneId, sceneShots] of Object.entries(shots)) {
    shotsWithLoops[sceneId] = sceneShots.map(shot => ({
      ...shot,
      loopCount: calculatedShotLoop,
    }));
  }
  
  return { scenes: scenesWithLoops, shots: shotsWithLoops };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a full ambient video through all 7 steps
 * 
 * @param idea - Video topic/idea
 * @param settings - Campaign settings
 * @param userId - User ID
 * @param workspaceId - Workspace ID
 * @param options - Retry options
 * @returns Generation result with videoId
 */
export async function generateFullVideo(
  idea: string,
  settings: AmbientCampaignSettings,
  userId: string,
  workspaceId: string,
  options: GenerationOptions = {}
): Promise<VideoGenerationResult> {
  const startTime = Date.now();
  let state: GenerationState | null = null;
  
  console.log('[agent-orchestrator] Starting full video generation:', {
    idea,
    isRetry: options.isRetry,
    failedStep: options.failedStep,
  });
  
  try {
    // ─────────────────────────────────────────────────────────────
    // 1. CREATE VIDEO RECORD (or resume from existing)
    // ─────────────────────────────────────────────────────────────
    let videoId: string;
    
    if (options.isRetry && options.failedStep) {
      // For retries, we don't create a new video - we use existing one
      // This assumes videoId was passed through the result
      throw new Error('Retry not yet implemented - need videoId from previous attempt');
    } else {
      // Create new video with initial step data
      const step1Data = buildStep1Data(idea, settings);
      const step2Data = buildStep2Data(settings);
      videoId = await createAmbientVideo(idea, workspaceId, step1Data, step2Data);
      console.log('[agent-orchestrator] Video record created:', videoId);
    }
    
    state = {
      videoId,
      currentStep: 1,
      totalCost: 0,
    };
    
    // ─────────────────────────────────────────────────────────────
    // 2. EXECUTE STEPS SEQUENTIALLY
    // ─────────────────────────────────────────────────────────────
    const startStep = options.isRetry && options.failedStep ? options.failedStep : 1;
    
    // Step 1: Generate mood description
    if (startStep <= 1) {
      console.log('[agent-orchestrator] Step 1: Generating mood description...');
      const result = await executeStep1_Atmosphere(videoId, userId, workspaceId);
      state.totalCost += result.cost || 0;
      state.currentStep = 1;
    }
    
    // Step 2 is skipped (Visual World - already populated from settings)
    
    // Step 3: Generate scenes, shots, continuity
    if (startStep <= 3) {
      console.log('[agent-orchestrator] Step 3: Generating flow design...');
      const result = await executeStep3_FlowDesign(videoId, userId, workspaceId);
      state.totalCost += result.cost || 0;
      state.currentStep = 3;
    }
    
    // Step 4: Generate prompts, images, videos
    if (startStep <= 4) {
      console.log('[agent-orchestrator] Step 4: Generating composition...');
      const result = await executeStep4_Composition(videoId, userId, workspaceId);
      state.totalCost += result.cost || 0;
      state.currentStep = 4;
    }
    
    // Step 5: Generate audio (voiceover, SFX, music)
    if (startStep <= 5) {
      console.log('[agent-orchestrator] Step 5: Generating soundscape...');
      const result = await executeStep5_Soundscape(videoId, userId, workspaceId);
      state.totalCost += result.cost || 0;
      state.currentStep = 5;
    }
    
    // Step 6: Build timeline
    if (startStep <= 6) {
      console.log('[agent-orchestrator] Step 6: Building preview...');
      const result = await executeStep6_Preview(videoId);
      state.totalCost += result.cost || 0;
      state.currentStep = 6;
    }
    
    // Step 7: Mark as ready for export
    if (startStep <= 7) {
      console.log('[agent-orchestrator] Step 7: Finalizing export...');
      const result = await executeStep7_Export(videoId);
      state.totalCost += result.cost || 0;
      state.currentStep = 7;
    }
    
    // Step 8: Publish to social platforms (if enabled)
    if (startStep <= 8) {
      console.log('[agent-orchestrator] Step 8: Publishing...');
      const result = await executeStep8_Publish(videoId, userId, workspaceId, settings);
      state.totalCost += result.cost || 0;
      state.currentStep = 8;
    }
    
    // ─────────────────────────────────────────────────────────────
    // 3. MARK VIDEO AS COMPLETED
    // ─────────────────────────────────────────────────────────────
    await storage.updateVideo(videoId, {
      status: 'completed',
    });
    
    const duration = Date.now() - startTime;
    console.log('[agent-orchestrator] Video generation completed:', {
      videoId,
      duration: `${Math.round(duration / 1000)}s`,
      totalCost: state.totalCost,
    });
    
    return {
      success: true,
      videoId,
      metadata: {
        title: idea,
        mode: 'ambient',
        currentStep: 8,
        totalCost: state.totalCost,
        duration,
      },
    };
    
  } catch (error: any) {
    console.error('[agent-orchestrator] Error during generation:', error);
    
    // Mark video as failed if we have a videoId
    if (state?.videoId) {
      await storage.updateVideo(state.videoId, {
        status: 'failed',
      });
    }
    
    return {
      success: false,
      videoId: state?.videoId,
      error: error.message || 'Failed to generate video',
      retryable: true,
      failedStep: state?.currentStep,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: ATMOSPHERE (Mood Description)
// ═══════════════════════════════════════════════════════════════════════════════

async function executeStep1_Atmosphere(
  videoId: string,
  userId: string,
  workspaceId: string
): Promise<StepResult> {
  const video = await storage.getVideo(videoId);
  if (!video) throw new Error(`Video not found: ${videoId}`);
  
  const step1Data = video.step1Data as Step1Data;
  
  // Build input for mood description generator
  const input: MoodDescriptionGeneratorInput = {
    mood: step1Data.mood,
    theme: step1Data.theme,
    timeContext: step1Data.timeContext,
    season: step1Data.season,
    duration: step1Data.duration,
    aspectRatio: step1Data.aspectRatio,
    animationMode: step1Data.animationMode,
    videoGenerationMode: step1Data.videoGenerationMode,
    loopMode: step1Data.loopMode,
    loopType: step1Data.loopType,
    segmentLoopEnabled: step1Data.segmentLoopEnabled,
    segmentLoopCount: step1Data.segmentLoopCount,
    shotLoopEnabled: step1Data.shotLoopEnabled,
    shotLoopCount: step1Data.shotLoopCount,
    userPrompt: step1Data.userStory,
  };
  
  // Generate mood description
  const result = await generateMoodDescription(input, userId, workspaceId, 'script', 'ambient');
  
  // Save to database
  await storage.updateVideo(videoId, {
    step1Data: {
      ...step1Data,
      moodDescription: result.moodDescription,
    },
    completedSteps: [1],
    currentStep: 2, // Ready for step 2 (already populated)
  });
  
  console.log('[agent-orchestrator:step1] Mood description generated');
  
  return { success: true, cost: result.cost };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3: FLOW DESIGN (Scenes, Shots, Continuity)
// ═══════════════════════════════════════════════════════════════════════════════

async function executeStep3_FlowDesign(
  videoId: string,
  userId: string,
  workspaceId: string
): Promise<StepResult> {
  const video = await storage.getVideo(videoId);
  if (!video) throw new Error(`Video not found: ${videoId}`);
  
  const step1Data = video.step1Data as Step1Data;
  const step2Data = video.step2Data as Step2Data;
  let totalCost = 0;
  
  // ─────────────────────────────────────────────────────────────
  // 3.1 Generate Scenes
  // ─────────────────────────────────────────────────────────────
  const sceneInput: SceneGeneratorInput = {
    moodDescription: step1Data.moodDescription,
    duration: step1Data.duration,
    theme: step1Data.theme,
    mood: step1Data.mood,
    pacing: step1Data.pacing,
    segmentCount: step1Data.segmentCount,
    shotsPerSegment: step1Data.shotsPerSegment,
    animationMode: step1Data.animationMode,
    videoGenerationMode: step1Data.videoGenerationMode,
    visualRhythm: step2Data.visualRhythm,
    artStyle: step2Data.artStyle,
    visualElements: step2Data.visualElements,
  };
  
  const sceneResult = await generateScenes(sceneInput, videoId, userId, workspaceId, 'script', 'ambient');
  totalCost += sceneResult.cost || 0;
  
  console.log('[agent-orchestrator:step3] Scenes generated:', sceneResult.scenes.length);
  
  // ─────────────────────────────────────────────────────────────
  // 3.2 Generate Shots for each scene (sequential)
  // ─────────────────────────────────────────────────────────────
  const allShots: Record<string, Shot[]> = {};
  
  for (const scene of sceneResult.scenes) {
    const shotInput: ShotComposerInput = {
      scene,
      shotsPerSegment: step1Data.shotsPerSegment,
      pacing: step1Data.pacing,
      animationMode: step1Data.animationMode,
      artStyle: step2Data.artStyle,
      visualElements: step2Data.visualElements,
      videoModel: step1Data.videoModel,
      allScenes: sceneResult.scenes,
      existingShots: allShots,
    };
    
    const shotResult = await composeShots(shotInput, userId, workspaceId, 'script', 'ambient');
    allShots[scene.id] = shotResult.shots;
    totalCost += shotResult.cost || 0;
    
    console.log(`[agent-orchestrator:step3] Shots generated for scene ${scene.sceneNumber}:`, shotResult.shots.length);
  }
  
  // ─────────────────────────────────────────────────────────────
  // 3.3 Generate Continuity Groups (start-end-frame mode only)
  // ─────────────────────────────────────────────────────────────
  let continuityGroups: Record<string, ContinuityGroup[]> = {};
  
  if (step1Data.videoGenerationMode === 'start-end-frame') {
    const continuityInput: ContinuityProducerInput = {
      scenes: sceneResult.scenes,
      shots: allShots,
    };
    
    const continuityResult = await proposeContinuity(continuityInput, userId, workspaceId, 'script', 'ambient');
    continuityGroups = continuityResult.continuityGroups;
    totalCost += continuityResult.cost || 0;
    
    // AUTO-APPROVE all continuity groups for auto-production
    // (In manual workflow, user reviews and approves; in auto-production, we auto-approve all)
    const now = new Date();
    for (const sceneId of Object.keys(continuityGroups)) {
      continuityGroups[sceneId] = continuityGroups[sceneId].map(group => ({
        ...group,
        status: 'approved' as const,
        approvedAt: now,
      }));
    }
    
    const groupCount = Object.values(continuityGroups).flat().length;
    console.log(`[agent-orchestrator:step3] Continuity groups generated and auto-approved: ${groupCount} groups`);
  }
  
  // ─────────────────────────────────────────────────────────────
  // 3.4 Apply Loop Counts from Settings
  // ─────────────────────────────────────────────────────────────
  // Apply segmentLoopCount and shotLoopCount settings to scenes/shots
  // This mirrors the original workflow that applies loops during continue-to-step-5
  const { scenes: scenesWithLoops, shots: shotsWithLoops } = applyLoopCounts(
    sceneResult.scenes,
    allShots,
    step1Data
  );
  
  // ─────────────────────────────────────────────────────────────
  // 3.5 Save to Database
  // ─────────────────────────────────────────────────────────────
  // NOTE: step3Data contains flow design (scenes, shots, continuity) - NO shotVersions
  // shotVersions with images/videos are saved in step4Data during composition phase
  const step3Data: Step3Data = {
    scenes: scenesWithLoops,
    shots: shotsWithLoops,
    continuityLocked: step1Data.videoGenerationMode === 'start-end-frame', // Auto-lock for auto-production
    continuityGroups,
    continuityGenerated: step1Data.videoGenerationMode === 'start-end-frame',
  };
  
  await storage.updateVideo(videoId, {
    step3Data,
    completedSteps: [1, 2, 3],
    currentStep: 3,
  });
  
  return { success: true, cost: totalCost };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4: COMPOSITION (Prompts, Images, Videos)
// ═══════════════════════════════════════════════════════════════════════════════

async function executeStep4_Composition(
  videoId: string,
  userId: string,
  workspaceId: string
): Promise<StepResult> {
  // ═══════════════════════════════════════════════════════════════════════════════
  // STEP 4: COMPOSITION - Using EXACT same flow as original routes
  // 
  // This follows the original workflow:
  // 1. generate-all-prompts → generateVideoPrompts for each shot
  // 2. generate-all-images → generateAllShotImages batch function
  // 3. generate-batch-videos → generateVideoClipBatch function
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const video = await storage.getVideo(videoId);
  if (!video) throw new Error(`Video not found: ${videoId}`);
  
  const step1Data = video.step1Data as Step1Data;
  const step2Data = video.step2Data as Step2Data;
  const step3Data = video.step3Data as Step3Data;
  let totalCost = 0;
  
  // ─────────────────────────────────────────────────────────────
  // PHASE 4.1: Initialize step4Data with scenes/shots (like original)
  // ─────────────────────────────────────────────────────────────
  const step4Scenes = step3Data.scenes.map(scene => ({
    ...scene,
    imageModel: scene.imageModel || step1Data.imageModel,
    videoModel: scene.videoModel || step1Data.videoModel,
  }));
  
  const step4Shots: Record<string, Shot[]> = {};
  for (const [sceneId, sceneShots] of Object.entries(step3Data.shots)) {
    step4Shots[sceneId] = sceneShots.map(shot => ({
      ...shot,
      imageModel: shot.imageModel || null,
      videoModel: shot.videoModel || null,
    }));
  }
  
  let step4Data: Step4Data = {
    scenes: step4Scenes,
    shots: step4Shots,
    shotVersions: {},
  };
  
  // ─────────────────────────────────────────────────────────────
  // PHASE 4.2: GENERATE ALL PROMPTS (exact same as original route)
  // ─────────────────────────────────────────────────────────────
  console.log('[agent-orchestrator:step4] Phase 1: Generating prompts for all shots...');
  
  // Build continuity info map (same as original)
  const shotContinuityInfo: Map<string, { 
    groupId: string; 
    isFirst: boolean; 
    previousShotId: string | null;
  }> = new Map();

  if (step1Data.videoGenerationMode === 'start-end-frame' && step3Data.continuityGroups) {
    for (const groups of Object.values(step3Data.continuityGroups)) {
      for (const group of groups) {
        if (group.status !== 'approved') continue;
        
        for (let i = 0; i < group.shotIds.length; i++) {
          const shotId = group.shotIds[i];
          const isFirstInThisGroup = i === 0;
          const previousShotIdInThisGroup = i > 0 ? group.shotIds[i - 1] : null;
          
          const existing = shotContinuityInfo.get(shotId);
          
          if (!existing) {
            shotContinuityInfo.set(shotId, {
              groupId: group.id,
              isFirst: isFirstInThisGroup,
              previousShotId: previousShotIdInThisGroup,
            });
          } else if (existing.isFirst && !isFirstInThisGroup) {
            // Prioritize inheritance
            shotContinuityInfo.set(shotId, {
              groupId: group.id,
              isFirst: false,
              previousShotId: previousShotIdInThisGroup,
            });
          }
        }
      }
    }
  }
  
  // Track generated endFramePrompts for inheritance
  const generatedEndFramePrompts: Map<string, string> = new Map();
  
  // Generate prompts for all shots (same loop as original route)
  for (const [sceneId, sceneShots] of Object.entries(step3Data.shots)) {
    const scene = step3Data.scenes.find(s => s.id === sceneId);
    if (!scene) continue;

    for (const shot of sceneShots) {
      const continuityInfo = shotContinuityInfo.get(shot.id);
      const isConnectedShot = !!continuityInfo;
      const isFirstInGroup = continuityInfo?.isFirst ?? false;
      const previousShotId = continuityInfo?.previousShotId ?? null;
      
      // Get previous shot's end frame prompt for inheritance
      let previousShotEndFramePrompt: string | undefined;
      if (isConnectedShot && !isFirstInGroup && previousShotId) {
        previousShotEndFramePrompt = generatedEndFramePrompts.get(previousShotId);
      }
      
      // Build input (exact same as original route)
      const input: VideoPromptEngineerInput = {
        shotId: shot.id,
        shotDescription: shot.description || '',
        shotType: shot.shotType,
        cameraMovement: shot.cameraMovement,
        shotDuration: shot.duration,
        sceneId,
        sceneTitle: scene.title,
        sceneDescription: scene.description || '',
        moodDescription: step1Data.moodDescription,
        mood: step1Data.mood,
        theme: step1Data.theme,
        timeContext: step1Data.timeContext,
        season: step1Data.season,
        aspectRatio: step1Data.aspectRatio,
        artStyle: step2Data.artStyle,
        visualElements: step2Data.visualElements,
        visualRhythm: step2Data.visualRhythm,
        referenceImageUrls: step2Data.referenceImages,
        imageCustomInstructions: step2Data.imageCustomInstructions,
        animationMode: step1Data.animationMode,
        videoGenerationMode: step1Data.videoGenerationMode,
        motionPrompt: step1Data.motionPrompt,
        isFirstInGroup,
        isConnectedShot,
        previousShotEndFramePrompt,
      };
      
      const result = await generateVideoPrompts(input, userId, workspaceId, 'script', 'ambient');
      totalCost += result.cost || 0;
      
      // Store endFramePrompt for potential inheritance
      if (result.endFramePrompt) {
        generatedEndFramePrompts.set(shot.id, result.endFramePrompt);
      }
      
      // Create version with prompts (same structure as original)
      const versionId = `version-${Date.now()}-${shot.id.slice(-8)}`;
      const isImageTransitions = step1Data.animationMode === 'image-transitions';
      const isImageReference = step1Data.animationMode === 'video-animation' && 
                               step1Data.videoGenerationMode === 'image-reference';
      const isStartEndFrame = step1Data.animationMode === 'video-animation' && 
                              step1Data.videoGenerationMode === 'start-end-frame';
      
      let shotVersion: ShotVersion;
      
      if (isImageTransitions) {
        shotVersion = {
          id: versionId,
          shotId: shot.id,
          versionNumber: 1,
          imagePrompt: result.imagePrompt,
          status: 'prompt_generated',
          needsRerender: false,
          createdAt: new Date(),
        };
      } else if (isImageReference) {
        shotVersion = {
          id: versionId,
          shotId: shot.id,
          versionNumber: 1,
          startFramePrompt: result.startFramePrompt,
          videoPrompt: result.videoPrompt,
          status: 'prompt_generated',
          needsRerender: false,
          createdAt: new Date(),
        };
      } else if (isStartEndFrame) {
        const startFrameInherited = isConnectedShot && !isFirstInGroup && !!previousShotEndFramePrompt;
        const actualStartFramePrompt = startFrameInherited
          ? previousShotEndFramePrompt
          : result.startFramePrompt;

        shotVersion = {
          id: versionId,
          shotId: shot.id,
          versionNumber: 1,
          startFramePrompt: actualStartFramePrompt,
          endFramePrompt: result.endFramePrompt,
          videoPrompt: result.videoPrompt,
          startFrameInherited,
          status: 'prompt_generated',
          needsRerender: false,
          createdAt: new Date(),
        };
      } else {
        // Fallback
        shotVersion = {
          id: versionId,
          shotId: shot.id,
          versionNumber: 1,
          startFramePrompt: result.startFramePrompt,
          endFramePrompt: result.endFramePrompt,
          videoPrompt: result.videoPrompt,
          status: 'prompt_generated',
          needsRerender: false,
          createdAt: new Date(),
        };
      }
      
      step4Data.shotVersions[shot.id] = [shotVersion];
    }
  }
  
  // Save prompts to database
  await storage.updateVideo(videoId, { step4Data });
  console.log('[agent-orchestrator:step4] Prompts generated for all shots');
  
  // ─────────────────────────────────────────────────────────────
  // PHASE 4.3: GENERATE ALL IMAGES (using batch function like original)
  // ─────────────────────────────────────────────────────────────
  console.log('[agent-orchestrator:step4] Phase 2: Generating images for all shots...');
  
  // Build shots array for batch generation (same as original route)
  const shotsForImageBatch: VideoImageGeneratorBatchInput['shots'] = [];
  const versionIdMap = new Map<string, string>();
  
  for (const [sceneId, sceneShots] of Object.entries(step4Shots)) {
    for (const shot of sceneShots) {
      const versions = step4Data.shotVersions[shot.id];
      if (!versions || versions.length === 0) continue;
      
      const latestVersion = versions[versions.length - 1];
      versionIdMap.set(shot.id, latestVersion.id);
      
      shotsForImageBatch.push({
        shotId: shot.id,
        shotNumber: shot.shotNumber,
        sceneId,
        versionId: latestVersion.id,
        imagePrompt: latestVersion.imagePrompt || undefined,
        startFramePrompt: latestVersion.startFramePrompt || undefined,
        endFramePrompt: latestVersion.endFramePrompt || undefined,
      });
    }
  }
  
  // Extract approved continuity groups
  const allContinuityGroups: ContinuityGroup[] = [];
  if (step3Data.continuityGroups) {
    for (const groups of Object.values(step3Data.continuityGroups)) {
      allContinuityGroups.push(...groups.filter(g => g.status === 'approved'));
    }
  }
  
  // Call batch image generation (exact same as original route)
  const imageBatchResult = await generateAllShotImages(
    {
      videoId,
      imageModel: step1Data.imageModel,
      aspectRatio: step1Data.aspectRatio,
      imageResolution: step1Data.imageResolution,
      animationMode: step1Data.animationMode,
      videoGenerationMode: step1Data.videoGenerationMode,
      shots: shotsForImageBatch,
      continuityGroups: allContinuityGroups,
    },
    userId,
    workspaceId,
    'video',
    'ambient'
  );
  totalCost += imageBatchResult.totalCost || 0;
  
  // Merge image results back (using same helper as original)
  step4Data.shotVersions = mergeResultsIntoShotVersions(
    step4Data.shotVersions as Record<string, any[]>,
    imageBatchResult.results,
    versionIdMap
  );
  
  // Save after images
  await storage.updateVideo(videoId, { step4Data });
  console.log('[agent-orchestrator:step4] Images generated for all shots');
  
  // ─────────────────────────────────────────────────────────────
  // PHASE 4.4: GENERATE ALL VIDEOS (video-animation mode only)
  // ─────────────────────────────────────────────────────────────
  if (step1Data.animationMode === 'video-animation') {
    console.log('[agent-orchestrator:step4] Phase 3: Generating videos for all shots...');
    
    // Reload step4Data to get updated shotVersions with images
    const updatedVideo = await storage.getVideo(videoId);
    step4Data = updatedVideo?.step4Data as Step4Data;
    
    // Build shots array for video batch generation
    const shotsForVideoBatch: VideoClipGeneratorBatchInput['shots'] = [];
    
    for (const [sceneId, sceneShots] of Object.entries(step4Shots)) {
      const scene = step4Scenes.find(s => s.id === sceneId);
      
      for (const shot of sceneShots) {
        const versions = step4Data.shotVersions[shot.id];
        if (!versions || versions.length === 0) continue;
        
        const latestVersion = versions[versions.length - 1];
        
        // Skip if no start frame URL
        if (!latestVersion.startFrameUrl) {
          console.warn(`[agent-orchestrator:step4] Skipping video for shot ${shot.id} - no start frame`);
          continue;
        }
        
        const videoModel = shot.videoModel || scene?.videoModel || step1Data.videoModel || 'seedance-1.0-pro';
        
        shotsForVideoBatch.push({
          shotId: shot.id,
          shotNumber: shot.shotNumber,
          versionId: latestVersion.id,
          startFrameUrl: latestVersion.startFrameUrl,
          endFrameUrl: latestVersion.endFrameUrl || undefined,
          videoPrompt: latestVersion.videoPrompt || '',
          videoModel,
          aspectRatio: step1Data.aspectRatio,
          videoResolution: step1Data.videoResolution || '720p',
          duration: shot.duration,
          cameraFixed: shot.cameraMovement === 'static',
        });
      }
    }
    
    // Call batch video generation
    const videoBatchResult = await generateVideoClipBatch(
      {
        videoId,
        shots: shotsForVideoBatch,
      },
      userId,
      workspaceId,
      'video',
      'ambient'
    );
    totalCost += videoBatchResult.totalCost || 0;
    
    // Merge video results back into shotVersions
    for (const result of videoBatchResult.results) {
      const versions = step4Data.shotVersions[result.shotId];
      if (!versions || versions.length === 0) continue;
      
      const latestVersion = versions[versions.length - 1];
      latestVersion.videoUrl = result.videoUrl || null;
      latestVersion.videoDuration = result.actualDuration || null;
      latestVersion.status = result.error ? 'failed' : 'completed';
      if (result.error) {
        latestVersion.errorMessage = result.error;
      }
    }
    
    // Save after videos
    await storage.updateVideo(videoId, { step4Data });
    console.log('[agent-orchestrator:step4] Videos generated for all shots');
  }
  
  // ─────────────────────────────────────────────────────────────
  // Mark step 4 complete
  // ─────────────────────────────────────────────────────────────
  await storage.updateVideo(videoId, {
    completedSteps: [1, 2, 3, 4],
    currentStep: 4,
  });
  
  console.log('[agent-orchestrator:step4] Composition complete');
  
  return { success: true, cost: totalCost };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5: SOUNDSCAPE (Audio)
// ═══════════════════════════════════════════════════════════════════════════════

async function executeStep5_Soundscape(
  videoId: string,
  userId: string,
  workspaceId: string
): Promise<StepResult> {
  const video = await storage.getVideo(videoId);
  if (!video) throw new Error(`Video not found: ${videoId}`);
  
  const step1Data = video.step1Data as Step1Data;
  const step2Data = video.step2Data as Step2Data;
  const step3Data = video.step3Data as Step3Data;
  let totalCost = 0;
  
  // Get Bunny CDN parameters for all audio uploads (voiceover, SFX, music)
  const bunnyParams = await buildBunnyCdnParams(video);
  
  const audioAssets: any = {
    voiceover: null,
    soundEffects: [],
    music: null,
  };
  
  // ─────────────────────────────────────────────────────────────
  // 5.1 Generate Voiceover (if enabled and configured)
  // ─────────────────────────────────────────────────────────────
  if (!step1Data.voiceoverEnabled) {
    console.log('[agent-orchestrator:step5] Voiceover: disabled in settings');
  } else if (!step1Data.voiceoverStory) {
    console.log('[agent-orchestrator:step5] Voiceover: skipped - no story/script provided');
  } else if (!step1Data.voiceId) {
    console.log('[agent-orchestrator:step5] Voiceover: skipped - no voice selected');
  }
  
  if (step1Data.voiceoverEnabled && step1Data.voiceoverStory && step1Data.voiceId) {
    console.log('[agent-orchestrator:step5] Generating voiceover...');
    
    // Calculate total duration using existing utility
    // Map scenes and shots to expected format (convert null to undefined)
    const scenesForDuration = step3Data.scenes.map(s => ({
      id: s.id,
      loopCount: s.loopCount ?? undefined,
    }));
    const shotsForDuration: Record<string, { duration: number; loopCount?: number }[]> = {};
    for (const [sceneId, sceneShots] of Object.entries(step3Data.shots)) {
      shotsForDuration[sceneId] = sceneShots.map(shot => ({
        duration: shot.duration,
        loopCount: shot.loopCount ?? undefined,
      }));
    }
    const totalDuration = calculateTotalDurationWithLoops(
      scenesForDuration,
      shotsForDuration
    );
    
    // Build scene context for script generation
    const sceneContext = step3Data.scenes.map(scene => ({
      sceneNumber: scene.sceneNumber,
      title: scene.title,
      description: scene.description,
      duration: scene.duration,
    }));
    
    // Generate script (using correct input type)
    const scriptResult = await generateVoiceoverScript(
      {
        language: step1Data.language || 'en',
        voiceoverStory: step1Data.voiceoverStory,
        totalDuration,
        mood: step1Data.mood,
        theme: step1Data.theme,
        moodDescription: step1Data.moodDescription,
        scenes: sceneContext,
      },
      userId,
      workspaceId,
      'video',
      'ambient'
    );
    totalCost += scriptResult.cost || 0;
    
    // Generate audio (using correct input type)
    const audioResult = await generateVoiceoverAudio(
      {
        script: scriptResult.script,
        voiceId: step1Data.voiceId,
        language: step1Data.language || 'en',
        videoId,
        videoTitle: bunnyParams.videoTitle,
        videoCreatedAt: video.createdAt,
        userId,
        workspaceId,
        workspaceName: bunnyParams.workspaceName,
      },
      'video',
      'ambient'
    );
    totalCost += audioResult.cost || 0;
    
    audioAssets.voiceover = {
      script: scriptResult.script,
      audioUrl: audioResult.audioUrl,
      duration: audioResult.duration,
    };
    
    console.log('[agent-orchestrator:step5] Voiceover generated');
  }
  
  // ─────────────────────────────────────────────────────────────
  // 5.2 Generate Sound Effects (REQUIRED for all shots with videos)
  // ─────────────────────────────────────────────────────────────
  // Get step4Data for shot versions with video URLs
  const step4Data = video.step4Data as Step4Data | null;
  
  if (step1Data.animationMode === 'video-animation' && step4Data?.shotVersions) {
    console.log('[agent-orchestrator:step5] Generating sound effects for all shots...');
    
    let sfxCount = 0;
    for (const scene of step3Data.scenes) {
      const sceneShots = step3Data.shots[scene.id] || [];
      
      for (const shot of sceneShots) {
        const shotVersions = step4Data.shotVersions[shot.id];
        if (!shotVersions || shotVersions.length === 0) continue;
        
        const latestVersion = shotVersions[shotVersions.length - 1];
        if (!latestVersion.videoUrl) {
          console.log(`[agent-orchestrator:step5] Skipping SFX for shot ${shot.id} - no video URL`);
          continue;
        }
        
        try {
          // Generate SFX prompt based on shot context
          const promptResult = await generateSoundEffectPrompt(
            {
              shotDescription: shot.description || null,
              shotType: shot.shotType,
              shotDuration: shot.duration,
              videoPrompt: latestVersion.videoPrompt || null,
              sceneTitle: scene.title,
              sceneDescription: scene.description || null,
              mood: step1Data.mood,
              theme: step1Data.theme,
              moodDescription: step1Data.moodDescription,
            },
            userId,
            workspaceId,
            'video',
            'ambient'
          );
          totalCost += promptResult.cost || 0;
          
          // Generate the actual sound effect audio
          const sfxResult = await generateSoundEffect(
            {
              videoUrl: latestVersion.videoUrl,
              prompt: promptResult.prompt,
              duration: shot.duration,
              videoId,
              videoTitle: bunnyParams.videoTitle,
              videoCreatedAt: video.createdAt,
              shotId: shot.id,
              sceneId: scene.id,
              userId,
              workspaceId,
              workspaceName: bunnyParams.workspaceName,
            },
            'video',
            'ambient'
          );
          totalCost += sfxResult.cost || 0;
          
          audioAssets.soundEffects.push({
            shotId: shot.id,
            sceneId: scene.id,
            prompt: promptResult.prompt,
            audioUrl: sfxResult.audioUrl,
            duration: shot.duration, // Use shot duration since SFX output doesn't have actualDuration
          });
          
          sfxCount++;
          console.log(`[agent-orchestrator:step5] SFX generated for shot ${shot.shotNumber} (${sfxCount})`);
        } catch (sfxError: any) {
          console.error(`[agent-orchestrator:step5] SFX generation failed for shot ${shot.id}:`, sfxError.message);
          // Continue with other shots even if one fails
        }
      }
    }
    
    console.log(`[agent-orchestrator:step5] Sound effects complete: ${sfxCount} generated`);
  } else if (step1Data.animationMode === 'image-transitions') {
    console.log('[agent-orchestrator:step5] SFX: skipped for image-transitions mode (no videos)');
  }
  
  // ─────────────────────────────────────────────────────────────
  // 5.3Generate Background Music (if enabled)
  // ────────────────────────────────────────────────── ───────────
  if (step1Data.backgroundMusicEnabled && step2Data.musicStyle) {
    console.log('[agent-orchestrator:step5] Generating background music...');
    
    // Calculate total duration
    const scenesForMusicDuration = step3Data.scenes.map(s => ({
      id: s.id,
      loopCount: s.loopCount ?? undefined,
    }));
    const shotsForMusicDuration: Record<string, { duration: number; loopCount?: number }[]> = {};
    for (const [sceneId, sceneShots] of Object.entries(step3Data.shots)) {
      shotsForMusicDuration[sceneId] = sceneShots.map(shot => ({
        duration: shot.duration,
        loopCount: shot.loopCount ?? undefined,
      }));
    }
    const musicTotalDuration = calculateTotalDurationWithLoops(
      scenesForMusicDuration,
      shotsForMusicDuration
    );
    
    // Build scene context for music generation
    const sceneContext = step3Data.scenes.map(scene => ({
      sceneNumber: scene.sceneNumber,
      title: scene.title,
      description: scene.description,
    }));
    
    const musicResult = await generateBackgroundMusic(
      {
        musicStyle: step2Data.musicStyle,
        mood: step1Data.mood,
        theme: step1Data.theme,
        timeContext: step1Data.timeContext,
        season: step1Data.season,
        moodDescription: step1Data.moodDescription,
        totalDuration: musicTotalDuration,
        scenes: sceneContext,
        videoId,
        videoTitle: bunnyParams.videoTitle,
        videoCreatedAt: video.createdAt,
        userId,
        workspaceId,
        workspaceName: bunnyParams.workspaceName,
      },
      'video',
      'ambient'
    );
    totalCost += musicResult.cost || 0;
    
    audioAssets.music = {
      musicUrl: musicResult.musicUrl,
      duration: musicResult.duration,
      style: musicResult.style,
    };
    
    console.log('[agent-orchestrator:step5] Background music generated');
  }
  
  // ─────────────────────────────────────────────────────────────
  // 5.4 Save to Database
  // ─────────────────────────────────────────────────────────────
  await storage.updateVideo(videoId, {
    step5Data: audioAssets,
    completedSteps: [1, 2, 3, 4, 5],
    currentStep: 5,
  });
  
  console.log('[agent-orchestrator:step5] Soundscape complete');
  
  return { success: true, cost: totalCost };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 6: PREVIEW (Timeline) - Build proper Step6Data structure
// ═══════════════════════════════════════════════════════════════════════════════

async function executeStep6_Preview(videoId: string): Promise<StepResult> {
  const video = await storage.getVideo(videoId);
  if (!video) throw new Error(`Video not found: ${videoId}`);
  
  const step1Data = video.step1Data as Step1Data;
  const step3Data = video.step3Data as Step3Data;
  const step4Data = video.step4Data as Step4Data | null;
  const step5Data = video.step5Data as any;
  
  // Build TimelineSceneItem[] from step3Data.scenes
  const timelineScenes = step3Data.scenes.map((scene, index) => ({
    id: scene.id,
    sceneNumber: scene.sceneNumber,
    title: scene.title,
    description: scene.description || null,
    duration: scene.duration || null,
    loopCount: scene.loopCount || null,
    order: index,
  }));
  
  // Build shots Record<string, TimelineShotItem[]> with video/image URLs from step4Data
  const timelineShots: Record<string, any[]> = {};
  let totalDuration = 0;
  
  for (const scene of step3Data.scenes) {
    const sceneShots = step3Data.shots[scene.id] || [];
    timelineShots[scene.id] = sceneShots.map((shot, index) => {
      // Get video/image URLs from step4Data.shotVersions
      const shotVersions = step4Data?.shotVersions?.[shot.id];
      const latestVersion = shotVersions?.[shotVersions.length - 1];
      
      totalDuration += shot.duration;
      
      return {
        id: shot.id,
        sceneId: scene.id,
        shotNumber: shot.shotNumber,
        duration: shot.duration,
        loopCount: shot.loopCount || null,
        transition: null,
        videoUrl: latestVersion?.videoUrl || null,
        imageUrl: latestVersion?.imageUrl || latestVersion?.startFrameUrl || null,
        cameraMovement: shot.cameraMovement,
        order: index,
      };
    });
  }
  
  // Build SFX audio tracks from step5Data
  const sfxTracks: any[] = [];
  let sfxStartTime = 0;
  
  if (step5Data?.soundEffects?.length > 0) {
    // Map SFX to shots in order
    for (const scene of step3Data.scenes) {
      const sceneShots = step3Data.shots[scene.id] || [];
      for (const shot of sceneShots) {
        const sfx = step5Data.soundEffects.find((s: any) => s.shotId === shot.id);
        if (sfx) {
          sfxTracks.push({
            id: `sfx-${shot.id}`,
            shotId: shot.id,
            src: sfx.audioUrl,
            start: sfxStartTime,
            duration: sfx.duration || shot.duration,
            volume: 0.8,
          });
        }
        sfxStartTime += shot.duration;
      }
    }
  }
  
  // Build voiceover track
  let voiceoverTrack = undefined;
  if (step5Data?.voiceover?.audioUrl) {
    voiceoverTrack = {
      id: 'voiceover-main',
      src: step5Data.voiceover.audioUrl,
      start: 0,
      duration: step5Data.voiceover.duration || totalDuration,
      volume: 1.0,
    };
  }
  
  // Build music track
  let musicTrack = undefined;
  if (step5Data?.music?.musicUrl) {
    musicTrack = {
      id: 'music-main',
      src: step5Data.music.musicUrl,
      start: 0,
      duration: step5Data.music.duration || totalDuration,
      volume: 0.3,
    };
  }
  
  // Build Step6Data structure
  const step6Data = {
    timeline: {
      scenes: timelineScenes,
      shots: timelineShots,
      audioTracks: {
        sfx: sfxTracks,
        voiceover: voiceoverTrack,
        music: musicTrack,
      },
    },
    volumes: {
      master: 1.0,
      voiceover: 1.0,
      music: 0.3,
      sfx: 0.8,
    },
  };
  
  // Save to database
  await storage.updateVideo(videoId, {
    step6Data,
    completedSteps: [1, 2, 3, 4, 5, 6],
    currentStep: 6,
  });
  
  console.log('[agent-orchestrator:step6] Preview timeline built:', {
    totalDuration,
    scenes: timelineScenes.length,
    shots: Object.values(timelineShots).flat().length,
    sfxTracks: sfxTracks.length,
    hasVoiceover: !!voiceoverTrack,
    hasMusic: !!musicTrack,
  });
  
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 7: EXPORT (Shotstack Rendering)
// ═══════════════════════════════════════════════════════════════════════════════

async function executeStep7_Export(videoId: string): Promise<StepResult> {
  const video = await storage.getVideo(videoId);
  if (!video) throw new Error(`Video not found: ${videoId}`);
  
  const step1Data = video.step1Data as Step1Data;
  const step6Data = video.step6Data as any;
  
  // Check if Shotstack is configured
  if (!isShotstackConfigured()) {
    console.log('[agent-orchestrator:step7] Shotstack not configured, marking as ready for manual export');
    await storage.updateVideo(videoId, {
      step7Data: {
        renderStatus: 'pending',
        renderProgress: 0,
      },
      completedSteps: [1, 2, 3, 4, 5, 6, 7],
      currentStep: 7,
    });
    return { success: true };
  }
  
  if (!step6Data?.timeline) {
    throw new Error('No timeline data found. Complete Step 6 first.');
  }
  
  console.log('[agent-orchestrator:step7] Starting Shotstack render...');
  
  // Mark as rendering
  await storage.updateVideo(videoId, {
    step7Data: {
      renderStatus: 'queued',
      renderProgress: 0,
    },
  });
  
  try {
    // Build timeline input from Step6Data (matching original workflow)
    const timelineInput = buildTimelineInputForShotstack(step6Data, step1Data);
    
    // Build Shotstack timeline
    const shotstackResult = buildShotstackTimeline(timelineInput);
    
    console.log('[agent-orchestrator:step7] Shotstack timeline built:', {
      clipCount: shotstackResult.clipCount,
      totalDuration: shotstackResult.totalDuration,
    });
    
    // Submit to Shotstack
    const client = getShotstackClient();
    const renderResponse = await client.render(shotstackResult.edit);
    
    const renderId = renderResponse.response.id;
    console.log('[agent-orchestrator:step7] Render submitted:', { renderId });
    
    // Update with render ID
    await storage.updateVideo(videoId, {
      step7Data: {
        renderId,
        renderStatus: 'rendering',
        renderProgress: 10,
      },
    });
    
    // Poll for completion (max 10 minutes)
    const finalStatus = await client.pollRenderStatus(
      renderId,
      5000, // Poll every 5 seconds
      120,  // Max 120 attempts (10 minutes)
      async (status) => {
        // Update progress on each poll
        const progress = Math.min(90, 10 + (status.response.status === 'rendering' ? 50 : 0));
        await storage.updateVideo(videoId, {
          step7Data: {
            renderId,
            renderStatus: status.response.status as any,
            renderProgress: progress,
          },
        });
        console.log(`[agent-orchestrator:step7] Render status: ${status.response.status}`);
      }
    );
    
    // Check final status
    if (finalStatus.response.status === 'done' && finalStatus.response.url) {
      console.log('[agent-orchestrator:step7] Render complete!', {
        url: finalStatus.response.url.substring(0, 80) + '...',
      });
      
      // Update status to uploading
      await storage.updateVideo(videoId, {
        step7Data: {
          renderId,
          renderStatus: 'uploading' as any,
          renderProgress: 95,
        },
      });
      
      // Download from Shotstack and upload to Bunny CDN for permanent storage
      let finalExportUrl = finalStatus.response.url;
      let finalThumbnailUrl = finalStatus.response.thumbnail;
      
      if (bunnyStorage.isBunnyConfigured()) {
        try {
          console.log('[agent-orchestrator:step7] Uploading to Bunny CDN...');
          
          // Get Bunny CDN parameters (same as Step 5 audio)
          const bunnyParams = await buildBunnyCdnParams(video);
          
          // Download video from Shotstack
          const videoResponse = await fetch(finalStatus.response.url);
          if (videoResponse.ok) {
            const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
            const videoFilename = `final_video_${Date.now()}.mp4`;
            const videoBunnyPath = buildVideoModePath({
              userId: bunnyParams.userId,
              workspaceName: bunnyParams.workspaceName,
              toolMode: 'ambient',
              projectName: bunnyParams.videoTitle,
              subFolder: 'Final',
              filename: videoFilename,
              dateLabel: bunnyParams.dateLabel,
            });
            
            finalExportUrl = await bunnyStorage.uploadFile(videoBunnyPath, videoBuffer, 'video/mp4');
            console.log('[agent-orchestrator:step7] Video uploaded to Bunny CDN:', finalExportUrl);
          }
          
          // Upload thumbnail if available
          if (finalStatus.response.thumbnail) {
            try {
              const thumbResponse = await fetch(finalStatus.response.thumbnail);
              if (thumbResponse.ok) {
                const thumbBuffer = Buffer.from(await thumbResponse.arrayBuffer());
                const thumbFilename = `thumbnail_${Date.now()}.jpg`;
                const thumbBunnyPath = buildVideoModePath({
                  userId: bunnyParams.userId,
                  workspaceName: bunnyParams.workspaceName,
                  toolMode: 'ambient',
                  projectName: bunnyParams.videoTitle,
                  subFolder: 'Final',
                  filename: thumbFilename,
                  dateLabel: bunnyParams.dateLabel,
                });
                
                finalThumbnailUrl = await bunnyStorage.uploadFile(thumbBunnyPath, thumbBuffer, 'image/jpeg');
                console.log('[agent-orchestrator:step7] Thumbnail uploaded to Bunny CDN:', finalThumbnailUrl);
              }
            } catch (thumbError) {
              console.warn('[agent-orchestrator:step7] Thumbnail upload failed, using Shotstack URL:', thumbError);
            }
          }
        } catch (uploadError) {
          console.warn('[agent-orchestrator:step7] Bunny CDN upload failed, using Shotstack URLs:', uploadError);
          // Continue with Shotstack URLs if upload fails
        }
      } else {
        console.log('[agent-orchestrator:step7] Bunny CDN not configured, using Shotstack URLs');
      }
      
      // Save to BOTH step7Data AND video table columns (exportUrl, thumbnailUrl)
      await storage.updateVideo(videoId, {
        step7Data: {
          renderId,
          renderStatus: 'done',
          renderProgress: 100,
          exportUrl: finalExportUrl,
          thumbnailUrl: finalThumbnailUrl,
          completedAt: new Date().toISOString(),
        },
        // Also save to video table columns for direct access
        exportUrl: finalExportUrl,
        thumbnailUrl: finalThumbnailUrl,
        completedSteps: [1, 2, 3, 4, 5, 6, 7],
        currentStep: 7,
      });
      
      console.log('[agent-orchestrator:step7] Export completed:', {
        videoId,
        exportUrl: finalExportUrl,
        thumbnailUrl: finalThumbnailUrl,
      });
      
      return { success: true };
    } else {
      throw new Error(`Render failed with status: ${finalStatus.response.status}`);
    }
    
  } catch (error: any) {
    console.error('[agent-orchestrator:step7] Render error:', error.message);
    
    await storage.updateVideo(videoId, {
      step7Data: {
        renderStatus: 'failed',
        renderProgress: 0,
        error: error.message,
      },
      completedSteps: [1, 2, 3, 4, 5, 6, 7],
      currentStep: 7,
    });
    
    throw error;
  }
}

/**
 * Build TimelineBuilderInput from Step6Data for Shotstack
 * This matches the original workflow's buildTimelineInputFromStep6
 */
function buildTimelineInputForShotstack(
  step6Data: any,
  step1Data: Step1Data
): TimelineBuilderInput {
  const timeline = step6Data.timeline;
  const volumes = step6Data.volumes || {
    master: 1,
    sfx: 0.8,
    voiceover: 1,
    music: 0.5,
  };
  
  // Convert to TimelineScene[]
  const scenes: TimelineScene[] = timeline.scenes.map((scene: any) => ({
    id: scene.id,
    sceneNumber: scene.sceneNumber,
    title: scene.title,
    description: scene.description,
    duration: scene.duration,
    loopCount: scene.loopCount,
  }));
  
  // Convert to TimelineShot[]
  const shots: Record<string, TimelineShot[]> = {};
  for (const [sceneId, sceneShots] of Object.entries(timeline.shots as Record<string, any[]>)) {
    shots[sceneId] = sceneShots.map((shot: any) => ({
      id: shot.id,
      sceneId: shot.sceneId,
      shotNumber: shot.shotNumber,
      duration: shot.duration,
      loopCount: shot.loopCount,
      transition: shot.transition,
      soundEffectDescription: null,
      soundEffectUrl: null,
      cameraMovement: shot.cameraMovement,
    }));
  }
  
  // Build shot versions (video/image URLs)
  const shotVersions: Record<string, TimelineShotVersion[]> = {};
  for (const [sceneId, sceneShots] of Object.entries(timeline.shots as Record<string, any[]>)) {
    for (const shot of sceneShots) {
      if (shot.videoUrl || shot.imageUrl) {
        shotVersions[shot.id] = [{
          id: `${shot.id}-v1`,
          shotId: shot.id,
          videoUrl: shot.videoUrl,
          imageUrl: shot.imageUrl,
          soundEffectPrompt: null,
        }];
      }
    }
  }
  
  // Build output settings (final quality)
  const output: OutputSettings = {
    format: 'mp4',
    resolution: '1080',
    aspectRatio: step1Data.aspectRatio || '16:9',
    fps: 30,
    thumbnail: {
      capture: 1,
      scale: 0.5,
    },
  };
  
  // Build SFX clips
  const sfxClips = (timeline.audioTracks?.sfx || []).map((sfx: any) => ({
    id: sfx.id,
    shotId: sfx.shotId,
    src: sfx.src,
    start: sfx.start,
    duration: sfx.duration,
    volume: sfx.volume || 0.8,
  }));
  
  // Build audio tracks object (matching TimelineBuilderInput)
  const audioTracks: {
    voiceover?: any;
    music?: any;
    ambient?: any;
  } = {};
  
  if (timeline.audioTracks?.voiceover) {
    audioTracks.voiceover = {
      id: timeline.audioTracks.voiceover.id || 'voiceover-main',
      src: timeline.audioTracks.voiceover.src,
      start: timeline.audioTracks.voiceover.start || 0,
      duration: timeline.audioTracks.voiceover.duration,
      volume: timeline.audioTracks.voiceover.volume || 1,
    };
  }
  
  if (timeline.audioTracks?.music) {
    audioTracks.music = {
      id: timeline.audioTracks.music.id || 'music-main',
      src: timeline.audioTracks.music.src,
      start: timeline.audioTracks.music.start || 0,
      duration: timeline.audioTracks.music.duration,
      volume: timeline.audioTracks.music.volume || 0.3,
    };
  }
  
  return {
    scenes,
    shots,
    shotVersions,
    sfxClips,
    audioTracks,
    volumes: {
      master: volumes.master,
      sfx: volumes.sfx,
      voiceover: volumes.voiceover,
      music: volumes.music,
      ambient: 0,
    },
    output,
    animationMode: step1Data.animationMode,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 8: PUBLISH (Auto-publish to social platforms)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Execute Step 8: Publish video to social platforms via Late.dev
 * 
 * This step:
 * 1. Checks if publishing is enabled in campaign settings
 * 2. Gets connected social accounts from workspace
 * 3. Generates AI metadata (title, description, hashtags) for each platform
 * 4. Publishes/schedules via Late.dev
 * 5. Saves publish status to step8Data
 */
async function executeStep8_Publish(
  videoId: string,
  userId: string,
  workspaceId: string,
  campaignSettings: AmbientCampaignSettings
): Promise<StepResult> {
  const video = await storage.getVideo(videoId);
  if (!video) throw new Error(`Video not found: ${videoId}`);
  
  const step1Data = video.step1Data as Step1Data;
  const step5Data = video.step5Data as any;
  const step7Data = video.step7Data as any;
  
  // Debug logging: Show received publishing settings
  console.log('[agent-orchestrator:step8] Received publishing settings:', {
    hasPublishing: !!campaignSettings.publishing,
    enabled: campaignSettings.publishing?.enabled,
    platforms: campaignSettings.publishing?.platforms,
    scheduleMode: campaignSettings.publishing?.scheduleMode,
    scheduledFor: campaignSettings.publishing?.scheduledFor,
  });
  
  // Check if publishing is enabled
  if (!campaignSettings.publishing?.enabled) {
    console.log('[agent-orchestrator:step8] Publishing disabled (enabled=false or no platforms), skipping');
    await storage.updateVideo(videoId, {
      completedSteps: [1, 2, 3, 4, 5, 6, 7, 8],
      currentStep: 8,
    });
    return { success: true };
  }
  
  // Get the rendered video URL
  const exportUrl = step7Data?.exportUrl;
  if (!exportUrl) {
    console.log('[agent-orchestrator:step8] No export URL found, marking as pending');
    await storage.updateVideo(videoId, {
      completedSteps: [1, 2, 3, 4, 5, 6, 7, 8],
      currentStep: 8,
    });
    return { success: true };
  }
  
  console.log('[agent-orchestrator:step8] Starting publishing process...');
  
  try {
    // Get workspace to find Late.dev profile
    const workspace = await storage.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    
    const lateProfileId = (workspace as any).lateProfileId;
    if (!lateProfileId) {
      console.log('[agent-orchestrator:step8] No Late.dev profile, skipping publishing');
      await storage.updateVideo(videoId, {
        completedSteps: [1, 2, 3, 4, 5, 6, 7, 8],
        currentStep: 8,
      });
      return { success: true };
    }
    
    // Get connected accounts
    const connectedAccounts = await lateService.getConnectedAccounts(lateProfileId);
    const selectedPlatforms = campaignSettings.publishing.platforms || [];
    
    // Filter to only platforms that are both selected AND connected
    const platformsToPublish = selectedPlatforms.filter(platform => 
      connectedAccounts.some(account => account.platform === platform)
    );
    
    if (platformsToPublish.length === 0) {
      console.log('[agent-orchestrator:step8] No matching connected platforms, skipping');
      await storage.updateVideo(videoId, {
        completedSteps: [1, 2, 3, 4, 5, 6, 7, 8],
        currentStep: 8,
      });
      return { success: true };
    }
    
    console.log(`[agent-orchestrator:step8] Publishing to: ${platformsToPublish.join(', ')}`);
    
    // Generate AI metadata for each platform
    const scriptText = step5Data?.voiceover?.script || step1Data.moodDescription || video.title || '';
    const duration = step7Data?.totalDuration || 60;
    
    const metadata: any = {};
    let totalCost = 0;
    
    for (const platform of platformsToPublish) {
      try {
        console.log(`[agent-orchestrator:step8] Generating metadata for ${platform}...`);
        const metaResult = await generateSocialMetadata(
          { platform: platform as any, scriptText, duration },
          userId,
          workspaceId,
          'video',
          'ambient'
        );
        totalCost += metaResult.cost || 0;
        
        // Map result to platform-specific metadata format
        // Note: SocialMetadataOutput only has title, description, caption - no tags/hashtags
        if (platform === 'youtube') {
          metadata.youtube = {
            title: metaResult.title || video.title || 'Untitled Video',
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
        
        console.log(`[agent-orchestrator:step8] Metadata generated for ${platform}`);
      } catch (metaError: any) {
        console.error(`[agent-orchestrator:step8] Failed to generate metadata for ${platform}:`, metaError.message);
        // Continue with other platforms
      }
    }
    
    // Determine schedule time
    // The batch processor calculates scheduledFor for both 'continuous' and 'scheduled' modes
    let scheduledFor: string | undefined;
    let publishNow = true;
    
    const scheduleMode = campaignSettings.publishing.scheduleMode;
    if ((scheduleMode === 'scheduled' || scheduleMode === 'continuous') && campaignSettings.publishing.scheduledFor) {
      scheduledFor = campaignSettings.publishing.scheduledFor;
      publishNow = false;
      console.log(`[agent-orchestrator:step8] Scheduling for: ${scheduledFor} (mode: ${scheduleMode})`);
    } else {
      console.log(`[agent-orchestrator:step8] Publishing immediately (mode: ${scheduleMode || 'immediate'})`);
    }
    
    // Build platforms array with account IDs
    const platformsWithAccounts = platformsToPublish.map(platform => {
      const account = connectedAccounts.find(a => a.platform === platform);
      return {
        platform: platform as any,
        accountId: account?._id || '',
      };
    }).filter(p => p.accountId); // Only include platforms with valid account IDs
    
    if (platformsWithAccounts.length === 0) {
      throw new Error('No valid account IDs found for selected platforms');
    }
    
    // Publish via Late.dev
    console.log('[agent-orchestrator:step8] Calling Late.dev publish...');
    const publishResult = await lateService.publishVideo({
      workspaceId,
      videoUrl: exportUrl,
      platforms: platformsWithAccounts,
      metadata,
      publishNow,
      scheduledFor,
      storiaVideoId: videoId,
      storiaContentType: 'video',
      storiaContentMode: 'ambient',
      storiaThumbnailUrl: step7Data?.thumbnailUrl,
      storiaDuration: duration,
      storiaAspectRatio: step1Data.aspectRatio,
    });
    
    console.log('[agent-orchestrator:step8] Publish result:', {
      postId: publishResult.postId,
      status: publishResult.status,
      platforms: publishResult.platforms,
    });
    
    // Log publish result (step8Data column doesn't exist in schema, so we just log)
    console.log('[agent-orchestrator:step8] Publish complete:', {
      postId: publishResult.postId,
      status: publishResult.status,
      platformCount: publishResult.platforms.length,
      scheduledFor,
    });
    
    // Mark step 8 as complete
    await storage.updateVideo(videoId, {
      completedSteps: [1, 2, 3, 4, 5, 6, 7, 8],
      currentStep: 8,
    });
    
    console.log('[agent-orchestrator:step8] Publishing complete');
    
    return { success: true, cost: totalCost };
    
  } catch (error: any) {
    console.error('[agent-orchestrator:step8] Publishing error:', error.message);
    
    // Mark step 8 as complete even on publish failure (publishing is optional)
    await storage.updateVideo(videoId, {
      completedSteps: [1, 2, 3, 4, 5, 6, 7, 8],
      currentStep: 8,
    });
    
    // Don't fail the whole generation - publishing is optional
    return { success: true };
  }
}
