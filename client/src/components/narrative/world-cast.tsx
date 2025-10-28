import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Upload, Check, Pencil, User, Library, ChevronDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Character, ReferenceImage } from "@shared/schema";

interface WorldCastProps {
  videoId: string;
  workspaceId: string;
  characters: Character[];
  referenceImages: ReferenceImage[];
  artStyle?: string;
  aspectRatio?: string;
  onCharactersChange: (characters: Character[]) => void;
  onReferenceImagesChange: (images: ReferenceImage[]) => void;
  onWorldSettingsChange?: (settings: { artStyle: string; aspectRatio: string }) => void;
  onNext: () => void;
}

const VIDEO_STYLES = [
  { id: "none", name: "None" },
  { id: "cinematic", name: "Cinematic" },
  { id: "vintage", name: "Vintage" },
  { id: "storybook", name: "Storybook" },
];

const ASPECT_RATIOS = [
  { id: "16:9", label: "16:9" },
  { id: "1:1", label: "1:1" },
  { id: "9:16", label: "9:16" },
];

export function WorldCast({ 
  videoId,
  workspaceId, 
  characters, 
  referenceImages,
  artStyle = "none",
  aspectRatio = "16:9",
  onCharactersChange, 
  onReferenceImagesChange,
  onWorldSettingsChange,
  onNext 
}: WorldCastProps) {
  const [isAddCharacterOpen, setIsAddCharacterOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [newCharacter, setNewCharacter] = useState({ name: "", description: "", appearance: "" });
  const [cinematicInspiration, setCinematicInspiration] = useState("");
  const [selectedArtStyle, setSelectedArtStyle] = useState(artStyle);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatio);
  const { toast } = useToast();

  // Fetch character library from database
  const { data: libraryCharacters, isLoading: isLoadingLibrary } = useQuery<Character[]>({
    queryKey: [`/api/characters?workspaceId=${workspaceId}`],
    enabled: isLibraryOpen && !!workspaceId,
  });

  const handleSaveCharacter = () => {
    if (!newCharacter.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a character name.",
        variant: "destructive",
      });
      return;
    }

    if (editingCharacter) {
      const updatedCharacters = characters.map(c => 
        c.id === editingCharacter.id 
          ? { ...c, name: newCharacter.name, description: newCharacter.description, appearance: newCharacter.appearance }
          : c
      );
      onCharactersChange(updatedCharacters);
      toast({
        title: "Character Updated",
        description: `${newCharacter.name} has been updated.`,
      });
    } else {
      const character: Character = {
        id: `char-${Date.now()}`,
        workspaceId: workspaceId,
        name: newCharacter.name,
        description: newCharacter.description || null,
        appearance: newCharacter.appearance || null,
        voiceSettings: null,
        thumbnailUrl: null,
        createdAt: new Date(),
      };

      onCharactersChange([...characters, character]);
      toast({
        title: "Character Added",
        description: `${character.name} has been added to your cast.`,
      });
    }

    setNewCharacter({ name: "", description: "", appearance: "" });
    setEditingCharacter(null);
    setIsAddCharacterOpen(false);
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setNewCharacter({
      name: character.name,
      description: character.description || "",
      appearance: (character.appearance as string) || "",
    });
    setIsAddCharacterOpen(true);
  };

  const handleSelectFromLibrary = (libraryCharacter: Character) => {
    // Check if character is already in cast
    const alreadyAdded = characters.some(c => c.id === libraryCharacter.id);
    if (alreadyAdded) {
      toast({
        title: "Already Added",
        description: `${libraryCharacter.name} is already in your cast.`,
        variant: "destructive",
      });
      return;
    }

    onCharactersChange([...characters, libraryCharacter]);
    toast({
      title: "Character Added",
      description: `${libraryCharacter.name} has been added to your cast from library.`,
    });
    setIsLibraryOpen(false);
  };

  const handleUploadReference = (file: File) => {
    const refImage: ReferenceImage = {
      id: `ref-${Date.now()}`,
      videoId,
      shotId: null,
      characterId: null,
      type: "style",
      imageUrl: URL.createObjectURL(file),
      description: null,
      createdAt: new Date(),
    };

    onReferenceImagesChange([...referenceImages, refImage]);
    toast({
      title: "Reference Uploaded",
      description: "Style reference image added.",
    });
  };

  const handleArtStyleChange = (styleId: string) => {
    setSelectedArtStyle(styleId);
    if (onWorldSettingsChange) {
      onWorldSettingsChange({ artStyle: styleId, aspectRatio: selectedAspectRatio });
    }
  };

  const handleAspectRatioChange = (ratio: string) => {
    setSelectedAspectRatio(ratio);
    if (onWorldSettingsChange) {
      onWorldSettingsChange({ artStyle: selectedArtStyle, aspectRatio: ratio });
    }
  };

  const styleRefs = referenceImages.filter((r) => r.type === "style");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
      {/* Settings Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Settings</h3>
          
          <div className="space-y-6">
            {/* Aspect Ratio */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">ASPECT RATIO</Label>
              <div className="flex gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <Button
                    key={ratio.id}
                    variant={selectedAspectRatio === ratio.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleAspectRatioChange(ratio.id)}
                    className="flex-1"
                    data-testid={`aspect-ratio-${ratio.id}`}
                  >
                    {ratio.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Video Style */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">VIDEO STYLE</Label>
                <Button variant="ghost" size="sm" className="text-xs">View All</Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {VIDEO_STYLES.map((style) => (
                  <Card
                    key={style.id}
                    className={`cursor-pointer transition-all hover-elevate relative ${
                      selectedArtStyle === style.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleArtStyleChange(style.id)}
                    data-testid={`video-style-${style.id}`}
                  >
                    {selectedArtStyle === style.id && (
                      <div className="absolute top-1 right-1 z-10 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    <CardContent className="p-0">
                      <div className="aspect-square bg-muted rounded-t-md flex items-center justify-center">
                        <div className="w-12 h-12 bg-background/50 rounded-full" />
                      </div>
                      <div className="p-2 text-center">
                        <p className="text-xs font-medium">{style.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Style Reference */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">STYLE REFERENCE</Label>
              <div className="space-y-2">
                {styleRefs.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {styleRefs.map((ref) => (
                      <div key={ref.id} className="aspect-square rounded-lg border overflow-hidden bg-muted">
                        <img src={ref.imageUrl} alt="Style Reference" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover-elevate">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadReference(file);
                    }}
                  />
                  <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Drag image here or upload a file</span>
                </label>
              </div>
            </div>

            {/* Cinematic Inspiration */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">CINEMATIC INSPIRATION</Label>
              <Input
                placeholder='E.g. "Retro, gritty, eclectic, stylish, noir..."'
                value={cinematicInspiration}
                onChange={(e) => setCinematicInspiration(e.target.value)}
                data-testid="input-cinematic-inspiration"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cast Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Cast</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Add Character Card with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Card
                className="cursor-pointer hover-elevate flex items-center justify-center aspect-[3/4] bg-card/50"
                data-testid="button-add-character"
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Add character</p>
                  <ChevronDown className="h-4 w-4 text-muted-foreground mt-1" />
                </CardContent>
              </Card>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => {
                  setEditingCharacter(null);
                  setNewCharacter({ name: "", description: "", appearance: "" });
                  setIsAddCharacterOpen(true);
                }}
                data-testid="menu-create-new-character"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Character
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsLibraryOpen(true)}
                data-testid="menu-browse-library"
              >
                <Library className="h-4 w-4 mr-2" />
                Browse Library
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Character Cards */}
          {characters.map((character) => (
            <Card key={character.id} className="relative aspect-[3/4] overflow-hidden group" data-testid={`character-${character.id}`}>
              <CardContent className="p-0 h-full">
                <div className="h-full bg-muted flex items-center justify-center relative">
                  <User className="h-16 w-16 text-muted-foreground" />
                  
                  {/* Edit Button */}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleEditCharacter(character)}
                    data-testid={`button-edit-character-${character.id}`}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
                
                {/* Character Info */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-sm font-semibold text-white">{character.name}</p>
                  {character.description && (
                    <p className="text-xs text-white/80 line-clamp-2">{character.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Character Dialog */}
      <Dialog open={isAddCharacterOpen} onOpenChange={setIsAddCharacterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCharacter ? "Edit Character" : "Create New Character"}</DialogTitle>
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
            <Button onClick={handleSaveCharacter} className="w-full" data-testid="button-save-character">
              {editingCharacter ? "Update Character" : "Add Character"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Character Library Dialog */}
      <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Character Library</DialogTitle>
            <DialogDescription>
              Choose from your previously created characters
            </DialogDescription>
          </DialogHeader>
          {isLoadingLibrary ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !libraryCharacters || libraryCharacters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No characters in your library yet.</p>
              <p className="text-sm text-muted-foreground mt-2">Create characters to use them across your videos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 mt-4">
              {libraryCharacters.map((libraryChar) => {
              const isAdded = characters.some(c => c.id === libraryChar.id);
              return (
                <Card
                  key={libraryChar.id}
                  className={`relative aspect-[3/4] overflow-hidden cursor-pointer hover-elevate ${
                    isAdded ? 'opacity-50' : ''
                  }`}
                  onClick={() => !isAdded && handleSelectFromLibrary(libraryChar)}
                  data-testid={`library-character-${libraryChar.id}`}
                >
                  <CardContent className="p-0 h-full">
                    <div className="h-full bg-muted flex items-center justify-center relative">
                      <User className="h-16 w-16 text-muted-foreground" />
                      {isAdded && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Check className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-sm font-semibold text-white">{libraryChar.name}</p>
                      {libraryChar.description && (
                        <p className="text-xs text-white/80 line-clamp-2">{libraryChar.description}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Next Button */}
      <div className="lg:col-span-2 flex justify-end pt-4">
        <Button onClick={onNext} size="lg" data-testid="button-next">
          Next
        </Button>
      </div>
    </div>
  );
}
