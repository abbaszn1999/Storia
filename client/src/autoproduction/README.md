# Auto Production System

Complete restructure of the auto production system with professional organization.

## Structure

### Auto Story (Implemented)
Generate multiple short-form stories automatically using proven templates.

**Features:**
- 4 Narrative Templates: Problem-Solution, Tease-Reveal, Before-After, Myth-Busting
- Batch generation: Input 10 topics → Generate 10 stories
- Real-time progress tracking
- Review & approval workflow
- Automated scheduling & publishing

**Pages:**
- `/autoproduction/story` - Campaign list
- `/autoproduction/story/create` - Wizard (6 steps)
- `/autoproduction/story/:id` - Dashboard with batch progress
- `/autoproduction/story/:id/stories/:storyId` - Story detail

### Auto Video (Placeholder)
Generate multiple videos automatically with advanced modes.

**Modes (Future):**
- Narrative Video
- Character Vlog
- Ambient Visual

**Status:** Structure created, implementation pending

### Shared Components
Reusable components for both Auto Video and Auto Story:
- Wizard layout & navigation
- Progress trackers
- Status badges
- Platform selectors
- Campaign management

## Development

### Frontend
- Framework: React + TypeScript
- Routing: Wouter
- State: React Query
- UI: shadcn/ui

### Backend
- Framework: Express
- Database: PostgreSQL (Drizzle ORM)
- AI: GPT-4, Claude (via providers)
- Storage: Bunny CDN

## File Organization

```
autoproduction/
├── shared/          # Shared between video & story
├── auto-story/      # Story-specific (implemented)
└── auto-video/      # Video-specific (placeholder)
```

Each section contains:
- `pages/` - UI pages
- `components/` - React components
- `hooks/` - Custom React hooks
- `services/` - Business logic (backend)
- `agents/` - AI agents (backend)
- `routes/` - API endpoints (backend)
- `types/` or `types.ts` - TypeScript types
