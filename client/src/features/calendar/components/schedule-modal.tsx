// Schedule Modal Component
// ═══════════════════════════════════════════════════════════════════════════
// Modal for scheduling videos/stories to be published via Late.dev

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, Loader2, Check, Link2 } from "lucide-react";
import { SiYoutube, SiTiktok, SiInstagram, SiFacebook } from "react-icons/si";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useSocialAccounts } from "@/components/shared/social";
import { useSchedulePost } from "../hooks/use-calendar";
import type { SchedulePostInput, LatePlatform } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  /** Content data to schedule */
  content: {
    /** Video ID (for videos) */
    videoId?: string;
    /** Story ID (for stories) */
    storyId?: string;
    /** Content type */
    contentType: 'video' | 'story';
    /** Content mode (ambient, narrative, problem-solution, etc.) */
    contentMode: string;
    /** Video URL from BunnyCDN */
    videoUrl: string;
    /** Thumbnail URL */
    thumbnailUrl?: string;
    /** Title */
    title: string;
    /** Duration in seconds */
    duration?: number;
    /** Aspect ratio */
    aspectRatio?: string;
  };
  onSuccess?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const PLATFORMS: {
  id: LatePlatform;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}[] = [
  { id: "youtube", name: "YouTube", icon: SiYoutube, gradient: "from-red-600 to-red-700" },
  { id: "tiktok", name: "TikTok", icon: SiTiktok, gradient: "from-gray-800 to-black" },
  { id: "instagram", name: "Instagram", icon: SiInstagram, gradient: "from-purple-600 via-pink-500 to-orange-400" },
  { id: "facebook", name: "Facebook", icon: SiFacebook, gradient: "from-blue-600 to-blue-700" },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function ScheduleModal({
  open,
  onOpenChange,
  workspaceId,
  content,
  onSuccess,
}: ScheduleModalProps) {
  const { toast } = useToast();
  const { isConnected, getConnectUrl, refetch: refetchAccounts } = useSocialAccounts();
  const scheduleMutation = useSchedulePost(workspaceId);

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [selectedPlatforms, setSelectedPlatforms] = useState<LatePlatform[]>([]);
  const [connectingPlatform, setConnectingPlatform] = useState<LatePlatform | null>(null);

  // Platform-specific metadata
  const [youtubeTitle, setYoutubeTitle] = useState(content.title);
  const [youtubeDescription, setYoutubeDescription] = useState("");
  const [socialCaption, setSocialCaption] = useState("");

  // Toggle platform selection
  const togglePlatform = useCallback((platform: LatePlatform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  }, []);

  // Connect platform
  const handleConnect = useCallback(async (platform: LatePlatform) => {
    setConnectingPlatform(platform);
    try {
      const url = await getConnectUrl(platform);
      if (url) {
        window.open(url, '_blank', 'width=600,height=700');
        // Start polling for connection
        const pollInterval = setInterval(async () => {
          await refetchAccounts();
        }, 3000);
        
        // Stop polling after 2 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          setConnectingPlatform(null);
        }, 120000);
      }
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Could not connect to platform",
        variant: "destructive",
      });
    } finally {
      setConnectingPlatform(null);
    }
  }, [getConnectUrl, refetchAccounts, toast]);

  // Submit schedule
  const handleSubmit = useCallback(async () => {
    if (!selectedDate || selectedPlatforms.length === 0) {
      toast({
        title: "Missing information",
        description: "Please select a date and at least one platform",
        variant: "destructive",
      });
      return;
    }

    // Build scheduled datetime
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const scheduledFor = new Date(selectedDate);
    scheduledFor.setHours(hours, minutes, 0, 0);

    // Build metadata
    const hasYouTube = selectedPlatforms.includes("youtube");
    const hasSocial = selectedPlatforms.some(p => ["tiktok", "instagram", "facebook"].includes(p));

    // Validate required fields
    if (hasYouTube && (!youtubeTitle.trim() || !youtubeDescription.trim())) {
      toast({
        title: "YouTube requires title and description",
        description: "Please fill in the YouTube title and description",
        variant: "destructive",
      });
      return;
    }

    if (hasSocial && !socialCaption.trim()) {
      toast({
        title: "Caption required",
        description: "Please enter a caption for social platforms",
        variant: "destructive",
      });
      return;
    }

    const input: SchedulePostInput = {
      videoId: content.videoId,
      storyId: content.storyId,
      contentType: content.contentType,
      contentMode: content.contentMode,
      videoUrl: content.videoUrl,
      thumbnailUrl: content.thumbnailUrl,
      duration: content.duration,
      aspectRatio: content.aspectRatio,
      scheduledFor: scheduledFor.toISOString(),
      platforms: selectedPlatforms.map(platform => ({
        platform,
        accountId: "", // Will be filled by backend
      })),
      metadata: {
        youtube: hasYouTube ? {
          title: youtubeTitle,
          description: youtubeDescription,
        } : undefined,
        tiktok: selectedPlatforms.includes("tiktok") ? {
          caption: socialCaption,
        } : undefined,
        instagram: selectedPlatforms.includes("instagram") ? {
          caption: socialCaption,
        } : undefined,
        facebook: selectedPlatforms.includes("facebook") ? {
          caption: socialCaption,
        } : undefined,
      },
    };

    try {
      await scheduleMutation.mutateAsync(input);
      toast({
        title: "Content scheduled!",
        description: `Scheduled for ${format(scheduledFor, "MMM d, yyyy 'at' h:mm a")}`,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Scheduling failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  }, [
    selectedDate, 
    selectedTime, 
    selectedPlatforms, 
    content, 
    youtubeTitle, 
    youtubeDescription, 
    socialCaption,
    scheduleMutation,
    toast,
    onOpenChange,
    onSuccess,
  ]);

  const hasYouTube = selectedPlatforms.includes("youtube");
  const hasSocial = selectedPlatforms.some(p => ["tiktok", "instagram", "facebook"].includes(p));
  const canSubmit = selectedDate && selectedPlatforms.length > 0 && !scheduleMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Content</DialogTitle>
          <DialogDescription>
            Schedule "{content.title}" to be published on social media
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date & Time Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Date Picker */}
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Picker */}
              <div className="space-y-2">
                <Label>Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="space-y-3">
            <Label>Platforms</Label>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map(platform => {
                const Icon = platform.icon;
                const connected = isConnected(platform.id);
                const selected = selectedPlatforms.includes(platform.id);
                const connecting = connectingPlatform === platform.id;

                return (
                  <div
                    key={platform.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                      selected && connected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                      !connected && "opacity-60"
                    )}
                    onClick={() => connected && togglePlatform(platform.id)}
                  >
                    {/* Checkbox indicator */}
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                      selected && connected
                        ? "bg-primary border-primary"
                        : "border-muted-foreground"
                    )}>
                      {selected && connected && <Check className="w-3 h-3 text-white" />}
                    </div>

                    {/* Platform icon */}
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
                      platform.gradient
                    )}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>

                    {/* Platform name */}
                    <span className="text-sm font-medium flex-1">{platform.name}</span>

                    {/* Connect button if not connected */}
                    {!connected && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConnect(platform.id);
                        }}
                        disabled={connecting}
                        className="h-7 text-xs"
                      >
                        {connecting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Link2 className="h-3 w-3 mr-1" />
                            Connect
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* YouTube Metadata */}
          {hasYouTube && (
            <div className="space-y-3 p-4 rounded-lg bg-muted/50">
              <Label className="flex items-center gap-2">
                <SiYoutube className="h-4 w-4 text-red-500" />
                YouTube Details
              </Label>
              <Input
                placeholder="Video title"
                value={youtubeTitle}
                onChange={(e) => setYoutubeTitle(e.target.value)}
              />
              <Textarea
                placeholder="Video description"
                value={youtubeDescription}
                onChange={(e) => setYoutubeDescription(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Social Caption */}
          {hasSocial && (
            <div className="space-y-3 p-4 rounded-lg bg-muted/50">
              <Label>Social Caption</Label>
              <Textarea
                placeholder="Write a caption for TikTok, Instagram, and Facebook..."
                value={socialCaption}
                onChange={(e) => setSocialCaption(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!canSubmit}
          >
            {scheduleMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Schedule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
