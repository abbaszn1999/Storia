# Agent 5.1: Sora Chunk Prompt Architect - Visual Plan

## Overview

**Agent Name**: Sora Chunk Prompt Architect (Agent 5.1)

**Purpose**: Generate optimized Sora prompts for 8-second video chunks containing multiple shots

**When It Runs**: After Agent 4.1 completes, sequentially for each chunk (Chunk 1 → Chunk 2 → Chunk 3 → Chunk 4)

---

## Sequential Generation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHUNK CALCULATION (Function)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Input: All shots from Agent 4.1                                 │
│  Process: Divide into 8s chunks                                  │
│  Output:                                                        │
│    Chunk 1: Shots [S1.1, S1.2, S1.3, S1.4, S1.5]              │
│    Chunk 2: Shots [S2.1, S2.2, S2.3, S2.4, S2.5]              │
│    Chunk 3: Shots [S3.1, S3.2, S3.3, S3.4, S3.5]              │
│    Chunk 4: Shots [S4.1, S4.2, S4.3, S4.4, S4.5]              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CHUNK 1: Generate Prompt                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Agent 5.1 Input:                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ Chunk Assignment:                                      │  │
│  │    "You are working on CHUNK 1.                           │  │
│  │     Shots in this chunk: S1.1, S1.2, S1.3, S1.4, S1.5"   │  │
│  │                                                            │  │
│  │ ✅ All Shots Context (from Tab 4):                        │  │
│  │    [Complete details for ALL shots S1.1 through S4.5]     │  │
│  │    (Agent already has all shot details in context)         │  │
│  │                                                            │  │
│  │ ✅ Tab 1, 2, 3 Contexts:                                  │  │
│  │    [All strategic, product, visual context]                │  │
│  │                                                            │  │
│  │ ❌ Previous Chunk Prompt: None (first chunk)             │  │
│  │ ❌ Static Consistency Prompt: None (first chunk)         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Agent 5.1 Processing:                                           │
│  1. Identify shots S1.1-S1.5 from all shots context           │  │
│  2. Build timeline for these shots                              │  │
│  3. Generate audio section (from Tab 1 settings)                │  │
│  4. Add end frame requirement                                   │  │
│  5. Compress context                                            │  │
│  6. Assemble final prompt                                       │  │
│                                                                  │
│  Agent 5.1 Output:                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Full Sora Prompt:                                         │  │
│  │ "Starting from input image (@InputFrame), generate...    │  │
│  │                                                            │  │
│  │  TIMELINE:                                                │  │
│  │  At 0.0s: Shot S1.1 - ...                                 │  │
│  │  At 0.5s: Shot S1.2 - ...                                 │  │
│  │  At 1.3s: Shot S1.3 - ...                                 │  │
│  │  At 2.5s: Shot S1.4 - ...                                 │  │
│  │  At 4.0s: Shot S1.5 - ...                                 │  │
│  │                                                            │  │
│  │  AUDIO GENERATION:                                        │  │
│  │  - Sound effects: Energetic pulse, sharp percussive...   │  │
│  │  - SFX hints: [From shots]                                │  │
│  │  - Music: Modern beats, high-energy...                   │  │
│  │                                                            │  │
│  │  END FRAME REQUIREMENT:                                   │  │
│  │  Final frame at 8.0s must show product clearly..."       │  │
│  │                                                            │  │
│  │  CONTEXT: [Compressed context]"                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Save: Chunk 1 Full Prompt                                      │  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CHUNK 2: Generate Prompt                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Agent 5.1 Input:                                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ Chunk Assignment:                                      │  │
│  │    "You are working on CHUNK 2.                           │  │
│  │     Shots in this chunk: S2.1, S2.2, S2.3, S2.4, S2.5"   │  │
│  │                                                            │  │
│  │ ✅ All Shots Context (from Tab 4):                        │  │
│  │    [Complete details for ALL shots S1.1 through S4.5]     │  │
│  │    (Same as Chunk 1 - agent has all shots)                │  │
│  │                                                            │  │
│  │ ✅ Tab 1, 2, 3 Contexts:                                  │  │
│  │    [All strategic, product, visual context]                │  │
│  │                                                            │  │
│  │ ✅ Previous Chunk Prompt:                                 │  │
│  │    [FULL Chunk 1 prompt text - includes audio section]     │  │
│  │    Agent can see exactly how audio was handled in Chunk 1  │  │
│  │                                                            │  │
│  │ ✅ Static Consistency Prompt:                             │  │
│  │    "Maintain audio consistency with previous chunk.       │  │
│  │     Ensure final frame shows product clearly..."           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Agent 5.1 Processing:                                           │
│  1. Identify shots S2.1-S2.5 from all shots context           │  │
│  2. Read Chunk 1's audio section from previous prompt         │  │
│  3. Build timeline for shots S2.1-S2.5                          │  │
│  4. Generate audio section (maintaining Chunk 1 style)         │  │
│  5. Add end frame requirement                                   │  │
│  6. Compress context                                            │  │
│  7. Assemble final prompt                                       │  │
│                                                                  │
│  Agent 5.1 Output:                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Full Sora Prompt:                                         │  │
│  │ "Starting from input image (@InputFrame), generate...    │  │
│  │                                                            │  │
│  │  TIMELINE:                                                │  │
│  │  At 0.0s: Shot S2.1 - ...                                 │  │
│  │  At 0.8s: Shot S2.2 - ...                                 │  │
│  │  ...                                                       │  │
│  │                                                            │  │
│  │  AUDIO CONSISTENCY:                                       │  │
│  │  Maintain: Energetic pulse, sharp percussive hits,       │  │
│  │  modern beats, high-energy mood (from Chunk 1).          │  │
│  │  Generate: Sound effects matching visual energy.        │  │
│  │  SFX hints: [From Chunk 2 shots]                          │  │
│  │                                                            │  │
│  │  END FRAME REQUIREMENT:                                   │  │
│  │  Final frame at 8.0s must show product clearly..."       │  │
│  │                                                            │  │
│  │  CONTEXT: [Compressed context]"                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Save: Chunk 2 Full Prompt                                      │  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CHUNK 3: Generate Prompt                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Same pattern as Chunk 2:                                       │  │
│  - Chunk assignment: "CHUNK 3, Shots: S3.1, S3.2, S3.3..."     │  │
│  - All shots context: [Same - all shots already in context]     │  │
│  - Previous chunk: [FULL Chunk 2 prompt]                        │  │
│  - Static consistency prompt: [Same instruction]               │  │
│                                                                  │
│  Agent reads Chunk 2's audio section and maintains consistency   │  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CHUNK 4: Generate Prompt (Final)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Same pattern as Chunk 3:                                       │  │
│  - Chunk assignment: "CHUNK 4, Shots: S4.1, S4.2, S4.3..."     │  │
│  - All shots context: [Same - all shots already in context]     │  │
│  - Previous chunk: [FULL Chunk 3 prompt]                        │  │
│  - Static consistency prompt: [Same instruction]               │  │
│                                                                  │
│  Agent reads Chunk 3's audio section and maintains consistency  │  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Input Structure (Simplified)

### For Chunk 1:
```
┌─────────────────────────────────────────────────────────┐
│ 1. Chunk Assignment:                                    │
│    "You are working on CHUNK 1.                          │
│     Shots in this chunk: S1.1, S1.2, S1.3, S1.4, S1.5" │
│                                                         │
│ 2. All Shots Context (from Tab 4):                     │
│    [Complete details for ALL shots S1.1 through S4.5]   │
│    (Agent already has all shot details - no need to      │
│     repeat shot details in chunk assignment)             │
│                                                         │
│ 3. Tab 1, 2, 3 Contexts:                               │
│    [All campaign context]                              │
│                                                         │
│ 4. Previous Chunk Prompt: None                           │
│                                                         │
│ 5. Static Consistency Prompt: None                       │
└─────────────────────────────────────────────────────────┘
```

### For Chunk 2+:
```
┌─────────────────────────────────────────────────────────┐
│ 1. Chunk Assignment:                                    │
│    "You are working on CHUNK 2.                         │
│     Shots in this chunk: S2.1, S2.2, S2.3, S2.4, S2.5" │
│                                                         │
│ 2. All Shots Context (from Tab 4):                     │
│    [Complete details for ALL shots S1.1 through S4.5]   │
│    (Same as Chunk 1 - agent has all shots)              │
│                                                         │
│ 3. Tab 1, 2, 3 Contexts:                               │
│    [All campaign context - same as Chunk 1]             │
│                                                         │
│ 4. Previous Chunk Prompt:                               │
│    [FULL previous chunk prompt text]                    │
│    Agent can see:                                        │
│    - How audio was handled in previous chunk            │
│    - Exact audio style and instructions                 │
│    - Full context of previous generation                │
│                                                         │
│ 5. Static Consistency Prompt:                            │
│    "Maintain audio consistency with previous chunk.    │
│     Ensure final frame shows product clearly..."        │
└─────────────────────────────────────────────────────────┘
```

---

## Agent 5.1 Processing Steps

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: Identify Chunk Shots                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Agent reads chunk assignment:                          │
│  "CHUNK 2, Shots: S2.1, S2.2, S2.3, S2.4, S2.5"        │
│                                                         │
│  Agent looks up these shot IDs in the all shots context │
│  (which is already provided in the prompt)              │
│                                                         │
│  Result: Agent knows exactly which shots to include    │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 2: Build Timeline Section                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  For each shot in chunk:                                │
│  - Extract shot details from all shots context         │
│  - Calculate cumulative timeline                        │
│  - Format: "At X.Xs: Shot ID - description, duration"  │
│                                                         │
│  Result: Complete timeline for chunk                     │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 3: Generate Audio Section                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  For Chunk 1:                                           │
│  - Read Tab 1 audio settings                            │
│  - Generate audio section based on campaign settings    │
│                                                         │
│  For Chunk 2+:                                          │
│  - Read previous chunk's FULL prompt                   │
│  - See how audio was handled in previous chunk          │
│  - Extract audio style from previous prompt             │
│  - Maintain same audio style                            │
│  - Generate audio section maintaining consistency       │
│                                                         │
│  Result: Audio section with consistency                 │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 4: Add End Frame Requirement                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Agent adds explicit instruction:                       │
│  "Final frame at X.Xs must show product clearly..."     │
│                                                         │
│  Result: End frame requirement included                 │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 5: Compress Context                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Agent compresses Tab 1, 2, 3 contexts into single line │
│  Format: "GenZ|FAST_CUT|golden-hour|void|@Product"     │
│                                                         │
│  Result: Compressed context line                        │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 6: Assemble Final Prompt                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Combine all sections:                                  │
│  1. Header: "Starting from input image..."              │
│  2. Timeline section                                    │
│  3. Audio section                                       │
│  4. End frame requirement                               │
│  5. Context line                                        │
│                                                         │
│  Result: Complete Sora prompt ready                     │
└─────────────────────────────────────────────────────────┘
```

---

## Audio Consistency Flow

```
┌─────────────────────────────────────────────────────────┐
│ CHUNK 1: Initial Audio                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Agent reads Tab 1 audio settings:                       │
│  - soundEffectsPreset: "energetic-pulse"                │
│  - musicMood: "high-energy"                              │
│  - [All other Tab 1 audio settings]                       │
│                                                         │
│  Agent generates:                                        │
│  "AUDIO GENERATION:                                      │
│   - Sound effects: Energetic pulse, sharp percussive... │
│   - Music: Modern beats, high-energy mood"              │
│                                                         │
│  Full prompt saved (includes audio section)              │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│ CHUNK 2: Maintain Consistency                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Agent receives:                                         │
│  - Full Chunk 1 prompt (includes audio section)         │
│                                                         │
│  Agent reads Chunk 1's audio section:                   │
│  "AUDIO GENERATION:                                      │
│   - Sound effects: Energetic pulse, sharp percussive... │
│   - Music: Modern beats, high-energy mood"              │
│                                                         │
│  Agent generates for Chunk 2:                            │
│  "AUDIO CONSISTENCY:                                     │
│   Maintain: Energetic pulse, sharp percussive hits,    │
│   modern beats, high-energy mood (from Chunk 1).        │
│   Generate: Sound effects matching visual energy.      │
│   SFX hints: [From Chunk 2 shots]"                     │
│                                                         │
│  Full prompt saved (includes audio section)              │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│ CHUNK 3: Maintain Consistency                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Same pattern:                                           │
│  - Receives full Chunk 2 prompt                          │
│  - Reads Chunk 2's audio section                         │
│  - Maintains consistency                                │
│                                                         │
│  Full prompt saved                                       │
└─────────────────────────────────────────────────────────┘
```

---

## Key Points

1. **Chunk Assignment is Simple**: Only tells agent which chunk number and which shot IDs to include
2. **All Shots Already in Context**: Agent has complete details for all shots from Tab 4 - no need to repeat
3. **Previous Chunk Full Prompt**: Agent sees the complete previous chunk prompt, including how audio was handled
4. **Audio Consistency**: Agent reads previous chunk's audio section and maintains the same style
5. **Sequential Processing**: Each chunk references the immediately previous chunk (Chunk 2 → Chunk 1, Chunk 3 → Chunk 2, etc.)

---

## Summary

**Flow**: Chunk Calculator → Chunk 1 (standalone) → Chunk 2 (references Chunk 1) → Chunk 3 (references Chunk 2) → Chunk 4 (references Chunk 3)

**Key Simplification**: Chunk assignment only specifies chunk number and shot IDs. All shot details are already in the context from Tab 4. Previous chunk's full prompt provides audio consistency reference.
