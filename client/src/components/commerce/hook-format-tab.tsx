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
  Trash2,
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

interface CharacterAIProfile {
  identity_id: string;
  detailed_persona: string;
  cultural_fit: string;
  interaction_protocol: {
    product_engagement: string;
    motion_limitations: string;
  };
  identity_locking: {
    strategy: string;
    vfx_anchor_tags: string;
  };
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
  characterAIProfile: CharacterAIProfile | null;
  isGeneratingCharacter: boolean;
  targetAudience: string;
  onProductImagesChange: (images: ProductImages) => void;
  onProductImageUpload?: (key: 'heroProfile' | 'macroDetail' | 'materialReference', file: File) => Promise<void>;
  onMaterialPresetChange: (preset: string) => void;
  onObjectMassChange: (mass: number) => void;
  onSurfaceComplexityChange: (complexity: number) => void;
  onRefractionEnabledChange: (enabled: boolean) => void;
  onLogoUrlChange: (url: string | null) => void;
  onLogoUpload?: (file: File) => Promise<void>;
  onBrandPrimaryColorChange: (color: string) => void;
  onBrandSecondaryColorChange: (color: string) => void;
  onLogoIntegrityChange: (integrity: number) => void;
  onLogoDepthChange: (depth: number) => void;
  onHeroFeatureChange: (feature: string) => void;
  onOriginMetaphorChange: (metaphor: string) => void;
  onIncludeHumanElementChange: (include: boolean) => void;
  onCharacterModeChange: (mode: 'hand-model' | 'full-body' | 'silhouette' | null) => void;
  onCharacterReferenceUrlChange: (url: string | null) => void;
  onCharacterImageUpload?: (file: File) => Promise<void>;
  onCharacterDescriptionChange: (description: string) => void;
  onCharacterAIProfileChange: (profile: CharacterAIProfile | null) => void;
  onIsGeneratingCharacterChange: (generating: boolean) => void;
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
  characterAIProfile,
  isGeneratingCharacter,
  targetAudience,
  onProductImagesChange,
  onProductImageUpload,
  onMaterialPresetChange,
  onObjectMassChange,
  onSurfaceComplexityChange,
  onRefractionEnabledChange,
  onLogoUrlChange,
  onLogoUpload,
  onBrandPrimaryColorChange,
  onBrandSecondaryColorChange,
  onLogoIntegrityChange,
  onLogoDepthChange,
  onHeroFeatureChange,
  onOriginMetaphorChange,
  onIncludeHumanElementChange,
  onCharacterModeChange,
  onCharacterReferenceUrlChange,
  onCharacterImageUpload,
  onCharacterDescriptionChange,
  onCharacterAIProfileChange,
  onIsGeneratingCharacterChange,
  onNext,
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
  const [characterName, setCharacterName] = useState("");
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
      // Use custom upload handler if provided, otherwise fallback to generic uploadFile
      if (onProductImageUpload) {
        await onProductImageUpload(key as 'heroProfile' | 'macroDetail' | 'materialReference', file);
      } else {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('workspaceId', workspaceId);
        formData.append('type', 'product-image');
        
        const result = await uploadFile(formData);
        if (result.url) {
          onProductImagesChange({ ...productImages, [key]: result.url });
        }
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
      // Use custom upload handler if provided, otherwise fallback to generic uploadFile
      if (onLogoUpload) {
        await onLogoUpload(file);
      } else {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('workspaceId', workspaceId);
        formData.append('type', 'logo');
        
        const result = await uploadFile(formData);
        if (result.url) {
          onLogoUrlChange(result.url);
        }
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
      // Use custom upload handler if provided, otherwise fallback to generic uploadFile
      if (onCharacterImageUpload) {
        await onCharacterImageUpload(file);
      } else {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('workspaceId', workspaceId);
        formData.append('type', 'character-reference');
        
        const result = await uploadFile(formData);
        if (result.url) {
          onCharacterReferenceUrlChange(result.url);
        }
      }
    } catch (error) {
      console.error('Character upload failed:', error);
    } finally {
      setUploadingCharacter(false);
    }
  };

  // AI Recommendation handler - Opens dialog with recommendations
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

  // Open character creation dialog
  const handleOpenCreateCharacter = () => {
    setShowCreateCharacter(true);
  };

  // Generate character image in dialog
  const handleGenerateCharacterImage = () => {
    onIsGeneratingCharacterChange(true);
    
    // Simulate image generation
    setTimeout(() => {
      // In real implementation, this would call an AI image generation API
      // For now, set a placeholder or use the reference image
      onIsGeneratingCharacterChange(false);
    }, 2000);
  };

  // Save character from dialog
  const handleSaveCharacter = () => {
    if (!characterName.trim()) return;

    // Generate AI profile when saving character
    const modeDescriptions: Record<string, string> = {
      'hand-model': 'Elegant hands with refined, professional aesthetics suitable for close-up product interactions',
      'full-body': 'Contemporary lifestyle model embodying aspirational brand values through natural movement',
      'silhouette': 'Abstract human form creating dramatic visual contrast and emotional resonance',
    };

    const culturalFitMap: Record<string, string> = {
      'global': 'Universal appeal with neutral styling that transcends cultural boundaries',
      'mena': 'Culturally sensitive presentation respecting regional values while maintaining modern aesthetics',
      'western': 'Bold, individualistic expression aligned with Western lifestyle marketing trends',
      'asian': 'Refined elegance with attention to aspirational luxury and quality signifiers',
    };

    // Generate identity_id from character name
    const nameSlug = characterName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 20);
    const identityId = `${nameSlug}_${Date.now().toString(36).toUpperCase().slice(-4)}`;

    // Use existing profile detailed_persona if available, otherwise use description or default
    const existingPersona = characterAIProfile?.detailed_persona;
    const detailedPersona = existingPersona 
      || (characterDescription 
        ? `${characterDescription}. ${modeDescriptions[characterMode || 'full-body']}`
        : modeDescriptions[characterMode || 'full-body'] || 'Professional talent optimized for brand storytelling');

    const profile: CharacterAIProfile = {
      identity_id: identityId,
      detailed_persona: detailedPersona,
      cultural_fit: characterAIProfile?.cultural_fit || culturalFitMap[targetAudience] || culturalFitMap['global'],
      interaction_protocol: characterAIProfile?.interaction_protocol || {
        product_engagement: characterMode === 'hand-model' 
          ? 'Gentle cradling, precise pointing, reverent handling of product'
          : characterMode === 'silhouette'
          ? 'Environmental framing, background presence, narrative support'
          : 'Natural lifestyle integration, authentic product use demonstration',
        motion_limitations: characterMode === 'hand-model'
          ? 'Wrist to fingertips only, slow deliberate movements, avoid sudden gestures'
          : characterMode === 'silhouette'
          ? 'Minimal movement, maintain form clarity, no detailed features visible'
          : 'Full range of motion, keep face visible in key shots, maintain brand alignment',
      },
      identity_locking: characterAIProfile?.identity_locking || {
        strategy: characterReferenceUrl ? 'IP-ADAPTER' : 'PROMPT-EMBEDDING',
        vfx_anchor_tags: characterMode === 'hand-model' 
          ? '@Hand_Shape, @Skin_Tone, @Nail_Style'
          : characterMode === 'silhouette'
          ? '@Body_Silhouette, @Pose_Reference'
          : '@Face_Reference, @Body_Type, @Clothing_Style',
      },
    };

    onCharacterAIProfileChange(profile);
    setShowCreateCharacter(false);
  };

  // Clear character
  const handleClearCharacter = () => {
    onCharacterModeChange(null);
    onCharacterDescriptionChange("");
    onCharacterReferenceUrlChange(null);
    onCharacterAIProfileChange(null);
    setCharacterName("");
  };

  const handleApplyRecommendation = (rec: typeof recommendations[0]) => {
    // Set mode and description
    onCharacterModeChange(rec.mode);
    onCharacterDescriptionChange(rec.description);
    
    // Generate AI profile so character card appears
    const culturalFitMap: Record<string, string> = {
      'global': 'Universal appeal with neutral styling that transcends cultural boundaries',
      'mena': 'Culturally sensitive presentation respecting regional values while maintaining modern aesthetics',
      'western': 'Bold, individualistic expression aligned with Western lifestyle marketing trends',
      'asian': 'Refined elegance with attention to aspirational luxury and quality signifiers',
    };

    const profile: CharacterAIProfile = {
      identity_id: `CHAR_${Date.now().toString(36).toUpperCase()}`,
      detailed_persona: rec.description,
      cultural_fit: culturalFitMap[targetAudience] || culturalFitMap['global'],
      interaction_protocol: {
        product_engagement: rec.mode === 'hand-model' 
          ? 'Gentle cradling, precise pointing, reverent handling of product'
          : rec.mode === 'silhouette'
          ? 'Environmental framing, background presence, narrative support'
          : 'Natural lifestyle integration, authentic product use demonstration',
        motion_limitations: rec.mode === 'hand-model'
          ? 'Wrist to fingertips only, slow deliberate movements'
          : rec.mode === 'silhouette'
          ? 'Minimal movement, maintain form clarity'
          : 'Full range of motion, keep face visible in key shots',
      },
      identity_locking: {
        strategy: 'PROMPT-EMBEDDING',
        vfx_anchor_tags: rec.mode === 'hand-model' 
          ? '@Hand_Shape, @Skin_Tone'
          : rec.mode === 'silhouette'
          ? '@Body_Silhouette, @Pose_Reference'
          : '@Face_Reference, @Body_Type',
      },
    };
    
    onCharacterAIProfileChange(profile);
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
                                onClick={() => onCharacterModeChange(
                                  characterMode === mode.value ? null : mode.value
                                )}
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

                      {/* Show Character Card if character is set */}
                      {characterAIProfile ? (
                        <div className="relative rounded-lg border border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-pink-500/5 overflow-hidden">
                          <div className="grid grid-cols-[120px,1fr] gap-3 p-3">
                            {/* Character Image */}
                            <div className="aspect-[3/4] rounded-lg bg-white/[0.03] border border-white/10 overflow-hidden flex items-center justify-center">
                              {characterReferenceUrl ? (
                                <img 
                                  src={characterReferenceUrl} 
                                  alt="Character" 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-center p-2">
                                  <User className="w-8 h-8 text-white/20 mx-auto mb-1" />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowCreateCharacter(true)}
                                    className="text-[10px] h-6 px-2 text-orange-400 hover:bg-orange-500/10"
                                  >
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Generate
                                  </Button>
                </div>
                              )}
                </div>
                            
                            {/* Character Info */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-white">
                                  {characterName || characterAIProfile.identity_id.split('_').slice(0, -1).join(' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || characterMode?.replace('-', ' ') || 'Character'}
                                </h4>
                                <Badge variant="outline" className="text-[9px] px-1.5 border-orange-500/30 text-orange-300 capitalize">
                                  {characterMode?.replace('-', ' ')}
                                </Badge>
                </div>
                              <p className="text-xs text-white/70 line-clamp-2">
                                {characterAIProfile.detailed_persona}
                              </p>
                              <p className="text-[10px] text-white/50">
                                {characterAIProfile.cultural_fit}
                              </p>
                              <div className="flex items-center gap-2 pt-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Set name from identity_id if not already set
                                    if (!characterName && characterAIProfile.identity_id) {
                                      const nameFromId = characterAIProfile.identity_id.split('_').slice(0, -1).join(' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
                                      setCharacterName(nameFromId);
                                    }
                                    setShowCreateCharacter(true);
                                  }}
                                  className="h-6 text-[10px] px-2 hover:bg-white/10 text-white/60"
                                >
                                  <Pencil className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleClearCharacter}
                                  className="h-6 text-[10px] px-2 hover:bg-red-500/10 text-white/40"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Remove
                                </Button>
                </div>
              </div>
            </div>
            </div>
                      ) : (
                        <>
                          {/* Character Description with Upload Icon */}
                          <div className="space-y-2">
                            <Label className="text-xs text-white/50">Character Description</Label>
                            <div className="relative">
                              <Textarea
                                value={characterDescription}
                                onChange={(e) => onCharacterDescriptionChange(e.target.value)}
                                placeholder="Describe the ideal talent for this campaign..."
                                className="min-h-[70px] resize-none bg-white/5 border-white/10 text-white text-sm pr-10"
                              />
                              <button
                                onClick={() => characterInputRef.current?.click()}
                                className="absolute top-2 right-2 p-1.5 rounded hover:bg-white/10 transition-colors"
                                title="Upload reference image"
                              >
                                <Upload className="w-4 h-4 text-white/40 hover:text-orange-400" />
                              </button>
          </div>
                            {characterReferenceUrl && (
                              <div className="flex items-center gap-2 p-2 rounded bg-white/[0.03] border border-white/10">
                                <img 
                                  src={characterReferenceUrl} 
                                  alt="Reference" 
                                  className="w-10 h-10 rounded object-cover"
                                />
                                <span className="text-xs text-white/60 flex-1">Reference uploaded</span>
                                <button
                                  onClick={() => onCharacterReferenceUrlChange(null)}
                                  className="p-1 hover:bg-white/10 rounded"
                                >
                                  <X className="w-3 h-3 text-white/40" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
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
                                  disabled={!characterMode}
                                  className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90 disabled:opacity-50"
                                >
                                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                                  Upload Character
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
                                  onClick={handleOpenCreateCharacter}
                                  className="text-white hover:bg-white/10"
                                >
                                  <Upload className="w-4 h-4 mr-2 text-orange-400" />
                                  Upload from Desktop
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </>
                      )}

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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CHARACTER CREATION DIALOG */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={showCreateCharacter} onOpenChange={setShowCreateCharacter}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              {characterAIProfile ? "Edit Character" : "Upload Character"}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Upload a character reference and define details for your campaign
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-[1fr,280px] gap-6 mt-4">
            {/* Left Column - Form Fields */}
            <div className="space-y-4">
              {/* Character Name - Required */}
              <div className="space-y-2">
                <Label className="text-xs text-white/50 uppercase tracking-wider">
                  Character Name*
                  <span className="text-red-400/60 ml-1">(Required)</span>
                </Label>
                <Input
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="e.g., Elegant Hands Model, Urban Lifestyle Talent..."
                  className="bg-white/5 border-white/10 text-white text-sm h-10"
                />
                <p className="text-[10px] text-white/30">
                  Used for identification in your character library
                </p>
    </div>

              {/* Character Mode Display */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/10">
                {characterMode === 'hand-model' && <Hand className="w-5 h-5 text-orange-400" />}
                {characterMode === 'full-body' && <User className="w-5 h-5 text-orange-400" />}
                {characterMode === 'silhouette' && <UserCircle2 className="w-5 h-5 text-orange-400" />}
                <div className="flex-1">
                  <p className="text-sm font-medium text-white capitalize">{characterMode?.replace('-', ' ') || 'Character'}</p>
                  <p className="text-xs text-white/50">
                    {characterMode === 'hand-model' && 'Close-up hand interactions with product'}
                    {characterMode === 'full-body' && 'Full body lifestyle model'}
                    {characterMode === 'silhouette' && 'Abstract silhouette form'}
                  </p>
                </div>
                {characterAIProfile && (
                  <Badge variant="outline" className="text-[9px] border-orange-500/30 text-orange-300">
                    {characterAIProfile.identity_id}
                  </Badge>
                )}
              </div>

              {/* Detailed Persona - Optional */}
              <div className="space-y-2">
                <Label className="text-xs text-white/50 uppercase tracking-wider">
                  Detailed Persona
                  {characterAIProfile && <span className="text-orange-400/60 ml-2">(AI Generated)</span>}
                  {!characterAIProfile && <span className="text-white/30 ml-2">(Optional)</span>}
                </Label>
                <Textarea
                  value={characterAIProfile?.detailed_persona || characterDescription}
                  onChange={(e) => {
                    if (characterAIProfile) {
                      onCharacterAIProfileChange({
                        ...characterAIProfile,
                        detailed_persona: e.target.value
                      });
                    } else {
                      onCharacterDescriptionChange(e.target.value);
                    }
                  }}
                  placeholder="Detailed physical specification: skin tone, features, build, attire, styling..."
                  rows={5}
                  className="bg-white/5 border-white/10 text-white text-sm resize-none"
                />
                <p className="text-[10px] text-white/30">
                  Be specific: skin tone, facial features, body type, clothing style, accessories
                </p>
              </div>

              {/* Cultural Fit - Show when AI profile exists */}
              {characterAIProfile && (
                <div className="space-y-2">
                  <Label className="text-xs text-white/50 uppercase tracking-wider">
                    Cultural Fit
                    <span className="text-orange-400/60 ml-2">(AI Generated)</span>
                  </Label>
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10">
                    <p className="text-xs text-white/70 leading-relaxed">
                      {characterAIProfile.cultural_fit}
                    </p>
                  </div>
                </div>
              )}

              {/* Interaction Protocol - Collapsible when AI profile exists */}
              {characterAIProfile && (
                <div className="space-y-2">
                  <Label className="text-xs text-white/50 uppercase tracking-wider">
                    Interaction Protocol
                    <span className="text-orange-400/60 ml-2">(AI Generated)</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-white/[0.03] border border-white/5">
                      <p className="text-[10px] text-white/40 mb-1">Product Engagement</p>
                      <p className="text-[10px] text-white/60 leading-relaxed">
                        {characterAIProfile.interaction_protocol.product_engagement}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-white/[0.03] border border-white/5">
                      <p className="text-[10px] text-white/40 mb-1">Motion Limits</p>
                      <p className="text-[10px] text-white/60 leading-relaxed">
                        {characterAIProfile.interaction_protocol.motion_limitations}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reference Images */}
              <div className="space-y-2">
                <Label className="text-xs text-white/50 uppercase tracking-wider">Reference Image (Optional)</Label>
                {characterReferenceUrl ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/10">
                    <img 
                      src={characterReferenceUrl} 
                      alt="Reference" 
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-white">Reference uploaded</p>
                      <p className="text-xs text-white/50">Used for identity preservation</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCharacterReferenceUrlChange(null)}
                      className="text-white/50 hover:text-white hover:bg-white/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-orange-500/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCharacterUpload(file);
                      }}
                    />
                    <Upload className="w-4 h-4 text-white/40 mb-1" />
                    <span className="text-xs text-white/50">Upload reference image</span>
                  </label>
                )}
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerateCharacterImage}
                disabled={isGeneratingCharacter || !(characterAIProfile?.detailed_persona || characterDescription).trim()}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90"
              >
                {isGeneratingCharacter ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Character Image
                  </>
                )}
              </Button>
            </div>

            {/* Right Column - Character Image Preview */}
            <div className="space-y-3">
              <Label className="text-xs text-white/50 uppercase tracking-wider">Generated Image</Label>
              <div className="aspect-[3/4] rounded-lg border border-white/10 overflow-hidden bg-white/[0.02] flex items-center justify-center">
                {characterReferenceUrl ? (
                  <img 
                    src={characterReferenceUrl} 
                    alt="Character" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6">
                    <User className="w-16 h-16 text-white/10 mx-auto mb-3" />
                    <p className="text-xs text-white/40">Generated image will appear here</p>
                  </div>
                )}
              </div>
              
              {/* Identity Strategy Badge */}
              {characterAIProfile && (
                <div className="flex items-center gap-2 p-2 rounded bg-white/[0.02] border border-white/5">
                  <Badge variant="outline" className="text-[9px] border-white/20 text-white/50">
                    {characterAIProfile.identity_locking.strategy}
                  </Badge>
                  <span className="text-[9px] text-white/30 truncate">
                    {characterAIProfile.identity_locking.vfx_anchor_tags}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-white/10">
            <Button 
              variant="ghost"
              onClick={() => setShowCreateCharacter(false)}
              className="text-white/70 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCharacter}
              disabled={!characterMode || !characterName.trim()}
              className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90"
            >
              {characterAIProfile ? "Update Character" : "Save Character"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
