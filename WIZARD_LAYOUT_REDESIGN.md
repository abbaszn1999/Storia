# Wizard Layout Redesign - Story Mode Style

**Date:** January 21, 2026  
**Status:** ✅ Complete

---

## Overview

Completely redesigned the wizard layout to match the professional Narrative Mode design, with fixed header/footer timeline navigation instead of sidebar.

---

## User Request

> "لماذا لا نلغي sidebar من على الجنب ونعمل footer مراحل كما عملنا في story بنفس الشكل ويكن هناك header بنفس الشكل"

(Translation: Why don't we cancel the sidebar from the side and make footer stages like we did in story with the same design, and have a header with the same design)

---

## Before vs After

### Before (Sidebar Layout):
```
┌─────────────────────────────────────┐
│ ┌─Sidebar─┐  ┌─────Content────────┐│
│ │ Progress│  │                    ││
│ │         │  │                    ││
│ │ Steps:  │  │  Campaign Name     ││
│ │ 1.✓     │  │  Topics            ││
│ │ 2.→     │  │  Duration          ││
│ │ 3.      │  │  ...               ││
│ │ 4.      │  │                    ││
│ │ 5.      │  │                    ││
│ │         │  ├────────────────────┤│
│ │         │  │ Footer: Back|Next  ││
│ └─────────┘  └────────────────────┘│
└─────────────────────────────────────┘
```

### After (Timeline Layout):
```
┌─────────────────────────────────────┐
│ Header                              │
│ ← Campaigns | Auto Story | Campaign│
└─────────────────────────────────────┘
│                                     │
│                                     │
│         Content (Scrollable)        │
│                                     │
│         Campaign Name               │
│         Topics                      │
│         Duration                    │
│         ...                         │
│                                     │
│                                     │
┌─────────────────────────────────────┐
│ Timeline Footer (Fixed)             │
│ [1✓]─[2→]─[3]─[4]─[5]   Back|Next  │
└─────────────────────────────────────┘
```

---

## New Structure

### 1. **Header** (Fixed Top)

```typescript
<header className="px-6 pt-5 pb-3 flex-shrink-0 border-b">
  <div className="max-w-7xl mx-auto flex items-center justify-between">
    {/* Left: Back to Campaigns */}
    <button onClick={() => navigate('/autoproduction/campaigns')}>
      ← Campaigns
    </button>

    {/* Center: Badge + Current Step */}
    <div>
      [✨ Auto Story] | Template
    </div>

    {/* Right: Campaign Name */}
    <div>New Campaign</div>
  </div>
</header>
```

**Features:**
- Back button to campaigns list
- "Auto Story" badge with Sparkles icon
- Current step title (animated)
- Campaign name on right

---

### 2. **Main Content** (Scrollable)

```typescript
<main className="flex-1 overflow-y-auto pb-32">
  <div className="px-6 pb-6 max-w-7xl mx-auto">
    {children}
  </div>
</main>
```

**Features:**
- `flex-1` - Takes available space
- `overflow-y-auto` - Scrollable only
- `pb-32` - Bottom padding for footer
- `max-w-7xl mx-auto` - Centered, max width

---

### 3. **Timeline Footer** (Fixed Bottom)

```typescript
<div className="fixed bottom-0 left-0 right-0 z-50">
  {/* Gradient fade */}
  <div className="h-8 bg-gradient-to-t from-background" />
  
  {/* Navigation Bar */}
  <div className="bg-background/95 backdrop-blur-xl border-t px-6 py-4">
    <div className="max-w-7xl mx-auto flex items-center justify-center">
      {/* Timeline Steps */}
      <div className="flex items-center gap-1">
        [1✓]─[2→]─[3]─[4]─[5]
      </div>

      {/* Back/Next Buttons (absolute right) */}
      <div className="absolute right-6">
        {footer}
      </div>
    </div>
  </div>
</div>
```

**Features:**
- Fixed at bottom (`fixed bottom-0`)
- Gradient fade at top (smooth transition)
- Timeline steps in center
- Back/Continue buttons on right
- Backdrop blur effect

---

## Timeline Steps Design

### Step States:

```typescript
// Active Step
<div className="w-10 h-10 rounded-xl bg-primary shadow-lg shadow-primary/30">
  <Icon className="text-primary-foreground" />
</div>

// Completed Step
<div className="w-10 h-10 rounded-xl bg-primary">
  <Check className="text-primary-foreground" />
</div>

// Upcoming Step
<div className="w-10 h-10 rounded-xl border-2 border-border bg-muted/50">
  <Icon className="text-muted-foreground" />
</div>
```

### Connector Lines:

```typescript
{index < steps.length - 1 && (
  <div className={cn(
    "w-8 h-0.5 mx-1",
    index < currentStepIndex ? "bg-primary" : "bg-border"
  )} />
)}
```

### Visual:
```
[1✓]────[2✓]────[3→]────[4]────[5]
 ↑       ↑       ↑      ↑     ↑
Purple  Purple  Active Gray  Gray
Check   Check   Pulse  Icon  Icon
```

---

## Animations

### Header:
```typescript
// Step title animation
<motion.div
  key={currentStep}
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
>
  {currentStepData?.title}
</motion.div>
```

### Timeline Footer:
```typescript
// Entrance from bottom
<motion.div 
  initial={{ y: 100, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ delay: 0.3, duration: 0.5 }}
>
```

### Active Step Icon:
```typescript
// Pulsing shadow
animate={{
  boxShadow: [
    '0 0 0 0 rgba(var(--primary), 0)',
    '0 0 20px 4px rgba(var(--primary), 0.3)',
    '0 0 0 0 rgba(var(--primary), 0)'
  ]
}}
transition={{ duration: 2, repeat: Infinity }}
```

---

## Layout Fixes

### Scroll Behavior:

**Container:**
```typescript
<div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
```

**Main Content:**
```typescript
<main className="flex-1 overflow-y-auto pb-32">
```

**Footer:**
```typescript
<div className="fixed bottom-0 left-0 right-0 z-50">
```

**Result:**
- ✅ Header: Fixed at top
- ✅ Content: Scrollable only
- ✅ Footer: Fixed at bottom
- ✅ No page scroll

---

## Key Improvements

### 1. **More Screen Space**
- Removed 320px wide sidebar
- Content uses full width
- Better for wide layouts

### 2. **Better Context**
- Campaign name always visible (header)
- Current step always visible (header)
- All steps visible (footer timeline)

### 3. **Cleaner Design**
- Horizontal timeline more intuitive
- Follows story mode pattern
- Professional appearance

### 4. **Better UX**
- Quick step navigation in footer
- Always visible context in header
- Familiar pattern from story mode

---

## Component Changes

### WizardLayout.tsx

**Before:** 395 lines with sidebar logic  
**After:** 207 lines, cleaner structure

**Removed:**
- Sidebar component
- ScrollArea for sidebar
- Progress section in sidebar
- Floating orbs
- Complex sidebar animations

**Added:**
- Fixed header with back button
- Badge for mode identification
- Campaign name display
- Timeline footer with steps
- Horizontal step navigation
- Connector lines between steps

---

## Props Changes

### Added:
```typescript
interface WizardLayoutProps {
  // ... existing ...
  campaignName?: string;  // NEW - for header display
}
```

### Removed:
- Sidebar-related logic (showSidebar)
- ScrollArea complexity

---

## Technical Benefits

### Performance:
- ✅ Simpler DOM structure
- ✅ Fewer animations running
- ✅ No ScrollArea overhead
- ✅ Faster render times

### Maintenance:
- ✅ Less code (395 → 207 lines)
- ✅ Simpler logic
- ✅ Matches story mode (consistency)
- ✅ Easier to understand

### UX:
- ✅ More screen space
- ✅ Better navigation
- ✅ Clearer context
- ✅ Professional feel

---

## Visual Comparison

### Header:

**Story Mode:**
```
← Videos | 🎬 Narrative Mode | Script | Untitled Project
```

**Auto Story (New):**
```
← Campaigns | ✨ Auto Story | Template | New Campaign
```

### Footer Timeline:

**Story Mode:**
```
[Script✓]─[World→]─[Breakdown]─[Storyboard]─[Animatic]─[Export]
         Back                               Continue →
```

**Auto Story (New):**
```
[Template✓]─[Content→]─[Style]─[Scheduling]─[Publishing]
              Back                    Continue →
```

---

## Migration Notes

### What Changed:
1. ✅ Sidebar removed completely
2. ✅ Header added at top
3. ✅ Footer moved to bottom timeline
4. ✅ Steps display in footer
5. ✅ Campaign name in header

### What Stayed:
1. ✅ WizardNavigation component (Back/Continue)
2. ✅ Step validation logic
3. ✅ State management
4. ✅ All wizard steps work the same

---

## Testing Checklist

- [x] Header displays correctly
- [x] Back button navigates to campaigns
- [x] Current step title shows in header
- [x] Campaign name shows in header
- [x] Timeline steps display in footer
- [x] Steps are clickable when allowed
- [x] Active step has pulse animation
- [x] Completed steps show checkmark
- [x] Upcoming steps are grayed out
- [x] Connector lines show progress
- [x] Back/Continue buttons work
- [x] Content scrolls smoothly
- [x] Footer stays fixed
- [x] Header stays fixed
- [x] No layout issues

---

## Summary

Successfully migrated from **sidebar layout** to **timeline layout**, matching the professional design of Story Mode!

**Benefits:**
- ✅ More screen space (no 320px sidebar)
- ✅ Cleaner, modern design
- ✅ Consistent with story mode
- ✅ Better UX and navigation
- ✅ Simpler code (50% less)
- ✅ Fixed scroll behavior
- ✅ Professional appearance

**Result:** A world-class wizard experience! 🚀
