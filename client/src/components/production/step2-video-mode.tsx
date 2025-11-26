import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Film, User, Podcast, Waves, Check } from "lucide-react";

interface Step2VideoModeProps {
  videoMode: string;
  onVideoModeChange: (mode: string) => void;
}

const videoModes = [
  {
    id: "narrative",
    name: "Narrative Video",
    description: "Story-driven videos with full creative control over script, scenes, and storyboard",
    icon: Film,
    available: true,
    features: ["Full script control", "Scene-by-scene editing", "Storyboard preview", "Shot continuity"],
  },
  {
    id: "character_vlog",
    name: "Character Vlog",
    description: "AI character presents content in an engaging vlog format with personality",
    icon: User,
    available: true,
    features: ["AI host character", "First/third person", "Casual tone", "Engaging delivery"],
  },
  {
    id: "ambient_visual",
    name: "Ambient Video",
    description: "Seamless looping visuals for relaxation, focus, or atmospheric content",
    icon: Waves,
    available: true,
    features: ["Seamless looping", "Mood-based", "Long-form support", "Parallax effects"],
  },
  {
    id: "video_podcast",
    name: "Video Podcast",
    description: "AI-hosted podcast with visual elements and dynamic multi-speaker conversations",
    icon: Podcast,
    available: false,
    features: ["Coming Soon"],
  },
];

export function Step2VideoMode({ videoMode, onVideoModeChange }: Step2VideoModeProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold">Choose Video Mode</h2>
        <p className="text-muted-foreground mt-2">
          Select the production style that best fits your content goals
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {videoModes.map((mode) => {
          const isSelected = videoMode === mode.id;
          const ModeIcon = mode.icon;

          return (
            <Card
              key={mode.id}
              className={`relative cursor-pointer transition-all ${
                isSelected
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : mode.available
                  ? "hover:border-primary/50 hover:bg-muted/50"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => mode.available && onVideoModeChange(mode.id)}
              data-testid={`card-video-mode-${mode.id}`}
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
                    <ModeIcon className={`h-7 w-7 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{mode.name}</h3>
                      {!mode.available && (
                        <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {mode.description}
                    </p>
                    
                    {mode.available && (
                      <div className="flex flex-wrap gap-2">
                        {mode.features.map((feature) => (
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
