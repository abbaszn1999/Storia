// Brand Kit Management API Routes

import { Router, type Request, type Response } from "express";
import multer from "multer";
import { z } from "zod";
import { isAuthenticated, getCurrentUserId } from "../../../auth";
import { storage } from "../../../storage";
import { insertBrandkitSchema } from "@shared/schema";
import { bunnyStorage } from "../../../storage/bunny-storage";
import { ALLOWED_LOGO_TYPES, MAX_LOGO_SIZE } from "../config";
import type { CreateBrandkitRequest, UpdateBrandkitRequest } from "../types";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_LOGO_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_LOGO_TYPES.includes(file.mimetype as any)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_LOGO_TYPES.join(", ")}`));
    }
  },
});

// Helper function to build Bunny path for brand kit logos
function buildBrandkitLogoPath(
  userId: string,
  workspaceName: string,
  brandkitId: string,
  mimeType: string
): string {
  const timestamp = Date.now();
  // Extract extension from mime type
  const extensionMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };
  const extension = extensionMap[mimeType] || "png";
  const filename = `logo_${timestamp}.${extension}`;
  
  // Clean workspace name for path safety
  const clean = (str: string) => str.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "_");
  const workspace = clean(workspaceName);
  
  return `${userId}/${workspace}/Assets/Brand_Kits/${brandkitId}/${filename}`;
}

// GET /api/brandkits - List brand kits by workspace
router.get("/", isAuthenticated, async (req: any, res: Response) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }

    const brandkits = await storage.getBrandkitsByWorkspaceId(workspaceId);
    res.json(brandkits);
  } catch (error) {
    console.error("[brandkits] Error fetching brand kits:", error);
    res.status(500).json({ error: "Failed to fetch brand kits" });
  }
});

// GET /api/brandkits/:id - Get single brand kit
router.get("/:id", isAuthenticated, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const brandkit = await storage.getBrandkit(id);
    
    if (!brandkit) {
      return res.status(404).json({ error: "Brand kit not found" });
    }

    // Verify workspace access
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === brandkit.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: "Access denied to this brand kit" });
    }

    res.json(brandkit);
  } catch (error) {
    console.error("[brandkits] Error fetching brand kit:", error);
    res.status(500).json({ error: "Failed to fetch brand kit" });
  }
});

// POST /api/brandkits - Create brand kit
router.post("/", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const validated = insertBrandkitSchema.parse(req.body);

    // Verify workspace belongs to user
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === validated.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: "Access denied to this workspace" });
    }

    const brandkit = await storage.createBrandkit(validated);
    res.json(brandkit);
  } catch (error) {
    console.error("[brandkits] Error creating brand kit:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create brand kit" });
  }
});

// PUT /api/brandkits/:id - Update brand kit
router.put("/:id", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const brandkit = await storage.getBrandkit(id);
    
    if (!brandkit) {
      return res.status(404).json({ error: "Brand kit not found" });
    }

    // Verify workspace access
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === brandkit.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: "Access denied to this brand kit" });
    }

    const updated = await storage.updateBrandkit(id, req.body);
    res.json(updated);
  } catch (error) {
    console.error("[brandkits] Error updating brand kit:", error);
    res.status(500).json({ error: "Failed to update brand kit" });
  }
});

// DELETE /api/brandkits/:id - Delete brand kit
router.delete("/:id", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const brandkit = await storage.getBrandkit(id);
    
    if (!brandkit) {
      return res.status(404).json({ error: "Brand kit not found" });
    }

    // Verify workspace access
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === brandkit.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: "Access denied to this brand kit" });
    }

    // Delete entire brand kit folder from Bunny Storage
    if (brandkit.logoUrl) {
      try {
        // Clean workspace name for path safety
        const clean = (str: string) => str.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "_");
        const workspaceName = clean(workspace.name);
        
        // Build brand kit folder path
        const brandkitFolderPath = `${userId}/${workspaceName}/Assets/Brand_Kits/${id}`;
        
        // Delete the entire folder
        await bunnyStorage.deleteFolder(brandkitFolderPath);
        console.log(`[brandkits] Deleted brand kit folder: ${brandkitFolderPath}`);
      } catch (error) {
        console.warn("[brandkits] Failed to delete brand kit folder from Bunny:", error);
        // Continue with database deletion even if Bunny delete fails
      }
    }

    await storage.deleteBrandkit(id);
    res.json({ success: true, message: "Brand kit deleted" });
  } catch (error) {
    console.error("[brandkits] Error deleting brand kit:", error);
    res.status(500).json({ error: "Failed to delete brand kit" });
  }
});

// POST /api/brandkits/:id/upload-logo - Upload brand kit logo
router.post(
  "/:id/upload-logo",
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
      const brandkit = await storage.getBrandkit(id);
      
      if (!brandkit) {
        return res.status(404).json({ error: "Brand kit not found" });
      }

      // Verify workspace access
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find((w) => w.id === brandkit.workspaceId);
      if (!workspace) {
        return res.status(403).json({ error: "Access denied to this brand kit" });
      }

      // Build Bunny path
      const bunnyPath = buildBrandkitLogoPath(userId, workspace.name, id, req.file.mimetype);
      
      // Upload to Bunny
      const cdnUrl = await bunnyStorage.uploadFile(bunnyPath, req.file.buffer, req.file.mimetype);

      // Update brand kit with new logo URL
      await storage.updateBrandkit(id, { logoUrl: cdnUrl });

      res.json({
        logoUrl: cdnUrl,
        brandkitId: id,
        success: true,
      });
    } catch (error) {
      console.error("[brandkits] Error uploading logo:", error);
      res.status(500).json({ error: "Failed to upload logo" });
    }
  }
);

export default router;

