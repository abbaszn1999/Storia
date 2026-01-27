import { Button } from "@/components/ui/button";
import { ScriptEditor } from "@/components/narrative/script-editor";
import { SceneBreakdown } from "@/components/narrative/scene-breakdown";
import { WorldCast } from "@/components/narrative/world-cast";
import { StoryboardEditor } from "@/components/narrative/storyboard-editor";
import { NarrativeSoundTab } from "@/components/narrative/sound-tab";
import { NarrativePreviewTab } from "@/components/narrative/preview-tab";
import { NarrativeExportTab } from "@/components/narrative/export-tab";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Character } from "@shared/schema";
import type { Scene, Shot, ReferenceImage } from "@/types/storyboard";
import type { NarrativeShotVersion } from "@/types/narrative-storyboard";

interface NarrativeWorkflowProps {
  activeStep: string;
  videoId: string;
  videoTitle?: string;
  workspaceId: string;
  narrativeMode: "image-reference" | "start-end" | "auto";
  script: string;
  aspectRatio: string;
  scriptModel: string;
  isGeneratingPrompts?: boolean;
  // Step 1 settings
  duration: string;
  genres: string[];
  tones: string[];
  language: string;
  userIdea: string;
  numberOfScenes?: number | 'auto';
  shotsPerScene?: number | 'auto';
  imageModel?: string;
  videoModel?: string;
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions: { [shotId: string]: NarrativeShotVersion[] };
  characters: Character[];
  referenceImages: ReferenceImage[];
  continuityLocked: boolean;
  continuityGroups: { [sceneId: string]: any[] };
  worldSettings: { 
    artStyle: string; 
    worldDescription?: string;
    locations?: Array<{ id: string; name: string; description: string; details?: string; imageUrl?: string | null }>;
    imageInstructions?: string;
    videoInstructions?: string;
    cinematicInspiration?: string;
  };
  // Step 5 Sound data
  step5Data?: {
    shotsWithSFX?: Record<string, {
      soundEffectDescription?: string;
      soundEffectUrl?: string;
    }>;
    voiceId?: string;
    voiceoverEnabled?: boolean;
    voiceoverScript?: string;
    voiceoverAudioUrl?: string;
    voiceoverDuration?: number;
    backgroundMusicEnabled?: boolean;
    musicStyle?: string;
    customMusicUrl?: string;
    generatedMusicUrl?: string;
    generatedMusicDuration?: number;
  };
  onStep5DataChange?: (data: Partial<NonNullable<NarrativeWorkflowProps['step5Data']>>) => void;
  onScriptChange: (script: string) => void;
  onAspectRatioChange: (aspectRatio: string) => void;
  onScriptModelChange: (model: string) => void;
  onNumberOfScenesChange?: (scenes: number | 'auto') => void;
  onShotsPerSceneChange?: (shots: number | 'auto') => void;
  onGenresChange?: (genres: string[]) => void;
  onTonesChange?: (tones: string[]) => void;
  onDurationChange?: (duration: string) => void;
  onLanguageChange?: (language: string) => void;
  onUserIdeaChange?: (userIdea: string) => void;
  onScenesChange: (scenes: Scene[]) => void;
  onShotsChange: (shots: { [sceneId: string]: Shot[] }) => void;
  onShotVersionsChange: (shotVersions: { [shotId: string]: NarrativeShotVersion[] } | ((prev: { [shotId: string]: NarrativeShotVersion[] }) => { [shotId: string]: NarrativeShotVersion[] })) => void;
  onCharactersChange: (characters: Character[]) => void;
  onReferenceImagesChange: (referenceImages: ReferenceImage[]) => void;
  onContinuityLockedChange: (locked: boolean) => void;
  onContinuityGroupsChange: (groups: { [sceneId: string]: any[] }) => void;
  onWorldSettingsChange: (settings: { 
    artStyle: string; 
    worldDescription: string;
    locations: Array<{ id: string; name: string; description: string; details?: string; imageUrl?: string | null }>;
    imageInstructions: string;
    videoInstructions: string;
    cinematicInspiration?: string;
  }) => void;
  onValidationChange?: (canContinue: boolean) => void;  // Validation callback
  onNext: () => void;
}

export function NarrativeWorkflow({
  activeStep,
  videoId,
  videoTitle,
  workspaceId,
  narrativeMode,
  script,
  aspectRatio,
  scriptModel,
  duration,
  genres,
  tones,
  language,
  userIdea,
  numberOfScenes,
  shotsPerScene,
  imageModel,
  videoModel,
  scenes,
  shots,
  shotVersions,
  characters,
  referenceImages,
  continuityLocked,
  continuityGroups,
  isGeneratingPrompts = false,
  worldSettings,
  onScriptChange,
  onAspectRatioChange,
  onScriptModelChange,
  onNumberOfScenesChange,
  onShotsPerSceneChange,
  onGenresChange,
  onTonesChange,
  onDurationChange,
  onLanguageChange,
  onUserIdeaChange,
  onScenesChange,
  onShotsChange,
  onShotVersionsChange,
  onCharactersChange,
  onReferenceImagesChange,
  onContinuityLockedChange,
  onContinuityGroupsChange,
  onWorldSettingsChange,
  step5Data,
  onStep5DataChange,
  onValidationChange,
  onNext,
}: NarrativeWorkflowProps) {
  const { toast } = useToast();

  const handleGenerateShot = async (shotId: string, prompts?: { imagePrompt?: string; videoPrompt?: string }, frame?: 'start' | 'end') => {
    try {
      // Find shot and version to save prompts first
      const allShots = Object.values(shots).flat();
      const shot = allShots.find(s => s.id === shotId);
      const currentVersions = shotVersions[shotId] || [];
      const currentVersion = currentVersions.find(v => v.id === shot?.currentVersionId) || currentVersions[currentVersions.length - 1];
      
      // Save prompts to database FIRST before generating
      // If version exists, update it. Otherwise, prompts will be saved when version is created by generate-image
      if (prompts && (prompts.imagePrompt !== undefined || prompts.videoPrompt !== undefined)) {
        if (currentVersion) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/3122497d-bbea-4a92-b13d-2af25bc0650e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'narrative-workflow.tsx:generate',message:'Saving prompts before generate (has version)',data:{shotId,versionId:currentVersion.id,imagePromptPreview:prompts.imagePrompt?.substring(0,50),videoPromptPreview:prompts.videoPrompt?.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SAVE_BEFORE_GEN'})}).catch(()=>{});
          // #endregion
          
          const saveResponse = await fetch(`/api/narrative/shots/${shotId}/versions/${currentVersion.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-workspace-id': workspaceId,
            },
            body: JSON.stringify({
              videoId,
              ...(prompts.imagePrompt !== undefined && { imagePrompt: prompts.imagePrompt }),
              ...(prompts.videoPrompt !== undefined && { videoPrompt: prompts.videoPrompt }),
            }),
            credentials: 'include',
          });
          
          if (!saveResponse.ok) {
            console.error('Failed to save prompts before generating');
          }
        } else {
          // No version yet - pass prompts to generate-image endpoint which will save them
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/3122497d-bbea-4a92-b13d-2af25bc0650e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'narrative-workflow.tsx:generate',message:'No version yet, will pass prompts to generate-image',data:{shotId,imagePromptPreview:prompts.imagePrompt?.substring(0,50),videoPromptPreview:prompts.videoPrompt?.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SAVE_BEFORE_GEN_NO_VERSION'})}).catch(()=>{});
          // #endregion
        }
      }
      
      // Pass prompts to generate-image if no version exists (it will save them)
      const requestBody: any = {
        shotId,
        videoId,
      };
      
      // Pass image model from shot (or scene) to override database value
      // This ensures the selected model in the dropdown is used immediately
      // Priority: shot.imageModel > scene.imageModel > default imageModel
      if (shot) {
        // Find the scene for this shot to get scene-level image model
        const scene = scenes.find(s => s.id === shot.sceneId);
        // Use shot-level model if set and not 'scene-default', otherwise scene-level, otherwise default
        let shotImageModel: string | undefined;
        if (shot.imageModel && shot.imageModel !== 'scene-default') {
          shotImageModel = shot.imageModel;
        } else if (scene?.imageModel) {
          // Shot is set to 'scene-default' or null, use scene's model
          shotImageModel = scene.imageModel;
        } else {
          // Neither shot nor scene has a model, use default
          shotImageModel = imageModel;
        }
        if (shotImageModel) {
          requestBody.imageModel = shotImageModel;
        }
      }
      
      // Pass versionId if currentVersion exists - this ensures we update the existing version
      // instead of creating a new one (important for start-end mode where we generate frames separately)
      if (currentVersion) {
        requestBody.versionId = currentVersion.id;
        
        // Pass per-frame advanced settings if in start-end mode
        if (frame === 'start' || frame === 'end') {
          if (frame === 'start') {
            if (currentVersion.startFrameNegativePrompt) requestBody.startFrameNegativePrompt = currentVersion.startFrameNegativePrompt;
            if (currentVersion.startFrameSeed !== undefined && currentVersion.startFrameSeed !== null) requestBody.startFrameSeed = currentVersion.startFrameSeed;
            if (currentVersion.startFrameGuidanceScale !== undefined && currentVersion.startFrameGuidanceScale !== null) requestBody.startFrameGuidanceScale = currentVersion.startFrameGuidanceScale;
            if (currentVersion.startFrameSteps !== undefined && currentVersion.startFrameSteps !== null) requestBody.startFrameSteps = currentVersion.startFrameSteps;
            if (currentVersion.startFrameStrength !== undefined && currentVersion.startFrameStrength !== null) requestBody.startFrameStrength = currentVersion.startFrameStrength;
          } else {
            if (currentVersion.endFrameNegativePrompt) requestBody.endFrameNegativePrompt = currentVersion.endFrameNegativePrompt;
            if (currentVersion.endFrameSeed !== undefined && currentVersion.endFrameSeed !== null) requestBody.endFrameSeed = currentVersion.endFrameSeed;
            if (currentVersion.endFrameGuidanceScale !== undefined && currentVersion.endFrameGuidanceScale !== null) requestBody.endFrameGuidanceScale = currentVersion.endFrameGuidanceScale;
            if (currentVersion.endFrameSteps !== undefined && currentVersion.endFrameSteps !== null) requestBody.endFrameSteps = currentVersion.endFrameSteps;
            if (currentVersion.endFrameStrength !== undefined && currentVersion.endFrameStrength !== null) requestBody.endFrameStrength = currentVersion.endFrameStrength;
          }
        }
      }
      
      // Pass frame parameter if provided (for start-end mode)
      if (frame) {
        requestBody.frame = frame;
      }
      
      // Include shot-level reference image if it exists
      const shotReference = referenceImages.find(
        (ref) => ref.shotId === shotId && ref.type === "shot_reference"
      );
      if (shotReference?.imageUrl) {
        requestBody.shotReferenceImageUrl = shotReference.imageUrl;
      }
      
      // If shot exists in frontend but might not be in database (manually created),
      // include it in the request body so backend can use it
      // Only include essential fields to avoid circular references or large payloads
      if (shot) {
        requestBody.shot = {
          id: shot.id,
          sceneId: shot.sceneId,
          shotNumber: shot.shotNumber,
          description: shot.description || '',
          cameraMovement: shot.cameraMovement,
          shotType: shot.shotType,
          duration: shot.duration,
          imageModel: shot.imageModel,
          videoModel: shot.videoModel,
          characters: Array.isArray(shot.characters) ? shot.characters : [],
          location: shot.location || '',
        };
      }
      
      // Pass prompts to backend (for manually created shots or when no version exists)
      // Map imagePrompt to the appropriate prompt field based on frame and mode
      if (prompts) {
        if (frame === 'start' && prompts.imagePrompt !== undefined) {
          requestBody.startFramePrompt = prompts.imagePrompt;
        } else if (frame === 'end' && prompts.imagePrompt !== undefined) {
          requestBody.endFramePrompt = prompts.imagePrompt;
        } else if (prompts.imagePrompt !== undefined) {
          // For image-reference mode or when frame is not specified
          requestBody.imagePrompt = prompts.imagePrompt;
        }
        if (prompts.videoPrompt !== undefined) {
          requestBody.videoPrompt = prompts.videoPrompt;
        }
      }
      
      // Validate request body can be serialized before sending
      let requestBodyString: string;
      try {
        requestBodyString = JSON.stringify(requestBody);
      } catch (jsonError) {
        console.error('[narrative-workflow] Request body serialization error:', jsonError);
        toast({
          title: "Generation Failed",
          description: "Invalid request data. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      let response: Response;
      try {
        // Create an AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
        
        try {
          response = await fetch('/api/narrative/shots/generate-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-workspace-id': workspaceId,
            },
            body: requestBodyString,
            credentials: 'include',
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error('Request timed out. The server may be taking too long to respond.');
          }
          throw fetchError;
        }
      } catch (fetchError) {
        // Network error - server might be down or request failed
        console.error('[narrative-workflow] Fetch error:', fetchError);
        const errorMessage = fetchError instanceof Error 
          ? fetchError.message 
          : 'Failed to connect to server. Please check if the server is running and try again.';
        throw new Error(errorMessage);
      }
      
      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || errorData.details || `HTTP ${response.status}: Failed to generate image`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        toast({
          title: "Generation Failed",
          description: data.error || "Failed to generate image",
          variant: "destructive",
        });
        return;
      }
      
      // Update shotVersions with the new or updated version
      // The backend should always return a version object, but handle cases where it might not
      if (data.version) {
        // Ensure version has all required fields
        const versionToUpdate = {
          ...data.version,
          // Ensure image URLs are preserved if they exist (check both response and version object)
          imageUrl: data.imageUrl || data.version.imageUrl || null,
          startFrameUrl: data.startFrameUrl || data.version.startFrameUrl || null,
          endFrameUrl: data.endFrameUrl || data.version.endFrameUrl || null,
        };
        
        // Use functional update to ensure we always have the latest state
        // This is critical for sequential generation (Generate All Images) to prevent
        // overwriting previous shots' images due to stale closure state
        onShotVersionsChange((prevShotVersions: { [shotId: string]: any[] }) => {
          const existingVersions = prevShotVersions[shotId] || [];
          
          // Check if this version already exists (when updating an existing version)
          const versionIndex = existingVersions.findIndex(v => v.id === versionToUpdate.id);
          const wasExisting = versionIndex >= 0;
          
          let updatedVersions;
          if (wasExisting) {
            // Update existing version in place - merge to preserve any existing fields
            updatedVersions = existingVersions.map(v => 
              v.id === versionToUpdate.id ? { ...v, ...versionToUpdate } : v
            );
          } else {
            // Add new version
            updatedVersions = [...existingVersions, versionToUpdate];
          }
          
          console.log('[narrative-workflow] Updated shotVersions after generation:', {
            shotId,
            versionId: versionToUpdate.id,
            hasImageUrl: !!versionToUpdate.imageUrl,
            hasStartFrameUrl: !!versionToUpdate.startFrameUrl,
            hasEndFrameUrl: !!versionToUpdate.endFrameUrl,
            versionIndex,
            wasExisting,
          });
          
          return {
            ...prevShotVersions,
            [shotId]: updatedVersions,
          };
        });
        
        // Update shot's currentVersionId
        if (shot) {
          handleUpdateShot(shotId, { currentVersionId: versionToUpdate.id });
        }
      } else {
        // Backend didn't return version - log warning but don't fail
        console.warn('[narrative-workflow] No version returned from generate-image endpoint:', data);
        toast({
          title: "Image Generated",
          description: "Image was generated but version data was not returned. Try refreshing the page.",
          variant: "default",
        });
      }
      
      toast({
        title: "Image Generated",
        description: "Storyboard image generated successfully",
      });
    } catch (error) {
      console.error('Failed to generate shot image:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateShot = async (shotId: string, prompts?: { imagePrompt?: string; videoPrompt?: string }, frame?: 'start' | 'end') => {
    // Get current version ID if exists
    const allShots = Object.values(shots).flat();
    const shot = allShots.find(s => s.id === shotId);
    const currentVersions = shotVersions[shotId] || [];
    const versionId = shot?.currentVersionId || currentVersions[currentVersions.length - 1]?.id;
    
    // If no version exists, fall back to generate instead of regenerate
    if (!versionId) {
      console.warn('[narrative-workflow] No version found for regenerate, falling back to generate:', shotId);
      return handleGenerateShot(shotId, prompts, frame);
    }
    
    try {
      // Save prompts to database FIRST before regenerating
      if (prompts && (prompts.imagePrompt !== undefined || prompts.videoPrompt !== undefined)) {
        const saveResponse = await fetch(`/api/narrative/shots/${shotId}/versions/${versionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-workspace-id': workspaceId,
          },
          body: JSON.stringify({
            videoId,
            ...(prompts.imagePrompt !== undefined && { imagePrompt: prompts.imagePrompt }),
            ...(prompts.videoPrompt !== undefined && { videoPrompt: prompts.videoPrompt }),
          }),
          credentials: 'include',
        });
        
        if (!saveResponse.ok) {
          console.error('Failed to save prompts before regenerating');
        }
      }
      
      // Get current version to pass advanced settings
      const currentVersion = versionId ? currentVersions.find(v => v.id === versionId) : currentVersions[currentVersions.length - 1];
      
      const requestBody: any = {
        shotId,
        videoId,
        ...(versionId && { versionId }), // Only pass versionId if it exists
      };
      
      // Pass image model from shot (or scene) to override database value
      // This ensures the selected model in the dropdown is used immediately
      // Priority: shot.imageModel > scene.imageModel > default imageModel
      if (shot) {
        // Find the scene for this shot to get scene-level image model
        const scene = scenes.find(s => s.id === shot.sceneId);
        // Use shot-level model if set and not 'scene-default', otherwise scene-level, otherwise default
        let shotImageModel: string | undefined;
        if (shot.imageModel && shot.imageModel !== 'scene-default') {
          shotImageModel = shot.imageModel;
        } else if (scene?.imageModel) {
          // Shot is set to 'scene-default' or null, use scene's model
          shotImageModel = scene.imageModel;
        } else {
          // Neither shot nor scene has a model, use default
          shotImageModel = imageModel;
        }
        if (shotImageModel) {
          requestBody.imageModel = shotImageModel;
        }
      }
      
      // Pass frame parameter if provided (for start-end mode)
      if (frame) {
        requestBody.frame = frame;
        
        // Pass per-frame advanced settings if version exists
        if (currentVersion) {
          if (frame === 'start') {
            if (currentVersion.startFrameNegativePrompt) requestBody.startFrameNegativePrompt = currentVersion.startFrameNegativePrompt;
            if (currentVersion.startFrameSeed !== undefined && currentVersion.startFrameSeed !== null) requestBody.startFrameSeed = currentVersion.startFrameSeed;
            if (currentVersion.startFrameGuidanceScale !== undefined && currentVersion.startFrameGuidanceScale !== null) requestBody.startFrameGuidanceScale = currentVersion.startFrameGuidanceScale;
            if (currentVersion.startFrameSteps !== undefined && currentVersion.startFrameSteps !== null) requestBody.startFrameSteps = currentVersion.startFrameSteps;
            if (currentVersion.startFrameStrength !== undefined && currentVersion.startFrameStrength !== null) requestBody.startFrameStrength = currentVersion.startFrameStrength;
          } else {
            if (currentVersion.endFrameNegativePrompt) requestBody.endFrameNegativePrompt = currentVersion.endFrameNegativePrompt;
            if (currentVersion.endFrameSeed !== undefined && currentVersion.endFrameSeed !== null) requestBody.endFrameSeed = currentVersion.endFrameSeed;
            if (currentVersion.endFrameGuidanceScale !== undefined && currentVersion.endFrameGuidanceScale !== null) requestBody.endFrameGuidanceScale = currentVersion.endFrameGuidanceScale;
            if (currentVersion.endFrameSteps !== undefined && currentVersion.endFrameSteps !== null) requestBody.endFrameSteps = currentVersion.endFrameSteps;
            if (currentVersion.endFrameStrength !== undefined && currentVersion.endFrameStrength !== null) requestBody.endFrameStrength = currentVersion.endFrameStrength;
          }
        }
      }
      
      // Pass prompts to backend (for manually created shots or when no version exists)
      // Map imagePrompt to the appropriate prompt field based on frame and mode
      if (prompts) {
        if (frame === 'start' && prompts.imagePrompt !== undefined) {
          requestBody.startFramePrompt = prompts.imagePrompt;
        } else if (frame === 'end' && prompts.imagePrompt !== undefined) {
          requestBody.endFramePrompt = prompts.imagePrompt;
        } else if (prompts.imagePrompt !== undefined) {
          // For image-reference mode or when frame is not specified
          requestBody.imagePrompt = prompts.imagePrompt;
        }
        if (prompts.videoPrompt !== undefined) {
          requestBody.videoPrompt = prompts.videoPrompt;
        }
      }
      
      // Include shot-level reference image if it exists
      const shotReference = referenceImages.find(
        (ref) => ref.shotId === shotId && ref.type === "shot_reference"
      );
      if (shotReference?.imageUrl) {
        requestBody.shotReferenceImageUrl = shotReference.imageUrl;
      }
      
      // If shot exists in frontend but might not be in database (manually created),
      // include it in the request body so backend can use it
      if (shot) {
        requestBody.shot = {
          id: shot.id,
          sceneId: shot.sceneId,
          shotNumber: shot.shotNumber,
          description: shot.description,
          cameraMovement: shot.cameraMovement,
          shotType: shot.shotType,
          soundEffects: shot.soundEffects,
          duration: shot.duration,
          transition: shot.transition,
          imageModel: shot.imageModel,
          videoModel: shot.videoModel,
          characters: shot.characters,
          location: shot.location,
        };
      }
      
      const response = await fetch('/api/narrative/shots/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
        },
        body: JSON.stringify(requestBody),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to regenerate image`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        toast({
          title: "Regeneration Failed",
          description: data.error || "Failed to regenerate image",
          variant: "destructive",
        });
        return;
      }
      
      // Update shotVersions with the updated version
      // Handle both updating existing version and creating new one
      if (data.version) {
        // Ensure version has all required fields
        const versionToUpdate = {
          ...data.version,
          // Ensure image URLs are preserved if they exist
          imageUrl: data.imageUrl || data.version.imageUrl || null,
          startFrameUrl: data.startFrameUrl || data.version.startFrameUrl || null,
          endFrameUrl: data.endFrameUrl || data.version.endFrameUrl || null,
        };
        
        // Use functional update to ensure we always have the latest state
        // This is critical for sequential generation to prevent overwriting previous shots' images
        onShotVersionsChange((prevShotVersions: { [shotId: string]: any[] }) => {
          const existingVersions = prevShotVersions[shotId] || [];
          
          // Check if this version already exists (when updating an existing version)
          const versionIndex = existingVersions.findIndex(v => v.id === versionToUpdate.id);
          const wasExisting = versionIndex >= 0;
          
          let updatedVersions;
          if (wasExisting) {
            // Update existing version in place - merge to preserve any existing fields
            updatedVersions = existingVersions.map(v => 
              v.id === versionToUpdate.id ? { ...v, ...versionToUpdate } : v
            );
          } else {
            // Add new version (shouldn't happen for regenerate, but handle it anyway)
            updatedVersions = [...existingVersions, versionToUpdate];
          }
          
          console.log('[narrative-workflow] Updated shotVersions after regeneration:', {
            shotId,
            versionId: versionToUpdate.id,
            hasImageUrl: !!versionToUpdate.imageUrl,
            hasStartFrameUrl: !!versionToUpdate.startFrameUrl,
            hasEndFrameUrl: !!versionToUpdate.endFrameUrl,
            versionIndex,
            wasExisting,
          });
          
          return {
            ...prevShotVersions,
            [shotId]: updatedVersions,
          };
        });
        
        // Update shot's currentVersionId if it changed
        if (shot && shot.currentVersionId !== versionToUpdate.id) {
          handleUpdateShot(shotId, { currentVersionId: versionToUpdate.id });
        }
      } else {
        // Backend didn't return version - log warning but don't fail
        console.warn('[narrative-workflow] No version returned from regenerate endpoint:', data);
        toast({
          title: "Image Regenerated",
          description: "Image was regenerated but version data was not returned. Try refreshing the page.",
          variant: "default",
        });
      }
      
      toast({
        title: "Image Regenerated",
        description: "Storyboard image regenerated successfully",
      });
    } catch (error) {
      console.error('Failed to regenerate shot image:', error);
      toast({
        title: "Regeneration Failed",
        description: error instanceof Error ? error.message : "Failed to regenerate image",
        variant: "destructive",
      });
    }
  };

  const handleUpdateShot = (shotId: string, updates: Partial<Shot>) => {
    onShotsChange(
      Object.fromEntries(
        Object.entries(shots).map(([sceneId, sceneShots]) => [
          sceneId,
          sceneShots.map((shot) =>
            shot.id === shotId ? { ...shot, ...updates } : shot
          ),
        ])
      )
    );
  };

  const handleUpdateShotVersion = (shotId: string, versionId: string, updates: Partial<NarrativeShotVersion>) => {
    // Update local state only - API save happens on Generate/Regenerate button click
    onShotVersionsChange(
      Object.fromEntries(
        Object.entries(shotVersions).map(([sid, versions]) => [
          sid,
          versions.map((version) =>
            version.id === versionId && sid === shotId
              ? { ...version, ...updates }
              : version
          ),
        ])
      )
    );
  };

  const handleUpdateScene = async (sceneId: string, updates: Partial<Scene>) => {
    // Update local state immediately for responsiveness
    const updatedScenes = scenes.map((scene) =>
      scene.id === sceneId ? { ...scene, ...updates } : scene
    );
    onScenesChange(updatedScenes);

    // Save to database for fields that need persistence (videoModel, imageModel)
    if (updates.videoModel !== undefined || updates.imageModel !== undefined) {
      try {
        await apiRequest("PATCH", `/api/narrative/videos/${videoId}/step3`, {
          scenes: updatedScenes,
        });
        console.log('[narrative-workflow] Scene updated and saved:', { sceneId, updates });
      } catch (error) {
        console.error('[narrative-workflow] Failed to save scene update:', error);
        // Don't show error toast for every save - could be noisy
        // The data is still in local state so user can continue working
      }
    }
  };

  const handleUploadShotReference = (shotId: string, file: File) => {
    // Create a temporary URL for the uploaded image
    const tempUrl = URL.createObjectURL(file);
    
    // Find existing reference image for this shot
    const existingRef = referenceImages.find(
      (ref) => ref.shotId === shotId && ref.type === "shot_reference"
    );

    if (existingRef) {
      // Update existing reference
      onReferenceImagesChange(
        referenceImages.map((ref) =>
          ref.shotId === shotId && ref.type === "shot_reference"
            ? { ...ref, imageUrl: tempUrl }
            : ref
        )
      );
    } else {
      // Add new reference
      const newRef: ReferenceImage = {
        id: `ref-${Date.now()}`,
        videoId: videoId,
        shotId: shotId,
        characterId: null,
        type: "shot_reference",
        imageUrl: tempUrl,
        description: null,
        createdAt: new Date(),
      };
      onReferenceImagesChange([...referenceImages, newRef]);
    }
  };

  const handleDeleteShotReference = (shotId: string) => {
    onReferenceImagesChange(
      referenceImages.filter(
        (ref) => !(ref.shotId === shotId && ref.type === "shot_reference")
      )
    );
  };

  const handleReorderShots = (sceneId: string, shotIds: string[]) => {
    const sceneShots = shots[sceneId] || [];
    const reorderedShots = shotIds.map(id => sceneShots.find(s => s.id === id)).filter(Boolean) as Shot[];
    
    onShotsChange({
      ...shots,
      [sceneId]: reorderedShots,
    });
  };

  const handleSelectVersion = (shotId: string, versionId: string) => {
    // Update the shot's currentVersionId
    handleUpdateShot(shotId, { currentVersionId: versionId });
  };

  const handleDeleteVersion = async (shotId: string, versionId: string) => {
    try {
      // Call API to delete the version
      const response = await fetch(`/api/narrative/shots/${shotId}/versions/${versionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(errorData.error || `Failed to delete version: ${response.status}`);
      }

      const data = await response.json();

      // Use renumbered versions from API response if available, otherwise filter locally
      const updatedVersions = data.versions || shotVersions[shotId]?.filter(v => v.id !== versionId) || [];
      
      // If this was the current version and API returned a new currentVersionId, update the shot
      const shot = Object.values(shots).flat().find(s => s.id === shotId);
      if (shot && shot.currentVersionId === versionId && data.newCurrentVersionId !== undefined) {
        // Update the shot's currentVersionId
        const updatedShots = { ...shots };
        Object.keys(updatedShots).forEach(sceneId => {
          updatedShots[sceneId] = updatedShots[sceneId].map(s => 
            s.id === shotId ? { ...s, currentVersionId: data.newCurrentVersionId } : s
          );
        });
        onShotsChange(updatedShots);
      }
      
      // Update shotVersions with renumbered versions
      onShotVersionsChange({
        ...shotVersions,
        [shotId]: updatedVersions,
      });

      toast({
        title: "Version Deleted",
        description: "The version has been permanently deleted.",
      });
    } catch (error) {
      console.error('Error deleting version:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete version",
        variant: "destructive",
      });
    }
  };

  const handleAddScene = (afterSceneIndex: number) => {
    const newSceneId = `scene-${Date.now()}`;
    const newScene: Scene = {
      id: newSceneId,
      videoId: videoId,
      sceneNumber: afterSceneIndex + 2,
      title: `New Scene ${afterSceneIndex + 2}`,
      description: "Describe what happens in this scene",
      lighting: null,
      weather: null,
      imageModel: null,
      videoModel: null,
      duration: null,
      createdAt: new Date(),
    };

    const newScenes = [...scenes];
    newScenes.splice(afterSceneIndex + 1, 0, newScene);
    
    const updatedScenes = newScenes.map((scene, idx) => ({
      ...scene,
      sceneNumber: idx + 1,
    }));

    onScenesChange(updatedScenes);

    const initialShot: Shot = {
      id: `shot-${Date.now()}`,
      sceneId: newSceneId,
      shotNumber: 1,
      description: "Shot description",
      cameraMovement: "Static",
      shotType: "Medium",
      soundEffects: null,
      duration: 3,
      transition: "cut",
      imageModel: null,
      videoModel: null,
      currentVersionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onShotsChange({
      ...shots,
      [newSceneId]: [initialShot],
    });
  };

  const handleAddShot = (sceneId: string, afterShotIndex: number) => {
    const sceneShots = shots[sceneId] || [];
    const newShot: Shot = {
      id: `shot-${Date.now()}`,
      sceneId: sceneId,
      shotNumber: afterShotIndex + 2,
      description: "New shot description",
      cameraMovement: "Static",
      shotType: "Medium",
      soundEffects: null,
      duration: 3,
      transition: "cut",
      imageModel: null,
      videoModel: null,
      currentVersionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert the new shot after the specified index
    const newShots = [...sceneShots];
    newShots.splice(afterShotIndex + 1, 0, newShot);

    // Update shot numbers
    const updatedShots = newShots.map((shot, idx) => ({
      ...shot,
      shotNumber: idx + 1,
    }));

    onShotsChange({
      ...shots,
      [sceneId]: updatedShots,
    });
  };

  const handleDeleteScene = (sceneId: string) => {
    // Remove the scene
    const updatedScenes = scenes
      .filter(scene => scene.id !== sceneId)
      .map((scene, idx) => ({
        ...scene,
        sceneNumber: idx + 1,
      }));
    
    onScenesChange(updatedScenes);
    
    // Remove all shots for this scene
    const updatedShots = { ...shots };
    delete updatedShots[sceneId];
    onShotsChange(updatedShots);
    
    // Remove all shot versions for shots in this scene
    const sceneShots = shots[sceneId] || [];
    const updatedShotVersions = { ...shotVersions };
    sceneShots.forEach(shot => {
      delete updatedShotVersions[shot.id];
    });
    onShotVersionsChange(updatedShotVersions);
    
    // Remove reference images for shots in this scene
    const shotIds = sceneShots.map(s => s.id);
    onReferenceImagesChange(
      referenceImages.filter(ref => !shotIds.includes(ref.shotId || ''))
    );
    
    // Remove continuity groups for this scene
    const updatedContinuityGroups = { ...continuityGroups };
    delete updatedContinuityGroups[sceneId];
    onContinuityGroupsChange(updatedContinuityGroups);
    
    // If no scenes remain, unlock continuity
    if (updatedScenes.length === 0) {
      onContinuityLockedChange(false);
    }
  };

  const handleDeleteShot = (shotId: string) => {
    // Find which scene this shot belongs to
    const sceneId = Object.keys(shots).find(sId => 
      shots[sId]?.some(shot => shot.id === shotId)
    );
    
    if (!sceneId) return;
    
    const sceneShots = shots[sceneId] || [];
    
    // Remove the shot and renumber remaining shots
    const updatedShots = sceneShots
      .filter(shot => shot.id !== shotId)
      .map((shot, idx) => ({
        ...shot,
        shotNumber: idx + 1,
      }));
    
    onShotsChange({
      ...shots,
      [sceneId]: updatedShots,
    });
    
    // Remove shot versions for this shot
    const updatedShotVersions = { ...shotVersions };
    delete updatedShotVersions[shotId];
    onShotVersionsChange(updatedShotVersions);
    
    // Remove reference images for this shot
    onReferenceImagesChange(
      referenceImages.filter(ref => ref.shotId !== shotId)
    );
    
    // Filter continuity groups to remove any groups that reference this shot
    const updatedContinuityGroups = { ...continuityGroups };
    if (updatedContinuityGroups[sceneId]) {
      updatedContinuityGroups[sceneId] = updatedContinuityGroups[sceneId].filter(group => {
        // Remove groups that contain the deleted shot
        return !group.shotIds || !group.shotIds.includes(shotId);
      });
      // If no groups remain for this scene, remove the scene entry
      if (updatedContinuityGroups[sceneId].length === 0) {
        delete updatedContinuityGroups[sceneId];
      }
    }
    onContinuityGroupsChange(updatedContinuityGroups);
  };

  return (
    <div>
      {activeStep === "script" && (
        <ScriptEditor
          videoId={videoId}
          initialScript={script}
          aspectRatio={aspectRatio}
          scriptModel={scriptModel}
          initialDuration={duration}
          initialGenres={genres}
          initialTones={tones}
          initialLanguage={language}
          initialUserIdea={userIdea}
          initialNumberOfScenes={numberOfScenes}
          initialShotsPerScene={shotsPerScene}
          initialImageModel={imageModel}
          initialVideoModel={videoModel}
          onScriptChange={onScriptChange}
          onAspectRatioChange={onAspectRatioChange}
          onScriptModelChange={onScriptModelChange}
          onNumberOfScenesChange={onNumberOfScenesChange}
          onShotsPerSceneChange={onShotsPerSceneChange}
          onGenresChange={onGenresChange}
          onTonesChange={onTonesChange}
          onDurationChange={onDurationChange}
          onLanguageChange={onLanguageChange}
          onUserIdeaChange={onUserIdeaChange}
          onValidationChange={onValidationChange}
          onNext={onNext}
        />
      )}

      {activeStep === "breakdown" && (
        <SceneBreakdown
          videoId={videoId}
          workspaceId={workspaceId}
          script={script}
          scriptModel={scriptModel}
          narrativeMode={narrativeMode}
          scenes={scenes}
          shots={shots}
          shotVersions={shotVersions}
          continuityLocked={continuityLocked}
          continuityGroups={continuityGroups}
          numberOfScenes={numberOfScenes}
          shotsPerScene={shotsPerScene}
          targetDuration={duration ? parseInt(duration) : undefined}
          genre={genres && genres.length > 0 ? genres[0] : undefined}
          tone={tones && tones.length > 0 ? tones[0] : undefined}
          characters={characters.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description || c.appearance || undefined,
          }))}
          locations={worldSettings?.locations?.map(l => ({
            id: l.id,
            name: l.name,
            description: l.description || undefined,
          })) || []}
          onScenesGenerated={(newScenes, newShots, newShotVersions) => {
            onScenesChange(newScenes);
            onShotsChange(newShots);
            if (newShotVersions) {
              onShotVersionsChange(newShotVersions);
            }
          }}
          onContinuityLocked={() => onContinuityLockedChange(true)}
          onContinuityGroupsChange={onContinuityGroupsChange}
          onNext={onNext}
        />
      )}

      {activeStep === "world" && (
        <WorldCast
          videoId={videoId}
          workspaceId={workspaceId}
          characters={characters}
          referenceImages={referenceImages}
          artStyle={worldSettings.artStyle}
          imageModel={imageModel} // Pass from step1Data, not worldSettings
          worldDescription={worldSettings.worldDescription}
          locations={worldSettings.locations}
          imageInstructions={worldSettings.imageInstructions}
          videoInstructions={worldSettings.videoInstructions}
          cinematicInspiration={worldSettings.cinematicInspiration}
          script={script}
          onCharactersChange={onCharactersChange}
          onReferenceImagesChange={onReferenceImagesChange}
          onWorldSettingsChange={onWorldSettingsChange}
          onNext={onNext}
        />
      )}

      {activeStep === "storyboard" && (
        <StoryboardEditor
          videoId={videoId}
          narrativeMode={narrativeMode}
          scenes={scenes}
          shots={shots}
          shotVersions={shotVersions}
          referenceImages={referenceImages}
          characters={characters}
          locations={worldSettings?.locations || []}
          continuityLocked={continuityLocked}
          continuityGroups={continuityGroups}
          isGeneratingPrompts={isGeneratingPrompts}
          imageModel={imageModel} // Pass from step1Data
          videoModel={videoModel} // Pass from step1Data
          videoResolution={undefined} // Will be resolved from shot/scene hierarchy
          aspectRatio={aspectRatio}
          onGenerateShot={handleGenerateShot}
          onRegenerateShot={handleRegenerateShot}
          onUpdateShot={handleUpdateShot}
          onUpdateShotVersion={handleUpdateShotVersion}
          onUpdateScene={handleUpdateScene}
          onReorderShots={handleReorderShots}
          onUploadShotReference={handleUploadShotReference}
          onDeleteShotReference={handleDeleteShotReference}
          onSelectVersion={handleSelectVersion}
          onDeleteVersion={handleDeleteVersion}
          onAddScene={handleAddScene}
          onAddShot={handleAddShot}
          onDeleteScene={handleDeleteScene}
          onDeleteShot={handleDeleteShot}
          onNext={onNext}
        />
      )}

      {activeStep === "sound" && (
        <NarrativeSoundTab
          videoId={videoId}
          scenes={scenes}
          shots={shots}
          shotVersions={shotVersions}
          step5Data={step5Data}
          script={script}
          characters={characters}
          genre={genres?.[0]}
          tone={tones?.[0]}
          language={language as 'en' | 'ar'}
          onUpdateStep5Data={(data) => onStep5DataChange?.(data)}
          onUpdateShot={handleUpdateShot}
        />
      )}

      {(activeStep === "animatic" || activeStep === "preview") && (
        <NarrativePreviewTab videoId={videoId} />
      )}

      {activeStep === "export" && (
        <NarrativeExportTab
          videoId={videoId}
          videoTitle={videoTitle}
          duration={Object.values(shots).flat().reduce((total, shot) => total + (shot.duration || 5), 0)}
          sceneCount={scenes.length}
          aspectRatio={aspectRatio}
          hasVoiceover={!!step5Data?.voiceoverAudioUrl}
          hasMusic={!!(step5Data?.customMusicUrl || step5Data?.generatedMusicUrl)}
          imageModel={imageModel}
        />
      )}
    </div>
  );
}
