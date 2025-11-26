import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Check,
  Layers,
  Film,
  Grid3X3,
  FileText,
  Settings,
  Users,
  Calendar,
  Share2,
  ChevronRight
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Step1TypeSelection } from "@/components/production/step1-type-selection";
import { Step2VideoMode } from "@/components/production/step2-video-mode";
import { Step3NarrativeMode } from "@/components/production/step3-narrative-mode";
import { Step4CampaignBasics } from "@/components/production/step4-campaign-basics";
import { Step5VideoSettings } from "@/components/production/step5-video-settings";
import { Step6Casting } from "@/components/production/step6-casting";
import { Step7Scheduling } from "@/components/production/step7-scheduling";
import { Step8Publishing } from "@/components/production/step8-publishing";

const wizardSteps = [
  { number: 1, title: "Content Type", icon: Layers, description: "Video or Story" },
  { number: 2, title: "Video Mode", icon: Film, description: "Production style" },
  { number: 3, title: "Narrative Mode", icon: Grid3X3, description: "Frame workflow" },
  { number: 4, title: "Campaign Basics", icon: FileText, description: "Name & ideas" },
  { number: 5, title: "Video Settings", icon: Settings, description: "Technical specs" },
  { number: 6, title: "Casting", icon: Users, description: "Characters & locations" },
  { number: 7, title: "Scheduling", icon: Calendar, description: "Timeline & automation" },
  { number: 8, title: "Publishing", icon: Share2, description: "Platforms" },
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

  // Step 4: Ambient Mode - Atmosphere
  const [ambientCategory, setAmbientCategory] = useState<string>("nature");
  const [ambientMoods, setAmbientMoods] = useState<string[]>([]);

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
  const [imageCustomInstructions, setImageCustomInstructions] = useState("");
  const [videoCustomInstructions, setVideoCustomInstructions] = useState("");

  // Step 5: Ambient Mode - Flow Design
  const [ambientAnimationMode, setAmbientAnimationMode] = useState("animate");
  const [ambientPacing, setAmbientPacing] = useState(30);
  const [ambientSegmentCount, setAmbientSegmentCount] = useState(5);
  const [ambientTransitionStyle, setAmbientTransitionStyle] = useState("crossfade");
  const [ambientVariationType, setAmbientVariationType] = useState("evolving");
  const [ambientCameraMotion, setAmbientCameraMotion] = useState("static");
  const [ambientLoopMode, setAmbientLoopMode] = useState("seamless");
  const [ambientVisualRhythm, setAmbientVisualRhythm] = useState("constant");
  const [ambientEnableParallax, setAmbientEnableParallax] = useState(false);

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
      const isAmbient = videoMode === "ambient_visual";
      
      const data = {
        name: campaignName,
        storyIdeas: storyIdeas.filter(idea => idea.trim() !== ""),
        videoMode,
        narrativeMode: isAmbient ? undefined : narrativeMode,
        narrationStyle: videoMode === "character_vlog" ? narrationStyle : undefined,
        mainCharacterId: videoMode === "character_vlog" && mainCharacterId ? mainCharacterId : undefined,
        automationMode,
        aspectRatio,
        duration: isAmbient ? duration : duration,
        language,
        artStyle: styleMode === "preset" ? artStyle : undefined,
        styleReferenceImageUrl: styleMode === "reference" ? styleReferenceImageUrl : undefined,
        tone: isAmbient ? undefined : tone,
        genre: isAmbient ? undefined : genre,
        targetAudience: targetAudience || undefined,
        resolution,
        animateImages: isAmbient ? ambientAnimationMode === "animate" : animateImages,
        hasVoiceOver,
        hasSoundEffects,
        hasBackgroundMusic,
        scripterModel,
        imageModel,
        videoModel,
        imageCustomInstructions: imageCustomInstructions || undefined,
        videoCustomInstructions: videoCustomInstructions || undefined,
        voiceModel: hasVoiceOver ? voiceModel : undefined,
        voiceActorId: hasVoiceOver ? voiceActorId : undefined,
        scheduleStartDate: scheduleStartDate || undefined,
        scheduleEndDate: scheduleEndDate || undefined,
        preferredPublishHours: publishHoursMode === "user" ? preferredPublishHours : ["AI"],
        maxVideosPerDay,
        selectedPlatforms,
        // Ambient mode specific fields
        ...(isAmbient && {
          ambientCategory,
          ambientMoods,
          ambientAnimationMode,
          ambientPacing,
          ambientSegmentCount,
          ambientTransitionStyle,
          ambientVariationType,
          ambientCameraMotion,
          ambientLoopMode,
          ambientVisualRhythm,
          ambientEnableParallax,
        }),
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
    const isAmbient = videoMode === "ambient_visual";
    
    if (currentStep === 4 && (!campaignName || storyIdeas.filter(idea => idea.trim() !== "").length === 0)) {
      toast({
        title: "Validation Error",
        description: isAmbient 
          ? "Please provide a campaign name and at least one atmosphere description."
          : "Please provide a campaign name and at least one story idea.",
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

  const getStepSummary = (stepNumber: number): string | null => {
    const isAmbient = videoMode === "ambient_visual";
    
    switch (stepNumber) {
      case 1:
        return contentType === "video" ? "Video" : "Story";
      case 2:
        return videoMode === "narrative" 
          ? "Narrative" 
          : videoMode === "character_vlog" 
            ? "Character Vlog" 
            : videoMode === "ambient_visual"
              ? "Ambient"
              : videoMode;
      case 3:
        return isAmbient ? "N/A" : narrativeMode === "image-reference" ? "Image Ref" : "Start-End";
      case 4:
        const ideaCount = storyIdeas.filter(i => i.trim()).length;
        return campaignName ? `${ideaCount} ${isAmbient ? "atmos" : "ideas"}` : null;
      case 5:
        return isAmbient 
          ? `${aspectRatio} • ${Math.floor(duration / 60)}min` 
          : `${aspectRatio} • ${resolution}`;
      case 6:
        if (isAmbient) return "N/A";
        const charCount = selectedCharacters.length;
        const locCount = selectedLocations.length;
        return charCount > 0 || locCount > 0 ? `${charCount} chars, ${locCount} locs` : null;
      case 7:
        return scheduleStartDate ? `${maxVideosPerDay}/day` : null;
      case 8:
        return selectedPlatforms.length > 0 ? `${selectedPlatforms.length} platforms` : null;
      default:
        return null;
    }
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
            videoMode={videoMode}
            ambientCategory={ambientCategory}
            onAmbientCategoryChange={setAmbientCategory}
            ambientMoods={ambientMoods}
            onAmbientMoodsChange={setAmbientMoods}
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
            imageCustomInstructions={imageCustomInstructions}
            onImageCustomInstructionsChange={setImageCustomInstructions}
            videoCustomInstructions={videoCustomInstructions}
            onVideoCustomInstructionsChange={setVideoCustomInstructions}
            ambientAnimationMode={ambientAnimationMode}
            onAmbientAnimationModeChange={setAmbientAnimationMode}
            ambientPacing={ambientPacing}
            onAmbientPacingChange={setAmbientPacing}
            ambientSegmentCount={ambientSegmentCount}
            onAmbientSegmentCountChange={setAmbientSegmentCount}
            ambientTransitionStyle={ambientTransitionStyle}
            onAmbientTransitionStyleChange={setAmbientTransitionStyle}
            ambientVariationType={ambientVariationType}
            onAmbientVariationTypeChange={setAmbientVariationType}
            ambientCameraMotion={ambientCameraMotion}
            onAmbientCameraMotionChange={setAmbientCameraMotion}
            ambientLoopMode={ambientLoopMode}
            onAmbientLoopModeChange={setAmbientLoopMode}
            ambientVisualRhythm={ambientVisualRhythm}
            onAmbientVisualRhythmChange={setAmbientVisualRhythm}
            ambientEnableParallax={ambientEnableParallax}
            onAmbientEnableParallaxChange={setAmbientEnableParallax}
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

  const validStoryCount = storyIdeas.filter(i => i.trim()).length;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 border-r bg-muted/30 flex flex-col">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg">New Campaign</h1>
                <p className="text-xs text-muted-foreground">AI Production Wizard</p>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <nav className="p-4 space-y-1">
              {wizardSteps.map((step) => {
                const isCompleted = currentStep > step.number;
                const isCurrent = currentStep === step.number;
                const summary = getStepSummary(step.number);
                const StepIcon = step.icon;

                return (
                  <button
                    key={step.number}
                    onClick={() => {
                      if (isCompleted || isCurrent) {
                        setCurrentStep(step.number);
                      }
                    }}
                    disabled={!isCompleted && !isCurrent}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all ${
                      isCurrent
                        ? "bg-primary/10 border border-primary/20"
                        : isCompleted
                        ? "hover:bg-muted cursor-pointer"
                        : "opacity-50 cursor-not-allowed"
                    }`}
                    data-testid={`nav-step-${step.number}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted-foreground/20 text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${
                            isCurrent ? "text-foreground" : isCompleted ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {step.title}
                        </span>
                        {isCurrent && (
                          <ChevronRight className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      {summary && isCompleted ? (
                        <Badge variant="secondary" className="mt-1 text-xs font-normal">
                          {summary}
                        </Badge>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </ScrollArea>

          <div className="p-4 border-t bg-muted/50">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Progress</span>
                <span className="font-medium">{currentStep} of 8</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(currentStep / 8) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-8 max-w-4xl mx-auto">
              {renderStep()}
            </div>
          </ScrollArea>

          <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="px-8 py-4">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex items-center gap-6">
                  <Button
                    variant="ghost"
                    onClick={currentStep === 1 ? () => navigate("/production") : handleBack}
                    data-testid="button-back"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {currentStep === 1 ? "Cancel" : "Back"}
                  </Button>

                  <Separator orientation="vertical" className="h-6" />

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {validStoryCount > 0 && (
                      <span>{validStoryCount} video{validStoryCount !== 1 ? "s" : ""}</span>
                    )}
                    {selectedPlatforms.length > 0 && (
                      <span>{selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? "s" : ""}</span>
                    )}
                    {scheduleStartDate && scheduleEndDate && (
                      <span>{maxVideosPerDay}/day</span>
                    )}
                  </div>
                </div>

                {currentStep < 8 ? (
                  <Button onClick={handleNext} data-testid="button-next">
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={createCampaign.isPending}
                    className="min-w-[160px]"
                    data-testid="button-create-campaign"
                  >
                    {createCampaign.isPending ? (
                      "Creating..."
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Create Campaign
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
