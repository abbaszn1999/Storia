import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Trash2
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
  imageModel: string;
  imageInstructions: string;
  videoInstructions: string;
  onVisualStyleChange: (style: string) => void;
  onBackdropChange: (backdrop: string) => void;
  onProductDisplayChange: (displays: string[]) => void;
  onTalentTypeChange: (type: string) => void;
  onTalentsChange: (talents: Talent[]) => void;
  onStyleReferenceChange: (ref: string | null) => void;
  onImageModelChange: (model: string) => void;
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
  { id: "none", name: "No Talent", icon: User, description: "Product only, no human presence" },
  { id: "hands", name: "Hands Only", icon: Hand, description: "Show hands interacting with product" },
  { id: "lifestyle", name: "Lifestyle Model", icon: UserCircle, description: "Model using product naturally" },
  { id: "spokesperson", name: "Spokesperson", icon: Mic, description: "Presenter speaking to camera" },
];

const IMAGE_MODELS = [
  { id: "imagen-4", name: "Imagen 4" },
  { id: "dall-e-3", name: "DALL-E 3" },
  { id: "flux-pro", name: "Flux Pro" },
  { id: "midjourney", name: "Midjourney" },
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
  imageModel,
  imageInstructions,
  videoInstructions,
  onVisualStyleChange,
  onBackdropChange,
  onProductDisplayChange,
  onTalentTypeChange,
  onTalentsChange,
  onStyleReferenceChange,
  onImageModelChange,
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div className="mt-6 space-y-6">
            {/* Image Generation Instructions */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">IMAGE GENERATION INSTRUCTIONS</Label>
              <Textarea
                placeholder="Describe the visual style, lighting, and mood for product images... (e.g., soft studio lighting, clean white background, subtle shadows)"
                value={imageInstructions}
                onChange={(e) => onImageInstructionsChange(e.target.value)}
                rows={3}
                data-testid="input-image-instructions"
              />
              <p className="text-xs text-muted-foreground">
                Style guidelines applied to all image generations
              </p>
            </div>

            {/* Video Generation Instructions */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">VIDEO / ANIMATION INSTRUCTIONS</Label>
              <Textarea
                placeholder="E.g., 'Smooth camera movements, product rotation, subtle zooms, seamless transitions, professional product video feel'"
                value={videoInstructions}
                onChange={(e) => onVideoInstructionsChange(e.target.value)}
                rows={3}
                data-testid="input-video-instructions"
              />
              <p className="text-xs text-muted-foreground">
                Motion and animation guidelines applied to all video generations
              </p>
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
          </div>
        </CardContent>
      </Card>

      {/* Product Settings Section - Compact inline layout */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-6">Product Settings</h3>

          <div className="space-y-6">
            {/* Backdrop - Inline select */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Label className="text-sm font-medium shrink-0 sm:w-40">BACKDROP</Label>
              <Select value={backdrop} onValueChange={onBackdropChange}>
                <SelectTrigger className="max-w-xs" data-testid="select-backdrop">
                  <SelectValue placeholder="Select backdrop" />
                </SelectTrigger>
                <SelectContent>
                  {BACKDROP_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Shot Types - Compact badge chips */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">SHOT TYPES</Label>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_DISPLAY_OPTIONS.map((option) => {
                  const isSelected = productDisplay.includes(option.id);
                  return (
                    <Badge
                      key={option.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer px-3 py-1.5 text-sm ${
                        isSelected ? '' : 'hover:bg-muted'
                      }`}
                      onClick={() => handleToggleProductDisplay(option.id)}
                      data-testid={`display-${option.id}`}
                    >
                      {isSelected && <Check className="h-3 w-3 mr-1.5" />}
                      {option.name}
                    </Badge>
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

      {/* Talent Section - Clean selection cards */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Talent / Models</h3>
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

          {/* Talent Type Selection - Horizontal compact cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {TALENT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = talentType === type.id;
              return (
                <div
                  key={type.id}
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover-elevate ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'
                  }`}
                  onClick={() => onTalentTypeChange(type.id)}
                  data-testid={`talent-type-${type.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>{type.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{type.description}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Talent List */}
          {talentType !== "none" && (
            <>
              {talents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg">
                  <User className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    No talent added yet. Click "Add Talent" to add models or presenters.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {talents.map((talent) => {
                    const TalentIcon = getTalentTypeIcon(talent.type);
                    return (
                      <div 
                        key={talent.id} 
                        className="flex items-center gap-4 p-3 rounded-lg border bg-card"
                        data-testid={`talent-${talent.id}`}
                      >
                        {/* Avatar */}
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                          {talent.imageUrl ? (
                            <img src={talent.imageUrl} alt={talent.name} className="h-full w-full object-cover" />
                          ) : (
                            <TalentIcon className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{talent.name}</p>
                            <Badge variant="secondary" className="text-xs capitalize">
                              {talent.type === "hands" ? "Hands" : talent.type === "spokesperson" ? "Presenter" : "Model"}
                            </Badge>
                          </div>
                          {talent.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{talent.description}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditTalent(talent)}
                            data-testid={`button-edit-talent-${talent.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteTalent(talent.id)}
                            data-testid={`button-delete-talent-${talent.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
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
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border">
                    <img src={talentImage} alt="Talent" className="h-full w-full object-cover" />
                  </div>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
                    onClick={() => setTalentImage(null)}
                    data-testid="button-remove-talent-image"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-24 h-24 rounded-full border-2 border-dashed cursor-pointer hover:border-primary/50 transition-colors">
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
                  <Upload className="h-5 w-5 text-muted-foreground mb-1" />
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
