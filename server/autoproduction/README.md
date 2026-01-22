# Auto Production Backend

Backend services for automated content production.

## Architecture

### Shared Services
Core services used by both auto-video and auto-story:
- `campaign-manager.ts` - Campaign CRUD operations
- `scheduler.ts` - Publication scheduling (TODO)
- `publisher.ts` - Multi-platform publishing (TODO)
- `automation-orchestrator.ts` - Automation coordination (TODO)

### Auto Story

#### Workflow
1. User creates campaign with 10 topics
2. System generates stories in batch:
   - For each topic:
     - Generate script (template-based)
     - Break into scenes
     - Generate visual prompts
     - Generate voiceover
     - Compose video
3. User reviews & approves stories
4. System schedules & publishes

#### Services
- `story-generator.ts` - Core generation logic
- `batch-processor.ts` - Handles 10-topic batches
- `ai-helper.ts` - AI model wrapper

#### Agents
- `script-writer.ts` - Generates scripts
- `scene-breaker.ts` - Breaks scripts into scenes
- `visual-prompter.ts` - Creates image prompts
- `narrator.ts` - Generates voiceover

#### Templates
Each template has:
- `generator.ts` - Template-specific logic
- `structure.ts` - Stage definitions
- `config.ts` - Settings

Templates:
1. Problem-Solution
2. Tease-Reveal
3. Before-After
4. Myth-Busting
5. Auto ASMR (TODO)
6. ASMR (TODO)

### Auto Video
Placeholder structure for future implementation.

## API Endpoints

### Shared
```
GET    /api/autoproduction/campaigns
POST   /api/autoproduction/campaigns
PATCH  /api/autoproduction/campaigns/:id
DELETE /api/autoproduction/campaigns/:id
```

### Auto Story
```
POST   /api/autoproduction/story/:id/generate-batch
GET    /api/autoproduction/story/:id/batch-progress
GET    /api/autoproduction/story/:id/stories
PATCH  /api/autoproduction/story/:id/stories/:itemId
POST   /api/autoproduction/story/:id/approve-all
GET    /api/autoproduction/story/templates
```

## Database

### Tables
- `production_campaigns` - Campaign data (both video & story)
- `campaign_items` - Individual videos/stories in a campaign

### Key Fields
- `type`: 'auto-video' | 'auto-story'
- `status`: draft, generating, review, completed, etc.
- `totalItems`: Number of items to generate
- `itemsGenerated`: How many completed

## Integration Points

### Reusing Existing Code
Auto Story reuses prompts and logic from:
- `server/stories/problem-solution/prompts/` - Scene & storyboard prompts
- `server/stories/shared/agents/` - Generation agents (TODO: integrate)

### AI Providers
TODO: Integrate with existing AI provider system:
- OpenAI (GPT-4) - Script generation
- ElevenLabs - Voiceover
- Runware/Flux - Image generation
- Kling/Runway - Video generation
