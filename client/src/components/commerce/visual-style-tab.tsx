import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Lightbulb,
  Sparkles,
  Loader2,
  Zap,
  CheckCircle2,
  Film,
  Target,
  Image as ImageIcon,
  Palette,
  Camera,
  Wand2,
  Star,
  ShoppingCart,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

interface VisualStyleTabProps {
  workspaceId: string;
  videoId?: string;
  visualPreset: string;
  campaignSpark: string;
  visualBeats: {
    beat1: string;
    beat2: string;
    beat3: string;
  };
  campaignObjective: string;
  ctaText: string;
  onVisualPresetChange: (preset: string) => void;
  onCampaignSparkChange: (spark: string) => void;
  onVisualBeatsChange: (beats: { beat1: string; beat2: string; beat3: string }) => void;
  onCampaignObjectiveChange: (objective: string) => void;
  onCtaTextChange: (cta: string) => void;
  onNext: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const VISUAL_PRESETS = [
  { id: "photorealistic", label: "Photorealistic", description: "Lifelike rendering", icon: Camera },
  { id: "cinematic", label: "Cinematic", description: "Film-quality look", icon: Film },
  { id: "anime", label: "Anime/Stylized", description: "Bold artistic style", icon: Sparkles },
  { id: "cyberpunk", label: "Cyberpunk", description: "Neon futuristic", icon: Zap },
  { id: "minimalist", label: "Minimalist", description: "Clean Apple-style", icon: Palette },
];

const OBJECTIVES = [
  { id: "awareness", label: "Brand Awareness", icon: Megaphone, color: "from-blue-500 to-cyan-500" },
  { id: "showcase", label: "Feature Showcase", icon: Star, color: "from-amber-500 to-orange-500" },
  { id: "sales", label: "Sales/CTA", icon: ShoppingCart, color: "from-emerald-500 to-green-500" },
];

// ═══════════════════════════════════════════════════════════════════════════
// GLASS PANEL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

function GlassPanel({ children, className, glowColor = "purple" }: GlassPanelProps) {
  return (
    <motion.div
      className={cn(
        "relative rounded-2xl border overflow-hidden",
        "bg-card/60 dark:bg-white/[0.02] backdrop-blur-xl",
        "border-[#e5e7eb] dark:border-white/[0.06]",
        "shadow-sm hover:shadow-md transition-shadow duration-300",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION HEADER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function SectionHeader({ 
  icon: Icon, 
  title, 
  description,
  iconColor = "text-amber-500",
  badge,
}: { 
  icon: React.ElementType; 
  title: string; 
  description?: string;
  iconColor?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-xl",
          iconColor === "text-amber-500" && "bg-amber-500/10 dark:bg-amber-500/20",
          iconColor === "text-pink-500" && "bg-emerald-500/10 dark:bg-emerald-500/20",
          iconColor === "text-orange-500" && "bg-emerald-500/10 dark:bg-emerald-500/20",
          iconColor === "text-purple-500" && "bg-emerald-500/10 dark:bg-emerald-500/20",
        )}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      {badge}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function VisualStyleTab({
  workspaceId,
  videoId,
  visualPreset,
  campaignSpark,
  visualBeats,
  campaignObjective,
  ctaText,
  onVisualPresetChange,
  onCampaignSparkChange,
  onVisualBeatsChange,
  onCampaignObjectiveChange,
  onCtaTextChange,
}: VisualStyleTabProps) {
  const { toast } = useToast();
  const [beatsGenerated, setBeatsGenerated] = useState(false);
  const [isGeneratingSpark, setIsGeneratingSpark] = useState(false);
  const [isGeneratingBeats, setIsGeneratingBeats] = useState(false);
  
  // Store full beat data for dynamic display
  const [generatedBeatsData, setGeneratedBeatsData] = useState<Array<{
    beatId: string;
    beatName: string;
    beatDescription: string;
    duration: number;
  }>>([]);

  // Restore generatedBeatsData from video data when component mounts
  useEffect(() => {
    const restoreBeatsData = async () => {
      const hasVisualBeats = visualBeats?.beat1 || visualBeats?.beat2 || visualBeats?.beat3;
      const hasRequiredFields = visualPreset && campaignSpark && campaignSpark.trim().length >= 10 && campaignObjective;
      
      if (generatedBeatsData.length === 0 && videoId && videoId !== 'new') {
        if (hasVisualBeats || hasRequiredFields) {
          try {
            const response = await fetch(`/api/videos/${videoId}`, {
              credentials: 'include',
            });
            if (response.ok) {
              const video = await response.json();
              const step2Data = video.step2Data;
              const step3Data = video.step3Data;
              const narrative = step2Data?.narrative || step3Data?.narrative;
              
              if (narrative?.visual_beats && Array.isArray(narrative.visual_beats)) {
                setGeneratedBeatsData(narrative.visual_beats);
                setBeatsGenerated(true);
                
                if (!hasVisualBeats) {
                  const restoredBeats = {
                    beat1: narrative.visual_beats.find((b: any) => b.beatId === 'beat1')?.beatDescription || '',
                    beat2: narrative.visual_beats.find((b: any) => b.beatId === 'beat2')?.beatDescription || '',
                    beat3: narrative.visual_beats.find((b: any) => b.beatId === 'beat3')?.beatDescription || '',
                  };
                  onVisualBeatsChange(restoredBeats);
                }
              }
            }
          } catch (error) {
            console.error('[VisualStyleTab] Failed to restore beats data:', error);
          }
        }
      }
    };

    restoreBeatsData();
  }, [videoId, visualBeats, generatedBeatsData.length, visualPreset, campaignSpark, campaignObjective, onVisualBeatsChange]);

  // Validation states
  const isStyleDefined = visualPreset !== "";
  const isStoryReady = (campaignSpark || "").trim().length >= 10;
  const beatsFilledCount = generatedBeatsData.length > 0
    ? generatedBeatsData.filter(b => {
        const beatKey = b.beatId as keyof typeof visualBeats;
        return visualBeats?.[beatKey]?.trim().length > 0;
      }).length
    : visualBeats 
      ? [visualBeats.beat1, visualBeats.beat2, visualBeats.beat3].filter(b => b?.trim().length > 0).length
      : 0;

  // Handlers
  const handleGenerateBeats = async () => {
    if (!videoId) {
      toast({ title: "Error", description: "Video ID is required for generating beats", variant: "destructive" });
      return;
    }

    if (!campaignSpark || campaignSpark.trim().length < 10) {
      toast({ title: "Error", description: "Creative Spark is required. Please fill in the Creative Spark field first.", variant: "destructive" });
      return;
    }

    setIsGeneratingBeats(true);
    try {
      const response = await fetch(`/api/social-commerce/step/2/generate-beats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: videoId,
          campaignSpark,
          campaignObjective: campaignObjective || 'awareness',
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || responseData.details || 'Failed to generate visual beats');
      }

      if (!responseData.visual_beats || !Array.isArray(responseData.visual_beats)) {
        throw new Error('Invalid response from server: missing visual_beats');
      }

      const visualBeatsResult = responseData.visual_beats;
      setGeneratedBeatsData(visualBeatsResult);

      const generatedBeats = {
        beat1: visualBeatsResult.find((b: any) => b.beatId === 'beat1')?.beatDescription || '',
        beat2: visualBeatsResult.find((b: any) => b.beatId === 'beat2')?.beatDescription || '',
        beat3: visualBeatsResult.find((b: any) => b.beatId === 'beat3')?.beatDescription || '',
      };

      onVisualBeatsChange(generatedBeats);
      setBeatsGenerated(true);
      window.dispatchEvent(new CustomEvent('beatsGenerated'));
      
      toast({
        title: "Visual Beats Generated",
        description: `AI has generated ${visualBeatsResult.length} visual beat(s) for your campaign`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate visual beats",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBeats(false);
    }
  };

  const handleGenerateCreativeSpark = async () => {
    if (!videoId) {
      toast({ title: "Error", description: "Video ID is required for AI Recommend", variant: "destructive" });
      return;
    }

    setIsGeneratingSpark(true);
    try {
      const response = await fetch(`/api/social-commerce/videos/${videoId}/creative-spark/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || responseData.details || 'Failed to generate creative spark');
      }

      if (!responseData.creative_spark) {
        throw new Error('Invalid response from server: missing creative_spark field');
      }

      onCampaignSparkChange(responseData.creative_spark);
      
      toast({
        title: "Creative Spark Generated",
        description: "AI has generated a creative spark for your campaign.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate creative spark",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSpark(false);
    }
  };

  return (
    <motion.div 
      className="flex flex-col h-[calc(100vh-12rem)] overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TWO-ZONE MAIN CONTENT */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 grid grid-cols-2 gap-6 p-6 overflow-hidden">
        
        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ZONE A: ATMOSPHERE & STYLE */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div className="h-full m-4 rounded-2xl bg-card/80 dark:bg-black/40 backdrop-blur-xl border border-[#e5e7eb] dark:border-white/[0.08] overflow-hidden">
          <ScrollArea className="h-full pr-3">
          <div className="space-y-5 pb-6">
            
            {/* Zone Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-[#e5e7eb] dark:border-white/[0.08] rounded-t-2xl pt-4 px-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground uppercase tracking-wider">
                  Atmosphere & Style
                </h2>
                <p className="text-xs text-muted-foreground">Define your visual aesthetic</p>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* VISUAL STYLE CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <GlassPanel className="p-5">
              <SectionHeader
                icon={ImageIcon}
                title="Visual Style"
                description="Choose preset or upload reference"
                iconColor="text-emerald-500"
                badge={
                  <Badge variant="outline" className={cn(
                    "text-[10px] px-2 py-0.5",
                    visualPreset 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                      : "bg-muted/50 border-[#e5e7eb] dark:border-white/[0.1] text-muted-foreground"
                  )}>
                    {visualPreset ? VISUAL_PRESETS.find(p => p.id === visualPreset)?.label || "Selected" : "None"}
                  </Badge>
                }
              />

              {/* Preset Grid */}
              <div className="grid grid-cols-2 gap-3">
                {VISUAL_PRESETS.map((preset, index) => {
                  const Icon = preset.icon;
                  const isSelected = visualPreset === preset.id;
                  return (
                    <motion.button
                      key={preset.id}
                      onClick={() => onVisualPresetChange(preset.id)}
                      className={cn(
                        "relative p-4 rounded-xl border transition-all text-left group overflow-hidden",
                        isSelected
                          ? "bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/40 dark:border-emerald-500/30 shadow-md shadow-emerald-500/10"
                          : "bg-muted/30 dark:bg-white/[0.02] border-[#e5e7eb] dark:border-white/[0.06] hover:border-emerald-500/30 hover:bg-muted/50 dark:hover:bg-white/[0.04]"
                      )}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Glow effect on hover */}
                      <div className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                        "bg-gradient-to-br from-emerald-500/5 to-teal-500/5"
                      )} />
                      
                      <div className="relative z-10">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors",
                          isSelected 
                            ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30" 
                            : "bg-muted dark:bg-white/[0.05] group-hover:bg-emerald-500/20"
                        )}>
                          <Icon className={cn(
                            "w-5 h-5 transition-colors",
                            isSelected ? "text-white" : "text-muted-foreground group-hover:text-emerald-500"
                          )} />
                        </div>
                        <p className={cn(
                          "text-sm font-semibold mb-0.5 transition-colors",
                          isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                        )}>
                          {preset.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{preset.description}</p>
                      </div>
                      
                      {/* Selection indicator */}
                      {isSelected && (
                        <motion.div 
                          className="absolute top-2 right-2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </GlassPanel>

          </div>
        </ScrollArea>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ZONE B: NARRATIVE STUDIO */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div className="h-full m-4 rounded-2xl bg-card/80 dark:bg-black/40 backdrop-blur-xl border border-[#e5e7eb] dark:border-white/[0.08] overflow-hidden">
          <ScrollArea className="h-full pl-3">
          <div className="space-y-5 pb-6">
            
            {/* Zone Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-[#e5e7eb] dark:border-white/[0.08] rounded-t-2xl pt-4 px-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground uppercase tracking-wider">
                  Narrative Studio
                </h2>
                <p className="text-xs text-muted-foreground">Craft your story direction</p>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* CAMPAIGN DIRECTION CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <GlassPanel className="p-5">
              <SectionHeader
                icon={Target}
                title="Campaign Direction"
                description="Define objective and creative spark"
                iconColor="text-emerald-500"
              />

              {/* Objective Toggles */}
              <div className="space-y-3 mb-5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Objective</Label>
                <div className="grid grid-cols-3 gap-3">
                  {OBJECTIVES.map((objective, index) => {
                    const Icon = objective.icon;
                    const isSelected = campaignObjective === objective.id;
                    return (
                      <motion.button
                        key={objective.id}
                        onClick={() => {
                          const newObjective = campaignObjective === objective.id ? '' : objective.id;
                          onCampaignObjectiveChange(newObjective);
                        }}
                        className={cn(
                          "relative p-4 rounded-xl border transition-all text-center group overflow-hidden",
                          isSelected
                            ? `bg-gradient-to-br ${objective.color} bg-opacity-10 border-transparent shadow-md`
                            : "bg-muted/30 dark:bg-white/[0.02] border-[#e5e7eb] dark:border-white/[0.06] hover:border-emerald-500/30"
                        )}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-all",
                          isSelected
                            ? `bg-gradient-to-br ${objective.color} shadow-lg`
                            : "bg-muted dark:bg-white/[0.05] group-hover:bg-emerald-500/20"
                        )}>
                          <Icon className={cn(
                            "w-6 h-6 transition-colors",
                            isSelected ? "text-white" : "text-muted-foreground group-hover:text-emerald-500"
                          )} />
                        </div>
                        <p className={cn(
                          "text-xs font-semibold transition-colors",
                          isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}>
                          {objective.label}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Campaign Spark */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Creative Spark</Label>
                  {videoId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateCreativeSpark}
                      disabled={isGeneratingSpark}
                      className="h-7 px-3 text-[10px] border-emerald-500/40 hover:border-emerald-500/60 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    >
                      {isGeneratingSpark ? (
                        <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Generating...</>
                      ) : (
                        <><Sparkles className="mr-1.5 h-3 w-3" />AI Recommend</>
                      )}
                    </Button>
                  )}
                </div>
                <Textarea
                  value={campaignSpark}
                  onChange={(e) => onCampaignSparkChange(e.target.value)}
                  placeholder="e.g., The shoe hatches from a dragon egg in a dark cave"
                  className={cn(
                    "min-h-[100px] resize-none bg-muted/30 dark:bg-white/[0.02] border border-[#e5e7eb] dark:border-white/[0.06]",
                    "text-foreground placeholder:text-muted-foreground/50 text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                  )}
                  maxLength={500}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{campaignSpark.length}/500</span>
                  {isStoryReady ? (
                    <span className="text-[10px] text-green-500 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Valid
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-500 font-medium">Min 10 chars</span>
                  )}
                </div>
              </div>
            </GlassPanel>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* STORY BEATS CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <GlassPanel className="p-5">
              <SectionHeader
                icon={Sparkles}
                title="Story Beats"
                description="Structure your narrative flow"
                iconColor="text-emerald-500"
                badge={beatsGenerated ? (
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    {beatsFilledCount}/{generatedBeatsData.length || 3} filled
                  </Badge>
                ) : null}
              />

              {/* Generate Button */}
              {!beatsGenerated && (
                <Button
                  onClick={handleGenerateBeats}
                  disabled={!isStoryReady || isGeneratingBeats}
                  className={cn(
                    "w-full h-12 font-semibold relative overflow-hidden rounded-xl",
                    isStoryReady && !isGeneratingBeats
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                      : "bg-muted dark:bg-white/[0.05] text-muted-foreground cursor-not-allowed"
                  )}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isGeneratingBeats ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Generating Beats...</>
                    ) : (
                      <><Zap className="w-4 h-4" />Generate Visual Beats</>
                    )}
                  </span>
                  {isStoryReady && !isGeneratingBeats && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </Button>
              )}

              {/* Beat Cards - Dynamic based on actual generated beats */}
              <AnimatePresence>
                {generatedBeatsData.length > 0 && (
                  <div className="space-y-3 mt-4">
                    {generatedBeatsData.map((beat, index) => {
                      const BEAT_DURATION = 12;
                      const startTime = index * BEAT_DURATION;
                      const endTime = (index + 1) * BEAT_DURATION;
                      const timeRange = `${startTime}-${endTime}s`;
                      
                      const beatKey = beat.beatId as keyof typeof visualBeats;
                      const currentDescription = visualBeats?.[beatKey] || beat.beatDescription;
                      
                      return (
                        <motion.div
                          key={beat.beatId}
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="p-4 rounded-xl bg-muted/30 dark:bg-white/[0.02] border border-[#e5e7eb] dark:border-white/[0.06] hover:border-emerald-500/30 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-emerald-500/30">
                                {index + 1}
                              </div>
                              <p className="text-sm font-semibold text-foreground">{beat.beatName}</p>
                            </div>
                            <Badge variant="outline" className="text-[9px] px-2 py-0.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                              {timeRange}
                            </Badge>
                          </div>
                          
                          <Textarea
                            value={currentDescription}
                            onChange={(e) => {
                              const updated = { ...(visualBeats || { beat1: '', beat2: '', beat3: '' }) };
                              updated[beatKey] = e.target.value;
                              onVisualBeatsChange(updated);
                              
                              setGeneratedBeatsData(prev => prev.map(b => 
                                b.beatId === beat.beatId 
                                  ? { ...b, beatDescription: e.target.value }
                                  : b
                              ));
                            }}
                            placeholder={`Describe ${beat.beatName.toLowerCase()}...`}
                            className={cn(
                              "bg-muted/20 dark:bg-white/[0.02] border-[#e5e7eb] dark:border-white/[0.06] text-foreground min-h-[70px] resize-none text-sm",
                              "focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                            )}
                            maxLength={200}
                          />
                          
                          {/* CTA Text for last beat */}
                          {index === generatedBeatsData.length - 1 && (
                            <div className="mt-3 pt-3 border-t border-[#e5e7eb] dark:border-white/[0.06]">
                              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">CTA Text</Label>
                              <Input
                                value={ctaText}
                                onChange={(e) => onCtaTextChange(e.target.value)}
                                placeholder="e.g., SHOP NOW at www.website.com"
                                className="h-9 bg-muted/20 dark:bg-white/[0.02] border-[#e5e7eb] dark:border-white/[0.06] text-foreground text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50"
                                maxLength={100}
                              />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}

                    {/* Regenerate Button */}
                    <Button
                      onClick={handleGenerateBeats}
                      disabled={isGeneratingBeats}
                      variant="outline"
                      className="w-full h-10 border-[#e5e7eb] dark:border-white/[0.08] hover:bg-muted dark:hover:bg-white/[0.04] hover:border-emerald-500/30"
                    >
                      {isGeneratingBeats ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Regenerating...</>
                      ) : (
                        <><Wand2 className="w-4 h-4 mr-2" />Regenerate Beats</>
                      )}
                    </Button>
                  </div>
                )}
              </AnimatePresence>
            </GlassPanel>

          </div>
        </ScrollArea>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* COMPACT VALIDATION FOOTER */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-[#e5e7eb] dark:border-white/[0.08] bg-card/50 dark:bg-white/[0.02]">
        <div className="flex items-center justify-between">
          
          {/* Validation Checkmarks */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              {isStyleDefined ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
              )}
              <span className={cn(
                "text-xs font-medium",
                isStyleDefined ? "text-foreground" : "text-muted-foreground"
              )}>
                Style Defined
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isStoryReady ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
              )}
              <span className={cn(
                "text-xs font-medium",
                isStoryReady ? "text-foreground" : "text-muted-foreground"
              )}>
                Story Ready
              </span>
            </div>
          </div>

          {/* Right side: beats count */}
          <div className="flex items-center gap-4">
            {beatsGenerated && (
              <span className="text-xs text-muted-foreground">
                {beatsFilledCount}/{generatedBeatsData.length || 3} beats filled
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
