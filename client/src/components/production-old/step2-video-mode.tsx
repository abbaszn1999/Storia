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
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-display font-bold text-foreground">Choose Video Mode</h2>
        <p className="text-lg text-muted-foreground">
          Select the production style that best fits your content goals
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videoModes.map((mode) => {
          const isSelected = videoMode === mode.id;
          const ModeIcon = mode.icon;

          return (
            <Card
              key={mode.id}
              className={`relative cursor-pointer transition-all h-full ${
                isSelected
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-lg scale-[1.02]"
                  : mode.available
                  ? "hover:border-primary/50 hover:bg-muted/50 hover:shadow-md"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => mode.available && onVideoModeChange(mode.id)}
              data-testid={`card-video-mode-${mode.id}`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`p-3 rounded-xl transition-all ${
                      isSelected ? "bg-primary/20 scale-110" : "bg-muted"
                    }`}>
                      <ModeIcon className={`h-7 w-7 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    {!mode.available && (
                      <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{mode.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {mode.description}
                    </p>
                  </div>
                  
                  {mode.available && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {mode.features.map((feature) => (
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
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
