import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Upload, Check, Pencil, User, Sparkles, X, Loader2, RectangleHorizontal, RectangleVertical, Square, ChevronRight, MapPin, Download, MoreVertical, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Character, Location } from "@shared/schema";
import type { ReferenceImage } from "@/types/storyboard";
import { cn } from "@/lib/utils";

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

interface ElementsTabProps {
  videoId: string;
  workspaceId: string;
  characters: Character[];
  locations?: Location[];
  referenceImages: ReferenceImage[];
  artStyle?: string;
  imageModel?: string;
  worldDescription?: string;
  aspectRatio?: string;
  onCharactersChange: (characters: Character[]) => void;
  onLocationsChange?: (locations: Location[]) => void;
  onReferenceImagesChange: (images: ReferenceImage[]) => void;
  onAspectRatioChange?: (aspectRatio: string) => void;
  onWorldSettingsChange?: (settings: { 
    artStyle: string; 
    imageModel: string;
    worldDescription: string;
  }) => void;
  onNext: () => void;
  mainCharacter?: Character | null;
  onMainCharacterChange?: (character: Character | null) => void;
}

const STYLES = [
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

const IMAGE_MODELS = [
  "Flux",
  "Midjourney",
  "Nano Banana",
  "GPT Image",
  "DALL-E 3",
  "Stable Diffusion",
];

const ASPECT_RATIOS = [
  { id: "16:9", label: "16:9", description: "YouTube", icon: RectangleHorizontal },
  { id: "9:16", label: "9:16", description: "TikTok, Reels", icon: RectangleVertical },
  { id: "1:1", label: "1:1", description: "Instagram", icon: Square },
];

const MAX_CHARACTER_REFERENCES = 5;
const MAX_LOCATION_REFERENCES = 4;

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

const MOCK_RECOMMENDED_LOCATIONS = [
  {
    name: "Downtown Coffee Shop",
    description: "A cozy urban cafe with large windows overlooking the busy street, warm lighting and wooden furniture",
    visualDetails: "Modern industrial interior with exposed brick walls, hanging Edison bulbs, espresso machine sounds, and comfortable booth seating",
  },
  {
    name: "City Park at Sunset",
    description: "A peaceful urban park with tree-lined walking paths and a central fountain during golden hour",
    visualDetails: "Mature oak trees providing dappled shade, well-maintained grass, wooden benches, flower beds, and warm sunset lighting casting long shadows",
  },
  {
    name: "Underground Parking Garage",
    description: "A dimly lit concrete parking structure with echoing sounds and harsh fluorescent lighting",
    visualDetails: "Gray concrete pillars, yellow parking lines, flickering overhead lights, oil stains on the ground, and shadowy corners",
  },
];

export function ElementsTab({
  videoId,
  workspaceId,
  characters,
  locations = [],
  referenceImages,
  artStyle = "none",
  imageModel = "Flux",
  worldDescription = "",
  aspectRatio = "9:16",
  onCharactersChange,
  onLocationsChange,
  onReferenceImagesChange,
  onAspectRatioChange,
  onWorldSettingsChange,
  onNext,
  mainCharacter,
  onMainCharacterChange,
}: ElementsTabProps) {
  const [isAddCharacterOpen, setIsAddCharacterOpen] = useState(false);
  const [addingToSection, setAddingToSection] = useState<'primary' | 'secondary'>('primary');
  const [isRecommendationModalOpen, setIsRecommendationModalOpen] = useState(false);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [isLocationRecommendationOpen, setIsLocationRecommendationOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLocationAnalyzing, setIsLocationAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<typeof MOCK_RECOMMENDED_CHARACTERS>([]);
  const [locationRecommendations, setLocationRecommendations] = useState<any[]>([]);
  const [currentStylePage, setCurrentStylePage] = useState(0);
  const [isGeneratingLocation, setIsGeneratingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: "", description: "", details: "" });
  const [locationReferenceImages, setLocationReferenceImages] = useState<string[]>([]);
  const [generatedLocationImage, setGeneratedLocationImage] = useState<string | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [newCharacter, setNewCharacter] = useState({ name: "", age: "", role: "", personality: "", appearance: "" });
  const [characterReferenceImages, setCharacterReferenceImages] = useState<string[]>([]);
  const [generatedCharacterImage, setGeneratedCharacterImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedArtStyle, setSelectedArtStyle] = useState(artStyle);
  const [selectedImageModel, setSelectedImageModel] = useState(imageModel);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatio);
  const [selectedWorldDescription, setSelectedWorldDescription] = useState(worldDescription);
  const { toast } = useToast();

  const styleRefs = referenceImages.filter((r) => r.type === "style");
  const accentClasses = "from-[#FF4081] via-[#FF5C8D] to-[#FF6B4A]"; // Gradient pink to orange from logo
  
  // Pagination for styles - show 4 at a time
  const STYLES_PER_PAGE = 4;
  const totalStylePages = Math.ceil(STYLES.length / STYLES_PER_PAGE);
  const startIndex = currentStylePage * STYLES_PER_PAGE;
  const endIndex = startIndex + STYLES_PER_PAGE;
  const displayedStyles = STYLES.slice(startIndex, endIndex);

  const handleOpenRecommendations = () => {
    setIsRecommendationModalOpen(true);
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      setRecommendations(MOCK_RECOMMENDED_CHARACTERS);
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleOpenLocationRecommendations = () => {
    setIsLocationRecommendationOpen(true);
    setIsLocationAnalyzing(true);
    
    setTimeout(() => {
      setLocationRecommendations(MOCK_RECOMMENDED_LOCATIONS);
      setIsLocationAnalyzing(false);
    }, 2000);
  };

  const handleGenerateLocation = () => {
    if (!newLocation.details.trim()) {
      toast({
        title: "Details Required",
        description: "Please provide location details before generating.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingLocation(true);
    
    setTimeout(() => {
      const generatedImageUrl = "https://placehold.co/800x600/2a1a4a/ffffff?text=Location+Generated";
      setGeneratedLocationImage(generatedImageUrl);
      setIsGeneratingLocation(false);
      
      toast({
        title: "Location Generated",
        description: "Location image has been created.",
      });
    }, 2000);
  };

  const handleUploadLocationReference = (file: File) => {
    if (locationReferenceImages.length >= MAX_LOCATION_REFERENCES) {
      toast({
        title: "Maximum Reached",
        description: `You can only upload up to ${MAX_LOCATION_REFERENCES} reference images per location.`,
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(file);
    setLocationReferenceImages([...locationReferenceImages, url]);
    toast({
      title: "Reference Uploaded",
      description: "Location reference image added.",
    });
  };

  const handleRemoveLocationReference = (index: number) => {
    setLocationReferenceImages(locationReferenceImages.filter((_, i) => i !== index));
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

    if (!onLocationsChange) return;

    if (editingLocation) {
      const updatedLocations = locations.map(l => 
        l.id === editingLocation.id 
          ? { 
              ...l, 
              name: newLocation.name, 
              description: newLocation.description || null,
              details: newLocation.details || null,
              imageUrl: generatedLocationImage || l.imageUrl
            }
          : l
      );
      onLocationsChange(updatedLocations);
      
      toast({
        title: "Location Updated",
        description: `${newLocation.name} has been updated.`,
      });
    } else {
      const locationId = `loc-${Date.now()}`;
      const location: any = {
        id: locationId,
        workspaceId: workspaceId,
        name: newLocation.name,
        description: newLocation.description || null,
        details: newLocation.details || null,
        imageUrl: generatedLocationImage,
        referenceImages: null,
        createdAt: new Date(),
      };

      onLocationsChange([...locations, location]);
      
      toast({
        title: "Location Added",
        description: `${location.name} has been added.`,
      });
    }

    setNewLocation({ name: "", description: "", details: "" });
    setLocationReferenceImages([]);
    setGeneratedLocationImage(null);
    setEditingLocation(null);
    setIsAddLocationOpen(false);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setNewLocation({
      name: location.name,
      description: location.description || "",
      details: location.details || "",
    });
    setGeneratedLocationImage(location.imageUrl);
    setIsAddLocationOpen(true);
  };

  const handleAddRecommendedLocation = (recLoc: typeof MOCK_RECOMMENDED_LOCATIONS[0]) => {
    if (!onLocationsChange) return;
    
    const alreadyExists = locations.some(l => l.name === recLoc.name);
    if (alreadyExists) {
      toast({
        title: "Already Added",
        description: `${recLoc.name} is already in your locations.`,
        variant: "destructive",
      });
      return;
    }

    const locationId = `loc-${Date.now()}-${Math.random()}`;
    const location: any = {
      id: locationId,
      workspaceId: workspaceId,
      name: recLoc.name,
      description: recLoc.description,
      details: recLoc.visualDetails,
      imageUrl: null,
      referenceImages: null,
      createdAt: new Date(),
    };

    onLocationsChange([...locations, location]);

    toast({
      title: "Location Added",
      description: `${recLoc.name} has been added.`,
    });
  };

  const handleAddRecommendedCharacter = (recChar: typeof MOCK_RECOMMENDED_CHARACTERS[0]) => {
    const alreadyExists = characters.some(c => c.name === recChar.name);
    if (alreadyExists) {
      toast({
        title: "Already Added",
        description: `${recChar.name} is already in your cast.`,
        variant: "destructive",
      });
      return;
    }

    const characterId = `char-${Date.now()}-${Math.random()}`;
    const character: any = {
      id: characterId,
      workspaceId: workspaceId,
      name: recChar.name,
      description: recChar.description,
      personality: null,
      appearance: recChar.appearance,
      voiceSettings: null,
      imageUrl: null,
      createdAt: new Date(),
      section: 'secondary', // Recommended characters go to secondary by default
    };

    onCharactersChange([...characters, character]);

    toast({
      title: "Character Added",
      description: `${recChar.name} has been added to your cast.`,
    });
  };

  const handleArtStyleChange = (styleId: string) => {
    setSelectedArtStyle(styleId);
    if (onWorldSettingsChange) {
      onWorldSettingsChange({ 
        artStyle: styleId, 
        imageModel: selectedImageModel,
        worldDescription: selectedWorldDescription,
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
      });
    }
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
    
    // Clear selected preset style when custom reference is uploaded
    handleArtStyleChange("none");
    
    toast({
      title: "Reference Uploaded",
      description: "Style reference image added. Preset styles disabled.",
    });
  };

  const handleRemoveStyleReference = (refId: string) => {
    const updatedRefs = referenceImages.filter(r => r.id !== refId);
    onReferenceImagesChange(updatedRefs);
    toast({
      title: "Reference Removed",
      description: "Preset styles are now available to select.",
    });
  };

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
              description: newCharacter.role,
              personality: newCharacter.personality || null,
              appearance: newCharacter.appearance,
              imageUrl: generatedCharacterImage || c.imageUrl,
              section: (c as any).section || addingToSection // Preserve or set section
            }
          : c
      );
      onCharactersChange(updatedCharacters);
      
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
      
      const otherRefs = referenceImages.filter(r => r.characterId !== editingCharacter.id);
      onReferenceImagesChange([...otherRefs, ...updatedRefs]);
      
      toast({
        title: "Character Updated",
        description: `${newCharacter.name} has been updated.`,
      });
    } else {
      const characterId = `char-${Date.now()}`;
      const character: any = {
        id: characterId,
        workspaceId: workspaceId,
        name: newCharacter.name,
        description: newCharacter.role || null,
        personality: newCharacter.personality || null,
        appearance: newCharacter.appearance || null,
        voiceSettings: null,
        imageUrl: generatedCharacterImage,
        createdAt: new Date(),
        section: addingToSection, // Add to the section that was clicked
      };

      onCharactersChange([...characters, character]);
      
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
        description: `${character.name} has been added to ${addingToSection === 'primary' ? 'Primary' : 'Secondary'}.`,
      });
    }

    setNewCharacter({ name: "", age: "", role: "", personality: "", appearance: "" });
    setCharacterReferenceImages([]);
    setGeneratedCharacterImage(null);
    setEditingCharacter(null);
    setIsAddCharacterOpen(false);
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setNewCharacter({
      name: character.name,
      age: "",
      role: character.description || "",
      personality: character.personality || "",
      appearance: (character.appearance as string) || "",
    });
    
    // Preserve the section when editing
    setAddingToSection((character as any).section || 'secondary');
    
    const charRefs = referenceImages
      .filter(r => r.characterId === character.id)
      .map(r => r.imageUrl);
    setCharacterReferenceImages(charRefs);
    setGeneratedCharacterImage(character.imageUrl);
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

  return (
    <div className="flex w-full gap-0 overflow-hidden">
      {/* LEFT COLUMN: SETTINGS (35% width) */}
      <div
        className={cn(
          "w-[35%] min-w-[350px] max-w-[500px] flex-shrink-0",
          "bg-[#1a1a1a]",
          "border-r border-white/[0.06]",
          "flex flex-col overflow-hidden"
        )}
      >
        <ScrollArea className="flex-1 h-full">
          <div className="p-6 space-y-6 pb-4">
            {/* Image Model */}
            <Card className="bg-[#252525] border-white/[0.06]">
              <CardContent className="p-6 space-y-3">
                <Label className="text-base font-semibold text-white">Image Model</Label>
                <Select value={selectedImageModel} onValueChange={handleImageModelChange}>
                  <SelectTrigger className="h-10 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a0a] border-white/10">
                    {IMAGE_MODELS.map((model) => (
                      <SelectItem key={model} value={model} className="focus:bg-[#FF4081]/20 focus:text-white">
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Aspect Ratio */}
            <Card className="bg-[#252525] border-white/[0.06]">
              <CardContent className="p-6 space-y-3">
                <Label className="text-base font-semibold text-white">Aspect Ratio</Label>
                <div className="grid grid-cols-3 gap-2">
                  {ASPECT_RATIOS.map((ratio) => {
                    const Icon = ratio.icon;
                    return (
                      <button
                        key={ratio.id}
                        onClick={() => {
                          setSelectedAspectRatio(ratio.id);
                          onAspectRatioChange?.(ratio.id);
                        }}
                        className={cn(
                          "p-3 rounded-lg border transition-all text-center relative overflow-hidden",
                          selectedAspectRatio === ratio.id
                            ? "border-white/20"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                        style={selectedAspectRatio === ratio.id ? {
                          background: `linear-gradient(to bottom right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                        } : undefined}
                      >
                        <Icon className="h-4 w-4 mx-auto mb-1 text-white" />
                        <div className="font-semibold text-xs text-white">{ratio.label}</div>
                        <div className="text-[9px] text-white/40">{ratio.description}</div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Style */}
            <Card className="bg-[#252525] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold text-white">Style</Label>
                  {styleRefs.length > 0 && (
                    <span className="text-xs text-white/50 italic">Using custom reference</span>
                  )}
                </div>
                
                {/* Style Grid with Navigation */}
                <div className={cn("flex items-center gap-3", styleRefs.length > 0 && "opacity-40 pointer-events-none")}>
                  {/* Left Arrow */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentStylePage(Math.max(0, currentStylePage - 1))}
                    disabled={currentStylePage === 0 || styleRefs.length > 0}
                    className="h-8 w-8 flex-shrink-0 text-white/70 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </Button>

                  {/* Style Grid */}
                  <div className="grid grid-cols-4 gap-2 flex-1">
                    {displayedStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => styleRefs.length === 0 && handleArtStyleChange(style.id)}
                        disabled={styleRefs.length > 0}
                        className={cn(
                          "relative rounded-md border transition-all overflow-hidden aspect-square",
                          styleRefs.length > 0 
                            ? "cursor-not-allowed" 
                            : selectedArtStyle === style.id
                              ? "ring-2 ring-[#FF4081] border-[#FF4081]/50"
                              : "border-white/10 hover:border-[#FF4081]/30"
                        )}
                      >
                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                          {style.imageUrl ? (
                            <img 
                              src={style.imageUrl} 
                              alt={style.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-white/10" />
                          )}
                        </div>
                        {selectedArtStyle === style.id && styleRefs.length === 0 && (
                          <div className="absolute inset-0 bg-[#FF4081]/30 flex items-center justify-center">
                            <div className="h-4 w-4 rounded-full relative flex items-center justify-center">
                              <div className={cn("absolute inset-0 rounded-full bg-gradient-to-br opacity-60", accentClasses)} />
                              <Check className="h-2.5 w-2.5 text-white relative z-10" />
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-0.5 bg-black/70 text-center">
                          <p className="text-[8px] font-medium leading-tight text-white">{style.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Right Arrow */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentStylePage(Math.min(totalStylePages - 1, currentStylePage + 1))}
                    disabled={currentStylePage === totalStylePages - 1 || styleRefs.length > 0}
                    className="h-8 w-8 flex-shrink-0 text-white/70 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Page Indicator */}
                <div className={cn("flex justify-center gap-1", styleRefs.length > 0 && "opacity-40")}>
                  {Array.from({ length: totalStylePages }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => styleRefs.length === 0 && setCurrentStylePage(index)}
                      disabled={styleRefs.length > 0}
                      className={cn(
                        "h-1 rounded-full transition-all",
                        index === currentStylePage 
                          ? "w-6 bg-[#FF4081]" 
                          : "w-1 bg-white/20 hover:bg-white/40",
                        styleRefs.length > 0 && "cursor-not-allowed"
                      )}
                    />
                  ))}
                </div>

                {/* Style Reference Upload */}
                <div className="pt-2 border-t border-white/[0.06]">
                  <Label className="text-sm font-medium text-white/70 mb-2 block">Custom Style Reference</Label>
                  {styleRefs.length > 0 ? (
                    <div className="relative aspect-video rounded-lg border border-white/10 bg-muted overflow-hidden">
                      <img src={styleRefs[0].imageUrl} alt="Style Reference" className="h-full w-full object-cover" />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => handleRemoveStyleReference(styleRefs[0].id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-[#FF4081]/30 transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadReference(file);
                        }}
                      />
                      <Upload className="h-5 w-5 text-white/40 mb-1" />
                      <span className="text-xs text-white/50">Upload Custom Style</span>
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* World Description */}
            <Card className="bg-[#252525] border-white/[0.06]">
              <CardContent className="p-6 space-y-3">
                <Label className="text-base font-semibold text-white">World Description</Label>
                <Textarea
                  placeholder="Describe the world setting, era, atmosphere..."
                  value={selectedWorldDescription}
                  onChange={(e) => handleWorldDescriptionChange(e.target.value)}
                  rows={4}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#FF4081]/50"
                />
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>

      {/* RIGHT COLUMN: CAST & LOCATIONS (65% width) */}
      <div className="flex-1 relative flex flex-col overflow-hidden bg-[#1a1a1a]">
        <ScrollArea className="flex-1 h-full">
          <div className="p-6 space-y-8 pb-4">
            {/* CAST SECTION */}
            <div className="space-y-6">
              {/* Cast Title */}
              <h2 className="text-2xl font-bold text-white">Cast</h2>
              
              {/* PRIMARY CHARACTER */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white/90">Primary</h3>
                  <Button
                    size="sm"
                    onClick={handleOpenRecommendations}
                    className="bg-white/[0.02] border border-white/[0.06] text-white hover:border-[#FF4081]/30 hover:bg-white/[0.04]"
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-[#FF4081]" />
                    Recommend
                  </Button>
                </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {/* Add Primary Character Card */}
                {/* Always show Add Character button in Primary */}
                <button
                  onClick={() => {
                    setEditingCharacter(null);
                    setNewCharacter({ name: "", age: "", role: "", personality: "", appearance: "" });
                    setCharacterReferenceImages([]);
                    setGeneratedCharacterImage(null);
                    setAddingToSection('primary');
                    setIsAddCharacterOpen(true);
                  }}
                  className="aspect-[3/4] rounded-xl border-2 border-dashed border-white/10 hover:border-[#FF4081]/50 bg-[#1a1a1a] hover:bg-[#252525] transition-all flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-16 h-16 rounded-full relative flex items-center justify-center">
                    <div className={cn("absolute inset-0 rounded-full bg-gradient-to-br opacity-60", accentClasses)} />
                    <Plus className="w-8 h-8 text-white relative z-10" />
                  </div>
                  <p className="text-sm font-medium text-white">Add character</p>
                </button>

                {/* Primary Character Cards */}
                {characters.filter(c => (c as any).section === 'primary').map((character) => (
                  <Card 
                    key={character.id}
                    className="relative aspect-[3/4] overflow-hidden group bg-[#252525] border-white/[0.06] hover:border-[#FF4081]/30 transition-all rounded-xl"
                  >
                    <CardContent className="p-0 h-full">
                      <div className="h-full bg-muted flex items-center justify-center relative">
                        {character.imageUrl ? (
                          <img src={character.imageUrl} alt={character.name} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-16 w-16 text-muted-foreground" />
                        )}
                        
                        {/* Action Buttons - Show on Hover */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-white/10"
                            onClick={() => handleEditCharacter(character)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-white/10"
                            onClick={() => {
                              toast({
                                title: "Export Character",
                                description: "Character export functionality coming soon.",
                              });
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-white/10"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                              <DropdownMenuItem 
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                                onClick={() => {
                                  onCharactersChange(characters.filter(c => c.id !== character.id));
                                  toast({
                                    title: "Character Deleted",
                                    description: `${character.name} has been removed.`,
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {/* Character Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                        <p className="text-sm font-semibold text-white truncate">{character.name}</p>
                        {character.description && (
                          <p className="text-xs text-white/70 line-clamp-1">{character.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

              {/* SECONDARY CHARACTERS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white/90">Secondary</h3>
                  <Button
                    size="sm"
                    onClick={handleOpenRecommendations}
                    className="bg-white/[0.02] border border-white/[0.06] text-white hover:border-[#FF4081]/30 hover:bg-white/[0.04]"
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-[#FF4081]" />
                    Recommend
                  </Button>
                </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {/* Always show Add Character button in Secondary */}
                <button
                  onClick={() => {
                    setEditingCharacter(null);
                    setNewCharacter({ name: "", age: "", role: "", personality: "", appearance: "" });
                    setCharacterReferenceImages([]);
                    setGeneratedCharacterImage(null);
                    setAddingToSection('secondary');
                    setIsAddCharacterOpen(true);
                  }}
                  className="aspect-[3/4] rounded-xl border-2 border-dashed border-white/10 hover:border-[#FF4081]/50 bg-[#1a1a1a] hover:bg-[#252525] transition-all flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-16 h-16 rounded-full relative flex items-center justify-center">
                    <div className={cn("absolute inset-0 rounded-full bg-gradient-to-br opacity-60", accentClasses)} />
                    <Plus className="w-8 h-8 text-white relative z-10" />
                  </div>
                  <p className="text-sm font-medium text-white">Add character</p>
                </button>

                {/* Secondary Character Cards */}
                {characters.filter(c => (c as any).section === 'secondary').map((character) => (
                  <Card 
                    key={character.id} 
                    className="relative aspect-[3/4] overflow-hidden group bg-[#252525] border-white/[0.06] hover:border-[#FF4081]/30 transition-all rounded-xl"
                  >
                    <CardContent className="p-0 h-full">
                      <div className="h-full bg-muted flex items-center justify-center relative">
                        {character.imageUrl ? (
                          <img src={character.imageUrl} alt={character.name} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-16 w-16 text-muted-foreground" />
                        )}
                        
                        {/* Action Buttons - Show on Hover */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-white/10"
                            onClick={() => handleEditCharacter(character)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-white/10"
                            onClick={() => {
                              toast({
                                title: "Export Character",
                                description: "Character export functionality coming soon.",
                              });
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-white/10"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                              <DropdownMenuItem 
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                                onClick={() => {
                                  onCharactersChange(characters.filter(c => c.id !== character.id));
                                  toast({
                                    title: "Character Deleted",
                                    description: `${character.name} has been removed.`,
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {/* Character Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                        <p className="text-sm font-semibold text-white truncate">{character.name}</p>
                        {character.description && (
                          <p className="text-xs text-white/70 line-clamp-1">{character.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              </div>
            </div>

            {/* LOCATIONS SECTION */}
            <div className="space-y-6">
              {/* Location Title */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Location</h2>
                <Button
                  size="sm"
                  onClick={handleOpenLocationRecommendations}
                  className="bg-white/[0.02] border border-white/[0.06] text-white hover:border-[#FF4081]/30 hover:bg-white/[0.04]"
                >
                  <Sparkles className="mr-2 h-4 w-4 text-[#FF4081]" />
                  Recommend
                </Button>
              </div>

              {/* Location Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {/* Add Location Card - Always visible */}
                <button
                  onClick={() => {
                    setEditingLocation(null);
                    setNewLocation({ name: "", description: "", details: "" });
                    setLocationReferenceImages([]);
                    setGeneratedLocationImage(null);
                    setIsAddLocationOpen(true);
                  }}
                  className="aspect-[3/4] rounded-xl border-2 border-dashed border-white/10 hover:border-[#FF4081]/50 bg-[#1a1a1a] hover:bg-[#252525] transition-all flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-16 h-16 rounded-full relative flex items-center justify-center">
                    <div className={cn("absolute inset-0 rounded-full bg-gradient-to-br opacity-60", accentClasses)} />
                    <Plus className="w-8 h-8 text-white relative z-10" />
                  </div>
                  <p className="text-sm font-medium text-white">Add location</p>
                </button>

                {/* Location Cards */}
                {locations.map((location) => (
                  <Card 
                    key={location.id} 
                    className="relative aspect-[3/4] overflow-hidden group bg-[#252525] border-white/[0.06] hover:border-[#FF4081]/30 transition-all rounded-xl"
                  >
                    <CardContent className="p-0 h-full">
                      <div className="h-full bg-muted flex items-center justify-center relative">
                        {location.imageUrl ? (
                          <img src={location.imageUrl} alt={location.name} className="h-full w-full object-cover" />
                        ) : (
                          <MapPin className="h-16 w-16 text-muted-foreground" />
                        )}
                        
                        {/* Action Buttons - Show on Hover */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-white/10"
                            onClick={() => handleEditLocation(location)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-white/10"
                            onClick={() => {
                              toast({
                                title: "Export Location",
                                description: "Location export functionality coming soon.",
                              });
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-white/10"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                              <DropdownMenuItem 
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                                onClick={() => {
                                  if (onLocationsChange) {
                                    onLocationsChange(locations.filter(l => l.id !== location.id));
                                    toast({
                                      title: "Location Deleted",
                                      description: `${location.name} has been removed.`,
                                    });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {/* Location Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                        <p className="text-sm font-semibold text-white truncate">{location.name}</p>
                        {location.description && (
                          <p className="text-xs text-white/70 line-clamp-1">{location.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Location Dialog */}
      <Dialog open={isAddLocationOpen} onOpenChange={setIsAddLocationOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#1a1a1a] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">{editingLocation ? "Edit Location" : "Create New Location"}</DialogTitle>
            <DialogDescription className="text-white/50">
              Define a location setting for your videos. Upload reference images for consistency.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Form Fields */}
              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="loc-name" className="text-white text-sm font-medium">
                    Name
                  </Label>
                  <Input
                    id="loc-name"
                    placeholder="Location name"
                    value={newLocation.name}
                    onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                    className="bg-[#252525] border-white/10 text-white h-10"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="loc-description" className="text-white text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="loc-description"
                    placeholder="Brief description of the location..."
                    value={newLocation.description}
                    onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                    rows={3}
                    className="bg-[#252525] border-white/10 text-white resize-none"
                  />
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <Label htmlFor="loc-details" className="text-white text-sm font-medium">
                    Details
                  </Label>
                  <Textarea
                    id="loc-details"
                    placeholder="Visual details, atmosphere, lighting, key features..."
                    value={newLocation.details}
                    onChange={(e) => setNewLocation({ ...newLocation, details: e.target.value })}
                    rows={4}
                    className="bg-[#252525] border-white/10 text-white resize-none"
                  />
                </div>

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerateLocation} 
                  className="w-full text-white hover:opacity-90 h-10 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(to right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                  }}
                  disabled={isGeneratingLocation || !newLocation.details.trim()}
                >
                  {isGeneratingLocation ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Location Image
                    </>
                  )}
                </Button>
              </div>

              {/* Right Column - References & Preview */}
              <div className="space-y-4">
                {/* Reference Images */}
                <div className="space-y-2">
                  <Label className="text-white text-sm font-medium">
                    Reference Images ({locationReferenceImages.length}/{MAX_LOCATION_REFERENCES})
                  </Label>
                  {locationReferenceImages.length === 0 ? (
                    <p className="text-sm text-white/50 text-center py-3">No reference images uploaded yet</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {locationReferenceImages.map((url, index) => (
                        <div key={index} className="relative aspect-video rounded-lg border border-white/10 bg-muted">
                          <div className="absolute inset-0 rounded-lg overflow-hidden">
                            <img src={url} alt={`Reference ${index + 1}`} className="h-full w-full object-cover" />
                          </div>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-5 w-5 z-10"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveLocationReference(index);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {locationReferenceImages.length < MAX_LOCATION_REFERENCES && (
                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-[#FF4081]/30 transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadLocationReference(file);
                        }}
                      />
                      <Upload className="h-5 w-5 text-white/40 mb-1" />
                      <span className="text-sm text-white/50">Upload Reference</span>
                    </label>
                  )}
                </div>

                {/* Generated Location Image */}
                <div className="space-y-2">
                  <Label className="text-white text-sm font-medium">Generated Location Image</Label>
                  <div className="aspect-video rounded-lg border border-white/10 overflow-hidden bg-[#0f0f0f] flex items-center justify-center">
                    {generatedLocationImage ? (
                      <img 
                        src={generatedLocationImage} 
                        alt="Generated location" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <div className="text-center p-6">
                        <div className="w-16 h-16 mx-auto mb-3 opacity-20">
                          <MapPin className="h-full w-full text-white/40" />
                        </div>
                        <p className="text-sm text-white/50">Generated image will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button 
                variant="ghost"
                onClick={() => setIsAddLocationOpen(false)}
                className="text-white/70 hover:text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveLocation}
                className="text-white hover:opacity-90 relative overflow-hidden"
                style={{
                  background: `linear-gradient(to right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                }}
              >
                {editingLocation ? "Update" : "Add Location"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Recommendation Modal */}
      <Dialog open={isLocationRecommendationOpen} onOpenChange={setIsLocationRecommendationOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto custom-scrollbar bg-[#1a1a1a] border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-[#FF4081]" />
              AI Location Recommendations
            </DialogTitle>
            <DialogDescription>
              Based on your story script, here are suggested key locations
            </DialogDescription>
          </DialogHeader>

          {isLocationAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF4081] mb-4" />
              <p className="text-sm text-white/50">Analyzing your story...</p>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              {locationRecommendations.map((location, index) => (
                <Card key={index} className="overflow-hidden bg-[#252525] border-white/[0.06]">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <h4 className="font-semibold text-lg text-white">{location.name}</h4>
                        <p className="text-sm text-white/70">{location.description}</p>
                        <div className="pt-2">
                          <Label className="text-xs font-medium text-white/50 uppercase tracking-wider">Visual Details</Label>
                          <p className="text-sm mt-1 text-white/80">{location.visualDetails}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddRecommendedLocation(location)}
                        className="text-white hover:opacity-90 relative overflow-hidden"
                        style={{
                          background: `linear-gradient(to right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                        }}
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        Add Location
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Character Recommendation Modal */}
      <Dialog open={isRecommendationModalOpen} onOpenChange={setIsRecommendationModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto custom-scrollbar bg-[#1a1a1a] border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-[#FF4081]" />
              AI Character Recommendations
            </DialogTitle>
            <DialogDescription>
              Based on your story script, here are suggested characters
            </DialogDescription>
          </DialogHeader>

          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF4081] mb-4" />
              <p className="text-sm text-white/50">Analyzing your story...</p>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              {recommendations.map((recChar, index) => {
                const isAdded = characters.some(c => c.name === recChar.name);
                return (
                  <Card key={index} className="overflow-hidden bg-white/[0.02] border-white/[0.06]">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h4 className="font-semibold text-base text-white">{recChar.name}</h4>
                          <p className="text-sm text-white/70">{recChar.description}</p>
                          <div className="pt-2">
                            <Label className="text-xs font-medium text-white/50">APPEARANCE</Label>
                            <p className="text-sm mt-1 text-white/80">{recChar.appearance}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddRecommendedCharacter(recChar)}
                          disabled={isAdded}
                          className={isAdded ? "" : "text-white hover:opacity-90 relative overflow-hidden"}
                          style={!isAdded ? {
                            background: `linear-gradient(to right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                          } : undefined}
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

      {/* Character Dialog */}
      <Dialog open={isAddCharacterOpen} onOpenChange={setIsAddCharacterOpen}>
        <DialogContent className="max-w-5xl w-[80vw] max-h-[85vh] overflow-y-auto custom-scrollbar bg-[#1a1a1a] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">{editingCharacter ? "Edit character" : "Create character"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-[1fr,350px] gap-6">
              {/* Left Column - Form Fields */}
              <div className="space-y-4">
                {/* Character Name and Age Row */}
                <div className="grid grid-cols-[2fr,1fr] gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="char-name" className="text-white text-xs font-medium uppercase tracking-wider">
                      Character Name*
                    </Label>
                    <Input
                      id="char-name"
                      placeholder="Character name"
                      value={newCharacter.name}
                      onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
                      className="bg-[#252525] border-white/10 text-white h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="char-age" className="text-white text-xs font-medium uppercase tracking-wider">
                      Age
                    </Label>
                    <Input
                      id="char-age"
                      placeholder="35"
                      value={newCharacter.age}
                      onChange={(e) => setNewCharacter({ ...newCharacter, age: e.target.value })}
                      className="bg-[#252525] border-white/10 text-white h-10"
                    />
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="char-role" className="text-white text-xs font-medium uppercase tracking-wider">
                    Role*
                  </Label>
                  <Input
                    id="char-role"
                    placeholder="Brave protector of the weak"
                    value={newCharacter.role}
                    onChange={(e) => setNewCharacter({ ...newCharacter, role: e.target.value })}
                    className="bg-[#252525] border-white/10 text-white h-10"
                  />
                </div>

                {/* Appearance */}
                <div className="space-y-2">
                  <Label htmlFor="char-appearance" className="text-white text-xs font-medium uppercase tracking-wider">
                    Appearance*
                  </Label>
                  <Textarea
                    id="char-appearance"
                    placeholder="A tall, brown eyed, middle aged woman with sharp features"
                    value={newCharacter.appearance}
                    onChange={(e) => setNewCharacter({ ...newCharacter, appearance: e.target.value })}
                    rows={4}
                    className="bg-[#252525] border-white/10 text-white resize-none"
                  />
                </div>

                {/* Personality */}
                <div className="space-y-2">
                  <Label htmlFor="char-personality" className="text-white text-xs font-medium uppercase tracking-wider">
                    Personality
                  </Label>
                  <Textarea
                    id="char-personality"
                    placeholder="Personality traits, mannerisms..."
                    value={newCharacter.personality}
                    onChange={(e) => setNewCharacter({ ...newCharacter, personality: e.target.value })}
                    rows={3}
                    className="bg-[#252525] border-white/10 text-white resize-none"
                  />
                </div>

                {/* Reference Images */}
                <div className="space-y-2">
                  <Label className="text-white text-xs font-medium uppercase tracking-wider">
                    Reference Images ({characterReferenceImages.length}/{MAX_CHARACTER_REFERENCES})
                  </Label>
                  {characterReferenceImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {characterReferenceImages.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-lg border border-white/10 bg-muted">
                          <div className="absolute inset-0 rounded-lg overflow-hidden">
                            <img src={url} alt={`Reference ${index + 1}`} className="h-full w-full object-cover" />
                          </div>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-5 w-5 z-10"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveCharacterReference(index);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {characterReferenceImages.length < MAX_CHARACTER_REFERENCES && (
                    <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-[#FF4081]/30 transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadCharacterReference(file);
                        }}
                      />
                      <Upload className="h-4 w-4 text-white/40 mb-1" />
                      <span className="text-xs text-white/50">Upload Reference</span>
                    </label>
                  )}
                </div>

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerateCharacter} 
                  className="w-full text-white hover:opacity-90 h-10 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(to right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                  }}
                  disabled={isGenerating || !newCharacter.appearance.trim()}
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

              {/* Right Column - Character Image Preview */}
              <div className="space-y-2 flex-shrink-0">
                <div className="w-full aspect-[9/16] rounded-lg border border-white/10 overflow-hidden bg-[#1a1a1a] flex items-center justify-center">
                  {generatedCharacterImage ? (
                    <img 
                      src={generatedCharacterImage} 
                      alt="Generated character" 
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-32 h-48 mx-auto mb-4 opacity-20">
                        <User className="h-full w-full text-white/40" />
                      </div>
                      <p className="text-sm text-white/50">Generated image will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button 
                variant="ghost"
                onClick={() => setIsAddCharacterOpen(false)}
                className="text-white/70 hover:text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveCharacter} 
                className="text-white hover:opacity-90 relative overflow-hidden"
                style={{
                  background: `linear-gradient(to right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                }}
              >
                {editingCharacter ? "Update" : "Add To Cast"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

