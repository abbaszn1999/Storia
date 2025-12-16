// Story Create - Professional Multi-Step Experience
// Uses the new Story Studio components for a polished, immersive flow
// ═══════════════════════════════════════════════════════════════════════════

import { useParams, useLocation } from "wouter";
import { STORY_TEMPLATES } from "@/constants/story-templates";
import { 
  StudioLayout, 
  ConceptStep,
  ScriptStep,
  StoryboardStep, 
  AudioStep, 
  ExportStep,
  useStoryStudio,
  type StoryTemplate as StudioTemplate
} from "@/components/story-studio";
import { FullScreenLoading } from "@/components/story-studio/shared/FullScreenLoading";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

// Map story template to studio template format
const mapToStudioTemplate = (template: typeof STORY_TEMPLATES[0]): StudioTemplate => ({
  id: template.id,
  name: template.name,
  structure: template.structure || [],
  iconColor: template.iconColor,
});

// Template to accent color mapping
const templateAccentMap: Record<string, string> = {
  'problem-solution': 'orange',
  'tease-reveal': 'violet',
  'before-after': 'blue',
  'myth-busting': 'rose',
  'asmr-sensory': 'primary',
};

export default function StoryCreate() {
  const params = useParams();
  const [, navigate] = useLocation();
  const templateId = params.template as string;
  
  // Find the template from constants
  const rawTemplate = STORY_TEMPLATES.find(t => t.id === templateId);
  
  // Convert to studio template format
  const template = rawTemplate ? mapToStudioTemplate(rawTemplate) : null;
  
  // Use the story studio hook for state management
  const studio = useStoryStudio(template);
  
  // Get accent color for template
  const accentColor = templateAccentMap[templateId] || 'primary';

  // Check if we can proceed to next step
  const canProceedFromCurrentStep = studio.canProceed(studio.state.currentStep);

  // Get next button label based on current step
  const getNextLabel = () => {
    switch (studio.state.currentStep) {
      case 'concept':
        return 'Go to Script';
      case 'script':
        return studio.state.scenes.length > 0 ? 'Continue to Storyboard' : 'Generate Scenes First';
      case 'storyboard':
        return studio.state.scenes.length > 0 ? 'Continue to Audio' : 'Add Scenes First';
      case 'audio':
        return 'Continue to Export';
      case 'export':
        return 'Export Video';
      default:
        return 'Continue';
    }
  };

  // Handle navigation
  const handleStepClick = (stepId: typeof studio.state.currentStep) => {
    studio.goToStep(stepId);
  };

  const handleNext = () => {
    if (studio.state.currentStep === 'export') {
      studio.exportVideo();
    } else {
      studio.nextStep();
    }
  };

  const handleBack = () => {
    if (studio.state.currentStep === 'concept') {
      navigate('/stories');
    } else {
      studio.prevStep();
    }
  };

  // Template not found
  if (!template || !rawTemplate) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Template not found</h1>
          <p className="text-white/50 mt-2">The template "{templateId}" doesn't exist.</p>
          <Link href="/stories">
            <Button className="mt-4">Back to Templates</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ASMR template redirects to special page
  if (templateId === 'asmr-sensory') {
    navigate('/stories/asmr');
    return null;
  }

  return (
    <>
      {/* Full Screen Loading Overlay */}
      <FullScreenLoading
        isVisible={studio.isTransitioningToExport}
        title="Generating Voiceover..."
        description="Creating audio for your scenes"
        progress={studio.voiceoverProgress}
        currentStep={Math.ceil(studio.voiceoverProgress / 33).toString()}
        totalSteps={studio.state.scenes.length}
        icon="mic"
        accentColor={accentColor}
      />

      <StudioLayout
        template={template}
        currentStep={studio.state.currentStep}
        completedSteps={studio.state.completedSteps}
        direction={studio.state.direction}
        onStepClick={handleStepClick}
        onNext={handleNext}
        onBack={handleBack}
        isNextDisabled={!canProceedFromCurrentStep && studio.state.currentStep !== 'export'}
        nextLabel={getNextLabel()}
      >
      {/* Step 1: Concept & Script */}
      {studio.state.currentStep === 'concept' && (
        <ConceptStep
          template={template}
          topic={studio.state.topic}
          aiPrompt={studio.state.aiPrompt}
          aspectRatio={studio.state.aspectRatio}
          duration={studio.state.duration}
          voiceoverEnabled={studio.state.voiceoverEnabled}
          language={studio.state.language}
          textOverlayEnabled={studio.state.textOverlayEnabled}
          textOverlay={studio.state.textOverlay}
          textOverlayStyle={studio.state.textOverlayStyle}
          pacing={studio.state.pacing}
          imageModel={studio.state.imageModel}
          imageStyle={studio.state.imageStyle}
          imageResolution={studio.state.imageResolution}
          animationMode={studio.state.animationMode}
          videoModel={studio.state.videoModel}
          videoResolution={studio.state.videoResolution}
          isGenerating={studio.state.isGenerating}
          
          onTopicChange={studio.setTopic}
          onAiPromptChange={studio.setAiPrompt}
          onAspectRatioChange={studio.setAspectRatio}
          onDurationChange={studio.setDuration}
          onVoiceoverChange={studio.setVoiceoverEnabled}
          onLanguageChange={studio.setLanguage}
          onPacingChange={studio.setPacing}
          onTextOverlayEnabledChange={studio.setTextOverlayEnabled}
          onTextOverlayChange={studio.setTextOverlay}
          onTextOverlayStyleChange={studio.setTextOverlayStyle}
          onImageModelChange={studio.setImageModel}
          onImageStyleChange={studio.setImageStyle}
          onImageResolutionChange={studio.setImageResolution}
          onAnimationModeChange={studio.setAnimationMode}
          onVideoModelChange={studio.setVideoModel}
          onVideoResolutionChange={studio.setVideoResolution}
          
          onGenerateIdea={studio.generateIdeaStory}
          onGenerateScript={studio.generateScript}
          accentColor={accentColor}
        />
      )}

      {studio.state.currentStep === 'script' && (
        <ScriptStep
          template={template}
          storyText={studio.state.topic}
          scenes={studio.state.scenes}
          duration={studio.state.duration}
          aspectRatio={studio.state.aspectRatio}
          imageMode={studio.state.imageMode}
          voiceoverEnabled={studio.state.voiceoverEnabled}
          isGenerating={studio.state.isGenerating}
          error={studio.state.error}
          onStoryChange={studio.setTopic}
          onSceneUpdate={studio.updateScene}
          onSceneAdd={studio.addScene}
          onSceneDelete={studio.deleteScene}
          onGenerateScenes={studio.generateScenes}
          accentColor={accentColor}
        />
      )}

      {/* Step 2: Storyboard */}
      {studio.state.currentStep === 'storyboard' && (
        <StoryboardStep
          template={template}
          scenes={studio.state.scenes}
          voiceoverEnabled={studio.state.voiceoverEnabled}
          imageMode={studio.state.imageMode}
          isGenerating={studio.state.isGenerating}
          onScenesChange={studio.setScenes}
          onSceneUpdate={studio.updateScene}
          onVoiceoverToggle={studio.setVoiceoverEnabled}
          onGenerateScenes={studio.generateScenes}
          onRegenerateEnhancement={studio.generateStoryboardEnhancement}
          onGenerateImages={studio.generateImages}
          onRegenerateSceneImage={studio.regenerateSceneImage}
          onGenerateVideos={studio.generateVideos}
          onRegenerateVideo={studio.regenerateSceneVideo}
          accentColor={accentColor}
        />
      )}

      {/* Step 3: Audio */}
      {studio.state.currentStep === 'audio' && (
        <AudioStep
          template={template}
          scenes={studio.state.scenes}
          selectedVoice={studio.state.selectedVoice}
          musicStyle={studio.state.musicStyle}
          backgroundMusic={studio.state.backgroundMusic}
          voiceVolume={studio.state.voiceVolume}
          musicVolume={studio.state.musicVolume}
          isGenerating={studio.state.isGenerating}
          voiceoverEnabled={studio.state.voiceoverEnabled}
          onVoiceChange={studio.setSelectedVoice}
          onMusicStyleChange={studio.setMusicStyle}
          onMusicChange={studio.setBackgroundMusic}
          onVoiceVolumeChange={studio.setVoiceVolume}
          onMusicVolumeChange={studio.setMusicVolume}
          onGenerateVoiceover={studio.generateVoiceover}
          accentColor={accentColor}
        />
      )}

      {/* Step 4: Export */}
      {studio.state.currentStep === 'export' && (
        <ExportStep
          template={template}
          scenes={studio.state.scenes}
          aspectRatio={studio.state.aspectRatio}
          duration={studio.state.duration}
          selectedVoice={studio.state.selectedVoice}
          backgroundMusic={studio.state.backgroundMusic}
          musicStyle={studio.state.musicStyle}
          voiceVolume={studio.state.voiceVolume}
          musicVolume={studio.state.musicVolume}
          exportFormat={studio.state.exportFormat}
          exportQuality={studio.state.exportQuality}
          isGenerating={studio.state.isGenerating}
          generationProgress={studio.state.generationProgress}
          voiceoverEnabled={studio.state.voiceoverEnabled}
          onFormatChange={studio.setExportFormat}
          onQualityChange={studio.setExportQuality}
          onExport={studio.exportVideo}
          onRemix={studio.remixVideo}
          onGenerateVoiceover={studio.generateVoiceover}
          accentColor={accentColor}
        />
      )}
      </StudioLayout>
    </>
  );
}
