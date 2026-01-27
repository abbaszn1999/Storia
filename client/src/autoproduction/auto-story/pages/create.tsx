import { useState } from "react";
import { useLocation } from "wouter";
import { FileText, Palette, Calendar, Share2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WizardLayout } from "../../shared/components/layout/wizard-layout";
import { Step2TemplateSelection } from "../components/wizard/step-2-template-selection";
import { Step3ContentSetup } from "../components/wizard/step-3-content-setup";
import { Step4StyleSettings } from "../components/wizard/step-4-style-settings";
import { useCreateStoryCampaign } from "../../shared/hooks";
import type { StoryTemplate } from "../types";

const wizardSteps = [
  { number: 1, title: "Template", icon: FileText, description: "Story structure" },
  { number: 2, title: "Content Setup", icon: Sparkles, description: "Topics & settings" },
  { number: 3, title: "Style", icon: Palette, description: "Visual & audio" },
  { number: 4, title: "Scheduling", icon: Calendar, description: "Timeline" },
  { number: 5, title: "Publishing", icon: Share2, description: "Platforms" },
];

export default function AutoStoryCreate() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Step 1: Template Selection (removed Type Selection)
  const [template, setTemplate] = useState<StoryTemplate>("problem-solution");

  // Step 3: Content Setup
  const [campaignName, setCampaignName] = useState("");
  const [topics, setTopics] = useState<string[]>([""]);
  const [duration, setDuration] = useState<30 | 45 | 60 | 90>(45);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1' | '4:5'>('9:16');
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
  const [transitionStyle, setTransitionStyle] = useState("fade");
  const [hasVoiceover, setHasVoiceover] = useState(true);
  const [voiceProfile, setVoiceProfile] = useState("narrator-soft");
  const [voiceVolume, setVoiceVolume] = useState(80);
  const [backgroundMusic, setBackgroundMusic] = useState("uplifting-corporate");
  const [musicVolume, setMusicVolume] = useState(40);
  
  // Step 3: Style Settings - NEW FIELDS
  const [imageResolution, setImageResolution] = useState("1k");
  const [videoResolution, setVideoResolution] = useState("720p");
  const [styleReferenceUrl, setStyleReferenceUrl] = useState("");
  const [characterReferenceUrl, setCharacterReferenceUrl] = useState("");

  // Step 5: Scheduling (TODO)
  const [scheduleStartDate, setScheduleStartDate] = useState("");
  const [scheduleEndDate, setScheduleEndDate] = useState("");
  const [maxPerDay, setMaxPerDay] = useState(1);

  // Step 6: Publishing (TODO)
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

    if (currentStep === 5) {
      // Last step - submit
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
      
      // Story settings
      storyTemplate: template,
      storyTemplateType: 'narrative',
      storyTopics: validTopics,
      batchSize: validTopics.length,
      
      // Technical
      storyDuration: duration,
      storyAspectRatio: aspectRatio,
      storyLanguage: language,
      
      // NEW: Pacing & Text Overlay
      storyPacing: pacing,
      storyTextOverlayEnabled: textOverlayEnabled,
      storyTextOverlayStyle: textOverlayEnabled ? textOverlayStyle : undefined,
      
      // Visual
      imageStyle,
      storyImageModel: imageModel,
      storyVideoModel: mediaType === 'animated' ? videoModel : undefined,
      storyMediaType: mediaType,
      storyTransition: mediaType === 'static' ? transitionStyle : undefined,
      
      // NEW: Resolutions
      storyImageResolution: imageResolution,
      storyVideoResolution: mediaType === 'animated' ? videoResolution : undefined,
      
      // NEW: Reference Images
      storyStyleReferenceUrl: styleReferenceUrl || undefined,
      storyCharacterReferenceUrl: characterReferenceUrl || undefined,
      
      // Audio
      storyHasVoiceover: hasVoiceover,
      storyVoiceProfile: hasVoiceover ? voiceProfile : undefined,
      storyVoiceVolume: voiceVolume,
      storyBackgroundMusicTrack: backgroundMusic !== 'none' ? backgroundMusic : undefined,
      storyMusicVolume: musicVolume,
      
      // Scheduling
      scheduleStartDate: scheduleStartDate ? new Date(scheduleStartDate) : undefined,
      scheduleEndDate: scheduleEndDate ? new Date(scheduleEndDate) : undefined,
      maxStoriesPerDay: maxPerDay,
      
      // Publishing
      selectedPlatforms,
      
      // Status
      status: 'draft',
      automationMode: 'manual',
    };

    createCampaign.mutate(data, {
      onSuccess: (campaign) => {
        toast({
          title: "Campaign Created",
          description: `${validTopics.length} stories will be generated.`,
        });
        navigate(`/autoproduction/story/${campaign.id}`);
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
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            language={language}
            onLanguageChange={setLanguage}
            pacing={pacing}
            onPacingChange={setPacing}
            textOverlayEnabled={textOverlayEnabled}
            onTextOverlayEnabledChange={setTextOverlayEnabled}
            textOverlayStyle={textOverlayStyle}
            onTextOverlayStyleChange={setTextOverlayStyle}
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
            transitionStyle={transitionStyle}
            onTransitionStyleChange={setTransitionStyle}
            aspectRatio={aspectRatio}
            imageResolution={imageResolution}
            onImageResolutionChange={setImageResolution}
            videoResolution={videoResolution}
            onVideoResolutionChange={setVideoResolution}
            styleReferenceUrl={styleReferenceUrl}
            onStyleReferenceUrlChange={setStyleReferenceUrl}
            characterReferenceUrl={characterReferenceUrl}
            onCharacterReferenceUrlChange={setCharacterReferenceUrl}
            hasVoiceover={hasVoiceover}
            onHasVoiceoverChange={setHasVoiceover}
            voiceProfile={voiceProfile}
            onVoiceProfileChange={setVoiceProfile}
            voiceVolume={voiceVolume}
            onVoiceVolumeChange={setVoiceVolume}
            backgroundMusic={backgroundMusic}
            onBackgroundMusicChange={setBackgroundMusic}
            musicVolume={musicVolume}
            onMusicVolumeChange={setMusicVolume}
          />
        );
      case 4:
        return (
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-display font-bold">Scheduling</h2>
            <p className="text-muted-foreground">TODO: Scheduling step</p>
          </div>
        );
      case 5:
        return (
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-display font-bold">Publishing</h2>
            <p className="text-muted-foreground">TODO: Publishing step</p>
          </div>
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
