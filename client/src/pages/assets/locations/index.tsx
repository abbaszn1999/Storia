import { useState } from "react";
import { Plus, Search, MapPin, Upload, X, Loader2, Sparkles, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/contexts/workspace-context";
import { cn } from "@/lib/utils";
import {
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  uploadMainImage,
  type LocationResponse,
} from "@/assets/locations";
import { MAX_LOCATION_REFERENCES } from "@/assets/constants";
import { AmbientBackground } from "@/components/story-studio/shared/AmbientBackground";

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
      const imageUrl = data.upload?.storageUrl || data.storageUrl || data.url;
      if (imageUrl) {
        setReferenceImagePreviews([...referenceImagePreviews, imageUrl]);
      } else {
        throw new Error('No image URL in response');
      }
      
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
                  placeholder="Search locations..."
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

              {/* New Location Button */}
              <Button
                className="gap-2"
                onClick={handleCreateNew}
                data-testid="button-create-location"
              >
                <Plus className="h-4 w-4" />
                New Location
              </Button>
            </div>
          </div>
        </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading locations...</p>
        </div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            {filteredLocations.length === 0 ? (
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
                <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">No locations found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or create a new location
                </p>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredLocations.map((location) => (
                  <motion.div
                    key={location.id}
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
                        "relative aspect-[4/3] overflow-hidden cursor-pointer",
                        "bg-card backdrop-blur-xl",
                        "border-0",
                        "transition-all duration-300",
                        "group-hover:shadow-2xl group-hover:shadow-primary/30"
                      )}
                      onClick={() => handleEditLocation(location)}
                      data-testid={`location-card-${location.id}`}
                    >
                      <CardContent className="p-0 h-full relative">
                        <div className="h-full bg-muted flex items-center justify-center">
                          {location.imageUrl ? (
                            <img
                              src={location.imageUrl}
                              alt={location.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <MapPin className="h-16 w-16 text-muted-foreground" />
                          )}
                        </div>

                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-muted backdrop-blur-md border-border hover:bg-muted/80"
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

                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 via-background/70 to-transparent pointer-events-none">
                          <p className="text-sm font-semibold text-foreground">{location.name}</p>
                          {location.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{location.description}</p>
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

      {/* Enhanced Location Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className={cn(
          "w-[60%] max-w-none max-h-[95vh] overflow-hidden p-0 flex flex-col",
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
                  {editingLocation ? "Edit Location" : "Create New Location"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-base">
                  Define a location setting for your videos. Upload reference images for consistency.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="overflow-y-auto flex-1 min-h-0 px-8 pt-6 pb-4">
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column - Location Details */}
              <div className="space-y-6">
                <div>
                  <div className="space-y-5">
                    <div className="space-y-2.5">
                      <Label htmlFor="loc-name" className="text-foreground font-medium text-sm">
                        Name <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="loc-name"
                        placeholder="Enter location name"
                        value={newLocation.name}
                        onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                        className={cn(
                          "h-11",
                          "focus:border-primary focus:ring-2 focus:ring-primary/30",
                          "transition-all duration-200"
                        )}
                        data-testid="input-location-name"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="loc-description" className="text-foreground font-medium text-sm">
                        Description <span className="text-primary">*</span>
                      </Label>
                      <Textarea
                        id="loc-description"
                        placeholder="Brief description of the location..."
                        value={newLocation.description}
                        onChange={(e) =>
                          setNewLocation({ ...newLocation, description: e.target.value })
                        }
                        rows={3}
                        className={cn(
                          "focus:border-primary focus:ring-2 focus:ring-primary/30",
                          "transition-all duration-200 resize-none"
                        )}
                        data-testid="input-location-description"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="loc-details" className="text-foreground font-medium text-sm">
                        Details
                      </Label>
                      <Textarea
                        id="loc-details"
                        placeholder="Specific details: lighting, furniture, atmosphere..."
                        value={newLocation.details}
                        onChange={(e) =>
                          setNewLocation({ ...newLocation, details: e.target.value })
                        }
                        rows={4}
                        className={cn(
                          "focus:border-primary focus:ring-2 focus:ring-primary/30",
                          "transition-all duration-200 resize-none"
                        )}
                        data-testid="input-location-details"
                      />
                    </div>

                    {/* Reference Images Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-foreground font-medium text-sm">
                          Reference Images
                        </Label>
                        <span className="text-xs text-muted-foreground font-medium">
                          {referenceImagePreviews.length}/{MAX_LOCATION_REFERENCES}
                        </span>
                      </div>
                      
                      {/* Reference Images Grid - Small thumbnails */}
                      {referenceImagePreviews.length > 0 && (
                        <div className="grid grid-cols-5 gap-2">
                          {referenceImagePreviews.map((url, index) => (
                            <div key={index} className={cn(
                              "relative aspect-square rounded-lg border-0",
                              "bg-muted overflow-hidden group/ref",
                              "transition-all duration-200",
                              "shadow-sm hover:shadow-md"
                            )}>
                              <div className="absolute inset-0 rounded-lg overflow-hidden">
                                <img 
                                  src={url} 
                                  alt={`Reference ${index + 1}`} 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="absolute inset-0 bg-black/0 group-hover/ref:bg-black/20 transition-colors" />
                              <Button
                                size="icon"
                                variant="destructive"
                                className={cn(
                                  "absolute top-1 right-1 h-6 w-6 z-10 rounded-md",
                                  "opacity-0 group-hover/ref:opacity-100 transition-opacity",
                                  "bg-destructive/90 hover:bg-destructive shadow-lg"
                                )}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleRemoveReferenceImage(index);
                                }}
                                data-testid={`button-remove-ref-${index}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover/ref:opacity-100 transition-opacity">
                                <p className="text-[10px] font-medium text-white text-center">
                                  Ref {index + 1}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload Reference Box */}
                      {referenceImagePreviews.length < MAX_LOCATION_REFERENCES && (
                        <label className={cn(
                          "flex flex-col items-center justify-center h-24 w-full",
                          "border-0 rounded-xl",
                          "bg-muted/50 cursor-pointer",
                          "hover:bg-muted",
                          "transition-all duration-200 group/upload",
                          "shadow-sm hover:shadow-md"
                        )}>
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
                          <Upload className={cn(
                            "h-5 w-5 text-muted-foreground mb-1.5",
                            "group-hover/upload:text-primary transition-colors"
                          )} />
                          <span className="text-xs font-medium text-muted-foreground group-hover/upload:text-foreground">
                            Upload Reference
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">
                            {MAX_LOCATION_REFERENCES - referenceImagePreviews.length} remaining
                          </span>
                        </label>
                      )}
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="pt-2"
                    >
                      <Button
                        onClick={handleGenerateLocation}
                        className={cn(
                          "w-full h-12 bg-gradient-to-r from-primary to-violet-500",
                          "hover:shadow-lg hover:shadow-primary/30",
                          "border-0 text-white font-semibold",
                          "transition-all duration-200"
                        )}
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
                    </motion.div>
                    {!newLocation.name.trim() || !newLocation.description.trim() ? (
                      <p className="text-xs text-white/40 text-center mt-2">
                        Enter name and description to generate image
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Right Column - Location Image Preview */}
              <div className="space-y-6">
                <div>
                  <div className="flex flex-col h-full">
                    <div className="space-y-3 flex-1 flex flex-col">
                      <Label className="text-foreground font-medium text-sm">
                        Main Location Image
                      </Label>
                      <div className={cn(
                        "relative w-full flex-1 rounded-xl border-0",
                        "overflow-hidden bg-muted",
                        "transition-all duration-200",
                        "shadow-sm hover:shadow-lg",
                        "min-h-[400px]"
                      )}>
                        {mainImagePreview ? (
                          <>
                            <img
                              src={mainImagePreview}
                              alt="Location"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-3 right-3 h-9 w-9 z-10 rounded-lg bg-destructive/90 hover:bg-destructive shadow-lg"
                              onClick={() => {
                                setMainImagePreview(null);
                                setMainImageFile(null);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <div className="absolute bottom-3 left-3 right-3 opacity-0 hover:opacity-100 transition-opacity">
                              <div className="bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5">
                                <p className="text-xs font-medium text-foreground text-center">
                                  Main Location Image
                                </p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <label className="flex flex-col items-center justify-center cursor-pointer group/upload">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleMainImageUpload(file);
                                }}
                              />
                              <div className={cn(
                                "h-16 w-16 rounded-xl mb-4 flex items-center justify-center",
                                "bg-muted border-0",
                                "group-hover/upload:bg-primary/10",
                                "transition-all duration-200"
                              )}>
                                <Upload className={cn(
                                  "h-8 w-8 text-muted-foreground",
                                  "group-hover/upload:text-primary transition-colors"
                                )} />
                              </div>
                              <span className="text-sm font-medium text-muted-foreground group-hover/upload:text-foreground mb-1">
                                Upload Main Image
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Recommended: 4:3 aspect ratio
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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
              disabled={createMutation.isPending || updateMutation.isPending || isUploading}
              className={cn(
                "h-11 px-6",
                "transition-all duration-200"
              )}
            >
              Cancel
            </Button>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleSaveLocation}
                className={cn(
                  "h-11 px-8 bg-gradient-to-r from-primary to-violet-500",
                  "hover:shadow-lg hover:shadow-primary/30",
                  "border-0 text-white font-semibold",
                  "transition-all duration-200"
                )}
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
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
