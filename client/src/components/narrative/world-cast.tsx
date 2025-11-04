import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Upload, Check, Pencil, User, Library, ChevronDown, Loader2, Sparkles, X, MapPin, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Character, ReferenceImage } from "@shared/schema";

interface CharacterRecommendationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAnalyzing: boolean;
  onAddCharacter: (character: Character) => void;
  existingCharacters: Character[];
  videoId: string;
  workspaceId: string;
}

const MOCK_RECOMMENDED_CHARACTERS = [
  {
    name: "Detective Sarah Chen",
    description: "A sharp-witted private investigator haunted by an unsolved case from her past",
    appearance: "Asian woman in her mid-30s, dark bobbed hair, always wears a trench coat, carries a vintage camera",
  },
  {
    name: "Marcus 'The Shadow' Rodriguez",
    description: "An enigmatic informant who operates from the city's underground network",
    appearance: "Latino man, early 40s, lean build, slicked-back hair, distinctive scar across left eyebrow, wears all black",
  },
  {
    name: "Dr. Emily Winters",
    description: "A brilliant forensic pathologist with a photographic memory and obsessive attention to detail",
    appearance: "Caucasian woman in her late 20s, red curly hair often in a messy bun, round glasses, lab coat over casual clothes",
  },
];

function CharacterRecommendationModal({
  open,
  onOpenChange,
  isAnalyzing: initialAnalyzing,
  onAddCharacter,
  existingCharacters,
  videoId,
  workspaceId,
}: CharacterRecommendationModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<typeof MOCK_RECOMMENDED_CHARACTERS>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open && recommendations.length === 0) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setRecommendations(MOCK_RECOMMENDED_CHARACTERS);
        setIsAnalyzing(false);
      }, 2000);
    }
  }, [open, recommendations.length]);

  const handleAddCharacter = (recChar: typeof MOCK_RECOMMENDED_CHARACTERS[0]) => {
    const alreadyExists = existingCharacters.some(c => c.name === recChar.name);
    if (alreadyExists) {
      toast({
        title: "Already Added",
        description: `${recChar.name} is already in your cast.`,
        variant: "destructive",
      });
      return;
    }

    const character: Character = {
      id: `char-${Date.now()}-${Math.random()}`,
      workspaceId: workspaceId,
      name: recChar.name,
      description: recChar.description,
      appearance: recChar.appearance,
      voiceSettings: null,
      thumbnailUrl: null,
      createdAt: new Date(),
    };

    onAddCharacter(character);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Character Recommendations
          </DialogTitle>
          <DialogDescription>
            Based on your story script, here are suggested characters
          </DialogDescription>
        </DialogHeader>

        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Analyzing your story...</p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {recommendations.map((recChar, index) => {
              const isAdded = existingCharacters.some(c => c.name === recChar.name);
              return (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <h4 className="font-semibold text-base">{recChar.name}</h4>
                        <p className="text-sm text-muted-foreground">{recChar.description}</p>
                        <div className="pt-2">
                          <Label className="text-xs font-medium text-muted-foreground">APPEARANCE</Label>
                          <p className="text-sm mt-1">{recChar.appearance}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddCharacter(recChar)}
                        disabled={isAdded}
                        data-testid={`button-add-recommended-${index}`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="mr-2 h-3 w-3" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-3 w-3" />
                            Add to Cast
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface WorldCastProps {
  videoId: string;
  workspaceId: string;
  characters: Character[];
  referenceImages: ReferenceImage[];
  artStyle?: string;
  imageModel?: string;
  worldDescription?: string;
  locations?: Location[];
  onCharactersChange: (characters: Character[]) => void;
  onReferenceImagesChange: (images: ReferenceImage[]) => void;
  onWorldSettingsChange?: (settings: { 
    artStyle: string; 
    imageModel: string;
    worldDescription: string;
    locations: Location[];
  }) => void;
  onNext: () => void;
}

const VIDEO_STYLES = [
  { id: "none", name: "None" },
  { id: "cinematic", name: "Cinematic" },
  { id: "vintage", name: "Vintage" },
  { id: "storybook", name: "Storybook" },
  { id: "3d-cartoon", name: "3D Cartoon" },
  { id: "pixar", name: "Pixar" },
  { id: "disney", name: "Disney" },
  { id: "ghibli", name: "Ghibli" },
  { id: "clay", name: "Clay" },
  { id: "comic", name: "Comic" },
  { id: "anime", name: "Anime" },
];

const MAX_CHARACTER_REFERENCES = 5;

const IMAGE_MODELS = [
  "Flux",
  "Midjourney",
  "Nano Banana",
  "GPT Image",
];

interface Location {
  id: string;
  name: string;
  description: string;
}

export function WorldCast({ 
  videoId,
  workspaceId, 
  characters, 
  referenceImages,
  artStyle = "none",
  imageModel = "Flux",
  worldDescription = "",
  locations = [],
  onCharactersChange, 
  onReferenceImagesChange,
  onWorldSettingsChange,
  onNext 
}: WorldCastProps) {
  const [isAddCharacterOpen, setIsAddCharacterOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isRecommendationModalOpen, setIsRecommendationModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [newCharacter, setNewCharacter] = useState({ name: "", description: "", appearance: "" });
  const [characterReferenceImages, setCharacterReferenceImages] = useState<string[]>([]);
  const [generatedCharacterImage, setGeneratedCharacterImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cinematicInspiration, setCinematicInspiration] = useState("");
  const [selectedArtStyle, setSelectedArtStyle] = useState(artStyle);
  const [selectedImageModel, setSelectedImageModel] = useState(imageModel);
  const [selectedWorldDescription, setSelectedWorldDescription] = useState(worldDescription);
  const [locationsList, setLocationsList] = useState<Location[]>(locations);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [newLocation, setNewLocation] = useState({ name: "", description: "" });
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
          ? { 
              ...c, 
              name: newCharacter.name, 
              description: newCharacter.description, 
              appearance: newCharacter.appearance,
              thumbnailUrl: generatedCharacterImage || c.thumbnailUrl
            }
          : c
      );
      onCharactersChange(updatedCharacters);
      
      // Update reference images for this character
      const updatedRefs = characterReferenceImages.map((url, idx) => ({
        id: `ref-${editingCharacter.id}-${idx}`,
        videoId,
        shotId: null,
        characterId: editingCharacter.id,
        type: "character" as const,
        imageUrl: url,
        description: null,
        createdAt: new Date(),
      }));
      
      // Remove old character refs and add new ones
      const otherRefs = referenceImages.filter(r => r.characterId !== editingCharacter.id);
      onReferenceImagesChange([...otherRefs, ...updatedRefs]);
      
      toast({
        title: "Character Updated",
        description: `${newCharacter.name} has been updated.`,
      });
    } else {
      const characterId = `char-${Date.now()}`;
      const character: Character = {
        id: characterId,
        workspaceId: workspaceId,
        name: newCharacter.name,
        description: newCharacter.description || null,
        appearance: newCharacter.appearance || null,
        voiceSettings: null,
        thumbnailUrl: generatedCharacterImage,
        createdAt: new Date(),
      };

      onCharactersChange([...characters, character]);
      
      // Add reference images for this character
      const newRefs = characterReferenceImages.map((url, idx) => ({
        id: `ref-${characterId}-${idx}`,
        videoId,
        shotId: null,
        characterId: characterId,
        type: "character" as const,
        imageUrl: url,
        description: null,
        createdAt: new Date(),
      }));
      
      onReferenceImagesChange([...referenceImages, ...newRefs]);
      
      toast({
        title: "Character Added",
        description: `${character.name} has been added to your cast.`,
      });
    }

    setNewCharacter({ name: "", description: "", appearance: "" });
    setCharacterReferenceImages([]);
    setGeneratedCharacterImage(null);
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
    
    // Load existing reference images for this character
    const charRefs = referenceImages
      .filter(r => r.characterId === character.id)
      .map(r => r.imageUrl);
    setCharacterReferenceImages(charRefs);
    
    // Load existing generated image
    setGeneratedCharacterImage(character.thumbnailUrl);
    
    setIsAddCharacterOpen(true);
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
    toast({
      title: "Reference Uploaded",
      description: "Character reference image added.",
    });
  };

  const handleRemoveCharacterReference = (index: number) => {
    setCharacterReferenceImages(characterReferenceImages.filter((_, i) => i !== index));
  };

  const handleGenerateCharacter = () => {
    if (!newCharacter.appearance.trim()) {
      toast({
        title: "Appearance Required",
        description: "Please describe the character's appearance before generating.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const generatedImageUrl = "https://placehold.co/400x600/1a472a/ffffff?text=AI+Generated";
      
      setGeneratedCharacterImage(generatedImageUrl);
      setIsGenerating(false);
      
      toast({
        title: "Character Generated",
        description: "Character image has been created.",
      });
    }, 2000);
  };

  const handleRemoveStyleReference = (refId: string) => {
    const updatedRefs = referenceImages.filter(r => r.id !== refId);
    onReferenceImagesChange(updatedRefs);
    toast({
      title: "Reference Removed",
      description: "Style reference image deleted.",
    });
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
    if (styleRefs.length >= 1) {
      toast({
        title: "Maximum Reached",
        description: "You can only upload 1 style reference image.",
        variant: "destructive",
      });
      return;
    }

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
      onWorldSettingsChange({ 
        artStyle: styleId, 
        imageModel: selectedImageModel,
        worldDescription: selectedWorldDescription,
        locations: locationsList
      });
    }
  };

  const handleImageModelChange = (model: string) => {
    setSelectedImageModel(model);
    if (onWorldSettingsChange) {
      onWorldSettingsChange({ 
        artStyle: selectedArtStyle, 
        imageModel: model,
        worldDescription: selectedWorldDescription,
        locations: locationsList
      });
    }
  };

  const handleWorldDescriptionChange = (description: string) => {
    setSelectedWorldDescription(description);
    if (onWorldSettingsChange) {
      onWorldSettingsChange({ 
        artStyle: selectedArtStyle, 
        imageModel: selectedImageModel,
        worldDescription: description,
        locations: locationsList
      });
    }
  };

  const handleSaveLocation = () => {
    if (!newLocation.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a location name.",
        variant: "destructive",
      });
      return;
    }

    let updatedLocations: Location[];
    
    if (editingLocation) {
      updatedLocations = locationsList.map(l => 
        l.id === editingLocation.id 
          ? { ...l, name: newLocation.name, description: newLocation.description }
          : l
      );
      toast({
        title: "Location Updated",
        description: `${newLocation.name} has been updated.`,
      });
    } else {
      const location: Location = {
        id: `loc-${Date.now()}`,
        name: newLocation.name,
        description: newLocation.description,
      };
      updatedLocations = [...locationsList, location];
      toast({
        title: "Location Added",
        description: `${newLocation.name} has been added.`,
      });
    }

    setLocationsList(updatedLocations);
    if (onWorldSettingsChange) {
      onWorldSettingsChange({ 
        artStyle: selectedArtStyle, 
        imageModel: selectedImageModel,
        worldDescription: selectedWorldDescription,
        locations: updatedLocations
      });
    }

    setNewLocation({ name: "", description: "" });
    setEditingLocation(null);
    setIsAddLocationOpen(false);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setNewLocation({ name: location.name, description: location.description });
    setIsAddLocationOpen(true);
  };

  const handleDeleteLocation = (locationId: string) => {
    const updatedLocations = locationsList.filter(l => l.id !== locationId);
    setLocationsList(updatedLocations);
    if (onWorldSettingsChange) {
      onWorldSettingsChange({ 
        artStyle: selectedArtStyle, 
        imageModel: selectedImageModel,
        worldDescription: selectedWorldDescription,
        locations: updatedLocations
      });
    }
    toast({
      title: "Location Deleted",
      description: "Location has been removed.",
    });
  };

  const getCharacterReferenceImages = (characterId: string) => {
    return referenceImages.filter(r => r.characterId === characterId);
  };

  const styleRefs = referenceImages.filter((r) => r.type === "style");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
      {/* Settings Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Settings</h3>
          
          <div className="space-y-6">
            {/* Image AI Model */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">IMAGE AI MODEL</Label>
              <Select
                value={selectedImageModel}
                onValueChange={handleImageModelChange}
              >
                <SelectTrigger className="h-9" data-testid="select-image-model">
                  <SelectValue placeholder="Select image model" />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_MODELS.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* World Description */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">WORLD DESCRIPTION</Label>
              <Textarea
                placeholder="Describe the era, season, or general world setting... (e.g., Victorian England, eternal winter, post-apocalyptic wasteland)"
                value={selectedWorldDescription}
                onChange={(e) => handleWorldDescriptionChange(e.target.value)}
                rows={3}
                data-testid="input-world-description"
              />
            </div>

            {/* Video Style */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">VIDEO STYLE</Label>
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
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
                {styleRefs.length > 0 ? (
                  <div className="relative aspect-video rounded-lg border bg-muted">
                    <div className="absolute inset-0 rounded-lg overflow-hidden">
                      <img src={styleRefs[0].imageUrl} alt="Style Reference" className="h-full w-full object-cover" />
                    </div>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 left-2 h-6 w-6 z-10"
                      onClick={() => handleRemoveStyleReference(styleRefs[0].id)}
                      data-testid={`button-remove-style-ref-${styleRefs[0].id}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover-elevate">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadReference(file);
                      }}
                      data-testid="input-upload-style-ref"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Drag image here or upload a file</span>
                  </label>
                )}
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRecommendationModalOpen(true)}
            data-testid="button-recommend-characters"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Recommend AI Characters
          </Button>
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
                  setCharacterReferenceImages([]);
                  setGeneratedCharacterImage(null);
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
          {characters.map((character) => {
            const charRefs = getCharacterReferenceImages(character.id);
            return (
              <Card key={character.id} className="relative aspect-[3/4] overflow-hidden group" data-testid={`character-${character.id}`}>
                <CardContent className="p-0 h-full">
                  <div className="h-full bg-muted flex items-center justify-center relative">
                    {character.thumbnailUrl ? (
                      <img src={character.thumbnailUrl} alt={character.name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-16 w-16 text-muted-foreground" />
                    )}
                    
                    {/* Reference Images Indicator */}
                    {charRefs.length > 0 && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                        {charRefs.length} ref
                      </div>
                    )}
                    
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
            );
          })}
        </div>

        {/* Locations Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Locations</h3>
          </div>

          <div className="space-y-3">
            {/* Add Location Button */}
            <Button
              variant="outline"
              onClick={() => {
                setEditingLocation(null);
                setNewLocation({ name: "", description: "" });
                setIsAddLocationOpen(true);
              }}
              className="w-full"
              data-testid="button-add-location"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Add Location
            </Button>

            {/* Location Cards */}
            {locationsList.map((location) => (
              <Card key={location.id} className="group hover-elevate" data-testid={`location-${location.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <h4 className="font-semibold text-sm truncate">{location.name}</h4>
                      </div>
                      {location.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{location.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleEditLocation(location)}
                        data-testid={`button-edit-location-${location.id}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleDeleteLocation(location.id)}
                        data-testid={`button-delete-location-${location.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Location Dialog */}
      <Dialog open={isAddLocationOpen} onOpenChange={setIsAddLocationOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLocation ? "Edit Location" : "Add Location"}</DialogTitle>
            <DialogDescription>
              Define a location or world setting for your story.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location-name">Name</Label>
              <Input
                id="location-name"
                placeholder="Location name (e.g., Ancient Forest, City Square)"
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                data-testid="input-location-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-description">Description</Label>
              <Textarea
                id="location-description"
                placeholder="Brief description of the location..."
                value={newLocation.description}
                onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                rows={3}
                data-testid="input-location-description"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddLocationOpen(false);
                  setNewLocation({ name: "", description: "" });
                  setEditingLocation(null);
                }}
                className="flex-1"
                data-testid="button-cancel-location"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveLocation}
                className="flex-1"
                data-testid="button-save-location"
              >
                {editingLocation ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Character Dialog */}
      <Dialog open={isAddCharacterOpen} onOpenChange={setIsAddCharacterOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCharacter ? "Edit Character" : "Create New Character"}</DialogTitle>
            <DialogDescription>
              Define a character for your story. Upload reference images for consistency.
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
                      {libraryChar.thumbnailUrl ? (
                        <img src={libraryChar.thumbnailUrl} alt={libraryChar.name} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-16 w-16 text-muted-foreground" />
                      )}
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

      {/* AI Character Recommendation Dialog */}
      <CharacterRecommendationModal
        open={isRecommendationModalOpen}
        onOpenChange={setIsRecommendationModalOpen}
        isAnalyzing={isAnalyzing}
        onAddCharacter={(character) => {
          onCharactersChange([...characters, character]);
          toast({
            title: "Character Added",
            description: `${character.name} has been added to your cast.`,
          });
        }}
        existingCharacters={characters}
        videoId={videoId}
        workspaceId={workspaceId}
      />

      {/* Next Button */}
      <div className="lg:col-span-2 flex justify-end pt-4">
        <Button onClick={onNext} size="lg" data-testid="button-next">
          Next
        </Button>
      </div>
    </div>
  );
}
