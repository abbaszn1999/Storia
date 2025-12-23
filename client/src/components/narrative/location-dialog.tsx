import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, X, Loader2, Sparkles, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MAX_LOCATION_REFERENCES } from "@/lib/constants";

interface LocationData {
  name: string;
  description: string;
  details: string;
  thumbnailUrl?: string | null;
  referenceImages?: string[];
  id?: string; // Add id for existing locations
}

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLocation: LocationData | null;
  workspaceId: string;
  selectedImageModel: string;
  videoStyles: any[];
  selectedArtStyle: string;
  onSave: (locationData: {
    name: string;
    description: string;
    details: string;
    thumbnailUrl: string | null;
    referenceImages: string[];
    generatedLocationId?: string;
  }) => void;
}

export function LocationDialog({
  open,
  onOpenChange,
  editingLocation,
  workspaceId,
  selectedImageModel,
  videoStyles,
  selectedArtStyle,
  onSave,
}: LocationDialogProps) {
  const [newLocation, setNewLocation] = useState({ name: "", description: "", details: "" });
  const [locationReferenceImages, setLocationReferenceImages] = useState<Array<{ tempId: string; previewUrl: string }>>([]);
  const [generatedLocationImage, setGeneratedLocationImage] = useState<string | null>(null);
  const [generatedLocationId, setGeneratedLocationId] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  // Map UI model to API model (from world-cast.tsx)
  const IMAGE_MODEL_API_MAP: Record<string, string> = {
    "flux": "flux-1.1-pro",
    "midjourney": "midjourney-v6.1",
    "nano-banana": "nano-banana",
    "gpt-image": "dall-e-3",
  };

  // Track if we've initialized for this dialog open session
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    if (open && !hasInitialized) {
      // Only initialize once per dialog open
      if (editingLocation) {
        setNewLocation({
          name: editingLocation.name,
          description: editingLocation.description,
          details: editingLocation.details,
        });
        // editingLocation.referenceImages are CDN URLs, not temp uploads, so start fresh
        setLocationReferenceImages([]);
        setGeneratedLocationImage(editingLocation.thumbnailUrl || null);
        setGeneratedLocationId(editingLocation.id || undefined);
      } else {
        setNewLocation({ name: "", description: "", details: "" });
        setLocationReferenceImages([]);
        setGeneratedLocationImage(null);
        setGeneratedLocationId(undefined);
      }
      setHasInitialized(true);
    } else if (!open) {
      // Reset initialization flag when dialog closes
      setHasInitialized(false);
    }
  }, [open, editingLocation, hasInitialized]);

  const handleGenerateLocation = async () => {
    if (!newLocation.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a location name before generating.",
        variant: "destructive",
      });
      return;
    }

    if (!newLocation.description.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe the location before generating an image.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Get the API model name from the selected UI model
      const apiModel = IMAGE_MODEL_API_MAP[selectedImageModel] || "nano-banana";
      
      // Get art style description from the selected art style
      const artStyleDescription = selectedArtStyle !== "none" 
        ? videoStyles.find((s: any) => s.id === selectedArtStyle)?.name 
        : undefined;
      
      console.log('[location-dialog] Generating location image:', {
        name: newLocation.name,
        model: apiModel,
        artStyle: artStyleDescription,
        hasReferenceImages: locationReferenceImages.length > 0,
      });

      // Call Agent 2.4: Location Image Generator
      // Pass locationId if editing an existing location with a real database ID
      const locationId = editingLocation?.id && !editingLocation.id.startsWith('loc-') 
        ? editingLocation.id 
        : undefined;
      
      // Extract temp IDs for location references
      const referenceTempIds = locationReferenceImages.map(img => img.tempId);
      
      const response = await apiRequest(
        'POST', 
        '/api/narrative/locations/generate-image', 
        {
          locationId, // Pass if exists to avoid creating duplicate
          name: newLocation.name,
          description: newLocation.description,
          details: newLocation.details || undefined,
          artStyleDescription,
          model: apiModel,
          referenceTempIds: referenceTempIds.length > 0 ? referenceTempIds : undefined,
          workspaceId, // Pass workspaceId in body
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || data.details || 'Failed to generate image');
      }

      if (data.imageUrl) {
        setGeneratedLocationImage(data.imageUrl);
        
        // Store the location ID returned from the API (location was created in DB during generation)
        if (data.locationId) {
          setGeneratedLocationId(data.locationId);
          console.log('[location-dialog] Location created in DB during image generation:', data.locationId);
        }
        
        toast({
          title: "Location Generated",
          description: `Location image for ${newLocation.name} has been created.`,
        });
      } else {
        throw new Error('No image URL returned');
      }
    } catch (error) {
      console.error('[location-dialog] Location image generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate location image.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadLocationReference = async (file: File) => {
    if (locationReferenceImages.length >= MAX_LOCATION_REFERENCES) {
      toast({
        title: "Maximum Reached",
        description: `You can only upload up to ${MAX_LOCATION_REFERENCES} reference images per location.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/narrative/upload-reference', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to upload reference image');
      }

      const data = await response.json();
      setLocationReferenceImages([...locationReferenceImages, {
        tempId: data.tempId,
        previewUrl: data.previewUrl,
      }]);
      
      toast({
        title: "Reference Uploaded",
        description: "Location reference image added.",
      });
    } catch (error) {
      console.error('[location-dialog] Reference upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload reference image.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveLocationReference = (index: number) => {
    setLocationReferenceImages(locationReferenceImages.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!newLocation.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a location name.",
        variant: "destructive",
      });
      return;
    }

    // Pass the database location ID if it exists (not a temporary ID starting with 'loc-')
    const dbLocationId = generatedLocationId && !generatedLocationId.startsWith('loc-') 
      ? generatedLocationId 
      : undefined;

    onSave({
      name: newLocation.name,
      description: newLocation.description,
      details: newLocation.details,
      thumbnailUrl: generatedLocationImage,
      referenceImages: [], // Reference images are temp uploads, already used during generation
      generatedLocationId: dbLocationId,
    });

    // Reset form
    setNewLocation({ name: "", description: "", details: "" });
    setLocationReferenceImages([]);
    setGeneratedLocationImage(null);
    setGeneratedLocationId(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar">
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
                  onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                  rows={3}
                  data-testid="input-location-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loc-details">Details</Label>
                <Textarea
                  id="loc-details"
                  placeholder="Visual details, atmosphere, lighting, key features..."
                  value={newLocation.details}
                  onChange={(e) => setNewLocation({ ...newLocation, details: e.target.value })}
                  rows={3}
                  data-testid="input-location-details"
                />
              </div>
              <Button 
                onClick={handleGenerateLocation} 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
                disabled={isGenerating || !newLocation.name.trim() || !newLocation.description.trim()}
                data-testid="button-generate-location"
              >
                {isGenerating ? (
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
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Reference Images ({locationReferenceImages.length}/{MAX_LOCATION_REFERENCES})</Label>
                {locationReferenceImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {locationReferenceImages.map((img, index) => (
                      <div key={img.tempId} className="relative aspect-square rounded-lg border bg-muted">
                        <div className="absolute inset-0 rounded-lg overflow-hidden">
                          <img src={img.previewUrl} alt={`Reference ${index + 1}`} className="h-full w-full object-cover" />
                        </div>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 left-2 h-6 w-6 z-10"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveLocationReference(index);
                          }}
                          data-testid={`button-remove-ref-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No reference images uploaded yet</p>
                )}
                {locationReferenceImages.length < MAX_LOCATION_REFERENCES && (
                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover-elevate">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadLocationReference(file);
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
                  {generatedLocationImage ? (
                    <>
                      <img 
                        src={generatedLocationImage} 
                        alt="Location" 
                        className="h-full w-full object-cover" 
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 h-8 w-8 z-10"
                        onClick={() => setGeneratedLocationImage(null)}
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
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file && workspaceId) {
                              try {
                                setIsGenerating(true);
                                const formData = new FormData();
                                formData.append('file', file);
                                const response = await fetch('/api/narrative/upload-reference', {
                                  method: 'POST',
                                  body: formData,
                                  credentials: 'include',
                                });
                                const data = await response.json();
                                if (response.ok && data.previewUrl) {
                                  setGeneratedLocationImage(data.previewUrl);
                                }
                              } catch (error) {
                                console.error('Upload failed:', error);
                                toast({
                                  title: "Upload Failed",
                                  description: "Failed to upload main image",
                                  variant: "destructive",
                                });
                              } finally {
                                setIsGenerating(false);
                              }
                            }
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

          <Button onClick={handleSave} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90" data-testid="button-save-location">
            {editingLocation ? "Update Location" : "Add Location"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
