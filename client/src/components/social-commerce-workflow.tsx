import { useState } from "react";
import { ProductSetupTab } from "./commerce/product-setup-tab";
import { HookFormatTab } from "./commerce/hook-format-tab";
import { SceneBuilderTab } from "./commerce/scene-builder-tab";
import { VisualStyleTab } from "./commerce/visual-style-tab";
import { AudioCaptionsTab } from "./commerce/audio-captions-tab";
import { ExportPublishTab } from "./commerce/export-publish-tab";

interface SocialCommerceWorkflowProps {
  activeStep: number;
  onStepChange: (step: number) => void;
  projectName: string;
}

export interface ProductData {
  name: string;
  price: string;
  category: string;
  description: string;
  sellingPoints: string[];
  problemSolved: string;
  differentiator: string;
  demographics: string[];
  interests: string;
  tone: string;
}

export interface HookFormatData {
  hookStyle: string;
  videoFormat: string;
  duration: number;
  ctaType: string;
}

export interface SceneData {
  id: number;
  type: string;
  description: string;
  overlay: string;
  duration: number;
}

export interface VisualData {
  aesthetic: string;
  background: string;
  lighting: string;
  colorPalette: string;
  motionGraphics: string[];
}

export interface AudioData {
  audioType: string;
  voiceStyle: string;
  voiceScript: string;
  voiceSpeed: number;
  captionStyle: string;
  soundEffects: string[];
  volumeMix: {
    voice: number;
    music: number;
    sfx: number;
  };
}

export interface ExportData {
  platform: string;
  aspectRatio: string;
  resolution: string;
  productUrl: string;
  utmTracking: boolean;
  batchOptions: string[];
}

export function SocialCommerceWorkflow({ 
  activeStep, 
  onStepChange,
  projectName 
}: SocialCommerceWorkflowProps) {
  const [productData, setProductData] = useState<ProductData>({
    name: "",
    price: "",
    category: "",
    description: "",
    sellingPoints: ["", "", ""],
    problemSolved: "",
    differentiator: "",
    demographics: [],
    interests: "",
    tone: ""
  });

  const [hookFormatData, setHookFormatData] = useState<HookFormatData>({
    hookStyle: "",
    videoFormat: "",
    duration: 30,
    ctaType: ""
  });

  const [scenes, setScenes] = useState<SceneData[]>([
    { id: 1, type: "hook", description: "", overlay: "", duration: 3 },
    { id: 2, type: "feature", description: "", overlay: "", duration: 5 },
    { id: 3, type: "demo", description: "", overlay: "", duration: 7 },
    { id: 4, type: "cta", description: "", overlay: "", duration: 3 }
  ]);

  const [visualData, setVisualData] = useState<VisualData>({
    aesthetic: "",
    background: "",
    lighting: "",
    colorPalette: "",
    motionGraphics: []
  });

  const [audioData, setAudioData] = useState<AudioData>({
    audioType: "voiceover",
    voiceStyle: "",
    voiceScript: "",
    voiceSpeed: 60,
    captionStyle: "",
    soundEffects: [],
    volumeMix: {
      voice: 80,
      music: 40,
      sfx: 60
    }
  });

  const [exportData, setExportData] = useState<ExportData>({
    platform: "",
    aspectRatio: "9:16",
    resolution: "1080p",
    productUrl: "",
    utmTracking: false,
    batchOptions: []
  });

  const goToNextStep = () => {
    onStepChange(activeStep + 1);
  };

  const goToPrevStep = () => {
    onStepChange(activeStep - 1);
  };

  const renderActiveTab = () => {
    switch (activeStep) {
      case 0:
        return (
          <ProductSetupTab 
            onNext={goToNextStep}
          />
        );
      case 1:
        return (
          <HookFormatTab 
            onNext={goToNextStep}
            onPrev={goToPrevStep}
          />
        );
      case 2:
        return (
          <SceneBuilderTab 
            onNext={goToNextStep}
            onPrev={goToPrevStep}
          />
        );
      case 3:
        return (
          <VisualStyleTab 
            onNext={goToNextStep}
            onPrev={goToPrevStep}
          />
        );
      case 4:
        return (
          <AudioCaptionsTab 
            onNext={goToNextStep}
            onPrev={goToPrevStep}
          />
        );
      case 5:
        return (
          <ExportPublishTab 
            onPrev={goToPrevStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-full" data-testid="social-commerce-workflow">
      {renderActiveTab()}
    </div>
  );
}
