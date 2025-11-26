import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, User, MapPin, Star, AlertCircle, Check } from "lucide-react";
import { useState } from "react";
import { CharacterSelectionDialog } from "./character-selection-dialog";
import { LocationSelectionDialog } from "./location-selection-dialog";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  const isCharacterVlog = videoMode === "character_vlog";
  const needsMainCharacter = isCharacterVlog && selectedCharacters.length > 0 && !mainCharacterId;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold">Casting</h2>
        <p className="text-muted-foreground mt-2">
          {isCharacterVlog 
            ? "Select characters for your vlog. One character will be designated as the main host."
            : "Select characters and locations. The AI will incorporate them when they fit the story."
          }
        </p>
      </div>

      {isCharacterVlog && selectedCharacters.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Character Vlog mode requires at least one character to be selected as the main host.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Characters
              {selectedCharacters.length > 0 && (
                <Badge variant="secondary">{selectedCharacters.length}</Badge>
              )}
            </CardTitle>
            <Button
              type="button"
              size="sm"
              onClick={() => setCharacterDialogOpen(true)}
              data-testid="button-add-character"
            >
              <Plus className="h-4 w-4 mr-2" />
              Select Characters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selectedCharacters.length === 0 ? (
            <div className="text-center py-8 border rounded-lg border-dashed">
              <User className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {isCharacterVlog 
                  ? "Select a character to be your vlog host"
                  : "No characters selected. AI will create them as needed."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {isCharacterVlog && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span>Click to select the main character for your vlog</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedCharacters.map((id) => {
                  const character = characters.find(c => c.id === id);
                  const isMainCharacter = mainCharacterId === id;
                  
                  return (
                    <div
                      key={id}
                      className={`relative p-4 rounded-lg border transition-all ${
                        isMainCharacter
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : isCharacterVlog
                          ? "cursor-pointer hover:border-primary/50 hover:bg-muted/50"
                          : ""
                      }`}
                      onClick={() => isCharacterVlog && onMainCharacterIdChange?.(id)}
                      data-testid={`card-character-${id}`}
                    >
                      {isMainCharacter && (
                        <div className="absolute -top-2 -right-2">
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                            <Star className="h-3 w-3 text-primary-foreground fill-primary-foreground" />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={character?.thumbnailUrl} alt={character?.name} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate text-sm">{character?.name || 'Loading...'}</h4>
                          {isMainCharacter && (
                            <Badge variant="default" className="text-xs mt-1">Main Host</Badge>
                          )}
                          {character?.description && !isMainCharacter && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                              {character.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Locations
              {selectedLocations.length > 0 && (
                <Badge variant="secondary">{selectedLocations.length}</Badge>
              )}
            </CardTitle>
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
        </CardHeader>
        <CardContent>
          {selectedLocations.length === 0 ? (
            <div className="text-center py-8 border rounded-lg border-dashed">
              <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No locations selected. AI will create settings as needed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {selectedLocations.map((id) => {
                const location = locations.find(l => l.id === id);
                return (
                  <div 
                    key={id} 
                    className="relative overflow-hidden rounded-lg border aspect-video group"
                    data-testid={`card-location-${id}`}
                  >
                    <div className="absolute inset-0 bg-muted flex items-center justify-center">
                      {location?.thumbnailUrl ? (
                        <img 
                          src={location.thumbnailUrl} 
                          alt={location.name} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <MapPin className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-medium text-white">{location?.name || 'Loading...'}</p>
                      {location?.description && (
                        <p className="text-xs text-white/70 line-clamp-1">{location.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {!isCharacterVlog && (
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Characters and locations are optional. If you don't select any, 
            the AI will automatically create appropriate characters and settings based on your story ideas.
          </p>
        </div>
      )}

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
