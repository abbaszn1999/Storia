import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Character, ReferenceImage } from "@shared/schema";

interface WorldCastProps {
  videoId: string;
  characters: Character[];
  referenceImages: ReferenceImage[];
  onCharactersChange: (characters: Character[]) => void;
  onReferenceImagesChange: (images: ReferenceImage[]) => void;
  onNext: () => void;
}

export function WorldCast({ 
  videoId, 
  characters, 
  referenceImages,
  onCharactersChange, 
  onReferenceImagesChange,
  onNext 
}: WorldCastProps) {
  const [isAddCharacterOpen, setIsAddCharacterOpen] = useState(false);
  const [newCharacter, setNewCharacter] = useState({ name: "", description: "", appearance: "" });
  const [styleDescription, setStyleDescription] = useState("");
  const { toast } = useToast();

  const handleAddCharacter = () => {
    if (!newCharacter.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a character name.",
        variant: "destructive",
      });
      return;
    }

    const character: Character = {
      id: `char-${Date.now()}`,
      workspaceId: "temp",
      name: newCharacter.name,
      description: newCharacter.description || null,
      appearance: newCharacter.appearance || null,
      voiceSettings: null,
      thumbnailUrl: null,
      createdAt: new Date(),
    };

    onCharactersChange([...characters, character]);
    setNewCharacter({ name: "", description: "", appearance: "" });
    setIsAddCharacterOpen(false);
    toast({
      title: "Character Added",
      description: `${character.name} has been added to your cast.`,
    });
  };

  const handleRemoveCharacter = (id: string) => {
    onCharactersChange(characters.filter((c) => c.id !== id));
  };

  const handleUploadReference = (type: "style" | "character", file: File, characterId?: string) => {
    const refImage: ReferenceImage = {
      id: `ref-${Date.now()}`,
      videoId,
      shotId: null,
      characterId: characterId || null,
      type,
      imageUrl: URL.createObjectURL(file),
      description: null,
      createdAt: new Date(),
    };

    onReferenceImagesChange([...referenceImages, refImage]);
    toast({
      title: "Reference Uploaded",
      description: `${type === "style" ? "Style" : "Character"} reference image added.`,
    });
  };

  const styleRefs = referenceImages.filter((r) => r.type === "style");
  const characterRefs = referenceImages.filter((r) => r.type === "character");

  return (
    <div className="space-y-6">
      <Tabs defaultValue="characters" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="characters" data-testid="tab-characters">Characters</TabsTrigger>
          <TabsTrigger value="world" data-testid="tab-world">World & Style</TabsTrigger>
        </TabsList>

        <TabsContent value="characters" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Cast</h3>
              <p className="text-sm text-muted-foreground">
                Define characters and upload reference images for consistency
              </p>
            </div>
            <Dialog open={isAddCharacterOpen} onOpenChange={setIsAddCharacterOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-character">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Character
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Character</DialogTitle>
                  <DialogDescription>
                    Define a character for your story. Upload reference images for consistency.
                  </DialogDescription>
                </DialogHeader>
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
                    <Label htmlFor="char-appearance">Appearance</Label>
                    <Textarea
                      id="char-appearance"
                      placeholder="Describe physical appearance, clothing, distinctive features..."
                      value={newCharacter.appearance}
                      onChange={(e) => setNewCharacter({ ...newCharacter, appearance: e.target.value })}
                      data-testid="input-character-appearance"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="char-description">Personality & Role</Label>
                    <Textarea
                      id="char-description"
                      placeholder="Personality traits, role in the story..."
                      value={newCharacter.description}
                      onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
                      data-testid="input-character-description"
                    />
                  </div>
                  <Button onClick={handleAddCharacter} className="w-full" data-testid="button-save-character">
                    Add Character
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {characters.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No characters added yet. Click "Add Character" to begin.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {characters.map((character) => {
                const charRefs = characterRefs.filter((r) => r.characterId === character.id);
                return (
                  <Card key={character.id}>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-base">{character.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCharacter(character.id)}
                        data-testid={`button-remove-character-${character.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {character.appearance && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Appearance</Label>
                          <p className="text-sm">{character.appearance}</p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="text-xs">Reference Images ({charRefs.length})</Label>
                        <div className="flex gap-2 flex-wrap">
                          {charRefs.map((ref) => (
                            <div key={ref.id} className="h-20 w-20 rounded-lg border overflow-hidden bg-muted">
                              <img src={ref.imageUrl} alt="Reference" className="h-full w-full object-cover" />
                            </div>
                          ))}
                          <label className="h-20 w-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover-elevate">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadReference("character", file, character.id);
                              }}
                            />
                            <Upload className="h-4 w-4 text-muted-foreground" />
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="world" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">World & Style</h3>
            <p className="text-sm text-muted-foreground">
              Define the visual style, mood, and atmosphere of your video
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Style Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Describe the overall visual style, mood, lighting, color palette, and atmosphere..."
                value={styleDescription}
                onChange={(e) => setStyleDescription(e.target.value)}
                className="min-h-32"
                data-testid="input-style-description"
              />
              
              <div className="space-y-2">
                <Label className="text-xs">Style Reference Images ({styleRefs.length})</Label>
                <p className="text-xs text-muted-foreground">
                  Upload reference images to guide the visual style
                </p>
                <div className="flex gap-2 flex-wrap">
                  {styleRefs.map((ref) => (
                    <div key={ref.id} className="h-24 w-24 rounded-lg border overflow-hidden bg-muted">
                      <img src={ref.imageUrl} alt="Style Reference" className="h-full w-full object-cover" />
                    </div>
                  ))}
                  <label className="h-24 w-24 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover-elevate">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadReference("style", file);
                      }}
                    />
                    <div className="text-center">
                      <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload</span>
                    </div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={onNext} data-testid="button-next">
          Continue to Storyboard
        </Button>
      </div>
    </div>
  );
}
