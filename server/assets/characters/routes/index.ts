// Character Management API Routes

import { Router, type Request, type Response } from "express";
import multer from "multer";
import { z } from "zod";
import { isAuthenticated, getCurrentUserId } from "../../../auth";
import { storage } from "../../../storage";
import { insertCharacterSchema } from "@shared/schema";
import { bunnyStorage } from "../../../storage/bunny-storage";
import { MAX_REFERENCE_IMAGES, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "../config";
import type { CreateCharacterRequest, UpdateCharacterRequest } from "../types";
import { generateCharacterImage } from "../agents/character-image-generator";

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

// Helper function to build Bunny path for character images
function buildCharacterImagePath(
  userId: string,
  workspaceName: string,
  characterId: string,
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
  
  return `${userId}/${workspace}/Assets/Characters/${characterId}/${filename}`;
}

// GET /api/characters - List characters by workspace
router.get("/", isAuthenticated, async (req: any, res: Response) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId is required" });
    }

    const characters = await storage.getCharactersByWorkspaceId(workspaceId);
    res.json(characters);
  } catch (error) {
    console.error("[characters] Error fetching characters:", error);
    res.status(500).json({ error: "Failed to fetch characters" });
  }
});

// GET /api/characters/:id - Get single character
router.get("/:id", isAuthenticated, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const character = await storage.getCharacter(id);
    
    if (!character) {
      return res.status(404).json({ error: "Character not found" });
    }

    // Verify workspace access
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === character.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: "Access denied to this character" });
    }

    res.json(character);
  } catch (error) {
    console.error("[characters] Error fetching character:", error);
    res.status(500).json({ error: "Failed to fetch character" });
  }
});

// POST /api/characters - Create character
router.post("/", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const validated = insertCharacterSchema.parse(req.body);

    // Verify workspace belongs to user
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === validated.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: "Access denied to this workspace" });
    }

    const character = await storage.createCharacter(validated);
    res.json(character);
  } catch (error) {
    console.error("[characters] Error creating character:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create character" });
  }
});

// PUT /api/characters/:id - Update character
router.put("/:id", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const character = await storage.getCharacter(id);
    
    if (!character) {
      return res.status(404).json({ error: "Character not found" });
    }

    // Verify workspace access
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === character.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: "Access denied to this character" });
    }

    // Validate reference images limit
    if (req.body.referenceImages && Array.isArray(req.body.referenceImages)) {
      if (req.body.referenceImages.length > MAX_REFERENCE_IMAGES) {
        return res.status(400).json({
          error: `Maximum ${MAX_REFERENCE_IMAGES} reference images allowed`,
        });
      }
    }

    const updated = await storage.updateCharacter(id, req.body);
    res.json(updated);
  } catch (error) {
    console.error("[characters] Error updating character:", error);
    res.status(500).json({ error: "Failed to update character" });
  }
});

// DELETE /api/characters/:id - Delete character
router.delete("/:id", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const character = await storage.getCharacter(id);
    
    if (!character) {
      return res.status(404).json({ error: "Character not found" });
    }

    // Verify workspace access
    const workspaces = await storage.getWorkspacesByUserId(userId);
    const workspace = workspaces.find((w) => w.id === character.workspaceId);
    if (!workspace) {
      return res.status(403).json({ error: "Access denied to this character" });
    }

    // Delete entire character folder from Bunny Storage
    if (character.imageUrl || (character.referenceImages && Array.isArray(character.referenceImages) && character.referenceImages.length > 0)) {
      try {
        // Clean workspace name for path safety
        const clean = (str: string) => str.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "_");
        const workspaceName = clean(workspace.name);
        
        // Build character folder path
        const characterFolderPath = `${userId}/${workspaceName}/Assets/Characters/${id}`;
        
        // Delete the entire folder
        await bunnyStorage.deleteFolder(characterFolderPath);
        console.log(`[characters] Deleted character folder: ${characterFolderPath}`);
      } catch (error) {
        console.warn("[characters] Failed to delete character folder from Bunny:", error);
        // Continue with database deletion even if Bunny delete fails
      }
    }

    await storage.deleteCharacter(id);
    res.json({ success: true, message: "Character deleted" });
  } catch (error) {
    console.error("[characters] Error deleting character:", error);
    res.status(500).json({ error: "Failed to delete character" });
  }
});

// POST /api/characters/:id/upload-image - Upload main character image
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
      const character = await storage.getCharacter(id);
      
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }

      // Verify workspace access
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find((w) => w.id === character.workspaceId);
      if (!workspace) {
        return res.status(403).json({ error: "Access denied to this character" });
      }

      // Build Bunny path
      const bunnyPath = buildCharacterImagePath(userId, workspace.name, id, "main", req.file.mimetype);
      
      // Upload to Bunny
      const cdnUrl = await bunnyStorage.uploadFile(bunnyPath, req.file.buffer, req.file.mimetype);

      // Update character with new image URL
      await storage.updateCharacter(id, { imageUrl: cdnUrl });

      res.json({
        imageUrl: cdnUrl,
        characterId: id,
        imageType: "main",
        success: true,
      });
    } catch (error) {
      console.error("[characters] Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  }
);

// POST /api/characters/:id/generate-image - Generate AI character image
// Uses hard-coded nano-banana model for character assets library
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

      const character = await storage.getCharacter(id);
      
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }

      // Verify workspace access
      const workspaces = await storage.getWorkspacesByUserId(userId);
      const workspace = workspaces.find((w) => w.id === character.workspaceId);
      if (!workspace) {
        return res.status(403).json({ error: "Access denied to this character" });
      }

      // Validate character has required fields for image generation
      if (!character.appearance) {
        return res.status(400).json({ 
          error: "Character appearance is required for image generation" 
        });
      }

      if (!character.personality) {
        return res.status(400).json({
          error: "Character personality is required for image generation"
        });
      }

      console.log("[characters] Generating AI image for character:", {
        characterId: id,
        characterName: character.name,
        model: "nano-banana",
        hasArtStyle: !!artStyleDescription,
        hasReferenceImages: referenceImages && referenceImages.length > 0,
      });

      // Generate character image using Agent 2.3
      // Hard-coded to nano-banana model for character assets library
      const result = await generateCharacterImage(
        {
          name: character.name,
          appearance: character.appearance,
          personality: character.personality, // Mandatory - validated above
          artStyleDescription,
          model: "nano-banana", // Hard-coded for assets library
          negativePrompt,
          referenceImages,
          styleReferenceImage,
        },
        userId,
        workspace.id
      );

      if (result.error || !result.imageUrl) {
        console.error("[characters] AI image generation failed:", result.error);
        return res.status(500).json({ 
          error: "Failed to generate character image",
          details: result.error 
        });
      }

      console.log("[characters] AI image generated, downloading to CDN:", {
        generatedUrl: result.imageUrl.substring(0, 50) + "...",
        cost: result.cost,
      });

      // Download the generated image and upload to Bunny CDN
      const imageResponse = await fetch(result.imageUrl);
      if (!imageResponse.ok) {
        return res.status(500).json({ error: "Failed to download generated image" });
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const contentType = imageResponse.headers.get("content-type") || "image/png";

      // Build Bunny path for the generated image
      const bunnyPath = buildCharacterImagePath(userId, workspace.name, id, "main", contentType);
      
      // Upload to Bunny CDN
      const cdnUrl = await bunnyStorage.uploadFile(bunnyPath, imageBuffer, contentType);

      // Update character with new image URL
      await storage.updateCharacter(id, { imageUrl: cdnUrl });

      console.log("[characters] AI-generated image saved successfully:", {
        characterId: id,
        cdnUrl: cdnUrl.substring(0, 50) + "...",
        cost: result.cost,
      });

      res.json({
        imageUrl: cdnUrl,
        characterId: id,
        cost: result.cost,
        success: true,
      });
    } catch (error) {
      console.error("[characters] Error generating AI image:", error);
      res.status(500).json({ 
        error: "Failed to generate character image",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

export default router;

