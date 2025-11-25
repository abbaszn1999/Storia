import { useState } from "react";
import { AtmosphereTab } from "./ambient/atmosphere-tab";
import { VisualWorldTab } from "./ambient/visual-world-tab";
import { FlowDesignTab } from "./ambient/flow-design-tab";
import { CompositionTab } from "./ambient/composition-tab";
import { PreviewTab } from "./ambient/preview-tab";
import { ExportTab } from "./ambient/export-tab";

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
}

export function AmbientVisualWorkflow({
  activeStep,
  onStepChange,
  projectName,
}: AmbientVisualWorkflowProps) {
  // Atmosphere State
  const [mood, setMood] = useState("calm");
  const [theme, setTheme] = useState("nature");
  const [timeContext, setTimeContext] = useState("sunset");
  const [season, setSeason] = useState("neutral");
  const [intensity, setIntensity] = useState(50);
  const [duration, setDuration] = useState("1min");
  const [moodDescription, setMoodDescription] = useState("");

  // Visual World State
  const [artStyle, setArtStyle] = useState("cinematic");
  const [colorPalette, setColorPalette] = useState("warm");
  const [lightingMood, setLightingMood] = useState("golden-hour");
  const [texture, setTexture] = useState("clean");
  const [visualElements, setVisualElements] = useState<string[]>([]);
  const [atmosphericLayers, setAtmosphericLayers] = useState<string[]>([]);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);

  // Flow Design State
  const [pacing, setPacing] = useState(30);
  const [segmentCount, setSegmentCount] = useState(3);
  const [transitionStyle, setTransitionStyle] = useState("crossfade");
  const [variationType, setVariationType] = useState("evolving");
  const [cameraMotion, setCameraMotion] = useState("slow-pan");
  const [loopMode, setLoopMode] = useState("seamless");
  const [visualRhythm, setVisualRhythm] = useState("breathing");
  const [enableParallax, setEnableParallax] = useState(false);

  // Composition State
  const [segments, setSegments] = useState<Segment[]>([]);

  const goToNextStep = () => {
    onStepChange(activeStep + 1);
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
            onMoodChange={setMood}
            onThemeChange={setTheme}
            onTimeContextChange={setTimeContext}
            onSeasonChange={setSeason}
            onIntensityChange={setIntensity}
            onDurationChange={setDuration}
            onMoodDescriptionChange={setMoodDescription}
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
            atmosphericLayers={atmosphericLayers}
            referenceImages={referenceImages}
            onArtStyleChange={setArtStyle}
            onColorPaletteChange={setColorPalette}
            onLightingMoodChange={setLightingMood}
            onTextureChange={setTexture}
            onVisualElementsChange={setVisualElements}
            onAtmosphericLayersChange={setAtmosphericLayers}
            onReferenceImagesChange={setReferenceImages}
            onNext={goToNextStep}
          />
        );
      case 2:
        return (
          <FlowDesignTab
            pacing={pacing}
            segmentCount={segmentCount}
            transitionStyle={transitionStyle}
            variationType={variationType}
            cameraMotion={cameraMotion}
            loopMode={loopMode}
            visualRhythm={visualRhythm}
            enableParallax={enableParallax}
            onPacingChange={setPacing}
            onSegmentCountChange={setSegmentCount}
            onTransitionStyleChange={setTransitionStyle}
            onVariationTypeChange={setVariationType}
            onCameraMotionChange={setCameraMotion}
            onLoopModeChange={setLoopMode}
            onVisualRhythmChange={setVisualRhythm}
            onEnableParallaxChange={setEnableParallax}
            onNext={goToNextStep}
          />
        );
      case 3:
        return (
          <CompositionTab
            segments={segments}
            onSegmentsChange={setSegments}
            onNext={goToNextStep}
            segmentCount={segmentCount}
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

  return <div className="p-6">{renderStep()}</div>;
}
