import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, User, MapPin } from "lucide-react";
import { useState } from "react";
import { CharacterSelectionDialog } from "./character-selection-dialog";
import { LocationSelectionDialog } from "./location-selection-dialog";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Character {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
}

interface Location {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
}

interface Step6CastingProps {
  selectedCharacters: string[];
  onSelectedCharactersChange: (ids: string[]) => void;
  selectedLocations: string[];
  onSelectedLocationsChange: (ids: string[]) => void;
  videoMode?: string;
  mainCharacterId?: string | null;
  onMainCharacterIdChange?: (id: string | null) => void;
}

export function Step6Casting({
  selectedCharacters,
  onSelectedCharactersChange,
  selectedLocations,
  onSelectedLocationsChange,
  videoMode,
  mainCharacterId,
  onMainCharacterIdChange,
}: Step6CastingProps) {
  const [characterDialogOpen, setCharacterDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  const workspaceId = "default-workspace";
  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: [`/api/characters?workspaceId=${workspaceId}`],
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: [`/api/locations?workspaceId=${workspaceId}`],
  });
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
              onClick={() => setCharacterDialogOpen(true)}
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
              {selectedCharacters.map((id) => {
                const character = characters.find(c => c.id === id);
                return (
                  <Card key={id} data-testid={`card-character-${id}`}>
                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={character?.thumbnailUrl} alt={character?.name} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate text-sm">{character?.name || 'Loading...'}</h4>
                      </div>
                    </CardHeader>
                    {character?.description && (
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {character.description}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {videoMode === "character_vlog" && selectedCharacters.length > 0 && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div>
              <Label htmlFor="main-character">Main Character (Required)</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Select the primary character who will narrate and appear in your vlog
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {selectedCharacters.map((id) => {
                const character = characters.find(c => c.id === id);
                const isSelected = mainCharacterId === id;
                return (
                  <Card 
                    key={id} 
                    className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
                    onClick={() => onMainCharacterIdChange?.(id)}
                    data-testid={`card-main-character-${id}`}
                  >
                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={character?.thumbnailUrl} alt={character?.name} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate text-sm">{character?.name || 'Loading...'}</h4>
                        {isSelected && (
                          <span className="text-xs text-primary">Main Character</span>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {videoMode === "character_vlog" && selectedCharacters.length === 0 && (
          <div className="p-4 border border-dashed border-amber-500 rounded-lg bg-amber-500/10">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              <strong>Note:</strong> Character Vlog mode requires selecting at least one character above to designate as the main character.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Locations</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLocationDialogOpen(true)}
              data-testid="button-add-location"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Locations
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
              {selectedLocations.map((id) => {
                const location = locations.find(l => l.id === id);
                return (
                  <Card key={id} data-testid={`card-location-${id}`}>
                    <CardContent className="p-0 aspect-[4/3] relative overflow-hidden">
                      <div className="h-full bg-muted flex items-center justify-center">
                        {location?.thumbnailUrl ? (
                          <img src={location.thumbnailUrl} alt={location.name} className="h-full w-full object-cover" />
                        ) : (
                          <MapPin className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-sm font-semibold text-white">{location?.name || 'Loading...'}</p>
                        {location?.description && (
                          <p className="text-xs text-white/70 line-clamp-1">{location.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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

      <CharacterSelectionDialog
        open={characterDialogOpen}
        onOpenChange={setCharacterDialogOpen}
        selectedCharacterIds={selectedCharacters}
        onSelectedCharactersChange={onSelectedCharactersChange}
      />

      <LocationSelectionDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        selectedLocationIds={selectedLocations}
        onSelectedLocationsChange={onSelectedLocationsChange}
      />
    </div>
  );
}
