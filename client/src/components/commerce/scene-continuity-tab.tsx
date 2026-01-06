// Unified Scene/Shot Timeline - Tab 4
// ═══════════════════════════════════════════════════════════════════════════
// Autonomous Timeline: Pre-planned commercial with automated continuity
// Enhanced with CRUD operations and connection status indicators

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
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
  LinkIcon,
  Unlink,
  ChevronDown,
  Clock,
  Layers,
  X,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Zap,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

interface Scene {
  id: string;
  name: string;
  description: string;
  duration: number;
  actType: 'hook' | 'transformation' | 'payoff' | 'custom';
  shots: Shot[];
}

interface Shot {
  id: string;
  sceneId: string;
  name: string;
  description: string;
  duration: number; // This is rendered_duration from Agent 4.2
  cameraPath: 'orbit' | 'pan' | 'zoom' | 'dolly' | 'static';
  lens: 'macro' | 'wide' | '85mm' | 'telephoto';
  referenceTags: string[];
  isLinkedToPrevious: boolean;
  speedProfile: 'linear' | 'speed-ramp' | 'slow-motion' | 'kinetic' | 'smooth';
  // Optional fields from Agent 4.2
  multiplier?: number;
  sfxHint?: string;
  previousShotReferences?: Array<{ shot_id: string; reason: string; reference_type: string }>;
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
  { value: 'telephoto', label: 'Tele' },
];

const SCENE_THEMES = [
  { id: 'hook' as const, defaultName: 'The Ignition', color: 'from-pink-500 to-orange-500', accent: 'border-pink-500/50', badge: 'bg-pink-500', icon: '🎬' },
  { id: 'transformation' as const, defaultName: 'The Revelation', color: 'from-purple-500 to-pink-500', accent: 'border-purple-500/50', badge: 'bg-purple-500', icon: '✨' },
  { id: 'payoff' as const, defaultName: 'The Impact', color: 'from-orange-500 to-amber-500', accent: 'border-orange-500/50', badge: 'bg-orange-500', icon: '🎯' },
  { id: 'custom' as const, defaultName: 'Custom Scene', color: 'from-cyan-500 to-blue-500', accent: 'border-cyan-500/50', badge: 'bg-cyan-500', icon: '🎥' },
];

const ACT_TYPES = [
  { value: 'hook', label: 'Hook (Opening)' },
  { value: 'transformation', label: 'Transformation (Middle)' },
  { value: 'payoff', label: 'Payoff (Closing)' },
  { value: 'custom', label: 'Custom' },
];

const SPEED_PROFILES = [
  { value: 'linear', label: 'Smooth Linear', icon: '▶️', color: 'bg-gray-500/30 border-gray-500/50 text-gray-200', multiplier: 1.0 },
  { value: 'speed-ramp', label: 'Kinetic Speed-Ramp', icon: '⚡', color: 'bg-amber-500/30 border-amber-500/50 text-amber-200', multiplier: 1.2 },
  { value: 'slow-motion', label: 'Slow Motion', icon: '🐌', color: 'bg-blue-500/30 border-blue-500/50 text-blue-200', multiplier: 2.0 },
  { value: 'kinetic', label: 'Kinetic Burst', icon: '💥', color: 'bg-red-500/30 border-red-500/50 text-red-200', multiplier: 0.8 },
  { value: 'smooth', label: 'Cinematic Smooth', icon: '🎬', color: 'bg-purple-500/30 border-purple-500/50 text-purple-200', multiplier: 1.1 },
];

// Helper: Calculate render duration based on speed profile
const calculateRenderDuration = (targetDuration: number, speedProfile: Shot['speedProfile']): number => {
  const profile = SPEED_PROFILES.find(p => p.value === speedProfile);
  const multiplier = profile?.multiplier || 1.0;
  return Math.round(targetDuration * multiplier * 10) / 10;
};

// ═══════════════════════════════════════════════════════════════════════════
// AUTONOMOUS SCENE GENERATION - MEDIA PLANNING AGENT
// ═══════════════════════════════════════════════════════════════════════════

// Shot template with type, connection, and speed info
interface ShotTemplate {
  description: string;
  isLinkedToPrevious: boolean;
  speedProfile: Shot['speedProfile'];
}

const getShotTemplates = (sceneType: 'hook' | 'transformation' | 'payoff'): ShotTemplate[] => {
  // Default shot templates showing variety of types, connections, and speed profiles
  const templates: Record<string, ShotTemplate[]> = {
    hook: [
      { description: "Dramatic macro reveal of product emerging from shadow with volumetric lighting", isLinkedToPrevious: false, speedProfile: 'kinetic' },
      { description: "Slow orbit around product showcasing premium materials and craftsmanship", isLinkedToPrevious: true, speedProfile: 'speed-ramp' },
      { description: "Dynamic angle shift revealing hero feature with light refractions", isLinkedToPrevious: false, speedProfile: 'smooth' },
    ],
    transformation: [
      { description: "Product in motion demonstrating key functionality and design", isLinkedToPrevious: false, speedProfile: 'slow-motion' },
      { description: "Close-up texture shot highlighting material quality and finish", isLinkedToPrevious: false, speedProfile: 'linear' },
      { description: "Wide establishing shot showing product in aspirational context", isLinkedToPrevious: true, speedProfile: 'speed-ramp' },
    ],
    payoff: [
      { description: "Hero shot with dramatic lighting and brand colors", isLinkedToPrevious: false, speedProfile: 'smooth' },
      { description: "Final reveal with logo and call-to-action composition", isLinkedToPrevious: true, speedProfile: 'kinetic' },
      { description: "Cinematic closing frame with product as centerpiece", isLinkedToPrevious: false, speedProfile: 'linear' },
    ]
  };
  
  return templates[sceneType];
};

const parseShotDescriptions = (beatContent: string, sceneType: 'hook' | 'transformation' | 'payoff'): ShotTemplate[] => {
  const defaults = getShotTemplates(sceneType);
  
  // If user provided beat content, try to parse it but keep type/connection/speed variety
  if (beatContent && beatContent.trim().length > 20) {
    const sentences = beatContent
      .split(/[.!]\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 15);
    
    // If we got sentences, use them but apply the default type/connection/speed patterns
    if (sentences.length >= 2) {
      return sentences.slice(0, 3).map((desc, idx) => ({
        description: desc,
        isLinkedToPrevious: defaults[idx]?.isLinkedToPrevious || false,
        speedProfile: defaults[idx]?.speedProfile || 'linear',
      }));
    }
  }
  
  // Return defaults for this scene type
  return defaults;
};

const generateShotName = (sceneNum: number, shotNum: number, description: string): string => {
  const lower = description.toLowerCase();
  if (lower.includes('macro') || lower.includes('close')) {
    return `Shot ${sceneNum}.${shotNum}: Macro`;
  } else if (lower.includes('wide') || lower.includes('establishing')) {
    return `Shot ${sceneNum}.${shotNum}: Wide`;
  } else if (lower.includes('track') || lower.includes('follow')) {
    return `Shot ${sceneNum}.${shotNum}: Track`;
  } else if (lower.includes('orbit') || lower.includes('rotate')) {
    return `Shot ${sceneNum}.${shotNum}: Orbit`;
  } else if (lower.includes('detail') || lower.includes('texture')) {
    return `Shot ${sceneNum}.${shotNum}: Detail`;
  } else {
    return `Shot ${sceneNum}.${shotNum}: Hero`;
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
    const shotTemplates = parseShotDescriptions(beat.content, beat.id);
    
    const shots: Shot[] = shotTemplates.map((template, shotIdx) => {
      const shotNum = shotIdx + 1;
      const referenceTags: string[] = ['@Product', '@Texture'];
      if (logoUrl) referenceTags.push('@Logo');
      // Removed: @Style tag (Sora only accepts one image input - product hero)
      
      return {
        id: `scene${sceneNum}-shot${shotNum}`,
        sceneId: `scene-${sceneNum}`,
        name: generateShotName(sceneNum, shotNum, template.description),
        description: template.description,
        duration: 3.5,
        cameraPath: 'static',
        lens: '85mm',
        referenceTags,
        isLinkedToPrevious: template.isLinkedToPrevious,
        speedProfile: template.speedProfile,
      };
    });
    
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
// SCENE EDIT DIALOG COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface SceneEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scene: Scene | null;
  sceneCount: number;
  onSubmit: (data: { name: string; description: string; actType: Scene['actType'] }) => void;
}

function SceneEditDialog({ open, onOpenChange, scene, sceneCount, onSubmit }: SceneEditDialogProps) {
  const [name, setName] = useState(scene?.name || '');
  const [description, setDescription] = useState(scene?.description || '');
  const [actType, setActType] = useState<Scene['actType']>(scene?.actType || 'custom');
  
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
            {scene ? 'Update scene details' : 'Create a new scene for your commercial'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-white/70">Scene Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Scene 1: The Ignition"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-white/70">Act Type</Label>
            <Select value={actType} onValueChange={(v) => setActType(v as Scene['actType'])}>
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
            className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
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
  shot: Shot | null;
  sceneId: string;
  shotCount: number;
  onSubmit: (data: Partial<Shot>) => void;
}

function ShotEditDialog({ open, onOpenChange, shot, sceneId, shotCount, onSubmit }: ShotEditDialogProps) {
  const [name, setName] = useState(shot?.name || '');
  const [description, setDescription] = useState(shot?.description || '');
  const [duration, setDuration] = useState(shot?.duration || 3.5);
  const [cameraPath, setCameraPath] = useState<Shot['cameraPath']>(shot?.cameraPath || 'static');
  const [lens, setLens] = useState<Shot['lens']>(shot?.lens || '85mm');
  const [speedProfile, setSpeedProfile] = useState<Shot['speedProfile']>(shot?.speedProfile || 'linear');
  // NEW: Additional comprehensive fields
  const [cinematicGoal, setCinematicGoal] = useState(shot?.name?.split(': ')[1] || '');
  const [motionIntensity, setMotionIntensity] = useState(5);
  const [framing, setFraming] = useState<'ECU' | 'CU' | 'MCU' | 'MED' | 'WIDE'>('MED');
  const [referToProduct, setReferToProduct] = useState(shot?.referenceTags?.includes('@Product') || shot?.referenceTags?.includes('@Product_Macro') || shot?.referenceTags?.includes('@Texture') || false);
  const [productImageRef, setProductImageRef] = useState<'heroProfile' | 'macroDetail' | 'materialReference'>(
    shot?.referenceTags?.includes('@Product_Macro') ? 'macroDetail' :
    shot?.referenceTags?.includes('@Texture') ? 'materialReference' : 'heroProfile'
  );
  const [referToCharacter, setReferToCharacter] = useState(shot?.referenceTags?.includes('@Character') || false);
  const [referToLogo, setReferToLogo] = useState(shot?.referenceTags?.includes('@Logo') || false);
  const [depthOfField, setDepthOfField] = useState<'Ultra-shallow' | 'Shallow' | 'Medium' | 'Deep'>('Medium');
  const [handoverType, setHandoverType] = useState<'SEAMLESS_FLOW' | 'MATCH_CUT' | 'JUMP_CUT'>('JUMP_CUT');
  const [isConnectedToPrevious, setIsConnectedToPrevious] = useState(shot?.isLinkedToPrevious || false);
  const [isConnectedToNext, setIsConnectedToNext] = useState(false);
  const [compositionSafeZones, setCompositionSafeZones] = useState('Center safe zone');
  const [lightingEvent, setLightingEvent] = useState('Natural lighting');
  
  useEffect(() => {
    if (shot) {
      setName(shot.name);
      setDescription(shot.description);
      setDuration(shot.duration);
      setCameraPath(shot.cameraPath);
      setLens(shot.lens);
      setSpeedProfile(shot.speedProfile);
      // Extract cinematic goal from name (format: "Shot X.Y: Goal")
      const goalMatch = shot.name?.match(/: (.+)$/);
      setCinematicGoal(goalMatch ? goalMatch[1] : '');
      // Restore reference tags
      setReferToProduct(shot.referenceTags?.includes('@Product') || shot.referenceTags?.includes('@Product_Macro') || shot.referenceTags?.includes('@Texture') || false);
      if (shot.referenceTags?.includes('@Product_Macro')) {
        setProductImageRef('macroDetail');
      } else if (shot.referenceTags?.includes('@Texture')) {
        setProductImageRef('materialReference');
      } else {
        setProductImageRef('heroProfile');
      }
      setReferToCharacter(shot.referenceTags?.includes('@Character') || false);
      setReferToLogo(shot.referenceTags?.includes('@Logo') || false);
      setIsConnectedToPrevious(shot.isLinkedToPrevious || false);
    } else {
      const sceneNum = parseInt(sceneId.split('-')[1]) || 1;
      setName(`Shot ${sceneNum}.${shotCount + 1}: New`);
      setDescription('');
      setDuration(3.5);
      setCameraPath('static');
      setLens('85mm');
      setSpeedProfile('linear');
      setCinematicGoal('');
      setMotionIntensity(5);
      setFraming('MED');
      setReferToProduct(false);
      setProductImageRef('heroProfile');
      setReferToCharacter(false);
      setReferToLogo(false);
      setDepthOfField('Medium');
      setHandoverType('JUMP_CUT');
      setIsConnectedToPrevious(false);
      setIsConnectedToNext(false);
      setCompositionSafeZones('Center safe zone');
      setLightingEvent('Natural lighting');
    }
  }, [shot, sceneId, shotCount]);
  
  const handleSubmit = () => {
    // Build reference tags array
    const referenceTags: string[] = [];
    if (referToProduct) {
      if (productImageRef === 'macroDetail') {
        referenceTags.push('@Product_Macro');
      } else if (productImageRef === 'materialReference') {
        referenceTags.push('@Texture');
      } else {
        referenceTags.push('@Product');
      }
    }
    if (referToCharacter) referenceTags.push('@Character');
    if (referToLogo) referenceTags.push('@Logo');
    
    // Update name with cinematic goal if provided
    const finalName = cinematicGoal ? `${name.split(':')[0]}: ${cinematicGoal}` : name;
    
    onSubmit({ 
      name: finalName,
      description, 
      duration, 
      cameraPath, 
      lens, 
      speedProfile,
      referenceTags,
      isLinkedToPrevious: isConnectedToPrevious,
    });
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">{shot ? 'Edit Shot' : 'Add Shot'}</DialogTitle>
          <DialogDescription className="text-white/50">
            {shot ? 'Update shot details and directives' : 'Create a new shot with all required cinematography details'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Cinematic Goal & Motion Intensity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/70">Cinematic Goal *</Label>
              <Input
                value={cinematicGoal}
                onChange={(e) => setCinematicGoal(e.target.value)}
                placeholder="e.g., Capture attention with mysterious reveal"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Motion Intensity *</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={motionIntensity}
                onChange={(e) => setMotionIntensity(parseInt(e.target.value) || 5)}
                className="bg-white/5 border-white/10 text-white"
              />
              <p className="text-xs text-white/40">1 (slow) to 10 (fast)</p>
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label className="text-white/70">Shot Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the shot in detail..."
              className="bg-white/5 border-white/10 text-white min-h-[80px]"
            />
          </div>
          
          {/* Camera, Lens, Framing, Shot Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/70">Camera Movement *</Label>
              <Select value={cameraPath} onValueChange={(v) => setCameraPath(v as Shot['cameraPath'])}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-white/10">
                  {CAMERA_PATHS.map((path) => (
                    <SelectItem key={path.value} value={path.value} className="text-white">
                      {path.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Lens *</Label>
              <Select value={lens} onValueChange={(v) => setLens(v as Shot['lens'])}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-white/10">
                  {LENSES.map((l) => (
                    <SelectItem key={l.value} value={l.value} className="text-white">
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/70">Framing *</Label>
              <Select value={framing} onValueChange={(v) => setFraming(v as 'ECU' | 'CU' | 'MCU' | 'MED' | 'WIDE')}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-white/10">
                  <SelectItem value="ECU" className="text-white">ECU (Extreme Close-Up)</SelectItem>
                  <SelectItem value="CU" className="text-white">CU (Close-Up)</SelectItem>
                  <SelectItem value="MCU" className="text-white">MCU (Medium Close-Up)</SelectItem>
                  <SelectItem value="MED" className="text-white">MED (Medium)</SelectItem>
                  <SelectItem value="WIDE" className="text-white">WIDE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Shot Type *</Label>
            </div>
          </div>
          
          {/* Identity References */}
          <div className="space-y-2">
            <Label className="text-white/70">Identity References</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={referToProduct}
                  onCheckedChange={setReferToProduct}
                  className="data-[state=checked]:bg-pink-500"
                />
                <Label className="text-white/70">Include Product</Label>
              </div>
              {referToProduct && (
                <div className="ml-6 space-y-2">
                  <Label className="text-white/70 text-sm">Product Image Reference</Label>
                  <Select value={productImageRef} onValueChange={(v) => setProductImageRef(v as any)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/10">
                      <SelectItem value="heroProfile" className="text-white">Hero Profile</SelectItem>
                      <SelectItem value="macroDetail" className="text-white">Macro Detail</SelectItem>
                      <SelectItem value="materialReference" className="text-white">Material Reference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={referToCharacter}
                  onCheckedChange={setReferToCharacter}
                  className="data-[state=checked]:bg-pink-500"
                />
                <Label className="text-white/70">Include Character</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={referToLogo}
                  onCheckedChange={setReferToLogo}
                  className="data-[state=checked]:bg-pink-500"
                />
                <Label className="text-white/70">Include Logo</Label>
              </div>
            </div>
          </div>
          
          {/* Depth of Field & Handover Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/70">Depth of Field</Label>
              <Select value={depthOfField} onValueChange={(v) => setDepthOfField(v as any)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-white/10">
                  <SelectItem value="Ultra-shallow" className="text-white">Ultra-shallow</SelectItem>
                  <SelectItem value="Shallow" className="text-white">Shallow</SelectItem>
                  <SelectItem value="Medium" className="text-white">Medium</SelectItem>
                  <SelectItem value="Deep" className="text-white">Deep</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Handover Type</Label>
              <Select value={handoverType} onValueChange={(v) => setHandoverType(v as any)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-white/10">
                  <SelectItem value="SEAMLESS_FLOW" className="text-white">Seamless Flow</SelectItem>
                  <SelectItem value="MATCH_CUT" className="text-white">Match Cut</SelectItem>
                  <SelectItem value="JUMP_CUT" className="text-white">Jump Cut</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Continuity */}
          <div className="space-y-2">
            <Label className="text-white/70">Continuity</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isConnectedToPrevious}
                  onCheckedChange={setIsConnectedToPrevious}
                  className="data-[state=checked]:bg-pink-500"
                />
                <Label className="text-white/70">Connected to Previous</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isConnectedToNext}
                  onCheckedChange={setIsConnectedToNext}
                  className="data-[state=checked]:bg-pink-500"
                />
                <Label className="text-white/70">Connected to Next</Label>
              </div>
            </div>
          </div>
          
          {/* Composition & Lighting */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/70">Composition Safe Zones</Label>
              <Input
                value={compositionSafeZones}
                onChange={(e) => setCompositionSafeZones(e.target.value)}
                placeholder="e.g., Center safe zone"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Lighting Event</Label>
              <Input
                value={lightingEvent}
                onChange={(e) => setLightingEvent(e.target.value)}
                placeholder="e.g., Natural lighting"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
          
          {/* Speed Profile Selector */}
          <div className="space-y-2">
            <Label className="text-white/70">Speed Profile</Label>
            <div className="grid grid-cols-5 gap-2">
              {SPEED_PROFILES.map((profile) => (
                <button
                  key={profile.value}
                  onClick={() => setSpeedProfile(profile.value as Shot['speedProfile'])}
                  className={cn(
                    "p-2 rounded-lg border text-center transition-all",
                    speedProfile === profile.value
                      ? profile.color + " border-2"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  )}
                >
                  <span className="text-lg block">{profile.icon}</span>
                  <span className="text-[9px] text-white/70 block mt-0.5">{profile.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 text-white/70">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
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
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set(['scene-1', 'scene-2', 'scene-3']));
  
  // Dialog states
  const [sceneDialogOpen, setSceneDialogOpen] = useState(false);
  const [shotDialogOpen, setShotDialogOpen] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [editingShot, setEditingShot] = useState<{ shot: Shot; sceneId: string } | null>(null);
  const [activeSceneId, setActiveSceneId] = useState<string>('');
  
  // Delete confirmation states
  const [deleteSceneId, setDeleteSceneId] = useState<string | null>(null);
  const [deleteShotInfo, setDeleteShotInfo] = useState<{ sceneId: string; shotId: string } | null>(null);

  // Autonomous initialization
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

  // Update a single shot
  const updateShot = (sceneId: string, shotId: string, updates: Partial<Shot>) => {
    const updatedScenes = sceneManifest.scenes.map(scene => {
      if (scene.id !== sceneId) return scene;
      const updatedShots = scene.shots.map(shot =>
        shot.id === shotId ? { ...shot, ...updates } : shot
      );
      const totalDuration = updatedShots.reduce((sum, shot) => sum + shot.duration, 0);
      return { ...scene, shots: updatedShots, duration: totalDuration };
    });
    onSceneManifestChange({ ...sceneManifest, scenes: updatedScenes });
  };

  // Add a new scene
  const handleAddScene = (data: { name: string; description: string; actType: Scene['actType'] }) => {
    const sceneNum = sceneManifest.scenes.length + 1;
    const theme = SCENE_THEMES.find(t => t.id === data.actType) || SCENE_THEMES[3];
    
    const newScene: Scene = {
      id: `scene-${sceneNum}-${Date.now()}`,
      name: data.name,
      description: data.description,
      duration: 0,
      actType: data.actType,
      shots: [],
    };
    
    onSceneManifestChange({
      ...sceneManifest,
      scenes: [...sceneManifest.scenes, newScene],
    });
    
    // Expand the new scene
    setExpandedScenes(prev => new Set([...prev, newScene.id]));
  };

  // Edit an existing scene
  const handleEditScene = (sceneId: string, data: { name: string; description: string; actType: Scene['actType'] }) => {
    const updatedScenes = sceneManifest.scenes.map(scene =>
      scene.id === sceneId ? { ...scene, ...data } : scene
    );
    onSceneManifestChange({ ...sceneManifest, scenes: updatedScenes });
  };

  // Delete a scene
  const handleDeleteScene = (sceneId: string) => {
    if (sceneManifest.scenes.length <= 1) return; // Keep at least one scene
    const updatedScenes = sceneManifest.scenes.filter(scene => scene.id !== sceneId);
    onSceneManifestChange({ ...sceneManifest, scenes: updatedScenes });
    setDeleteSceneId(null);
  };

  // Add a new shot to a scene
  const handleAddShot = (sceneId: string, data: Partial<Shot>) => {
    const scene = sceneManifest.scenes.find(s => s.id === sceneId);
    if (!scene) return;
    
    const shotNum = scene.shots.length + 1;
    const sceneNum = parseInt(sceneId.split('-')[1]) || 1;
    
    const newShot: Shot = {
      id: `${sceneId}-shot${shotNum}-${Date.now()}`,
      sceneId,
      name: data.name || `Shot ${sceneNum}.${shotNum}: New`,
      description: data.description || '',
      duration: data.duration || 3.5,
      cameraPath: data.cameraPath || 'static',
      lens: data.lens || '85mm',
      referenceTags: ['@Product', '@Texture'],
      isLinkedToPrevious: scene.shots.length > 0, // Link to previous if not first shot
    };
    
    const updatedScenes = sceneManifest.scenes.map(s => {
      if (s.id !== sceneId) return s;
      const updatedShots = [...s.shots, newShot];
      const totalDuration = updatedShots.reduce((sum, shot) => sum + shot.duration, 0);
      return { ...s, shots: updatedShots, duration: totalDuration };
    });
    
    onSceneManifestChange({ ...sceneManifest, scenes: updatedScenes });
  };

  // Edit an existing shot
  const handleEditShot = (sceneId: string, shotId: string, data: Partial<Shot>) => {
    updateShot(sceneId, shotId, data);
  };

  // Delete a shot
  const handleDeleteShot = (sceneId: string, shotId: string) => {
    const scene = sceneManifest.scenes.find(s => s.id === sceneId);
    if (!scene || scene.shots.length <= 1) return; // Keep at least one shot per scene
    
    const updatedScenes = sceneManifest.scenes.map(s => {
      if (s.id !== sceneId) return s;
      const updatedShots = s.shots.filter(shot => shot.id !== shotId);
      // Update linking for the shot after the deleted one
      const reindexedShots = updatedShots.map((shot, idx) => ({
        ...shot,
        isLinkedToPrevious: idx > 0 ? shot.isLinkedToPrevious : false,
      }));
      const totalDuration = reindexedShots.reduce((sum, shot) => sum + shot.duration, 0);
      return { ...s, shots: reindexedShots, duration: totalDuration };
    });
    
    onSceneManifestChange({ ...sceneManifest, scenes: updatedScenes });
    setDeleteShotInfo(null);
  };

  // Toggle shot link - enforces start-end type when linking
  const handleToggleLink = (sceneId: string, shotId: string) => {
    const scene = sceneManifest.scenes.find(s => s.id === sceneId);
    if (!scene) return;
    
    const shotIndex = scene.shots.findIndex(s => s.id === shotId);
    if (shotIndex <= 0) return; // Can't toggle link on first shot
    
    const currentShot = scene.shots[shotIndex];
    const previousShot = scene.shots[shotIndex - 1];
    const newLinkedState = !currentShot.isLinkedToPrevious;
    
    if (newLinkedState) {
      // LINKING: Force both shots to start-end type
      // Previous shot needs END frame, current shot needs START frame
      const updatedScenes = sceneManifest.scenes.map(s => {
        if (s.id !== sceneId) return s;
        const updatedShots = s.shots.map((shot, idx) => {
          if (idx === shotIndex - 1) {
            // Previous shot: needs end frame
            return { ...shot };
          }
          if (idx === shotIndex) {
            // Current shot: linked
            return { ...shot, isLinkedToPrevious: true };
          }
          return shot;
        });
        const totalDuration = updatedShots.reduce((sum, shot) => sum + shot.duration, 0);
        return { ...s, shots: updatedShots, duration: totalDuration };
      });
      onSceneManifestChange({ ...sceneManifest, scenes: updatedScenes });
    } else {
      // UNLINKING: Just unlink, keep types as-is
      updateShot(sceneId, shotId, { isLinkedToPrevious: false });
    }
  };

  // Scene expand/collapse
  const toggleSceneExpanded = (sceneId: string) => {
    const newExpanded = new Set(expandedScenes);
    if (newExpanded.has(sceneId)) {
      newExpanded.delete(sceneId);
    } else {
      newExpanded.add(sceneId);
    }
    setExpandedScenes(newExpanded);
  };

  // Open scene dialog for edit
  const openSceneEdit = (scene: Scene) => {
    setEditingScene(scene);
    setSceneDialogOpen(true);
  };

  // Open scene dialog for add
  const openSceneAdd = () => {
    setEditingScene(null);
    setSceneDialogOpen(true);
  };

  // Open shot dialog for edit
  const openShotEdit = (shot: Shot, sceneId: string) => {
    setEditingShot({ shot, sceneId });
    setActiveSceneId(sceneId);
    setShotDialogOpen(true);
  };

  // Open shot dialog for add
  const openShotAdd = (sceneId: string) => {
    setEditingShot(null);
    setActiveSceneId(sceneId);
    setShotDialogOpen(true);
  };

  // Handle scene dialog submit
  const handleSceneDialogSubmit = (data: { name: string; description: string; actType: Scene['actType'] }) => {
    if (editingScene) {
      handleEditScene(editingScene.id, data);
    } else {
      handleAddScene(data);
    }
    setEditingScene(null);
  };

  // Handle shot dialog submit
  const handleShotDialogSubmit = (data: Partial<Shot>) => {
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
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ZONE HEADER */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Film className="w-5 h-5 text-pink-400" />
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                Scene Timeline
              </h2>
              <p className="text-xs text-white/50">Pre-planned commercial with automated continuity</p>
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT - Scene/Shot Timeline */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-4 pb-4">
          {sceneManifest.scenes.map((scene, sceneIdx) => {
            const sceneTheme = SCENE_THEMES.find(t => t.id === scene.actType) || SCENE_THEMES[3];
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
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10"
                            onClick={(e) => { e.stopPropagation(); openSceneEdit(scene); }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
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
                        
                        {/* Duration & Toggle */}
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={cn(
                            "text-[10px] px-2 py-0.5 font-mono",
                            `bg-gradient-to-r ${sceneTheme.color}`,
                            "border-white/20"
                          )}>
                            <Clock className="w-3 h-3 mr-1" />
                            {scene.duration.toFixed(1)}s
                          </Badge>
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
                                  "bg-white/[0.02] border-white/[0.06] transition-all",
                                  selectedShotId === shot.id && "border-pink-500/40 bg-white/[0.04] shadow-lg shadow-pink-500/5",
                                )}
                              >
                                <CardContent className="p-3 space-y-2">
                                  {/* Row 1: Shot Name + Type Badge + Duration + Actions */}
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
                                    
                                    <div className="flex-1" />
                                    
                                    {/* Duration Slider */}
                                    <div className="flex items-center gap-2 min-w-[120px]">
                                      <Slider
                                        value={[shot.duration]}
                                        onValueChange={([value]) => updateShot(scene.id, shot.id, { duration: value })}
                                        min={0.5}
                                        max={10}
                                        step={0.5}
                                        className="flex-1"
                                      />
                                      <span className="text-[10px] text-white/60 font-mono w-7 text-right">
                                        {shot.duration.toFixed(1)}s
                                      </span>
                                    </div>
                                    
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

                                  {/* Row 2: Description + Camera/Lens */}
                                  <div className="flex gap-3">
                                    <Textarea
                                      value={shot.description}
                                      onChange={(e) => updateShot(scene.id, shot.id, { description: e.target.value })}
                                      placeholder="Shot description..."
                                      className="flex-1 bg-white/5 border-white/10 text-white text-xs min-h-[50px] max-h-[50px] resize-none"
                                      maxLength={200}
                                    />
                                    
                                    <div className="flex gap-2 min-w-[140px]">
                                      <div className="flex-1 space-y-1">
                                        <Label className="text-[9px] text-white/40 uppercase">Cam</Label>
                                        <Select 
                                          value={shot.cameraPath} 
                                          onValueChange={(value) => updateShot(scene.id, shot.id, { cameraPath: value as any })}
                                        >
                                          <SelectTrigger className="h-7 text-[10px] bg-white/5 border-white/10 text-white">
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
                                      <div className="flex-1 space-y-1">
                                        <Label className="text-[9px] text-white/40 uppercase">Lens</Label>
                                        <Select 
                                          value={shot.lens} 
                                          onValueChange={(value) => updateShot(scene.id, shot.id, { lens: value as any })}
                                        >
                                          <SelectTrigger className="h-7 text-[10px] bg-white/5 border-white/10 text-white">
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
                                  </div>

                                  {/* Row 3: Duration + Link Toggle */}
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1" />
                                    
                                    {/* Duration Display */}
                                    <div className="flex items-center gap-2 text-[10px] text-white/50 bg-white/5 rounded-md px-2 py-1">
                                      <Timer className="w-3 h-3 text-white/40" />
                                      <span>
                                        Duration: <span className="text-orange-400 font-mono">
                                          {shot.duration.toFixed(1)}s
                                        </span>
                                      </span>
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
        </div>
      </ScrollArea>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FRAME BLUEPRINT (When Shot Selected) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedShot && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="flex-shrink-0 border-t border-white/10 bg-black/40 backdrop-blur-xl"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">Keyframe Blueprint</span>
                  <Badge variant="outline" className="text-[10px] px-2 py-0 bg-white/5">
                    {selectedShot.name}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedShotId(null)}
                  className="h-6 w-6 p-0 text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex gap-4 justify-center items-center">
                <div className="w-64">
                  <div className="aspect-video bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-dashed border-purple-500/30 rounded-lg flex items-center justify-center hover:border-purple-500/50 transition-all">
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-purple-400/50 mx-auto mb-1" />
                      <p className="text-xs text-white/50">Frame Preview</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* COMPACT VALIDATION FOOTER */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {!selectedShot && (
        <div className="flex-shrink-0 px-6 py-3 border-t border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                {hasScenes ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-white/20" />
                )}
                <span className={cn(
                  "text-xs font-medium",
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
                  "text-xs font-medium",
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
                  "text-xs font-medium",
                  continuityLinks > 0 ? "text-white/70" : "text-white/40"
                )}>
                  {continuityLinks} Links
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-xs text-white/50">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span className="font-mono">{totalDuration.toFixed(1)}s total</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* DIALOGS */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      
      {/* Scene Edit Dialog */}
      <SceneEditDialog
        open={sceneDialogOpen}
        onOpenChange={setSceneDialogOpen}
        scene={editingScene}
        sceneCount={sceneManifest.scenes.length}
        onSubmit={handleSceneDialogSubmit}
      />

      {/* Shot Edit Dialog */}
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
