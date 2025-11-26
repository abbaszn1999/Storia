import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Location {
  id: string;
  name: string;
  description: string;
  details?: string;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  referenceImages?: string[];
}

interface LocationLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onSelectLocation: (location: Location) => void;
  existingLocations: Location[];
}

export function LocationLibraryModal({
  open,
  onOpenChange,
  workspaceId,
  onSelectLocation,
  existingLocations,
}: LocationLibraryModalProps) {
  const { toast } = useToast();

  // Fetch locations library from database
  const { data: libraryLocations, isLoading } = useQuery<Location[]>({
    queryKey: [`/api/locations?workspaceId=${workspaceId}`],
    enabled: open && !!workspaceId,
  });

  const handleSelectLocation = (location: Location) => {
    // Check if location is already added
    const alreadyAdded = existingLocations.some(l => l.id === location.id);
    if (alreadyAdded) {
      toast({
        title: "Already Added",
        description: `${location.name} is already in your locations.`,
        variant: "destructive",
      });
      return;
    }

    onSelectLocation(location);
    toast({
      title: "Location Added",
      description: `${location.name} has been added from library.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Browse Locations Library</DialogTitle>
          <DialogDescription>
            Select from your saved locations to add to this project
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading locations...</p>
          </div>
        ) : libraryLocations && libraryLocations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {libraryLocations.map((location) => {
              const isAdded = existingLocations.some(l => l.id === location.id);
              const imageUrl = location.thumbnailUrl || location.imageUrl;
              
              return (
                <Card key={location.id} className="overflow-hidden hover-elevate cursor-pointer" onClick={() => !isAdded && handleSelectLocation(location)}>
                  <CardContent className="p-0">
                    <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={location.name} 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <MapPin className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{location.name}</h4>
                          {location.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {location.description}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectLocation(location);
                          }}
                          disabled={isAdded}
                          data-testid={`button-select-location-${location.id}`}
                        >
                          {isAdded ? "Added" : <Plus className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground text-center">
              No locations in your library yet
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Create locations to reuse them across projects
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
