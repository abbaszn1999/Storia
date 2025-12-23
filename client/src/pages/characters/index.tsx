import { useState } from "react";
import { Plus, Search, User, Upload, X, Loader2, Sparkles, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/contexts/workspace-context";
import {
  listCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  uploadMainImage,
  type CharacterResponse,
} from "@/assets/characters";
import { MAX_CHARACTER_REFERENCES } from "@/lib/constants";

export default function Characters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<CharacterResponse | null>(null);
  const [newCharacter, setNewCharacter] = useState({
    name: "",
    description: "",
    personality: "",
    appearance: "",
  });
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [referenceImageFiles, setReferenceImageFiles] = useState<File[]>([]);
  const [referenceImagePreviews, setReferenceImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  // Fetch characters
  const { data: characters = [], isLoading } = useQuery<CharacterResponse[]>({
    queryKey: ["/api/characters", currentWorkspace?.id],
    queryFn: () => {
      if (!currentWorkspace?.id) throw new Error("No workspace selected");
      return listCharacters(currentWorkspace.id);
    },
    enabled: !!currentWorkspace?.id,
  });

  // Create character mutation
  const createMutation = useMutation({
    mutationFn: createCharacter,
    onSuccess: async (newChar) => {
      // Upload main image if provided
      if (mainImageFile && newChar.id) {
        try {
          setIsUploading(true);
          const result = await uploadMainImage(newChar.id, mainImageFile);
          await updateCharacter(newChar.id, { imageUrl: result.imageUrl });
        } catch (error) {
          console.error("Failed to upload main image:", error);
          toast({
            title: "Image upload failed",
            description: error instanceof Error ? error.message : "Failed to upload image",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({
        title: "Character Created",
        description: `${newChar.name} has been added to your library.`,
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create character",
        variant: "destructive",
      });
    },
  });

  // Update character mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateCharacter>[1] }) =>
      updateCharacter(id, data),
    onSuccess: async (updatedChar) => {
      // Upload main image if changed
      if (mainImageFile && updatedChar.id) {
        try {
          setIsUploading(true);
          const result = await uploadMainImage(updatedChar.id, mainImageFile);
          await updateCharacter(updatedChar.id, { imageUrl: result.imageUrl });
        } catch (error) {
          console.error("Failed to upload main image:", error);
          toast({
            title: "Image upload failed",
            description: error instanceof Error ? error.message : "Failed to upload image",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({
        title: "Character Updated",
        description: `${updatedChar.name} has been updated.`,
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update character",
        variant: "destructive",
      });
    },
  });

  // Delete character mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCharacter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({
        title: "Character Deleted",
        description: "Character has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete character",
        variant: "destructive",
      });
    },
  });

  const filteredCharacters = characters.filter(
    (char) =>
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNew = () => {
    setEditingCharacter(null);
    setNewCharacter({ name: "", description: "", personality: "", appearance: "" });
    setMainImageFile(null);
    setMainImagePreview(null);
    setReferenceImageFiles([]);
    setReferenceImagePreviews([]);
    setIsDialogOpen(true);
  };

  const handleEditCharacter = (character: CharacterResponse) => {
    setEditingCharacter(character);
    setNewCharacter({
      name: character.name,
      description: character.description || "",
      personality: character.personality || "",
      appearance: character.appearance || "",
    });
    setMainImagePreview(character.imageUrl || null);
    setMainImageFile(null);
    setReferenceImagePreviews(character.referenceImages || []);
    setReferenceImageFiles([]);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCharacter(null);
    setNewCharacter({ name: "", description: "", personality: "", appearance: "" });
    setMainImageFile(null);
    setMainImagePreview(null);
    setReferenceImageFiles([]);
    setReferenceImagePreviews([]);
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

    if (!currentWorkspace?.id) {
      toast({
        title: "Workspace required",
        description: "Please select a workspace.",
        variant: "destructive",
      });
      return;
    }

    if (editingCharacter) {
      updateMutation.mutate({
        id: editingCharacter.id,
        data: {
          name: newCharacter.name,
          description: newCharacter.description,
          personality: newCharacter.personality,
          appearance: newCharacter.appearance,
        },
      });
    } else {
      createMutation.mutate({
        workspaceId: currentWorkspace.id,
        name: newCharacter.name,
        description: newCharacter.description || undefined,
        personality: newCharacter.personality || undefined,
        appearance: newCharacter.appearance || undefined,
      });
    }
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

    if (!currentWorkspace?.id) {
      toast({
        title: "Workspace Required",
        description: "Please select a workspace.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);

    try {
      let characterId = editingCharacter?.id;

      // If it's a new character, create it first
      if (!characterId) {
        console.log('[characters] Creating character first before image generation');
        const newChar = await createCharacter({
          workspaceId: currentWorkspace.id,
          name: newCharacter.name,
          description: newCharacter.description || undefined,
          personality: newCharacter.personality || undefined,
          appearance: newCharacter.appearance || undefined,
        });
        characterId = newChar.id;
        // Update local state to reflect the created character
        setEditingCharacter(newChar);
        console.log('[characters] Character created:', { characterId, name: newChar.name });
      }

      // Generate image using the character ID
      const response = await fetch(`/api/characters/${characterId}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          referenceImages: referenceImagePreviews.length > 0 ? referenceImagePreviews : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || data.details || 'Failed to generate image');
      }

      if (data.imageUrl) {
        setMainImagePreview(data.imageUrl);
        queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
        toast({
          title: "Character Generated",
          description: `Character image for ${newCharacter.name} has been created.`,
        });
      }
    } catch (error) {
      console.error('Character image generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate character image.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleMainImageUpload = (file: File) => {
    setMainImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMainImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleReferenceImageUpload = async (file: File) => {
    if (!currentWorkspace?.id) {
      toast({
        title: "Workspace Required",
        description: "Please select a workspace.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload to Bunny CDN via uploads endpoint
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', currentWorkspace.id);
      formData.append('name', `Character Reference - ${file.name}`);
      
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to upload reference image');
      }

      const data = await response.json();
      
      // Add the CDN URL to reference images
      setReferenceImagePreviews([...referenceImagePreviews, data.url]);
      
      toast({
        title: "Reference Uploaded",
        description: "Character reference image added.",
      });
    } catch (error) {
      console.error('[characters] Reference upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload reference image.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveReferenceImage = (index: number) => {
    setReferenceImagePreviews(referenceImagePreviews.filter((_, i) => i !== index));
    setReferenceImageFiles(referenceImageFiles.filter((_, i) => i !== index));
  };

  const handleDeleteCharacter = (character: CharacterResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${character.name}?`)) {
      deleteMutation.mutate(character.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Characters</h1>
          <p className="text-muted-foreground mt-1">Create and manage AI characters for your videos</p>
        </div>
        <Button
          size="lg"
          className="gap-2"
          onClick={handleCreateNew}
          data-testid="button-create-character"
        >
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

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading characters...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCharacters.map((character) => (
              <Card
                key={character.id}
                className="relative aspect-[3/4] overflow-hidden group cursor-pointer hover-elevate"
                onClick={() => handleEditCharacter(character)}
                data-testid={`character-card-${character.id}`}
              >
                <CardContent className="p-0 h-full relative">
                  <div className="h-full bg-muted flex items-center justify-center">
                    {character.imageUrl ? (
                      <img
                        src={character.imageUrl}
                        alt={character.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCharacter(character);
                      }}
                      data-testid={`button-edit-character-${character.id}`}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => handleDeleteCharacter(character, e)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-character-${character.id}`}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
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
        </>
      )}

      {/* Character Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
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
                    onChange={(e) =>
                      setNewCharacter({ ...newCharacter, description: e.target.value })
                    }
                    rows={2}
                    data-testid="input-character-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="char-personality">Personality</Label>
                  <Textarea
                    id="char-personality"
                    placeholder="Character traits, behavior, mannerisms..."
                    value={newCharacter.personality}
                    onChange={(e) =>
                      setNewCharacter({ ...newCharacter, personality: e.target.value })
                    }
                    rows={2}
                    data-testid="input-character-personality"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="char-appearance">Appearance</Label>
                  <Textarea
                    id="char-appearance"
                    placeholder="Physical appearance, clothing, distinctive features..."
                    value={newCharacter.appearance}
                    onChange={(e) =>
                      setNewCharacter({ ...newCharacter, appearance: e.target.value })
                    }
                    rows={2}
                    data-testid="input-character-appearance"
                  />
                </div>
                <Button
                  onClick={handleGenerateCharacter}
                  className="w-full"
                  disabled={isGeneratingImage || !newCharacter.appearance.trim() || !newCharacter.name.trim() || !currentWorkspace?.id}
                  data-testid="button-generate-character"
                >
                  {isGeneratingImage ? (
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
                {!newCharacter.name.trim() || !newCharacter.appearance.trim() ? (
                  <p className="text-xs text-muted-foreground text-center">
                    Enter name and appearance to generate image
                  </p>
                ) : null}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Reference Images ({referenceImagePreviews.length}/{MAX_CHARACTER_REFERENCES})
                  </Label>
                  {referenceImagePreviews.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {referenceImagePreviews.map((url, index) => (
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
                              handleRemoveReferenceImage(index);
                            }}
                            data-testid={`button-remove-ref-${index}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No reference images uploaded yet
                    </p>
                  )}
                  {referenceImagePreviews.length < MAX_CHARACTER_REFERENCES && (
                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover-elevate">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleReferenceImageUpload(file);
                        }}
                        data-testid="input-upload-character-ref"
                      />
                      <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                      <span className="text-sm text-muted-foreground">Upload Reference</span>
                    </label>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Main Character Image</Label>
                  <div className="relative aspect-[3/4] rounded-lg border overflow-hidden bg-muted">
                    {mainImagePreview ? (
                      <>
                        <img
                          src={mainImagePreview}
                          alt="Character"
                          className="h-full w-full object-cover"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 h-8 w-8 z-10"
                          onClick={() => {
                            setMainImagePreview(null);
                            setMainImageFile(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <label className="flex flex-col items-center justify-center cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleMainImageUpload(file);
                            }}
                          />
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Upload Main Image</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSaveCharacter}
              className="w-full"
              disabled={createMutation.isPending || updateMutation.isPending || isUploading}
              data-testid="button-save-character"
            >
              {(createMutation.isPending || updateMutation.isPending || isUploading) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? "Uploading images..." : "Saving..."}
                </>
              ) : editingCharacter ? (
                "Update Character"
              ) : (
                "Add Character"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
