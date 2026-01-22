import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Zap, Check } from "lucide-react";

interface Step1TypeSelectionProps {
  value: "video" | "stories";
  onChange: (value: "video" | "stories") => void;
}

const contentTypes = [
  {
    id: "video" as const,
    name: "Video Production",
    description: "Create AI-powered narrative videos with scenes, shots, and seamless transitions",
    icon: Video,
    available: true,
    features: ["Script generation", "Scene breakdown", "AI visuals", "Voice narration"],
  },
  {
    id: "stories" as const,
    name: "Stories Mode",
    description: "Short-form content using proven templates for social media platforms",
    icon: Zap,
    available: true,
    features: ["Template-driven", "15-60s videos", "Quick turnaround", "Social optimized"],
  },
];

export function Step1TypeSelection({ value, onChange }: Step1TypeSelectionProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] py-12">
      <div className="w-full max-w-4xl space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-4xl font-display font-bold text-foreground">Choose Content Type</h2>
          <p className="text-lg text-muted-foreground">
            Select the type of content you want to produce in this campaign
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {contentTypes.map((type) => {
            const isSelected = value === type.id;
            const TypeIcon = type.icon;

            return (
              <Card
                key={type.id}
                className={`relative cursor-pointer transition-all h-full ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-lg scale-[1.02]"
                    : type.available
                    ? "hover:border-primary/50 hover:bg-muted/50 hover:shadow-md"
                    : "opacity-50 cursor-not-allowed"
                }`}
                onClick={() => type.available && onChange(type.id)}
                data-testid={`card-type-${type.id}`}
              >
                {isSelected && (
                  <div className="absolute top-6 right-6 z-10">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <Check className="h-5 w-5 text-primary-foreground" />
                    </div>
                  </div>
                )}
                
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-6">
                    <div className={`p-5 rounded-2xl transition-all ${
                      isSelected ? "bg-primary/20 scale-110" : "bg-muted"
                    }`}>
                      <TypeIcon className={`h-12 w-12 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    
                    <div className="w-full space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <h3 className="text-2xl font-bold">{type.name}</h3>
                        {!type.available && (
                          <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                        )}
                      </div>
                      <p className="text-base text-muted-foreground">
                        {type.description}
                      </p>
                      
                      {type.available && (
                        <div className="flex flex-wrap gap-2 justify-center pt-2">
                          {type.features.map((feature) => (
                            <Badge 
                              key={feature} 
                              variant="outline" 
                              className={`text-xs font-normal ${
                                isSelected ? "border-primary/30 bg-primary/5" : ""
                              }`}
                            >
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
