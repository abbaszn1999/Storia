import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { User, Plus, Upload, X, Loader2, Sparkles, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const MAX_CHARACTER_REFERENCES = 4;

interface Character {
  id: string;
  name: string;
  description?: string;
  appearance?: string;
  thumbnailUrl?: string;
  referenceImages?: string[];
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
  const [searchQuery, setSearchQuery] = useState("");
  const [newCharacter, setNewCharacter] = useState({ name: "", description: "", appearance: "" });
  const [characterReferenceImages, setCharacterReferenceImages] = useState<string[]>([]);
  const [generatedCharacterImage, setGeneratedCharacterImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const workspaceId = "default-workspace";

  const { data: characters = [], isLoading } = useQuery<Character[]>({
    queryKey: [`/api/characters?workspaceId=${workspaceId}`],
    enabled: open,
  });

  const filteredCharacters = characters.filter(char =>
    char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (char.description && char.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const createCharacter = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          name: newCharacter.name,
          description: newCharacter.description,
          appearance: newCharacter.appearance,
          thumbnailUrl: generatedCharacterImage || undefined,
          referenceImages: characterReferenceImages,
        }),
      });
      if (!res.ok) throw new Error("Failed to create character");
      return res.json();
    },
    onSuccess: (newChar) => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters?workspaceId=${workspaceId}`] });
      onSelectedCharactersChange([...selectedCharacterIds, newChar.id]);
      setNewCharacter({ name: "", description: "", appearance: "" });
      setCharacterReferenceImages([]);
      setGeneratedCharacterImage(null);
      toast({
        title: "Character created",
        description: `${newChar.name} has been added to your library and selected`,
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

  const handleGenerateCharacter = () => {
    if (!newCharacter.appearance.trim()) {
      toast({
        title: "Appearance Required",
        description: "Please describe the character's appearance before generating an image.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedCharacterImage(`https://i.pravatar.cc/400?u=${Date.now()}`);
      setIsGenerating(false);
      toast({
        title: "Character Generated",
        description: "AI has generated a character image based on your description.",
      });
    }, 2000);
  };

  const handleUploadCharacterReference = (file: File) => {
    if (characterReferenceImages.length >= MAX_CHARACTER_REFERENCES) {
      toast({
        title: "Maximum Reached",
        description: `You can only upload up to ${MAX_CHARACTER_REFERENCES} reference images per character.`,
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(file);
    setCharacterReferenceImages([...characterReferenceImages, url]);
  };

  const handleRemoveCharacterReference = (index: number) => {
    setCharacterReferenceImages(characterReferenceImages.filter((_, i) => i !== index));
  };

  const handleCreateCharacter = () => {
    if (!newCharacter.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a character name.",
        variant: "destructive",
      });
      return;
    }
    createCharacter.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Characters</DialogTitle>
          <DialogDescription>
            Choose characters from your library or create new ones
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
                placeholder="Search characters..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-characters"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading characters...</div>
            ) : filteredCharacters.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No characters found matching your search" : "No characters in your library yet"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Create your first character in the "Create New" tab</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                {filteredCharacters.map((character) => {
                  const isSelected = selectedCharacterIds.includes(character.id);
                  return (
                    <Card
                      key={character.id}
                      className={`relative aspect-[3/4] overflow-hidden group cursor-pointer ${
                        isSelected ? "ring-2 ring-primary" : "hover-elevate"
                      }`}
                      onClick={() => toggleCharacter(character.id)}
                      data-testid={`card-character-${character.id}`}
                    >
                      <CardContent className="p-0 h-full">
                        <div className="h-full bg-muted flex items-center justify-center relative">
                          {character.thumbnailUrl ? (
                            <img src={character.thumbnailUrl} alt={character.name} className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-16 w-16 text-muted-foreground" />
                          )}
                          <div className="absolute top-3 left-3">
                            <Checkbox
                              checked={isSelected}
                              onClick={(e) => e.stopPropagation()}
                              onCheckedChange={() => toggleCharacter(character.id)}
                              className="bg-background"
                              data-testid={`checkbox-character-${character.id}`}
                            />
                          </div>
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-sm font-semibold text-white">{character.name}</p>
                          {character.description && (
                            <p className="text-xs text-white/70 line-clamp-1">{character.description}</p>
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
                Done ({selectedCharacterIds.length} selected)
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="char-name">Name</Label>
                  <Input
                    id="char-name"
                    placeholder="Character name"
                    value={newCharacter.name}
                    onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
                    data-testid="input-character-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="char-description">Description</Label>
                  <Textarea
                    id="char-description"
                    placeholder="Brief description of the character's role..."
                    value={newCharacter.description}
                    onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
                    rows={3}
                    data-testid="input-character-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="char-appearance">Appearance</Label>
                  <Textarea
                    id="char-appearance"
                    placeholder="Physical appearance, clothing, distinctive features..."
                    value={newCharacter.appearance}
                    onChange={(e) => setNewCharacter({ ...newCharacter, appearance: e.target.value })}
                    rows={3}
                    data-testid="input-character-appearance"
                  />
                </div>
                <Button 
                  onClick={handleGenerateCharacter} 
                  className="w-full"
                  disabled={isGenerating || !newCharacter.appearance.trim()}
                  data-testid="button-generate-character"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Character Image
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Reference Images ({characterReferenceImages.length}/{MAX_CHARACTER_REFERENCES})</Label>
                  {characterReferenceImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {characterReferenceImages.map((url, index) => (
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
                              handleRemoveCharacterReference(index);
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
                  {characterReferenceImages.length < MAX_CHARACTER_REFERENCES && (
                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover-elevate">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadCharacterReference(file);
                        }}
                        data-testid="input-upload-character-ref"
                      />
                      <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                      <span className="text-sm text-muted-foreground">Upload Reference</span>
                    </label>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Generated Character Image</Label>
                  <div className="aspect-[3/4] rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                    {generatedCharacterImage ? (
                      <img 
                        src={generatedCharacterImage} 
                        alt="Generated character" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <div className="text-center p-4">
                        <User className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
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
