import { useState } from "react";
import { Plus, Search, MapPin, Upload, X, Loader2, Sparkles, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/contexts/workspace-context";
import {
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  uploadMainImage,
  type LocationResponse,
} from "@/assets/locations";
import { MAX_LOCATION_REFERENCES } from "@/lib/constants";

export default function Locations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationResponse | null>(null);
  const [newLocation, setNewLocation] = useState({
    name: "",
    description: "",
    details: "",
  });
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [referenceImageFiles, setReferenceImageFiles] = useState<File[]>([]);
  const [referenceImagePreviews, setReferenceImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  // Fetch locations
  const { data: locations = [], isLoading } = useQuery<LocationResponse[]>({
    queryKey: ["/api/locations", currentWorkspace?.id],
    queryFn: () => {
      if (!currentWorkspace?.id) throw new Error("No workspace selected");
      return listLocations(currentWorkspace.id);
    },
    enabled: !!currentWorkspace?.id,
  });

  // Create location mutation
  const createMutation = useMutation({
    mutationFn: createLocation,
    onSuccess: async (newLoc) => {
      // Upload main image if provided
      if (mainImageFile && newLoc.id) {
        try {
          setIsUploading(true);
          const result = await uploadMainImage(newLoc.id, mainImageFile);
          await updateLocation(newLoc.id, { imageUrl: result.imageUrl });
        } catch (error) {
          console.error("Failed to upload main image:", error);
          toast({
            title: "Image upload failed",
            description: error instanceof Error ? error.message : "Failed to upload image",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({
        title: "Location Created",
        description: `${newLoc.name} has been added to your library.`,
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create location",
        variant: "destructive",
      });
    },
  });

  // Update location mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateLocation>[1] }) =>
      updateLocation(id, data),
    onSuccess: async (updatedLoc) => {
      // Upload main image if changed
      if (mainImageFile && updatedLoc.id) {
        try {
          setIsUploading(true);
          const result = await uploadMainImage(updatedLoc.id, mainImageFile);
          await updateLocation(updatedLoc.id, { imageUrl: result.imageUrl });
        } catch (error) {
          console.error("Failed to upload main image:", error);
          toast({
            title: "Image upload failed",
            description: error instanceof Error ? error.message : "Failed to upload image",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({
        title: "Location Updated",
        description: `${updatedLoc.name} has been updated.`,
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update location",
        variant: "destructive",
      });
    },
  });

  // Delete location mutation
  const deleteMutation = useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({
        title: "Location Deleted",
        description: "Location has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete location",
        variant: "destructive",
      });
    },
  });

  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNew = () => {
    setEditingLocation(null);
    setNewLocation({ name: "", description: "", details: "" });
    setMainImageFile(null);
    setMainImagePreview(null);
    setReferenceImageFiles([]);
    setReferenceImagePreviews([]);
    setIsDialogOpen(true);
  };

  const handleEditLocation = (location: LocationResponse) => {
    setEditingLocation(location);
    setNewLocation({
      name: location.name,
      description: location.description || "",
      details: location.details || "",
    });
    setMainImagePreview(location.imageUrl || null);
    setMainImageFile(null);
    setReferenceImagePreviews(location.referenceImages || []);
    setReferenceImageFiles([]);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLocation(null);
    setNewLocation({ name: "", description: "", details: "" });
    setMainImageFile(null);
    setMainImagePreview(null);
    setReferenceImageFiles([]);
    setReferenceImagePreviews([]);
  };

  const handleSaveLocation = () => {
    if (!newLocation.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a location name.",
        variant: "destructive",
      });
      return;
    }

    if (!currentWorkspace?.id) {
      toast({
        title: "Workspace required",
        description: "Please select a workspace.",
        variant: "destructive",
      });
      return;
    }

    if (editingLocation) {
      updateMutation.mutate({
        id: editingLocation.id,
        data: {
          name: newLocation.name,
          description: newLocation.description,
          details: newLocation.details,
        },
      });
    } else {
      createMutation.mutate({
        workspaceId: currentWorkspace.id,
        name: newLocation.name,
        description: newLocation.description || undefined,
        details: newLocation.details || undefined,
      });
    }
  };

  const handleGenerateLocation = async () => {
    if (!newLocation.description.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe the location before generating.",
        variant: "destructive",
      });
      return;
    }

    if (!newLocation.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a location name before generating.",
        variant: "destructive",
      });
      return;
    }

    if (!currentWorkspace?.id) {
      toast({
        title: "Workspace Required",
        description: "Please select a workspace.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);

    try {
      let locationId = editingLocation?.id;

      // If it's a new location, create it first
      if (!locationId) {
        console.log('[locations] Creating location first before image generation');
        const newLoc = await createLocation({
          workspaceId: currentWorkspace.id,
          name: newLocation.name,
          description: newLocation.description || undefined,
          details: newLocation.details || undefined,
        });
        locationId = newLoc.id;
        // Update local state to reflect the created location
        setEditingLocation(newLoc);
        console.log('[locations] Location created:', { locationId, name: newLoc.name });
      }

      // Generate image using the location ID
      const response = await fetch(`/api/locations/${locationId}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          referenceImages: referenceImagePreviews.length > 0 ? referenceImagePreviews : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || data.details || 'Failed to generate image');
      }

      if (data.imageUrl) {
        setMainImagePreview(data.imageUrl);
        queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
        toast({
          title: "Location Generated",
          description: `Location image for ${newLocation.name} has been created.`,
        });
      }
    } catch (error) {
      console.error('Location image generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate location image.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleMainImageUpload = (file: File) => {
    setMainImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMainImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleReferenceImageUpload = async (file: File) => {
    if (!currentWorkspace?.id) {
      toast({
        title: "Workspace Required",
        description: "Please select a workspace.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload to Bunny CDN via uploads endpoint
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', currentWorkspace.id);
      formData.append('name', `Location Reference - ${file.name}`);
      
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to upload reference image');
      }

      const data = await response.json();
      
      // Add the CDN URL to reference images
      setReferenceImagePreviews([...referenceImagePreviews, data.url]);
      
      toast({
        title: "Reference Uploaded",
        description: "Location reference image added.",
      });
    } catch (error) {
      console.error('[locations] Reference upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload reference image.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveReferenceImage = (index: number) => {
    setReferenceImagePreviews(referenceImagePreviews.filter((_, i) => i !== index));
    setReferenceImageFiles(referenceImageFiles.filter((_, i) => i !== index));
  };

  const handleDeleteLocation = (location: LocationResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${location.name}?`)) {
      deleteMutation.mutate(location.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Locations</h1>
          <p className="text-muted-foreground mt-1">Create and manage location settings for your videos</p>
        </div>
        <Button
          size="lg"
          className="gap-2"
          onClick={handleCreateNew}
          data-testid="button-create-location"
        >
          <Plus className="h-4 w-4" />
          New Location
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search locations..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading locations...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredLocations.map((location) => (
              <Card
                key={location.id}
                className="relative aspect-[4/3] overflow-hidden group cursor-pointer hover-elevate"
                onClick={() => handleEditLocation(location)}
                data-testid={`location-card-${location.id}`}
              >
                <CardContent className="p-0 h-full relative">
                  <div className="h-full bg-muted flex items-center justify-center">
                    {location.imageUrl ? (
                      <img
                        src={location.imageUrl}
                        alt={location.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <MapPin className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditLocation(location);
                      }}
                      data-testid={`button-edit-location-${location.id}`}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => handleDeleteLocation(location, e)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-location-${location.id}`}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                    <p className="text-sm font-semibold text-white">{location.name}</p>
                    {location.description && (
                      <p className="text-xs text-white/70 line-clamp-1">{location.description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredLocations.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No locations found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or create a new location
              </p>
            </div>
          )}
        </>
      )}

      {/* Location Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLocation ? "Edit Location" : "Create New Location"}</DialogTitle>
            <DialogDescription>
              Define a location setting for your videos. Upload reference images for consistency.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loc-name">Name</Label>
                  <Input
                    id="loc-name"
                    placeholder="Location name"
                    value={newLocation.name}
                    onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                    data-testid="input-location-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-description">Description</Label>
                  <Textarea
                    id="loc-description"
                    placeholder="Brief description of the location..."
                    value={newLocation.description}
                    onChange={(e) =>
                      setNewLocation({ ...newLocation, description: e.target.value })
                    }
                    rows={2}
                    data-testid="input-location-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-details">Details</Label>
                  <Textarea
                    id="loc-details"
                    placeholder="Specific details: lighting, furniture, atmosphere..."
                    value={newLocation.details}
                    onChange={(e) =>
                      setNewLocation({ ...newLocation, details: e.target.value })
                    }
                    rows={3}
                    data-testid="input-location-details"
                  />
                </div>
                <Button
                  onClick={handleGenerateLocation}
                  className="w-full"
                  disabled={isGeneratingImage || !newLocation.name.trim() || !newLocation.description.trim() || !currentWorkspace?.id}
                  data-testid="button-generate-location"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Location Image
                    </>
                  )}
                </Button>
                {!newLocation.name.trim() || !newLocation.description.trim() ? (
                  <p className="text-xs text-muted-foreground text-center">
                    Enter name and description to generate image
                  </p>
                ) : null}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Reference Images ({referenceImagePreviews.length}/{MAX_LOCATION_REFERENCES})
                  </Label>
                  {referenceImagePreviews.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {referenceImagePreviews.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-lg border bg-muted">
                          <div className="absolute inset-0 rounded-lg overflow-hidden">
                            <img src={url} alt={`Reference ${index + 1}`} className="h-full w-full object-cover" />
                          </div>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-2 left-2 h-6 w-6 z-10"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveReferenceImage(index);
                            }}
                            data-testid={`button-remove-ref-${index}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No reference images uploaded yet
                    </p>
                  )}
                  {referenceImagePreviews.length < MAX_LOCATION_REFERENCES && (
                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover-elevate">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleReferenceImageUpload(file);
                        }}
                        data-testid="input-upload-location-ref"
                      />
                      <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                      <span className="text-sm text-muted-foreground">Upload Reference</span>
                    </label>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Main Location Image</Label>
                  <div className="relative aspect-[4/3] rounded-lg border overflow-hidden bg-muted">
                    {mainImagePreview ? (
                      <>
                        <img
                          src={mainImagePreview}
                          alt="Location"
                          className="h-full w-full object-cover"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 h-8 w-8 z-10"
                          onClick={() => {
                            setMainImagePreview(null);
                            setMainImageFile(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <label className="flex flex-col items-center justify-center cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleMainImageUpload(file);
                            }}
                          />
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Upload Main Image</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSaveLocation}
              className="w-full"
              disabled={createMutation.isPending || updateMutation.isPending || isUploading}
              data-testid="button-save-location"
            >
              {(createMutation.isPending || updateMutation.isPending || isUploading) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? "Uploading images..." : "Saving..."}
                </>
              ) : editingLocation ? (
                "Update Location"
              ) : (
                "Add Location"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
