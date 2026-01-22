# Auto Production - TODO List

## Critical (Required for functionality)

### AI Integration
- [ ] **Connect ai-helper.ts to OpenAI**
  - File: `auto-story/services/ai-helper.ts`
  - Replace placeholder with actual OpenAI SDK call
  - Test with GPT-4

- [ ] **Test Script Generation**
  - Verify script-writer agent works
  - Test with all 4 templates
  - Validate output format

- [ ] **Test Scene Breakdown**
  - Verify scene-breaker agent works
  - Check duration calculations
  - Validate scene count

- [ ] **Test Visual Prompts**
  - Verify visual-prompter agent works
  - Check image prompt quality
  - Validate style keywords

### Storage Integration
- [ ] **Test Database Operations**
  - Create campaign
  - Create campaign items
  - Update progress
  - Query operations

### Video Composition
- [ ] **Implement Image Generation**
  - Connect to image model (Nano Banana / Imagen)
  - Generate images for each scene
  - Upload to Bunny CDN

- [ ] **Implement Video Generation** (if animated mode)
  - Connect to video model (Seedance / Kling)
  - Generate video clips
  - Upload to CDN

- [ ] **Implement Audio Generation**
  - Connect narrator agent to ElevenLabs
  - Generate voiceover for each scene
  - Sync with duration

- [ ] **Implement Video Composition**
  - Combine images/videos
  - Add transitions (if static)
  - Mix audio (voiceover + music)
  - Render final video
  - Upload to CDN

## High Priority

### Wizard Completion
- [ ] **Step 5: Scheduling**
  - Copy from `production-old/step7-scheduling.tsx`
  - Adapt for auto-story
  - Add to wizard

- [ ] **Step 6: Publishing**
  - Copy from `production-old/step8-publishing.tsx`
  - Adapt for auto-story
  - Add to wizard

### Dashboard Enhancements
- [ ] **Real-time Updates**
  - Implement WebSocket or SSE for live progress
  - Update dashboard without polling
  - Show generation stages

- [ ] **Story Preview Grid**
  - Better thumbnail display
  - Hover preview
  - Quick actions

### Error Handling
- [ ] **Retry Logic**
  - Implement regenerate failed stories
  - Add retry count limit
  - Better error messages

- [ ] **Validation**
  - Validate topics before generation
  - Check API keys
  - Verify settings

## Medium Priority

### Shared Services
- [ ] **Scheduler Service**
  - Calculate publish dates
  - Respect max per day limits
  - Handle preferred hours

- [ ] **Publisher Service**
  - YouTube integration
  - TikTok integration
  - Instagram integration
  - Track publish status

### Auto Story Enhancements
- [ ] **Template Customization**
  - Allow users to customize template structure
  - Add template presets
  - Save custom templates

- [ ] **Batch Actions**
  - Edit multiple stories at once
  - Bulk regenerate
  - Bulk schedule

### UI/UX Improvements
- [ ] **Loading States**
  - Better skeleton loaders
  - Progress animations
  - Smooth transitions

- [ ] **Empty States**
  - No campaigns yet
  - No stories generated
  - Failed generation

- [ ] **Success States**
  - Generation complete celebration
  - Publishing success
  - Share campaign results

## Low Priority

### Auto Video Implementation
- [ ] **Narrative Video Mode**
  - Wizard steps
  - Generation logic
  - Multi-video batch

- [ ] **Character Vlog Mode**
  - Character selection
  - Vlog-specific settings
  - First-person narration

- [ ] **Ambient Visual Mode**
  - Atmosphere settings
  - Looping options
  - Long-form generation

### ASMR Templates
- [ ] **Auto ASMR**
  - Automated ASMR generation
  - Sound design
  - Visual prompts

- [ ] **ASMR (Manual)**
  - Detailed controls
  - Layer management
  - Sound mixing

### Advanced Features
- [ ] **A/B Testing**
  - Generate variations
  - Compare performance
  - Select winner

- [ ] **Analytics**
  - Track generation metrics
  - Monitor performance
  - Optimize templates

- [ ] **Batch Optimization**
  - Parallel generation
  - Queue priority
  - Resource management

---

## Testing Checklist

### Unit Tests
- [ ] Test template structures
- [ ] Test scene calculations
- [ ] Test validation logic

### Integration Tests
- [ ] Test API endpoints
- [ ] Test database operations
- [ ] Test AI agent calls

### E2E Tests
- [ ] Create campaign flow
- [ ] Generate 10 stories
- [ ] Review & approve
- [ ] Schedule & publish

---

## Notes

### Known Issues
1. AI integration placeholder - needs OpenAI connection
2. Video composition not implemented - generates metadata only
3. Scheduling/Publishing features incomplete

### Future Enhancements
1. Support for custom templates
2. Template marketplace
3. Collaborative campaigns
4. Version control for stories
5. Performance analytics
