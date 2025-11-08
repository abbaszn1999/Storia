# Storia - AI Video Creator Platform

## Overview
Storia is a scalable, modular SaaS platform for creating AI-powered videos and stories. The platform guides users through the complete creative process from initial concept to final export and publishing.

## Current State
**MVP Focus**: Narrative Video Mode - Full-stack implementation with production-ready storage layer

### Implemented Features
- ✅ Complete database schema with PostgreSQL (users, workspaces, videos, stories, characters, voices, brandkits, uploads, content_calendar, **scenes, shots, shot_versions, reference_images**)
- ✅ Object storage integration for media files
- ✅ **Production-ready storage interface with full CRUD operations for narrative workflow**
  - Cascading deletes for scenes/shots/versions
  - Mutual exclusivity enforcement for approved shot versions
  - Automatic currentVersionId pointer management
- ✅ Comprehensive frontend with Storia brand identity (purple/magenta/cyan gradient theme)
- ✅ Full navigation with sidebar (Dashboard, Videos, Stories, Calendar, Assets)
- ✅ **Complete Narrative Video workflow with functional components:**
  - **Script Editor**: AI generation, duration/genre/language selection
  - **World & Cast**: Character creation, reference image upload for style/character consistency
  - **Scene Breakdown**: Automatic script analysis, scene/shot visualization, **full CRUD operations (add/edit/delete scenes and shots)**
  - **Storyboard Editor**: Shot-by-shot image generation, camera movement presets, regeneration
  - Animatic preview (placeholder)
  - Export & publish (placeholder)
- ✅ Component library (VideoCard, CharacterCard, StoryboardFrame, StatCard, CalendarItem, ModeSelector)
- ✅ Dark mode support with theme toggle
- ✅ Modular backend structure ready for AI integrations

## Project Architecture

### Database Tables
- **users**: User accounts with credits and subscription tier
- **workspaces**: User workspaces for organizing projects
- **videos**: Video projects with mode, status, script, scenes, storyboard data
- **stories**: Short-form content with templates
- **characters**: AI characters with appearance and voice settings
- **voices**: Voice profiles for character synthesis
- **brandkits**: Brand identity kits (colors, fonts, logos, guidelines)
- **uploads**: User-uploaded media files
- **content_calendar**: Scheduled content for publishing

### Frontend Structure
```
client/src/
├── components/
│   ├── app-sidebar.tsx         # Main navigation sidebar
│   ├── theme-provider.tsx      # Dark/light mode management
│   ├── theme-toggle.tsx        # Theme switcher button
│   ├── video-card.tsx          # Video project card
│   ├── character-card.tsx      # Character asset card
│   ├── storyboard-frame.tsx    # Storyboard shot frame
│   ├── stat-card.tsx           # Dashboard statistics
│   ├── mode-selector.tsx       # Video mode selection
│   ├── narrative-workflow.tsx  # Step-by-step workflow
│   ├── calendar-item.tsx       # Scheduled content item
│   └── examples/               # Component examples for testing
├── pages/
│   ├── dashboard.tsx           # Main dashboard
│   ├── videos.tsx              # Video project list
│   ├── narrative-mode.tsx      # Narrative workflow page
│   ├── characters.tsx          # Character management
│   └── calendar.tsx            # Content calendar
└── App.tsx                     # Main app with routing
```

### Backend Structure (Infrastructure Ready)
```
server/
├── routes.ts                   # API endpoint definitions
├── storage.ts                  # In-memory storage interface
└── (planned structure)
    ├── modes/
    │   ├── narrative/          # Narrative video mode logic
    │   ├── vlog/               # Character vlog mode
    │   ├── ambient/            # Ambient visual mode
    │   └── ...
    ├── ai-models/
    │   ├── text/               # OpenAI, Gemini, Claude
    │   ├── image/              # Imagen 4, GPT-Image
    │   ├── video/              # Kling, Veo, Runway
    │   └── voice/              # Eleven Labs, VoiceKiller
    ├── integrations/
    │   ├── youtube/            # YouTube OAuth & publishing
    │   ├── tiktok/             # TikTok integration
    │   ├── instagram/          # Instagram integration
    │   └── facebook/           # Facebook integration
    └── publisher/
        ├── scheduler/          # Content scheduling
        └── calendar/           # Calendar management
```

## Design System

### Brand Identity (Version 1.0 - Official)
- **Name**: Storia (ستوريا)
- **Brand Essence**: From spark to screen - cinematic, intelligent, accessible
- **Logo**: Gradient orb with Storia Pink → Violet → Orange colors

### Color System (Version 2.0 - Eye Comfort Optimized)
**Core Brand Colors:**
- **Brand Purple**: #8B3FFF (HSL 269° 100% 62%) - Main brand identity, primary actions
- **Deep Magenta**: #C944E6 (HSL 286° 77% 58%) - Softer vibrant accent, comfortable on eyes
- **Deep Purple UI**: #5B1FB3 (HSL 269° 71% 40%) - UI elements, darker states
- **Tech Blue**: #6D5BFF (HSL 250° 100% 67%) - Purple-blue accent for tech elements
- **Cyber Cyan**: #22D3EE (HSL 187° 85% 53%) - Professional comfortable cyan for highlights
- **Neutral Pink**: #FF3F8E (HSL 333° 100% 62%) - Energy, call-to-action accents

**Dark Mode Palette (Deep Purple-Tinted Theme):**
- **Dark Background**: #0A0A14 (HSL 240° 35% 4%) - Very dark, almost black base
- **Dark Card**: HSL(240° 28% 14%) - Elevated surfaces (cards, panels)
- **Dark Sidebar**: HSL(240° 32% 12%) - Sidebar background
- **Dark Borders**: HSL(240° 20% 20%) - Subtle borders and dividers
- **White**: #FFFFFF - Text & high contrast elements
- **Medium Gray**: #6D7780 - Muted text and secondary elements

**Light Mode Palette:**
- **Light Background**: #FFFFFF - Clean white base
- **Light Card**: HSL(220° 6% 97%) - Slightly off-white for elevation
- **Light Sidebar**: HSL(220° 6% 94%) - Sidebar background
- **Light Borders**: HSL(220° 13% 91%) - Subtle borders and dividers

**Design Philosophy:**
The purple/magenta/cyan palette creates a modern, professional aesthetic optimized for extended viewing. Deep purple-tinted backgrounds provide depth and dimension while the softer magenta (#C944E6) and comfortable cyan (#22D3EE) reduce eye strain during long creative sessions.

**Gradient Usage:**
- **Primary Gradient**: Purple → Magenta (#8B3FFF → #C944E6) - Main brand gradient
- **Energy Gradient**: Pink → Deep Purple (#FF3F8E → #5B1FB3) - High-energy elements
- Used for: Hero sections, CTAs, buttons, brand elements, loading states
- Implementation: `bg-gradient-storia` utility class (35° angle)

### Typography System
- **Primary/Headlines**: Plus Jakarta Sans - Modern, friendly, cinematic curves
- **Body Text**: Inter - Highly legible at small sizes
- **Accent/Numerals**: Space Grotesk - Tech elegance for stats and code-like labels
- **Fallbacks**: system-ui, Arial

### Accessibility
- WCAG AA contrast ratio 4.5:1 for body text
- White/Charcoal on Midnight Green backgrounds for optimal readability

### UI Patterns
- Dark mode by default with light mode support
- Sidebar navigation (280px fixed width)
- Card-based layouts with subtle elevation on hover
- Workflow step indicators with progress tracking
- Modal dialogs for creation flows
- Toast notifications for feedback

## Planned AI Integrations (Infrastructure Ready)

### Text Generation
- OpenAI: Script writing, scene breakdown
- Gemini: Alternative text generation
- Claude: Advanced narrative analysis

### Image Generation
- Imagen 4: Storyboard frame generation
- GPT-Image: Alternative image generation
- Nano Banana: Quick previews

### Video Generation
- Kling: Video synthesis
- Veo: Advanced video creation
- Runway: Motion graphics

### Voice Synthesis
- Eleven Labs: Character voices
- VoiceKiller: Voice cloning

### Publishing Platforms
- YouTube: OAuth + video upload
- TikTok: Short-form publishing
- Instagram: Stories and Reels
- Facebook: Video posts

## Development Workflow

### Current Phase: Frontend Prototype
- All UI components built and tested
- Dark mode fully functional
- Responsive design implemented
- Component examples for verification

### Next Phase: Backend Implementation
1. Set up AI model integrations (OpenAI, Gemini, Claude)
2. Implement Narrative Mode agents:
   - Script Writer
   - Scene Breakdown Analyzer
   - Image Prompt Generator
   - Character Creator
   - Video Animation Prompter
3. Build publishing integrations (YouTube, TikTok, etc.)
4. Implement credit system and subscription billing
5. Add real-time collaboration features

## User Preferences
- Focus on scalable, modular architecture
- Avoid future refactoring by organizing code properly upfront
- Infrastructure-first approach: prepare integration structure before implementation
- Clean separation between modes, AI models, and integrations

## Technical Stack
- **Frontend**: React + TypeScript, Wouter (routing), TanStack Query, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Storage**: Replit Object Storage
- **Deployment**: Replit (development and production)

## Notes
- Using in-memory storage (MemStorage) for MVP - ready to swap with database implementation
- All database schemas defined and ready for migration
- Component-driven development with examples for testing
- Modular folder structure prevents future refactoring
