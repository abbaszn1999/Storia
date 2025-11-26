import { useState, useEffect } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { STORY_TEMPLATES } from "@/constants/story-templates";
import { ConceptScript } from "@/components/story/concept-script";
import { StoryboardEditor, type StoryScene } from "@/components/story/storyboard-editor";
import { AudioSettings } from "@/components/story/audio-settings";
import { ExportVideo } from "@/components/story/export-video";

const STEPS = [
  { id: "concept", label: "Concept & Script" },
  { id: "storyboard", label: "Storyboard" },
  { id: "audio", label: "Audio" },
  { id: "export", label: "Preview & Export" },
];

export default function StoryCreate() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const templateId = params.template as string;
  
  const template = STORY_TEMPLATES.find(t => t.id === templateId);
  
  const [activeStep, setActiveStep] = useState("concept");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  
  const [topic, setTopic] = useState("");
  const [generatedScript, setGeneratedScript] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [duration, setDuration] = useState(30);
  
  const [scenes, setScenes] = useState<StoryScene[]>([]);
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(true);
  
  const [voiceover, setVoiceover] = useState("");
  const [backgroundMusic, setBackgroundMusic] = useState("");
  const [voiceVolume, setVoiceVolume] = useState(80);
  const [musicVolume, setMusicVolume] = useState(40);

  const [previousScript, setPreviousScript] = useState("");

  useEffect(() => {
    if (generatedScript && generatedScript !== previousScript) {
      const sceneBlocks = generatedScript.split(/Scene \d+:/).filter(Boolean);
      const sceneCount = sceneBlocks.length || 4;
      const sceneDuration = Math.floor(duration / sceneCount);
      
      const parsedScenes: StoryScene[] = sceneBlocks.map((sceneText, index) => {
        const lines = sceneText.trim().split('\n');
        
        const visualLine = lines.find(l => l.includes('[Visual:')) || "";
        const narratorLine = lines.find(l => l.includes('Narrator:')) || "";
        const durationLine = lines.find(l => l.includes('Duration:')) || "";
        
        const visualPrompt = visualLine
          .replace(/\[Visual:\s*/, "")
          .replace(/\]\s*$/, "")
          .trim();
        
        const narration = narratorLine
          .replace(/Narrator:\s*"?/, "")
          .replace(/"?\s*$/, "")
          .trim();
        
        const parsedDuration = parseInt(durationLine.match(/\d+/)?.[0] || String(sceneDuration));
        
        return {
          id: `scene-${crypto.randomUUID()}`,
          sceneNumber: index + 1,
          narration,
          visualPrompt: visualPrompt || `Scene ${index + 1} visual for ${topic}`,
          imageUrl: undefined,
          videoUrl: undefined,
          isAnimated: false,
          transition: "fade",
          duration: parsedDuration,
          voiceoverEnabled: true,
        };
      });
      
      if (parsedScenes.length > 0) {
        setScenes(parsedScenes);
      }
      setPreviousScript(generatedScript);
    }
  }, [generatedScript, previousScript, topic]);

  useEffect(() => {
    if (scenes.length > 0) {
      const sceneDuration = Math.floor(duration / scenes.length);
      setScenes(prev => prev.map(scene => ({
        ...scene,
        duration: sceneDuration,
      })));
    }
  }, [duration]);

  const isStepCompleted = (stepId: string) => completedSteps.includes(stepId);
  const currentStepIndex = STEPS.findIndex((s) => s.id === activeStep);

  const markStepComplete = () => {
    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps([...completedSteps, activeStep]);
    }
  };

  const handleNext = () => {
    markStepComplete();
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setActiveStep(STEPS[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setActiveStep(STEPS[prevIndex].id);
    }
  };

  const handleExport = () => {
    markStepComplete();
    setLocation("/stories");
  };

  if (!template) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Template not found</h1>
          <Link href="/stories">
            <Button className="mt-4">Back to Templates</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild data-testid="button-back-to-stories">
                <Link href="/stories">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              
              <div className="h-6 w-px bg-border" />
              
              <div>
                <h1 className="text-sm font-semibold">New Story</h1>
                <p className="text-xs text-muted-foreground">{template.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {STEPS.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => {
                    if (isStepCompleted(step.id) || step.id === activeStep) {
                      setActiveStep(step.id);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : isStepCompleted(step.id)
                      ? "bg-muted text-foreground hover-elevate cursor-pointer"
                      : "text-muted-foreground cursor-default"
                  }`}
                  disabled={!isStepCompleted(step.id) && step.id !== activeStep}
                  data-testid={`button-step-${step.id}`}
                >
                  {isStepCompleted(step.id) && (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span className="whitespace-nowrap hidden md:inline">{step.label}</span>
                  <span className="whitespace-nowrap md:hidden">{index + 1}</span>
                </button>
              ))}
            </div>

            <div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          {activeStep === "concept" && (
            <ConceptScript
              onNext={handleNext}
              onBack={() => setLocation("/stories")}
              topic={topic}
              setTopic={setTopic}
              generatedScript={generatedScript}
              setGeneratedScript={setGeneratedScript}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              duration={duration}
              setDuration={setDuration}
              templateName={template.name}
              templateStructure={template.structure}
            />
          )}
          
          {activeStep === "storyboard" && (
            <StoryboardEditor
              onNext={handleNext}
              onBack={handleBack}
              scenes={scenes}
              setScenes={setScenes}
              aspectRatio={aspectRatio}
              voiceoverEnabled={voiceoverEnabled}
              setVoiceoverEnabled={setVoiceoverEnabled}
            />
          )}
          
          {activeStep === "audio" && (
            <AudioSettings
              onNext={handleNext}
              onBack={handleBack}
              voiceover={voiceover}
              setVoiceover={setVoiceover}
              backgroundMusic={backgroundMusic}
              setBackgroundMusic={setBackgroundMusic}
              voiceVolume={voiceVolume}
              setVoiceVolume={setVoiceVolume}
              musicVolume={musicVolume}
              setMusicVolume={setMusicVolume}
              scenes={scenes}
              voiceoverEnabled={voiceoverEnabled}
            />
          )}
          
          {activeStep === "export" && (
            <ExportVideo
              onBack={handleBack}
              onExport={handleExport}
              sceneCount={scenes.length}
              templateName={template.name}
              aspectRatio={aspectRatio}
              duration={duration}
              scenes={scenes}
            />
          )}
        </div>
      </main>
    </div>
  );
}
