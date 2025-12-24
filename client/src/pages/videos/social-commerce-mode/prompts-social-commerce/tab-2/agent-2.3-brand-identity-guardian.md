# Agent 2.3: Brand Identity Guardian

## Overview

| Attribute | Value |
|-----------|-------|
| **Role** | Brand Asset Technical Auditor |
| **Type** | Algorithmic (No AI) |
| **Purpose** | Convert brand settings into generation-ready parameters |

### Critical Mission

This is a **pure algorithmic function** (no AI model) that converts user-facing brand settings into technical parameters for the image/video generation pipeline.

**Simplified Architecture:** This agent was intentionally simplified from a complex LUT matrix approach to practical, implementable parameters that AI image generators can actually use.

---

## Input Schema

```typescript
interface Agent23Input {
  // Brand Assets
  logoUrl: string;                    // High-res logo image URL
  brandPrimaryColor: string;          // Hex color (e.g., "#FF6B35")
  brandSecondaryColor: string;        // Hex color (e.g., "#1A1A2E")
  
  // User Controls
  logoIntegrity: number;              // Slider 1-10 (how strictly to preserve logo)
  logoDepth: number;                  // Slider 1-5 (flat to embossed)
}
```

---

## Algorithm Logic

### 1. Logo Integrity Conversion

Converts the 1-10 slider into a semantic level:

```typescript
function getLogoIntegrityLevel(logoIntegrity: number): string {
  if (logoIntegrity <= 3) return "flexible";    // Logo can be stylized
  if (logoIntegrity <= 6) return "moderate";    // Logo maintains shape
  if (logoIntegrity <= 9) return "strict";      // Logo strictly preserved
  return "exact";                                // Pixel-perfect lock
}
```

| Slider (1-10) | Level | AI Behavior |
|---------------|-------|-------------|
| 1-3 | `flexible` | Logo can be stylized, abstracted, or artistically interpreted |
| 4-6 | `moderate` | Logo maintains general shape but allows some variation |
| 7-9 | `strict` | Logo is strictly preserved with minimal variation |
| 10 | `exact` | Logo must appear exactly as provided |

### 2. Logo Depth Conversion

Converts the 1-5 slider into a depth descriptor:

```typescript
function getLogoDepthLevel(logoDepth: number): string {
  switch(logoDepth) {
    case 1: return "flat";           // Printed on surface
    case 2: return "subtle";         // Slight emboss/deboss
    case 3: return "moderate";       // Clear 3D presence
    case 4: return "embossed";       // Strong 3D effect
    case 5: return "extruded";       // Maximum depth/extrusion
    default: return "flat";
  }
}
```

| Slider (1-5) | Level | Visual Effect |
|--------------|-------|---------------|
| 1 | `flat` | Logo appears printed/painted on surface |
| 2 | `subtle` | Slight emboss or deboss effect |
| 3 | `moderate` | Clear 3D presence |
| 4 | `embossed` | Strong embossed/raised effect |
| 5 | `extruded` | Maximum depth, fully 3D extrusion |

### 3. Brand Colors Pass-Through

Brand colors are passed directly — no transformation needed:

```typescript
function getBrandColors(primary: string, secondary: string): BrandColors {
  return {
    primary: primary,
    secondary: secondary
  };
}
```

---

## Complete Algorithm

```typescript
interface Agent23Output {
  logo_integrity: "flexible" | "moderate" | "strict" | "exact";
  logo_depth: "flat" | "subtle" | "moderate" | "embossed" | "extruded";
  brand_colors: {
    primary: string;    // Hex color
    secondary: string;  // Hex color
  };
}

function executeBrandIdentityGuardian(input: Agent23Input): Agent23Output {
  return {
    logo_integrity: getLogoIntegrityLevel(input.logoIntegrity),
    logo_depth: getLogoDepthLevel(input.logoDepth),
    brand_colors: {
      primary: input.brandPrimaryColor,
      secondary: input.brandSecondaryColor
    }
  };
}
```

---

## Output JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["logo_integrity", "logo_depth", "brand_colors"],
  "properties": {
    "logo_integrity": {
      "type": "string",
      "enum": ["flexible", "moderate", "strict", "exact"],
      "description": "How strictly the logo should be preserved during generation"
    },
    "logo_depth": {
      "type": "string",
      "enum": ["flat", "subtle", "moderate", "embossed", "extruded"],
      "description": "3D depth effect for logo rendering"
    },
    "brand_colors": {
      "type": "object",
      "required": ["primary", "secondary"],
      "properties": {
        "primary": {
          "type": "string",
          "pattern": "^#[0-9A-Fa-f]{6}$",
          "description": "Primary brand color in hex"
        },
        "secondary": {
          "type": "string",
          "pattern": "^#[0-9A-Fa-f]{6}$",
          "description": "Secondary brand color in hex"
        }
      }
    }
  }
}
```

---

## Example

### Input
```json
{
  "logoUrl": "https://uploads/brand-logo.svg",
  "brandPrimaryColor": "#C0A060",
  "brandSecondaryColor": "#1A1A2E",
  "logoIntegrity": 8,
  "logoDepth": 3
}
```

### Output
```json
{
  "logo_integrity": "strict",
  "logo_depth": "moderate",
  "brand_colors": {
    "primary": "#C0A060",
    "secondary": "#1A1A2E"
  }
}
```

---

## Usage in Prompts

When Agent 5.1 (Prompt Architect) generates prompts, it uses these values:

```
Logo integrity: {{logo_integrity}}
- "flexible" → "brand logo, stylized interpretation allowed"
- "moderate" → "brand logo, maintain recognizable shape"
- "strict" → "brand logo, preserve exact design"
- "exact" → "brand logo, pixel-perfect reproduction required"

Logo depth: {{logo_depth}}
- "flat" → "logo printed flat on surface"
- "subtle" → "logo with subtle embossed effect"
- "moderate" → "logo with clear 3D depth"
- "embossed" → "logo deeply embossed/raised"
- "extruded" → "logo fully 3D extruded"
```

---

## Downstream Usage

| Consumer Agent | Fields Used | Purpose |
|----------------|-------------|---------|
| Agent 4.1 (Media Planner) | `logo_integrity` | Decide when/how to feature logo |
| Agent 5.1 (Prompt Architect) | All fields | Logo prompt modifiers |
| Agent 3.1 (World-Builder) | `brand_colors` | Color palette alignment |

---

## Why This Simplification?

**Previous (Over-engineered):**
```json
{
  "color_lut_matrix": [[1.15, 0.05, 0], [0, 0.95, 0.02], [0, 0, 1.08]],
  "logo_controlnet_weight": 0.8,
  "z_depth_offset": 4,
  "brand_safety_filter": true
}
```

**Problems:**
- `color_lut_matrix` — AI image models don't accept LUT matrices
- `logo_controlnet_weight` — Assumes ControlNet, not always available
- `z_depth_offset` — No implementation path in most pipelines
- `brand_safety_filter` — Boolean with no actual consumer

**Current (Practical):**
```json
{
  "logo_integrity": "strict",
  "logo_depth": "moderate",
  "brand_colors": { "primary": "#C0A060", "secondary": "#1A1A2E" }
}
```

**Benefits:**
- ✅ Human-readable semantic values
- ✅ Directly usable in prompt text
- ✅ No technical debt from unused fields
- ✅ Works with any AI image model



