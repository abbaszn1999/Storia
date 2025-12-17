import { Router, type Request, type Response } from "express";
import { isAuthenticated, getCurrentUserId } from "../../../auth";
import { generateStory } from "../agents/idea-generator";
import { generateScenes } from "../agents/scene-generator";
import { enhanceStoryboard } from "../agents/storyboard-enhancer";
import { generateImages } from "../agents/image-generator";
import { generateVoiceover } from "../agents/voiceover-generator";
import { generateMusic } from "../agents/music-generator";
import { generateVideos } from "../agents/video-generator";
import { exportFinalVideo, remixVideo } from "../agents/video-exporter";
import { generateSocialMetadata } from "../agents/social-metadata-generator";
import { storage } from "../../../storage";
import { isValidMusicStyle, type MusicStyle } from "../prompts/music-prompts";
import type { SocialPlatform } from "../types";

const psRouter = Router();

/**
 * POST /api/problem-solution/idea
 * Generates a story from idea text
 */
psRouter.post(
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
      console.error("[problem-solution:routes] story generation error:", error);
      res.status(500).json({ error: "Failed to generate story" });
    }
  }
);

/**
 * POST /api/problem-solution/scenes
 * Generates scene breakdown from story
 */
psRouter.post(
  "/scenes",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { storyText, duration, pacing, videoModel } = req.body || {};

      console.log('[problem-solution:routes] Generating scenes with:', {
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

      console.log('[problem-solution:routes] Scenes generated successfully:', {
        sceneCount: result.scenes?.length,
        totalScenes: result.totalScenes
      });

      res.json(result);
    } catch (error) {
      console.error("[problem-solution:routes] scene generation error:", error);
      res.status(500).json({ error: "Failed to generate scenes" });
    }
  }
);

/**
 * POST /api/problem-solution/storyboard
 * Enhances scenes with image prompts, voice text, and animation details
 */
psRouter.post(
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
        animationType 
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
        },
        userId,
        req.headers["x-workspace-id"] as string | undefined
      );

      res.json(result);
    } catch (error) {
      console.error("[problem-solution:routes] storyboard enhancement error:", error);
      res.status(500).json({ error: "Failed to enhance storyboard" });
    }
  }
);

/**
 * POST /api/problem-solution/images
 * Generates images for all scenes with character consistency
 */
psRouter.post(
  "/images",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { storyId, scenes, aspectRatio, imageStyle, imageModel, imageResolution, projectName, workspaceId } = req.body || {};

      if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
        return res.status(400).json({ error: "scenes array is required" });
      }

      if (!storyId) {
        return res.status(400).json({ error: "storyId is required" });
      }

      console.log('[problem-solution:routes] Image generation request:', {
        sceneCount: scenes.length,
        aspectRatio: aspectRatio || "9:16",
        imageStyle: imageStyle || "photorealistic",
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
          imageModel: imageModel || "nano-banana",
          imageResolution: imageResolution || "1k",
          projectName: projectName || "Untitled",
          workspaceId: workspaceId || "",
        },
        userId,
        workspaceName
      );

      console.log("[problem-solution:routes] Sending response with", result.scenes.length, "scenes");
      console.log("[problem-solution:routes] First scene:", result.scenes[0]);

      res.json(result);
    } catch (error) {
      console.error("[problem-solution:routes] image generation error:", error);
      res.status(500).json({ error: "Failed to generate images" });
    }
  }
);

/**
 * POST /api/problem-solution/images/regenerate
 * Regenerates a single scene image with updated prompt
 */
psRouter.post(
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
        imageModel,
        imageResolution,
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

      console.log("[problem-solution:routes] Regenerating image for scene", sceneNumber);

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
          imageModel: imageModel || "nano-banana",
          imageResolution: imageResolution || "1k",
          projectName: projectName || "Untitled",
          workspaceId: workspaceId || "",
        },
        userId,
        workspaceName
      );

      if (result.scenes.length > 0 && result.scenes[0].status === 'generated') {
        console.log("[problem-solution:routes] Image regenerated successfully:", result.scenes[0].imageUrl);
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
      console.error("[problem-solution:routes] image regeneration error:", error);
      res.status(500).json({ error: "Failed to regenerate image" });
    }
  }
);

/**
 * GET /api/problem-solution/voices
 * Fetches available voices from ElevenLabs with preview URLs
 */
psRouter.get(
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
      console.error("[problem-solution:routes] voices fetch error:", error);
      res.status(500).json({ error: "Failed to fetch voices" });
    }
  }
);

/**
 * GET /api/problem-solution/voice-preview/:voiceId
 * Generates voice preview audio using ElevenLabs TTS
 * Query params:
 *   - lang: 'ar' for Arabic, 'en' for English (default: uses voice default preview)
 */
psRouter.get(
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
          return res.redirect(`/api/problem-solution/voice-preview/${voiceId}`);
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
 * POST /api/problem-solution/voiceover
 * Generates voiceover audio for all scenes using ElevenLabs TTS
 */
psRouter.post(
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

      console.log("[problem-solution:routes] Generating voiceover for", scenes.length, "scenes");

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

      console.log("[problem-solution:routes] Voiceover generation complete:", {
        successful: result.scenes.filter(s => s.status === 'generated').length,
        failed: result.scenes.filter(s => s.status === 'failed').length,
        totalCost: result.totalCost,
      });

      res.json(result);
    } catch (error) {
      console.error("[problem-solution:routes] voiceover generation error:", error);
      res.status(500).json({ error: "Failed to generate voiceover" });
    }
  }
);

/**
 * POST /api/problem-solution/music
 * Generates AI background music using ElevenLabs Music API
 */
psRouter.post(
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

      console.log('[problem-solution:routes] Music generation request:', {
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
          musicStyle: musicStyle as MusicStyle,
          durationMs,
          storyTopic,
          projectName: projectName || "Untitled",
          workspaceId: workspaceId || "",
        },
        userId,
        workspaceName
      );

      console.log('[problem-solution:routes] Music generation complete:', {
        style: result.style,
        durationMs: result.durationMs,
        cost: result.cost,
      });

      res.json(result);
    } catch (error) {
      console.error("[problem-solution:routes] music generation error:", error);
      res.status(500).json({ error: "Failed to generate music" });
    }
  }
);

/**
 * POST /api/problem-solution/videos
 * Generates videos for all scenes using Image-to-Video
 */
psRouter.post(
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

      console.log('[problem-solution:routes] Video generation request:', {
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

      console.log('[problem-solution:routes] Video generation complete:', {
        successful: result.scenes.filter(s => s.status === 'generated').length,
        failed: result.scenes.filter(s => s.status === 'failed').length,
        totalCost: result.totalCost,
      });

      res.json(result);
    } catch (error) {
      console.error("[problem-solution:routes] video generation error:", error);
      res.status(500).json({ error: "Failed to generate videos" });
    }
  }
);

/**
 * POST /api/problem-solution/videos/regenerate
 * Regenerates a single scene video
 */
psRouter.post(
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

      console.log("[problem-solution:routes] Regenerating video for scene", sceneNumber, {
        imageStyle: imageStyle || "photorealistic",
      });

      // Get workspace name
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find((w) => w.id === workspaceId);
      const workspaceName = workspace?.name || workspaceId;

      // Generate single video with full context
      const result = await generateVideos(
        {
          storyId: storyId || 'temp',
          scenes: [{
            id: sceneId || `scene-${sceneNumber}`,
            sceneNumber: sceneNumber,
            imageUrl: imageUrl,
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
      console.error("[problem-solution:routes] video regeneration error:", error);
      res.status(500).json({ error: "Failed to regenerate video" });
    }
  }
);

/**
 * POST /api/problem-solution/export
 * Export final video with all scenes, audio, music, and effects
 */
psRouter.post(
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
        storyTopic,          // Topic for context-aware music generation
        voiceVolume,
        musicVolume,
        aspectRatio,
        exportFormat,
        exportQuality,
        textOverlay,
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
          console.log(`[problem-solution:routes] Hybrid mode: ${videoScenes} video scenes, ${imageOnlyScenes} image-only scenes (will animate)`);
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

      console.log("[problem-solution:routes] ═══════════════════════════════════════════════");
      console.log("[problem-solution:routes] Starting video export:");
      console.log("[problem-solution:routes]   Scene count:", scenes.length);
      console.log("[problem-solution:routes]   Animation mode:", animationMode);
      console.log("[problem-solution:routes]   Music style:", musicStyle || 'none');
      console.log("[problem-solution:routes]   Story topic:", storyTopic?.substring(0, 50) || 'N/A');
      console.log("[problem-solution:routes]   Format:", exportFormat);
      console.log("[problem-solution:routes]   Quality:", exportQuality);
      console.log("[problem-solution:routes]   Text overlay:", textOverlay);
      console.log("[problem-solution:routes] ═══════════════════════════════════════════════");

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
          storyTopic: storyTopic || '',           // For context-aware music generation
          voiceVolume: voiceVolume || 100,
          musicVolume: musicVolume || 50,
          aspectRatio: aspectRatio || '16:9',
          exportFormat: exportFormat || 'mp4',
          exportQuality: exportQuality || '1080p',
          textOverlay: textOverlay !== false,
          projectName: projectName || 'Untitled',
          workspaceId: workspaceId || 'default',
        },
        userId,
        workspaceName
      );

      console.log("[problem-solution:routes] Export complete:", {
        videoUrl: result.videoUrl,
        duration: result.duration,
        size: `${(result.size / 1024 / 1024).toFixed(2)}MB`,
      });

      res.json(result);
    } catch (error) {
      console.error("[problem-solution:routes] Export failed:", error);
      res.status(500).json({ 
        error: "Failed to export video",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

/**
 * POST /api/problem-solution/remix
 * Re-mixes audio with new volume levels
 * Used for real-time volume adjustment after initial export
 */
psRouter.post(
  "/remix",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const workspaceName = (req.headers["x-workspace-id"] as string) || "default";
      
      const {
        videoBaseUrl,
        voiceoverUrl,
        musicUrl,
        voiceVolume,
        musicVolume,
        projectName,
        workspaceId,
      } = req.body || {};

      console.log('[problem-solution:routes] Remix request:', {
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

      console.log('[problem-solution:routes] Remix complete:', {
        videoUrl: result.videoUrl,
        duration: result.duration,
        size: result.size,
      });

      res.json(result);
    } catch (error) {
      console.error("[problem-solution:routes] Remix failed:", error);
      res.status(500).json({ 
        error: "Failed to remix video",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

/**
 * POST /api/problem-solution/social-metadata
 * Generates platform-specific metadata for social media
 */
psRouter.post(
  "/social-metadata",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { platform, scriptText, duration } = req.body || {};

      // Validate platform
      const validPlatforms: SocialPlatform[] = ['youtube', 'tiktok', 'instagram', 'facebook'];
      if (!platform || !validPlatforms.includes(platform)) {
        return res.status(400).json({ 
          error: "Invalid platform. Must be one of: youtube, tiktok, instagram, facebook" 
        });
      }

      if (!scriptText || !scriptText.trim()) {
        return res.status(400).json({ error: "scriptText is required" });
      }

      if (!duration || duration < 1) {
        return res.status(400).json({ error: "duration is required and must be > 0" });
      }

      console.log('[problem-solution:routes] Generating social metadata:', {
        platform,
        scriptLength: scriptText.length,
        duration,
      });

      const result = await generateSocialMetadata(
        {
          platform,
          scriptText: scriptText.trim(),
          duration,
        },
        userId,
        req.headers["x-workspace-id"] as string | undefined
      );

      console.log('[problem-solution:routes] Social metadata generated:', {
        platform: result.platform,
        hasTitle: !!result.title,
        hasDescription: !!result.description,
        hasCaption: !!result.caption,
        cost: result.cost,
      });

      res.json(result);
    } catch (error) {
      console.error("[problem-solution:routes] Social metadata generation failed:", error);
      res.status(500).json({ 
        error: "Failed to generate social metadata",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

export { psRouter };
export default psRouter;
