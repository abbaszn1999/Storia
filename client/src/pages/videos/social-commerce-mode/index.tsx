import { useState, useEffect } from "react";
import { useParams, useSearch } from "wouter";
import { SocialCommerceWorkflow } from "@/components/social-commerce-workflow";
import { SocialCommerceStudioLayout, type CommerceStepId } from "@/components/commerce/studio";
import { NarrativeModeSelector } from "@/components/narrative/narrative-mode-selector";
import type { Character } from "@shared/schema";
import type { Scene, Shot, ShotVersion, ReferenceImage } from "@/types/storyboard";

interface ProductDetails {
  title: string;
  price: string;
  description: string;
  cta: string;
}

export default function SocialCommerceMode() {
  const params = useParams<{ videoId?: string }>();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  
  const [videoTitle] = useState(urlParams.get("title") || "Untitled Product Video");
  const [activeStep, setActiveStep] = useState<CommerceStepId>("setup");
  const [completedSteps, setCompletedSteps] = useState<CommerceStepId[]>([]);
  const [direction, setDirection] = useState(1);
  const [canContinue, setCanContinue] = useState(false);
  // Commerce mode always uses start-end for automatic linear shot connections
  const [narrativeMode, setNarrativeMode] = useState<"image-reference" | "start-end">("start-end");
  
  const [videoId] = useState(params.videoId || urlParams.get("id") || `video-${Date.now()}`);
  const [workspaceId] = useState(urlParams.get("workspace") || "workspace-1");
  
  // Product-specific state
  const [productPhotos, setProductPhotos] = useState<string[]>([]);
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    title: "",
    price: "",
    description: "",
    cta: "Shop Now",
  });
  const [videoConcept, setVideoConcept] = useState("");
  const [voiceOverConcept, setVoiceOverConcept] = useState("");
  const [voiceOverScript, setVoiceOverScript] = useState("");
  
  // Video settings
  const [script, setScript] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [duration, setDuration] = useState("30");
  const [voiceActorId, setVoiceActorId] = useState<string | null>(null);
  const [voiceOverEnabled, setVoiceOverEnabled] = useState(true);
  
  // Campaign Configuration settings (Tab 1)
  const [imageModel, setImageModel] = useState("imagen-4");
  const [imageResolution, setImageResolution] = useState("2K");
  const [videoModel, setVideoModel] = useState("kling-o1");
  const [videoResolution, setVideoResolution] = useState("1080p");
  const [language, setLanguage] = useState<'ar' | 'en'>('en');
  const [motionPrompt, setMotionPrompt] = useState("");
  
  // Product DNA & Brand Identity settings (Tab 2)
  const [productImages, setProductImages] = useState<{
    heroProfile: string | null;
    macroDetail: string | null;
    materialReference: string | null;
  }>({
    heroProfile: null,
    macroDetail: null,
    materialReference: null,
  });
  const [materialPreset, setMaterialPreset] = useState("");
  const [objectMass, setObjectMass] = useState(50);
  const [surfaceComplexity, setSurfaceComplexity] = useState(50);
  const [refractionEnabled, setRefractionEnabled] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [brandPrimaryColor, setBrandPrimaryColor] = useState("#FF006E");
  const [brandSecondaryColor, setBrandSecondaryColor] = useState("#FB5607");
  const [logoIntegrity, setLogoIntegrity] = useState(7);
  const [logoDepth, setLogoDepth] = useState(5);
  const [heroFeature, setHeroFeature] = useState("");
  const [originMetaphor, setOriginMetaphor] = useState("");
  
  // Cast & Character DNA (Tab 2)
  const [includeHumanElement, setIncludeHumanElement] = useState(false);
  const [characterMode, setCharacterMode] = useState<'hand-model' | 'full-body' | 'silhouette' | null>(null);
  const [characterReferenceUrl, setCharacterReferenceUrl] = useState<string | null>(null);
  const [characterDescription, setCharacterDescription] = useState("");
  
  // Environment & Story Beats (Tab 3)
  const [environmentConcept, setEnvironmentConcept] = useState("");
  const [cinematicLighting, setCinematicLighting] = useState("");
  const [atmosphericDensity, setAtmosphericDensity] = useState(50);
  const [styleReferenceUrl, setStyleReferenceUrl] = useState<string | null>(null);
  const [visualPreset, setVisualPreset] = useState("");
  const [campaignSpark, setCampaignSpark] = useState("");
  const [visualBeats, setVisualBeats] = useState({
    beat1: "",
    beat2: "",
    beat3: "",
  });
  
  // Environment-specific brand colors (initialized from Tab 2, but local to Tab 3)
  const [environmentBrandPrimaryColor, setEnvironmentBrandPrimaryColor] = useState(brandPrimaryColor);
  const [environmentBrandSecondaryColor, setEnvironmentBrandSecondaryColor] = useState(brandSecondaryColor);
  
  // Strategic Context (Tab 1 - moved from Tab 3)
  const [targetAudience, setTargetAudience] = useState("");
  
  // Campaign Objective & CTA (Tab 3)
  const [campaignObjective, setCampaignObjective] = useState("showcase");
  const [ctaText, setCtaText] = useState("");

  // Scene Manifest (Tab 4)
  const [sceneManifest, setSceneManifest] = useState<{
    scenes: Array<{
      id: string;
      name: string;
      description: string;
      duration: number;
      actType: 'hook' | 'transformation' | 'payoff';
      shots: Array<{
        id: string;
        sceneId: string;
        name: string;
        description: string;
        duration: number;
        shotType: 'image-ref' | 'start-end';
        cameraPath: 'orbit' | 'pan' | 'zoom' | 'dolly' | 'static';
        lens: 'macro' | 'wide' | '85mm' | 'telephoto';
        referenceTags: string[];
        isLinkedToPrevious: boolean;
      }>;
    }>;
    continuityLinksEstablished: boolean;
  }>({
    scenes: [],
    continuityLinksEstablished: false,
  });
  
  // Scene/shot state
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [shots, setShots] = useState<{ [sceneId: string]: Shot[] }>({});
  const [shotVersions, setShotVersions] = useState<{ [shotId: string]: ShotVersion[] }>({});
  const [characters, setCharacters] = useState<Character[]>([]);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [continuityLocked, setContinuityLocked] = useState(false);
  const [continuityGroups, setContinuityGroups] = useState<{ [sceneId: string]: any[] }>({});
  const [worldSettings, setWorldSettings] = useState<{ 
    artStyle: string; 
    imageModel?: string;
    worldDescription?: string;
    locations?: Array<{ id: string; name: string; description: string }>;
    imageInstructions?: string;
    videoInstructions?: string;
  }>({
    artStyle: "none",
    imageModel: "Flux",
    worldDescription: "",
    locations: [],
    imageInstructions: "",
    videoInstructions: "",
  });

  // Commerce World Settings
  const [commerceSettings, setCommerceSettings] = useState<{
    visualStyle: string;
    backdrop: string;
    productDisplay: string[];
    talentType: string;
    talents: Array<{ id: string; name: string; type: "hands" | "lifestyle" | "spokesperson"; description: string; imageUrl: string | null }>;
    styleReference: string | null;
    additionalInstructions: string;
    imageModel: string;
    videoModel: string;
    imageInstructions: string;
    videoInstructions: string;
  }>({
    visualStyle: "minimal",
    backdrop: "white-studio",
    productDisplay: ["hero"],
    talentType: "none",
    talents: [],
    styleReference: null,
    additionalInstructions: "",
    imageModel: "imagen-4",
    videoModel: "kling",
    imageInstructions: "",
    videoInstructions: "",
  });

  // Sync sceneManifest to scenes/shots/continuityGroups for StoryboardEditor
  useEffect(() => {
    if (sceneManifest.scenes.length > 0) {
      // Convert sceneManifest scenes to Scene type
      const convertedScenes: Scene[] = sceneManifest.scenes.map((scene, idx) => ({
        id: scene.id,
        videoId: videoId,
        sceneNumber: idx + 1,
        title: scene.name,
        description: scene.description,
        duration: scene.duration,
        createdAt: new Date(),
      }));
      
      // Convert sceneManifest shots to shots dictionary
      const convertedShots: { [sceneId: string]: Shot[] } = {};
      sceneManifest.scenes.forEach(scene => {
        convertedShots[scene.id] = scene.shots.map((shot, shotIdx) => ({
          id: shot.id,
          sceneId: scene.id,
          shotNumber: shotIdx + 1,
          shotType: shot.name.split(':')[1]?.trim() || 'Product View',
          cameraMovement: shot.cameraPath,
          duration: shot.duration,
          description: shot.description,
          currentVersionId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      });
      
      // Generate continuityGroups from isLinkedToPrevious for connection status
      const generatedGroups: { [sceneId: string]: any[] } = {};
      sceneManifest.scenes.forEach(scene => {
        const groups: any[] = [];
        let currentGroup: string[] = [];
        
        scene.shots.forEach((shot, idx) => {
          if (idx === 0 || !shot.isLinkedToPrevious) {
            // Start new group if not linked to previous
            if (currentGroup.length > 1) {
              // Save the previous group (only if it has 2+ shots = actual connection)
              groups.push({
                id: `group-${scene.id}-${groups.length}`,
                sceneId: scene.id,
                groupNumber: groups.length + 1,
                shotIds: [...currentGroup],
                description: 'Connected shot sequence',
                transitionType: 'continuity',
                status: 'approved',
                createdAt: new Date(),
              });
            }
            currentGroup = [shot.id];
          } else {
            // Continue current group - shot is linked to previous
            currentGroup.push(shot.id);
          }
        });
        
        // Don't forget to save the last group if it has connections
        if (currentGroup.length > 1) {
          groups.push({
            id: `group-${scene.id}-${groups.length}`,
            sceneId: scene.id,
            groupNumber: groups.length + 1,
            shotIds: [...currentGroup],
            description: 'Connected shot sequence',
            transitionType: 'continuity',
            status: 'approved',
            createdAt: new Date(),
          });
        }
        
        generatedGroups[scene.id] = groups;
      });
      
      setScenes(convertedScenes);
      setShots(convertedShots);
      setContinuityGroups(generatedGroups);
      setContinuityLocked(sceneManifest.continuityLinksEstablished);
    }
  }, [sceneManifest, videoId]);

  // Update validation state based on current step and data
  const updateValidation = () => {
    if (activeStep === "setup") {
      // Tab 1: Campaign Configuration + Strategic Context validation
      const isValid = 
        imageModel && 
        videoModel && 
        aspectRatio && 
        duration && 
        motionPrompt.trim().length > 0 &&
        targetAudience !== "";
      setCanContinue(isValid);
    } else if (activeStep === "script") {
      // Tab 2: Product DNA & Brand Identity + Character DNA validation
      let isValid = 
        productImages.heroProfile !== null && 
        materialPreset !== "";
      // If human element enabled, require character mode
      if (includeHumanElement) {
        isValid = isValid && characterMode !== null;
      }
      setCanContinue(isValid);
    } else if (activeStep === "environment") {
      // Tab 3: Environment & Story Beats validation (simplified - no audience here)
      const isValid = 
        environmentConcept.trim().length >= 20 && 
        campaignSpark.trim().length >= 10;
      setCanContinue(isValid);
    } else if (activeStep === "world") {
      // Tab 4: Scene Manifest validation
      const isValid = sceneManifest.scenes.length === 3 && 
                      sceneManifest.scenes.every(scene => scene.shots.length > 0);
      setCanContinue(isValid);
    } else {
      // Other steps - default to true for now
      setCanContinue(true);
    }
  };

  // Update validation when relevant state changes
  useEffect(() => {
    updateValidation();
  }, [activeStep, imageModel, videoModel, aspectRatio, duration, motionPrompt, targetAudience, productImages, materialPreset, includeHumanElement, characterMode, environmentConcept, campaignSpark, sceneManifest]);

  // Map old workflow step IDs to new studio step IDs
  const workflowStepMap: { [key in CommerceStepId]: string } = {
    "setup": "script",  // Tab 1 = Campaign Config (ProductSetupTab)
    "script": "product-dna",  // Tab 2 = Product DNA & Brand Identity (HookFormatTab)
    "environment": "environment-story",  // Tab 3 = Environment & Story Beats (VisualStyleTab)
    "world": "world",
    "storyboard": "storyboard",
    "animatic": "animatic",
    "export": "export"
  };

  const handleStepClick = (step: CommerceStepId) => {
    setDirection(step > activeStep ? 1 : -1);
    setActiveStep(step);
  };

  const handleNext = () => {
    // Mark current step as completed when moving forward
    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps([...completedSteps, activeStep]);
    }
    
    const steps: CommerceStepId[] = ["setup", "script", "environment", "world", "storyboard", "animatic", "export"];
    const currentIndex = steps.indexOf(activeStep);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < steps.length) {
      setDirection(1);
      setActiveStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const steps: CommerceStepId[] = ["setup", "script", "environment", "world", "storyboard", "animatic", "export"];
    const currentIndex = steps.indexOf(activeStep);
    const prevIndex = currentIndex - 1;
    
    if (prevIndex >= 0) {
      setDirection(-1);
      setActiveStep(steps[prevIndex]);
    }
  };

  // Show narrative mode selector if not selected
  if (!narrativeMode) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <NarrativeModeSelector onSelectMode={(mode) => setNarrativeMode(mode)} />
      </div>
    );
  }

  return (
    <SocialCommerceStudioLayout
      currentStep={activeStep}
      completedSteps={completedSteps}
      direction={direction}
      onStepClick={handleStepClick}
      onNext={handleNext}
      onBack={handleBack}
      videoTitle={videoTitle}
      isNextDisabled={false}
    >
      <SocialCommerceWorkflow 
              activeStep={workflowStepMap[activeStep]}
              videoId={videoId}
              workspaceId={workspaceId}
              narrativeMode={narrativeMode}
              script={script}
              aspectRatio={aspectRatio}
              duration={duration}
              voiceActorId={voiceActorId}
              voiceOverEnabled={voiceOverEnabled}
              voiceOverConcept={voiceOverConcept}
              voiceOverScript={voiceOverScript}
              videoConcept={videoConcept}
              productPhotos={productPhotos}
              productDetails={productDetails}
              scenes={scenes}
              shots={shots}
              shotVersions={shotVersions}
              characters={characters}
              referenceImages={referenceImages}
              continuityLocked={continuityLocked}
              continuityGroups={continuityGroups}
              worldSettings={worldSettings}
              imageModel={imageModel}
              imageResolution={imageResolution}
              videoModel={videoModel}
              videoResolution={videoResolution}
              language={language}
              motionPrompt={motionPrompt}
              productImages={productImages}
              materialPreset={materialPreset}
              objectMass={objectMass}
              surfaceComplexity={surfaceComplexity}
              refractionEnabled={refractionEnabled}
              logoUrl={logoUrl}
              brandPrimaryColor={brandPrimaryColor}
              brandSecondaryColor={brandSecondaryColor}
              logoIntegrity={logoIntegrity}
              logoDepth={logoDepth}
              heroFeature={heroFeature}
              originMetaphor={originMetaphor}
              onScriptChange={setScript}
              onAspectRatioChange={setAspectRatio}
              onDurationChange={setDuration}
              onVoiceActorChange={setVoiceActorId}
              onVoiceOverToggle={setVoiceOverEnabled}
              onVoiceOverConceptChange={setVoiceOverConcept}
              onVoiceOverScriptChange={setVoiceOverScript}
              onVideoConceptChange={setVideoConcept}
              onProductPhotosChange={setProductPhotos}
              onProductDetailsChange={setProductDetails}
              onScenesChange={setScenes}
              onShotsChange={setShots}
              onShotVersionsChange={setShotVersions}
              onCharactersChange={setCharacters}
              onReferenceImagesChange={setReferenceImages}
              onContinuityLockedChange={setContinuityLocked}
              onContinuityGroupsChange={setContinuityGroups}
              onWorldSettingsChange={setWorldSettings}
              commerceSettings={commerceSettings}
              onCommerceSettingsChange={setCommerceSettings}
              onImageModelChange={setImageModel}
              onImageResolutionChange={setImageResolution}
              onVideoModelChange={setVideoModel}
              onVideoResolutionChange={setVideoResolution}
              onLanguageChange={setLanguage}
              onMotionPromptChange={setMotionPrompt}
              onProductImagesChange={setProductImages}
              onMaterialPresetChange={setMaterialPreset}
              onObjectMassChange={setObjectMass}
              onSurfaceComplexityChange={setSurfaceComplexity}
              onRefractionEnabledChange={setRefractionEnabled}
              onLogoUrlChange={setLogoUrl}
              onBrandPrimaryColorChange={setBrandPrimaryColor}
              onBrandSecondaryColorChange={setBrandSecondaryColor}
              onLogoIntegrityChange={setLogoIntegrity}
              onLogoDepthChange={setLogoDepth}
              onHeroFeatureChange={setHeroFeature}
              onOriginMetaphorChange={setOriginMetaphor}
              environmentConcept={environmentConcept}
              cinematicLighting={cinematicLighting}
              atmosphericDensity={atmosphericDensity}
              styleReferenceUrl={styleReferenceUrl}
              visualPreset={visualPreset}
              campaignSpark={campaignSpark}
              visualBeats={visualBeats}
              environmentBrandPrimaryColor={environmentBrandPrimaryColor}
              environmentBrandSecondaryColor={environmentBrandSecondaryColor}
              targetAudience={targetAudience}
              campaignObjective={campaignObjective}
              ctaText={ctaText}
              includeHumanElement={includeHumanElement}
              characterMode={characterMode}
              characterReferenceUrl={characterReferenceUrl}
              characterDescription={characterDescription}
              onEnvironmentConceptChange={setEnvironmentConcept}
              onCinematicLightingChange={setCinematicLighting}
              onAtmosphericDensityChange={setAtmosphericDensity}
              onStyleReferenceUrlChange={setStyleReferenceUrl}
              onVisualPresetChange={setVisualPreset}
              onCampaignSparkChange={setCampaignSpark}
              onVisualBeatsChange={setVisualBeats}
              onEnvironmentBrandPrimaryColorChange={setEnvironmentBrandPrimaryColor}
              onEnvironmentBrandSecondaryColorChange={setEnvironmentBrandSecondaryColor}
              onTargetAudienceChange={setTargetAudience}
              onCampaignObjectiveChange={setCampaignObjective}
              onCtaTextChange={setCtaText}
              onIncludeHumanElementChange={setIncludeHumanElement}
              onCharacterModeChange={setCharacterMode}
              onCharacterReferenceUrlChange={setCharacterReferenceUrl}
              onCharacterDescriptionChange={setCharacterDescription}
              sceneManifest={sceneManifest}
              onSceneManifestChange={setSceneManifest}
              onNext={handleNext}
            />
    </SocialCommerceStudioLayout>
  );
}
