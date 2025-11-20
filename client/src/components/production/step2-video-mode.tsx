import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, User, Podcast } from "lucide-react";

interface Step2VideoModeProps {
  videoMode: string;
  onVideoModeChange: (mode: string) => void;
}

const videoModes = [
  {
    id: "narrative",
    name: "Narrative Video",
    description: "Story-driven videos with script, scenes, and storyboard workflow",
    icon: Film,
    available: true,
  },
  {
    id: "character_vlog",
    name: "Character Vlog",
    description: "AI character presenting content in a vlog format",
    icon: User,
    available: false,
  },
  {
    id: "video_podcast",
    name: "Video Podcast",
    description: "AI-hosted podcast with visual elements and multiple speakers",
    icon: Podcast,
    available: false,
  },
];

export function Step2VideoMode({ videoMode, onVideoModeChange }: Step2VideoModeProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-2">Choose Video Mode</h2>
        <p className="text-muted-foreground">
          Select the type of video content you want to create
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {videoModes.map((mode) => (
          <Card
            key={mode.id}
            className={`cursor-pointer transition-all ${
              videoMode === mode.id
                ? "border-primary ring-2 ring-primary"
                : mode.available
                ? "hover-elevate active-elevate-2"
                : "opacity-50 cursor-not-allowed"
            }`}
            onClick={() => mode.available && onVideoModeChange(mode.id)}
            data-testid={`card-video-mode-${mode.id}`}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-md bg-primary/10">
                  <mode.icon className="h-6 w-6 text-primary" />
                </div>
                {!mode.available && (
                  <span className="text-xs text-muted-foreground">(Coming Soon)</span>
                )}
              </div>
              <CardTitle className="text-lg">{mode.name}</CardTitle>
              <CardDescription>{mode.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
