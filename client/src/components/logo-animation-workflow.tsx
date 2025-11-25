import { useState } from "react";
import { LogoBrandTab } from "./logo-animation/logo-brand-tab";
import { AnimationStyleTab } from "./logo-animation/animation-style-tab";
import { EffectsEnvironmentTab } from "./logo-animation/effects-environment-tab";
import { AudioDesignTab } from "./logo-animation/audio-design-tab";
import { ExportTab } from "./logo-animation/export-tab";

export interface LogoAnimationSettings {
  logoFile: File | null;
  detectedElements: {
    icon: boolean;
    wordmark: boolean;
    tagline: boolean;
  };
  brandPersonality: string;
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  animationContext: string;
  animationApproach: string;
  motionIntensity: number;
  animationSpeed: number;
  easingStyle: string;
  elementSequencing: string;
  backgroundType: string;
  backgroundColor: string;
  visualEffects: {
    glow: boolean;
    shadow: boolean;
    lightRays: boolean;
    particles: boolean;
    reflections: boolean;
    grain: boolean;
  };
  colorTreatment: string;
  effectIntensity: {
    glow: number;
    shadow: number;
    particles: number;
  };
  soundType: string;
  soundCharacter: string;
  volume: {
    master: number;
    fadeIn: number;
    fadeOut: number;
  };
  syncToAnimation: boolean;
  impactOnReveal: boolean;
  duration: number;
  aspectRatio: string;
  resolution: string;
  format: string;
  transparentBackground: boolean;
  variations: {
    loop: boolean;
    reverse: boolean;
    watermark: boolean;
    stinger: boolean;
  };
}

interface LogoAnimationWorkflowProps {
  currentStep: number;
  onStepChange: (step: number) => void;
}

export function LogoAnimationWorkflow({ currentStep, onStepChange }: LogoAnimationWorkflowProps) {
  const [settings, setSettings] = useState<LogoAnimationSettings>({
    logoFile: null,
    detectedElements: {
      icon: true,
      wordmark: true,
      tagline: false
    },
    brandPersonality: "modern",
    brandColors: {
      primary: "#8B3FFF",
      secondary: "#C944E6",
      accent: "#FF3F8E",
      background: "#000000"
    },
    animationContext: "video-intro",
    animationApproach: "reveal",
    motionIntensity: 50,
    animationSpeed: 50,
    easingStyle: "ease-in-out",
    elementSequencing: "together",
    backgroundType: "transparent",
    backgroundColor: "#000000",
    visualEffects: {
      glow: true,
      shadow: true,
      lightRays: false,
      particles: false,
      reflections: false,
      grain: false
    },
    colorTreatment: "full-color",
    effectIntensity: {
      glow: 50,
      shadow: 40,
      particles: 30
    },
    soundType: "whoosh-impact",
    soundCharacter: "cinematic",
    volume: {
      master: 80,
      fadeIn: 20,
      fadeOut: 50
    },
    syncToAnimation: true,
    impactOnReveal: true,
    duration: 3,
    aspectRatio: "16:9",
    resolution: "1080p",
    format: "mp4",
    transparentBackground: false,
    variations: {
      loop: false,
      reverse: false,
      watermark: false,
      stinger: false
    }
  });

  const handleNext = () => {
    onStepChange(currentStep + 1);
  };

  const handlePrev = () => {
    onStepChange(currentStep - 1);
  };

  const renderTab = () => {
    switch (currentStep) {
      case 0:
        return <LogoBrandTab onNext={handleNext} />;
      case 1:
        return <AnimationStyleTab onNext={handleNext} onPrev={handlePrev} />;
      case 2:
        return <EffectsEnvironmentTab onNext={handleNext} onPrev={handlePrev} />;
      case 3:
        return <AudioDesignTab onNext={handleNext} onPrev={handlePrev} />;
      case 4:
        return <ExportTab onPrev={handlePrev} />;
      default:
        return <LogoBrandTab onNext={handleNext} />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {renderTab()}
    </div>
  );
}
