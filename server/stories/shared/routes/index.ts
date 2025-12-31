import { Router, type Request, type Response } from "express";
import multer from "multer";
import { isAuthenticated, getCurrentUserId } from "../../../auth";
import { createIdeaGenerator, type StoryMode } from "../agents/idea-generator";
import { createSceneGenerator } from "../agents/scene-generator";
import { createStoryboardEnhancer } from "../agents/storyboard-enhancer";
import { createImageGenerator } from "../agents/image-generator";
import { createVoiceoverGenerator } from "../agents/voiceover-generator";
import { createMusicGenerator } from "../agents/music-generator";
import { createVideoGenerator } from "../agents/video-generator";
import { requiresMatchingDimensions, getVideoDimensionsForImageGeneration } from "../../../ai/config/index";
import { createVideoExporter } from "../agents/video-exporter";
import { storage } from "../../../storage";
import * as bunnyStorage from "../../../storage/bunny-storage";
import { buildStoryModePath, deleteFile } from "../../../storage/bunny-storage";

// Configure multer for memory storage - Image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Configure multer for memory storage - Audio uploads (custom music)
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for audio
  fileFilter: (req, file, cb) => {
    const validMimeTypes = [
      'audio/mpeg', 'audio/mp3', 
      'audio/wav', 'audio/x-wav', 
      'audio/m4a', 'audio/x-m4a', 'audio/mp4',
      'audio/ogg', 'audio/vorbis'
    ];
    const fileName = file.originalname.toLowerCase();
    const hasValidExtension = /\.(mp3|wav|m4a|ogg)$/.test(fileName);
    const hasValidMime = validMimeTypes.some(type => file.mimetype.includes(type.split('/')[1]));
    
    if (hasValidExtension || hasValidMime) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed (MP3, WAV, M4A, OGG)'));
    }
  },
});

/**
 * Create story mode router for a specific mode
 * 
 * @param mode - Story mode (problem-solution, before-after, myth-busting, tease-reveal)
 * @returns Express Router configured for the specified mode
 */
/**
 * Extract story mode from Express request
 * Tries multiple methods to get the mode from the request path
 */
function extractModeFromRequest(req: Request, fallbackMode: string): string {
  // Method 1: Try originalUrl first (most reliable)
  if (req.originalUrl) {
    const originalMatch = req.originalUrl.match(/\/api\/([^\/]+)/);
    if (originalMatch && originalMatch[1]) {
      return originalMatch[1];
    }
  }
  
  // Method 2: Try baseUrl (may work with nested routers)
  if (req.baseUrl) {
    const baseMatch = req.baseUrl.replace('/api/', '');
    if (baseMatch && baseMatch !== '') {
      return baseMatch;
    }
  }
  
  // Method 3: Try url property
  if (req.url) {
    const urlMatch = req.url.match(/\/api\/([^\/]+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
  }
  
  // Fallback: Use mode from closure (should be correct for this router)
  return fallbackMode;
}

export async function createStoryModeRouter(mode: StoryMode) {
  const router = Router();
  
  // Dynamic imports for mode-specific prompts
  const musicPromptsModule = await import(`../../${mode}/prompts/music-prompts`);
  const { isValidMusicStyle } = musicPromptsModule;
  // MusicStyle type will be inferred from usage
  
  // Create agent functions for this mode
  const generateStory = await createIdeaGenerator(mode);
  const generateScenes = await createSceneGenerator(mode);
  const enhanceStoryboard = await createStoryboardEnhancer(mode);
  const generateImages = await createImageGenerator(mode);
  const generateVoiceover = await createVoiceoverGenerator(mode);
  const generateMusic = await createMusicGenerator(mode);
  const generateVideos = await createVideoGenerator(mode);
  const { exportFinalVideo, remixVideo } = await createVideoExporter(mode);

  /**
   * POST /api/{mode}/idea
   * Generates a story from idea text
   */
  router.post(
    "/idea",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const userId = getCurrentUserId(req);
        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const { ideaText, durationSeconds } = req.body || {};

        if (!ideaText || !ideaText.trim()) {
          return res.status(400).json({ error: "ideaText is required" });
        }

        const result = await generateStory(
        {
          ideaText: ideaText.trim(),
          durationSeconds: durationSeconds || 30,
        },
        userId,
        req.headers["x-workspace-id"] as string | undefined
      );

      res.json({
        story: result.story,
        cost: result.cost,
      });
      } catch (error) {
        console.error(`[${mode}:routes] story generation error:`, error);
      
      // Extract error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to generate story";
      
      // Determine appropriate status code based on error type
      let statusCode = 500; // Default to Internal Server Error
      
      if (errorMessage.includes("required") || 
          errorMessage.includes("must be at least") || 
          errorMessage.includes("must not exceed") ||
          errorMessage.includes("is empty") ||
          errorMessage.includes("became empty")) {
        statusCode = 400; // Bad Request for validation errors
      } else if (errorMessage.includes("Unauthorized") || 
                 errorMessage.includes("authentication")) {
        statusCode = 401; // Unauthorized
      } else if (errorMessage.includes("rate limit") || 
                 errorMessage.includes("Rate limit")) {
        statusCode = 429; // Too Many Requests
      } else if (errorMessage.includes("insufficient credits") || 
                 errorMessage.includes("credits") ||
                 errorMessage.includes("account balance")) {
        statusCode = 402; // Payment Required
      }
      
      res.status(statusCode).json({ 
        error: errorMessage 
      });
    }
  }
);

  /**
   * POST /api/{mode}/scenes
   * Generates scene breakdown from story
   */
  router.post(
    "/scenes",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const userId = getCurrentUserId(req);
        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const { storyText, duration, pacing, videoModel } = req.body || {};

        console.log(`[${mode}:routes] Generating scenes with:`, {
        storyTextLength: storyText?.length,
        duration,
        pacing,
        videoModel: videoModel || 'default'
      });

      if (!storyText || !storyText.trim()) {
        return res.status(400).json({ error: "storyText is required" });
      }

      const result = await generateScenes(
        {
          storyText: storyText.trim(),
          duration: duration || 30,
          pacing: pacing || 'medium',
          videoModel: videoModel, // Pass video model for duration constraints
        },
        userId,
        req.headers["x-workspace-id"] as string | undefined
      );

        console.log(`[${mode}:routes] Scenes generated successfully:`, {
        sceneCount: result.scenes?.length,
        totalScenes: result.totalScenes
      });

      res.json(result);
    } catch (error) {
        console.error(`[${mode}:routes] scene generation error:`, error);
      res.status(500).json({ error: "Failed to generate scenes" });
    }
  }
);

/**
 * POST /api/{mode}/storyboard
 * Enhances scenes with image prompts, voice text, and animation details
 */
router.post(
  "/storyboard",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { 
        scenes, 
        aspectRatio, 
        imageStyle,
        voiceoverEnabled, 
        language,
        textOverlay,
        animationMode,
        animationType,
        styleReferenceUrl,
        styleReferenceDescription,
        characterReferenceUrl,
        characterReferenceDescription
      } = req.body || {};

      if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
        return res.status(400).json({ error: "scenes array is required" });
      }

      const result = await enhanceStoryboard(
        {
          scenes,
          aspectRatio: aspectRatio || '9:16',
          imageStyle: imageStyle || 'photorealistic',
          voiceoverEnabled: voiceoverEnabled !== false,
          language: voiceoverEnabled ? language : undefined,
          textOverlay: voiceoverEnabled ? textOverlay : undefined,
          animationMode: animationMode !== false,
          animationType: animationMode ? animationType : undefined,
          styleReferenceUrl: styleReferenceUrl || undefined,
          styleReferenceDescription: styleReferenceDescription || undefined,
          characterReferenceUrl: characterReferenceUrl || undefined,
          characterReferenceDescription: characterReferenceDescription || undefined,
        },
        userId,
        req.headers["x-workspace-id"] as string | undefined
      );

      res.json(result);
    } catch (error) {
      console.error("[${mode}:routes] storyboard enhancement error:", error);
      res.status(500).json({ error: "Failed to enhance storyboard" });
    }
  }
);

/**
 * POST /api/{mode}/images
 * Generates images for all scenes with character consistency
 */
router.post(
  "/images",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { storyId, scenes, aspectRatio, imageStyle, styleReferenceUrl, characterReferenceUrl, imageModel, imageResolution, videoModel, videoResolution, projectName, workspaceId } = req.body || {};

      if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
        return res.status(400).json({ error: "scenes array is required" });
      }

      if (!storyId) {
        return res.status(400).json({ error: "storyId is required" });
      }

      console.log('[${mode}:routes] Image generation request:', {
        sceneCount: scenes.length,
        aspectRatio: aspectRatio || "9:16",
        imageStyle: imageStyle || "photorealistic",
        styleReferenceUrl: styleReferenceUrl ? 'provided' : 'none',
        characterReferenceUrl: characterReferenceUrl ? 'provided' : 'none',
        imageModel: imageModel || "nano-banana",
        imageResolution: imageResolution || "1k",
      });

      // Get workspace name
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find((w) => w.id === workspaceId);
      const workspaceName = workspace?.name || workspaceId;

      const result = await generateImages(
        {
          storyId,
          scenes,
          aspectRatio: aspectRatio || "9:16",
          imageStyle: imageStyle || "photorealistic",
          styleReferenceUrl: styleReferenceUrl || undefined, // Custom style reference
          characterReferenceUrl: characterReferenceUrl || undefined, // Character reference
          imageModel: imageModel || "nano-banana",
          imageResolution: imageResolution || "1k",
          videoModel: videoModel || undefined, // Optional: for dimension matching
          videoResolution: videoResolution || undefined, // Optional: for dimension matching
          projectName: projectName || "Untitled",
          workspaceId: workspaceId || "",
        },
        userId,
        workspaceName
      );

      console.log("[${mode}:routes] Sending response with", result.scenes.length, "scenes");
      console.log("[${mode}:routes] First scene:", result.scenes[0]);

      res.json(result);
    } catch (error) {
      console.error("[${mode}:routes] image generation error:", error);
      res.status(500).json({ error: "Failed to generate images" });
    }
  }
);

/**
 * POST /api/{mode}/images/regenerate
 * Regenerates a single scene image with updated prompt
 */
router.post(
  "/images/regenerate",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { 
        sceneNumber, 
        sceneId,
        imagePrompt, 
        aspectRatio, 
        imageStyle,
        styleReferenceUrl,
        characterReferenceUrl,
        imageModel,
        imageResolution,
        videoModel,
        videoResolution,
        projectName, 
        workspaceId,
        storyId,
      } = req.body || {};

      if (!imagePrompt) {
        return res.status(400).json({ error: "imagePrompt is required" });
      }

      if (!sceneNumber) {
        return res.status(400).json({ error: "sceneNumber is required" });
      }

      console.log("[${mode}:routes] Regenerating image for scene", sceneNumber);

      // Get workspace name
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find((w) => w.id === workspaceId);
      const workspaceName = workspace?.name || workspaceId;

      // Generate single image (treat as scene 1 to get fresh generation without seed)
      const result = await generateImages(
        {
          storyId: storyId || 'temp',
          scenes: [{
            id: sceneId || `scene-${sceneNumber}`,
            sceneNumber: 1, // Always 1 to avoid seed consistency logic
            imagePrompt: imagePrompt,
            duration: 5,
          }],
          aspectRatio: aspectRatio || "9:16",
          imageStyle: imageStyle || "photorealistic",
          styleReferenceUrl: styleReferenceUrl || undefined, // Custom style reference
          characterReferenceUrl: characterReferenceUrl || undefined, // Character reference
          imageModel: imageModel || "nano-banana",
          imageResolution: imageResolution || "1k",
          videoModel: videoModel || undefined, // Optional: for dimension matching
          videoResolution: videoResolution || undefined, // Optional: for dimension matching
          projectName: projectName || "Untitled",
          workspaceId: workspaceId || "",
        },
        userId,
        workspaceName
      );

      if (result.scenes.length > 0 && result.scenes[0].status === 'generated') {
        console.log("[${mode}:routes] Image regenerated successfully:", result.scenes[0].imageUrl);
        res.json({
          success: true,
          sceneNumber: sceneNumber,
          imageUrl: result.scenes[0].imageUrl,
          seed: result.referenceSeed,
          cost: result.totalCost,
        });
      } else {
        res.status(500).json({ 
          error: result.errors[0] || "Failed to regenerate image" 
        });
      }
    } catch (error) {
      console.error("[${mode}:routes] image regeneration error:", error);
      res.status(500).json({ error: "Failed to regenerate image" });
    }
  }
);

/**
 * GET /api/{mode}/voices
 * Fetches available voices from ElevenLabs with preview URLs
 */
router.get(
  "/voices",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Return hardcoded voice list for now
      // In the future, this can fetch from ElevenLabs API
      const voices = [
        // Arabic voices
        { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", language: "ar", gender: "female", age: "young" },
        { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", language: "ar", gender: "male", age: "middle-aged" },
        { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", language: "ar", gender: "female", age: "mature" },
        // English voices
        { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", language: "en", gender: "female", age: "young" },
        { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", language: "en", gender: "female", age: "young" },
        { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", language: "en", gender: "female", age: "middle-aged" },
        { id: "ErXwobaYiN019PkySvjV", name: "Antoni", language: "en", gender: "male", age: "young" },
        { id: "GBv7mTt0atIp3Br8iCZE", name: "Thomas", language: "en", gender: "male", age: "mature" },
        { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", language: "en", gender: "male", age: "middle-aged" },
      ];

      res.json({ voices });
    } catch (error) {
      console.error("[${mode}:routes] voices fetch error:", error);
      res.status(500).json({ error: "Failed to fetch voices" });
    }
  }
);

/**
 * GET /api/{mode}/voice-preview/:voiceId
 * Generates voice preview audio using ElevenLabs TTS
 * Query params:
 *   - lang: 'ar' for Arabic, 'en' for English (default: uses voice default preview)
 */
router.get(
  "/voice-preview/:voiceId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { voiceId } = req.params;
      const { lang } = req.query;
      const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

      if (!elevenLabsApiKey) {
        return res.status(500).json({ error: "ElevenLabs API key not configured" });
      }

      // If Arabic language requested, generate TTS with Arabic text
      if (lang === 'ar') {
        const arabicPreviewText = "مرحباً، أنا صوتك للسرد. سأساعدك في إنشاء قصص رائعة.";
        
        console.log(`[voice-preview] Generating Arabic preview for voice ${voiceId}`);
        
        const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': elevenLabsApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: arabicPreviewText,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        });

        if (!ttsResponse.ok) {
          console.error(`[voice-preview] TTS failed for voice ${voiceId}:`, ttsResponse.statusText);
          // Fall back to default preview
          return res.redirect(`/api/${mode}/voice-preview/${voiceId}`);
        }

        const audioBuffer = await ttsResponse.arrayBuffer();
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', audioBuffer.byteLength);
        return res.send(Buffer.from(audioBuffer));
      }

      // Default: fetch the standard preview from ElevenLabs
      const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
        headers: {
          'xi-api-key': elevenLabsApiKey,
        },
      });

      if (!response.ok) {
        console.error(`[voice-preview] Failed to fetch voice ${voiceId}:`, response.statusText);
        return res.status(response.status).json({ error: "Failed to fetch voice preview" });
      }

      const voiceData = await response.json();
      
      // ElevenLabs returns preview_url in the voice data
      if (voiceData.preview_url) {
        // Redirect to the preview URL
        return res.redirect(voiceData.preview_url);
      } else {
        return res.status(404).json({ error: "Preview not available for this voice" });
      }
    } catch (error) {
      console.error("[voice-preview] Error:", error);
      res.status(500).json({ error: "Failed to fetch voice preview" });
    }
  }
);

/**
 * POST /api/{mode}/voiceover
 * Generates voiceover audio for all scenes using ElevenLabs TTS
 */
router.post(
  "/voiceover",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { storyId, scenes, voiceId, projectName, workspaceId } = req.body || {};

      if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
        return res.status(400).json({ error: "scenes array is required" });
      }

      if (!voiceId) {
        return res.status(400).json({ error: "voiceId is required" });
      }

      console.log("[${mode}:routes] Generating voiceover for", scenes.length, "scenes");

      // Get workspace name
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find((w) => w.id === workspaceId);
      const workspaceName = workspace?.name || workspaceId;

      const result = await generateVoiceover(
        {
          storyId: storyId || 'temp-story',
          scenes,
          voiceId,
          projectName: projectName || 'Untitled',
          workspaceId: workspaceId || '',
        },
        userId,
        workspaceName
      );

      console.log(`[${mode}:routes] Voiceover generation complete:`, {
        successful: result.scenes.filter((s: any) => s.status === 'generated').length,
        failed: result.scenes.filter((s: any) => s.status === 'failed').length,
        totalCost: result.totalCost,
      });

      res.json(result);
    } catch (error) {
      console.error("[${mode}:routes] voiceover generation error:", error);
      res.status(500).json({ error: "Failed to generate voiceover" });
    }
  }
);

/**
 * POST /api/{mode}/music
 * Generates AI background music using ElevenLabs Music API
 */
router.post(
  "/music",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { musicStyle, durationMs, storyTopic, projectName, workspaceId } = req.body || {};

      // Validate music style
      if (!musicStyle) {
        return res.status(400).json({ error: "musicStyle is required" });
      }

      if (!isValidMusicStyle(musicStyle)) {
        return res.status(400).json({ error: `Invalid music style: ${musicStyle}` });
      }

      // Skip if no music
      if (musicStyle === 'none') {
        return res.json({
          musicUrl: '',
          durationMs: 0,
          cost: 0,
          style: 'none',
        });
      }

      if (!durationMs || durationMs < 10000) {
        return res.status(400).json({ error: "durationMs must be at least 10000 (10 seconds)" });
      }

      console.log('[${mode}:routes] Music generation request:', {
        musicStyle,
        durationMs,
        storyTopic: storyTopic?.substring(0, 50),
      });

      // Get workspace name
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find((w) => w.id === workspaceId);
      const workspaceName = workspace?.name || workspaceId;

      const result = await generateMusic(
        {
          musicStyle: musicStyle as any,
          durationMs,
          storyTopic,
          projectName: projectName || "Untitled",
          workspaceId: workspaceId || "",
        },
        userId,
        workspaceName
      );

      console.log('[${mode}:routes] Music generation complete:', {
        style: result.style,
        durationMs: result.durationMs,
        cost: result.cost,
      });

      res.json(result);
    } catch (error) {
      console.error("[${mode}:routes] music generation error:", error);
      res.status(500).json({ error: "Failed to generate music" });
    }
  }
);

/**
 * POST /api/{mode}/videos
 * Generates videos for all scenes using Image-to-Video
 */
router.post(
  "/videos",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { storyId, scenes, videoModel, videoResolution, aspectRatio, imageStyle, projectName, workspaceId } = req.body || {};

      if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
        return res.status(400).json({ error: "scenes array is required" });
      }

      if (!storyId) {
        return res.status(400).json({ error: "storyId is required" });
      }

      if (!videoModel) {
        return res.status(400).json({ error: "videoModel is required" });
      }

      console.log('[${mode}:routes] Video generation request:', {
        sceneCount: scenes.length,
        videoModel,
        videoResolution: videoResolution || "720p",
        aspectRatio: aspectRatio || "9:16",
        imageStyle: imageStyle || "photorealistic",
      });

      // Get workspace name
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find((w) => w.id === workspaceId);
      const workspaceName = workspace?.name || workspaceId;

      const result = await generateVideos(
        {
          storyId,
          scenes,
          videoModel,
          videoResolution: videoResolution || "720p",
          aspectRatio: aspectRatio || "9:16",
          imageStyle: imageStyle || "photorealistic",
          projectName: projectName || "Untitled",
          workspaceId: workspaceId || "",
        },
        userId,
        workspaceName
      );

      console.log(`[${mode}:routes] Video generation complete:`, {
        successful: result.scenes.filter((s: any) => s.status === 'generated').length,
        failed: result.scenes.filter((s: any) => s.status === 'failed').length,
        totalCost: result.totalCost,
      });

      res.json(result);
    } catch (error) {
      console.error("[${mode}:routes] video generation error:", error);
      res.status(500).json({ error: "Failed to generate videos" });
    }
  }
);

/**
 * POST /api/{mode}/videos/regenerate
 * Regenerates a single scene video
 */
router.post(
  "/videos/regenerate",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { 
        sceneNumber, 
        sceneId,
        imageUrl,
        imagePrompt, // Required if video model needs matching dimensions
        imageModel, // Required if video model needs matching dimensions
        videoPrompt,
        narration,
        voiceMood,
        duration,
        videoModel,
        videoResolution,
        aspectRatio,
        imageStyle,
        projectName, 
        workspaceId,
        storyId,
      } = req.body || {};

      if (!imageUrl) {
        return res.status(400).json({ error: "imageUrl is required" });
      }

      if (!sceneNumber) {
        return res.status(400).json({ error: "sceneNumber is required" });
      }

      if (!videoModel) {
        return res.status(400).json({ error: "videoModel is required" });
      }

      console.log("[${mode}:routes] Regenerating video for scene", sceneNumber, {
        imageStyle: imageStyle || "photorealistic",
        videoModel,
        videoResolution: videoResolution || "720p",
        aspectRatio: aspectRatio || "9:16",
      });

      // Get workspace name
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find((w) => w.id === workspaceId);
      const workspaceName = workspace?.name || workspaceId;

      // ═══════════════════════════════════════════════════════════════════════════
      // CHECK IF VIDEO MODEL REQUIRES MATCHING DIMENSIONS
      // If so, we need to regenerate the image with correct dimensions first
      // ═══════════════════════════════════════════════════════════════════════════
      let finalImageUrl = imageUrl;

      if (videoModel && videoResolution && aspectRatio && requiresMatchingDimensions(videoModel)) {
        const videoDims = getVideoDimensionsForImageGeneration(videoModel, aspectRatio, videoResolution);
        
        if (videoDims) {
          console.log(
            `[${mode}:routes] Video model "${videoModel}" requires matching dimensions. ` +
            `Regenerating image with dimensions: ${videoDims.width}x${videoDims.height}`
          );
          
          // We need imagePrompt to regenerate - get it from request body
          if (!imagePrompt) {
            return res.status(400).json({ 
              error: "imagePrompt is required when using video models that require matching dimensions (e.g., Sora 2 Pro)" 
            });
          }
          
          // Also need imageModel
          const finalImageModel = imageModel || "nano-banana";
          
          // Regenerate image with video dimensions
          try {
            const imageResult = await generateImages(
              {
                storyId: storyId || 'temp',
                scenes: [{
                  id: sceneId || `scene-${sceneNumber}`,
                  sceneNumber: 1, // Always 1 to avoid seed consistency logic
                  imagePrompt: imagePrompt,
                  duration: duration || 5,
                }],
                aspectRatio: aspectRatio || "9:16",
                imageStyle: imageStyle || "photorealistic",
                imageModel: finalImageModel,
                imageResolution: "1k", // Will be overridden by video dimensions
                videoModel: videoModel, // Pass video model for dimension matching
                videoResolution: videoResolution, // Pass video resolution for dimension matching
                projectName: projectName || "Untitled",
                workspaceId: workspaceId || "",
              },
              userId,
              workspaceName
            );
            
            if (imageResult.scenes.length > 0 && imageResult.scenes[0].status === 'generated') {
              finalImageUrl = imageResult.scenes[0].imageUrl;
              console.log(
                `[${mode}:routes] Image regenerated with correct dimensions: ` +
                `${finalImageUrl.substring(0, 50)}...`
              );
            } else {
              const errorMsg = imageResult.scenes[0]?.error || "Failed to regenerate image";
              console.error(
                `[${mode}:routes] Failed to regenerate image with correct dimensions: ${errorMsg}`
              );
              return res.status(500).json({ 
                error: `Failed to regenerate image with correct dimensions: ${errorMsg}` 
              });
            }
          } catch (imageError) {
            console.error(
              `[${mode}:routes] Error regenerating image:`,
              imageError instanceof Error ? imageError.message : imageError
            );
            return res.status(500).json({ 
              error: `Failed to regenerate image: ${imageError instanceof Error ? imageError.message : "Unknown error"}` 
            });
          }
        }
      }

      // Generate single video with full context (use regenerated image if applicable)
      const result = await generateVideos(
        {
          storyId: storyId || 'temp',
          scenes: [{
            id: sceneId || `scene-${sceneNumber}`,
            sceneNumber: sceneNumber,
            imageUrl: finalImageUrl, // Use regenerated image if model requires matching dimensions
            videoPrompt: videoPrompt,
            narration: narration,
            voiceMood: voiceMood,
            duration: duration || 5,
          }],
          videoModel,
          videoResolution: videoResolution || "720p",
          aspectRatio: aspectRatio || "9:16",
          imageStyle: imageStyle || "photorealistic",
          projectName: projectName || "Untitled",
          workspaceId: workspaceId || "",
        },
        userId,
        workspaceName
      );

      if (result.scenes.length > 0 && result.scenes[0].status === 'generated') {
        res.json({
          videoUrl: result.scenes[0].videoUrl,
          actualDuration: result.scenes[0].actualDuration,
          cost: result.totalCost,
        });
      } else {
        res.status(500).json({ 
          error: result.errors[0] || "Failed to regenerate video" 
        });
      }
    } catch (error) {
      console.error("[${mode}:routes] video regeneration error:", error);
      res.status(500).json({ error: "Failed to regenerate video" });
    }
  }
);

/**
 * POST /api/{mode}/export
 * Export final video with all scenes, audio, music, and effects
 */
router.post(
  "/export",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const {
        storyId,
        scenes,
        animationMode,
        backgroundMusic,
        musicStyle,          // AI music style (e.g., "cinematic", "upbeat")
        customMusicUrl,      // User-uploaded custom music URL (takes priority)
        storyTopic,          // Topic for context-aware music generation
        voiceVolume,
        musicVolume,
        aspectRatio,
        exportFormat,
        exportQuality,
        textOverlay,
        textOverlayStyle,    // Style: 'modern' | 'cinematic' | 'bold'
        language,            // Language for font selection: 'en' | 'ar'
        projectName,
        workspaceId,
      } = req.body;

      // Validation
      if (!scenes || scenes.length === 0) {
        return res.status(400).json({ error: "No scenes provided" });
      }

      if (!animationMode) {
        return res.status(400).json({ error: "animationMode is required" });
      }

      // Validate animation mode
      if (!['off', 'transition', 'video'].includes(animationMode)) {
        return res.status(400).json({ 
          error: "Invalid animationMode. Must be 'off', 'transition', or 'video'" 
        });
      }

      // Validate that video mode has at least imageUrl (videoUrl is optional - will fallback to animated image)
      // This enables hybrid mode: scenes with videoUrl use video, scenes without use animated image
      if (animationMode === 'video') {
        const missingMedia = scenes.filter((s: any) => !s.videoUrl && !s.imageUrl);
        if (missingMedia.length > 0) {
          return res.status(400).json({ 
            error: `Video mode requires all scenes to have videoUrl or imageUrl. Missing for scenes: ${missingMedia.map((s: any) => s.sceneNumber).join(', ')}` 
          });
        }
        // Log hybrid mode info
        const videoScenes = scenes.filter((s: any) => s.videoUrl).length;
        const imageOnlyScenes = scenes.filter((s: any) => !s.videoUrl && s.imageUrl).length;
        if (imageOnlyScenes > 0) {
          console.log(`[${mode}:routes] Hybrid mode: ${videoScenes} video scenes, ${imageOnlyScenes} image-only scenes (will animate)`);
        }
      }

      // Validate that off/transition modes have imageUrls
      if (animationMode === 'off' || animationMode === 'transition') {
        const missingImageUrls = scenes.filter((s: any) => !s.imageUrl);
        if (missingImageUrls.length > 0) {
          return res.status(400).json({ 
            error: `${animationMode} mode requires all scenes to have imageUrl. Missing for scenes: ${missingImageUrls.map((s: any) => s.sceneNumber).join(', ')}` 
          });
        }
      }

      console.log("[${mode}:routes] ═══════════════════════════════════════════════");
      console.log("[${mode}:routes] Starting video export:");
      console.log("[${mode}:routes]   Scene count:", scenes.length);
      console.log("[${mode}:routes]   Animation mode:", animationMode);
      console.log("[${mode}:routes]   Music:", customMusicUrl ? 'custom-upload' : (musicStyle || 'none'));
      console.log("[${mode}:routes]   Story topic:", storyTopic?.substring(0, 50) || 'N/A');
      console.log("[${mode}:routes]   Format:", exportFormat);
      console.log("[${mode}:routes]   Quality:", exportQuality);
      console.log("[${mode}:routes]   Text overlay:", textOverlay);
      console.log("[${mode}:routes]   Text overlay style:", textOverlayStyle || 'modern');
      console.log("[${mode}:routes]   Language:", language || 'en');
      console.log("[${mode}:routes] ═══════════════════════════════════════════════");

      // Get workspace name
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find((w) => w.id === workspaceId);
      const workspaceName = workspace?.name || workspaceId;

      // Call export agent
      const result = await exportFinalVideo(
        {
          storyId: storyId || 'temp-story',
          scenes,
          animationMode,
          backgroundMusic,
          musicStyle: musicStyle || 'none',       // AI music style
          customMusicUrl: customMusicUrl || undefined, // User-uploaded custom music
          storyTopic: storyTopic || '',           // For context-aware music generation
          voiceVolume: voiceVolume || 100,
          musicVolume: musicVolume || 50,
          aspectRatio: aspectRatio || '16:9',
          exportFormat: exportFormat || 'mp4',
          exportQuality: exportQuality || '1080p',
          textOverlay: textOverlay !== false,
          textOverlayStyle: textOverlayStyle || 'modern',  // Style: 'modern' | 'cinematic' | 'bold'
          language: language || 'en',                       // Language for font selection
          projectName: projectName || 'Untitled',
          workspaceId: workspaceId || 'default',
        },
        userId,
        workspaceName
      );

      console.log("[${mode}:routes] Export complete:", {
        videoUrl: result.videoUrl,
        videoBaseUrl: result.videoBaseUrl ? '✓ present' : '✗ missing',
        voiceoverUrl: result.voiceoverUrl ? '✓ present' : '✗ missing',
        musicUrl: result.musicUrl ? '✓ present' : '✗ missing',
        duration: result.duration,
        size: `${(result.size / 1024 / 1024).toFixed(2)}MB`,
      });

      res.json(result);
    } catch (error) {
      console.error("[${mode}:routes] Export failed:", error);
      res.status(500).json({ 
        error: "Failed to export video",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

/**
 * POST /api/{mode}/remix
 * Re-mixes audio with new volume levels
 * Used for real-time volume adjustment after initial export
 */
router.post(
  "/remix",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const {
        videoBaseUrl,
        voiceoverUrl,
        musicUrl,
        voiceVolume,
        musicVolume,
        projectName,
        workspaceId,
      } = req.body || {};

      // Get workspace name from database (same as other routes)
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find((w) => w.id === workspaceId);
      const workspaceName = workspace?.name || workspaceId || 'default';

      console.log('[${mode}:routes] Remix request:', {
        hasVideoBase: !!videoBaseUrl,
        hasVoiceover: !!voiceoverUrl,
        hasMusic: !!musicUrl,
        voiceVolume,
        musicVolume,
      });

      // Validate required fields
      if (!videoBaseUrl || !voiceoverUrl || !musicUrl) {
        return res.status(400).json({ 
          error: "videoBaseUrl, voiceoverUrl, and musicUrl are required for remix" 
        });
      }

      if (typeof voiceVolume !== 'number' || typeof musicVolume !== 'number') {
        return res.status(400).json({ 
          error: "voiceVolume and musicVolume must be numbers" 
        });
      }

      const result = await remixVideo(
        {
          videoBaseUrl,
          voiceoverUrl,
          musicUrl,
          voiceVolume: Math.max(0, Math.min(100, voiceVolume)),
          musicVolume: Math.max(0, Math.min(100, musicVolume)),
          projectName: projectName || 'Untitled',
          workspaceId: workspaceId || 'default',
        },
        userId,
        workspaceName
      );

      console.log('[${mode}:routes] Remix complete:', {
        videoUrl: result.videoUrl,
        duration: result.duration,
        size: result.size,
      });

      res.json(result);
    } catch (error) {
      console.error("[${mode}:routes] Remix failed:", error);
      res.status(500).json({ 
        error: "Failed to remix video",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

/**
 * POST /api/{mode}/style-reference/upload
 * Upload a style reference image for AI image generation
 */
router.post(
  "/style-reference/upload",
  isAuthenticated,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { workspaceId, type } = req.body;

      // Get workspace name for path building
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find(w => w.id === workspaceId);
      const workspaceName = workspace?.name || 'default';

      // Extract mode from request path using multiple methods
      const modeFromPath = extractModeFromRequest(req, mode);
      console.log(`[style-reference] ═══════════════════════════════════════════════`);
      console.log(`[style-reference] Mode extraction details:`);
      console.log(`[style-reference]   Final mode: ${modeFromPath}`);
      console.log(`[style-reference]   Closure mode: ${mode}`);
      console.log(`[style-reference]   originalUrl: ${req.originalUrl}`);
      console.log(`[style-reference]   baseUrl: ${req.baseUrl}`);
      console.log(`[style-reference]   url: ${req.url}`);
      console.log(`[style-reference] ═══════════════════════════════════════════════`);

      // Determine filename based on type (style or character)
      const isCharacter = type === 'character';
      const filename = isCharacter ? "custom_character.jpg" : "custom_style.jpg";

      // Build the storage path
      // Store in Reference folder with a fixed filename so it gets replaced on re-upload
      const bunnyPath = buildStoryModePath({
        userId,
        workspaceName,
        toolMode: modeFromPath,
        projectName: req.body.projectName || "MyProject_Upload", // Use provided projectName or fallback
        subfolder: "Reference",
        filename,
      });

      // Try to delete old file first (ignore errors if it doesn't exist)
      try {
        await deleteFile(bunnyPath);
        console.log(`[style-reference] Deleted old ${isCharacter ? 'character' : 'style'} reference`);
      } catch {
        // File may not exist, ignore
      }

      // Upload the new reference image
      const cdnUrl = await bunnyStorage.uploadFile(
        bunnyPath,
        req.file.buffer,
        req.file.mimetype
      );

      console.log(`[style-reference] ${isCharacter ? 'Character' : 'Style'} reference uploaded:`, cdnUrl);

      res.json({ 
        success: true, 
        url: cdnUrl,
        message: `${isCharacter ? 'Character' : 'Style'} reference uploaded successfully`
      });
    } catch (error) {
      console.error("[style-reference] Upload error:", error);
      res.status(500).json({ 
        error: "Failed to upload style reference",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

/**
 * POST /api/{mode}/custom-music/upload
 * Upload custom background music for video export
 * - Validates file type (MP3, WAV, M4A, OGG)
 * - Validates duration (max 5 minutes = 300 seconds)
 * - Stores in BunnyCDN, replacing old file if exists
 */
router.post(
  "/custom-music/upload",
  isAuthenticated,
  audioUpload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Validate file type
      const validMimeTypes = [
        'audio/mpeg', 'audio/mp3', 
        'audio/wav', 'audio/x-wav', 
        'audio/m4a', 'audio/x-m4a', 'audio/mp4',
        'audio/ogg', 'audio/vorbis'
      ];
      
      const fileName = req.file.originalname.toLowerCase();
      const hasValidExtension = /\.(mp3|wav|m4a|ogg)$/.test(fileName);
      const hasValidMime = validMimeTypes.some(type => 
        req.file!.mimetype.includes(type.split('/')[1])
      );

      if (!hasValidExtension && !hasValidMime) {
        return res.status(400).json({ 
          error: "Invalid file type",
          message: "Please upload MP3, WAV, M4A, or OGG audio files"
        });
      }

      // Max file size: 50MB
      if (req.file.size > 50 * 1024 * 1024) {
        return res.status(400).json({ 
          error: "File too large",
          message: "Maximum file size is 50MB"
        });
      }

      const { workspaceId } = req.body;

      // Get audio duration using FFprobe (pass buffer directly)
      let audioDuration = 0;
      try {
        const { getAudioDuration } = await import('../services/ffmpeg-helpers');
        audioDuration = await getAudioDuration(req.file.buffer);
      } catch (durationError) {
        console.warn('[custom-music] Could not get audio duration:', durationError);
        // Default to 0 if we can't get duration - continue anyway
      }

      // Max duration: 5 minutes (300 seconds)
      if (audioDuration > 300) {
        const mins = Math.floor(audioDuration / 60);
        const secs = Math.floor(audioDuration % 60);
        return res.status(400).json({ 
          error: "Audio too long",
          message: `Maximum duration is 5 minutes. Your file is ${mins}:${secs.toString().padStart(2, '0')}`
        });
      }

      // Get workspace name for path building
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find(w => w.id === workspaceId);
      const workspaceName = workspace?.name || 'default';

      // Extract mode from request path using multiple methods
      const modeFromPath = extractModeFromRequest(req, mode);
      console.log(`[custom-music] ═══════════════════════════════════════════════`);
      console.log(`[custom-music] Mode extraction details:`);
      console.log(`[custom-music]   Final mode: ${modeFromPath}`);
      console.log(`[custom-music]   Closure mode: ${mode}`);
      console.log(`[custom-music]   originalUrl: ${req.originalUrl}`);
      console.log(`[custom-music]   baseUrl: ${req.baseUrl}`);
      console.log(`[custom-music]   url: ${req.url}`);
      console.log(`[custom-music] ═══════════════════════════════════════════════`);

      // Determine file extension
      const extension = fileName.match(/\.(mp3|wav|m4a|ogg)$/i)?.[1] || 'mp3';

      // Build the storage path
      const bunnyPath = buildStoryModePath({
        userId,
        workspaceName,
        toolMode: modeFromPath,
        projectName: req.body.projectName || "MyProject_Upload", // Use provided projectName or fallback
        subfolder: "Music",
        filename: `custom_music.${extension}`, // Fixed name so it gets replaced
      });

      // Try to delete old file first (ignore errors if it doesn't exist)
      try {
        await deleteFile(bunnyPath);
        console.log('[custom-music] Deleted old custom music');
      } catch {
        // File may not exist, ignore
      }

      // Upload the new custom music file
      const cdnUrl = await bunnyStorage.uploadFile(
        bunnyPath,
        req.file.buffer,
        req.file.mimetype
      );

      console.log('[custom-music] Custom music uploaded:', { 
        url: cdnUrl, 
        duration: audioDuration,
        size: req.file.size 
      });

      res.json({ 
        success: true, 
        url: cdnUrl,
        duration: audioDuration,
        message: "Custom music uploaded successfully"
      });
    } catch (error) {
      console.error("[custom-music] Upload error:", error);
      res.status(500).json({ 
        error: "Failed to upload custom music",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

/**
 * POST /api/{mode}/story/save
 * Save a new story record after video export
 */
router.post(
  "/story/save",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const {
        workspaceId,
        projectName,
        projectFolder,
        videoUrl,
        thumbnailUrl,
        duration,
        aspectRatio,
      } = req.body;

      if (!workspaceId || !projectName || !projectFolder) {
        return res.status(400).json({ 
          error: "workspaceId, projectName, and projectFolder are required" 
        });
      }

      console.log('[${mode}:routes] Saving story:', {
        userId,
        workspaceId,
        projectName,
        projectFolder,
      });

      const story = await storage.createStory({
        userId,
        workspaceId,
        projectName,
        projectFolder,
        storyMode: mode,
        videoUrl: videoUrl || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        duration: duration || undefined,
        aspectRatio: aspectRatio || undefined,
      });

      console.log('[${mode}:routes] Story saved:', story.id);

      res.json({
        success: true,
        story,
      });
    } catch (error) {
      console.error("[${mode}:routes] Save story error:", error);
      res.status(500).json({ 
        error: "Failed to save story",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

/**
 * PUT /api/{mode}/story/:storyId/publish
 * Update story with published platforms info after social media publishing
 */
router.put(
  "/story/:storyId/publish",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { storyId } = req.params;
      const { platform, publishData, publishedPlatforms } = req.body;

      // Get current story
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      // Verify ownership
      if (story.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Support two modes: single platform or bulk platforms
      let updatedPlatforms: Record<string, any>;
      const currentPlatforms = (story.publishedPlatforms || {}) as Record<string, any>;

      if (publishedPlatforms && typeof publishedPlatforms === 'object') {
        // Bulk mode: merge all provided platforms
        updatedPlatforms = { ...currentPlatforms, ...publishedPlatforms };
      } else if (platform && publishData) {
        // Single platform mode
        updatedPlatforms = {
          ...currentPlatforms,
          [platform]: {
            ...publishData,
            published_at: new Date().toISOString(),
          },
        };
      } else {
        return res.status(400).json({ 
          error: "Either 'publishedPlatforms' object or 'platform' + 'publishData' are required" 
        });
      }

      const updatedStory = await storage.updateStory(storyId, {
        publishedPlatforms: updatedPlatforms,
      });

      console.log('[${mode}:routes] Story publish updated:', {
        storyId,
        totalPlatforms: Object.keys(updatedPlatforms).length,
      });

      res.json({
        success: true,
        story: updatedStory,
      });
    } catch (error) {
      console.error("[${mode}:routes] Update publish error:", error);
      res.status(500).json({ 
        error: "Failed to update story publish info",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

/**
 * PUT /api/{mode}/story/:storyId
 * Update story video URL (e.g., after remix)
 */
router.put(
  "/story/:storyId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { storyId } = req.params;
      const { videoUrl, thumbnailUrl, duration, aspectRatio } = req.body;

      // Get current story
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      // Verify ownership
      if (story.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updates: Record<string, any> = {};
      if (videoUrl !== undefined) updates.videoUrl = videoUrl;
      if (thumbnailUrl !== undefined) updates.thumbnailUrl = thumbnailUrl;
      if (duration !== undefined) updates.duration = duration;
      if (aspectRatio !== undefined) updates.aspectRatio = aspectRatio;

      const updatedStory = await storage.updateStory(storyId, updates);

      res.json({
        success: true,
        story: updatedStory,
      });
    } catch (error) {
      console.error("[${mode}:routes] Update story error:", error);
      res.status(500).json({ 
        error: "Failed to update story",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

  return router;
}
