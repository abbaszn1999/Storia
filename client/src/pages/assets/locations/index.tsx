import { useState } from "react";
import { Plus, Search, MapPin, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LocationDialog } from "@/components/narrative/location-dialog";

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
    setIsDialogOpen(true);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setIsDialogOpen(true);
  };

  const handleSaveLocation = (locationData: {
    name: string;
    description: string;
    details: string;
    thumbnailUrl: string | null;
    referenceImages: string[];
  }) => {
    if (editingLocation) {
      // Update existing location
      setLocations(locations.map(loc =>
        loc.id === editingLocation.id
          ? {
              ...loc,
              name: locationData.name,
              description: locationData.description,
              details: locationData.details,
              thumbnailUrl: locationData.thumbnailUrl || loc.thumbnailUrl,
              referenceImages: locationData.referenceImages,
            }
          : loc
      ));
      toast({
        title: "Location Updated",
        description: `${locationData.name} has been updated.`,
      });
    } else {
      // Create new location
      const locationId = `loc-${Date.now()}`;
      const location: Location = {
        id: locationId,
        name: locationData.name,
        description: locationData.description,
        details: locationData.details,
        thumbnailUrl: locationData.thumbnailUrl || undefined,
        referenceImages: locationData.referenceImages,
      };
      setLocations([...locations, location]);
      toast({
        title: "Location Created",
        description: `${locationData.name} has been added to your library.`,
      });
    }

    setEditingLocation(null);
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
      <LocationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveLocation}
        editingLocation={editingLocation ? {
          name: editingLocation.name,
          description: editingLocation.description,
          details: editingLocation.details,
          thumbnailUrl: editingLocation.thumbnailUrl || null,
          referenceImages: editingLocation.referenceImages,
        } : null}
      />
    </div>
  );
}
