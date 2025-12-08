// ASMR / Sensory API Routes (Express)
// ═══════════════════════════════════════════════════════════════════════════
// 4-AGENT ARCHITECTURE:
// POST /enhance        → Agent 1 (Idea Generator)
// POST /generate-image → Agent 4 (Image Generator)
// POST /generate       → Agent 2 (Prompt Engineer) → Agent 3 (Video Generator)
// ═══════════════════════════════════════════════════════════════════════════

import { Router, type Request, type Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import {
  // Agent 1: Idea Generator
  generateIdea,
  getQuickIdea,
  // Agent 2: Prompt Engineer
  engineerPrompt,
  // Agent 3: Video Generator
  generateVideo,
  checkTaskStatus,
  getModelCapabilities,
  modelHasAudio,
  // Agent 4: Image Generator
  generateImage,
  // Agent 5: Sound Effects Generator (ElevenLabs)
  generateSound,
  isSoundGenerationAvailable,
  // Agent 6: Sound Prompt Enhancer
  enhanceSoundPrompt,
} from "../agents";
import {
  VIDEO_MODEL_CONFIGS,
  ASMR_CATEGORIES,
  ASMR_MATERIALS,
  getDefaultVideoModel,
  getAvailableVideoModels,
} from "../config";
import { mergeVideoAudio, cleanupMergedFile, mergeAndUploadVideo } from "../services/video-merger";
import { loopAndServeVideo } from "../services/video-looper";
import { createReadStream, statSync } from "fs";
import type {
  ASMRGenerateRequest,
  AudioSource,
  LoopMultiplier,
} from "../types";
import { buildStoryModePath, bunnyStorage } from "../../../storage/bunny-storage";
import { storage } from "../../../storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, "../../../../temp");

async function bufferFromUrlOrPath(url: string): Promise<Buffer> {
  // Local temp path (e.g., /temp/uuid_file.mp4)
  if (url.startsWith("/temp/")) {
    const filePath = path.join(TEMP_DIR, path.basename(url));
    return fs.readFile(filePath);
  }
  // Absolute or relative local path
  if (url.startsWith("file://")) {
    return fs.readFile(url.replace("file://", ""));
  }
  if (url.startsWith("/") || url.startsWith("./") || url.startsWith("../")) {
    return fs.readFile(path.resolve(url));
  }
  // Remote fetch
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to download: ${resp.status} ${resp.statusText}`);
  const arr = await resp.arrayBuffer();
  return Buffer.from(arr);
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTER SETUP
// ═══════════════════════════════════════════════════════════════════════════

const asmrRouter = Router();

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /config
 * Returns all ASMR configuration data for frontend
 */
asmrRouter.get("/config", (_req: Request, res: Response) => {
  res.json({
    categories: ASMR_CATEGORIES,
    materials: ASMR_MATERIALS,
    models: getAvailableVideoModels(),
    defaultModel: getDefaultVideoModel(),
  });
});

/**
 * GET /models
 * Returns available video models with their capabilities
 */
asmrRouter.get("/models", (_req: Request, res: Response) => {
  res.json({
    models: getAvailableVideoModels(),
    default: getDefaultVideoModel().id,
  });
});

/**
 * GET /models/:modelId/config
 * Returns specific model configuration
 */
asmrRouter.get("/models/:modelId/config", (req: Request, res: Response) => {
  const { modelId } = req.params;
  const config = getModelCapabilities(modelId);

  if (!config) {
    return res.status(404).json({ error: `Model not found: ${modelId}` });
  }

  res.json(config);
});

// ═══════════════════════════════════════════════════════════════════════════
// AGENT 1: IDEA ENHANCEMENT ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /enhance
 * Generate creative ASMR ideas using AI (Agent 1: Idea Generator)
 * 
 * This endpoint is called when user clicks "Enhance" button
 * It uses GPT-5 to generate creative ASMR concepts
 */
asmrRouter.post("/enhance", async (req: Request, res: Response) => {
  try {
    const { prompt, categoryId } = req.body;

    // Get user context (from auth middleware in production)
    const userId = req.headers["x-user-id"] as string | undefined;
    const workspaceId = req.headers["x-workspace-id"] as string | undefined;

    console.log("[asmr-routes] Agent 1: Generating creative idea...");

    const result = await generateIdea(
      {
        userIdea: prompt,
        categoryId,
      },
      userId,
      workspaceId
    );

    res.json({
      enhancedPrompt: result.enhancedIdea,
      cost: result.cost,
    });
  } catch (error) {
    console.error("[asmr-routes] enhance error:", error);
    res.status(500).json({ error: "Failed to generate idea" });
  }
});

/**
 * POST /enhance-sound
 * Agent 6: Sound Prompt Enhancer - The ASMR Audio Architect
 * Generates or enhances ASMR sound effect prompts independently
 */
asmrRouter.post("/enhance-sound", async (req: Request, res: Response) => {
  try {
    const { prompt, visualPrompt } = req.body;

    // Get user context
    const userId = req.headers["x-user-id"] as string | undefined;
    const workspaceId = req.headers["x-workspace-id"] as string | undefined;

    console.log("[asmr-routes] Agent 6: Generating ASMR sound prompt...");

    const result = await enhanceSoundPrompt(
      {
        userPrompt: prompt || "",
        visualPrompt: visualPrompt || "",
      },
      userId,
      workspaceId
    );

    res.json({
      enhancedPrompt: result.enhancedPrompt,
      cost: result.cost,
    });
  } catch (error) {
    console.error("[asmr-routes] enhance-sound error:", error);
    res.status(500).json({ error: "Failed to enhance sound prompt" });
  }
});

/**
 * GET /quick-idea/:categoryId
 * Get quick idea for a category (no AI cost)
 */
asmrRouter.get("/quick-idea/:categoryId", (req: Request, res: Response) => {
  const { categoryId } = req.params;
  const idea = getQuickIdea(categoryId);

  if (!idea) {
    return res.status(404).json({ error: `Category not found: ${categoryId}` });
  }

  res.json({ idea });
});

// ═══════════════════════════════════════════════════════════════════════════
// AGENT 4: IMAGE GENERATION ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /generate-image
 * Generate an ASMR reference image using AI (Agent 4: Image Generator)
 * 
 * This image can be used as:
 * - Preview before video generation
 * - First frame for Image-to-Video (I2V) generation
 */
asmrRouter.post("/generate-image", async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Get user context
    const userId = req.headers["x-user-id"] as string | undefined;
    const workspaceId = req.headers["x-workspace-id"] as string | undefined;

    console.log("[asmr-routes] Agent 4: Generating reference image...");

    const result = await generateImage(
      {
        prompt,
        aspectRatio: aspectRatio || "16:9",
      },
      userId,
      workspaceId
    );

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      imageUrl: result.imageUrl,
      cost: result.cost,
    });
  } catch (error) {
    console.error("[asmr-routes] generate-image error:", error);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// VIDEO GENERATION ENDPOINTS
// Agent 2 (Prompt Engineer) → Agent 3 (Video Generator)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /generate
 * Start ASMR video generation
 * 
 * FLOW:
 * 1. Receive user's idea/prompt
 * 2. Agent 2 (Prompt Engineer) transforms it into cinematic prompt
 * 3. Agent 3 (Video Generator) generates the video via Runware
 * 4. Agent 5 (Sound Generator) generates audio if model doesn't support it natively
 */
asmrRouter.post("/generate", async (req: Request, res: Response) => {
  try {
    const body = req.body as ASMRGenerateRequest;

    // Validate required fields
    if (!body.visualPrompt || body.visualPrompt.trim().length === 0) {
      return res.status(400).json({ error: "Visual prompt is required" });
    }
    const title = (req.body.title || "").trim();
    if (!title) {
      return res.status(400).json({ error: "Title (project name) is required" });
    }
    const workspaceId = req.body.workspaceId as string | undefined;
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }

    // Get user context
    const userId = req.headers["x-user-id"] as string | undefined;
    const workspaceIdHeader = req.headers["x-workspace-id"] as string | undefined;
    const effectiveWorkspaceId = workspaceIdHeader || workspaceId;

    // Set defaults
    const modelId = body.modelId || getDefaultVideoModel().id;
    const aspectRatio = body.aspectRatio || "16:9";
    const resolution = body.resolution || "720p";
    const duration = body.duration || 4;
    const soundPrompt = body.soundPrompt;
    const audioIntensity = body.audioIntensity ?? 50;

    console.log("[asmr-routes] Starting video generation pipeline...");

    // ═══════════════════════════════════════════════════════════════════════
    // AGENT 2: PROMPT ENGINEER
    // Transform user's idea into cinematic video prompt
    // ═══════════════════════════════════════════════════════════════════════
    console.log("[asmr-routes] Agent 2: Engineering cinematic prompt...");
    
    const engineeredResult = await engineerPrompt(
      {
        idea: body.visualPrompt,
        modelId,
        duration,
        aspectRatio,
      },
      userId,
      workspaceId
    );

    console.log(`[asmr-routes] Agent 2 complete. Prompt length: ${engineeredResult.visualPrompt.length} chars`);

    // ═══════════════════════════════════════════════════════════════════════
    // AGENT 3: VIDEO GENERATOR
    // Generate video using the engineered prompt
    // ═══════════════════════════════════════════════════════════════════════
    console.log("[asmr-routes] Agent 3: Starting video generation...");

    const request: ASMRGenerateRequest = {
      modelId,
      visualPrompt: engineeredResult.visualPrompt,
      aspectRatio,
      resolution,
      duration,
      categoryId: body.categoryId,
      soundPrompt: engineeredResult.soundPrompt || soundPrompt,
      audioIntensity,
      materials: body.materials,
      firstFrameImage: body.firstFrameImage,
      lastFrameImage: body.lastFrameImage,
    };

    const videoResult = await generateVideo(request, userId, workspaceId);

    if (videoResult.status === "failed") {
      return res.status(400).json({ error: videoResult.error });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AGENT 5: SOUND GENERATOR (Conditional)
    // Generate audio only if:
    // 1. soundPrompt is provided
    // 2. Model doesn't have native audio support
    // 3. ElevenLabs is available
    // ═══════════════════════════════════════════════════════════════════════
    let audioUrl: string | undefined;
    let audioSource: AudioSource | undefined;
    let audioCost = 0;
    
    const modelSupportsAudio = modelHasAudio(modelId);
    const finalSoundPrompt = engineeredResult.soundPrompt || soundPrompt;
    
    if (modelSupportsAudio) {
      // Model generates audio natively (e.g., PixVerse v5.5, Veo 3.0)
      audioSource = "model";
      console.log("[asmr-routes] Model supports native audio - using model audio");
    } else if (finalSoundPrompt && finalSoundPrompt.trim().length > 0) {
      // Model doesn't support audio, but user provided sound prompt
      // Check if ElevenLabs is available
      if (isSoundGenerationAvailable()) {
        console.log("[asmr-routes] Agent 5: Generating sound effects via ElevenLabs...");
        
        const soundResult = await generateSound(
          {
            soundPrompt: finalSoundPrompt,
            duration,
            intensity: audioIntensity,
            categoryId: body.categoryId,
          },
          userId,
          workspaceId
        );

        if (soundResult.error) {
          console.warn("[asmr-routes] Sound generation failed:", soundResult.error);
          // Continue without audio - don't fail the whole request
        } else {
          audioCost = soundResult.cost || 0;
          console.log("[asmr-routes] Agent 5 complete. Audio generated successfully");
          
          // Immediately merge video and audio into single file
          console.log("[asmr-routes] Merging video and audio...");
          const mergeResult = await mergeAndUploadVideo(
            videoResult.videoUrl!,
            soundResult.audioDataUri
          );
          
          if (mergeResult.success && mergeResult.mergedVideoUrl) {
            // Replace video URL with merged version
            videoResult.videoUrl = mergeResult.mergedVideoUrl;
            audioSource = "merged"; // Audio is now part of the video
            console.log("[asmr-routes] Video and audio merged successfully:", mergeResult.mergedVideoUrl);
          } else {
            // Fallback to separate audio if merge fails
            console.warn("[asmr-routes] Merge failed, using separate audio:", mergeResult.error);
            audioUrl = soundResult.audioDataUri;
            audioSource = "elevenlabs";
          }
        }
      } else {
        console.log("[asmr-routes] ElevenLabs not available - skipping audio generation");
      }
    } else {
      console.log("[asmr-routes] No sound prompt provided - video will be silent");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LOOP MULTIPLIER (Final Step)
    // If loopMultiplier > 1, repeat the final video N times
    // ═══════════════════════════════════════════════════════════════════════
    const loopMultiplier = (body.loopMultiplier || 1) as LoopMultiplier;
    
    if (loopMultiplier > 1 && videoResult.videoUrl) {
      console.log(`[asmr-routes] Applying loop multiplier: ${loopMultiplier}x`);
      
      const loopResult = await loopAndServeVideo(
        videoResult.videoUrl,
        loopMultiplier
      );
      
      if (loopResult.success && loopResult.loopedVideoUrl) {
        videoResult.videoUrl = loopResult.loopedVideoUrl;
        console.log(`[asmr-routes] Video looped ${loopMultiplier}x successfully`);
      } else {
        console.warn("[asmr-routes] Loop failed, using original video:", loopResult.error);
      }
    }

    // Calculate total cost
    const totalCost = (videoResult.cost || 0) + (engineeredResult.cost || 0) + audioCost;

    // Final upload to Bunny (only final artifact)
    if (!videoResult.videoUrl) {
      return res.status(500).json({ error: "No final video URL to upload" });
    }

    // Derive workspace name for path (best-effort)
    let workspaceName = String(effectiveWorkspaceId || "workspace");
    if (userId && effectiveWorkspaceId) {
      try {
        const workspaces = await storage.getWorkspacesByUserId(userId);
        const ws = workspaces.find(w => w.id === effectiveWorkspaceId);
        if (ws?.name) workspaceName = ws.name;
      } catch (e) {
        console.warn("[asmr-routes] Unable to resolve workspace name, using id");
      }
    }

    const filename = `${Date.now()}.mp4`;
    const bunnyPath = buildStoryModePath({
      userId: userId || "public",
      workspaceName,
      toolMode: "asmr",
      projectName: title,
      filename,
    });

    const finalBuffer = await bufferFromUrlOrPath(videoResult.videoUrl);
    const cdnUrl = await bunnyStorage.uploadFile(bunnyPath, finalBuffer, "video/mp4");

    // Persist story record
    const story = await storage.createStory({
      workspaceId: effectiveWorkspaceId!,
      title,
      template: "asmr-sensory",
      aspectRatio,
      duration,
      exportUrl: cdnUrl,
    });

    // Cleanup local temp if applicable
    if (videoResult.videoUrl.startsWith("/temp/")) {
      const filePath = path.join(TEMP_DIR, path.basename(videoResult.videoUrl));
      fs.unlink(filePath).catch(() => {});
    }

    // Include all results in response (with Bunny URL)
    res.json({
      ...videoResult,
      videoUrl: cdnUrl,
      audioUrl,
      audioSource,
      cost: totalCost,
      engineeringCost: engineeredResult.cost,
      audioCost,
      engineeredPrompt: engineeredResult.visualPrompt,
      engineeredSoundPrompt: engineeredResult.soundPrompt,
      storyId: story.id,
    });
  } catch (error) {
    console.error("[asmr-routes] generate error:", error);
    res.status(500).json({ error: "Failed to start video generation" });
  }
});

/**
 * GET /status/:taskId
 * Check video generation status
 */
asmrRouter.get("/status/:taskId", async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required" });
    }

    // Get user context
    const userId = req.headers["x-user-id"] as string | undefined;
    const workspaceId = req.headers["x-workspace-id"] as string | undefined;

    const result = await checkTaskStatus(taskId, userId, workspaceId);

    res.json({
      taskId,
      ...result,
    });
  } catch (error) {
    console.error("[asmr-routes] status check error:", error);
    res.status(500).json({ error: "Failed to check status" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORIES & MATERIALS ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /categories
 * Returns all ASMR categories
 */
asmrRouter.get("/categories", (_req: Request, res: Response) => {
  res.json({ categories: ASMR_CATEGORIES });
});

/**
 * GET /categories/:categoryId
 * Returns specific category details
 */
asmrRouter.get("/categories/:categoryId", (req: Request, res: Response) => {
  const { categoryId } = req.params;
  const category = ASMR_CATEGORIES.find((cat) => cat.id === categoryId);

  if (!category) {
    return res.status(404).json({ error: `Category not found: ${categoryId}` });
  }

  res.json(category);
});

/**
 * GET /materials
 * Returns all available materials
 */
asmrRouter.get("/materials", (_req: Request, res: Response) => {
  res.json({ materials: ASMR_MATERIALS });
});

// ═══════════════════════════════════════════════════════════════════════════
// VIDEO + AUDIO MERGE ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /merge
 * Merges video and audio files into a single downloadable file
 * 
 * Request body:
 * - videoUrl: URL of the video file
 * - audioUrl: URL of the audio file
 * 
 * Response: Merged video file stream
 */
asmrRouter.post("/merge", async (req: Request, res: Response) => {
  try {
    const { videoUrl, audioUrl } = req.body;
    
    if (!videoUrl || !audioUrl) {
      return res.status(400).json({ 
        error: "Both videoUrl and audioUrl are required" 
      });
    }
    
    console.log("[asmr-routes] Starting video/audio merge...");
    console.log("[asmr-routes] Video URL:", videoUrl.substring(0, 50) + "...");
    console.log("[asmr-routes] Audio URL:", audioUrl.substring(0, 50) + "...");
    
    const result = await mergeVideoAudio({ videoUrl, audioUrl });
    
    if (!result.success || !result.outputPath) {
      return res.status(500).json({ 
        error: result.error || "Merge failed" 
      });
    }
    
    // Get file stats
    const stat = statSync(result.outputPath);
    
    // Set headers for file download
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Length", stat.size);
    res.setHeader(
      "Content-Disposition", 
      'attachment; filename="asmr-video-with-audio.mp4"'
    );
    
    // Stream the file
    const fileStream = createReadStream(result.outputPath);
    
    fileStream.on("end", () => {
      // Cleanup after streaming
      cleanupMergedFile(result.outputPath!);
      console.log("[asmr-routes] Merge complete, file streamed and cleaned up");
    });
    
    fileStream.on("error", (err) => {
      console.error("[asmr-routes] Stream error:", err);
      cleanupMergedFile(result.outputPath!);
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error("[asmr-routes] Merge endpoint error:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Merge failed" 
    });
  }
});

export { asmrRouter };
export default asmrRouter;
