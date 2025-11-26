import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Layers, 
  Plus,
  GripVertical,
  Trash2,
  Image as ImageIcon,
  Type,
  Clock,
  Camera,
  Sparkles,
  Eye,
  ShoppingBag,
  Zap,
  RotateCw
} from "lucide-react";

interface SceneBuilderTabProps {
  onNext: () => void;
  onPrev: () => void;
}

const SCENE_TYPES = [
  { id: "hook", label: "Hook", icon: Zap, color: "bg-destructive/20 text-destructive dark:bg-destructive/30 dark:text-destructive" },
  { id: "feature", label: "Feature", icon: Sparkles, color: "bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary" },
  { id: "demo", label: "Demo", icon: Eye, color: "bg-accent/50 text-accent-foreground dark:bg-accent/40" },
  { id: "social-proof", label: "Social Proof", icon: ShoppingBag, color: "bg-secondary text-secondary-foreground" },
  { id: "cta", label: "CTA", icon: ShoppingBag, color: "bg-muted text-foreground" }
];

const SHOT_STYLES = [
  { id: "spin", label: "360° Spin", description: "Rotating product view" },
  { id: "hand-demo", label: "Hand Demo", description: "Product in use" },
  { id: "flat-lay", label: "Flat Lay", description: "Top-down arrangement" },
  { id: "lifestyle", label: "Lifestyle", description: "Real-world context" },
  { id: "split-screen", label: "Split Screen", description: "Comparison view" },
  { id: "zoom", label: "Zoom Detail", description: "Close-up features" },
  { id: "tracking", label: "Tracking Shot", description: "Follow the product" },
  { id: "reveal", label: "Reveal", description: "Dramatic unveiling" }
];

const TEXT_STYLES = [
  { id: "bold-impact", label: "Bold Impact", preview: "BOLD" },
  { id: "elegant", label: "Elegant Script", preview: "Elegant" },
  { id: "minimal", label: "Minimal Sans", preview: "Clean" },
  { id: "trendy", label: "Trendy Gen-Z", preview: "viral" },
  { id: "classic", label: "Classic", preview: "Pro" },
  { id: "playful", label: "Playful", preview: "Fun" }
];

const DEFAULT_SCENES = [
  { id: 1, type: "hook", description: "Attention-grabbing opener", overlay: "", duration: 3 },
  { id: 2, type: "feature", description: "Highlight key benefit", overlay: "", duration: 5 },
  { id: 3, type: "demo", description: "Show product in action", overlay: "", duration: 7 },
  { id: 4, type: "cta", description: "Clear call to action", overlay: "", duration: 3 }
];

export function SceneBuilderTab({ onNext, onPrev }: SceneBuilderTabProps) {
  const [scenes, setScenes] = useState(DEFAULT_SCENES);

  const addScene = () => {
    const newId = Math.max(...scenes.map(s => s.id)) + 1;
    setScenes([...scenes, { 
      id: newId, 
      type: "feature", 
      description: "", 
      overlay: "",
      duration: 5 
    }]);
  };

  const removeScene = (id: number) => {
    if (scenes.length > 2) {
      setScenes(scenes.filter(s => s.id !== id));
    }
  };

  const getSceneType = (typeId: string) => {
    return SCENE_TYPES.find(t => t.id === typeId) || SCENE_TYPES[1];
  };

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scene Cards - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Scene Sequence</h3>
              <Badge variant="secondary">{scenes.length} scenes</Badge>
              <Badge variant="outline">{totalDuration}s total</Badge>
            </div>
            <Button variant="outline" size="sm" onClick={addScene} data-testid="button-add-scene">
              <Plus className="h-4 w-4 mr-1" />
              Add Scene
            </Button>
          </div>

          <div className="space-y-3">
            {scenes.map((scene, index) => {
              const sceneType = getSceneType(scene.type);
              return (
                <Card key={scene.id} className="overflow-hidden" data-testid={`card-scene-${scene.id}`}>
                  <div className="flex">
                    {/* Drag Handle & Scene Number */}
                    <div className="w-12 bg-muted flex flex-col items-center justify-center gap-1 border-r border-border">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>

                    {/* Scene Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          {/* Scene Type & Duration */}
                          <div className="flex items-center gap-3">
                            <select
                              value={scene.type}
                              onChange={(e) => {
                                setScenes(scenes.map(s => 
                                  s.id === scene.id ? { ...s, type: e.target.value } : s
                                ));
                              }}
                              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                              data-testid={`select-scene-type-${scene.id}`}
                            >
                              {SCENE_TYPES.map(type => (
                                <option key={type.id} value={type.id}>{type.label}</option>
                              ))}
                            </select>
                            
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <Input
                                type="number"
                                min={1}
                                max={30}
                                value={scene.duration}
                                onChange={(e) => {
                                  setScenes(scenes.map(s => 
                                    s.id === scene.id ? { ...s, duration: parseInt(e.target.value) || 1 } : s
                                  ));
                                }}
                                className="w-16 h-8"
                                data-testid={`input-scene-duration-${scene.id}`}
                              />
                              <span className="text-xs text-muted-foreground">sec</span>
                            </div>
                          </div>

                          {/* Visual Description */}
                          <div className="space-y-1">
                            <Label className="text-xs">Visual Description</Label>
                            <Textarea
                              value={scene.description}
                              onChange={(e) => {
                                setScenes(scenes.map(s => 
                                  s.id === scene.id ? { ...s, description: e.target.value } : s
                                ));
                              }}
                              placeholder="Describe what's shown in this scene..."
                              className="min-h-[60px] resize-none text-sm"
                              data-testid={`input-scene-description-${scene.id}`}
                            />
                          </div>

                          {/* Text Overlay */}
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Type className="h-3 w-3" />
                              Text Overlay
                            </Label>
                            <Input
                              value={scene.overlay}
                              onChange={(e) => {
                                setScenes(scenes.map(s => 
                                  s.id === scene.id ? { ...s, overlay: e.target.value } : s
                                ));
                              }}
                              placeholder="On-screen text for this scene..."
                              className="h-8 text-sm"
                              data-testid={`input-scene-overlay-${scene.id}`}
                            />
                          </div>
                        </div>

                        {/* Preview Thumbnail & Delete */}
                        <div className="flex flex-col items-end gap-2">
                          <div className="w-24 h-16 rounded-md bg-muted border border-border flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                          {scenes.length > 2 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-destructive hover:text-destructive"
                              onClick={() => removeScene(scene.id)}
                              data-testid={`button-delete-scene-${scene.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Shot & Text Styles */}
        <div className="space-y-6">
          {/* Shot Style Presets */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                Shot Style Presets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {SHOT_STYLES.map((style) => (
                  <div
                    key={style.id}
                    className="p-2 rounded-md border border-border cursor-pointer hover-elevate transition-all text-center"
                    data-testid={`button-shot-${style.id}`}
                  >
                    <p className="text-xs font-medium">{style.label}</p>
                    <p className="text-[10px] text-muted-foreground">{style.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Text Overlay Styles */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Type className="h-4 w-4 text-primary" />
                Text Overlay Style
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {TEXT_STYLES.map((style) => (
                  <div
                    key={style.id}
                    className="p-3 rounded-md border border-border cursor-pointer hover-elevate transition-all text-center"
                    data-testid={`button-text-style-${style.id}`}
                  >
                    <p className="text-lg font-medium mb-1">{style.preview}</p>
                    <p className="text-[10px] text-muted-foreground">{style.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeline Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <RotateCw className="h-4 w-4 text-primary" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded-lg overflow-hidden flex">
                {scenes.map((scene, index) => {
                  const sceneType = getSceneType(scene.type);
                  const widthPercent = (scene.duration / totalDuration) * 100;
                  return (
                    <div
                      key={scene.id}
                      style={{ width: `${widthPercent}%` }}
                      className={`flex items-center justify-center text-[10px] font-medium border-r border-background/50 last:border-r-0 ${sceneType.color}`}
                    >
                      {scene.duration}s
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>0s</span>
                <span>Total: {totalDuration}s</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev} data-testid="button-back-hook">
          Back to Hook & Format
        </Button>
        <Button onClick={onNext} size="lg" data-testid="button-continue-visual">
          Continue to Visual Style
        </Button>
      </div>
    </div>
  );
}
