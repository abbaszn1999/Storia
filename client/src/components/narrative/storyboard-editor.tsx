import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Sparkles, RefreshCw, Upload, Video, Image as ImageIcon, Edit, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Scene, Shot, ShotVersion, ReferenceImage } from "@shared/schema";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface StoryboardEditorProps {
  videoId: string;
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions: { [shotId: string]: ShotVersion[] };
  referenceImages: ReferenceImage[];
  onGenerateShot: (shotId: string) => void;
  onRegenerateShot: (shotId: string) => void;
  onUpdateShot: (shotId: string, updates: Partial<Shot>) => void;
  onReorderShots?: (sceneId: string, shotIds: string[]) => void;
  onNext: () => void;
}

const CAMERA_MOVEMENTS = [
  { value: "static", label: "Static", desc: "No camera movement" },
  { value: "push_in", label: "Push In", desc: "Move closer to subject" },
  { value: "pull_out", label: "Pull Out", desc: "Move away from subject" },
  { value: "pan_left", label: "Pan Left", desc: "Horizontal left movement" },
  { value: "pan_right", label: "Pan Right", desc: "Horizontal right movement" },
  { value: "tilt_up", label: "Tilt Up", desc: "Vertical upward movement" },
  { value: "tilt_down", label: "Tilt Down", desc: "Vertical downward movement" },
  { value: "zoom_in", label: "Zoom In", desc: "Optical zoom in" },
  { value: "zoom_out", label: "Zoom Out", desc: "Optical zoom out" },
];

interface SortableShotCardProps {
  shot: Shot;
  shotIndex: number;
  version: ShotVersion | null;
  isGenerating: boolean;
  onSelectShot: (shot: Shot) => void;
}

function SortableShotCard({ shot, shotIndex, version, isGenerating, onSelectShot }: SortableShotCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="shrink-0 w-80 overflow-hidden cursor-move"
      data-testid={`card-shot-${shot.id}`}
    >
      <div className="aspect-video bg-muted relative group">
        {version?.imageUrl ? (
          <img
            src={version.imageUrl}
            alt={`Shot ${shotIndex + 1}`}
            className="w-full h-full object-cover"
          />
        ) : isGenerating ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-card/50">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="h-6 w-6 flex items-center justify-center bg-background/80 rounded cursor-grab active:cursor-grabbing hover-elevate"
            data-testid={`drag-handle-${shot.id}`}
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <Badge className="bg-background/80 text-foreground border-0">
            # {shotIndex + 1}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onSelectShot(shot)}
            data-testid={`button-edit-image-${shot.id}`}
          >
            <Edit className="mr-2 h-3 w-3" />
            Edit Image
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled
            data-testid={`button-generate-video-${shot.id}`}
          >
            <Video className="mr-2 h-3 w-3" />
            Generate Video
          </Button>
        </div>

        <div className="text-xs text-muted-foreground line-clamp-3 min-h-[3rem]">
          {shot.description}
        </div>

        <div className="flex gap-1.5">
          <Badge variant="outline" className="text-xs">
            {shot.shotType}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {shot.cameraMovement}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function StoryboardEditor({
  videoId,
  scenes,
  shots,
  shotVersions,
  referenceImages,
  onGenerateShot,
  onRegenerateShot,
  onUpdateShot,
  onReorderShots,
  onNext,
}: StoryboardEditorProps) {
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);
  const [localShots, setLocalShots] = useState(shots);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const allShots = Object.values(localShots).flat();
  const generatedCount = allShots.filter((s) => s.currentVersionId).length;
  const totalCount = allShots.length;

  const handleGenerateAll = () => {
    allShots.forEach((shot) => {
      if (!shot.currentVersionId) {
        onGenerateShot(shot.id);
      }
    });
    toast({
      title: "Generating Storyboard",
      description: `Generating images for ${totalCount - generatedCount} shots...`,
    });
  };

  const getShotVersion = (shot: Shot): ShotVersion | null => {
    if (!shot.currentVersionId) return null;
    const versions = shotVersions[shot.id] || [];
    return versions.find((v) => v.id === shot.currentVersionId) || null;
  };

  const handleDragEnd = (event: DragEndEvent, sceneId: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const sceneShots = localShots[sceneId] || [];
      const oldIndex = sceneShots.findIndex((s) => s.id === active.id);
      const newIndex = sceneShots.findIndex((s) => s.id === over.id);

      const newSceneShots = arrayMove(sceneShots, oldIndex, newIndex);
      
      setLocalShots({
        ...localShots,
        [sceneId]: newSceneShots,
      });

      if (onReorderShots) {
        onReorderShots(sceneId, newSceneShots.map(s => s.id));
      }

      toast({
        title: "Shot Reordered",
        description: "Shot order has been updated",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Storyboard</h3>
          <p className="text-sm text-muted-foreground">
            {generatedCount} of {totalCount} shots generated • Drag to reorder
          </p>
        </div>
        <Button
          onClick={handleGenerateAll}
          disabled={generatedCount === totalCount}
          data-testid="button-generate-all"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generate All Shots
        </Button>
      </div>

      <div className="space-y-8">
        {scenes.map((scene, sceneIndex) => {
          const sceneShots = localShots[scene.id] || [];
          
          return (
            <div key={scene.id} className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-64 shrink-0 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      # {sceneIndex + 1}
                    </Badge>
                    <h4 className="font-semibold text-sm">{scene.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {scene.description}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <div>Location: {scene.location}</div>
                    <div>{sceneShots.length} shots</div>
                  </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, scene.id)}
                  >
                    <SortableContext
                      items={sceneShots.map(s => s.id)}
                      strategy={horizontalListSortingStrategy}
                    >
                      <div className="flex gap-4 pb-2">
                        {sceneShots.map((shot, shotIndex) => {
                          const version = getShotVersion(shot);
                          const isGenerating = false;

                          return (
                            <SortableShotCard
                              key={shot.id}
                              shot={shot}
                              shotIndex={shotIndex}
                              version={version}
                              isGenerating={isGenerating}
                              onSelectShot={setSelectedShot}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedShot && (
        <Dialog open={!!selectedShot} onOpenChange={() => setSelectedShot(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Shot Details</DialogTitle>
              <DialogDescription>
                Customize camera movement and regenerate the shot if needed
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                {getShotVersion(selectedShot)?.imageUrl ? (
                  <img
                    src={getShotVersion(selectedShot)!.imageUrl!}
                    alt="Shot"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Shot Type</Label>
                  <Badge variant="secondary">{selectedShot.shotType}</Badge>
                </div>
                <div className="space-y-2">
                  <Label>Camera Movement</Label>
                  <Select
                    value={selectedShot.cameraMovement}
                    onValueChange={(value) => {
                      onUpdateShot(selectedShot.id, { cameraMovement: value });
                      setSelectedShot({ ...selectedShot, cameraMovement: value });
                    }}
                  >
                    <SelectTrigger data-testid="select-camera-movement">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMERA_MOVEMENTS.map((movement) => (
                        <SelectItem key={movement.value} value={movement.value}>
                          <div className="flex flex-col">
                            <span>{movement.label}</span>
                            <span className="text-xs text-muted-foreground">{movement.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={selectedShot.description || ""}
                  onChange={(e) => {
                    onUpdateShot(selectedShot.id, { description: e.target.value });
                    setSelectedShot({ ...selectedShot, description: e.target.value });
                  }}
                  className="min-h-24"
                  data-testid="input-shot-description"
                />
              </div>

              <div className="flex gap-2">
                {!getShotVersion(selectedShot) ? (
                  <Button
                    onClick={() => {
                      onGenerateShot(selectedShot.id);
                      setSelectedShot(null);
                    }}
                    className="flex-1"
                    data-testid="button-generate-shot"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Shot
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        onRegenerateShot(selectedShot.id);
                      }}
                      className="flex-1"
                      data-testid="button-regenerate-shot"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      data-testid="button-upload-reference"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Reference
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={generatedCount < totalCount}
          data-testid="button-next"
        >
          Continue to Animatic
        </Button>
      </div>
    </div>
  );
}
