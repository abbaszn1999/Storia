// Story Create - Professional Multi-Step Experience
// Uses the new Story Studio components for a polished, immersive flow
// ═══════════════════════════════════════════════════════════════════════════

import { useParams, useLocation } from "wouter";
import { useState, useCallback } from "react";
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
  
  // State for final export process
  const [isFinalExporting, setIsFinalExporting] = useState(false);
  
  // State for export step busy status (voiceover, export, remix, publish)
  const [isExportStepBusy, setIsExportStepBusy] = useState(false);

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

  // Direct download function
  const handleDirectDownload = useCallback(async (url: string, filename: string) => {
    try {
      console.log('[StoryCreate] Starting direct download:', filename);
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      console.log('[StoryCreate] Download complete');
    } catch (error) {
      console.error('[StoryCreate] Download failed:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  }, []);

  // Get download filename (always 1080p MP4)
  const getDownloadFilename = useCallback(() => {
    const timestamp = new Date().toISOString().slice(0, 10);
    return `storia-video-${timestamp}-1080p.mp4`;
  }, []);

  // Handle final export - remix with volumes and download
  const handleFinalExport = useCallback(async (
    audioAssets: { videoBaseUrl?: string; voiceoverUrl?: string; musicUrl?: string } | null,
    voiceVolume: number,
    musicVolume: number
  ) => {
    setIsFinalExporting(true);
    
    try {
      // If we have audio assets, remix with new volumes
      if (audioAssets?.videoBaseUrl && audioAssets?.voiceoverUrl && audioAssets?.musicUrl) {
        console.log('[StoryCreate] Remixing with volumes:', voiceVolume, musicVolume);
        const newVideoUrl = await studio.remixVideo(
          audioAssets.videoBaseUrl,
          audioAssets.voiceoverUrl,
          audioAssets.musicUrl,
          voiceVolume,
          musicVolume
        );
        
        if (newVideoUrl) {
          await handleDirectDownload(newVideoUrl, getDownloadFilename());
        }
      } else {
        // No remix needed, use existing video
        const lastExport = studio.state.lastExportResult;
        if (lastExport?.videoUrl) {
          await handleDirectDownload(lastExport.videoUrl, getDownloadFilename());
        }
      }
    } catch (error) {
      console.error('[StoryCreate] Final export failed:', error);
    } finally {
      setIsFinalExporting(false);
    }
  }, [studio, handleDirectDownload, getDownloadFilename]);

  const handleNext = async () => {
    if (studio.state.currentStep === 'export') {
      // Trigger final export - ExportStep will call onFinalExport via useEffect
      setIsFinalExporting(true);
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
      isBackDisabled={studio.state.isGenerating || studio.state.isEnhancingStoryboard || studio.state.isGeneratingImages || isExportStepBusy}
      isNavigationDisabled={studio.state.isGenerating || studio.state.isEnhancingStoryboard || studio.state.isGeneratingImages || isExportStepBusy}
      isLoading={isFinalExporting}
      nextLabel={getNextLabel()}
    >
      {/* Step 1: Concept & Script */}
      {studio.state.currentStep === 'concept' && (
        <ConceptStep
          template={template}
          projectName={studio.state.projectName}
          projectFolder={studio.state.projectFolder}
          isProjectLocked={studio.state.isProjectLocked}
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
          styleReferenceUrl={studio.state.styleReferenceUrl}
          characterReferenceUrl={studio.state.characterReferenceUrl}
          imageResolution={studio.state.imageResolution}
          animationMode={studio.state.animationMode}
          videoModel={studio.state.videoModel}
          videoResolution={studio.state.videoResolution}
          isGenerating={studio.state.isGenerating}
          
          onProjectNameChange={studio.setProjectName}
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
          onStyleReferenceUrlChange={studio.setStyleReferenceUrl}
          onCharacterReferenceUrlChange={studio.setCharacterReferenceUrl}
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
          videoModel={studio.state.videoModel}
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
          isEnhancing={studio.state.isEnhancingStoryboard}
          isGeneratingImages={studio.state.isGeneratingImages}
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
          projectFolder={studio.state.projectFolder}
          selectedVoice={studio.state.selectedVoice}
          musicStyle={studio.state.musicStyle}
          backgroundMusic={studio.state.backgroundMusic}
          customMusicUrl={studio.state.customMusicUrl}
          customMusicDuration={studio.state.customMusicDuration}
          voiceVolume={studio.state.voiceVolume}
          musicVolume={studio.state.musicVolume}
          duration={studio.state.duration}
          isGenerating={studio.state.isGenerating}
          voiceoverEnabled={studio.state.voiceoverEnabled}
          onVoiceChange={studio.setSelectedVoice}
          onMusicStyleChange={studio.setMusicStyle}
          onMusicChange={studio.setBackgroundMusic}
          onCustomMusicChange={studio.setCustomMusic}
          onClearCustomMusic={studio.clearCustomMusic}
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
          scriptText={studio.state.topic}
          aspectRatio={studio.state.aspectRatio}
          duration={studio.state.duration}
          selectedVoice={studio.state.selectedVoice}
          backgroundMusic={studio.state.backgroundMusic}
          musicStyle={studio.state.musicStyle}
          customMusicUrl={studio.state.customMusicUrl}
          voiceVolume={studio.state.voiceVolume}
          musicVolume={studio.state.musicVolume}
          isGenerating={studio.state.isGenerating}
          generationProgress={studio.state.generationProgress}
          voiceoverEnabled={studio.state.voiceoverEnabled}
          imageModel={studio.state.imageModel}
          isFinalExporting={isFinalExporting}
          hasGeneratedVoiceover={studio.state.hasGeneratedVoiceover}
          hasExportedVideo={studio.state.hasExportedVideo}
          storyId={studio.state.storyId}
          lastExportResult={studio.state.lastExportResult}
          onExport={studio.exportVideo}
          onRemix={studio.remixVideo}
          onFinalExport={handleFinalExport}
          onGenerateVoiceover={studio.generateVoiceover}
          onVoiceVolumeChange={studio.setVoiceVolume}
          onMusicVolumeChange={studio.setMusicVolume}
          onBusyStateChange={setIsExportStepBusy}
          accentColor={accentColor}
        />
      )}
    </StudioLayout>
    </>
  );
}
