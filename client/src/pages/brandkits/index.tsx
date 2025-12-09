import { useState } from "react";
import { Plus, Search, Palette, X, Type, Upload, Loader2, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
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
import {
  listBrandkits,
  createBrandkit,
  updateBrandkit,
  deleteBrandkit,
  uploadLogo,
  type BrandkitResponse,
} from "@/assets/brandkits";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Brand Kits</h1>
          <p className="text-muted-foreground mt-1">
            Define and manage your brand colors, fonts, and logos
          </p>
        </div>
        <Button 
          size="lg" 
          className="gap-2" 
          onClick={() => setIsDialogOpen(true)}
          data-testid="button-create-brandkit"
        >
          <Plus className="h-4 w-4" />
          New Brand Kit
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search brand kits..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBrandKits.map((kit) => (
              <Card key={kit.id} className="hover-elevate cursor-pointer group relative" data-testid={`brandkit-card-${kit.id}`}>
                <CardContent className="p-5">
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
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
                      <div className="h-10 w-10 rounded-lg overflow-hidden border border-border flex items-center justify-center bg-white">
                        <img src={kit.logoUrl} alt={kit.name} className="h-full w-full object-contain" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <Palette className="h-5 w-5 text-primary" />
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
                              className="h-8 w-8 rounded-md border border-border"
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
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {font}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredBrandKits.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No brand kits found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search" : "Create your first brand kit to get started"}
              </p>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Brand Kit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBrandkit ? "Edit Brand Kit" : "Create New Brand Kit"}</DialogTitle>
            <DialogDescription>
              Define your brand colors, typography, and guidelines to maintain consistency across your videos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Logo Upload */}
            <div className="space-y-3">
              <Label>Brand Logo</Label>
              {logoPreview ? (
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-lg border-2 border-border overflow-hidden bg-white flex items-center justify-center">
                    <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                  </div>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={handleRemoveLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload logo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, WEBP or SVG (max 10MB)
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="brandkit-name">Brand Kit Name *</Label>
              <Input
                id="brandkit-name"
                placeholder="e.g., My Company Brand"
                value={newBrandKit.name}
                onChange={(e) => setNewBrandKit(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-brandkit-name"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="brandkit-description">Description</Label>
              <Input
                id="brandkit-description"
                placeholder="Brief description of this brand kit"
                value={newBrandKit.description}
                onChange={(e) => setNewBrandKit(prev => ({ ...prev, description: e.target.value }))}
                data-testid="input-brandkit-description"
              />
            </div>

            {/* Colors */}
            <div className="space-y-3">
              <Label>Brand Colors</Label>
              <div className="flex gap-2">
                <div className="flex-1 flex gap-2">
                  <Input
                    type="color"
                    value={currentColor}
                    onChange={(e) => setCurrentColor(e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                    data-testid="input-color-picker"
                  />
                  <Input
                    type="text"
                    value={currentColor}
                    onChange={(e) => setCurrentColor(e.target.value.toUpperCase())}
                    placeholder="#000000"
                    className="flex-1"
                    data-testid="input-color-hex"
                  />
                </div>
                <Button 
                  onClick={handleAddColor}
                  variant="secondary"
                  data-testid="button-add-color"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Quick Color Presets */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Quick add:</p>
                <div className="flex flex-wrap gap-1.5">
                  {["#8B3FFF", "#C944E6", "#22D3EE", "#FF3F8E", "#6D5BFF", "#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#14B8A6", "#F97316"].map((presetColor, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentColor(presetColor)}
                      className="h-8 w-8 rounded-md border-2 border-border hover-elevate cursor-pointer transition-all"
                      style={{ backgroundColor: presetColor }}
                      title={presetColor}
                      data-testid={`preset-color-${idx}`}
                    />
                  ))}
                </div>
              </div>

              {newBrandKit.colors.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Your colors ({newBrandKit.colors.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {newBrandKit.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="group relative"
                        data-testid={`color-swatch-${idx}`}
                      >
                        <div
                          className="h-14 w-14 rounded-lg border-2 border-border hover-elevate cursor-pointer"
                          style={{ backgroundColor: color }}
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveColor(color)}
                          data-testid={`button-remove-color-${idx}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <p className="text-xs text-center mt-1 text-muted-foreground font-mono">{color}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fonts */}
            <div className="space-y-3">
              <Label>Brand Fonts</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={currentFont}
                  onChange={(e) => setCurrentFont(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFont()}
                  placeholder="e.g., Inter, Roboto, Playfair Display"
                  className="flex-1"
                  data-testid="input-font-name"
                />
                <Button 
                  onClick={handleAddFont}
                  variant="secondary"
                  data-testid="button-add-font"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {newBrandKit.fonts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newBrandKit.fonts.map((font, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="gap-1 pr-1"
                      data-testid={`font-badge-${idx}`}
                    >
                      <Type className="h-3 w-3" />
                      {font}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-4 w-4 ml-1 hover:bg-destructive/20"
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

            {/* Guidelines */}
            <div className="space-y-2">
              <Label htmlFor="brandkit-guidelines">Brand Guidelines</Label>
              <Textarea
                id="brandkit-guidelines"
                placeholder="Add brand voice, tone, messaging guidelines, or other notes..."
                value={newBrandKit.guidelines}
                onChange={(e) => setNewBrandKit(prev => ({ ...prev, guidelines: e.target.value }))}
                rows={4}
                data-testid="textarea-guidelines"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isSaving}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveBrandKit}
              disabled={!isFormValid || isSaving}
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
