import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Link2, ExternalLink } from "lucide-react";
import { SiYoutube, SiTiktok, SiInstagram, SiFacebook } from "react-icons/si";

interface Platform {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  connected: boolean;
  description: string;
  color: string;
}

interface Step8PublishingProps {
  selectedPlatforms: string[];
  onSelectedPlatformsChange: (platforms: string[]) => void;
}

export function Step8Publishing({
  selectedPlatforms,
  onSelectedPlatformsChange,
}: Step8PublishingProps) {
  const platforms: Platform[] = [
    { 
      id: "youtube", 
      name: "YouTube", 
      icon: SiYoutube, 
      connected: false,
      description: "Long-form and Shorts",
      color: "text-red-500",
    },
    { 
      id: "tiktok", 
      name: "TikTok", 
      icon: SiTiktok, 
      connected: false,
      description: "Short-form videos",
      color: "text-foreground",
    },
    { 
      id: "instagram", 
      name: "Instagram", 
      icon: SiInstagram, 
      connected: false,
      description: "Reels and Stories",
      color: "text-pink-500",
    },
    { 
      id: "facebook", 
      name: "Facebook", 
      icon: SiFacebook, 
      connected: false,
      description: "Videos and Reels",
      color: "text-blue-500",
    },
  ];

  const togglePlatform = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      onSelectedPlatformsChange(selectedPlatforms.filter((p) => p !== platformId));
    } else {
      onSelectedPlatformsChange([...selectedPlatforms, platformId]);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold">Publishing Platforms</h2>
        <p className="text-muted-foreground mt-2">
          Select where you want to publish your videos. Connect accounts to enable auto-publishing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const isSelected = selectedPlatforms.includes(platform.id);

          return (
            <Card
              key={platform.id}
              className={`relative cursor-pointer transition-all ${
                isSelected
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "hover:border-primary/50 hover:bg-muted/50"
              }`}
              onClick={() => togglePlatform(platform.id)}
              data-testid={`card-platform-${platform.id}`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
              )}
              
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${isSelected ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon className={`h-7 w-7 ${platform.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{platform.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {platform.description}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      {platform.connected ? (
                        <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                          <Check className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground">
                          <Link2 className="h-3 w-3 mr-1" />
                          Not Connected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedPlatforms.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium mb-1">Selected Platforms</p>
                <p className="text-sm text-muted-foreground">
                  Your videos will be published to {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex gap-2">
                {selectedPlatforms.map((id) => {
                  const platform = platforms.find(p => p.id === id);
                  const Icon = platform?.icon;
                  return Icon ? (
                    <div key={id} className="p-2 rounded-lg bg-background">
                      <Icon className={`h-5 w-5 ${platform?.color}`} />
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedPlatforms.length === 0 && (
        <div className="p-6 rounded-lg border border-dashed text-center">
          <ExternalLink className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Select at least one platform to publish your videos
          </p>
        </div>
      )}

      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> You can connect your accounts after creating the campaign. 
          Videos will be queued for publishing until accounts are connected.
        </p>
      </div>
    </div>
  );
}
