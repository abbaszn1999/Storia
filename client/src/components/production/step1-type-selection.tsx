import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, FileText, Check } from "lucide-react";

interface Step1TypeSelectionProps {
  value: "video" | "story";
  onChange: (value: "video" | "story") => void;
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
    id: "story" as const,
    name: "Story Publishing",
    description: "Create illustrated stories for blogs and social media platforms",
    icon: FileText,
    available: false,
    features: ["Coming Soon"],
  },
];

export function Step1TypeSelection({ value, onChange }: Step1TypeSelectionProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold">Choose Content Type</h2>
        <p className="text-muted-foreground mt-2">
          Select the type of content you want to produce in this campaign
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contentTypes.map((type) => {
          const isSelected = value === type.id;
          const TypeIcon = type.icon;

          return (
            <Card
              key={type.id}
              className={`relative cursor-pointer transition-all ${
                isSelected
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : type.available
                  ? "hover:border-primary/50 hover:bg-muted/50"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => type.available && onChange(type.id)}
              data-testid={`card-type-${type.id}`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${isSelected ? "bg-primary/10" : "bg-muted"}`}>
                    <TypeIcon className={`h-8 w-8 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{type.name}</h3>
                      {!type.available && (
                        <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {type.description}
                    </p>
                    
                    {type.available && (
                      <div className="flex flex-wrap gap-2">
                        {type.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs font-normal">
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
  );
}
