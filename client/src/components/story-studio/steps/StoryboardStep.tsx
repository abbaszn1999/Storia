// Storyboard Step - Scene cards with image generation
// ═══════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence, Reorder } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassPanel } from "../shared/GlassPanel";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Image as ImageIcon,
  Video,
  Wand2,
  GripVertical,
  Trash2,
  Plus,
  Play,
  Pause,
  Clock,
  Sparkles,
  Film,
  RefreshCw,
  Layers
} from "lucide-react";
import { StoryScene, StoryTemplate } from "../types";
import { useState } from "react";

interface StoryboardStepProps {
  template: StoryTemplate;
  scenes: StoryScene[];
  voiceoverEnabled: boolean;
  imageMode: 'none' | 'transition' | 'image-to-video';
  isGenerating: boolean;
  onScenesChange: (scenes: StoryScene[]) => void;
  onSceneUpdate: (id: string, updates: Partial<StoryScene>) => void;
  onVoiceoverToggle: (enabled: boolean) => void;
  onGenerateScenes: () => void;
  onRegenerateEnhancement?: () => void;
  onGenerateImages?: () => void;
  onRegenerateSceneImage?: (sceneId: string) => Promise<void>;
  onGenerateVideos?: () => void;
  onRegenerateVideo?: (scene: StoryScene) => void;
  accentColor?: string;
}

const TRANSITIONS = [
  { value: 'fade', label: 'Fade' },
  { value: 'slide', label: 'Slide' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'none', label: 'Cut' },
];

export function StoryboardStep({
  template,
  scenes,
  voiceoverEnabled,
  imageMode,
  isGenerating,
  onScenesChange,
  onSceneUpdate,
  onVoiceoverToggle,
  onGenerateScenes,
  onRegenerateEnhancement,
  onGenerateImages,
  onRegenerateSceneImage,
  onGenerateVideos,
  onRegenerateVideo,
  accentColor = "primary"
}: StoryboardStepProps) {
  const [selectedScene, setSelectedScene] = useState<string | null>(
    scenes[0]?.id || null
  );
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'image' | 'animation'>('image');
  const [activeMediaTab, setActiveMediaTab] = useState<'image' | 'video'>('image');
  const [animationTrigger, setAnimationTrigger] = useState<number>(0);

  const accentClasses = {
    primary: "from-primary to-violet-500",
    orange: "from-orange-500 to-amber-500",
    violet: "from-violet-500 to-purple-500",
    blue: "from-blue-500 to-cyan-500",
    rose: "from-rose-500 to-pink-500",
  }[accentColor] || "from-primary to-violet-500";

  const selectedSceneData = scenes.find(s => s.id === selectedScene);

  // Debug logging
  console.log('[StoryboardStep] Props:', { 
    imageMode, 
    scenesCount: scenes.length,
    hasImages: scenes.every(s => s.imageUrl),
    selectedSceneHasVideoPrompt: selectedSceneData?.videoPrompt 
  });

  const handleGenerateImage = async (sceneId: string) => {
    if (!onRegenerateSceneImage) return;
    
    setGeneratingImages(prev => new Set(prev).add(sceneId));
    
    try {
      await onRegenerateSceneImage(sceneId);
    } finally {
      setGeneratingImages(prev => {
        const next = new Set(prev);
        next.delete(sceneId);
        return next;
      });
    }
  };

  // Trigger animation re-render by updating state
  const handlePreviewAnimation = (animation: string) => {
    // Force re-render to restart animation
    setAnimationTrigger(Date.now());
  };

  // Apply animations to all scenes (for transition mode)
  const handleApplyAnimationsToAll = () => {
    const defaultAnimation = selectedSceneData?.imageAnimation || 'ken-burns';
    
    const updatedScenes = scenes.map(scene => ({
      ...scene,
      imageAnimation: scene.imageAnimation || defaultAnimation
    }));
    
    onScenesChange(updatedScenes);
  };

  const handleAddScene = () => {
    const newScene: StoryScene = {
      id: `scene-${Date.now()}`,
      sceneNumber: scenes.length + 1,
      narration: '',
      isAnimated: true,
      transition: 'slide',
      duration: 5,
      voiceoverEnabled: true,
    };
    onScenesChange([...scenes, newScene]);
    setSelectedScene(newScene.id);
  };

  const handleDeleteScene = (id: string) => {
    const filtered = scenes.filter(s => s.id !== id);
    // Renumber scenes
    const renumbered = filtered.map((s, i) => ({ ...s, sceneNumber: i + 1 }));
    onScenesChange(renumbered);
    
    if (selectedScene === id) {
      setSelectedScene(renumbered[0]?.id || null);
    }
  };

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  // Animation options for transition mode
  const ANIMATION_OPTIONS = [
    { value: 'zoom-in', label: 'Zoom In', icon: '🔍' },
    { value: 'zoom-out', label: 'Zoom Out', icon: '🔎' },
    { value: 'pan-right', label: 'Pan Right', icon: '→' },
    { value: 'pan-left', label: 'Pan Left', icon: '←' },
    { value: 'pan-up', label: 'Pan Up', icon: '↑' },
    { value: 'pan-down', label: 'Pan Down', icon: '↓' },
    { value: 'rotate-cw', label: 'Rotate CW', icon: '↻' },
    { value: 'rotate-ccw', label: 'Rotate CCW', icon: '↺' },
    { value: 'ken-burns', label: 'Ken Burns', icon: '✨' },
    { value: 'slide-left', label: 'Slide Left', icon: '⇐' },
    { value: 'slide-right', label: 'Slide Right', icon: '⇒' },
  ];

  return (
    <div className="flex w-full h-[calc(100vh-12rem)] gap-0 overflow-hidden">
      {/* 
        LEFT COLUMN: SCENES LIST + PROMPTS (40%)
      */}
      <div className={cn(
        "w-[40%] min-w-[400px] max-w-[600px] flex-shrink-0 h-full",
        "bg-black/40 backdrop-blur-xl",
        "border-r border-white/[0.06]",
        "flex flex-col overflow-hidden"
      )}>
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-lg bg-gradient-to-br", accentClasses)}>
                <Layers className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Scenes</h3>
                <p className="text-xs text-white/40">{scenes.length} scenes · {totalDuration}s total</p>
              </div>
            </div>
            
            {/* Animate All Button - Only for image-to-video mode */}
            {imageMode === 'image-to-video' && scenes.length > 0 && scenes.every(s => s.imageUrl) && (
              <Button
                onClick={onGenerateVideos}
                disabled={isGenerating}
                className={cn(
                  "gap-2 bg-gradient-to-r shadow-lg shadow-orange-500/20",
                  "hover:shadow-orange-500/30 hover:scale-105 transition-all duration-300",
                  "font-semibold",
                  accentClasses
                )}
                size="sm"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Video className="w-4 h-4" />
                )}
                Animate All
                <Sparkles className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Scenes List - Scrollable */}
        <ScrollArea className="flex-1">
          {scenes.length > 0 ? (
            <Reorder.Group 
              axis="y" 
              values={scenes} 
              onReorder={onScenesChange}
              className="p-3 space-y-2"
            >
              <AnimatePresence>
                {scenes.map((scene) => (
                  <Reorder.Item
                    key={scene.id}
                    value={scene}
                    className={cn(
                      "p-3 rounded-xl cursor-pointer",
                      "border transition-all duration-200",
                      selectedScene === scene.id
                        ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                    onClick={() => setSelectedScene(scene.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-start gap-3">
                      <GripVertical className="w-4 h-4 text-white/30 mt-1 cursor-grab" />
                      
                      {/* Thumbnail */}
                      <div className={cn(
                        "w-16 h-10 rounded-lg flex-shrink-0 overflow-hidden",
                        "bg-white/10 flex items-center justify-center"
                      )}>
                        {scene.imageUrl ? (
                          <img 
                            src={scene.imageUrl} 
                            alt={`Scene ${scene.sceneNumber}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-white/30" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-white/60">
                            Scene {scene.sceneNumber}
                          </span>
                          <span className="text-[10px] text-white/40">
                            {scene.duration}s
                          </span>
                        </div>
                        <p className="text-xs text-white/50 line-clamp-2 break-words">
                          {scene.narration || 'No narration'}
                        </p>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteScene(scene.id);
                        }}
                        className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          ) : (
            <div className="p-8 text-center">
              <Film className="w-12 h-12 mx-auto text-white/20 mb-3" />
              <p className="text-sm text-white/50">No scenes yet</p>
              <p className="text-xs text-white/30 mt-1">
                Generate from script or add manually
              </p>
              <Button 
                onClick={onGenerateScenes}
                disabled={isGenerating}
                size="sm"
                className={cn("mt-4 gap-2 bg-gradient-to-r", accentClasses)}
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Auto-Generate Scenes
              </Button>
            </div>
          )}
        </ScrollArea>

        {/* Voiceover Section - Only show if voiceover is enabled */}
        {voiceoverEnabled && (
          <div className="flex-shrink-0 border-t border-white/[0.06] bg-black/20 overflow-y-auto max-h-[30%]">
            <ScrollArea className="h-full">
              <div className="p-4">
                {selectedSceneData ? (
                  <div className="space-y-2">
                    <label className="text-xs text-white/50 font-medium">Voiceover Text</label>
                    <Textarea
                      value={selectedSceneData.narration || ''}
                      onChange={(e) => onSceneUpdate(selectedSceneData.id, { 
                        narration: e.target.value 
                      })}
                      placeholder="Enter voiceover text for this scene..."
                      className="min-h-[80px] bg-white/5 border-white/10 text-sm resize-none"
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-white/40">Select a scene to edit voiceover</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* 
        RIGHT COLUMN: IMAGE PREVIEW + PROMPTS (60%)
      */}
      <div className="flex-1 relative flex flex-col overflow-hidden h-full">
        <ScrollArea className="flex-1 h-full">
          <div className="p-6 space-y-4">
            {isGenerating && scenes.length > 0 ? (
              <div className="text-center py-20">
                <RefreshCw className="w-16 h-16 mx-auto text-white/20 mb-4 animate-spin" />
                <p className="text-white/70 font-medium">Enhancing scenes with AI...</p>
                <p className="text-xs text-white/40 mt-2">
                  Generating image prompts
                </p>
              </div>
            ) : selectedSceneData ? (
              <>
                {/* Professional Media Switch - Only show if both image and video exist */}
                {selectedSceneData.imageUrl && selectedSceneData.videoUrl && (
                  <div className="flex items-center justify-center gap-3 mb-6">
                    {/* Label */}
                    <span className="text-xs text-white/50 font-medium">Media Type</span>
                    
                    {/* Switch Container */}
                    <div className="relative inline-flex items-center bg-black/40 rounded-full p-1 border border-white/10">
                      {/* Animated Background Slider */}
                      <motion.div
                        className={cn("absolute h-[calc(100%-8px)] rounded-full bg-gradient-to-r", accentClasses)}
                        initial={false}
                        animate={{
                          left: activeMediaTab === 'image' ? '4px' : '50%',
                          right: activeMediaTab === 'image' ? '50%' : '4px',
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                      
                      {/* Image Button */}
                      <button
                        onClick={() => setActiveMediaTab('image')}
                        className={cn(
                          "relative z-10 px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200",
                          "flex items-center gap-2 min-w-[120px] justify-center",
                          activeMediaTab === 'image'
                            ? "text-white"
                            : "text-white/50 hover:text-white/70"
                        )}
                      >
                        <ImageIcon className="w-4 h-4" />
                        Image
                      </button>
                      
                      {/* Video Button */}
                      <button
                        onClick={() => setActiveMediaTab('video')}
                        className={cn(
                          "relative z-10 px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200",
                          "flex items-center gap-2 min-w-[120px] justify-center",
                          activeMediaTab === 'video'
                            ? "text-white"
                            : "text-white/50 hover:text-white/70"
                        )}
                      >
                        <Video className="w-4 h-4" />
                        Video
                      </button>
                    </div>
                  </div>
                )}

                {/* Animation Icons Bar - Only for Transition Mode */}
                {imageMode === 'transition' && selectedSceneData.imageUrl && (
                  <div className="flex items-center justify-center gap-2 mb-4 flex-wrap max-w-2xl mx-auto">
                    {ANIMATION_OPTIONS.map((anim) => (
                      <motion.button
                        key={anim.value}
                        onClick={() => {
                          console.log('[StoryboardStep] Applying animation:', anim.value, 'to scene:', selectedSceneData.id);
                          onSceneUpdate(selectedSceneData.id, { imageAnimation: anim.value as any });
                          handlePreviewAnimation(anim.value);
                        }}
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "relative w-10 h-10 rounded-xl flex items-center justify-center",
                          "transition-all duration-300",
                          "backdrop-blur-md border",
                          selectedSceneData.imageAnimation === anim.value
                            ? "bg-white/20 border-white/40 shadow-lg shadow-white/20"
                            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                        )}
                        title={anim.label}
                      >
                        <span className={cn(
                          "text-lg transition-all duration-300",
                          selectedSceneData.imageAnimation === anim.value 
                            ? "scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" 
                            : ""
                        )}>
                          {anim.icon}
                        </span>
                        
                        {/* Selected Ring Indicator */}
                        {selectedSceneData.imageAnimation === anim.value && (
                          <motion.div
                            layoutId="selected-animation-ring"
                            className="absolute inset-0 rounded-xl ring-2 ring-white/60 ring-offset-2 ring-offset-black/20"
                            transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Media Preview */}
                <div className={cn(
                  "relative aspect-video rounded-xl overflow-hidden",
                  "bg-black/40 border border-white/10",
                  "flex items-center justify-center"
                )}>
                  {/* Show Video if activeMediaTab is 'video' and videoUrl exists */}
                  {activeMediaTab === 'video' && selectedSceneData.videoUrl ? (
                    <>
                      <video
                        src={selectedSceneData.videoUrl}
                        controls
                        autoPlay
                        loop
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    </>
                  ) : selectedSceneData.imageUrl ? (
                    <>
                      <img
                        key={`${selectedSceneData.id}-${selectedSceneData.imageAnimation || 'none'}-${animationTrigger}`}
                        src={selectedSceneData.imageUrl}
                        alt={`Scene ${selectedSceneData.sceneNumber}`}
                        className={cn(
                          "w-full h-full object-contain",
                          selectedSceneData.imageAnimation && `animate-scene-${selectedSceneData.imageAnimation}`
                        )}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                      
                      {/* Animation Indicator */}
                      {selectedSceneData.imageAnimation && (
                        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/20">
                          <span className="text-xs text-white font-medium flex items-center gap-2">
                            <Play className="w-3 h-3" />
                            {ANIMATION_OPTIONS.find(a => a.value === selectedSceneData.imageAnimation)?.label || 'Animating'}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-white/20 mb-4" />
                      <p className="text-white/40 text-sm">No media generated</p>
                    </div>
                  )}

                  {/* Generate/Regenerate Button */}
                  <div className="absolute top-4 right-4">
                    {activeMediaTab === 'video' && selectedSceneData.videoUrl ? (
                      <Button
                        size="sm"
                        onClick={() => onRegenerateVideo?.(selectedSceneData)}
                        disabled={isGenerating}
                        className={cn("gap-2 bg-gradient-to-r", accentClasses)}
                      >
                        {isGenerating ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Video className="w-4 h-4" />
                        )}
                        Regenerate Video
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleGenerateImage(selectedSceneData.id)}
                        disabled={generatingImages.has(selectedSceneData.id)}
                        className={cn("gap-2 bg-gradient-to-r", accentClasses)}
                      >
                        {generatingImages.has(selectedSceneData.id) ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4" />
                        )}
                        {selectedSceneData.imageUrl ? 'Regenerate Image' : 'Generate Image'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Prompts Section - Controlled by Media Switch */}
                <div className="space-y-4">
                  {/* Image Prompt - Show when activeMediaTab is 'image' OR no video exists */}
                  {(activeMediaTab === 'image' || !selectedSceneData.videoUrl) && (
                    <div className="space-y-2">
                      <label className="text-xs text-white/50 font-medium">Image Prompt</label>
                      <Textarea
                        value={selectedSceneData.imagePrompt || ''}
                        onChange={(e) => onSceneUpdate(selectedSceneData.id, { 
                          imagePrompt: e.target.value 
                        })}
                        placeholder="Describe the image for this scene..."
                        className="min-h-[120px] bg-white/5 border-white/10 text-sm resize-none"
                      />
                    </div>
                  )}


                  {/* Video/Animation Content - Show when activeMediaTab is 'video' for image-to-video mode */}
                  {activeMediaTab === 'video' && selectedSceneData.videoUrl && imageMode === 'image-to-video' && (
                    <div className="space-y-2">
                      <label className="text-xs text-white/50 font-medium">Video Prompt</label>
                      <Textarea
                        value={selectedSceneData.videoPrompt || ''}
                        onChange={(e) => onSceneUpdate(selectedSceneData.id, { 
                          videoPrompt: e.target.value 
                        })}
                        placeholder="Describe the video motion/animation..."
                        className="min-h-[120px] bg-white/5 border-white/10 text-sm resize-none"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <Layers className="w-16 h-16 mx-auto text-white/20 mb-4" />
                <p className="text-white/50">Select a scene to view</p>
                <p className="text-xs text-white/30 mt-1">
                  Choose a scene from the list
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

