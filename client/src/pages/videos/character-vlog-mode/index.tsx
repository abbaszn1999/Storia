import { useState, useEffect, useRef } from "react";
import { useParams, useSearch } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CharacterVlogStudioLayout, type VlogStepId } from "@/components/character-vlog/studio";
import { CharacterVlogWorkflow, type CharacterVlogWorkflowRef } from "@/components/character-vlog/workflow";
import { CharacterVlogModeSelector } from "@/components/character-vlog/reference-mode-selector";
import { GenerationLoading } from "@/components/character-vlog/generation-loading";
import { getDefaultVideoModel } from "@/constants/video-models";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/workspace-context";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import type { Character, Location, Video } from "@shared/schema";
import type { Scene, Shot, ShotVersion, ReferenceImage } from "@/types/storyboard";

export default function CharacterVlogMode() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const { toast } = useToast();
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace();
  const queryClient = useQueryClient();
  
  // Ref to access workflow methods (like getCurrentVolumes for preview)
  const workflowRef = useRef<CharacterVlogWorkflowRef | null>(null);
  
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
        if (step1.imageModel) setImageModel(step1.imageModel);
        if (step1.voiceOverEnabled !== undefined) setVoiceOverEnabled(step1.voiceOverEnabled);
        if (step1.numberOfScenes !== undefined) setNumberOfScenes(step1.numberOfScenes);
        if (step1.shotsPerScene !== undefined) setShotsPerScene(step1.shotsPerScene);
        
        // Load sound settings
        if (step1.backgroundMusicEnabled !== undefined) setBackgroundMusicEnabled(step1.backgroundMusicEnabled);
        if (step1.voiceoverLanguage !== undefined) setVoiceoverLanguage(step1.voiceoverLanguage);
        if (step1.textOverlayEnabled !== undefined) setTextOverlayEnabled(step1.textOverlayEnabled);
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
      let loadedShotsFromStep3: { [sceneId: string]: Shot[] } = {};
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
              loadedShotsFromStep3 = loadedShots;
              console.log('[character-vlog:index] Setting shots state:', {
                shotsCount: Object.keys(loadedShots).length,
                firstShotSample: Object.values(loadedShots)[0]?.[0],
              });
              setShots(loadedShots);
            }
          }
          
          // Restore continuityGroups from step3Data
          if (step3.continuityGroups && typeof step3.continuityGroups === 'object') {
            // Parse date strings back to Date objects for approvedAt, editedAt, createdAt
            const restoredGroups: { [sceneId: string]: any[] } = {};
            Object.entries(step3.continuityGroups).forEach(([sceneId, groups]) => {
              if (Array.isArray(groups)) {
                restoredGroups[sceneId] = groups.map((group: any) => ({
                  ...group,
                  approvedAt: group.approvedAt ? new Date(group.approvedAt) : null,
                  editedAt: group.editedAt ? new Date(group.editedAt) : null,
                  createdAt: group.createdAt ? new Date(group.createdAt) : new Date(),
                }));
              }
            });
            if (Object.keys(restoredGroups).length > 0) {
              console.log('[character-vlog:index] Restoring continuityGroups:', {
                sceneCount: Object.keys(restoredGroups).length,
                totalGroups: Object.values(restoredGroups).flat().length,
              });
              setContinuityGroups(restoredGroups);
            }
          }
          
          // Restore continuityLocked
          if (step3.continuityLocked !== undefined) {
            setContinuityLocked(step3.continuityLocked);
          }
        }
      }

      // Load step4Data (shot versions with generated prompts)
      if (existingVideo.step4Data && typeof existingVideo.step4Data === 'object') {
        const step4 = existingVideo.step4Data as any;
        
        if (step4.shots && typeof step4.shots === 'object') {
          console.log('[character-vlog:index] Loading prompts from step4Data.shots:', {
            shotsCount: Object.keys(step4.shots).length,
            firstShotSample: Object.values(step4.shots)[0],
          });
          
          // Convert step4Data.shots to shotVersions structure
          // Use loadedShotsFromStep3 if available, otherwise use current shots state
          const shotsToUpdate = Object.keys(loadedShotsFromStep3).length > 0 ? loadedShotsFromStep3 : shots;
          const loadedShotVersions: { [shotId: string]: ShotVersion[] } = {};
          const updatedShots = { ...shotsToUpdate };
          const inheritanceMap: { [shotId: string]: boolean } = {};
          
          // Load existing shotVersions from database (contains image URLs)
          const existingShotVersions = step4.shotVersions || {};
          
          console.log('[character-vlog:index] Loading shotVersions from database:', {
            hasShotVersions: !!step4.shotVersions,
            shotVersionsCount: Object.keys(existingShotVersions).length,
            shotsCount: Object.keys(step4.shots).length,
            sampleShotVersion: Object.values(existingShotVersions)[0],
          });
          
          Object.entries(step4.shots).forEach(([shotId, promptData]: [string, any]) => {
            // Store inheritance flag
            inheritanceMap[shotId] = promptData.isInherited === true;
            
            // Check if we have existing versions with image URLs in database
            const savedVersions = existingShotVersions[shotId];
            if (savedVersions && Array.isArray(savedVersions) && savedVersions.length > 0) {
              // Merge saved versions (contain image URLs) with prompt data (contains prompts)
              console.log(`[character-vlog:index] Loading existing version with images for ${shotId}:`, {
                versionCount: savedVersions.length,
                latestVersion: savedVersions[savedVersions.length - 1],
              });
              
              // The latest version should have the prompts merged in
              loadedShotVersions[shotId] = savedVersions.map((v: any) => ({
                ...v,
                // Merge prompts from step4Data.shots (the source of truth for prompts)
                imagePrompt: promptData.imagePrompts?.single || v.imagePrompt || '',
                startFramePrompt: promptData.imagePrompts?.start || v.startFramePrompt || null,
                endFramePrompt: promptData.imagePrompts?.end || v.endFramePrompt || null,
                videoPrompt: promptData.videoPrompt || v.videoPrompt || '',
                negativePrompt: promptData.negativePrompt || v.negativePrompt || null,
                status: v.status || 'pending',
                needsRerender: v.needsRerender || false,
                createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
              }));
              
              // Use the latest version's ID for currentVersionId
              const latestVersion = savedVersions[savedVersions.length - 1];
              Object.keys(updatedShots).forEach((sceneId) => {
                const sceneShots = updatedShots[sceneId] || [];
                const shotIndex = sceneShots.findIndex(s => s.id === shotId);
                if (shotIndex !== -1) {
                  const updatedSceneShots = [...sceneShots];
                  updatedSceneShots[shotIndex] = {
                    ...updatedSceneShots[shotIndex],
                    currentVersionId: latestVersion.id,
                  };
                  updatedShots[sceneId] = updatedSceneShots;
                }
              });
            } else {
              // Create a version from prompt data (no images yet) for UI to display
              // Use server's version ID format: version-{shotId}-{timestamp}
              const versionId = `version-${shotId}-${Date.now()}`;
              const version: ShotVersion = {
                id: versionId,
                shotId: shotId,
                versionNumber: 1,
                imagePrompt: promptData.imagePrompts?.single || '',
                startFramePrompt: promptData.imagePrompts?.start || null,
                endFramePrompt: promptData.imagePrompts?.end || null,
                videoPrompt: promptData.videoPrompt || '',
                negativePrompt: promptData.negativePrompt || null,
                status: 'pending',
                needsRerender: false,
                createdAt: new Date(),
              };
              
              loadedShotVersions[shotId] = [version];
              
              console.log(`[character-vlog:index] Created client version for ${shotId} with prompts (no images yet)`);
              
              // Update the shot's currentVersionId to point to this version
              Object.keys(updatedShots).forEach((sceneId) => {
                const sceneShots = updatedShots[sceneId] || [];
                const shotIndex = sceneShots.findIndex(s => s.id === shotId);
                if (shotIndex !== -1) {
                  const updatedSceneShots = [...sceneShots];
                  updatedSceneShots[shotIndex] = {
                    ...updatedSceneShots[shotIndex],
                    currentVersionId: versionId,
                  };
                  updatedShots[sceneId] = updatedSceneShots;
                }
              });
            }
          });
          
          if (Object.keys(loadedShotVersions).length > 0) {
            console.log('[character-vlog:index] Loaded shotVersions:', {
              count: Object.keys(loadedShotVersions).length,
              sample: Object.values(loadedShotVersions)[0],
              inheritedCount: Object.values(inheritanceMap).filter(v => v).length,
            });
            setShotVersions(loadedShotVersions);
            setShotInheritanceMap(inheritanceMap);  // Set inheritance map
            // Update shots with currentVersionId
            setShots(updatedShots);
            console.log('[character-vlog:index] Updated shots with currentVersionId and inheritance:', {
              updatedShotsCount: Object.keys(updatedShots).length,
              inheritanceMapCount: Object.keys(inheritanceMap).length,
            });
            
            // Mark storyboard step as completed since prompts are already generated
            setCompletedSteps(prev => {
              if (!prev.includes('storyboard')) {
                console.log('[character-vlog:index] Marking storyboard step as completed (prompts already exist)');
                return [...prev, 'storyboard'];
              }
              return prev;
            });
          }
        }
      }
      
      if (existingVideo.title) {
        setVideoTitle(existingVideo.title);
      }
      
      // Load step5Data (Sound)
      if (existingVideo.step5Data && typeof existingVideo.step5Data === 'object') {
        const step5 = existingVideo.step5Data as any;
        if (step5.voiceoverScript) setVoiceoverScript(step5.voiceoverScript);
        if (step5.voiceoverAudioUrl) setVoiceoverAudioUrl(step5.voiceoverAudioUrl);
        if (step5.voiceoverDuration) setVoiceoverDuration(step5.voiceoverDuration);
        if (step5.voiceId) setSelectedVoiceId(step5.voiceId);
        if (step5.soundEffects) setSoundEffects(step5.soundEffects);
        if (step5.generatedMusicUrl) setGeneratedMusicUrl(step5.generatedMusicUrl);
        if (step5.generatedMusicDuration) setGeneratedMusicDuration(step5.generatedMusicDuration);
      }
      
      if (existingVideo.currentStep) {
        const stepMap: Record<number, VlogStepId> = {
          1: 'script',
          2: 'elements',
          3: 'scenes',
          4: 'storyboard',
          5: 'animatic',
          6: 'preview',
          7: 'export',
        };
        const stepId = stepMap[existingVideo.currentStep];
        if (stepId) {
          setActiveStep(stepId);
          // Mark all previous steps as completed when loading an existing video
          // This ensures users can navigate back but not forward to uncompleted steps
          const steps: VlogStepId[] = ["script", "elements", "scenes", "storyboard", "animatic", "preview", "export"];
          const currentIndex = steps.indexOf(stepId);
          setHighestStepReached(currentIndex); // Track highest step reached
          const previousSteps = steps.slice(0, currentIndex);
          setCompletedSteps(previousSteps);
        }
      }
    }
  }, [existingVideo]);

  const [activeStep, setActiveStep] = useState<VlogStepId>("script");
  const [completedSteps, setCompletedSteps] = useState<VlogStepId[]>([]);
  const [highestStepReached, setHighestStepReached] = useState<number>(0); // Track furthest step visited
  const [direction, setDirection] = useState(1);
  const [canContinue, setCanContinue] = useState(true); // Enable Continue button by default for all steps
  const [script, setScript] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [scriptModel, setScriptModel] = useState("gpt-4o");
  const [videoModel, setVideoModel] = useState(getDefaultVideoModel().value);
  const [imageModel, setImageModel] = useState("nano-banana");
  const [narrationStyle, setNarrationStyle] = useState<"third-person" | "first-person">("first-person");
  const [voiceOverEnabled, setVoiceOverEnabled] = useState(true);
  const [theme, setTheme] = useState("urban");
  const [numberOfScenes, setNumberOfScenes] = useState<number | 'auto'>('auto');
  const [shotsPerScene, setShotsPerScene] = useState<number | 'auto'>('auto');
  
  // Sound settings (Step 1)
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(false);
  const [voiceoverLanguage, setVoiceoverLanguage] = useState<'en' | 'ar'>('en');
  const [textOverlayEnabled, setTextOverlayEnabled] = useState(false);
  const [characterPersonality, setCharacterPersonality] = useState("energetic");
  
  // Step 5 Sound data
  const [voiceoverScript, setVoiceoverScript] = useState<string>("");
  const [voiceoverAudioUrl, setVoiceoverAudioUrl] = useState<string | undefined>();
  const [voiceoverDuration, setVoiceoverDuration] = useState<number | undefined>();
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | undefined>();
  const [soundEffects, setSoundEffects] = useState<Record<string, { prompt?: string; audioUrl?: string; duration?: number; isGenerating?: boolean }>>({});
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | undefined>();
  const [generatedMusicDuration, setGeneratedMusicDuration] = useState<number | undefined>();
  const [userPrompt, setUserPrompt] = useState("");
  const [duration, setDuration] = useState("60");
  const [genres, setGenres] = useState<string[]>([]);
  const [tones, setTones] = useState<string[]>([]);
  const [language, setLanguage] = useState("English");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [shots, setShots] = useState<{ [sceneId: string]: Shot[] }>({});
  const [shotVersions, setShotVersions] = useState<{ [shotId: string]: ShotVersion[] }>({});
  const [shotInheritanceMap, setShotInheritanceMap] = useState<{ [shotId: string]: boolean }>({});  // Track which shots have inherited prompts
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [continuityLocked, setContinuityLocked] = useState(false);
  const [continuityGroups, setContinuityGroups] = useState<{ [sceneId: string]: any[] }>({});
  const [mainCharacter, setMainCharacter] = useState<Character | null>(null);
  
  // Prompt generation progress state
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  
  // Scene generation state (from scene-breakdown component)
  const [isGeneratingScenes, setIsGeneratingScenes] = useState(false);

  // Auto-mark storyboard as completed if prompts exist (shotVersions has data)
  useEffect(() => {
    const hasPrompts = Object.keys(shotVersions).length > 0;
    if (hasPrompts) {
      setCompletedSteps(prev => {
        if (!prev.includes('storyboard')) {
          console.log('[character-vlog:index] Auto-marking storyboard as completed (prompts detected)');
          return [...prev, 'storyboard'];
        }
        return prev;
      });
    }
  }, [shotVersions]);

  // Refetch video data when navigating to storyboard tab
  // This ensures we always have fresh data from the database when switching tabs
  useEffect(() => {
    if (activeStep === 'storyboard' && videoId && !isNewVideo) {
      console.log('[character-vlog:index] Navigated to storyboard - refetching video data from database');
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}`] });
    }
  }, [activeStep, videoId, isNewVideo, queryClient]);
  const [promptGenerationProgress, setPromptGenerationProgress] = useState({
    currentScene: 0,
    totalScenes: 0,
    currentSceneName: "",
    processedShots: 0,
    totalShots: 0,
  });
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

  // Save function for continuityGroups and continuityLocked
  // Use a ref to always get the latest state
  const continuityGroupsRef = useRef(continuityGroups);
  const continuityLockedRef = useRef(continuityLocked);
  
  useEffect(() => {
    continuityGroupsRef.current = continuityGroups;
  }, [continuityGroups]);
  
  useEffect(() => {
    continuityLockedRef.current = continuityLocked;
  }, [continuityLocked]);

  const saveContinuityData = async (groupsToSave?: { [sceneId: string]: any[] }, locked?: boolean) => {
    // Use provided values or latest from refs
    const groups = groupsToSave ?? continuityGroupsRef.current;
    const isLocked = locked ?? continuityLockedRef.current;
    
    if (videoId === 'new') {
      console.warn('[character-vlog:index] Cannot save: videoId is "new"');
      return;
    }

    try {
      // Convert scenes to the format expected by the API
      const scenesToSave = scenes.map(scene => ({
        id: scene.id,
        name: scene.title,
        description: scene.description || '',
        duration: scene.duration || 60,
        sceneNumber: scene.sceneNumber,
      }));

      // Convert shots to the format expected by the API
      const shotsToSave: Record<string, any[]> = {};
      Object.entries(shots).forEach(([sceneId, sceneShots]) => {
        shotsToSave[sceneId] = sceneShots.map(shot => ({
          id: shot.id,
          sceneId: shot.sceneId,
          shotNumber: shot.shotNumber,
          description: shot.description || '',
          cameraMovement: shot.cameraMovement,
          shotType: shot.shotType,
          duration: shot.duration,
          createdAt: shot.createdAt,
          updatedAt: shot.updatedAt,
        }));
      });

      // Serialize continuity groups (ensure dates are ISO strings)
      const serializedGroups: { [sceneId: string]: any[] } = {};
      Object.entries(groups).forEach(([sceneId, groups]) => {
        if (Array.isArray(groups) && groups.length > 0) {
          serializedGroups[sceneId] = groups.map(group => ({
            ...group,
            status: group.status || "approved",
            approvedAt: group.approvedAt instanceof Date ? group.approvedAt.toISOString() : (group.approvedAt || null),
            editedAt: group.editedAt instanceof Date ? group.editedAt.toISOString() : (group.editedAt || null),
            createdAt: group.createdAt instanceof Date ? group.createdAt.toISOString() : (group.createdAt || new Date().toISOString()),
          }));
        }
      });

        console.log('[character-vlog:index] Saving continuity data:', {
        videoId,
        sceneCount: Object.keys(serializedGroups).length,
        totalGroups: Object.values(serializedGroups).flat().length,
        continuityLocked: isLocked,
        groupsPreview: Object.entries(serializedGroups).map(([sceneId, gs]) => ({
          sceneId,
          count: gs.length,
          statuses: gs.map((g: any) => g.status),
        })),
      });

      const response = await fetch(`/api/character-vlog/videos/${videoId}/step/3/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scenes: scenesToSave,
          shots: shotsToSave,
          continuityGroups: serializedGroups,
          continuityLocked: isLocked,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Failed to save: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('[character-vlog:index] Continuity groups saved successfully:', {
        savedGroups: Object.keys(result.step3Data?.continuityGroups || {}).length,
        savedLocked: result.step3Data?.continuityLocked,
      });
    } catch (error) {
      console.error('[character-vlog:index] Failed to save continuity groups:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save continuity data",
        variant: "destructive",
      });
    }
  };

  // Debounced save for continuityGroups and continuityLocked (for auto-save on changes)
  useEffect(() => {
    if (videoId === 'new') {
      return;
    }

    // Only auto-save if we have continuity groups or continuityLocked is true
    if (Object.keys(continuityGroups).length === 0 && !continuityLocked) {
      return;
    }

    const timeoutId = setTimeout(() => {
      saveContinuityData(continuityGroups, continuityLocked);
    }, 1000); // 1 second debounce for auto-save

    return () => clearTimeout(timeoutId);
  }, [videoId, continuityGroups, continuityLocked, scenes, shots]);

  // Immediate save when continuityLocked changes to true (user clicked "Lock & Continue")
  useEffect(() => {
    if (videoId === 'new') {
      return;
    }

    // Only save immediately when locked becomes true (not on initial load)
    if (continuityLocked) {
      // Use a small delay to ensure continuityGroups state is updated from child
      const timeoutId = setTimeout(() => {
        // Use refs to get latest state
        const latestGroups = continuityGroupsRef.current;
        const latestLocked = continuityLockedRef.current;
        console.log('[character-vlog:index] Continuity locked - saving immediately with groups:', {
          groupCount: Object.keys(latestGroups).length,
          totalGroups: Object.values(latestGroups).flat().length,
          locked: latestLocked,
        });
        saveContinuityData(latestGroups, latestLocked);
      }, 200); // Small delay to ensure state sync

      return () => clearTimeout(timeoutId);
    }
  }, [continuityLocked]); // Only trigger on continuityLocked change

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
            imageModel,
            aspectRatio,
            duration,
            genres,
            tones,
            language,
            voiceOverEnabled,
            // Sound settings
            backgroundMusicEnabled,
            voiceoverLanguage,
            textOverlayEnabled,
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
      console.log('[character-vlog:frontend] Step 3 Continue clicked:', {
        videoId,
        workspaceId,
        scenesCount: scenes.length,
        shotsCount: Object.keys(shots).length,
      });

      // Navigate to Step 4 immediately and show progress modal
      const steps: VlogStepId[] = ["script", "elements", "scenes", "storyboard", "animatic", "preview", "export"];
      const nextIndex = steps.indexOf(activeStep) + 1;
      if (nextIndex < steps.length) {
        const nextStep = steps[nextIndex];
        setActiveStep(nextStep);
        setDirection(1);
        // Mark current step (scenes) as completed
        if (!completedSteps.includes(activeStep)) {
          setCompletedSteps([...completedSteps, activeStep]);
        }
        // Mark storyboard step as accessible (will be marked as completed after prompts are generated)
        // This allows users to click the storyboard tab in the footer navigation
        if (!completedSteps.includes(nextStep)) {
          setCompletedSteps(prev => [...prev, nextStep]);
        }
      }

      // Start prompt generation in background
      (async () => {
        try {
          // Disable Continue button and show progress modal
          setIsGeneratingPrompts(true);
          setCanContinue(false);

          toast({
            title: "Generating Scenes & Shots",
            description: "Please wait while we generate your scene breakdown...",
          });

          console.log('[character-vlog:frontend] Calling step/3/continue endpoint...');
          const response = await fetch(`/api/character-vlog/videos/${videoId}/step/3/continue`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
            },
            credentials: 'include',
          });

          console.log('[character-vlog:frontend] Step/3/continue response status:', response.status);

          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to generate scenes and shots' }));
            console.error('[character-vlog:frontend] Step/3/continue failed:', error);
            throw new Error(error.details || error.error || 'Failed to generate scenes and shots');
          }

          const data = await response.json();
          console.log('[character-vlog:frontend] Step/3/continue success:', {
            scenesCount: data.scenes?.length || 0,
            shotsKeys: data.shots ? Object.keys(data.shots).length : 0,
            continuityGroupsKeys: data.continuityGroups ? Object.keys(data.continuityGroups).length : 0,
          });
          
          // Update local state with generated scenes and shots
          let updatedScenes = scenes;
          let updatedShots = shots;
          if (data.scenes) {
            updatedScenes = data.scenes;
            setScenes(data.scenes);
          }
          if (data.shots) {
            updatedShots = data.shots;
            setShots(data.shots);
          }
          // Update continuity groups from response
          if (data.continuityGroups) {
            setContinuityGroups(data.continuityGroups);
            console.log('[character-vlog:frontend] Updated continuity groups:', {
              sceneIds: Object.keys(data.continuityGroups),
              totalGroups: Object.values(data.continuityGroups).flat().length,
            });
          }

          // Now generate prompts for ALL scenes
          const scenesToProcess = updatedScenes || scenes;
          console.log('[character-vlog:frontend] Starting prompt generation:', {
            scenesToProcessCount: scenesToProcess.length,
            scenesToProcessIds: scenesToProcess.map(s => s.id),
          });

          if (scenesToProcess.length === 0) {
            console.warn('[character-vlog:frontend] No scenes to process!');
            setIsGeneratingPrompts(false);
            setCanContinue(true);
            toast({
              title: "No Scenes Found",
              description: "Please generate scenes first.",
              variant: "destructive",
            });
            return;
          }

          // Calculate total shots for progress tracking
          const totalShotsCount = scenesToProcess.reduce((sum, scene) => {
            const sceneShots = updatedShots[scene.id] || [];
            return sum + sceneShots.length;
          }, 0);

          // Initialize progress
          setPromptGenerationProgress({
            currentScene: 0,
            totalScenes: scenesToProcess.length,
            currentSceneName: "",
            processedShots: 0,
            totalShots: totalShotsCount,
          });

          // Generate prompts for each scene sequentially
          // Use functional updates to ensure we have the latest state
          let updatedShotVersions: { [shotId: string]: ShotVersion[] } = {};
          let updatedInheritanceMap: { [shotId: string]: boolean } = {};  // Track inheritance
          let processedScenes = 0;
          let totalShots = 0;

          for (const scene of scenesToProcess) {
            const sceneName = scene.title || `Scene ${processedScenes + 1}`;
            console.log(`[character-vlog:frontend] Processing scene ${processedScenes + 1}/${scenesToProcess.length}:`, {
              sceneId: scene.id,
              sceneName,
            });

            // Update progress for current scene
            setPromptGenerationProgress({
              currentScene: processedScenes + 1,
              totalScenes: scenesToProcess.length,
              currentSceneName: sceneName,
              processedShots: totalShots,
              totalShots: totalShotsCount,
            });

            try {
              console.log('[character-vlog:frontend] Calling generate-prompts endpoint:', {
                videoId,
                sceneId: scene.id,
              });

              const promptsResponse = await fetch('/api/character-vlog/storyboard/generate-prompts', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
                },
                credentials: 'include',
                body: JSON.stringify({
                  videoId,
                  sceneId: scene.id,
                }),
              });

              console.log('[character-vlog:frontend] Generate-prompts response status:', promptsResponse.status);

              if (!promptsResponse.ok) {
                const error = await promptsResponse.json().catch(() => ({ error: 'Failed to generate prompts' }));
                console.error(`[character-vlog:frontend] Failed to generate prompts for scene ${scene.id}:`, error);
                // Continue with other scenes even if one fails
                processedScenes++;
                continue;
              }

              const promptsData = await promptsResponse.json();
              console.log(`[character-vlog:frontend] Generated prompts for scene ${scene.id}:`, {
                shotsCount: promptsData.shots?.length || 0,
                cost: promptsData.cost,
                responseStructure: {
                  hasShots: !!promptsData.shots,
                  isArray: Array.isArray(promptsData.shots),
                  firstShot: promptsData.shots?.[0],
                },
              });

              // Validate response structure
              if (!promptsData.shots || !Array.isArray(promptsData.shots)) {
                console.error(`[character-vlog:frontend] Invalid response structure for scene ${scene.id}:`, {
                  response: promptsData,
                  expectedShotsArray: true,
                  actualType: typeof promptsData.shots,
                  isArray: Array.isArray(promptsData.shots),
                });
                processedScenes++;
                continue;
              }

              if (promptsData.shots.length === 0) {
                console.warn(`[character-vlog:frontend] No shots in response for scene ${scene.id}`);
                processedScenes++;
                continue;
              }

              // Get current scene shots (use latest from updatedShots)
              let sceneShots = updatedShots[scene.id] || [];
              console.log(`[character-vlog:frontend] Scene shots found:`, {
                sceneId: scene.id,
                sceneShotsCount: sceneShots.length,
                shotIds: sceneShots.map(s => s.id),
                generatedShotIds: promptsData.shots.map((s: any) => s.shotId),
              });
              
              // Update shot versions with generated prompts
              for (const generatedShot of promptsData.shots) {
                // Validate generatedShot structure
                if (!generatedShot.shotId) {
                  console.error(`[character-vlog:frontend] Generated shot missing shotId:`, generatedShot);
                  continue;
                }
                // Re-fetch sceneShots in case it was updated in previous iteration
                sceneShots = updatedShots[scene.id] || [];
                const shot = sceneShots.find(s => s.id === generatedShot.shotId);
                if (!shot) {
                  console.warn(`[character-vlog:frontend] Shot ${generatedShot.shotId} not found in scene ${scene.id}`, {
                    availableShotIds: sceneShots.map(s => s.id),
                  });
                  continue;
                }

                // Use the isInherited value from the server (already calculated during prompt generation)
                const isInherited = generatedShot.isInherited === true;

                console.log(`[character-vlog:frontend] Shot ${shot.id} inheritance from server:`, {
                  isInherited,
                  hasIsInheritedField: 'isInherited' in generatedShot,
                  serverValue: generatedShot.isInherited,
                });

                // Create new shot version with prompts - use unique ID with timestamp and random
                const versionId = `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${shot.id}`;
                const newVersion: ShotVersion = {
                  id: versionId,
                  shotId: shot.id,
                  versionNumber: 1, // Always version 1 for newly generated prompts
                  imagePrompt: generatedShot.imagePrompts.single || generatedShot.imagePrompts.start || '',
                  startFramePrompt: generatedShot.imagePrompts.start || null,
                  endFramePrompt: generatedShot.imagePrompts.end || null,
                  videoPrompt: generatedShot.videoPrompt,
                  negativePrompt: generatedShot.negativePrompt || null,
                  imageUrl: null,
                  startFrameUrl: null,
                  endFrameUrl: null,
                  videoUrl: null,
                  videoDuration: shot.duration || 5,
                  status: 'pending',
                  needsRerender: false,
                  createdAt: new Date(),
                };

                // Store version with isInherited flag
                updatedShotVersions[shot.id] = [newVersion];
                
                // Track inheritance status for this shot (use server's value, don't overwrite)
                updatedInheritanceMap[shot.id] = isInherited;
                
                console.log(`[character-vlog:frontend] Created version for shot ${shot.id}:`, {
                  versionId,
                  hasImagePrompt: !!newVersion.imagePrompt,
                  hasStartPrompt: !!newVersion.startFramePrompt,
                  hasEndPrompt: !!newVersion.endFramePrompt,
                  hasVideoPrompt: !!newVersion.videoPrompt,
                  isInherited,
                  startFramePromptPreview: newVersion.startFramePrompt?.substring(0, 100),
                });
                
                // Update shot's currentVersionId - create new object references
                const shotIndexForUpdate = sceneShots.findIndex(s => s.id === shot.id);
                if (shotIndexForUpdate !== -1) {
                  // Create a new array with updated shot
                  const updatedSceneShots = sceneShots.map((s, idx) => 
                    idx === shotIndexForUpdate 
                      ? { ...s, currentVersionId: versionId }
                      : { ...s } // Create new object for all shots to ensure React detects changes
                  );
                  // Create new object reference for the scene
                  updatedShots[scene.id] = updatedSceneShots;
                  console.log(`[character-vlog:frontend] Updated shot ${shot.id} with currentVersionId: ${versionId}`, {
                    shotCurrentVersionId: updatedSceneShots[shotIndexForUpdate].currentVersionId,
                  });
                } else {
                  console.warn(`[character-vlog:frontend] Shot ${shot.id} not found in scene ${scene.id} shots array`);
                }
                
                totalShots++;
                
                // Update progress
                setPromptGenerationProgress({
                  currentScene: processedScenes + 1,
                  totalScenes: scenesToProcess.length,
                  currentSceneName: sceneName,
                  processedShots: totalShots,
                  totalShots: totalShotsCount,
                });
              }

              processedScenes++;
            } catch (error) {
              console.error(`[character-vlog:frontend] Error generating prompts for scene ${scene.id}:`, error);
              processedScenes++;
              // Continue with other scenes even if one fails
            }
          }

          console.log('[character-vlog:frontend] All scenes processed:', {
            processedScenes,
            totalShots,
            shotVersionsKeys: Object.keys(updatedShotVersions).length,
            updatedShotsKeys: Object.keys(updatedShots).length,
          });

          // Verify data integrity before updating state
          const verificationErrors: string[] = [];
          Object.keys(updatedShotVersions).forEach(shotId => {
            const version = updatedShotVersions[shotId]?.[0];
            if (!version) {
              verificationErrors.push(`Shot ${shotId} has no version`);
              return;
            }
            
            // Check if shot has currentVersionId set
            let foundInShots = false;
            Object.values(updatedShots).forEach(sceneShots => {
              const shot = sceneShots.find(s => s.id === shotId);
              if (shot && shot.currentVersionId === version.id) {
                foundInShots = true;
              }
            });
            
            if (!foundInShots) {
              verificationErrors.push(`Shot ${shotId} version ${version.id} not linked via currentVersionId`);
            }
          });
          
          if (verificationErrors.length > 0) {
            console.error('[character-vlog:frontend] Data integrity errors:', verificationErrors);
          } else {
            console.log('[character-vlog:frontend] Data integrity check passed - all versions linked to shots');
          }

          // Update state with functional updates to ensure we merge correctly
          setShotVersions(prev => {
            const merged = { ...prev, ...updatedShotVersions };
            console.log('[character-vlog:frontend] Merged shotVersions:', {
              prevKeys: Object.keys(prev).length,
              newKeys: Object.keys(updatedShotVersions).length,
              mergedKeys: Object.keys(merged).length,
              sampleVersion: Object.values(merged)[0]?.[0],
              sampleVersionId: Object.values(merged)[0]?.[0]?.id,
              sampleVersionShotId: Object.values(merged)[0]?.[0]?.shotId,
            });
            return merged;
          });
          
          // Update inheritance map
          setShotInheritanceMap(prev => {
            const merged = { ...prev, ...updatedInheritanceMap };
            const inheritedCount = Object.values(merged).filter(v => v).length;
            console.log('[character-vlog:frontend] Merged inheritance map:', {
              prevKeys: Object.keys(prev).length,
              newKeys: Object.keys(updatedInheritanceMap).length,
              mergedKeys: Object.keys(merged).length,
              inheritedCount,
            });
            return merged;
          });
          
          // Update shots - create a completely new object to ensure React detects the change
          setShots(prev => {
            // Start with previous state to preserve all scenes
            const merged: { [sceneId: string]: Shot[] } = {};
            
            // First, copy all previous scenes (preserve unchanged scenes)
            Object.keys(prev).forEach(sceneId => {
              merged[sceneId] = [...prev[sceneId]]; // Create new array reference
            });
            
            // Then, update with modified scenes (overwrite with updated shots)
            Object.keys(updatedShots).forEach(sceneId => {
              merged[sceneId] = [...updatedShots[sceneId]]; // Create new array reference
            });
            
            // Verify shots have currentVersionId
            const shotsWithVersions = Object.values(merged).flat().filter(s => s.currentVersionId).length;
            const totalShotsCount = Object.values(merged).flat().length;
            
            // Log detailed info for first scene
            const firstSceneId = Object.keys(merged)[0];
            const firstSceneShots = merged[firstSceneId] || [];
            
            console.log('[character-vlog:frontend] Merged shots:', {
              prevKeys: Object.keys(prev).length,
              updatedKeys: Object.keys(updatedShots).length,
              mergedKeys: Object.keys(merged).length,
              totalShotsCount,
              shotsWithVersions,
              firstSceneId,
              firstSceneShotsCount: firstSceneShots.length,
              firstSceneShotsWithVersions: firstSceneShots.filter(s => s.currentVersionId).length,
              sampleShot: firstSceneShots[0],
              sampleShotCurrentVersionId: firstSceneShots[0]?.currentVersionId,
              sampleShotId: firstSceneShots[0]?.id,
            });
            
            // Log all shots with their currentVersionId status
            Object.entries(merged).forEach(([sceneId, sceneShots]) => {
              const withVersions = sceneShots.filter(s => s.currentVersionId).length;
              if (withVersions < sceneShots.length) {
                console.log(`[character-vlog:frontend] Scene ${sceneId}: ${withVersions}/${sceneShots.length} shots have currentVersionId`, {
                  shots: sceneShots.map(s => ({
                    id: s.id,
                    currentVersionId: s.currentVersionId,
                    hasVersionInState: !!updatedShotVersions[s.id],
                  })),
                });
              }
            });
            
            return merged;
          });

          // Use setTimeout to ensure state updates are processed before hiding modal
          setTimeout(() => {
            // Hide progress modal and re-enable Continue button
            setIsGeneratingPrompts(false);
            setCanContinue(true);
            
            // Mark storyboard step as completed since prompts are now generated
            setCompletedSteps(prev => {
              if (!prev.includes('storyboard')) {
                console.log('[character-vlog:frontend] Marking storyboard step as completed after prompt generation');
                return [...prev, 'storyboard'];
              }
              return prev;
            });
            
            console.log('[character-vlog:frontend] State updates complete, modal hidden');
          }, 100);

          toast({
            title: "All Prompts Generated",
            description: `Successfully generated prompts for ${totalShots} shot(s) across ${processedScenes} scene(s).`,
          });

          console.log('[character-vlog:frontend] Shot versions and shots updated in state');

          // Save updated shots with currentVersionId to database
          // This is critical - without this, when tabs are switched the currentVersionId is lost
          try {
            console.log('[character-vlog:frontend] Saving shots with currentVersionId to database...', {
              shotsToSave: Object.keys(updatedShots).length,
              totalShots: Object.values(updatedShots).flat().length,
              shotsWithVersionId: Object.values(updatedShots).flat().filter(s => s.currentVersionId).length,
            });
            
            const saveResponse = await fetch(`/api/character-vlog/videos/${videoId}/step/3/settings`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
              },
              credentials: 'include',
              body: JSON.stringify({
                shots: updatedShots, // Contains all shots with updated currentVersionId
              }),
            });

            if (!saveResponse.ok) {
              const errorText = await saveResponse.text();
              console.error('[character-vlog:frontend] Failed to save shots with currentVersionId:', errorText);
            } else {
              const saveResult = await saveResponse.json();
              console.log('[character-vlog:frontend] Successfully saved shots with currentVersionId to database:', {
                success: saveResult.success,
                savedShots: Object.values(updatedShots).flat().length,
              });
            }
          } catch (saveError) {
            console.error('[character-vlog:frontend] Error saving shots with currentVersionId:', saveError);
            // Don't fail the entire operation if save fails - shots are still in state
          }
        } catch (error) {
          console.error('[character-vlog:frontend] Step 3 continue failed with error:', error);
          setIsGeneratingPrompts(false);
          setCanContinue(true);
          toast({
            title: "Generation Failed",
            description: error instanceof Error ? error.message : "Failed to generate scenes and shots. Please try again.",
            variant: "destructive",
          });
        }
      })();

      // Return early - don't proceed with normal navigation since we already navigated
      return;
    }

    // Handle preview step - save volumes and trigger export when continuing to export
    if (activeStep === "preview") {
      try {
        const volumes = workflowRef.current?.getCurrentVolumes?.();
        if (videoId && videoId !== "new") {
          // Save volumes first
          if (volumes) {
            const saveResponse = await fetch(`/api/character-vlog/videos/${videoId}/preview/save-volumes`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
              },
              credentials: 'include',
              body: JSON.stringify({ volumes }),
            });

            if (saveResponse.ok) {
              console.log('[character-vlog:index] Volumes saved before export:', volumes);
            } else {
              console.warn('[character-vlog:index] Failed to save volumes, continuing anyway');
            }
          }
          
          // Trigger continue-to-7 to initialize export and create step7Data
          console.log('[character-vlog:index] Triggering continue-to-7...');
          const continueResponse = await fetch(`/api/character-vlog/videos/${videoId}/step/6/continue-to-7`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
            },
            credentials: 'include',
            body: JSON.stringify({ volumes }),
          });

          if (continueResponse.ok) {
            console.log('[character-vlog:index] Successfully transitioned to export phase');
          } else {
            const errorData = await continueResponse.json().catch(() => ({}));
            console.warn('[character-vlog:index] Failed to initialize export:', errorData.error);
            toast({
              title: "Export Warning",
              description: "Could not fully initialize export. Please try again if issues occur.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('[character-vlog:index] Error during preview to export transition:', error);
        // Continue anyway - the export tab will handle errors gracefully
      }
    }

    console.log('[character-vlog:frontend] Proceeding to next step navigation:', {
      activeStep,
      completedSteps,
    });

    if (!completedSteps.includes(activeStep)) {
      console.log('[character-vlog:frontend] Marking step as completed:', activeStep);
      setCompletedSteps([...completedSteps, activeStep]);
    }
    const steps: VlogStepId[] = ["script", "elements", "scenes", "storyboard", "animatic", "preview", "export"];
    const currentIndex = steps.indexOf(activeStep);
    const nextIndex = currentIndex + 1;
    
    console.log('[character-vlog:frontend] Navigation details:', {
      currentIndex,
      nextIndex,
      currentStep: steps[currentIndex],
      nextStep: steps[nextIndex],
    });

    setDirection(1);
    if (nextIndex < steps.length) {
      console.log('[character-vlog:frontend] Navigating to step:', steps[nextIndex]);
      setCanContinue(true); // Enable continue button for the next step
      setActiveStep(steps[nextIndex]);
      // Update highest step reached
      if (nextIndex > highestStepReached) {
        setHighestStepReached(nextIndex);
      }
    } else {
      console.warn('[character-vlog:frontend] No next step available, at final step');
    }
  };

  const handleBack = () => {
    const steps: VlogStepId[] = ["script", "elements", "scenes", "storyboard", "animatic", "preview", "export"];
    const currentIndex = steps.indexOf(activeStep);
    setDirection(-1);
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setActiveStep(steps[prevIndex]);
    }
  };

  const handleStepClick = (stepId: VlogStepId) => {
    const steps: VlogStepId[] = ["script", "elements", "scenes", "storyboard", "animatic", "preview", "export"];
    const currentIndex = steps.indexOf(activeStep);
    const targetIndex = steps.indexOf(stepId);
    
    // Allow navigation to:
    // 1. Current step
    // 2. Any step up to the highest step reached
    // 3. Completed steps
    // 4. Storyboard if prompts exist
    const hasPrompts = Object.keys(shotVersions).length > 0;
    const isStoryboardWithPrompts = stepId === 'storyboard' && hasPrompts;
    const isWithinReached = targetIndex <= highestStepReached;
    const isCompletedStep = completedSteps.includes(stepId);
    
    // Only block navigation to steps beyond what's been reached
    if (!isWithinReached && !isCompletedStep && !isStoryboardWithPrompts) {
      console.warn('[character-vlog] Cannot navigate to unreached step:', stepId);
      return;
    }
    
    // If navigating to storyboard with prompts, ensure it's marked as completed
    if (isStoryboardWithPrompts && !completedSteps.includes('storyboard')) {
      setCompletedSteps(prev => [...prev, 'storyboard']);
    }
    
    console.log('[character-vlog] Navigating to step:', stepId, { targetIndex, highestStepReached });
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
        title="Character Mode"
        description="Choose how to generate your video animations"
        creatingMode={creatingMode}
      />
    );
  }

  // Convert reference mode to narrative mode format for backward compatibility
  // 1F -> "image-reference", 2F -> "start-end", AI -> "start-end" (AI decides per shot)
  const narrativeMode = referenceMode === "1F" ? "image-reference" : "start-end";

  return (
    <>
    <CharacterVlogStudioLayout
      currentStep={activeStep}
      completedSteps={completedSteps}
      highestStepReached={highestStepReached}
      direction={direction}
      onStepClick={handleStepClick}
      onNext={handleNext}
      onBack={handleBack}
      videoTitle={videoTitle}
      isNextDisabled={isGeneratingPrompts || isGeneratingScenes} // Disable Continue button during generation
    >
            <CharacterVlogWorkflow 
              activeStep={activeStep}
              videoId={videoId}
              workspaceId={workspaceId || ''}
              workflowRef={workflowRef}
              narrativeMode={narrativeMode}
              referenceMode={referenceMode}
              script={script}
              aspectRatio={aspectRatio}
              scriptModel={scriptModel}
              videoModel={videoModel}
              imageModel={imageModel}
              narrationStyle={narrationStyle}
              voiceOverEnabled={voiceOverEnabled}
        theme={theme}
        numberOfScenes={numberOfScenes}
        shotsPerScene={shotsPerScene}
        characterPersonality={characterPersonality}
              scenes={scenes}
              shots={shots}
              shotVersions={shotVersions}
              shotInheritanceMap={shotInheritanceMap}
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
              onImageModelChange={setImageModel}
              onNarrationStyleChange={setNarrationStyle}
              onVoiceOverToggle={setVoiceOverEnabled}
              backgroundMusicEnabled={backgroundMusicEnabled}
              voiceoverLanguage={voiceoverLanguage}
              textOverlayEnabled={textOverlayEnabled}
              onBackgroundMusicEnabledChange={setBackgroundMusicEnabled}
              onVoiceoverLanguageChange={setVoiceoverLanguage}
              onTextOverlayEnabledChange={setTextOverlayEnabled}
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
              onSceneGeneratingChange={setIsGeneratingScenes}
              onMainCharacterChange={setMainCharacter}
              onWorldSettingsChange={setWorldSettings}
              // Step 5 Sound props
              voiceoverScript={voiceoverScript}
              voiceoverAudioUrl={voiceoverAudioUrl}
              voiceoverDuration={voiceoverDuration}
              selectedVoiceId={selectedVoiceId}
              soundEffects={soundEffects}
              generatedMusicUrl={generatedMusicUrl}
              generatedMusicDuration={generatedMusicDuration}
              onVoiceoverScriptChange={setVoiceoverScript}
              onVoiceoverAudioGenerated={(audioUrl, duration) => {
                setVoiceoverAudioUrl(audioUrl);
                setVoiceoverDuration(duration);
              }}
              onSoundEffectsUpdate={setSoundEffects}
              onMusicGenerated={(musicUrl, duration) => {
                setGeneratedMusicUrl(musicUrl);
                setGeneratedMusicDuration(duration);
              }}
              onVoiceChange={setSelectedVoiceId}
              onNext={handleNext}
            />
    </CharacterVlogStudioLayout>
    
    {/* Prompt Generation Progress - Beautiful Loading Screen */}
    {isGeneratingPrompts && (
      <GenerationLoading
        title="Generating Storyboard"
        description="Creating detailed prompts for your scenes and shots"
        currentStep={
          promptGenerationProgress.currentSceneName 
            ? promptGenerationProgress.currentSceneName
            : promptGenerationProgress.currentScene > 0
              ? `Scene ${promptGenerationProgress.currentScene} of ${promptGenerationProgress.totalScenes}`
              : undefined
        }
        progress={
          promptGenerationProgress.totalScenes > 0
            ? (promptGenerationProgress.currentScene / promptGenerationProgress.totalScenes) * 100
            : 5
        }
        showDetails={promptGenerationProgress.totalShots > 0}
        details={{
          current: promptGenerationProgress.processedShots,
          total: promptGenerationProgress.totalShots,
          label: "shots"
        }}
      />
    )}
    </>
  );
}
