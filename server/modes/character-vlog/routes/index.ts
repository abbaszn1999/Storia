import { Router } from 'express';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { storage } from '../../../storage';
import { CHARACTER_VLOG_CONFIG } from '../config';
import { isAuthenticated, getCurrentUserId } from '../../../auth';
import { bunnyStorage, buildVideoModePath } from '../../../storage/bunny-storage';
import { generateScript, analyzeCharacters, analyzeLocations, generateScenes, generateShots, generatePromptsForScene, buildCharacterAnchors, buildLocationAnchors, buildStyleAnchor, generateStoryboardImage, generateVideo } from '../agents';
import type { Step1Data, Step2Data, Step3Data, Step4Data, ReferenceModeCode, ScriptGeneratorInput, CharacterAnalyzerInput, LocationAnalyzerInput, SceneGeneratorInput, ShotGeneratorInput, UnifiedPromptProducerSceneInput } from '../types';
import { convertReferenceModeToCode } from '../types';
import { VIDEO_MODEL_CONFIGS } from '../../../ai/config';
import { convertReferenceModeCode } from '../types';
import { 
  generateCharacterImage as generateCharacterImageAgent,
  type CharacterImageInput as CharacterImageInputAgent,
} from '../../../assets/characters/agents/character-image-generator';
import {
  generateLocationImage as generateLocationImageAgent,
  type LocationImageInput as LocationImageInputAgent,
} from '../../../assets/locations/agents/location-image-generator';
import { upload } from './shared';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Migrate continuity flags to continuity groups for existing videos
 * Converts isLinkedToPrevious/isFirstInGroup flags to ContinuityGroup objects
 */
function migrateFlagsToGroups(
  shots: Record<string, any[]>,
  referenceMode: '1F' | '2F' | 'AI'
): Record<string, any[]> {
  // No groups in 1F mode
  if (referenceMode === '1F') {
    return {};
  }

  const allGroups: Record<string, any[]> = {};
  const now = new Date();

  for (const [sceneId, sceneShots] of Object.entries(shots)) {
    if (!Array.isArray(sceneShots) || sceneShots.length === 0) {
      continue;
    }

    const groups: any[] = [];
    let currentGroup: Array<{ id: string; shotType: string }> | null = null;
    let groupNumber = 1;

    for (let i = 0; i < sceneShots.length; i++) {
      const shot = sceneShots[i];
      const isLinked = shot.isLinkedToPrevious === true;
      const isFirst = shot.isFirstInGroup === true;
      const shotType = shot.shotType || (shot.cameraShot ? 'start-end' : 'image-ref');

      // Start a new group if this shot is first in group
      if (isFirst) {
        // Finalize previous group if exists
        if (currentGroup && currentGroup.length >= 2) {
          // Validate first shot is 2F (for 2F and AI modes)
          const firstShot = sceneShots.find((s: any) => s.id === currentGroup![0].id);
          if (firstShot && (firstShot.shotType === 'start-end' || firstShot.shotType === '2F')) {
            groups.push({
              id: randomUUID(),
              sceneId,
              groupNumber: groupNumber++,
              shotIds: currentGroup.map(s => s.id),
              description: `Continuity group with ${currentGroup.length} shots (migrated from flags)`,
              transitionType: 'flow',
              status: 'proposed',
              editedBy: null,
              editedAt: null,
              approvedAt: null,
              createdAt: now,
            });
          }
        }
        // Start new group
        currentGroup = [{ id: shot.id, shotType }];
      }
      // Add to current group if linked to previous
      else if (isLinked && currentGroup) {
        currentGroup.push({ id: shot.id, shotType });
      }
      // Not linked - finalize current group if exists
      else {
        if (currentGroup && currentGroup.length >= 2) {
          const firstShot = sceneShots.find((s: any) => s.id === currentGroup![0].id);
          if (firstShot && (firstShot.shotType === 'start-end' || firstShot.shotType === '2F')) {
            groups.push({
              id: randomUUID(),
              sceneId,
              groupNumber: groupNumber++,
              shotIds: currentGroup.map(s => s.id),
              description: `Continuity group with ${currentGroup.length} shots (migrated from flags)`,
              transitionType: 'flow',
              status: 'proposed',
              editedBy: null,
              editedAt: null,
              approvedAt: null,
              createdAt: now,
            });
          }
        }
        currentGroup = null;
      }
    }

    // Finalize last group if exists
    if (currentGroup && currentGroup.length >= 2) {
      const firstShot = sceneShots.find((s: any) => s.id === currentGroup![0].id);
      if (firstShot && (firstShot.shotType === 'start-end' || firstShot.shotType === '2F')) {
        groups.push({
          id: randomUUID(),
          sceneId,
          groupNumber: groupNumber++,
          shotIds: currentGroup.map(s => s.id),
          description: `Continuity group with ${currentGroup.length} shots (migrated from flags)`,
          transitionType: 'flow',
          status: 'proposed',
          editedBy: null,
          editedAt: null,
          approvedAt: null,
          createdAt: now,
        });
      }
    }

    if (groups.length > 0) {
      allGroups[sceneId] = groups;
    }
  }

  return allGroups;
}

/**
 * Convert frontend display model name to backend model ID
 * Maps user-friendly names (e.g., "Nano Banana") to Runware model IDs (e.g., "nano-banana")
 */
function normalizeImageModel(displayName: string | undefined): string {
  if (!displayName) {
    return 'nano-banana'; // Default
  }

  // Map display names to backend model IDs
  const modelMap: Record<string, string> = {
    'Nano Banana': 'nano-banana',
    'nano-banana': 'nano-banana',
    'Nano Banana 2 Pro': 'nano-banana-2-pro',
    'nano-banana-2-pro': 'nano-banana-2-pro',
    'Flux': 'flux-2-dev',
    'flux-2-dev': 'flux-2-dev',
    'Midjourney': 'midjourney', // Add if supported
    'GPT Image': 'openai-gpt-image-1.5',
    'DALL-E 3': 'openai-gpt-image-1.5',
    'Stable Diffusion': 'stable-diffusion', // Add if supported
  };

  // Return mapped value or lowercase/hyphenated version, or original if already correct
  return modelMap[displayName] || displayName.toLowerCase().replace(/\s+/g, '-');
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/character-vlog/videos
 * Create new character vlog video (from onboarding/reference mode selection)
 */
router.post('/videos', async (req: Request, res: Response) => {
  try {
    const { workspaceId, title, referenceMode } = req.body as {
      workspaceId: string;
      title?: string;
      referenceMode?: ReferenceModeCode;
    };
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }
    
    // Convert short code (1F, 2F, AI) to display name (1 frame, 2 Frames, AI Auto)
    const referenceModeDisplay = referenceMode ? convertReferenceModeCode(referenceMode) : undefined;
    
    // Initial step1Data with only reference mode setting (stored as display name)
    const step1Data: Partial<Step1Data> = {
      referenceMode: referenceModeDisplay,
    };
    
    const video = await storage.createVideo({
      workspaceId,
      title: title || CHARACTER_VLOG_CONFIG.defaultTitle,
      mode: CHARACTER_VLOG_CONFIG.mode,
      status: 'draft',
      currentStep: CHARACTER_VLOG_CONFIG.initialStep,
      completedSteps: [],
      step1Data,
    });

    res.json(video);
  } catch (error) {
    console.error('[character-vlog:routes] Video creation error:', error);
    res.status(500).json({ error: 'Failed to create character vlog video' });
  }
});

/**
 * GET /api/character-vlog/videos/:id
 * Get video by ID
 * Applies migration for continuity groups if needed
 */
router.get('/videos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const video = await storage.getVideo(id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Log what's being loaded for debugging currentVersionId issues
    const step3Data = video.step3Data as Step3Data | undefined;
    if (step3Data?.shots) {
      const totalShots = Object.values(step3Data.shots).flat().length;
      const shotsWithVersionId = Object.values(step3Data.shots).flat().filter((s: any) => s.currentVersionId).length;
      console.log('[character-vlog:routes] Loading video - step3Data shots:', {
        videoId: id,
        totalShots,
        shotsWithVersionId,
        sampleShot: Object.values(step3Data.shots)[0]?.[0],
      });
    }

    // Apply migration if step3Data exists but continuityGroups is empty and shots have flags
    if (step3Data && step3Data.shots) {
      const continuityGroups = step3Data.continuityGroups || {};
      const hasEmptyGroups = Object.keys(continuityGroups).length === 0 || 
        Object.values(continuityGroups).every(groups => !Array.isArray(groups) || groups.length === 0);
      
      // Check if any shots have continuity flags
      const hasFlags = Object.values(step3Data.shots).some(sceneShots => 
        Array.isArray(sceneShots) && sceneShots.some((shot: any) => 
          shot.isLinkedToPrevious === true || shot.isFirstInGroup === true
        )
      );

      if (hasEmptyGroups && hasFlags) {
        // Get reference mode from step1Data
        const step1Data = video.step1Data as Step1Data | undefined;
        const referenceModeDisplay = step1Data?.referenceMode;
        const referenceMode = referenceModeDisplay ? convertReferenceModeToCode(referenceModeDisplay) : '1F';

        console.log('[character-vlog:routes] Migrating continuity flags to groups:', {
          videoId: id,
          referenceMode,
        });

        // Migrate flags to groups
        const migratedGroups = migrateFlagsToGroups(step3Data.shots, referenceMode);
        
        if (Object.keys(migratedGroups).length > 0) {
          // Serialize dates for storage
          const serializedGroups: Record<string, any[]> = {};
          for (const [sceneId, sceneGroups] of Object.entries(migratedGroups)) {
            serializedGroups[sceneId] = sceneGroups.map(group => ({
              ...group,
              createdAt: group.createdAt instanceof Date ? group.createdAt.toISOString() : group.createdAt,
              editedAt: group.editedAt instanceof Date ? group.editedAt.toISOString() : group.editedAt,
              approvedAt: group.approvedAt instanceof Date ? group.approvedAt.toISOString() : group.approvedAt,
            }));
          }

          // Update video with migrated groups
          const updatedStep3Data: Step3Data = {
            ...step3Data,
            continuityGroups: serializedGroups,
          };

          await storage.updateVideo(id, { step3Data: updatedStep3Data });
          
          // Update video object for response
          video.step3Data = updatedStep3Data;

          console.log('[character-vlog:routes] Migration completed:', {
            videoId: id,
            groupsCreated: Object.values(serializedGroups).flat().length,
          });
        }
      }
    }
    
    // Log step4Data for debugging - terminal logging
    const step4Data = video.step4Data as any;
    if (step4Data && step4Data.shotVersions) {
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log('[LOADING VIDEO FROM DATABASE]');
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log(`Video ID: ${id}`);
      console.log(`Total Shot Versions: ${Object.keys(step4Data.shotVersions).length}`);
      console.log(`Total Shots with Prompts: ${step4Data.shots ? Object.keys(step4Data.shots).length : 0}`);
      console.log('-------------------------------------------------------------------');
      console.log('Sample Shot Versions:');
      const sampleVersions = Object.entries(step4Data.shotVersions).slice(0, 3);
      sampleVersions.forEach(([shotId, versions]: [string, any]) => {
        const latestVersion = Array.isArray(versions) ? versions[versions.length - 1] : versions;
        console.log(`  Shot: ${shotId.substring(0, 30)}...`);
        console.log(`    - Image URL: ${latestVersion.imageUrl ? '✓' : '✗'}`);
        console.log(`    - Start Frame URL: ${latestVersion.startFrameUrl ? '✓' : '✗'}`);
        console.log(`    - End Frame URL: ${latestVersion.endFrameUrl ? '✓' : '✗'}`);
        console.log(`    - Has Prompts: ${latestVersion.imagePrompt || latestVersion.startFramePrompt || latestVersion.endFramePrompt ? '✓' : '✗'}`);
      });
      console.log('═══════════════════════════════════════════════════════════════════');
    }
    
    res.json(video);
  } catch (error) {
    console.error('[character-vlog:routes] Get video error:', error);
    res.status(500).json({ error: 'Failed to get video' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: SCRIPT PHASE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/character-vlog/script/generate
 * Generate script from script settings
 * 
 * Flow:
 * 1. Save ALL settings to database (step1Data)
 * 2. Extract needed fields for AI generation
 * 3. Generate script using AI
 * 4. Update database with generated script
 */
router.post('/script/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { videoId, ...allSettings } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    console.log('[character-vlog:routes] Generating script:', {
      videoId,
      characterPersonality: allSettings.characterPersonality,
      narrationStyle: allSettings.narrationStyle,
      theme: allSettings.theme,
      duration: allSettings.duration,
    });

    // Step 1: Build step1Data with ALL settings
    // Convert referenceMode from code to display name if needed
    const referenceModeDisplay = allSettings.referenceMode && 
      (allSettings.referenceMode === '1F' || allSettings.referenceMode === '2F' || allSettings.referenceMode === 'AI')
      ? convertReferenceModeCode(allSettings.referenceMode as ReferenceModeCode)
      : allSettings.referenceMode;
    
    const step1Data: Step1Data = {
      // Reference mode (stored as display name)
      referenceMode: referenceModeDisplay,
      
      // Script generation settings (scriptModel not saved - we use GPT-5 in the agent)
      narrationStyle: allSettings.narrationStyle,
      theme: allSettings.theme,
      numberOfScenes: allSettings.numberOfScenes,
      shotsPerScene: allSettings.shotsPerScene,
      characterPersonality: allSettings.characterPersonality,
      videoModel: allSettings.videoModel,
      imageModel: allSettings.imageModel,
      aspectRatio: allSettings.aspectRatio,
      duration: allSettings.duration,
      genres: allSettings.genres || [],
      tones: allSettings.tones || [],
      language: allSettings.language,
      voiceActorId: allSettings.voiceActorId || null,
      voiceOverEnabled: allSettings.voiceOverEnabled !== undefined ? allSettings.voiceOverEnabled : true,
      
      // User's original prompt (preserved)
      userPrompt: allSettings.userPrompt || '',
      // Script will be filled by AI generation
      script: allSettings.script || '',
    };

    // Save ALL settings to database first
    await storage.updateVideo(videoId, { 
      step1Data, 
      currentStep: 1 
    });

    // Step 2: Extract ONLY needed settings for AI generation
    const aiInput: ScriptGeneratorInput = {
      userPrompt: allSettings.userPrompt || '',
      characterPersonality: allSettings.characterPersonality,
      narrationStyle: allSettings.narrationStyle,
      theme: allSettings.theme,
      duration: parseInt(allSettings.duration) || 60,
      genres: allSettings.genres || [],
      tones: allSettings.tones || [],
      language: allSettings.language || 'English',
    };

    // Step 3: Generate script using AI
    const workspaceId = req.headers['x-workspace-id'] as string | undefined;
    const result = await generateScript(aiInput, userId, workspaceId);

    // Step 4: Update database with generated script
    step1Data.script = result.script;
    await storage.updateVideo(videoId, { step1Data });

    console.log('[character-vlog:routes] Script generated:', {
      videoId,
      scriptLength: result.script.length,
      cost: result.cost,
    });

    res.json(result);
  } catch (error) {
    console.error('[character-vlog:routes] Script generation error:', error);
    res.status(500).json({ error: 'Failed to generate script' });
  }
});

/**
 * PATCH /api/character-vlog/videos/:id/step/1/continue
 * Save script settings and mark step as complete
 * 
 * Called when user clicks Continue to move to Elements phase
 * - Saves ALL settings + script (in case modified after generation)
 * - Updates currentStep to 2
 * - Adds 1 to completedSteps array
 */
router.patch('/videos/:id/step/1/continue', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const allSettings = req.body;

    console.log('[character-vlog:routes] Completing script step:', {
      videoId: id,
      characterPersonality: allSettings.characterPersonality,
      narrationStyle: allSettings.narrationStyle,
      hasScript: !!allSettings.script,
    });

    // Build step1Data with ALL settings + script
    // Convert referenceMode from code to display name if needed
    const referenceModeDisplay = allSettings.referenceMode && 
      (allSettings.referenceMode === '1F' || allSettings.referenceMode === '2F' || allSettings.referenceMode === 'AI')
      ? convertReferenceModeCode(allSettings.referenceMode as ReferenceModeCode)
      : allSettings.referenceMode;
    
    const step1Data: Step1Data = {
      // Reference mode (stored as display name)
      referenceMode: referenceModeDisplay,
      
      // Script generation settings (scriptModel not saved - we use GPT-5 in the agent)
      narrationStyle: allSettings.narrationStyle,
      theme: allSettings.theme,
      numberOfScenes: allSettings.numberOfScenes,
      shotsPerScene: allSettings.shotsPerScene,
      characterPersonality: allSettings.characterPersonality,
      videoModel: allSettings.videoModel,
      imageModel: allSettings.imageModel,
      aspectRatio: allSettings.aspectRatio,
      duration: allSettings.duration,
      genres: allSettings.genres || [],
      tones: allSettings.tones || [],
      language: allSettings.language,
      voiceActorId: allSettings.voiceActorId || null,
      voiceOverEnabled: allSettings.voiceOverEnabled !== undefined ? allSettings.voiceOverEnabled : true,
      
      // Script content
      userPrompt: allSettings.userPrompt || '',
      script: allSettings.script || '', // AI-generated script
    };

    // Get current video to check completed steps
    const video = await storage.getVideo(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Build completed steps array
    const completedSteps = Array.isArray(video.completedSteps) 
      ? [...video.completedSteps] 
      : [];
    
    // Add step 1 if not already completed
    if (!completedSteps.includes(1)) {
      completedSteps.push(1);
    }

    // Update video: save settings, mark step complete, move to step 2
    const updated = await storage.updateVideo(id, {
      step1Data,
      currentStep: 2,  // Move to Elements phase
      completedSteps,
    });

    console.log('[character-vlog:routes] Script step completed:', {
      videoId: id,
      currentStep: 2,
      completedSteps,
    });

    res.json(updated);
  } catch (error) {
    console.error('[character-vlog:routes] Step completion error:', error);
    res.status(500).json({ error: 'Failed to complete script step' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2: ELEMENTS PHASE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PATCH /api/character-vlog/videos/:id/step/2/settings
 * Auto-save world settings (artStyle, imageModel, worldDescription, styleReferenceImageUrl)
 * 
 * Called automatically when user changes any setting in Elements tab
 */
router.patch('/videos/:id/step/2/settings', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { artStyle, imageModel, worldDescription, styleReferenceImageUrl } = req.body;

    console.log('[character-vlog:routes] Auto-saving step 2 settings:', {
      videoId: id,
      artStyle,
      imageModel,
      hasWorldDescription: !!worldDescription,
      hasStyleReferenceImage: !!styleReferenceImageUrl,
    });

    // Get existing video to merge step2Data
    const video = await storage.getVideo(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Merge existing step2Data with new updates
    const existingStep2 = (video.step2Data as Record<string, any>) || {};
    const updatedStep2Data: Step2Data = {
      ...existingStep2,
      ...(artStyle !== undefined && { artStyle }),
      ...(imageModel !== undefined && { imageModel }),
      ...(worldDescription !== undefined && { worldDescription }),
      ...(styleReferenceImageUrl !== undefined && { styleReferenceImageUrl }),
    };

    // Update video with merged step2Data
    const updated = await storage.updateVideo(id, {
      step2Data: updatedStep2Data,
    });

    res.json(updated);
  } catch (error) {
    console.error('[character-vlog:routes] Auto-save step 2 settings error:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

/**
 * POST /api/character-vlog/upload-style-reference
 * Upload style reference image to Bunny CDN
 * 
 * Only for user-uploaded images (not preset styles)
 * Uploads file to Bunny CDN and saves CDN URL to step2Data
 */
router.post('/upload-style-reference', isAuthenticated, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { videoId } = req.body;
    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    // Get video and workspace info
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Verify workspace access
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find(w => w.id === video.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    const workspaceName = workspace.name || video.workspaceId;
    const videoTitle = video.title || 'Untitled';

    // Build Bunny path: {userId}/{workspace}/video_mode/vlog/{title}_{date}/StyleReferences/{filename}
    const extensionMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const extension = extensionMap[file.mimetype] || 'png';
    const filename = `style_reference_${Date.now()}.${extension}`;

    const bunnyPath = buildVideoModePath({
      userId,
      workspaceName,
      toolMode: 'vlog',
      projectName: videoTitle,
      subFolder: 'StyleReferences',
      filename,
    });

    // Upload to Bunny CDN
    const cdnUrl = await bunnyStorage.uploadFile(bunnyPath, file.buffer, file.mimetype);

    console.log('[character-vlog:routes] Style reference image uploaded to Bunny CDN:', {
      videoId,
      cdnUrl: cdnUrl.substring(0, 50) + '...',
    });

    // Update step2Data with CDN URL
    const existingStep2Data = (video.step2Data as Step2Data) || {};
    await storage.updateVideo(videoId, {
      step2Data: {
        ...existingStep2Data,
        styleReferenceImageUrl: cdnUrl,
      },
    });

    res.json({
      success: true,
      url: cdnUrl,
    });
  } catch (error) {
    console.error('[character-vlog:routes] Style reference upload error:', error);
    res.status(500).json({ error: 'Failed to upload style reference image' });
  }
});

/**
 * PATCH /api/character-vlog/videos/:id/step/2/continue
 * Save elements settings and mark step as complete
 * 
 * Called when user clicks Continue to move to step 3
 * - Saves character and location objects to step2Data
 * - Updates currentStep to 3
 * - Adds 2 to completedSteps array
 * 
 * NOTE: Scene/shot generation is handled separately by the breakdown endpoint
 * when the user navigates to the Scenes tab (following narrative mode pattern)
 */
router.patch('/videos/:id/step/2/continue', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId } = req.params;
    const { characters, locations } = req.body as {
      characters?: Array<{
        id: string;
        workspaceId: string;
        name: string;
        description?: string | null;
        personality?: string | null;
        appearance?: string | null;
        imageUrl?: string | null;
        referenceImages?: any;
        voiceSettings?: any;
        createdAt?: Date | string;
        section?: 'primary' | 'secondary';
      }>;
      locations?: Array<{
        id: string;
        workspaceId: string;
        name: string;
        description?: string | null;
        details?: string | null;
        imageUrl?: string | null;
        referenceImages?: any;
        createdAt?: Date | string;
      }>;
    };

    console.log('[character-vlog:routes] Completing elements step:', {
      videoId,
      charactersCount: characters?.length || 0,
      locationsCount: locations?.length || 0,
    });

    // Get current video to merge step2Data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get existing step2Data
    const existingStep2Data = (video.step2Data as Step2Data) || {};

    // Serialize Date objects to ISO strings for JSONB storage (like narrative mode does)
    const serializedCharacters = characters?.map(char => ({
      ...char,
      createdAt: char.createdAt instanceof Date 
        ? char.createdAt.toISOString() 
        : (char.createdAt || new Date().toISOString()),
    })) || existingStep2Data.characters || [];

    const serializedLocations = locations?.map(loc => ({
      ...loc,
      createdAt: loc.createdAt instanceof Date 
        ? loc.createdAt.toISOString() 
        : (loc.createdAt || new Date().toISOString()),
    })) || existingStep2Data.locations || [];

    // Build updated step2Data with full character and location objects (like narrative mode)
    const step2Data: Step2Data = {
      ...existingStep2Data,
      characters: serializedCharacters,
      locations: serializedLocations,
    };

    // Build completed steps array
    const existingCompletedSteps = Array.isArray(video.completedSteps) ? video.completedSteps : [];
    const updatedCompletedSteps = existingCompletedSteps.includes(2) 
      ? existingCompletedSteps 
      : [...existingCompletedSteps, 2];

    // Update video: save settings, mark step complete, move to step 3
    const updated = await storage.updateVideo(videoId, {
      step2Data,
      currentStep: 3,  // Move to next phase
      completedSteps: updatedCompletedSteps,
    });

    console.log('[character-vlog:routes] Elements step completed:', {
      videoId,
      currentStep: 3,
      completedSteps: updatedCompletedSteps,
      charactersCount: step2Data.characters?.length || 0,
      locationsCount: step2Data.locations?.length || 0,
    });

    res.json(updated);
  } catch (error) {
    console.error('[character-vlog:routes] Step 2 completion error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to complete elements step',
      details: errorMessage 
    });
  }
});

/**
 * POST /api/character-vlog/characters/analyze
 * Analyze script to extract character recommendations
 * 
 * Uses character analyzer agent to identify primary character and up to 4 secondary characters
 */
router.post('/characters/analyze', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      console.error('[character-vlog:routes] Character analyze - Unauthorized: no userId');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[character-vlog:routes] Character analyze request received:', {
      userId,
      bodyKeys: Object.keys(req.body),
      hasVideoId: !!req.body.videoId,
      hasScript: !!req.body.script,
      scriptType: typeof req.body.script,
      scriptLength: req.body.script ? req.body.script.length : 0,
      narrationStyle: req.body.narrationStyle,
      characterPersonality: req.body.characterPersonality,
      theme: req.body.theme,
      style: req.body.style,
      worldDescription: req.body.worldDescription,
    });

    const { videoId, script, narrationStyle, characterPersonality, theme, style, worldDescription } = req.body;

    if (!videoId) {
      console.error('[character-vlog:routes] Character analyze - Missing videoId');
      return res.status(400).json({ error: 'videoId is required' });
    }

    if (!script || typeof script !== 'string' || script.trim().length === 0) {
      console.error('[character-vlog:routes] Character analyze - Invalid script:', {
        scriptExists: !!script,
        scriptType: typeof script,
        scriptLength: script ? script.length : 0,
        scriptTrimmedLength: script ? script.trim().length : 0,
        scriptPreview: script ? script.substring(0, 200) : 'N/A',
      });
      return res.status(400).json({ error: 'script is required and must not be empty' });
    }

    if (!narrationStyle || !characterPersonality || !theme || !style) {
      const missing = [];
      if (!narrationStyle) missing.push('narrationStyle');
      if (!characterPersonality) missing.push('characterPersonality');
      if (!theme) missing.push('theme');
      if (!style) missing.push('style');
      console.error('[character-vlog:routes] Character analyze - Missing required fields:', {
        missing,
        received: {
          narrationStyle,
          characterPersonality,
          theme,
          style,
        },
      });
      return res.status(400).json({ 
        error: `Missing required fields: ${missing.join(', ')}` 
      });
    }

    console.log('[character-vlog:routes] Analyzing characters:', {
      videoId,
      scriptLength: script.length,
      scriptPreview: script.substring(0, 200) + '...',
      narrationStyle,
      characterPersonality,
      theme,
      style,
      hasWorldDescription: !!worldDescription,
      worldDescriptionLength: worldDescription ? worldDescription.length : 0,
    });

    // Build character analyzer input
    const analyzerInput: CharacterAnalyzerInput = {
      script,
      narrationStyle,
      characterPersonality,
      theme,
      style,
      worldDescription: worldDescription || '',
    };

    // Call character analyzer agent
    const workspaceId = req.headers['x-workspace-id'] as string | undefined;
    console.log('[character-vlog:routes] Calling analyzeCharacters agent:', {
      userId,
      workspaceId,
      inputScriptLength: analyzerInput.script.length,
      inputNarrationStyle: analyzerInput.narrationStyle,
      inputCharacterPersonality: analyzerInput.characterPersonality,
      inputTheme: analyzerInput.theme,
      inputStyle: analyzerInput.style,
      inputWorldDescriptionLength: analyzerInput.worldDescription.length,
    });
    
    let result;
    try {
      result = await analyzeCharacters(analyzerInput, userId, workspaceId);
    } catch (agentError) {
      console.error('[character-vlog:routes] Agent call failed:', {
        error: agentError instanceof Error ? agentError.message : 'Unknown error',
        stack: agentError instanceof Error ? agentError.stack : undefined,
        errorType: agentError?.constructor?.name,
        fullError: agentError,
      });
      throw agentError; // Re-throw to be caught by outer catch
    }

    console.log('[character-vlog:routes] Characters analyzed successfully:', {
      videoId,
      primaryCharacter: result.primaryCharacter?.name,
      primaryCharacterExists: !!result.primaryCharacter,
      secondaryCount: result.secondaryCharacters?.length || 0,
      cost: result.cost,
    });

    res.json(result);
  } catch (error) {
    console.error('[character-vlog:routes] Character analysis error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name,
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to analyze characters',
      details: errorMessage 
    });
  }
});

/**
 * POST /api/character-vlog/locations/analyze
 * Analyze locations from the script
 * 
 * Extracts key locations from the story script for the Elements step.
 * Returns 2-5 location suggestions based on script content, theme, genre, and world description.
 */
router.post('/locations/analyze', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { videoId, script, theme, genres, worldDescription, duration, maxResults } = req.body as {
      videoId: string;
      script: string;
      theme: string;
      genres: string[];
      worldDescription?: string;
      duration: number;
      maxResults?: number;
    };

    console.log('[character-vlog:routes] Location analyze request received:', {
      videoId,
      scriptLength: script?.length || 0,
      theme,
      genres,
      hasWorldDescription: !!worldDescription,
      duration,
      maxResults: maxResults || 5,
    });

    // Validate required fields
    if (!script || !script.trim()) {
      return res.status(400).json({ 
        error: 'Script is required',
        details: 'Please generate a script first before analyzing locations.'
      });
    }

    if (!theme) {
      return res.status(400).json({ 
        error: 'Theme is required',
        details: 'Theme must be provided for location analysis.'
      });
    }

    if (!genres || !Array.isArray(genres) || genres.length === 0) {
      return res.status(400).json({ 
        error: 'Genres are required',
        details: 'At least one genre must be provided for location analysis.'
      });
    }

    if (!duration || typeof duration !== 'number') {
      return res.status(400).json({ 
        error: 'Duration is required',
        details: 'Duration must be a number (in seconds) for location analysis.'
      });
    }

    console.log('[character-vlog:routes] Analyzing locations:', {
      videoId,
      scriptLength: script.length,
      scriptPreview: script.substring(0, 200) + '...',
      theme,
      genres,
      hasWorldDescription: !!worldDescription,
      worldDescriptionLength: worldDescription ? worldDescription.length : 0,
      duration,
      maxResults: maxResults || 5,
    });

    // Build location analyzer input
    const analyzerInput: LocationAnalyzerInput = {
      script: script.trim(),
      theme,
      genres,
      worldDescription: worldDescription || '',
      duration,
      maxResults: maxResults || 5,
    };

    // Call location analyzer agent
    const workspaceId = req.headers['x-workspace-id'] as string | undefined;
    console.log('[character-vlog:routes] Calling analyzeLocations agent:', {
      userId,
      workspaceId,
      inputScriptLength: analyzerInput.script.length,
      inputTheme: analyzerInput.theme,
      inputGenres: analyzerInput.genres,
      inputWorldDescriptionLength: analyzerInput.worldDescription.length,
      inputDuration: analyzerInput.duration,
      inputMaxResults: analyzerInput.maxResults,
    });
    
    let result;
    try {
      result = await analyzeLocations(analyzerInput, userId, workspaceId);
    } catch (agentError) {
      console.error('[character-vlog:routes] Agent call failed:', {
        error: agentError instanceof Error ? agentError.message : 'Unknown error',
        stack: agentError instanceof Error ? agentError.stack : undefined,
        errorType: agentError?.constructor?.name,
        fullError: agentError,
      });
      throw agentError; // Re-throw to be caught by outer catch
    }

    console.log('[character-vlog:routes] Locations analyzed successfully:', {
      videoId,
      locationCount: result.locations?.length || 0,
      cost: result.cost,
    });

    res.json(result);
  } catch (error) {
    console.error('[character-vlog:routes] Location analysis error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name,
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to analyze locations',
      details: errorMessage 
    });
  }
});

/**
 * POST /api/character-vlog/scenes/generate
 * Generate scenes from the script
 * 
 * Analyzes the script and breaks it down into logical scenes.
 * Extracts data from step1Data and step2Data automatically.
 */
router.post('/scenes/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { videoId } = req.body as {
      videoId: string;
    };

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    console.log('[character-vlog:routes] Scene generation request received:', { videoId, userId });

    // Fetch video to get step1Data and step2Data
    const video = await storage.getVideo(videoId);
    if (!video) {
      console.error('[character-vlog:routes] Video not found:', { videoId });
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = (video.step1Data as Step1Data) || {};
    const step2Data = (video.step2Data as Step2Data) || {};

    console.log('[character-vlog:routes] Extracted data:', {
      hasStep1Data: !!step1Data && Object.keys(step1Data).length > 0,
      hasStep2Data: !!step2Data && Object.keys(step2Data).length > 0,
      step1Keys: Object.keys(step1Data),
      step2Keys: Object.keys(step2Data),
    });

    // Extract required fields from step1Data
    const script = step1Data.script;
    const theme = step1Data.theme;
    const duration = step1Data.duration ? parseInt(step1Data.duration, 10) : 60;
    const numberOfScenes = step1Data.numberOfScenes || 'auto';
    const shotsPerScene = step1Data.shotsPerScene || 'auto';

    // Extract from step2Data
    const worldDescription = step2Data.worldDescription || '';

    // Validate required fields
    if (!script || !script.trim()) {
      return res.status(400).json({ 
        error: 'Script is required',
        details: 'Please generate a script first before generating scenes.'
      });
    }

    if (!theme) {
      return res.status(400).json({ 
        error: 'Theme is required',
        details: 'Theme must be provided for scene generation.'
      });
    }

    // Extract primary character from step2Data.characters
    const characters = step2Data.characters || [];
    const primaryCharacterData = characters.find((c: any) => c.section === 'primary');
    
    if (!primaryCharacterData) {
      return res.status(400).json({ 
        error: 'Primary character is required',
        details: 'Please add a primary character in the Elements step before generating scenes.'
      });
    }

    const primaryCharacter = {
      name: primaryCharacterData.name,
      personality: primaryCharacterData.personality || step1Data.characterPersonality || 'energetic',
    };

    // Extract secondary characters (up to 4)
    const secondaryCharactersData = characters
      .filter((c: any) => c.section === 'secondary')
      .slice(0, 4);
    
    const secondaryCharacters = secondaryCharactersData.map((c: any) => ({
      name: c.name,
      description: c.description || c.appearance || '',
    }));

    // Extract locations from step2Data.locations
    const locationsData = step2Data.locations || [];
    const locations = locationsData.map((l: any) => ({
      name: l.name,
      description: l.description || l.details || '',
    }));

    console.log('[character-vlog:routes] Generating scenes:', {
      videoId,
      scriptLength: script.length,
      theme,
      duration,
      worldDescription: worldDescription || 'None',
      numberOfScenes,
      shotsPerScene,
      primaryCharacter: primaryCharacter.name,
      secondaryCharacterCount: secondaryCharacters.length,
      locationCount: locations.length,
    });

    // Build scene generator input
    const generatorInput: SceneGeneratorInput = {
      script: script.trim(),
      theme,
      duration,
      worldDescription,
      numberOfScenes,
      shotsPerScene,
      primaryCharacter,
      secondaryCharacters,
      locations,
    };

    // Call scene generator agent
    const workspaceId = req.headers['x-workspace-id'] as string | undefined;
    const result = await generateScenes(generatorInput, userId, workspaceId);

    console.log('[character-vlog:routes] Scenes generated successfully:', {
      videoId,
      sceneCount: result.scenes.length,
      totalDuration: result.scenes.reduce((sum, scene) => sum + scene.duration, 0),
      cost: result.cost,
    });

    res.json({
      scenes: result.scenes,
      cost: result.cost,
    });
  } catch (error) {
    console.error('[character-vlog:routes] Scene generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to generate scenes',
      details: errorMessage 
    });
  }
});

/**
 * POST /api/character-vlog/shots/generate
 * Generate shots for a scene
 * 
 * Analyzes a scene and breaks it down into detailed shots with continuity analysis.
 * Extracts data from step1Data, step2Data, and step3Data automatically.
 */
router.post('/shots/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { videoId, sceneId } = req.body as {
      videoId: string;
      sceneId: string;
    };

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    if (!sceneId) {
      return res.status(400).json({ error: 'sceneId is required' });
    }

    console.log('[character-vlog:routes] Shot generation request received:', { videoId, sceneId, userId });

    // Fetch video to get step1Data, step2Data, and step3Data
    const video = await storage.getVideo(videoId);
    if (!video) {
      console.error('[character-vlog:routes] Video not found:', { videoId });
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = (video.step1Data as Step1Data) || {};
    const step2Data = (video.step2Data as Step2Data) || {};
    const step3Data = (video.step3Data as Step3Data) || {};

    // Find the scene in step3Data
    const scenes = step3Data.scenes || [];
    const scene = scenes.find((s: any) => s.id === sceneId);

    if (!scene) {
      return res.status(404).json({ 
        error: 'Scene not found',
        details: `Scene with ID ${sceneId} not found in video ${videoId}`
      });
    }

    // Extract required fields from step1Data
    const script = step1Data.script;
    const theme = step1Data.theme;
    const duration = step1Data.duration ? parseInt(step1Data.duration, 10) : 60;
    const shotsPerScene = step1Data.shotsPerScene || 'auto';
    const videoModel = step1Data.videoModel || 'seedance-1.0-pro';
    
    // Convert referenceMode from display name to code
    const referenceModeDisplay = step1Data.referenceMode;
    const referenceMode = referenceModeDisplay ? convertReferenceModeToCode(referenceModeDisplay) : '1F';

    // Extract from step2Data
    const worldDescription = step2Data.worldDescription || '';

    // Extract characters from step2Data
    const characters = step2Data.characters || [];
    const charactersForAgent = characters.map((c: any, index: number) => {
      if (index === 0 || c.section === 'primary') {
        return {
          name: c.name,
          description: c.description || c.appearance || '',
          personality: c.personality || step1Data.characterPersonality || undefined,
        };
      }
      return {
        name: c.name,
        description: c.description || c.appearance || '',
      };
    });

    // Extract locations from step2Data
    const locationsData = step2Data.locations || [];
    const locationsForAgent = locationsData.map((l: any) => ({
      name: l.name,
      description: l.description || l.details || '',
    }));

    // Get video model durations
    const modelConfig = VIDEO_MODEL_CONFIGS[videoModel];
    const videoModelDurations = modelConfig?.durations || [2, 4, 5, 6, 8, 10, 12]; // Default fallback

    // Validate required fields
    if (!script || !script.trim()) {
      return res.status(400).json({ 
        error: 'Script is required',
        details: 'Please generate a script first before generating shots.'
      });
    }

    if (!theme) {
      return res.status(400).json({ 
        error: 'Theme is required',
        details: 'Theme must be provided for shot generation.'
      });
    }

    if (!scene.name || !scene.description) {
      return res.status(400).json({ 
        error: 'Scene data incomplete',
        details: 'Scene must have name and description.'
      });
    }

    console.log('[character-vlog:routes] Generating shots:', {
      videoId,
      sceneId,
      sceneName: scene.name,
      sceneDuration: scene.duration,
      scriptLength: script.length,
      theme,
      referenceMode,
      videoModel,
      videoModelDurations,
      targetDuration: duration,
      shotsPerScene,
      worldDescription: worldDescription || 'None',
      characterCount: charactersForAgent.length,
      locationCount: locationsForAgent.length,
    });

    // Build shot generator input
    const generatorInput: ShotGeneratorInput = {
      sceneName: scene.name || scene.title || '',
      sceneDescription: scene.description || '',
      sceneDuration: scene.duration || 0,
      script: script.trim(),
      characters: charactersForAgent,
      locations: locationsForAgent,
      theme,
      worldDescription,
      referenceMode,
      videoModel,
      videoModelDurations,
      targetDuration: duration,
      shotsPerScene,
    };

    // Call shot generator agent
    const workspaceId = req.headers['x-workspace-id'] as string | undefined;
    const result = await generateShots(generatorInput, userId, workspaceId);

    console.log('[character-vlog:routes] Shots generated successfully:', {
      videoId,
      sceneId,
      shotCount: result.shots.length,
      totalDuration: result.shots.reduce((sum, shot) => sum + shot.duration, 0),
      sceneDuration: scene.duration,
      cost: result.cost,
    });

    res.json({
      shots: result.shots,
      cost: result.cost,
    });
  } catch (error) {
    console.error('[character-vlog:routes] Shot generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to generate shots',
      details: errorMessage 
    });
  }
});

/**
 * POST /api/character-vlog/breakdown
 * Generate scene breakdown (scenes + shots) sequentially
 * 
 * Following narrative mode pattern - generates scenes first, then shots for all scenes.
 * This endpoint is called by the scene breakdown component when scenes are missing.
 * 
 * Runs:
 * 1. Agent 3.1 (Scene Generator) - generates all scenes
 * 2. Agent 3.2 (Shot Generator) - generates shots for each scene sequentially
 * 
 * Saves everything to step3Data and returns complete breakdown.
 */
router.post('/breakdown', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { videoId } = req.body as {
      videoId: string;
    };

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    const workspaceId = req.headers['x-workspace-id'] as string | undefined;

    console.log('[character-vlog:routes] Breakdown generation request:', { videoId, userId, workspaceId });

    // Fetch video to get step1Data and step2Data
    const video = await storage.getVideo(videoId);
    if (!video) {
      console.error('[character-vlog:routes] Video not found:', { videoId });
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = (video.step1Data as Step1Data) || {};
    const step2Data = (video.step2Data as Step2Data) || {};

    console.log('[character-vlog:routes] Extracted data:', {
      hasStep1Data: !!step1Data && Object.keys(step1Data).length > 0,
      hasStep2Data: !!step2Data && Object.keys(step2Data).length > 0,
      step1Keys: Object.keys(step1Data),
      step2Keys: Object.keys(step2Data),
    });

    // Extract required fields from step1Data
    const script = step1Data.script;
    const theme = step1Data.theme;
    const duration = step1Data.duration ? parseInt(step1Data.duration, 10) : 60;
    const numberOfScenes = step1Data.numberOfScenes || 'auto';
    const shotsPerScene = step1Data.shotsPerScene || 'auto';
    const videoModel = step1Data.videoModel || 'seedance-1.0-pro';
    const referenceModeDisplay = step1Data.referenceMode;
    const referenceMode = referenceModeDisplay ? convertReferenceModeToCode(referenceModeDisplay) : '1F';

    // Extract from step2Data
    const worldDescription = step2Data.worldDescription || '';

    // Validate required fields
    if (!script || !script.trim()) {
      return res.status(400).json({ 
        error: 'Script is required',
        details: 'Please generate a script first before generating breakdown.'
      });
    }

    if (!theme) {
      return res.status(400).json({ 
        error: 'Theme is required',
        details: 'Theme must be provided for breakdown generation.'
      });
    }

    // Extract primary character from step2Data.characters
    const characters = step2Data.characters || [];
    const primaryCharacterData = characters.find((c: any) => c.section === 'primary');
    
    if (!primaryCharacterData) {
      return res.status(400).json({ 
        error: 'Primary character is required',
        details: 'Please add a primary character in the Elements step before generating breakdown.'
      });
    }

    const primaryCharacter = {
      name: primaryCharacterData.name,
      personality: primaryCharacterData.personality || step1Data.characterPersonality || 'energetic',
    };

    // Extract secondary characters (up to 4)
    const secondaryCharactersData = characters
      .filter((c: any) => c.section === 'secondary')
      .slice(0, 4);
    
    const secondaryCharacters = secondaryCharactersData.map((c: any) => ({
      name: c.name,
      description: c.description || c.appearance || '',
    }));

    // Extract locations from step2Data.locations
    const locationsData = step2Data.locations || [];
    const locations = locationsData.map((l: any) => ({
      name: l.name,
      description: l.description || l.details || '',
    }));

    console.log('[character-vlog:routes] Generating breakdown:', {
      videoId,
      scriptLength: script.length,
      theme,
      duration,
      numberOfScenes,
      shotsPerScene,
      characterCount: characters.length,
      locationCount: locations.length,
      worldDescription: worldDescription || 'None',
      referenceMode,
      videoModel,
    });

    // Step 1: Run Agent 3.1 (Scene Generator)
    console.log('[character-vlog:routes] Running Agent 3.1: Scene Generator...');
    const sceneGeneratorInput: SceneGeneratorInput = {
      script: script.trim(),
      theme,
      duration,
      worldDescription,
      numberOfScenes,
      shotsPerScene,
      primaryCharacter,
      secondaryCharacters,
      locations,
    };

    const sceneResult = await generateScenes(sceneGeneratorInput, userId, workspaceId);

    // Convert generated scenes to ambient-visual compatible format
    const timestamp = Date.now();
    const now = new Date();
    const generatedScenes = sceneResult.scenes.map((scene, index) => ({
      id: `scene-${timestamp}-${index + 1}`,
      videoId: videoId,
      sceneNumber: index + 1,
      title: scene.name,  // Use 'title' to match ambient-visual
      name: scene.name,  // Keep 'name' for frontend compatibility
      description: scene.description || null,
      duration: scene.duration || null,
      actType: (index === 0 ? 'hook' : index === sceneResult.scenes.length - 1 ? 'outro' : 'main') as 'hook' | 'intro' | 'main' | 'outro' | 'custom',
      createdAt: now,
    }));

    console.log('[character-vlog:routes] Scenes generated:', { count: generatedScenes.length });

    // Step 2: Run Agent 3.2 (Shot Generator) for each scene
    console.log('[character-vlog:routes] Running Agent 3.2: Shot Generator for each scene...');
    const modelConfig = VIDEO_MODEL_CONFIGS[videoModel];
    const videoModelDurations = modelConfig?.durations || [2, 4, 5, 6, 8, 10, 12];

    const allShots: Record<string, any[]> = {};
    const allContinuityGroups: Record<string, any[]> = {};
    let totalShotCost = 0;

    for (const scene of generatedScenes) {
      console.log('[character-vlog:routes] Generating shots for scene:', {
        sceneId: scene.id,
        sceneName: scene.name,
      });

      // Prepare characters for shot generator
      const charactersForAgent = characters.map((c: any, index: number) => {
        if (c.section === 'primary' || (index === 0 && !c.section)) {
          return {
            name: c.name,
            description: c.description || c.appearance || '',
            personality: c.personality || step1Data.characterPersonality || undefined,
          };
        }
        return {
          name: c.name,
          description: c.description || c.appearance || '',
        };
      });

      const locationsForAgent = locations.map((l: any) => ({
        name: l.name,
        description: l.description || '',
      }));

      const shotGeneratorInput: ShotGeneratorInput = {
        sceneName: scene.name || scene.title || '',
        sceneDescription: scene.description || '',
        sceneDuration: scene.duration || 0,
        script: script.trim(),
        characters: charactersForAgent,
        locations: locationsForAgent,
        theme,
        worldDescription,
        referenceMode,
        videoModel,
        videoModelDurations,
        targetDuration: duration,
        shotsPerScene,
      };

      const shotResult = await generateShots(shotGeneratorInput, userId, workspaceId);
      
      console.log('[character-vlog:routes] Shot generation result:', {
        sceneId: scene.id,
        shotCount: shotResult.shots.length,
        hasContinuityGroups: !!shotResult.continuityGroups,
        continuityGroupsLength: shotResult.continuityGroups?.length || 0,
        referenceMode,
        firstShotFlags: shotResult.shots[0] ? {
          isLinkedToPrevious: (shotResult.shots[0] as any).isLinkedToPrevious,
          isFirstInGroup: (shotResult.shots[0] as any).isFirstInGroup,
          shotType: shotResult.shots[0].shotType,
        } : null,
      });
      
      // Track cost
      if (shotResult.cost) {
        totalShotCost += shotResult.cost;
      }

      // Convert generated shots to ambient-visual compatible format
      const shotTimestamp = Date.now();
      const generatedShots = shotResult.shots.map((shot, index) => ({
        id: `shot-${shotTimestamp}-${scene.id}-${index + 1}`,
        sceneId: scene.id,
        shotNumber: index + 1,
        shotType: (shot.shotType === '1F' ? 'image-ref' : 'start-end'),
        cameraMovement: shot.cameraShot,  // Use 'cameraMovement' to match ambient-visual
        cameraShot: shot.cameraShot,  // Keep 'cameraShot' for frontend compatibility
        duration: shot.duration,
        description: shot.description || null,
        // isLinkedToPrevious removed - continuity is now handled via continuityGroups
        referenceTags: shot.referenceTags || [],
        createdAt: now,
        updatedAt: now,
      }));

      allShots[scene.id] = generatedShots;

      // Create continuity groups from shotResult if available
      console.log('[character-vlog:routes] Checking for continuity groups:', {
        sceneId: scene.id,
        hasContinuityGroups: !!shotResult.continuityGroups,
        continuityGroupsLength: shotResult.continuityGroups?.length || 0,
        continuityGroups: shotResult.continuityGroups,
      });
      
      if (shotResult.continuityGroups && shotResult.continuityGroups.length > 0) {
        // Split large groups into pairs of 2 consecutive shots for granular approval
        const sceneGroups: any[] = [];
        let groupNumber = 1;
        
        shotResult.continuityGroups.forEach((group: any) => {
          // Map shot indices to shot IDs
          const shotIds = group.shotIndices.map((index: number) => generatedShots[index].id);
          
          // If group has more than 2 shots, split into consecutive pairs
          if (shotIds.length > 2) {
            for (let i = 0; i < shotIds.length - 1; i++) {
              sceneGroups.push({
                id: randomUUID(),
                sceneId: scene.id,
                groupNumber: groupNumber++,
                shotIds: [shotIds[i], shotIds[i + 1]], // Exactly 2 consecutive shots
                description: group.description || null,
                transitionType: group.transitionType || null,
                status: 'proposed',
                editedBy: null,
                editedAt: null,
                approvedAt: null,
                createdAt: now,
              });
            }
          } else if (shotIds.length === 2) {
            // Group already has exactly 2 shots
            sceneGroups.push({
              id: randomUUID(),
              sceneId: scene.id,
              groupNumber: groupNumber++,
              shotIds,
              description: group.description || null,
              transitionType: group.transitionType || null,
              status: 'proposed',
              editedBy: null,
              editedAt: null,
              approvedAt: null,
              createdAt: now,
            });
          }
          // Skip groups with only 1 shot (invalid continuity)
        });
        
        allContinuityGroups[scene.id] = sceneGroups;
        
        console.log('[character-vlog:routes] Continuity groups created for scene:', {
          sceneId: scene.id,
          sceneName: scene.name,
          groupCount: sceneGroups.length,
          originalGroups: shotResult.continuityGroups.length,
        });
      }

      console.log('[character-vlog:routes] Shots generated for scene:', {
        sceneId: scene.id,
        sceneName: scene.name,
        shotCount: generatedShots.length,
      });
    }

    // Serialize Date objects to ISO strings for JSONB storage (like ambient-visual)
    const serializedScenes = generatedScenes.map(scene => ({
      ...scene,
      createdAt: scene.createdAt instanceof Date ? scene.createdAt.toISOString() : scene.createdAt,
    }));

    const serializedShots: Record<string, any[]> = {};
    for (const [sceneId, sceneShots] of Object.entries(allShots)) {
      serializedShots[sceneId] = sceneShots.map(shot => ({
        ...shot,
        createdAt: shot.createdAt instanceof Date ? shot.createdAt.toISOString() : shot.createdAt,
        updatedAt: shot.updatedAt instanceof Date ? shot.updatedAt.toISOString() : shot.updatedAt,
      }));
    }

    // Serialize continuity groups (with serialized dates)
    const serializedContinuityGroups: Record<string, any[]> = {};
    for (const [sceneId, sceneGroups] of Object.entries(allContinuityGroups)) {
      serializedContinuityGroups[sceneId] = sceneGroups.map(group => ({
        ...group,
        createdAt: group.createdAt instanceof Date ? group.createdAt.toISOString() : group.createdAt,
        editedAt: group.editedAt instanceof Date ? group.editedAt.toISOString() : group.editedAt,
        approvedAt: group.approvedAt instanceof Date ? group.approvedAt.toISOString() : group.approvedAt,
      }));
    }

    // Save to step3Data (aligned with ambient-visual structure)
    const step3Data: Step3Data = {
      scenes: serializedScenes,
      shots: serializedShots,
      continuityLocked: false,
      continuityGroups: serializedContinuityGroups,
    };

    // Get existing video to merge step3Data
    const existingVideo = await storage.getVideo(videoId);
    if (!existingVideo) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Merge existing step3Data with new data
    const existingStep3 = (existingVideo.step3Data as Record<string, any>) || {};
    const updatedStep3Data = {
      ...existingStep3,
      ...step3Data,
    };

    // Update video with step3Data
    await storage.updateVideo(videoId, { step3Data: updatedStep3Data });

    const totalCost = (sceneResult.cost || 0) + totalShotCost;
    const totalShots = Object.values(allShots).flat().length;

    console.log('[character-vlog:routes] Breakdown generated successfully:', {
      videoId,
      sceneCount: generatedScenes.length,
      totalShots,
      totalCost,
    });

    // Return serialized data for client
    res.json({
      scenes: serializedScenes,
      shots: serializedShots,
      continuityGroups: serializedContinuityGroups,
      cost: totalCost,
    });
  } catch (error) {
    console.error('[character-vlog:routes] Breakdown generation error:', error);
    res.status(500).json({
      error: 'Failed to generate breakdown',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PATCH /api/character-vlog/videos/:id/step/3/continue
 * Continue from Step 3: Generate scenes and shots if missing, then save and advance
 * 
 * This endpoint:
 * 1. Generates scenes if they don't exist
 * 2. Generates shots for each scene if they don't exist
 * 3. Saves everything to step3Data
 * 4. Marks step 3 as complete and advances to step 4
 */
router.patch('/videos/:id/step/3/continue', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId } = req.params;
    const workspaceId = req.headers['x-workspace-id'] as string | undefined;

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    console.log('[character-vlog:routes] Step 3 continue request:', { videoId, userId, workspaceId });

    // Fetch video to get all step data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = (video.step1Data as Step1Data) || {};
    const step2Data = (video.step2Data as Step2Data) || {};
    const step3Data = (video.step3Data as Step3Data) || {};

    // Extract required fields
    const script = step1Data.script;
    const theme = step1Data.theme;
    const duration = step1Data.duration ? parseInt(step1Data.duration, 10) : 60;
    const numberOfScenes = step1Data.numberOfScenes || 'auto';
    const shotsPerScene = step1Data.shotsPerScene || 'auto';
    const videoModel = step1Data.videoModel || 'seedance-1.0-pro';
    const referenceModeDisplay = step1Data.referenceMode;
    const referenceMode = referenceModeDisplay ? convertReferenceModeToCode(referenceModeDisplay) : '1F';
    const worldDescription = step2Data.worldDescription || '';

    // Validate required fields
    if (!script || !script.trim()) {
      return res.status(400).json({ 
        error: 'Script is required',
        details: 'Please generate a script first before continuing to scenes.'
      });
    }

    if (!theme) {
      return res.status(400).json({ 
        error: 'Theme is required',
        details: 'Theme must be provided for scene generation.'
      });
    }

    // Extract characters and locations
    const characters = step2Data.characters || [];
    const primaryCharacterData = characters.find((c: any) => c.section === 'primary');
    
    if (!primaryCharacterData) {
      return res.status(400).json({ 
        error: 'Primary character is required',
        details: 'Please add a primary character in the Elements step before generating scenes.'
      });
    }

    const primaryCharacter = {
      name: primaryCharacterData.name,
      personality: primaryCharacterData.personality || step1Data.characterPersonality || 'energetic',
    };

    const secondaryCharactersData = characters
      .filter((c: any) => c.section === 'secondary')
      .slice(0, 4);
    
    const secondaryCharacters = secondaryCharactersData.map((c: any) => ({
      name: c.name,
      description: c.description || c.appearance || '',
    }));

    const locationsData = step2Data.locations || [];
    const locations = locationsData.map((l: any) => ({
      name: l.name,
      description: l.description || l.details || '',
    }));

    // Get video model durations
    const modelConfig = VIDEO_MODEL_CONFIGS[videoModel];
    const videoModelDurations = modelConfig?.durations || [2, 4, 5, 6, 8, 10, 12];

    let scenes = step3Data.scenes || [];
    let allShots: Record<string, any[]> = {};
    const allContinuityGroups: Record<string, any[]> = {};

    // Step 1: Generate scenes if they don't exist
    if (scenes.length === 0) {
      console.log('[character-vlog:routes] No scenes found, generating scenes...');
      
      const sceneGeneratorInput: SceneGeneratorInput = {
        script: script.trim(),
        theme,
        duration,
        worldDescription,
        numberOfScenes,
        shotsPerScene,
        primaryCharacter,
        secondaryCharacters,
        locations,
      };

      const sceneResult = await generateScenes(sceneGeneratorInput, userId, workspaceId);
      
      // Convert generated scenes to ambient-visual compatible format
      const timestamp = Date.now();
      const now = new Date();
      scenes = sceneResult.scenes.map((scene, index) => ({
        id: `scene-${timestamp}-${index + 1}`,
        videoId: videoId,
        sceneNumber: index + 1,
        title: scene.name,
        name: scene.name,  // Keep 'name' for frontend compatibility
        description: scene.description || null,
        duration: scene.duration || null,
        actType: index === 0 ? 'hook' : index === sceneResult.scenes.length - 1 ? 'outro' : 'main' as const,
        createdAt: now,
      }));

      console.log('[character-vlog:routes] Scenes generated:', { count: scenes.length });
    } else {
      console.log('[character-vlog:routes] Using existing scenes:', { count: scenes.length });
    }

    // Step 2: Generate shots for each scene if they don't exist
    for (const scene of scenes) {
      const existingShots = step3Data.shots?.[scene.id] || [];
      
      if (existingShots.length === 0) {
        console.log('[character-vlog:routes] No shots found for scene, generating shots...', {
          sceneId: scene.id,
          sceneName: scene.name || scene.title,
        });

        // Prepare characters for shot generator
        const charactersForAgent = characters.map((c: any, index: number) => {
          if (index === 0 || c.section === 'primary') {
            return {
              name: c.name,
              description: c.description || c.appearance || '',
              personality: c.personality || step1Data.characterPersonality || undefined,
            };
          }
          return {
            name: c.name,
            description: c.description || c.appearance || '',
          };
        });

        const locationsForAgent = locations.map((l: any) => ({
          name: l.name,
          description: l.description || l.details || '',
        }));

        const shotGeneratorInput: ShotGeneratorInput = {
          sceneName: scene.name || scene.title || '',
          sceneDescription: scene.description || '',
          sceneDuration: scene.duration || 0,
          script: script.trim(),
          characters: charactersForAgent,
          locations: locationsForAgent,
          theme,
          worldDescription,
          referenceMode,
          videoModel,
          videoModelDurations,
          targetDuration: duration,
          shotsPerScene,
        };

        const shotResult = await generateShots(shotGeneratorInput, userId, workspaceId);
        
        // Convert generated shots to ambient-visual compatible format
        const shotTimestamp = Date.now();
        const shotNow = new Date();
        const generatedShots = shotResult.shots.map((shot, index) => ({
          id: `shot-${shotTimestamp}-${scene.id}-${index + 1}`,
          sceneId: scene.id,
          shotNumber: index + 1,
          shotType: (shot.shotType === '1F' ? 'image-ref' : 'start-end'),
          cameraMovement: shot.cameraShot,
          cameraShot: shot.cameraShot,  // Keep for frontend compatibility
          duration: shot.duration,
          description: shot.description || null,
          // isLinkedToPrevious removed - continuity is now handled via continuityGroups
          referenceTags: shot.referenceTags || [],
          createdAt: shotNow,
          updatedAt: shotNow,
        }));

        allShots[scene.id] = generatedShots;

        // Create continuity groups from shotResult if available
        if (shotResult.continuityGroups && shotResult.continuityGroups.length > 0) {
          // Split large groups into pairs of 2 consecutive shots for granular approval
          const sceneGroups: any[] = [];
          let groupNumber = 1;
          
          shotResult.continuityGroups.forEach((group: any) => {
            // Map shot indices to shot IDs
            const shotIds = group.shotIndices.map((index: number) => generatedShots[index].id);
            
            // If group has more than 2 shots, split into consecutive pairs
            if (shotIds.length > 2) {
              for (let i = 0; i < shotIds.length - 1; i++) {
                sceneGroups.push({
                  id: randomUUID(),
                  sceneId: scene.id,
                  groupNumber: groupNumber++,
                  shotIds: [shotIds[i], shotIds[i + 1]], // Exactly 2 consecutive shots
                  description: group.description || null,
                  transitionType: group.transitionType || null,
                  status: 'proposed',
                  editedBy: null,
                  editedAt: null,
                  approvedAt: null,
                  createdAt: shotNow,
                });
              }
            } else if (shotIds.length === 2) {
              // Group already has exactly 2 shots
              sceneGroups.push({
                id: randomUUID(),
                sceneId: scene.id,
                groupNumber: groupNumber++,
                shotIds,
                description: group.description || null,
                transitionType: group.transitionType || null,
                status: 'proposed',
                editedBy: null,
                editedAt: null,
                approvedAt: null,
                createdAt: shotNow,
              });
            }
            // Skip groups with only 1 shot (invalid continuity)
          });
          
          allContinuityGroups[scene.id] = sceneGroups;
          
          console.log('[character-vlog:routes] Continuity groups created for scene:', {
            sceneId: scene.id,
            sceneName: scene.name || scene.title,
            groupCount: sceneGroups.length,
            originalGroups: shotResult.continuityGroups.length,
          });
        }

        console.log('[character-vlog:routes] Shots generated for scene:', {
          sceneId: scene.id,
          sceneName: scene.name || scene.title,
          shotCount: generatedShots.length,
        });
      } else {
        // Use existing shots
        allShots[scene.id] = existingShots;
        console.log('[character-vlog:routes] Using existing shots for scene:', {
          sceneId: scene.id,
          sceneName: scene.name || scene.title,
          shotCount: existingShots.length,
        });
      }
    }

    // Step 3: Save everything to step3Data (aligned with ambient-visual structure)
    const serializedScenes = scenes.map(s => ({
      ...s,
      createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    }));

    const serializedShots: Record<string, any[]> = {};
    for (const [sceneId, sceneShots] of Object.entries(allShots)) {
      serializedShots[sceneId] = sceneShots.map(shot => ({
        ...shot,
        createdAt: shot.createdAt instanceof Date ? shot.createdAt.toISOString() : shot.createdAt,
        updatedAt: shot.updatedAt instanceof Date ? shot.updatedAt.toISOString() : shot.updatedAt,
      }));
    }

    // Serialize continuity groups (with serialized dates)
    const serializedContinuityGroups: Record<string, any[]> = {};
    for (const [sceneId, sceneGroups] of Object.entries(allContinuityGroups)) {
      serializedContinuityGroups[sceneId] = sceneGroups.map(group => ({
        ...group,
        createdAt: group.createdAt instanceof Date ? group.createdAt.toISOString() : group.createdAt,
        editedAt: group.editedAt instanceof Date ? group.editedAt.toISOString() : group.editedAt,
        approvedAt: group.approvedAt instanceof Date ? group.approvedAt.toISOString() : group.approvedAt,
      }));
    }

    // Merge with existing continuity groups (preserve user edits/approvals)
    const existingContinuityGroups = step3Data.continuityGroups || {};
    const mergedContinuityGroups = { ...existingContinuityGroups, ...serializedContinuityGroups };

    const updatedStep3Data: Step3Data = {
      scenes: serializedScenes,
      shots: serializedShots,
      continuityLocked: false,
      continuityGroups: mergedContinuityGroups,
    };

    // Update video in database
    const existingCompletedSteps = Array.isArray(video.completedSteps) ? video.completedSteps : [];
    const updatedCompletedSteps = existingCompletedSteps.includes(3) 
      ? existingCompletedSteps 
      : [...existingCompletedSteps, 3];
    
    await storage.updateVideo(videoId, {
      step3Data: updatedStep3Data,
      currentStep: 4, // Advance to step 4 (storyboard)
      completedSteps: updatedCompletedSteps,
    });

    console.log('[character-vlog:routes] Step 3 continue completed:', {
      videoId,
      sceneCount: scenes.length,
      totalShots: Object.values(allShots).reduce((sum, shots) => sum + shots.length, 0),
    });

    res.json({
      success: true,
      scenes: updatedStep3Data.scenes,
      shots: allShots,
      continuityGroups: mergedContinuityGroups,
      message: 'Scenes and shots generated successfully',
    });
  } catch (error) {
    console.error('[character-vlog:routes] Step 3 continue error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to continue from step 3',
      details: errorMessage 
    });
  }
});

/**
 * PATCH /api/character-vlog/videos/:id/step/3/settings
 * Auto-save scenes to step3Data
 * 
 * Saves scenes immediately after generation or when user edits them.
 */
router.patch('/videos/:id/step/3/settings', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId } = req.params;
    const { scenes, shots, continuityGroups, continuityLocked } = req.body as {
      scenes?: Array<{
        id: string;
        name: string;
        description: string;
        duration: number;
        actType?: 'hook' | 'intro' | 'main' | 'outro' | 'custom';
        shots?: Array<any>;
      }>;
      shots?: Record<string, any[]>;
      continuityGroups?: Record<string, any[]>;
      continuityLocked?: boolean;
    };

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    // Verify video exists and belongs to user
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get existing step3Data or create new
    const existingStep3Data = (video.step3Data as Step3Data) || {};
    
    // Update step3Data
    const updatedStep3Data: Step3Data = {
      ...existingStep3Data,
      // Update scenes if provided
      ...(scenes && {
        scenes: scenes.map(scene => {
          const now = new Date();
          return {
            ...scene,
            title: (scene as any).name || (scene as any).title || '',
            name: (scene as any).name || (scene as any).title || '',
            videoId: videoId,
            sceneNumber: (scene as any).sceneNumber || scenes.indexOf(scene) + 1,
            createdAt: (scene as any).createdAt instanceof Date 
              ? (scene as any).createdAt.toISOString() 
              : ((scene as any).createdAt || now.toISOString()),
          };
        }),
      }),
      // Update shots if provided (remove isLinkedToPrevious flag)
      shots: shots ? (() => {
        const cleanedShots: Record<string, any[]> = {};
        let totalShots = 0;
        let shotsWithVersionId = 0;
        
        for (const [sceneId, sceneShots] of Object.entries(shots)) {
          cleanedShots[sceneId] = sceneShots.map((shot: any) => {
            totalShots++;
            if (shot.currentVersionId) {
              shotsWithVersionId++;
            }
            const { isLinkedToPrevious, isFirstInGroup, ...cleanedShot } = shot;
            return cleanedShot;
          });
        }
        
        console.log('[character-vlog:routes] Saving shots with currentVersionId:', {
          totalShots,
          shotsWithVersionId,
          sampleShot: Object.values(cleanedShots)[0]?.[0],
          hasCurrentVersionId: !!Object.values(cleanedShots)[0]?.[0]?.currentVersionId,
        });
        
        return cleanedShots;
      })() : (existingStep3Data.shots || {}),
      // Update continuityLocked if provided
      continuityLocked: continuityLocked !== undefined ? continuityLocked : (existingStep3Data.continuityLocked || false),
      // Update continuityGroups if provided (serialize dates)
      continuityGroups: continuityGroups ? (() => {
        const serialized: Record<string, any[]> = {};
        const now = new Date();
        for (const [sceneId, sceneGroups] of Object.entries(continuityGroups)) {
          serialized[sceneId] = sceneGroups.map(group => {
            // Auto-approve all proposed groups if continuityLocked is being set to true
            const shouldAutoApprove = continuityLocked === true && group.status === 'proposed';
            
            return {
              ...group,
              // Auto-approve if continuityLocked is true and status is still 'proposed'
              status: shouldAutoApprove ? 'approved' : group.status,
              approvedAt: shouldAutoApprove 
                ? now.toISOString() 
                : (group.approvedAt instanceof Date ? group.approvedAt.toISOString() : (group.approvedAt || null)),
              createdAt: group.createdAt instanceof Date ? group.createdAt.toISOString() : (group.createdAt || new Date().toISOString()),
              editedAt: group.editedAt instanceof Date ? group.editedAt.toISOString() : (group.editedAt || null),
            };
          });
        }
        
        if (continuityLocked === true) {
          const totalGroups = Object.values(serialized).flat().length;
          const approvedGroups = Object.values(serialized).flat().filter((g: any) => g.status === 'approved').length;
          console.log('[character-vlog:routes] Auto-approved continuity groups on lock:', {
            totalGroups,
            approvedGroups,
            autoApproved: approvedGroups,
          });
        }
        
        return serialized;
      })() : (existingStep3Data.continuityGroups || {}),
    };

    // Clean existing shots of isLinkedToPrevious flag if continuityGroups exist
    // This ensures shots don't retain the deprecated flag when groups are used
    if (continuityGroups && Object.keys(continuityGroups).length > 0) {
      const cleanedShots: Record<string, any[]> = {};
      for (const [sceneId, sceneShots] of Object.entries(updatedStep3Data.shots)) {
        cleanedShots[sceneId] = sceneShots.map((shot: any) => {
          const { isLinkedToPrevious, isFirstInGroup, ...cleanedShot } = shot;
          return cleanedShot;
        });
      }
      updatedStep3Data.shots = cleanedShots;
    }

    // Update video in database
    await storage.updateVideo(videoId, {
      step3Data: updatedStep3Data,
    });

    // Log what was saved including currentVersionId status
    const savedShotsSummary = shots ? (() => {
      const totalShots = Object.values(updatedStep3Data.shots).flat().length;
      const shotsWithVersionId = Object.values(updatedStep3Data.shots).flat().filter((s: any) => s.currentVersionId).length;
      return { totalShots, shotsWithVersionId };
    })() : null;
    
    console.log('[character-vlog:routes] Step 3 data saved:', {
      videoId,
      sceneCount: scenes?.length || 'unchanged',
      shotsCount: savedShotsSummary?.totalShots || 'unchanged',
      shotsWithVersionId: savedShotsSummary?.shotsWithVersionId || 'unchanged',
      continuityGroupsCount: continuityGroups ? Object.values(continuityGroups).flat().length : 'unchanged',
      continuityLocked: continuityLocked !== undefined ? continuityLocked : 'unchanged',
      shotsCleaned: continuityGroups && Object.keys(continuityGroups).length > 0,
    });

    res.json({
      success: true,
      step3Data: updatedStep3Data,
      sceneCount: scenes?.length,
      continuityGroupsCount: continuityGroups ? Object.values(continuityGroups).flat().length : undefined,
    });
  } catch (error) {
    console.error('[character-vlog:routes] Failed to save step 3 data:', error);
    res.status(500).json({ error: 'Failed to save step 3 data' });
  }
});

/**
 * POST /api/character-vlog/characters
 * Create a new character for this video
 * 
 * Saves character to database immediately (even without image)
 */
router.post('/characters', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { videoId, name, description, personality, appearance, section, libraryCharacterId } = req.body as {
      videoId: string;
      name: string;
      description?: string;
      personality?: string;
      appearance?: string;
      section?: 'primary' | 'secondary';
      libraryCharacterId?: string; // ID of the character from the library (to prevent duplicates)
    };

    if (!videoId || !name) {
      return res.status(400).json({ error: 'videoId and name are required' });
    }

    // Get video to get workspaceId
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Verify workspace access
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find(w => w.id === video.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    // Create character in database
    console.log('[character-vlog:routes] Creating character:', {
      videoId,
      workspaceId: video.workspaceId,
      name,
      hasDescription: !!description,
      hasPersonality: !!personality,
      hasAppearance: !!appearance,
    });

    const character = await storage.createCharacter({
      workspaceId: video.workspaceId,
      name,
      description: description || null,
      personality: personality || null,
      appearance: appearance || null,
      imageUrl: null, // Will be updated when image is generated
      referenceImages: null,
      voiceSettings: null,
    });

    console.log('[character-vlog:routes] Character created in DB:', {
      characterId: character.id,
      name: character.name,
    });

    // Update step2Data to include full character object with section field
    const existingStep2Data = (video.step2Data as Step2Data) || {};
    
    // Add to characterIds array for backwards compatibility
    const characterIds = existingStep2Data.characterIds || [];
    if (!characterIds.includes(character.id)) {
      characterIds.push(character.id);
    }

    // Add full character object with section field to characters array
    const characterWithSection = {
      ...character,
      section: section || 'secondary',
      libraryCharacterId: libraryCharacterId || null, // Store original library character ID to prevent duplicates
    };
    const characters = existingStep2Data.characters || [];
    // Check if character already exists in array and update it, otherwise add it
    const existingIndex = characters.findIndex((c: any) => c.id === character.id);
    if (existingIndex >= 0) {
      characters[existingIndex] = characterWithSection;
    } else {
      characters.push(characterWithSection);
    }

    await storage.updateVideo(videoId, {
      step2Data: {
        ...existingStep2Data,
        characterIds, // Keep for backwards compatibility
        characters, // Full objects with section field
      },
    });

    console.log('[character-vlog:routes] Video step2Data updated with character:', {
      characterId: character.id,
      videoId,
      section: section || 'secondary',
      totalCharacters: characters.length,
      totalCharacterIds: characterIds.length,
    });

    // Return character with section info
    res.json({
      ...character,
      section: section || 'secondary',
    });
  } catch (error) {
    console.error('[character-vlog:routes] Character creation error:', error);
    res.status(500).json({ error: 'Failed to create character' });
  }
});

/**
 * POST /api/character-vlog/locations
 * Create a new location for this video
 * 
 * Saves location to database immediately (even without image)
 */
router.post('/locations', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { videoId, name, description, details } = req.body as {
      videoId: string;
      name: string;
      description?: string;
      details?: string;
    };

    if (!videoId || !name) {
      return res.status(400).json({ error: 'videoId and name are required' });
    }

    // Get video to get workspaceId
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Verify workspace access
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find(w => w.id === video.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    // Create location in database
    const location = await storage.createLocation({
      workspaceId: video.workspaceId,
      name,
      description: description || null,
      details: details || null,
      imageUrl: null, // Will be updated when image is generated
      referenceImages: null,
    });

    // Update step2Data to include full location object
    const existingStep2Data = (video.step2Data as Step2Data) || {};
    
    // Add to locationIds array for backwards compatibility
    const locationIds = existingStep2Data.locationIds || [];
    if (!locationIds.includes(location.id)) {
      locationIds.push(location.id);
    }

    // Add full location object to locations array
    const locations = existingStep2Data.locations || [];
    // Check if location already exists in array and update it, otherwise add it
    const existingIndex = locations.findIndex((l: any) => l.id === location.id);
    if (existingIndex >= 0) {
      locations[existingIndex] = location;
    } else {
      locations.push(location);
    }

    await storage.updateVideo(videoId, {
      step2Data: {
        ...existingStep2Data,
        locationIds, // Keep for backwards compatibility
        locations, // Full objects
      },
    });

    console.log('[character-vlog:routes] Location created:', {
      locationId: location.id,
      videoId,
      name: location.name,
      totalLocations: locations.length,
      totalLocationIds: locationIds.length,
    });

    res.json(location);
  } catch (error) {
    console.error('[character-vlog:routes] Location creation error:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

/**
 * PUT /api/character-vlog/characters/:characterId
 * Update an existing character
 */
router.put('/characters/:characterId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { characterId } = req.params;
    const { name, description, personality, appearance } = req.body;

    // Get character to verify workspace access
    const character = await storage.getCharacter(characterId);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Verify workspace access
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find(w => w.id === character.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this character' });
    }

    // Update character
    const updated = await storage.updateCharacter(characterId, {
      name,
      description,
      personality,
      appearance,
    });

    res.json(updated);
  } catch (error) {
    console.error('[character-vlog:routes] Character update error:', error);
    res.status(500).json({ error: 'Failed to update character' });
  }
});

/**
 * DELETE /api/character-vlog/characters/:characterId
 * Delete a character from database and remove from step2Data
 */
router.delete('/characters/:characterId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { characterId } = req.params;
    const { videoId } = req.body;

    // Get character to verify workspace access
    const character = await storage.getCharacter(characterId);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Verify workspace access
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find(w => w.id === character.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this character' });
    }

    // Delete character from database
    await storage.deleteCharacter(characterId);

    // If videoId is provided, remove character from step2Data
    if (videoId) {
      const video = await storage.getVideo(videoId);
      if (video) {
        const existingStep2Data = (video.step2Data as Step2Data) || {};
        
        // Remove from characterIds array
        const characterIds = (existingStep2Data.characterIds || []).filter((id: string) => id !== characterId);
        
        // Remove from characters array
        const characters = (existingStep2Data.characters || []).filter((c: any) => c.id !== characterId);
        
        await storage.updateVideo(videoId, {
          step2Data: {
            ...existingStep2Data,
            characterIds,
            characters,
          },
        });

        console.log('[character-vlog:routes] Character removed from step2Data:', {
          characterId,
          videoId,
          remainingCharacters: characters.length,
        });
      }
    }

    res.json({ success: true, message: 'Character deleted' });
  } catch (error) {
    console.error('[character-vlog:routes] Character deletion error:', error);
    res.status(500).json({ error: 'Failed to delete character' });
  }
});

/**
 * PUT /api/character-vlog/locations/:locationId
 * Update an existing location
 */
router.put('/locations/:locationId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { locationId } = req.params;
    const { name, description, details } = req.body;

    // Get location to verify workspace access
    const location = await storage.getLocation(locationId);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Verify workspace access
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find(w => w.id === location.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this location' });
    }

    // Update location
    const updated = await storage.updateLocation(locationId, {
      name,
      description,
      details,
    });

    res.json(updated);
  } catch (error) {
    console.error('[character-vlog:routes] Location update error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

/**
 * DELETE /api/character-vlog/locations/:locationId
 * Delete a location from database and remove from step2Data
 */
router.delete('/locations/:locationId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { locationId } = req.params;
    const { videoId } = req.body;

    // Get location to verify workspace access
    const location = await storage.getLocation(locationId);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Verify workspace access
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find(w => w.id === location.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied to this location' });
    }

    // Delete location from database
    await storage.deleteLocation(locationId);

    // If videoId is provided, remove location from step2Data
    if (videoId) {
      const video = await storage.getVideo(videoId);
      if (video) {
        const existingStep2Data = (video.step2Data as Step2Data) || {};
        
        // Remove from locationIds array
        const locationIds = (existingStep2Data.locationIds || []).filter((id: string) => id !== locationId);
        
        // Remove from locations array
        const locations = (existingStep2Data.locations || []).filter((l: any) => l.id !== locationId);
        
        await storage.updateVideo(videoId, {
          step2Data: {
            ...existingStep2Data,
            locationIds,
            locations,
          },
        });

        console.log('[character-vlog:routes] Location removed from step2Data:', {
          locationId,
          videoId,
          remainingLocations: locations.length,
        });
      }
    }

    res.json({ success: true, message: 'Location deleted' });
  } catch (error) {
    console.error('[character-vlog:routes] Location deletion error:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

/**
 * POST /api/character-vlog/characters/:characterId/generate-image
 * Generate character image using existing character image generator agent
 * 
 * Adapts character-vlog format to existing agent interface
 * Integrates worldDescription into the prompt
 * Updates character record with Bunny CDN URL after generation
 */
router.post('/characters/:characterId/generate-image', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { characterId } = req.params;
    const { 
      name, 
      appearance, 
      personality, 
      age,
      artStyleDescription, 
      styleReferenceImage, 
      worldDescription, 
      // model is ignored - always uses 'nano-banana' for character images
      referenceImages 
    } = req.body;

    if (!name || !appearance) {
      return res.status(400).json({ error: 'name and appearance are required' });
    }

    // For primary characters, personality is required
    // For secondary characters, personality might be null/empty
    // The existing agent requires personality, so we'll use a default if not provided
    const personalityForAgent = personality || 'Neutral and balanced';

    // Integrate worldDescription into artStyleDescription if provided
    let finalArtStyleDescription = artStyleDescription || '';
    if (worldDescription && worldDescription.trim()) {
      if (finalArtStyleDescription) {
        finalArtStyleDescription = `${finalArtStyleDescription}\n${worldDescription}`;
      } else {
        finalArtStyleDescription = worldDescription;
      }
    }

    // Character image generation always uses nano-banana (hardcoded)
    const characterImageModel = 'nano-banana';

    console.log('[character-vlog:routes] Generating character image:', {
      characterId,
      name,
      hasPersonality: !!personality,
      hasArtStyle: !!artStyleDescription,
      hasWorldDescription: !!worldDescription,
      hasStyleReference: !!styleReferenceImage,
      referenceImageCount: referenceImages?.length || 0,
      model: characterImageModel, // Always nano-banana for characters
    });

    // Build input for existing agent
    const agentInput: CharacterImageInputAgent = {
      name,
      appearance,
      personality: personalityForAgent, // Required by agent
      artStyleDescription: finalArtStyleDescription || undefined,
      model: characterImageModel, // Always nano-banana for character images
      referenceImages: referenceImages || [],
      styleReferenceImage: styleReferenceImage || undefined,
    };

    // Call existing character image generator
    const workspaceId = req.headers['x-workspace-id'] as string | undefined;
    const result = await generateCharacterImageAgent(agentInput, userId, workspaceId);

    if (result.error || !result.imageUrl) {
      console.error('[character-vlog:routes] Character image generation failed:', result.error);
      return res.status(500).json({ 
        error: 'Failed to generate character image',
        details: result.error || 'No image URL returned',
      });
    }

    console.log('[character-vlog:routes] Character image generated, uploading to Bunny CDN:', {
      characterId,
      generatedUrl: result.imageUrl.substring(0, 50) + '...',
      cost: result.cost,
    });

    // Download the generated image and upload to Bunny CDN
    let cdnUrl = result.imageUrl; // Fallback to Runware URL if Bunny upload fails
    
    if (bunnyStorage.isBunnyConfigured()) {
      try {
        // Get video and workspace info for path building
        const { videoId } = req.body;
        if (videoId) {
          const video = await storage.getVideo(videoId);
          if (video) {
            const workspaces = await storage.getWorkspacesByUserId(userId);
            const workspace = workspaces.find(w => w.id === video.workspaceId);
            const workspaceName = workspace?.name || video.workspaceId;
            const videoTitle = video.title || 'Untitled';

            // Download image from Runware
            const imageResponse = await fetch(result.imageUrl);
            if (imageResponse.ok) {
              const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
              const contentType = imageResponse.headers.get('content-type') || 'image/png';
              
              // Extract extension from content type
              const extensionMap: Record<string, string> = {
                'image/jpeg': 'jpg',
                'image/jpg': 'jpg',
                'image/png': 'png',
                'image/webp': 'webp',
              };
              const extension = extensionMap[contentType] || 'png';
              const filename = `${name.replace(/[^a-zA-Z0-9-_]/g, '_')}_${Date.now()}.${extension}`;

              // Build Bunny path: {userId}/{workspace}/video_mode/vlog/{title}_{date}/Rendered/Characters/{filename}
              const bunnyPath = buildVideoModePath({
                userId,
                workspaceName,
                toolMode: 'vlog',
                projectName: videoTitle,
                subFolder: 'Characters',
                filename,
              });

              // Upload to Bunny CDN
              cdnUrl = await bunnyStorage.uploadFile(bunnyPath, imageBuffer, contentType);
              
              console.log('[character-vlog:routes] Character image uploaded to Bunny CDN:', {
                characterId,
                cdnUrl: cdnUrl.substring(0, 50) + '...',
              });

              // Update character record in database with Bunny CDN URL
              try {
                // Check if character exists first
                const existingCharacter = await storage.getCharacter(characterId);
                if (existingCharacter) {
                  await storage.updateCharacter(characterId, {
                    imageUrl: cdnUrl,
                  });
                  console.log('[character-vlog:routes] Character record updated with image URL:', {
                    characterId,
                    hasImageUrl: !!cdnUrl,
                  });

                  // Also update step2Data.characters array with the new imageUrl
                  // Get fresh video data to ensure we have latest step2Data
                  const freshVideo = await storage.getVideo(videoId);
                  if (freshVideo) {
                    const existingStep2Data = (freshVideo.step2Data as Step2Data) || {};
                    const characters = existingStep2Data.characters || [];
                    const characterIndex = characters.findIndex((c: any) => c.id === characterId);
                    if (characterIndex >= 0) {
                      characters[characterIndex] = {
                        ...characters[characterIndex],
                        imageUrl: cdnUrl,
                      };
                      await storage.updateVideo(videoId, {
                        step2Data: {
                          ...existingStep2Data,
                          characters,
                        },
                      });
                      console.log('[character-vlog:routes] step2Data.characters updated with image URL:', {
                        characterId,
                        hasImageUrl: !!cdnUrl,
                      });
                    }
                  }
                } else {
                  // Character doesn't exist, create it with the image URL
                  console.log('[character-vlog:routes] Character not found, creating new character with image URL:', {
                    characterId,
                    name,
                  });
                  
                  // Get video to get workspaceId
                  const { videoId } = req.body;
                  if (videoId) {
                    const video = await storage.getVideo(videoId);
                    if (video) {
                      const newCharacter = await storage.createCharacter({
                        workspaceId: video.workspaceId,
                        name: name || 'Unnamed Character',
                        description: null,
                        personality: personality || null,
                        appearance: appearance || null,
                        imageUrl: cdnUrl,
                        referenceImages: null,
                        voiceSettings: null,
                      });
                      
                      // Update step2Data to include this character ID
                      const existingStep2Data = (video.step2Data as Step2Data) || {};
                      const characterIds = existingStep2Data.characterIds || [];
                      if (!characterIds.includes(newCharacter.id)) {
                        characterIds.push(newCharacter.id);
                      }
                      
                      await storage.updateVideo(videoId, {
                        step2Data: {
                          ...existingStep2Data,
                          characterIds,
                        },
                      });
                      
                      console.log('[character-vlog:routes] Character created with image URL:', {
                        characterId: newCharacter.id,
                        originalCharacterId: characterId,
                        hasImageUrl: !!cdnUrl,
                      });
                    }
                  }
                }
              } catch (updateError) {
                console.error('[character-vlog:routes] Failed to update/create character record:', updateError);
                // Continue even if update fails - image is still uploaded
              }
            }
          }
        }
      } catch (uploadError) {
        console.error('[character-vlog:routes] Failed to upload character image to Bunny CDN:', uploadError);
        // Continue with Runware URL as fallback
      }
    }

    res.json({
      imageUrl: cdnUrl,
      cost: result.cost,
    });
  } catch (error) {
    console.error('[character-vlog:routes] Character image generation error:', error);
    res.status(500).json({ error: 'Failed to generate character image' });
  }
});

/**
 * POST /api/character-vlog/locations/:locationId/generate-image
 * Generate location image using existing location image generator agent
 * 
 * Adapts character-vlog format to existing agent interface
 * Integrates worldDescription into the prompt
 */
router.post('/locations/:locationId/generate-image', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { locationId } = req.params;
    const { 
      name, 
      description, 
      details,
      artStyleDescription, 
      styleReferenceImage, 
      worldDescription, 
      // model is ignored - always uses 'nano-banana' for location images
      referenceImages 
    } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'name and description are required' });
    }

    // Integrate worldDescription into artStyleDescription if provided
    let finalArtStyleDescription = artStyleDescription || '';
    if (worldDescription && worldDescription.trim()) {
      if (finalArtStyleDescription) {
        finalArtStyleDescription = `${finalArtStyleDescription}\n${worldDescription}`;
      } else {
        finalArtStyleDescription = worldDescription;
      }
    }

    // Location image generation always uses nano-banana (hardcoded)
    const locationImageModel = 'nano-banana';

    console.log('[character-vlog:routes] Generating location image:', {
      locationId,
      name,
      hasArtStyle: !!artStyleDescription,
      hasWorldDescription: !!worldDescription,
      hasStyleReference: !!styleReferenceImage,
      referenceImageCount: referenceImages?.length || 0,
      model: locationImageModel, // Always nano-banana for locations
    });

    // Build input for existing agent
    const agentInput: LocationImageInputAgent = {
      name,
      description,
      details: details || undefined,
      artStyleDescription: finalArtStyleDescription || undefined,
      model: locationImageModel, // Always nano-banana for location images
      referenceImages: referenceImages || [],
      styleReferenceImage: styleReferenceImage || undefined,
    };

    // Call existing location image generator
    const workspaceId = req.headers['x-workspace-id'] as string | undefined;
    const result = await generateLocationImageAgent(agentInput, userId, workspaceId);

    if (result.error || !result.imageUrl) {
      console.error('[character-vlog:routes] Location image generation failed:', result.error);
      return res.status(500).json({ 
        error: 'Failed to generate location image',
        details: result.error || 'No image URL returned',
      });
    }

    console.log('[character-vlog:routes] Location image generated, uploading to Bunny CDN:', {
      locationId,
      generatedUrl: result.imageUrl.substring(0, 50) + '...',
      cost: result.cost,
    });

    // Download the generated image and upload to Bunny CDN
    let cdnUrl = result.imageUrl; // Fallback to Runware URL if Bunny upload fails
    
    if (bunnyStorage.isBunnyConfigured()) {
      try {
        // Get video and workspace info for path building
        const { videoId } = req.body;
        if (videoId) {
          const video = await storage.getVideo(videoId);
          if (video) {
            const workspaces = await storage.getWorkspacesByUserId(userId);
            const workspace = workspaces.find(w => w.id === video.workspaceId);
            const workspaceName = workspace?.name || video.workspaceId;
            const videoTitle = video.title || 'Untitled';

            // Download image from Runware
            const imageResponse = await fetch(result.imageUrl);
            if (imageResponse.ok) {
              const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
              const contentType = imageResponse.headers.get('content-type') || 'image/png';
              
              // Extract extension from content type
              const extensionMap: Record<string, string> = {
                'image/jpeg': 'jpg',
                'image/jpg': 'jpg',
                'image/png': 'png',
                'image/webp': 'webp',
              };
              const extension = extensionMap[contentType] || 'png';
              const filename = `${name.replace(/[^a-zA-Z0-9-_]/g, '_')}_${Date.now()}.${extension}`;

              // Build Bunny path: {userId}/{workspace}/video_mode/vlog/{title}_{date}/Rendered/Locations/{filename}
              const bunnyPath = buildVideoModePath({
                userId,
                workspaceName,
                toolMode: 'vlog',
                projectName: videoTitle,
                subFolder: 'Locations',
                filename,
              });

              // Upload to Bunny CDN
              cdnUrl = await bunnyStorage.uploadFile(bunnyPath, imageBuffer, contentType);
              
              console.log('[character-vlog:routes] Location image uploaded to Bunny CDN:', {
                locationId,
                cdnUrl: cdnUrl.substring(0, 50) + '...',
              });

              // Update location record in database with Bunny CDN URL
              try {
                // Check if location exists first
                const existingLocation = await storage.getLocation(locationId);
                if (existingLocation) {
                  await storage.updateLocation(locationId, {
                    imageUrl: cdnUrl,
                  });
                  console.log('[character-vlog:routes] Location record updated with image URL:', {
                    locationId,
                    hasImageUrl: !!cdnUrl,
                  });
                } else {
                  // Location doesn't exist, create it with the image URL
                  console.log('[character-vlog:routes] Location not found, creating new location with image URL:', {
                    locationId,
                    name,
                  });
                  
                  // Get video to get workspaceId
                  const { videoId } = req.body;
                  if (videoId) {
                    const video = await storage.getVideo(videoId);
                    if (video) {
                      const newLocation = await storage.createLocation({
                        workspaceId: video.workspaceId,
                        name: name || 'Unnamed Location',
                        description: description || null,
                        details: details || null,
                        imageUrl: cdnUrl,
                        referenceImages: null,
                      });
                      
                      // Update step2Data to include this location ID
                      const existingStep2Data = (video.step2Data as Step2Data) || {};
                      const locationIds = existingStep2Data.locationIds || [];
                      if (!locationIds.includes(newLocation.id)) {
                        locationIds.push(newLocation.id);
                      }
                      
                      // Add full location object to locations array
                      const locations = existingStep2Data.locations || [];
                      const existingIndex = locations.findIndex((l: any) => l.id === newLocation.id);
                      if (existingIndex >= 0) {
                        locations[existingIndex] = newLocation;
                      } else {
                        locations.push(newLocation);
                      }
                      
                      await storage.updateVideo(videoId, {
                        step2Data: {
                          ...existingStep2Data,
                          locationIds,
                          locations,
                        },
                      });
                      
                      console.log('[character-vlog:routes] Location created with image URL:', {
                        locationId: newLocation.id,
                        originalLocationId: locationId,
                        hasImageUrl: !!cdnUrl,
                      });
                    }
                  }
                }

                // Also update step2Data.locations array with the new imageUrl
                // Get fresh video data to ensure we have latest step2Data
                const freshVideo = await storage.getVideo(videoId);
                if (freshVideo) {
                  const existingStep2Data = (freshVideo.step2Data as Step2Data) || {};
                  const locations = existingStep2Data.locations || [];
                  const locationIndex = locations.findIndex((l: any) => l.id === locationId);
                  if (locationIndex >= 0) {
                    locations[locationIndex] = {
                      ...locations[locationIndex],
                      imageUrl: cdnUrl,
                    };
                    await storage.updateVideo(videoId, {
                      step2Data: {
                        ...existingStep2Data,
                        locations,
                      },
                    });
                    console.log('[character-vlog:routes] step2Data.locations updated with image URL:', {
                      locationId,
                      hasImageUrl: !!cdnUrl,
                    });
                  }
                }
              } catch (updateError) {
                console.error('[character-vlog:routes] Failed to update location record:', updateError);
                // Continue even if update fails - image is still uploaded
              }
            }
          }
        }
      } catch (uploadError) {
        console.error('[character-vlog:routes] Failed to upload location image to Bunny CDN:', uploadError);
        // Continue with Runware URL as fallback
      }
    }

    res.json({
      imageUrl: cdnUrl,
      cost: result.cost,
    });
  } catch (error) {
    console.error('[character-vlog:routes] Location image generation error:', error);
    res.status(500).json({ error: 'Failed to generate location image' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4: STORYBOARD PHASE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/character-vlog/storyboard/generate-prompts
 * Generate image and video prompts for all shots in a scene
 * 
 * Implements explicit inheritance for continuity:
 * - Filters approved continuity groups only
 * - Sorts shots to match continuity order
 * - Identifies inheritance needs before AI call
 * - For 1F linked: inherits image prompt, generates only video
 * - For 2F linked: inherits start from previous end, generates only end+video
 * - Merges inherited prompts after AI generation
 */
router.post('/storyboard/generate-prompts', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { videoId, sceneId } = req.body as {
      videoId: string;
      sceneId: string;
    };

    if (!videoId || !sceneId) {
      return res.status(400).json({ error: 'videoId and sceneId are required' });
    }

    console.log('[character-vlog:routes] Storyboard prompt generation request:', {
      videoId,
      sceneId,
      userId,
    });

    // Fetch video to get all step data
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = (video.step1Data as Step1Data) || {};
    const step2Data = (video.step2Data as Step2Data) || {};
    const step3Data = (video.step3Data as Step3Data) || {};
    const step4Data = (video.step4Data as Step4Data) || { shots: {} };

    // Find scene and shots
    const scenes = step3Data.scenes || [];
    const scene = scenes.find((s: any) => s.id === sceneId);
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    const sceneShots = step3Data.shots?.[sceneId] || [];
    if (sceneShots.length === 0) {
      return res.status(400).json({ error: 'No shots found for this scene' });
    }

    console.log('[character-vlog:routes] Processing scene:', {
      sceneId,
      sceneName: scene.name || scene.title,
      shotCount: sceneShots.length,
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // CONTINUITY HANDLING: Filter Approved Groups, Sort Shots, Identify Inheritance
    // ═══════════════════════════════════════════════════════════════════════════════

    // Step 1: Filter approved continuity groups only
    const allSceneGroups = step3Data.continuityGroups?.[sceneId] || [];
    const approvedSceneGroups = allSceneGroups.filter((group: any) => {
      const status = group.status || 'approved'; // Default for backward compatibility
      return status === 'approved';
    });

    console.log('[character-vlog:routes] Continuity groups:', {
      sceneId,
      totalGroups: allSceneGroups.length,
      approvedGroups: approvedSceneGroups.length,
      approvedGroupIds: approvedSceneGroups.map((g: any) => g.id),
    });

    // Step 2: Build continuity map from APPROVED groups with previousShotId tracking
    const continuityMap = new Map<
      string,
      {
        isLinkedToPrevious: boolean;
        isFirstInGroup: boolean;
        groupId?: string;
        previousShotId?: string; // Track previous shot ID for inheritance
      }
    >();

    for (const group of approvedSceneGroups) {
      const shotIds = group.shotIds || [];
      
      for (let i = 0; i < shotIds.length; i++) {
        const shotId = shotIds[i];
        const isFirstInGroup = i === 0;
        const isLinkedToPrevious = i > 0;
        const previousShotId = i > 0 ? shotIds[i - 1] : undefined;

        continuityMap.set(shotId, {
          isLinkedToPrevious,
          isFirstInGroup,
          groupId: group.id,
          previousShotId,
        });
      }
    }

    // Step 3: Sort shots to match continuity group order (critical for inheritance)
    const sortedSceneShots = [...sceneShots].sort((a: any, b: any) => {
      const aInGroup = continuityMap.has(a.id);
      const bInGroup = continuityMap.has(b.id);
      
      // If both in groups, maintain group order
      if (aInGroup && bInGroup) {
        const aInfo = continuityMap.get(a.id);
        const bInfo = continuityMap.get(b.id);
        
        // Same group: maintain shot order within group
        if (aInfo && bInfo && aInfo.groupId && aInfo.groupId === bInfo.groupId) {
          const group = approvedSceneGroups.find((g: any) => g.id === aInfo.groupId);
          if (group) {
            const aIndex = group.shotIds.indexOf(a.id);
            const bIndex = group.shotIds.indexOf(b.id);
            return aIndex - bIndex;
          }
        }
      }
      
      // Default: maintain original order (by shotNumber)
      return (a.shotNumber || 0) - (b.shotNumber || 0);
    });

    console.log('[character-vlog:routes] Shot order:', {
      originalOrder: sceneShots.map((s: any) => ({ id: s.id, shotNumber: s.shotNumber })),
      sortedOrder: sortedSceneShots.map((s: any) => ({ id: s.id, shotNumber: s.shotNumber })),
    });

    // Step 4: Process shots sequentially to identify inheritance needs
    // Track generated prompts as we process (for inheritance chain within batch)
    const generatedPromptsMap = new Map<string, {
      imagePrompts: { single: string | null; start: string | null; end: string | null };
    }>();

    // Prepare shots for agent input with explicit inheritance flags
    const shotsForAgent = sortedSceneShots.map((shot: any, index: number) => {
      const continuityInfo = continuityMap.get(shot.id);
      const isLinkedToPrevious = continuityInfo?.isLinkedToPrevious || false;
      const isFirstInGroup = continuityInfo?.isFirstInGroup || false;
      
      // Convert shotType to frameType
      const frameType = shot.shotType === 'image-ref' ? '1F' : shot.shotType === 'start-end' ? '2F' : '1F';
      
      // Determine what needs to be inherited (explicit inheritance)
      // Trust continuity groups: if isLinkedToPrevious: true, previous shot is guaranteed to be 2F (validated in Step 3)
      let inheritedPrompts: {
        imagePrompt?: string;      // For 1F: inherit single image prompt from previous
        startFramePrompt?: string; // For 2F: inherit start from previous end
      } | undefined = undefined;
      
      if (isLinkedToPrevious && continuityInfo?.previousShotId) {
        // Inheritance is determined by continuity groups - if linked, it's inherited (period)
        // Trust continuity groups: previous shot is guaranteed to be 2F (validated in Step 3)
        
        // Try to get previous shot's prompts if they exist (for prompt inheritance)
        const previousPrompts = step4Data?.shots?.[continuityInfo.previousShotId] || 
                               generatedPromptsMap.get(continuityInfo.previousShotId);
        
        const hasActualPrompts = previousPrompts && previousPrompts.imagePrompts && previousPrompts.imagePrompts.end;
        
        if (frameType === '1F') {
          // 1F: Inherit image prompt from previous 2F's end frame
          inheritedPrompts = {
            imagePrompt: (hasActualPrompts ? previousPrompts.imagePrompts.end : 'PENDING_INHERITANCE') as string,
          };
          console.log(`[character-vlog:routes] Shot ${shot.id} (1F linked): Will inherit image prompt from ${continuityInfo.previousShotId} end ${hasActualPrompts ? '(actual)' : '(pending)'}`);
        } else if (frameType === '2F') {
          // 2F: Inherit start from previous 2F's end
          // AI will only generate: end frame + video (NOT start frame)
          inheritedPrompts = {
            startFramePrompt: (hasActualPrompts ? previousPrompts.imagePrompts.end : 'PENDING_INHERITANCE') as string,
          };
          console.log(`[character-vlog:routes] Shot ${shot.id} (2F linked): Will inherit start from ${continuityInfo.previousShotId} end ${hasActualPrompts ? '(actual)' : '(pending)'}`);
        }
      }
      // If not linked, inheritedPrompts remains undefined - AI will generate all prompts
      
      // Legacy: Build previousShotOutput for backward compatibility (regeneration scenarios)
      // Trust continuity groups: if linked, previous shot is 2F
      let previousShotOutput: any = undefined;
      if (isLinkedToPrevious && continuityInfo?.previousShotId && step4Data?.shots?.[continuityInfo.previousShotId]) {
        const previousPrompts = step4Data.shots[continuityInfo.previousShotId];
        // Previous shot is guaranteed to be 2F if linked, so check for end frame
        if (previousPrompts.imagePrompts.end) {
          previousShotOutput = {
            lastFrameDescription: previousPrompts.imagePrompts.end,
            visualContinuityNotes: previousPrompts.visualContinuityNotes || '',
            imagePrompts: {
              end: previousPrompts.imagePrompts.end,
            },
          };
        }
      }
      
      return {
        shotId: shot.id,
        shotDescription: shot.description || '',
        frameType: frameType as '1F' | '2F',
        cameraShot: shot.cameraMovement || shot.cameraShot || 'Medium Shot',
        shotDuration: shot.duration || 5,
        referenceTags: shot.referenceTags || [],
        isFirstInGroup,
        isLinkedToPrevious,
        inheritedPrompts, // NEW: Explicit inheritance info
        previousShotOutput, // Legacy: kept for backward compatibility
      };
    });

    // Build character anchors from step2Data
    const characterReferences = buildCharacterAnchors(
      (step2Data.characters || []).map((char: any) => ({
        id: char.id,
        name: char.name,
        appearance: char.appearance || null,
        personality: char.personality || null,
        imageUrl: char.imageUrl || null,
      }))
    );

    // Build location anchors from step2Data
    const locationReferences = buildLocationAnchors(
      (step2Data.locations || []).map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        description: loc.description || null,
        details: loc.details || null,
        imageUrl: loc.imageUrl || null,
      }))
    );

    // Build style anchor from step2Data
    const styleReference = buildStyleAnchor({
      artStyle: step2Data.artStyle || 'cinematic',
      worldDescription: step2Data.worldDescription || '',
      artStyleImageUrl: step2Data.styleReferenceImageUrl || undefined,
    });

    console.log('[character-vlog:routes] Built anchors:', {
      characterCount: characterReferences.length,
      locationCount: locationReferences.length,
      styleAnchorLength: styleReference.anchor.length,
    });

    // Build agent input with anchors
    const agentInput: UnifiedPromptProducerSceneInput = {
      sceneId,
      sceneName: scene.name || scene.title || `Scene ${scene.sceneNumber || 1}`,
      shots: shotsForAgent,
      characterReferences,
      locationReferences,
      styleReference,
      aspectRatio: step1Data.aspectRatio || '16:9',
    };

    // Call agent
    const workspaceId = req.headers['x-workspace-id'] as string | undefined;
    
    console.log('[character-vlog:routes] Calling generatePromptsForScene agent...', {
      shotCount: agentInput.shots.length,
      characterReferencesCount: agentInput.characterReferences.length,
      locationReferencesCount: agentInput.locationReferences.length,
      linkedShotsCount: agentInput.shots.filter((s: any) => s.isLinkedToPrevious).length,
      firstInGroupCount: agentInput.shots.filter((s: any) => s.isFirstInGroup).length,
      shotsWithInheritance: agentInput.shots.filter((s: any) => s.inheritedPrompts).length,
    });

    const result = await generatePromptsForScene(agentInput, userId, workspaceId);

    // Step 5: Merge inherited prompts back into results (explicit inheritance)
    const finalShots = result.shots.map((generatedShot: any) => {
      const shotInput = shotsForAgent.find((s: any) => s.shotId === generatedShot.shotId);
      const continuityInfo = continuityMap.get(generatedShot.shotId);
      
      // Determine if this shot has inherited prompt (for locking in UI)
      const isInherited = !!(shotInput?.inheritedPrompts && continuityInfo?.previousShotId);
      
      if (shotInput?.inheritedPrompts && continuityInfo?.previousShotId) {
        // Get previous shot's prompts for inheritance
        const previousPrompts = step4Data?.shots?.[continuityInfo.previousShotId] || 
                               generatedPromptsMap.get(continuityInfo.previousShotId);
        
        const frameType = shotInput.frameType;
        const inheritedImagePrompt = shotInput.inheritedPrompts.imagePrompt;
        const inheritedStartFramePrompt = shotInput.inheritedPrompts.startFramePrompt;
        
        // Check if this is PENDING_INHERITANCE (first generation, previous shot not in database yet)
        const isPendingInheritance = 
          inheritedImagePrompt === 'PENDING_INHERITANCE' || 
          inheritedStartFramePrompt === 'PENDING_INHERITANCE';
        
        // If pending, check if previous shot was just generated in this batch
        let actualPreviousPrompts = previousPrompts;
        if (isPendingInheritance && !previousPrompts && continuityInfo?.previousShotId) {
          // Check generatedPromptsMap for shots generated in this batch
          const batchPreviousPrompts = generatedPromptsMap.get(continuityInfo.previousShotId);
          if (batchPreviousPrompts && batchPreviousPrompts.imagePrompts && batchPreviousPrompts.imagePrompts.end) {
            actualPreviousPrompts = batchPreviousPrompts as any; // Cast to match expected type
            console.log(`[character-vlog:routes] Found previous shot ${continuityInfo.previousShotId} in current batch for inheritance`);
          }
        }
        
        if (actualPreviousPrompts && actualPreviousPrompts.imagePrompts && actualPreviousPrompts.imagePrompts.end) {
          // Previous shot has prompts (from database or current batch) - perform actual inheritance
          if (frameType === '1F') {
            // 1F: Inherit image prompt, only generate video
            console.log(`[character-vlog:routes] Merging inheritance for shot ${generatedShot.shotId} (1F): inheriting image prompt`);
            const merged = {
              ...generatedShot,
              imagePrompts: {
                single: actualPreviousPrompts.imagePrompts.end,
                start: null,
                end: null,
              },
              isInherited: true,  // Mark as inherited for UI locking
              // videoPrompt is already generated by AI
            };
            // Store for next shot's inheritance
            generatedPromptsMap.set(generatedShot.shotId, {
              imagePrompts: merged.imagePrompts,
            });
            return merged;
          } else if (frameType === '2F') {
            // 2F: Inherit start from previous end, only generate end + video
            console.log(`[character-vlog:routes] Merging inheritance for shot ${generatedShot.shotId} (2F): inheriting start from previous end`);
            const merged = {
              ...generatedShot,
              imagePrompts: {
                single: null,
                start: actualPreviousPrompts.imagePrompts.end,
                end: generatedShot.imagePrompts.end, // AI generated this
              },
              isInherited: true,  // Mark as inherited for UI locking
              // videoPrompt is already generated by AI
            };
            // Store for next shot's inheritance
            generatedPromptsMap.set(generatedShot.shotId, {
              imagePrompts: merged.imagePrompts,
            });
            return merged;
          }
        } else if (isPendingInheritance) {
          // Previous shot doesn't have prompts yet (not in database or current batch)
          // Use AI-generated prompts as placeholder, but mark as inherited for UI locking
          console.log(`[character-vlog:routes] Shot ${generatedShot.shotId} marked for pending inheritance - using AI prompts as placeholder (will sync via shared frame logic)`);
          const merged = {
            ...generatedShot,
            isInherited: true,  // Mark as inherited so UI will lock the start frame
          };
          // Store for next shot's inheritance
          if (generatedShot.imagePrompts) {
            generatedPromptsMap.set(generatedShot.shotId, {
              imagePrompts: generatedShot.imagePrompts,
            });
          }
          return merged;
        }
      }
      
      // No inheritance needed, return as-is (with isInherited flag)
      // But still store for potential next shot inheritance
      if (generatedShot.imagePrompts) {
        generatedPromptsMap.set(generatedShot.shotId, {
          imagePrompts: generatedShot.imagePrompts,
        });
      }
      return {
        ...generatedShot,
        isInherited: false,  // Not inherited
      };
    });

    console.log('[character-vlog:routes] ----------------------------------------');
    console.log('[character-vlog:routes] PROMPTS GENERATED SUCCESSFULLY');
    console.log('[character-vlog:routes] ----------------------------------------');
    console.log('[character-vlog:routes] Prompts generated successfully:', {
      videoId,
      sceneId,
      shotCount: finalShots.length,
      cost: result.cost,
      shotsWithInheritance: finalShots.filter((shot: any, index: number) => {
        const shotInput = shotsForAgent[index];
        return shotInput?.inheritedPrompts;
      }).length,
    });

    // Store results in step4Data (including negativePrompt and isInherited)
    const existingStep4Data = (video.step4Data as Step4Data) || { shots: {} };
    const updatedStep4Data: Step4Data = {
      shots: {
        ...existingStep4Data.shots,
        ...Object.fromEntries(
          finalShots.map((shot) => [
            shot.shotId,
            {
              imagePrompts: shot.imagePrompts,
              videoPrompt: shot.videoPrompt,
              visualContinuityNotes: shot.visualContinuityNotes,
              negativePrompt: shot.negativePrompt,
              isInherited: shot.isInherited || false,  // Save inheritance flag
            },
          ])
        ),
      },
    };

    await storage.updateVideo(videoId, {
      step4Data: updatedStep4Data,
    });

    console.log('[character-vlog:routes] Stored prompts in step4Data:', {
      videoId,
      sceneId,
      storedShots: finalShots.length,
    });

    res.json({
      shots: finalShots,
      cost: result.cost,
    });
  } catch (error) {
    console.error('[character-vlog:routes] Storyboard prompt generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to generate prompts',
      details: errorMessage,
    });
  }
});

/**
 * POST /api/character-vlog/shots/generate-image
 * Generate storyboard frame images for a shot
 * 
 * Supports per-frame generation:
 * - frame: "start" | "end" | "image" (required)
 * 
 * Handles:
 * - Inherited start frame validation (rejects generation if inherited)
 * - Shared frame optimization (generates once for continuous shots)
 * - Auto-sync (updates next shot's start frame when end frame is generated)
 */
router.post('/shots/generate-image', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { 
      shotId, 
      videoId, 
      versionId,
      frame, // REQUIRED: "start" | "end" | "image"
    } = req.body;
    const workspaceId = req.headers["x-workspace-id"] as string | undefined;

    console.log('█████████████████████████████████████████████████████████████████████');
    console.log('█ IMAGE GENERATION REQUEST RECEIVED');
    console.log('█████████████████████████████████████████████████████████████████████');
    console.log(`Shot ID: ${shotId}`);
    console.log(`Video ID: ${videoId}`);
    console.log(`Frame: ${frame}`);
    console.log(`Version ID: ${versionId || 'NEW'}`);
    console.log('█████████████████████████████████████████████████████████████████████');

    if (!shotId || !videoId) {
      return res.status(400).json({ error: 'shotId and videoId are required' });
    }

    if (!frame || !['start', 'end', 'image'].includes(frame)) {
      return res.status(400).json({ error: 'frame parameter is required and must be "start", "end", or "image"' });
    }

    console.log('[character-vlog:routes] Generating storyboard image (Agent 4.2):', {
      shotId,
      videoId,
      versionId,
      frame,
      userId,
      workspaceId,
    });

    // Fetch video from database
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get step data
    const step1Data = (video.step1Data as Step1Data) || {};
    const step2Data = (video.step2Data as Step2Data) || {};
    const step3Data = (video.step3Data as Step3Data) || {};
    let step4Data = (video.step4Data as any) || { shots: {}, shotVersions: {} };

    // Get aspect ratio and narrative mode
    const aspectRatio = step1Data.aspectRatio || '16:9';
    const referenceMode = step1Data.referenceMode || 'Image Reference';
    const referenceModeCode = convertReferenceModeToCode(referenceMode);
    const narrativeMode: "image-reference" | "start-end" = referenceModeCode === '1F' ? 'image-reference' : 'start-end';

    // Find shot in step3Data
    const allShots: any[] = Object.values(step3Data.shots || {}).flat();
    const foundShot = allShots.find((s: any) => s.id === shotId);
    if (!foundShot) {
      return res.status(404).json({ error: 'Shot not found' });
    }

    // Find scene
    const scenes = step3Data.scenes || [];
    const foundScene = scenes.find((s: any) => s.id === foundShot.sceneId);
    if (!foundScene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    // Get image model (shot-level or step1Data)
    const imageModel = (foundShot as any).imageModel || step1Data.imageModel || 'nano-banana';

    // Get prompts for this shot from step4Data
    const shotPrompts = step4Data.shots?.[shotId];
    if (!shotPrompts) {
      return res.status(400).json({ error: 'Prompts not found for this shot. Please generate prompts first.' });
    }

    // Get current shot's version
    // Always use latest version (like ambient mode) to avoid version ID mismatch issues
    const shotVersions = step4Data.shotVersions || {};
    const currentShotVersions = shotVersions[shotId] || [];
    const currentVersion = currentShotVersions.length > 0 
      ? currentShotVersions[currentShotVersions.length - 1]
      : null;
    
    // Log for debugging (versionId from client is not used)
    if (versionId) {
      console.log('[character-vlog:routes] Version lookup (ignoring client versionId):', {
        shotId,
        clientProvidedVersionId: versionId,
        serverLatestVersionId: currentVersion?.id,
        versionCount: currentShotVersions.length,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // CONTINUITY GROUP DETECTION AND VALIDATION
    // ═══════════════════════════════════════════════════════════════════════════════

    const continuityGroups = step3Data.continuityGroups?.[foundScene.id] || [];
    const approvedGroups = continuityGroups.filter((g: any) => (g.status || 'approved') === 'approved');
    
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('[CONTINUITY CHECK]');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`Shot ID: ${shotId}`);
    console.log(`Scene ID: ${foundScene.id}`);
    console.log(`Total continuity groups in scene: ${continuityGroups.length}`);
    console.log(`Approved groups: ${approvedGroups.length}`);
    approvedGroups.forEach((g: any, i: number) => {
      console.log(`  Group ${i + 1}: ${g.shotIds?.join(' → ') || 'no shots'}`);
    });
    
    let isInContinuityGroup = false;
    let isConnectedToPrevious = false;
    let previousShotId: string | null = null;
    let previousVersion: any = null;
    let nextShotId: string | null = null;
    let nextShotStartPrompt: string | null = null;

    // Find if shot is in a continuity group
    for (const group of approvedGroups) {
      if (group.shotIds && group.shotIds.includes(shotId)) {
        isInContinuityGroup = true;
        const shotIndex = group.shotIds.indexOf(shotId);
        const isFirstInGroup = shotIndex === 0;
        isConnectedToPrevious = shotIndex > 0;

        console.log(`✓ Shot IS in continuity group:`);
        console.log(`  - Group ID: ${group.id}`);
        console.log(`  - Position in group: ${shotIndex + 1} of ${group.shotIds.length}`);
        console.log(`  - Is first in group: ${isFirstInGroup}`);
        console.log(`  - Is connected to previous: ${isConnectedToPrevious}`);

        // Get previous shot info
        if (isConnectedToPrevious) {
          previousShotId = group.shotIds[shotIndex - 1];
          console.log(`  - Previous shot ID: ${previousShotId}`);
          if (previousShotId) {
            const previousShotVersions = shotVersions[previousShotId] || [];
            previousVersion = previousShotVersions.length > 0 
              ? previousShotVersions[previousShotVersions.length - 1] 
              : null;
            console.log(`  - Has previous version: ${!!previousVersion}`);
          }
        }

        // Get next shot info (for shared frame optimization)
        if (shotIndex < group.shotIds.length - 1) {
          nextShotId = group.shotIds[shotIndex + 1];
          console.log(`  - Next shot ID: ${nextShotId}`);
          if (nextShotId) {
            const nextShotPrompts = step4Data.shots?.[nextShotId];
            if (nextShotPrompts && narrativeMode === 'start-end') {
              nextShotStartPrompt = nextShotPrompts.imagePrompts?.start || null;
              console.log(`  - Next shot has start prompt: ${!!nextShotStartPrompt}`);
            }
          }
        } else {
          console.log(`  - This is the LAST shot in the group (no next shot)`);
        }

        break;
      }
    }
    
    if (!isInContinuityGroup) {
      console.log(`✗ Shot is NOT in any continuity group (standalone shot)`);
      console.log(`  - nextShotId will remain NULL`);
      console.log(`  - Shared frame optimization will NOT apply`);
    }
    console.log('═══════════════════════════════════════════════════════════════════');

    // ═══════════════════════════════════════════════════════════════════════════════
    // VALIDATION: Inherited Start Frame Lock
    // ═══════════════════════════════════════════════════════════════════════════════

    if (frame === 'start' && narrativeMode === 'start-end') {
      // Check if start frame is inherited (connected to previous shot)
      if (isConnectedToPrevious && previousVersion) {
        // Start frame is inherited - reject generation
        return res.status(400).json({ 
          error: 'Start frame is inherited from previous shot and cannot be generated independently. It will auto-sync when the previous shot\'s end frame is generated.' 
        });
      }

      // Check if start frame prompt is null (inherited)
      if (!shotPrompts.imagePrompts?.start || shotPrompts.imagePrompts.start.trim() === '') {
        // This shouldn't happen if prompts were generated correctly, but check anyway
        if (isConnectedToPrevious) {
          return res.status(400).json({ 
            error: 'Start frame is inherited from previous shot and cannot be generated independently.' 
          });
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // COLLECT REFERENCE IMAGES
    // ═══════════════════════════════════════════════════════════════════════════════

    const referenceImages: string[] = [];

    // Extract character names from prompts (already resolved, e.g., "@Alex Chen")
    const promptText = frame === 'image' 
      ? (shotPrompts.imagePrompts?.single || '')
      : frame === 'start'
        ? (shotPrompts.imagePrompts?.start || '')
        : (shotPrompts.imagePrompts?.end || '');

    // Extract @mentions from prompt
    const mentionRegex = /@([A-Z][A-Za-z0-9]*(?:\s+[A-Z][A-Za-z0-9]*)*)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(promptText)) !== null) {
      mentions.push(match[1]); // Character or location name without @
    }

    // Remove duplicate mentions (same character/location mentioned multiple times)
    const uniqueMentions = [...new Set(mentions)];
    
    console.log('[character-vlog:routes] Mentions found in prompt:', {
      totalMentions: mentions.length,
      uniqueMentions: uniqueMentions.length,
      mentions: uniqueMentions,
    });

    // Character reference images (using unique mentions only)
    const characters = step2Data.characters || [];
    for (const mention of uniqueMentions) {
      const character = characters.find((c: any) => c.name === mention);
      if (character?.imageUrl) {
        referenceImages.push(character.imageUrl);
        console.log(`  + Added character reference: ${mention}`);
      }
    }

    // Location reference images (using unique mentions only)
    const locations = step2Data.locations || [];
    for (const mention of uniqueMentions) {
      const location = locations.find((l: any) => l.name === mention);
      if (location?.imageUrl) {
        referenceImages.push(location.imageUrl);
        console.log(`  + Added location reference: ${mention}`);
      }
    }

    // Style reference image
    if (step2Data.styleReferenceImageUrl) {
      referenceImages.push(step2Data.styleReferenceImageUrl);
    }

    // For end frame generation: use current shot's start frame as reference (for visual consistency)
    if (frame === 'end' && narrativeMode === 'start-end' && currentVersion?.startFrameUrl) {
      referenceImages.push(currentVersion.startFrameUrl);
      console.log('[character-vlog:routes] Added current shot start frame as reference for end frame:', currentVersion.startFrameUrl);
    }
    
    // Previous shot's frame (for continuity) - only add if NOT already using current shot's start
    if (isConnectedToPrevious && previousVersion && frame !== 'end') {
      if (narrativeMode === 'image-reference' && previousVersion.imageUrl) {
        referenceImages.push(previousVersion.imageUrl);
      } else if (narrativeMode === 'start-end') {
        const previousFrameUrl = previousVersion.endFrameUrl || previousVersion.startFrameUrl || null;
        if (previousFrameUrl) {
          referenceImages.push(previousFrameUrl);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SHARED FRAME OPTIMIZATION CHECK
    // ═══════════════════════════════════════════════════════════════════════════════

    let isSharedFrame = false;
    if (frame === 'end' && narrativeMode === 'start-end' && nextShotId) {
      // Check if next shot is continuous and has inherited prompt (isInherited flag)
      const nextShotPromptData = step4Data.shots?.[nextShotId];
      const currentEndPrompt = shotPrompts.imagePrompts?.end || '';
      
      console.log('[character-vlog:routes] Checking shared frame eligibility:', {
        currentShotId: shotId,
        nextShotId,
        hasNextShotPromptData: !!nextShotPromptData,
        nextShotIsInherited: nextShotPromptData?.isInherited,
        hasNextShotStartPrompt: !!nextShotStartPrompt,
        promptsMatch: currentEndPrompt.trim() === (nextShotStartPrompt || '').trim(),
        isInContinuityGroup,
      });
      
      // Only treat as shared frame if:
      // 1. Next shot is marked as inherited (prompt was inherited from current shot's end)
      // 2. Prompts are exactly the same (validation)
      if (nextShotPromptData?.isInherited && 
          nextShotStartPrompt && 
          currentEndPrompt.trim() === nextShotStartPrompt.trim()) {
        isSharedFrame = true;
        console.log('[character-vlog:routes] ✓ SHARED FRAME ENABLED - Next shot will use this end frame as start:', {
          currentShotId: shotId,
          nextShotId,
          nextShotIsInherited: nextShotPromptData.isInherited,
          prompt: currentEndPrompt.substring(0, 50) + '...',
        });
      } else {
        console.log('[character-vlog:routes] ✗ SHARED FRAME DISABLED - Conditions not met');
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // VALIDATE REFERENCE IMAGES (Runware requires 1-8 images)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    // Remove duplicates
    const uniqueReferenceImages = [...new Set(referenceImages)];
    
    // Ensure we have at least 1 and at most 8 reference images
    if (uniqueReferenceImages.length === 0) {
      console.warn('[character-vlog:routes] No reference images found, this may cause generation issues');
      // Note: Some models might still work without reference images
    } else if (uniqueReferenceImages.length > 8) {
      console.warn('[character-vlog:routes] Too many reference images, limiting to first 8');
      uniqueReferenceImages.splice(8);
    }
    
    console.log('[character-vlog:routes] Reference images for generation:', {
      shotId,
      frame,
      count: uniqueReferenceImages.length,
      images: uniqueReferenceImages.map(url => url.substring(0, 50) + '...'),
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // BUILD AGENT INPUT
    // ═══════════════════════════════════════════════════════════════════════════════

    const agentInput = {
      shotId,
      videoId,
      narrativeMode: narrativeMode as "image-reference" | "start-end",
      imagePrompt: frame === 'image' ? (shotPrompts.imagePrompts?.single || null) : null,
      startFramePrompt: frame === 'start' ? (shotPrompts.imagePrompts?.start || null) : null,
      endFramePrompt: frame === 'end' ? (shotPrompts.imagePrompts?.end || null) : null,
      negativePrompt: shotPrompts.negativePrompt,
      referenceImages: uniqueReferenceImages,
      aspectRatio,
      imageModel,
      frame: frame as "start" | "end" | "image",
      isConnectedToPrevious,
      previousEndFrameUrl: previousVersion?.endFrameUrl || null,
      nextShotId: isSharedFrame ? nextShotId : null,
      nextShotStartPrompt: isSharedFrame ? nextShotStartPrompt : null,
      isSharedFrame,
    };

    // ═══════════════════════════════════════════════════════════════════════════════
    // CALL AGENT 4.2
    // ═══════════════════════════════════════════════════════════════════════════════

    const result = await generateStoryboardImage(
      agentInput,
      userId,
      workspaceId
    );

    if (result.error) {
      return res.status(500).json({ 
        error: result.error,
        details: 'Image generation failed'
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SAVE GENERATED IMAGES TO STEP4DATA
    // ═══════════════════════════════════════════════════════════════════════════════

    // Initialize shotVersions if needed
    if (!step4Data.shotVersions) {
      step4Data.shotVersions = {};
    }
    if (!shotVersions[shotId]) {
      shotVersions[shotId] = [];
    }

    const existingVersions = shotVersions[shotId];
    let newVersionId: string;
    let versionNumber: number;
    let newVersion: any;

    console.log(`[character-vlog:routes] Version management decision:`, {
      shotId,
      frame,
      providedVersionId: versionId,
      hasCurrentVersion: !!currentVersion,
      existingVersionsCount: existingVersions.length,
      currentVersionId: currentVersion?.id,
      willUpdate: !!currentVersion,
      willCreate: !currentVersion,
    });

    if (currentVersion) {
      // Update existing version (using ambient mode approach)
      newVersionId = currentVersion.id;  // Always use the actual version ID from database
      versionNumber = currentVersion.versionNumber || 1;
      
      console.log(`[character-vlog:routes] ✓ UPDATING existing version ${newVersionId} with ${frame} frame data`);
      
      const updatedImageUrl = result.imageUrl !== null && result.imageUrl !== undefined
        ? result.imageUrl
        : currentVersion.imageUrl;

      const updatedStartFrameUrl = result.startFrameUrl !== null && result.startFrameUrl !== undefined
        ? result.startFrameUrl
        : currentVersion.startFrameUrl;

      const updatedEndFrameUrl = result.endFrameUrl !== null && result.endFrameUrl !== undefined
        ? result.endFrameUrl
        : currentVersion.endFrameUrl;

      newVersion = {
        ...currentVersion,
        // Update image URLs
        imageUrl: updatedImageUrl,
        startFrameUrl: updatedStartFrameUrl,
        endFrameUrl: updatedEndFrameUrl,
        // Ensure prompts are preserved/updated from step4Data
        imagePrompt: shotPrompts.imagePrompts?.single || currentVersion.imagePrompt || null,
        startFramePrompt: shotPrompts.imagePrompts?.start || currentVersion.startFramePrompt || null,
        endFramePrompt: shotPrompts.imagePrompts?.end || currentVersion.endFramePrompt || null,
        videoPrompt: shotPrompts.videoPrompt || currentVersion.videoPrompt || null,
        negativePrompt: shotPrompts.negativePrompt || currentVersion.negativePrompt || null,
        status: currentVersion.status || 'pending',
        needsRerender: currentVersion.needsRerender || false,
        updatedAt: new Date().toISOString(),
      };

      // Update using .map() like ambient mode (more reliable than findIndex)
      shotVersions[shotId] = existingVersions.map((v: any) =>
        v.id === currentVersion.id ? newVersion : v
      );
    } else {
      // Create new version - include prompts from step4Data
      console.log(`[character-vlog:routes] ✓ CREATING new version for shot ${shotId} with ${frame} frame data`);
      newVersionId = `version-${shotId}-${Date.now()}`;
      versionNumber = 1;

      newVersion = {
        id: newVersionId,
        shotId,
        versionNumber,
        // Image URLs from generation
        imageUrl: result.imageUrl,
        startFrameUrl: result.startFrameUrl,
        endFrameUrl: result.endFrameUrl,
        // Include prompts from step4Data.shots for persistence
        imagePrompt: shotPrompts.imagePrompts?.single || null,
        startFramePrompt: shotPrompts.imagePrompts?.start || null,
        endFramePrompt: shotPrompts.imagePrompts?.end || null,
        videoPrompt: shotPrompts.videoPrompt || null,
        negativePrompt: shotPrompts.negativePrompt || null,
        status: 'pending',
        needsRerender: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Initialize array with new version (like ambient mode)
      shotVersions[shotId] = [newVersion];
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SHARED FRAME OPTIMIZATION: Auto-sync next shot's start frame
    // ═══════════════════════════════════════════════════════════════════════════════

    if (isSharedFrame && nextShotId && result.endFrameUrl) {
      // Initialize next shot's versions if needed
      if (!shotVersions[nextShotId]) {
        shotVersions[nextShotId] = [];
      }

      const nextShotVersions = shotVersions[nextShotId];
      let nextVersion = nextShotVersions.length > 0 
        ? nextShotVersions[nextShotVersions.length - 1]
        : null;

      if (nextVersion) {
        // Update existing version - preserve all existing data
        nextVersion = {
          ...nextVersion,
          startFrameUrl: result.endFrameUrl, // Same URL as current shot's end frame
          updatedAt: new Date().toISOString(),
        };
        // Update in array
        const versionIndex = nextShotVersions.findIndex((v: any) => v.id === nextVersion.id);
        if (versionIndex >= 0) {
          nextShotVersions[versionIndex] = nextVersion;
        }
      } else {
        // Create new version for next shot - include prompts from step4Data
        const nextShotPrompts = step4Data.shots?.[nextShotId];
        const nextVersionId = `version-${nextShotId}-${Date.now()}`;
        nextVersion = {
          id: nextVersionId,
          shotId: nextShotId,
          versionNumber: 1,
          imageUrl: null,
          startFrameUrl: result.endFrameUrl, // Same URL as current shot's end frame
          endFrameUrl: null,
          // Include prompts from step4Data for next shot
          imagePrompt: nextShotPrompts?.imagePrompts?.single || null,
          startFramePrompt: nextShotPrompts?.imagePrompts?.start || null,
          endFramePrompt: nextShotPrompts?.imagePrompts?.end || null,
          videoPrompt: nextShotPrompts?.videoPrompt || null,
          negativePrompt: nextShotPrompts?.negativePrompt || null,
          status: 'pending',
          needsRerender: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        nextShotVersions.push(nextVersion);
      }

      shotVersions[nextShotId] = nextShotVersions;

      console.log('[character-vlog:routes] Shared frame saved to both shots:', {
        currentShotId: shotId,
        nextShotId,
        sharedUrl: result.endFrameUrl.substring(0, 50) + '...',
      });
    }

    // Update step4Data
    const updatedStep4Data = {
      ...step4Data,
      shotVersions,
    };

    // Save to database
    await storage.updateVideo(videoId, {
      step4Data: updatedStep4Data,
    });

    // Log what was saved - terminal logging
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('[IMAGE SAVED TO DATABASE]');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`Shot ID: ${shotId}`);
    console.log(`Frame: ${frame}`);
    console.log(`Version ID: ${newVersionId}`);
    console.log('-------------------------------------------------------------------');
    console.log('Saved Version Data:');
    console.log(`  - Image URL: ${newVersion.imageUrl ? '✓ SAVED' : '✗ NULL'}`);
    console.log(`  - Start Frame URL: ${newVersion.startFrameUrl ? '✓ SAVED' : '✗ NULL'}`);
    console.log(`  - End Frame URL: ${newVersion.endFrameUrl ? '✓ SAVED' : '✗ NULL'}`);
    console.log(`  - Image Prompt: ${newVersion.imagePrompt ? '✓ SAVED' : '✗ NULL'}`);
    console.log(`  - Start Frame Prompt: ${newVersion.startFramePrompt ? '✓ SAVED' : '✗ NULL'}`);
    console.log(`  - End Frame Prompt: ${newVersion.endFramePrompt ? '✓ SAVED' : '✗ NULL'}`);
    console.log(`  - Video Prompt: ${newVersion.videoPrompt ? '✓ SAVED' : '✗ NULL'}`);
    console.log('-------------------------------------------------------------------');
    console.log(`Total Shot Versions in DB: ${Object.keys(updatedStep4Data.shotVersions || {}).length}`);
    if (isSharedFrame && nextShotId) {
      console.log(`Shared frame synced to next shot: ${nextShotId}`);
    }
    console.log('═══════════════════════════════════════════════════════════════════');

    console.log('[character-vlog:routes] Image generation completed:', {
      shotId,
      frame,
      hasImageUrl: !!result.imageUrl,
      hasStartFrame: !!result.startFrameUrl,
      hasEndFrame: !!result.endFrameUrl,
      isSharedFrame,
      nextShotId: isSharedFrame ? nextShotId : null,
      cost: result.cost,
    });

    res.json({
      success: true,
      imageUrl: result.imageUrl,
      startFrameUrl: result.startFrameUrl,
      endFrameUrl: result.endFrameUrl,
      shotVersionId: newVersionId,
      version: newVersion,
      cost: result.cost,
      isSharedFrame,
      nextShotId: isSharedFrame ? nextShotId : null,
    });
  } catch (error) {
    console.error('[character-vlog:routes] Image generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to generate image',
      details: errorMessage,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO GENERATION ROUTES - AGENT 4.3
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/character-vlog/videos/:id/shots/:shotId/generate-video
 * Generate video for a single shot (Agent 4.3)
 * 
 * Workflow:
 * 1. Validate shot has generated images (from Agent 4.2)
 * 2. Validate video prompt exists (from Agent 4.1)
 * 3. Determine frameType (1F or 2F) from step1Data.referenceMode
 * 4. Call Agent 4.3 with appropriate frame images
 * 5. Save videoUrl to shotVersions
 */
router.post('/videos/:id/shots/:shotId/generate-video', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId, shotId } = req.params;
    const workspaceId = req.headers['x-workspace-id'] as string | undefined;

    console.log('[character-vlog:routes] Single shot video generation:', { videoId, shotId });

    // ═══════════════════════════════════════════════════════════════════════════
    // FETCH VIDEO DATA
    // ═══════════════════════════════════════════════════════════════════════════

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = (video.step1Data as Step1Data) || {};
    const step3Data = (video.step3Data as Step3Data) || {};
    let step4Data = (video.step4Data as any) || { shots: {}, shotVersions: {} };

    // ═══════════════════════════════════════════════════════════════════════════
    // FIND SHOT AND VALIDATE
    // ═══════════════════════════════════════════════════════════════════════════

    // step3Data.shots: Record<sceneId, Shot[]> - contains shot objects
    // step4Data.shots: Record<shotId, prompts> - contains prompts (different structure!)
    const step3Shots = step3Data?.shots || {};
    const step4Scenes = step4Data.scenes || step3Data?.scenes || [];
    
    let shot: any = null;
    let scene: any = null;
    let sceneId: string = '';
    
    // Find shot in step3Data.shots (keyed by sceneId)
    for (const [sId, sceneShots] of Object.entries(step3Shots)) {
      // Ensure sceneShots is an array
      if (!Array.isArray(sceneShots)) {
        console.warn(`[character-vlog:routes] Scene ${sId} shots is not an array:`, typeof sceneShots);
        continue;
      }
      
      const foundShot = sceneShots.find((s: any) => s.id === shotId);
      if (foundShot) {
        shot = foundShot;
        sceneId = sId;
        scene = step4Scenes.find((s: any) => s.id === sId);
        break;
      }
    }

    if (!shot) {
      console.error('[character-vlog:routes] Shot not found:', {
        shotId,
        availableScenes: Object.keys(step3Shots),
        availableShots: Object.values(step3Shots).flat().map((s: any) => s.id),
      });
      return res.status(404).json({ error: 'Shot not found' });
    }

    // Get latest version for this shot
    const shotVersions = step4Data.shotVersions || {};
    const versions = shotVersions[shotId];
    if (!versions || versions.length === 0) {
      return res.status(400).json({ error: 'No version found for this shot. Generate images first.' });
    }
    
    const latestVersion = versions[versions.length - 1];

    // ═══════════════════════════════════════════════════════════════════════════
    // VALIDATE PREREQUISITES
    // ═══════════════════════════════════════════════════════════════════════════

    // Check video prompt exists
    const shotPrompts = step4Data.shots?.[shotId];
    if (!shotPrompts?.videoPrompt) {
      return res.status(400).json({ error: 'No video prompt found. Generate prompts first (Agent 4.1).' });
    }

    // Determine frame type from reference mode
    const referenceMode = step1Data.referenceMode; // 'Image Reference', 'Start/End', 'AI Auto'
    const frameType: '1F' | '2F' = referenceMode === 'Image Reference' ? '1F' : '2F';

    // Validate images exist based on frame type
    if (frameType === '1F') {
      if (!latestVersion.imageUrl) {
        return res.status(400).json({ error: '1F mode requires image. Generate storyboard image first (Agent 4.2).' });
      }
    } else {
      if (!latestVersion.startFrameUrl) {
        return res.status(400).json({ error: '2F mode requires start frame. Generate start frame first (Agent 4.2).' });
      }
      // End frame is optional (model may not support it)
    }

    // Get video model (prioritize shot > scene > step1)
    const videoModel = shot.videoModel || scene?.videoModel || step1Data.videoModel;
    if (!videoModel) {
      return res.status(400).json({ error: 'No video model configured' });
    }

    // Get other settings
    const aspectRatio = step1Data.aspectRatio || '16:9';
    const shotDuration = shot.duration || 5;

    console.log('[character-vlog:routes] Video generation config:', {
      shotId: shotId.substring(0, 30) + '...',
      frameType,
      videoModel,
      aspectRatio,
      shotDuration,
      hasImage: !!latestVersion.imageUrl,
      hasStartFrame: !!latestVersion.startFrameUrl,
      hasEndFrame: !!latestVersion.endFrameUrl,
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // CALL AGENT 4.3
    // ═══════════════════════════════════════════════════════════════════════════

    const agentInput = {
      shotId,
      frameType,
      storyboardImage: latestVersion.imageUrl,
      startFrame: latestVersion.startFrameUrl,
      endFrame: latestVersion.endFrameUrl,
      videoPrompt: shotPrompts.videoPrompt,
      shotDuration,
      videoModel,
      aspectRatio,
    };

    const result = await generateVideo(agentInput, userId, workspaceId);

    // ═══════════════════════════════════════════════════════════════════════════
    // SAVE VIDEO URL TO SHOT VERSION
    // ═══════════════════════════════════════════════════════════════════════════

    if (result.success && result.videoUrl) {
      // Update latest version with video URL
      const updatedVersion = {
        ...latestVersion,
        videoUrl: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl,
        actualDuration: result.actualDuration,
        videoGenerationMetadata: result.metadata,
        status: 'generated' as const,
        updatedAt: new Date().toISOString(),
      };

      // Update in array
      shotVersions[shotId] = versions.map((v: any) =>
        v.id === latestVersion.id ? updatedVersion : v
      );

      // Save to database
      step4Data.shotVersions = shotVersions;
      await storage.updateVideo(videoId, { step4Data });

      console.log('[character-vlog:routes] ✓ Video generated and saved:', {
        shotId: shotId.substring(0, 30) + '...',
        videoUrl: result.videoUrl.substring(0, 60) + '...',
      });

      return res.json({
        success: true,
        videoUrl: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl,
        actualDuration: result.actualDuration,
        metadata: result.metadata,
      });
    } else {
      // Generation failed
      console.error('[character-vlog:routes] Video generation failed:', result.error);
      
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

  } catch (error) {
    console.error('[character-vlog:routes] Video generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to generate video',
      details: errorMessage,
    });
  }
});

/**
 * POST /api/character-vlog/videos/:id/scenes/:sceneId/generate-videos
 * Generate videos for all shots in a scene (Agent 4.3 Batch)
 * 
 * Workflow:
 * 1. Get all shots in scene
 * 2. Filter shots that have images but no videoUrl
 * 3. Call Agent 4.3 for each shot in parallel
 * 4. Save all videoUrls to shotVersions
 */
router.post('/videos/:id/scenes/:sceneId/generate-videos', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: videoId, sceneId } = req.params;
    const workspaceId = req.headers['x-workspace-id'] as string | undefined;

    console.log('[character-vlog:routes] Batch scene video generation:', { videoId, sceneId });

    // ═══════════════════════════════════════════════════════════════════════════
    // FETCH VIDEO DATA
    // ═══════════════════════════════════════════════════════════════════════════

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const step1Data = (video.step1Data as Step1Data) || {};
    const step3Data = (video.step3Data as Step3Data) || {};
    let step4Data = (video.step4Data as any) || { shots: {}, shotVersions: {} };

    // ═══════════════════════════════════════════════════════════════════════════
    // GET SHOTS FOR SCENE
    // ═══════════════════════════════════════════════════════════════════════════

    // step3Data.shots: Record<sceneId, Shot[]> - contains shot objects
    // step4Data.shots: Record<shotId, prompts> - contains prompts (different structure!)
    const step3Shots = step3Data?.shots || {};
    const step4Scenes = step4Data.scenes || step3Data?.scenes || [];
    
    const sceneShots = step3Shots[sceneId];
    
    // Validate sceneShots is an array
    if (!Array.isArray(sceneShots) || sceneShots.length === 0) {
      console.error('[character-vlog:routes] Invalid or empty scene shots:', {
        sceneId,
        isArray: Array.isArray(sceneShots),
        type: typeof sceneShots,
        availableScenes: Object.keys(step3Shots),
      });
      return res.status(404).json({ error: 'No shots found for this scene' });
    }

    const scene = step4Scenes.find((s: any) => s.id === sceneId);

    // Determine frame type from reference mode
    const referenceMode = step1Data.referenceMode;
    const frameType: '1F' | '2F' = referenceMode === 'Image Reference' ? '1F' : '2F';

    // Get video model (prioritize scene > step1)
    const videoModel = scene?.videoModel || step1Data.videoModel;
    if (!videoModel) {
      return res.status(400).json({ error: 'No video model configured' });
    }

    const aspectRatio = step1Data.aspectRatio || '16:9';

    console.log('[character-vlog:routes] Batch config:', {
      sceneId: sceneId.substring(0, 30) + '...',
      shotCount: sceneShots.length,
      frameType,
      videoModel,
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // FILTER SHOTS READY FOR VIDEO GENERATION
    // ═══════════════════════════════════════════════════════════════════════════

    const shotVersions = step4Data.shotVersions || {};
    const shotsToGenerate: any[] = [];

    for (const shot of sceneShots) {
      const shotId = shot.id;
      const versions = shotVersions[shotId];
      
      if (!versions || versions.length === 0) {
        console.log(`[character-vlog:routes] Skipping shot ${shotId}: No versions`);
        continue;
      }

      const latestVersion = versions[versions.length - 1];
      
      // Skip if already has video
      if (latestVersion.videoUrl) {
        console.log(`[character-vlog:routes] Skipping shot ${shotId}: Already has video`);
        continue;
      }

      // Skip if missing images
      if (frameType === '1F' && !latestVersion.imageUrl) {
        console.log(`[character-vlog:routes] Skipping shot ${shotId}: Missing image (1F mode)`);
        continue;
      }
      if (frameType === '2F' && !latestVersion.startFrameUrl) {
        console.log(`[character-vlog:routes] Skipping shot ${shotId}: Missing start frame (2F mode)`);
        continue;
      }

      // Skip if missing video prompt
      const shotPrompts = step4Data.shots?.[shotId];
      if (!shotPrompts?.videoPrompt) {
        console.log(`[character-vlog:routes] Skipping shot ${shotId}: Missing video prompt`);
        continue;
      }

      shotsToGenerate.push({
        shot,
        shotId,
        latestVersion,
        shotPrompts,
      });
    }

    if (shotsToGenerate.length === 0) {
      return res.json({
        success: true,
        message: 'No shots ready for video generation',
        results: [],
      });
    }

    console.log(`[character-vlog:routes] Generating videos for ${shotsToGenerate.length} shots...`);

    // ═══════════════════════════════════════════════════════════════════════════
    // CALL AGENT 4.3 FOR EACH SHOT (PARALLEL)
    // ═══════════════════════════════════════════════════════════════════════════

    const results = await Promise.all(
      shotsToGenerate.map(async ({ shot, shotId, latestVersion, shotPrompts }) => {
        const agentInput = {
          shotId,
          frameType,
          storyboardImage: latestVersion.imageUrl,
          startFrame: latestVersion.startFrameUrl,
          endFrame: latestVersion.endFrameUrl,
          videoPrompt: shotPrompts.videoPrompt,
          shotDuration: shot.duration || 5,
          videoModel: shot.videoModel || videoModel,
          aspectRatio,
        };

        const result = await generateVideo(agentInput, userId, workspaceId);

        return {
          shotId,
          result,
          latestVersion,
        };
      })
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // SAVE ALL VIDEO URLS TO SHOT VERSIONS
    // ═══════════════════════════════════════════════════════════════════════════

    let successCount = 0;
    let failCount = 0;

    for (const { shotId, result, latestVersion } of results) {
      if (result.success && result.videoUrl) {
        const versions = shotVersions[shotId];
        const updatedVersion = {
          ...latestVersion,
          videoUrl: result.videoUrl,
          thumbnailUrl: result.thumbnailUrl,
          actualDuration: result.actualDuration,
          videoGenerationMetadata: result.metadata,
          status: 'generated' as const,
          updatedAt: new Date().toISOString(),
        };

        shotVersions[shotId] = versions.map((v: any) =>
          v.id === latestVersion.id ? updatedVersion : v
        );

        successCount++;
      } else {
        failCount++;
      }
    }

    // Save to database
    step4Data.shotVersions = shotVersions;
    await storage.updateVideo(videoId, { step4Data });

    console.log('[character-vlog:routes] ✓ Batch video generation complete:', {
      total: results.length,
      success: successCount,
      failed: failCount,
    });

    return res.json({
      success: true,
      results: results.map(({ shotId, result }) => ({
        shotId,
        success: result.success,
        videoUrl: result.videoUrl,
        error: result.error,
      })),
      summary: {
        total: results.length,
        success: successCount,
        failed: failCount,
      },
    });

  } catch (error) {
    console.error('[character-vlog:routes] Batch video generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to generate videos',
      details: errorMessage,
    });
  }
});

export default router;

