import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  Maximize2,
  Box,
  Upload,
  X,
  Loader2,
  Sparkles,
  Palette,
  Hand,
  User,
  UserCircle2,
  Package,
  CheckCircle2,
  Plus,
  ChevronDown,
  Library,
  Pencil,
  Shield,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/assets/uploads/routes";

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

interface ProductImages {
  heroProfile: string | null;
  macroDetail: string | null;
  materialReference: string | null;
}

interface HookFormatTabProps {
  workspaceId: string;
  productImages: ProductImages;
  materialPreset: string;
  objectMass: number;
  surfaceComplexity: number;
  refractionEnabled: boolean;
  logoUrl: string | null;
  brandPrimaryColor: string;
  brandSecondaryColor: string;
  logoIntegrity: number;
  logoDepth: number;
  heroFeature: string;
  originMetaphor: string;
  includeHumanElement: boolean;
  characterMode: 'hand-model' | 'full-body' | 'silhouette' | null;
  characterReferenceUrl: string | null;
  characterDescription: string;
  targetAudience: string;
  onProductImagesChange: (images: ProductImages) => void;
  onMaterialPresetChange: (preset: string) => void;
  onObjectMassChange: (mass: number) => void;
  onSurfaceComplexityChange: (complexity: number) => void;
  onRefractionEnabledChange: (enabled: boolean) => void;
  onLogoUrlChange: (url: string | null) => void;
  onBrandPrimaryColorChange: (color: string) => void;
  onBrandSecondaryColorChange: (color: string) => void;
  onLogoIntegrityChange: (integrity: number) => void;
  onLogoDepthChange: (depth: number) => void;
  onHeroFeatureChange: (feature: string) => void;
  onOriginMetaphorChange: (metaphor: string) => void;
  onIncludeHumanElementChange: (include: boolean) => void;
  onCharacterModeChange: (mode: 'hand-model' | 'full-body' | 'silhouette' | null) => void;
  onCharacterReferenceUrlChange: (url: string | null) => void;
  onCharacterDescriptionChange: (description: string) => void;
  onNext: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const IMAGE_SLOTS = [
  { key: "heroProfile" as keyof ProductImages, label: "Hero Profile", icon: Eye, description: "Primary product view" },
  { key: "macroDetail" as keyof ProductImages, label: "Macro Detail", icon: Maximize2, description: "Texture/detail view" },
  { key: "materialReference" as keyof ProductImages, label: "Material Ref", icon: Box, description: "Surface/finish" },
];

const MATERIAL_PRESETS = [
  { value: "metallic", label: "Metallic/Reflective", description: "Shiny metal surfaces", icon: "✨" },
  { value: "glass", label: "Translucent/Glass", description: "See-through materials", icon: "💎" },
  { value: "organic", label: "Soft/Organic", description: "Fabrics, leather, skin", icon: "🌿" },
  { value: "industrial", label: "Matte/Industrial", description: "Concrete, rubber, matte", icon: "🔧" },
];

const CHARACTER_MODES = [
  { value: "hand-model" as const, label: "Hand Model", description: "Product interaction focus", icon: Hand },
  { value: "full-body" as const, label: "Full Body", description: "Complete talent presence", icon: User },
  { value: "silhouette" as const, label: "Silhouette", description: "Artistic shadow form", icon: UserCircle2 },
];

// AI Recommendations based on audience
const AI_RECOMMENDATIONS: Record<string, { mode: 'hand-model' | 'full-body' | 'silhouette'; description: string; rationale: string }[]> = {
  'mena': [
    { mode: 'full-body', description: 'Elegant Middle Eastern model, modest styling, warm lighting', rationale: 'Resonates with regional cultural preferences' },
    { mode: 'hand-model', description: 'Refined hands with subtle jewelry, premium gestures', rationale: 'Product-focused with cultural sensitivity' },
  ],
  'genz': [
    { mode: 'hand-model', description: 'Young diverse hands with trendy nail art, dynamic gestures', rationale: 'Authentic, relatable youth aesthetic' },
    { mode: 'full-body', description: 'Street-style talent, casual confidence, vibrant energy', rationale: 'Connects with younger demographics' },
  ],
  'luxury': [
    { mode: 'silhouette', description: 'High-contrast silhouette, premium styling, dramatic lighting', rationale: 'Emphasizes product as hero element' },
    { mode: 'hand-model', description: 'Manicured hands, subtle elegance, soft studio lighting', rationale: 'Refined interaction without distraction' },
  ],
  'western': [
    { mode: 'full-body', description: 'Minimalist modern styling, clean aesthetic, professional', rationale: 'Appeals to Western market sensibilities' },
    { mode: 'hand-model', description: 'Clean, simple hands, neutral tones, efficient gestures', rationale: 'Functional product demonstration' },
  ],
  'asian': [
    { mode: 'hand-model', description: 'Tech-forward styling, precise gestures, futuristic lighting', rationale: 'High-tech aesthetic alignment' },
    { mode: 'full-body', description: 'K-beauty influenced, polished appearance, soft glow', rationale: 'Popular regional visual language' },
  ],
  'global': [
    { mode: 'full-body', description: 'Universal appeal, diverse representation, balanced styling', rationale: 'Broad market compatibility' },
    { mode: 'silhouette', description: 'Abstract human form, focuses attention on product', rationale: 'Culture-neutral presentation' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION HEADER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function SectionHeader({ 
  icon: Icon, 
  title, 
  description,
  iconColor = "text-pink-400"
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

export function HookFormatTab({
  workspaceId,
  productImages,
  materialPreset,
  objectMass,
  surfaceComplexity,
  refractionEnabled,
  logoUrl,
  brandPrimaryColor,
  brandSecondaryColor,
  logoIntegrity,
  logoDepth,
  heroFeature,
  originMetaphor,
  includeHumanElement,
  characterMode,
  characterReferenceUrl,
  characterDescription,
  targetAudience,
  onProductImagesChange,
  onMaterialPresetChange,
  onObjectMassChange,
  onSurfaceComplexityChange,
  onRefractionEnabledChange,
  onLogoUrlChange,
  onBrandPrimaryColorChange,
  onBrandSecondaryColorChange,
  onLogoIntegrityChange,
  onLogoDepthChange,
  onHeroFeatureChange,
  onOriginMetaphorChange,
  onIncludeHumanElementChange,
  onCharacterModeChange,
  onCharacterReferenceUrlChange,
  onCharacterDescriptionChange,
}: HookFormatTabProps) {
  // Upload states
  const [uploadingSlots, setUploadingSlots] = useState<Set<keyof ProductImages>>(new Set());
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCharacter, setUploadingCharacter] = useState(false);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const logoInputRef = useRef<HTMLInputElement>(null);
  const characterInputRef = useRef<HTMLInputElement>(null);

  // Dialog states
  const [showAIRecommendation, setShowAIRecommendation] = useState(false);
  const [showCharacterLibrary, setShowCharacterLibrary] = useState(false);
  const [showCreateCharacter, setShowCreateCharacter] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<typeof AI_RECOMMENDATIONS['global']>([]);

  // Validation states
  const filledSlots = Object.values(productImages).filter(Boolean).length;
  const isImagesReady = filledSlots >= 1;
  const isMaterialSet = materialPreset !== "";
  const isBrandSet = logoUrl !== null || (brandPrimaryColor && brandSecondaryColor);
  const isCastSet = !includeHumanElement || characterMode !== null;

  // File upload handlers
  const handleFileSelect = async (key: keyof ProductImages, file: File) => {
    setUploadingSlots(prev => new Set([...prev, key]));
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', workspaceId);
      formData.append('type', 'product-image');
      
      const result = await uploadFile(formData);
      if (result.url) {
        onProductImagesChange({ ...productImages, [key]: result.url });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploadingSlots(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', workspaceId);
      formData.append('type', 'logo');
      
      const result = await uploadFile(formData);
      if (result.url) {
        onLogoUrlChange(result.url);
      }
    } catch (error) {
      console.error('Logo upload failed:', error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCharacterUpload = async (file: File) => {
    setUploadingCharacter(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', workspaceId);
      formData.append('type', 'character-reference');
      
      const result = await uploadFile(formData);
      if (result.url) {
        onCharacterReferenceUrlChange(result.url);
      }
    } catch (error) {
      console.error('Character upload failed:', error);
    } finally {
      setUploadingCharacter(false);
    }
  };

  // AI Recommendation handler
  const handleOpenAIRecommendation = () => {
    setShowAIRecommendation(true);
    setIsAnalyzing(true);
    setRecommendations([]);
    
    // Simulate AI analysis
    setTimeout(() => {
      const audienceRecs = AI_RECOMMENDATIONS[targetAudience] || AI_RECOMMENDATIONS['global'];
      setRecommendations(audienceRecs);
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleApplyRecommendation = (rec: typeof recommendations[0]) => {
    onCharacterModeChange(rec.mode);
    onCharacterDescriptionChange(rec.description);
    setShowAIRecommendation(false);
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
        {/* ZONE A: PRODUCT IDENTITY */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <ScrollArea className="h-full pr-3">
          <div className="space-y-5 pb-6">
            
            {/* Zone Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Package className="w-5 h-5 text-pink-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                Product Identity
              </h2>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* VISUAL ASSETS CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <SectionHeader
                    icon={Eye}
                    title="Visual Assets"
                    description="Product photography for AI reference"
                    iconColor="text-pink-400"
                  />
                  <Badge variant="outline" className="text-xs px-2 py-0.5 bg-pink-500/20 border-pink-500/30 text-pink-300">
                    {filledSlots}/3
                  </Badge>
                </div>

                {/* 3 Image Cards */}
                <div className="grid grid-cols-3 gap-3">
                  {IMAGE_SLOTS.map((slot) => {
                    const imageUrl = productImages[slot.key];
                    const isUploading = uploadingSlots.has(slot.key);
                    const Icon = slot.icon;

                    return (
                      <div
                        key={slot.key}
                        onClick={() => !imageUrl && !isUploading && fileInputRefs.current[slot.key]?.click()}
                        className={cn(
                          "relative aspect-square rounded-lg border-2 border-dashed cursor-pointer transition-all overflow-hidden group",
                          imageUrl 
                            ? "border-pink-500/30 bg-white/[0.02]" 
                            : "border-white/10 bg-white/[0.02] hover:border-pink-500/30"
                        )}
                      >
                        {isUploading ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
                          </div>
                        ) : imageUrl ? (
                          <>
                            <img 
                              src={imageUrl} 
                              alt={slot.label}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onProductImagesChange({ ...productImages, [slot.key]: null });
                              }}
                              className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                            <Icon className="w-5 h-5 text-white/30 mb-1" />
                            <span className="text-[10px] font-medium text-white/50 text-center">{slot.label}</span>
                          </div>
                        )}
                        <input
                          ref={(el) => (fileInputRefs.current[slot.key] = el)}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(slot.key, file);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* MATERIAL INTELLIGENCE CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <SectionHeader
                  icon={Box}
                  title="Material Intelligence"
                  description="Physical properties for realistic rendering"
                  iconColor="text-cyan-400"
                />

                {/* Material Preset */}
                <div className="space-y-2">
                  <Label className="text-xs text-white/50">Material Type</Label>
                  <Select value={materialPreset} onValueChange={onMaterialPresetChange}>
                    <SelectTrigger className="h-10 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select material...">
                        {materialPreset && (
                          <div className="flex items-center gap-2">
                            <span>{MATERIAL_PRESETS.find(m => m.value === materialPreset)?.icon}</span>
                            <span>{MATERIAL_PRESETS.find(m => m.value === materialPreset)?.label}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/10">
                      {MATERIAL_PRESETS.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value} className="py-2">
                          <div className="flex items-center gap-2">
                            <span>{preset.icon}</span>
                            <span>{preset.label}</span>
                            <span className="text-xs text-white/40">- {preset.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {materialPreset === "" && (
                    <p className="text-xs text-amber-400/80">Required</p>
                  )}
                </div>

                {/* Physics Sliders */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs text-white/50">Object Mass</Label>
                      <span className="text-xs text-cyan-400">{objectMass}%</span>
                    </div>
                    <Slider value={[objectMass]} onValueChange={([v]) => onObjectMassChange(v)} min={0} max={100} />
                    <div className="flex justify-between text-[10px] text-white/30">
                      <span>Light</span>
                      <span>Heavy</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs text-white/50">Surface</Label>
                      <span className="text-xs text-cyan-400">{surfaceComplexity}%</span>
                    </div>
                    <Slider value={[surfaceComplexity]} onValueChange={([v]) => onSurfaceComplexityChange(v)} min={0} max={100} />
                    <div className="flex justify-between text-[10px] text-white/30">
                      <span>Smooth</span>
                      <span>Complex</span>
                    </div>
                  </div>
                </div>

                {/* Refraction Toggle */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <Label className="text-xs text-white/50">Light Refraction</Label>
                    <p className="text-[10px] text-white/30">For glass/transparent materials</p>
                  </div>
                  <Switch checked={refractionEnabled} onCheckedChange={onRefractionEnabledChange} />
                </div>
              </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* PRODUCT NARRATIVE CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <SectionHeader
                  icon={Sparkles}
                  title="Product Narrative"
                  description="Story elements for AI storytelling"
                  iconColor="text-amber-400"
                />

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-white/50">Hero Feature</Label>
                    <Input
                      value={heroFeature}
                      onChange={(e) => onHeroFeatureChange(e.target.value)}
                      placeholder="e.g., The brushed titanium bezel"
                      className="h-9 bg-white/5 border-white/10 text-white text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-white/50">Origin Metaphor</Label>
                    <Input
                      value={originMetaphor}
                      onChange={(e) => onOriginMetaphorChange(e.target.value)}
                      placeholder="e.g., A block of obsidian"
                      className="h-9 bg-white/5 border-white/10 text-white text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </ScrollArea>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ZONE B: BRAND & CAST */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <ScrollArea className="h-full pl-3">
          <div className="space-y-5 pb-6">
            
            {/* Zone Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Palette className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                Brand & Cast
              </h2>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* BRAND IDENTITY CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <SectionHeader
                  icon={Palette}
                  title="Brand Identity"
                  description="Logo and color consistency"
                  iconColor="text-purple-400"
                />

                {/* Logo + Colors Row */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Logo Upload */}
                  <div
                    onClick={() => !logoUrl && !uploadingLogo && logoInputRef.current?.click()}
                    className={cn(
                      "relative aspect-square rounded-lg border-2 border-dashed cursor-pointer transition-all overflow-hidden group",
                      logoUrl 
                        ? "border-purple-500/30 bg-white/[0.02]" 
                        : "border-white/10 bg-white/[0.02] hover:border-purple-500/30"
                    )}
                  >
                    {uploadingLogo ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                      </div>
                    ) : logoUrl ? (
                      <>
                        <img src={logoUrl} alt="Logo" className="absolute inset-0 w-full h-full object-contain p-2" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLogoUrlChange(null);
                          }}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Upload className="w-5 h-5 text-white/30 mb-1" />
                        <span className="text-[10px] text-white/50">Logo</span>
                      </div>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file);
                      }}
                    />
                  </div>

                  {/* Primary Color */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-white/50">Primary</Label>
                    <div className="relative">
                      <input
                        type="color"
                        value={brandPrimaryColor}
                        onChange={(e) => onBrandPrimaryColorChange(e.target.value)}
                        className="w-full aspect-square rounded-lg cursor-pointer border border-white/10"
                      />
                    </div>
                    <Input
                      value={brandPrimaryColor}
                      onChange={(e) => onBrandPrimaryColorChange(e.target.value)}
                      className="h-7 text-[10px] bg-white/5 border-white/10 text-white text-center"
                    />
                  </div>

                  {/* Secondary Color */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-white/50">Secondary</Label>
                    <div className="relative">
                      <input
                        type="color"
                        value={brandSecondaryColor}
                        onChange={(e) => onBrandSecondaryColorChange(e.target.value)}
                        className="w-full aspect-square rounded-lg cursor-pointer border border-white/10"
                      />
                    </div>
                    <Input
                      value={brandSecondaryColor}
                      onChange={(e) => onBrandSecondaryColorChange(e.target.value)}
                      className="h-7 text-[10px] bg-white/5 border-white/10 text-white text-center"
                    />
                  </div>
                </div>

                {/* Logo Protection Sliders */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-purple-400" />
                        <Label className="text-xs text-white/50">Logo Integrity</Label>
                      </div>
                      <span className="text-xs text-purple-400">{logoIntegrity}/10</span>
                    </div>
                    <Slider value={[logoIntegrity]} onValueChange={([v]) => onLogoIntegrityChange(v)} min={1} max={10} />
                    <p className="text-[10px] text-white/30">Brand protection strength</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-purple-400" />
                        <Label className="text-xs text-white/50">Logo Depth</Label>
                      </div>
                      <span className="text-xs text-purple-400">{logoDepth}%</span>
                    </div>
                    <Slider value={[logoDepth]} onValueChange={([v]) => onLogoDepthChange(v)} min={0} max={100} />
                    <div className="flex justify-between text-[10px] text-white/30">
                      <span>Flat</span>
                      <span>3D</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* CAST & CHARACTER DNA CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                {/* Header with Toggle */}
                <div className="flex items-center justify-between">
                  <SectionHeader
                    icon={UserCircle2}
                    title="Cast DNA"
                    description="Human elements for your campaign"
                    iconColor="text-orange-400"
                  />
                  <Switch checked={includeHumanElement} onCheckedChange={onIncludeHumanElementChange} />
                </div>

                <AnimatePresence>
                  {includeHumanElement && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* Character Mode Selection - Visual Cards */}
                      <div className="space-y-2">
                        <Label className="text-xs text-white/50">Character Mode</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {CHARACTER_MODES.map((mode) => {
                            const Icon = mode.icon;
                            const isSelected = characterMode === mode.value;
                            return (
                              <button
                                key={mode.value}
                                onClick={() => onCharacterModeChange(mode.value)}
                                className={cn(
                                  "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all",
                                  isSelected
                                    ? "bg-orange-500/20 border-orange-500/50"
                                    : "bg-white/5 border-white/10 hover:border-orange-500/30"
                                )}
                              >
                                <Icon className={cn(
                                  "w-5 h-5",
                                  isSelected ? "text-orange-400" : "text-white/50"
                                )} />
                                <span className={cn(
                                  "text-[10px] font-medium text-center",
                                  isSelected ? "text-orange-300" : "text-white/60"
                                )}>
                                  {mode.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {characterMode === null && (
                          <p className="text-xs text-amber-400/80">Select a character mode</p>
                        )}
                      </div>

                      {/* Action Buttons - Narrative Pattern */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleOpenAIRecommendation}
                          className="flex-1 bg-gradient-to-r from-orange-500/10 to-pink-500/10 border-orange-500/30 hover:border-orange-500/50"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
                          AI Recommend
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1.5" />
                              Add Character
                              <ChevronDown className="w-3 h-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10">
                            <DropdownMenuItem 
                              onClick={() => setShowCharacterLibrary(true)}
                              className="text-white hover:bg-white/10"
                            >
                              <Library className="w-4 h-4 mr-2 text-orange-400" />
                              Browse Library
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => characterInputRef.current?.click()}
                              className="text-white hover:bg-white/10"
                            >
                              <Upload className="w-4 h-4 mr-2 text-orange-400" />
                              Upload Reference
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Character Card Display */}
                      {(characterReferenceUrl || characterDescription) && (
                        <div className="relative aspect-[4/3] rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden group">
                          {characterReferenceUrl ? (
                            <img 
                              src={characterReferenceUrl} 
                              alt="Character Reference" 
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <UserCircle2 className="w-12 h-12 text-white/20" />
                            </div>
                          )}
                          
                          {/* Info Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-sm font-semibold text-white capitalize">
                              {characterMode?.replace('-', ' ') || 'Character'}
                            </p>
                            {characterDescription && (
                              <p className="text-xs text-white/70 line-clamp-2">{characterDescription}</p>
                            )}
                          </div>

                          {/* Edit/Remove Button */}
                          <button
                            onClick={() => {
                              onCharacterReferenceUrlChange(null);
                              onCharacterDescriptionChange("");
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Character Description */}
                      <div className="space-y-2">
                        <Label className="text-xs text-white/50">Character Description</Label>
                        <Textarea
                          value={characterDescription}
                          onChange={(e) => onCharacterDescriptionChange(e.target.value)}
                          placeholder="Describe the ideal talent for this campaign..."
                          className="min-h-[80px] resize-none bg-white/5 border-white/10 text-white text-sm"
                        />
                      </div>

                      {/* Hidden file input */}
                      <input
                        ref={characterInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCharacterUpload(file);
                        }}
                      />
                    </motion.div>
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
              {isImagesReady ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-white/20" />
              )}
              <span className={cn(
                "text-xs font-medium",
                isImagesReady ? "text-white/70" : "text-white/40"
              )}>
                Images Ready
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isMaterialSet ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-white/20" />
              )}
              <span className={cn(
                "text-xs font-medium",
                isMaterialSet ? "text-white/70" : "text-white/40"
              )}>
                Material Set
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isBrandSet ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-white/20" />
              )}
              <span className={cn(
                "text-xs font-medium",
                isBrandSet ? "text-white/70" : "text-white/40"
              )}>
                Brand Set
              </span>
            </div>

            {includeHumanElement && (
              <div className="flex items-center gap-2">
                {isCastSet ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-white/20" />
                )}
                <span className={cn(
                  "text-xs font-medium",
                  isCastSet ? "text-white/70" : "text-white/40"
                )}>
                  Cast Set
                </span>
              </div>
            )}
          </div>

          {/* Asset Count */}
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span>{filledSlots} images</span>
            {logoUrl && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>Logo uploaded</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* AI RECOMMENDATION DIALOG */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={showAIRecommendation} onOpenChange={setShowAIRecommendation}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-orange-400" />
              AI Character Recommendation
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Based on target audience: <span className="text-orange-400 font-semibold capitalize">{targetAudience?.replace('-', ' ') || "Not set"}</span>
            </DialogDescription>
          </DialogHeader>

          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-orange-400 animate-spin mb-4" />
              <p className="text-sm text-white/60">Analyzing your campaign context...</p>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              {recommendations.map((rec, index) => (
                <Card key={index} className="bg-white/[0.02] border-white/[0.06] overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-white capitalize">{rec.mode.replace('-', ' ')}</h4>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-500/20 border-orange-500/50 text-orange-300">
                            Recommended
                          </Badge>
                        </div>
                        <p className="text-sm text-white/70">{rec.description}</p>
                        <p className="text-xs text-white/40 italic">{rec.rationale}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleApplyRecommendation(rec)}
                        className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90"
                      >
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CHARACTER LIBRARY DIALOG */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={showCharacterLibrary} onOpenChange={setShowCharacterLibrary}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white">Character Library</DialogTitle>
            <DialogDescription className="text-white/60">
              Choose from your previously created character references
            </DialogDescription>
          </DialogHeader>

          <div className="text-center py-12">
            <UserCircle2 className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">No characters in your library yet.</p>
            <p className="text-sm text-white/30 mt-2">Upload a character reference to get started.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setShowCharacterLibrary(false);
                characterInputRef.current?.click();
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Reference
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
