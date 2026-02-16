// Location Management API Routes

import { Router, type Request, type Response } from "express";
import multer from "multer";
import { z } from "zod";
import { isAuthenticated, getCurrentUserId } from "../../../auth";
import { storage } from "../../../storage";
import { insertLocationSchema } from "@shared/schema";
import { bunnyStorage } from "../../../storage/bunny-storage";
import { MAX_REFERENCE_IMAGES, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "../config";
import type { CreateLocationRequest, UpdateLocationRequest } from "../types";
import { generateLocationImage } from "../agents/location-image-generator";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype as any)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`));
    }
  },
});

// Helper function to build Bunny path for location images
function buildLocationImagePath(
  userId: string,
  workspaceName: string,
  locationId: string,
  imageType: "main" | "reference",
  mimeType: string,
  index?: number
): string {
  const timestamp = Date.now();
  // Extract extension from mime type
  const extensionMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensionMap[mimeType] || "png";
  const filename = imageType === "main" ? `main_${timestamp}.${extension}` : `ref${index || 1}_${timestamp}.${extension}`;
  
  // Clean workspace name for path safety
  const clean = (str: string) => str.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "_");
  const workspace = clean(workspaceName);
  
  return `${userId}/${workspace}/Assets/Locations/${locationId}/${filename}`;
}

// GET /api/locations - List locations by workspace
router.get("/", isAuthenticated, async (req: any, res: Response) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }

    const locations = await storage.getLocationsByWorkspaceId(workspaceId);
    res.json(locations);
  } catch (error) {
    console.error("[locations] Error fetching locations:", error);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

// GET /api/locations/:id - Get single location
router.get("/:id", isAuthenticated, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const location = await storage.getLocation(id);
    
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    // Verify workspace access
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === location.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: "Access denied to this location" });
    }

    res.json(location);
  } catch (error) {
    console.error("[locations] Error fetching location:", error);
    res.status(500).json({ error: "Failed to fetch location" });
  }
});

// POST /api/locations - Create location
router.post("/", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const validated = insertLocationSchema.parse(req.body);

    // Verify workspace belongs to user
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === validated.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: "Access denied to this workspace" });
    }

    const location = await storage.createLocation(validated);
    res.json(location);
  } catch (error) {
    console.error("[locations] Error creating location:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create location" });
  }
});

// PUT /api/locations/:id - Update location
router.put("/:id", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const location = await storage.getLocation(id);
    
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    // Verify workspace access
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === location.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: "Access denied to this location" });
    }

    // Validate reference images limit
    if (req.body.referenceImages && Array.isArray(req.body.referenceImages)) {
      if (req.body.referenceImages.length > MAX_REFERENCE_IMAGES) {
        return res.status(400).json({
          error: `Maximum ${MAX_REFERENCE_IMAGES} reference images allowed`,
        });
      }
    }

    const updated = await storage.updateLocation(id, req.body);
    res.json(updated);
  } catch (error) {
    console.error("[locations] Error updating location:", error);
    res.status(500).json({ error: "Failed to update location" });
  }
});

// DELETE /api/locations/:id - Delete location
router.delete("/:id", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const location = await storage.getLocation(id);
    
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    // Verify workspace access
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === location.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: "Access denied to this location" });
    }

    // Delete entire location folder from Bunny Storage
    if (location.imageUrl || (location.referenceImages && (location.referenceImages as string[]).length > 0)) {
      try {
        // Clean workspace name for path safety
        const clean = (str: string) => str.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "_");
        const workspaceName = clean(workspace.name);
        
        // Build location folder path
        const locationFolderPath = `${userId}/${workspaceName}/Assets/Locations/${id}`;
        
        // Delete the entire folder
        await bunnyStorage.deleteFolder(locationFolderPath);
        console.log(`[locations] Deleted location folder: ${locationFolderPath}`);
      } catch (error) {
        console.warn("[locations] Failed to delete location folder from Bunny:", error);
        // Continue with database deletion even if Bunny delete fails
      }
    }

    await storage.deleteLocation(id);
    res.json({ success: true, message: "Location deleted" });
  } catch (error) {
    console.error("[locations] Error deleting location:", error);
    res.status(500).json({ error: "Failed to delete location" });
  }
});

// POST /api/locations/:id/upload-image - Upload main location image
router.post(
  "/:id/upload-image",
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
      const location = await storage.getLocation(id);
      
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }

      // Verify workspace access
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find((w) => w.id === location.workspaceId);
      if (!workspace) {
        return res.status(403).json({ error: "Access denied to this location" });
      }

      // Build Bunny path
      const bunnyPath = buildLocationImagePath(userId, workspace.name, id, "main", req.file.mimetype);
      
      // Upload to Bunny
      const cdnUrl = await bunnyStorage.uploadFile(bunnyPath, req.file.buffer, req.file.mimetype);

      // Update location with new image URL
      await storage.updateLocation(id, { imageUrl: cdnUrl });

      res.json({
        imageUrl: cdnUrl,
        locationId: id,
        imageType: "main",
        success: true,
      });
    } catch (error) {
      console.error("[locations] Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  }
);

// POST /api/locations/:id/generate-image - Generate main location image using AI
router.post(
  "/:id/generate-image",
  isAuthenticated,
  async (req: any, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const { artStyleDescription, negativePrompt, referenceImages, styleReferenceImage } = req.body;

      const location = await storage.getLocation(id);
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }

      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find((w) => w.id === location.workspaceId);
      if (!workspace) {
        return res.status(403).json({ error: "Access denied to this location" });
      }

      if (!location.name || !location.description) {
        return res.status(400).json({ error: "Location name and description are required for image generation." });
      }

      console.log(`[locations:routes] Generating image for location ${location.id} with model nano-banana`);

      // Call Agent 2.4: Location Image Generator
      // Hard-coded to nano-banana model for assets library
      const result = await generateLocationImage(
        {
          name: location.name,
          description: location.description,
          details: location.details || undefined,
          artStyleDescription,
          model: "nano-banana", // Hard-coded for assets library
          negativePrompt,
          referenceImages,
          styleReferenceImage,
        },
        userId,
        workspace.id,
        'assets',
        'location'
      );

      if (result.error) {
        return res.status(500).json({ error: result.error });
      }

      if (!result.imageUrl) {
        return res.status(500).json({ error: "AI did not return an image URL." });
      }

      // Download the generated image and upload to Bunny CDN
      const imageResponse = await fetch(result.imageUrl);
      if (!imageResponse.ok) {
        return res.status(500).json({ error: "Failed to download generated image" });
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const contentType = imageResponse.headers.get("content-type") || "image/png";

      // Build Bunny path for the generated image
      const bunnyPath = buildLocationImagePath(userId, workspace.name, id, "main", contentType);
      
      // Upload to Bunny CDN
      const cdnUrl = await bunnyStorage.uploadFile(bunnyPath, imageBuffer, contentType);

      // Update location with new image URL
      await storage.updateLocation(id, { imageUrl: cdnUrl });

      console.log("[locations] AI-generated image saved successfully:", {
        locationId: id,
        cdnUrl: cdnUrl.substring(0, 50) + "...",
        cost: result.cost,
      });

      res.json({
        imageUrl: cdnUrl,
        locationId: id,
        imageType: "main",
        success: true,
        cost: result.cost,
      });
    } catch (error) {
      console.error("[locations] Error generating location image:", error);
      res.status(500).json({ error: "Failed to generate location image" });
    }
  }
);

export default router;

