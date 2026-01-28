// Character Vlog Scene Timeline - Adapted from Social Commerce
// ═══════════════════════════════════════════════════════════════════════════
// WITHOUT: Duration slider, Shot type badges, Frame badges, Camera/Lens settings, Target/Render duration

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, MapPin } from "lucide-react";
import { GenerationLoading } from "@/components/character-vlog/generation-loading";
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
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TextareaWithMentions } from "../narrative/textarea-with-mentions";
import type { ContinuityGroup } from "@/types/storyboard";
import { ContinuityProposal } from "./continuity-proposal";
import { ShotContinuityArrows } from "./shot-continuity-arrows";

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
  duration?: number; // Shot duration in seconds
  isLinkedToPrevious: boolean;
  referenceTags: string[];
}

interface SceneManifest {
  scenes: VlogScene[];
  continuityLinksEstablished: boolean;
}

interface CharacterVlogSceneBreakdownProps {
  videoId: string;
  workspaceId?: string;
  narrativeMode: "image-reference" | "start-end";
  referenceMode: "1F" | "2F" | "AI" | null;
  script: string;
  characterName: string;
  theme: string;
  scenes: VlogScene[];
  shots: { [sceneId: string]: VlogShot[] };
  characters?: Array<{ id: string; name: string; description?: string }>;  // For @mention autocomplete
  locations?: Array<{ id: string; name: string; description?: string }>;  // For @mention autocomplete
  continuityLocked?: boolean;
  continuityGroups?: { [sceneId: string]: ContinuityGroup[] };
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
              onChange={(e) => {
                setDescription(e.target.value);
                // Auto-resize
                const target = e.target;
                target.style.height = 'auto';
                target.style.height = `${Math.max(target.scrollHeight, 100)}px`;
              }}
              placeholder="Describe what happens in this scene..."
              className="bg-white/5 border-white/10 text-white resize-none overflow-hidden"
              style={{ minHeight: '100px', height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.max(target.scrollHeight, 100)}px`;
              }}
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
  canChangeFrameType: boolean;
  defaultFrameType: VlogShot['shotType'];
}

function ShotEditDialog({ open, onOpenChange, shot, sceneId, shotCount, onSubmit, canChangeFrameType, defaultFrameType }: ShotEditDialogProps) {
  const [name, setName] = useState(shot?.name || '');
  const [description, setDescription] = useState(shot?.description || '');
  const [shotType, setShotType] = useState<VlogShot['shotType']>(shot?.shotType || defaultFrameType);
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
      setShotType(defaultFrameType);
      setCameraShot('Medium Shot');
    }
  }, [shot, sceneId, shotCount, defaultFrameType]);
  
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
          
          {canChangeFrameType ? (
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
          ) : (
            <div className="space-y-2">
              <Label className="text-white/70">Frames Type</Label>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">
                    {shotType === 'image-ref' ? '1F (Single Frame)' : '2F (Start/End Frames)'}
                  </span>
                  <Badge variant="outline" className="text-[10px] border-white/20 text-white/50">
                    <Lock className="w-3 h-3 mr-1" />
                    Locked
                  </Badge>
                </div>
                <p className="text-xs text-white/40 mt-1">
                  Frame type is fixed by your selected reference mode
                </p>
              </div>
            </div>
          )}
          
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
  workspaceId,
  narrativeMode,
  referenceMode,
  script,
  characterName,
  theme,
  scenes: propScenes,
  shots: propShots,
  characters = [],
  locations = [],
  continuityLocked: propsContinuityLocked = false,
  continuityGroups: propsGroups = {},
  onScenesChange: propOnScenesChange,
  onShotsChange: propOnShotsChange,
  onContinuityGroupsChange: propOnContinuityGroupsChange,
  onContinuityLockedChange: propOnContinuityLockedChange,
  onNext,
}: CharacterVlogSceneBreakdownProps) {
  const { toast } = useToast();
  const [isGeneratingBreakdown, setIsGeneratingBreakdown] = useState(false);
  const hasAutoGeneratedRef = useRef(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  // Continuity is now automatically generated - no manual analysis needed

  // Three-state continuity groups system (approved/proposed/declined)
  const [localApprovedGroups, setLocalApprovedGroups] = useState<{ [sceneId: string]: ContinuityGroup[] }>({});
  const [localProposalDraft, setLocalProposalDraft] = useState<{ [sceneId: string]: ContinuityGroup[] }>({});
  const [localDeclinedGroups, setLocalDeclinedGroups] = useState<{ [sceneId: string]: ContinuityGroup[] }>({});
  const [localContinuityLocked, setLocalContinuityLocked] = useState(propsContinuityLocked);
  const [isGeneratingContinuity, setIsGeneratingContinuity] = useState(false);

  // Refs for shot elements to measure their positions (per scene)
  const shotRefsMap = useRef<{ [sceneId: string]: React.RefObject<(HTMLDivElement | null)[]> }>({});

  // Initialize refs for a scene if not already initialized
  const getShotRefs = (sceneId: string, shotCount: number): React.RefObject<(HTMLDivElement | null)[]> => {
    if (!shotRefsMap.current[sceneId]) {
      const newRef: React.RefObject<(HTMLDivElement | null)[]> = {
        get current() {
          return this._current || [];
        },
        set current(value) {
          this._current = value;
        },
        _current: new Array(shotCount).fill(null) as (HTMLDivElement | null)[],
      } as any;
      shotRefsMap.current[sceneId] = newRef;
    } else if (shotRefsMap.current[sceneId].current && shotRefsMap.current[sceneId].current.length !== shotCount) {
      // Resize if shot count changed
      const existing = shotRefsMap.current[sceneId].current || [];
      (shotRefsMap.current[sceneId] as any)._current = new Array(shotCount).fill(null).map((_, i) => (existing[i] || null));
    }
    return shotRefsMap.current[sceneId];
  };

  // Helper to rebuild groups from approved connections (not currently used, but kept for reference)
  const rebuildGroupsFromConnections = (
    originalGroup: ContinuityGroup,
    approvedConnections: Set<string>, // Set of "shotId1-shotId2" strings
    sceneId: string
  ): { approved: ContinuityGroup[]; proposed: ContinuityGroup[] } => {
    const originalShotIds = originalGroup.shotIds as string[];
    const approved: ContinuityGroup[] = [];
    const proposed: ContinuityGroup[] = [];

    // Build chains of approved connections
    const chains: string[][] = [];
    let currentChain: string[] = [originalShotIds[0]];

    for (let i = 0; i < originalShotIds.length - 1; i++) {
      const currentShot = originalShotIds[i];
      const nextShot = originalShotIds[i + 1];
      const connectionKey = `${currentShot}-${nextShot}`;

      if (approvedConnections.has(connectionKey)) {
        // Connection is approved, continue chain
        currentChain.push(nextShot);
      } else {
        // Connection not approved, finalize current chain and start new one
        if (currentChain.length >= 2) {
          chains.push([...currentChain]);
        }
        currentChain = [nextShot];
      }
    }

    // Finalize last chain
    if (currentChain.length >= 2) {
      chains.push(currentChain);
    }

    // Create approved groups from chains
    chains.forEach((chain, index) => {
      approved.push({
        ...originalGroup,
        id: index === 0 ? originalGroup.id : `group-${Date.now()}-${Math.random()}`,
        shotIds: chain,
        status: 'approved',
        approvedAt: new Date(),
      });
    });

    // Remaining unapproved connections become proposed
    const unapprovedShots: string[] = [];
    for (let i = 0; i < originalShotIds.length - 1; i++) {
      const currentShot = originalShotIds[i];
      const nextShot = originalShotIds[i + 1];
      const connectionKey = `${currentShot}-${nextShot}`;

      if (!approvedConnections.has(connectionKey)) {
        if (unapprovedShots.length === 0 || unapprovedShots[unapprovedShots.length - 1] !== currentShot) {
          unapprovedShots.push(currentShot);
        }
        unapprovedShots.push(nextShot);
      }
    }

    // Group consecutive unapproved shots
    if (unapprovedShots.length >= 2) {
      let chain: string[] = [unapprovedShots[0]];
      for (let i = 1; i < unapprovedShots.length; i++) {
        if (unapprovedShots[i] === unapprovedShots[i - 1]) continue;
        const prevIdx = originalShotIds.indexOf(unapprovedShots[i - 1]);
        const currIdx = originalShotIds.indexOf(unapprovedShots[i]);
        if (currIdx === prevIdx + 1) {
          chain.push(unapprovedShots[i]);
        } else {
          if (chain.length >= 2) {
            proposed.push({
              ...originalGroup,
              id: `proposed-${Date.now()}-${Math.random()}`,
              shotIds: chain,
              status: 'proposed',
            });
          }
          chain = [unapprovedShots[i]];
        }
      }
      if (chain.length >= 2) {
        proposed.push({
          ...originalGroup,
          id: `proposed-${Date.now()}-${Math.random()}`,
          shotIds: chain,
          status: 'proposed',
        });
      }
    }

    return { approved, proposed };
  };

  // Connection handlers are defined after variables are initialized (see below)

  // Initialize from propsGroups by separating approved vs proposed vs declined
  useEffect(() => {
    const approved: { [sceneId: string]: ContinuityGroup[] } = {};
    const proposed: { [sceneId: string]: ContinuityGroup[] } = {};
    const declined: { [sceneId: string]: ContinuityGroup[] } = {};
    
    Object.entries(propsGroups).forEach(([sceneId, groups]) => {
      if (Array.isArray(groups)) {
        groups.forEach((group: any) => {
          // Default to "approved" if status is missing (backward compatibility)
          const status = group.status || "approved";
          if (status === "approved") {
            if (!approved[sceneId]) approved[sceneId] = [];
            approved[sceneId].push(group as ContinuityGroup);
          } else if (status === "proposed") {
            if (!proposed[sceneId]) proposed[sceneId] = [];
            proposed[sceneId].push(group as ContinuityGroup);
          } else if (status === "declined") {
            if (!declined[sceneId]) declined[sceneId] = [];
            declined[sceneId].push(group as ContinuityGroup);
          }
        });
      }
    });
    
    setLocalApprovedGroups(approved);
    setLocalProposalDraft(proposed);
    setLocalDeclinedGroups(declined);
  }, [JSON.stringify(propsGroups)]); // Use JSON.stringify to detect deep changes

  // If parent provides callback, use props as source of truth; otherwise use local state
  const hasParentCallback = Boolean(propOnContinuityGroupsChange);
  
  // Merge approved, proposed, and declined groups for display
  const mergeAllGroups = (
    approved: { [sceneId: string]: ContinuityGroup[] }, 
    proposed: { [sceneId: string]: ContinuityGroup[] },
    declined: { [sceneId: string]: ContinuityGroup[] }
  ) => {
    const merged: { [sceneId: string]: ContinuityGroup[] } = {};
    
    // Add all approved groups
    Object.entries(approved).forEach(([sceneId, groups]) => {
      merged[sceneId] = [...groups];
    });
    
    // Add all proposed groups
    Object.entries(proposed).forEach(([sceneId, groups]) => {
      if (!merged[sceneId]) merged[sceneId] = [];
      merged[sceneId].push(...groups);
    });
    
    // Add all declined groups
    Object.entries(declined).forEach(([sceneId, groups]) => {
      if (!merged[sceneId]) merged[sceneId] = [];
      merged[sceneId].push(...groups);
    });
    
    return merged;
  };

  // Migration: Convert isLinkedToPrevious flags to continuity groups when scenes are loaded
  // This runs after scenes are loaded from props and if no groups exist
  useEffect(() => {
    // Only migrate if:
    // 1. We have scenes loaded
    // 2. No groups exist in props
    // 3. We haven't already migrated (check if any shots have isLinkedToPrevious)
    if (sceneManifest.scenes.length === 0) return;
    
    const hasGroups = Object.keys(propsGroups).length > 0 && 
      Object.values(propsGroups).some(groups => Array.isArray(groups) && groups.length > 0);
    
    if (hasGroups) return; // Already have groups, no migration needed
    
    // Check if any shots have isLinkedToPrevious (indicating old data format)
    const hasLinkedShots = sceneManifest.scenes.some(scene =>
      scene.shots.some(shot => shot.isLinkedToPrevious)
    );
    
    if (!hasLinkedShots) return; // No linked shots, nothing to migrate
    
    // Perform migration: convert isLinkedToPrevious to groups
    const migratedGroups: { [sceneId: string]: ContinuityGroup[] } = {};
    sceneManifest.scenes.forEach(scene => {
      const groups = convertShotsToGroups(scene.id, scene.shots);
      if (groups.length > 0) {
        // Mark migrated groups as "approved" (they were already linked)
        groups.forEach(group => {
          group.status = "approved";
          group.approvedAt = new Date();
        });
        migratedGroups[scene.id] = groups;
      }
    });
    
    // If we migrated groups, notify parent
    if (Object.keys(migratedGroups).length > 0 && hasParentCallback) {
      const merged = mergeAllGroups(migratedGroups, {}, {});
      propOnContinuityGroupsChange(merged);
      console.log('[scene-breakdown] Migrated isLinkedToPrevious flags to continuity groups:', {
        sceneCount: Object.keys(migratedGroups).length,
        totalGroups: Object.values(migratedGroups).flat().length,
      });
    }
  }, [sceneManifest.scenes.length, JSON.stringify(propsGroups), hasParentCallback, propOnContinuityGroupsChange]); // Run when scenes load or props change
  
  const approvedGroups = hasParentCallback 
    ? Object.fromEntries(
        Object.entries(propsGroups).map(([sceneId, groups]) => [
          sceneId, 
          (Array.isArray(groups) ? groups : []).filter((g: any) => (g.status || "approved") === "approved")
        ]).filter(([_, groups]) => Array.isArray(groups) && groups.length > 0)
      )
    : localApprovedGroups;
    
  const proposalDraft = hasParentCallback
    ? Object.fromEntries(
        Object.entries(propsGroups).map(([sceneId, groups]) => [
          sceneId,
          (Array.isArray(groups) ? groups : []).filter((g: any) => (g.status || "approved") === "proposed")
        ]).filter(([_, groups]) => Array.isArray(groups) && groups.length > 0)
      )
    : localProposalDraft;
  
  const declinedGroups = hasParentCallback
    ? Object.fromEntries(
        Object.entries(propsGroups).map(([sceneId, groups]) => [
          sceneId,
          (Array.isArray(groups) ? groups : []).filter((g: any) => (g.status || "approved") === "declined")
        ]).filter(([_, groups]) => Array.isArray(groups) && groups.length > 0)
      )
    : localDeclinedGroups;
  
  const continuityGroups = mergeAllGroups(approvedGroups, proposalDraft, declinedGroups);
  
  // Helper to find a group containing both shot IDs
  const findGroupContainingShots = (shotId1: string, shotId2: string): {
    group: ContinuityGroup;
    sceneId: string;
    status: 'proposed' | 'approved' | 'declined';
  } | null => {
    // Check in proposed groups
    for (const [sceneId, groups] of Object.entries(proposalDraft)) {
      const group = (groups as ContinuityGroup[]).find((g: ContinuityGroup) => {
        const shotIds = g.shotIds as string[];
        return shotIds.includes(shotId1) && shotIds.includes(shotId2);
      });
      if (group) return { group, sceneId, status: 'proposed' };
    }

    // Check in approved groups
    for (const [sceneId, groups] of Object.entries(approvedGroups)) {
      const group = (groups as ContinuityGroup[]).find((g: ContinuityGroup) => {
        const shotIds = g.shotIds as string[];
        return shotIds.includes(shotId1) && shotIds.includes(shotId2);
      });
      if (group) return { group, sceneId, status: 'approved' };
    }

    // Check in declined groups
    for (const [sceneId, groups] of Object.entries(declinedGroups)) {
      const group = (groups as ContinuityGroup[]).find((g: ContinuityGroup) => {
        const shotIds = g.shotIds as string[];
        return shotIds.includes(shotId1) && shotIds.includes(shotId2);
      });
      if (group) return { group, sceneId, status: 'declined' };
    }

    return null;
  };
  
  // Update all three maps and notify parent
  const updateAllGroupMaps = (
    approved: { [sceneId: string]: ContinuityGroup[] },
    proposed: { [sceneId: string]: ContinuityGroup[] },
    declined: { [sceneId: string]: ContinuityGroup[] }
  ) => {
    if (hasParentCallback) {
      const merged = mergeAllGroups(approved, proposed, declined);
      propOnContinuityGroupsChange(merged);
    } else {
      setLocalApprovedGroups(approved);
      setLocalProposalDraft(proposed);
      setLocalDeclinedGroups(declined);
    }
  };

  // Sync local lock state with prop when it changes
  useEffect(() => {
    setLocalContinuityLocked(propsContinuityLocked);
  }, [propsContinuityLocked]);

  // Group management functions
  const handleGroupApprove = (sceneId: string, groupId: string) => {
    const approved = { ...approvedGroups };
    const proposed = { ...proposalDraft };
    const declined = { ...declinedGroups };

    // Find and move group from proposed/declined to approved
    let groupToApprove: ContinuityGroup | null = null;

    // Check in proposed
    if (proposed[sceneId]) {
      const index = proposed[sceneId].findIndex((g: ContinuityGroup) => g.id === groupId);
      if (index !== -1) {
        groupToApprove = proposed[sceneId][index];
        proposed[sceneId] = proposed[sceneId].filter((g: ContinuityGroup) => g.id !== groupId);
        if (proposed[sceneId].length === 0) delete proposed[sceneId];
      }
    }

    // Check in declined
    if (!groupToApprove && declined[sceneId]) {
      const index = declined[sceneId].findIndex((g: ContinuityGroup) => g.id === groupId);
      if (index !== -1) {
        groupToApprove = declined[sceneId][index];
        declined[sceneId] = declined[sceneId].filter((g: ContinuityGroup) => g.id !== groupId);
        if (declined[sceneId].length === 0) delete declined[sceneId];
      }
    }

    if (groupToApprove) {
      // Update group status and approvedAt
      const updatedGroup: ContinuityGroup = {
        ...groupToApprove,
        status: "approved",
        approvedAt: new Date(),
      };

      if (!approved[sceneId]) approved[sceneId] = [];
      approved[sceneId].push(updatedGroup);

      updateAllGroupMaps(approved, proposed, declined);
      toast({
        title: "Continuity Group Approved",
        description: "The continuity connection has been approved.",
      });
    }
  };

  const handleGroupDecline = (sceneId: string, groupId: string) => {
    const approved = { ...approvedGroups };
    const proposed = { ...proposalDraft };
    const declined = { ...declinedGroups };

    // Find and move group from proposed/approved to declined
    let groupToDecline: ContinuityGroup | null = null;

    // Check in proposed
    if (proposed[sceneId]) {
      const index = proposed[sceneId].findIndex((g: ContinuityGroup) => g.id === groupId);
      if (index !== -1) {
        groupToDecline = proposed[sceneId][index];
        proposed[sceneId] = proposed[sceneId].filter((g: ContinuityGroup) => g.id !== groupId);
        if (proposed[sceneId].length === 0) delete proposed[sceneId];
      }
    }

    // Check in approved
    if (!groupToDecline && approved[sceneId]) {
      const index = approved[sceneId].findIndex((g: ContinuityGroup) => g.id === groupId);
      if (index !== -1) {
        groupToDecline = approved[sceneId][index];
        approved[sceneId] = approved[sceneId].filter((g: ContinuityGroup) => g.id !== groupId);
        if (approved[sceneId].length === 0) delete approved[sceneId];
      }
    }

    if (groupToDecline) {
      // Update group status
      const updatedGroup: ContinuityGroup = {
        ...groupToDecline,
        status: "declined",
      };

      if (!declined[sceneId]) declined[sceneId] = [];
      declined[sceneId].push(updatedGroup);

      updateAllGroupMaps(approved, proposed, declined);
      toast({
        title: "Continuity Group Declined",
        description: "The continuity connection has been declined.",
      });
    }
  };

  const handleGroupEdit = (sceneId: string, updatedGroup: ContinuityGroup) => {
    const approved = { ...approvedGroups };
    const proposed = { ...proposalDraft };
    const declined = { ...declinedGroups };

    // Find and update group in the appropriate map
    const status = updatedGroup.status || "proposed";
    let found = false;

    if (status === "approved" && approved[sceneId]) {
      const index = approved[sceneId].findIndex((g: ContinuityGroup) => g.id === updatedGroup.id);
      if (index !== -1) {
        approved[sceneId][index] = { ...updatedGroup, editedAt: new Date() };
        found = true;
      }
    } else if (status === "proposed" && proposed[sceneId]) {
      const index = proposed[sceneId].findIndex((g: ContinuityGroup) => g.id === updatedGroup.id);
      if (index !== -1) {
        proposed[sceneId][index] = { ...updatedGroup, editedAt: new Date() };
        found = true;
      }
    } else if (status === "declined" && declined[sceneId]) {
      const index = declined[sceneId].findIndex((g: ContinuityGroup) => g.id === updatedGroup.id);
      if (index !== -1) {
        declined[sceneId][index] = updatedGroup;
        found = true;
      }
    }

    if (found) {
      updateAllGroupMaps(approved, proposed, declined);
      toast({
        title: "Continuity Group Updated",
        description: "The continuity group has been updated.",
      });
    }
  };

  const handleLockContinuity = () => {
    // Get the latest merged groups before locking
    const latestGroups = mergeAllGroups(approvedGroups, proposalDraft, declinedGroups);
    
    // Update parent with both locked state and latest groups
    setLocalContinuityLocked(true);
    propOnContinuityLockedChange(true);
    
    // Ensure parent has the latest groups before locking
    if (hasParentCallback) {
      propOnContinuityGroupsChange(latestGroups);
    }
    
    toast({
      title: "Continuity Locked",
      description: "Continuity connections are now locked. Saving to database...",
    });
  };

  // Handler for approving a connection from arrows
  // This updates the group to include only approved consecutive connections
  const handleApproveConnection = (shotId1: string, shotId2: string) => {
    const found = findGroupContainingShots(shotId1, shotId2);
    if (!found) return;

    const { group, sceneId, status } = found;
    const approved = { ...approvedGroups };
    const proposed = { ...proposalDraft };
    const declined = { ...declinedGroups };

    const originalShotIds = group.shotIds as string[];
    const idx1 = originalShotIds.indexOf(shotId1);
    const idx2 = originalShotIds.indexOf(shotId2);

    if (idx1 === -1 || idx2 === -1 || idx2 !== idx1 + 1) return;

    // Check if there's an existing approved group that contains shotId1 and can be extended with shotId2
    let existingApprovedGroup: ContinuityGroup | null = null;
    let existingGroupIndex = -1;
    if (approved[sceneId]) {
      approved[sceneId].forEach((g: ContinuityGroup, index: number) => {
        const ids = g.shotIds as string[];
        const lastId = ids[ids.length - 1];
        // If the existing group ends with shotId1 and shotId2 comes right after in the original group
        if (lastId === shotId1) {
          const lastIdx = originalShotIds.indexOf(lastId);
          const nextIdx = originalShotIds.indexOf(shotId2);
          if (nextIdx === lastIdx + 1) {
            existingApprovedGroup = g;
            existingGroupIndex = index;
          }
        }
      });
    }

    let approvedShotIds: string[] = [];

    if (existingApprovedGroup && existingGroupIndex !== -1 && approved[sceneId]) {
      // Extend existing approved group with the new connection
      const groupToExtend = existingApprovedGroup as ContinuityGroup;
      const existingIds = groupToExtend.shotIds as string[];
      if (!existingIds.includes(shotId2)) {
        approvedShotIds = [...existingIds, shotId2];
        approved[sceneId][existingGroupIndex] = {
          ...groupToExtend,
          shotIds: approvedShotIds,
          status: 'approved',
          approvedAt: new Date(),
        };
      } else {
        approvedShotIds = existingIds;
      }
    } else {
      // Create new approved group: include all shots from the start up to and including the approved connection
      for (let i = 0; i <= idx2; i++) {
        approvedShotIds.push(originalShotIds[i]);
      }

      if (approvedShotIds.length >= 2) {
        if (!approved[sceneId]) approved[sceneId] = [];
        approved[sceneId].push({
          ...group,
          shotIds: approvedShotIds,
          status: 'approved',
          approvedAt: new Date(),
        });
      }
    }

    // Remove old group from its current location (only if it's not the same as the approved group)
    // But only remove it if we're not extending an existing approved group (to avoid removing the group we're extending)
    if (status === 'proposed' && proposed[sceneId]) {
      if (!existingApprovedGroup || (existingApprovedGroup && (group as ContinuityGroup).id !== (existingApprovedGroup as ContinuityGroup).id)) {
        proposed[sceneId] = proposed[sceneId].filter((g: ContinuityGroup) => g.id !== (group as ContinuityGroup).id);
        if (proposed[sceneId].length === 0) delete proposed[sceneId];
      }
    } else if (status === 'approved' && approved[sceneId]) {
      // If the group was already approved, remove it since we're creating/updating a new approved group
      if (!existingApprovedGroup || (existingApprovedGroup && (group as ContinuityGroup).id !== (existingApprovedGroup as ContinuityGroup).id)) {
        approved[sceneId] = approved[sceneId].filter((g: ContinuityGroup) => g.id !== (group as ContinuityGroup).id);
        if (approved[sceneId].length === 0) delete approved[sceneId];
      }
    } else if (status === 'declined' && declined[sceneId]) {
      declined[sceneId] = declined[sceneId].filter((g: ContinuityGroup) => g.id !== (group as ContinuityGroup).id);
      if (declined[sceneId].length === 0) delete declined[sceneId];
    }

    // Keep remaining unapproved connections as proposed groups
    // If we approved 1.1→1.2 in [1.1, 1.2, 1.3], we should preserve 1.2→1.3 as a proposed group
    if (approvedShotIds.length >= 2) {
      const lastApprovedShot = approvedShotIds[approvedShotIds.length - 1];
      const lastApprovedIndex = originalShotIds.indexOf(lastApprovedShot);
      
      // If there are more shots after the approved ones, create a proposed group starting from the last approved shot
      if (lastApprovedIndex >= 0 && lastApprovedIndex < originalShotIds.length - 1) {
        // Create a proposed group that includes the last approved shot and all remaining consecutive shots
        // This preserves the connection from the last approved shot to the next one
        const remainingConsecutive: string[] = [lastApprovedShot];
        for (let i = lastApprovedIndex + 1; i < originalShotIds.length; i++) {
          remainingConsecutive.push(originalShotIds[i]);
        }
        
        if (remainingConsecutive.length >= 2) {
          if (!proposed[sceneId]) proposed[sceneId] = [];
          
          // Check if this proposed group already exists (to avoid duplicates)
          const alreadyExists = proposed[sceneId].some((g: ContinuityGroup) => {
            const gIds = g.shotIds as string[];
            return gIds.length === remainingConsecutive.length &&
                   gIds.every((id, idx) => id === remainingConsecutive[idx]);
          });
          
          if (!alreadyExists) {
            proposed[sceneId].push({
              ...group,
              id: `proposed-${Date.now()}-${Math.random()}`,
              shotIds: remainingConsecutive,
              status: 'proposed',
              approvedAt: null,
            });
          }
        }
      }
    }

    updateAllGroupMaps(approved, proposed, declined);
  };

  // Handler for declining a connection from arrows
  // This removes the connection and splits/updates the group
  const handleDeclineConnection = (shotId1: string, shotId2: string) => {
    const found = findGroupContainingShots(shotId1, shotId2);
    if (!found) return;

    const { group, sceneId, status } = found;
    const approved = { ...approvedGroups };
    const proposed = { ...proposalDraft };
    const declined = { ...declinedGroups };

    const originalShotIds = group.shotIds as string[];
    const idx1 = originalShotIds.indexOf(shotId1);
    const idx2 = originalShotIds.indexOf(shotId2);

    if (idx1 === -1 || idx2 === -1 || idx2 !== idx1 + 1) return;

    // Split the group at the declined connection
    const beforeConnection = originalShotIds.slice(0, idx2);
    const afterConnection = originalShotIds.slice(idx2);

    // Remove old group
    if (status === 'proposed' && proposed[sceneId]) {
      proposed[sceneId] = proposed[sceneId].filter((g: ContinuityGroup) => g.id !== group.id);
      if (proposed[sceneId].length === 0) delete proposed[sceneId];
    } else if (status === 'approved' && approved[sceneId]) {
      approved[sceneId] = approved[sceneId].filter((g: ContinuityGroup) => g.id !== group.id);
      if (approved[sceneId].length === 0) delete approved[sceneId];
    } else if (status === 'declined' && declined[sceneId]) {
      declined[sceneId] = declined[sceneId].filter((g: ContinuityGroup) => g.id !== group.id);
      if (declined[sceneId].length === 0) delete declined[sceneId];
    }

    // Keep shots before the declined connection (if at least 2 shots)
    if (beforeConnection.length >= 2) {
      const beforeGroup: ContinuityGroup = {
        ...group,
        shotIds: beforeConnection,
        status: status === 'approved' ? 'approved' : 'proposed',
      };
      if (status === 'approved') {
        if (!approved[sceneId]) approved[sceneId] = [];
        approved[sceneId].push(beforeGroup);
      } else {
        if (!proposed[sceneId]) proposed[sceneId] = [];
        proposed[sceneId].push(beforeGroup);
      }
    }

    // Create new proposed group from shots after the declined connection (if at least 2 shots)
    if (afterConnection.length >= 2) {
      const afterGroup: ContinuityGroup = {
        ...group,
        id: `group-${Date.now()}-${Math.random()}`,
        shotIds: afterConnection,
        status: 'proposed',
        approvedAt: null,
      };
      if (!proposed[sceneId]) proposed[sceneId] = [];
      proposed[sceneId].push(afterGroup);
    }

    updateAllGroupMaps(approved, proposed, declined);
  };

  // Determine reference mode capabilities
  const canChangeFrameType = referenceMode === "AI"; // Only AI mode allows frame type changes
  const showContinuityButton = false; // Agent automatically determines continuity in 2F and AI modes
  // Calculate defaultFrameType based on referenceMode
  // If referenceMode is null, try to infer from saved shots, otherwise default to "start-end"
  const defaultFrameType = referenceMode === "1F" 
    ? "image-ref" 
    : referenceMode === "2F" 
    ? "start-end" 
    : referenceMode === "AI"
    ? "start-end"
    : "start-end"; // Fallback if referenceMode is null
  

  // Load scenes from props first (before auto-generation)
  useEffect(() => {
    if (propScenes && propScenes.length > 0 && sceneManifest.scenes.length === 0) {
      // Convert propScenes to VlogScene format
      const vlogScenes: VlogScene[] = propScenes.map((scene) => ({
        id: scene.id,
        name: scene.name,
        description: scene.description,
        duration: scene.duration,
        actType: scene.actType || 'main',
        shots: propShots[scene.id]?.map((shot) => {
          // Preserve saved shotType - only use defaultFrameType if shotType is truly missing
          // This ensures shots keep their original type even if referenceMode changes
          const savedShotType = (shot.shotType && (shot.shotType === 'image-ref' || shot.shotType === 'start-end')) 
            ? shot.shotType 
            : null;
          
          return {
            id: shot.id,
            sceneId: shot.sceneId,
            name: shot.name,
            description: shot.description,
            shotType: savedShotType || defaultFrameType,
            cameraShot: shot.cameraShot || 'Medium Shot',
            duration: shot.duration, // Preserve shot duration from generator
            isLinkedToPrevious: shot.isLinkedToPrevious || false,
            referenceTags: shot.referenceTags || [],
          };
        }) || [],
      }));

      setSceneManifest({ scenes: vlogScenes, continuityLinksEstablished: false });
      setExpandedScenes(new Set(vlogScenes.map(s => s.id)));
      hasAutoGeneratedRef.current = true; // Mark as loaded so we don't auto-generate
      console.log('[scene-breakdown] Loaded scenes from props:', { 
        count: vlogScenes.length, 
        referenceMode,
        defaultFrameType,
        firstShotSample: vlogScenes[0]?.shots[0],
      });

      // Automatically generate continuity groups from loaded shots (if no groups exist in props)
      // This ensures continuity is always available, even for existing data
      // Note: This will be handled by the migration useEffect below, so we don't duplicate here
    }
  }, [propScenes, propShots, sceneManifest.scenes.length, propsGroups, hasParentCallback, propOnContinuityGroupsChange]);

  // Auto-generate breakdown ONLY if no scenes exist in props AND no scenes in manifest
  useEffect(() => {
    // Don't auto-generate if:
    // 1. We already have scenes in props (saved data)
    // 2. We already have scenes in manifest (already loaded)
    // 3. We've already attempted generation
    // 4. No script available
    if (
      propScenes && propScenes.length > 0 || 
      sceneManifest.scenes.length > 0 || 
      hasAutoGeneratedRef.current || 
      !script || 
      !script.trim().length || 
      isGeneratingBreakdown
    ) {
      return;
    }

    // Set loading state immediately to prevent empty state flash
    setIsGeneratingBreakdown(true);
    
    // Small delay to ensure component is fully mounted and props are loaded
    const timer = setTimeout(() => {
      // Double-check props weren't loaded during the delay
      if (propScenes && propScenes.length > 0) {
        console.log('[scene-breakdown] Props loaded during delay, skipping auto-generation');
        setIsGeneratingBreakdown(false);
        return;
      }
      console.log('[scene-breakdown] Auto-generating breakdown on mount');
      handleGenerateBreakdown();
    }, 500); // Reduced delay since we show loading state immediately
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propScenes?.length, sceneManifest.scenes.length, script, isGeneratingBreakdown]); // Check propScenes length

  const handleGenerateBreakdown = async () => {
    if (!script || !script.trim()) {
      toast({
        title: "Script Required",
        description: "Please generate a script first before generating breakdown.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingBreakdown(true);
    hasAutoGeneratedRef.current = true;

    try {
      console.log('[scene-breakdown] Generating breakdown...', { videoId, scriptLength: script.length });

      const response = await fetch('/api/character-vlog/breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ videoId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate breakdown' }));
        console.error('[scene-breakdown] API error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const generatedScenes = data.scenes || [];
      const generatedShots = data.shots || {};
      const generatedContinuityGroups = data.continuityGroups || {};

      if (generatedScenes.length === 0) {
        throw new Error('No scenes were generated');
      }

      console.log('[scene-breakdown] Breakdown generated:', {
        sceneCount: generatedScenes.length,
        shotCount: Object.values(generatedShots).flat().length,
        continuityGroupsCount: Object.keys(generatedContinuityGroups).length,
        totalGroups: Object.values(generatedContinuityGroups).flat().length,
      });

      // Convert generated scenes to VlogScene format
      const vlogScenes: VlogScene[] = generatedScenes.map((scene: any) => ({
        id: scene.id,
        name: scene.name,
        description: scene.description,
        duration: scene.duration,
        actType: scene.actType || 'main',
        shots: (scene.shots || generatedShots[scene.id] || []).map((shot: any) => ({
          id: shot.id,
          sceneId: shot.sceneId,
          name: shot.name,
          description: shot.description,
          // Preserve saved shotType - only use defaultFrameType if shotType is truly missing
          shotType: (shot.shotType && (shot.shotType === 'image-ref' || shot.shotType === 'start-end')) 
            ? shot.shotType 
            : defaultFrameType,
          cameraShot: shot.cameraShot || 'Medium Shot',
          duration: shot.duration, // Preserve shot duration from generator
          isLinkedToPrevious: shot.isLinkedToPrevious || false,
          referenceTags: shot.referenceTags || [],
        })),
      }));

      // In 2F and AI modes, continuity is automatically determined by the agent
      // - 2F: All shots are 2F, agent analyzes continuity between consecutive shots
      // - AI: Agent determines shot types (1F/2F), then analyzes continuity based on rules
      //   (1F can't start groups, but can be second in group if previous is 2F)
      const continuityEstablished = (referenceMode === "2F" || referenceMode === "AI") 
        ? true 
        : sceneManifest.continuityLinksEstablished;
      setSceneManifest({ scenes: vlogScenes, continuityLinksEstablished: continuityEstablished });
      setExpandedScenes(new Set(vlogScenes.map(s => s.id)));

      // Use server-generated continuity groups (already properly structured)
      if (Object.keys(generatedContinuityGroups).length > 0) {
        // Separate server groups by status
        const serverProposed: { [sceneId: string]: ContinuityGroup[] } = {};
        const serverApproved: { [sceneId: string]: ContinuityGroup[] } = {};
        const serverDeclined: { [sceneId: string]: ContinuityGroup[] } = {};
        
        Object.entries(generatedContinuityGroups).forEach(([sceneId, groups]: [string, any]) => {
          if (Array.isArray(groups)) {
            groups.forEach((group: any) => {
              const status = group.status || "proposed";
              if (status === "proposed") {
                if (!serverProposed[sceneId]) serverProposed[sceneId] = [];
                serverProposed[sceneId].push(group as ContinuityGroup);
              } else if (status === "approved") {
                if (!serverApproved[sceneId]) serverApproved[sceneId] = [];
                serverApproved[sceneId].push(group as ContinuityGroup);
              } else if (status === "declined") {
                if (!serverDeclined[sceneId]) serverDeclined[sceneId] = [];
                serverDeclined[sceneId].push(group as ContinuityGroup);
              }
            });
          }
        });
        
        // Merge with existing groups (preserve user edits/approvals from other scenes)
        const currentProposed = hasParentCallback 
          ? Object.fromEntries(
              Object.entries(propsGroups).map(([sceneId, groups]) => [
                sceneId,
                (Array.isArray(groups) ? groups : []).filter((g: any) => (g.status || "approved") === "proposed")
              ]).filter(([_, groups]) => Array.isArray(groups) && groups.length > 0)
            )
          : localProposalDraft;
        
        const currentApproved = hasParentCallback 
          ? Object.fromEntries(
              Object.entries(propsGroups).map(([sceneId, groups]) => [
                sceneId, 
                (Array.isArray(groups) ? groups : []).filter((g: any) => (g.status || "approved") === "approved")
              ]).filter(([_, groups]) => Array.isArray(groups) && groups.length > 0)
            )
          : localApprovedGroups;
        
        const currentDeclined = hasParentCallback
          ? Object.fromEntries(
              Object.entries(propsGroups).map(([sceneId, groups]) => [
                sceneId,
                (Array.isArray(groups) ? groups : []).filter((g: any) => (g.status || "approved") === "declined")
              ]).filter(([_, groups]) => Array.isArray(groups) && groups.length > 0)
            )
          : localDeclinedGroups;

        const mergedProposed = { ...currentProposed, ...serverProposed };
        const mergedApproved = { ...currentApproved, ...serverApproved };
        const mergedDeclined = { ...currentDeclined, ...serverDeclined };
        
        updateAllGroupMaps(mergedApproved, mergedProposed, mergedDeclined);
        console.log('[scene-breakdown] Updated with server-generated continuity groups:', {
          sceneCount: Object.keys(generatedContinuityGroups).length,
          totalGroups: Object.values(generatedContinuityGroups).flat().length,
          proposedCount: Object.values(serverProposed).flat().length,
          approvedCount: Object.values(serverApproved).flat().length,
        });
      } else {
        // Fallback: generate continuity groups client-side from shots (based on isLinkedToPrevious flags)
        console.log('[scene-breakdown] No server continuity groups, generating client-side...');
        const autoGeneratedGroups: { [sceneId: string]: ContinuityGroup[] } = {};
        vlogScenes.forEach(scene => {
          const groups = convertShotsToGroups(scene.id, scene.shots);
          if (groups.length > 0) {
            // Mark as "proposed" so user can review and approve
            groups.forEach(group => {
              group.status = "proposed";
            });
            autoGeneratedGroups[scene.id] = groups;
          }
        });

        if (Object.keys(autoGeneratedGroups).length > 0) {
          const currentProposed = hasParentCallback 
            ? Object.fromEntries(
                Object.entries(propsGroups).map(([sceneId, groups]) => [
                  sceneId,
                  (Array.isArray(groups) ? groups : []).filter((g: any) => (g.status || "approved") === "proposed")
                ]).filter(([_, groups]) => Array.isArray(groups) && groups.length > 0)
              )
            : localProposalDraft;
          
          const currentApproved = hasParentCallback 
            ? Object.fromEntries(
                Object.entries(propsGroups).map(([sceneId, groups]) => [
                  sceneId, 
                  (Array.isArray(groups) ? groups : []).filter((g: any) => (g.status || "approved") === "approved")
                ]).filter(([_, groups]) => Array.isArray(groups) && groups.length > 0)
              )
            : localApprovedGroups;
          
          const currentDeclined = hasParentCallback
            ? Object.fromEntries(
                Object.entries(propsGroups).map(([sceneId, groups]) => [
                  sceneId,
                  (Array.isArray(groups) ? groups : []).filter((g: any) => (g.status || "approved") === "declined")
                ]).filter(([_, groups]) => Array.isArray(groups) && groups.length > 0)
              )
            : localDeclinedGroups;

          const mergedProposed = { ...currentProposed, ...autoGeneratedGroups };
          updateAllGroupMaps(currentApproved, mergedProposed, currentDeclined);
          console.log('[scene-breakdown] Auto-generated continuity groups client-side:', {
            sceneCount: Object.keys(autoGeneratedGroups).length,
            totalGroups: Object.values(autoGeneratedGroups).flat().length,
          });
        }
      }

      // Update parent component with scenes and shots
      propOnScenesChange(vlogScenes);
      propOnShotsChange(generatedShots);

      toast({
        title: "Breakdown Complete",
        description: `Generated ${vlogScenes.length} scenes${Object.values(generatedShots).flat().length > 0 ? ` with ${Object.values(generatedShots).flat().length} shots` : ''}.`,
      });
    } catch (error) {
      console.error('[scene-breakdown] Breakdown generation error:', error);
      
      // Extract detailed error message
      let errorMessage = "Failed to generate breakdown. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'details' in error) {
        errorMessage = String((error as any).details);
      }
      
      toast({
        title: "Breakdown Failed",
        description: errorMessage,
        variant: "destructive",
      });
      hasAutoGeneratedRef.current = false; // Reset so user can try again
    } finally {
      setIsGeneratingBreakdown(false);
    }
  };

  // Auto-save function - saves scenes AND continuity groups
  const saveScenesToBackend = async (scenesToSave: VlogScene[]) => {
    try {
      // Prepare continuity groups for saving (merge all states)
      const groupsToSave: { [sceneId: string]: any[] } = {};
      Object.entries(continuityGroups).forEach(([sceneId, groups]) => {
        groupsToSave[sceneId] = groups.map(group => ({
          ...group,
          status: group.status || "approved",
          approvedAt: group.approvedAt instanceof Date ? group.approvedAt.toISOString() : (group.approvedAt || null),
          editedAt: group.editedAt instanceof Date ? group.editedAt.toISOString() : (group.editedAt || null),
          createdAt: group.createdAt instanceof Date ? group.createdAt.toISOString() : (group.createdAt || new Date().toISOString()),
        }));
      });

      // Build shots record from scenes (separate from scenes for server compatibility)
      const shotsToSave: { [sceneId: string]: any[] } = {};
      scenesToSave.forEach((scene, sceneIdx) => {
        shotsToSave[scene.id] = scene.shots.map((shot, shotIdx) => ({
          id: shot.id,
          sceneId: shot.sceneId,
          shotNumber: shotIdx + 1,
          shotType: shot.shotType || defaultFrameType,
          description: shot.description,
          cameraShot: shot.cameraShot || 'Medium Shot',
          duration: shot.duration, // ✅ Include shot duration for video generation
          referenceTags: shot.referenceTags || [],
        }));
      });

      const response = await fetch(`/api/character-vlog/videos/${videoId}/step/3/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ 
          scenes: scenesToSave,
          shots: shotsToSave, // ✅ Include shots separately for step3Data.shots
          continuityGroups: groupsToSave,
          continuityLocked: localContinuityLocked,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save scenes');
      }

      console.log('[scene-breakdown] Scenes and continuity groups auto-saved:', { 
        sceneCount: scenesToSave.length,
        groupCount: Object.values(groupsToSave).flat().length,
      });
    } catch (error) {
      console.error('[scene-breakdown] Failed to auto-save scenes:', error);
      // Don't show toast for auto-save failures to avoid spam
    }
  };


  // Sync with parent and auto-save on changes
  useEffect(() => {
    if (sceneManifest.scenes.length > 0) {
      // Convert back to parent format
      const scenesToSync = sceneManifest.scenes.map((s, idx) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        duration: s.duration,
        actType: s.actType,
        shots: s.shots,
      }));
      
      propOnScenesChange(scenesToSync);

      // Auto-save scenes when they change (debounced)
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        saveScenesToBackend(sceneManifest.scenes);
      }, 500); // 500ms debounce
      
      const shotsMap: { [sceneId: string]: any[] } = {};

      sceneManifest.scenes.forEach((scene, sceneIdx) => {
        shotsMap[scene.id] = scene.shots.map((shot, shotIdx) => ({
          id: shot.id,
          sceneId: shot.sceneId,
          shotNumber: shotIdx + 1,
          shotType: shot.shotType || defaultFrameType, // ✅ FIX: Use frame type (image-ref/start-end), not camera shot
          description: shot.description,
          dialogue: '',
          cameraShot: shot.cameraShot || 'Medium Shot',
          duration: shot.duration, // ✅ FIX: Include shot duration for video generation
        }));
      });

      // Use the merged continuity groups (approved + proposed + declined) with status field
      // Convert to format expected by parent (ensure all groups have status field)
      const mergedGroupsForParent: { [sceneId: string]: any[] } = {};
      Object.entries(continuityGroups).forEach(([sceneId, groups]) => {
        mergedGroupsForParent[sceneId] = groups.map(group => ({
          ...group,
          // Ensure status field exists (default to "approved" for backward compatibility)
          status: group.status || "approved",
          // Ensure dates are serialized
          approvedAt: group.approvedAt instanceof Date ? group.approvedAt.toISOString() : group.approvedAt,
          editedAt: group.editedAt instanceof Date ? group.editedAt.toISOString() : group.editedAt,
          createdAt: group.createdAt instanceof Date ? group.createdAt.toISOString() : group.createdAt,
        }));
      });

      propOnShotsChange(shotsMap);
      propOnContinuityGroupsChange(mergedGroupsForParent);
      propOnContinuityLockedChange(localContinuityLocked);
    }

    // Cleanup timeout on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [sceneManifest, propOnScenesChange, propOnShotsChange, propOnContinuityGroupsChange, propOnContinuityLockedChange, videoId, workspaceId]);

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
    
    const newShotType = canChangeFrameType ? (data.shotType || defaultFrameType) : defaultFrameType;
    const prevShot = scene.shots.length > 0 ? scene.shots[scene.shots.length - 1] : null;
    
    // Link rules:
    // - Only auto-link if previous shot is 2F (regardless of new shot type)
    // - Cannot link to 1F shots (1F shots cannot be first in continuity group)
    const shouldLink = scene.shots.length > 0 && prevShot?.shotType === 'start-end' && (
      newShotType === 'start-end' || 
      (newShotType === 'image-ref' && prevShot?.shotType === 'start-end')
    );
    
    const newShot: VlogShot = {
      id: `${sceneId}-shot${shotNum}-${Date.now()}`,
      sceneId,
      name: data.name || `Shot ${sceneNum}.${shotNum}: New`,
      description: data.description || '',
      shotType: newShotType,
      cameraShot: data.cameraShot || 'Medium Shot',
      referenceTags: ['@Character'],
      isLinkedToPrevious: shouldLink,
    };
    
    const updatedScenes = sceneManifest.scenes.map(s => {
      if (s.id !== sceneId) return s;
      const updatedShots = [...s.shots, newShot];
      return { ...s, shots: updatedShots };
    });
    
    setSceneManifest({ ...sceneManifest, scenes: updatedScenes });
  };

  const handleEditShot = (sceneId: string, shotId: string, data: Partial<VlogShot>) => {
    // Prevent shotType changes if not in AI mode
    if (!canChangeFrameType && data.shotType !== undefined) {
      const updatedData = { ...data };
      delete updatedData.shotType;
      updateShot(sceneId, shotId, updatedData);
    } else {
      updateShot(sceneId, shotId, data);
    }
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

  // Helper: Convert isLinkedToPrevious flags to continuity groups
  // IMPORTANT: Each group contains exactly 2 consecutive shots (one connection)
  // This ensures approving one connection doesn't affect others
  const convertShotsToGroups = (sceneId: string, sceneShots: VlogShot[]): ContinuityGroup[] => {
    const groups: ContinuityGroup[] = [];
    let groupNumber = 1;

    // Create a separate group for each consecutive pair of linked shots
    for (let i = 1; i < sceneShots.length; i++) {
      const prevShot = sceneShots[i - 1];
      const currentShot = sceneShots[i];
      
      if (currentShot.isLinkedToPrevious) {
        // Create a group with exactly 2 shots: previous and current
        groups.push({
          id: `group-${sceneId}-${groupNumber}-${Date.now()}-${i}`,
          sceneId: sceneId,
          groupNumber: groupNumber++,
          shotIds: [prevShot.id, currentShot.id], // Exactly 2 shots per group
          description: null,
          transitionType: "flow",
          status: "proposed",
          editedBy: null,
          editedAt: null,
          approvedAt: null,
          createdAt: new Date(),
        });
      }
    }

    return groups;
  };

  const handleToggleLink = (sceneId: string, shotId: string) => {
    const scene = sceneManifest.scenes.find(s => s.id === sceneId);
    if (!scene) return;
    
    const shotIndex = scene.shots.findIndex(s => s.id === shotId);
    if (shotIndex <= 0) return;
    
    const currentShot = scene.shots[shotIndex];
    const prevShot = scene.shots[shotIndex - 1];
    
    // Prevent linking if previous shot is 1F (regardless of current shot type)
    if (prevShot?.shotType === 'image-ref') {
      return; // Cannot link to a 1F shot
    }
    // Also keep the existing check for 1F shots
    if (currentShot.shotType === 'image-ref' && prevShot?.shotType !== 'start-end') {
      return; // Prevent linking 1F to 1F or if no previous shot
    }
    
    // Update the shot's isLinkedToPrevious flag
    updateShot(sceneId, shotId, { isLinkedToPrevious: !currentShot.isLinkedToPrevious });
    
    // After updating, regenerate continuity groups from all shots in the scene
    const updatedScene = sceneManifest.scenes.find(s => s.id === sceneId);
    if (updatedScene) {
      const newGroups = convertShotsToGroups(sceneId, updatedScene.shots);
      
      // Update proposed groups for this scene
      const proposed = { ...proposalDraft };
      proposed[sceneId] = newGroups;
      
      updateAllGroupMaps(approvedGroups, proposed, declinedGroups);
    }
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

  // Continuity is automatically generated when shots are created - no manual analysis needed

  // Validation
  const hasScenes = sceneManifest.scenes.length >= 1;
  const hasShots = sceneManifest.scenes.every(scene => scene.shots.length > 0);
  // In 2F and AI modes, agent automatically determines continuity during shot generation
  // - 2F: All shots are 2F, continuity analysis applies
  // - AI: Mixed 1F/2F shots, continuity rules apply (1F can't start groups, can be second if previous is 2F)
  const hasContinuity = (referenceMode === "2F" || referenceMode === "AI")
    ? true // Agent automatically determines continuity based on rules in shot-generator-prompts.ts
    : sceneManifest.continuityLinksEstablished;
  const isValid = hasScenes && hasShots && hasContinuity;

  const hasBreakdown = sceneManifest.scenes.length > 0;
  const accentClasses = "from-[#FF4081] to-[#FF6B4A]";

  // Show loading state while generating breakdown
  if (isGeneratingBreakdown) {
    return (
      <GenerationLoading
        title="Generating Scene Breakdown"
        description="AI is analyzing your script and breaking it down into scenes and shots"
        currentStep="Analyzing Script..."
        progress={50}
        showDetails={false}
      />
    );
  }

  // Show empty state if no breakdown exists
  if (!hasBreakdown) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <div className={cn("h-16 w-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br flex items-center justify-center", accentClasses)}>
            <Film className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Generate Scene Breakdown</h3>
          <p className="text-white/50 mb-8 max-w-md mx-auto">
            AI will analyze your script and break it down into scenes and shots for your storyboard.
          </p>
          <Button
            size="lg"
            onClick={handleGenerateBreakdown}
            disabled={isGeneratingBreakdown || !script || !script.trim()}
            className={cn("bg-gradient-to-br text-white hover:opacity-90", accentClasses)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Scene Breakdown
          </Button>
        </div>
      </div>
    );
  }

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
          {/* Continuity Proposal Component */}
          <ContinuityProposal
            scenes={sceneManifest.scenes.map(s => ({ id: s.id, name: s.name }))}
            allShots={Object.fromEntries(
              sceneManifest.scenes.map(scene => [
                scene.id,
                scene.shots.map(shot => ({
                  id: shot.id,
                  sceneId: shot.sceneId,
                  shotNumber: scene.shots.findIndex(s => s.id === shot.id) + 1,
                  shotType: shot.shotType === 'image-ref' ? 'image-ref' : 'start-end',
                  description: shot.description,
                  cameraMovement: shot.cameraShot || 'Medium Shot',
                  duration: shot.duration || 5, // Use actual duration from shot generator
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }))
              ])
            )}
            proposedGroups={proposalDraft}
            approvedGroups={approvedGroups}
            declinedGroups={declinedGroups}
            onGroupApprove={handleGroupApprove}
            onGroupDecline={handleGroupDecline}
            onGroupEdit={handleGroupEdit}
            onLock={handleLockContinuity}
            onGenerateProposal={() => {
              // This should never be called since we removed the button
              // But keep it for safety - automatically generate from current shots
              const newGroups: { [sceneId: string]: ContinuityGroup[] } = {};
              sceneManifest.scenes.forEach(scene => {
                const groups = convertShotsToGroups(scene.id, scene.shots);
                if (groups.length > 0) {
                  groups.forEach(group => {
                    group.status = "proposed";
                  });
                  newGroups[scene.id] = groups;
                }
              });
              const proposed = { ...proposalDraft, ...newGroups };
              updateAllGroupMaps(approvedGroups, proposed, declinedGroups);
            }}
            isGenerating={false}
            isLocked={localContinuityLocked}
          />

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
                      <div className="flex items-start gap-3">
                        {/* Scene Badge */}
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm mt-0.5",
                          sceneTheme.badge
                        )}>
                          {sceneTheme.icon}
                        </div>
                        
                        {/* Scene Info */}
                        <CollapsibleTrigger asChild>
                          <div className="flex-1 min-w-0 cursor-pointer hover:opacity-80">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <h3 className="text-sm font-semibold text-white">{scene.name}</h3>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white/5 border-white/20 flex-shrink-0">
                                {scene.shots.length} shots
                              </Badge>
                            </div>
                            <p className="text-xs text-white/40 leading-relaxed whitespace-normal break-words pr-2">{scene.description}</p>
                          </div>
                        </CollapsibleTrigger>
                        
                        {/* Scene Actions */}
                        <div className="flex items-start gap-1 flex-shrink-0 pt-0.5">
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
                          
                          {/* Toggle */}
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
                      <div className="px-4 pb-4 space-y-2 relative">
                        {/* Continuity Arrows */}
                        {isExpanded && (
                          <ShotContinuityArrows
                            sceneId={scene.id}
                            sceneShots={scene.shots.map(shot => ({
                              id: shot.id,
                              sceneId: shot.sceneId,
                              shotNumber: scene.shots.findIndex(s => s.id === shot.id) + 1,
                              shotType: shot.shotType === 'image-ref' ? 'image-ref' : 'start-end',
                              description: shot.description,
                              cameraMovement: shot.cameraShot || 'Medium Shot',
                              duration: shot.duration || 5, // Use actual duration from shot generator
                              createdAt: new Date(),
                              updatedAt: new Date(),
                            }))}
                            proposedGroups={proposalDraft[scene.id] || []}
                            approvedGroups={approvedGroups[scene.id] || []}
                            isLocked={localContinuityLocked}
                            onApproveConnection={handleApproveConnection}
                            onDeclineConnection={handleDeclineConnection}
                            shotRefs={getShotRefs(scene.id, scene.shots.length)}
                          />
                        )}

                        {scene.shots.map((shot, shotIdx) => {
                          const prevShot = shotIdx > 0 ? scene.shots[shotIdx - 1] : null;
                          const shotRefs = getShotRefs(scene.id, scene.shots.length);
                          
                          return (
                            <div 
                              key={shot.id}
                              ref={(el) => {
                                if (shotRefs.current && shotRefs.current[shotIdx] !== undefined) {
                                  shotRefs.current[shotIdx] = el;
                                }
                              }}
                            >
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
                                      {(() => {
                                        // Extract shot number from name (format: "Shot X.Y: Title") or use shotNumber
                                        if (shot.name) {
                                          const shotNumberMatch = shot.name.match(/Shot\s+(\d+\.\d+)/);
                                          if (shotNumberMatch) {
                                            return shotNumberMatch[1];
                                          }
                                        }
                                        // Try to get from shotNumber property
                                        const shotNumber = (shot as any).shotNumber;
                                        if (shotNumber) {
                                          // Find scene number
                                          const sceneNumber = sceneManifest.scenes.findIndex(s => s.id === scene.id) + 1;
                                          return `${sceneNumber}.${shotNumber}`;
                                        }
                                        // Fallback to index-based
                                        const sceneNumber = sceneManifest.scenes.findIndex(s => s.id === scene.id) + 1;
                                        return `${sceneNumber}.${shotIdx + 1}`;
                                      })()}
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
                                      onClick={() => console.log('[scene-breakdown] Badge click - shot data:', { shotId: shot.id, shotType: shot.shotType, shot })}
                                    >
                                      {shot.shotType === 'start-end' ? 'Start/End Frame' : 'Single Image'}
                                    </Badge>
                                    
                                    {/* DURATION BADGE */}
                                    {shot.duration && shot.duration > 0 && (
                                      <Badge 
                                        variant="outline" 
                                        className="text-[10px] font-semibold px-2 py-0.5 bg-cyan-500/20 border-cyan-500/40 text-cyan-200"
                                        title="Shot duration"
                                      >
                                        {shot.duration}s
                                      </Badge>
                                    )}
                                    
                                    <div className="flex-1" />
                                    
                                    {/* Shot Type Toggle (AI Mode) or Locked Display (1F/2F Modes) */}
                                    {canChangeFrameType ? (
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
                                    ) : (
                                      <div className="bg-white/5 rounded px-2 py-1 flex items-center gap-1.5 border border-white/10">
                                        {shot.shotType === 'image-ref' ? (
                                          <>
                                            <ImageIcon className="w-3 h-3 text-pink-400" />
                                            <span className="text-[10px] text-white/70">1F</span>
                                          </>
                                        ) : (
                                          <>
                                            <Video className="w-3 h-3 text-purple-400" />
                                            <span className="text-[10px] text-white/70">2F</span>
                                          </>
                                        )}
                                        <Lock className="w-2.5 h-2.5 text-white/40 ml-0.5" />
                                      </div>
                                    )}
                                    
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
                                  <div className="w-full">
                                    <TextareaWithMentions
                                      value={shot.description || ''}
                                      onChange={(newValue) => {
                                        updateShot(scene.id, shot.id, { description: newValue });
                                      }}
                                      placeholder="Shot description... (Type @ to mention characters or locations)"
                                      className="w-full bg-white/5 border-white/10 text-white text-xs resize-none focus:outline-none focus:ring-2 focus:ring-white/20 rounded-md px-3 py-2 placeholder:text-white/40"
                                      characters={characters}
                                      locations={locations}
                                      showMentionOverlay={false}
                                    />
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
        canChangeFrameType={canChangeFrameType}
        defaultFrameType={defaultFrameType}
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
