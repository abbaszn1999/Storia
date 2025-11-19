# Storia - AI Video Creator Platform

## Overview
Storia is a scalable, modular SaaS platform designed for creating AI-powered videos and stories. Its primary purpose is to guide users through the entire creative process, from initial concept generation to final video export and publishing. The platform aims to revolutionize video creation by leveraging AI for narrative development, visual asset generation, and seamless transitions. The MVP focuses on a "Narrative Video Mode" with a production-ready storage layer and a "Start-End Frame" workflow integration for advanced continuity.

## User Preferences
- Focus on scalable, modular architecture
- Avoid future refactoring by organizing code properly upfront
- Infrastructure-first approach: prepare integration structure before implementation
- Clean separation between modes, AI models, and integrations

## System Architecture

### Core Design Principles
The platform follows a modular design with clear separation of concerns, supporting multiple video creation modes and integrating various AI models. It emphasizes a robust backend structure capable of handling diverse AI integrations and external publishing platforms.

### UI/UX Decisions
- **Brand Identity**: Storia (ستوريا) - Cinematic, intelligent, accessible, with a gradient orb logo (Storia Pink → Violet → Orange).
- **Color System**: Optimized for eye comfort with a primary palette of Brand Purple (#8B3FFF), Deep Magenta (#C944E6), Deep Purple UI (#5B1FB3), Tech Blue (#6D5BFF), Cyber Cyan (#22D3EE), and Neutral Pink (#FF3F8E). Default dark mode with a deep purple-tinted theme, and light mode support.
- **Typography**: Plus Jakarta Sans for headlines, Inter for body text, and Space Grotesk for accents/numerals.
- **UI Patterns**: Sidebar navigation, card-based layouts, workflow step indicators, modal dialogs, and toast notifications. Dark mode is default.
- **Accessibility**: WCAG AA contrast ratio compliance.

### Technical Implementations
- **Narrative Video Workflow**: Guides users through Script Editor, World & Cast, Scene Breakdown, Storyboard Editor, Animatic Preview, and Export & Publish.
- **Dual Narrative Modes**:
    - **Image-Reference Mode**: Single reference image per shot.
    - **Start-End Frame Mode**: Connects shots with seamless transitions via continuity groups, utilizing AI for shot connection proposals. Connected shots automatically display the next shot's start frame as their end frame, with real-time syncing when the next shot changes.
- **Version Control**: Unified version history with video support for shot-by-shot generation, including preview, comparison, and activation of versions. Single dynamic video generation button that changes from "Generate Video" to "Regenerate" based on video existence.
- **Multi-Workspace Architecture**: Supports managing separate social media integrations for different brands or clients within isolated workspaces.
- **Publishing Flow**: Allows users to select platforms, handles connection status, uploads video with metadata, and supports immediate or scheduled publishing via a content calendar.
- **Export Page**: Features final video preview at the top, displaying the latest version of the compiled video with export settings and platform metadata below.

### Database Schema (Core Tables)
- `users`: User accounts.
- `workspaces`: Project organization.
- `videos`: Video projects, including mode, narrative mode, status, script, and continuityLocked flag.
- `characters`: AI character definitions.
- `voices`: Voice profiles.
- `brandkits`: Brand identity assets.
- `uploads`: User media files.
- `scenes`: Scene breakdowns.
- `shots`: Individual shots.
- `shot_versions`: Version control for shots, including start/end frame URLs and video URLs.
- `reference_images`: Character/location/style references.
- `continuity_groups`: For connected shot sequences in Start-End Frame mode.
- `workspace_integrations`: OAuth connections for social media publishing.

### AI Agent System
A comprehensive system with 24 specialized agents (18 AI, 6 non-AI) supporting dual narrative modes. Agents handle tasks across text generation (Script Generator, Scene Analyzer), image generation (Character Image Generator, Storyboard Image Generator), video generation (Video Generator, Video Compositor), audio generation (Voiceover Synthesizer, Background Music Composer), vision & analysis, and platform publishing. Key agents include the Continuity Producer and Continuity Manager for Start-End Frame mode.

### Technology Stack
- **Frontend**: React, TypeScript, Wouter, TanStack Query, Tailwind CSS, Shadcn UI.
- **Backend**: Express.js, Node.js.
- **Database**: PostgreSQL with Drizzle ORM.
- **Storage**: Replit Object Storage.
- **Deployment**: Replit.

## External Dependencies

- **Replit Connector**: Used for YouTube OAuth integration.
- **YouTube Data API v3**: For publishing videos to YouTube.
- **TikTok Content Posting API**: For publishing to TikTok.
- **Facebook Graph API**: For publishing to Instagram and Facebook (including Reels).
- **AI Models (Planned Integrations)**:
    - **Text Generation**: OpenAI (GPT-4), Claude, Gemini.
    - **Image Generation**: Imagen 4, DALL-E 3.
    - **Video Generation**: Kling, Veo, Runway.
    - **Voice Generation**: Eleven Labs, Google TTS.
    - **Music Generation**: Suno, MusicGen.