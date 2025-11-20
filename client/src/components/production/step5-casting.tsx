import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, User, MapPin } from "lucide-react";

interface Step5CastingProps {
  selectedCharacters: string[];
  onSelectedCharactersChange: (ids: string[]) => void;
  selectedLocations: string[];
  onSelectedLocationsChange: (ids: string[]) => void;
}

export function Step5Casting({
  selectedCharacters,
  onSelectedCharactersChange,
  selectedLocations,
  onSelectedLocationsChange,
}: Step5CastingProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Casting (Optional)</h2>
        <p className="text-muted-foreground mt-2">
          Select characters and locations. The AI will use them when they fit in the story
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Characters</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="button-add-character"
            >
              <Plus className="h-4 w-4 mr-2" />
              Select Characters
            </Button>
          </div>
          
          {selectedCharacters.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No characters selected. The AI will create characters as needed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {selectedCharacters.map((id) => (
                <Card key={id} data-testid={`card-character-${id}`}>
                  <CardContent className="p-4">
                    <p className="font-medium">Character {id}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Locations</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="button-add-location"
            >
              <Plus className="h-4 w-4 mr-2" />
              Select Locations
            </Button>
          </div>
          
          {selectedLocations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No locations selected. The AI will create locations as needed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {selectedLocations.map((id) => (
                <Card key={id} data-testid={`card-location-${id}`}>
                  <CardContent className="p-4">
                    <p className="font-medium">Location {id}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-muted/50 p-4 rounded-md">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Characters and locations are optional. If you don't select any, the AI will
          automatically create appropriate characters and settings based on your story ideas.
        </p>
      </div>
    </div>
  );
}
