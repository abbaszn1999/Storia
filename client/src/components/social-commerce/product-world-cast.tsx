import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Check, 
  Plus, 
  Upload, 
  X, 
  User, 
  Camera, 
  Box,
  Sparkles,
  MapPin,
  Image,
  Layers,
  Hand,
  UserCircle,
  Mic,
  Pencil,
  Trash2,
  Wand2,
  Video,
  ChevronRight,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductWorldCastProps {
  videoId: string;
  workspaceId: string;
  productPhotos: string[];
  visualStyle: string;
  backdrop: string;
  productDisplay: string[];
  talentType: string;
  talents: Talent[];
  styleReference: string | null;
  additionalInstructions: string;
  imageModel: string;
  videoModel: string;
  imageInstructions: string;
  videoInstructions: string;
  onVisualStyleChange: (style: string) => void;
  onBackdropChange: (backdrop: string) => void;
  onProductDisplayChange: (displays: string[]) => void;
  onTalentTypeChange: (type: string) => void;
  onTalentsChange: (talents: Talent[]) => void;
  onStyleReferenceChange: (ref: string | null) => void;
  onAdditionalInstructionsChange: (instructions: string) => void;
  onImageModelChange: (model: string) => void;
  onVideoModelChange: (model: string) => void;
  onImageInstructionsChange: (instructions: string) => void;
  onVideoInstructionsChange: (instructions: string) => void;
  onNext: () => void;
}

interface Talent {
  id: string;
  name: string;
  type: "hands" | "lifestyle" | "spokesperson";
  description: string;
  imageUrl: string | null;
}

const PHOTOGRAPHY_STYLES = [
  { id: "minimal", name: "Minimal", description: "Clean, uncluttered focus" },
  { id: "lifestyle", name: "Lifestyle", description: "Real-world context" },
  { id: "dynamic", name: "Dynamic", description: "Movement & energy" },
  { id: "flatlay", name: "Flat Lay", description: "Top-down arrangement" },
  { id: "studio", name: "Studio Pro", description: "Professional lighting" },
  { id: "natural", name: "Natural", description: "Soft, organic feel" },
  { id: "dramatic", name: "Dramatic", description: "Bold contrasts" },
  { id: "editorial", name: "Editorial", description: "Magazine style" },
];

const BACKDROP_OPTIONS = [
  { id: "white-studio", name: "White Studio", description: "Clean white background" },
  { id: "colored-backdrop", name: "Colored", description: "Solid color backdrop" },
  { id: "lifestyle-indoor", name: "Indoor Scene", description: "Interior setting" },
  { id: "lifestyle-outdoor", name: "Outdoor", description: "Natural environment" },
  { id: "gradient", name: "Gradient", description: "Smooth color transition" },
  { id: "textured", name: "Textured", description: "Surface with texture" },
];

const PRODUCT_DISPLAY_OPTIONS = [
  { id: "hero", name: "Hero Shot", description: "Primary beauty shot" },
  { id: "closeup", name: "Close-up", description: "Detail & texture focus" },
  { id: "in-use", name: "In Use", description: "Product demonstration" },
  { id: "unboxing", name: "Unboxing", description: "Packaging reveal" },
  { id: "360", name: "360° View", description: "Multi-angle rotation" },
  { id: "scale", name: "Scale", description: "Size comparison" },
  { id: "ingredients", name: "Features", description: "Component breakdown" },
];

const TALENT_TYPES = [
  { id: "none", name: "No Talent", description: "Product-only focus", icon: Box },
  { id: "hands", name: "Hands Only", description: "Hand interaction", icon: Hand },
  { id: "lifestyle", name: "Lifestyle Model", description: "Full model", icon: UserCircle },
  { id: "spokesperson", name: "Spokesperson", description: "Presenter", icon: Mic },
];

const IMAGE_MODELS = [
  { id: "imagen-4", name: "Imagen 4", description: "Google's latest - photorealistic" },
  { id: "dall-e-3", name: "DALL-E 3", description: "OpenAI - creative & detailed" },
  { id: "flux-pro", name: "Flux Pro", description: "Fast & high quality" },
  { id: "midjourney", name: "Midjourney", description: "Artistic & stylized" },
];

const VIDEO_MODELS = [
  { id: "kling", name: "Kling", description: "Realistic motion & physics" },
  { id: "veo", name: "Veo 2", description: "Google's cinematic AI" },
  { id: "runway", name: "Runway Gen-3", description: "Creative control" },
  { id: "pika", name: "Pika", description: "Quick & stylized" },
];

export function ProductWorldCast({
  videoId,
  workspaceId,
  productPhotos,
  visualStyle,
  backdrop,
  productDisplay,
  talentType,
  talents,
  styleReference,
  additionalInstructions,
  imageModel,
  videoModel,
  imageInstructions,
  videoInstructions,
  onVisualStyleChange,
  onBackdropChange,
  onProductDisplayChange,
  onTalentTypeChange,
  onTalentsChange,
  onStyleReferenceChange,
  onAdditionalInstructionsChange,
  onImageModelChange,
  onVideoModelChange,
  onImageInstructionsChange,
  onVideoInstructionsChange,
  onNext,
}: ProductWorldCastProps) {
  const [isAddTalentOpen, setIsAddTalentOpen] = useState(false);
  const [editingTalent, setEditingTalent] = useState<Talent | null>(null);
  const [newTalent, setNewTalent] = useState({ name: "", description: "", type: "lifestyle" as Talent["type"] });
  const [talentImage, setTalentImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleToggleProductDisplay = (displayId: string) => {
    if (productDisplay.includes(displayId)) {
      onProductDisplayChange(productDisplay.filter(d => d !== displayId));
    } else {
      onProductDisplayChange([...productDisplay, displayId]);
    }
  };

  const handleUploadStyleReference = (file: File) => {
    const url = URL.createObjectURL(file);
    onStyleReferenceChange(url);
    toast({
      title: "Reference Uploaded",
      description: "Style reference image added.",
    });
  };

  const handleRemoveStyleReference = () => {
    onStyleReferenceChange(null);
  };

  const handleUploadTalentImage = (file: File) => {
    const url = URL.createObjectURL(file);
    setTalentImage(url);
  };

  const handleSaveTalent = () => {
    if (!newTalent.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a talent name.",
        variant: "destructive",
      });
      return;
    }

    if (editingTalent) {
      const updated = talents.map(t => 
        t.id === editingTalent.id 
          ? { ...t, name: newTalent.name, description: newTalent.description, type: newTalent.type, imageUrl: talentImage || t.imageUrl }
          : t
      );
      onTalentsChange(updated);
      toast({
        title: "Talent Updated",
        description: `${newTalent.name} has been updated.`,
      });
    } else {
      const talent: Talent = {
        id: `talent-${Date.now()}`,
        name: newTalent.name,
        description: newTalent.description,
        type: newTalent.type,
        imageUrl: talentImage,
      };
      onTalentsChange([...talents, talent]);
      toast({
        title: "Talent Added",
        description: `${talent.name} has been added.`,
      });
    }

    setNewTalent({ name: "", description: "", type: "lifestyle" });
    setTalentImage(null);
    setEditingTalent(null);
    setIsAddTalentOpen(false);
  };

  const handleEditTalent = (talent: Talent) => {
    setEditingTalent(talent);
    setNewTalent({ name: talent.name, description: talent.description, type: talent.type });
    setTalentImage(talent.imageUrl);
    setIsAddTalentOpen(true);
  };

  const handleDeleteTalent = (talentId: string) => {
    onTalentsChange(talents.filter(t => t.id !== talentId));
    toast({
      title: "Talent Removed",
      description: "Talent has been removed from the video.",
    });
  };

  const handleContinue = () => {
    if (!imageModel) {
      toast({
        title: "Image Model Required",
        description: "Please select an AI model for image generation.",
        variant: "destructive",
      });
      return;
    }
    if (!videoModel) {
      toast({
        title: "Video Model Required",
        description: "Please select an AI model for video generation.",
        variant: "destructive",
      });
      return;
    }
    if (!visualStyle) {
      toast({
        title: "Visual Style Required",
        description: "Please select a photography style for your product video.",
        variant: "destructive",
      });
      return;
    }
    if (productDisplay.length === 0) {
      toast({
        title: "Product Display Required",
        description: "Please select at least one product display type.",
        variant: "destructive",
      });
      return;
    }
    onNext();
  };

  const getTalentTypeIcon = (type: Talent["type"]) => {
    switch (type) {
      case "hands": return Hand;
      case "lifestyle": return UserCircle;
      case "spokesperson": return Mic;
      default: return User;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">World & Cast</h2>
        <p className="text-muted-foreground">
          Define the visual style, environment, and presentation for your product video.
        </p>
      </div>

      <div className="space-y-6">
        {/* AI Generation Models */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">AI Generation</h3>
                <p className="text-sm text-muted-foreground">Select AI models and provide custom instructions</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Image Generation */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Image Generation</Label>
                </div>
                
                <Select value={imageModel} onValueChange={onImageModelChange}>
                  <SelectTrigger data-testid="select-image-model">
                    <SelectValue placeholder="Select image model" />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col">
                          <span>{model.name}</span>
                          <span className="text-xs text-muted-foreground">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Textarea
                  placeholder="Custom image instructions... (e.g., 'Ensure product colors are accurate, use soft shadows, maintain brand aesthetic')"
                  value={imageInstructions}
                  onChange={(e) => onImageInstructionsChange(e.target.value)}
                  rows={3}
                  className="text-sm"
                  data-testid="input-image-instructions"
                />
              </div>

              {/* Video Generation */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Video Generation</Label>
                </div>
                
                <Select value={videoModel} onValueChange={onVideoModelChange}>
                  <SelectTrigger data-testid="select-video-model">
                    <SelectValue placeholder="Select video model" />
                  </SelectTrigger>
                  <SelectContent>
                    {VIDEO_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col">
                          <span>{model.name}</span>
                          <span className="text-xs text-muted-foreground">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Textarea
                  placeholder="Custom video instructions... (e.g., 'Smooth camera motion, subtle product rotation, cinematic transitions')"
                  value={videoInstructions}
                  onChange={(e) => onVideoInstructionsChange(e.target.value)}
                  rows={3}
                  className="text-sm"
                  data-testid="input-video-instructions"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visual Style */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Visual Style</h3>
                <p className="text-sm text-muted-foreground">Choose the photography style for your product</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PHOTOGRAPHY_STYLES.map((style) => {
                const isSelected = visualStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => onVisualStyleChange(style.id)}
                    className={`relative p-4 rounded-lg border text-left transition-all hover-elevate ${
                      isSelected 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    data-testid={`style-${style.id}`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                    <p className="font-medium text-sm">{style.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{style.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Style Reference */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Style Reference</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload an image to match your desired visual style
                  </p>
                </div>
                
                {styleReference ? (
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-lg border overflow-hidden">
                      <img src={styleReference} alt="Style Reference" className="h-full w-full object-cover" />
                    </div>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={handleRemoveStyleReference}
                      data-testid="button-remove-style-ref"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadStyleReference(file);
                      }}
                      data-testid="input-upload-style-ref"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                  </label>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environment & Display - Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Backdrop */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Environment</h3>
                  <p className="text-sm text-muted-foreground">Background setting</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {BACKDROP_OPTIONS.map((option) => {
                  const isSelected = backdrop === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onBackdropChange(option.id)}
                      className={`p-3 rounded-lg border text-left transition-all hover-elevate ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      data-testid={`backdrop-${option.id}`}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                        <span className="text-sm font-medium">{option.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Product Display */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Image className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Shot Types</h3>
                  <p className="text-sm text-muted-foreground">Select all that apply</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {PRODUCT_DISPLAY_OPTIONS.map((option) => {
                  const isSelected = productDisplay.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleToggleProductDisplay(option.id)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all hover-elevate ${
                        isSelected 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      data-testid={`display-${option.id}`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                      <span className="font-medium">{option.name}</span>
                    </button>
                  );
                })}
              </div>

              {productDisplay.length > 0 && (
                <p className="text-xs text-muted-foreground mt-4">
                  {productDisplay.length} shot type{productDisplay.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Talent Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Talent</h3>
                  <p className="text-sm text-muted-foreground">Human presence in your video</p>
                </div>
              </div>

              {talentType !== "none" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingTalent(null);
                    setNewTalent({ name: "", description: "", type: talentType === "hands" ? "hands" : talentType === "spokesperson" ? "spokesperson" : "lifestyle" });
                    setTalentImage(null);
                    setIsAddTalentOpen(true);
                  }}
                  data-testid="button-add-talent"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Talent
                </Button>
              )}
            </div>

            {/* Talent Type Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {TALENT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = talentType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => onTalentTypeChange(type.id)}
                    className={`relative p-4 rounded-lg border text-center transition-all hover-elevate ${
                      isSelected 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    data-testid={`talent-type-${type.id}`}
                  >
                    <Icon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="font-medium text-sm">{type.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Talent List */}
            {talentType !== "none" && (
              <>
                {talents.length === 0 ? (
                  <div className="border border-dashed rounded-lg p-8 text-center">
                    <User className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No talent added yet. Add models or presenters for your video.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {talents.map((talent) => {
                      const TalentIcon = getTalentTypeIcon(talent.type);
                      return (
                        <div 
                          key={talent.id} 
                          className="relative group rounded-lg border overflow-hidden"
                          data-testid={`talent-${talent.id}`}
                        >
                          <div className="aspect-[3/4] bg-muted flex items-center justify-center">
                            {talent.imageUrl ? (
                              <img src={talent.imageUrl} alt={talent.name} className="h-full w-full object-cover" />
                            ) : (
                              <TalentIcon className="h-12 w-12 text-muted-foreground" />
                            )}
                          </div>
                          
                          {/* Overlay with info */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 pt-8">
                            <Badge variant="secondary" className="mb-2 text-xs capitalize">
                              {talent.type}
                            </Badge>
                            <p className="text-sm font-medium text-white">{talent.name}</p>
                            {talent.description && (
                              <p className="text-xs text-white/70 line-clamp-1">{talent.description}</p>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-7 w-7"
                              onClick={() => handleEditTalent(talent)}
                              data-testid={`button-edit-talent-${talent.id}`}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-7 w-7"
                              onClick={() => handleDeleteTalent(talent.id)}
                              data-testid={`button-delete-talent-${talent.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Additional Instructions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Additional Instructions</h3>
                <p className="text-sm text-muted-foreground">General guidance for the entire video</p>
              </div>
            </div>

            <Textarea
              placeholder="Add any specific instructions that apply to the entire video... (e.g., 'Maintain consistent warm lighting throughout, keep brand colors prominent, use smooth transitions between shots')"
              value={additionalInstructions}
              onChange={(e) => onAdditionalInstructionsChange(e.target.value)}
              rows={3}
              className="text-sm"
              data-testid="input-additional-instructions"
            />
          </CardContent>
        </Card>

        {/* Continue Button */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>Visual style and at least one shot type are required</span>
          </div>
          <Button onClick={handleContinue} data-testid="button-continue-world">
            Continue to Breakdown
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add/Edit Talent Dialog */}
      <Dialog open={isAddTalentOpen} onOpenChange={setIsAddTalentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTalent ? "Edit Talent" : "Add Talent"}</DialogTitle>
            <DialogDescription>
              {editingTalent ? "Update talent details" : "Add a model or presenter for your video"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Talent Image */}
            <div className="flex justify-center">
              {talentImage ? (
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-border">
                    <img src={talentImage} alt="Talent" className="h-full w-full object-cover" />
                  </div>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                    onClick={() => setTalentImage(null)}
                    data-testid="button-remove-talent-image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-32 h-32 rounded-full border-2 border-dashed cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadTalentImage(file);
                    }}
                    data-testid="input-upload-talent-image"
                  />
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Photo</span>
                </label>
              )}
            </div>

            {/* Talent Name */}
            <div className="space-y-2">
              <Label htmlFor="talent-name">Name</Label>
              <Input
                id="talent-name"
                placeholder="Enter talent name"
                value={newTalent.name}
                onChange={(e) => setNewTalent({ ...newTalent, name: e.target.value })}
                data-testid="input-talent-name"
              />
            </div>

            {/* Talent Type */}
            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={newTalent.type} 
                onValueChange={(value) => setNewTalent({ ...newTalent, type: value as Talent["type"] })}
              >
                <SelectTrigger data-testid="select-talent-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hands">Hands Only</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle Model</SelectItem>
                  <SelectItem value="spokesperson">Spokesperson</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="talent-desc">Description (optional)</Label>
              <Textarea
                id="talent-desc"
                placeholder="Brief description of the talent..."
                value={newTalent.description}
                onChange={(e) => setNewTalent({ ...newTalent, description: e.target.value })}
                rows={2}
                data-testid="input-talent-description"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddTalentOpen(false);
                  setEditingTalent(null);
                  setNewTalent({ name: "", description: "", type: "lifestyle" });
                  setTalentImage(null);
                }}
                data-testid="button-cancel-talent"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveTalent} data-testid="button-save-talent">
                {editingTalent ? "Update" : "Add"} Talent
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
