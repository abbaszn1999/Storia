import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { FileText, Palette, CalendarClock, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/workspace-context";
import { WizardLayout } from "../../shared/components/layout/wizard-layout";
import { Step2TemplateSelection } from "../components/wizard/step-2-template-selection";
import { Step3ContentSetup } from "../components/wizard/step-3-content-setup";
import { Step4StyleSettings } from "../components/wizard/step-4-style-settings";
import { Step5SchedulePublishing } from "../../auto-video/components/wizard/shared/step-5-schedule-publishing";
import { useCreateStoryCampaign } from "../../shared/hooks";
import { isAutoAsmrTemplate } from "../types";
import type { StoryTemplate } from "../types";
import { DEFAULT_VOICE_BY_LANGUAGE } from "@/constants/elevenlabs-voices";

const wizardSteps = [
  { number: 1, title: "Template", icon: FileText, description: "Story structure" },
  { number: 2, title: "Content Setup", icon: Sparkles, description: "Topics & settings" },
  { number: 3, title: "Style", icon: Palette, description: "Visual & audio" },
  { number: 4, title: "Schedule & Publish", icon: CalendarClock, description: "Timeline & platforms" },
];

export default function AutoStoryCreate() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Step 1: Template Selection (removed Type Selection)
  const [template, setTemplate] = useState<StoryTemplate>("problem-solution");

  // Step 3: Content Setup
  const [campaignName, setCampaignName] = useState("");
  const [topics, setTopics] = useState<string[]>([""]);
  const [duration, setDuration] = useState<15 | 30 | 45 | 60>(30);
  const [aspectRatio, setAspectRatio] = useState<string>('9:16');
  const [language, setLanguage] = useState("en");
  
  // Step 2: Content Setup - NEW FIELDS
  const [pacing, setPacing] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [textOverlayEnabled, setTextOverlayEnabled] = useState(true);
  const [textOverlayStyle, setTextOverlayStyle] = useState<'modern' | 'cinematic' | 'bold'>('modern');

  // Step 4: Style Settings
  const [imageStyle, setImageStyle] = useState("photorealistic");
  const [imageModel, setImageModel] = useState("nano-banana");
  const [videoModel, setVideoModel] = useState("seedance-1.0-pro");
  const [mediaType, setMediaType] = useState<'static' | 'animated'>('static');
  const [animationType, setAnimationType] = useState<'transition' | 'image-to-video'>('transition');
  const [transitionStyle, setTransitionStyle] = useState("fade");
  const [hasVoiceover, setHasVoiceover] = useState(true);
  const [voiceId, setVoiceId] = useState(DEFAULT_VOICE_BY_LANGUAGE['en']);
  const [voiceVolume, setVoiceVolume] = useState(80);
  const [hasBackgroundMusic, setHasBackgroundMusic] = useState(true);
  const [backgroundMusic, setBackgroundMusic] = useState("cinematic");
  const [musicVolume, setMusicVolume] = useState(40);
  
  // Step 3: Style Settings - NEW FIELDS
  const [imageResolution, setImageResolution] = useState("1k");
  const [videoResolution, setVideoResolution] = useState("720p");
  const [styleReferenceUrl, setStyleReferenceUrl] = useState("");
  const [characterReferenceUrl, setCharacterReferenceUrl] = useState("");


  // Derived: is the current template auto-asmr?
  const isAsmr = isAutoAsmrTemplate(template);

  // Auto-select default voice when language changes
  useEffect(() => {
    const defaultVoice = DEFAULT_VOICE_BY_LANGUAGE[language];
    if (defaultVoice) {
      setVoiceId(defaultVoice);
    }
  }, [language]);

  // Auto-apply ASMR defaults when template changes
  useEffect(() => {
    if (isAsmr) {
      setMediaType('animated');
      setAnimationType('image-to-video');
      setHasVoiceover(false);
      setTextOverlayEnabled(false);
      setHasBackgroundMusic(false);
      setBackgroundMusic('none');
      if (duration === 30) setDuration(45);
    }
  }, [template]);

  // Step 4: Schedule & Publish (combined, like auto-video)
  const [automationMode, setAutomationMode] = useState<'continuous' | 'scheduled'>('continuous');
  const [scheduleStartDate, setScheduleStartDate] = useState("");
  const [maxPerDay, setMaxPerDay] = useState(1);
  const [topicSchedules, setTopicSchedules] = useState<Record<string, string>>({});
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const createCampaign = useCreateStoryCampaign();

  const handleNext = () => {
    // Validation
    if (currentStep === 2) {
      if (!campaignName.trim()) {
        toast({
          title: "Validation Error",
          description: "Please provide a campaign name.",
          variant: "destructive",
        });
        return;
      }
      const validTopics = topics.filter(t => t.trim());
      if (validTopics.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please add at least one topic.",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep === 4) {
      // Last step - validate & submit
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
        const validTopicsForSchedule = topics.filter((t) => t.trim());
        const scheduledCount = Object.values(topicSchedules).filter(Boolean).length;
        if (scheduledCount < validTopicsForSchedule.length) {
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

    setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    const validTopics = topics.filter(t => t.trim());
    
    const data = {
      type: 'auto-story',
      name: campaignName,
      workspaceId: currentWorkspace?.id,
      
      // Story settings
      storyTemplate: template,
      storyTemplateType: isAsmr ? 'auto-asmr' : 'narrative',
      storyTopics: validTopics,
      batchSize: validTopics.length,
      
      // Technical
      storyDuration: duration,
      storyAspectRatio: aspectRatio,
      storyLanguage: language,
      
      // Pacing & Text Overlay (not applicable for ASMR, disabled when voiceover is off)
      storyPacing: isAsmr ? undefined : pacing,
      storyTextOverlayEnabled: isAsmr ? false : (hasVoiceover ? textOverlayEnabled : false),
      storyTextOverlayStyle: isAsmr ? undefined : (hasVoiceover && textOverlayEnabled ? textOverlayStyle : undefined),
      
      // Visual
      imageStyle,
      storyImageModel: imageModel,
      storyVideoModel: (mediaType === 'animated' && animationType === 'image-to-video') ? videoModel : undefined,
      storyMediaType: mediaType,
      storyTransition: transitionStyle || 'fade',
      
      // NEW: Resolutions
      storyImageResolution: imageResolution,
      storyVideoResolution: (mediaType === 'animated' && animationType === 'image-to-video') ? videoResolution : undefined,
      
      // NEW: Reference Images
      storyStyleReferenceUrl: styleReferenceUrl || undefined,
      storyCharacterReferenceUrl: characterReferenceUrl || undefined,
      
      // Audio
      storyHasVoiceover: isAsmr ? false : hasVoiceover,
      storyVoiceId: isAsmr ? undefined : (hasVoiceover ? voiceId : undefined),
      storyVoiceVolume: isAsmr ? 0 : voiceVolume,
      storyBackgroundMusicTrack: hasBackgroundMusic ? backgroundMusic : 'none',
      storyMusicVolume: musicVolume,
      
      // Scheduling
      scheduleStartDate: scheduleStartDate ? new Date(scheduleStartDate) : undefined,
      maxStoriesPerDay: maxPerDay,
      itemSchedules: automationMode === 'scheduled' ? topicSchedules : undefined,
      
      // Publishing
      selectedPlatforms,
      
      // Status
      status: 'draft',
      automationMode,
    };

    console.log('[create] Submitting campaign settings:', {
      storyHasVoiceover: data.storyHasVoiceover,
      storyBackgroundMusicTrack: data.storyBackgroundMusicTrack,
      storyVideoModel: data.storyVideoModel,
      storyMediaType: data.storyMediaType,
      hasVoiceover,
      hasBackgroundMusic,
      mediaType,
      animationType,
    });
    createCampaign.mutate(data, {
      onSuccess: (campaign) => {
        toast({
          title: "Campaign Created",
          description: `${validTopics.length} stories will be generated.`,
        });
        navigate(`/autoproduction/story/${campaign.id}?autostart=true`);
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
    switch (currentStep) {
      case 1:
        return <Step2TemplateSelection value={template} onChange={setTemplate} />;
      case 2:
        return (
          <Step3ContentSetup
            campaignName={campaignName}
            onCampaignNameChange={setCampaignName}
            topics={topics}
            onTopicsChange={setTopics}
            duration={duration}
            onDurationChange={setDuration}
            language={language}
            onLanguageChange={setLanguage}
            pacing={pacing}
            onPacingChange={setPacing}
            hasVoiceover={hasVoiceover}
            onHasVoiceoverChange={setHasVoiceover}
            voiceId={voiceId}
            onVoiceIdChange={setVoiceId}
            textOverlayEnabled={textOverlayEnabled}
            onTextOverlayEnabledChange={setTextOverlayEnabled}
            textOverlayStyle={textOverlayStyle}
            onTextOverlayStyleChange={setTextOverlayStyle}
            hasBackgroundMusic={hasBackgroundMusic}
            onHasBackgroundMusicChange={setHasBackgroundMusic}
            backgroundMusic={backgroundMusic}
            onBackgroundMusicChange={setBackgroundMusic}
            musicVolume={musicVolume}
            onMusicVolumeChange={setMusicVolume}
            isAutoAsmr={isAsmr}
          />
        );
      case 3:
        return (
          <Step4StyleSettings
            imageStyle={imageStyle}
            onImageStyleChange={setImageStyle}
            imageModel={imageModel}
            onImageModelChange={setImageModel}
            videoModel={videoModel}
            onVideoModelChange={setVideoModel}
            mediaType={mediaType}
            onMediaTypeChange={setMediaType}
            animationType={animationType}
            onAnimationTypeChange={setAnimationType}
            transitionStyle={transitionStyle}
            onTransitionStyleChange={setTransitionStyle}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            imageResolution={imageResolution}
            onImageResolutionChange={setImageResolution}
            videoResolution={videoResolution}
            onVideoResolutionChange={setVideoResolution}
            styleReferenceUrl={styleReferenceUrl}
            onStyleReferenceUrlChange={setStyleReferenceUrl}
            characterReferenceUrl={characterReferenceUrl}
            onCharacterReferenceUrlChange={setCharacterReferenceUrl}
            isAutoAsmr={isAsmr}
          />
        );
      case 4:
        const validStoryTopics = topics
          .filter((t) => t.trim())
          .map((topic, index) => ({ idea: topic, index }));
        
        return (
          <Step5SchedulePublishing
            automationMode={automationMode}
            onAutomationModeChange={setAutomationMode}
            scheduleStartDate={scheduleStartDate}
            onScheduleStartDateChange={setScheduleStartDate}
            maxPerDay={maxPerDay}
            onMaxPerDayChange={setMaxPerDay}
            videoIdeas={validStoryTopics}
            topicSchedules={topicSchedules}
            onTopicSchedulesChange={setTopicSchedules}
            selectedPlatforms={selectedPlatforms}
            onSelectedPlatformsChange={setSelectedPlatforms}
          />
        );
      default:
        return null;
    }
  };

  const validTopicCount = topics.filter(t => t.trim()).length;

  return (
    <WizardLayout
      steps={wizardSteps}
      currentStep={currentStep}
      completedSteps={completedSteps}
      onStepClick={setCurrentStep}
      onBack={handleBack}
      onNext={handleNext}
      canGoBack={currentStep > 1}
      canGoNext={true}
      isFirstStep={currentStep === 1}
      isLastStep={currentStep === wizardSteps.length}
      isSubmitting={createCampaign.isPending}
      nextLabel={createCampaign.isPending ? "Creating..." : undefined}
      campaignName={campaignName || "New Campaign"}
    >
      {renderStep()}
    </WizardLayout>
  );
}
