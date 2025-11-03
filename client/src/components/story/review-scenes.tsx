import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Scene {
  id: string;
  sceneNumber: number;
  narration: string;
  visualDescription: string;
}

interface ReviewScenesProps {
  onNext: () => void;
  onBack: () => void;
  scenes: Scene[];
  setScenes: (scenes: Scene[]) => void;
}

export function ReviewScenes({
  onNext,
  onBack,
  scenes,
  setScenes,
}: ReviewScenesProps) {
  const updateScene = (index: number, field: 'narration' | 'visualDescription', value: string) => {
    const updated = [...scenes];
    updated[index] = { ...updated[index], [field]: value };
    setScenes(updated);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Review Your Scenes</h1>
        <p className="text-lg text-muted-foreground">
          The script has been broken down into scenes. Edit the narration or visual descriptions for the AI.
        </p>
      </div>

      <div className="space-y-6">
        {scenes.map((scene, index) => (
          <div
            key={scene.id}
            className="bg-card border rounded-lg p-6 space-y-4"
            data-testid={`scene-${index + 1}`}
          >
            <h3 className="text-lg font-semibold">Scene {scene.sceneNumber}</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Narration</Label>
                <Textarea
                  value={scene.narration}
                  onChange={(e) => updateScene(index, 'narration', e.target.value)}
                  className="min-h-24"
                  data-testid={`input-narration-${index}`}
                />
              </div>

              <div className="space-y-2">
                <Label>Visual Description</Label>
                <Textarea
                  value={scene.visualDescription}
                  onChange={(e) => updateScene(index, 'visualDescription', e.target.value)}
                  className="min-h-24"
                  data-testid={`input-visual-${index}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-3 pt-4">
        <Button variant="outline" onClick={onBack} data-testid="button-back">
          Back
        </Button>
        <Button onClick={onNext} data-testid="button-next-shots">
          Next: Edit Shots
        </Button>
      </div>
    </div>
  );
}
