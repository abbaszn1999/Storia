import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Video, Sparkles, Palette, Waves, CalendarClock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/workspace-context";
import { WizardLayout } from "../../shared/components/layout/wizard-layout";
import { Step1ModeSelection } from "../components/wizard/shared/step-1-mode-selection";
import { Step2ContentSetup } from "../components/wizard/modes/ambient/step-2-content-setup";
import { Step3StyleSettings } from "../components/wizard/modes/ambient/step-3-style-settings";
import { Step4Soundscape } from "../components/wizard/modes/ambient/step-4-soundscape";
import { Step5SchedulePublishing } from "../components/wizard/shared/step-5-schedule-publishing";
import { ComingSoon } from "../components/wizard/modes/coming-soon";
import { useCreateVideoCampaign } from "../hooks";
import type { VideoMode } from "../types";
import { VIDEO_MODES } from "../types";
import type { 
  AnimationMode,
  VideoGenerationMode,
  LoopType,
  AmbientDuration, 
  AmbientAspectRatio, 
  AmbientMood,
  AmbientTheme,
  AmbientTimeContext,
  AmbientSeason,
  AmbientLanguage,
  AmbientArtStyle,
  AmbientReferenceImage,
  AmbientVisualRhythm,
  AmbientImageStyle,
  AmbientMediaType,
  AmbientTransitionStyle,
  AmbientEasingStyle,
  AmbientMusicStyle,
  AmbientSoundType,
  AmbientTextOverlayStyle,
} from "../components/wizard/modes/ambient/types";
import { 
  DEFAULT_AMBIENT_SETTINGS, 
  DEFAULT_SOUNDSCAPE_SETTINGS,
  DEFAULT_PACING_SETTINGS,
  DEFAULT_LOOP_SETTINGS,
  DEFAULT_VISUAL_SETTINGS,
  getTimeContextOptions,
  getSeasonOptions,
} from "../components/wizard/modes/ambient/types";

const wizardSteps = [
  { number: 1, title: "Mode", icon: Video, description: "Video type" },
  { number: 2, title: "Content Setup", icon: Sparkles, description: "Ideas & settings" },
  { number: 3, title: "Style", icon: Palette, description: "Visual settings" },
  { number: 4, title: "Soundscape", icon: Waves, description: "Audio & voice" },
  { number: 5, title: "Schedule & Publish", icon: CalendarClock, description: "Timeline & platforms" },
];

export default function AutoVideoCreate() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Step 1: Mode Selection
  const [videoMode, setVideoMode] = useState<VideoMode>("ambient");

  // ═══════════════════════════════════════════════════════════════
  // Step 2: Content Setup (Atmosphere) - EXACT MATCH WITH ORIGINAL
  // ═══════════════════════════════════════════════════════════════
  
  // Campaign-level (not in campaignSettings)
  const [campaignName, setCampaignName] = useState("");
  const [videoIdeas, setVideoIdeas] = useState<string[]>([""]);
  
  // Core Atmosphere
  const [mood, setMood] = useState<AmbientMood>(DEFAULT_AMBIENT_SETTINGS.mood);
  const [theme, setTheme] = useState<AmbientTheme>(DEFAULT_AMBIENT_SETTINGS.theme);
  const [timeContext, setTimeContext] = useState<AmbientTimeContext>(DEFAULT_AMBIENT_SETTINGS.timeContext);
  const [season, setSeason] = useState<AmbientSeason>(DEFAULT_AMBIENT_SETTINGS.season);
  const [intensity, setIntensity] = useState(DEFAULT_AMBIENT_SETTINGS.intensity);
  
  // Duration & Format
  const [duration, setDuration] = useState<AmbientDuration>(DEFAULT_AMBIENT_SETTINGS.duration);
  const [aspectRatio, setAspectRatio] = useState<AmbientAspectRatio>(DEFAULT_AMBIENT_SETTINGS.aspectRatio);
  const [language, setLanguage] = useState<AmbientLanguage>(DEFAULT_AMBIENT_SETTINGS.language);

  // ═══════════════════════════════════════════════════════════════
  // Step 3: Style Settings - EXACT MATCH WITH ORIGINAL
  // ═══════════════════════════════════════════════════════════════
  
  // Animation Mode
  const [animationMode, setAnimationMode] = useState<AnimationMode>(DEFAULT_AMBIENT_SETTINGS.animationMode);
  const [videoGenerationMode, setVideoGenerationMode] = useState<VideoGenerationMode | undefined>(DEFAULT_AMBIENT_SETTINGS.videoGenerationMode);
  
  // Visual Style
  const [imageStyle, setImageStyle] = useState<AmbientImageStyle>(DEFAULT_AMBIENT_SETTINGS.imageStyle);
  const [artStyle, setArtStyle] = useState<AmbientArtStyle>(DEFAULT_AMBIENT_SETTINGS.visual.artStyle);
  const [visualElements, setVisualElements] = useState<string[]>(DEFAULT_AMBIENT_SETTINGS.visual.visualElements);
  const [visualRhythm, setVisualRhythm] = useState<AmbientVisualRhythm>(DEFAULT_AMBIENT_SETTINGS.visual.visualRhythm);
  const [referenceImages, setReferenceImages] = useState<AmbientReferenceImage[]>(DEFAULT_AMBIENT_SETTINGS.visual.referenceImages as AmbientReferenceImage[]);
  const [imageCustomInstructions, setImageCustomInstructions] = useState(DEFAULT_AMBIENT_SETTINGS.visual.imageCustomInstructions || '');
  
  // Models & Resolution
  const [imageModel, setImageModel] = useState(DEFAULT_AMBIENT_SETTINGS.imageModel);
  const [imageResolution, setImageResolution] = useState(DEFAULT_AMBIENT_SETTINGS.imageResolution);
  const [videoModel, setVideoModel] = useState("seedance-1.0-pro");
  const [videoResolution, setVideoResolution] = useState("720p");
  
  // Image Transitions Mode
  const [mediaType, setMediaType] = useState<AmbientMediaType>(DEFAULT_AMBIENT_SETTINGS.mediaType);
  const [transitionStyle, setTransitionStyle] = useState<AmbientTransitionStyle>(DEFAULT_AMBIENT_SETTINGS.transitionStyle || 'auto');
  const [defaultEasingStyle, setDefaultEasingStyle] = useState<AmbientEasingStyle>(DEFAULT_AMBIENT_SETTINGS.defaultEasingStyle || 'smooth');
  
  // Video Animation Mode
  const [motionPrompt, setMotionPrompt] = useState("");
  
  // Pacing & Segments
  const [pacing, setPacing] = useState(DEFAULT_PACING_SETTINGS.pacing);
  const [segmentEnabled, setSegmentEnabled] = useState(DEFAULT_PACING_SETTINGS.segmentEnabled);
  const [segmentCount, setSegmentCount] = useState<'auto' | number>(DEFAULT_PACING_SETTINGS.segmentCount);
  const [shotsPerSegmentEnabled, setShotsPerSegmentEnabled] = useState(DEFAULT_PACING_SETTINGS.shotsPerSegmentEnabled);
  const [shotsPerSegment, setShotsPerSegment] = useState<'auto' | number>(DEFAULT_PACING_SETTINGS.shotsPerSegment);
  
  // Loop Settings
  const [loopMode, setLoopMode] = useState(DEFAULT_LOOP_SETTINGS.loopMode);
  const [loopType, setLoopType] = useState<LoopType>(DEFAULT_LOOP_SETTINGS.loopType);
  const [segmentLoopEnabled, setSegmentLoopEnabled] = useState(DEFAULT_LOOP_SETTINGS.segmentLoopEnabled);
  const [segmentLoopCount, setSegmentLoopCount] = useState<'auto' | number>(DEFAULT_LOOP_SETTINGS.segmentLoopCount);
  const [shotLoopEnabled, setShotLoopEnabled] = useState(DEFAULT_LOOP_SETTINGS.shotLoopEnabled);
  const [shotLoopCount, setShotLoopCount] = useState<'auto' | number>(DEFAULT_LOOP_SETTINGS.shotLoopCount);

  // ═══════════════════════════════════════════════════════════════
  // Step 4: Soundscape (Audio & Voiceover) - EXACT MATCH WITH ORIGINAL
  // ═══════════════════════════════════════════════════════════════
  
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(DEFAULT_SOUNDSCAPE_SETTINGS.backgroundMusicEnabled);
  const [musicStyle, setMusicStyle] = useState<AmbientMusicStyle>(DEFAULT_SOUNDSCAPE_SETTINGS.musicStyle);
  const [customMusicUrl, setCustomMusicUrl] = useState("");
  const [customMusicDuration, setCustomMusicDuration] = useState(0);
  const [hasCustomMusic, setHasCustomMusic] = useState(false);
  const [musicVolume, setMusicVolume] = useState(DEFAULT_SOUNDSCAPE_SETTINGS.musicVolume);
  
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(DEFAULT_SOUNDSCAPE_SETTINGS.voiceoverEnabled);
  const [voiceoverStory, setVoiceoverStory] = useState("");
  const [voiceId, setVoiceId] = useState("");
  
  const [ambientSoundsEnabled, setAmbientSoundsEnabled] = useState(DEFAULT_SOUNDSCAPE_SETTINGS.ambientSoundsEnabled);
  const [ambientSoundType, setAmbientSoundType] = useState<AmbientSoundType>(DEFAULT_SOUNDSCAPE_SETTINGS.ambientSoundType);
  const [ambientSoundsVolume, setAmbientSoundsVolume] = useState(DEFAULT_SOUNDSCAPE_SETTINGS.ambientSoundsVolume);
  
  const [textOverlayEnabled, setTextOverlayEnabled] = useState(DEFAULT_SOUNDSCAPE_SETTINGS.textOverlayEnabled);
  const [textOverlayStyle, setTextOverlayStyle] = useState<AmbientTextOverlayStyle>(DEFAULT_SOUNDSCAPE_SETTINGS.textOverlayStyle);

  // ═══════════════════════════════════════════════════════════════
  // Step 5: Scheduling
  // ═══════════════════════════════════════════════════════════════
  
  const [automationMode, setAutomationMode] = useState<'continuous' | 'scheduled'>('continuous');
  // Continuous mode
  const [scheduleStartDate, setScheduleStartDate] = useState("");
  const [maxPerDay, setMaxPerDay] = useState(1);
  // Scheduled mode - per-topic dates
  const [topicSchedules, setTopicSchedules] = useState<Record<string, string>>({});

  // ═══════════════════════════════════════════════════════════════
  // Step 6: Publishing
  // ═══════════════════════════════════════════════════════════════
  
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const createCampaign = useCreateVideoCampaign();

  // Auto-adjust time/season when theme changes (EXACT behavior from original)
  useEffect(() => {
    const timeContextOptions = getTimeContextOptions(theme);
    const seasonOptions = getSeasonOptions(theme);
    
    const validTimeIds = timeContextOptions.map((t) => t.id);
    const validSeasonIds = seasonOptions.map((s) => s.id);
    
    // If current time context is not valid for new theme, reset to first option
    if (!validTimeIds.includes(timeContext as any)) {
      setTimeContext(timeContextOptions[0].id as AmbientTimeContext);
    }
    
    // If current season is not valid for new theme, reset to first option
    if (!validSeasonIds.includes(season as any)) {
      setSeason(seasonOptions[0].id as AmbientSeason);
    }
  }, [theme]);

  // Check if selected mode is available
  const selectedModeConfig = VIDEO_MODES.find((m) => m.id === videoMode);
  const isModeAvailable = selectedModeConfig?.available ?? false;

  // Check if current step is valid and can proceed
  const canProceedFromCurrentStep = () => {
    if (currentStep === 1) {
      return isModeAvailable;
    }
    
    if (currentStep === 2) {
      if (!campaignName.trim()) return false;
      const validIdeas = videoIdeas.filter((t) => t.trim());
      return validIdeas.length > 0;
    }
    
    if (currentStep === 4) {
      // If voiceover is enabled, narration theme is required
      if (voiceoverEnabled && !voiceoverStory.trim()) {
        return false;
      }
      return true;
    }
    
    if (currentStep === 5) {
      if (automationMode === 'continuous') {
        return !!scheduleStartDate;
      }
      if (automationMode === 'scheduled') {
        const validIdeasForSchedule = videoIdeas.filter((t) => t.trim());
        const scheduledCount = Object.values(topicSchedules).filter(Boolean).length;
        return scheduledCount >= validIdeasForSchedule.length;
      }
      return true;
    }
    
    return true;
  };

  const handleNext = () => {
    // Validation with error messages
    if (currentStep === 1) {
      if (!isModeAvailable) {
        toast({
          title: "Mode Not Available",
          description: "This mode is coming soon. Please select Ambient Visual mode.",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep === 2) {
      if (!campaignName.trim()) {
        toast({
          title: "Validation Error",
          description: "Please provide a campaign name.",
          variant: "destructive",
        });
        return;
      }
      const validIdeas = videoIdeas.filter((t) => t.trim());
      if (validIdeas.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please add at least one video idea.",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep === 4) {
      // Validate voiceover narration theme if voiceover is enabled
      if (voiceoverEnabled && !voiceoverStory.trim()) {
        toast({
          title: "Validation Error",
          description: "Please provide a narration theme for the voiceover.",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep === 5) {
      // Last step - validate Step 5 and submit
      if (automationMode === 'continuous') {
        if (!scheduleStartDate) {
          toast({
            title: "Validation Error",
            description: "Please select a start date for continuous publishing.",
            variant: "destructive",
          });
          return;
        }
      } else if (automationMode === 'scheduled') {
        const validIdeasForSchedule = videoIdeas.filter((t) => t.trim());
        const scheduledCount = Object.values(topicSchedules).filter(Boolean).length;
        if (scheduledCount < validIdeasForSchedule.length) {
          toast({
            title: "Validation Error",
            description: "Please schedule all topics before creating the campaign.",
            variant: "destructive",
          });
          return;
        }
      }
      handleSubmit();
      return;
    }

    setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    const validIdeas = videoIdeas.filter((t) => t.trim());

    // Build campaign settings - EXACT structure matching AmbientCampaignSettings interface
    const campaignSettings = {
      // Animation Mode
      animationMode,
      videoGenerationMode: animationMode === 'video-animation' ? videoGenerationMode : undefined,
      
      // Core Atmosphere
      mood,
      theme,
      timeContext,
      season,
      intensity,
      
      // Duration & Format
      duration,
      aspectRatio,
      language,
      
      // Image Generation
      imageModel,
      imageResolution,
      imageStyle,
      
      // Video Generation (for video-animation mode)
      videoModel: animationMode === 'video-animation' ? videoModel : undefined,
      videoResolution: animationMode === 'video-animation' ? videoResolution : undefined,
      motionPrompt: animationMode === 'video-animation' && motionPrompt ? motionPrompt : undefined,
      
      // Image Transitions (for image-transitions mode)
      defaultEasingStyle: animationMode === 'image-transitions' ? defaultEasingStyle : undefined,
      transitionStyle: animationMode === 'image-transitions' ? transitionStyle : undefined,
      mediaType,
      
      // Pacing & Segments
      pacing: {
        pacing,
        segmentEnabled,
        segmentCount,
        shotsPerSegmentEnabled,
        shotsPerSegment,
      },
      
      // Loop Settings
      loops: {
        loopMode,
        loopType,
        segmentLoopEnabled,
        segmentLoopCount,
        shotLoopEnabled,
        shotLoopCount,
      },
      
      // Visual World
      visual: {
        artStyle,
        visualElements,
        visualRhythm,
        referenceImages,
        imageCustomInstructions: imageCustomInstructions || undefined,
      },
      
      // Soundscape (Audio & Voiceover)
      soundscape: {
        backgroundMusicEnabled,
        musicStyle,
        customMusicUrl: customMusicUrl || undefined,
        customMusicDuration,
        hasCustomMusic,
        musicVolume,
        voiceoverEnabled,
        voiceoverStory: voiceoverStory || undefined,
        voiceId: voiceId || undefined,
        language,
        ambientSoundsEnabled,
        ambientSoundType,
        ambientSoundsVolume,
        textOverlayEnabled,
        textOverlayStyle,
      },
    };

    const data = {
      name: campaignName,
      workspaceId: currentWorkspace?.id,
      videoMode,
      
      // Video ideas
      videoIdeas: validIdeas.map((idea, index) => ({ idea, index })),
      
      // Campaign settings (stored in JSONB)
      campaignSettings,
      
      // Scheduling
      automationMode,
      // Continuous mode fields
      scheduleStartDate: automationMode === 'continuous' && scheduleStartDate ? new Date(scheduleStartDate) : undefined,
      maxVideosPerDay: automationMode === 'continuous' ? maxPerDay : undefined,
      // Scheduled mode: itemSchedules per topic
      itemSchedules: automationMode === 'scheduled'
        ? Object.fromEntries(
            Object.entries(topicSchedules).map(([k, v]) => [k, { scheduledDate: v, publishedDate: null }])
          )
        : undefined,
      
      // Publishing
      selectedPlatforms,
      
      // Status
      status: 'draft',
    };

    createCampaign.mutate(data, {
      onSuccess: (campaign) => {
        toast({
          title: "Campaign Created",
          description: `${validIdeas.length} videos will be generated.`,
        });
        navigate(`/autoproduction/video/${campaign.id}`);
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create campaign",
          variant: "destructive",
        });
      },
    });
  };

  const renderStep = () => {
    // If mode is not available and we're past step 1, show coming soon
    if (!isModeAvailable && currentStep > 1) {
      return (
        <ComingSoon 
          mode={videoMode} 
          onBack={() => setCurrentStep(1)} 
        />
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <Step1ModeSelection 
            value={videoMode} 
            onChange={setVideoMode} 
          />
        );
      case 2:
        return (
          <Step2ContentSetup
            campaignName={campaignName}
            onCampaignNameChange={setCampaignName}
            videoIdeas={videoIdeas}
            onVideoIdeasChange={setVideoIdeas}
            duration={duration}
            onDurationChange={setDuration}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            mood={mood}
            onMoodChange={setMood}
            theme={theme}
            onThemeChange={setTheme}
            timeContext={timeContext}
            onTimeContextChange={setTimeContext}
            season={season}
            onSeasonChange={setSeason}
            // Animation Mode (moved from Step 3)
            animationMode={animationMode}
            onAnimationModeChange={setAnimationMode}
            videoGenerationMode={videoGenerationMode}
            onVideoGenerationModeChange={setVideoGenerationMode}
            // Image Model & Resolution (moved from Step 3)
            imageModel={imageModel}
            onImageModelChange={setImageModel}
            imageResolution={imageResolution}
            onImageResolutionChange={setImageResolution}
            // Video Model & Resolution (for video-animation mode)
            videoModel={videoModel}
            onVideoModelChange={setVideoModel}
            videoResolution={videoResolution}
            onVideoResolutionChange={setVideoResolution}
            // Pacing & Segments (moved from Step 3)
            pacing={pacing}
            onPacingChange={setPacing}
            segmentEnabled={segmentEnabled}
            onSegmentEnabledChange={setSegmentEnabled}
            segmentCount={segmentCount}
            onSegmentCountChange={setSegmentCount}
            shotsPerSegmentEnabled={shotsPerSegmentEnabled}
            onShotsPerSegmentEnabledChange={setShotsPerSegmentEnabled}
            shotsPerSegment={shotsPerSegment}
            onShotsPerSegmentChange={setShotsPerSegment}
            // Loop Settings (moved from Step 3)
            loopMode={loopMode}
            onLoopModeChange={setLoopMode}
            loopType={loopType}
            onLoopTypeChange={setLoopType}
            segmentLoopEnabled={segmentLoopEnabled}
            onSegmentLoopEnabledChange={setSegmentLoopEnabled}
            segmentLoopCount={segmentLoopCount}
            onSegmentLoopCountChange={setSegmentLoopCount}
            shotLoopEnabled={shotLoopEnabled}
            onShotLoopEnabledChange={setShotLoopEnabled}
            shotLoopCount={shotLoopCount}
            onShotLoopCountChange={setShotLoopCount}
            // Image Transitions Mode settings (moved from Step 3)
            transitionStyle={transitionStyle}
            onTransitionStyleChange={setTransitionStyle}
            defaultEasingStyle={defaultEasingStyle}
            onDefaultEasingStyleChange={setDefaultEasingStyle}
          />
        );
      case 3:
        return (
          <Step3StyleSettings
            // Animation mode passed for conditional UI rendering
            animationMode={animationMode}
            // Visual Style
            artStyle={artStyle}
            onArtStyleChange={setArtStyle}
            visualElements={visualElements}
            onVisualElementsChange={setVisualElements}
            visualRhythm={visualRhythm}
            onVisualRhythmChange={setVisualRhythm}
            referenceImages={referenceImages}
            onReferenceImagesChange={setReferenceImages}
            imageCustomInstructions={imageCustomInstructions}
            onImageCustomInstructionsChange={setImageCustomInstructions}
            // Video Animation Mode settings
            videoModel={videoModel}
            onVideoModelChange={setVideoModel}
            videoResolution={videoResolution}
            onVideoResolutionChange={setVideoResolution}
            motionPrompt={motionPrompt}
            onMotionPromptChange={setMotionPrompt}
          />
        );
      case 4:
        return (
          <Step4Soundscape
            voiceoverEnabled={voiceoverEnabled}
            onVoiceoverEnabledChange={setVoiceoverEnabled}
            voiceoverScript={voiceoverStory}
            onVoiceoverScriptChange={setVoiceoverStory}
            voiceId={voiceId}
            onVoiceIdChange={setVoiceId}
            voiceLanguage={language}
            onVoiceLanguageChange={(value) => setLanguage(value as AmbientLanguage)}
            backgroundMusicEnabled={backgroundMusicEnabled}
            onBackgroundMusicEnabledChange={setBackgroundMusicEnabled}
            musicStyle={musicStyle}
            onMusicStyleChange={setMusicStyle}
            customMusicUrl={customMusicUrl}
            customMusicDuration={customMusicDuration}
            hasCustomMusic={hasCustomMusic}
            onCustomMusicChange={(url, duration) => {
              setCustomMusicUrl(url);
              setCustomMusicDuration(duration);
              setHasCustomMusic(true);
            }}
            onClearCustomMusic={() => {
              setCustomMusicUrl('');
              setCustomMusicDuration(0);
              setHasCustomMusic(false);
            }}
          />
        );
      case 5:
        // Build videoIdeas array for Step 5 (scheduled mode needs per-topic dates)
        const validVideoIdeas = videoIdeas
          .filter((t) => t.trim())
          .map((idea, index) => ({ idea, index }));
        
        return (
          <Step5SchedulePublishing
            automationMode={automationMode}
            onAutomationModeChange={setAutomationMode}
            // Continuous mode
            scheduleStartDate={scheduleStartDate}
            onScheduleStartDateChange={setScheduleStartDate}
            maxPerDay={maxPerDay}
            onMaxPerDayChange={setMaxPerDay}
            // Scheduled mode
            videoIdeas={validVideoIdeas}
            topicSchedules={topicSchedules}
            onTopicSchedulesChange={setTopicSchedules}
            // Publishing
            selectedPlatforms={selectedPlatforms}
            onSelectedPlatformsChange={setSelectedPlatforms}
          />
        );
      default:
        return null;
    }
  };

  return (
    <WizardLayout
      steps={wizardSteps}
      currentStep={currentStep}
      completedSteps={completedSteps}
      onStepClick={setCurrentStep}
      onBack={handleBack}
      onNext={handleNext}
      canGoBack={currentStep > 1}
      canGoNext={canProceedFromCurrentStep()}
      isFirstStep={currentStep === 1}
      isLastStep={currentStep === wizardSteps.length}
      isSubmitting={createCampaign.isPending}
      nextLabel={createCampaign.isPending ? "Creating..." : undefined}
      campaignName={campaignName || "New Video Campaign"}
      productionType="video"
    >
      {renderStep()}
    </WizardLayout>
  );
}
