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
  exportUrl: text("export_url"),             // Bunny CDN URL
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
});
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
| `server/storage/index.ts` | Storage exports |
| `server/storage.ts` | Database storage methods |
| `server/auth/index.ts` | Authentication helpers |
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

