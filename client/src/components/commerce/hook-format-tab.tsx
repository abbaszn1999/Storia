import { useState, useRef, useEffect } from "react";
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
  Camera,
  Sparkles as SparklesIcon,
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
  image_generation_prompt?: string; // Ready-to-use prompt for Agent 2.2b
}

interface HookFormatTabProps {
  workspaceId: string;
  videoId?: string;
  productImages: ProductImages;
  materialPreset: string;
  objectMass: number;
  surfaceComplexity: number;
  refractionEnabled: boolean;
  heroFeature: string;
  originMetaphor: string;
  includeHumanElement: boolean;
  characterMode: 'hand-model' | 'full-body' | 'silhouette' | null;
  characterDescription: string;
  characterPersona?: {
    detailed_persona: string;
    cultural_fit: string;
    interaction_protocol: {
      product_engagement: string;
      motion_limitations: string;
    };
  } | null;
  isGeneratingCharacter: boolean;
  // Removed: logoUrl, brandPrimaryColor, brandSecondaryColor, logoIntegrity, logoDepth
  // Removed: characterReferenceUrl, characterAssetId, characterAIProfile (no image generation for Sora)
  targetAudience: string;
  // Cinematography defaults
  cameraShotDefault: string | null; // null = "AI choose"
  lensDefault: string | null; // null = "AI choose"
  onProductImagesChange: (images: ProductImages) => void;
  onProductImageUpload?: (key: 'heroProfile' | 'macroDetail' | 'materialReference', file: File) => Promise<void>;
  onProductImageDelete?: (key: 'heroProfile' | 'macroDetail' | 'materialReference') => Promise<void>;
  onMaterialPresetChange: (preset: string) => void;
  onObjectMassChange: (mass: number) => void;
  onSurfaceComplexityChange: (complexity: number) => void;
  onRefractionEnabledChange: (enabled: boolean) => void;
  onHeroFeatureChange: (feature: string) => void;
  onOriginMetaphorChange: (metaphor: string) => void;
  onIncludeHumanElementChange: (include: boolean) => void;
  onCharacterModeChange: (mode: 'hand-model' | 'full-body' | 'silhouette' | null) => void;
  onCharacterDescriptionChange: (description: string) => void;
  onCharacterPersonaChange?: (persona: {
    detailed_persona: string;
    cultural_fit: string;
    interaction_protocol: {
      product_engagement: string;
      motion_limitations: string;
    };
  } | null) => void;
  onIsGeneratingCharacterChange: (generating: boolean) => void;
  // Removed: All logo-related handlers
  // Removed: characterReferenceUrl, characterImageUpload, characterDelete, characterName, characterAssetId, characterReferenceFile, characterAIProfile handlers
  onCameraShotDefaultChange: (shot: string | null) => void;
  onLensDefaultChange: (lens: string | null) => void;
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

const CAMERA_SHOT_OPTIONS = [
  { value: "wide-establishing", label: "Wide Establishing", description: "Broad context, full scene" },
  { value: "eye-level", label: "Eye Level", description: "Natural perspective" },
  { value: "low-angle", label: "Low Angle", description: "Dramatic, powerful" },
  { value: "high-angle", label: "High Angle", description: "Overview, diminutive" },
  { value: "overhead", label: "Overhead", description: "Top-down view" },
  { value: "close-up", label: "Close-Up", description: "Intimate detail" },
  { value: "medium-shot", label: "Medium Shot", description: "Balanced framing" },
  { value: "extreme-close-up", label: "Extreme Close-Up", description: "Ultra detail" },
];

const LENS_OPTIONS = [
  { value: "macro", label: "Macro", description: "Extreme detail, shallow DOF" },
  { value: "wide", label: "Wide", description: "Environmental context" },
  { value: "85mm", label: "85mm", description: "Portrait, natural" },
  { value: "telephoto", label: "Telephoto", description: "Compression, isolation" },
];

// Character Recommendation type from AI (matches backend CharacterRecommendation)
// Simplified for Sora - no image generation, persona only
interface CharacterRecommendation {
  id: string;
  name: string;
  mode: 'hand-model' | 'full-body' | 'silhouette';
  
  // Character Persona (editable by user) - Direct properties for Sora
  detailed_persona: string;       // Complete physical specification (4-6 sentences)
  cultural_fit: string;            // How character matches target audience (2-3 sentences)
  
  // Interaction Protocol (how character engages with product)
  interaction_protocol: {
    product_engagement: string;    // Technical rules for product interaction (2-4 sentences)
    motion_limitations: string;    // AI-safe movement constraints (2-4 sentences)
  };
  
  // Removed fields (not needed for Sora):
  // - character_profile (flattened to direct properties)
  // - appearance (merged into detailed_persona)
  // - identity_locking (no image generation for Sora)
}

// Fallback AI Recommendations based on audience (used if API fails)
const FALLBACK_RECOMMENDATIONS: Record<string, { mode: 'hand-model' | 'full-body' | 'silhouette'; description: string; rationale: string }[]> = {
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
  videoId,
  productImages,
  materialPreset,
  objectMass,
  surfaceComplexity,
  refractionEnabled,
  heroFeature,
  originMetaphor,
  includeHumanElement,
  characterMode,
  characterDescription,
  characterPersona,
  isGeneratingCharacter,
  targetAudience,
  onProductImagesChange,
  onProductImageUpload,
  onProductImageDelete,
  onMaterialPresetChange,
  onObjectMassChange,
  onSurfaceComplexityChange,
  onRefractionEnabledChange,
  onHeroFeatureChange,
  onOriginMetaphorChange,
  onIncludeHumanElementChange,
  onCharacterModeChange,
  onCharacterDescriptionChange,
  onCharacterPersonaChange,
  onIsGeneratingCharacterChange,
  cameraShotDefault,
  lensDefault,
  onCameraShotDefaultChange,
  onLensDefaultChange,
  onNext,
}: HookFormatTabProps) {
  // Upload states
  const [uploadingSlots, setUploadingSlots] = useState<Set<keyof ProductImages>>(new Set());
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  // Removed: uploadingLogo, uploadingCharacter, logoInputRef, characterInputRef (no logo/character image upload for Sora)

  // Dialog states
  const [showAIRecommendation, setShowAIRecommendation] = useState(false);
  // Removed: showCharacterLibrary, showCreateCharacter, showUploadCharacter, characterName (no character image upload for Sora)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<CharacterRecommendation[]>([]);
  const [aiReasoningText, setAiReasoningText] = useState<string>("");
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<CharacterRecommendation | null>(null);
  // Removed: pendingCharacterFile, pendingCharacterPreviewUrl, referenceImageFile, referenceImagePreviewUrl (no character image upload for Sora)
  // Removed: libraryCharacters, loadingLibrary, selectedLibraryCharacter (no character library for Sora)

  // Validation states
  const filledSlots = Object.values(productImages).filter(Boolean).length;
  const isImagesReady = filledSlots >= 1;
  const isMaterialSet = materialPreset !== "";
  // Removed: isBrandSet (no logo support for Sora)
  const isCastSet = !includeHumanElement || characterMode !== null;

  // Removed: Cleanup preview URLs (no character image upload for Sora)

  // Removed: Fetch characters from library (no character library for Sora)

  // Set default mode when Cast is enabled
  useEffect(() => {
    if (includeHumanElement && !characterMode) {
      onCharacterModeChange('full-body');
    }
  }, [includeHumanElement, characterMode, onCharacterModeChange]);

  // Removed: handleSelectLibraryCharacter - no character library support for Sora
  // Character is described in prompts only, no image references

  // File upload handlers
  const handleFileSelect = async (key: keyof ProductImages, file: File) => {
    setUploadingSlots(prev => {
      const newSet = new Set(prev);
      newSet.add(key);
      return newSet;
    });
    try {
      // Use custom upload handler if provided, otherwise fallback to generic uploadFile
      if (onProductImageUpload) {
        await onProductImageUpload(key as 'heroProfile' | 'macroDetail' | 'materialReference', file);
      } else {
        const result = await uploadFile(workspaceId, file);
        if (result.upload?.storageUrl) {
          onProductImagesChange({ ...productImages, [key]: result.upload.storageUrl });
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

  // Removed: handleLogoUpload (no logo support for Sora)

  // Removed: handleCharacterUpload - no character image upload for Sora

  // AI Recommendation handler - Calls backend API to generate 3 character suggestions
  // Works with: description only, reference only, both, or NEITHER (uses campaign context)
  const handleOpenAIRecommendation = async () => {
    // Validate: Mode must be selected before AI Recommend
    if (!characterMode) {
      setShowAIRecommendation(true);
      setRecommendationError('Please select a Character Mode (Hand Model, Full Body, or Silhouette) before clicking AI Recommend.');
      return;
    }

    setShowAIRecommendation(true);
    setIsAnalyzing(true);
    setAiRecommendations([]);
    setAiReasoningText("");
    setRecommendationError(null);
    
    try {
      // Removed: Reference image upload (no image upload for Sora)
      
      // Call the character recommendation API with the selected mode
      const response = await fetch(`/api/social-commerce/videos/${videoId}/characters/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          characterMode,
          character_description: characterDescription || '',
          // Removed: referenceImageUrl (no image upload for Sora)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate recommendations');
      }
      
      const data = await response.json();
      setAiRecommendations(data.recommendations || []);
      setAiReasoningText(data.reasoning || '');
      
    } catch (error) {
      console.error('[HookFormatTab] Character recommendation error:', error);
      setRecommendationError(error instanceof Error ? error.message : 'Failed to generate recommendations');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Removed: All character image generation/upload functions - no image generation for Sora

  // Clear character
  const handleClearCharacter = async () => {
    try {
      // Step 1: Update step2Data in database first
      if (videoId && videoId !== 'new') {
        const response = await fetch(`/api/social-commerce/videos/${videoId}/step/2/data`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            character: null, // Remove entire character object
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to clear from database');
        }
        
        console.log('[HookFormatTab] Cleared character from step2Data');
      }
      
      // Step 2: ONLY NOW clear frontend state (after database update succeeded)
      onCharacterModeChange(null);
      onCharacterDescriptionChange("");
      onCharacterPersonaChange?.(null);
      // Removed: handleClearReferenceImage, onCharacterAIProfileChange, setCharacterName (no image generation for Sora)
      
    } catch (error) {
      console.error('[HookFormatTab] Failed to clear character:', error);
      // Re-throw so caller knows it failed
      throw error;
    }
  };

  const handleApplyRecommendation = (rec: CharacterRecommendation) => {
    // Set mode based on recommendation
    onCharacterModeChange(rec.mode);
    
    // Build persona from recommendation (simplified for Sora - no image generation)
    const persona = {
      detailed_persona: rec.detailed_persona,
      cultural_fit: rec.cultural_fit,
      interaction_protocol: {
        product_engagement: rec.interaction_protocol.product_engagement,
        motion_limitations: rec.interaction_protocol.motion_limitations,
      },
    };
    
    // Update persona via handler
    onCharacterPersonaChange?.(persona);
    
    // Update description for display
    onCharacterDescriptionChange(rec.detailed_persona);
    
    // Close recommendation dialog
    setShowAIRecommendation(false);
    
    console.log('[HookFormatTab] Applied character recommendation:', {
      name: rec.name,
      mode: rec.mode,
      hasPersona: !!persona,
    });
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
                    iconColor="text-emerald-400"
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
                                if (onProductImageDelete) {
                                  onProductImageDelete(slot.key as 'heroProfile' | 'macroDetail' | 'materialReference');
                                } else {
                                  onProductImagesChange({ ...productImages, [slot.key]: null });
                                }
                              }}
                              className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600/80"
                              title="Delete image"
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
                  iconColor="text-emerald-400"
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
                    <p className="text-xs text-emerald-400/80">Required</p>
                  )}
                </div>

                {/* Physics Sliders */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs text-white/50">Object Mass</Label>
                      <span className="text-xs text-emerald-400">{objectMass}%</span>
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
                      <span className="text-xs text-emerald-400">{surfaceComplexity}%</span>
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
                  iconColor="text-emerald-400"
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
              <UserCircle2 className="w-5 h-5 text-orange-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                Cast DNA
              </h2>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* CINEMATOGRAPHY DEFAULTS CARD */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <div>
                      <Label className="text-xs font-semibold text-white">Cinematography Defaults</Label>
                      <p className="text-[10px] text-white/40">Set default camera preferences (can be overridden per shot)</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Camera Shot Default */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-white/50">Camera Shot</Label>
                      <button
                        onClick={() => onCameraShotDefaultChange(cameraShotDefault === null ? 'eye-level' : null)}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        {cameraShotDefault === null ? (
                          <>
                            <SparklesIcon className="w-3 h-3" />
                            AI Choose
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" />
                            Clear
                          </>
                        )}
                      </button>
                    </div>
                    <Select
                      value={cameraShotDefault || 'ai-choose'}
                      onValueChange={(value) => onCameraShotDefaultChange(value === 'ai-choose' ? null : value)}
                      disabled={cameraShotDefault === null}
                    >
                      <SelectTrigger className="h-9 bg-white/5 border-white/10 text-white text-sm">
                        <SelectValue placeholder="Select camera shot or let AI choose">
                          {cameraShotDefault === null ? 'AI Choose' : CAMERA_SHOT_OPTIONS.find(opt => opt.value === cameraShotDefault)?.label || 'Select...'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a0a] border-white/10">
                        <SelectItem value="ai-choose" className="text-white">
                          <span className="flex items-center gap-2">
                            <SparklesIcon className="w-3 h-3 text-emerald-400" />
                            AI Choose
                          </span>
                        </SelectItem>
                        {CAMERA_SHOT_OPTIONS.map((shot) => (
                          <SelectItem key={shot.value} value={shot.value} className="text-white">
                            <div>
                              <div className="font-medium">{shot.label}</div>
                              <div className="text-[10px] text-white/50">{shot.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Lens Default */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-white/50">Lens</Label>
                      <button
                        onClick={() => onLensDefaultChange(lensDefault === null ? '85mm' : null)}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        {lensDefault === null ? (
                          <>
                            <SparklesIcon className="w-3 h-3" />
                            AI Choose
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" />
                            Clear
                          </>
                        )}
                      </button>
                    </div>
                    <Select
                      value={lensDefault || 'ai-choose'}
                      onValueChange={(value) => onLensDefaultChange(value === 'ai-choose' ? null : value)}
                      disabled={lensDefault === null}
                    >
                      <SelectTrigger className="h-9 bg-white/5 border-white/10 text-white text-sm">
                        <SelectValue placeholder="Select lens or let AI choose">
                          {lensDefault === null ? 'AI Choose' : LENS_OPTIONS.find(opt => opt.value === lensDefault)?.label || 'Select...'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a0a] border-white/10">
                        <SelectItem value="ai-choose" className="text-white">
                          <span className="flex items-center gap-2">
                            <SparklesIcon className="w-3 h-3 text-emerald-400" />
                            AI Choose
                          </span>
                        </SelectItem>
                        {LENS_OPTIONS.map((lens) => (
                          <SelectItem key={lens.value} value={lens.value} className="text-white">
                            <div>
                              <div className="font-medium">{lens.label}</div>
                              <div className="text-[10px] text-white/50">{lens.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* Removed: BRAND IDENTITY CARD - no logo support for Sora */}
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
                    iconColor="text-emerald-400"
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
                          <p className="text-xs text-emerald-400/80">Select a character mode</p>
                        )}
      </div>

                      {/* Character selection state - show description input or persona editing */}
                      {!characterPersona ? (
                        <>
                          {/* Character Description (Optional - for AI recommendations) */}
                          <div className="space-y-2">
                            <Label className="text-xs text-white/50">Character Description (Optional)</Label>
                            <Textarea
                              value={characterDescription}
                              onChange={(e) => onCharacterDescriptionChange(e.target.value)}
                              placeholder="Describe the ideal talent for this campaign (optional - helps AI recommendations)..."
                              className="min-h-[70px] resize-none bg-white/5 border-white/10 text-white text-sm"
                            />
                            <p className="text-[10px] text-white/30">
                              This helps AI generate better character recommendations. Leave empty to let AI decide.
                            </p>
                          </div>

                          {/* Action Buttons - AI Recommend and Manual Creation */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleOpenAIRecommendation}
                              disabled={!characterMode}
                              className="flex-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 hover:border-emerald-500/50 disabled:opacity-50"
                            >
                              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                              AI Recommend
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Create empty persona structure
                                onCharacterPersonaChange?.({
                                  detailed_persona: "",
                                  cultural_fit: "",
                                  interaction_protocol: {
                                    product_engagement: "",
                                    motion_limitations: "",
                                  },
                                });
                              }}
                              disabled={!characterMode}
                              className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 disabled:opacity-50"
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1.5" />
                              Create Manually
                            </Button>
                          </div>
                        </>
                      ) : null}

                      {/* Persona Editing (shown after recommendation selection) */}
                      {characterPersona && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4 pt-4 border-t border-white/10"
                        >
                          <div className="flex items-center justify-between">
                            <Label className="text-xs uppercase tracking-wider font-semibold text-white/70">
                              Character Persona (Editable)
                            </Label>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px] px-1.5 border-orange-500/30 text-orange-300">
                                {characterMode?.replace('-', ' ')}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  onCharacterPersonaChange?.(null);
                                  onCharacterDescriptionChange("");
                                }}
                                className="h-6 px-2 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label className="text-xs text-white/50">Detailed Persona</Label>
                              <Textarea
                                value={characterPersona.detailed_persona}
                                onChange={(e) => onCharacterPersonaChange?.({
                                  ...characterPersona,
                                  detailed_persona: e.target.value
                                })}
                                placeholder="Physical specification, age, skin tone, build, style..."
                                className="min-h-[100px] resize-none bg-white/5 border-white/10 text-white text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs text-white/50">Cultural Fit</Label>
                              <Textarea
                                value={characterPersona.cultural_fit}
                                onChange={(e) => onCharacterPersonaChange?.({
                                  ...characterPersona,
                                  cultural_fit: e.target.value
                                })}
                                placeholder="How character matches target audience..."
                                className="min-h-[60px] resize-none bg-white/5 border-white/10 text-white text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs text-white/50">Product Engagement</Label>
                              <Textarea
                                value={characterPersona.interaction_protocol.product_engagement}
                                onChange={(e) => onCharacterPersonaChange?.({
                                  ...characterPersona,
                                  interaction_protocol: {
                                    ...characterPersona.interaction_protocol,
                                    product_engagement: e.target.value
                                  }
                                })}
                                placeholder="How character interacts with product..."
                                className="min-h-[60px] resize-none bg-white/5 border-white/10 text-white text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs text-white/50">Motion Limitations</Label>
                              <Textarea
                                value={characterPersona.interaction_protocol.motion_limitations}
                                onChange={(e) => onCharacterPersonaChange?.({
                                  ...characterPersona,
                                  interaction_protocol: {
                                    ...characterPersona.interaction_protocol,
                                    motion_limitations: e.target.value
                                  }
                                })}
                                placeholder="Movement constraints for Sora..."
                                className="min-h-[60px] resize-none bg-white/5 border-white/10 text-white text-sm"
                              />
                            </div>
                          </div>

                          <p className="text-[10px] text-white/30 italic">
                            These persona details will be used to describe the character in Sora video prompts. Edit as needed.
                          </p>
                        </motion.div>
                      )}
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
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* AI RECOMMENDATION DIALOG */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={showAIRecommendation} onOpenChange={setShowAIRecommendation}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              AI Character Recommendations
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {aiReasoningText ? (
                <span>{aiReasoningText}</span>
              ) : (
                <span>Based on your campaign context and target audience: <span className="text-orange-400 font-semibold capitalize">{targetAudience?.replace('-', ' ') || "Not set"}</span></span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 text-orange-400 animate-spin mb-4" />
                <p className="text-sm text-white/60">Generating character recommendations...</p>
                <p className="text-xs text-white/40 mt-2">This may take 10-15 seconds</p>
              </div>
            ) : recommendationError ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                  <X className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-sm text-red-400 text-center">{recommendationError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowAIRecommendation(false)}
                >
                  Close
                </Button>
              </div>
            ) : aiRecommendations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-white/50">No recommendations generated yet.</p>
                <p className="text-xs text-white/30 mt-2">Provide a description or reference image to get started.</p>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {aiRecommendations.map((rec, index) => (
                  <Card key={rec.id} className={`bg-white/[0.02] border-white/[0.06] overflow-hidden hover:border-orange-500/30 transition-colors ${
                    index === 0 ? 'border-orange-500/50 bg-orange-500/5' : ''
                  }`}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-white">{rec.name}</h4>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-500/20 border-orange-500/50 text-orange-300 capitalize">
                                {rec.mode.replace('-', ' ')}
                              </Badge>
                              {index === 0 && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                                  Aspirational
                                </Badge>
                              )}
                              {index === 1 && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-blue-500/80 text-white">
                                  Relatable
                                </Badge>
                              )}
                              {index === 2 && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/80 text-white">
                                  Distinctive
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-white/50 capitalize">{rec.mode.replace('-', ' ')}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleApplyRecommendation(rec)}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90 shrink-0"
                          >
                            Select
                          </Button>
                        </div>
                        
                        {/* Detailed Persona Preview */}
                        <div className="text-sm text-white/70 line-clamp-3">{rec.detailed_persona}</div>
                        
                        {/* Cultural Fit */}
                        <div className="bg-white/[0.02] rounded p-2 border border-white/5">
                          <p className="text-[11px] text-white/50 mb-1 font-medium">Why This Works:</p>
                          <p className="text-xs text-white/60">{rec.cultural_fit}</p>
                        </div>
                        
                        {/* Interaction Protocol Preview */}
                        <div className="space-y-1">
                          <p className="text-[10px] text-white/40 font-medium">Product Engagement:</p>
                          <p className="text-xs text-white/50 line-clamp-2">{rec.interaction_protocol.product_engagement}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Removed: CHARACTER LIBRARY DIALOG - no character image upload for Sora */}
      {/* Removed: SIMPLE CHARACTER UPLOAD DIALOG - no character image upload for Sora */}
      {/* Removed: AI CHARACTER CREATION DIALOG - no image generation for Sora */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
    </motion.div>
  );
}
