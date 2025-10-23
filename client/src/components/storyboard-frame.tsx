import { Image as ImageIcon, Trash2, Edit } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StoryboardFrameProps {
  sceneNumber: number;
  shotNumber: number;
  description: string;
  imageUrl?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function StoryboardFrame({
  sceneNumber,
  shotNumber,
  description,
  imageUrl,
  onEdit,
  onDelete,
}: StoryboardFrameProps) {
  return (
    <Card className="overflow-hidden group" data-testid={`card-frame-${sceneNumber}-${shotNumber}`}>
      <div className="relative">
        <div className="aspect-video bg-muted relative overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={description} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium">
          Scene {sceneNumber} / Shot {shotNumber}
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {onEdit && (
            <Button size="icon" variant="secondary" className="h-7 w-7" onClick={onEdit} data-testid="button-edit-frame">
              <Edit className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button size="icon" variant="destructive" className="h-7 w-7" onClick={onDelete} data-testid="button-delete-frame">
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      </div>
    </Card>
  );
}
