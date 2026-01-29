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
import { Plus, Upload, Check, Pencil, User, Sparkles, X, Loader2, RectangleHorizontal, RectangleVertical, Square, ChevronRight, MapPin, Download, MoreVertical, Trash2, LayoutGrid } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
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
  worldDescription?: string;
  onCharactersChange: (characters: Character[]) => void;
  onLocationsChange?: (locations: Location[]) => void;
  onReferenceImagesChange: (images: ReferenceImage[]) => void;
  onWorldSettingsChange?: (settings: { 
    artStyle: string; 
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

// Mock character library - previously created characters

export function ElementsTab({
  videoId,
  workspaceId,
  characters,
  locations = [],
  referenceImages,
  artStyle = "none",
  worldDescription = "",
  onCharactersChange,
  onLocationsChange,
  onReferenceImagesChange,
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
  const [isCharacterLibraryOpen, setIsCharacterLibraryOpen] = useState(false);
  const [isLocationLibraryOpen, setIsLocationLibraryOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLocationAnalyzing, setIsLocationAnalyzing] = useState(false);
  const [recommendationsBySection, setRecommendationsBySection] = useState<{
    primary: Array<{ name: string; description: string; appearance: string }>;
    secondary: Array<{ name: string; description: string; appearance: string }>;
  }>({ primary: [], secondary: [] });
  const [selectedLibrarySection, setSelectedLibrarySection] = useState<'primary' | 'secondary'>('primary');
  const [locationRecommendations, setLocationRecommendations] = useState<any[]>([]);
  const [currentStylePage, setCurrentStylePage] = useState(0);
  const [isGeneratingLocation, setIsGeneratingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: "", description: "", details: "" });
  const [locationReferenceImages, setLocationReferenceImages] = useState<string[]>([]);
  const [generatedLocationImage, setGeneratedLocationImage] = useState<string | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [newCharacter, setNewCharacter] = useState({ name: "", age: "", role: "", personality: "", appearance: "" });
  const [characterReferenceImages, setCharacterReferenceImages] = useState<Array<{ tempId: string; previewUrl: string }>>([]);
  const [generatedCharacterImage, setGeneratedCharacterImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedArtStyle, setSelectedArtStyle] = useState(artStyle);
  const [selectedWorldDescription, setSelectedWorldDescription] = useState(worldDescription);
  const { toast } = useToast();

  const styleRefs = referenceImages.filter((r) => r.type === "style");
  const accentClasses = "from-[#FF4081] via-[#FF5C8D] to-[#FF6B4A]"; // Gradient pink to orange from logo

  // Fetch character library from database
  const { data: libraryCharacters, isLoading: isLoadingCharacterLibrary } = useQuery<Character[]>({
    queryKey: [`/api/characters?workspaceId=${workspaceId}`],
    enabled: isCharacterLibraryOpen && !!workspaceId,
    queryFn: async () => {
      const response = await fetch(`/api/characters?workspaceId=${workspaceId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch characters');
      return response.json();
    },
  });

  // Fetch location library from database
  const { data: libraryLocations, isLoading: isLoadingLocationLibrary } = useQuery<Location[]>({
    queryKey: [`/api/locations?workspaceId=${workspaceId}`],
    enabled: isLocationLibraryOpen && !!workspaceId,
    queryFn: async () => {
      const response = await fetch(`/api/locations?workspaceId=${workspaceId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    },
  });
  
  // Pagination for styles - show 4 at a time
  const STYLES_PER_PAGE = 4;
  const totalStylePages = Math.ceil(STYLES.length / STYLES_PER_PAGE);
  const startIndex = currentStylePage * STYLES_PER_PAGE;
  const endIndex = startIndex + STYLES_PER_PAGE;
  const displayedStyles = STYLES.slice(startIndex, endIndex);

  const handleOpenRecommendations = async () => {
    setIsRecommendationModalOpen(true);
    setIsAnalyzing(true);
    
    try {
      console.log('[elements-tab] Starting character analysis...', { videoId, workspaceId });
      
      // Get script and settings from parent - we need to pass these as props
      // For now, we'll need to get them from the video data or pass them as props
      // This is a temporary solution - we should pass script and settings as props
      const videoResponse = await fetch(`/api/character-vlog/videos/${videoId}`, {
        credentials: 'include',
      });
      
      if (!videoResponse.ok) {
        console.error('[elements-tab] Failed to fetch video:', { status: videoResponse.status, statusText: videoResponse.statusText });
        throw new Error('Failed to fetch video data');
      }
      
      const video = await videoResponse.json();
      console.log('[elements-tab] Video fetched:', {
        videoId: video.id,
        hasStep1Data: !!video.step1Data,
        hasStep2Data: !!video.step2Data,
        step1DataKeys: video.step1Data ? Object.keys(video.step1Data) : [],
        step2DataKeys: video.step2Data ? Object.keys(video.step2Data) : [],
      });
      
      const step1Data = video.step1Data || {};
      const step2Data = video.step2Data || {};
      
      console.log('[elements-tab] Step1Data extracted:', {
        hasScript: !!step1Data.script,
        scriptLength: step1Data.script ? step1Data.script.length : 0,
        scriptPreview: step1Data.script ? step1Data.script.substring(0, 100) + '...' : 'N/A',
        narrationStyle: step1Data.narrationStyle,
        characterPersonality: step1Data.characterPersonality,
        theme: step1Data.theme,
        allStep1Keys: Object.keys(step1Data),
      });
      
      console.log('[elements-tab] Step2Data extracted:', {
        artStyle: step2Data.artStyle,
        imageModel: step2Data.imageModel,
        worldDescription: step2Data.worldDescription,
        styleRefsCount: styleRefs.length,
        allStep2Keys: Object.keys(step2Data),
      });
      
      // Validate required fields
      const script = step1Data.script || '';
      if (!script || script.trim().length === 0) {
        console.error('[elements-tab] Script is empty or missing:', {
          scriptExists: !!step1Data.script,
          scriptType: typeof step1Data.script,
          scriptLength: script.length,
          step1DataFull: step1Data,
        });
        toast({
          title: "Script Required",
          description: "Please generate a script first before analyzing characters.",
          variant: "destructive",
        });
        setIsAnalyzing(false);
        setIsRecommendationModalOpen(false);
        return;
      }
      
      // Determine style - if none is selected, use a default
      let style = step2Data.artStyle;
      if (!style || style === 'none') {
        style = styleRefs.length > 0 ? 'custom_image' : 'Realistic Cinematic';
      }
      
      const requestBody = {
        videoId,
        script: script.trim(),
        narrationStyle: step1Data.narrationStyle || 'first-person',
        characterPersonality: step1Data.characterPersonality || 'energetic',
        theme: step1Data.theme || 'urban',
        style: style,
        worldDescription: step2Data.worldDescription || '',
      };
      
      console.log('[elements-tab] Sending analyze request:', {
        ...requestBody,
        scriptLength: requestBody.script.length,
        scriptPreview: requestBody.script.substring(0, 100) + '...',
      });
      
      // Call character analyzer endpoint
      const analyzeResponse = await fetch('/api/character-vlog/characters/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });
      
      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[elements-tab] Analyze request failed:', {
          status: analyzeResponse.status,
          statusText: analyzeResponse.statusText,
          errorData,
        });
        const errorMessage = errorData.details || errorData.error || `HTTP ${analyzeResponse.status}`;
        throw new Error(errorMessage);
      }
      
      const result = await analyzeResponse.json();
      console.log('[elements-tab] Analysis result received:', {
        hasPrimaryCharacter: !!result.primaryCharacter,
        primaryCharacterName: result.primaryCharacter?.name,
        secondaryCount: result.secondaryCharacters?.length || 0,
        cost: result.cost,
      });
      
      // Transform result to match expected format
      const primaryRecommendations = result.primaryCharacter ? [{
        name: result.primaryCharacter.name,
        description: result.primaryCharacter.summaryDescription,
        appearance: result.primaryCharacter.summaryAppearance,
      }] : [];
      
      const secondaryRecommendations = (result.secondaryCharacters || []).slice(0, 4).map((char: any) => ({
        name: char.name,
        description: char.summaryDescription,
        appearance: char.summaryAppearance,
      }));
      
      setRecommendationsBySection({
        primary: primaryRecommendations,
        secondary: secondaryRecommendations,
      });
    } catch (error) {
      console.error('Failed to analyze characters:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Analysis Failed",
        description: errorMessage || "Failed to analyze characters. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOpenLocationRecommendations = async () => {
    setIsLocationRecommendationOpen(true);
    setIsLocationAnalyzing(true);
    
    try {
      console.log('[elements-tab] Starting location analysis...', { videoId, workspaceId });
      
      // Fetch video data to get script and settings
      const videoResponse = await fetch(`/api/character-vlog/videos/${videoId}`, {
        credentials: 'include',
      });
      
      if (!videoResponse.ok) {
        console.error('[elements-tab] Failed to fetch video:', { status: videoResponse.status, statusText: videoResponse.statusText });
        throw new Error('Failed to fetch video data');
      }
      
      const video = await videoResponse.json();
      console.log('[elements-tab] Video fetched for location analysis:', {
        videoId: video.id,
        hasStep1Data: !!video.step1Data,
        hasStep2Data: !!video.step2Data,
      });
      
      const step1Data = video.step1Data || {};
      const step2Data = video.step2Data || {};
      
      console.log('[elements-tab] Step1Data for location analysis:', {
        hasGenres: !!step1Data.genres,
        genresType: typeof step1Data.genres,
        genresValue: step1Data.genres,
        genresIsArray: Array.isArray(step1Data.genres),
        allStep1Keys: Object.keys(step1Data),
      });
      
      // Validate required fields
      const script = step1Data.script || '';
      if (!script || script.trim().length === 0) {
        console.error('[elements-tab] Script is empty or missing for location analysis');
        toast({
          title: "Script Required",
          description: "Please generate a script first before analyzing locations.",
          variant: "destructive",
        });
        setIsLocationAnalyzing(false);
        setIsLocationRecommendationOpen(false);
        return;
      }
      
      const theme = step1Data.theme || 'urban';
      
      // Handle genres - could be array, string, or null/undefined
      let genres: string[] = [];
      if (step1Data.genres) {
        if (Array.isArray(step1Data.genres)) {
          genres = step1Data.genres.filter((g: any) => g && typeof g === 'string'); // Filter out invalid entries
        } else if (typeof step1Data.genres === 'string') {
          // Try to parse if it's a JSON string
          try {
            const parsed = JSON.parse(step1Data.genres);
            genres = Array.isArray(parsed) ? parsed.filter((g: any) => g && typeof g === 'string') : [step1Data.genres];
          } catch {
            // If not JSON, treat as single genre
            genres = [step1Data.genres];
          }
        }
      }
      
      // Fallback to default genre if none found (same as script editor)
      if (genres.length === 0) {
        console.warn('[elements-tab] No genres found in step1Data, using default "Lifestyle"');
        genres = ['Lifestyle'];
      }
      
      console.log('[elements-tab] Processed genres:', {
        original: step1Data.genres,
        processed: genres,
        length: genres.length,
      });
      
      const duration = step1Data.duration ? parseInt(step1Data.duration, 10) : 300;
      if (isNaN(duration)) {
        console.error('[elements-tab] Invalid duration for location analysis');
        toast({
          title: "Duration Required",
          description: "Please set a valid duration before analyzing locations.",
          variant: "destructive",
        });
        setIsLocationAnalyzing(false);
        setIsLocationRecommendationOpen(false);
        return;
      }
      
      const requestBody = {
        videoId,
        script: script.trim(),
        theme,
        genres,
        worldDescription: step2Data.worldDescription || '',
        duration,
        maxResults: 5,
      };
      
      console.log('[elements-tab] Sending location analyze request:', {
        ...requestBody,
        scriptLength: requestBody.script.length,
        scriptPreview: requestBody.script.substring(0, 100) + '...',
      });
      
      // Call location analyzer endpoint
      const analyzeResponse = await fetch('/api/character-vlog/locations/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });
      
      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[elements-tab] Location analyze request failed:', {
          status: analyzeResponse.status,
          statusText: analyzeResponse.statusText,
          errorData,
        });
        const errorMessage = errorData.details || errorData.error || `HTTP ${analyzeResponse.status}`;
        throw new Error(errorMessage);
      }
      
      const result = await analyzeResponse.json();
      console.log('[elements-tab] Location analysis result received:', {
        locationCount: result.locations?.length || 0,
        cost: result.cost,
      });
      
      // Transform result to match expected format
      const transformedLocations = (result.locations || []).map((loc: any) => ({
        name: loc.name,
        description: loc.description,
        visualDetails: loc.details, // Map 'details' to 'visualDetails' for the UI
      }));
      
      setLocationRecommendations(transformedLocations);
    } catch (error) {
      console.error('Failed to analyze locations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Analysis Failed",
        description: errorMessage || "Failed to analyze locations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLocationAnalyzing(false);
    }
  };

  const handleGenerateLocation = async () => {
    if (!newLocation.details.trim()) {
      toast({
        title: "Details Required",
        description: "Please provide location details before generating.",
        variant: "destructive",
      });
      return;
    }

    if (!newLocation.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a location name before generating.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingLocation(true);

    try {
      // Ensure location exists in database before generating image
      let locationId = editingLocation?.id;
      
      // Check if location ID looks like a temporary ID (starts with 'loc-' or 'temp-')
      // Real database IDs are UUIDs, not prefixed with 'loc-' or 'temp-'
      const isTemporaryId = !locationId || locationId.startsWith('loc-') || locationId.startsWith('temp-');
      
      if (isTemporaryId) {
        console.log('[elements-tab] Location not in DB, creating first...', { 
          locationId, 
          editingLocation,
          isTemporaryId,
        });
        
        // Create location in database first
        const createResponse = await fetch('/api/character-vlog/locations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            videoId,
            name: newLocation.name,
            description: newLocation.description || undefined,
            details: newLocation.details || undefined,
          }),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({ error: 'Failed to create location' }));
          console.error('[elements-tab] Location creation failed:', {
            status: createResponse.status,
            error: errorData,
          });
          throw new Error(errorData.error || errorData.details || 'Failed to create location');
        }

        const savedLocation = await createResponse.json();
        locationId = savedLocation.id;
        
        console.log('[elements-tab] Location created in DB:', { 
          locationId, 
          name: savedLocation.name,
          oldId: editingLocation?.id,
        });
        
        // Update local state with the saved location
        const location: Location = {
          ...savedLocation,
        };
        
        // If editing, update the existing location in the list
        if (editingLocation && onLocationsChange) {
          const updatedLocations = locations.map(l => 
            l.id === editingLocation.id ? location : l
          );
          onLocationsChange(updatedLocations);
          setEditingLocation(location);
        } else if (onLocationsChange) {
          // Add new location to list
          onLocationsChange([...locations, location]);
          setEditingLocation(location);
        }
      } else {
        console.log('[elements-tab] Using existing location ID:', { locationId });
      }

      // Get art style description from selected style
      let artStyleDescription = '';
      if (selectedArtStyle && selectedArtStyle !== 'none') {
        const styleObj = STYLES.find(s => s.id === selectedArtStyle);
        if (styleObj) {
          artStyleDescription = styleObj.name;
        }
      }

      // Get style reference image if custom image is selected
      const styleReferenceImage = selectedArtStyle === 'custom_image' && styleRefs.length > 0 
        ? styleRefs[0].imageUrl 
        : undefined;

      // Get reference images
      const referenceImages = locationReferenceImages.length > 0 
        ? locationReferenceImages 
        : undefined;

      console.log('[elements-tab] Generating location image:', {
        locationId,
        name: newLocation.name,
        hasDescription: !!newLocation.description,
        hasDetails: !!newLocation.details,
        artStyle: selectedArtStyle,
        hasWorldDescription: !!selectedWorldDescription,
        hasStyleReference: !!styleReferenceImage,
        referenceImageCount: referenceImages?.length || 0,
      });

      const response = await fetch(`/api/character-vlog/locations/${locationId}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          videoId, // Required for Bunny CDN path building
          name: newLocation.name,
          description: newLocation.description || newLocation.details,
          details: newLocation.details,
          artStyleDescription: artStyleDescription || undefined,
          styleReferenceImage: styleReferenceImage,
          worldDescription: selectedWorldDescription || undefined,
          // Note: model is always 'nano-banana' for location images (hardcoded in backend)
          referenceImages: referenceImages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.details || errorData.error || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.imageUrl) {
        setGeneratedLocationImage(data.imageUrl);
        toast({
          title: "Location Generated",
          description: `Location image for ${newLocation.name} has been created.`,
        });
      } else {
        throw new Error('No image URL in response');
      }
    } catch (error) {
      console.error('[elements-tab] Location image generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate location image.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLocation(false);
    }
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

  const handleSaveLocation = async () => {
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
      // Update existing location in database
      try {
        const response = await fetch(`/api/character-vlog/locations/${editingLocation.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            name: newLocation.name,
            description: newLocation.description || undefined,
            details: newLocation.details || undefined,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to update location' }));
          throw new Error(error.error || 'Failed to update location');
        }

        const updatedLocation = await response.json();
        
        const updatedLocations = locations.map(l => 
          l.id === editingLocation.id 
            ? { 
                ...updatedLocation,
                imageUrl: generatedLocationImage || updatedLocation.imageUrl,
              }
            : l
        );
        onLocationsChange(updatedLocations);
        
        toast({
          title: "Location Updated",
          description: `${newLocation.name} has been updated.`,
        });
      } catch (error) {
        console.error('Failed to update location:', error);
        toast({
          title: "Failed to Update Location",
          description: error instanceof Error ? error.message : "Failed to update location in database.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Create location in database immediately
      try {
        const response = await fetch('/api/character-vlog/locations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            videoId,
            name: newLocation.name,
            description: newLocation.description || undefined,
            details: newLocation.details || undefined,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to create location' }));
          throw new Error(error.error || 'Failed to create location');
        }

        const savedLocation = await response.json();
        
        const location: Location = {
          ...savedLocation,
          imageUrl: generatedLocationImage || savedLocation.imageUrl, // Use generated image if available
        };

        onLocationsChange([...locations, location]);
        
        toast({
          title: "Location Added",
          description: `${newLocation.name} has been added.`,
        });
      } catch (error) {
        console.error('Failed to create location:', error);
        toast({
          title: "Failed to Save Location",
          description: error instanceof Error ? error.message : "Failed to save location to database.",
          variant: "destructive",
        });
        return; // Don't proceed if save failed
      }
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

  const handleAddRecommendedLocation = async (recLoc: typeof MOCK_RECOMMENDED_LOCATIONS[0]) => {
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

    // Save location to database immediately (even without image)
    try {
      const response = await fetch('/api/character-vlog/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          videoId,
          name: recLoc.name,
          description: recLoc.description || undefined,
          details: recLoc.visualDetails || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create location' }));
        throw new Error(error.error || 'Failed to create location');
      }

      const savedLocation = await response.json();
      
      const location: Location = {
        ...savedLocation,
        imageUrl: null, // Will be updated when image is generated
      };

      onLocationsChange([...locations, location]);

      toast({
        title: "Location Added",
        description: `${recLoc.name} has been added.`,
      });
    } catch (error) {
      console.error('Failed to save location:', error);
      toast({
        title: "Failed to Save Location",
        description: error instanceof Error ? error.message : "Failed to save location to database.",
        variant: "destructive",
      });
    }
  };

  const handleAddRecommendedCharacter = async (recChar: typeof MOCK_RECOMMENDED_CHARACTERS[0], section: 'primary' | 'secondary') => {
    const alreadyExists = characters.some(c => c.name === recChar.name);
    if (alreadyExists) {
      toast({
        title: "Already Added",
        description: `${recChar.name} is already in your cast.`,
        variant: "destructive",
      });
      return;
    }

    // Save character to database immediately (even without image)
    try {
      const response = await fetch('/api/character-vlog/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          videoId,
          name: recChar.name,
          description: recChar.description || undefined,
          personality: null,
          appearance: recChar.appearance || undefined,
          section: section,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create character' }));
        throw new Error(error.error || 'Failed to create character');
      }

      const savedCharacter = await response.json();
      
      // Add section info to character
      const character: any = {
        ...savedCharacter,
        section: section,
        imageUrl: null, // Will be updated when image is generated
      };

      onCharactersChange([...characters, character]);

      toast({
        title: "Character Added",
        description: `${recChar.name} has been added to ${section === 'primary' ? 'Primary' : 'Secondary'}.`,
      });
    } catch (error) {
      console.error('Failed to save character:', error);
      toast({
        title: "Failed to Save Character",
        description: error instanceof Error ? error.message : "Failed to save character to database.",
        variant: "destructive",
      });
    }
  };

  const handleAddFromCharacterLibrary = async (libChar: Character, section: 'primary' | 'secondary') => {
    // Check if character already exists in ANY section (primary or secondary)
    // Check both by ID and by libraryCharacterId (in case it was added from library before)
    const existingCharacter = characters.find(c => 
      c.id === libChar.id || (c as any).libraryCharacterId === libChar.id
    );
    if (existingCharacter) {
      const existingSection = (existingCharacter as any).section || 'unknown';
      toast({
        title: "Already Added",
        description: `${libChar.name} is already in your ${existingSection === 'primary' ? 'Primary' : 'Secondary'} cast. Remove it first to add it to ${section === 'primary' ? 'Primary' : 'Secondary'}.`,
        variant: "destructive",
      });
      return;
    }

    // Save character to database immediately (even without image)
    try {
      const response = await fetch('/api/character-vlog/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          videoId,
          name: libChar.name,
          description: libChar.description || undefined,
          personality: libChar.personality || undefined,
          appearance: (libChar.appearance as string) || undefined,
          section: section,
          libraryCharacterId: libChar.id, // Store original library character ID to prevent duplicates
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create character' }));
        throw new Error(error.error || 'Failed to create character');
      }

      const savedCharacter = await response.json();
      
      // Add section info to character
      const character: any = {
        ...savedCharacter,
        section: section,
        imageUrl: libChar.imageUrl || null, // Use library image if available, otherwise null
      };

      onCharactersChange([...characters, character]);

      toast({
        title: "Character Added",
        description: `${libChar.name} has been added to ${section === 'primary' ? 'Primary' : 'Secondary'}.`,
      });
    } catch (error) {
      console.error('Failed to save character:', error);
      toast({
        title: "Failed to Save Character",
        description: error instanceof Error ? error.message : "Failed to save character to database.",
        variant: "destructive",
      });
    }
  };

  const handleAddFromLocationLibrary = async (libLoc: Location) => {
    if (!onLocationsChange) return;

    const alreadyExists = locations.some(l => l.id === libLoc.id);
    if (alreadyExists) {
      toast({
        title: "Already Added",
        description: `${libLoc.name} is already added.`,
        variant: "destructive",
      });
      return;
    }

    // Save location to database immediately (even without image)
    try {
      const response = await fetch('/api/character-vlog/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          videoId,
          name: libLoc.name,
          description: libLoc.description || undefined,
          details: libLoc.details || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create location' }));
        throw new Error(error.error || 'Failed to create location');
      }

      const savedLocation = await response.json();
      
      const location: Location = {
        ...savedLocation,
        imageUrl: libLoc.imageUrl || null, // Use library image if available, otherwise null
      };

      onLocationsChange([...locations, location]);

      toast({
        title: "Location Added",
        description: `${libLoc.name} has been added.`,
      });
    } catch (error) {
      console.error('Failed to save location:', error);
      toast({
        title: "Failed to Save Location",
        description: error instanceof Error ? error.message : "Failed to save location to database.",
        variant: "destructive",
      });
    }
  };

  const handleArtStyleChange = async (styleId: string) => {
    setSelectedArtStyle(styleId);
    
    // Update local state callback
    if (onWorldSettingsChange) {
      onWorldSettingsChange({ 
        artStyle: styleId, 
        worldDescription: selectedWorldDescription,
      });
    }

    // Auto-save to backend
    try {
      const styleRefImageUrl = styleRefs.length > 0 ? styleRefs[0].imageUrl : undefined;
      await fetch(`/api/character-vlog/videos/${videoId}/step/2/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          artStyle: styleId === 'none' ? undefined : styleId,
          worldDescription: selectedWorldDescription,
          styleReferenceImageUrl: styleRefImageUrl,
        }),
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleWorldDescriptionChange = async (description: string) => {
    setSelectedWorldDescription(description);
    
    // Update local state callback
    if (onWorldSettingsChange) {
      onWorldSettingsChange({ 
        artStyle: selectedArtStyle, 
        worldDescription: description,
      });
    }

    // Auto-save to backend
    try {
      const styleRefImageUrl = styleRefs.length > 0 ? styleRefs[0].imageUrl : undefined;
      await fetch(`/api/character-vlog/videos/${videoId}/step/2/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          artStyle: selectedArtStyle === 'none' ? undefined : selectedArtStyle,
          worldDescription: description,
          styleReferenceImageUrl: styleRefImageUrl,
        }),
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleUploadReference = async (file: File) => {
    if (styleRefs.length >= 1) {
      toast({
        title: "Maximum Reached",
        description: "You can only upload 1 style reference image.",
        variant: "destructive",
      });
      return;
    }

    // Upload file to backend to get Bunny CDN URL
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('videoId', videoId);

      const uploadResponse = await fetch('/api/character-vlog/upload-style-reference', {
        method: 'POST',
        headers: {
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
        credentials: 'include',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json().catch(() => ({ error: 'Failed to upload image' }));
        throw new Error(error.error || 'Failed to upload image');
      }

      const uploadData = await uploadResponse.json();
      const cdnUrl = uploadData.url;

      // Create reference image with CDN URL
      const refImage: ReferenceImage = {
        id: `ref-${Date.now()}`,
        videoId,
        shotId: null,
        characterId: null,
        type: "style",
        imageUrl: cdnUrl,
        description: null,
        createdAt: new Date(),
      };

      onReferenceImagesChange([...referenceImages, refImage]);
      
      // Clear selected preset style when custom reference is uploaded
      setSelectedArtStyle("none");
      
      // Auto-save to backend with custom image style and CDN URL
      try {
        await fetch(`/api/character-vlog/videos/${videoId}/step/2/settings`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            artStyle: 'custom_image',
            worldDescription: selectedWorldDescription,
            styleReferenceImageUrl: cdnUrl,
          }),
        });
      } catch (error) {
        console.error('Failed to save style reference:', error);
      }
      
      toast({
        title: "Reference Uploaded",
        description: "Style reference image added. Preset styles disabled.",
      });
    } catch (error) {
      console.error('Failed to upload style reference:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload style reference image.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveStyleReference = (refId: string) => {
    const updatedRefs = referenceImages.filter(r => r.id !== refId);
    onReferenceImagesChange(updatedRefs);
    toast({
      title: "Reference Removed",
      description: "Preset styles are now available to select.",
    });
  };

  const handleSaveCharacter = async () => {
    if (!newCharacter.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a character name.",
        variant: "destructive",
      });
      return;
    }

    if (editingCharacter) {
      // Update existing character in database
      try {
        const response = await fetch(`/api/character-vlog/characters/${editingCharacter.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            name: newCharacter.name,
            description: newCharacter.role || undefined,
            personality: newCharacter.personality || undefined,
            appearance: newCharacter.appearance || undefined,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to update character' }));
          throw new Error(error.error || 'Failed to update character');
        }

        const updatedCharacter = await response.json();
        
        const updatedCharacters = characters.map(c => 
          c.id === editingCharacter.id 
            ? { 
                ...updatedCharacter,
                imageUrl: generatedCharacterImage || updatedCharacter.imageUrl,
                section: (c as any).section || addingToSection // Preserve or set section
              }
            : c
        );
        onCharactersChange(updatedCharacters);
        
        const updatedRefs = characterReferenceImages.map((img, idx) => ({
          id: `ref-${editingCharacter.id}-${idx}`,
          videoId,
          shotId: null,
          characterId: editingCharacter.id,
          type: "character" as const,
          imageUrl: img.previewUrl,
          description: null,
          createdAt: new Date(),
        }));
        
        const otherRefs = referenceImages.filter(r => r.characterId !== editingCharacter.id);
        onReferenceImagesChange([...otherRefs, ...updatedRefs]);
        
        toast({
          title: "Character Updated",
          description: `${newCharacter.name} has been updated.`,
        });
      } catch (error) {
        console.error('Failed to update character:', error);
        toast({
          title: "Failed to Update Character",
          description: error instanceof Error ? error.message : "Failed to update character in database.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Create character in database immediately
      try {
        const response = await fetch('/api/character-vlog/characters', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            videoId,
            name: newCharacter.name,
            description: newCharacter.role || undefined,
            personality: newCharacter.personality || undefined,
            appearance: newCharacter.appearance || undefined,
            section: addingToSection,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to create character' }));
          throw new Error(error.error || 'Failed to create character');
        }

        const savedCharacter = await response.json();
        
        // Add section info to character
        const character: any = {
          ...savedCharacter,
          section: addingToSection,
          imageUrl: generatedCharacterImage || savedCharacter.imageUrl, // Use generated image if available
        };

        onCharactersChange([...characters, character]);
        
        const newRefs = characterReferenceImages.map((img, idx) => ({
          id: `ref-${savedCharacter.id}-${idx}`,
          videoId,
          shotId: null,
          characterId: savedCharacter.id,
          type: "character" as const,
          imageUrl: img.previewUrl,
          description: null,
          createdAt: new Date(),
        }));
        
        onReferenceImagesChange([...referenceImages, ...newRefs]);
        
        toast({
          title: "Character Added",
          description: `${character.name} has been added to ${addingToSection === 'primary' ? 'Primary' : 'Secondary'}.`,
        });
      } catch (error) {
        console.error('Failed to create character:', error);
        toast({
          title: "Failed to Save Character",
          description: error instanceof Error ? error.message : "Failed to save character to database.",
          variant: "destructive",
        });
        return; // Don't proceed if save failed
      }
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

  const handleUploadCharacterReference = async (file: File) => {
    if (characterReferenceImages.length >= MAX_CHARACTER_REFERENCES) {
      toast({
        title: "Maximum Reached",
        description: `You can only upload up to ${MAX_CHARACTER_REFERENCES} reference images per character.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/character-vlog/upload-reference', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to upload reference image');
      }

      const data = await response.json();
      setCharacterReferenceImages([...characterReferenceImages, {
        tempId: data.tempId,
        previewUrl: data.previewUrl,
      }]);
      
      toast({
        title: "Reference Uploaded",
        description: "Character reference image added.",
      });
    } catch (error) {
      console.error('[elements-tab] Reference upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload reference image.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCharacterReference = (index: number) => {
    setCharacterReferenceImages(characterReferenceImages.filter((_, i) => i !== index));
  };

  const handleGenerateCharacter = async () => {
    if (!newCharacter.appearance.trim()) {
      toast({
        title: "Appearance Required",
        description: "Please describe the character's appearance before generating.",
        variant: "destructive",
      });
      return;
    }

    if (!newCharacter.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a character name before generating.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Ensure character exists in database before generating image
      let characterId = editingCharacter?.id;
      
      // Check if character ID looks like a temporary ID (starts with 'char-' or 'temp-')
      // Real database IDs are UUIDs, not prefixed with 'char-' or 'temp-'
      const isTemporaryId = !characterId || characterId.startsWith('char-') || characterId.startsWith('temp-');
      
      if (isTemporaryId) {
        console.log('[elements-tab] Character not in DB, creating first...', { 
          characterId, 
          editingCharacter,
          isTemporaryId,
        });
        
        // Create character in database first
        const createResponse = await fetch('/api/character-vlog/characters', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            videoId,
            name: newCharacter.name,
            description: newCharacter.role || undefined,
            personality: newCharacter.personality || undefined,
            appearance: newCharacter.appearance || undefined,
            section: addingToSection,
          }),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({ error: 'Failed to create character' }));
          console.error('[elements-tab] Character creation failed:', {
            status: createResponse.status,
            error: errorData,
          });
          throw new Error(errorData.error || errorData.details || 'Failed to create character');
        }

        const savedCharacter = await createResponse.json();
        characterId = savedCharacter.id;
        
        console.log('[elements-tab] Character created in DB:', { 
          characterId, 
          name: savedCharacter.name,
          oldId: editingCharacter?.id,
        });
        
        // Update local state with the saved character
        const character: any = {
          ...savedCharacter,
          section: addingToSection,
        };
        
        // If editing, update the existing character in the list
        if (editingCharacter) {
          const updatedCharacters = characters.map(c => 
            c.id === editingCharacter.id ? character : c
          );
          onCharactersChange(updatedCharacters);
          setEditingCharacter(character);
        } else {
          // Add new character to list
          onCharactersChange([...characters, character]);
          setEditingCharacter(character);
        }
      } else {
        console.log('[elements-tab] Using existing character ID:', { characterId });
      }

      // Get art style description from selected style
      let artStyleDescription = '';
      if (selectedArtStyle && selectedArtStyle !== 'none') {
        const styleObj = STYLES.find(s => s.id === selectedArtStyle);
        if (styleObj) {
          artStyleDescription = styleObj.name;
        }
      }

      // Get style reference image if custom image is selected
      const styleReferenceImage = selectedArtStyle === 'custom_image' && styleRefs.length > 0 
        ? styleRefs[0].imageUrl 
        : undefined;

      // Extract temp IDs from character reference images
      const referenceTempIds = characterReferenceImages.length > 0 
        ? characterReferenceImages.map(img => img.tempId) 
        : undefined;

      console.log('[elements-tab] Generating character image:', {
        characterId,
        name: newCharacter.name,
        hasAppearance: !!newCharacter.appearance,
        hasPersonality: !!newCharacter.personality,
        artStyle: selectedArtStyle,
        hasWorldDescription: !!selectedWorldDescription,
        hasStyleReference: !!styleReferenceImage,
        referenceTempIdCount: referenceTempIds?.length || 0,
      });

      const response = await fetch(`/api/character-vlog/characters/${characterId}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          videoId, // Required for Bunny CDN path building
          name: newCharacter.name,
          appearance: newCharacter.appearance,
          personality: newCharacter.personality || undefined,
          age: newCharacter.age ? parseInt(newCharacter.age, 10) : undefined,
          artStyleDescription: artStyleDescription || undefined,
          styleReferenceImage: styleReferenceImage,
          worldDescription: selectedWorldDescription || undefined,
          // Note: model is always 'nano-banana' for character images (hardcoded in backend)
          referenceTempIds: referenceTempIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.details || errorData.error || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.imageUrl) {
        setGeneratedCharacterImage(data.imageUrl);
        toast({
          title: "Character Generated",
          description: `Character image for ${newCharacter.name} has been created.`,
        });
      } else {
        throw new Error('No image URL in response');
      }
    } catch (error) {
      console.error('[elements-tab] Character image generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate character image.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
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
              {/* Cast Title with Recommend Button */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Cast</h2>
                <Button
                  size="sm"
                  onClick={handleOpenRecommendations}
                  className="bg-white/[0.02] border border-white/[0.06] text-white hover:border-[#FF4081]/30 hover:bg-white/[0.04]"
                >
                  <Sparkles className="mr-2 h-4 w-4 text-[#FF4081]" />
                  Recommend
                </Button>
              </div>
              
              {/* PRIMARY CHARACTER */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white/90">Primary</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setAddingToSection('primary');
                        setSelectedLibrarySection('primary');
                        setIsCharacterLibraryOpen(true);
                      }}
                      className="bg-white/[0.02] border border-white/[0.06] text-white hover:border-[#FF4081]/30 hover:bg-white/[0.04]"
                    >
                      <LayoutGrid className="mr-2 h-4 w-4 text-cyan-400" />
                      Browse Library
                    </Button>
                  </div>
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
                                onClick={async () => {
                                  try {
                                    // Delete from database
                                    const response = await fetch(`/api/character-vlog/characters/${character.id}`, {
                                      method: 'DELETE',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
                                      },
                                      credentials: 'include',
                                      body: JSON.stringify({ videoId }),
                                    });

                                    if (!response.ok) {
                                      const error = await response.json().catch(() => ({ error: 'Failed to delete character' }));
                                      throw new Error(error.error || 'Failed to delete character');
                                    }

                                    // Remove from local state
                                    onCharactersChange(characters.filter(c => c.id !== character.id));
                                    
                                    toast({
                                      title: "Character Deleted",
                                      description: `${character.name} has been removed from database and cast.`,
                                    });
                                  } catch (error) {
                                    console.error('Failed to delete character:', error);
                                    toast({
                                      title: "Failed to Delete Character",
                                      description: error instanceof Error ? error.message : "Failed to delete character from database.",
                                      variant: "destructive",
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
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setAddingToSection('secondary');
                        setSelectedLibrarySection('secondary');
                        setIsCharacterLibraryOpen(true);
                      }}
                      className="bg-white/[0.02] border border-white/[0.06] text-white hover:border-[#FF4081]/30 hover:bg-white/[0.04]"
                    >
                      <LayoutGrid className="mr-2 h-4 w-4 text-cyan-400" />
                      Browse Library
                    </Button>
                  </div>
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
                                onClick={async () => {
                                  try {
                                    // Delete from database
                                    const response = await fetch(`/api/character-vlog/characters/${character.id}`, {
                                      method: 'DELETE',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
                                      },
                                      credentials: 'include',
                                      body: JSON.stringify({ videoId }),
                                    });

                                    if (!response.ok) {
                                      const error = await response.json().catch(() => ({ error: 'Failed to delete character' }));
                                      throw new Error(error.error || 'Failed to delete character');
                                    }

                                    // Remove from local state
                                    onCharactersChange(characters.filter(c => c.id !== character.id));
                                    
                                    toast({
                                      title: "Character Deleted",
                                      description: `${character.name} has been removed from database and cast.`,
                                    });
                                  } catch (error) {
                                    console.error('Failed to delete character:', error);
                                    toast({
                                      title: "Failed to Delete Character",
                                      description: error instanceof Error ? error.message : "Failed to delete character from database.",
                                      variant: "destructive",
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
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setIsLocationLibraryOpen(true)}
                    className="bg-white/[0.02] border border-white/[0.06] text-white hover:border-[#FF4081]/30 hover:bg-white/[0.04]"
                  >
                    <LayoutGrid className="mr-2 h-4 w-4 text-cyan-400" />
                    Browse Library
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleOpenLocationRecommendations}
                    className="bg-white/[0.02] border border-white/[0.06] text-white hover:border-[#FF4081]/30 hover:bg-white/[0.04]"
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-[#FF4081]" />
                    Recommend
                  </Button>
                </div>
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
                                onClick={async () => {
                                  if (!onLocationsChange) return;
                                  
                                  try {
                                    // Delete from database
                                    const response = await fetch(`/api/character-vlog/locations/${location.id}`, {
                                      method: 'DELETE',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
                                      },
                                      credentials: 'include',
                                      body: JSON.stringify({ videoId }),
                                    });

                                    if (!response.ok) {
                                      const error = await response.json().catch(() => ({ error: 'Failed to delete location' }));
                                      throw new Error(error.error || 'Failed to delete location');
                                    }

                                    // Remove from local state
                                    onLocationsChange(locations.filter(l => l.id !== location.id));
                                    
                                    toast({
                                      title: "Location Deleted",
                                      description: `${location.name} has been removed from database and locations.`,
                                    });
                                  } catch (error) {
                                    console.error('Failed to delete location:', error);
                                    toast({
                                      title: "Failed to Delete Location",
                                      description: error instanceof Error ? error.message : "Failed to delete location from database.",
                                      variant: "destructive",
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
                  disabled={isGeneratingLocation || !newLocation.details.trim() || !newLocation.name.trim()}
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
              {locationRecommendations.map((location, index) => {
                const isAdded = locations.some(l => l.name === location.name);
                return (
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
                          disabled={isAdded}
                          className={isAdded ? "" : "text-white hover:opacity-90 relative overflow-hidden"}
                          style={!isAdded ? {
                            background: `linear-gradient(to right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                          } : undefined}
                        >
                          {isAdded ? (
                            <>
                              <Check className="mr-2 h-3 w-3" />
                              Location Added
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-3 w-3" />
                              Add Location
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
            <div className="space-y-6 mt-4">
              {/* Primary Characters Section */}
              {recommendationsBySection.primary.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white/90">Primary Character</h3>
                  {recommendationsBySection.primary.map((recChar, index) => {
                    const isAdded = characters.some(c => c.name === recChar.name && (c as any).section === 'primary');
                    return (
                      <Card key={`primary-${index}`} className="overflow-hidden bg-white/[0.02] border-white/[0.06]">
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
                              onClick={() => handleAddRecommendedCharacter(recChar, 'primary')}
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

              {/* Secondary Characters Section */}
              {recommendationsBySection.secondary.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white/90">Secondary Characters</h3>
                  {recommendationsBySection.secondary.map((recChar, index) => {
                    const isAdded = characters.some(c => c.name === recChar.name && (c as any).section === 'secondary');
                    return (
                      <Card key={`secondary-${index}`} className="overflow-hidden bg-white/[0.02] border-white/[0.06]">
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
                              onClick={() => handleAddRecommendedCharacter(recChar, 'secondary')}
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
                      {characterReferenceImages.map((img, index) => (
                        <div key={img.tempId} className="relative aspect-square rounded-lg border border-white/10 bg-muted">
                          <div className="absolute inset-0 rounded-lg overflow-hidden">
                            <img src={img.previewUrl} alt={`Reference ${index + 1}`} className="h-full w-full object-cover" />
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
                  disabled={isGenerating || !newCharacter.appearance.trim() || !newCharacter.name.trim()}
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

      {/* Character Library Modal */}
      <Dialog open={isCharacterLibraryOpen} onOpenChange={setIsCharacterLibraryOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto custom-scrollbar bg-[#1a1a1a] border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <LayoutGrid className="h-5 w-5 text-cyan-400" />
              Character Library
            </DialogTitle>
            <DialogDescription>
              Select from your previously created characters
            </DialogDescription>
          </DialogHeader>

          {/* Section Selector */}
          <div className="flex items-center gap-4 mt-4 mb-4">
            <Label className="text-white text-sm font-medium">Add to:</Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={selectedLibrarySection === 'primary' ? 'default' : 'outline'}
                onClick={() => setSelectedLibrarySection('primary')}
                className={selectedLibrarySection === 'primary' ? "text-white hover:opacity-90 relative overflow-hidden" : "text-white/70 hover:text-white border-white/20"}
                style={selectedLibrarySection === 'primary' ? {
                  background: `linear-gradient(to right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                } : undefined}
              >
                Primary
              </Button>
              <Button
                size="sm"
                variant={selectedLibrarySection === 'secondary' ? 'default' : 'outline'}
                onClick={() => setSelectedLibrarySection('secondary')}
                className={selectedLibrarySection === 'secondary' ? "text-white hover:opacity-90 relative overflow-hidden" : "text-white/70 hover:text-white border-white/20"}
                style={selectedLibrarySection === 'secondary' ? {
                  background: `linear-gradient(to right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                } : undefined}
              >
                Secondary
              </Button>
            </div>
          </div>

          {isLoadingCharacterLibrary ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Loading characters...</p>
            </div>
          ) : libraryCharacters && libraryCharacters.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {libraryCharacters.map((libChar) => {
                // Check if character is already in ANY section (primary or secondary)
                // Check both by ID and by libraryCharacterId (in case it was added from library before)
                const existingCharacter = characters.find(c => 
                  c.id === libChar.id || (c as any).libraryCharacterId === libChar.id
                );
                const isAdded = !!existingCharacter;
                const existingSection = existingCharacter ? ((existingCharacter as any).section || 'unknown') : null;
                return (
                  <Card key={libChar.id} className={`overflow-hidden bg-white/[0.02] border-white/[0.06] hover:border-cyan-500/30 transition-all ${isAdded ? 'opacity-50' : ''}`}>
                    <CardContent className="p-0">
                      <div className="aspect-[3/4] bg-muted flex items-center justify-center relative">
                        {libChar.imageUrl ? (
                          <img src={libChar.imageUrl} alt={libChar.name} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-16 w-16 text-muted-foreground" />
                        )}
                        {isAdded && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                            <Check className="h-8 w-8 text-white mb-1" />
                            <span className="text-xs text-white font-medium">
                              In {existingSection === 'primary' ? 'Primary' : 'Secondary'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        <h4 className="font-semibold text-sm text-white truncate">{libChar.name}</h4>
                        {libChar.description && (
                          <p className="text-xs text-white/60 line-clamp-2">{libChar.description}</p>
                        )}
                        <Button
                          size="sm"
                          onClick={() => !isAdded && handleAddFromCharacterLibrary(libChar, selectedLibrarySection)}
                          disabled={isAdded}
                          className={isAdded ? "w-full" : "w-full text-white hover:opacity-90 relative overflow-hidden"}
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
                              Add to {selectedLibrarySection === 'primary' ? 'Primary' : 'Secondary'}
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground text-center">
                No characters in your library yet
              </p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Create characters to reuse them across projects
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Location Library Modal */}
      <Dialog open={isLocationLibraryOpen} onOpenChange={setIsLocationLibraryOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto custom-scrollbar bg-[#1a1a1a] border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <LayoutGrid className="h-5 w-5 text-cyan-400" />
              Location Library
            </DialogTitle>
            <DialogDescription>
              Select from your previously created locations
            </DialogDescription>
          </DialogHeader>

          {isLoadingLocationLibrary ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Loading locations...</p>
            </div>
          ) : libraryLocations && libraryLocations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {libraryLocations.map((libLoc) => {
                const isAdded = locations.some(l => l.id === libLoc.id);
                const imageUrl = libLoc.imageUrl;
                return (
                  <Card key={libLoc.id} className={`overflow-hidden bg-white/[0.02] border-white/[0.06] hover:border-cyan-500/30 transition-all cursor-pointer ${isAdded ? 'opacity-50' : ''}`} onClick={() => !isAdded && handleAddFromLocationLibrary(libLoc)}>
                    <CardContent className="p-0">
                      <div className="aspect-video bg-muted flex items-center justify-center relative">
                        {imageUrl ? (
                          <img src={imageUrl} alt={libLoc.name} className="h-full w-full object-cover" />
                        ) : (
                          <MapPin className="h-16 w-16 text-muted-foreground" />
                        )}
                        {isAdded && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Check className="h-8 w-8 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-white truncate">{libLoc.name}</h4>
                            {libLoc.description && (
                              <p className="text-xs text-white/60 line-clamp-2 mt-1">
                                {libLoc.description}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddFromLocationLibrary(libLoc);
                            }}
                            disabled={isAdded}
                            className={isAdded ? "w-full" : "text-white hover:opacity-90 relative overflow-hidden"}
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
                                Add Location
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground text-center">
                No locations in your library yet
              </p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Create locations to reuse them across projects
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

