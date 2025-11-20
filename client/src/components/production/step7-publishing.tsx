import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SiYoutube, SiTiktok, SiInstagram, SiFacebook } from "react-icons/si";

interface Platform {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  connected: boolean;
}

interface Step7PublishingProps {
  selectedPlatforms: string[];
  onSelectedPlatformsChange: (platforms: string[]) => void;
}

export function Step7Publishing({
  selectedPlatforms,
  onSelectedPlatformsChange,
}: Step7PublishingProps) {
  const platforms: Platform[] = [
    { id: "youtube", name: "YouTube", icon: SiYoutube, connected: false },
    { id: "tiktok", name: "TikTok", icon: SiTiktok, connected: false },
    { id: "instagram", name: "Instagram", icon: SiInstagram, connected: false },
    { id: "facebook", name: "Facebook", icon: SiFacebook, connected: false },
  ];

  const togglePlatform = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      onSelectedPlatformsChange(selectedPlatforms.filter((p) => p !== platformId));
    } else {
      onSelectedPlatformsChange([...selectedPlatforms, platformId]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Publishing Platforms</h2>
        <p className="text-muted-foreground mt-2">
          Select platforms where you want to publish your videos
        </p>
      </div>

      <div className="space-y-4">
        <Label>Select Platforms</Label>
        <div className="grid grid-cols-2 gap-4">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const isSelected = selectedPlatforms.includes(platform.id);

            return (
              <Card
                key={platform.id}
                className={`cursor-pointer transition-all hover-elevate ${
                  isSelected ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => togglePlatform(platform.id)}
                data-testid={`card-platform-${platform.id}`}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => togglePlatform(platform.id)}
                    data-testid={`checkbox-platform-${platform.id}`}
                  />
                  <Icon className="h-8 w-8 text-foreground" />
                  <div className="flex-1">
                    <p className="font-semibold">{platform.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {platform.connected ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedPlatforms.length === 0 && (
          <div className="bg-muted/50 p-4 rounded-md">
            <p className="text-sm text-muted-foreground">
              Select at least one platform to publish your videos. You can connect your accounts later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
