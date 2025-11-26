import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Loader2, 
  Sparkles, 
  Edit, 
  Trash2, 
  Plus, 
  ChevronUp, 
  ChevronDown,
  Zap,
  Eye,
  Package,
  Play,
  Megaphone,
  Clock,
  Type
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductSegment {
  id: string;
  type: "hook" | "intro" | "features" | "demo" | "cta";
  title: string;
  description: string;
  duration: number;
  order: number;
}

interface ProductShot {
  id: string;
  segmentId: string;
  shotNumber: number;
  shotType: string;
  description: string;
  voiceoverText: string;
  duration: number;
}

interface ProductBreakdownProps {
  videoId: string;
  script: string;
  voiceOverScript: string;
  videoConcept: string;
  productDisplay: string[];
  productName: string;
  segments: ProductSegment[];
  shots: { [segmentId: string]: ProductShot[] };
  onSegmentsChange: (segments: ProductSegment[]) => void;
  onShotsChange: (shots: { [segmentId: string]: ProductShot[] }) => void;
  onNext: () => void;
}

const SEGMENT_TYPES = [
  { id: "hook", name: "Hook", icon: Zap, description: "Grab attention in first 3 seconds", defaultDuration: 3 },
  { id: "intro", name: "Product Intro", icon: Package, description: "Introduce the product", defaultDuration: 5 },
  { id: "features", name: "Features", icon: Eye, description: "Showcase key features", defaultDuration: 10 },
  { id: "demo", name: "Demo", icon: Play, description: "Show product in action", defaultDuration: 10 },
  { id: "cta", name: "Call to Action", icon: Megaphone, description: "Drive viewer action", defaultDuration: 3 },
];

const SHOT_TYPE_OPTIONS = [
  { id: "hero", name: "Hero Shot" },
  { id: "closeup", name: "Close-up" },
  { id: "in-use", name: "In Use" },
  { id: "unboxing", name: "Unboxing" },
  { id: "360", name: "360° View" },
  { id: "scale", name: "Scale Shot" },
  { id: "features", name: "Features" },
  { id: "lifestyle", name: "Lifestyle" },
  { id: "comparison", name: "Comparison" },
  { id: "text-overlay", name: "Text Overlay" },
];

export function ProductBreakdown({
  videoId,
  script,
  voiceOverScript,
  videoConcept,
  productDisplay,
  productName,
  segments,
  shots,
  onSegmentsChange,
  onShotsChange,
  onNext,
}: ProductBreakdownProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [segmentDialogOpen, setSegmentDialogOpen] = useState(false);
  const [shotDialogOpen, setShotDialogOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<ProductSegment | null>(null);
  const [editingShot, setEditingShot] = useState<ProductShot | null>(null);
  const [activeSegmentId, setActiveSegmentId] = useState<string>("");
  const [deleteSegmentId, setDeleteSegmentId] = useState<string | null>(null);
  const [deleteShotId, setDeleteShotId] = useState<string | null>(null);
  
  const [newSegment, setNewSegment] = useState({
    type: "features" as ProductSegment["type"],
    title: "",
    description: "",
    duration: 5,
  });
  
  const [newShot, setNewShot] = useState({
    shotType: "hero",
    description: "",
    voiceoverText: "",
    duration: 3,
  });

  const hasBreakdown = segments.length > 0;

  const generateBreakdown = () => {
    setIsGenerating(true);

    setTimeout(() => {
      const generatedSegments: ProductSegment[] = [
        {
          id: `seg-${Date.now()}-1`,
          type: "hook",
          title: "Attention Grabber",
          description: "Eye-catching opening to stop the scroll",
          duration: 3,
          order: 1,
        },
        {
          id: `seg-${Date.now()}-2`,
          type: "intro",
          title: "Product Introduction",
          description: `Introduce ${productName || "the product"} with a compelling value proposition`,
          duration: 5,
          order: 2,
        },
        {
          id: `seg-${Date.now()}-3`,
          type: "features",
          title: "Key Features",
          description: "Highlight the most important features and benefits",
          duration: 12,
          order: 3,
        },
        {
          id: `seg-${Date.now()}-4`,
          type: "demo",
          title: "Product Demo",
          description: "Show the product being used in real scenarios",
          duration: 8,
          order: 4,
        },
        {
          id: `seg-${Date.now()}-5`,
          type: "cta",
          title: "Call to Action",
          description: "Drive viewers to take action - buy now, learn more, etc.",
          duration: 2,
          order: 5,
        },
      ];

      const generatedShots: { [segmentId: string]: ProductShot[] } = {};

      generatedSegments.forEach((segment, segIndex) => {
        const segmentShots: ProductShot[] = [];
        
        if (segment.type === "hook") {
          segmentShots.push({
            id: `shot-${Date.now()}-${segIndex}-1`,
            segmentId: segment.id,
            shotNumber: 1,
            shotType: productDisplay.includes("hero") ? "hero" : "closeup",
            description: `Dynamic opening shot of ${productName || "product"} with attention-grabbing movement`,
            voiceoverText: voiceOverScript ? voiceOverScript.split('.')[0] + '.' : "",
            duration: 3,
          });
        } else if (segment.type === "intro") {
          segmentShots.push({
            id: `shot-${Date.now()}-${segIndex}-1`,
            segmentId: segment.id,
            shotNumber: 1,
            shotType: "hero",
            description: `Clean hero shot revealing ${productName || "the product"} in full`,
            voiceoverText: "",
            duration: 5,
          });
        } else if (segment.type === "features") {
          const featureShots = productDisplay.filter(d => ["closeup", "features", "scale"].includes(d));
          featureShots.slice(0, 3).forEach((shotType, idx) => {
            segmentShots.push({
              id: `shot-${Date.now()}-${segIndex}-${idx + 1}`,
              segmentId: segment.id,
              shotNumber: idx + 1,
              shotType,
              description: `${SHOT_TYPE_OPTIONS.find(s => s.id === shotType)?.name || shotType} highlighting key feature ${idx + 1}`,
              voiceoverText: "",
              duration: 4,
            });
          });
          if (segmentShots.length === 0) {
            segmentShots.push({
              id: `shot-${Date.now()}-${segIndex}-1`,
              segmentId: segment.id,
              shotNumber: 1,
              shotType: "closeup",
              description: "Close-up shot showing product details and craftsmanship",
              voiceoverText: "",
              duration: 4,
            });
          }
        } else if (segment.type === "demo") {
          if (productDisplay.includes("in-use")) {
            segmentShots.push({
              id: `shot-${Date.now()}-${segIndex}-1`,
              segmentId: segment.id,
              shotNumber: 1,
              shotType: "in-use",
              description: `Demonstration of ${productName || "product"} being used naturally`,
              voiceoverText: "",
              duration: 5,
            });
          }
          if (productDisplay.includes("unboxing")) {
            segmentShots.push({
              id: `shot-${Date.now()}-${segIndex}-2`,
              segmentId: segment.id,
              shotNumber: segmentShots.length + 1,
              shotType: "unboxing",
              description: "Unboxing experience showing packaging and reveal",
              voiceoverText: "",
              duration: 4,
            });
          }
          if (segmentShots.length === 0) {
            segmentShots.push({
              id: `shot-${Date.now()}-${segIndex}-1`,
              segmentId: segment.id,
              shotNumber: 1,
              shotType: "lifestyle",
              description: "Lifestyle shot showing product in everyday context",
              voiceoverText: "",
              duration: 8,
            });
          }
        } else if (segment.type === "cta") {
          segmentShots.push({
            id: `shot-${Date.now()}-${segIndex}-1`,
            segmentId: segment.id,
            shotNumber: 1,
            shotType: "text-overlay",
            description: "Final shot with product and call-to-action text overlay",
            voiceoverText: voiceOverScript ? voiceOverScript.split('.').slice(-2).join('.').trim() : "",
            duration: 2,
          });
        }

        generatedShots[segment.id] = segmentShots;
      });

      onSegmentsChange(generatedSegments);
      onShotsChange(generatedShots);
      setIsGenerating(false);

      toast({
        title: "Breakdown Generated",
        description: `Created ${generatedSegments.length} segments with ${Object.values(generatedShots).flat().length} shots based on your product settings.`,
      });
    }, 1500);
  };

  const handleSaveSegment = () => {
    if (!newSegment.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a segment title.",
        variant: "destructive",
      });
      return;
    }

    if (editingSegment) {
      const updated = segments.map(s => 
        s.id === editingSegment.id 
          ? { ...s, ...newSegment }
          : s
      );
      onSegmentsChange(updated);
      toast({ title: "Segment updated" });
    } else {
      const segment: ProductSegment = {
        id: `seg-${Date.now()}`,
        ...newSegment,
        order: segments.length + 1,
      };
      onSegmentsChange([...segments, segment]);
      onShotsChange({ ...shots, [segment.id]: [] });
      toast({ title: "Segment added" });
    }

    setNewSegment({ type: "features", title: "", description: "", duration: 5 });
    setEditingSegment(null);
    setSegmentDialogOpen(false);
  };

  const handleSaveShot = () => {
    if (!newShot.description.trim()) {
      toast({
        title: "Description Required",
        description: "Please enter a shot description.",
        variant: "destructive",
      });
      return;
    }

    const segmentShots = shots[activeSegmentId] || [];

    if (editingShot) {
      const updatedShots = segmentShots.map(s => 
        s.id === editingShot.id 
          ? { ...s, ...newShot }
          : s
      );
      onShotsChange({ ...shots, [activeSegmentId]: updatedShots });
      toast({ title: "Shot updated" });
    } else {
      const shot: ProductShot = {
        id: `shot-${Date.now()}`,
        segmentId: activeSegmentId,
        shotNumber: segmentShots.length + 1,
        ...newShot,
      };
      onShotsChange({ ...shots, [activeSegmentId]: [...segmentShots, shot] });
      toast({ title: "Shot added" });
    }

    setNewShot({ shotType: "hero", description: "", voiceoverText: "", duration: 3 });
    setEditingShot(null);
    setShotDialogOpen(false);
  };

  const openEditSegment = (segment: ProductSegment) => {
    setEditingSegment(segment);
    setNewSegment({
      type: segment.type,
      title: segment.title,
      description: segment.description,
      duration: segment.duration,
    });
    setSegmentDialogOpen(true);
  };

  const openAddShot = (segmentId: string) => {
    setActiveSegmentId(segmentId);
    setEditingShot(null);
    setNewShot({ shotType: "hero", description: "", voiceoverText: "", duration: 3 });
    setShotDialogOpen(true);
  };

  const openEditShot = (shot: ProductShot, segmentId: string) => {
    setActiveSegmentId(segmentId);
    setEditingShot(shot);
    setNewShot({
      shotType: shot.shotType,
      description: shot.description,
      voiceoverText: shot.voiceoverText,
      duration: shot.duration,
    });
    setShotDialogOpen(true);
  };

  const deleteSegment = () => {
    if (!deleteSegmentId) return;
    const updated = segments.filter(s => s.id !== deleteSegmentId);
    const updatedShots = { ...shots };
    delete updatedShots[deleteSegmentId];
    onSegmentsChange(updated);
    onShotsChange(updatedShots);
    setDeleteSegmentId(null);
    toast({ title: "Segment deleted" });
  };

  const deleteShot = () => {
    if (!deleteShotId) return;
    const shot = Object.values(shots).flat().find(s => s.id === deleteShotId);
    if (shot) {
      const segmentShots = shots[shot.segmentId] || [];
      const updated = segmentShots.filter(s => s.id !== deleteShotId);
      onShotsChange({ ...shots, [shot.segmentId]: updated });
    }
    setDeleteShotId(null);
    toast({ title: "Shot deleted" });
  };

  const moveSegment = (segmentId: string, direction: 'up' | 'down') => {
    const index = segments.findIndex(s => s.id === segmentId);
    if (index < 0) return;
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= segments.length) return;

    const updated = [...segments];
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    updated.forEach((s, i) => s.order = i + 1);
    onSegmentsChange(updated);
  };

  const getSegmentIcon = (type: ProductSegment["type"]) => {
    const segType = SEGMENT_TYPES.find(s => s.id === type);
    return segType?.icon || Package;
  };

  const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);
  const totalShots = Object.values(shots).flat().length;

  return (
    <div className="space-y-6">
      {!hasBreakdown ? (
        <div className="space-y-6">
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Generate Product Video Breakdown</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              AI will create an optimized shot sequence based on your product settings and selected shot types.
            </p>
            <Button
              size="lg"
              onClick={generateBreakdown}
              disabled={isGenerating}
              data-testid="button-generate-breakdown"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Breakdown...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Shot Breakdown
                </>
              )}
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">or</p>
            <Button
              variant="outline"
              onClick={() => {
                setEditingSegment(null);
                setNewSegment({ type: "hook", title: "", description: "", duration: 3 });
                setSegmentDialogOpen(true);
              }}
              data-testid="button-add-segment-manual"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Segment Manually
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Video Concept Summary */}
          {videoConcept && (
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold mb-2">Video Concept</h3>
                <p className="text-sm text-muted-foreground">{videoConcept}</p>
              </CardContent>
            </Card>
          )}

          {/* Segments List */}
          <div className="space-y-4">
            {segments.sort((a, b) => a.order - b.order).map((segment, segIndex) => {
              const segmentShots = shots[segment.id] || [];
              const SegmentIcon = getSegmentIcon(segment.type);
              const segmentTypeInfo = SEGMENT_TYPES.find(s => s.id === segment.type);
              
              return (
                <Card key={segment.id} className="bg-card/50" data-testid={`segment-${segment.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <SegmentIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{segment.title}</h3>
                            <Badge variant="outline" className="text-xs capitalize">
                              {segmentTypeInfo?.name || segment.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{segment.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {segment.duration}s
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditSegment(segment)}
                            data-testid={`button-edit-segment-${segment.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={segIndex === 0}
                            onClick={() => moveSegment(segment.id, 'up')}
                            data-testid={`button-move-up-segment-${segment.id}`}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={segIndex === segments.length - 1}
                            onClick={() => moveSegment(segment.id, 'down')}
                            data-testid={`button-move-down-segment-${segment.id}`}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteSegmentId(segment.id)}
                            data-testid={`button-delete-segment-${segment.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Shots List */}
                    <div className="space-y-2 pl-4 border-l-2 border-border ml-4">
                      {segmentShots.map((shot, shotIndex) => (
                        <div
                          key={shot.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover-elevate"
                          data-testid={`shot-${shot.id}`}
                        >
                          <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">Shot {shotIndex + 1}</span>
                              <Badge variant="outline" className="text-xs">
                                {SHOT_TYPE_OPTIONS.find(s => s.id === shot.shotType)?.name || shot.shotType}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {shot.duration}s
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{shot.description}</p>
                            {shot.voiceoverText && (
                              <div className="flex items-start gap-1 mt-2 text-xs text-primary/80">
                                <Type className="h-3 w-3 mt-0.5 shrink-0" />
                                <span className="italic">"{shot.voiceoverText}"</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditShot(shot, segment.id)}
                              data-testid={`button-edit-shot-${shot.id}`}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteShotId(shot.id)}
                              data-testid={`button-delete-shot-${shot.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAddShot(segment.id)}
                        className="w-full mt-2"
                        data-testid={`button-add-shot-${segment.id}`}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Shot
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Button
              variant="outline"
              onClick={() => {
                setEditingSegment(null);
                setNewSegment({ type: "features", title: "", description: "", duration: 5 });
                setSegmentDialogOpen(true);
              }}
              className="w-full"
              data-testid="button-add-segment"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Segment
            </Button>
          </div>

          {/* Summary Footer */}
          <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg">
            <div className="text-sm text-muted-foreground">
              Video duration:{' '}
              <span className="text-foreground font-medium">
                {totalDuration}s
              </span>{' '}
              ({totalShots} shots across {segments.length} segments)
            </div>
            <Button 
              onClick={onNext}
              data-testid="button-next"
            >
              Continue to Storyboard
              <span className="ml-2">→</span>
            </Button>
          </div>
        </>
      )}

      {/* Segment Dialog */}
      <Dialog open={segmentDialogOpen} onOpenChange={setSegmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSegment ? "Edit Segment" : "Add Segment"}</DialogTitle>
            <DialogDescription>
              {editingSegment ? "Update segment details" : "Add a new segment to your video"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Segment Type</Label>
              <Select 
                value={newSegment.type} 
                onValueChange={(value) => {
                  const segType = SEGMENT_TYPES.find(s => s.id === value);
                  setNewSegment({ 
                    ...newSegment, 
                    type: value as ProductSegment["type"],
                    title: newSegment.title || segType?.name || "",
                    duration: segType?.defaultDuration || 5,
                  });
                }}
              >
                <SelectTrigger data-testid="select-segment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEGMENT_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        <span>{type.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Segment title"
                value={newSegment.title}
                onChange={(e) => setNewSegment({ ...newSegment, title: e.target.value })}
                data-testid="input-segment-title"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe what happens in this segment..."
                value={newSegment.description}
                onChange={(e) => setNewSegment({ ...newSegment, description: e.target.value })}
                rows={2}
                data-testid="input-segment-description"
              />
            </div>

            <div className="space-y-2">
              <Label>Duration (seconds)</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={newSegment.duration}
                onChange={(e) => setNewSegment({ ...newSegment, duration: parseInt(e.target.value) || 5 })}
                data-testid="input-segment-duration"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setSegmentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSegment} data-testid="button-save-segment">
                {editingSegment ? "Update" : "Add"} Segment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shot Dialog */}
      <Dialog open={shotDialogOpen} onOpenChange={setShotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingShot ? "Edit Shot" : "Add Shot"}</DialogTitle>
            <DialogDescription>
              {editingShot ? "Update shot details" : "Add a new shot to this segment"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Shot Type</Label>
              <Select 
                value={newShot.shotType} 
                onValueChange={(value) => setNewShot({ ...newShot, shotType: value })}
              >
                <SelectTrigger data-testid="select-shot-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHOT_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe this shot..."
                value={newShot.description}
                onChange={(e) => setNewShot({ ...newShot, description: e.target.value })}
                rows={2}
                data-testid="input-shot-description"
              />
            </div>

            <div className="space-y-2">
              <Label>Voiceover Text (optional)</Label>
              <Textarea
                placeholder="Text to be spoken during this shot..."
                value={newShot.voiceoverText}
                onChange={(e) => setNewShot({ ...newShot, voiceoverText: e.target.value })}
                rows={2}
                data-testid="input-shot-voiceover"
              />
            </div>

            <div className="space-y-2">
              <Label>Duration (seconds)</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={newShot.duration}
                onChange={(e) => setNewShot({ ...newShot, duration: parseInt(e.target.value) || 3 })}
                data-testid="input-shot-duration"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShotDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveShot} data-testid="button-save-shot">
                {editingShot ? "Update" : "Add"} Shot
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Segment Confirmation */}
      <AlertDialog open={!!deleteSegmentId} onOpenChange={(open) => !open && setDeleteSegmentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Segment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this segment? This will also delete all shots in this segment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-segment">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSegment} data-testid="button-confirm-delete-segment">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Shot Confirmation */}
      <AlertDialog open={!!deleteShotId} onOpenChange={(open) => !open && setDeleteShotId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this shot?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-shot">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteShot} data-testid="button-confirm-delete-shot">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
