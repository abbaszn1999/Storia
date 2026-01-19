import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause,
  Zap,
  CheckCircle2, 
  Loader2, 
  Lock, 
  Clock,
  Sparkles,
  FileText,
  Music2,
  Volume2,
  ExternalLink,
  RotateCcw,
  Save,
  X,
  Copy,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { BeatPrompt } from "@/types/commerce";
import type { BeatStatus } from "@/types/commerce";

interface BeatCardPremiumProps {
  beat: BeatPrompt;
  beatIndex: number; // 1, 2, or 3
  totalBeats: number;
  status: BeatStatus;
  heroImageUrl?: string;
  isSelected: boolean;
  onSelect: () => void;
  onGenerate?: () => void;
  onPromptUpdate?: (beatId: string, newPrompt: string) => Promise<void>;
  videoUrl?: string;
}

// Audio waveform visualization component
function AudioWaveform({ isPlaying, mood }: { isPlaying: boolean; mood?: string }) {
  const bars = 16;
  return (
    <div className="flex items-end justify-center gap-[3px] h-12">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            "w-1.5 rounded-full",
            mood === 'energetic' ? 'bg-gradient-to-t from-emerald-500 to-teal-400' :
            mood === 'calm' ? 'bg-gradient-to-t from-emerald-600 to-teal-500' :
            'bg-gradient-to-t from-emerald-500 to-teal-400'
          )}
          initial={{ height: 6 }}
          animate={isPlaying ? {
            height: [6, 20 + Math.random() * 20, 10, 30 + Math.random() * 10, 6],
          } : { height: 6 + (i % 4) * 6 }}
          transition={isPlaying ? {
            duration: 0.5 + Math.random() * 0.3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.05,
          } : { duration: 0.3 }}
        />
      ))}
    </div>
  );
}

// Status indicator with glow effect
function StatusIndicator({ status }: { status: BeatStatus }) {
  const config = {
    completed: { color: 'bg-emerald-500', glow: 'shadow-emerald-500/50', label: 'Ready' },
    generating: { color: 'bg-emerald-500', glow: 'shadow-emerald-500/50', label: 'Creating...' },
    pending: { color: 'bg-teal-500', glow: 'shadow-teal-500/50', label: 'Waiting' },
    locked: { color: 'bg-zinc-600', glow: '', label: 'Locked' },
    failed: { color: 'bg-red-500', glow: 'shadow-red-500/50', label: 'Failed' },
  };
  
  const { color, glow, label } = config[status] || config.pending;
  
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-2.5 h-2.5 rounded-full shadow-lg",
        color, glow,
        status === 'generating' && 'animate-pulse'
      )} />
      <span className={cn(
        "text-[11px] font-semibold uppercase tracking-wider",
        status === 'locked' ? 'text-zinc-500' : 'text-white/80'
      )}>
        {label}
      </span>
    </div>
  );
}

export function BeatCardPremium({
  beat,
  beatIndex,
  totalBeats,
  status,
  heroImageUrl,
  isSelected,
  onSelect,
  onGenerate,
  onPromptUpdate,
  videoUrl,
}: BeatCardPremiumProps) {
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(beat.sora_prompt.text);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'audio'>('prompt');
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const isLocked = status === 'locked';
  const isGenerating = status === 'generating';
  const isCompleted = status === 'completed';
  const hasVideo = isCompleted && videoUrl;

  // Update edited prompt when beat changes
  useEffect(() => {
    setEditedPrompt(beat.sora_prompt.text);
  }, [beat.sora_prompt.text]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedPrompt);
      setCopied(true);
      toast({ title: "Copied", description: "Prompt copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Error", description: "Failed to copy", variant: "destructive" });
    }
  };

  const handleSavePrompt = async () => {
    if (!onPromptUpdate || editedPrompt.trim() === beat.sora_prompt.text.trim()) {
      setShowPromptModal(false);
      return;
    }
    setIsSaving(true);
    try {
      await onPromptUpdate(beat.beatId, editedPrompt);
      toast({ title: "Saved", description: "Prompt updated successfully" });
      setShowPromptModal(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateOrRegenerate = () => {
    if (onGenerate) {
      onGenerate();
    }
  };

  // Gradient based on beat index
  const gradients = [
    'from-emerald-600/20 via-teal-600/10 to-transparent',
    'from-teal-600/20 via-emerald-600/10 to-transparent', 
    'from-emerald-500/20 via-teal-500/10 to-transparent',
  ];
  
  const borderGradients = [
    'from-emerald-500/50 via-teal-500/30 to-emerald-500/10',
    'from-teal-500/50 via-emerald-500/30 to-teal-500/10',
    'from-emerald-400/50 via-teal-400/30 to-emerald-400/10',
  ];

  const accentColors = [
    { primary: 'text-emerald-400', secondary: 'text-teal-400', bg: 'bg-emerald-500' },
    { primary: 'text-teal-400', secondary: 'text-emerald-400', bg: 'bg-teal-500' },
    { primary: 'text-emerald-300', secondary: 'text-teal-300', bg: 'bg-emerald-500' },
  ];

  const gradient = gradients[(beatIndex - 1) % 3];
  const borderGradient = borderGradients[(beatIndex - 1) % 3];
  const accent = accentColors[(beatIndex - 1) % 3];

  // Prompt preview (first 300 characters)
  const promptPreview = beat.sora_prompt.text.substring(0, 300);
  const hasMorePrompt = beat.sora_prompt.text.length > 300;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: beatIndex * 0.1 }}
        className={cn(
          "relative group cursor-pointer",
          isLocked && "pointer-events-none"
        )}
        onClick={onSelect}
      >
        {/* Card Container with animated border */}
        <div className={cn(
          "relative rounded-2xl overflow-hidden",
          "bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-zinc-950/90",
          "backdrop-blur-xl",
          "transition-all duration-500",
          isSelected && !isLocked && "ring-2 ring-white/30 ring-offset-2 ring-offset-black",
          isLocked && "opacity-50 grayscale-[30%]"
        )}>
          {/* Animated gradient border */}
          <div className={cn(
            "absolute inset-0 rounded-2xl p-[1px]",
            "bg-gradient-to-br",
            borderGradient,
            "opacity-60 group-hover:opacity-100 transition-opacity duration-500"
          )}>
            <div className="w-full h-full rounded-2xl bg-zinc-900/95" />
          </div>

          {/* Inner content */}
          <div className="relative z-10">
            {/* Header */}
            <div className={cn(
              "relative px-5 py-5",
              "bg-gradient-to-br",
              gradient
            )}>
              <div className="flex items-center justify-between">
                {/* Beat Number & Name */}
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-xl",
                    "bg-gradient-to-br from-white/15 to-white/5",
                    "border border-white/10",
                    "font-bold text-xl",
                    accent.primary
                  )}>
                    {beatIndex}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">
                      {beat.beatName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3.5 w-3.5 text-white/40" />
                      <span className="text-xs text-white/50">{beat.total_duration}s duration</span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <StatusIndicator status={status} />
              </div>

              {/* Locked Overlay */}
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="text-center">
                    <Lock className="h-10 w-10 text-zinc-500 mx-auto mb-3" />
                    <p className="text-sm text-zinc-400 font-medium">Beat {beatIndex} of {totalBeats}</p>
                    <p className="text-xs text-zinc-500 mt-1">Complete previous beats first</p>
                  </div>
                </div>
              )}
            </div>

            {/* Video Area - with native controls */}
            <div className="relative aspect-video bg-black/50 overflow-hidden">
              {isGenerating ? (
                /* Generating State */
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="relative">
                    {/* Animated rings */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={cn("w-24 h-24 rounded-full border-2 border-t-transparent animate-spin", accent.primary.replace('text-', 'border-'))} />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={cn("w-16 h-16 rounded-full border-2 border-b-transparent animate-spin", accent.secondary.replace('text-', 'border-'))} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                    </div>
                    <div className="relative flex items-center justify-center w-24 h-24">
                      <Sparkles className={cn("h-8 w-8 animate-pulse", accent.primary)} />
                    </div>
                  </div>
                  <p className="mt-5 text-base font-semibold text-white">Creating Magic...</p>
                  <p className="text-xs text-white/50 mt-1">This takes ~7 minutes</p>
                </div>
              ) : hasVideo ? (
                /* Video Player with native controls */
                <>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                    preload="metadata"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {/* Completed Badge */}
                  <div className="absolute top-3 right-3 pointer-events-none">
                    <Badge className="bg-emerald-500/90 text-white border-0 text-xs gap-1.5 py-1 px-2.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Complete
                    </Badge>
                  </div>
                </>
              ) : heroImageUrl ? (
                /* Hero Image Preview */
                <img
                  src={heroImageUrl}
                  alt="Product"
                  className="w-full h-full object-cover opacity-70"
                />
              ) : (
                /* Empty State */
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={cn(
                      "w-20 h-20 rounded-2xl mx-auto mb-4",
                      "bg-gradient-to-br from-white/10 to-white/5",
                      "flex items-center justify-center"
                    )}>
                      <Zap className={cn("h-9 w-9", accent.primary)} />
                    </div>
                    <p className="text-sm text-white/50">Ready to generate</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs - Only Prompt and Audio */}
            <div className="flex border-t border-white/5">
              {[
                { id: 'prompt', icon: FileText, label: 'Prompt' },
                { id: 'audio', icon: Music2, label: 'Audio' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab(tab.id as 'prompt' | 'audio');
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3.5",
                    "text-xs font-semibold transition-all",
                    "border-b-2",
                    activeTab === tab.id 
                      ? cn(
                          "text-white",
                          beatIndex === 1 ? 'border-emerald-500 bg-emerald-500/10' :
                          beatIndex === 2 ? 'border-teal-500 bg-teal-500/10' :
                          'border-emerald-500 bg-emerald-500/10'
                        )
                      : "text-white/50 border-transparent hover:bg-white/5"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'prompt' && !isLocked && (
                <motion.div
                  key="prompt"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-5 space-y-4"
                >
                  {/* Prompt Preview */}
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/70 leading-relaxed font-mono">
                      {promptPreview}
                      {hasMorePrompt && <span className="text-white/40">...</span>}
                    </p>
                  </div>
                  
                  {/* View Full Prompt Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPromptModal(true);
                    }}
                    className={cn(
                      "w-full h-10 text-xs font-medium",
                      "bg-white/5 border-white/10",
                      "hover:bg-white/10 hover:border-white/20"
                    )}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-2" />
                    View & Edit Full Prompt
                  </Button>
                </motion.div>
              )}

              {activeTab === 'audio' && !isLocked && (
                <motion.div
                  key="audio"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-5"
                >
                  {beat.audio_guidance ? (
                    <div className="space-y-4">
                      {/* Audio Info Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            "bg-gradient-to-br from-white/10 to-white/5"
                          )}>
                            <Volume2 className={cn("h-5 w-5", accent.primary)} />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-white block">
                              {beat.audio_guidance.music?.preset || 'Audio Track'}
                            </span>
                            <span className="text-xs text-white/50">
                              {beat.audio_guidance.music?.energy_level || 'Dynamic'} energy
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs border-white/20 text-white/70 px-3 py-1">
                          {beat.audio_guidance.music?.mood || 'Dynamic'}
                        </Badge>
                      </div>
                      
                      {/* Waveform */}
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <AudioWaveform isPlaying={false} mood={beat.audio_guidance.music?.mood} />
                      </div>
                      
                      {/* Sound Effects */}
                      {beat.audio_guidance.sound_effects?.timing_sync && beat.audio_guidance.sound_effects.timing_sync.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-white/50 font-medium uppercase tracking-wider">Sound Effects</p>
                          <div className="flex flex-wrap gap-2">
                            {beat.audio_guidance.sound_effects.timing_sync.slice(0, 4).map((sync, i) => (
                              <span key={i} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/60 border border-white/10">
                                <span className="font-mono text-white/40">{sync.timestamp}s</span> {sync.description.substring(0, 25)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className={cn(
                        "w-16 h-16 rounded-2xl mx-auto mb-4",
                        "bg-gradient-to-br from-white/10 to-white/5",
                        "flex items-center justify-center"
                      )}>
                        <Music2 className="h-8 w-8 text-white/30" />
                      </div>
                      <p className="text-sm text-white/50 font-medium">Audio will be generated</p>
                      <p className="text-xs text-white/30 mt-1">with the video</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Button */}
            {!isLocked && (
              <div className="p-5 pt-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateOrRegenerate();
                  }}
                  disabled={isGenerating}
                  className={cn(
                    "w-full py-3.5 rounded-xl font-semibold text-sm",
                    "flex items-center justify-center gap-2",
                    "transition-all duration-300",
                    isGenerating ? "bg-white/10 text-white/50 cursor-not-allowed" :
                    isCompleted ? 
                      "bg-gradient-to-r from-teal-500/20 to-emerald-500/20 text-teal-300 border border-teal-500/30 hover:from-teal-500/30 hover:to-emerald-500/30" :
                      cn(
                        "bg-gradient-to-r text-white border border-white/10",
                        beatIndex === 1 ? "from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500" :
                        beatIndex === 2 ? "from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500" :
                        "from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                      )
                  )}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : isCompleted ? (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      Regenerate Beat
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Generate Beat
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Full Prompt Modal */}
      <Dialog open={showPromptModal} onOpenChange={(open) => {
        if (!open) {
          setEditedPrompt(beat.sora_prompt.text);
        }
        setShowPromptModal(open);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-zinc-950 border-white/10">
          <DialogHeader className="border-b border-white/10 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  "bg-gradient-to-br",
                  gradient
                )}>
                  <FileText className={cn("h-6 w-6", accent.primary)} />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">
                    {beat.beatName} - Prompt
                  </DialogTitle>
                  <p className="text-xs text-white/50 mt-1">
                    Beat {beatIndex} • {editedPrompt.length.toLocaleString()} characters
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="bg-white/5 border-white/10 hover:bg-white/10"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="h-[60vh] mt-4">
            <Textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              className="min-h-[500px] font-mono text-sm bg-white/5 border-white/10 text-white/90 focus:border-emerald-500/50 resize-none"
              placeholder="Enter prompt..."
            />
          </ScrollArea>

          <DialogFooter className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setEditedPrompt(beat.sora_prompt.text);
                  setShowPromptModal(false);
                }}
                className="bg-white/5 border-white/10"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSavePrompt}
                disabled={isSaving || editedPrompt.trim() === beat.sora_prompt.text.trim()}
                className={cn(
                  "bg-gradient-to-r text-white",
                  beatIndex === 1 ? "from-violet-600 to-fuchsia-600" :
                  beatIndex === 2 ? "from-cyan-600 to-blue-600" :
                  "from-emerald-600 to-teal-600"
                )}
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
