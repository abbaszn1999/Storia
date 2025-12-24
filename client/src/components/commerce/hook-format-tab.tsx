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
  characterAssetId?: string | null;
  characterDescription: string;
  characterAIProfile: CharacterAIProfile | null;
  isGeneratingCharacter: boolean;
  targetAudience: string;
  onProductImagesChange: (images: ProductImages) => void;
  onProductImageUpload?: (key: 'heroProfile' | 'macroDetail' | 'materialReference', file: File) => Promise<void>;
  onProductImageDelete?: (key: 'heroProfile' | 'macroDetail' | 'materialReference') => Promise<void>;
  onMaterialPresetChange: (preset: string) => void;
  onObjectMassChange: (mass: number) => void;
  onSurfaceComplexityChange: (complexity: number) => void;
  onRefractionEnabledChange: (enabled: boolean) => void;
  onLogoUrlChange: (url: string | null) => void;
  onLogoUpload?: (file: File) => Promise<void>;
  onLogoDelete?: () => Promise<void>;
  onBrandPrimaryColorChange: (color: string) => void;
  onBrandSecondaryColorChange: (color: string) => void;
  onLogoIntegrityChange: (integrity: number) => void;
  onLogoDepthChange: (depth: number) => void;
  onHeroFeatureChange: (feature: string) => void;
  onOriginMetaphorChange: (metaphor: string) => void;
  onIncludeHumanElementChange: (include: boolean) => void;
  onCharacterModeChange: (mode: 'hand-model' | 'full-body' | 'silhouette' | null) => void;
  onCharacterReferenceUrlChange: (url: string | null) => void;
  onCharacterImageUpload?: (file: File, name?: string, description?: string) => Promise<void>;
  onCharacterDelete?: () => Promise<void>;
  onCharacterDescriptionChange: (description: string) => void;
  onCharacterNameChange?: (name: string) => void;
  onCharacterAssetIdChange?: (assetId: string | null) => void;
  onCharacterReferenceFileChange?: (file: File | null) => void;
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

// Character Recommendation type from AI (matches backend CharacterRecommendation)
interface CharacterRecommendation {
  id: string;
  name: string;
  mode: 'hand-model' | 'full-body' | 'silhouette';
  
  // Full character profile (for VFX consistency)
  character_profile: {
    identity_id: string;
    detailed_persona: string;
    cultural_fit: string;
  };
  
  // Visual profile (for UI display)
  appearance: {
    age_range: string;
    skin_tone: string;
    build: string;
    style_notes: string;
  };
  
  // Interaction rules
  interaction_protocol: {
    product_engagement: string;
    motion_limitations: string;
  };
  
  // VFX identity locking strategy
  identity_locking: {
    strategy: 'IP_ADAPTER_STRICT' | 'PROMPT_EMBEDDING' | 'SEED_CONSISTENCY' | 'COMBINED';
    vfx_anchor_tags: string[];
    reference_image_required: boolean;
  };
  
  // NOTE: image_generation_prompt and thumbnail_prompt removed - Agent 2.2b constructs prompts algorithmically
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
  characterAssetId,
  characterDescription,
  characterAIProfile,
  isGeneratingCharacter,
  targetAudience,
  onProductImagesChange,
  onProductImageUpload,
  onProductImageDelete,
  onMaterialPresetChange,
  onObjectMassChange,
  onSurfaceComplexityChange,
  onRefractionEnabledChange,
  onLogoUrlChange,
  onLogoUpload,
  onLogoDelete,
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
  onCharacterDelete,
  onCharacterDescriptionChange,
  onCharacterNameChange,
  onCharacterAssetIdChange,
  onCharacterReferenceFileChange,
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
  const [showUploadCharacter, setShowUploadCharacter] = useState(false);
  const [characterName, setCharacterName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<CharacterRecommendation[]>([]);
  const [aiReasoningText, setAiReasoningText] = useState<string>("");
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<CharacterRecommendation | null>(null);
  const [pendingCharacterFile, setPendingCharacterFile] = useState<File | null>(null);
  const [pendingCharacterPreviewUrl, setPendingCharacterPreviewUrl] = useState<string | null>(null);
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  const [referenceImagePreviewUrl, setReferenceImagePreviewUrl] = useState<string | null>(null);
  
  // Library characters state
  const [libraryCharacters, setLibraryCharacters] = useState<any[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [selectedLibraryCharacter, setSelectedLibraryCharacter] = useState<any | null>(null);

  // Validation states
  const filledSlots = Object.values(productImages).filter(Boolean).length;
  const isImagesReady = filledSlots >= 1;
  const isMaterialSet = materialPreset !== "";
  const isBrandSet = logoUrl !== null || (brandPrimaryColor && brandSecondaryColor);
  const isCastSet = !includeHumanElement || characterMode !== null;

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (pendingCharacterPreviewUrl) {
        URL.revokeObjectURL(pendingCharacterPreviewUrl);
      }
      if (referenceImagePreviewUrl) {
        URL.revokeObjectURL(referenceImagePreviewUrl);
      }
    };
  }, [pendingCharacterPreviewUrl, referenceImagePreviewUrl]);

  // Fetch characters from library when dialog opens
  useEffect(() => {
    const fetchLibraryCharacters = async () => {
      if (!showCharacterLibrary || !workspaceId) return;
      
      setLoadingLibrary(true);
      try {
        const response = await fetch(`/api/characters?workspaceId=${workspaceId}`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const characters = await response.json();
          setLibraryCharacters(characters);
        } else {
          console.error('Failed to fetch characters');
          setLibraryCharacters([]);
        }
      } catch (error) {
        console.error('Error fetching library characters:', error);
        setLibraryCharacters([]);
      } finally {
        setLoadingLibrary(false);
      }
    };

    fetchLibraryCharacters();
  }, [showCharacterLibrary, workspaceId]);

  // Set default mode when Cast is enabled
  useEffect(() => {
    if (includeHumanElement && !characterMode) {
      onCharacterModeChange('full-body');
    }
  }, [includeHumanElement, characterMode, onCharacterModeChange]);

  // Handle selecting a character from the library
  const handleSelectLibraryCharacter = async (character: any) => {
    setSelectedLibraryCharacter(character);
    
    // Populate the character reference URL and mode
    onCharacterReferenceUrlChange(character.imageUrl || null);
    onCharacterModeChange(character.characterType || 'full-body');
    
    // Update character name if available
    if (onCharacterNameChange && character.name) {
      onCharacterNameChange(character.name);
    }
    
    // Update description if available
    if (character.description) {
      onCharacterDescriptionChange(character.description);
    }
    
    // If the character has an existing AI profile in metadata, use it
    if (character.metadata && character.metadata.aiProfile) {
      onCharacterAIProfileChange(character.metadata.aiProfile);
    } else {
      // Create a minimal profile for library characters
      const profile = {
        identity_id: character.name?.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 20) + '_LIB' || 'LIBRARY_CHARACTER',
        character_name: character.name || 'Library Character',
        detailed_persona: character.description || 'Character from library',
        cultural_fit: 'Previously created character',
        interaction_protocol: {
          product_relationship: 'Library character interaction',
          gesture_vocabulary: ['@Natural_Movement'],
          forbidden_actions: ['@None'],
        },
        identity_locking: {
          strategy: 'IP_ADAPTER_STRICT' as const,
          vfx_anchor_tags: ['@Character_Reference'],
          reference_image_required: true,
        },
      };
      onCharacterAIProfileChange(profile);
    }
    
    // Close the library dialog
    setShowCharacterLibrary(false);
    
    // Save to step2Data using the EXISTING character ID (no new upload)
    // Call the parent's handler to save to step2Data with character.id as assetId
    if (onCharacterImageUpload && character.name) {
      // Create a fake File object just to trigger the save flow
      // The parent will save character.id as the assetId
      console.log('[HookFormatTab] Applying library character:', {
        id: character.id,
        name: character.name,
        imageUrl: character.imageUrl,
      });
      
      // We need to notify the parent to save this to step2Data
      // Since we're using an existing character, we need a different approach
      // Let's call the save directly here
      try {
        const response = await fetch(`/api/social-commerce/videos/${videoId}/step/2/data`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            character: {
              referenceUrl: character.imageUrl,
              assetId: character.id, // ✅ Use existing character ID
              name: character.name,
              mode: character.characterType || 'full-body',
              description: character.description || '',
            },
          }),
        });
        
        if (response.ok) {
          console.log('[HookFormatTab] Library character saved to step2Data');
        }
      } catch (error) {
        console.error('[HookFormatTab] Failed to save library character:', error);
      }
    }
  };

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

  const handleCharacterUpload = async (file: File, isFromUploadDialog = false) => {
    // If this is from the upload dialog, just store the file and create a preview
    if (isFromUploadDialog) {
      // Clean up old preview URL if exists
      if (pendingCharacterPreviewUrl) {
        URL.revokeObjectURL(pendingCharacterPreviewUrl);
      }
      
      // Create new preview URL
      const previewUrl = URL.createObjectURL(file);
      setPendingCharacterFile(file);
      setPendingCharacterPreviewUrl(previewUrl);
      return;
    }
    
    // Otherwise, this is a reference image for AI generation - store temporarily
    // Clean up old reference preview URL if exists
    if (referenceImagePreviewUrl) {
      URL.revokeObjectURL(referenceImagePreviewUrl);
    }
    
    // Create new preview URL for reference
    const previewUrl = URL.createObjectURL(file);
    setReferenceImageFile(file);
    setReferenceImagePreviewUrl(previewUrl);
    onCharacterReferenceUrlChange(previewUrl); // Show in UI but it's a local URL
    
    // Notify parent about the file (so it can be uploaded when Continue is clicked)
    if (onCharacterReferenceFileChange) {
      onCharacterReferenceFileChange(file);
    }
  };

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
      // If there's a reference image file, upload it temporarily first
      let referenceUrl: string | null = null;
      if (referenceImageFile) {
        // Upload reference image temporarily to Bunny CDN for AI analysis
        const formData = new FormData();
        formData.append('file', referenceImageFile);
        formData.append('category', 'style'); // Use style category for temp uploads
        formData.append('workspaceId', workspaceId || '');
        formData.append('videoId', videoId || '');
        
        const uploadResponse = await fetch('/api/social-commerce/upload-temp', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          referenceUrl = uploadData.cdnUrl;
        }
      }
      
      // Call the character recommendation API with the selected mode
      const response = await fetch(`/api/social-commerce/videos/${videoId}/characters/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          characterMode,
          character_description: characterDescription || '',
          referenceImageUrl: referenceUrl,
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

  // Open simple upload dialog (no AI generation)
  const handleOpenUploadCharacter = () => {
    setCharacterName("");
    setShowUploadCharacter(true);
  };

  // Open full character creation dialog (with AI profile for generation)
  const handleOpenCreateCharacter = () => {
    setShowCreateCharacter(true);
  };

  // Generate character image in dialog - calls Agent 2.2b
  const handleGenerateCharacterImage = async () => {
    if (!videoId) {
      console.error('[HookFormatTab] Cannot generate character image: No videoId');
      return;
    }
    
    onIsGeneratingCharacterChange(true);
    
    try {
      // ═══════════════════════════════════════════════════════════════════════
      // BUILD RECOMMENDATION OBJECT FOR AGENT 2.2b
      // ═══════════════════════════════════════════════════════════════════════
      
      let recommendation: CharacterRecommendation | null = null;
      
      if (selectedRecommendation) {
        // Use the full recommendation from Agent 2.2a (new format)
        recommendation = selectedRecommendation;
        console.log('[HookFormatTab] Using selected recommendation from Agent 2.2a:', {
          id: recommendation.id,
          name: recommendation.name,
          mode: recommendation.mode,
          strategy: recommendation.identity_locking.strategy,
        });
      } else if (characterAIProfile && characterMode) {
        // Construct recommendation from legacy CharacterAIProfile (backward compatibility)
        // This happens when user manually creates character without using AI Recommend
        recommendation = {
          id: `LEGACY_${characterAIProfile.identity_id}`,
          name: characterName || characterAIProfile.identity_id.split('_').slice(0, -1).join(' '),
          mode: characterMode as 'hand-model' | 'full-body' | 'silhouette',
          character_profile: {
            identity_id: characterAIProfile.identity_id,
            detailed_persona: characterAIProfile.detailed_persona,
            cultural_fit: characterAIProfile.cultural_fit,
          },
          appearance: {
            age_range: '25-35', // Default - not in legacy format
            skin_tone: 'warm', // Default - not in legacy format
            build: 'athletic', // Default - not in legacy format
            style_notes: characterAIProfile.detailed_persona.substring(0, 100), // Extract from persona
          },
          interaction_protocol: {
            product_engagement: characterAIProfile.interaction_protocol.product_engagement,
            motion_limitations: characterAIProfile.interaction_protocol.motion_limitations || 'Standard motion constraints',
          },
          identity_locking: {
            strategy: (characterAIProfile.identity_locking.strategy as any) || 'PROMPT_EMBEDDING',
            vfx_anchor_tags: Array.isArray(characterAIProfile.identity_locking.vfx_anchor_tags)
              ? characterAIProfile.identity_locking.vfx_anchor_tags
              : (characterAIProfile.identity_locking.vfx_anchor_tags || '').split(', ').filter(Boolean),
            reference_image_required: characterAIProfile.identity_locking.reference_image_required || false,
          },
        };
        console.log('[HookFormatTab] Constructed recommendation from legacy CharacterAIProfile:', {
          id: recommendation.id,
          name: recommendation.name,
          mode: recommendation.mode,
        });
      } else {
        throw new Error('Cannot generate character image: No recommendation or AI profile available');
      }
      
      // Get reference image URL - use Bunny CDN URL if available, otherwise upload new file
      // Runware accepts public URLs directly, so we prefer Bunny CDN URLs over base64
      let referenceImageUrl: string | null = null;
      
      // First, check if we already have a Bunny CDN URL (from previously uploaded character)
      if (characterReferenceUrl && characterReferenceUrl.startsWith('https://')) {
        // Already a public URL - use it directly (Runware accepts public URLs)
        referenceImageUrl = characterReferenceUrl;
        console.log('[HookFormatTab] Using existing Bunny CDN URL for reference image');
      } else if (referenceImageFile) {
        // New file - upload to Bunny CDN first to get a public URL
        try {
          const formData = new FormData();
          formData.append('file', referenceImageFile);
          formData.append('category', 'style'); // Temporary upload for reference
          formData.append('workspaceId', workspaceId || '');
          formData.append('videoId', videoId || '');
          
          const uploadResponse = await fetch('/api/social-commerce/upload-temp', {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            referenceImageUrl = uploadData.cdnUrl; // Use Bunny CDN URL (public URL)
            console.log('[HookFormatTab] Reference image uploaded to Bunny CDN:', {
              cdnUrl: uploadData.cdnUrl.substring(0, 80) + '...',
              fileSize: `${(referenceImageFile.size / 1024).toFixed(2)}KB`,
            });
          } else {
            throw new Error('Failed to upload reference image to Bunny CDN');
          }
        } catch (error) {
          console.error('[HookFormatTab] Failed to upload reference image, falling back to base64:', error);
          // Fallback: convert to base64 if upload fails (for blob URLs or if Bunny is unavailable)
          try {
            const reader = new FileReader();
            referenceImageUrl = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(referenceImageFile);
            });
            console.log('[HookFormatTab] Reference image converted to base64 (fallback)');
          } catch (base64Error) {
            console.error('[HookFormatTab] Failed to convert reference image to base64:', base64Error);
            // Continue without reference image
          }
        }
      }
      
      console.log('[HookFormatTab] Generating character image with Agent 2.2b...', {
        videoId,
        recommendationId: recommendation.id,
        recommendationName: recommendation.name,
        mode: recommendation.mode,
        strategy: recommendation.identity_locking.strategy,
        hasReference: !!referenceImageUrl,
        referenceFormat: referenceImageUrl?.startsWith('data:') ? 'data-uri' : 
                        referenceImageUrl?.startsWith('https://') ? 'bunny-cdn-url' : 'none',
      });
      
      const response = await fetch(`/api/social-commerce/videos/${videoId}/characters/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recommendation, // Send full recommendation object (Agent 2.2b constructs prompt from this)
          referenceImageUrl, // Optional reference image (Bunny CDN URL or base64 data URI) for IP_ADAPTER_STRICT or COMBINED strategies
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate character image');
      }
      
      const data = await response.json();
      
      if (data.imageUrl) {
        // Set the generated image URL (now from Bunny CDN)
        onCharacterReferenceUrlChange(data.imageUrl);
        
        // If assetId is returned, update parent state and save to step2Data
        if (data.assetId) {
          // Update parent's asset ID state immediately
          if (onCharacterAssetIdChange) {
            onCharacterAssetIdChange(data.assetId);
          }
          
          // Also update character name if available (from recommendation)
          if (onCharacterNameChange && recommendation) {
            onCharacterNameChange(recommendation.name);
          }
          
          // Save to step2Data (backend already does this, but ensure it's synced)
          if (videoId && videoId !== 'new' && recommendation) {
            try {
              await fetch(`/api/social-commerce/videos/${videoId}/step/2/data`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  character: {
                    referenceUrl: data.imageUrl,
                    assetId: data.assetId,
                    name: recommendation.name,
                  },
                }),
              });
              console.log('[HookFormatTab] Character asset saved to step2Data:', data.assetId);
            } catch (saveError) {
              console.error('[HookFormatTab] Failed to save character asset to step2Data:', saveError);
            }
          }
        }
        
        console.log('[HookFormatTab] Character image generated successfully:', {
          imageUrl: data.imageUrl.substring(0, 50) + '...',
          assetId: data.assetId,
        });
      } else {
        throw new Error('No image URL returned from generation');
      }
      
    } catch (error) {
      console.error('[HookFormatTab] Character image generation error:', error);
      // Could show a toast here if we had access to toast
    } finally {
      onIsGeneratingCharacterChange(false);
    }
  };

  // Save simple uploaded character (just name + image)
  const handleSaveUploadedCharacter = async () => {
    if (!characterName.trim() || !pendingCharacterFile) return;

    setUploadingCharacter(true);
    try {
      // Clear library character selection (this is a new upload, not from library)
      setSelectedLibraryCharacter(null);
      
      // Upload the file with the character name the user entered
      if (onCharacterImageUpload) {
        await onCharacterImageUpload(pendingCharacterFile, characterName.trim(), '');
      }

      // For uploaded characters, create a minimal AI profile
      const profile: CharacterAIProfile = {
        identity_id: characterName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 20) + '_' + Date.now().toString(36).toUpperCase().slice(-4),
        detailed_persona: `Custom uploaded character: ${characterName}`,
        cultural_fit: 'Custom character provided by user',
        interaction_protocol: {
          product_engagement: 'User-defined character interaction',
          motion_limitations: 'Follows uploaded reference',
        },
        identity_locking: {
          strategy: 'IP-ADAPTER',
          vfx_anchor_tags: '@Custom_Reference',
        },
      };

      onCharacterAIProfileChange(profile);
      
      // Update parent's character name
      if (onCharacterNameChange) {
        onCharacterNameChange(characterName.trim());
      }
      
      // Clean up
      if (pendingCharacterPreviewUrl) {
        URL.revokeObjectURL(pendingCharacterPreviewUrl);
      }
      setPendingCharacterFile(null);
      setPendingCharacterPreviewUrl(null);
      setShowUploadCharacter(false);
      setCharacterName("");
    } catch (error) {
      console.error('Character save failed:', error);
    } finally {
      setUploadingCharacter(false);
    }
  };

  // Save character from AI generation dialog
  const handleSaveCharacter = () => {
    if (!characterName.trim()) return;

    // Clear library character selection (this is a new AI-generated character)
    setSelectedLibraryCharacter(null);

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

  // Clear reference image
  const handleClearReferenceImage = () => {
    onCharacterReferenceUrlChange(null);
    
    // Clean up temporary reference image
    if (referenceImagePreviewUrl) {
      URL.revokeObjectURL(referenceImagePreviewUrl);
    }
    setReferenceImageFile(null);
    setReferenceImagePreviewUrl(null);
    
    // Notify parent that reference file is cleared
    if (onCharacterReferenceFileChange) {
      onCharacterReferenceFileChange(null);
    }
  };

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
      handleClearReferenceImage();
      onCharacterAIProfileChange(null);
      setCharacterName("");
      
    } catch (error) {
      console.error('[HookFormatTab] Failed to clear character:', error);
      // Re-throw so caller knows it failed
      throw error;
    }
  };

  const handleApplyRecommendation = (rec: CharacterRecommendation) => {
    // Clear library character selection (this is a new AI recommendation)
    setSelectedLibraryCharacter(null);
    
    // Store the full recommendation for image generation
    setSelectedRecommendation(rec);
    
    // Set mode and description based on recommendation
    onCharacterModeChange(rec.mode);
    
    // Build detailed description from the recommendation's detailed_persona
    const detailedDescription = rec.character_profile.detailed_persona;
    onCharacterDescriptionChange(detailedDescription);
    
    // Set character name
    setCharacterName(rec.name);

    // Use the complete AI profile from the recommendation (already has all VFX data)
    const profile: CharacterAIProfile = {
      identity_id: rec.character_profile.identity_id,
      detailed_persona: rec.character_profile.detailed_persona,
      cultural_fit: rec.character_profile.cultural_fit,
      interaction_protocol: {
        product_engagement: rec.interaction_protocol.product_engagement,
        motion_limitations: rec.interaction_protocol.motion_limitations,
      },
      identity_locking: {
        strategy: rec.identity_locking.strategy,
        vfx_anchor_tags: rec.identity_locking.vfx_anchor_tags.join(', '),
      },
      image_generation_prompt: rec.image_generation_prompt, // Include the ready-to-use prompt
    };
    
    onCharacterAIProfileChange(profile);
    setShowAIRecommendation(false);
    
    // Now open the creation dialog to generate image and finalize
    setShowCreateCharacter(true);
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
                            if (onLogoDelete) {
                              onLogoDelete();
                            } else {
                              onLogoUrlChange(null);
                            }
                          }}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600/80"
                          title="Delete logo"
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
                                  onClick={() => {
                                    // Check if this character exists in the library by comparing asset IDs
                                    const isLibraryCharacter = characterAssetId && 
                                      libraryCharacters.some(char => char.id === characterAssetId);
                                    
                                    if (isLibraryCharacter) {
                                      // Library character: just unlink from video (keep in Assets)
                                      console.log('[HookFormatTab] Removing library character from video, keeping in Assets');
                                      handleClearCharacter();
                                      setSelectedLibraryCharacter(null);
                                    } else if (onCharacterDelete && characterAssetId) {
                                      // New uploaded/generated character: delete from Assets and Bunny
                                      console.log('[HookFormatTab] Deleting character from Assets and Bunny');
                                      onCharacterDelete();
                                    } else {
                                      // No asset yet (e.g. AI recommendation not saved): just clear state
                                      console.log('[HookFormatTab] Clearing unsaved character');
                                      handleClearCharacter();
                                    }
                                  }}
                                  className="h-6 text-[10px] px-2 hover:bg-red-500/10 text-white/40 hover:text-red-400"
                                  title={characterAssetId && libraryCharacters.some(char => char.id === characterAssetId) 
                                    ? "Remove character from video" 
                                    : characterAssetId 
                                    ? "Delete character from Assets"
                                    : "Clear character"}
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
                                <span className="text-xs text-white/60 flex-1">Reference image</span>
                                <button
                                  onClick={handleClearReferenceImage}
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
                                  onClick={handleOpenUploadCharacter}
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
        <DialogContent className="bg-[#0a0a0a] border-white/10 max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-orange-400" />
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
                                <Badge className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white">
                                  Aspirational
                                </Badge>
                              )}
                              {index === 1 && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-blue-500/80 text-white">
                                  Relatable
                                </Badge>
                              )}
                              {index === 2 && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-purple-500/80 text-white">
                                  Distinctive
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-white/50">{rec.appearance.age_range} • {rec.appearance.build}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleApplyRecommendation(rec)}
                            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90 shrink-0"
                          >
                            Select
                          </Button>
                        </div>
                        
                        {/* Appearance Details */}
                        <div className="text-sm text-white/70">{rec.appearance.style_notes}</div>
                        
                        {/* Skin Tone */}
                        <div className="text-xs text-white/50">
                          <span className="text-white/40">Skin Tone:</span> {rec.appearance.skin_tone}
                        </div>
                        
                        {/* Cultural Fit */}
                        <div className="bg-white/[0.02] rounded p-2 border border-white/5">
                          <p className="text-[11px] text-white/50 mb-1 font-medium">Why This Works:</p>
                          <p className="text-xs text-white/60">{rec.character_profile.cultural_fit}</p>
                        </div>
                        
                        {/* VFX Tags */}
                        <div className="flex flex-wrap gap-1">
                          {rec.identity_locking.vfx_anchor_tags.slice(0, 4).map((tag, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded text-white/40">
                              {tag}
                            </span>
                          ))}
                          {rec.identity_locking.vfx_anchor_tags.length > 4 && (
                            <span className="text-[9px] px-1.5 py-0.5 text-white/30">
                              +{rec.identity_locking.vfx_anchor_tags.length - 4} more
                            </span>
                          )}
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
      {/* CHARACTER LIBRARY DIALOG */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={showCharacterLibrary} onOpenChange={setShowCharacterLibrary}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white">Character Library</DialogTitle>
            <DialogDescription className="text-white/60">
              Choose from your previously created character references
            </DialogDescription>
          </DialogHeader>

          {loadingLibrary ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-white/40 mx-auto mb-3 animate-spin" />
              <p className="text-white/50">Loading your characters...</p>
            </div>
          ) : libraryCharacters.length === 0 ? (
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
                  handleOpenUploadCharacter();
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Character
              </Button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-2">
                {libraryCharacters.map((character) => (
                  <Card
                    key={character.id}
                    className={`bg-[#0f0f0f] border-white/10 hover:border-orange-500/50 cursor-pointer transition-all ${
                      selectedLibraryCharacter?.id === character.id ? 'border-orange-500 ring-1 ring-orange-500/50' : ''
                    }`}
                    onClick={() => handleSelectLibraryCharacter(character)}
                  >
                    <div className="aspect-square relative overflow-hidden rounded-t-lg">
                      {character.imageUrl ? (
                        <img
                          src={character.imageUrl}
                          alt={character.name || 'Character'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                          <UserCircle2 className="w-12 h-12 text-white/20" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="text-white font-medium text-sm truncate">
                        {character.name || 'Unnamed Character'}
                      </h4>
                      {character.description && (
                        <p className="text-white/50 text-xs mt-1 line-clamp-2">
                          {character.description}
                        </p>
                      )}
                      {character.characterType && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {character.characterType.replace('-', ' ')}
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SIMPLE CHARACTER UPLOAD DIALOG */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={showUploadCharacter} onOpenChange={setShowUploadCharacter}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Upload Character from Desktop</DialogTitle>
            <DialogDescription className="text-white/60">
              Upload your character image and provide a name for your library
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-[1fr,200px] gap-6 mt-4">
            {/* Left Column - Form */}
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
                  placeholder="e.g., Professional Model, Brand Ambassador..."
                  className="bg-white/5 border-white/10 text-white text-sm h-10"
                />
                <p className="text-[10px] text-white/30">
                  This name will appear in your character assets library
                </p>
              </div>

              {/* Character Mode Display */}
              {characterMode && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/10">
                  {characterMode === 'hand-model' && <Hand className="w-5 h-5 text-orange-400" />}
                  {characterMode === 'full-body' && <User className="w-5 h-5 text-orange-400" />}
                  {characterMode === 'silhouette' && <UserCircle2 className="w-5 h-5 text-orange-400" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white capitalize">{characterMode.replace('-', ' ')}</p>
                    <p className="text-xs text-white/50">
                      {characterMode === 'hand-model' && 'Close-up hand interactions'}
                      {characterMode === 'full-body' && 'Full body presence'}
                      {characterMode === 'silhouette' && 'Silhouette form'}
                    </p>
                  </div>
                </div>
              )}

              {/* Upload Area */}
              <div className="space-y-2">
                <Label className="text-xs text-white/50 uppercase tracking-wider">Character Image*</Label>
                {pendingCharacterPreviewUrl ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-green-500/30">
                    <img 
                      src={pendingCharacterPreviewUrl} 
                      alt="Uploaded" 
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-white">Image selected</p>
                      <p className="text-xs text-white/50">Ready to save</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (pendingCharacterPreviewUrl) {
                          URL.revokeObjectURL(pendingCharacterPreviewUrl);
                        }
                        setPendingCharacterFile(null);
                        setPendingCharacterPreviewUrl(null);
                      }}
                      className="text-white/50 hover:text-white hover:bg-white/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-orange-500/50 transition-colors bg-white/[0.02]">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCharacterUpload(file, true);
                      }}
                    />
                    <Upload className="w-8 h-8 text-white/40 mb-2" />
                    <span className="text-sm text-white/60">Click to upload character image</span>
                    <span className="text-xs text-white/40 mt-1">PNG, JPG up to 10MB</span>
                  </label>
                )}
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-3">
              <Label className="text-xs text-white/50 uppercase tracking-wider">Preview</Label>
              <div className="aspect-[3/4] rounded-lg border border-white/10 overflow-hidden bg-white/[0.02] flex items-center justify-center">
                {pendingCharacterPreviewUrl ? (
                  <img 
                    src={pendingCharacterPreviewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <User className="w-12 h-12 text-white/10 mx-auto mb-2" />
                    <p className="text-xs text-white/40">Preview will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={() => {
                // Clean up preview URL
                if (pendingCharacterPreviewUrl) {
                  URL.revokeObjectURL(pendingCharacterPreviewUrl);
                }
                setPendingCharacterFile(null);
                setPendingCharacterPreviewUrl(null);
                setShowUploadCharacter(false);
                setCharacterName("");
              }}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveUploadedCharacter}
              disabled={!characterName.trim() || !pendingCharacterFile || uploadingCharacter}
              className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90 disabled:opacity-50"
            >
              {uploadingCharacter ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Apply Character
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* AI CHARACTER CREATION DIALOG (For Generated Characters) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={showCreateCharacter} onOpenChange={setShowCreateCharacter}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-400" />
                {characterAIProfile ? "Finalize AI Generated Character" : "Generate Character"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Review AI-generated character details and generate the image
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
                      onClick={handleClearReferenceImage}
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
