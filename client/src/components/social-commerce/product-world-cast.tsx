import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Check, 
  Plus, 
  Upload, 
  X, 
  User, 
  Hand,
  UserCircle,
  Mic,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings2
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
  { id: "none", name: "None", color: null },
  { id: "minimal", name: "Minimal", color: "from-gray-400 to-gray-600" },
  { id: "lifestyle", name: "Lifestyle", color: "from-amber-400 to-orange-500" },
  { id: "dynamic", name: "Dynamic", color: "from-red-400 to-rose-600" },
  { id: "flatlay", name: "Flat Lay", color: "from-teal-400 to-cyan-600" },
  { id: "studio", name: "Studio Pro", color: "from-slate-500 to-slate-700" },
  { id: "natural", name: "Natural", color: "from-green-400 to-emerald-600" },
  { id: "dramatic", name: "Dramatic", color: "from-purple-500 to-violet-700" },
  { id: "editorial", name: "Editorial", color: "from-pink-400 to-fuchsia-600" },
];

const BACKDROP_OPTIONS = [
  { id: "white-studio", name: "White Studio" },
  { id: "colored-backdrop", name: "Colored" },
  { id: "lifestyle-indoor", name: "Indoor Scene" },
  { id: "lifestyle-outdoor", name: "Outdoor" },
  { id: "gradient", name: "Gradient" },
  { id: "textured", name: "Textured" },
];

const PRODUCT_DISPLAY_OPTIONS = [
  { id: "hero", name: "Hero Shot" },
  { id: "closeup", name: "Close-up" },
  { id: "in-use", name: "In Use" },
  { id: "unboxing", name: "Unboxing" },
  { id: "360", name: "360° View" },
  { id: "scale", name: "Scale" },
  { id: "ingredients", name: "Features" },
];

const TALENT_TYPES = [
  { id: "none", name: "No Talent", icon: User },
  { id: "hands", name: "Hands Only", icon: Hand },
  { id: "lifestyle", name: "Lifestyle Model", icon: UserCircle },
  { id: "spokesperson", name: "Spokesperson", icon: Mic },
];

const IMAGE_MODELS = [
  { id: "imagen-4", name: "Imagen 4" },
  { id: "dall-e-3", name: "DALL-E 3" },
  { id: "flux-pro", name: "Flux Pro" },
  { id: "midjourney", name: "Midjourney" },
];

const VIDEO_MODELS = [
  { id: "kling", name: "Kling" },
  { id: "veo", name: "Veo 2" },
  { id: "runway", name: "Runway Gen-3" },
  { id: "pika", name: "Pika" },
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
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
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
    <div className="space-y-8">
      {/* World Settings Section */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-6">World Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Image AI Model */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">IMAGE AI MODEL</Label>
              <Select value={imageModel} onValueChange={onImageModelChange}>
                <SelectTrigger className="h-9" data-testid="select-image-model">
                  <SelectValue placeholder="Select image model" />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Video AI Model */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">VIDEO AI MODEL</Label>
              <Select value={videoModel} onValueChange={onVideoModelChange}>
                <SelectTrigger className="h-9" data-testid="select-video-model">
                  <SelectValue placeholder="Select video model" />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Style Reference */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">STYLE REFERENCE</Label>
              <div className="space-y-2">
                {styleReference ? (
                  <div className="relative aspect-video rounded-lg border bg-muted">
                    <div className="absolute inset-0 rounded-lg overflow-hidden">
                      <img src={styleReference} alt="Style Reference" className="h-full w-full object-cover" />
                    </div>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 left-2 h-6 w-6 z-10"
                      onClick={handleRemoveStyleReference}
                      data-testid="button-remove-style-ref"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed rounded-lg cursor-pointer hover-elevate">
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
                    <Upload className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Upload Image</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {/* Image Instructions */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">IMAGE GENERATION INSTRUCTIONS</Label>
              <Textarea
                placeholder="Describe the visual style, lighting, and mood for product images... (e.g., soft studio lighting, clean white background, subtle shadows)"
                value={imageInstructions}
                onChange={(e) => onImageInstructionsChange(e.target.value)}
                rows={3}
                data-testid="input-image-instructions"
              />
            </div>

            {/* Photography Style */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">STYLE</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {PHOTOGRAPHY_STYLES.map((style) => (
                  <Card
                    key={style.id}
                    className={`cursor-pointer transition-all hover-elevate relative group overflow-hidden ${
                      visualStyle === style.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => onVisualStyleChange(style.id)}
                    data-testid={`style-${style.id}`}
                  >
                    <CardContent className="p-0">
                      <div className="relative">
                        <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                          {style.color ? (
                            <div className={`w-full h-full bg-gradient-to-br ${style.color}`} />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-background/50" />
                          )}
                        </div>
                        {visualStyle === style.id && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-5 w-5 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-2 text-center bg-card">
                        <p className="text-xs font-medium leading-tight">{style.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* AI Generation Settings - Collapsible */}
            <Collapsible
              open={isAiSettingsOpen}
              onOpenChange={setIsAiSettingsOpen}
              className="mt-6"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-dashed hover:border-solid hover:bg-muted/50"
                  data-testid="button-toggle-ai-settings"
                >
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Video Generation Settings</span>
                    {videoInstructions && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Configured
                      </span>
                    )}
                  </div>
                  {isAiSettingsOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <p className="text-xs text-muted-foreground">
                  These instructions will be appended to every video generation request.
                </p>

                {/* Video Generation Instructions */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">VIDEO / ANIMATION INSTRUCTIONS</Label>
                  <Textarea
                    placeholder="E.g., 'Smooth camera movements, product rotation, subtle zooms, seamless transitions, professional product video feel'"
                    value={videoInstructions}
                    onChange={(e) => onVideoInstructionsChange(e.target.value)}
                    rows={3}
                    className="text-sm"
                    data-testid="input-video-instructions"
                  />
                  <p className="text-xs text-muted-foreground">
                    Motion and animation guidelines applied to all video generations
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      {/* Product Settings Section */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-6">Product Settings</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Backdrop */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">BACKDROP / ENVIRONMENT</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BACKDROP_OPTIONS.map((option) => (
                  <Card
                    key={option.id}
                    className={`cursor-pointer transition-all hover-elevate p-3 ${
                      backdrop === option.id ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => onBackdropChange(option.id)}
                    data-testid={`backdrop-${option.id}`}
                  >
                    <div className="flex items-center gap-2">
                      {backdrop === option.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                      <span className="text-xs font-medium">{option.name}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Shot Types */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">SHOT TYPES (Select all that apply)</Label>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_DISPLAY_OPTIONS.map((option) => {
                  const isSelected = productDisplay.includes(option.id);
                  return (
                    <Card
                      key={option.id}
                      className={`cursor-pointer transition-all hover-elevate px-3 py-2 ${
                        isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleToggleProductDisplay(option.id)}
                      data-testid={`display-${option.id}`}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                        <span className="text-xs font-medium">{option.name}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
              {productDisplay.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {productDisplay.length} shot type{productDisplay.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Talent Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Talent / Models</h3>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TALENT_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.id}
                className={`cursor-pointer transition-all hover-elevate relative group overflow-hidden ${
                  talentType === type.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onTalentTypeChange(type.id)}
                data-testid={`talent-type-${type.id}`}
              >
                <CardContent className="p-0">
                  <div className="relative">
                    <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                      <Icon className={`h-10 w-10 ${talentType === type.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    {talentType === type.id && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-5 w-5 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-2 text-center bg-card">
                    <p className="text-xs font-medium leading-tight">{type.name}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Talent List */}
        {talentType !== "none" && (
          <>
            {talents.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <User className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    No talent added yet. Add models or presenters for your product video.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {talents.map((talent) => {
                  const TalentIcon = getTalentTypeIcon(talent.type);
                  return (
                    <Card key={talent.id} className="relative overflow-hidden group" data-testid={`talent-${talent.id}`}>
                      <CardContent className="p-0">
                        <div className="aspect-[3/4] bg-muted flex items-center justify-center relative">
                          {talent.imageUrl ? (
                            <img src={talent.imageUrl} alt={talent.name} className="h-full w-full object-cover" />
                          ) : (
                            <TalentIcon className="h-16 w-16 text-muted-foreground" />
                          )}
                          
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

                          {/* Type badge */}
                          <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded capitalize">
                            {talent.type}
                          </div>
                        </div>
                        
                        {/* Info */}
                        <div className="p-3 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0">
                          <p className="text-sm font-semibold text-white">{talent.name}</p>
                          {talent.description && (
                            <p className="text-xs text-white/80 line-clamp-1">{talent.description}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Additional Instructions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Additional Instructions</h3>
          <Textarea
            placeholder="Add any specific instructions that apply to the entire video... (e.g., 'Maintain consistent warm lighting throughout, keep brand colors prominent, use smooth transitions between shots')"
            value={additionalInstructions}
            onChange={(e) => onAdditionalInstructionsChange(e.target.value)}
            rows={3}
            data-testid="input-additional-instructions"
          />
        </CardContent>
      </Card>

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleContinue} data-testid="button-continue-world">
          Continue to Scene Breakdown
        </Button>
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
