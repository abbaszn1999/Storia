# Bunny Storage Integration Guide

This document provides a comprehensive guide for integrating Bunny CDN Storage with Storia's tools and modes. Follow this guide when creating new tools/modes or modifying existing storage paths.

---

## Table of Contents

1. [Overview](#overview)
2. [Folder Structure](#folder-structure)
3. [Environment Configuration](#environment-configuration)
4. [Core Storage Service](#core-storage-service)
5. [Path Builder Helpers](#path-builder-helpers)
6. [Integration Patterns](#integration-patterns)
7. [Database Persistence](#database-persistence)
8. [Authentication Requirements](#authentication-requirements)
9. [Adding a New Tool/Mode](#adding-a-new-toolmode)
10. [Examples](#examples)

---

## Overview

Storia uses Bunny CDN Storage for persistent file storage. All user-generated content (videos, images, audio) is uploaded to Bunny and served via CDN URLs. The storage is organized by user, workspace, and tool/mode.

**Key Principles:**
- Files are organized by `userId` → `workspaceName` → `mode` → `tool` → `project`
- All paths are tenant-scoped (user ID prefix) for security
- Final outputs go to `Rendered/` folders; temporary files go to `temp/`
- Database records store the Bunny CDN URL as `exportUrl`

---

## Folder Structure

```
/{user_id}/
  └── {workspace_name}/
      ├── video_mode/
      │   └── {Tool_Mode}/                    # e.g., narrative, ambient, commerce
      │       └── {Project_Name_createDate}/
      │           ├── Rendered/               # Final exported content
      │           │   ├── Final/              # Final exported videos
      │           │   ├── Shots/              # Individual shot renders
      │           │   ├── Images/             # Generated images
      │           │   └── Voice-Over/         # Voice-over audio files
      │           └── temp/                   # Temporary files (48h retention)
      ├── Story_Mode/
      │   └── {Tool_Mode}/                    # e.g., asmr, before-after, myth-busting
      │       └── {Project_Name_createDate}/
      │           └── Rendered/               # Final exported videos
      └── Assets/
          ├── Characters/                     # Character images/data
          ├── Uploads/
          │   ├── Images/                     # User-uploaded images
          │   └── Videos/                     # User-uploaded videos
          ├── Voices/                         # Voice samples/profiles
          ├── Brand_Kits/                     # Brand assets (logos, colors)
          └── Locations/                      # Location images/data
```

### Path Components

| Component | Description | Example |
|-----------|-------------|---------|
| `{user_id}` | Authenticated user's UUID | `9747e448-364b-49ff-afeb-0b4d6a57e358` |
| `{workspace_name}` | User's workspace name (sanitized) | `My_Workspace` |
| `{Tool_Mode}` | The specific tool within a mode | `narrative`, `asmr`, `commerce` |
| `{Project_Name_createDate}` | Project title + creation date | `My_Video_20241208` |

---

## Environment Configuration

Add these variables to your `.env` file:

```env
# Bunny CDN Storage
BUNNY_STORAGE_ZONE=your-storage-zone-name
BUNNY_STORAGE_API_KEY=your-api-key
BUNNY_CDN_URL=https://your-zone.b-cdn.net
BUNNY_STORAGE_REGION=ny  # Optional: ny, la, sg, syd (default: ny)
```

**Important:** Never commit `.env` to version control. Ensure `.env` is in `.gitignore`.

---

## Architecture Overview

Storia uses a **modular routing architecture** for better organization and maintainability:

```
server/
├── storage/
│   ├── bunny-storage.ts    # Core Bunny CDN service
│   ├── routes.ts           # Storage API routes (8 endpoints)
│   └── index.ts            # Exports
├── auth/
│   ├── middleware.ts       # Auth middleware & utilities
│   ├── routes.ts           # Auth & account routes (15 endpoints)
│   └── index.ts            # Session setup & exports
├── stories/
│   ├── asmr-sensory/routes/   # ASMR tool routes
│   ├── problem-solution/routes/
│   └── ...                 # Other story mode tools
└── routes.ts               # Main registration (685 lines)
```

**Storage routes are now organized in** `server/storage/routes.ts` **and include:**
- File upload (`POST /api/storage/upload`)
- File download (`GET /api/storage/download`)
- File deletion (`DELETE /api/storage/file`)
- Folder operations (list, info, exists)
- Storage status check

All storage routes are automatically registered via `app.use('/api/storage', storageRoutes)` in the main routes file.

---

## Core Storage Service

The Bunny storage service is located at `server/storage/bunny-storage.ts`.

### Available Methods

```typescript
import { bunnyStorage } from "./storage/bunny-storage";

// Upload a file
const cdnUrl = await bunnyStorage.uploadFile(path, buffer, contentType);

// Download a file
const buffer = await bunnyStorage.downloadFile(path);

// Delete a file
await bunnyStorage.deleteFile(path);

// Delete a folder and all contents recursively
await bunnyStorage.deleteFolder(folderPath);

// List files in a folder
const files = await bunnyStorage.listFiles(folderPath);

// Check if file exists
const exists = await bunnyStorage.fileExists(path);

// Get public CDN URL
const url = bunnyStorage.getPublicUrl(path);

// Get file info
const info = await bunnyStorage.getFileInfo(path);

// Check if configured
const isConfigured = bunnyStorage.isBunnyConfigured();
```

### Content Types

| File Type | Content-Type |
|-----------|--------------|
| MP4 Video | `video/mp4` |
| WebM Video | `video/webm` |
| PNG Image | `image/png` |
| JPEG Image | `image/jpeg` |
| MP3 Audio | `audio/mpeg` |
| WAV Audio | `audio/wav` |

---

## Path Builder Helpers

Use the path builder helpers to ensure consistent path formatting.

### Story Mode Path Builder

```typescript
import { buildStoryModePath } from "./storage/bunny-storage";

const path = buildStoryModePath({
  userId: "9747e448-364b-49ff-afeb-0b4d6a57e358",
  workspaceName: "My Workspace",
  toolMode: "asmr",           // e.g., asmr, before-after, myth-busting
  projectName: "Relaxing Rain",
  filename: "1733680000000.mp4",
  dateLabel: "20241208",      // Optional, defaults to today
});
// Result: "9747e448.../My_Workspace/Story_Mode/asmr/Relaxing_Rain_20241208/Rendered/1733680000000.mp4"
```

### Video Mode Path Builder (to be implemented)

```typescript
import { buildVideoModePath } from "./storage/bunny-storage";

const path = buildVideoModePath({
  userId: "user-uuid",
  workspaceName: "My Workspace",
  toolMode: "narrative",      // e.g., narrative, ambient, commerce
  projectName: "My Project",
  subFolder: "Final",         // Final, Shots, Images, Voice-Over
  filename: "video.mp4",
});
// Result: "user-uuid/My_Workspace/video_mode/narrative/My_Project_20241208/Rendered/Final/video.mp4"
```

### Assets Path Builder (to be implemented)

```typescript
import { buildAssetsPath } from "./storage/bunny-storage";

const path = buildAssetsPath({
  userId: "user-uuid",
  workspaceName: "My Workspace",
  assetType: "Characters",    // Characters, Uploads/Images, Uploads/Videos, Voices, Brand_Kits, Locations
  filename: "character.png",
});
// Result: "user-uuid/My_Workspace/Assets/Characters/character.png"
```

---

## Integration Patterns

### Pattern 1: Upload Final Output (Story Mode)

```typescript
import { buildStoryModePath, bunnyStorage } from "../../../storage/bunny-storage";
import { storage } from "../../../storage";
import { isAuthenticated, getCurrentUserId } from "../../../auth";

router.post("/generate", isAuthenticated, async (req, res) => {
  // 1. Get authenticated user
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { title, workspaceId } = req.body;

  // 2. Get workspace name
  const workspaces = await storage.getWorkspacesByUserId(userId);
  const workspace = workspaces.find(w => w.id === workspaceId);
  const workspaceName = workspace?.name || workspaceId;

  // 3. Generate your content (video, image, etc.)
  const videoBuffer = await generateContent();

  // 4. Build Bunny path
  const filename = `${Date.now()}.mp4`;
  const bunnyPath = buildStoryModePath({
    userId,
    workspaceName,
    toolMode: "your-tool-mode",  // e.g., "asmr"
    projectName: title,
    filename,
  });

  // 5. Upload to Bunny
  const cdnUrl = await bunnyStorage.uploadFile(bunnyPath, videoBuffer, "video/mp4");

  // 6. Save to database
  const story = await storage.createStory({
    workspaceId,
    title,
    template: "your-tool-mode",
    aspectRatio: "16:9",
    duration: 10,
    exportUrl: cdnUrl,
  });

  // 7. Return response
  res.json({
    videoUrl: cdnUrl,
    storyId: story.id,
  });
});
```

### Pattern 2: Upload User Asset

```typescript
import { bunnyStorage } from "../../../storage/bunny-storage";

router.post("/upload-asset", isAuthenticated, async (req, res) => {
  const userId = getCurrentUserId(req);
  const { workspaceId, assetType } = req.body;
  const file = req.file; // From multer

  // Get workspace name
  const workspaces = await storage.getWorkspacesByUserId(userId);
  const workspace = workspaces.find(w => w.id === workspaceId);
  const workspaceName = workspace?.name || workspaceId;

  // Build path
  const filename = `${Date.now()}_${file.originalname}`;
  const path = `${userId}/${workspaceName}/Assets/${assetType}/${filename}`;

  // Upload
  const cdnUrl = await bunnyStorage.uploadFile(path, file.buffer, file.mimetype);

  res.json({ url: cdnUrl });
});
```

### Pattern 3: Delete Story with Full Cleanup

```typescript
import { bunnyStorage } from "../../../storage/bunny-storage";
import { storage } from "../../../storage";

router.delete("/stories/:storyId", isAuthenticated, async (req, res) => {
  const userId = getCurrentUserId(req);
  const { storyId } = req.params;
  
  // Get story to verify ownership
  const story = await storage.getStory(storyId);
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }
  
  // Verify workspace ownership
  const workspaces = await storage.getWorkspacesByUserId(userId);
  const workspace = workspaces.find(w => w.id === story.workspaceId);
  if (!workspace) {
    return res.status(403).json({ error: 'Access denied to this story' });
  }

  // Delete entire project folder from Bunny CDN
  if (story.exportUrl) {
    try {
      // Extract path from CDN URL
      // Example: https://storia.b-cdn.net/{userId}/{workspace}/Story_Mode/asmr/{Project_Name_createDate}/Rendered/video.mp4
      const cdnUrl = new URL(story.exportUrl);
      const fullPath = cdnUrl.pathname.replace(/^\//, '');
      
      // Extract project folder path (everything before /Rendered/)
      const projectFolderMatch = fullPath.match(/^(.+\/Story_Mode\/[^/]+\/[^/]+)\//);
      if (projectFolderMatch) {
        const projectFolderPath = projectFolderMatch[1];
        console.log(`Deleting project folder: ${projectFolderPath}`);
        
        // This deletes the entire folder: {Project_Name_createDate}/Rendered/, temp/, etc.
        await bunnyStorage.deleteFolder(projectFolderPath);
      }
    } catch (error) {
      console.warn('Failed to delete files from Bunny:', error);
      // Continue with database deletion even if Bunny delete fails
    }
  }

  // Delete from database
  await storage.deleteStory(storyId);
  res.json({ success: true, message: 'Story and all associated files deleted' });
});
```

---

## Database Persistence

### Stories Table Schema

```typescript
// shared/schema.ts
export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  title: text("title").notNull(),
  template: text("template").notNull(),      // e.g., "asmr-sensory"
  aspectRatio: text("aspect_ratio").notNull(),
  duration: integer("duration"),
  exportUrl: text("export_url"),             // Bunny CDN URL for video
  thumbnailUrl: text("thumbnail_url"),       // Bunny CDN URL for thumbnail
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Creating a Story Record

```typescript
import { storage } from "../../../storage";

const story = await storage.createStory({
  workspaceId: "workspace-uuid",
  title: "My ASMR Video",
  template: "asmr-sensory",
  aspectRatio: "16:9",
  duration: 10,
  exportUrl: "https://your-zone.b-cdn.net/user/workspace/Story_Mode/asmr/...",
  thumbnailUrl: "https://your-zone.b-cdn.net/user/workspace/Story_Mode/asmr/.../thumbnail.jpg",
});
```

### Generating and Uploading Thumbnails

```typescript
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";

// Generate first-frame thumbnail using FFmpeg
const thumbnailFilename = `thumbnail_${Date.now()}.jpg`;
const tempDir = path.join(process.cwd(), "temp");

await new Promise((resolve, reject) => {
  ffmpeg(localVideoPath)
    .screenshots({
      timestamps: ['00:00:00'],
      filename: thumbnailFilename,
      folder: tempDir,
    })
    .on('end', resolve)
    .on('error', reject);
});

// Upload thumbnail to Bunny
const thumbnailPath = buildStoryModePath({
  userId,
  workspaceName,
  toolMode: "asmr",
  projectName: title,
  filename: thumbnailFilename,
});

const thumbnailBuffer = fs.readFileSync(path.join(tempDir, thumbnailFilename));
const thumbnailCdnUrl = await bunnyStorage.uploadFile(
  thumbnailPath,
  thumbnailBuffer,
  'image/jpeg'
);

// Clean up local thumbnail
fs.unlinkSync(path.join(tempDir, thumbnailFilename));
```

---

## Authentication Requirements

All storage routes that handle user content **must** be authenticated:

```typescript
import { isAuthenticated, getCurrentUserId } from "../../../auth";

// Add isAuthenticated middleware
router.post("/generate", isAuthenticated, async (req, res) => {
  // Get user ID from session (NOT from headers)
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Use userId for Bunny path
  const bunnyPath = buildStoryModePath({
    userId,  // Authenticated user ID
    // ...
  });
});
```

**Never use:**
- `req.headers["x-user-id"]` - Can be spoofed
- Hardcoded user IDs
- `"public"` as fallback for userId

---

## Adding a New Tool/Mode

Follow these steps when adding a new tool or mode:

### Step 1: Determine the Path Structure

Decide which category your tool belongs to:

| Category | Path Pattern | Example Tools |
|----------|--------------|---------------|
| Story Mode | `Story_Mode/{tool}/` | asmr, before-after, myth-busting, problem-solution, tease-reveal |
| Video Mode | `video_mode/{tool}/` | narrative, ambient, commerce, logo-animation, character-vlog |
| Assets | `Assets/{type}/` | Characters, Uploads, Voices, Brand_Kits, Locations |

### Step 2: Create/Use Path Builder

For Story Mode tools, use `buildStoryModePath`:

```typescript
const path = buildStoryModePath({
  userId,
  workspaceName,
  toolMode: "your-new-tool",  // Add your tool name here
  projectName: title,
  filename,
});
```

For Video Mode tools, implement `buildVideoModePath` (if not exists).

### Step 3: Add Route with Authentication

```typescript
// server/stories/your-new-tool/routes/index.ts
import { Router } from "express";
import { isAuthenticated, getCurrentUserId } from "../../../auth";
import { buildStoryModePath, bunnyStorage } from "../../../storage/bunny-storage";
import { storage } from "../../../storage";

const router = Router();

router.post("/generate", isAuthenticated, async (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  // Your generation logic...

  // Upload to Bunny
  const bunnyPath = buildStoryModePath({
    userId,
    workspaceName,
    toolMode: "your-new-tool",
    projectName: title,
    filename: `${Date.now()}.mp4`,
  });
  const cdnUrl = await bunnyStorage.uploadFile(bunnyPath, buffer, "video/mp4");

  // Save to database
  const story = await storage.createStory({
    workspaceId,
    title,
    template: "your-new-tool",
    aspectRatio,
    duration,
    exportUrl: cdnUrl,
  });

  res.json({ videoUrl: cdnUrl, storyId: story.id });
});

export default router;
```

### Step 4: Register the Route

```typescript
// server/stories/index.ts
import yourNewToolRouter from "./your-new-tool/routes";

storiesRouter.use("/your-new-tool", yourNewToolRouter);
```

### Step 5: Update Frontend API Client

```typescript
// client/src/lib/api/your-new-tool.ts
export interface GenerateRequest {
  title: string;
  workspaceId: string;
  // ... other params
}

export async function generate(request: GenerateRequest) {
  return fetchAPI("/generate", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
```

---

## Examples

### Example 1: ASMR Story Mode (Implemented)

**Path:** `{userId}/{workspaceName}/Story_Mode/asmr/{title}_{date}/Rendered/{timestamp}.mp4`

**Files:**
- Route: `server/stories/asmr-sensory/routes/index.ts`
- Database: `stories` table with `template: "asmr-sensory"`

**API Request:**
```json
POST /api/stories/asmr/generate
{
  "title": "Relaxing Rain Sounds",
  "workspaceId": "workspace-uuid",
  "visualPrompt": "Gentle rain on leaves...",
  "aspectRatio": "16:9",
  "duration": 5
}
```

**API Response:**
```json
{
  "videoUrl": "https://your-zone.b-cdn.net/user-id/workspace/Story_Mode/asmr/Relaxing_Rain_Sounds_20241208/Rendered/1733680000000.mp4",
  "storyId": "story-uuid",
  "cost": 0.15
}
```

**Complete Upload Flow with Thumbnail:**
```typescript
// 1. Generate video
const videoBuffer = await generateVideo();

// 2. Upload video to Bunny
const videoFilename = `${Date.now()}.mp4`;
const videoPath = buildStoryModePath({
  userId,
  workspaceName,
  toolMode: "asmr",
  projectName: title,
  filename: videoFilename,
});
const videoCdnUrl = await bunnyStorage.uploadFile(videoPath, videoBuffer, "video/mp4");

// 3. Generate and upload thumbnail
const thumbnailFilename = `thumbnail_${Date.now()}.jpg`;
const thumbnailPath = buildStoryModePath({
  userId,
  workspaceName,
  toolMode: "asmr",
  projectName: title,
  filename: thumbnailFilename,
});

// Generate first frame thumbnail
await generateThumbnail(localVideoPath, tempDir, thumbnailFilename);
const thumbnailBuffer = fs.readFileSync(path.join(tempDir, thumbnailFilename));
const thumbnailCdnUrl = await bunnyStorage.uploadFile(
  thumbnailPath,
  thumbnailBuffer,
  'image/jpeg'
);

// 4. Save to database
const story = await storage.createStory({
  workspaceId,
  title,
  template: "asmr-sensory",
  aspectRatio,
  duration,
  exportUrl: videoCdnUrl,
  thumbnailUrl: thumbnailCdnUrl,
});

// 5. Clean up temp files
fs.unlinkSync(localVideoPath);
fs.unlinkSync(path.join(tempDir, thumbnailFilename));
```

### Example 2: User Asset Upload (To Be Implemented)

**Path:** `{userId}/{workspaceName}/Assets/Characters/{filename}`

**API Request:**
```json
POST /api/assets/upload
Content-Type: multipart/form-data

file: [binary]
workspaceId: "workspace-uuid"
assetType: "Characters"
```

**API Response:**
```json
{
  "url": "https://your-zone.b-cdn.net/user-id/workspace/Assets/Characters/1733680000000_character.png",
  "filename": "1733680000000_character.png"
}
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Path starts with "public/" | `userId` is undefined | Use `getCurrentUserId(req)` with `isAuthenticated` middleware |
| 401 Unauthorized | Missing auth middleware | Add `isAuthenticated` to route |
| File not found | Wrong path format | Use path builder helpers |
| Database record not created | Using MemStorage | Ensure method uses `db.insert()` |
| Files not deleted completely | Only deleting individual files | Use `deleteFolder()` for entire project cleanup |
| Thumbnail not generated | FFmpeg not configured | Ensure FFmpeg is installed and in PATH |

### Debugging Tips

1. **Log the Bunny path before upload:**
   ```typescript
   console.log("[your-tool] Bunny path:", bunnyPath);
   ```

2. **Verify userId is set:**
   ```typescript
   console.log("[your-tool] userId:", userId);
   ```

3. **Check Bunny configuration:**
   ```typescript
   console.log("[your-tool] Bunny configured:", bunnyStorage.isBunnyConfigured());
   ```

---

## Related Files

| File | Purpose |
|------|---------|
| `server/storage/bunny-storage.ts` | Core Bunny storage service |
| `server/storage/routes.ts` | Storage API routes (upload, download, delete) |
| `server/storage/index.ts` | Storage exports |
| `server/storage.ts` | Database storage methods |
| `server/auth/index.ts` | Authentication setup |
| `server/auth/middleware.ts` | Authentication middleware |
| `server/auth/routes.ts` | Authentication API routes |
| `server/routes.ts` | Main routes registration |
| `shared/schema.ts` | Database schemas |
| `.env` | Environment variables |

---

## Changelog

| Date | Change |
|------|--------|
| 2024-12-08 | Initial documentation created |
| 2024-12-08 | ASMR Story Mode integration completed |
| 2024-12-08 | Fixed userId authentication for Bunny paths |
| 2024-12-08 | Fixed `createStory` to persist to database |
| 2024-12-08 | Added `deleteFolder()` method for recursive folder deletion |
| 2024-12-08 | Added thumbnail generation and upload workflow |
| 2024-12-08 | Updated delete pattern to remove entire project folders |
| 2024-12-08 | Added Pattern 3: Delete Story with Full Cleanup |
| 2024-12-08 | Enhanced ASMR example with complete upload flow |