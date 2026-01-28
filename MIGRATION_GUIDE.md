# Auto Production Migration Guide

## Overview
This guide explains the migration from the old production system to the new Auto Production architecture.

## What Changed

### 1. File Structure
**Old:**
```
client/src/
├── pages/production/
└── components/production/

server/
└── (No backend for production)
```

**New:**
```
client/src/autoproduction/
├── shared/          # Shared components
├── auto-story/      # Story production
└── auto-video/      # Video production

server/autoproduction/
├── shared/          # Shared services
├── auto-story/      # Story backend
└── auto-video/      # Video backend
```

### 2. Routes
**Old:**
- `/production` → Campaign list
- `/production/new` → Create wizard
- `/production/:id/review` → Review
- `/production/:id/dashboard` → Dashboard

**New:**
- `/autoproduction/story` → Story campaigns
- `/autoproduction/story/create` → Story wizard
- `/autoproduction/story/:id` → Story dashboard
- `/autoproduction/video` → Video campaigns (placeholder)

**Legacy routes still work** via `production-old/` files.

### 3. Database Schema

**Added:**
- `type` column to `production_campaigns` ('auto-video' | 'auto-story')
- `campaign_items` table (replaces `campaign_videos`)
- New columns for Auto Story settings

**No data loss** - existing campaigns still work via legacy code.

### 4. Navigation

**Sidebar updated:**
- "Auto Production" section now has:
  - "Auto Story" ✓
  - "Auto Video" (Coming Soon)

## Migration Steps

### Phase 1: Completed ✓
- [x] Archive old files to `production-old/`
- [x] Update database schema
- [x] Create new structure
- [x] Implement Auto Story
- [x] Update routes & navigation

### Phase 2: Testing
- [ ] Test Auto Story wizard flow
- [ ] Test batch generation (10 topics)
- [ ] Test progress tracking
- [ ] Test review & approval

### Phase 3: AI Integration
- [ ] Connect to OpenAI for script generation
- [ ] Connect to ElevenLabs for voiceover
- [ ] Connect to image/video models

### Phase 4: Auto Video
- [ ] Implement Narrative Video mode
- [ ] Implement Character Vlog mode
- [ ] Implement Ambient Visual mode

### Phase 5: Advanced Features
- [ ] Scheduling service
- [ ] Publishing service
- [ ] Auto ASMR template
- [ ] ASMR template

## Breaking Changes

None. Old system remains functional via archived files.

## Rollback Plan

If issues arise:
1. Revert sidebar to point to `/production`
2. Restore old routes in App.tsx
3. Old system in `production-old/` still works

## Notes for Team

### For Story Template Development (زميلك)
Work in:
- `client/src/autoproduction/auto-story/`
- `server/autoproduction/auto-story/`

Focus on:
- Template-specific generators
- Scene breakdown logic
- Prompt engineering

### For Video Development (أنت)
Work in:
- `client/src/autoproduction/auto-video/`
- `server/autoproduction/auto-video/`

Structure is ready - implement:
- Video mode wizards
- Generation services
- Mode-specific logic

### Shared Work
Both work on:
- `autoproduction/shared/` - Shared components & services
- Scheduling & publishing features
- Testing & polish
