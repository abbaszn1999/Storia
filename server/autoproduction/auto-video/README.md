# Auto-Video Backend

Central folder for **auto-video** campaign generation. This orchestrates batch video generation across multiple modes, each with its own dedicated agents.

## 🏗️ Structure

```
auto-video/
├── routes/
│   ├── index.ts              # Main router
│   └── generation.ts         # Generation endpoints (start, progress, retry)
├── services/
│   ├── index.ts              # Service exports
│   ├── batch-processor.ts    # Batch generation orchestrator
│   ├── mode-delegator.ts     # Routes to correct mode agents
│   └── scheduler-service.ts  # Schedule calculation utilities
├── modes/
│   ├── ambient-visual/
│   │   └── agents/           # Ambient-specific agents
│   │       └── index.ts      # mood → scenes → shots → images → compose
│   ├── narrative/
│   │   └── agents/           # Narrative-specific agents
│   ├── character-vlog/
│   │   └── agents/           # Vlog-specific agents
│   ├── social-commerce/
│   │   └── agents/           # Commerce-specific agents
│   ├── logo-animation/
│   │   └── agents/           # Logo animation agents
│   └── podcast/
│       └── agents/           # Podcast-specific agents
├── types.ts                  # Type definitions
└── index.ts                  # Module exports
```

## 🎯 Key Distinction: Auto-Video vs Auto-Story

| Feature | Auto-Story | Auto-Video |
|---------|-----------|-----------|
| **Agents** | One shared set for all modes | **Separate agents per mode** |
| **Location** | `auto-story/agents` | `auto-video/modes/{mode}/agents` |
| **Reason** | Story templates share generation logic | Each video mode has unique generation pipeline |

## 📦 Separation of Concerns

```
autoproduction/
├── shared/                      # CRUD operations (database layer)
│   ├── routes/                  # /video-campaigns endpoints (GET, POST, PATCH, DELETE)
│   └── services/                # campaign-manager.ts
├── auto-video/                  # Video campaign orchestration
│   ├── routes/                  # /video/:id/generate, /progress, /retry
│   ├── services/                # batch-processor, mode-delegator, scheduler
│   └── modes/{mode}/agents/     # Per-mode generation logic
└── auto-story/                  # Story campaign orchestration
    ├── routes/
    ├── services/
    └── agents/                  # Shared for all story templates
```

## 🔄 Video Generation Flow

```
Client
  ↓
POST /api/autoproduction/video/:id/generate
  ↓
Batch Processor
  ↓ (for each idea)
Mode Delegator
  ↓ (routes based on videoMode)
auto-video/modes/{mode}/agents
  ↓
Video Result (videoId, cdnUrl)
  ↓
Update Campaign (itemStatuses, generatedVideoIds)
```

## 🛠️ API Endpoints

### Generation
- `POST /api/autoproduction/video/:id/generate` - Start batch generation
- `GET /api/autoproduction/video/:id/progress` - Get generation progress
- `POST /api/autoproduction/video/:id/retry/:itemIndex` - Retry failed video

### Campaign CRUD (in `shared/routes`)
- `GET /api/autoproduction/video-campaigns` - List campaigns
- `POST /api/autoproduction/video-campaigns` - Create campaign
- `GET /api/autoproduction/video-campaigns/:id` - Get campaign
- `PATCH /api/autoproduction/video-campaigns/:id` - Update campaign
- `DELETE /api/autoproduction/video-campaigns/:id` - Delete campaign

## 📝 Types

### VideoMode
```typescript
type VideoMode = 
  | 'ambient-visual'
  | 'narrative'
  | 'character-vlog'
  | 'social-commerce'
  | 'logo-animation'
  | 'podcast';
```

### Campaign Settings
Each mode has its own settings type:
- `AmbientCampaignSettings` - duration, aspectRatio, mood, musicStyle, etc.
- `NarrativeSettings` - narrativeStyle, characterCount, etc.
- `VlogSettings` - characterId, vlogStyle, backgroundType, etc.
- `CommerceSettings` - productName, callToAction, etc.
- `LogoSettings` - logoUrl, animationStyle, etc.
- `PodcastSettings` - hostCount, visualStyle, etc.

### Generation Result
```typescript
interface VideoGenerationResult {
  success: boolean;
  videoId?: string;
  cdnUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  metadata?: {...};
}
```

## 🚀 Implementation Status

### ✅ Complete
- [x] Folder structure (`modes/{mode}/agents`)
- [x] Type definitions (`types.ts`)
- [x] Mode delegator service
- [x] Batch processor service
- [x] Scheduler service
- [x] Generation routes
- [x] Module wiring

### 🔨 TODO
- [ ] Implement ambient-visual agents
- [ ] Implement narrative agents
- [ ] Implement vlog agents
- [ ] Implement commerce agents
- [ ] Implement logo-animation agents
- [ ] Implement podcast agents
- [ ] Publisher service (platform API integration)
- [ ] Scheduling routes (optional for v1)

## 🎬 Mode-Specific Agents

### Ambient-Visual
Location: `modes/ambient-visual/agents/`
- **Flow**: mood → scenes → shots → images → compose
- **Purpose**: Atmospheric, visually-driven videos with music

### Narrative
Location: `modes/narrative/agents/`
- **Purpose**: Story-driven videos with characters and plot

### Character-Vlog
Location: `modes/character-vlog/agents/`
- **Purpose**: Personality-driven vlogs with consistent character

### Social-Commerce
Location: `modes/social-commerce/agents/`
- **Purpose**: Product showcase videos with call-to-action

### Logo-Animation
Location: `modes/logo-animation/agents/`
- **Purpose**: Animated logo intros/outros

### Podcast
Location: `modes/podcast/agents/`
- **Purpose**: Podcast-style videos with host(s)

## 📊 Data Schema

### VideoCampaign (in `shared/schema.ts`)
```typescript
{
  id: string;
  userId: string;
  workspaceId: string;
  name: string;
  status: 'draft' | 'generating' | 'paused' | 'review' | 'completed' | 'cancelled';
  
  // Content
  videoIdeas: [{idea: string, index: number}, ...];
  videoMode: VideoMode;
  campaignSettings: CampaignSettings;
  
  // Tracking
  itemStatuses: {"0": {status, videoId, error}, "1": {...}, ...};
  itemSchedules: {"0": {scheduledDate, publishedDate}, "1": {...}, ...};
  generatedVideoIds: string[];
  
  // Scheduling
  automationMode: 'manual' | 'continuous' | 'custom';
  scheduleStartDate: Date;
  preferredPublishHours: number[];
  maxVideosPerDay: number;
  
  // Publishing
  selectedPlatforms: string[];
}
```

## 🔍 Development Notes

1. **Import paths**: Use relative imports for types: `import type { ... } from '../../types'`
2. **Mode routing**: Mode-delegator maps `videoMode` string to the correct `modes/{mode}/agents` function
3. **Error handling**: All agents return `VideoGenerationResult` with success/error
4. **Async processing**: Batch processor runs in background, client polls `/progress`
5. **State updates**: Campaign `itemStatuses` updated after each video completes

## 🧪 Testing

To test the structure:
1. Create a campaign via `POST /video-campaigns`
2. Start generation via `POST /video/:id/generate`
3. Poll progress via `GET /video/:id/progress`
4. Check `itemStatuses` for per-video status

Current status: Agents are placeholders that throw "not yet implemented" errors.

## 📚 Related Files

- Campaign CRUD: `server/autoproduction/shared/services/campaign-manager.ts`
- Main routes: `server/routes.ts` (mounts at `/api/autoproduction/video`)
- Schema: `shared/schema.ts` (videoCampaigns table)
