import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { User, Plus } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface Character {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
}

interface CharacterSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCharacterIds: string[];
  onSelectedCharactersChange: (ids: string[]) => void;
}

export function CharacterSelectionDialog({
  open,
  onOpenChange,
  selectedCharacterIds,
  onSelectedCharactersChange,
}: CharacterSelectionDialogProps) {
  const { toast } = useToast();
  const [newCharacterName, setNewCharacterName] = useState("");
  const [newCharacterDescription, setNewCharacterDescription] = useState("");

  // For now, we'll use a mock workspace ID until auth is implemented
  const workspaceId = "default-workspace";

  const { data: characters = [], isLoading } = useQuery<Character[]>({
    queryKey: [`/api/characters?workspaceId=${workspaceId}`],
    enabled: open,
  });

  const createCharacter = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          name: newCharacterName,
          description: newCharacterDescription,
        }),
      });
      if (!res.ok) throw new Error("Failed to create character");
      return res.json();
    },
    onSuccess: (newCharacter) => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters?workspaceId=${workspaceId}`] });
      onSelectedCharactersChange([...selectedCharacterIds, newCharacter.id]);
      setNewCharacterName("");
      setNewCharacterDescription("");
      toast({
        title: "Character created",
        description: "Character has been added to your library and selected",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create character",
        variant: "destructive",
      });
    },
  });

  const toggleCharacter = (characterId: string) => {
    if (selectedCharacterIds.includes(characterId)) {
      onSelectedCharactersChange(selectedCharacterIds.filter(id => id !== characterId));
    } else {
      onSelectedCharactersChange([...selectedCharacterIds, characterId]);
    }
  };

  const handleCreateCharacter = () => {
    if (!newCharacterName.trim()) {
      toast({
        title: "Validation error",
        description: "Character name is required",
        variant: "destructive",
      });
      return;
    }
    createCharacter.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Characters</DialogTitle>
          <DialogDescription>
            Choose characters from your library or create a new one
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="library">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">From Library</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading characters...</div>
            ) : characters.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No characters in your library yet</p>
                <p className="text-sm text-muted-foreground mt-1">Create your first character in the "Create New" tab</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {characters.map((character) => {
                  const isSelected = selectedCharacterIds.includes(character.id);
                  return (
                    <Card
                      key={character.id}
                      className={`cursor-pointer transition-all ${
                        isSelected ? "ring-2 ring-primary" : "hover-elevate"
                      }`}
                      onClick={() => toggleCharacter(character.id)}
                      data-testid={`card-character-${character.id}`}
                    >
                      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
                        <Checkbox
                          checked={isSelected}
                          onClick={(e) => e.stopPropagation()}
                          onCheckedChange={() => toggleCharacter(character.id)}
                          data-testid={`checkbox-character-${character.id}`}
                        />
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={character.thumbnailUrl} alt={character.name} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate text-sm">{character.name}</h4>
                        </div>
                      </CardHeader>
                      {character.description && (
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

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button onClick={() => onOpenChange(false)} data-testid="button-done">
                Done ({selectedCharacterIds.length} selected)
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="character-name">Character Name *</Label>
                <Input
                  id="character-name"
                  placeholder="e.g., Captain Sarah"
                  value={newCharacterName}
                  onChange={(e) => setNewCharacterName(e.target.value)}
                  data-testid="input-character-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="character-description">Description (Optional)</Label>
                <Input
                  id="character-description"
                  placeholder="Brief description of the character"
                  value={newCharacterDescription}
                  onChange={(e) => setNewCharacterDescription(e.target.value)}
                  data-testid="input-character-description"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-create">
                Cancel
              </Button>
              <Button
                onClick={handleCreateCharacter}
                disabled={createCharacter.isPending}
                data-testid="button-create-character"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createCharacter.isPending ? "Creating..." : "Create & Select"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
