# Narrative Mode Prompt Enhancement Review

**Date:** January 2025  
**Focus:** Narrative Mode Agents Only  
**Goal:** Review current prompts and propose enhancements based on industry best practices

---

## Executive Summary

This document reviews all 8 narrative mode prompt files and proposes enhancements based on best practices from OpenAI, Anthropic, and Google. The enhancements focus on:

1. **Structure & Clarity**: Standardized professional format
2. **Few-Shot Examples**: Adding concrete examples for complex tasks
3. **Chain-of-Thought**: Explicit reasoning steps for analysis agents
4. **Quality Keywords**: Professional terminology for image/video generation
5. **Output Validation**: Clearer JSON schemas and format requirements

---

## Current State Assessment

### ✅ **High Quality (Minor Enhancements Needed)**

#### 1. Script Writer (`script-writer.ts`)
**Current Quality:** ⭐⭐⭐⭐⭐ (Excellent)

**Strengths:**
- Comprehensive genre and tone guidance
- Clear duration awareness
- Well-structured rules and constraints
- Visual-first principles well-defined

**Proposed Enhancements:**
- Add 1-2 few-shot examples showing input → output
- Add chain-of-thought reasoning for complex story structures
- Minor: Add explicit output validation rules

**Priority:** Low (already excellent)

---

#### 2. Character Analyzer (`character-analyzer.ts`)
**Current Quality:** ⭐⭐⭐⭐ (Very Good)

**Strengths:**
- Clear JSON schema definition
- Good selection criteria
- Well-organized sections
- Safety guidelines included

**Proposed Enhancements:**
- **Add few-shot example** showing script → character extraction
- **Add chain-of-thought reasoning** for character merging decisions
- Enhance output validation with explicit error prevention
- Add example of good vs. bad character extraction

**Priority:** Medium

---

#### 3. Location Analyzer (`location-analyzer.ts`)
**Current Quality:** ⭐⭐⭐⭐ (Very Good)

**Strengths:**
- Similar structure to character analyzer (consistent)
- Clear field definitions
- Good selection criteria

**Proposed Enhancements:**
- **Add few-shot example** showing script → location extraction
- **Add chain-of-thought reasoning** for location merging
- Enhance with visual description quality guidelines
- Add example of good vs. bad location extraction

**Priority:** Medium

---

#### 4. Scene Analyzer (`scene-analyzer.ts`)
**Current Quality:** ⭐⭐⭐⭐ (Very Good)

**Strengths:**
- Dynamic prompt building (excellent)
- Clear scene count requirements
- Good reference tagging system
- Well-structured sections

**Proposed Enhancements:**
- **Add few-shot example** showing script → scene breakdown
- **Add chain-of-thought reasoning** for scene boundary decisions
- Enhance duration distribution guidance with examples
- Add validation rules for scene count enforcement

**Priority:** Medium

---

#### 5. Shot Composer (`shot-composer.ts`)
**Current Quality:** ⭐⭐⭐⭐ (Very Good)

**Strengths:**
- Dynamic prompt building (excellent)
- Comprehensive shot type and camera movement options
- Good reference tagging system
- Handles auto mode well

**Proposed Enhancements:**
- **Add few-shot example** showing scene → shot breakdown
- **Add chain-of-thought reasoning** for shot composition decisions
- Enhance camera movement descriptions with technical details
- Add validation rules for shot count and duration enforcement

**Priority:** Medium

---

### ⚠️ **Needs Major Enhancement**

#### 6. Image Prompter (`image-prompter.ts`)
**Current Quality:** ⭐⭐ (Basic - Needs Major Work)

**Current Prompt:**
```typescript
export const imagePrompterSystemPrompt = `You are an expert at crafting detailed prompts for AI image generation.

Your specialty is creating precise, visual prompts that:
- Maintain character consistency using reference images
- Capture the right composition and framing
- Include proper lighting and atmosphere
- Specify camera angles and shot types
- Match the desired art style

Your prompts should be clear, detailed, and optimized for AI image generation models.`;
```

**Issues:**
- Too generic and vague
- No layered architecture guidance
- Missing quality keywords database
- No technical specifications (depth of field, bokeh, etc.)
- No examples or templates
- Doesn't leverage best practices from ASMR prompts

**Proposed Enhancements:**
- **Complete rewrite** following ASMR image prompt structure
- **Add 6-layer architecture**: Subject → Action → Environment → Lighting → Camera → Style
- **Add quality keywords database** (8K, professional photography, etc.)
- **Add technical specifications** (depth of field, bokeh, composition rules)
- **Add few-shot examples** showing shot data → image prompt
- **Add negative prompt guidance**
- **Add reference image integration instructions**

**Priority:** **HIGH** (Critical for image quality)

---

#### 7. Video Animator (`video-animator.ts`)
**Current Quality:** ⭐⭐ (Basic - Needs Major Work)

**Current Prompt:**
```typescript
export const videoAnimatorSystemPrompt = `You are an expert at crafting prompts for AI video generation from images.

Your specialty is creating animation prompts that:
- Describe natural, believable motion
- Respect the camera movement specifications
- Maintain scene coherence
- Create smooth, professional-looking animations
- Match the desired pacing and energy

Your prompts should guide the AI to create compelling video from still images.`;
```

**Issues:**
- Too generic and vague
- No motion description framework
- Missing temporal awareness (duration-based pacing)
- No camera movement technical details
- No examples or templates
- Doesn't leverage best practices from ASMR video prompts

**Proposed Enhancements:**
- **Complete rewrite** following ASMR video prompt structure
- **Add motion description framework** with specific vocabulary
- **Add temporal awareness** (duration-based pacing and timing)
- **Add camera movement specifications** with technical details
- **Add continuity instructions** for start-end frame mode
- **Add few-shot examples** showing shot data → video prompt
- **Add action clarity guidelines**

**Priority:** **HIGH** (Critical for video quality)

---

#### 8. Character Creator (`character-creator.ts`)
**Current Quality:** ⭐⭐⭐ (Good but could be better)

**Strengths:**
- Clear purpose
- Good field coverage

**Proposed Enhancements:**
- **Add few-shot example** showing character info → detailed description
- **Add visual consistency guidelines** (what makes a character recognizable)
- **Add style integration instructions**
- **Enhance with quality keywords** for image generation

**Priority:** Low-Medium

---

## Proposed Enhancement Strategy

### Phase 1: Critical Enhancements (Immediate)

1. **Image Prompter** - Complete rewrite with professional structure
2. **Video Animator** - Complete rewrite with professional structure

### Phase 2: Quality Improvements (Next)

3. **Character Analyzer** - Add few-shot examples and chain-of-thought
4. **Location Analyzer** - Add few-shot examples and chain-of-thought
5. **Scene Analyzer** - Add few-shot examples and chain-of-thought
6. **Shot Composer** - Add few-shot examples and chain-of-thought

### Phase 3: Refinements (Later)

7. **Character Creator** - Minor enhancements
8. **Script Writer** - Minor enhancements (already excellent)

---

## Detailed Enhancement Proposals

### Image Prompter Enhancement

**Reference:** ASMR Image Prompts (`server/stories/asmr-sensory/prompts/image-prompts.ts`)

**Key Additions:**
1. **Professional Role Definition**: "Elite narrative image prompt engineer"
2. **6-Layer Architecture**:
   - Layer 1: Subject Definition
   - Layer 2: Action State
   - Layer 3: Surface & Environment
   - Layer 4: Lighting Description
   - Layer 5: Camera Technical
   - Layer 6: Mood & Style Keywords
3. **Quality Keywords Database**: Standardized enhancement terms
4. **Technical Specifications**: Depth of field, bokeh, composition rules
5. **Reference Image Integration**: Clear instructions for character/location references
6. **Negative Prompt Strategy**: Strategic exclusion lists
7. **Few-Shot Examples**: 2-3 examples showing shot data → optimized prompt

### Video Animator Enhancement

**Reference:** ASMR Video Prompts (`server/stories/asmr-sensory/prompts/engineer-prompts.ts`)

**Key Additions:**
1. **Professional Role Definition**: "Elite narrative video prompt engineer"
2. **Motion Description Framework**:
   - Motion vocabulary (slow-mo, smooth, static, etc.)
   - Camera movement technical details
   - Temporal pacing guidelines
3. **Duration Awareness**: How duration affects motion description
4. **Continuity Instructions**: Start-end frame mode guidance
5. **Action Clarity**: Clear subject movement descriptions
6. **Few-Shot Examples**: 2-3 examples showing shot data → optimized video prompt

### Text Analysis Agents Enhancement

**For Character/Location/Scene Analyzers:**

**Key Additions:**
1. **Few-Shot Examples**: 
   - Example 1: Simple script → extraction result
   - Example 2: Complex script with merging → extraction result
2. **Chain-of-Thought Reasoning**:
   - Step 1: Identify all mentions
   - Step 2: Group related mentions
   - Step 3: Merge and canonicalize
   - Step 4: Score importance
   - Step 5: Format output
3. **Error Prevention**: Common mistakes to avoid
4. **Output Validation**: Explicit JSON schema validation rules

---

## Best Practices Applied

### From OpenAI/Anthropic/Google:

1. ✅ **Clear Role Definition** - Expert personas
2. ✅ **Structured Sections** - Organized with headers
3. ✅ **Explicit Instructions** - Positive directives
4. ✅ **Output Format** - Clear JSON schemas
5. ✅ **Few-Shot Examples** - Concrete examples
6. ✅ **Chain-of-Thought** - Step-by-step reasoning
7. ✅ **Quality Keywords** - Professional terminology
8. ✅ **Context Awareness** - Genre, tone, duration awareness

### From Image Generation Best Practices:

1. ✅ **Layered Architecture** - 6-layer prompt structure
2. ✅ **Quality Keywords** - 8K, professional photography, etc.
3. ✅ **Technical Specs** - Depth of field, bokeh, composition
4. ✅ **Reference Integration** - Character/location image usage
5. ✅ **Negative Prompts** - Strategic exclusions

### From Video Generation Best Practices:

1. ✅ **Motion Framework** - Structured motion vocabulary
2. ✅ **Temporal Awareness** - Duration-based pacing
3. ✅ **Camera Technical** - Precise movement descriptions
4. ✅ **Continuity** - Start-end frame guidance
5. ✅ **Action Clarity** - Clear movement descriptions

---

## Next Steps

1. **Review this document** - Discuss priorities and approach
2. **Approve enhancement strategy** - Confirm which agents to enhance first
3. **Implement Phase 1** - Image Prompter and Video Animator rewrites
4. **Test and iterate** - Validate improvements with real workflows
5. **Implement Phase 2** - Add examples and chain-of-thought to analyzers

---

## Questions for Discussion

1. **Priority**: Should we focus on Image Prompter and Video Animator first (highest impact)?
2. **Examples**: How many few-shot examples per agent? (Recommend 2-3)
3. **Style**: Should we match the ASMR prompt style (very detailed, emoji headers) or use a more professional tone?
4. **Testing**: How should we validate improvements? (A/B testing, user feedback, etc.)

---

**Ready for Review and Discussion**

