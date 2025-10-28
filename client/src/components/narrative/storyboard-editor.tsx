import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

interface SortableShotCardProps {
  shot: Shot;
  shotIndex: number;
  version: ShotVersion | null;
  isGenerating: boolean;
  onSelectShot: (shot: Shot) => void;
  onRegenerateShot: (shotId: string) => void;
  onUpdatePrompt: (shotId: string, prompt: string) => void;
  onUploadReference: (shotId: string) => void;
}

function SortableShotCard({ 
  shot, 
  shotIndex, 
  version, 
  isGenerating, 
  onSelectShot,
  onRegenerateShot,
  onUpdatePrompt,
  onUploadReference,
}: SortableShotCardProps) {
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

  const [localPrompt, setLocalPrompt] = useState(shot.description || "");

  const handlePromptBlur = () => {
    if (localPrompt !== shot.description) {
      onUpdatePrompt(shot.id, localPrompt);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="shrink-0 w-80 overflow-visible"
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
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Prompt</Label>
          <Textarea
            value={localPrompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
            onBlur={handlePromptBlur}
            placeholder="Describe the shot..."
            className="min-h-20 text-xs resize-none"
            data-testid={`input-prompt-${shot.id}`}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Reference Image</Label>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => onUploadReference(shot.id)}
            data-testid={`button-upload-reference-${shot.id}`}
          >
            <Upload className="mr-2 h-3 w-3" />
            Upload Reference
          </Button>
        </div>

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
            onClick={() => onRegenerateShot(shot.id)}
            disabled={!version}
            data-testid={`button-regenerate-${shot.id}`}
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Re-generate
          </Button>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full"
          disabled
          data-testid={`button-generate-video-${shot.id}`}
        >
          <Video className="mr-2 h-3 w-3" />
          Generate Video
        </Button>

        <div className="flex gap-1.5">
          <Badge variant="outline" className="text-xs">
            {shot.shotType}
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
  const [editPrompt, setEditPrompt] = useState("");
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

  const handleUpdatePrompt = (shotId: string, prompt: string) => {
    onUpdateShot(shotId, { description: prompt });
  };

  const handleUploadReference = (shotId: string) => {
    toast({
      title: "Upload Reference",
      description: "Reference image upload will be available soon",
    });
  };

  const handleSelectShot = (shot: Shot) => {
    setSelectedShot(shot);
    setEditPrompt(shot.description || "");
  };

  const handleSavePrompt = () => {
    if (selectedShot) {
      onUpdateShot(selectedShot.id, { description: editPrompt });
      toast({
        title: "Prompt Updated",
        description: "Image prompt has been updated",
      });
      setSelectedShot(null);
    }
  };

  const handleGenerateFromDialog = () => {
    if (selectedShot) {
      onUpdateShot(selectedShot.id, { description: editPrompt });
      onGenerateShot(selectedShot.id);
      toast({
        title: "Generating Image",
        description: "Creating image from your prompt...",
      });
      setSelectedShot(null);
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
                              onSelectShot={handleSelectShot}
                              onRegenerateShot={onRegenerateShot}
                              onUpdatePrompt={handleUpdatePrompt}
                              onUploadReference={handleUploadReference}
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
              <DialogTitle>Edit Image Prompt</DialogTitle>
              <DialogDescription>
                Modify the prompt to generate a new image for this shot
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

              <div className="space-y-2">
                <Label>Image Generation Prompt</Label>
                <Textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  className="min-h-32"
                  data-testid="input-edit-prompt"
                />
                <p className="text-xs text-muted-foreground">
                  Describe the visual details, composition, lighting, and style for this shot
                </p>
              </div>

              <div className="space-y-2">
                <Label>Reference Image (Optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a reference image for style consistency
                  </p>
                  <Button size="sm" variant="outline" data-testid="button-upload-reference-dialog">
                    Choose File
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSavePrompt}
                  className="flex-1"
                  data-testid="button-save-prompt"
                >
                  Save Prompt
                </Button>
                <Button
                  onClick={handleGenerateFromDialog}
                  className="flex-1"
                  data-testid="button-generate-from-dialog"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Image
                </Button>
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
