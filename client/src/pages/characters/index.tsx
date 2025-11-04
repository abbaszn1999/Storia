import { useState } from "react";
import { Plus, Search, User, Upload, X, Loader2, Sparkles, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const MAX_CHARACTER_REFERENCES = 4;

interface Character {
  id: string;
  name: string;
  description: string;
  appearance: string;
  thumbnailUrl?: string;
  referenceImages: string[];
}

export default function Characters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [newCharacter, setNewCharacter] = useState({ name: "", description: "", appearance: "" });
  const [characterReferenceImages, setCharacterReferenceImages] = useState<string[]>([]);
  const [generatedCharacterImage, setGeneratedCharacterImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const [characters, setCharacters] = useState<Character[]>([
    { 
      id: "1", 
      name: "Alex Morgan", 
      description: "A young entrepreneur with a passion for technology", 
      appearance: "Young adult, casual business attire, confident demeanor",
      thumbnailUrl: "https://i.pravatar.cc/300?u=alex",
      referenceImages: []
    },
    { 
      id: "2", 
      name: "Sarah Chen", 
      description: "Creative director and visual storyteller", 
      appearance: "Mid-30s, stylish creative wear, artistic personality",
      thumbnailUrl: "https://i.pravatar.cc/300?u=sarah",
      referenceImages: []
    },
    { 
      id: "3", 
      name: "Marcus Williams", 
      description: "Professional narrator with warm tone", 
      appearance: "Distinguished gentleman, professional suit, friendly face",
      thumbnailUrl: "https://i.pravatar.cc/300?u=marcus",
      referenceImages: []
    },
  ]);

  const filteredCharacters = characters.filter(char =>
    char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    char.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNew = () => {
    setEditingCharacter(null);
    setNewCharacter({ name: "", description: "", appearance: "" });
    setCharacterReferenceImages([]);
    setGeneratedCharacterImage(null);
    setIsDialogOpen(true);
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setNewCharacter({
      name: character.name,
      description: character.description,
      appearance: character.appearance,
    });
    setCharacterReferenceImages(character.referenceImages || []);
    setGeneratedCharacterImage(character.thumbnailUrl || null);
    setIsDialogOpen(true);
  };

  const handleSaveCharacter = () => {
    if (!newCharacter.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a character name.",
        variant: "destructive",
      });
      return;
    }

    if (editingCharacter) {
      // Update existing character
      setCharacters(characters.map(char =>
        char.id === editingCharacter.id
          ? {
              ...char,
              name: newCharacter.name,
              description: newCharacter.description,
              appearance: newCharacter.appearance,
              thumbnailUrl: generatedCharacterImage || char.thumbnailUrl,
              referenceImages: characterReferenceImages,
            }
          : char
      ));
      toast({
        title: "Character Updated",
        description: `${newCharacter.name} has been updated.`,
      });
    } else {
      // Create new character
      const characterId = `char-${Date.now()}`;
      const character: Character = {
        id: characterId,
        name: newCharacter.name,
        description: newCharacter.description,
        appearance: newCharacter.appearance,
        thumbnailUrl: generatedCharacterImage || undefined,
        referenceImages: characterReferenceImages,
      };
      setCharacters([...characters, character]);
      toast({
        title: "Character Created",
        description: `${newCharacter.name} has been added to your library.`,
      });
    }

    setIsDialogOpen(false);
    setNewCharacter({ name: "", description: "", appearance: "" });
    setCharacterReferenceImages([]);
    setGeneratedCharacterImage(null);
  };

  const handleGenerateCharacter = () => {
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
    const url = URL.createObjectURL(file);
    setCharacterReferenceImages([...characterReferenceImages, url]);
  };

  const handleRemoveCharacterReference = (index: number) => {
    setCharacterReferenceImages(characterReferenceImages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Characters</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage AI characters for your videos
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={handleCreateNew} data-testid="button-create-character">
          <Plus className="h-4 w-4" />
          New Character
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search characters..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCharacters.map((character) => (
          <Card 
            key={character.id} 
            className="relative aspect-[3/4] overflow-hidden group cursor-pointer hover-elevate" 
            onClick={() => handleEditCharacter(character)}
            data-testid={`character-card-${character.id}`}
          >
            <CardContent className="p-0 h-full">
              <div className="h-full bg-muted flex items-center justify-center relative">
                {character.thumbnailUrl ? (
                  <img src={character.thumbnailUrl} alt={character.name} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-16 w-16 text-muted-foreground" />
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCharacter(character);
                  }}
                  data-testid={`button-edit-character-${character.id}`}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-sm font-semibold text-white">{character.name}</p>
                {character.description && (
                  <p className="text-xs text-white/70 line-clamp-1">{character.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCharacters.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No characters found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or create a new character
          </p>
        </div>
      )}

      {/* Character Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCharacter ? "Edit Character" : "Create New Character"}</DialogTitle>
            <DialogDescription>
              Define a character for your videos. Upload reference images for consistency.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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

            <Button onClick={handleSaveCharacter} className="w-full" data-testid="button-save-character">
              {editingCharacter ? "Update Character" : "Add Character"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
