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
import { Plus, Upload, Check, Pencil, User, Library, ChevronDown, ChevronUp, Loader2, Sparkles, X, MapPin, Trash2, RefreshCw, Settings2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import type { Character } from "@shared/schema";
import type { ReferenceImage } from "@/types/storyboard";
import { LocationDialog } from "@/components/narrative/location-dialog";
import { LocationRecommendationModal } from "@/components/narrative/location-recommendation-modal";
import { LocationLibraryModal } from "@/components/narrative/location-library-modal";

import cinematicImg from "@assets/stock_images/cinematic_dramatic_m_11f2a438.jpg";
import vintageImg from "@assets/stock_images/vintage_retro_film_a_271325f2.jpg";
import storybookImg from "@assets/stock_images/children_storybook_i_356b584c.jpg";
import cartoonImg from "@assets/stock_images/3d_cartoon_character_6aa7ac2f.jpg";
import pixarImg from "@assets/stock_images/pixar_style_3d_anima_42d5c374.jpg";
import disneyImg from "@assets/stock_images/disney_animation_sty_ee54ba97.jpg";
import ghibliImg from "@assets/stock_images/studio_ghibli_anime__896fd7f6.jpg";
import clayImg from "@assets/stock_images/claymation_clay_anim_99f7e6b5.jpg";
import comicImg from "@assets/stock_images/comic_book_illustrat_6b536ca2.jpg";
import animeImg from "@assets/stock_images/japanese_anime_manga_1161035c.jpg";

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
      personality: null,
      appearance: recChar.appearance,
      voiceSettings: null,
      thumbnailUrl: null,
      createdAt: new Date(),
    };

    onAddCharacter(character);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto custom-scrollbar">
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
  imageInstructions?: string;
  videoInstructions?: string;
  onCharactersChange: (characters: Character[]) => void;
  onReferenceImagesChange: (images: ReferenceImage[]) => void;
  onWorldSettingsChange?: (settings: { 
    artStyle: string; 
    imageModel: string;
    worldDescription: string;
    locations: Location[];
    imageInstructions: string;
    videoInstructions: string;
  }) => void;
  onNext: () => void;
  videoMode?: "narrative" | "character-vlog";
  mainCharacter?: Character | null;
  onMainCharacterChange?: (character: Character | null) => void;
}

const VIDEO_STYLES = [
  { id: "none", name: "None", imageUrl: null },
  { id: "cinematic", name: "Cinematic", imageUrl: cinematicImg },
  { id: "vintage", name: "Vintage", imageUrl: vintageImg },
  { id: "storybook", name: "Storybook", imageUrl: storybookImg },
  { id: "3d-cartoon", name: "3D Cartoon", imageUrl: cartoonImg },
  { id: "pixar", name: "Pixar", imageUrl: pixarImg },
  { id: "disney", name: "Disney", imageUrl: disneyImg },
  { id: "ghibli", name: "Ghibli", imageUrl: ghibliImg },
  { id: "clay", name: "Clay", imageUrl: clayImg },
  { id: "comic", name: "Comic", imageUrl: comicImg },
  { id: "anime", name: "Anime", imageUrl: animeImg },
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
  imageUrl?: string | null;
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
  imageInstructions = "",
  videoInstructions = "",
  onCharactersChange, 
  onReferenceImagesChange,
  onWorldSettingsChange,
  onNext,
  videoMode = "narrative",
  mainCharacter,
  onMainCharacterChange,
}: WorldCastProps) {
  const [isAddCharacterOpen, setIsAddCharacterOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isRecommendationModalOpen, setIsRecommendationModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [newCharacter, setNewCharacter] = useState({ name: "", description: "", personality: "", appearance: "" });
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
  const [isLocationRecommendationOpen, setIsLocationRecommendationOpen] = useState(false);
  const [isLocationLibraryOpen, setIsLocationLibraryOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [selectedImageInstructions, setSelectedImageInstructions] = useState(imageInstructions);
  const [selectedVideoInstructions, setSelectedVideoInstructions] = useState(videoInstructions);
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
              personality: newCharacter.personality || null,
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
        personality: newCharacter.personality || null,
        appearance: newCharacter.appearance || null,
        voiceSettings: null,
        thumbnailUrl: generatedCharacterImage,
        createdAt: new Date(),
      };

      onCharactersChange([...characters, character]);
      
      // In Character Vlog mode, if no mainCharacter exists, set this as primary
      if (videoMode === "character-vlog" && !mainCharacter && onMainCharacterChange) {
        onMainCharacterChange(character);
      }
      
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
        title: videoMode === "character-vlog" && !mainCharacter ? "Primary Character Added" : "Character Added",
        description: `${character.name} has been added ${videoMode === "character-vlog" && !mainCharacter ? "as your primary character" : "to your cast"}.`,
      });
    }

    setNewCharacter({ name: "", description: "", personality: "", appearance: "" });
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
      personality: character.personality || "",
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
        locations: locationsList,
        imageInstructions: selectedImageInstructions,
        videoInstructions: selectedVideoInstructions
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
        locations: locationsList,
        imageInstructions: selectedImageInstructions,
        videoInstructions: selectedVideoInstructions
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
        locations: locationsList,
        imageInstructions: selectedImageInstructions,
        videoInstructions: selectedVideoInstructions
      });
    }
  };

  const handleSaveLocationFromDialog = (locationData: {
    name: string;
    description: string;
    details: string;
    thumbnailUrl: string | null;
    referenceImages: string[];
  }) => {
    let updatedLocations: Location[];
    
    if (editingLocation) {
      updatedLocations = locationsList.map(l => 
        l.id === editingLocation.id 
          ? { ...l, name: locationData.name, description: locationData.description, imageUrl: locationData.thumbnailUrl || l.imageUrl }
          : l
      );
      toast({
        title: "Location Updated",
        description: `${locationData.name} has been updated.`,
      });
    } else {
      const location: Location = {
        id: `loc-${Date.now()}`,
        name: locationData.name,
        description: locationData.description,
        imageUrl: locationData.thumbnailUrl,
      };
      updatedLocations = [...locationsList, location];
      toast({
        title: "Location Added",
        description: `${locationData.name} has been added.`,
      });
    }

    setLocationsList(updatedLocations);
    if (onWorldSettingsChange) {
      onWorldSettingsChange({ 
        artStyle: selectedArtStyle, 
        imageModel: selectedImageModel,
        worldDescription: selectedWorldDescription,
        locations: updatedLocations,
        imageInstructions: selectedImageInstructions,
        videoInstructions: selectedVideoInstructions
      });
    }

    setEditingLocation(null);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setIsAddLocationOpen(true);
  };

  const handleAddLocationFromRecommendation = (location: Location) => {
    const alreadyExists = locationsList.some(l => l.name === location.name);
    if (alreadyExists) {
      toast({
        title: "Already Added",
        description: `${location.name} is already in your locations.`,
        variant: "destructive",
      });
      return;
    }

    const updatedLocations = [...locationsList, location];
    setLocationsList(updatedLocations);
    if (onWorldSettingsChange) {
      onWorldSettingsChange({ 
        artStyle: selectedArtStyle, 
        imageModel: selectedImageModel,
        worldDescription: selectedWorldDescription,
        locations: updatedLocations,
        imageInstructions: selectedImageInstructions,
        videoInstructions: selectedVideoInstructions
      });
    }
  };

  const handleSelectLocationFromLibrary = (location: Location) => {
    const alreadyExists = locationsList.some(l => l.id === location.id);
    if (alreadyExists) {
      toast({
        title: "Already Added",
        description: `${location.name} is already in your locations.`,
        variant: "destructive",
      });
      return;
    }

    const updatedLocations = [...locationsList, location];
    setLocationsList(updatedLocations);
    if (onWorldSettingsChange) {
      onWorldSettingsChange({ 
        artStyle: selectedArtStyle, 
        imageModel: selectedImageModel,
        worldDescription: selectedWorldDescription,
        locations: updatedLocations,
        imageInstructions: selectedImageInstructions,
        videoInstructions: selectedVideoInstructions
      });
    }
  };

  const handleDeleteLocation = (locationId: string) => {
    const updatedLocations = locationsList.filter(l => l.id !== locationId);
    setLocationsList(updatedLocations);
    if (onWorldSettingsChange) {
      onWorldSettingsChange({ 
        artStyle: selectedArtStyle, 
        imageModel: selectedImageModel,
        worldDescription: selectedWorldDescription,
        locations: updatedLocations,
        imageInstructions: selectedImageInstructions,
        videoInstructions: selectedVideoInstructions
      });
    }
    toast({
      title: "Location Deleted",
      description: "Location has been removed.",
    });
  };

  const handleImageInstructionsChange = (instructions: string) => {
    setSelectedImageInstructions(instructions);
    if (onWorldSettingsChange) {
      onWorldSettingsChange({ 
        artStyle: selectedArtStyle, 
        imageModel: selectedImageModel,
        worldDescription: selectedWorldDescription,
        locations: locationsList,
        imageInstructions: instructions,
        videoInstructions: selectedVideoInstructions
      });
    }
  };

  const handleVideoInstructionsChange = (instructions: string) => {
    setSelectedVideoInstructions(instructions);
    if (onWorldSettingsChange) {
      onWorldSettingsChange({ 
        artStyle: selectedArtStyle, 
        imageModel: selectedImageModel,
        worldDescription: selectedWorldDescription,
        locations: locationsList,
        imageInstructions: selectedImageInstructions,
        videoInstructions: instructions
      });
    }
  };

  const getCharacterReferenceImages = (characterId: string) => {
    return referenceImages.filter(r => r.characterId === characterId);
  };

  const styleRefs = referenceImages.filter((r) => r.type === "style");

  const accentClasses = "from-purple-500 to-pink-500";

  return (
    <div className="space-y-8">
      {/* World Settings Section */}
      <Card className="bg-white/[0.02] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${accentClasses}`}>
              <Settings2 className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">World Settings</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed rounded-lg cursor-pointer hover-elevate">
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
                    <Upload className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Upload Image</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
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

            {/* Style */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-white/70 uppercase tracking-wider">STYLE</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {VIDEO_STYLES.map((style) => (
                  <Card
                    key={style.id}
                    className={`cursor-pointer transition-all hover-elevate relative group overflow-hidden bg-white/[0.02] border-white/[0.06] ${
                      selectedArtStyle === style.id ? 'ring-2 ring-purple-500' : 'hover:border-purple-500/30'
                    }`}
                    onClick={() => handleArtStyleChange(style.id)}
                    data-testid={`video-style-${style.id}`}
                  >
                    <CardContent className="p-0">
                      <div className="relative">
                        <div className="aspect-square bg-white/5 flex items-center justify-center overflow-hidden">
                          {style.imageUrl ? (
                            <img 
                              src={style.imageUrl} 
                              alt={style.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-white/10" />
                          )}
                        </div>
                        {selectedArtStyle === style.id && (
                          <div className="absolute inset-0 bg-purple-500/30 flex items-center justify-center">
                            <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${accentClasses} flex items-center justify-center`}>
                              <Check className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-2 text-center bg-black/40">
                        <p className="text-xs font-medium leading-tight text-white">{style.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* AI Generation Settings - Collapsible */}
            <Collapsible
              open={isAiSettingsOpen}
              onOpenChange={setIsAiSettingsOpen}
              className="mt-6"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-dashed border-white/10 hover:border-purple-500/30 hover:bg-white/[0.02] transition-all"
                  data-testid="button-toggle-ai-settings"
                >
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-white">AI Generation Settings</span>
                    {(selectedImageInstructions || selectedVideoInstructions) && (
                      <span className={`text-xs bg-gradient-to-br ${accentClasses} text-white px-2 py-0.5 rounded-full`}>
                        Configured
                      </span>
                    )}
                  </div>
                  {isAiSettingsOpen ? (
                    <ChevronUp className="h-4 w-4 text-white/50" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-white/50" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <p className="text-xs text-white/50">
                  These instructions will be appended to every AI generation request in your project.
                </p>

                {/* Image Generation Instructions */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">IMAGE GENERATION INSTRUCTIONS</Label>
                  <Textarea
                    placeholder="E.g., 'Soft cinematic lighting, film grain, shallow depth of field, warm color palette, professional photography quality'"
                    value={selectedImageInstructions}
                    onChange={(e) => handleImageInstructionsChange(e.target.value)}
                    rows={3}
                    className="text-sm"
                    data-testid="input-image-instructions"
                  />
                  <p className="text-xs text-muted-foreground">
                    Style guidelines applied to all image generations
                  </p>
                </div>

                {/* Video/Animation Instructions */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">VIDEO / ANIMATION INSTRUCTIONS</Label>
                  <Textarea
                    placeholder="E.g., 'Slow, cinematic camera movements, 24fps film look, smooth transitions, natural motion blur, subtle camera shake'"
                    value={selectedVideoInstructions}
                    onChange={(e) => handleVideoInstructionsChange(e.target.value)}
                    rows={3}
                    className="text-sm"
                    data-testid="input-video-instructions"
                  />
                  <p className="text-xs text-muted-foreground">
                    Motion and animation guidelines applied to all video generations
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      {/* Cast Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${accentClasses}`}>
              <User className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">
              {videoMode === "character-vlog" ? "Your Characters" : "Cast"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsRecommendationModalOpen(true)}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              data-testid="button-recommend-characters"
            >
              <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
              {videoMode === "character-vlog" ? "Recommend Primary Character" : "Recommend AI Characters"}
            </Button>
            
            <Button
              size="sm"
              onClick={() => {
                setEditingCharacter(null);
                setNewCharacter({ name: "", description: "", personality: "", appearance: "" });
                setCharacterReferenceImages([]);
                setGeneratedCharacterImage(null);
                setIsAddCharacterOpen(true);
              }}
              className={`bg-gradient-to-br ${accentClasses} text-white hover:opacity-90`}
              data-testid="button-add-character"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Character
            </Button>
          </div>
        </div>

        {/* Character Vlog Mode: Primary + Secondary Characters */}
        {videoMode === "character-vlog" ? (
          <div className="space-y-6">
            {/* Primary Character Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-purple-400">Primary Character</h4>
                <span className="text-xs text-white/50">(Required - the story is about this character)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {/* Add Primary Character Card - only show if no main character */}
                {!mainCharacter && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Card
                        className="cursor-pointer hover-elevate flex items-center justify-center aspect-[3/4] bg-purple-500/10 border-purple-500/30 border-dashed hover:border-purple-500/50 transition-all"
                        data-testid="button-add-primary-character"
                      >
                        <CardContent className="flex flex-col items-center justify-center p-6">
                          <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${accentClasses} flex items-center justify-center mb-2`}>
                            <Plus className="h-6 w-6 text-white" />
                          </div>
                          <p className="text-sm font-medium text-purple-400">Add Primary</p>
                          <ChevronDown className="h-4 w-4 text-purple-400/70 mt-1" />
                        </CardContent>
                      </Card>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#0a0a0a] border-white/10">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingCharacter(null);
                          setNewCharacter({ name: "", description: "", personality: "", appearance: "" });
                          setCharacterReferenceImages([]);
                          setGeneratedCharacterImage(null);
                          setIsAddCharacterOpen(true);
                        }}
                        className="text-white hover:bg-white/10"
                        data-testid="menu-create-primary-character"
                      >
                        <Plus className="h-4 w-4 mr-2 text-cyan-400" />
                        Create New Character
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setIsLibraryOpen(true)}
                        className="text-white hover:bg-white/10"
                        data-testid="menu-browse-library-primary"
                      >
                        <Library className="h-4 w-4 mr-2 text-cyan-400" />
                        Browse Library
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Primary Character Card */}
                {mainCharacter && (
                  <Card className="relative aspect-[3/4] overflow-hidden group ring-2 ring-purple-500 bg-white/[0.02] border-white/[0.06]" data-testid={`primary-character-${mainCharacter.id}`}>
                    <CardContent className="p-0 h-full">
                      <div className="h-full bg-muted flex items-center justify-center relative">
                        {mainCharacter.thumbnailUrl ? (
                          <img src={mainCharacter.thumbnailUrl} alt={mainCharacter.name} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-16 w-16 text-muted-foreground" />
                        )}
                        
                        {/* Primary Badge */}
                        <div className={`absolute top-2 left-2 bg-gradient-to-br ${accentClasses} text-white text-xs px-2 py-1 rounded font-medium`}>
                          Primary
                        </div>
                        
                        {/* Edit Button */}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleEditCharacter(mainCharacter)}
                          data-testid={`button-edit-primary-character`}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                      
                      {/* Character Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-sm font-semibold text-white">{mainCharacter.name}</p>
                        {mainCharacter.description && (
                          <p className="text-xs text-white/80 line-clamp-2">{mainCharacter.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Secondary Characters Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-white/70">Secondary Characters</h4>
                <span className="text-xs text-white/50">(Optional - up to 2 supporting characters)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {/* Add Secondary Character Card - only show if less than 2 secondary */}
                {characters.filter(c => c.id !== mainCharacter?.id).length < 2 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Card
                        className="cursor-pointer hover-elevate flex items-center justify-center aspect-[3/4] bg-white/[0.02] border-dashed border-white/10 hover:border-purple-500/30 transition-all"
                        data-testid="button-add-secondary-character"
                      >
                        <CardContent className="flex flex-col items-center justify-center p-6">
                          <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
                            <Plus className="h-6 w-6 text-white/50" />
                          </div>
                          <p className="text-sm font-medium text-white/70">Add Secondary</p>
                          <ChevronDown className="h-4 w-4 text-white/50 mt-1" />
                        </CardContent>
                      </Card>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#0a0a0a] border-white/10">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingCharacter(null);
                          setNewCharacter({ name: "", description: "", personality: "", appearance: "" });
                          setCharacterReferenceImages([]);
                          setGeneratedCharacterImage(null);
                          setIsAddCharacterOpen(true);
                        }}
                        className="text-white hover:bg-white/10"
                        data-testid="menu-create-secondary-character"
                      >
                        <Plus className="h-4 w-4 mr-2 text-cyan-400" />
                        Create New Character
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setIsLibraryOpen(true)}
                        className="text-white hover:bg-white/10"
                        data-testid="menu-browse-library-secondary"
                      >
                        <Library className="h-4 w-4 mr-2 text-cyan-400" />
                        Browse Library
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Secondary Character Cards */}
                {characters.filter(c => c.id !== mainCharacter?.id).map((character) => {
                  const charRefs = getCharacterReferenceImages(character.id);
                  return (
                    <Card key={character.id} className="relative aspect-[3/4] overflow-hidden group bg-white/[0.02] border-white/[0.06] hover:border-purple-500/30 transition-all" data-testid={`secondary-character-${character.id}`}>
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
                            data-testid={`button-edit-secondary-character-${character.id}`}
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
            </div>
          </div>
        ) : (
          /* Narrative Mode: Standard Cast Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {/* Add Character Card with Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Card
                  className="cursor-pointer hover-elevate flex items-center justify-center aspect-[3/4] bg-white/[0.02] border-dashed border-purple-500/30 hover:border-purple-500/50 transition-all"
                  data-testid="button-add-character"
                >
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${accentClasses} bg-opacity-20 flex items-center justify-center mb-2`}>
                      <Plus className="h-6 w-6 text-purple-400" />
                    </div>
                    <p className="text-sm font-medium text-white">Add character</p>
                    <ChevronDown className="h-4 w-4 text-white/50 mt-1" />
                  </CardContent>
                </Card>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0a0a0a] border-white/10">
                <DropdownMenuItem
                  onClick={() => {
                    setEditingCharacter(null);
                    setNewCharacter({ name: "", description: "", personality: "", appearance: "" });
                    setCharacterReferenceImages([]);
                    setGeneratedCharacterImage(null);
                    setIsAddCharacterOpen(true);
                  }}
                  className="text-white hover:bg-white/10"
                  data-testid="menu-create-new-character"
                >
                  <Plus className="h-4 w-4 mr-2 text-cyan-400" />
                  Create New Character
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsLibraryOpen(true)}
                  className="text-white hover:bg-white/10"
                  data-testid="menu-browse-library"
                >
                  <Library className="h-4 w-4 mr-2 text-cyan-400" />
                  Browse Library
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Character Cards */}
            {characters.map((character) => {
              const charRefs = getCharacterReferenceImages(character.id);
              return (
                <Card key={character.id} className="relative aspect-[3/4] overflow-hidden group bg-white/[0.02] border-white/[0.06] hover:border-purple-500/30 transition-all" data-testid={`character-${character.id}`}>
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
        )}
      </div>

      {/* Locations Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${accentClasses}`}>
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">Locations</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsLocationRecommendationOpen(true)}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              data-testid="button-recommend-locations"
            >
              <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
              Recommend AI Locations
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className={`bg-gradient-to-br ${accentClasses} text-white hover:opacity-90`}
                  data-testid="button-add-location-dropdown"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Location
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10">
                <DropdownMenuItem onClick={() => setIsLocationLibraryOpen(true)} className="text-white hover:bg-white/10" data-testid="menu-item-browse-library">
                  <Library className="mr-2 h-4 w-4 text-cyan-400" />
                  Browse Library
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setEditingLocation(null);
                    setIsAddLocationOpen(true);
                  }}
                  className="text-white hover:bg-white/10"
                  data-testid="menu-item-create-new"
                >
                  <Plus className="mr-2 h-4 w-4 text-cyan-400" />
                  Create New Location
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {locationsList.length === 0 ? (
          <Card className="border-dashed border-white/10 bg-white/[0.02]">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground text-center mb-4">
                No locations added yet. Define key locations for your story.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingLocation(null);
                  setIsAddLocationOpen(true);
                }}
                data-testid="button-add-first-location"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Location
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locationsList.map((location) => (
              <Card key={location.id} className="relative aspect-video overflow-hidden group hover-elevate bg-white/[0.02] border-white/[0.06] hover:border-purple-500/30 transition-all" data-testid={`location-${location.id}`}>
                <CardContent className="p-0 h-full">
                  <div className="h-full bg-muted flex items-center justify-center relative">
                    {location.imageUrl ? (
                      <img src={location.imageUrl} alt={location.name} className="h-full w-full object-cover" />
                    ) : (
                      <MapPin className="h-12 w-12 text-muted-foreground" />
                    )}
                    
                    {/* Edit and Delete Buttons */}
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7"
                        onClick={() => handleEditLocation(location)}
                        data-testid={`button-edit-location-${location.id}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-7 w-7"
                        onClick={() => handleDeleteLocation(location.id)}
                        data-testid={`button-delete-location-${location.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Location Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-white shrink-0" />
                      <p className="text-sm font-semibold text-white">{location.name}</p>
                    </div>
                    {location.description && (
                      <p className="text-xs text-white/80 line-clamp-2">{location.description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Location Dialog */}
      <LocationDialog
        open={isAddLocationOpen}
        onOpenChange={setIsAddLocationOpen}
        onSave={handleSaveLocationFromDialog}
        editingLocation={editingLocation ? {
          name: editingLocation.name,
          description: editingLocation.description,
          details: "",
          thumbnailUrl: editingLocation.imageUrl || null,
          referenceImages: [],
        } : null}
      />

      {/* Character Dialog */}
      <Dialog open={isAddCharacterOpen} onOpenChange={setIsAddCharacterOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar">
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
                  <Label htmlFor="char-personality">Personality</Label>
                  <Textarea
                    id="char-personality"
                    placeholder="Personality traits, mannerisms, speech patterns..."
                    value={newCharacter.personality}
                    onChange={(e) => setNewCharacter({ ...newCharacter, personality: e.target.value })}
                    rows={3}
                    data-testid="input-character-personality"
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto custom-scrollbar">
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

      {/* AI Location Recommendation Dialog */}
      <LocationRecommendationModal
        open={isLocationRecommendationOpen}
        onOpenChange={setIsLocationRecommendationOpen}
        onAddLocation={handleAddLocationFromRecommendation}
        existingLocations={locationsList}
      />

      {/* Location Library Dialog */}
      <LocationLibraryModal
        open={isLocationLibraryOpen}
        onOpenChange={setIsLocationLibraryOpen}
        onSelectLocation={handleSelectLocationFromLibrary}
        existingLocations={locationsList}
        workspaceId={workspaceId}
      />
    </div>
  );
}
