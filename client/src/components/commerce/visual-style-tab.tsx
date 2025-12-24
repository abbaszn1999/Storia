import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { 
  Lightbulb,
  Sparkles,
  Upload,
  X,
  Loader2,
  Zap,
  CheckCircle2,
  Eye,
  Palette,
  Film,
  Target,
  Wind,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/assets/uploads/routes";

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

interface VisualStyleTabProps {
  workspaceId: string;
  videoId?: string;
  environmentConcept: string;
  cinematicLighting: string;
  atmosphericDensity: number;
  styleReferenceUrl: string | null;
  visualPreset: string;
  campaignSpark: string;
  visualBeats: {
    beat1: string;
    beat2: string;
    beat3: string;
  };
  brandPrimaryColor: string;
  brandSecondaryColor: string;
  environmentBrandPrimaryColor: string;
  environmentBrandSecondaryColor: string;
  campaignObjective: string;
  ctaText: string;
  onEnvironmentConceptChange: (concept: string) => void;
  onCinematicLightingChange: (lighting: string) => void;
  onAtmosphericDensityChange: (density: number) => void;
  onStyleReferenceUrlChange: (url: string | null) => void;
  onVisualPresetChange: (preset: string) => void;
  onCampaignSparkChange: (spark: string) => void;
  onVisualBeatsChange: (beats: { beat1: string; beat2: string; beat3: string }) => void;
  onEnvironmentBrandPrimaryColorChange: (color: string) => void;
  onEnvironmentBrandSecondaryColorChange: (color: string) => void;
  onCampaignObjectiveChange: (objective: string) => void;
  onCtaTextChange: (cta: string) => void;
  onNext: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const CINEMATIC_LIGHTING = [
  { id: "volumetric", label: "Volumetric", description: "God rays & dramatic beams", icon: "🌟" },
  { id: "neon", label: "Neon Noir", description: "Vibrant glow & shadows", icon: "💜" },
  { id: "editorial", label: "Editorial", description: "Clean, high-key studio", icon: "💡" },
  { id: "golden", label: "Golden Hour", description: "Warm natural light", icon: "🌅" },
];

const VISUAL_PRESETS = [
  { id: "photorealistic", label: "Photorealistic", description: "Lifelike rendering", icon: "📸" },
  { id: "cinematic", label: "Cinematic", description: "Film-quality look", icon: "🎬" },
  { id: "anime", label: "Anime/Stylized", description: "Bold artistic style", icon: "✨" },
  { id: "cyberpunk", label: "Cyberpunk", description: "Neon futuristic", icon: "🌃" },
  { id: "minimalist", label: "Minimalist", description: "Clean Apple-style", icon: "⚪" },
];

const OBJECTIVES = [
  { id: "awareness", label: "Brand Awareness", icon: "👁️" },
  { id: "showcase", label: "Feature Showcase", icon: "⭐" },
  { id: "sales", label: "Sales/CTA", icon: "🛒" },
];

const BEAT_INFO = [
  { key: "beat1" as const, title: "The Hook", timeRange: "0-4s", description: "Grab attention instantly" },
  { key: "beat2" as const, title: "The Transformation", timeRange: "4-8s", description: "Show the journey" },
  { key: "beat3" as const, title: "The Payoff", timeRange: "8-12s", description: "Deliver impact" },
];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION HEADER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function SectionHeader({ 
  icon: Icon, 
  title, 
  description,
  iconColor = "text-amber-400"
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  iconColor?: string;
}) {
  return (
    <div className="space-y-1 mb-4">
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", iconColor)} />
        <span className="text-xs uppercase tracking-wider font-semibold text-white/70">
          {title}
        </span>
      </div>
      <p className="text-xs text-white/40 pl-6">{description}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function VisualStyleTab({
  workspaceId,
  videoId,
  environmentConcept,
  cinematicLighting,
  atmosphericDensity,
  styleReferenceUrl,
  visualPreset,
  campaignSpark,
  visualBeats,
  environmentBrandPrimaryColor,
  environmentBrandSecondaryColor,
  campaignObjective,
  ctaText,
  onEnvironmentConceptChange,
  onCinematicLightingChange,
  onAtmosphericDensityChange,
  onStyleReferenceUrlChange,
  onVisualPresetChange,
  onCampaignSparkChange,
  onVisualBeatsChange,
  onEnvironmentBrandPrimaryColorChange,
  onEnvironmentBrandSecondaryColorChange,
  onCampaignObjectiveChange,
  onCtaTextChange,
}: VisualStyleTabProps) {
  const { toast } = useToast();
  const [beatsGenerated, setBeatsGenerated] = useState(false);
  const [uploadingReference, setUploadingReference] = useState(false);
  const [previewOverlayEnabled, setPreviewOverlayEnabled] = useState(false);
  const [isGeneratingSpark, setIsGeneratingSpark] = useState(false);
  const [isGeneratingBeats, setIsGeneratingBeats] = useState(false);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  // Validation states (FIXED: removed targetAudience dependency)
  const isEnvironmentSet = environmentConcept.trim().length >= 20;
  const isStyleDefined = visualPreset !== "" || styleReferenceUrl !== null;
  const isStoryReady = campaignSpark.trim().length >= 10;
  const beatsFilledCount = [visualBeats.beat1, visualBeats.beat2, visualBeats.beat3].filter(b => b.trim().length > 0).length;

  // Handlers
  const handleGenerateBeats = async () => {
    if (!videoId) {
      toast({
        title: "Error",
        description: "Video ID is required for generating beats",
        variant: "destructive",
      });
      return;
    }

    if (!campaignSpark || campaignSpark.trim().length < 10) {
      toast({
        title: "Error",
        description: "Creative Spark is required. Please fill in the Creative Spark field first.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingBeats(true);
    try {
      console.log('[VisualStyleTab] Calling visual beats API for video:', videoId);
      
      const response = await fetch(`/api/social-commerce/videos/${videoId}/visual-beats/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          campaignSpark,
          campaignObjective: campaignObjective || 'awareness',
        }),
      });

      const responseData = await response.json();
      console.log('[VisualStyleTab] Beats API Response:', {
        ok: response.ok,
        status: response.status,
        hasScriptManifest: !!responseData.script_manifest,
      });

      if (!response.ok) {
        const errorMessage = responseData.error || responseData.details || 'Failed to generate visual beats';
        console.error('[VisualStyleTab] API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      // Verify response structure
      if (!responseData.script_manifest) {
        console.error('[VisualStyleTab] Invalid response structure:', responseData);
        throw new Error('Invalid response from server: missing script_manifest');
      }

      const scriptManifest = responseData.script_manifest;

      // Extract beats from script manifest
      const generatedBeats = {
        beat1: scriptManifest.act_1_hook?.text || '',
        beat2: scriptManifest.act_2_transform?.text || '',
        beat3: scriptManifest.act_3_payoff?.text || '',
      };

      console.log('[VisualStyleTab] Setting generated beats:', {
        beat1Length: generatedBeats.beat1.length,
        beat2Length: generatedBeats.beat2.length,
        beat3Length: generatedBeats.beat3.length,
      });

      // Update beats state
      onVisualBeatsChange(generatedBeats);

      // Update CTA text if available and not empty
      if (scriptManifest.act_3_payoff?.cta_text && scriptManifest.act_3_payoff.cta_text.trim().length > 0) {
        console.log('[VisualStyleTab] Setting CTA text:', scriptManifest.act_3_payoff.cta_text);
        onCtaTextChange(scriptManifest.act_3_payoff.cta_text);
      }

      setBeatsGenerated(true);
      
      toast({
        title: "Visual Beats Generated",
        description: `AI has generated 3-act narrative beats for your campaign (cost: $${(responseData.cost || 0).toFixed(4)})`,
      });
    } catch (error) {
      console.error('[VisualStyleTab] Error generating visual beats:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate visual beats. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBeats(false);
    }
  };

  const handleGenerateCreativeSpark = async () => {
    if (!videoId) {
      toast({
        title: "Error",
        description: "Video ID is required for AI Recommend",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingSpark(true);
    try {
      console.log('[VisualStyleTab] Calling creative spark API for video:', videoId);
      
      const response = await fetch(`/api/social-commerce/videos/${videoId}/creative-spark/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const responseData = await response.json();
      console.log('[VisualStyleTab] API Response:', {
        ok: response.ok,
        status: response.status,
        data: responseData,
      });

      if (!response.ok) {
        const errorMessage = responseData.error || responseData.details || 'Failed to generate creative spark';
        console.error('[VisualStyleTab] API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      // Verify response structure
      if (!responseData.creative_spark) {
        console.error('[VisualStyleTab] Invalid response structure:', responseData);
        throw new Error('Invalid response from server: missing creative_spark field');
      }

      // Verify it's not empty or placeholder
      if (responseData.creative_spark.trim().length < 50) {
        console.warn('[VisualStyleTab] Creative spark seems too short:', responseData.creative_spark);
      }

      console.log('[VisualStyleTab] Setting creative spark:', responseData.creative_spark.substring(0, 100) + '...');
      onCampaignSparkChange(responseData.creative_spark);
      
      toast({
        title: "Creative Spark Generated",
        description: "AI has generated a creative spark for your campaign.",
      });
    } catch (error) {
      console.error('[VisualStyleTab] Error generating creative spark:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate creative spark. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSpark(false);
    }
  };

  const handleReferenceUpload = async (file: File) => {
    setUploadingReference(true);
    try {
      const response = await uploadFile(workspaceId, file, file.name, "Style Reference");
      onStyleReferenceUrlChange(response.upload.storageUrl);
      if (visualPreset) {
        onVisualPresetChange("");
      }
    } catch (error) {
      console.error("Error uploading reference:", error);
    } finally {
      setUploadingReference(false);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    onVisualPresetChange(presetId);
    if (styleReferenceUrl) {
      onStyleReferenceUrlChange(null);
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
        <ScrollArea className="h-full pr-3">
          <div className="space-y-5 pb-6">
            
            {/* Zone Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                Atmosphere & Style
              </h2>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ENVIRONMENT CONCEPT CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-3">
                <SectionHeader
                  icon={Wind}
                  title="Environment Concept"
                  description="Describe the world and atmosphere"
                  iconColor="text-cyan-400"
                />
                
                <Textarea
                  value={environmentConcept}
                  onChange={(e) => onEnvironmentConceptChange(e.target.value)}
                  placeholder="e.g., A dark underwater cavern with jagged obsidian walls and bioluminescent particles..."
                  className="bg-white/5 border-white/10 text-white min-h-[100px] resize-none text-sm"
                  maxLength={500}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40">{environmentConcept.length}/500</span>
                  {isEnvironmentSet ? (
                    <span className="text-[10px] text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Valid
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400">Min 20 chars</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* VISUAL STYLE CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <SectionHeader
                    icon={ImageIcon}
                    title="Visual Style"
                    description="Choose preset or upload reference"
                    iconColor="text-pink-400"
                  />
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-white/5 border-white/20">
                    {visualPreset ? "Preset" : styleReferenceUrl ? "Custom" : "None"}
                  </Badge>
                </div>

                {/* Preset Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {VISUAL_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset.id)}
                      className={cn(
                        "p-2.5 rounded-lg border transition-all text-left",
                        visualPreset === preset.id
                          ? "bg-pink-500/20 border-pink-500/50"
                          : "bg-white/[0.02] border-white/10 hover:border-pink-500/30"
                      )}
                    >
                      <span className="text-lg block mb-0.5">{preset.icon}</span>
                      <p className="text-[11px] font-medium text-white">{preset.label}</p>
                      <p className="text-[9px] text-white/40">{preset.description}</p>
                    </button>
                  ))}
                </div>

                {/* Style Reference Upload */}
                <div className="pt-2 border-t border-white/10">
                  <div
                    onClick={() => !uploadingReference && referenceInputRef.current?.click()}
                    className={cn(
                      "h-20 rounded-lg border-2 border-dashed cursor-pointer flex items-center justify-center transition-all",
                      styleReferenceUrl
                        ? "border-pink-500/30 bg-white/[0.02]"
                        : "border-white/10 hover:border-pink-500/30"
                    )}
                  >
                    {uploadingReference ? (
                      <Loader2 className="w-5 h-5 text-pink-400 animate-spin" />
                    ) : styleReferenceUrl ? (
                      <div className="relative w-full h-full">
                        <img src={styleReferenceUrl} alt="Reference" className="w-full h-full object-cover rounded-lg" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStyleReferenceUrlChange(null);
                          }}
                          className="absolute top-1 right-1 p-1 bg-black/60 rounded-full"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-white/40">
                        <Upload className="w-4 h-4" />
                        <span className="text-xs">Upload style reference</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={referenceInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleReferenceUpload(file);
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* BRAND COLORS CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <SectionHeader
                    icon={Palette}
                    title="Campaign Colors"
                    description="Override brand colors for this environment"
                    iconColor="text-purple-400"
                  />
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-purple-500/20 border-purple-500/30 text-purple-300">
                    Local
                  </Badge>
                </div>

                <div className="flex gap-3">
                  {/* Primary Color */}
                  <div className="flex-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button 
                          className="w-full h-10 rounded-lg border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer relative group" 
                          style={{ backgroundColor: environmentBrandPrimaryColor }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Palette className="w-4 h-4 text-white drop-shadow-lg" />
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 bg-[#0a0a0a] border-white/10">
                        <div className="space-y-2">
                          <Label className="text-xs text-white">Primary Color</Label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={environmentBrandPrimaryColor}
                              onChange={(e) => onEnvironmentBrandPrimaryColorChange(e.target.value)}
                              className="w-10 h-10 rounded cursor-pointer border border-white/10"
                            />
                            <Input
                              value={environmentBrandPrimaryColor}
                              onChange={(e) => onEnvironmentBrandPrimaryColorChange(e.target.value)}
                              className="flex-1 h-10 bg-white/5 border-white/10 text-white text-xs"
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <p className="text-[10px] text-white/40 mt-1 text-center">Primary</p>
                  </div>

                  {/* Secondary Color */}
                  <div className="flex-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button 
                          className="w-full h-10 rounded-lg border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer relative group" 
                          style={{ backgroundColor: environmentBrandSecondaryColor }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Palette className="w-4 h-4 text-white drop-shadow-lg" />
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 bg-[#0a0a0a] border-white/10">
                        <div className="space-y-2">
                          <Label className="text-xs text-white">Secondary Color</Label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={environmentBrandSecondaryColor}
                              onChange={(e) => onEnvironmentBrandSecondaryColorChange(e.target.value)}
                              className="w-10 h-10 rounded cursor-pointer border border-white/10"
                            />
                            <Input
                              value={environmentBrandSecondaryColor}
                              onChange={(e) => onEnvironmentBrandSecondaryColorChange(e.target.value)}
                              className="flex-1 h-10 bg-white/5 border-white/10 text-white text-xs"
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <p className="text-[10px] text-white/40 mt-1 text-center">Secondary</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* CINEMATIC LIGHTING CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-3">
                <SectionHeader
                  icon={Lightbulb}
                  title="Cinematic Lighting"
                  description="Set the mood and atmosphere"
                  iconColor="text-amber-400"
                />

                <div className="grid grid-cols-2 gap-2">
                  {CINEMATIC_LIGHTING.map((lighting) => (
                    <button
                      key={lighting.id}
                      onClick={() => onCinematicLightingChange(lighting.id)}
                      className={cn(
                        "p-2.5 rounded-lg border transition-all text-left",
                        cinematicLighting === lighting.id
                          ? "bg-amber-500/20 border-amber-500/50"
                          : "bg-white/[0.02] border-white/10 hover:border-amber-500/30"
                      )}
                    >
                      <span className="text-lg block mb-0.5">{lighting.icon}</span>
                      <p className="text-[11px] font-medium text-white">{lighting.label}</p>
                      <p className="text-[9px] text-white/40">{lighting.description}</p>
                    </button>
                  ))}
                </div>

                {/* Atmospheric Density */}
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-white/50">Atmospheric Density</Label>
                    <span className="text-xs text-amber-400">{atmosphericDensity}%</span>
                  </div>
                  <Slider
                    value={[atmosphericDensity]}
                    onValueChange={([v]) => onAtmosphericDensityChange(v)}
                    min={0}
                    max={100}
                  />
                  <div className="flex justify-between text-[10px] text-white/30">
                    <span>Clear</span>
                    <span>Dense</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </ScrollArea>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ZONE B: NARRATIVE STUDIO */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <ScrollArea className="h-full pl-3">
          <div className="space-y-5 pb-6">
            
            {/* Zone Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Film className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                Narrative Studio
              </h2>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* CAMPAIGN DIRECTION CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <SectionHeader
                  icon={Target}
                  title="Campaign Direction"
                  description="Define objective and creative spark"
                  iconColor="text-orange-400"
                />

                {/* Objective Toggles */}
                <div className="space-y-2">
                  <Label className="text-xs text-white/50">Objective</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {OBJECTIVES.map((objective) => (
                      <button
                        key={objective.id}
                        onClick={() => {
                          // Toggle: if already selected, deselect; otherwise select
                          const newObjective = campaignObjective === objective.id ? '' : objective.id;
                          onCampaignObjectiveChange(newObjective);
                        }}
                        className={cn(
                          "p-2.5 rounded-lg border transition-all text-center",
                          campaignObjective === objective.id
                            ? "bg-orange-500/20 border-orange-500/50"
                            : "bg-white/[0.02] border-white/10 hover:border-orange-500/30"
                        )}
                      >
                        <span className="text-lg block mb-0.5">{objective.icon}</span>
                        <p className="text-[10px] font-medium text-white">{objective.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campaign Spark */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-white/50">Creative Spark</Label>
                    {videoId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateCreativeSpark}
                        disabled={isGeneratingSpark}
                        className="h-7 px-2 text-[10px] border-purple-500/50 hover:border-purple-500/80 hover:bg-purple-500/10"
                      >
                        {isGeneratingSpark ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-1 h-3 w-3" />
                            AI Recommend
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={campaignSpark}
                    onChange={(e) => onCampaignSparkChange(e.target.value)}
                    placeholder="e.g., The shoe hatches from a dragon egg in a dark cave"
                    className="min-h-[80px] bg-white/5 border-white/10 text-white text-sm resize-none"
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40">{campaignSpark.length}/500</span>
                    {isStoryReady ? (
                      <span className="text-[10px] text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Valid
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400">Min 10 chars</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* STORY BEATS CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <SectionHeader
                    icon={Sparkles}
                    title="Story Beats"
                    description="Structure your narrative flow"
                    iconColor="text-purple-400"
                  />
                  {beatsGenerated && (
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-purple-500/20 border-purple-500/30 text-purple-300">
                      {beatsFilledCount}/3 filled
                    </Badge>
                  )}
                </div>

                {/* Generate Button */}
                {!beatsGenerated && (
                  <Button
                    onClick={handleGenerateBeats}
                    disabled={!isStoryReady || isGeneratingBeats}
                    className={cn(
                      "w-full h-12 font-semibold relative overflow-hidden",
                      isStoryReady && !isGeneratingBeats
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        : "bg-white/10 text-white/40 cursor-not-allowed"
                    )}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isGeneratingBeats ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating Beats...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Generate Visual Beats
                        </>
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

                {/* Beat Cards */}
                <AnimatePresence>
                  {beatsGenerated && (
                    <div className="space-y-3">
                      {BEAT_INFO.map((beat, index) => (
                        <motion.div
                          key={beat.key}
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="p-3 rounded-lg bg-white/[0.02] border border-white/10"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-white">{beat.title}</p>
                                <p className="text-[9px] text-white/40">{beat.description}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-purple-500/10 border-purple-500/30 text-purple-300">
                              {beat.timeRange}
                            </Badge>
                          </div>
                          
                          <Textarea
                            value={visualBeats[beat.key]}
                            onChange={(e) => onVisualBeatsChange({
                              ...visualBeats,
                              [beat.key]: e.target.value,
                            })}
                            placeholder={`Describe ${beat.title.toLowerCase()}...`}
                            className="bg-white/5 border-white/10 text-white min-h-[60px] resize-none text-xs"
                            maxLength={200}
                          />
                          
                          {/* CTA Text for Beat 3 */}
                          {beat.key === "beat3" && (
                            <div className="mt-2 pt-2 border-t border-white/10">
                              <Label className="text-[10px] text-white/50 mb-1 block">CTA Text</Label>
                              <Input
                                value={ctaText}
                                onChange={(e) => onCtaTextChange(e.target.value)}
                                placeholder="e.g., SHOP NOW at www.website.com"
                                className="h-8 bg-white/5 border-white/10 text-white text-xs"
                                maxLength={100}
                              />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

          </div>
        </ScrollArea>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* COMPACT VALIDATION FOOTER */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          
          {/* Validation Checkmarks */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              {isEnvironmentSet ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-white/20" />
              )}
              <span className={cn(
                "text-xs font-medium",
                isEnvironmentSet ? "text-white/70" : "text-white/40"
              )}>
                Environment Set
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isStyleDefined ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-white/20" />
              )}
              <span className={cn(
                "text-xs font-medium",
                isStyleDefined ? "text-white/70" : "text-white/40"
              )}>
                Style Defined
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isStoryReady ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-white/20" />
              )}
              <span className={cn(
                "text-xs font-medium",
                isStoryReady ? "text-white/70" : "text-white/40"
              )}>
                Story Ready
              </span>
            </div>
          </div>

          {/* Right side: Safe zone toggle + beats count */}
          <div className="flex items-center gap-4">
            {beatsGenerated && (
              <span className="text-xs text-white/40">
                {beatsFilledCount}/3 beats filled
              </span>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewOverlayEnabled(!previewOverlayEnabled)}
              className={cn(
                "h-7 text-xs bg-white/5 border-white/10 text-white/60 hover:bg-white/10",
                previewOverlayEnabled && "border-purple-500/50 bg-purple-500/20 text-purple-300"
              )}
            >
              <Eye className="w-3 h-3 mr-1.5" />
              Safe Zone
            </Button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SAFE ZONE PREVIEW OVERLAY */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {previewOverlayEnabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full max-w-sm aspect-[9/16] border-4 border-purple-500/50 rounded-2xl bg-black/20">
                {/* Right side buttons */}
                <div className="absolute right-3 bottom-20 space-y-3">
                  {['❤️', '💬', '↗️', '♪'].map((icon, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-xl">
                      {icon}
                    </div>
                  ))}
                </div>
                
                {/* Bottom caption */}
                <div className="absolute bottom-3 left-3 right-16 bg-black/40 backdrop-blur rounded-lg p-2">
                  <p className="text-white text-xs font-semibold">@username</p>
                  <p className="text-white/70 text-[10px]">Caption area...</p>
                </div>
                
                {/* Safe zone label */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-purple-500/90 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold">
                  Safe Zone Preview
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
