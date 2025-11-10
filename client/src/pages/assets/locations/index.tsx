import { useState } from "react";
import { Plus, Search, MapPin, Upload, X, Loader2, Sparkles, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const MAX_LOCATION_REFERENCES = 4;

interface Location {
  id: string;
  name: string;
  description: string;
  details: string;
  thumbnailUrl?: string;
  referenceImages: string[];
}

export default function Locations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [newLocation, setNewLocation] = useState({ name: "", description: "", details: "" });
  const [locationReferenceImages, setLocationReferenceImages] = useState<string[]>([]);
  const [generatedLocationImage, setGeneratedLocationImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const [locations, setLocations] = useState<Location[]>([
    { 
      id: "1", 
      name: "Modern Coffee Shop", 
      description: "Cozy urban cafe with large windows", 
      details: "Warm lighting, wooden furniture, exposed brick walls, plants",
      thumbnailUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80",
      referenceImages: []
    },
    { 
      id: "2", 
      name: "City Park at Sunset", 
      description: "Beautiful park with walking paths", 
      details: "Green grass, mature trees, benches, golden hour lighting",
      thumbnailUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&q=80",
      referenceImages: []
    },
    { 
      id: "3", 
      name: "Tech Startup Office", 
      description: "Modern open-plan workspace", 
      details: "Glass walls, standing desks, collaborative spaces, minimalist design",
      thumbnailUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&q=80",
      referenceImages: []
    },
  ]);

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNew = () => {
    setEditingLocation(null);
    setNewLocation({ name: "", description: "", details: "" });
    setLocationReferenceImages([]);
    setGeneratedLocationImage(null);
    setIsDialogOpen(true);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setNewLocation({
      name: location.name,
      description: location.description,
      details: location.details,
    });
    setLocationReferenceImages(location.referenceImages || []);
    setGeneratedLocationImage(location.thumbnailUrl || null);
    setIsDialogOpen(true);
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

    if (editingLocation) {
      // Update existing location
      setLocations(locations.map(loc =>
        loc.id === editingLocation.id
          ? {
              ...loc,
              name: newLocation.name,
              description: newLocation.description,
              details: newLocation.details,
              thumbnailUrl: generatedLocationImage || loc.thumbnailUrl,
              referenceImages: locationReferenceImages,
            }
          : loc
      ));
      toast({
        title: "Location Updated",
        description: `${newLocation.name} has been updated.`,
      });
    } else {
      // Create new location
      const locationId = `loc-${Date.now()}`;
      const location: Location = {
        id: locationId,
        name: newLocation.name,
        description: newLocation.description,
        details: newLocation.details,
        thumbnailUrl: generatedLocationImage || undefined,
        referenceImages: locationReferenceImages,
      };
      setLocations([...locations, location]);
      toast({
        title: "Location Created",
        description: `${newLocation.name} has been added to your library.`,
      });
    }

    setIsDialogOpen(false);
    setNewLocation({ name: "", description: "", details: "" });
    setLocationReferenceImages([]);
    setGeneratedLocationImage(null);
  };

  const handleGenerateLocation = () => {
    setIsGenerating(true);
    setTimeout(() => {
      // Generate a random location image from Unsplash (using valid photo IDs)
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
    const url = URL.createObjectURL(file);
    setLocationReferenceImages([...locationReferenceImages, url]);
  };

  const handleRemoveLocationReference = (index: number) => {
    setLocationReferenceImages(locationReferenceImages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Locations</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage location settings for your videos
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={handleCreateNew} data-testid="button-create-location">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredLocations.map((location) => (
          <Card 
            key={location.id} 
            className="relative aspect-[4/3] overflow-hidden group cursor-pointer hover-elevate" 
            onClick={() => handleEditLocation(location)}
            data-testid={`location-card-${location.id}`}
          >
            <CardContent className="p-0 h-full">
              <div className="h-full bg-muted flex items-center justify-center relative">
                {location.thumbnailUrl ? (
                  <img src={location.thumbnailUrl} alt={location.name} className="h-full w-full object-cover" />
                ) : (
                  <MapPin className="h-16 w-16 text-muted-foreground" />
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditLocation(location);
                  }}
                  data-testid={`button-edit-location-${location.id}`}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
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

      {/* Location Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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

            <Button onClick={handleSaveLocation} className="w-full" data-testid="button-save-location">
              {editingLocation ? "Update Location" : "Add Location"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
