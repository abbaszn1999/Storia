import { useState } from "react";
import { AtmosphereTab } from "./ambient/atmosphere-tab";
import { VisualWorldTab } from "./ambient/visual-world-tab";
import { FlowDesignTab } from "./ambient/flow-design-tab";
import { StoryboardEditor } from "./ambient/storyboard-editor";
import { PreviewTab } from "./ambient/preview-tab";
import { ExportTab } from "./ambient/export-tab";
import { getDefaultVideoModel } from "@/constants/video-models";
import type { Character } from "@shared/schema";
import type { Scene, Shot, ShotVersion, ContinuityGroup, ReferenceImage } from "@/types/storyboard";

interface AmbientVisualWorkflowProps {
  activeStep: number;
  onStepChange: (step: number) => void;
  projectName: string;
  videoId?: string;
  initialAnimationMode?: 'image-transitions' | 'video-animation';
  initialVideoGenerationMode?: 'image-reference' | 'start-end-frame';
}

export function AmbientVisualWorkflow({
  activeStep,
  onStepChange,
  projectName,
  videoId,
  initialAnimationMode = 'image-transitions',
  initialVideoGenerationMode,
}: AmbientVisualWorkflowProps) {
  // Atmosphere State
  const [mood, setMood] = useState("calm");
  const [theme, setTheme] = useState("nature");
  const [timeContext, setTimeContext] = useState("sunset");
  const [season, setSeason] = useState("neutral");
  const [intensity, setIntensity] = useState(50);
  const [duration, setDuration] = useState("5min");
  const [moodDescription, setMoodDescription] = useState("");
  const [imageModel, setImageModel] = useState("nano-banana");
  const [imageResolution, setImageResolution] = useState("auto");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en'>('en');
  const [textOverlayEnabled, setTextOverlayEnabled] = useState(false);
  const [textOverlayStyle, setTextOverlayStyle] = useState<'modern' | 'cinematic' | 'bold'>('modern');
  const [animationMode, setAnimationMode] = useState<'image-transitions' | 'video-animation'>(initialAnimationMode);
  const [videoGenerationMode, setVideoGenerationMode] = useState<'image-reference' | 'start-end-frame' | undefined>(initialVideoGenerationMode);
  
  // Image Transitions state (global default)
  const [defaultEasingStyle, setDefaultEasingStyle] = useState("smooth");
  // Video Animation state (global settings)
  const defaultVideoModel = getDefaultVideoModel();
  const [videoModel, setVideoModel] = useState(defaultVideoModel.value);
  const [videoResolution, setVideoResolution] = useState(defaultVideoModel.resolutions[0] || "720p");
  const [motionPrompt, setMotionPrompt] = useState("");
  
  // Pacing & Loop Settings (moved from Flow Design to Atmosphere)
  const [pacing, setPacing] = useState(30);
  
  // Segment Settings
  const [segmentEnabled, setSegmentEnabled] = useState(true);
  const [segmentCount, setSegmentCount] = useState<'auto' | number>('auto');
  const [shotsPerSegment, setShotsPerSegment] = useState<'auto' | number>('auto');
  
  // Loop Settings
  const [loopMode, setLoopMode] = useState(true);
  const [loopType, setLoopType] = useState<'seamless' | 'fade' | 'hard-cut'>('seamless');
  const [segmentLoopEnabled, setSegmentLoopEnabled] = useState(false);
  const [segmentLoopCount, setSegmentLoopCount] = useState<'auto' | number>('auto');
  const [shotLoopEnabled, setShotLoopEnabled] = useState(false);
  const [shotLoopCount, setShotLoopCount] = useState<'auto' | number>('auto');
  
  // Visual World State
  const [artStyle, setArtStyle] = useState("cinematic");
  const [colorPalette, setColorPalette] = useState("warm");
  const [lightingMood, setLightingMood] = useState("golden-hour");
  const [texture, setTexture] = useState("clean");
  const [visualElements, setVisualElements] = useState<string[]>([]);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [imageCustomInstructions, setImageCustomInstructions] = useState("");

  // Flow Design State
  const [transitionStyle, setTransitionStyle] = useState("auto");
  const [cameraMotion, setCameraMotion] = useState("auto");
  const [visualRhythm, setVisualRhythm] = useState("breathing");
  
  // Scene/Shot State for Flow Design and Composition
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [shots, setShots] = useState<{ [sceneId: string]: Shot[] }>({});
  const [shotVersions, setShotVersions] = useState<{ [shotId: string]: ShotVersion[] }>({});
  const [continuityLocked, setContinuityLocked] = useState(false);
  const [continuityGroups, setContinuityGroups] = useState<{ [sceneId: string]: ContinuityGroup[] }>({});
  
  // Composition State (StoryboardEditor)
  const [shotReferenceImages, setShotReferenceImages] = useState<ReferenceImage[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [voiceActorId, setVoiceActorId] = useState<string | null>(null);

  const goToNextStep = () => {
    onStepChange(activeStep + 1);
  };

  // Handler for scene generation in Flow Design
  const handleScenesGenerated = (
    newScenes: Scene[], 
    newShots: { [sceneId: string]: Shot[] }, 
    newShotVersions?: { [shotId: string]: ShotVersion[] }
  ) => {
    setScenes(newScenes);
    setShots(newShots);
    if (newShotVersions) {
      setShotVersions(newShotVersions);
    }
  };

  const handleContinuityLocked = () => {
    setContinuityLocked(true);
  };

  const handleContinuityGroupsChange = (groups: { [sceneId: string]: ContinuityGroup[] }) => {
    setContinuityGroups(groups);
  };

  // StoryboardEditor handlers
  const handleGenerateShot = (shotId: string) => {
    // Mock implementation - would call API in production
    console.log("Generating shot:", shotId);
    const allShots = Object.values(shots).flat();
    const shot = allShots.find(s => s.id === shotId);
    if (shot) {
      const newVersion: ShotVersion = {
        id: `version-${Date.now()}`,
        shotId: shotId,
        versionNumber: (shotVersions[shotId]?.length || 0) + 1,
        visualPrompt: shot.visualPrompt || "",
        imageUrl: `https://picsum.photos/seed/${Date.now()}/640/360`,
        selected: true,
        createdAt: new Date(),
      };
      setShotVersions(prev => ({
        ...prev,
        [shotId]: [...(prev[shotId] || []), newVersion]
      }));
      // Update shot with currentVersionId
      setShots(prev => {
        const sceneId = shot.sceneId;
        return {
          ...prev,
          [sceneId]: prev[sceneId].map(s => 
            s.id === shotId ? { ...s, currentVersionId: newVersion.id } : s
          )
        };
      });
    }
  };

  const handleRegenerateShot = (shotId: string) => {
    handleGenerateShot(shotId);
  };

  const handleUpdateShot = (shotId: string, updates: Partial<Shot>) => {
    setShots(prev => {
      const newShots = { ...prev };
      for (const sceneId of Object.keys(newShots)) {
        newShots[sceneId] = newShots[sceneId].map(shot =>
          shot.id === shotId ? { ...shot, ...updates } : shot
        );
      }
      return newShots;
    });
  };

  const handleUpdateShotVersion = (shotId: string, versionId: string, updates: Partial<ShotVersion>) => {
    setShotVersions(prev => ({
      ...prev,
      [shotId]: (prev[shotId] || []).map(version =>
        version.id === versionId ? { ...version, ...updates } : version
      )
    }));
  };

  const handleUpdateScene = (sceneId: string, updates: Partial<Scene>) => {
    setScenes(prev => prev.map(scene =>
      scene.id === sceneId ? { ...scene, ...updates } : scene
    ));
  };

  const handleReorderShots = (sceneId: string, shotIds: string[]) => {
    setShots(prev => {
      const sceneShots = prev[sceneId] || [];
      const reordered = shotIds.map((id, index) => {
        const shot = sceneShots.find(s => s.id === id);
        return shot ? { ...shot, order: index } : null;
      }).filter(Boolean) as Shot[];
      return { ...prev, [sceneId]: reordered };
    });
  };

  const handleUploadShotReference = (shotId: string, file: File) => {
    // Mock implementation - would upload file in production
    const url = URL.createObjectURL(file);
    const newRef: ReferenceImage = {
      id: `ref-${Date.now()}`,
      videoId: null,
      shotId: shotId,
      characterId: null,
      type: "shot-reference",
      imageUrl: url,
      description: file.name,
      createdAt: new Date(),
    };
    setShotReferenceImages(prev => [...prev, newRef]);
  };

  const handleDeleteShotReference = (shotId: string) => {
    setShotReferenceImages(prev => prev.filter(ref => ref.shotId !== shotId));
  };

  const handleSelectVersion = (shotId: string, versionId: string) => {
    // Update shot's currentVersionId
    setShots(prev => {
      const newShots = { ...prev };
      for (const sceneId of Object.keys(newShots)) {
        newShots[sceneId] = newShots[sceneId].map(shot =>
          shot.id === shotId ? { ...shot, currentVersionId: versionId } : shot
        );
      }
      return newShots;
    });
  };

  const handleDeleteVersion = (shotId: string, versionId: string) => {
    setShotVersions(prev => ({
      ...prev,
      [shotId]: (prev[shotId] || []).filter(v => v.id !== versionId)
    }));
  };

  const handleAddScene = (afterSceneIndex: number) => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      videoId: `ambient-${Date.now()}`,
      sceneNumber: afterSceneIndex + 2,
      description: "New scene",
      setting: "",
      duration: 10,
      order: afterSceneIndex + 1,
      createdAt: new Date(),
    };
    setScenes(prev => {
      const newScenes = [...prev];
      newScenes.splice(afterSceneIndex + 1, 0, newScene);
      // Update order for all scenes
      return newScenes.map((s, i) => ({ ...s, order: i, sceneNumber: i + 1 }));
    });
    setShots(prev => ({ ...prev, [newScene.id]: [] }));
  };

  const handleAddShot = (sceneId: string, afterShotIndex: number) => {
    const newShot: Shot = {
      id: `shot-${Date.now()}`,
      sceneId: sceneId,
      shotNumber: afterShotIndex + 2,
      description: "New shot",
      visualPrompt: "",
      duration: 5,
      shotType: "Medium Shot",
      cameraAngle: "Eye Level",
      order: afterShotIndex + 1,
      currentVersionId: null,
      createdAt: new Date(),
    };
    setShots(prev => {
      const sceneShots = [...(prev[sceneId] || [])];
      sceneShots.splice(afterShotIndex + 1, 0, newShot);
      // Update order for all shots in scene
      return {
        ...prev,
        [sceneId]: sceneShots.map((s, i) => ({ ...s, order: i, shotNumber: i + 1 }))
      };
    });
  };

  const handleDeleteScene = (sceneId: string) => {
    setScenes(prev => prev.filter(s => s.id !== sceneId).map((s, i) => ({ ...s, order: i, sceneNumber: i + 1 })));
    setShots(prev => {
      const newShots = { ...prev };
      delete newShots[sceneId];
      return newShots;
    });
  };

  const handleDeleteShot = (shotId: string) => {
    setShots(prev => {
      const newShots = { ...prev };
      for (const sceneId of Object.keys(newShots)) {
        newShots[sceneId] = newShots[sceneId]
          .filter(s => s.id !== shotId)
          .map((s, i) => ({ ...s, order: i, shotNumber: i + 1 }));
      }
      return newShots;
    });
    setShotVersions(prev => {
      const newVersions = { ...prev };
      delete newVersions[shotId];
      return newVersions;
    });
  };

  // Calculate total duration from all shots
  const allShots = Object.values(shots).flat();
  const totalDuration = allShots.reduce((acc, s) => acc + (s.duration || 5), 0) || 60;

  const renderStep = () => {
    switch (activeStep) {
      case 1:
        return (
          <AtmosphereTab
            mood={mood}
            theme={theme}
            timeContext={timeContext}
            season={season}
            intensity={intensity}
            duration={duration}
            moodDescription={moodDescription}
            imageModel={imageModel}
            imageResolution={imageResolution}
            aspectRatio={aspectRatio}
            voiceoverEnabled={voiceoverEnabled}
            language={language}
            textOverlayEnabled={textOverlayEnabled}
            textOverlayStyle={textOverlayStyle}
            animationMode={animationMode}
            videoGenerationMode={videoGenerationMode}
            defaultEasingStyle={defaultEasingStyle}
            videoModel={videoModel}
            videoResolution={videoResolution}
            motionPrompt={motionPrompt}
            transitionStyle={transitionStyle}
            cameraMotion={cameraMotion}
            pacing={pacing}
            segmentEnabled={segmentEnabled}
            segmentCount={segmentCount}
            shotsPerSegment={shotsPerSegment}
            loopMode={loopMode}
            loopType={loopType}
            segmentLoopEnabled={segmentLoopEnabled}
            segmentLoopCount={segmentLoopCount}
            shotLoopEnabled={shotLoopEnabled}
            shotLoopCount={shotLoopCount}
            onMoodChange={setMood}
            onThemeChange={setTheme}
            onTimeContextChange={setTimeContext}
            onSeasonChange={setSeason}
            onIntensityChange={setIntensity}
            onDurationChange={setDuration}
            onMoodDescriptionChange={setMoodDescription}
            onImageModelChange={setImageModel}
            onImageResolutionChange={setImageResolution}
            onAspectRatioChange={setAspectRatio}
            onVoiceoverChange={setVoiceoverEnabled}
            onLanguageChange={setLanguage}
            onTextOverlayEnabledChange={setTextOverlayEnabled}
            onTextOverlayStyleChange={setTextOverlayStyle}
            onAnimationModeChange={setAnimationMode}
            onDefaultEasingStyleChange={setDefaultEasingStyle}
            onVideoModelChange={setVideoModel}
            onVideoResolutionChange={setVideoResolution}
            onMotionPromptChange={setMotionPrompt}
            onTransitionStyleChange={setTransitionStyle}
            onCameraMotionChange={setCameraMotion}
            onPacingChange={setPacing}
            onSegmentEnabledChange={setSegmentEnabled}
            onSegmentCountChange={setSegmentCount}
            onShotsPerSegmentChange={setShotsPerSegment}
            onLoopModeChange={setLoopMode}
            onLoopTypeChange={setLoopType}
            onSegmentLoopEnabledChange={setSegmentLoopEnabled}
            onSegmentLoopCountChange={setSegmentLoopCount}
            onShotLoopEnabledChange={setShotLoopEnabled}
            onShotLoopCountChange={setShotLoopCount}
            onNext={goToNextStep}
          />
        );
      case 2:
        return (
          <VisualWorldTab
            artStyle={artStyle}
            colorPalette={colorPalette}
            lightingMood={lightingMood}
            texture={texture}
            visualElements={visualElements}
            visualRhythm={visualRhythm}
            referenceImages={referenceImages}
            imageCustomInstructions={imageCustomInstructions}
            onArtStyleChange={setArtStyle}
            onColorPaletteChange={setColorPalette}
            onLightingMoodChange={setLightingMood}
            onTextureChange={setTexture}
            onVisualElementsChange={setVisualElements}
            onVisualRhythmChange={setVisualRhythm}
            onReferenceImagesChange={setReferenceImages}
            onImageCustomInstructionsChange={setImageCustomInstructions}
            onNext={goToNextStep}
          />
        );
      case 3:
        return (
          <FlowDesignTab
            videoId={`ambient-${Date.now()}`}
            script={moodDescription}
            scriptModel="gemini-flash"
            narrativeMode={videoGenerationMode === 'start-end-frame' ? 'start-end' : 'image-reference'}
            scenes={scenes}
            shots={shots}
            shotVersions={shotVersions}
            continuityLocked={continuityLocked}
            continuityGroups={continuityGroups}
            animationMode={animationMode}
            onScenesGenerated={handleScenesGenerated}
            onContinuityLocked={handleContinuityLocked}
            onContinuityGroupsChange={handleContinuityGroupsChange}
            onNext={goToNextStep}
          />
        );
      case 4:
        return (
          <StoryboardEditor
            videoId={`ambient-${Date.now()}`}
            narrativeMode={videoGenerationMode === 'start-end-frame' ? 'start-end' : 'image-reference'}
            animationMode={animationMode}
            scenes={scenes}
            shots={shots}
            shotVersions={shotVersions}
            referenceImages={shotReferenceImages}
            characters={characters}
            voiceActorId={voiceActorId}
            voiceOverEnabled={voiceoverEnabled}
            continuityLocked={continuityLocked}
            continuityGroups={continuityGroups}
            onVoiceActorChange={setVoiceActorId}
            onVoiceOverToggle={setVoiceoverEnabled}
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
            onNext={goToNextStep}
          />
        );
      case 5:
        // Convert shots to segments for preview
        const previewSegments = allShots.map((shot, index) => {
          const version = shot.currentVersionId ? shotVersions[shot.id]?.find(v => v.id === shot.currentVersionId) : null;
          return {
            id: shot.id,
            keyframeUrl: version?.imageUrl || null,
            duration: shot.duration || 5,
            motionDirection: "static" as const,
            layers: { background: true, midground: true, foreground: false },
            effects: { particles: false, lightRays: false, fog: false }
          };
        });
        return (
          <PreviewTab
            segments={previewSegments}
            loopMode={loopMode ? "enabled" : "disabled"}
            duration={duration}
            onNext={goToNextStep}
          />
        );
      case 6:
        return (
          <ExportTab
            projectName={projectName}
            loopMode={loopMode}
            totalDuration={totalDuration}
          />
        );
      default:
        return null;
    }
  };

  return <>{renderStep()}</>;
}
