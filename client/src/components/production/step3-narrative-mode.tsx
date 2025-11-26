import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image, Layers, Check, ArrowRight } from "lucide-react";

interface Step3NarrativeModeProps {
  value: "image-reference" | "start-end-frame";
  onChange: (value: "image-reference" | "start-end-frame") => void;
}

const narrativeModes = [
  {
    id: "image-reference" as const,
    name: "Image Reference Mode",
    description: "Each shot uses a single reference image for consistent visuals",
    icon: Image,
    features: ["Simpler workflow", "Quick production", "Style consistency"],
    recommended: true,
  },
  {
    id: "start-end-frame" as const,
    name: "Start-End Frame Mode",
    description: "Define start and end frames for each shot to create seamless transitions",
    icon: Layers,
    features: ["Seamless transitions", "Continuity groups", "Advanced control"],
    recommended: false,
  },
];

export function Step3NarrativeMode({ value, onChange }: Step3NarrativeModeProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold">Choose Narrative Mode</h2>
        <p className="text-muted-foreground mt-2">
          Select how your shots will be connected and transitioned
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {narrativeModes.map((mode) => {
          const isSelected = value === mode.id;
          const ModeIcon = mode.icon;

          return (
            <Card
              key={mode.id}
              className={`relative cursor-pointer transition-all ${
                isSelected
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "hover:border-primary/50 hover:bg-muted/50"
              }`}
              onClick={() => onChange(mode.id)}
              data-testid={`card-narrative-mode-${mode.id}`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}
              
              {mode.recommended && (
                <div className="absolute top-4 left-4">
                  <Badge className="text-xs">Recommended</Badge>
                </div>
              )}
              
              <CardContent className="p-6 pt-12">
                <div className="text-center">
                  <div className={`inline-flex p-4 rounded-2xl mb-4 ${isSelected ? "bg-primary/10" : "bg-muted"}`}>
                    <ModeIcon className={`h-10 w-10 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2">{mode.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {mode.description}
                  </p>
                  
                  <div className="flex flex-wrap justify-center gap-2">
                    {mode.features.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs font-normal">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded bg-primary/10 mt-0.5">
            <ArrowRight className="h-4 w-4 text-primary" />
          </div>
          <div className="text-sm">
            <p className="font-medium mb-1">What's the difference?</p>
            <p className="text-muted-foreground">
              <strong>Image Reference</strong> is simpler and faster - each shot is generated from a single reference.
              <strong> Start-End Frame</strong> creates smooth transitions between shots by defining how each shot begins and ends.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
