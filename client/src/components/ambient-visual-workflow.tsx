import { useState } from "react";
import { AtmosphereTab } from "./ambient/atmosphere-tab";
import { VisualWorldTab } from "./ambient/visual-world-tab";
import { FlowDesignTab } from "./ambient/flow-design-tab";
import { CompositionTab } from "./ambient/composition-tab";
import { PreviewTab } from "./ambient/preview-tab";
import { ExportTab } from "./ambient/export-tab";
import type { Scene, Shot, ShotVersion, ContinuityGroup } from "@shared/schema";

interface Segment {
  id: string;
  keyframeUrl: string | null;
  duration: number;
  motionDirection: "up" | "down" | "left" | "right" | "static";
  layers: {
    background: boolean;
    midground: boolean;
    foreground: boolean;
  };
  effects: {
    particles: boolean;
    lightRays: boolean;
    fog: boolean;
  };
}

interface AmbientVisualWorkflowProps {
  activeStep: number;
  onStepChange: (step: number) => void;
  projectName: string;
  initialAnimationMode?: 'image-transitions' | 'video-animation';
  initialVideoGenerationMode?: 'image-reference' | 'start-end-frame';
}

export function AmbientVisualWorkflow({
  activeStep,
  onStepChange,
  projectName,
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
  const [videoModel, setVideoModel] = useState("kling-1.6");
  const [videoResolution, setVideoResolution] = useState("1080p");
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

  // Flow Design State
  const [transitionStyle, setTransitionStyle] = useState("crossfade");
  const [cameraMotion, setCameraMotion] = useState("slow-pan");
  const [visualRhythm, setVisualRhythm] = useState("breathing");
  
  // Scene/Shot State for Flow Design
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [shots, setShots] = useState<{ [sceneId: string]: Shot[] }>({});
  const [shotVersions, setShotVersions] = useState<{ [shotId: string]: ShotVersion[] }>({});
  const [continuityLocked, setContinuityLocked] = useState(false);
  const [continuityGroups, setContinuityGroups] = useState<{ [sceneId: string]: ContinuityGroup[] }>({});

  // Composition State
  const [segments, setSegments] = useState<Segment[]>([]);

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

  // Calculate total duration from segments
  const totalDuration = segments.reduce((acc, s) => acc + s.duration, 0) || 60;

  const renderStep = () => {
    switch (activeStep) {
      case 0:
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
      case 1:
        return (
          <VisualWorldTab
            artStyle={artStyle}
            colorPalette={colorPalette}
            lightingMood={lightingMood}
            texture={texture}
            visualElements={visualElements}
            visualRhythm={visualRhythm}
            referenceImages={referenceImages}
            onArtStyleChange={setArtStyle}
            onColorPaletteChange={setColorPalette}
            onLightingMoodChange={setLightingMood}
            onTextureChange={setTexture}
            onVisualElementsChange={setVisualElements}
            onVisualRhythmChange={setVisualRhythm}
            onReferenceImagesChange={setReferenceImages}
            onNext={goToNextStep}
          />
        );
      case 2:
        return (
          <FlowDesignTab
            videoId={`ambient-${Date.now()}`}
            script={moodDescription}
            scriptModel="gemini-flash"
            narrativeMode={videoGenerationMode}
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
      case 3:
        return (
          <CompositionTab
            segments={segments}
            onSegmentsChange={setSegments}
            onNext={goToNextStep}
            segmentCount={typeof segmentCount === 'number' ? segmentCount : 4}
          />
        );
      case 4:
        return (
          <PreviewTab
            segments={segments}
            loopMode={loopMode}
            duration={duration}
            onNext={goToNextStep}
          />
        );
      case 5:
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
