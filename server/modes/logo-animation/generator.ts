// Logo Animation Generator - VEO 3.1 Video Generation

import { randomUUID } from "crypto";
import { callAi } from "../../ai/service";
import { VIDEO_MODEL_CONFIGS } from "../../ai/config/video-models";
import { getDimensions } from "../../ai/config/video-models";
import { bunnyStorage } from "../../storage/bunny-storage";
import { storage } from "../../storage";
import type { LogoGenerateRequest } from "./types";

// VEO 3.1 Configuration
const VEO_3_1_CONFIG = VIDEO_MODEL_CONFIGS["veo-3.1"];

if (!VEO_3_1_CONFIG) {
  throw new Error("VEO 3.1 configuration not found");
}

/**
 * Generate logo animation video using VEO 3.1
 */
export async function generateLogoAnimation(
  request: LogoGenerateRequest,
  userId: string
): Promise<{ taskId: string; videoUrl?: string; storyId?: string; cost?: number }> {
  const taskId = `logo-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Validate inputs
  if (!request.title || !request.visualPrompt) {
    throw new Error("Title and visual prompt are required");
  }

  if (!VEO_3_1_CONFIG.durations.includes(request.duration)) {
    throw new Error(`Duration ${request.duration}s is not supported. Supported: ${VEO_3_1_CONFIG.durations.join(", ")}`);
  }

  // VEO 3.1 constraint: When using reference images, duration must be 8 seconds
  if (request.referenceImage && request.duration !== 8) {
    throw new Error("When using reference images, duration must be 8 seconds");
  }

  if (!VEO_3_1_CONFIG.aspectRatios.includes(request.aspectRatio as any)) {
    throw new Error(`Aspect ratio ${request.aspectRatio} is not supported. Supported: ${VEO_3_1_CONFIG.aspectRatios.join(", ")}`);
  }

  if (!VEO_3_1_CONFIG.resolutions.includes(request.resolution as any)) {
    throw new Error(`Resolution ${request.resolution} is not supported. Supported: ${VEO_3_1_CONFIG.resolutions.join(", ")}`);
  }

  // Get dimensions
  const dimensions = getDimensions(request.aspectRatio as any, request.resolution as any);

  // Build video prompt
  const videoPrompt = request.visualPrompt.trim();

  // Prepare video generation payload
  // VEO 3.1 (google:3@2) supports:
  // - inputs.references for reference images (type: "asset" or "style")
  // - frameImages for first/last frame (but cannot mix with references)
  const videoPayload: Record<string, any> = {
    taskType: "videoInference" as const,
    taskUUID: randomUUID(),
    model: VEO_3_1_CONFIG.modelAirId || "google:3@2", // VEO 3.1 model AIR ID
    positivePrompt: videoPrompt,
    duration: request.duration,
    width: dimensions.width,
    height: dimensions.height,
    numberResults: 1,
    deliveryMethod: "async" as const,
    includeCost: true,
    providerSettings: {
      google: {
        generateAudio: VEO_3_1_CONFIG.hasAudio || false,
        enhancePrompt: true, // Always enabled for VEO 3.1
      },
    },
    ...(request.referenceImage && {
      // VEO 3.1 uses inputs.references for reference images
      // Cannot use both frameImages and references together
      inputs: {
        references: [{
          image: request.referenceImage.startsWith("data:") 
            ? request.referenceImage 
            : request.referenceImage,
          type: "asset" as const, // Using "asset" for logo reference
        }],
      },
    }),
  };

  try {
    // Generate video using VEO 3.1
    const response = await callAi({
      provider: "runware",
      model: "veo-3.1",
      task: "video-generation",
      payload: [videoPayload],
      runware: {
        deliveryMethod: "async",
        pollIntervalMs: 3000,
        timeoutMs: 300000, // 5 minutes
      },
    });

    // callAi returns AiResponse where output contains the results array
    const videoResults = response.output as any[];
    if (!videoResults || !Array.isArray(videoResults) || videoResults.length === 0) {
      throw new Error("Video generation failed: No result returned");
    }

    const videoData = videoResults[0];
    const totalCost = response.usage?.totalCostUsd;
    
    // Try multiple possible field names for video URL
    const videoUrl = videoData?.videoURL || videoData?.videoUrl || videoData?.imageURL || videoData?.imageUrl;
    if (!videoUrl) {
      console.error("[logo-animation:generator] Video data structure:", {
        taskUUID: videoData?.taskUUID,
        status: videoData?.status,
        error: videoData?.error,
        allKeys: Object.keys(videoData || {}),
      });
      throw new Error(`Video generation failed: No video URL in response. Status: ${videoData?.status || 'unknown'}, Error: ${videoData?.error || 'none'}`);
    }

    // Get workspace name for path
    const workspace = await storage.getWorkspace(request.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Upload video to Bunny CDN
    const videoBuffer = await fetch(videoUrl).then(r => r.arrayBuffer()).then(b => Buffer.from(b));
    
    // Build path: {userId}/{workspace}/Videos/Logo_Animation/{projectName}/final.mp4
    const cleanTitle = request.title.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "_");
    const timestamp = Date.now();
    const projectFolder = `${cleanTitle}_${timestamp}`;
    const videoPath = `${userId}/${workspace.name}/Videos/Logo_Animation/${projectFolder}/final.mp4`;
    
    await bunnyStorage.uploadFile(videoPath, videoBuffer, "video/mp4");
    const finalVideoUrl = bunnyStorage.getPublicUrl(videoPath);

    // Save to database as a story
    const story = await storage.createStory({
      userId,
      workspaceId: request.workspaceId,
      projectName: request.title,
      projectFolder: `Videos/Logo_Animation/${projectFolder}`,
      storyMode: "logo-animation",
      videoUrl: finalVideoUrl,
      duration: request.duration,
      aspectRatio: request.aspectRatio,
    });

    return {
      taskId,
      videoUrl: finalVideoUrl,
      storyId: story.id,
      cost: videoData?.cost || totalCost,
    };
  } catch (error) {
    console.error("[logo-animation:generator] Generation failed:", error);
    throw error instanceof Error ? error : new Error("Video generation failed");
  }
}

