import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, X, Loader2, Sparkles, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MAX_LOCATION_REFERENCES = 4;

interface LocationData {
  name: string;
  description: string;
  details: string;
  thumbnailUrl?: string | null;
  referenceImages?: string[];
}

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLocation: LocationData | null;
  onSave: (locationData: {
    name: string;
    description: string;
    details: string;
    thumbnailUrl: string | null;
    referenceImages: string[];
  }) => void;
}

export function LocationDialog({
  open,
  onOpenChange,
  editingLocation,
  onSave,
}: LocationDialogProps) {
  const [newLocation, setNewLocation] = useState({ name: "", description: "", details: "" });
  const [locationReferenceImages, setLocationReferenceImages] = useState<string[]>([]);
  const [generatedLocationImage, setGeneratedLocationImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (editingLocation) {
        setNewLocation({
          name: editingLocation.name,
          description: editingLocation.description,
          details: editingLocation.details,
        });
        setLocationReferenceImages(editingLocation.referenceImages || []);
        setGeneratedLocationImage(editingLocation.thumbnailUrl || null);
      } else {
        setNewLocation({ name: "", description: "", details: "" });
        setLocationReferenceImages([]);
        setGeneratedLocationImage(null);
      }
    }
  }, [open, editingLocation]);

  const handleGenerateLocation = () => {
    if (!newLocation.details.trim()) {
      toast({
        title: "Details Required",
        description: "Please describe the location details before generating an image.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const samplePhotoIds = [
        "1501339847302-ac426a4a7cbb", // coffee shop
        "1568605117036-5fe5e7bab0b7", // park
        "1497366811353-6870744d04b2", // office
        "1555774698-0b77e0d4a85", // beach
        "1506905925346-21bda4d32df4", // mountains
      ];
      const randomId = samplePhotoIds[Math.floor(Math.random() * samplePhotoIds.length)];
      setGeneratedLocationImage(`https://images.unsplash.com/photo-${randomId}?w=400&q=80`);
      setIsGenerating(false);
      toast({
        title: "Location Generated",
        description: "AI has generated a location image based on your description.",
      });
    }, 2000);
  };

  const handleUploadLocationReference = (file: File) => {
    if (locationReferenceImages.length >= MAX_LOCATION_REFERENCES) {
      toast({
        title: "Maximum Reached",
        description: `You can only upload up to ${MAX_LOCATION_REFERENCES} reference images per location.`,
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(file);
    setLocationReferenceImages([...locationReferenceImages, url]);
    toast({
      title: "Reference Uploaded",
      description: "Location reference image added.",
    });
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

    onSave({
      name: newLocation.name,
      description: newLocation.description,
      details: newLocation.details,
      thumbnailUrl: generatedLocationImage,
      referenceImages: locationReferenceImages,
    });

    // Reset form
    setNewLocation({ name: "", description: "", details: "" });
    setLocationReferenceImages([]);
    setGeneratedLocationImage(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                className="w-full"
                disabled={isGenerating || !newLocation.details.trim()}
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
                    {locationReferenceImages.map((url, index) => (
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
                <Label>Generated Location Image</Label>
                <div className="aspect-[4/3] rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                  {generatedLocationImage ? (
                    <img 
                      src={generatedLocationImage} 
                      alt="Generated location" 
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <div className="text-center p-4">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Generated image will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full" data-testid="button-save-location">
            {editingLocation ? "Update Location" : "Add Location"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
