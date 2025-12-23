# Tab 1 Complete Flow - Visual Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER CREATES NEW VIDEO                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────┐
         │ 1. User clicks "Create New Video"                │
         │ 2. Enters title: "Nike Air Max Campaign"        │
         │ 3. Selects mode: "Social Commerce"              │
         └──────────────────────────────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────┐
         │ Frontend Navigation:                             │
         │ → /videos/commerce/new?title=Nike...&workspace=xxx│
         └──────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AUTO-CREATE VIDEO IN DB                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         │                                                      │
         ▼                                                      ▼
    ┌─────────────────────────┐                    ┌─────────────────────────┐
    │ Frontend Detects:       │                    │ Backend Receives:       │
    │ - isNewVideo = true     │      POST          │ POST /api/social-       │
    │ - workspaceId exists    │    ─────────►      │   commerce/videos       │
    │                         │                    │                         │
    │ Calls API automatically │                    │ Body:                   │
    │                         │                    │ {                       │
    │                         │                    │   workspaceId,          │
    │                         │                    │   title,                │
    │                         │                    │   productTitle,         │
    │                         │                    │   aspectRatio: "9:16",  │
    │                         │                    │   duration: 15          │
    │                         │                    │ }                       │
    └─────────────────────────┘                    └─────────────────────────┘
                                                                │
                                                                ▼
                                                    ┌─────────────────────────┐
                                                    │ Database INSERT:        │
                                                    │                         │
                                                    │ videos table:           │
                                                    │ - id: uuid()            │
                                                    │ - mode: "commerce"      │
                                                    │ - status: "draft"       │
                                                    │ - currentStep: 1        │
                                                    │ - completedSteps: []    │
                                                    │ - step1Data: {          │
                                                    │     productTitle,       │
                                                    │     aspectRatio,        │
                                                    │     duration            │
                                                    │   }                     │
                                                    └─────────────────────────┘
                                                                │
                                                                ▼
         ┌──────────────────────────────────────────────────────────────┐
         │ Returns video object with generated ID                       │
         │ Frontend updates URL: /videos/commerce/{videoId}             │
         │ Video now appears in video list!                             │
         └──────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER FILLS TAB 1 FIELDS                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         │ Required Fields:                                    │
         │ ✓ Product Title: "Nike Air Max"                     │
         │ ✓ Target Audience: "Gen Z sneaker enthusiasts"      │
         │ ✓ Campaign Objective: "showcase"                    │
         │ ✓ Motion DNA: "Dynamic camera movements..."         │
         │ ✓ Image Style: "Vibrant colors, high energy..."     │
         │ ✓ Duration: 15s                                      │
         │ ✓ Aspect Ratio: 9:16                                │
         │                                                      │
         │ Continue button enabled ✓                           │
         └──────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      USER CLICKS "CONTINUE" BUTTON                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         │                                                      │
         ▼                                                      ▼
    ┌─────────────────────────┐                    ┌─────────────────────────┐
    │ Frontend:               │                    │ Backend:                │
    │                         │      PATCH         │                         │
    │ handleNext() called     │    ─────────►      │ PATCH /api/social-      │
    │                         │                    │   commerce/videos/      │
    │ 1. Validates fields     │                    │   {id}/step/1/continue  │
    │ 2. Shows loading state  │                    │                         │
    │    "Running Agent 1.1..." │                  │ Body: step1Data         │
    │ 3. Disables button      │                    │ {                       │
    │                         │                    │   productTitle,         │
    │                         │                    │   targetAudience,       │
    │                         │                    │   campaignObjective,    │
    │                         │                    │   duration,             │
    │                         │                    │   customMotionInstr..., │
    │                         │                    │   customImageInstr...   │
    │                         │                    │ }                       │
    └─────────────────────────┘                    └─────────────────────────┘
                                                                │
                                                                ▼
                                                    ┌─────────────────────────┐
                                                    │ Route Handler:          │
                                                    │                         │
                                                    │ 1. Fetch video from DB  │
                                                    │ 2. Validate required    │
                                                    │    fields               │
                                                    │ 3. Build agent input    │
                                                    └─────────────────────────┘
                                                                │
                                                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AGENT 1.1 EXECUTION                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         │ optimizeStrategicContext() called                   │
         └──────────────────────────┬──────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────────┐
         │ 1. Build System Prompt (3000+ words)                 │
         │    - Cultural intelligence database                  │
         │    - Pacing profile selection logic                  │
         │    - Motion DNA translation guide                    │
         │    - Image instruction elevation guide               │
         │    - Output schema requirements                      │
         └──────────────────────────────────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────────┐
         │ 2. Build User Prompt                                 │
         │    ══════════════════════════════════════            │
         │    CAMPAIGN BRIEF                                    │
         │    ══════════════════════════════════════            │
         │    PRODUCT: Nike Air Max                             │
         │    TARGET AUDIENCE: Gen Z sneaker enthusiasts        │
         │    CAMPAIGN OBJECTIVE: showcase                      │
         │    DURATION: 15 seconds                              │
         │    ASPECT RATIO: 9:16                                │
         │                                                      │
         │    USER MOTION PREFERENCES:                          │
         │    Dynamic camera movements with speed ramps...      │
         │                                                      │
         │    USER STYLE PREFERENCES:                           │
         │    Vibrant colors, high energy...                    │
         │                                                      │
         │    TASK: Generate strategic context output           │
         └──────────────────────────────────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────────┐
         │ 3. Call OpenAI GPT-4o with JSON Schema              │
         │                                                      │
         │    payload: {                                        │
         │      temperature: 0.5,                               │
         │      input: [                                        │
         │        { role: "system", content: systemPrompt },    │
         │        { role: "user", content: userPrompt }         │
         │      ],                                              │
         │      text: {                                         │
         │        format: {                                     │
         │          type: "json_schema",                        │
         │          name: "strategic_context_output",           │
         │          strict: true,                               │
         │          schema: {                                   │
         │            type: "object",                           │
         │            properties: {                             │
         │              strategic_directives: { type: "string"},│
         │              pacing_profile: {                       │
         │                type: "string",                       │
         │                enum: ["FAST_CUT", "RHYTHMIC",        │
         │                       "LUXURY_SLOW", "DYNAMIC"]      │
         │              },                                      │
         │              optimized_motion_dna: { type: "string"},│
         │              optimized_image_instruction: {          │
         │                type: "string"                        │
         │              }                                       │
         │            },                                        │
         │            required: [all 4 fields],                 │
         │            additionalProperties: false               │
         │          }                                           │
         │        }                                             │
         │      }                                               │
         │    }                                                 │
         │                                                      │
         │    Retries: Up to 2 attempts                         │
         └──────────────────────────────────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────────┐
         │ 4. OpenAI Response (Structured Output)               │
         │                                                      │
         │ {                                                    │
         │   "strategic_directives": "Create visually          │
         │     compelling content for Gen Z sneaker            │
         │     enthusiasts. Leverage high-energy visual        │
         │     language with fast cuts and vibrant colors.     │
         │     Focus on authenticity over polish. Vertical     │
         │     framing for mobile-first consumption. Every     │
         │     frame should pulse with street culture energy.", │
         │                                                      │
         │   "pacing_profile": "FAST_CUT",                     │
         │                                                      │
         │   "optimized_motion_dna": "Speed-ramped tracking    │
         │     shots with handheld micro-drift. Whip-pan       │
         │     transitions at 0.3s intervals. Rack focus       │
         │     pull from f/1.4 for hero product isolation.     │
         │     360° orbital dolly at 15° elevation.",          │
         │                                                      │
         │   "optimized_image_instruction": "SOTA 8K          │
         │     cinematic render with hyper-realistic PBR       │
         │     textures. High dynamic range with saturated     │
         │     color palette. Anamorphic bokeh, film grain     │
         │     overlay. Volumetric god-rays for depth."        │
         │ }                                                    │
         │                                                      │
         │ Cost: $0.002                                         │
         └──────────────────────────────────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────────┐
         │ 5. Validation & Parsing                              │
         │    - Parse JSON (guaranteed valid by schema)         │
         │    - Validate field lengths                          │
         │    - Validate pacing_profile enum                    │
         │    - Return StrategicContextOutput                   │
         └──────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SAVE TO DATABASE                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         │ Backend Route Handler:                              │
         │                                                      │
         │ const finalStep1Data = {                            │
         │   ...step1Data,                                     │
         │   strategicContext: {                               │
         │     strategic_directives: "...",                    │
         │     pacing_profile: "FAST_CUT",                     │
         │     optimized_motion_dna: "...",                    │
         │     optimized_image_instruction: "...",             │
         │     cost: 0.002                                     │
         │   }                                                 │
         │ };                                                  │
         │                                                      │
         │ await storage.updateVideo(videoId, {                │
         │   step1Data: finalStep1Data,                        │
         │   currentStep: 2,                                   │
         │   completedSteps: [1]                               │
         │ });                                                 │
         └──────────────────────────────────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────────┐
         │ Database UPDATE:                                     │
         │                                                      │
         │ videos table (videoId):                              │
         │ ┌────────────────────────────────────────────────┐   │
         │ │ currentStep: 2                                 │   │
         │ │ completedSteps: [1]                            │   │
         │ │ step1Data: {                                   │   │
         │ │   productTitle: "Nike Air Max",                │   │
         │ │   targetAudience: "Gen Z...",                  │   │
         │ │   campaignObjective: "showcase",               │   │
         │ │   duration: 15,                                │   │
         │ │   aspectRatio: "9:16",                         │   │
         │ │   customMotionInstructions: "...",             │   │
         │ │   customImageInstructions: "...",              │   │
         │ │   strategicContext: {                          │   │
         │ │     strategic_directives: "...",               │   │
         │ │     pacing_profile: "FAST_CUT",                │   │
         │ │     optimized_motion_dna: "...",               │   │
         │ │     optimized_image_instruction: "...",        │   │
         │ │     cost: 0.002                                │   │
         │ │   }                                            │   │
         │ │ }                                              │   │
         │ └────────────────────────────────────────────────┘   │
         └──────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND RECEIVES SUCCESS                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         │ 1. Toast: "Strategic Context Generated"             │
         │    "Agent 1.1 has optimized your campaign strategy" │
         │                                                      │
         │ 2. Mark step "setup" as completed (green ✓)         │
         │                                                      │
         │ 3. Advance to Tab 2 ("script")                      │
         │                                                      │
         │ 4. Hide loading state                               │
         └──────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER LEAVES & RETURNS                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         │ Days later...                                       │
         │ User navigates to Videos page                       │
         └──────────────────────────┬──────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────────┐
         │ Videos List shows:                                   │
         │                                                      │
         │ ┌────────────────────────────────────────────────┐   │
         │ │ Nike Air Max Campaign                          │   │
         │ │ Mode: Social Commerce                          │   │
         │ │ Status: Draft                                  │   │
         │ │ Progress: Step 2 of 5                          │   │
         │ │ Created: 2 days ago                            │   │
         │ │                                [Open Project >] │   │
         │ └────────────────────────────────────────────────┘   │
         └──────────────────────────────────────────────────────┘
                                    │
                          User clicks "Open Project"
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────────┐
         │ Frontend:                                            │
         │ - Navigates to /videos/commerce/{videoId}           │
         │ - useQuery fetches video from DB                    │
         │ - Restore effect runs                               │
         └──────────────────────────────────────────────────────┘
                                    │
                                    ▼
         ┌──────────────────────────────────────────────────────┐
         │ State Restoration:                                   │
         │                                                      │
         │ 1. Restore step1Data fields:                         │
         │    ✓ productTitle → setProductDetails              │
         │    ✓ targetAudience → setTargetAudience            │
         │    ✓ duration → setDuration                        │
         │    ✓ aspectRatio → setAspectRatio                  │
         │    ✓ customMotionInstructions → setMotionPrompt    │
         │    ✓ customImageInstructions → setImageInstructions│
         │                                                      │
         │ 2. Restore completedSteps:                           │
         │    [1] → ["setup"]                                  │
         │                                                      │
         │ 3. Restore currentStep:                              │
         │    currentStep: 2                                   │
         │    stepMap[2] = "script"                            │
         │    setActiveStep("script") ← USER LANDS ON TAB 2!  │
         │                                                      │
         │ 4. Tab 1 shows green checkmark ✓                    │
         │    Tab 2 is active                                  │
         │    User continues from where they left off          │
         └──────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
                              COMPLETE! ✨
═══════════════════════════════════════════════════════════════════════════════

KEY FEATURES:
✅ JSON Schema structured outputs (OpenAI best practice)
✅ Auto-create video on landing (immediate persistence)
✅ Agent runs on "Continue" click (user-triggered)
✅ Loading state during agent execution
✅ Strategic context saved to step1Data.strategicContext
✅ currentStep and completedSteps tracked in DB
✅ Video appears in list immediately after creation
✅ User resumes exactly where they left off
✅ All Tab 1 fields restored from database
✅ Professional UX with toast notifications
✅ Error handling with retry logic (2 attempts)
✅ Cost tracking for billing/analytics
```

