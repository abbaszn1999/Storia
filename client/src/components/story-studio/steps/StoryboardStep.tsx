// Storyboard Step - Scene cards with image generation
// ═══════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence, Reorder } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassPanel } from "../shared/GlassPanel";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
  isGenerating: boolean;
  onScenesChange: (scenes: StoryScene[]) => void;
  onSceneUpdate: (id: string, updates: Partial<StoryScene>) => void;
  onVoiceoverToggle: (enabled: boolean) => void;
  onGenerateScenes: () => void;
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
  isGenerating,
  onScenesChange,
  onSceneUpdate,
  onVoiceoverToggle,
  onGenerateScenes,
  accentColor = "primary"
}: StoryboardStepProps) {
  const [selectedScene, setSelectedScene] = useState<string | null>(
    scenes[0]?.id || null
  );
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());

  const accentClasses = {
    primary: "from-primary to-violet-500",
    orange: "from-orange-500 to-amber-500",
    violet: "from-violet-500 to-purple-500",
    blue: "from-blue-500 to-cyan-500",
    rose: "from-rose-500 to-pink-500",
  }[accentColor] || "from-primary to-violet-500";

  const selectedSceneData = scenes.find(s => s.id === selectedScene);

  const handleGenerateImage = async (sceneId: string) => {
    setGeneratingImages(prev => new Set(prev).add(sceneId));
    
    // Simulate image generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock image URL
    onSceneUpdate(sceneId, { 
      imageUrl: `https://picsum.photos/seed/${sceneId}/800/450`
    });
    
    setGeneratingImages(prev => {
      const next = new Set(prev);
      next.delete(sceneId);
      return next;
    });
  };

  const handleAddScene = () => {
    const newScene: StoryScene = {
      id: `scene-${Date.now()}`,
      sceneNumber: scenes.length + 1,
      narration: '',
      visualPrompt: '',
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
      {/* Left - Scene List */}
      <div className="lg:col-span-4 space-y-4">
        <GlassPanel noPadding className="overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("p-2 rounded-lg bg-gradient-to-br", accentClasses)}>
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Scenes</h3>
                  <p className="text-xs text-white/50">{scenes.length} scenes · {totalDuration}s total</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleAddScene}
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
          </div>

          {/* Scene List */}
          {scenes.length > 0 ? (
            <Reorder.Group 
              axis="y" 
              values={scenes} 
              onReorder={onScenesChange}
              className="p-2 space-y-2 max-h-[500px] overflow-y-auto"
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white/60">
                            Scene {scene.sceneNumber}
                          </span>
                          <span className="text-[10px] text-white/40">
                            {scene.duration}s
                          </span>
                        </div>
                        <p className="text-xs text-white/50 truncate mt-0.5">
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
        </GlassPanel>

        {/* Voiceover Toggle */}
        <GlassPanel>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Video className="w-4 h-4 text-white/60" />
              </div>
              <div>
                <span className="text-sm font-medium">Voiceover</span>
                <p className="text-xs text-white/40">Add narration to scenes</p>
              </div>
            </div>
            <Switch
              checked={voiceoverEnabled}
              onCheckedChange={onVoiceoverToggle}
            />
          </div>
        </GlassPanel>
      </div>

      {/* Right - Scene Editor */}
      <div className="lg:col-span-8">
        {selectedSceneData ? (
          <GlassPanel className="space-y-5">
            {/* Scene Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Scene {selectedSceneData.sceneNumber}
              </h3>
              <div className="flex items-center gap-2">
                {selectedSceneData.isAnimated && (
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs",
                    "bg-gradient-to-r",
                    accentClasses
                  )}>
                    Animated
                  </span>
                )}
              </div>
            </div>

            {/* Visual Preview */}
            <div className={cn(
              "relative aspect-video rounded-xl overflow-hidden",
              "bg-black/40 border border-white/10"
            )}>
              {selectedSceneData.imageUrl ? (
                <>
                  <img
                    src={selectedSceneData.imageUrl}
                    alt={`Scene ${selectedSceneData.sceneNumber}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-sm text-white/90 line-clamp-2">
                      {selectedSceneData.narration}
                    </p>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-white/20 mb-4" />
                  <p className="text-white/40 text-sm">No image generated</p>
                </div>
              )}

              {/* Generate/Regenerate Button */}
              <div className="absolute top-4 right-4">
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
                  {selectedSceneData.imageUrl ? 'Regenerate' : 'Generate Image'}
                </Button>
              </div>
            </div>

            {/* Scene Details */}
            <div className="grid grid-cols-2 gap-4">
              {/* Visual Prompt */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 font-medium">Visual Prompt</label>
                <Textarea
                  value={selectedSceneData.visualPrompt}
                  onChange={(e) => onSceneUpdate(selectedSceneData.id, { visualPrompt: e.target.value })}
                  placeholder="Describe what should appear in this scene..."
                  className="min-h-[100px] bg-white/5 border-white/10 text-sm resize-none"
                />
              </div>

              {/* Narration */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 font-medium">Narration</label>
                <Textarea
                  value={selectedSceneData.narration}
                  onChange={(e) => onSceneUpdate(selectedSceneData.id, { narration: e.target.value })}
                  placeholder="What the voiceover will say..."
                  className="min-h-[100px] bg-white/5 border-white/10 text-sm resize-none"
                />
              </div>
            </div>

            {/* Scene Settings */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
              {/* Duration */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Duration
                </label>
                <div className="flex gap-1">
                  {[3, 5, 7, 10].map(d => (
                    <button
                      key={d}
                      onClick={() => onSceneUpdate(selectedSceneData.id, { duration: d })}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-medium",
                        "border transition-all",
                        selectedSceneData.duration === d
                          ? cn("bg-gradient-to-r border-white/20", accentClasses)
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Transition */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 font-medium">Transition</label>
                <div className="flex gap-1">
                  {TRANSITIONS.map(t => (
                    <button
                      key={t.value}
                      onClick={() => onSceneUpdate(selectedSceneData.id, { 
                        transition: t.value as StoryScene['transition']
                      })}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-medium",
                        "border transition-all",
                        selectedSceneData.transition === t.value
                          ? cn("bg-gradient-to-r border-white/20", accentClasses)
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animated Toggle */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 font-medium">Animation</label>
                <div className="flex items-center gap-3 h-[38px] px-3 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-xs text-white/60">Static</span>
                  <Switch
                    checked={selectedSceneData.isAnimated}
                    onCheckedChange={(checked) => onSceneUpdate(selectedSceneData.id, { isAnimated: checked })}
                  />
                  <span className="text-xs text-white/60">Animated</span>
                </div>
              </div>
            </div>
          </GlassPanel>
        ) : (
          <GlassPanel className="h-full min-h-[500px] flex items-center justify-center">
            <div className="text-center">
              <Layers className="w-16 h-16 mx-auto text-white/20 mb-4" />
              <p className="text-white/50">Select a scene to edit</p>
              <p className="text-xs text-white/30 mt-1">
                Or add a new scene to get started
              </p>
            </div>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}

