// Character Vlog Scene Timeline - Adapted from Social Commerce
// ═══════════════════════════════════════════════════════════════════════════
// WITHOUT: Duration slider, Shot type badges, Frame badges, Camera/Lens settings, Target/Render duration

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Film,
  CheckCircle2,
  Image as ImageIcon,
  Video,
  Link2,
  Unlink,
  ChevronDown,
  Clock,
  X,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Zap,
  Heart,
  Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

interface VlogScene {
  id: string;
  name: string;
  description: string;
  duration: number;
  actType: 'hook' | 'intro' | 'main' | 'outro' | 'custom';
  shots: VlogShot[];
}

interface VlogShot {
  id: string;
  sceneId: string;
  name: string;
  description: string;
  shotType: 'image-ref' | 'start-end'; // Frames Type (1F or 2F)
  cameraShot?: string; // Shot Type (camera angle)
  isLinkedToPrevious: boolean;
  referenceTags: string[];
}

interface SceneManifest {
  scenes: VlogScene[];
  continuityLinksEstablished: boolean;
}

interface CharacterVlogSceneBreakdownProps {
  videoId: string;
  narrativeMode: "image-reference" | "start-end";
  script: string;
  characterName: string;
  theme: string;
  scenes: VlogScene[];
  shots: { [sceneId: string]: VlogShot[] };
  onScenesChange: (scenes: VlogScene[]) => void;
  onShotsChange: (shots: { [sceneId: string]: VlogShot[] }) => void;
  onContinuityGroupsChange: (groups: { [sceneId: string]: any[] }) => void;
  onContinuityLockedChange: (locked: boolean) => void;
  onNext: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const SCENE_THEMES = [
  { id: 'hook' as const, defaultName: 'The Hook', color: 'from-[#FF4081] to-[#FF6B4A]', accent: 'border-[#FF4081]/50', badge: 'bg-gradient-to-r from-[#FF4081] to-[#FF6B4A]', icon: '🎬' },
  { id: 'intro' as const, defaultName: 'Introduction', color: 'from-[#FF5C8D] to-[#FF4081]', accent: 'border-[#FF5C8D]/50', badge: 'bg-gradient-to-r from-[#FF5C8D] to-[#FF4081]', icon: '✨' },
  { id: 'main' as const, defaultName: 'Main Content', color: 'from-[#FF6B4A] to-[#FF5C8D]', accent: 'border-[#FF6B4A]/50', badge: 'bg-gradient-to-r from-[#FF6B4A] to-[#FF5C8D]', icon: '🎯' },
  { id: 'outro' as const, defaultName: 'Outro', color: 'from-[#FF4081] to-[#FF5C8D]', accent: 'border-[#FF4081]/50', badge: 'bg-gradient-to-r from-[#FF4081] to-[#FF5C8D]', icon: '💫' },
  { id: 'custom' as const, defaultName: 'Custom Scene', color: 'from-cyan-500 to-blue-500', accent: 'border-cyan-500/50', badge: 'bg-gradient-to-r from-cyan-500 to-blue-500', icon: '🎥' },
];

const ACT_TYPES = [
  { value: 'hook', label: 'Hook (Opening)' },
  { value: 'intro', label: 'Introduction' },
  { value: 'main', label: 'Main Content' },
  { value: 'outro', label: 'Outro (Closing)' },
  { value: 'custom', label: 'Custom' },
];

const CAMERA_SHOT_TYPES = [
  "Extreme Close-up",
  "Close-up",
  "Medium Close-up",
  "Medium Shot",
  "Medium Wide Shot",
  "Wide Shot",
  "Extreme Wide Shot",
  "Over-the-Shoulder",
  "Point of View",
  "Establishing Shot",
];

// ═══════════════════════════════════════════════════════════════════════════
// SCENE EDIT DIALOG COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface SceneEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scene: VlogScene | null;
  sceneCount: number;
  onSubmit: (data: { name: string; description: string; actType: VlogScene['actType'] }) => void;
}

function SceneEditDialog({ open, onOpenChange, scene, sceneCount, onSubmit }: SceneEditDialogProps) {
  const [name, setName] = useState(scene?.name || '');
  const [description, setDescription] = useState(scene?.description || '');
  const [actType, setActType] = useState<VlogScene['actType']>(scene?.actType || 'custom');
  
  useEffect(() => {
    if (scene) {
      setName(scene.name);
      setDescription(scene.description);
      setActType(scene.actType);
    } else {
      setName(`Scene ${sceneCount + 1}: Custom`);
      setDescription('');
      setActType('custom');
    }
  }, [scene, sceneCount]);
  
  const handleSubmit = () => {
    onSubmit({ name, description, actType });
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#0a0a0a] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">{scene ? 'Edit Scene' : 'Add Scene'}</DialogTitle>
          <DialogDescription className="text-white/50">
            {scene ? 'Update scene details' : 'Create a new scene for your vlog'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-white/70">Scene Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Scene 1: The Hook"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-white/70">Act Type</Label>
            <Select value={actType} onValueChange={(v) => setActType(v as VlogScene['actType'])}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-white/10">
                {ACT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-white">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-white/70">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happens in this scene..."
              className="bg-white/5 border-white/10 text-white min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 text-white/70">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="relative overflow-hidden text-white hover:opacity-90"
            style={{
              background: `linear-gradient(to right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
            }}
          >
            {scene ? 'Update Scene' : 'Add Scene'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SHOT EDIT DIALOG COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface ShotEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shot: VlogShot | null;
  sceneId: string;
  shotCount: number;
  onSubmit: (data: Partial<VlogShot>) => void;
}

function ShotEditDialog({ open, onOpenChange, shot, sceneId, shotCount, onSubmit }: ShotEditDialogProps) {
  const [name, setName] = useState(shot?.name || '');
  const [description, setDescription] = useState(shot?.description || '');
  const [shotType, setShotType] = useState<VlogShot['shotType']>(shot?.shotType || 'image-ref');
  const [cameraShot, setCameraShot] = useState<string>(shot?.cameraShot || 'Medium Shot');
  
  useEffect(() => {
    if (shot) {
      setName(shot.name);
      setDescription(shot.description);
      setShotType(shot.shotType);
      setCameraShot(shot.cameraShot || 'Medium Shot');
    } else {
      const sceneNum = parseInt(sceneId.split('-')[1]) || 1;
      setName(`Shot ${sceneNum}.${shotCount + 1}: New`);
      setDescription('');
      setShotType('image-ref');
      setCameraShot('Medium Shot');
    }
  }, [shot, sceneId, shotCount]);
  
  const handleSubmit = () => {
    onSubmit({ name, description, shotType, cameraShot });
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-[#0a0a0a] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">{shot ? 'Edit Shot' : 'Add Shot'}</DialogTitle>
          <DialogDescription className="text-white/50">
            {shot ? 'Update shot details' : 'Create a new shot for this scene'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-white/70">Shot Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Shot 1.1: Opening"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-white/70">Frames Type</Label>
            <ToggleGroup
              type="single"
              value={shotType}
              onValueChange={(v) => v && setShotType(v as VlogShot['shotType'])}
              className="bg-white/5 rounded-lg p-1 justify-start"
            >
              <ToggleGroupItem value="image-ref" className="text-xs data-[state=on]:bg-pink-500 flex-1">
                <ImageIcon className="w-3 h-3 mr-1" />
                1F
              </ToggleGroupItem>
              <ToggleGroupItem value="start-end" className="text-xs data-[state=on]:bg-purple-500 flex-1">
                <Video className="w-3 h-3 mr-1" />
                2F
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          <div className="space-y-2">
            <Label className="text-white/70">Shot Type</Label>
            <Select value={cameraShot} onValueChange={setCameraShot}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select shot type" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-white/10">
                {CAMERA_SHOT_TYPES.map((type) => (
                  <SelectItem key={type} value={type} className="text-white">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-white/70">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the shot composition and action..."
              className="bg-white/5 border-white/10 text-white min-h-[80px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 text-white/70">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="relative overflow-hidden text-white hover:opacity-90"
            style={{
              background: `linear-gradient(to right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
            }}
          >
            {shot ? 'Update Shot' : 'Add Shot'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CharacterVlogSceneBreakdown({
  videoId,
  narrativeMode,
  script,
  characterName,
  theme,
  scenes: propScenes,
  shots: propShots,
  onScenesChange: propOnScenesChange,
  onShotsChange: propOnShotsChange,
  onContinuityGroupsChange: propOnContinuityGroupsChange,
  onContinuityLockedChange: propOnContinuityLockedChange,
  onNext,
}: CharacterVlogSceneBreakdownProps) {
  // Convert props to internal format
  const [sceneManifest, setSceneManifest] = useState<SceneManifest>({ scenes: [], continuityLinksEstablished: false });
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [sceneDialogOpen, setSceneDialogOpen] = useState(false);
  const [shotDialogOpen, setShotDialogOpen] = useState(false);
  const [editingScene, setEditingScene] = useState<VlogScene | null>(null);
  const [editingShot, setEditingShot] = useState<{ shot: VlogShot; sceneId: string } | null>(null);
  const [activeSceneId, setActiveSceneId] = useState<string>('');
  
  // Delete confirmation states
  const [deleteSceneId, setDeleteSceneId] = useState<string | null>(null);
  const [deleteShotInfo, setDeleteShotInfo] = useState<{ sceneId: string; shotId: string } | null>(null);

  // Auto-generate basic template on mount
  useEffect(() => {
    // Generate initial scenes
    const timestamp = Date.now();
    const initialScenes: VlogScene[] = [
      {
        id: `scene-${timestamp}-1`,
        name: `Scene 1: ${SCENE_THEMES[0].defaultName}`,
        description: script.substring(0, 120) || 'Opening hook to grab attention',
        duration: 0,
        actType: 'hook',
        shots: [
          {
            id: `scene${timestamp}-1-shot1`,
            sceneId: `scene-${timestamp}-1`,
            name: 'Shot 1.1: Opening',
            description: `${characterName} grabs attention with an engaging opening`,
            shotType: 'image-ref',
            cameraShot: 'Medium Shot',
            isLinkedToPrevious: false,
            referenceTags: ['@Character'],
          },
          {
            id: `scene${timestamp}-1-shot2`,
            sceneId: `scene-${timestamp}-1`,
            name: 'Shot 1.2: Hook Action',
            description: `Dynamic shot showing ${characterName} in action`,
            shotType: 'start-end',
            cameraShot: 'Medium Close-up',
            isLinkedToPrevious: true,
            referenceTags: ['@Character'],
          },
        ],
      },
      {
        id: `scene-${timestamp}-2`,
        name: `Scene 2: ${SCENE_THEMES[2].defaultName}`,
        description: 'Core vlog content',
        duration: 0,
        actType: 'main',
        shots: [
          {
            id: `scene${timestamp}-2-shot1`,
            sceneId: `scene-${timestamp}-2`,
            name: 'Shot 2.1: Main Story',
            description: `${characterName} shares the main content`,
            shotType: 'start-end',
            cameraShot: 'Medium Shot',
            isLinkedToPrevious: false,
            referenceTags: ['@Character'],
          },
          {
            id: `scene${timestamp}-2-shot2`,
            sceneId: `scene-${timestamp}-2`,
            name: 'Shot 2.2: B-Roll',
            description: 'Supporting footage for the narrative',
            shotType: 'image-ref',
            cameraShot: 'Wide Shot',
            isLinkedToPrevious: false,
            referenceTags: [],
          },
        ],
      },
      {
        id: `scene-${timestamp}-3`,
        name: `Scene 3: ${SCENE_THEMES[3].defaultName}`,
        description: 'Wrap up and CTA',
        duration: 0,
        actType: 'outro',
        shots: [{
          id: `scene${timestamp}-3-shot1`,
          sceneId: `scene-${timestamp}-3`,
          name: 'Shot 3.1: Closing',
          description: `${characterName} wraps up and thanks viewers`,
          shotType: 'image-ref',
          cameraShot: 'Medium Shot',
          isLinkedToPrevious: false,
          referenceTags: ['@Character'],
        }],
      },
    ];
    
    setSceneManifest({ scenes: initialScenes, continuityLinksEstablished: true });
    setExpandedScenes(new Set(initialScenes.map(s => s.id)));
  }, [characterName, theme, script]);

  // Sync with parent
  useEffect(() => {
    if (sceneManifest.scenes.length > 0) {
      // Convert back to parent format
      propOnScenesChange(sceneManifest.scenes.map((s, idx) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        duration: s.duration,
        actType: s.actType,
        shots: s.shots,
      })));
      
      const shotsMap: { [sceneId: string]: any[] } = {};
      const continuityGroupsMap: { [sceneId: string]: any[] } = {};
      let hasAnyLinks = false;

      sceneManifest.scenes.forEach((scene, sceneIdx) => {
        shotsMap[scene.id] = scene.shots.map((shot, shotIdx) => ({
          id: shot.id,
          sceneId: shot.sceneId,
          shotNumber: shotIdx + 1,
          shotType: shot.cameraShot || 'Medium Shot',
          description: shot.description,
          dialogue: '',
          cameraShot: shot.cameraShot || 'Medium Shot',
        }));

        // Build continuity groups based on isLinkedToPrevious
        const groups: any[] = [];
        let currentGroup: string[] = [];

        scene.shots.forEach((shot, shotIdx) => {
          if (shotIdx === 0) {
            // First shot always starts a potential group
            currentGroup = [shot.id];
          } else if (shot.isLinkedToPrevious) {
            // This shot is linked to previous, add to current group
            currentGroup.push(shot.id);
            hasAnyLinks = true;
          } else {
            // This shot is NOT linked, so finalize the previous group if it has >1 shot
            if (currentGroup.length > 1) {
              groups.push({
                id: `group-${scene.id}-${groups.length}`,
                shotIds: [...currentGroup],
              });
            }
            // Start a new potential group with this shot
            currentGroup = [shot.id];
          }
        });

        // Finalize the last group if it has >1 shot
        if (currentGroup.length > 1) {
          groups.push({
            id: `group-${scene.id}-${groups.length}`,
            shotIds: [...currentGroup],
          });
        }

        continuityGroupsMap[scene.id] = groups;
      });

      propOnShotsChange(shotsMap);
      propOnContinuityGroupsChange(continuityGroupsMap);
      propOnContinuityLockedChange(hasAnyLinks);
    }
  }, [sceneManifest, propOnScenesChange, propOnShotsChange, propOnContinuityGroupsChange, propOnContinuityLockedChange]);

  // Stats
  const totalShots = useMemo(() => 
    sceneManifest.scenes.reduce((sum, scene) => sum + scene.shots.length, 0),
    [sceneManifest.scenes]
  );

  const totalDuration = useMemo(() => 
    sceneManifest.scenes.reduce((sum, scene) => sum + scene.duration, 0),
    [sceneManifest.scenes]
  );

  const continuityLinks = useMemo(() => 
    sceneManifest.scenes.reduce((sum, scene) => 
      sum + scene.shots.filter(s => s.isLinkedToPrevious).length, 0),
    [sceneManifest.scenes]
  );

  // ═══════════════════════════════════════════════════════════════════════
  // CRUD HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  const updateShot = (sceneId: string, shotId: string, updates: Partial<VlogShot>) => {
    const updatedScenes = sceneManifest.scenes.map(scene => {
      if (scene.id !== sceneId) return scene;
      const updatedShots = scene.shots.map(shot =>
        shot.id === shotId ? { ...shot, ...updates } : shot
      );
      return { ...scene, shots: updatedShots };
    });
    setSceneManifest({ ...sceneManifest, scenes: updatedScenes });
  };

  const handleAddScene = (data: { name: string; description: string; actType: VlogScene['actType'] }) => {
    const sceneNum = sceneManifest.scenes.length + 1;
    
    const newScene: VlogScene = {
      id: `scene-${sceneNum}-${Date.now()}`,
      name: data.name,
      description: data.description,
      duration: 0,
      actType: data.actType,
      shots: [],
    };
    
    setSceneManifest({
      ...sceneManifest,
      scenes: [...sceneManifest.scenes, newScene],
    });
    
    setExpandedScenes(prev => new Set(Array.from(prev).concat([newScene.id])));
  };

  const handleEditScene = (sceneId: string, data: { name: string; description: string; actType: VlogScene['actType'] }) => {
    const updatedScenes = sceneManifest.scenes.map(scene =>
      scene.id === sceneId ? { ...scene, ...data } : scene
    );
    setSceneManifest({ ...sceneManifest, scenes: updatedScenes });
  };

  const handleDeleteScene = (sceneId: string) => {
    if (sceneManifest.scenes.length <= 1) return;
    const updatedScenes = sceneManifest.scenes.filter(scene => scene.id !== sceneId);
    setSceneManifest({ ...sceneManifest, scenes: updatedScenes });
    setDeleteSceneId(null);
  };

  const handleAddShot = (sceneId: string, data: Partial<VlogShot>) => {
    const scene = sceneManifest.scenes.find(s => s.id === sceneId);
    if (!scene) return;
    
    const shotNum = scene.shots.length + 1;
    const sceneNum = parseInt(sceneId.split('-')[1]) || 1;
    
    const newShot: VlogShot = {
      id: `${sceneId}-shot${shotNum}-${Date.now()}`,
      sceneId,
      name: data.name || `Shot ${sceneNum}.${shotNum}: New`,
      description: data.description || '',
      shotType: data.shotType || 'image-ref',
      cameraShot: data.cameraShot || 'Medium Shot',
      referenceTags: ['@Character'],
      isLinkedToPrevious: scene.shots.length > 0,
    };
    
    const updatedScenes = sceneManifest.scenes.map(s => {
      if (s.id !== sceneId) return s;
      const updatedShots = [...s.shots, newShot];
      return { ...s, shots: updatedShots };
    });
    
    setSceneManifest({ ...sceneManifest, scenes: updatedScenes });
  };

  const handleEditShot = (sceneId: string, shotId: string, data: Partial<VlogShot>) => {
    updateShot(sceneId, shotId, data);
  };

  const handleDeleteShot = (sceneId: string, shotId: string) => {
    const scene = sceneManifest.scenes.find(s => s.id === sceneId);
    if (!scene || scene.shots.length <= 1) return;
    
    const updatedScenes = sceneManifest.scenes.map(s => {
      if (s.id !== sceneId) return s;
      const updatedShots = s.shots.filter(shot => shot.id !== shotId);
      const reindexedShots = updatedShots.map((shot, idx) => ({
        ...shot,
        isLinkedToPrevious: idx > 0 ? shot.isLinkedToPrevious : false,
      }));
      return { ...s, shots: reindexedShots };
    });
    
    setSceneManifest({ ...sceneManifest, scenes: updatedScenes });
    setDeleteShotInfo(null);
  };

  const handleToggleLink = (sceneId: string, shotId: string) => {
    const scene = sceneManifest.scenes.find(s => s.id === sceneId);
    if (!scene) return;
    
    const shotIndex = scene.shots.findIndex(s => s.id === shotId);
    if (shotIndex <= 0) return;
    
    const currentShot = scene.shots[shotIndex];
    updateShot(sceneId, shotId, { isLinkedToPrevious: !currentShot.isLinkedToPrevious });
  };

  const toggleSceneExpanded = (sceneId: string) => {
    const newExpanded = new Set(expandedScenes);
    if (newExpanded.has(sceneId)) {
      newExpanded.delete(sceneId);
    } else {
      newExpanded.add(sceneId);
    }
    setExpandedScenes(newExpanded);
  };

  // Dialog helpers
  const openSceneEdit = (scene: VlogScene) => {
    setEditingScene(scene);
    setSceneDialogOpen(true);
  };

  const openSceneAdd = () => {
    setEditingScene(null);
    setSceneDialogOpen(true);
  };

  const openShotEdit = (shot: VlogShot, sceneId: string) => {
    setEditingShot({ shot, sceneId });
    setActiveSceneId(sceneId);
    setShotDialogOpen(true);
  };

  const openShotAdd = (sceneId: string) => {
    setEditingShot(null);
    setActiveSceneId(sceneId);
    setShotDialogOpen(true);
  };

  const handleSceneDialogSubmit = (data: { name: string; description: string; actType: VlogScene['actType'] }) => {
    if (editingScene) {
      handleEditScene(editingScene.id, data);
    } else {
      handleAddScene(data);
    }
    setEditingScene(null);
  };

  const handleShotDialogSubmit = (data: Partial<VlogShot>) => {
    if (editingShot) {
      handleEditShot(editingShot.sceneId, editingShot.shot.id, data);
    } else {
      handleAddShot(activeSceneId, data);
    }
    setEditingShot(null);
  };

  // Validation
  const hasScenes = sceneManifest.scenes.length >= 1;
  const hasShots = sceneManifest.scenes.every(scene => scene.shots.length > 0);
  const hasContinuity = sceneManifest.continuityLinksEstablished;
  const isValid = hasScenes && hasShots && hasContinuity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-[calc(100vh-12rem)] overflow-hidden"
    >
      {/* ZONE HEADER */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Film className="w-5 h-5 text-[#FF4081]" />
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                Scene Timeline
              </h2>
              <p className="text-xs text-white/50">Pre-planned vlog with automated continuity</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasContinuity && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                <Lock className="w-3 h-3 mr-1" />
                Continuity Locked
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={openSceneAdd}
              className="h-7 text-xs border-white/10 text-white/70 hover:bg-white/10"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Scene
            </Button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT - Scene/Shot Timeline */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-4 pb-4">
          {sceneManifest.scenes.map((scene, sceneIdx) => {
            const sceneTheme = SCENE_THEMES.find(t => t.id === scene.actType) || SCENE_THEMES[4];
            const isExpanded = expandedScenes.has(scene.id);
            
            return (
              <motion.div
                key={scene.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sceneIdx * 0.1 }}
              >
                {/* SCENE CONTAINER */}
                <Card className={cn(
                  "bg-white/[0.02] border-l-2 transition-all",
                  sceneTheme.accent
                )}>
                  <Collapsible open={isExpanded} onOpenChange={() => toggleSceneExpanded(scene.id)}>
                    {/* Scene Header */}
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Scene Badge */}
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm",
                          sceneTheme.badge
                        )}>
                          {sceneTheme.icon}
                        </div>
                        
                        {/* Scene Info */}
                        <CollapsibleTrigger asChild>
                          <div className="flex-1 min-w-0 cursor-pointer hover:opacity-80">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-white truncate">{scene.name}</h3>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white/5 border-white/20">
                                {scene.shots.length} shots
                              </Badge>
                            </div>
                            <p className="text-xs text-white/40 truncate">{scene.description}</p>
                          </div>
                        </CollapsibleTrigger>
                        
                        {/* Scene Actions */}
                        <div className="flex items-center gap-1">
                          {sceneManifest.scenes.length > 1 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                              onClick={(e) => { e.stopPropagation(); setDeleteSceneId(scene.id); }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                        
                        {/* Toggle */}
                        <div className="flex items-center gap-3">
                          <CollapsibleTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-white/40">
                              <ChevronDown className={cn(
                                "w-4 h-4 transition-transform",
                                isExpanded && "rotate-180"
                              )} />
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>
                    </div>

                    {/* SHOT CARDS */}
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-2">
                        {scene.shots.map((shot, shotIdx) => {
                          const prevShot = shotIdx > 0 ? scene.shots[shotIdx - 1] : null;
                          
                          return (
                            <div key={shot.id}>
                              {/* CONNECTION STATUS INDICATOR */}
                              {shot.isLinkedToPrevious && prevShot && (
                                <motion.div
                                  initial={{ opacity: 0, scaleY: 0 }}
                                  animate={{ opacity: 1, scaleY: 1 }}
                                  className="my-2 flex items-center gap-2 px-2"
                                >
                                  <div className="flex-1 h-px bg-gradient-to-r from-green-500/50 to-emerald-500/50" />
                                  <Badge className="text-[9px] bg-green-500/20 border-green-500/40 text-green-300 px-2 py-0.5">
                                    <Lock className="w-2.5 h-2.5 mr-1" />
                                    Linked: {prevShot.name.split(':')[1]?.trim() || 'Prev'} End → Start
                                  </Badge>
                                  <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/50 to-green-500/50" />
                                </motion.div>
                              )}

                              {/* Shot Card */}
                              <Card
                                className={cn(
                                  "bg-white/[0.02] border-white/[0.06] transition-all border-l-2",
                                  `border-l-[#FF4081]`
                                )}
                              >
                                <CardContent className="p-3 space-y-2">
                                  {/* Row 1: Shot Name + Camera Shot Type + Frame Type Badge + Actions */}
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={cn(
                                      "text-[10px] font-semibold px-2 py-0.5 cursor-pointer",
                                      `bg-gradient-to-r ${sceneTheme.color}`,
                                      "border-white/20"
                                    )}
                                    onClick={() => setSelectedShotId(shot.id)}
                                    >
                                      {shot.name}
                                    </Badge>
                                    
                                    {/* CAMERA SHOT TYPE BADGE (from settings) */}
                                    {shot.cameraShot && (
                                      <Badge 
                                        variant="outline" 
                                        className="text-[10px] font-semibold px-2 py-0.5 bg-orange-500/20 border-orange-500/40 text-orange-200"
                                      >
                                        {shot.cameraShot}
                                      </Badge>
                                    )}
                                    
                                    {/* FRAME TYPE BADGE */}
                                    <Badge 
                                      variant="outline" 
                                      className={cn(
                                        "text-[10px] font-semibold px-2 py-0.5",
                                        shot.shotType === 'start-end'
                                          ? "bg-purple-500/30 border-purple-500/50 text-purple-200"
                                          : "bg-pink-500/30 border-pink-500/50 text-pink-200"
                                      )}
                                    >
                                      {shot.shotType === 'start-end' ? 'Start/End Frame' : 'Single Image'}
                                    </Badge>
                                    
                                    <div className="flex-1" />
                                    
                                    {/* Shot Type Toggle */}
                                    <ToggleGroup
                                      type="single"
                                      value={shot.shotType}
                                      onValueChange={(value) => {
                                        if (value) updateShot(scene.id, shot.id, { shotType: value as any });
                                      }}
                                      className="bg-white/5 rounded p-0.5"
                                    >
                                      <ToggleGroupItem
                                        value="image-ref"
                                        className={cn(
                                          "text-[10px] px-2 py-1 h-6 gap-1",
                                          "data-[state=on]:bg-pink-500 data-[state=on]:text-white"
                                        )}
                                        title="Single Image Reference - 1 frame needed"
                                      >
                                        <ImageIcon className="w-3 h-3" />
                                        <span className="hidden sm:inline">1F</span>
                                      </ToggleGroupItem>
                                      <ToggleGroupItem
                                        value="start-end"
                                        className={cn(
                                          "text-[10px] px-2 py-1 h-6 gap-1",
                                          "data-[state=on]:bg-purple-500 data-[state=on]:text-white"
                                        )}
                                        title="Start/End Frame - 2 frames needed for motion"
                                      >
                                        <Video className="w-3 h-3" />
                                        <span className="hidden sm:inline">2F</span>
                                      </ToggleGroupItem>
                                    </ToggleGroup>
                                    
                                    {/* Shot Actions */}
                                    <div className="flex items-center gap-0.5 ml-2">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 text-white/40 hover:text-white hover:bg-white/10"
                                        onClick={() => openShotEdit(shot, scene.id)}
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </Button>
                                      {scene.shots.length > 1 && (
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-6 w-6 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                                          onClick={() => setDeleteShotInfo({ sceneId: scene.id, shotId: shot.id })}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Row 2: Description */}
                                  <div className="flex gap-3">
                                    <Textarea
                                      value={shot.description}
                                      onChange={(e) => updateShot(scene.id, shot.id, { description: e.target.value })}
                                      placeholder="Shot description..."
                                      className="flex-1 bg-white/5 border-white/10 text-white text-xs min-h-[50px] max-h-[50px] resize-none"
                                      maxLength={200}
                                    />
                                  </div>

                                  {/* Row 3: Reference Tags + Link Toggle */}
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex flex-wrap gap-1">
                                      {shot.referenceTags.filter(tag => tag !== '@Theme').map((tag) => (
                                        <Badge
                                          key={tag}
                                          variant="outline"
                                          className="text-[9px] bg-cyan-500/10 border-cyan-500/20 text-cyan-300 px-1.5 py-0"
                                        >
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                    
                                    {/* Link Toggle (only for non-first shots) */}
                                    {shotIdx > 0 && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className={cn(
                                          "h-6 text-[10px] px-2",
                                          shot.isLinkedToPrevious 
                                            ? "text-green-400 hover:text-green-300 hover:bg-green-500/10" 
                                            : "text-white/40 hover:text-white hover:bg-white/10"
                                        )}
                                        onClick={() => handleToggleLink(scene.id, shot.id)}
                                      >
                                        {shot.isLinkedToPrevious ? (
                                          <>
                                            <Link2 className="w-3 h-3 mr-1" />
                                            Linked
                                          </>
                                        ) : (
                                          <>
                                            <Unlink className="w-3 h-3 mr-1" />
                                            Unlinked
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          );
                        })}
                        
                        {/* Add Shot Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-8 mt-2 border border-dashed border-white/10 text-white/40 hover:text-white hover:bg-white/5 hover:border-white/20"
                          onClick={() => openShotAdd(scene.id)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Shot
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              </motion.div>
            );
          })}
          
          {/* Stats Summary at end of scroll */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                {hasScenes ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-white/20" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  hasScenes ? "text-white/70" : "text-white/40"
                )}>
                  {sceneManifest.scenes.length} Scenes
                </span>
              </div>

              <div className="flex items-center gap-2">
                {hasShots ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-white/20" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  hasShots ? "text-white/70" : "text-white/40"
                )}>
                  {totalShots} Shots
                </span>
              </div>

              <div className="flex items-center gap-2">
                {continuityLinks > 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-white/20" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  continuityLinks > 0 ? "text-white/70" : "text-white/40"
                )}>
                  {continuityLinks} Links
                </span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* DIALOGS */}
      <SceneEditDialog
        open={sceneDialogOpen}
        onOpenChange={setSceneDialogOpen}
        scene={editingScene}
        sceneCount={sceneManifest.scenes.length}
        onSubmit={handleSceneDialogSubmit}
      />

      <ShotEditDialog
        open={shotDialogOpen}
        onOpenChange={setShotDialogOpen}
        shot={editingShot?.shot || null}
        sceneId={activeSceneId}
        shotCount={sceneManifest.scenes.find(s => s.id === activeSceneId)?.shots.length || 0}
        onSubmit={handleShotDialogSubmit}
      />

      {/* Delete Scene Confirmation */}
      <AlertDialog open={!!deleteSceneId} onOpenChange={() => setDeleteSceneId(null)}>
        <AlertDialogContent className="bg-[#0a0a0a] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Scene?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              This will permanently delete this scene and all its shots. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white/70">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSceneId && handleDeleteScene(deleteSceneId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete Scene
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Shot Confirmation */}
      <AlertDialog open={!!deleteShotInfo} onOpenChange={() => setDeleteShotInfo(null)}>
        <AlertDialogContent className="bg-[#0a0a0a] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Shot?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              This will permanently delete this shot. Continuity links may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white/70">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteShotInfo && handleDeleteShot(deleteShotInfo.sceneId, deleteShotInfo.shotId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete Shot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
