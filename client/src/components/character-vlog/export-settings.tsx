import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, Share2, Calendar, Youtube, Instagram, Sparkles, Play, Settings, FileVideo, Clock, ArrowRight } from "lucide-react";
import { SiTiktok, SiFacebook } from "react-icons/si";
import { cn } from "@/lib/utils";

const RESOLUTION_OPTIONS = [
  { value: "720p", label: "720p (HD)", description: "1280×720" },
  { value: "1080p", label: "1080p (Full HD)", description: "1920×1080" },
  { value: "1440p", label: "1440p (2K)", description: "2560×1440" },
  { value: "2160p", label: "2160p (4K)", description: "3840×2160" },
];

const FORMAT_OPTIONS = [
  { value: "mp4", label: "MP4", description: "Universal compatibility" },
  { value: "mov", label: "MOV", description: "High quality" },
  { value: "webm", label: "WebM", description: "Web optimized" },
];

// Platform types for metadata
export type Platform = "youtube" | "tiktok" | "instagram" | "facebook";

export interface YouTubeMetadata {
  title: string;
  description: string;
  tags: string;
}

export interface SocialMetadata {
  caption: string;
}

export interface PlatformMetadata {
  youtube?: YouTubeMetadata;
  social?: SocialMetadata;
}

export interface ExportData {
  resolution: string;
  platformMetadata: PlatformMetadata;
  publishType: "instant" | "schedule";
  selectedPlatforms: string[];
  scheduleDate?: string;
  scheduleTime?: string;
}

interface ExportSettingsProps {
  onExport: (data: ExportData) => void;
}

const PLATFORMS = [
  { id: "youtube", name: "YouTube", icon: Youtube, color: "from-red-500 to-red-600" },
  { id: "tiktok", name: "TikTok", icon: SiTiktok, color: "from-black to-gray-800" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "from-pink-500 to-purple-600" },
  { id: "facebook", name: "Facebook", icon: SiFacebook, color: "from-blue-600 to-blue-700" },
];

export function ExportSettings({ onExport }: ExportSettingsProps) {
  const [resolution, setResolution] = useState("1080p");
  const [format, setFormat] = useState("mp4");
  const [quality, setQuality] = useState([85]);
  
  const [platformMetadata, setPlatformMetadata] = useState<PlatformMetadata>({});
  const [publishType, setPublishType] = useState<"instant" | "schedule">("instant");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const accentClasses = "from-[#FF4081] via-[#FF5C8D] to-[#FF6B4A]";

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platformId)) {
        const newPlatforms = prev.filter((id) => id !== platformId);
        
        // Clean up metadata
        if (platformId === "youtube") {
          const newMetadata = { ...platformMetadata };
          delete newMetadata.youtube;
          setPlatformMetadata(newMetadata);
        } else if (platformId !== "youtube") {
          const hasSocialPlatforms = newPlatforms.some((p) => p !== "youtube");
          if (!hasSocialPlatforms) {
            const newMetadata = { ...platformMetadata };
            delete newMetadata.social;
            setPlatformMetadata(newMetadata);
          }
        }
        
        return newPlatforms;
      } else {
        const newPlatforms = [...prev, platformId];
        
        // Initialize metadata
        const newMetadata = { ...platformMetadata };
        if (platformId === "youtube") {
          if (!newMetadata.youtube) {
            newMetadata.youtube = { title: "", description: "", tags: "" };
          }
        } else {
          if (!newMetadata.social) {
            newMetadata.social = { caption: "" };
          }
        }
        setPlatformMetadata(newMetadata);
        
        return newPlatforms;
      }
    });
  };

  const updateYouTubeMetadata = (field: keyof YouTubeMetadata, value: string) => {
    setPlatformMetadata((prev) => ({
      ...prev,
      youtube: { ...prev.youtube!, [field]: value },
    }));
  };

  const updateSocialMetadata = (value: string) => {
    setPlatformMetadata((prev) => ({
      ...prev,
      social: { caption: value },
    }));
  };

  const handleAIRecommendation = async () => {
    if (selectedPlatforms.length === 0) return;

    setIsGeneratingAI(true);
    
    setTimeout(() => {
      const newMetadata = { ...platformMetadata };
      
      if (selectedPlatforms.includes("youtube") && newMetadata.youtube) {
        newMetadata.youtube = {
          title: "Amazing AI-Generated Video Story",
          description: "This captivating narrative video brings your story to life with stunning visuals and compelling storytelling. Created using advanced AI technology.",
          tags: "AI video, storytelling, creative content, video production, narrative"
        };
      }
      
      const hasSocialPlatforms = selectedPlatforms.some(p => p !== "youtube");
      if (hasSocialPlatforms) {
        if (!newMetadata.social) {
          newMetadata.social = { caption: "" };
        }
        newMetadata.social.caption = "✨ Just created this amazing video story! Watch how AI brings creativity to life 🎬 #AIVideo #Storytelling #CreativeContent #VideoCreation";
      }
      
      setPlatformMetadata(newMetadata);
      setIsGeneratingAI(false);
    }, 1500);
  };

  const handleExport = () => {
    onExport({
      resolution,
      platformMetadata,
      publishType,
      selectedPlatforms,
      scheduleDate: publishType === "schedule" ? scheduleDate : undefined,
      scheduleTime: publishType === "schedule" ? scheduleTime : undefined,
    });
  };

  return (
    <div className="flex w-full h-[calc(100vh-12rem)] gap-0 overflow-hidden">
      {/* LEFT COLUMN: EXPORT SETTINGS (35% width) */}
      <div
        className={cn(
          "w-[35%] min-w-[350px] max-w-[500px] flex-shrink-0 h-full",
          "bg-black/40 backdrop-blur-xl",
          "border-r border-white/[0.06]",
          "flex flex-col overflow-hidden"
        )}
      >
        <ScrollArea className="flex-1 h-full">
          <div className="p-6 space-y-6 pb-12">
            {/* Resolution */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileVideo className="w-5 h-5 text-[#FF4081]/90" />
                  <Label className="text-lg font-semibold text-white">Resolution</Label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {RESOLUTION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setResolution(option.value)}
                      className={cn(
                        "p-3 rounded-lg border transition-all hover-elevate text-left",
                        resolution === option.value
                          ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                      data-testid={`button-resolution-${option.value}`}
                    >
                      <div className="font-semibold text-sm text-white">{option.label}</div>
                      <div className="text-xs text-white/40">{option.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Format & Quality */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-5 h-5 text-[#FF4081]/90" />
                  <Label className="text-lg font-semibold text-white">Format & Quality</Label>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-white/50 uppercase tracking-wider">File Format</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/10">
                      {FORMAT_OPTIONS.map((opt) => (
                        <SelectItem 
                          key={opt.value} 
                          value={opt.value}
                          className="focus:bg-[#FF4081]/20 focus:text-white"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{opt.label}</span>
                            <span className="text-xs text-white/50">{opt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-white/50 uppercase tracking-wider">Quality</Label>
                    <span className="text-xs text-[#FF4081]/90 font-medium">{quality[0]}%</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="100"
                    value={quality[0]}
                    onChange={(e) => setQuality([parseInt(e.target.value)])}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-white/40">Higher quality = larger file size</p>
                </div>
              </CardContent>
            </Card>

            {/* Publishing Type */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-[#FF4081]/90" />
                  <Label className="text-lg font-semibold text-white">Publishing</Label>
                </div>
                
                <RadioGroup value={publishType} onValueChange={(value: "instant" | "schedule") => setPublishType(value)}>
                  <div className="space-y-2">
                    <div
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                        publishType === "instant"
                          ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                      onClick={() => setPublishType("instant")}
                    >
                      <RadioGroupItem value="instant" id="instant" data-testid="radio-instant" />
                      <Label htmlFor="instant" className="font-normal cursor-pointer flex items-center gap-2 text-white flex-1">
                        <Share2 className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Share Instantly</div>
                          <div className="text-xs text-white/50">Publish immediately after export</div>
                        </div>
                      </Label>
                    </div>
                    
                    <div
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                        publishType === "schedule"
                          ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                      onClick={() => setPublishType("schedule")}
                    >
                      <RadioGroupItem value="schedule" id="schedule" data-testid="radio-schedule" />
                      <Label htmlFor="schedule" className="font-normal cursor-pointer flex items-center gap-2 text-white flex-1">
                        <Calendar className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Schedule for Later</div>
                          <div className="text-xs text-white/50">Choose date and time</div>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                {publishType === "schedule" && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="grid grid-cols-2 gap-3 pt-2"
                  >
                    <div className="space-y-2">
                      <Label className="text-xs text-white/50">Date</Label>
                      <Input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                        data-testid="input-schedule-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-white/50">Time</Label>
                      <Input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                        data-testid="input-schedule-time"
                      />
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>

      {/* RIGHT COLUMN: PLATFORMS & METADATA (65% width) */}
      <div className="flex-1 relative flex flex-col overflow-hidden h-full">
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Video Preview */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6">
                <div className="aspect-video bg-black/60 rounded-lg border border-white/10 flex items-center justify-center">
                  <div className="text-center text-white/60">
                    <div className={cn("w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br", accentClasses, "bg-opacity-20 flex items-center justify-center")}>
                      <Play className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Final Video Preview</h3>
                    <p className="mt-1 text-sm text-white/50">Your compiled video will appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Selection */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-[#FF4081]/90" />
                    <Label className="text-lg font-semibold text-white">Select Platforms</Label>
                  </div>
                  {selectedPlatforms.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAIRecommendation}
                      disabled={isGeneratingAI}
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                      data-testid="button-ai-recommendation"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {isGeneratingAI ? "Generating..." : "AI Metadata"}
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {PLATFORMS.map((platform) => {
                    const Icon = platform.icon;
                    const isSelected = selectedPlatforms.includes(platform.id);
                    return (
                      <button
                        key={platform.id}
                        onClick={() => handlePlatformToggle(platform.id)}
                        className={cn(
                          "p-4 rounded-lg border transition-all hover-elevate text-left",
                          isSelected
                            ? cn("bg-gradient-to-br border-white/20", platform.color, "bg-opacity-20")
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                        data-testid={`platform-${platform.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-6 h-6 text-white" />
                          <span className="font-medium text-white">{platform.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* YouTube Metadata */}
            {selectedPlatforms.includes("youtube") && platformMetadata.youtube && (
              <Card className="bg-white/[0.02] border-white/[0.06]">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Youtube className="w-5 h-5 text-red-500" />
                    <Label className="text-lg font-semibold text-white">YouTube Details</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-white/50 uppercase tracking-wider">Title</Label>
                    <Input
                      placeholder="Enter video title"
                      value={platformMetadata.youtube.title}
                      onChange={(e) => updateYouTubeMetadata("title", e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      data-testid="input-youtube-title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-white/50 uppercase tracking-wider">Description</Label>
                    <Textarea
                      placeholder="Write a description for your video..."
                      value={platformMetadata.youtube.description}
                      onChange={(e) => updateYouTubeMetadata("description", e.target.value)}
                      rows={4}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                      data-testid="textarea-youtube-description"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-white/50 uppercase tracking-wider">Tags</Label>
                    <Input
                      placeholder="video, content, creative"
                      value={platformMetadata.youtube.tags}
                      onChange={(e) => updateYouTubeMetadata("tags", e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      data-testid="input-youtube-tags"
                    />
                    <p className="text-xs text-white/40">Separate tags with commas</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Social Media Caption */}
            {platformMetadata.social && selectedPlatforms.some(p => p !== "youtube") && (
              <Card className="bg-white/[0.02] border-white/[0.06]">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {selectedPlatforms.includes("tiktok") && <SiTiktok className="w-5 h-5 text-white" />}
                      {selectedPlatforms.includes("instagram") && <Instagram className="w-5 h-5 text-pink-500" />}
                      {selectedPlatforms.includes("facebook") && <SiFacebook className="w-5 h-5 text-blue-500" />}
                    </div>
                    <Label className="text-lg font-semibold text-white">Social Media Caption</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Write a caption for your social media posts..."
                      value={platformMetadata.social.caption}
                      onChange={(e) => updateSocialMetadata(e.target.value)}
                      rows={4}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                      data-testid="textarea-social-caption"
                    />
                    <p className="text-xs text-white/40">
                      This caption will be used for all selected social platforms
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* Export Button */}
        <div className="flex-shrink-0 p-6 border-t border-white/[0.04]">
          <Button
            onClick={handleExport}
            size="lg"
            className="w-full bg-gradient-to-r from-[#FF4081] via-[#FF5C8D] to-[#FF6B4A] hover:opacity-90 text-white"
            data-testid="button-export"
          >
            <Download className="w-4 h-4 mr-2" />
            {publishType === "instant" && selectedPlatforms.length > 0
              ? "Export & Publish"
              : publishType === "schedule" && selectedPlatforms.length > 0
              ? "Export & Schedule"
              : "Export Video"}
          </Button>
        </div>
      </div>
    </div>
  );
}
