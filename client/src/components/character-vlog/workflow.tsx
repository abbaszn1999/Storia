import { useState, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { CharacterVlogScriptEditor } from "@/components/character-vlog/script-editor";
import { CharacterVlogSceneBreakdown } from "@/components/character-vlog/scene-breakdown";
import { ElementsTab } from "@/components/character-vlog/elements-tab";
import { StoryboardEditor } from "@/components/character-vlog/storyboard-editor";
import { SoundscapeTab } from "@/components/character-vlog/soundscape-tab";
import { AnimaticPreview } from "@/components/character-vlog/animatic-preview";
import { PreviewTab, type PreviewTabRef } from "@/components/character-vlog/preview";
import { ExportTab } from "@/components/character-vlog/export-tab";
import { useToast } from "@/hooks/use-toast";
import type { Character, Location } from "@shared/schema";
import type { Scene, Shot, ShotVersion, ReferenceImage } from "@/types/storyboard";

// Ref type for parent components to access workflow methods
export interface CharacterVlogWorkflowRef {
  getCurrentVolumes: () => { master: number; sfx: number; voiceover: number; music: number } | null;
}

interface CharacterVlogWorkflowProps {
  activeStep: string;
  videoId: string;
  workspaceId: string;
  // Ref to access workflow methods (like getCurrentVolumes)
  workflowRef?: React.RefObject<CharacterVlogWorkflowRef | null>;
  narrativeMode: "image-reference" | "start-end";
  referenceMode: "1F" | "2F" | "AI";
  script: string;
  aspectRatio: string;
  scriptModel: string;
  videoModel: string;
  imageModel: string;
  narrationStyle: "third-person" | "first-person";
  voiceOverEnabled: boolean;
  backgroundMusicEnabled: boolean;
  voiceoverLanguage: 'en' | 'ar';
  textOverlayEnabled: boolean;
  theme: string;
  numberOfScenes: number | 'auto';
  shotsPerScene: number | 'auto';
  characterPersonality: string;
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions: { [shotId: string]: ShotVersion[] };
  shotInheritanceMap: { [shotId: string]: boolean };
  characters: Character[];
  locations: Location[];
  referenceImages: ReferenceImage[];
  continuityLocked: boolean;
  continuityGroups: { [sceneId: string]: any[] };
  mainCharacter: Character | null;
  worldSettings: { 
    artStyle: string; 
    imageModel?: string;
    worldDescription?: string;
    locations?: Array<{ id: string; name: string; description: string }>;
    imageInstructions?: string;
    videoInstructions?: string;
  };
  // Step 5 Sound data
  voiceoverScript?: string;
  voiceoverAudioUrl?: string;
  voiceoverDuration?: number;
  selectedVoiceId?: string;
  soundEffects?: Record<string, { prompt?: string; audioUrl?: string; duration?: number; isGenerating?: boolean }>;
  generatedMusicUrl?: string;
  generatedMusicDuration?: number;
  onVoiceoverScriptChange?: (script: string) => void;
  onVoiceoverAudioGenerated?: (audioUrl: string, duration: number) => void;
  onMusicGenerated?: (musicUrl: string, duration: number) => void;
  onVoiceChange?: (voiceId: string) => void;
  onSoundEffectsUpdate?: (soundEffects: Record<string, { prompt?: string; audioUrl?: string; duration?: number; isGenerating?: boolean }>) => void;
  onScriptChange: (script: string) => void;
  onAspectRatioChange: (aspectRatio: string) => void;
  onScriptModelChange: (model: string) => void;
  onVideoModelChange: (model: string) => void;
  onImageModelChange: (model: string) => void;
  onNarrationStyleChange: (style: "third-person" | "first-person") => void;
  onVoiceOverToggle: (enabled: boolean) => void;
  onBackgroundMusicEnabledChange: (enabled: boolean) => void;
  onVoiceoverLanguageChange: (language: 'en' | 'ar') => void;
  onTextOverlayEnabledChange: (enabled: boolean) => void;
  onThemeChange: (theme: string) => void;
  onNumberOfScenesChange: (scenes: number | 'auto') => void;
  onShotsPerSceneChange: (shots: number | 'auto') => void;
  onCharacterPersonalityChange: (personality: string) => void;
  onUserPromptChange?: (prompt: string) => void;
  onDurationChange?: (duration: string) => void;
  onGenresChange?: (genres: string[]) => void;
  onTonesChange?: (tones: string[]) => void;
  onLanguageChange?: (language: string) => void;
  onScenesChange: (scenes: Scene[]) => void;
  onShotsChange: (shots: { [sceneId: string]: Shot[] }) => void;
  onShotVersionsChange: (shotVersions: { [shotId: string]: ShotVersion[] }) => void;
  onCharactersChange: (characters: Character[]) => void;
  onLocationsChange: (locations: Location[]) => void;
  onReferenceImagesChange: (referenceImages: ReferenceImage[]) => void;
  onContinuityLockedChange: (locked: boolean) => void;
  onContinuityGroupsChange: (groups: { [sceneId: string]: any[] }) => void;
  onMainCharacterChange: (character: Character | null) => void;
  onWorldSettingsChange: (settings: { 
    artStyle: string; 
    imageModel: string;
    worldDescription: string;
    locations: Array<{ id: string; name: string; description: string }>;
    imageInstructions: string;
    videoInstructions: string;
  }) => void;
  onNext: () => void;
}

export function CharacterVlogWorkflow({
  activeStep,
  videoId,
  workspaceId,
  workflowRef,
  narrativeMode,
  referenceMode,
  script,
  aspectRatio,
  scriptModel,
  videoModel,
  imageModel,
  narrationStyle,
  voiceOverEnabled,
  backgroundMusicEnabled,
  voiceoverLanguage,
  textOverlayEnabled,
  theme,
  numberOfScenes,
  shotsPerScene,
  characterPersonality,
  scenes,
  shots,
  shotVersions,
  shotInheritanceMap,
  characters,
  locations,
  referenceImages,
  continuityLocked,
  continuityGroups,
  mainCharacter,
  worldSettings,
  voiceoverScript,
  voiceoverAudioUrl,
  voiceoverDuration,
  selectedVoiceId,
  soundEffects,
  generatedMusicUrl,
  generatedMusicDuration,
  onVoiceoverScriptChange,
  onVoiceoverAudioGenerated,
  onMusicGenerated,
  onVoiceChange,
  onSoundEffectsUpdate,
  onScriptChange,
  onAspectRatioChange,
  onScriptModelChange,
  onVideoModelChange,
  onImageModelChange,
  onNarrationStyleChange,
  onVoiceOverToggle,
  onBackgroundMusicEnabledChange,
  onVoiceoverLanguageChange,
  onTextOverlayEnabledChange,
  onThemeChange,
  onNumberOfScenesChange,
  onShotsPerSceneChange,
  onCharacterPersonalityChange,
  onUserPromptChange,
  onDurationChange,
  onGenresChange,
  onTonesChange,
  onLanguageChange,
  onScenesChange,
  onShotsChange,
  onShotVersionsChange,
  onCharactersChange,
  onLocationsChange,
  onReferenceImagesChange,
  onContinuityLockedChange,
  onContinuityGroupsChange,
  onMainCharacterChange,
  onWorldSettingsChange,
  onNext,
}: CharacterVlogWorkflowProps) {
  const { toast } = useToast();
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [generatingShotIds, setGeneratingShotIds] = useState<Set<string>>(new Set());
  const [isGeneratingVideos, setIsGeneratingVideos] = useState(false);
  const [generatingVideoShotIds, setGeneratingVideoShotIds] = useState<Set<string>>(new Set());
  
  // Timer ref for debounced auto-save
  const step3SaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref to PreviewTab for getting volumes
  const previewTabRef = useRef<PreviewTabRef>(null);
  
  // Expose methods to parent via workflowRef
  useImperativeHandle(workflowRef, () => ({
    getCurrentVolumes: () => {
      if (previewTabRef.current?.getCurrentVolumes) {
        return previewTabRef.current.getCurrentVolumes();
      }
      return null;
    },
  }), []);

  // Debounced auto-save for step3Data (scenes/shots) when models change
  const debouncedSaveStep3Data = useCallback((
    scenesToSave: Scene[],
    shotsToSave: { [sceneId: string]: Shot[] }
  ) => {
    // Clear existing timer
    if (step3SaveTimerRef.current) {
      clearTimeout(step3SaveTimerRef.current);
    }
    
    // Skip if no videoId or new video
    if (!videoId || videoId === 'new') {
      return;
    }
    
    // Set new timer - save after 2 seconds of no changes
    step3SaveTimerRef.current = setTimeout(async () => {
      try {
        console.log('[CharacterVlogWorkflow] Auto-saving step3Data (scenes/shots)...', {
          scenesCount: scenesToSave.length,
          shotsCount: Object.keys(shotsToSave).length,
          sampleScene: scenesToSave[0],
        });
        
        const response = await fetch(`/api/character-vlog/videos/${videoId}/step/3/settings`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            scenes: scenesToSave,
            shots: shotsToSave,
            continuityGroups,
            continuityLocked,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[CharacterVlogWorkflow] Auto-save failed:', errorData);
          throw new Error(errorData.error || 'Failed to save step3Data');
        }
        
        console.log('[CharacterVlogWorkflow] Step3Data auto-saved successfully');
      } catch (error) {
        console.error('[CharacterVlogWorkflow] Step3Data auto-save error:', error);
      }
    }, 1000); // Auto-save after 1 second of no changes
  }, [videoId, workspaceId, continuityGroups, continuityLocked]);

  // Single image generation for one shot (prompts must already exist)
  const handleGenerateSingleImage = async (shotId: string) => {
    setGeneratingShotIds(prev => new Set(prev).add(shotId));
    
    try {
      // Find the shot to get its sceneId
      const shot = Object.values(shots).flat().find(s => s.id === shotId);
      if (!shot) {
        throw new Error('Shot not found');
      }
      
      // Find the scene to get the imageModel (if set)
      const scene = scenes.find(s => s.id === shot.sceneId);
      const sceneImageModel = scene?.imageModel || null;
      
      // Generate images based on reference mode (prompts must already exist)
      // 1F mode (image-reference): generate single "image" frame
      // 2F mode (start-end): generate "start" and "end" frames
      const framesToGenerate = referenceMode === '1F' ? ['image'] : ['start', 'end'];
      
      for (const frame of framesToGenerate) {
        console.log(`Generating ${frame} frame for shot:`, shotId, 'with model:', sceneImageModel || 'step1 default');
        const response = await fetch('/api/character-vlog/shots/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            shotId,
            videoId,
            frame, // "image" for 1F mode, "start"/"end" for 2F mode
            ...(sceneImageModel && { imageModel: sceneImageModel }), // Only include if explicitly set
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to generate image' }));
          throw new Error(errorData.error || 'Failed to generate image');
        }
      }
      
      // Refresh shot versions from server to update UI with generated images
      if (videoId) {
        try {
          console.log('[CharacterVlogWorkflow] Fetching fresh shot versions after single image generation...');
          const videoResponse = await fetch(`/api/videos/${videoId}`, {
            credentials: 'include',
            headers: workspaceId ? { 'x-workspace-id': workspaceId } : {},
          });

          if (videoResponse.ok) {
            const video = await videoResponse.json();
            
            // Update local state with new shot versions that have image URLs
            if (video.step4Data?.shotVersions) {
              console.log('[CharacterVlogWorkflow] ✅ Received fresh shot versions after single generation');
              
              // Deep clone to ensure React detects ALL changes (including nested arrays)
              const freshShotVersions = JSON.parse(JSON.stringify(video.step4Data.shotVersions));
              onShotVersionsChange(freshShotVersions);
            }
          }
        } catch (error) {
          console.error('[CharacterVlogWorkflow] ❌ Failed to refresh shot versions:', error);
        }
      }
    } catch (error) {
      console.error('Image generation error:', error);
      toast({
        title: "Image Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
      throw error;
    } finally {
      setGeneratingShotIds(prev => {
        const next = new Set(prev);
        next.delete(shotId);
        return next;
      });
    }
  };

  // Batch image generation for all shots in a specific scene
  const handleGenerateSceneImages = async (sceneId: string) => {
    if (!videoId) {
      toast({
        title: "Error",
        description: "Video ID is required",
        variant: "destructive",
      });
      return;
    }

    // Find the scene to get the imageModel (if set)
    const scene = scenes.find(s => s.id === sceneId);
    const sceneImageModel = scene?.imageModel || null;

    // Identify which shots need image generation (skip shots that already have images)
    const sceneShots = shots[sceneId] || [];
    const shotsNeedingImages: string[] = [];
    
    for (const shot of sceneShots) {
      const versions = shotVersions[shot.id];
      if (!versions || versions.length === 0) {
        // No version exists yet, needs generation
        shotsNeedingImages.push(shot.id);
        continue;
      }
      
      const latestVersion = versions[versions.length - 1];
      
      // Check what images are needed based on reference mode
      let needsImage = false;
      if (referenceMode === '1F') {
        // 1F mode: needs single image
        needsImage = !latestVersion.imageUrl;
      } else {
        // 2F mode: needs both start and end frames
        // Skip if BOTH frames already exist (continuity logic handled by backend)
        needsImage = !latestVersion.startFrameUrl || !latestVersion.endFrameUrl;
      }
      
      if (needsImage) {
        shotsNeedingImages.push(shot.id);
      }
    }
    
    if (shotsNeedingImages.length === 0) {
      toast({
        title: "Already Complete",
        description: "All shots in this scene already have images.",
      });
      return;
    }
    
    // Set generating state for shots that need images
    setGeneratingShotIds(new Set(shotsNeedingImages));
    setIsGeneratingImages(true);
    
    toast({
      title: "Generating Scene Images",
      description: `Starting image generation for ${shotsNeedingImages.length} of ${sceneShots.length} shots...`,
    });

    try {
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log('🎬 BATCH IMAGE GENERATION STARTED');
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log(`Scene ID: ${sceneId}`);
      console.log(`Total shots to generate: ${shotsNeedingImages.length}`);
      console.log(`Shot IDs: ${shotsNeedingImages.join(', ')}`);
      console.log(`Reference Mode: ${referenceMode}`);
      console.log('═══════════════════════════════════════════════════════════════════');
      
      // Generate each shot sequentially
      for (let i = 0; i < shotsNeedingImages.length; i++) {
        const shotId = shotsNeedingImages[i];
        console.log(`\n📸 Generating shot ${i + 1}/${shotsNeedingImages.length}: ${shotId}`);
        
        // Generate images for this shot (respects continuity data)
        const framesToGenerate = referenceMode === '1F' ? ['image'] : ['start', 'end'];
        console.log(`   Frames to generate: ${framesToGenerate.join(', ')}`);
        
        for (const frame of framesToGenerate) {
          console.log(`   🔄 Generating ${frame} frame...`);
          const response = await fetch('/api/character-vlog/shots/generate-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
            },
            credentials: 'include',
            body: JSON.stringify({
              shotId,
              videoId,
              frame,
              ...(sceneImageModel && { imageModel: sceneImageModel }), // Only include if explicitly set
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`   ❌ FAILED to generate ${frame} frame for shot ${shotId}:`, errorData);
            // Continue with next shot instead of failing completely
          } else {
            // Wait for response to ensure backend has saved the image URL
            const data = await response.json();
            console.log(`   ✅ SUCCESS: Generated ${frame} frame for shot ${shotId}`);
            console.log(`      Version ID: ${data.shotVersionId || data.version?.id || 'N/A'}`);
            console.log(`      Has image URL: ${!!(data.imageUrl || data.startFrameUrl || data.endFrameUrl)}`);
          }
        }
        
        console.log(`   ✔️  Completed shot ${shotId}`);
        
        // Remove from generating set after this shot completes
        setGeneratingShotIds(prev => {
          const next = new Set(prev);
          next.delete(shotId);
          return next;
        });
      }
      
      console.log('\n═══════════════════════════════════════════════════════════════════');
      console.log('✅ ALL IMAGES GENERATED - Starting data refresh...');
      console.log('═══════════════════════════════════════════════════════════════════');
      
      // Wait a bit longer to ensure all database writes have completed
      console.log('\n⏳ Waiting for database writes to complete...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (videoId) {
        try {
          console.log('\n🔄 Fetching updated data from server...');
          console.log(`   Video ID: ${videoId}`);
          const videoResponse = await fetch(`/api/videos/${videoId}`, {
            credentials: 'include',
            headers: workspaceId ? { 'x-workspace-id': workspaceId } : {},
          });

          if (videoResponse.ok) {
            console.log('   ✅ Server response received');
            const video = await videoResponse.json();
            console.log('   📦 Video data parsed');
            
            // Update with shot versions from server (includes newly generated images)
            if (video.step4Data?.shotVersions) {
              console.log('\n📊 Processing shot versions from server:');
              console.log(`   Total shots in database: ${Object.keys(video.step4Data.shotVersions).length}`);
              console.log(`   Shots just generated: ${shotsNeedingImages.length}`);
              
              // DON'T merge with potentially stale closure - use fresh data from server!
              // The server has the complete, correct state with all prompts and images
              const freshShotVersions: { [shotId: string]: ShotVersion[] } = {};
              
              console.log('\n🔄 Cloning shot versions from server...');
              // Deep clone ALL shot versions from server (not just the generated ones)
              // This prevents the React closure stale state bug
              Object.keys(video.step4Data.shotVersions).forEach(shotId => {
                const versions = video.step4Data.shotVersions[shotId];
                if (Array.isArray(versions) && versions.length > 0) {
                  freshShotVersions[shotId] = versions.map((v: any) => ({
                    ...v,
                    createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
                  }));
                  
                  // Log details for generated shots
                  if (shotsNeedingImages.includes(shotId)) {
                    const latestVersion = versions[versions.length - 1];
                    console.log(`\n   📸 Shot ${shotId}:`);
                    console.log(`      Version ID: ${latestVersion.id}`);
                    console.log(`      Images: ${latestVersion?.imageUrl ? '✓ image' : ''}${latestVersion?.startFrameUrl ? ' ✓ start' : ''}${latestVersion?.endFrameUrl ? ' ✓ end' : ''}`);
                    console.log(`      Prompts: ${latestVersion?.imagePrompt ? '✓ image' : ''}${latestVersion?.startFramePrompt ? ' ✓ start' : ''}${latestVersion?.endFramePrompt ? ' ✓ end' : ''}${latestVersion?.videoPrompt ? ' ✓ video' : ''}`);
                  }
                }
              });
              
              console.log('\n🔄 Updating shotVersions state...');
              // Replace entire state with fresh data from server
              // The storyboard-editor will automatically use the latest version
              // (No need to sync currentVersionId - the fallback handles it!)
              onShotVersionsChange(freshShotVersions);
              
              console.log('\n═══════════════════════════════════════════════════════════════════');
              console.log('✅ BATCH GENERATION COMPLETE!');
              console.log('═══════════════════════════════════════════════════════════════════');
              console.log(`✓ Generated ${shotsNeedingImages.length} shots`);
              console.log(`✓ Updated ${Object.keys(freshShotVersions).length} shot versions`);
              console.log('✓ All prompts preserved');
              console.log('✓ All images ready to display');
              console.log('═══════════════════════════════════════════════════════════════════');
            } else {
              console.warn('[CharacterVlogWorkflow] ⚠️ No shotVersions in response');
            }
          } else {
            console.error('[CharacterVlogWorkflow] ❌ Failed to fetch video:', videoResponse.status);
          }
        } catch (error) {
          console.error('[CharacterVlogWorkflow] ❌ Failed to refresh shot versions:', error);
        }
      }
      
      toast({
        title: "Scene Images Generated",
        description: `Successfully generated images for ${shotsNeedingImages.length} shots.`,
      });
    } catch (error) {
      console.error('[CharacterVlogWorkflow] Scene image generation error:', error);
      toast({
        title: "Scene Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate images for the scene",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImages(false);
      setGeneratingShotIds(new Set());
    }
  };

  // Batch video generation for all shots in a specific scene
  const handleGenerateSceneVideos = async (sceneId: string) => {
    if (!videoId) {
      toast({
        title: "Error",
        description: "Video ID is required",
        variant: "destructive",
      });
      return;
    }

    // Identify which shots need video generation (have images but no videos)
    const sceneShots = shots[sceneId] || [];
    const shotsNeedingVideos: string[] = [];
    
    for (const shot of sceneShots) {
      const versions = shotVersions[shot.id];
      if (!versions || versions.length === 0) continue;
      
      const latestVersion = versions[versions.length - 1];
      
      // Check if shot has required images but no video based on mode
      let hasRequiredImages: boolean;
      if (referenceMode === '1F') {
        hasRequiredImages = !!latestVersion.imageUrl;
      } else {
        // 2F mode: needs both frames
        hasRequiredImages = !!(latestVersion.startFrameUrl && latestVersion.endFrameUrl);
      }
      
      const hasVideo = !!latestVersion.videoUrl;
      
      // Need video if we have images but no video
      if (hasRequiredImages && !hasVideo) {
        shotsNeedingVideos.push(shot.id);
      }
    }
    
    if (shotsNeedingVideos.length === 0) {
      toast({
        title: "Already Complete",
        description: "All shots in this scene already have videos, or are missing images.",
      });
      return;
    }
    
    // Set generating state for shots that need videos
    setGeneratingVideoShotIds(new Set(shotsNeedingVideos));
    setIsGeneratingVideos(true);
    
    toast({
      title: "Generating Scene Videos",
      description: `Starting video generation for ${shotsNeedingVideos.length} of ${sceneShots.length} shots...`,
    });

    try {
      // Generate each shot sequentially
      for (const shotId of shotsNeedingVideos) {
        const response = await fetch(`/api/character-vlog/videos/${videoId}/shots/${shotId}/generate-video`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({}), // No body needed - params are in URL
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Failed to generate video for shot ${shotId}:`, errorData);
          // Continue with next shot instead of failing completely
        }
        
        // Remove from generating set after this shot completes
        setGeneratingVideoShotIds(prev => {
          const next = new Set(prev);
          next.delete(shotId);
          return next;
        });
      }
      
      // Refresh shot versions from server to update UI with generated videos
      if (videoId) {
        try {
          const videoResponse = await fetch(`/api/videos/${videoId}`, {
            credentials: 'include',
            headers: workspaceId ? { 'x-workspace-id': workspaceId } : {},
          });

          if (videoResponse.ok) {
            const video = await videoResponse.json();
            
            // Update local state with new shot versions that have video URLs
            if (video.step4Data?.shotVersions) {
              console.log('[CharacterVlogWorkflow] Updating shotVersions from server after video generation:', {
                shotVersionsCount: Object.keys(video.step4Data.shotVersions).length,
              });
              onShotVersionsChange(video.step4Data.shotVersions);
            }
          }
        } catch (error) {
          console.error('[CharacterVlogWorkflow] Failed to refresh shot versions:', error);
        }
      }
      
      toast({
        title: "Scene Videos Generated",
        description: `Successfully generated videos for ${shotsNeedingVideos.length} shots.`,
      });
    } catch (error) {
      console.error('[CharacterVlogWorkflow] Scene video generation error:', error);
      toast({
        title: "Scene Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate videos for the scene",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingVideos(false);
      setGeneratingVideoShotIds(new Set());
    }
  };

  // Single video generation for one shot
  const handleGenerateSingleVideo = async (shotId: string) => {
    setGeneratingVideoShotIds(prev => new Set(prev).add(shotId));
    
    try {
      const response = await fetch(`/api/character-vlog/videos/${videoId}/shots/${shotId}/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({}), // No body needed - params are in URL
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate video' }));
        throw new Error(errorData.error || 'Failed to generate video');
      }

      // Refresh shot versions from server to update UI with generated video
      if (videoId) {
        try {
          const videoResponse = await fetch(`/api/videos/${videoId}`, {
            credentials: 'include',
            headers: workspaceId ? { 'x-workspace-id': workspaceId } : {},
          });

          if (videoResponse.ok) {
            const video = await videoResponse.json();
            
            if (video.step4Data?.shotVersions) {
              console.log('[CharacterVlogWorkflow] Updating shotVersions after single video generation');
              onShotVersionsChange(video.step4Data.shotVersions);
            }
          }
        } catch (error) {
          console.error('[CharacterVlogWorkflow] Failed to refresh shot versions:', error);
        }
      }

      toast({
        title: "Video Generated",
        description: "Video generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Video Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate video",
        variant: "destructive",
      });
    } finally {
      setGeneratingVideoShotIds(prev => {
        const next = new Set(prev);
        next.delete(shotId);
        return next;
      });
    }
  };

  const handleGenerateShot = async (shotId: string) => {
    // Find which scene this shot belongs to
    const sceneId = Object.keys(shots).find(sId => 
      shots[sId]?.some(shot => shot.id === shotId)
    );
    
    if (!sceneId) {
      toast({
        title: "Error",
        description: "Could not find scene for this shot",
        variant: "destructive",
      });
      return;
    }

    // Generate prompts for all shots in the scene (batch processing)
    try {
      const response = await fetch('/api/character-vlog/storyboard/generate-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          videoId,
          sceneId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to generate prompts' }));
        throw new Error(error.details || error.error || 'Failed to generate prompts');
      }

      const data = await response.json();
      
      // Update shot versions with generated prompts
      const updatedShotVersions = { ...shotVersions };
      const sceneShots = shots[sceneId] || [];
      
      for (const generatedShot of data.shots) {
        const shot = sceneShots.find(s => s.id === generatedShot.shotId);
        if (!shot) continue;

        // Create or update shot version with prompts
        const existingVersions = updatedShotVersions[shot.id] || [];
        const newVersion: ShotVersion = {
          id: `version-${Date.now()}-${shot.id}`,
          shotId: shot.id,
          versionNumber: existingVersions.length + 1,
          imagePrompt: generatedShot.imagePrompts.single || generatedShot.imagePrompts.start || '',
          startFramePrompt: generatedShot.imagePrompts.start || null,
          endFramePrompt: generatedShot.imagePrompts.end || null,
          videoPrompt: generatedShot.videoPrompt,
          imageUrl: null,
          startFrameUrl: null,
          endFrameUrl: null,
          videoUrl: null,
          videoDuration: shot.duration || 5,
          status: 'pending',
          needsRerender: false,
          createdAt: new Date(),
        };

        updatedShotVersions[shot.id] = [...existingVersions, newVersion];
        
        // Always set the newly generated version as current version
        handleUpdateShot(shot.id, { currentVersionId: newVersion.id });
      }

      onShotVersionsChange(updatedShotVersions);

      toast({
        title: "Prompts Generated",
        description: `Generated prompts for ${data.shots.length} shot(s) in scene`,
      });
    } catch (error) {
      console.error('Failed to generate prompts:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate prompts. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateShot = async (shotId: string) => {
    // Regeneration also processes the entire scene (batch processing)
    await handleGenerateShot(shotId);
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

  const handleUpdateShotVersion = (shotId: string, versionId: string, updates: Partial<ShotVersion>) => {
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

  const handleUpdateScene = (sceneId: string, updates: Partial<Scene>) => {
    const newScenes = scenes.map((scene) =>
      scene.id === sceneId ? { ...scene, ...updates } : scene
    );
    
    onScenesChange(newScenes);
    
    // Trigger debounced save for model changes
    if (updates.imageModel !== undefined || updates.videoModel !== undefined) {
      debouncedSaveStep3Data(newScenes, shots);
      console.log('[CharacterVlogWorkflow] Scene model changed, triggering auto-save:', {
        sceneId,
        imageModel: updates.imageModel,
        videoModel: updates.videoModel,
      });
    }
  };

  const handleUploadShotReference = (shotId: string, file: File) => {
    const tempUrl = URL.createObjectURL(file);
    
    const existingRef = referenceImages.find(
      (ref) => ref.shotId === shotId && ref.type === "shot_reference"
    );

    if (existingRef) {
      onReferenceImagesChange(
        referenceImages.map((ref) =>
          ref.shotId === shotId && ref.type === "shot_reference"
            ? { ...ref, imageUrl: tempUrl }
            : ref
        )
      );
    } else {
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
    handleUpdateShot(shotId, { currentVersionId: versionId });
  };

  const handleDeleteVersion = (shotId: string, versionId: string) => {
    const versions = shotVersions[shotId] || [];
    const filteredVersions = versions.filter(v => v.id !== versionId);
    
    onShotVersionsChange({
      ...shotVersions,
      [shotId]: filteredVersions,
    });
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

    const newShots = [...sceneShots];
    newShots.splice(afterShotIndex + 1, 0, newShot);

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
    const updatedScenes = scenes
      .filter(scene => scene.id !== sceneId)
      .map((scene, idx) => ({
        ...scene,
        sceneNumber: idx + 1,
      }));
    
    onScenesChange(updatedScenes);
    
    const updatedShots = { ...shots };
    delete updatedShots[sceneId];
    onShotsChange(updatedShots);
    
    const sceneShots = shots[sceneId] || [];
    const updatedShotVersions = { ...shotVersions };
    sceneShots.forEach(shot => {
      delete updatedShotVersions[shot.id];
    });
    onShotVersionsChange(updatedShotVersions);
    
    const shotIds = sceneShots.map(s => s.id);
    onReferenceImagesChange(
      referenceImages.filter(ref => !shotIds.includes(ref.shotId || ''))
    );
  };

  const handleDeleteShot = (shotId: string) => {
    const sceneId = Object.keys(shots).find(sId => 
      shots[sId]?.some(shot => shot.id === shotId)
    );
    
    if (!sceneId) return;
    
    const sceneShots = shots[sceneId] || [];
    
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
    
    const updatedShotVersions = { ...shotVersions };
    delete updatedShotVersions[shotId];
    onShotVersionsChange(updatedShotVersions);
    
    onReferenceImagesChange(
      referenceImages.filter(ref => ref.shotId !== shotId)
    );
  };

  return (
    <div>
      {activeStep === "script" && (
        <CharacterVlogScriptEditor
          videoId={videoId}
          workspaceId={workspaceId}
          initialScript={script}
          scriptModel={scriptModel}
          videoModel={videoModel}
          imageModel={imageModel}
          narrationStyle={narrationStyle}
          theme={theme}
          numberOfScenes={numberOfScenes}
          shotsPerScene={shotsPerScene}
          characterPersonality={characterPersonality}
          aspectRatio={aspectRatio}
          referenceMode={referenceMode}
          onScriptChange={onScriptChange}
          onScriptModelChange={onScriptModelChange}
          onVideoModelChange={onVideoModelChange}
          onImageModelChange={onImageModelChange}
          onAspectRatioChange={onAspectRatioChange}
          onNarrationStyleChange={onNarrationStyleChange}
          onThemeChange={onThemeChange}
          onNumberOfScenesChange={onNumberOfScenesChange}
          onShotsPerSceneChange={onShotsPerSceneChange}
          onCharacterPersonalityChange={onCharacterPersonalityChange}
          onUserPromptChange={onUserPromptChange}
          onDurationChange={onDurationChange}
          onGenresChange={onGenresChange}
          onTonesChange={onTonesChange}
          onLanguageChange={onLanguageChange}
          backgroundMusicEnabled={backgroundMusicEnabled}
          voiceoverLanguage={voiceoverLanguage}
          textOverlayEnabled={textOverlayEnabled}
          onBackgroundMusicEnabledChange={onBackgroundMusicEnabledChange}
          onVoiceoverLanguageChange={onVoiceoverLanguageChange}
          onTextOverlayEnabledChange={onTextOverlayEnabledChange}
          onNext={onNext}
        />
      )}

      {activeStep === "scenes" && (
        <CharacterVlogSceneBreakdown
          videoId={videoId}
          workspaceId={workspaceId}
          narrativeMode={narrativeMode}
          referenceMode={referenceMode}
          script={script}
          characterName={mainCharacter?.name || "Character"}
          theme={theme}
          scenes={scenes.map(s => ({
            id: s.id,
            name: s.title || `Scene ${s.sceneNumber}`,
            description: s.description || "",
            duration: s.duration || 5,
            actType: (s.title?.toLowerCase().includes("hook") ? "hook" : 
                     s.title?.toLowerCase().includes("intro") ? "intro" :
                     s.title?.toLowerCase().includes("outro") ? "outro" : "main") as "hook" | "intro" | "main" | "outro",
            shots: [],
          }))}
          shots={Object.fromEntries(
            Object.entries(shots).map(([sceneId, sceneShots]) => [
              sceneId,
              sceneShots.map(shot => {
                // shot.shotType should be the frame type (image-ref/start-end) from database
                // Check if it's a valid frame type
                const isFrameType = shot.shotType === 'image-ref' || shot.shotType === 'start-end';
                const frameType = isFrameType 
                  ? shot.shotType as "image-ref" | "start-end"
                  : "start-end" as "image-ref" | "start-end"; // Default fallback if invalid
                
                // cameraMovement is the camera shot type (Medium Shot, Wide Shot, etc.)
                // If shotType is not a frame type, it might be a camera shot, so use it as fallback
                const cameraShot = shot.cameraMovement || (!isFrameType ? shot.shotType : null) || "Medium Shot";
                
                return {
                  id: shot.id,
                  sceneId: shot.sceneId,
                  name: `Shot ${shot.shotNumber}`,
                  description: shot.description || "",
                  shotType: frameType,
                  cameraShot: cameraShot,
                  isLinkedToPrevious: false,
                  referenceTags: [],
                };
              })
            ])
          )}
          continuityLocked={continuityLocked}
          continuityGroups={continuityGroups}
          characters={characters.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description || c.appearance || '',
          }))}
          locations={locations.map(l => ({
            id: l.id,
            name: l.name,
            description: l.description || l.details || '',
          }))}
          onScenesChange={(newScenes) => {
            onScenesChange(newScenes.map((scene, idx) => ({
              id: scene.id,
              videoId: videoId,
              sceneNumber: idx + 1,
              title: scene.name,
              description: scene.description,
              lighting: null,
              weather: null,
              imageModel: null,
              videoModel: null,
              duration: scene.duration,
              createdAt: new Date(),
            })));
          }}
          onShotsChange={(newShots) => {
            onShotsChange(Object.fromEntries(
              Object.entries(newShots).map(([sceneId, sceneShots]) => [
                sceneId,
                sceneShots.map((shot, idx) => ({
                  id: shot.id,
                  sceneId: shot.sceneId,
                  shotNumber: idx + 1,
                  description: shot.description,
                  cameraMovement: shot.cameraShot || "Static",
                  shotType: shot.shotType || "image-ref", // ✅ FIX: Preserve frame type (image-ref/start-end), not camera shot
                  soundEffects: null,
                  duration: shot.duration || 5, // ✅ FIX: Use actual duration from shot generator
                  transition: "cut",
                  imageModel: null,
                  videoModel: null,
                  currentVersionId: null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }))
              ])
            ));
          }}
          onContinuityGroupsChange={onContinuityGroupsChange}
          onContinuityLockedChange={onContinuityLockedChange}
          onNext={onNext}
        />
      )}

      {activeStep === "elements" && (
        <ElementsTab
          videoId={videoId}
          workspaceId={workspaceId}
          characters={characters}
          locations={locations}
          referenceImages={referenceImages}
          artStyle={worldSettings.artStyle}
          worldDescription={worldSettings.worldDescription}
          onCharactersChange={onCharactersChange}
          onLocationsChange={onLocationsChange}
          onReferenceImagesChange={onReferenceImagesChange}
          onWorldSettingsChange={(settings) => onWorldSettingsChange({
            ...settings,
            imageModel: worldSettings.imageModel || imageModel,
            locations: worldSettings.locations || [],
            imageInstructions: worldSettings.imageInstructions || "",
            videoInstructions: worldSettings.videoInstructions || "",
          })}
          onNext={onNext}
          mainCharacter={mainCharacter}
          onMainCharacterChange={onMainCharacterChange}
        />
      )}

      {activeStep === "storyboard" && (
        <StoryboardEditor
          videoId={videoId}
          narrativeMode={narrativeMode}
          referenceMode={referenceMode}
          aspectRatio={aspectRatio}
          scenes={scenes}
          shots={shots}
          shotVersions={shotVersions}
          shotInheritanceMap={shotInheritanceMap}
          referenceImages={referenceImages}
          characters={characters}
          locations={locations}
          voiceOverEnabled={voiceOverEnabled}
          backgroundMusicEnabled={backgroundMusicEnabled}
          voiceoverLanguage={voiceoverLanguage}
          textOverlayEnabled={textOverlayEnabled}
          continuityLocked={continuityLocked}
          continuityGroups={continuityGroups}
          isCharacterVlogMode={true}
          step1ImageModel={imageModel}
          step1VideoModel={videoModel}
          onVoiceOverToggle={onVoiceOverToggle}
          onBackgroundMusicEnabledChange={onBackgroundMusicEnabledChange}
          onVoiceoverLanguageChange={onVoiceoverLanguageChange}
          onTextOverlayEnabledChange={onTextOverlayEnabledChange}
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
          onGenerateSceneImages={handleGenerateSceneImages}
          isGeneratingImages={isGeneratingImages}
          generatingShotIds={generatingShotIds}
          onGenerateSceneVideos={handleGenerateSceneVideos}
          isGeneratingVideos={isGeneratingVideos}
          generatingVideoShotIds={generatingVideoShotIds}
          onGenerateSingleVideo={handleGenerateSingleVideo}
          onGenerateSingleImage={handleGenerateSingleImage}
          onNext={onNext}
        />
      )}

      {activeStep === "animatic" && (
        <SoundscapeTab
          videoId={videoId}
          scenes={scenes}
          shots={shots}
          shotVersions={shotVersions}
          voiceoverEnabled={voiceOverEnabled}
          voiceoverLanguage={voiceoverLanguage}
          voiceoverScript={voiceoverScript}
          voiceoverAudioUrl={voiceoverAudioUrl}
          voiceoverDuration={voiceoverDuration}
          selectedVoiceId={selectedVoiceId}
          soundEffects={soundEffects}
          backgroundMusicEnabled={backgroundMusicEnabled}
          generatedMusicUrl={generatedMusicUrl}
          generatedMusicDuration={generatedMusicDuration}
          onVoiceoverScriptChange={onVoiceoverScriptChange}
          onVoiceoverAudioGenerated={onVoiceoverAudioGenerated}
          onMusicGenerated={onMusicGenerated}
          onVoiceChange={onVoiceChange}
          onSoundEffectsUpdate={onSoundEffectsUpdate}
        />
      )}

      {activeStep === "preview" && (
        <PreviewTab
          ref={previewTabRef}
          videoId={videoId}
        />
      )}

      {activeStep === "export" && (
        <ExportTab
          videoId={videoId}
          videoTitle={script.split('\n')[0]?.slice(0, 50) || 'Character Vlog'}
          duration={Object.values(shots).flat().reduce((total, shot) => total + (shot.duration || 5), 0)}
          sceneCount={scenes.length}
          aspectRatio={aspectRatio}
          hasVoiceover={voiceOverEnabled && !!voiceoverAudioUrl}
          hasMusic={backgroundMusicEnabled && !!generatedMusicUrl}
          imageModel={imageModel}
        />
      )}
    </div>
  );
}

