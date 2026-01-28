import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Youtube, Music2 as TikTok, Instagram, Facebook } from "lucide-react";

interface Platform {
  id: string;
  name: string;
  icon: any;
  description: string;
  color: string;
}

const platforms: Platform[] = [
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    description: "Upload to YouTube",
    color: "text-red-500",
  },
  {
    id: "youtube_shorts",
    name: "YouTube Shorts",
    icon: Youtube,
    description: "Short-form vertical videos",
    color: "text-red-500",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: TikTok,
    description: "Share on TikTok",
    color: "text-black dark:text-white",
  },
  {
    id: "instagram_reels",
    name: "Instagram Reels",
    icon: Instagram,
    description: "Post to Instagram Reels",
    color: "text-pink-500",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    description: "Share to Instagram feed",
    color: "text-pink-500",
  },
  {
    id: "facebook_reels",
    name: "Facebook Reels",
    icon: Facebook,
    description: "Post to Facebook Reels",
    color: "text-blue-500",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    description: "Share to Facebook",
    color: "text-blue-500",
  },
];

interface PlatformSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export function PlatformSelector({ selected, onChange, className }: PlatformSelectorProps) {
  const togglePlatform = (platformId: string) => {
    if (selected.includes(platformId)) {
      onChange(selected.filter(id => id !== platformId));
    } else {
      onChange([...selected, platformId]);
    }
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className || ''}`}>
      {platforms.map((platform) => {
        const Icon = platform.icon;
        const isSelected = selected.includes(platform.id);

        return (
          <Card
            key={platform.id}
            className={`cursor-pointer transition-all ${
              isSelected
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                : 'hover:border-primary/50'
            }`}
            onClick={() => togglePlatform(platform.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => togglePlatform(platform.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-5 w-5 ${platform.color}`} />
                    <span className="font-medium">{platform.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {platform.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
