// Unified Scene/Shot Timeline - Tab 4
// ═══════════════════════════════════════════════════════════════════════════
// Autonomous Timeline: Pre-planned commercial with automated continuity

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Film,
  CheckCircle2,
  Image as ImageIcon,
  Video,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

interface Scene {
  id: string;
  name: string; // "Scene 1: The Ignition"
  description: string;
  duration: number; // Sum of all shots
  actType: 'hook' | 'transformation' | 'payoff';
  shots: Shot[];
}

interface Shot {
  id: string;
  sceneId: string;
  name: string; // "Shot 1.1: Macro Reveal"
  description: string; // Cinematic description (editable)
  duration: number; // 0.5 - 10.0
  shotType: 'image-ref' | 'start-end';
  cameraPath: 'orbit' | 'pan' | 'zoom' | 'dolly' | 'static';
  lens: 'macro' | 'wide' | '85mm' | 'telephoto';
  referenceTags: string[]; // ['@Product_DNA', '@Logo', '@Texture', '@Style']
  isLinkedToPrevious: boolean; // Automated continuity
}

interface SceneManifest {
  scenes: Scene[];
  continuityLinksEstablished: boolean;
}

interface SceneContinuityTabProps {
  workspaceId: string;
  visualBeats: {
    beat1: string;
    beat2: string;
    beat3: string;
  };
  sceneManifest: SceneManifest;
  onSceneManifestChange: (manifest: SceneManifest) => void;
  // Reference data from previous tabs
  heroFeature: string;
  logoUrl: string | null;
  styleReferenceUrl: string | null;
  onNext: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const CAMERA_PATHS = [
  { value: 'orbit', label: 'Orbit' },
  { value: 'pan', label: 'Pan' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'dolly', label: 'Dolly' },
  { value: 'static', label: 'Static' },
];

const LENSES = [
  { value: 'macro', label: 'Macro' },
  { value: 'wide', label: 'Wide' },
  { value: '85mm', label: '85mm' },
  { value: 'telephoto', label: 'Telephoto' },
];

const SCENE_THEMES = [
  { id: 'hook' as const, defaultName: 'The Ignition', color: 'from-pink-500 to-orange-500', accent: 'border-pink-500', badge: 'bg-pink-500' },
  { id: 'transformation' as const, defaultName: 'The Revelation', color: 'from-purple-500 to-pink-500', accent: 'border-purple-500', badge: 'bg-purple-500' },
  { id: 'payoff' as const, defaultName: 'The Impact', color: 'from-orange-500 to-amber-500', accent: 'border-orange-500', badge: 'bg-orange-500' },
];

// ═══════════════════════════════════════════════════════════════════════════
// AUTONOMOUS SCENE GENERATION - MEDIA PLANNING AGENT
// ═══════════════════════════════════════════════════════════════════════════

const parseShotDescriptions = (beatContent: string): string[] => {
  if (!beatContent || beatContent.trim().length === 0) {
    return ["Cinematic product reveal"];
  }
  
  // Split by periods, take 2-3 shots per scene
  const sentences = beatContent
    .split(/[.!]\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);
  
  if (sentences.length === 0) {
    return [beatContent.substring(0, 100)];
  }
  
  return sentences.slice(0, 3);
};

const generateShotName = (sceneNum: number, shotNum: number, description: string): string => {
  // Auto-generate shot names based on content keywords
  const lower = description.toLowerCase();
  
  if (lower.includes('macro') || lower.includes('close')) {
    return `Shot ${sceneNum}.${shotNum}: Macro Reveal`;
  } else if (lower.includes('wide') || lower.includes('establishing')) {
    return `Shot ${sceneNum}.${shotNum}: Wide Establishing`;
  } else if (lower.includes('track') || lower.includes('follow')) {
    return `Shot ${sceneNum}.${shotNum}: Tracking Shot`;
  } else if (lower.includes('orbit') || lower.includes('rotate')) {
    return `Shot ${sceneNum}.${shotNum}: Orbital View`;
  } else if (lower.includes('detail') || lower.includes('texture')) {
    return `Shot ${sceneNum}.${shotNum}: Detail Focus`;
  } else {
    return `Shot ${sceneNum}.${shotNum}: Product View`;
  }
};

const generateScenesFromBeats = (
  beats: { beat1: string; beat2: string; beat3: string },
  heroFeature: string,
  logoUrl: string | null,
  styleReferenceUrl: string | null
): Scene[] => {
  const beatData = [
    { id: 'hook' as const, content: beats.beat1, theme: SCENE_THEMES[0] },
    { id: 'transformation' as const, content: beats.beat2, theme: SCENE_THEMES[1] },
    { id: 'payoff' as const, content: beats.beat3, theme: SCENE_THEMES[2] },
  ];
  
  return beatData.map((beat, sceneIdx) => {
    const sceneNum = sceneIdx + 1;
    const shotDescriptions = parseShotDescriptions(beat.content);
    
    const shots: Shot[] = shotDescriptions.map((desc, shotIdx) => {
      const shotNum = shotIdx + 1;
      const isFirstShotInScene = shotIdx === 0;
      
      // Inject reference tags
      const referenceTags: string[] = ['@Product_DNA', '@Texture'];
      if (logoUrl) referenceTags.push('@Logo');
      if (styleReferenceUrl) referenceTags.push('@Style');
      
      return {
        id: `scene${sceneNum}-shot${shotNum}`,
        sceneId: `scene-${sceneNum}`,
        name: generateShotName(sceneNum, shotNum, desc),
        description: desc,
        duration: 3.5,
        shotType: 'image-ref',
        cameraPath: 'static',
        lens: '85mm',
        referenceTags,
        isLinkedToPrevious: !isFirstShotInScene, // Auto-link all shots except first in scene
      };
    });
    
    // Calculate total scene duration
    const totalDuration = shots.reduce((sum, shot) => sum + shot.duration, 0);
    
    return {
      id: `scene-${sceneNum}`,
      name: `Scene ${sceneNum}: ${beat.theme.defaultName}`,
      description: beat.content.substring(0, 120) + (beat.content.length > 120 ? '...' : ''),
      duration: totalDuration,
      actType: beat.id,
      shots,
    };
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function SceneContinuityTab({
  workspaceId,
  visualBeats,
  sceneManifest,
  onSceneManifestChange,
  heroFeature,
  logoUrl,
  styleReferenceUrl,
  onNext,
}: SceneContinuityTabProps) {
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);

  // Autonomous initialization - Media Planning Agent
  useEffect(() => {
    if (sceneManifest.scenes.length === 0) {
      const generatedScenes = generateScenesFromBeats(
        visualBeats,
        heroFeature,
        logoUrl,
        styleReferenceUrl
      );
      onSceneManifestChange({
        scenes: generatedScenes,
        continuityLinksEstablished: true,
      });
    }
  }, []);

  // Selected shot
  const selectedShot = useMemo(() => {
    for (const scene of sceneManifest.scenes) {
      const shot = scene.shots.find(s => s.id === selectedShotId);
      if (shot) return shot;
    }
    return null;
  }, [selectedShotId, sceneManifest.scenes]);

  // Handlers
  const updateShot = (sceneId: string, shotId: string, updates: Partial<Shot>) => {
    const updatedScenes = sceneManifest.scenes.map(scene => {
      if (scene.id !== sceneId) return scene;
      
      const updatedShots = scene.shots.map(shot =>
        shot.id === shotId ? { ...shot, ...updates } : shot
      );
      
      // Recalculate scene duration
      const totalDuration = updatedShots.reduce((sum, shot) => sum + shot.duration, 0);
      
      return {
        ...scene,
        shots: updatedShots,
        duration: totalDuration,
      };
    });
    
    onSceneManifestChange({
      ...sceneManifest,
      scenes: updatedScenes,
    });
  };

  // Validation
  const isValid = useMemo(() => {
    return sceneManifest.scenes.length === 3 && 
           sceneManifest.scenes.every(scene => scene.shots.length > 0);
  }, [sceneManifest.scenes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full bg-[#0a0a0a] flex flex-col"
    >
      {/* Main Content */}
      <div className="flex-1 flex gap-6 p-8 overflow-hidden">
        
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ZONE 1: HIERARCHICAL TIMELINE (100%) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Film className="w-6 h-6 text-pink-400" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white">Unified Scene/Shot Timeline</h2>
              <p className="text-sm text-white/50">Pre-planned commercial with automated continuity</p>
            </div>
            {sceneManifest.continuityLinksEstablished && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Continuity Locked
              </Badge>
            )}
          </div>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-8">
              {sceneManifest.scenes.map((scene, sceneIdx) => {
                const sceneTheme = SCENE_THEMES.find(t => t.id === scene.actType) || SCENE_THEMES[0];
                
                return (
                  <motion.div
                    key={scene.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: sceneIdx * 0.15 }}
                  >
                    {/* ═══════════════════════════════════════════ */}
                    {/* SCENE CONTAINER */}
                    {/* ═══════════════════════════════════════════ */}
                    <Card className={cn(
                      "bg-white/[0.02] border-l-4 transition-all",
                      sceneTheme.accent
                    )}>
                      <CardContent className="p-6">
                        {/* Scene Header */}
                        <div className="mb-6">
                          <div className="flex items-start gap-4 mb-3">
                            <div className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                              sceneTheme.badge
                            )}>
                              <span className="text-white font-bold text-lg">{sceneIdx + 1}</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold text-white mb-1">{scene.name}</h3>
                              <p className="text-sm text-white/60">{scene.description}</p>
                            </div>
                            <Badge variant="outline" className={cn(
                              "text-xs px-3 py-1 font-semibold",
                              `bg-gradient-to-r ${sceneTheme.color}`
                            )}>
                              {scene.duration.toFixed(1)}s total
                            </Badge>
                          </div>
                        </div>

                        {/* ═══════════════════════════════════════ */}
                        {/* SHOT CARDS (Nested within scene) */}
                        {/* ═══════════════════════════════════════ */}
                        <div className="space-y-4">
                          {scene.shots.map((shot, shotIdx) => (
                            <div key={shot.id}>
                              {/* Continuity Bridge (before shot, except first) */}
                              {shot.isLinkedToPrevious && (
                                <motion.div
                                  initial={{ opacity: 0, scaleY: 0 }}
                                  animate={{ opacity: 1, scaleY: 1 }}
                                  transition={{ delay: 0.3 }}
                                  className="my-3 flex items-center gap-2 px-4"
                                >
                                  <div className="flex-1 h-px bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
                                  <Badge className="text-[10px] bg-purple-500/20 border-purple-500/40 text-purple-300 px-2 py-0.5">
                                    <Link2 className="w-3 h-3 mr-1 inline" />
                                    Narrative Continuity Locked
                                  </Badge>
                                  <div className="flex-1 h-px bg-gradient-to-r from-pink-500 to-purple-500 animate-pulse" />
                                </motion.div>
                              )}

                              {/* Shot Card */}
                              <Card
                                className={cn(
                                  "bg-white/[0.03] border-white/[0.06] border-l-2 transition-all cursor-pointer",
                                  sceneTheme.accent,
                                  selectedShotId === shot.id && "border-pink-500/50 bg-white/[0.05] shadow-lg shadow-pink-500/10"
                                )}
                                onClick={() => setSelectedShotId(shot.id)}
                              >
                                <CardContent className="p-5">
                                  {/* Identity Row */}
                                  <div className="flex items-center gap-3 mb-4">
                                    <Badge variant="outline" className={cn(
                                      "text-xs font-bold px-3 py-1",
                                      `bg-gradient-to-r ${sceneTheme.color}`,
                                      "border-white/20"
                                    )}>
                                      {shot.name}
                                    </Badge>
                                    
                                    <div className="flex-1" />
                                    
                                    {/* Duration Slider */}
                                    <div className="flex items-center gap-3 min-w-[200px]">
                                      <Label className="text-xs text-white/50 whitespace-nowrap">Duration:</Label>
                                      <Slider
                                        value={[shot.duration]}
                                        onValueChange={([value]) => updateShot(scene.id, shot.id, { duration: value })}
                                        min={0.5}
                                        max={10}
                                        step={0.5}
                                        className="flex-1"
                                      />
                                      <span className="text-xs text-white/70 font-mono min-w-[40px] text-right">
                                        {shot.duration.toFixed(1)}s
                                      </span>
                                    </div>
                                  </div>

                                  {/* Vision & Directives */}
                                  <div className="grid grid-cols-[1fr,auto] gap-4">
                                    {/* Left: Description */}
                                    <div className="space-y-3">
                                      <Label className="text-xs text-white/50">Cinematic Description</Label>
                                      <Textarea
                                        value={shot.description}
                                        onChange={(e) => updateShot(scene.id, shot.id, { description: e.target.value })}
                                        placeholder="Describe the shot vision..."
                                        className="bg-white/5 border-white/10 text-white text-sm min-h-[80px] resize-none"
                                        maxLength={200}
                                      />
                                      <div className="text-[10px] text-white/30 text-right">
                                        {shot.description.length}/200
                                      </div>
                                    </div>

                                    {/* Right: Controls Grid */}
                                    <div className="space-y-3 min-w-[280px]">
                                      {/* Shot Type Toggle */}
                                      <div className="space-y-2">
                                        <Label className="text-xs text-white/50">Shot Type</Label>
                                        <ToggleGroup
                                          type="single"
                                          value={shot.shotType}
                                          onValueChange={(value) => {
                                            if (value) updateShot(scene.id, shot.id, { shotType: value as any });
                                          }}
                                          className="bg-white/5 rounded-lg p-1 w-full"
                                        >
                                          <ToggleGroupItem
                                            value="image-ref"
                                            className="text-xs px-3 py-2 data-[state=on]:bg-pink-500 flex-1"
                                          >
                                            <ImageIcon className="w-3 h-3 mr-1" />
                                            Image-Ref
                                          </ToggleGroupItem>
                                          <ToggleGroupItem
                                            value="start-end"
                                            className="text-xs px-3 py-2 data-[state=on]:bg-purple-500 flex-1"
                                          >
                                            <Video className="w-3 h-3 mr-1" />
                                            Start/End
                                          </ToggleGroupItem>
                                        </ToggleGroup>
                                      </div>

                                      {/* Camera & Lens Grid */}
                                      <div className="grid grid-cols-2 gap-2">
                                        {/* Camera Path */}
                                        <div className="space-y-1">
                                          <Label className="text-[10px] text-white/50 uppercase">Camera</Label>
                                          <Select value={shot.cameraPath} onValueChange={(value) => updateShot(scene.id, shot.id, { cameraPath: value as any })}>
                                            <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10 text-white">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0a0a0a] border-white/10">
                                              {CAMERA_PATHS.map((path) => (
                                                <SelectItem key={path.value} value={path.value} className="text-xs">
                                                  {path.label}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        {/* Lens */}
                                        <div className="space-y-1">
                                          <Label className="text-[10px] text-white/50 uppercase">Lens</Label>
                                          <Select value={shot.lens} onValueChange={(value) => updateShot(scene.id, shot.id, { lens: value as any })}>
                                            <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10 text-white">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0a0a0a] border-white/10">
                                              {LENSES.map((lens) => (
                                                <SelectItem key={lens.value} value={lens.value} className="text-xs">
                                                  {lens.label}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>

                                      {/* @ Reference Pills */}
                                      <div className="space-y-1">
                                        <Label className="text-[10px] text-white/50 uppercase">References</Label>
                                        <div className="flex flex-wrap gap-1.5">
                                          {shot.referenceTags.map((tag) => (
                                            <Badge
                                              key={tag}
                                              variant="outline"
                                              className="text-[10px] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-300 px-2 py-0.5"
                                            >
                                              {tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ZONE 3: FRAME BLUEPRINT (BOTTOM BAR) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {selectedShot && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="border-t border-white/[0.06] bg-black/40 backdrop-blur-xl"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Film className="w-5 h-5 text-orange-400" />
                <Label className="text-sm font-semibold text-white">Keyframe Blueprint</Label>
                <Badge variant="outline" className="text-xs">
                  {selectedShot.name}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedShotId(null)}
                className="text-white/50 hover:text-white"
              >
                Close
              </Button>
            </div>

            {/* Frame Requirements Badge */}
            <div className="flex items-center justify-center mb-4">
              <Badge variant="outline" className={cn(
                "text-xs px-4 py-1.5",
                selectedShot.shotType === 'start-end'
                  ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                  : "bg-pink-500/20 border-pink-500/50 text-pink-300"
              )}>
                {selectedShot.shotType === 'start-end' ? (
                  <><Video className="w-3 h-3 mr-1.5 inline" /> 2 Frames Required (Narrative Mode)</>
                ) : (
                  <><ImageIcon className="w-3 h-3 mr-1.5 inline" /> 1 Frame Required (Standard)</>
                )}
              </Badge>
            </div>

            <div className="flex gap-6 justify-center items-center">
              {selectedShot.shotType === 'start-end' ? (
                <>
                  {/* Start Frame */}
                  <div className="w-72">
                    <Label className="text-xs text-white/70 mb-2 block text-center font-semibold">
                      🎬 Start Frame
                    </Label>
                    <div className="aspect-video bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-2 border-dashed border-purple-500/40 rounded-xl flex items-center justify-center hover:border-purple-500/60 hover:bg-purple-500/15 transition-all">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-purple-400/50 mx-auto mb-2" />
                        <p className="text-xs text-white/60 font-medium">Upload or Generate</p>
                        <p className="text-[10px] text-white/40 mt-1">Opening state</p>
                      </div>
                    </div>
                  </div>

                  {/* Animated Arrow Connector */}
                  <div className="flex items-center">
                    <motion.div
                      className="flex flex-col items-center gap-2"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
                    >
                      <div className="w-20 h-px bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
                      <Badge variant="outline" className="text-[10px] bg-white/5 border-white/20">
                        Transition
                      </Badge>
                      <div className="w-20 h-px bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500" />
                    </motion.div>
                  </div>

                  {/* End Frame */}
                  <div className="w-72">
                    <Label className="text-xs text-white/70 mb-2 block text-center font-semibold">
                      🎥 End Frame
                    </Label>
                    <div className="aspect-video bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-2 border-dashed border-pink-500/40 rounded-xl flex items-center justify-center hover:border-pink-500/60 hover:bg-pink-500/15 transition-all">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-pink-400/50 mx-auto mb-2" />
                        <p className="text-xs text-white/60 font-medium">Upload or Generate</p>
                        <p className="text-[10px] text-white/40 mt-1">Closing state</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-96">
                  <Label className="text-xs text-white/70 mb-2 block text-center font-semibold">
                    📸 Single Image Frame
                  </Label>
                  <div className="aspect-video bg-gradient-to-br from-pink-500/10 to-orange-500/5 border-2 border-dashed border-pink-500/40 rounded-xl flex items-center justify-center hover:border-pink-500/60 hover:bg-pink-500/15 transition-all">
                    <div className="text-center">
                      <ImageIcon className="w-14 h-14 text-pink-400/50 mx-auto mb-3" />
                      <p className="text-sm text-white/60 font-semibold">Upload or Generate</p>
                      <p className="text-xs text-white/40 mt-1">Standard I2V Mode</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Continue Button - Fixed at bottom when no shot selected */}
      {!selectedShot && (
        <div className="border-t border-white/[0.06] p-6 bg-black/20">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/70">
              {isValid ? (
                <span className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Scene manifest ready for storyboard
                </span>
              ) : (
                <span className="text-orange-400">Loading scene breakdown...</span>
              )}
            </div>
            <Button
              onClick={onNext}
              disabled={!isValid}
              size="lg"
              className={cn(
                isValid
                  ? "bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 hover:from-pink-600 hover:via-purple-600 hover:to-orange-600"
                  : "bg-white/10 text-white/40 cursor-not-allowed"
              )}
            >
              Continue to Storyboard
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
