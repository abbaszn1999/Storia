import { useState, useEffect } from "react";
import { useParams, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CharacterVlogStudioLayout, type VlogStepId } from "@/components/character-vlog/studio";
import { CharacterVlogWorkflow } from "@/components/character-vlog/workflow";
import { CharacterVlogModeSelector } from "@/components/character-vlog/reference-mode-selector";
import { getDefaultVideoModel } from "@/constants/video-models";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/workspace-context";
import { Loader2 } from "lucide-react";
import type { Character, Location, Video } from "@shared/schema";
import type { Scene, Shot, ShotVersion, ReferenceImage } from "@/types/storyboard";

export default function CharacterVlogMode() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const { toast } = useToast();
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace();
  
  const initialVideoId = params.id || urlParams.get("id") || "new";
  const isNewVideo = initialVideoId === "new";
  
  // Use workspace from context, fallback to URL param for backwards compatibility
  const workspaceId = currentWorkspace?.id || urlParams.get("workspace");
  const urlTitle = urlParams.get("title") || "Untitled Character Vlog";
  
  // Fetch existing video data
  const { data: existingVideo, isLoading: isVideoLoading } = useQuery<Video>({
    queryKey: [`/api/videos/${initialVideoId}`],
    enabled: !isNewVideo,
    staleTime: 0,  // Always refetch
    refetchOnMount: true,
  });
  
  // Reference mode selection state - user must choose first
  const [referenceMode, setReferenceMode] = useState<"1F" | "2F" | "AI" | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [creatingMode, setCreatingMode] = useState<"1F" | "2F" | "AI" | null>(null);
  
  // Video ID state (updated after creation)
  const [videoId, setVideoId] = useState<string>(initialVideoId);
  const [videoTitle, setVideoTitle] = useState<string>(urlTitle);
  
  // Helper function to convert display name to code
  const convertReferenceModeToCode = (mode: string): "1F" | "2F" | "AI" | null => {
    if (mode === '1F' || mode === '2F' || mode === 'AI') {
      return mode; // Already a code (backwards compatibility)
    }
    const mapping: Record<string, "1F" | "2F" | "AI"> = {
      'Image Reference': '1F',
      'Start/End': '2F',
      'AI Auto': 'AI',
      // Old format support for backwards compatibility
      '1 frame': '1F',
      '2 Frames': '2F',
    };
    return mapping[mode] || null;
  };

  // Restore reference mode and settings from existing video if available
  useEffect(() => {
    if (existingVideo) {
      // Restore step1Data
      if (existingVideo.step1Data && typeof existingVideo.step1Data === 'object') {
        const step1 = existingVideo.step1Data as any;
        if (step1.referenceMode) {
          const code = convertReferenceModeToCode(step1.referenceMode);
          console.log('[character-vlog:index] Loading referenceMode from database:', {
            stored: step1.referenceMode,
            converted: code,
          });
          if (code) {
            setReferenceMode(code);
          } else {
            console.warn('[character-vlog:index] Failed to convert referenceMode:', step1.referenceMode);
          }
        }
        if (step1.script) setScript(step1.script);
        if (step1.narrationStyle) setNarrationStyle(step1.narrationStyle);
        if (step1.theme) setTheme(step1.theme);
        if (step1.characterPersonality) setCharacterPersonality(step1.characterPersonality);
        if (step1.userPrompt) setUserPrompt(step1.userPrompt);
        if (step1.duration) setDuration(step1.duration);
        if (step1.genres) setGenres(step1.genres);
        if (step1.tones) setTones(step1.tones);
        if (step1.language) setLanguage(step1.language);
        if (step1.aspectRatio) setAspectRatio(step1.aspectRatio);
        if (step1.videoModel) setVideoModel(step1.videoModel);
        if (step1.voiceActorId !== undefined && step1.voiceActorId !== null) setVoiceActorId(step1.voiceActorId);
        if (step1.voiceOverEnabled !== undefined) setVoiceOverEnabled(step1.voiceOverEnabled);
        if (step1.numberOfScenes !== undefined) setNumberOfScenes(step1.numberOfScenes);
        if (step1.shotsPerScene !== undefined) setShotsPerScene(step1.shotsPerScene);
      }
      
      // Restore step2Data
      if (existingVideo.step2Data && typeof existingVideo.step2Data === 'object') {
        const step2 = existingVideo.step2Data as any;
        setWorldSettings({
          artStyle: step2.artStyle || 'none',
          imageModel: step2.imageModel || 'Flux',
          worldDescription: step2.worldDescription || '',
          locations: worldSettings.locations || [],
          imageInstructions: worldSettings.imageInstructions || '',
          videoInstructions: worldSettings.videoInstructions || '',
        });

        // Load characters and locations from step2Data (like narrative mode)
        // First try to load from full objects array (new format)
        if (step2.characters && Array.isArray(step2.characters) && step2.characters.length > 0) {
          // Convert ISO strings back to Date objects if needed
          // Also fetch from database to merge imageUrl if step2Data doesn't have it
          Promise.all(step2.characters.map(async (char: any) => {
            const dbCharacter = await fetch(`/api/characters/${char.id}`, {
              credentials: 'include',
            }).then(res => res.ok ? res.json() : null).catch(() => null);
            
            return {
              ...char,
              // Use imageUrl from database if step2Data doesn't have it
              imageUrl: char.imageUrl || dbCharacter?.imageUrl || null,
              createdAt: typeof char.createdAt === 'string' ? new Date(char.createdAt) : char.createdAt,
            };
          })).then(loadedCharacters => {
            setCharacters(loadedCharacters);
          }).catch(err => {
            console.error('Failed to load characters:', err);
            // Fallback to just using step2Data without database merge
            const loadedCharacters = step2.characters.map((char: any) => ({
              ...char,
              createdAt: typeof char.createdAt === 'string' ? new Date(char.createdAt) : char.createdAt,
            }));
            setCharacters(loadedCharacters);
          });
        } 
        // Fallback to loading by IDs (legacy format for backwards compatibility)
        else if (step2.characterIds && Array.isArray(step2.characterIds) && step2.characterIds.length > 0) {
          Promise.all(step2.characterIds.map((id: string) => 
            fetch(`/api/characters/${id}`, {
              credentials: 'include',
            }).then(res => res.ok ? res.json() : null).catch(() => null)
          )).then(loadedCharacters => {
            const validCharacters = loadedCharacters.filter(c => c !== null);
            if (validCharacters.length > 0) {
              // Preserve section info from step2Data if available
              const charactersWithSection = validCharacters.map((char: Character) => {
                const imageData = step2.characterImages?.find((img: any) => img.characterId === char.id);
                return {
                  ...char,
                  imageUrl: imageData?.imageUrl || char.imageUrl,
                  section: (char as any).section || 'secondary', // Default to secondary if not specified
                };
              });
              setCharacters(charactersWithSection);
            }
          }).catch(err => {
            console.error('Failed to load characters:', err);
          });
        }

        // Load locations from step2Data (like narrative mode)
        // First try to load from full objects array (new format)
        if (step2.locations && Array.isArray(step2.locations) && step2.locations.length > 0) {
          // Convert ISO strings back to Date objects if needed
          // Also fetch from database to merge imageUrl if step2Data doesn't have it
          Promise.all(step2.locations.map(async (loc: any) => {
            const dbLocation = await fetch(`/api/locations/${loc.id}`, {
              credentials: 'include',
            }).then(res => res.ok ? res.json() : null).catch(() => null);
            
            return {
              ...loc,
              // Use imageUrl from database if step2Data doesn't have it
              imageUrl: loc.imageUrl || dbLocation?.imageUrl || null,
              createdAt: typeof loc.createdAt === 'string' ? new Date(loc.createdAt) : loc.createdAt,
            };
          })).then(loadedLocations => {
            setLocations(loadedLocations);
          }).catch(err => {
            console.error('Failed to load locations:', err);
            // Fallback to just using step2Data without database merge
            const loadedLocations = step2.locations.map((loc: any) => ({
              ...loc,
              createdAt: typeof loc.createdAt === 'string' ? new Date(loc.createdAt) : loc.createdAt,
            }));
            setLocations(loadedLocations);
          });
        }

        // Load style reference image from step2Data
        if (step2.styleReferenceImageUrl && typeof step2.styleReferenceImageUrl === 'string') {
          // Check if style reference already exists in referenceImages
          const existingStyleRef = referenceImages.find(r => r.type === 'style');
          if (!existingStyleRef || existingStyleRef.imageUrl !== step2.styleReferenceImageUrl) {
            const styleRefImage: ReferenceImage = {
              id: existingStyleRef?.id || `style-ref-${Date.now()}`,
              videoId: existingVideo.id,
              shotId: null,
              characterId: null,
              type: "style",
              imageUrl: step2.styleReferenceImageUrl,
              description: null,
              createdAt: existingStyleRef?.createdAt || new Date(),
            };
            // Replace existing style ref or add new one
            const otherRefs = referenceImages.filter(r => r.type !== 'style');
            setReferenceImages([...otherRefs, styleRefImage]);
          }
        }
        // Fallback to loading by IDs (legacy format for backwards compatibility)
        else if (step2.locationIds && Array.isArray(step2.locationIds) && step2.locationIds.length > 0) {
          Promise.all(step2.locationIds.map((id: string) => 
            fetch(`/api/locations/${id}`, {
              credentials: 'include',
            }).then(res => res.ok ? res.json() : null).catch(() => null)
          )).then(loadedLocations => {
            const validLocations = loadedLocations.filter(l => l !== null);
            if (validLocations.length > 0) {
              // Preserve image URLs from step2Data if available
              const locationsWithImages = validLocations.map((loc: Location) => {
                const imageData = step2.locationImages?.find((img: any) => img.locationId === loc.id);
                return {
                  ...loc,
                  imageUrl: imageData?.imageUrl || loc.imageUrl,
                };
              });
              setLocations(locationsWithImages);
            }
          }).catch(err => {
            console.error('Failed to load locations:', err);
          });
        }
      }

      // Load step3Data (scenes)
      if (existingVideo.step3Data && typeof existingVideo.step3Data === 'object') {
        const step3 = existingVideo.step3Data as any;
        
        if (step3.scenes && Array.isArray(step3.scenes) && step3.scenes.length > 0) {
          // Convert VlogScene format to Scene format for the workflow
          const loadedScenes: Scene[] = step3.scenes.map((vlogScene: any) => ({
            id: vlogScene.id,
            videoId: existingVideo.id,
            sceneNumber: parseInt(vlogScene.name.match(/Scene (\d+)/)?.[1] || '1', 10),
            title: vlogScene.name,
            description: vlogScene.description || null,
            duration: vlogScene.duration || null,
            lighting: null,
            weather: null,
            imageModel: null,
            videoModel: null,
            createdAt: new Date(),
          }));
          setScenes(loadedScenes);

          // Load shots if available
          if (step3.shots && typeof step3.shots === 'object') {
            const loadedShots: { [sceneId: string]: Shot[] } = {};
            Object.entries(step3.shots).forEach(([sceneId, sceneShots]: [string, any]) => {
              if (Array.isArray(sceneShots)) {
                loadedShots[sceneId] = sceneShots.map((shot: any) => {
                  // Preserve the frame type (image-ref/start-end) from database
                  // The shotType in database is the frame type, not camera shot type
                  const frameType = (shot.shotType === 'image-ref' || shot.shotType === 'start-end') 
                    ? shot.shotType 
                    : null;
                  
                  // cameraMovement/cameraShot is the camera angle type
                  const cameraShot = shot.cameraMovement || shot.cameraShot || 'Medium Shot';
                  
                  return {
                    id: shot.id,
                    sceneId: shot.sceneId,
                    shotNumber: shot.shotNumber || 1,
                    description: shot.description || '',
                    cameraMovement: cameraShot,
                    // IMPORTANT: Store frame type in shotType field so workflow can extract it
                    // If frameType is null, we need to infer from referenceMode or use a safe default
                    shotType: frameType || 'image-ref', // Default to image-ref if missing (safer than camera shot)
                    soundEffects: shot.soundEffects || null,
                    duration: shot.duration || 3,
                    transition: shot.transition || 'cut',
                    imageModel: shot.imageModel || null,
                    videoModel: shot.videoModel || null,
                    currentVersionId: shot.currentVersionId || null,
                    createdAt: typeof shot.createdAt === 'string' ? new Date(shot.createdAt) : shot.createdAt || new Date(),
                    updatedAt: typeof shot.updatedAt === 'string' ? new Date(shot.updatedAt) : shot.updatedAt || new Date(),
                  };
                });
              }
            });
            if (Object.keys(loadedShots).length > 0) {
              console.log('[character-vlog:index] Setting shots state:', {
                shotsCount: Object.keys(loadedShots).length,
                firstShotSample: Object.values(loadedShots)[0]?.[0],
              });
              setShots(loadedShots);
            }
          }
        }
      }
      
      if (existingVideo.title) {
        setVideoTitle(existingVideo.title);
      }
      
      if (existingVideo.currentStep) {
        const stepMap: Record<number, VlogStepId> = {
          1: 'script',
          2: 'elements',
          3: 'scenes',
          4: 'storyboard',
          5: 'animatic',
          6: 'export',
        };
        const stepId = stepMap[existingVideo.currentStep];
        if (stepId) {
          setActiveStep(stepId);
        }
      }
    }
  }, [existingVideo]);
  
  const [activeStep, setActiveStep] = useState<VlogStepId>("script");
  const [completedSteps, setCompletedSteps] = useState<VlogStepId[]>([]);
  const [direction, setDirection] = useState(1);
  const [canContinue, setCanContinue] = useState(true); // Enable Continue button by default for all steps
  const [script, setScript] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [scriptModel, setScriptModel] = useState("gpt-4o");
  const [videoModel, setVideoModel] = useState(getDefaultVideoModel().value);
  const [narrationStyle, setNarrationStyle] = useState<"third-person" | "first-person">("first-person");
  const [voiceActorId, setVoiceActorId] = useState<string | null>(null);
  const [voiceOverEnabled, setVoiceOverEnabled] = useState(true);
  const [theme, setTheme] = useState("urban");
  const [numberOfScenes, setNumberOfScenes] = useState<number | 'auto'>('auto');
  const [shotsPerScene, setShotsPerScene] = useState<number | 'auto'>('auto');
  const [characterPersonality, setCharacterPersonality] = useState("energetic");
  const [userPrompt, setUserPrompt] = useState("");
  const [duration, setDuration] = useState("60");
  const [genres, setGenres] = useState<string[]>([]);
  const [tones, setTones] = useState<string[]>([]);
  const [language, setLanguage] = useState("English");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [shots, setShots] = useState<{ [sceneId: string]: Shot[] }>({});
  const [shotVersions, setShotVersions] = useState<{ [shotId: string]: ShotVersion[] }>({});
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [continuityLocked, setContinuityLocked] = useState(false);
  const [continuityGroups, setContinuityGroups] = useState<{ [sceneId: string]: any[] }>({});
  const [mainCharacter, setMainCharacter] = useState<Character | null>(null);
  const [worldSettings, setWorldSettings] = useState<{ 
    artStyle: string; 
    imageModel?: string;
    worldDescription?: string;
    locations?: Array<{ id: string; name: string; description: string }>;
    imageInstructions?: string;
    videoInstructions?: string;
  }>({
    artStyle: "none",
    imageModel: "Flux",
    worldDescription: "",
    locations: [],
    imageInstructions: "",
    videoInstructions: "",
  });

  const handleNext = async () => {
    console.log('[character-vlog:index] handleNext called:', { activeStep, videoId });
    
    // If we're on the script step, save settings and script to backend before continuing
    if (activeStep === "script") {
      if (!videoId || videoId === "new") {
        toast({
          title: "Error",
          description: "Video ID is required. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }

      try {
        const response = await fetch(`/api/character-vlog/videos/${videoId}/step/1/continue`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            // Reference mode (convert code to display name if needed)
            referenceMode: referenceMode === '1F' ? 'Image Reference' : 
                          referenceMode === '2F' ? 'Start/End' : 
                          referenceMode === 'AI' ? 'AI Auto' : referenceMode,
            // Script generation settings
            scriptModel,
            narrationStyle,
            theme,
            numberOfScenes,
            shotsPerScene,
            characterPersonality,
            videoModel,
            aspectRatio,
            duration,
            genres,
            tones,
            language,
            voiceActorId,
            voiceOverEnabled,
            // Script content
            userPrompt,
            script,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to save script' }));
          throw new Error(error.error || 'Failed to save script');
        }

        toast({
          title: "Script Saved",
          description: "Your script has been saved. Moving to the next step.",
        });
      } catch (error) {
        toast({
          title: "Save Failed",
          description: error instanceof Error ? error.message : "Failed to save script. Please try again.",
          variant: "destructive",
        });
        return; // Don't proceed to next step if save failed
      }
    }

    // Handle step 2 (elements) continue - save full character and location objects (like narrative mode)
    if (activeStep === "elements") {
      try {
        // Send full character objects with all fields (like narrative mode)
        const charactersToSave = characters.map(c => ({
          id: c.id,
          workspaceId: c.workspaceId,
          name: c.name,
          description: c.description || null,
          personality: (c as any).personality || null,
          appearance: (c as any).appearance || null,
          imageUrl: c.imageUrl || null,
          referenceImages: (c as any).referenceImages || null,
          voiceSettings: (c as any).voiceSettings || null,
          createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
          section: (c as any).section || 'secondary', // Character-vlog specific
        }));

        // Send full location objects with all fields (like narrative mode)
        const locationsToSave = locations.map(l => ({
          id: l.id,
          workspaceId: l.workspaceId,
          name: l.name,
          description: l.description || null,
          details: (l as any).details || null,
          imageUrl: l.imageUrl || null,
          referenceImages: (l as any).referenceImages || null,
          createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt,
        }));

        const response = await fetch(`/api/character-vlog/videos/${videoId}/step/2/continue`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            characters: charactersToSave,
            locations: locationsToSave,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to save elements' }));
          throw new Error(error.details || error.error || 'Failed to save elements');
        }

        toast({
          title: "Elements Saved",
          description: "Your characters and locations have been saved. Moving to the next step.",
        });
      } catch (error) {
        console.error('[character-vlog:index] Step 2 continue error:', error);
        toast({
          title: "Save Failed",
          description: error instanceof Error ? error.message : "Failed to save elements. Please try again.",
          variant: "destructive",
        });
        return; // Don't proceed to next step if save failed
      }
    }

    console.log('[character-vlog:index] handleNext - proceeding to navigation logic', {
      activeStep,
      completedSteps,
    });

    // Handle step 3 (scenes) continue - generate scenes and shots if missing
    if (activeStep === "scenes") {
      try {
        toast({
          title: "Generating Scenes & Shots",
          description: "Please wait while we generate your scene breakdown...",
        });

        const response = await fetch(`/api/character-vlog/videos/${videoId}/step/3/continue`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
          },
          credentials: 'include',
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to generate scenes and shots' }));
          throw new Error(error.details || error.error || 'Failed to generate scenes and shots');
        }

        const data = await response.json();
        
        // Update local state with generated scenes and shots
        if (data.scenes) {
          setScenes(data.scenes);
        }
        if (data.shots) {
          setShots(data.shots);
        }

        toast({
          title: "Scenes & Shots Generated",
          description: `Successfully generated ${data.scenes?.length || 0} scenes with shots. Moving to the next step.`,
        });
      } catch (error) {
        toast({
          title: "Generation Failed",
          description: error instanceof Error ? error.message : "Failed to generate scenes and shots. Please try again.",
          variant: "destructive",
        });
        return; // Don't proceed to next step if generation failed
      }
    }

    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps([...completedSteps, activeStep]);
    }
    const steps: VlogStepId[] = ["script", "elements", "scenes", "storyboard", "animatic", "export"];
    const currentIndex = steps.indexOf(activeStep);
    setDirection(1);
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setCanContinue(true); // Enable continue button for the next step
      setActiveStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const steps: VlogStepId[] = ["script", "elements", "scenes", "storyboard", "animatic", "export"];
    const currentIndex = steps.indexOf(activeStep);
    setDirection(-1);
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setActiveStep(steps[prevIndex]);
    }
  };

  const handleStepClick = (stepId: VlogStepId) => {
    const steps: VlogStepId[] = ["script", "elements", "scenes", "storyboard", "animatic", "export"];
    const currentIndex = steps.indexOf(activeStep);
    const targetIndex = steps.indexOf(stepId);
    setDirection(targetIndex > currentIndex ? 1 : -1);
    setActiveStep(stepId);
  };

  const handleReferenceModeSelect = async (mode: "1F" | "2F" | "AI") => {
    if (!workspaceId) {
      toast({
        title: "Error",
        description: "Workspace is required. Please select a workspace.",
        variant: "destructive",
      });
      return;
    }
    
    setCreatingMode(mode);
    setIsCreating(true);
    
    try {
      // Create video in database
      const response = await fetch('/api/character-vlog/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          workspaceId,
          title: videoTitle,
          referenceMode: mode,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create video');
      }
      
      const video = await response.json();
      
      // Update state with new video ID and reference mode
      setVideoId(video.id);
    setReferenceMode(mode);
      
      // Update URL with new video ID (without page reload)
      window.history.replaceState(
        {},
        '',
        `/videos/vlog/${video.id}?workspace=${workspaceId}`
      );
    } catch (error) {
      console.error('Failed to create video:', error);
      toast({
        title: "Error",
        description: "Failed to create video. Please try again.",
        variant: "destructive",
      });
      // Don't set reference mode on error - stay on selector
    } finally {
      setIsCreating(false);
      setCreatingMode(null);
    }
  };
  
  // Show loading state while workspace or video is loading
  if (isWorkspaceLoading || (isVideoLoading && !isNewVideo)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show reference mode selector if no mode is selected yet
  if (!referenceMode) {
    return (
      <CharacterVlogModeSelector 
        onSelectMode={handleReferenceModeSelect}
        title="Narrative Mode"
        description="Choose how to generate your video animations"
        creatingMode={creatingMode}
      />
    );
  }

  // Convert reference mode to narrative mode format for backward compatibility
  // 1F -> "image-reference", 2F -> "start-end", AI -> "start-end" (AI decides per shot)
  const narrativeMode = referenceMode === "1F" ? "image-reference" : "start-end";

  return (
    <CharacterVlogStudioLayout
      currentStep={activeStep}
      completedSteps={completedSteps}
      direction={direction}
      onStepClick={handleStepClick}
      onNext={handleNext}
      onBack={handleBack}
      videoTitle={videoTitle}
      isNextDisabled={false} // Always enable Continue button - validation happens in handleNext
    >
            <CharacterVlogWorkflow 
              activeStep={activeStep}
              videoId={videoId}
              workspaceId={workspaceId || ''}
              narrativeMode={narrativeMode}
              referenceMode={referenceMode}
              script={script}
              aspectRatio={aspectRatio}
              scriptModel={scriptModel}
              videoModel={videoModel}
              narrationStyle={narrationStyle}
              voiceActorId={voiceActorId}
              voiceOverEnabled={voiceOverEnabled}
        theme={theme}
        numberOfScenes={numberOfScenes}
        shotsPerScene={shotsPerScene}
        characterPersonality={characterPersonality}
              scenes={scenes}
              shots={shots}
              shotVersions={shotVersions}
              characters={characters}
        locations={locations}
              referenceImages={referenceImages}
              continuityLocked={continuityLocked}
              continuityGroups={continuityGroups}
              mainCharacter={mainCharacter}
              worldSettings={worldSettings}
              onScriptChange={setScript}
              onAspectRatioChange={setAspectRatio}
              onScriptModelChange={setScriptModel}
              onVideoModelChange={setVideoModel}
              onNarrationStyleChange={setNarrationStyle}
              onVoiceActorChange={setVoiceActorId}
              onVoiceOverToggle={setVoiceOverEnabled}
        onThemeChange={setTheme}
        onNumberOfScenesChange={setNumberOfScenes}
        onShotsPerSceneChange={setShotsPerScene}
        onCharacterPersonalityChange={setCharacterPersonality}
              onUserPromptChange={setUserPrompt}
              onDurationChange={setDuration}
              onGenresChange={setGenres}
              onTonesChange={setTones}
              onLanguageChange={setLanguage}
              onScenesChange={setScenes}
              onShotsChange={setShots}
              onShotVersionsChange={setShotVersions}
              onCharactersChange={setCharacters}
        onLocationsChange={setLocations}
              onReferenceImagesChange={setReferenceImages}
              onContinuityLockedChange={setContinuityLocked}
              onContinuityGroupsChange={setContinuityGroups}
              onMainCharacterChange={setMainCharacter}
              onWorldSettingsChange={setWorldSettings}
              onNext={handleNext}
            />
    </CharacterVlogStudioLayout>
  );
}
