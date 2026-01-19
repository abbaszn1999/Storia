# Image Transitions Mode - Error Analysis & Investigation

## Date: January 15, 2026
## Issue: Preview & Export phases failing with "No video clips found in timeline"

---

## 🔴 ROOT CAUSE ANALYSIS

### The Core Problem
The timeline builder is receiving **0 video/image clips** because the shots in `step6Data.timeline.shots` are missing the `imageUrl` field. This happens due to a **backward compatibility issue** with existing projects.

### Why This Happens

1. **Old Data Format**:
   - Before image-transitions mode was implemented, images were stored as `startFrameUrl` and `endFrameUrl` in `step4Data.shotVersions`
   - The new format uses `imageUrl` field specifically

2. **Timeline Creation**:
   - When user clicks "Continue" from Step 5 → Step 6, the system builds `step6Data.timeline`
   - This timeline is built from `step4Data.shotVersions`
   - **Your project was created/modified before we added the imageUrl fallback**, so the timeline has `imageUrl: null`

3. **Export/Preview Process**:
   ```
   Step 6 Data (in database)
   └─ timeline.shots[sceneId][i].imageUrl = null  ❌ Missing!
   
   Step 4 Data (in database)
   └─ shotVersions[shotId].startFrameUrl = "https://..."  ✅ Has image!
   └─ shotVersions[shotId].imageUrl = null  ❌ Missing!
   ```

---

## 📊 TERMINAL LOG ANALYSIS

### Key Evidence from Logs:

```
[TimelineBuilder] Shot 657f403f-2245-4bcb-acfe-bf6f38bdce6a has no video/image URL, skipping
[TimelineBuilder] Shot 2813a812-51be-4f0b-b1e7-5b0507a74be3 has no video/image URL, skipping
[TimelineBuilder] Shot 5a22650d-abc7-4bf6-8032-b6412d4a0a8e has no video/image URL, skipping
[TimelineBuilder] Shot 87d7cd93-d450-4680-a664-ef0ba5b0d1ed has no video/image URL, skipping
[TimelineBuilder] Shot bb776fee-9953-4f67-8a3b-36e7aba10acd has no video/image URL, skipping
```

**Result**: 
- All 5 shots × 2 loops = 10 iterations, ALL skipped
- Timeline built: `clipCount: 2` (only voiceover + music audio)
- `totalDuration: 0` (no video clips)
- Error: "Invalid timeline data"

---

## 🔧 FIXES IMPLEMENTED

### 1. **Backend: Step 5 → 6 Transition** (`server/modes/ambient-visual/routes/index.ts`)
**Status**: ✅ Fixed (lines ~3089-3095)

```typescript
// For image-transitions mode: use imageUrl, or fallback to startFrameUrl
const imageUrl = isImageTransitionsMode
  ? (latestVersion?.imageUrl || latestVersion?.startFrameUrl || null)
  : null;
```

**Impact**: Future "Continue" clicks will create correct timeline.

---

### 2. **Backend: Preview Render Auto-Initialization** (`preview-render.ts` ~lines 593-605)
**Status**: ✅ Fixed

```typescript
// For image-transitions mode: use imageUrl, or fallback to startFrameUrl for backward compatibility
const imageUrl = step1Data?.animationMode === 'image-transitions'
  ? (latestVersion?.imageUrl || (latestVersion as any)?.startFrameUrl || null)
  : (latestVersion?.imageUrl || null);
```

**Impact**: If timeline is missing and needs auto-init, it will use correct fallback.

---

### 3. **Backend: Studio Edit Endpoint** (`preview-render.ts` ~lines 850-866)
**Status**: ✅ Fixed

```typescript
const imageUrl = step1Data?.animationMode === 'image-transitions'
  ? (v.imageUrl || v.startFrameUrl || null)
  : (v.imageUrl || null);
```

**Impact**: Preview will correctly map shot versions with imageUrl fallback.

---

### 4. **Backend: Runtime Timeline Repair** (`preview-render.ts` ~lines 460-492)
**Status**: ✅ NEW FIX - Automatically repairs existing broken timelines

```typescript
// BACKWARD COMPATIBILITY FIX: Repair step6Data timeline if shots are missing imageUrl
if (step6Data?.timeline && step1Data?.animationMode === 'image-transitions' && step4Data?.shotVersions) {
  let needsRepair = false;
  const repairedShots: Record<string, TimelineShotItem[]> = {};
  
  for (const [sceneId, sceneShots] of Object.entries(step6Data.timeline.shots)) {
    repairedShots[sceneId] = sceneShots.map(shot => {
      if (!shot.imageUrl) {
        const versions = step4Data.shotVersions[shot.id] || [];
        const latestVersion = versions[versions.length - 1];
        const imageUrl = (latestVersion?.imageUrl || (latestVersion as any)?.startFrameUrl || null);
        
        if (imageUrl) {
          needsRepair = true;
          return { ...shot, imageUrl };
        }
      }
      return shot;
    });
  }
  
  if (needsRepair) {
    step6Data = { ...step6Data, timeline: { ...step6Data.timeline, shots: repairedShots } };
    await storage.updateVideo(videoId, { step6Data });
  }
}
```

**Impact**: **Automatically fixes your existing broken timeline without requiring you to go back to Step 5!**

---

### 5. **Backend: Build Timeline Input Logging** (`preview-render.ts` ~lines 1140-1165)
**Status**: ✅ Added comprehensive logging

```typescript
console.log('[buildTimelineInputFromStep6] Processing shot from timeline:', {
  shotId: shot.id,
  hasVideoUrl: !!shot.videoUrl,
  hasImageUrl: !!shot.imageUrl,
  videoUrl: shot.videoUrl ? shot.videoUrl.substring(0, 80) + '...' : null,
  imageUrl: shot.imageUrl ? shot.imageUrl.substring(0, 80) + '...' : null,
});
```

**Impact**: We can now see exactly what data is being passed to timeline builder.

---

## 🎯 SOLUTION STRATEGY

### Three-Tier Approach:

1. **Tier 1: Prevention** (Step 5→6 transition in `index.ts`)
   - Future timelines will be created correctly with imageUrl fallback
   
2. **Tier 2: Auto-Repair** (GET `/preview/data` in `preview-render.ts`)
   - **Existing broken timelines are automatically fixed when loaded**
   - No user action required!
   
3. **Tier 3: Fallback** (All timeline-building functions)
   - Even if repair misses something, fallback logic ensures images are found

---

## 🧪 EXPECTED BEHAVIOR AFTER FIX

### On Next Page Load:

1. User navigates to Preview (Step 6)
2. Frontend calls `GET /api/ambient-visual/videos/:id/preview/data`
3. **Auto-repair runs**:
   ```
   [preview-render:get-data] Repairing shot with imageUrl from step4Data: { shotId: '657f403f...', imageUrl: 'https://storia.b-cdn.net/...' }
   [preview-render:get-data] Repairing shot with imageUrl from step4Data: { shotId: '2813a812...', imageUrl: 'https://storia.b-cdn.net/...' }
   ... (5 shots repaired)
   [preview-render:get-data] Repaired and saved step6Data timeline with image URLs
   ```
4. Frontend calls `GET /api/ambient-visual/videos/:id/preview/studio-edit`
5. **Timeline builds successfully**:
   ```
   [preview-render:studio-edit] Processing shot version: { shotId: '657f403f...', hasStartFrameUrl: true, finalImageUrl: 'https://...' }
   [TimelineBuilder] Building timeline: { sceneCount: 1, shotCount: 5 }
   [TimelineBuilder] Timeline built: { trackCount: 3, clipCount: 12, totalDuration: 192 }
   ```
6. **Preview displays successfully**

### On Export:

1. User clicks "Export Video"
2. Backend calls `buildTimelineInputFromStep6()`
3. **Logs show shots being processed**:
   ```
   [buildTimelineInputFromStep6] Processing shot from timeline: { shotId: '657f403f...', hasImageUrl: true, imageUrl: 'https://...' }
   ```
4. **Timeline validates successfully**
5. **Shotstack render starts**:
   ```
   [preview-render] Render submitted: { renderId: 'abc-123', status: 'queued' }
   ```

---

## ✅ VERIFICATION CHECKLIST

When you test again, you should see:

- [ ] No more "Shot has no video/image URL, skipping" warnings
- [ ] `clipCount` > 2 (should be ~12: 10 image clips + voiceover + music)
- [ ] `totalDuration` = 192 seconds (not 0)
- [ ] Preview shows actual video with images animating
- [ ] Export starts successfully (no "Invalid timeline data" error)
- [ ] Shotstack render status transitions: queued → rendering → done

---

## 🐛 IF STILL BROKEN AFTER FIX

### Debug Steps:

1. **Check the console logs for**:
   ```
   [preview-render:get-data] Repairing shot with imageUrl from step4Data
   ```
   - If you DON'T see this, the repair didn't run
   
2. **Check for**:
   ```
   [preview-render:studio-edit] Processing shot version
   ```
   - Look at `hasImageUrl` and `hasStartFrameUrl` and `finalImageUrl`
   - If all are `false`/`null`, the data is truly missing from database
   
3. **Check**:
   ```
   [buildTimelineInputFromStep6] Processing shot from timeline
   ```
   - This shows what's in step6Data after repair
   - `hasImageUrl` should be `true` now

4. **Nuclear Option**: Go back to Step 5, click "Continue" again
   - This will rebuild the entire timeline from scratch with the new fix

---

## 📝 TECHNICAL NOTES

### Data Flow:
```
step4Data.shotVersions[shotId]
  ├─ .imageUrl (NEW format) → Missing in old projects
  └─ .startFrameUrl (OLD format) → Has the image!
         ↓
         ↓ (Step 5 → 6 transition OR auto-repair)
         ↓
step6Data.timeline.shots[sceneId][i]
  └─ .imageUrl → NOW POPULATED with fallback ✅
         ↓
         ↓ (Preview/Export)
         ↓
TimelineBuilderInput.shotVersions[shotId]
  └─ .imageUrl → Passed to timeline builder ✅
         ↓
         ↓
Shotstack Timeline
  └─ ImageAsset with motion effects ✅
```

### Why This Is Complex:
1. Data exists in multiple places (step4Data, step6Data)
2. step6Data is a **snapshot** created at Step 5→6 transition
3. Changing Step 4 data doesn't update Step 6 data automatically
4. We need to bridge old and new data formats

---

## 🎉 SUMMARY

**What Was Wrong:**
- Your project has images stored as `startFrameUrl` (old format)
- The timeline in step6Data has `imageUrl: null` (missing)
- Timeline builder skipped all shots → empty timeline → export failed

**What We Fixed:**
1. ✅ Step 5→6 transition now uses fallback
2. ✅ Auto-initialization uses fallback  
3. ✅ Studio edit endpoint uses fallback
4. ✅ **AUTO-REPAIR: Existing timelines are fixed on load** ← Key fix!
5. ✅ Comprehensive logging added

**What You Should Do:**
1. Refresh the page
2. Navigate to Preview (Step 6)
3. Check terminal logs for repair messages
4. Preview should now work!
5. Export should now work!

**If Still Broken:**
- Share the new terminal logs (they'll have detailed debugging info)
- We can see exactly where the data is missing
