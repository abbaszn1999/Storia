import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, ArrowRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { WizardProgress } from "@/components/production/wizard-progress";
import { Step1TypeSelection } from "@/components/production/step1-type-selection";
import { Step2VideoMode } from "@/components/production/step2-video-mode";
import { Step3NarrativeMode } from "@/components/production/step3-narrative-mode";
import { Step4CampaignBasics } from "@/components/production/step4-campaign-basics";
import { Step5VideoSettings } from "@/components/production/step5-video-settings";
import { Step6Casting } from "@/components/production/step6-casting";
import { Step7Scheduling } from "@/components/production/step7-scheduling";
import { Step8Publishing } from "@/components/production/step8-publishing";

const wizardSteps = [
  { number: 1, title: "Type" },
  { number: 2, title: "Video Mode" },
  { number: 3, title: "Narrative Mode" },
  { number: 4, title: "Basics" },
  { number: 5, title: "Video Settings" },
  { number: 6, title: "Casting" },
  { number: 7, title: "Scheduling" },
  { number: 8, title: "Publishing" },
];

export default function ProductionCampaignCreate() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Type Selection
  const [contentType, setContentType] = useState<"video" | "story">("video");

  // Step 2: Video Mode Selection
  const [videoMode, setVideoMode] = useState<string>("narrative");

  // Step 3: Narrative Mode Selection
  const [narrativeMode, setNarrativeMode] = useState<"image-reference" | "start-end-frame">("image-reference");
  const [narrationStyle, setNarrationStyle] = useState<"third-person" | "first-person">("first-person");

  // Step 4: Campaign Basics
  const [campaignName, setCampaignName] = useState("");
  const [storyIdeas, setStoryIdeas] = useState<string[]>([""]);
  const [scripterModel, setScripterModel] = useState("gpt-4");

  // Step 5: Video Settings
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState(60);
  const [language, setLanguage] = useState("en");
  const [styleMode, setStyleMode] = useState<"preset" | "reference">("preset");
  const [artStyle, setArtStyle] = useState("cinematic");
  const [styleReferenceImageUrl, setStyleReferenceImageUrl] = useState("");
  const [tone, setTone] = useState("dramatic");
  const [genre, setGenre] = useState("action");
  const [imageModel, setImageModel] = useState("imagen-4");
  const [videoModel, setVideoModel] = useState("kling");
  const [animateImages, setAnimateImages] = useState(true);
  const [hasVoiceOver, setHasVoiceOver] = useState(true);
  const [voiceModel, setVoiceModel] = useState("eleven-labs");
  const [voiceActorId, setVoiceActorId] = useState("actor-1");
  const [hasSoundEffects, setHasSoundEffects] = useState(true);
  const [hasBackgroundMusic, setHasBackgroundMusic] = useState(true);
  const [resolution, setResolution] = useState("1080p");
  const [targetAudience, setTargetAudience] = useState("");

  // Step 6: Casting
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [mainCharacterId, setMainCharacterId] = useState<string | null>(null);

  // Step 7: Scheduling
  const [scheduleStartDate, setScheduleStartDate] = useState("");
  const [scheduleEndDate, setScheduleEndDate] = useState("");
  const [automationMode, setAutomationMode] = useState<"manual" | "auto">("manual");
  const [publishHoursMode, setPublishHoursMode] = useState<"user" | "ai">("ai");
  const [preferredPublishHours, setPreferredPublishHours] = useState<number[]>([]);
  const [maxVideosPerDay, setMaxVideosPerDay] = useState(1);

  // Step 8: Publishing
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const createCampaign = useMutation({
    mutationFn: async () => {
      const data = {
        name: campaignName,
        storyIdeas: storyIdeas.filter(idea => idea.trim() !== ""),
        videoMode,
        narrativeMode,
        narrationStyle: videoMode === "character_vlog" ? narrationStyle : undefined,
        mainCharacterId: videoMode === "character_vlog" && mainCharacterId ? mainCharacterId : undefined,
        automationMode,
        aspectRatio,
        duration,
        language,
        artStyle: styleMode === "preset" ? artStyle : undefined,
        styleReferenceImageUrl: styleMode === "reference" ? styleReferenceImageUrl : undefined,
        tone,
        genre,
        targetAudience: targetAudience || undefined,
        resolution,
        animateImages,
        hasVoiceOver,
        hasSoundEffects,
        hasBackgroundMusic,
        scripterModel,
        imageModel,
        videoModel,
        voiceModel: hasVoiceOver ? voiceModel : undefined,
        voiceActorId: hasVoiceOver ? voiceActorId : undefined,
        scheduleStartDate: scheduleStartDate || undefined,
        scheduleEndDate: scheduleEndDate || undefined,
        preferredPublishHours: publishHoursMode === "user" ? preferredPublishHours : ["AI"],
        maxVideosPerDay,
        selectedPlatforms,
      };

      const res = await apiRequest("POST", "/api/production-campaigns", data);
      return await res.json();
    },
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-campaigns"] });
      toast({
        title: "Campaign created",
        description: "Your production campaign has been created successfully.",
      });
      navigate(`/production/${campaign.id}/review`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 4 && (!campaignName || storyIdeas.filter(idea => idea.trim() !== "").length === 0)) {
      toast({
        title: "Validation Error",
        description: "Please provide a campaign name and at least one story idea.",
        variant: "destructive",
      });
      return;
    }

    if (currentStep === 6 && videoMode === "character_vlog") {
      if (selectedCharacters.length === 0) {
        toast({
          title: "Validation Error",
          description: "Character Vlog mode requires at least one character. Please select characters first.",
          variant: "destructive",
        });
        return;
      }
      if (!mainCharacterId) {
        toast({
          title: "Validation Error",
          description: "Please select a main character for your vlog.",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep === 7) {
      const validIdeas = storyIdeas.filter(idea => idea.trim() !== "").length;
      if (scheduleStartDate && scheduleEndDate && maxVideosPerDay > 0) {
        const start = new Date(scheduleStartDate);
        const end = new Date(scheduleEndDate);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const maxPossibleVideos = daysDiff * maxVideosPerDay;

        if (maxPossibleVideos < validIdeas) {
          toast({
            title: "Validation Error",
            description: `Cannot fit ${validIdeas} videos in ${daysDiff} days with max ${maxVideosPerDay} video(s) per day.`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one publishing platform.",
        variant: "destructive",
      });
      return;
    }
    createCampaign.mutate();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1TypeSelection value={contentType} onChange={setContentType} />;
      case 2:
        return <Step2VideoMode videoMode={videoMode} onVideoModeChange={setVideoMode} />;
      case 3:
        return <Step3NarrativeMode value={narrativeMode} onChange={setNarrativeMode} />;
      case 4:
        return (
          <Step4CampaignBasics
            campaignName={campaignName}
            onCampaignNameChange={setCampaignName}
            storyIdeas={storyIdeas}
            onStoryIdeasChange={setStoryIdeas}
            scripterModel={scripterModel}
            onScripterModelChange={setScripterModel}
          />
        );
      case 5:
        return (
          <Step5VideoSettings
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            duration={duration}
            onDurationChange={setDuration}
            language={language}
            onLanguageChange={setLanguage}
            styleMode={styleMode}
            onStyleModeChange={setStyleMode}
            artStyle={artStyle}
            onArtStyleChange={setArtStyle}
            styleReferenceImageUrl={styleReferenceImageUrl}
            onStyleReferenceImageUrlChange={setStyleReferenceImageUrl}
            tone={tone}
            onToneChange={setTone}
            genre={genre}
            onGenreChange={setGenre}
            imageModel={imageModel}
            onImageModelChange={setImageModel}
            videoModel={videoModel}
            onVideoModelChange={setVideoModel}
            animateImages={animateImages}
            onAnimateImagesChange={setAnimateImages}
            hasVoiceOver={hasVoiceOver}
            onHasVoiceOverChange={setHasVoiceOver}
            voiceModel={voiceModel}
            onVoiceModelChange={setVoiceModel}
            voiceActorId={voiceActorId}
            onVoiceActorIdChange={setVoiceActorId}
            hasSoundEffects={hasSoundEffects}
            onHasSoundEffectsChange={setHasSoundEffects}
            hasBackgroundMusic={hasBackgroundMusic}
            onHasBackgroundMusicChange={setHasBackgroundMusic}
            resolution={resolution}
            onResolutionChange={setResolution}
            targetAudience={targetAudience}
            onTargetAudienceChange={setTargetAudience}
            videoMode={videoMode}
            narrationStyle={narrationStyle}
            onNarrationStyleChange={setNarrationStyle}
          />
        );
      case 6:
        return (
          <Step6Casting
            selectedCharacters={selectedCharacters}
            onSelectedCharactersChange={setSelectedCharacters}
            selectedLocations={selectedLocations}
            onSelectedLocationsChange={setSelectedLocations}
            videoMode={videoMode}
            mainCharacterId={mainCharacterId}
            onMainCharacterIdChange={setMainCharacterId}
          />
        );
      case 7:
        return (
          <Step7Scheduling
            scheduleStartDate={scheduleStartDate}
            onScheduleStartDateChange={setScheduleStartDate}
            scheduleEndDate={scheduleEndDate}
            onScheduleEndDateChange={setScheduleEndDate}
            automationMode={automationMode}
            onAutomationModeChange={setAutomationMode}
            publishHoursMode={publishHoursMode}
            onPublishHoursModeChange={setPublishHoursMode}
            preferredPublishHours={preferredPublishHours}
            onPreferredPublishHoursChange={setPreferredPublishHours}
            maxVideosPerDay={maxVideosPerDay}
            onMaxVideosPerDayChange={setMaxVideosPerDay}
            videoCount={storyIdeas.filter(idea => idea.trim() !== "").length}
          />
        );
      case 8:
        return (
          <Step8Publishing
            selectedPlatforms={selectedPlatforms}
            onSelectedPlatformsChange={setSelectedPlatforms}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          Create Auto Production Campaign
        </h1>
        <p className="text-muted-foreground mt-2">
          Set up an automated video production campaign powered by AI
        </p>
      </div>

      <WizardProgress currentStep={currentStep} steps={wizardSteps} />

      <Card>
        <CardContent className="pt-6">
          {renderStep()}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? () => navigate("/production") : handleBack}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>

        {currentStep < 8 ? (
          <Button onClick={handleNext} data-testid="button-next">
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={createCampaign.isPending}
            data-testid="button-create-campaign"
          >
            {createCampaign.isPending ? "Creating..." : "Create Campaign"}
          </Button>
        )}
      </div>
    </div>
  );
}
