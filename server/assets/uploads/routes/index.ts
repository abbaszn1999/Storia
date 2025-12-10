// Upload Management API Routes

import { Router, type Request, type Response } from "express";
import multer from "multer";
import { z } from "zod";
import { isAuthenticated, getCurrentUserId } from "../../../auth";
import { storage } from "../../../storage";
import { insertUploadSchema } from "@shared/schema";
import { bunnyStorage } from "../../../storage/bunny-storage";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, isImageType, isVideoType } from "../config";
import type { UpdateUploadRequest } from "../types";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_FILE_TYPES.includes(file.mimetype as any)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`));
    }
  },
});

// Helper function to build Bunny path for uploads
function buildUploadPath(
  userId: string,
  workspaceName: string,
  fileName: string,
  mimeType: string
): string {
  const timestamp = Date.now();
  
  // Get extension from filename or mime type
  const extensionFromName = fileName.includes('.') ? fileName.split('.').pop() : null;
  const extensionMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
    "video/x-msvideo": "avi",
  };
  const extension = extensionFromName || extensionMap[mimeType] || "bin";
  
  // Determine subfolder based on file type (Images or Videos)
  const subfolder = isImageType(mimeType) ? "Images" : "Videos";
  
  // Clean filename for path safety and add timestamp for uniqueness
  const baseName = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
  const cleanBaseName = baseName
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_{2,}/g, "_");
  const finalFileName = `${cleanBaseName}_${timestamp}.${extension}`;
  
  // Clean workspace name for path safety
  const clean = (str: string) => str.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "_");
  const workspace = clean(workspaceName);
  
  // Structure: /{userId}/{workspaceName}/Assets/Uploads/Images/ or /Videos/
  return `${userId}/${workspace}/Assets/Uploads/${subfolder}/${finalFileName}`;
}

// Helper to get file type category
function getFileTypeCategory(mimeType: string): "image" | "video" {
  return isImageType(mimeType) ? "image" : "video";
}

// GET /api/uploads - List uploads by workspace
router.get("/", isAuthenticated, async (req: any, res: Response) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }

    const uploads = await storage.getUploadsByWorkspaceId(workspaceId);
    res.json(uploads);
  } catch (error) {
    console.error("[uploads] Error fetching uploads:", error);
    res.status(500).json({ error: "Failed to fetch uploads" });
  }
});

// GET /api/uploads/:id - Get single upload
router.get("/:id", isAuthenticated, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const uploadRecord = await storage.getUpload(id);
    
    if (!uploadRecord) {
      return res.status(404).json({ error: "Upload not found" });
    }

    // Verify workspace access
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === uploadRecord.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: "Access denied to this upload" });
    }

    res.json(uploadRecord);
  } catch (error) {
    console.error("[uploads] Error fetching upload:", error);
    res.status(500).json({ error: "Failed to fetch upload" });
  }
});

// POST /api/uploads - Upload file and create record
router.post(
  "/",
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

      const { workspaceId, name, description } = req.body;
      
      if (!workspaceId) {
        return res.status(400).json({ error: "workspaceId is required" });
      }

      // Verify workspace belongs to user
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find((w) => w.id === workspaceId);
      if (!workspace) {
        return res.status(403).json({ error: "Access denied to this workspace" });
      }

      // Build Bunny path (organized into Images/ or Videos/ subfolders)
      const bunnyPath = buildUploadPath(
        userId,
        workspace.name,
        req.file.originalname,
        req.file.mimetype
      );
      
      // Upload to Bunny
      const cdnUrl = await bunnyStorage.uploadFile(bunnyPath, req.file.buffer, req.file.mimetype);

      // Create upload record
      const uploadData = {
        workspaceId,
        name: name || req.file.originalname,
        description: description || null,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        storageUrl: cdnUrl,
      };

      const uploadRecord = await storage.createUpload(uploadData);

      res.json({
        upload: uploadRecord,
        success: true,
      });
    } catch (error) {
      console.error("[uploads] Error creating upload:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  }
);

// PUT /api/uploads/:id - Update upload metadata
router.put("/:id", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const uploadRecord = await storage.getUpload(id);
    
    if (!uploadRecord) {
      return res.status(404).json({ error: "Upload not found" });
    }

    // Verify workspace access
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === uploadRecord.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: "Access denied to this upload" });
    }

    // Only allow updating name and description
    const { name, description } = req.body as UpdateUploadRequest;
    const updates: Partial<typeof uploadRecord> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    const updated = await storage.updateUpload(id, updates);
    res.json(updated);
  } catch (error) {
    console.error("[uploads] Error updating upload:", error);
    res.status(500).json({ error: "Failed to update upload" });
  }
});

// DELETE /api/uploads/:id - Delete upload
router.delete("/:id", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const uploadRecord = await storage.getUpload(id);
    
    if (!uploadRecord) {
      return res.status(404).json({ error: "Upload not found" });
    }

    // Verify workspace access
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === uploadRecord.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: "Access denied to this upload" });
    }

    // Delete file from Bunny Storage
    if (uploadRecord.storageUrl) {
      try {
        // Extract path from URL and delete the file
        const urlParts = new URL(uploadRecord.storageUrl);
        const filePath = urlParts.pathname.replace(/^\//, '');
        await bunnyStorage.deleteFile(filePath);
        console.log(`[uploads] Deleted file from Bunny: ${filePath}`);
      } catch (error) {
        console.warn("[uploads] Failed to delete file from Bunny:", error);
        // Continue with database deletion even if Bunny delete fails
      }
    }

    await storage.deleteUpload(id);
    res.json({ success: true, message: "Upload deleted" });
  } catch (error) {
    console.error("[uploads] Error deleting upload:", error);
    res.status(500).json({ error: "Failed to delete upload" });
  }
});

export default router;

