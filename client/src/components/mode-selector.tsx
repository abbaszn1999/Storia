import { Video, MessageSquare, Sparkles, Mic, ShoppingBag, Clapperboard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const modes = [
  {
    id: "narrative",
    title: "Narrative Video",
    description: "Create story-driven videos from script to storyboard",
    icon: Video,
    available: true,
  },
  {
    id: "vlog",
    title: "Character Vlog",
    description: "Create story-driven videos starring a single character",
    icon: MessageSquare,
    available: true,
  },
  {
    id: "ambient",
    title: "Ambient Visual",
    description: "Mood-driven visual storytelling",
    icon: Sparkles,
    available: false,
  },
  {
    id: "podcast",
    title: "Video Podcast",
    description: "Conversation-style content creation",
    icon: Mic,
    available: false,
  },
  {
    id: "commerce",
    title: "Social Commerce",
    description: "Product showcase and promotional videos",
    icon: ShoppingBag,
    available: false,
  },
  {
    id: "logo",
    title: "Logo Animation",
    description: "Brand storytelling through motion",
    icon: Clapperboard,
    available: false,
  },
];

interface ModeSelectorProps {
  onSelect: (modeId: string) => void;
}

export function ModeSelector({ onSelect }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {modes.map((mode) => (
        <Card
          key={mode.id}
          className={`cursor-pointer transition-all ${
            mode.available
              ? "hover-elevate active-elevate-2"
              : "opacity-50 cursor-not-allowed"
          }`}
          onClick={() => mode.available && onSelect(mode.id)}
          data-testid={`card-mode-${mode.id}`}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${mode.available ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <mode.icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{mode.title}</CardTitle>
                {!mode.available && (
                  <span className="text-xs text-muted-foreground">Coming soon</span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>{mode.description}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
