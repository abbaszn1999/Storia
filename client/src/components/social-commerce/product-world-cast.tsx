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
  Trash2
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  onVisualStyleChange: (style: string) => void;
  onBackdropChange: (backdrop: string) => void;
  onProductDisplayChange: (displays: string[]) => void;
  onTalentTypeChange: (type: string) => void;
  onTalentsChange: (talents: Talent[]) => void;
  onStyleReferenceChange: (ref: string | null) => void;
  onAdditionalInstructionsChange: (instructions: string) => void;
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
  { id: "minimal", name: "Minimal / Clean", description: "Simple, uncluttered with focus on product" },
  { id: "lifestyle", name: "Lifestyle", description: "Product in real-world context" },
  { id: "dynamic", name: "Dynamic Action", description: "Movement and energy" },
  { id: "flatlay", name: "Flat Lay", description: "Top-down product arrangement" },
  { id: "studio", name: "Studio Pro", description: "Professional studio lighting" },
  { id: "natural", name: "Natural Light", description: "Soft, organic feel" },
  { id: "dramatic", name: "Dramatic", description: "Bold shadows and contrast" },
  { id: "editorial", name: "Editorial", description: "Magazine-style presentation" },
];

const BACKDROP_OPTIONS = [
  { id: "white-studio", name: "White Studio", icon: Box },
  { id: "colored-backdrop", name: "Colored Backdrop", icon: Layers },
  { id: "lifestyle-indoor", name: "Lifestyle Indoor", icon: Camera },
  { id: "lifestyle-outdoor", name: "Lifestyle Outdoor", icon: MapPin },
  { id: "gradient", name: "Gradient", icon: Image },
  { id: "textured", name: "Textured Surface", icon: Layers },
];

const PRODUCT_DISPLAY_OPTIONS = [
  { id: "hero", name: "Hero Shot", description: "Primary beauty shot" },
  { id: "closeup", name: "Close-up Details", description: "Macro details and textures" },
  { id: "in-use", name: "Product in Use", description: "Demonstration of usage" },
  { id: "unboxing", name: "Unboxing", description: "Packaging and reveal" },
  { id: "360", name: "360° View", description: "Multi-angle rotation" },
  { id: "scale", name: "Scale Reference", description: "Size comparison" },
  { id: "ingredients", name: "Ingredients/Parts", description: "Component breakdown" },
];

const TALENT_TYPES = [
  { id: "none", name: "No Talent", description: "Product-only focus" },
  { id: "hands", name: "Hands Only", description: "Hand models for interaction" },
  { id: "lifestyle", name: "Lifestyle Model", description: "Full models in context" },
  { id: "spokesperson", name: "Spokesperson", description: "Presenter/influencer" },
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
  onVisualStyleChange,
  onBackdropChange,
  onProductDisplayChange,
  onTalentTypeChange,
  onTalentsChange,
  onStyleReferenceChange,
  onAdditionalInstructionsChange,
  onNext,
}: ProductWorldCastProps) {
  const [isAddTalentOpen, setIsAddTalentOpen] = useState(false);
  const [editingTalent, setEditingTalent] = useState<Talent | null>(null);
  const [newTalent, setNewTalent] = useState({ name: "", description: "", type: "lifestyle" as Talent["type"] });
  const [talentImage, setTalentImage] = useState<string | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
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
      {/* Visual Style Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Camera className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Visual Style</h3>
          </div>

          <div className="space-y-6">
            {/* Photography Style Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">PHOTOGRAPHY STYLE</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PHOTOGRAPHY_STYLES.map((style) => (
                  <Card
                    key={style.id}
                    className={`cursor-pointer hover-elevate p-4 ${
                      visualStyle === style.id ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => onVisualStyleChange(style.id)}
                    data-testid={`style-${style.id}`}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      {visualStyle === style.id && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <p className="text-sm font-medium">{style.name}</p>
                      <p className="text-xs text-muted-foreground">{style.description}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Style Reference Upload */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">STYLE REFERENCE (Optional)</Label>
              <div className="flex gap-4">
                {styleReference ? (
                  <div className="relative w-32 h-32 rounded-lg border bg-muted overflow-hidden">
                    <img src={styleReference} alt="Style Reference" className="h-full w-full object-cover" />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={handleRemoveStyleReference}
                      data-testid="button-remove-style-ref"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover-elevate">
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
                    <span className="text-xs text-muted-foreground text-center px-2">Upload Reference</span>
                  </label>
                )}
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Upload an image to match your desired visual style. This helps maintain consistency across your product video.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Settings (Backdrop) Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Box className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Product Settings</h3>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">BACKDROP / ENVIRONMENT</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {BACKDROP_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <Card
                    key={option.id}
                    className={`cursor-pointer hover-elevate p-4 ${
                      backdrop === option.id ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => onBackdropChange(option.id)}
                    data-testid={`backdrop-${option.id}`}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <Icon className={`h-6 w-6 ${backdrop === option.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className="text-xs font-medium">{option.name}</p>
                      {backdrop === option.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Display Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Image className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Product Display</h3>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">SHOT TYPES (Select all that apply)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {PRODUCT_DISPLAY_OPTIONS.map((option) => {
                const isSelected = productDisplay.includes(option.id);
                return (
                  <Card
                    key={option.id}
                    className={`cursor-pointer hover-elevate p-4 ${
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleToggleProductDisplay(option.id)}
                    data-testid={`display-${option.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{option.name}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Talent / Models Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Talent / Models</h3>
            </div>
          </div>

          <div className="space-y-6">
            {/* Talent Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">TALENT TYPE</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TALENT_TYPES.map((type) => (
                  <Card
                    key={type.id}
                    className={`cursor-pointer hover-elevate p-4 ${
                      talentType === type.id ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => onTalentTypeChange(type.id)}
                    data-testid={`talent-type-${type.id}`}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <p className="text-sm font-medium">{type.name}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                      {talentType === type.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Talent Cards - Only show if talent type is not "none" */}
            {talentType !== "none" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">YOUR TALENT</Label>
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
                </div>

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
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings (Collapsible) */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <Card>
          <CardContent className="p-6">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
                data-testid="button-toggle-advanced"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Advanced AI Instructions</h3>
                </div>
                <span className="text-sm text-muted-foreground">
                  {isAdvancedOpen ? "Hide" : "Show"}
                </span>
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="pt-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">ADDITIONAL INSTRUCTIONS</Label>
                <Textarea
                  placeholder="Add specific instructions for AI generation... (e.g., 'Ensure product is centered, use warm lighting, maintain brand colors...')"
                  value={additionalInstructions}
                  onChange={(e) => onAdditionalInstructionsChange(e.target.value)}
                  rows={4}
                  data-testid="input-additional-instructions"
                />
                <p className="text-xs text-muted-foreground">
                  These instructions will be applied to all AI-generated visuals in your product video.
                </p>
              </div>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleContinue} data-testid="button-continue-world">
          Continue to Scene Breakdown
        </Button>
      </div>

      {/* Add/Edit Talent Dialog */}
      <Dialog open={isAddTalentOpen} onOpenChange={setIsAddTalentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTalent ? "Edit Talent" : "Add Talent"}</DialogTitle>
            <DialogDescription>
              Add a model or presenter for your product video.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Talent name"
                value={newTalent.name}
                onChange={(e) => setNewTalent({ ...newTalent, name: e.target.value })}
                data-testid="input-talent-name"
              />
            </div>

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

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Brief description or notes..."
                value={newTalent.description}
                onChange={(e) => setNewTalent({ ...newTalent, description: e.target.value })}
                rows={2}
                data-testid="input-talent-description"
              />
            </div>

            <div className="space-y-2">
              <Label>Reference Image (Optional)</Label>
              {talentImage ? (
                <div className="relative w-full aspect-video rounded-lg border bg-muted overflow-hidden">
                  <img src={talentImage} alt="Talent" className="h-full w-full object-cover" />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => setTalentImage(null)}
                    data-testid="button-remove-talent-image"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover-elevate">
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
                  <span className="text-sm text-muted-foreground">Upload Image</span>
                </label>
              )}
            </div>

            <Button onClick={handleSaveTalent} className="w-full" data-testid="button-save-talent">
              {editingTalent ? "Update Talent" : "Add Talent"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
