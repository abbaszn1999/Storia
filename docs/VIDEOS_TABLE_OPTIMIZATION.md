# Videos Table Structure

## Schema

```typescript
export const videos = pgTable("videos", {
  // Core
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  title: text("title").notNull(),
  mode: text("mode").notNull(), // "ambient" | "narrative" | "commerce" | "vlog" | "logo"
  status: text("status").default("draft"),
  
  // Progress
  currentStep: integer("current_step"),
  completedSteps: jsonb("completed_steps"),
  
  // Step Data
  step1Data: jsonb("step1_data"), // Concept: Script/Atmosphere/Product
  step2Data: jsonb("step2_data"), // World: Art style, characters, locations
  step3Data: jsonb("step3_data"), // Flow: Scenes, shots, continuity
  step4Data: jsonb("step4_data"), // Storyboard: Shot versions, compositions
  step5Data: jsonb("step5_data"), // Preview: Animatic, audio config
  step6Data: jsonb("step6_data"), // Export: Resolution, format settings
  
  // Output
  exportUrl: text("export_url"),
  thumbnailUrl: text("thumbnail_url"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

## Step Names by Mode

| Step | Ambient | Narrative | Commerce | Vlog | Logo |
|------|---------|-----------|----------|------|------|
| **1** | Atmosphere | Script | Product | Script | Logo Script |
| **2** | Visual World | World & Cast | World & Cast | World & Cast | World Settings |
| **3** | Flow Design | Breakdown | Breakdown | Breakdown | Breakdown |
| **4** | Composition | Storyboard | Storyboard | Storyboard | Storyboard |
| **5** | Preview | Animatic | Animatic | Animatic | Animatic |
| **6** | Export | Export | Export | Export | Export |

---

## JSONB Columns Brief

### `step1Data` (Concept)
```typescript
{
  // Common
  aspectRatio: "16:9" | "9:16" | "1:1",
  duration: number,
  animationMode: "image-transitions" | "video-animation",
  videoGenerationMode?: "image-reference" | "start-end-frame", // if video-animation
  voiceOverEnabled: boolean,
  voiceActorId?: string,
  
  // Mode-specific
  script?: string,              // narrative, vlog
  atmosphereDescription?: string, // ambient
  category?: string,            // ambient
  moods?: string[],             // ambient
  productPhotos?: string[],     // commerce
  productDetails?: object,      // commerce
  logoUrl?: string,             // logo
}
```

### `step2Data` (World)
```typescript
{
  artStyle: string,
  imageModel?: string,
  videoModel?: string,
  animationMode?: "animate" | "smooth-image",
  worldDescription?: string,
  characters: Array<{ id, name, appearance, imageUrl }>,
  locations: Array<{ id, name, description, imageUrl }>,
  imageInstructions?: string,
  videoInstructions?: string,
}
```

### `step3Data` (Flow)
```typescript
{
  scenes: Array<{ id, sceneNumber, title, description, duration }>,
  shots: { [sceneId]: Array<{ id, shotNumber, shotType, description, duration, cameraMovement }> },
  continuityGroups?: { [sceneId]: Array<{ id, shotIds, status }> }, // only for start-end-frame
  continuityLocked?: boolean,
}
```

### `step4Data` (Storyboard)
```typescript
{
  shotVersions: { [shotId]: Array<{ id, imageUrl, videoUrl, status }> },
  referenceImages: Array<{ id, url, description }>,
}
```

### `step5Data` (Preview)
```typescript
{
  animaticUrl?: string,
  settings: { fps, quality, includeVoiceOver, includeMusic },
  audio?: { voiceOverUrl, musicTrack, volumes },
}
```

### `step6Data` (Export)
```typescript
{
  resolution: "720p" | "1080p" | "4k",
  format: "mp4" | "mov",
  exportedAt?: string,
  fileSize?: number,
}
```

---

## Mode Defaults

| Mode | Animation Mode | Video Generation Mode |
|------|----------------|----------------------|
| **Ambient** | User choice | User choice |
| **Narrative** | video-animation | User choice |
| **Commerce** | video-animation | start-end-frame (fixed) |
| **Vlog** | video-animation | User choice |
| **Logo** | video-animation | start-end-frame (fixed) |

> **Note:** `continuityGroups` in step3Data only used when `videoGenerationMode = "start-end-frame"`
