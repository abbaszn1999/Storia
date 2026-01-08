import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Music, 
  Link2, 
  CheckCircle2, 
  Loader2, 
  Lock, 
  Clock,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  Save,
  X,
  Copy,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { BeatPrompt } from "@/types/commerce";
import type { BeatStatus } from "@/types/commerce";

interface BeatCardStoryboardProps {
  beat: BeatPrompt;
  status: BeatStatus;
  heroImageUrl?: string;
  isSelected: boolean;
  onSelect: () => void;
  onGenerate?: () => void;
  onPromptUpdate?: (beatId: string, newPrompt: string) => Promise<void>;
}

export function BeatCardStoryboard({
  beat,
  status,
  heroImageUrl,
  isSelected,
  onSelect,
  onGenerate,
  onPromptUpdate,
}: BeatCardStoryboardProps) {
  const [activeTab, setActiveTab] = useState<"prompt" | "audio">("prompt");
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(beat.sora_prompt.text);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Update edited prompt when beat changes
  useEffect(() => {
    setEditedPrompt(beat.sora_prompt.text);
  }, [beat.sora_prompt.text]);

  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle2,
          borderColor: 'border-green-500/50',
          bgGradient: 'from-green-500/10 via-green-500/5 to-transparent',
          iconColor: 'text-green-500',
          badgeColor: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
          label: 'Completed',
        };
      case 'generating':
        return {
          icon: Loader2,
          borderColor: 'border-yellow-500/50',
          bgGradient: 'from-yellow-500/10 via-yellow-500/5 to-transparent',
          iconColor: 'text-yellow-500',
          badgeColor: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
          label: 'Generating',
          animate: true,
        };
      case 'locked':
        return {
          icon: Lock,
          borderColor: 'border-gray-400/30',
          bgGradient: 'from-gray-500/5 via-gray-500/3 to-transparent',
          iconColor: 'text-gray-400',
          badgeColor: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
          label: 'Locked',
        };
      case 'failed':
        return {
          icon: Clock,
          borderColor: 'border-red-500/50',
          bgGradient: 'from-red-500/10 via-red-500/5 to-transparent',
          iconColor: 'text-red-500',
          badgeColor: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
          label: 'Failed',
        };
      case 'pending':
      default:
        return {
          icon: Sparkles,
          borderColor: 'border-blue-500/50',
          bgGradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
          iconColor: 'text-blue-500',
          badgeColor: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
          label: 'Ready',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedPrompt);
      setCopied(true);
      toast({
        title: "Copied",
        description: "Prompt copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy prompt",
        variant: "destructive",
      });
    }
  };

  const handleApply = async () => {
    if (!onPromptUpdate) return;
    
    if (editedPrompt.trim() === beat.sora_prompt.text.trim()) {
      setPromptModalOpen(false);
      return;
    }

    setIsSaving(true);
    try {
      await onPromptUpdate(beat.beatId, editedPrompt);
      toast({
        title: "Prompt Updated",
        description: "The prompt has been successfully updated",
      });
      setPromptModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update prompt",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedPrompt(beat.sora_prompt.text);
    setPromptModalOpen(false);
  };

  // Prompt summary (first 200-300 characters) - always use the actual beat prompt
  const promptSummary = beat.sora_prompt.text.substring(0, 250);
  const hasMorePrompt = beat.sora_prompt.text.length > 250;

  return (
    <>
      <Card
        className={cn(
          "shrink-0 w-80 overflow-visible bg-white/[0.02] border-white/[0.06]",
          "transition-all duration-300",
          isSelected && "ring-2 ring-cyan-500/50 ring-offset-2",
          status === 'locked' && "opacity-60"
        )}
        onClick={onSelect}
      >
        {/* Hero Image Placeholder */}
        <div className="aspect-video bg-black/30 relative group rounded-t-lg overflow-hidden">
          {heroImageUrl ? (
            <img
              src={heroImageUrl}
              alt="Hero product image"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 gap-2">
              <ImageIcon className="h-12 w-12 text-white/30" />
              <p className="text-xs text-white/50">Hero Image</p>
            </div>
          )}
          
          {/* Beat Number Badge */}
          <div className="absolute top-2 left-2 flex items-center gap-2">
            <Badge variant="outline" className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border-cyan-500/50 text-xs px-2">
              #{beat.beatId.replace('beat', '')}
            </Badge>
            {beat.isConnectedToPrevious && (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md">
                <Link2 className="h-3 w-3" />
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium px-2 py-1 border",
                config.badgeColor,
                config.animate && "animate-pulse"
              )}
            >
              <Icon className={cn(
                "mr-1 h-3 w-3",
                config.animate && "animate-spin"
              )} />
              {config.label}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Beat Name */}
          <div className="mb-3">
            <h3 className="font-semibold text-sm text-white mb-1">{beat.beatName}</h3>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Clock className="h-3 w-3" />
              <span>{beat.total_duration}s</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "prompt" | "audio")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1 rounded-lg">
              <TabsTrigger 
                value="prompt" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/30 data-[state=active]:to-teal-500/30 data-[state=active]:text-white text-xs"
              >
                <FileText className="h-3 w-3 mr-1.5" />
                Prompt
              </TabsTrigger>
              <TabsTrigger 
                value="audio" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/30 data-[state=active]:to-teal-500/30 data-[state=active]:text-white text-xs"
              >
                <Music className="h-3 w-3 mr-1.5" />
                Audio
              </TabsTrigger>
            </TabsList>

            {/* Prompt Tab */}
            <TabsContent value="prompt" className="mt-3 space-y-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 overflow-hidden">
                <p className="text-xs text-white/70 leading-relaxed break-words overflow-wrap-anywhere">
                  {promptSummary}
                  {hasMorePrompt && '...'}
                </p>
              </div>
              {hasMorePrompt && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPromptModalOpen(true);
                  }}
                  className="w-full h-8 text-xs bg-white/5 border-white/10 hover:bg-cyan-500/20 hover:border-cyan-500/30"
                >
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  View Full Prompt
                </Button>
              )}
            </TabsContent>

            {/* Audio Tab */}
            <TabsContent value="audio" className="mt-3 space-y-3">
              {beat.audio_guidance ? (
                <>
                  {/* Sound Effects */}
                  {beat.audio_guidance.sound_effects && (
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🔊</span>
                        <p className="text-xs font-semibold text-white">Sound Effects</p>
                      </div>
                      <p className="text-xs text-white/70 mb-1">
                        <span className="text-white/50">Preset:</span> {beat.audio_guidance.sound_effects.preset}
                      </p>
                      {beat.audio_guidance.sound_effects.timing_sync && beat.audio_guidance.sound_effects.timing_sync.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {beat.audio_guidance.sound_effects.timing_sync.slice(0, 2).map((sync, idx) => (
                            <div key={idx} className="text-[10px] text-white/60">
                              <span className="font-mono">{sync.timestamp.toFixed(1)}s</span>: {sync.description}
                            </div>
                          ))}
                          {beat.audio_guidance.sound_effects.timing_sync.length > 2 && (
                            <p className="text-[10px] text-white/50">
                              +{beat.audio_guidance.sound_effects.timing_sync.length - 2} more
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Music */}
                  {beat.audio_guidance.music && (
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🎶</span>
                        <p className="text-xs font-semibold text-white">Music</p>
                      </div>
                      <p className="text-xs text-white/70 mb-1">
                        <span className="text-white/50">Preset:</span> {beat.audio_guidance.music.preset}
                      </p>
                      {beat.audio_guidance.music.mood && (
                        <p className="text-xs text-white/70 mb-1">
                          <span className="text-white/50">Mood:</span> {beat.audio_guidance.music.mood}
                        </p>
                      )}
                      {beat.audio_guidance.music.energy_level && (
                        <p className="text-xs text-white/70">
                          <span className="text-white/50">Energy:</span> {beat.audio_guidance.music.energy_level}
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                  <p className="text-xs text-white/50">No audio guidance available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Editable Full Prompt Modal */}
      <Dialog open={promptModalOpen} onOpenChange={(open) => {
        if (!open) {
          handleCancel();
        } else {
          setPromptModalOpen(true);
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] bg-[#0a0a0a] border-white/10 shadow-2xl">
          <DialogHeader className="pb-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 via-cyan-500/15 to-teal-500/10">
                  <FileText className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">
                    Edit Sora Prompt
                  </DialogTitle>
                  <p className="text-xs text-white/50 mt-1">
                    {beat.beatName} • {editedPrompt.length.toLocaleString()} characters
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-9 bg-white/5 border-white/10 hover:bg-cyan-500/20 hover:border-cyan-500/30"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="mt-4">
            <ScrollArea className="h-[calc(90vh-200px)]">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2 block">
                    Prompt Text
                  </label>
                  <Textarea
                    value={editedPrompt}
                    onChange={(e) => setEditedPrompt(e.target.value)}
                    className="min-h-[500px] font-mono text-sm bg-white/[0.02] border-white/10 text-white/90 focus:border-cyan-500/50 focus:ring-cyan-500/20 resize-none"
                    placeholder="Enter your Sora prompt here..."
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-4 py-2">
                  <div className="flex items-center gap-4 text-xs text-white/50">
                    <span>{editedPrompt.length.toLocaleString()} characters</span>
                    <span>•</span>
                    <span>{editedPrompt.split('\n').length} lines</span>
                    <span>•</span>
                    <span>{editedPrompt.split(' ').filter(w => w.length > 0).length} words</span>
                  </div>
                  {editedPrompt !== beat.sora_prompt.text && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                      Unsaved changes
                    </Badge>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="bg-white/5 border-white/10 hover:bg-white/10"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                disabled={isSaving || editedPrompt.trim() === beat.sora_prompt.text.trim()}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Apply Changes
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

