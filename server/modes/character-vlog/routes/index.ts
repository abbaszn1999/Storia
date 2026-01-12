import { Router } from 'express';
import type { Request, Response } from 'express';
import { storage } from '../../../storage';
import { CHARACTER_VLOG_CONFIG } from '../config';
import { isAuthenticated, getCurrentUserId } from '../../../auth';
import { bunnyStorage, buildVideoModePath } from '../../../storage/bunny-storage';
import { generateScript, analyzeCharacters, analyzeLocations, generateScenes, generateShots } from '../agents';
import type { Step1Data, Step2Data, Step3Data, ReferenceModeCode, ScriptGeneratorInput, CharacterAnalyzerInput, LocationAnalyzerInput, SceneGeneratorInput, ShotGeneratorInput } from '../types';
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
 */
router.get('/videos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const video = await storage.getVideo(id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
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
        isLinkedToPrevious: shot.isLinkedToPrevious || false,
        referenceTags: shot.referenceTags || [],
        createdAt: now,
        updatedAt: now,
      }));

      allShots[scene.id] = generatedShots;

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

    // Save to step3Data (aligned with ambient-visual structure)
    const step3Data: Step3Data = {
      scenes: serializedScenes,
      shots: serializedShots,
      continuityLocked: false,
      continuityGroups: {},
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
          isLinkedToPrevious: shot.isLinkedToPrevious || false,
          referenceTags: shot.referenceTags || [],
          createdAt: shotNow,
          updatedAt: shotNow,
        }));

        allShots[scene.id] = generatedShots;

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

    const updatedStep3Data: Step3Data = {
      scenes: serializedScenes,
      shots: serializedShots,
      continuityLocked: false,
      continuityGroups: {},
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
    const { scenes } = req.body as {
      scenes: Array<{
        id: string;
        name: string;
        description: string;
        duration: number;
        actType?: 'hook' | 'intro' | 'main' | 'outro' | 'custom';
        shots?: Array<any>;
      }>;
    };

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    // Verify video exists and belongs to user
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Serialize Date objects to ISO strings for JSONB storage
    // Convert frontend format (with 'name') to ambient-visual compatible format (with 'title')
    const now = new Date();
    const scenesToSave = scenes.map(scene => ({
      ...scene,
      title: (scene as any).name || (scene as any).title || '',  // Ensure 'title' exists
      name: (scene as any).name || (scene as any).title || '',  // Keep 'name' for frontend
      videoId: videoId,
      sceneNumber: (scene as any).sceneNumber || scenes.indexOf(scene) + 1,
      createdAt: (scene as any).createdAt instanceof Date 
        ? (scene as any).createdAt.toISOString() 
        : ((scene as any).createdAt || now.toISOString()),
    }));

    // Get existing step3Data or create new
    const existingStep3Data = (video.step3Data as Step3Data) || {};
    
    // Update step3Data with new scenes (shots remain in shots Record, not in scenes)
    const updatedStep3Data: Step3Data = {
      ...existingStep3Data,
      scenes: scenesToSave,
      // Preserve existing shots if not provided
      shots: existingStep3Data.shots || {},
      continuityLocked: existingStep3Data.continuityLocked || false,
      continuityGroups: existingStep3Data.continuityGroups || {},
    };

    // Update video in database
    await storage.updateVideo(videoId, {
      step3Data: updatedStep3Data,
    });

    console.log('[character-vlog:routes] Scenes saved to step3Data:', {
      videoId,
      sceneCount: scenesToSave.length,
    });

    res.json({
      success: true,
      sceneCount: scenesToSave.length,
    });
  } catch (error) {
    console.error('[character-vlog:routes] Failed to save scenes:', error);
    res.status(500).json({ error: 'Failed to save scenes' });
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

export default router;

