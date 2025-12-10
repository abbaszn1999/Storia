// Voice Management API Routes

import { Router, type Request, type Response } from "express";
import multer from "multer";
import { z } from "zod";
import { isAuthenticated, getCurrentUserId } from "../../../auth";
import { storage } from "../../../storage";
import { insertVoiceSchema } from "@shared/schema";
import { bunnyStorage } from "../../../storage/bunny-storage";
import { ALLOWED_AUDIO_TYPES, MAX_AUDIO_SIZE } from "../config";
import type { CreateVoiceRequest, UpdateVoiceRequest } from "../types";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AUDIO_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_AUDIO_TYPES.includes(file.mimetype as any)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_AUDIO_TYPES.join(", ")}`));
    }
  },
});

// Helper function to build Bunny path for voice audio samples
function buildVoiceAudioPath(
  userId: string,
  workspaceName: string,
  voiceId: string,
  mimeType: string
): string {
  const timestamp = Date.now();
  // Extract extension from mime type
  const extensionMap: Record<string, string> = {
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/ogg": "ogg",
    "audio/webm": "webm",
  };
  const extension = extensionMap[mimeType] || "mp3";
  const filename = `sample_${timestamp}.${extension}`;
  
  // Clean workspace name for path safety
  const clean = (str: string) => str.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "_");
  const workspace = clean(workspaceName);
  
  return `${userId}/${workspace}/Assets/Voices/${voiceId}/${filename}`;
}

// GET /api/voices - List voices by workspace
router.get("/", isAuthenticated, async (req: any, res: Response) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }

    const voices = await storage.getVoicesByWorkspaceId(workspaceId);
    res.json(voices);
  } catch (error) {
    console.error("[voices] Error fetching voices:", error);
    res.status(500).json({ error: "Failed to fetch voices" });
  }
});

// GET /api/voices/:id - Get single voice
router.get("/:id", isAuthenticated, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const voice = await storage.getVoice(id);
    
    if (!voice) {
      return res.status(404).json({ error: "Voice not found" });
    }

    // Verify workspace access
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === voice.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: "Access denied to this voice" });
    }

    res.json(voice);
  } catch (error) {
    console.error("[voices] Error fetching voice:", error);
    res.status(500).json({ error: "Failed to fetch voice" });
  }
});

// POST /api/voices - Create voice
router.post("/", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const validated = insertVoiceSchema.parse(req.body);

    // Verify workspace belongs to user
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === validated.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: "Access denied to this workspace" });
    }

    const voice = await storage.createVoice(validated);
    res.json(voice);
  } catch (error) {
    console.error("[voices] Error creating voice:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create voice" });
  }
});

// PUT /api/voices/:id - Update voice
router.put("/:id", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const voice = await storage.getVoice(id);
    
    if (!voice) {
      return res.status(404).json({ error: "Voice not found" });
    }

    // Verify workspace access
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === voice.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: "Access denied to this voice" });
    }

    const updated = await storage.updateVoice(id, req.body);
    res.json(updated);
  } catch (error) {
    console.error("[voices] Error updating voice:", error);
    res.status(500).json({ error: "Failed to update voice" });
  }
});

// DELETE /api/voices/:id - Delete voice
router.delete("/:id", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const voice = await storage.getVoice(id);
    
    if (!voice) {
      return res.status(404).json({ error: "Voice not found" });
    }

    // Verify workspace access
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === voice.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: "Access denied to this voice" });
    }

    // Delete entire voice folder from Bunny Storage
    if (voice.sampleUrl) {
      try {
        // Clean workspace name for path safety
        const clean = (str: string) => str.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "_");
        const workspaceName = clean(workspace.name);
        
        // Build voice folder path
        const voiceFolderPath = `${userId}/${workspaceName}/Assets/Voices/${id}`;
        
        // Delete the entire folder
        await bunnyStorage.deleteFolder(voiceFolderPath);
        console.log(`[voices] Deleted voice folder: ${voiceFolderPath}`);
      } catch (error) {
        console.warn("[voices] Failed to delete voice folder from Bunny:", error);
        // Continue with database deletion even if Bunny delete fails
      }
    }

    await storage.deleteVoice(id);
    res.json({ success: true, message: "Voice deleted" });
  } catch (error) {
    console.error("[voices] Error deleting voice:", error);
    res.status(500).json({ error: "Failed to delete voice" });
  }
});

// POST /api/voices/:id/upload-sample - Upload voice audio sample
router.post(
  "/:id/upload-sample",
  isAuthenticated,
  upload.single("file"),
  async (req: any, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { id } = req.params;
      const voice = await storage.getVoice(id);
      
      if (!voice) {
        return res.status(404).json({ error: "Voice not found" });
      }

      // Verify workspace access
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find((w) => w.id === voice.workspaceId);
      if (!workspace) {
        return res.status(403).json({ error: "Access denied to this voice" });
      }

      // Build Bunny path
      const bunnyPath = buildVoiceAudioPath(userId, workspace.name, id, req.file.mimetype);
      
      // Upload to Bunny
      const cdnUrl = await bunnyStorage.uploadFile(bunnyPath, req.file.buffer, req.file.mimetype);

      // Update voice with new audio URL
      await storage.updateVoice(id, { sampleUrl: cdnUrl });

      res.json({
        audioUrl: cdnUrl,
        voiceId: id,
        success: true,
      });
    } catch (error) {
      console.error("[voices] Error uploading audio sample:", error);
      res.status(500).json({ error: "Failed to upload audio sample" });
    }
  }
);

export default router;

