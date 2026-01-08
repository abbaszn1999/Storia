import { useState } from "react";
import { Plus, Search, Palette, X, Type, Upload, Loader2, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/contexts/workspace-context";
import { cn } from "@/lib/utils";
import {
  listBrandkits,
  createBrandkit,
  updateBrandkit,
  deleteBrandkit,
  uploadLogo,
  type BrandkitResponse,
} from "@/assets/brandkits";
import { AmbientBackground } from "@/components/story-studio/shared/AmbientBackground";

export default function BrandKits() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrandkit, setEditingBrandkit] = useState<BrandkitResponse | null>(null);
  const [newBrandKit, setNewBrandKit] = useState({
    name: "",
    description: "",
    colors: [] as string[],
    fonts: [] as string[],
    guidelines: "",
  });
  const [currentColor, setCurrentColor] = useState("#8B3FFF");
  const [currentFont, setCurrentFont] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingBrandkitId, setDeletingBrandkitId] = useState<string | null>(null);
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  // Fetch brandkits
  const { data: brandkits = [], isLoading } = useQuery<BrandkitResponse[]>({
    queryKey: ["/api/brandkits", currentWorkspace?.id],
    queryFn: () => {
      if (!currentWorkspace?.id) throw new Error("No workspace selected");
      return listBrandkits(currentWorkspace.id);
    },
    enabled: !!currentWorkspace?.id,
  });

  // Create brandkit mutation
  const createMutation = useMutation({
    mutationFn: createBrandkit,
    onSuccess: async (newBrandkit) => {
      // Upload logo if provided
      if (logoFile && newBrandkit.id) {
        try {
          setIsUploading(true);
          const result = await uploadLogo(newBrandkit.id, logoFile);
          await updateBrandkit(newBrandkit.id, { logoUrl: result.logoUrl });
        } catch (error) {
          console.error("Failed to upload logo:", error);
          toast({
            title: "Logo upload failed",
            description: error instanceof Error ? error.message : "Failed to upload logo",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/brandkits"] });
      toast({
        title: "Brand Kit Created",
        description: `${newBrandkit.name} has been added to your library.`,
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create brand kit",
        variant: "destructive",
      });
    },
  });

  // Update brandkit mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateBrandkit>[1] }) =>
      updateBrandkit(id, data),
    onSuccess: async (updatedBrandkit) => {
      // Upload logo if changed
      if (logoFile && updatedBrandkit.id) {
        try {
          setIsUploading(true);
          const result = await uploadLogo(updatedBrandkit.id, logoFile);
          await updateBrandkit(updatedBrandkit.id, { logoUrl: result.logoUrl });
        } catch (error) {
          console.error("Failed to upload logo:", error);
          toast({
            title: "Logo upload failed",
            description: error instanceof Error ? error.message : "Failed to upload logo",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/brandkits"] });
      toast({
        title: "Brand Kit Updated",
        description: `${updatedBrandkit.name} has been updated.`,
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update brand kit",
        variant: "destructive",
      });
    },
  });

  // Delete brandkit mutation
  const deleteMutation = useMutation({
    mutationFn: deleteBrandkit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brandkits"] });
      toast({
        title: "Brand Kit Deleted",
        description: "The brand kit has been removed.",
      });
      setDeletingBrandkitId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete brand kit",
        variant: "destructive",
      });
      setDeletingBrandkitId(null);
    },
  });

  const filteredBrandKits = brandkits.filter(kit =>
    kit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (kit.description && kit.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const generateRandomColor = () => {
    const colors = [
      "#8B3FFF", "#C944E6", "#22D3EE", "#FF3F8E", 
      "#6D5BFF", "#3B82F6", "#10B981", "#F59E0B",
      "#EC4899", "#8B5CF6", "#14B8A6", "#F97316"
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return randomColor;
  };

  const handleAddColor = () => {
    if (currentColor && !newBrandKit.colors.includes(currentColor.toUpperCase())) {
      setNewBrandKit(prev => ({
        ...prev,
        colors: [...prev.colors, currentColor.toUpperCase()]
      }));
      setCurrentColor(generateRandomColor());
    }
  };

  const handleRemoveColor = (color: string) => {
    setNewBrandKit(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c !== color)
    }));
  };

  const handleAddFont = () => {
    if (currentFont.trim() && !newBrandKit.fonts.includes(currentFont.trim())) {
      setNewBrandKit(prev => ({
        ...prev,
        fonts: [...prev.fonts, currentFont.trim()]
      }));
      setCurrentFont("");
    }
  };

  const handleRemoveFont = (font: string) => {
    setNewBrandKit(prev => ({
      ...prev,
      fonts: prev.fonts.filter(f => f !== font)
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleOpenEditDialog = (brandkit: BrandkitResponse) => {
    setEditingBrandkit(brandkit);
    setNewBrandKit({
      name: brandkit.name,
      description: brandkit.description || "",
      colors: (brandkit.colors as string[]) || [],
      fonts: (brandkit.fonts as string[]) || [],
      guidelines: brandkit.guidelines || "",
    });
    setLogoPreview(brandkit.logoUrl || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBrandkit(null);
    setNewBrandKit({
      name: "",
      description: "",
      colors: [],
      fonts: [],
      guidelines: "",
    });
    setCurrentColor("#8B3FFF");
    setCurrentFont("");
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSaveBrandKit = () => {
    if (!currentWorkspace?.id) return;

    const data = {
      ...newBrandKit,
      colors: newBrandKit.colors.length > 0 ? newBrandKit.colors : undefined,
      fonts: newBrandKit.fonts.length > 0 ? newBrandKit.fonts : undefined,
    };

    if (editingBrandkit) {
      updateMutation.mutate({ id: editingBrandkit.id, data });
    } else {
      createMutation.mutate({
        workspaceId: currentWorkspace.id,
        ...data,
      });
    }
  };

  const handleDeleteBrandkit = (id: string) => {
    setDeletingBrandkitId(id);
  };

  const confirmDelete = () => {
    if (deletingBrandkitId) {
      deleteMutation.mutate(deletingBrandkitId);
    }
  };

  const isFormValid = newBrandKit.name.trim().length > 0;
  const isSaving = createMutation.isPending || updateMutation.isPending || isUploading;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Ambient Background */}
      <AmbientBackground accentColor="from-primary to-violet-500" />

      <div className="relative z-10 space-y-6 p-6">
        {/* Header Section */}
        <div className="border-b bg-background/80 backdrop-blur-xl">
          <div className="px-4 py-5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search brand kits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "pl-11 h-10 rounded-xl",
                    "bg-background border-border",
                    "text-foreground placeholder:text-muted-foreground",
                    "focus:border-primary focus:ring-2 focus:ring-primary/20",
                    "transition-all duration-200"
                  )}
                  data-testid="input-search"
                />
              </div>

              {/* New Brand Kit Button */}
              <Button
                className="gap-2"
                onClick={() => setIsDialogOpen(true)}
                data-testid="button-create-brandkit"
              >
                <Plus className="h-4 w-4" />
                New Brand Kit
              </Button>
            </div>
          </div>
        </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground ml-3">Loading brand kits...</p>
        </div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            {filteredBrandKits.length === 0 && !isLoading ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "text-center py-16 rounded-2xl",
                  "bg-card border-0",
                  "backdrop-blur-xl"
                )}
              >
                <Palette className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">No brand kits found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try adjusting your search" : "Create your first brand kit to get started"}
                </p>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredBrandKits.map((kit) => (
                  <motion.div
                    key={kit.id}
                    variants={cardVariants}
                    whileHover={{ y: -4 }}
                    className="relative group"
                  >
                    {/* Gradient Border Glow */}
                    <div className={cn(
                      "absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100",
                      "bg-gradient-to-r blur-sm transition-opacity duration-500",
                      "from-primary to-violet-500"
                    )} />
                    
                    <Card
                      className={cn(
                        "relative overflow-hidden cursor-pointer",
                        "bg-card backdrop-blur-xl",
                        "border-0",
                        "transition-all duration-300",
                        "group-hover:shadow-2xl group-hover:shadow-primary/30"
                      )}
                      onClick={() => handleOpenEditDialog(kit)}
                      data-testid={`brandkit-card-${kit.id}`}
                    >
                      <CardContent className="p-5">
                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 bg-muted backdrop-blur-md border-border hover:bg-muted/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDialog(kit);
                            }}
                            data-testid={`button-edit-${kit.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBrandkit(kit.id);
                            }}
                            data-testid={`button-delete-${kit.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-start gap-3 mb-4">
                          {kit.logoUrl ? (
                            <div className="h-12 w-12 rounded-lg overflow-hidden border-0 flex items-center justify-center bg-muted">
                              <img src={kit.logoUrl} alt={kit.name} className="h-full w-full object-contain" />
                            </div>
                          ) : (
                            <div className={cn(
                              "h-12 w-12 rounded-lg flex items-center justify-center",
                              "bg-gradient-to-br from-primary/20 to-violet-500/20",
                              "border border-primary/30"
                            )}>
                              <Palette className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-1">{kit.name}</h3>
                            {kit.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{kit.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          {kit.colors && Array.isArray(kit.colors) && kit.colors.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Colors</p>
                              <div className="flex gap-1.5">
                                {kit.colors.map((color, idx) => (
                                  <div
                                    key={idx}
                                    className="h-8 w-8 rounded-md border-0"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {kit.fonts && Array.isArray(kit.fonts) && kit.fonts.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Fonts</p>
                              <div className="flex gap-2 flex-wrap">
                                {kit.fonts.map((font, idx) => (
                                  <Badge key={idx} variant="secondary" className={cn(
                                    "text-xs"
                                  )}>
                                    {font}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      </div>

      {/* Enhanced Create/Edit Brand Kit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className={cn(
          "max-w-4xl max-h-[95vh] overflow-hidden p-0 flex flex-col",
          "bg-popover backdrop-blur-2xl",
          "border-0",
          "shadow-2xl"
        )}>
          {/* Header Section */}
          <div className={cn(
            "px-8 py-6 border-b-0 flex-shrink-0",
            "bg-muted/30"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className={cn(
                  "text-3xl font-bold mb-2",
                  "text-foreground"
                )}>
                  {editingBrandkit ? "Edit Brand Kit" : "Create New Brand Kit"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-base">
                  Define your brand colors, typography, and guidelines to maintain consistency across your videos.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="overflow-y-auto flex-1 min-h-0 px-8 py-6">
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <div className="space-y-5">
                  {/* Logo Upload */}
                  <div className="space-y-3">
                    <Label className="text-foreground font-medium text-sm">Brand Logo</Label>
                    {logoPreview ? (
                      <div className="relative inline-block">
                        <div className="w-32 h-32 rounded-xl border-0 overflow-hidden bg-muted flex items-center justify-center">
                          <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                        </div>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive/90 hover:bg-destructive"
                          onClick={handleRemoveLogo}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <label className={cn(
                        "flex flex-col items-center justify-center h-32",
                        "border-0 rounded-xl",
                        "bg-muted/50 cursor-pointer",
                        "hover:bg-muted",
                        "transition-all duration-200 group/upload"
                      )}>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <ImageIcon className={cn(
                          "h-8 w-8 text-muted-foreground mb-2",
                          "group-hover/upload:text-primary transition-colors"
                        )} />
                        <p className="text-sm font-medium text-muted-foreground group-hover/upload:text-foreground mb-1">
                          Click to upload logo
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, WEBP or SVG (max 10MB)
                        </p>
                      </label>
                    )}
                  </div>

                  {/* Name */}
                  <div className="space-y-2.5">
                    <Label htmlFor="brandkit-name" className="text-foreground font-medium text-sm">
                      Brand Kit Name <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="brandkit-name"
                      placeholder="e.g., My Company Brand"
                      value={newBrandKit.name}
                      onChange={(e) => setNewBrandKit(prev => ({ ...prev, name: e.target.value }))}
                      className={cn(
                        "h-11",
                        "focus:border-primary focus:ring-2 focus:ring-primary/30",
                        "transition-all duration-200"
                      )}
                      data-testid="input-brandkit-name"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2.5">
                    <Label htmlFor="brandkit-description" className="text-foreground font-medium text-sm">Description</Label>
                    <Input
                      id="brandkit-description"
                      placeholder="Brief description of this brand kit"
                      value={newBrandKit.description}
                      onChange={(e) => setNewBrandKit(prev => ({ ...prev, description: e.target.value }))}
                      className={cn(
                        "h-11",
                        "focus:border-primary focus:ring-2 focus:ring-primary/30",
                        "transition-all duration-200"
                      )}
                      data-testid="input-brandkit-description"
                    />
                  </div>
                </div>
              </div>

              {/* Brand Colors */}
              <div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1 flex gap-2">
                      <Input
                        type="color"
                        value={currentColor}
                        onChange={(e) => setCurrentColor(e.target.value)}
                        className="w-20 h-11 p-1 cursor-pointer rounded-lg"
                        data-testid="input-color-picker"
                      />
                      <Input
                        type="text"
                        value={currentColor}
                        onChange={(e) => setCurrentColor(e.target.value.toUpperCase())}
                        placeholder="#000000"
                        className={cn(
                          "flex-1 h-11",
                          "focus:border-primary focus:ring-2 focus:ring-primary/30",
                          "transition-all duration-200 font-mono"
                        )}
                        data-testid="input-color-hex"
                      />
                    </div>
                    <Button 
                      onClick={handleAddColor}
                      className="h-11 px-6"
                      data-testid="button-add-color"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  {newBrandKit.colors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Your colors ({newBrandKit.colors.length}):</p>
                      <div className="flex flex-wrap gap-3">
                        {newBrandKit.colors.map((color, idx) => (
                          <div
                            key={idx}
                            className="group relative"
                            data-testid={`color-swatch-${idx}`}
                          >
                            <div
                              className="h-16 w-16 rounded-xl border-0 cursor-pointer transition-all shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/90 hover:bg-destructive"
                              onClick={() => handleRemoveColor(color)}
                              data-testid={`button-remove-color-${idx}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                            <p className="text-xs text-center mt-2 text-muted-foreground font-mono">{color}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Brand Fonts */}
              <div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      type="text"
                      value={currentFont}
                      onChange={(e) => setCurrentFont(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddFont()}
                      placeholder="e.g., Inter, Roboto, Playfair Display"
                      className={cn(
                        "flex-1 h-11",
                        "focus:border-primary focus:ring-2 focus:ring-primary/30",
                        "transition-all duration-200"
                      )}
                      data-testid="input-font-name"
                    />
                    <Button 
                      onClick={handleAddFont}
                      className="h-11 px-6"
                      data-testid="button-add-font"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  {newBrandKit.fonts.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newBrandKit.fonts.map((font, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className={cn(
                            "gap-1.5 pr-1.5 py-1.5 px-3",
                            "transition-all duration-200"
                          )}
                          data-testid={`font-badge-${idx}`}
                        >
                          <Type className="h-3.5 w-3.5" />
                          {font}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-4 w-4 ml-1 hover:bg-destructive/20 rounded"
                            onClick={() => handleRemoveFont(font)}
                            data-testid={`button-remove-font-${idx}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Guidelines */}
              <div>
                <div className="space-y-2.5">
                  <Textarea
                    id="brandkit-guidelines"
                    placeholder="Add brand voice, tone, messaging guidelines, or other notes..."
                    value={newBrandKit.guidelines}
                    onChange={(e) => setNewBrandKit(prev => ({ ...prev, guidelines: e.target.value }))}
                    rows={5}
                    className={cn(
                      "focus:border-primary focus:ring-2 focus:ring-primary/30",
                      "transition-all duration-200 resize-none"
                    )}
                    data-testid="textarea-guidelines"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className={cn(
            "px-8 py-6 border-t-0 flex-shrink-0",
            "bg-muted/30",
            "flex items-center justify-end gap-3"
          )}>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isSaving}
              className={cn(
                "h-11 px-6",
                "transition-all duration-200"
              )}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleSaveBrandKit}
                disabled={!isFormValid || isSaving}
                className={cn(
                  "h-11 px-8 bg-gradient-to-r from-primary to-violet-500",
                  "hover:shadow-lg hover:shadow-primary/30",
                  "border-0 text-white font-semibold",
                  "transition-all duration-200"
                )}
                data-testid="button-save"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingBrandkit ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editingBrandkit ? "Update Brand Kit" : "Create Brand Kit"
                )}
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingBrandkitId} onOpenChange={() => setDeletingBrandkitId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand Kit?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the brand kit and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
