import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";

interface PreviewFinalizeProps {
  onNext: () => void;
  onBack: () => void;
}

export function PreviewFinalize({ onNext, onBack }: PreviewFinalizeProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Preview & Finalize</h1>
        <p className="text-lg text-muted-foreground">
          Watch your creation. Go back to any step to make changes.
        </p>
      </div>

      <div className="border-2 border-dashed rounded-lg bg-muted/30 aspect-video flex items-center justify-center">
        <div className="text-center space-y-4">
          <Video className="h-16 w-16 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Video preview will be generated here.</p>
        </div>
      </div>

      <div className="flex justify-center gap-3 pt-4">
        <Button variant="outline" onClick={onBack} data-testid="button-back">
          Back
        </Button>
        <Button onClick={onNext} data-testid="button-next-export">
          Next: Export
        </Button>
      </div>
    </div>
  );
}
