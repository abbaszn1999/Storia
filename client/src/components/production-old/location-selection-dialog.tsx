import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { MapPin, Plus, Upload, X, Loader2, Sparkles, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const MAX_LOCATION_REFERENCES = 4;

interface Location {
  id: string;
  name: string;
  description?: string;
  details?: string;
  thumbnailUrl?: string;
  referenceImages?: string[];
}

interface LocationSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLocationIds: string[];
  onSelectedLocationsChange: (ids: string[]) => void;
}

export function LocationSelectionDialog({
  open,
  onOpenChange,
  selectedLocationIds,
  onSelectedLocationsChange,
}: LocationSelectionDialogProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [newLocation, setNewLocation] = useState({ name: "", description: "", details: "" });
  const [locationReferenceImages, setLocationReferenceImages] = useState<string[]>([]);
  const [generatedLocationImage, setGeneratedLocationImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const workspaceId = "default-workspace";

  const { data: locations = [], isLoading } = useQuery<Location[]>({
    queryKey: [`/api/locations?workspaceId=${workspaceId}`],
    enabled: open,
  });

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (loc.description && loc.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const createLocation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          name: newLocation.name,
          description: newLocation.description,
          details: newLocation.details,
          thumbnailUrl: generatedLocationImage || undefined,
          referenceImages: locationReferenceImages,
        }),
      });
      if (!res.ok) throw new Error("Failed to create location");
      return res.json();
    },
    onSuccess: (newLoc) => {
      queryClient.invalidateQueries({ queryKey: [`/api/locations?workspaceId=${workspaceId}`] });
      onSelectedLocationsChange([...selectedLocationIds, newLoc.id]);
      setNewLocation({ name: "", description: "", details: "" });
      setLocationReferenceImages([]);
      setGeneratedLocationImage(null);
      toast({
        title: "Location created",
        description: `${newLoc.name} has been added to your library and selected`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create location",
        variant: "destructive",
      });
    },
  });

  const toggleLocation = (locationId: string) => {
    if (selectedLocationIds.includes(locationId)) {
      onSelectedLocationsChange(selectedLocationIds.filter(id => id !== locationId));
    } else {
      onSelectedLocationsChange([...selectedLocationIds, locationId]);
    }
  };

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
    setTimeout(() => {
      const samplePhotoIds = [
        "1501339847302-ac426a4a7cbb",
        "1568605117036-5fe5e7bab0b7",
        "1497366811353-6870744d04b2",
        "1555774698-0b77e0d4a85",
        "1506905925346-21bda4d32df4",
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
  };

  const handleRemoveLocationReference = (index: number) => {
    setLocationReferenceImages(locationReferenceImages.filter((_, i) => i !== index));
  };

  const handleCreateLocation = () => {
    if (!newLocation.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a location name.",
        variant: "destructive",
      });
      return;
    }
    createLocation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Locations</DialogTitle>
          <DialogDescription>
            Choose locations from your library or create new ones
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="library">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">From Library</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-locations"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading locations...</div>
            ) : filteredLocations.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No locations found matching your search" : "No locations in your library yet"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Create your first location in the "Create New" tab</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                {filteredLocations.map((location) => {
                  const isSelected = selectedLocationIds.includes(location.id);
                  return (
                    <Card
                      key={location.id}
                      className={`relative aspect-[4/3] overflow-hidden group cursor-pointer ${
                        isSelected ? "ring-2 ring-primary" : "hover-elevate"
                      }`}
                      onClick={() => toggleLocation(location.id)}
                      data-testid={`card-location-${location.id}`}
                    >
                      <CardContent className="p-0 h-full">
                        <div className="h-full bg-muted flex items-center justify-center relative">
                          {location.thumbnailUrl ? (
                            <img src={location.thumbnailUrl} alt={location.name} className="h-full w-full object-cover" />
                          ) : (
                            <MapPin className="h-16 w-16 text-muted-foreground" />
                          )}
                          <div className="absolute top-3 left-3">
                            <Checkbox
                              checked={isSelected}
                              onClick={(e) => e.stopPropagation()}
                              onCheckedChange={() => toggleLocation(location.id)}
                              className="bg-background"
                              data-testid={`checkbox-location-${location.id}`}
                            />
                          </div>
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-sm font-semibold text-white">{location.name}</p>
                          {location.description && (
                            <p className="text-xs text-white/70 line-clamp-1">{location.description}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button onClick={() => onOpenChange(false)} data-testid="button-done">
                Done ({selectedLocationIds.length} selected)
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
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

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-create">
                Cancel
              </Button>
              <Button
                onClick={handleCreateLocation}
                disabled={createLocation.isPending}
                data-testid="button-create-location"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createLocation.isPending ? "Creating..." : "Create & Select"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
