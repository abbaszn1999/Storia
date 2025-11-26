import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Check, Link2, ExternalLink, Scissors, Sparkles, Clock, Zap } from "lucide-react";
import { SiYoutube, SiTiktok, SiInstagram, SiFacebook } from "react-icons/si";

interface Platform {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  connected: boolean;
  description: string;
  color: string;
}

const HOOK_TYPES = [
  { id: "emotional", label: "Emotional", description: "Powerful character moments" },
  { id: "action", label: "Action", description: "High-energy sequences" },
  { id: "reveal", label: "Reveal", description: "Plot twists and surprises" },
  { id: "humor", label: "Humor", description: "Comedic moments" },
  { id: "dramatic", label: "Dramatic", description: "Intense scenes" },
];

interface Step8PublishingProps {
  selectedPlatforms: string[];
  onSelectedPlatformsChange: (platforms: string[]) => void;
  videoMode?: string;
  autoShortsEnabled?: boolean;
  onAutoShortsEnabledChange?: (enabled: boolean) => void;
  shortsPerVideo?: number;
  onShortsPerVideoChange?: (count: number) => void;
  shortsHookTypes?: string[];
  onShortsHookTypesChange?: (types: string[]) => void;
  shortsMinConfidence?: number;
  onShortsMinConfidenceChange?: (confidence: number) => void;
  autoPublishShorts?: boolean;
  onAutoPublishShortsChange?: (enabled: boolean) => void;
  shortsPlatforms?: string[];
  onShortsPlatformsChange?: (platforms: string[]) => void;
  shortsScheduleMode?: "with_main" | "staggered";
  onShortsScheduleModeChange?: (mode: "with_main" | "staggered") => void;
  shortsStaggerHours?: number;
  onShortsStaggerHoursChange?: (hours: number) => void;
}

export function Step8Publishing({
  selectedPlatforms,
  onSelectedPlatformsChange,
  videoMode = "narrative",
  autoShortsEnabled = false,
  onAutoShortsEnabledChange,
  shortsPerVideo = 3,
  onShortsPerVideoChange,
  shortsHookTypes = ["emotional", "action", "reveal", "dramatic"],
  onShortsHookTypesChange,
  shortsMinConfidence = 75,
  onShortsMinConfidenceChange,
  autoPublishShorts = true,
  onAutoPublishShortsChange,
  shortsPlatforms = [],
  onShortsPlatformsChange,
  shortsScheduleMode = "with_main",
  onShortsScheduleModeChange,
  shortsStaggerHours = 4,
  onShortsStaggerHoursChange,
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

  const shortsPlatformsList = [
    { id: "youtube_shorts", name: "YouTube Shorts", icon: SiYoutube, color: "text-red-500" },
    { id: "tiktok", name: "TikTok", icon: SiTiktok, color: "text-foreground" },
    { id: "instagram_reels", name: "Instagram Reels", icon: SiInstagram, color: "text-pink-500" },
    { id: "facebook_reels", name: "Facebook Reels", icon: SiFacebook, color: "text-blue-500" },
  ];

  const showAutoShorts = videoMode === "narrative" || videoMode === "character_vlog";

  const togglePlatform = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      onSelectedPlatformsChange(selectedPlatforms.filter((p) => p !== platformId));
    } else {
      onSelectedPlatformsChange([...selectedPlatforms, platformId]);
    }
  };

  const toggleShortsPlatform = (platformId: string) => {
    if (!onShortsPlatformsChange) return;
    if (shortsPlatforms.includes(platformId)) {
      onShortsPlatformsChange(shortsPlatforms.filter((p) => p !== platformId));
    } else {
      onShortsPlatformsChange([...shortsPlatforms, platformId]);
    }
  };

  const toggleHookType = (hookId: string) => {
    if (!onShortsHookTypesChange) return;
    if (shortsHookTypes.includes(hookId)) {
      if (shortsHookTypes.length > 1) {
        onShortsHookTypesChange(shortsHookTypes.filter((h) => h !== hookId));
      }
    } else {
      onShortsHookTypesChange([...shortsHookTypes, hookId]);
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

      {showAutoShorts && (
        <>
          <Separator className="my-8" />
          
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Auto Shorts</h3>
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI-Powered
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatically extract hook moments from completed videos and create short-form clips
                </p>
              </div>
              <Switch
                checked={autoShortsEnabled}
                onCheckedChange={onAutoShortsEnabledChange}
                data-testid="switch-auto-shorts"
              />
            </div>

            {autoShortsEnabled && (
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Shorts Per Video</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[shortsPerVideo]}
                          onValueChange={([v]) => onShortsPerVideoChange?.(v)}
                          min={1}
                          max={5}
                          step={1}
                          className="flex-1"
                          data-testid="slider-shorts-per-video"
                        />
                        <span className="w-8 text-center font-medium">{shortsPerVideo}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Generate {shortsPerVideo} short clip{shortsPerVideo !== 1 ? 's' : ''} from each video
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Minimum Confidence</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[shortsMinConfidence]}
                          onValueChange={([v]) => onShortsMinConfidenceChange?.(v)}
                          min={50}
                          max={95}
                          step={5}
                          className="flex-1"
                          data-testid="slider-min-confidence"
                        />
                        <span className="w-12 text-center font-medium">{shortsMinConfidence}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Only use hooks with {shortsMinConfidence}%+ confidence score
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Hook Types to Include</Label>
                    <div className="flex flex-wrap gap-2">
                      {HOOK_TYPES.map((hook) => {
                        const isSelected = shortsHookTypes.includes(hook.id);
                        return (
                          <Badge
                            key={hook.id}
                            variant={isSelected ? "default" : "outline"}
                            className={`cursor-pointer px-3 py-1.5 ${
                              isSelected ? "" : "hover:bg-muted"
                            }`}
                            onClick={() => toggleHookType(hook.id)}
                            data-testid={`badge-hook-${hook.id}`}
                          >
                            {isSelected && <Check className="h-3 w-3 mr-1.5" />}
                            {hook.label}
                          </Badge>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Select which types of moments to extract as shorts
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Auto-Publish Shorts</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically publish generated shorts to platforms
                        </p>
                      </div>
                      <Switch
                        checked={autoPublishShorts}
                        onCheckedChange={onAutoPublishShortsChange}
                        data-testid="switch-auto-publish-shorts"
                      />
                    </div>

                    {autoPublishShorts && (
                      <>
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Shorts Platforms</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {shortsPlatformsList.map((platform) => {
                              const Icon = platform.icon;
                              const isSelected = shortsPlatforms.includes(platform.id);
                              return (
                                <div
                                  key={platform.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                    isSelected
                                      ? "border-primary bg-primary/5"
                                      : "hover:border-muted-foreground/50 hover:bg-muted/50"
                                  }`}
                                  onClick={() => toggleShortsPlatform(platform.id)}
                                  data-testid={`shorts-platform-${platform.id}`}
                                >
                                  <Icon className={`h-5 w-5 ${platform.color}`} />
                                  <span className="text-sm font-medium">{platform.name}</span>
                                  {isSelected && (
                                    <Check className="h-4 w-4 text-primary ml-auto" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Shorts Schedule</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <div
                              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                shortsScheduleMode === "with_main"
                                  ? "border-primary bg-primary/5"
                                  : "hover:border-muted-foreground/50"
                              }`}
                              onClick={() => onShortsScheduleModeChange?.("with_main")}
                              data-testid="schedule-with-main"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Zap className="h-4 w-4 text-primary" />
                                <span className="font-medium text-sm">With Main Video</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Publish shorts at the same time as the main video
                              </p>
                            </div>
                            <div
                              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                shortsScheduleMode === "staggered"
                                  ? "border-primary bg-primary/5"
                                  : "hover:border-muted-foreground/50"
                              }`}
                              onClick={() => onShortsScheduleModeChange?.("staggered")}
                              data-testid="schedule-staggered"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="h-4 w-4 text-primary" />
                                <span className="font-medium text-sm">Staggered</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Space out shorts publishing over time
                              </p>
                            </div>
                          </div>

                          {shortsScheduleMode === "staggered" && (
                            <div className="flex items-center gap-4 pt-2">
                              <Label className="text-sm shrink-0">Publish every</Label>
                              <Slider
                                value={[shortsStaggerHours]}
                                onValueChange={([v]) => onShortsStaggerHoursChange?.(v)}
                                min={1}
                                max={24}
                                step={1}
                                className="flex-1"
                                data-testid="slider-stagger-hours"
                              />
                              <span className="w-24 text-sm font-medium">
                                {shortsStaggerHours} hour{shortsStaggerHours !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
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
