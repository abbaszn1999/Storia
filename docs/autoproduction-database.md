# Auto Production Database Architecture

This document describes the database schema and data flow for the Auto Production feature (Auto Video and Auto Story campaigns).

## Overview

The Auto Production system uses **two campaign tables** that store campaign configuration and track generated content, while the actual content is stored in the existing `videos` and `stories` tables.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AUTO PRODUCTION DATABASE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────────┐              ┌──────────────────┐            │
│   │  video_campaigns │              │  story_campaigns │            │
│   │  (campaign data) │              │  (campaign data) │            │
│   └────────┬─────────┘              └────────┬─────────┘            │
│            │                                  │                      │
│            │ generatedVideoIds[]              │ generatedStoryIds[]  │
│            │                                  │                      │
│            ▼                                  ▼                      │
│   ┌──────────────────┐              ┌──────────────────┐            │
│   │     videos       │              │     stories      │            │
│   │ (actual content) │              │ (actual content) │            │
│   └──────────────────┘              └──────────────────┘            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Campaign Tables

### `video_campaigns` Table

For Auto Video feature (Narrative, Character Vlog, Ambient Visual modes).

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR | Primary key (UUID) |
| `user_id` | VARCHAR | FK to users table |
| `workspace_id` | VARCHAR | FK to workspaces table |
| `name` | TEXT | Campaign display name |
| `status` | TEXT | Campaign status (see statuses below) |
| `video_ideas` | JSONB | Array of video idea objects |
| `item_statuses` | JSONB | Map of item index to status info |
| `item_schedules` | JSONB | Map of item index to schedule info |
| `generated_video_ids` | TEXT[] | Array of video IDs for fast queries |
| `video_mode` | TEXT | 'narrative' \| 'character_vlog' \| 'ambient_visual' |
| `campaign_settings` | JSONB | Mode-specific settings (flows to step1Data, step2Data, etc.) |
| `automation_mode` | TEXT | 'manual' \| 'scheduled' \| 'continuous' |
| `schedule_start_date` | TIMESTAMP | When to start publishing |
| `schedule_end_date` | TIMESTAMP | When to stop publishing |
| `preferred_publish_hours` | JSONB | Array of preferred hours [9, 12, 18] |
| `max_videos_per_day` | INTEGER | Limit per day (default: 1) |
| `selected_platforms` | JSONB | Array of platform IDs |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### `story_campaigns` Table

For Auto Story feature (Problem-Solution, Tease-Reveal, Before-After, Myth-Busting templates).

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR | Primary key (UUID) |
| `user_id` | VARCHAR | FK to users table |
| `workspace_id` | VARCHAR | FK to workspaces table |
| `name` | TEXT | Campaign display name |
| `status` | TEXT | Campaign status (see statuses below) |
| `story_topics` | JSONB | Array of story topic objects |
| `item_statuses` | JSONB | Map of item index to status info |
| `item_schedules` | JSONB | Map of item index to schedule info |
| `generated_story_ids` | TEXT[] | Array of story IDs for fast queries |
| `template` | TEXT | 'problem-solution' \| 'tease-reveal' \| 'before-after' \| 'myth-busting' |
| `campaign_settings` | JSONB | Template-specific settings |
| `automation_mode` | TEXT | 'manual' \| 'scheduled' \| 'continuous' |
| `schedule_start_date` | TIMESTAMP | When to start publishing |
| `schedule_end_date` | TIMESTAMP | When to stop publishing |
| `preferred_publish_hours` | JSONB | Array of preferred hours |
| `max_stories_per_day` | INTEGER | Limit per day (default: 1) |
| `selected_platforms` | JSONB | Array of platform IDs |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

## Campaign Status Values

| Status | Description |
|--------|-------------|
| `draft` | Campaign created but not started |
| `generating` | Batch generation in progress |
| `paused` | Generation paused by user |
| `review` | All items generated, awaiting review |
| `completed` | All items published |
| `cancelled` | Campaign cancelled |

## Hybrid Tracking Approach

We use a **hybrid approach** for tracking generated content that combines:

1. **JSONB objects** for detailed status and scheduling info
2. **TEXT[] arrays** for fast ID lookups and queries

### Why Hybrid?

- **JSONB maps** (`item_statuses`, `item_schedules`): Rich metadata per item, easy updates
- **TEXT arrays** (`generated_video_ids`, `generated_story_ids`): Fast `ANY()` queries, simple existence checks

### Data Structures

#### `video_ideas` / `story_topics` (JSONB Array)

Stores the list of ideas/topics the user wants to generate:

```json
[
  { "idea": "5 Morning Habits for Success", "index": 0 },
  { "idea": "How to Stay Focused While Working", "index": 1 },
  { "idea": "Best Productivity Apps in 2024", "index": 2 }
]
```

#### `item_statuses` (JSONB Map)

Tracks the generation status of each item by index:

```json
{
  "0": {
    "status": "completed",
    "videoId": "abc-123",
    "completedAt": "2024-01-15T10:30:00Z"
  },
  "1": {
    "status": "generating",
    "startedAt": "2024-01-15T10:35:00Z"
  },
  "2": {
    "status": "pending"
  },
  "3": {
    "status": "failed",
    "error": "Image generation failed",
    "failedAt": "2024-01-15T10:40:00Z"
  }
}
```

**Item Status Values:**
- `pending` - Not started
- `generating` - Currently being generated
- `completed` - Successfully generated
- `failed` - Generation failed
- `cancelled` - User cancelled

#### `item_schedules` (JSONB Map)

Tracks scheduling and publishing info:

```json
{
  "0": {
    "scheduledDate": "2024-01-20T09:00:00Z",
    "publishedDate": "2024-01-20T09:05:00Z",
    "platforms": ["youtube", "tiktok"]
  },
  "1": {
    "scheduledDate": "2024-01-21T12:00:00Z"
  }
}
```

#### `generated_video_ids` / `generated_story_ids` (TEXT Array)

Simple array of IDs for fast queries:

```json
["abc-123", "def-456", "ghi-789"]
```

**Use cases:**
- Check if a video belongs to any campaign: `WHERE 'video-id' = ANY(generated_video_ids)`
- Count generated items: `array_length(generated_video_ids, 1)`
- Join with videos table efficiently

#### `campaign_settings` (JSONB)

Stores mode/template-specific configuration that flows into generated content:

**Video Campaign (Narrative Mode) Example:**
```json
{
  "duration": 60,
  "aspectRatio": "16:9",
  "language": "en",
  "imageStyle": "cinematic",
  "imageModel": "flux-pro",
  "voiceProfile": "narrator-deep",
  "voiceVolume": 80,
  "backgroundMusic": "epic-orchestral",
  "musicVolume": 30
}
```

**Story Campaign (Problem-Solution) Example:**
```json
{
  "duration": 45,
  "aspectRatio": "9:16",
  "language": "en",
  "pacing": "medium",
  "textOverlayEnabled": true,
  "textOverlayStyle": "modern",
  "imageStyle": "photorealistic",
  "imageModel": "nano-banana",
  "mediaType": "static",
  "transitionStyle": "fade",
  "hasVoiceover": true,
  "voiceProfile": "narrator-soft",
  "voiceVolume": 80,
  "backgroundMusic": "uplifting-corporate",
  "musicVolume": 40
}
```

## Content Tables (Unchanged)

The `videos` and `stories` tables store the actual generated content. They are **shared** between:
- Standalone content (created manually by user)
- Campaign content (generated by Auto Production)

### `videos` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR | Primary key |
| `workspace_id` | VARCHAR | FK to workspaces |
| `title` | TEXT | Video title |
| `mode` | TEXT | 'ambient' \| 'narrative' \| 'commerce' \| 'vlog' \| 'logo' |
| `status` | TEXT | Video status |
| `step1_data` | JSONB | Concept data |
| `step2_data` | JSONB | World building data |
| `step3_data` | JSONB | Scene flow data |
| `step4_data` | JSONB | Storyboard data |
| `step5_data` | JSONB | Preview data |
| `step6_data` | JSONB | Timeline data |
| `step7_data` | JSONB | Export data |
| `export_url` | TEXT | Final video URL |
| `thumbnail_url` | TEXT | Thumbnail URL |

### `stories` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR | Primary key |
| `user_id` | VARCHAR | FK to users |
| `workspace_id` | VARCHAR | FK to workspaces |
| `project_name` | TEXT | Story name |
| `project_folder` | TEXT | BunnyCDN folder |
| `story_mode` | TEXT | Template type |
| `video_url` | TEXT | Final video URL |
| `thumbnail_url` | TEXT | Thumbnail URL |
| `duration` | INTEGER | Duration in seconds |
| `aspect_ratio` | TEXT | Aspect ratio |
| `published_platforms` | JSONB | Publishing status per platform |

## Data Flow

### 1. Campaign Creation

User creates a campaign through the wizard:

```
User Input → Frontend Wizard → API POST /story-campaigns
                                       ↓
                              Create story_campaigns row:
                              - name, template, status='draft'
                              - story_topics: [topics from wizard]
                              - campaign_settings: {all settings}
                              - item_statuses: {} (empty)
                              - generated_story_ids: [] (empty)
```

### 2. Batch Generation

User starts generation:

```
API POST /auto-story/:id/generate
              ↓
For each topic in story_topics:
  1. Update item_statuses[index] = {status: 'generating'}
  2. Generate content using campaign_settings
  3. Create new row in 'stories' table
  4. Update item_statuses[index] = {status: 'completed', storyId: newId}
  5. Append newId to generated_story_ids[]
              ↓
Update campaign status = 'review'
```

### 3. Scheduling & Publishing

User schedules content:

```
API PATCH /auto-story/:id/stories/:itemIndex
              ↓
Update item_schedules[itemIndex] = {
  scheduledDate: ...,
  platforms: [...]
}
              ↓
Background job picks up scheduled items:
  1. Publish to platforms
  2. Update item_schedules[index].publishedDate
  3. Update stories.published_platforms
              ↓
When all items published:
  Update campaign status = 'completed'
```

## Queries

### Get all stories for a campaign

```sql
SELECT s.* 
FROM stories s
WHERE s.id = ANY(
  SELECT unnest(generated_story_ids) 
  FROM story_campaigns 
  WHERE id = 'campaign-id'
);
```

### Check if a video belongs to any campaign

```sql
SELECT id, name 
FROM video_campaigns 
WHERE 'video-id' = ANY(generated_video_ids);
```

### Get campaign progress

```sql
SELECT 
  name,
  jsonb_array_length(story_topics) as total_items,
  array_length(generated_story_ids, 1) as completed_items,
  (
    SELECT COUNT(*) 
    FROM jsonb_each(item_statuses) 
    WHERE value->>'status' = 'failed'
  ) as failed_items
FROM story_campaigns
WHERE id = 'campaign-id';
```

### Get pending scheduled items

```sql
SELECT 
  c.id as campaign_id,
  c.name as campaign_name,
  key as item_index,
  value->>'scheduledDate' as scheduled_date,
  value->'platforms' as platforms
FROM story_campaigns c,
LATERAL jsonb_each(c.item_schedules)
WHERE value->>'publishedDate' IS NULL
  AND (value->>'scheduledDate')::timestamp <= NOW();
```

## Migration

The migration `0010_auto_production_restructure.sql` handles:

1. Dropping old tables: `campaign_videos`, `production_campaigns`
2. Creating new tables: `video_campaigns`, `story_campaigns`
3. Creating indexes for common queries

```sql
-- Indexes for performance
CREATE INDEX video_campaigns_user_id_idx ON video_campaigns(user_id);
CREATE INDEX video_campaigns_workspace_id_idx ON video_campaigns(workspace_id);
CREATE INDEX video_campaigns_status_idx ON video_campaigns(status);
CREATE INDEX story_campaigns_user_id_idx ON story_campaigns(user_id);
CREATE INDEX story_campaigns_workspace_id_idx ON story_campaigns(workspace_id);
CREATE INDEX story_campaigns_status_idx ON story_campaigns(status);
```

## TypeScript Types

```typescript
// From shared/schema.ts

export type VideoCampaign = typeof videoCampaigns.$inferSelect;
export type InsertVideoCampaign = z.infer<typeof insertVideoCampaignSchema>;

export type StoryCampaign = typeof storyCampaigns.$inferSelect;
export type InsertStoryCampaign = z.infer<typeof insertStoryCampaignSchema>;

// Backward compatibility alias
export type ProductionCampaign = VideoCampaign | StoryCampaign;
```

## Frontend Types

```typescript
// From client/src/autoproduction/shared/types/campaign.ts

interface ItemStatusEntry {
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled';
  videoId?: string;
  storyId?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
}

interface ItemScheduleEntry {
  scheduledDate?: string;
  publishedDate?: string;
  platforms?: string[];
}

interface VideoIdea {
  idea: string;
  index: number;
}

interface StoryTopic {
  topic: string;
  index: number;
}
```

## Summary

| Aspect | Implementation |
|--------|---------------|
| Campaign data | Stored in `video_campaigns` / `story_campaigns` |
| Generated content | Stored in `videos` / `stories` (shared tables) |
| Tracking | Hybrid: JSONB maps + TEXT arrays |
| Settings | JSONB `campaign_settings` flows to content `stepXData` |
| Status per item | `item_statuses` JSONB map |
| Scheduling | `item_schedules` JSONB map |
| Fast ID queries | `generated_video_ids` / `generated_story_ids` arrays |
