import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { MapPin, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LocationSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLocations: string[];
  onSelectedLocationsChange: (locations: string[]) => void;
}

export function LocationSelectionDialog({
  open,
  onOpenChange,
  selectedLocations,
  onSelectedLocationsChange,
}: LocationSelectionDialogProps) {
  const [newLocation, setNewLocation] = useState("");

  const addLocation = () => {
    if (newLocation.trim() && !selectedLocations.includes(newLocation.trim())) {
      onSelectedLocationsChange([...selectedLocations, newLocation.trim()]);
      setNewLocation("");
    }
  };

  const removeLocation = (location: string) => {
    onSelectedLocationsChange(selectedLocations.filter(l => l !== location));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addLocation();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Locations</DialogTitle>
          <DialogDescription>
            Add locations that the AI can use when creating videos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location-name">Location Name</Label>
            <div className="flex gap-2">
              <Input
                id="location-name"
                placeholder="e.g., Ancient Temple, City Streets"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyPress={handleKeyPress}
                data-testid="input-location-name"
              />
              <Button
                onClick={addLocation}
                disabled={!newLocation.trim()}
                data-testid="button-add-location"
              >
                Add
              </Button>
            </div>
          </div>

          {selectedLocations.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Locations ({selectedLocations.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedLocations.map((location) => (
                  <Badge
                    key={location}
                    variant="secondary"
                    className="gap-1"
                    data-testid={`badge-location-${location}`}
                  >
                    <MapPin className="h-3 w-3" />
                    {location}
                    <button
                      onClick={() => removeLocation(location)}
                      className="ml-1 hover:text-destructive"
                      data-testid={`button-remove-location-${location}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button onClick={() => onOpenChange(false)} data-testid="button-done">
              Done ({selectedLocations.length} selected)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
