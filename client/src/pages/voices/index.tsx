import { useState, useRef } from "react";
import { Plus, Search, Mic, Upload, X, Loader2, Trash2, Pencil, Play, Pause } from "lucide-react";
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
  listVoices,
  createVoice,
  updateVoice,
  deleteVoice,
  uploadAudioSample,
  type VoiceResponse,
} from "@/assets/voices";

export default function Voices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVoice, setEditingVoice] = useState<VoiceResponse | null>(null);
  const [newVoice, setNewVoice] = useState({
    name: "",
    description: "",
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  // Fetch voices
  const { data: voices = [], isLoading } = useQuery<VoiceResponse[]>({
    queryKey: ["/api/voices", currentWorkspace?.id],
    queryFn: () => {
      if (!currentWorkspace?.id) throw new Error("No workspace selected");
      return listVoices(currentWorkspace.id);
    },
    enabled: !!currentWorkspace?.id,
  });

  // Create voice mutation
  const createMutation = useMutation({
    mutationFn: createVoice,
    onSuccess: async (newVoice) => {
      // Upload audio sample if provided
      if (audioFile && newVoice.id) {
        try {
          setIsUploading(true);
          const result = await uploadAudioSample(newVoice.id, audioFile);
          await updateVoice(newVoice.id, { sampleUrl: result.audioUrl });
        } catch (error) {
          console.error("Failed to upload audio sample:", error);
          toast({
            title: "Audio upload failed",
            description: error instanceof Error ? error.message : "Failed to upload audio sample",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/voices"] });
      toast({
        title: "Voice Created",
        description: `${newVoice.name} has been added to your library.`,
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create voice",
        variant: "destructive",
      });
    },
  });

  // Update voice mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateVoice>[1] }) =>
      updateVoice(id, data),
    onSuccess: async (updatedVoice) => {
      // Upload audio sample if changed
      if (audioFile && updatedVoice.id) {
        try {
          setIsUploading(true);
          const result = await uploadAudioSample(updatedVoice.id, audioFile);
          await updateVoice(updatedVoice.id, { sampleUrl: result.audioUrl });
        } catch (error) {
          console.error("Failed to upload audio sample:", error);
          toast({
            title: "Audio upload failed",
            description: error instanceof Error ? error.message : "Failed to upload audio sample",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/voices"] });
      toast({
        title: "Voice Updated",
        description: `${updatedVoice.name} has been updated.`,
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update voice",
        variant: "destructive",
      });
    },
  });

  // Delete voice mutation
  const deleteMutation = useMutation({
    mutationFn: deleteVoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/voices"] });
      toast({
        title: "Voice Deleted",
        description: "Voice has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete voice",
        variant: "destructive",
      });
    },
  });

  const filteredVoices = voices.filter(
    (voice) =>
      voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voice.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNew = () => {
    setEditingVoice(null);
    setNewVoice({ name: "", description: "" });
    setAudioFile(null);
    setAudioPreview(null);
    setIsDialogOpen(true);
  };

  const handleEditVoice = (voice: VoiceResponse) => {
    setEditingVoice(voice);
    setNewVoice({
      name: voice.name,
      description: voice.description || "",
    });
    setAudioPreview(voice.sampleUrl || null);
    setAudioFile(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingVoice(null);
    setNewVoice({ name: "", description: "" });
    setAudioFile(null);
    setAudioPreview(null);
  };

  const handleSaveVoice = () => {
    if (!newVoice.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a voice name.",
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

    if (editingVoice) {
      updateMutation.mutate({
        id: editingVoice.id,
        data: {
          name: newVoice.name,
          description: newVoice.description,
        },
      });
    } else {
      createMutation.mutate({
        workspaceId: currentWorkspace.id,
        name: newVoice.name,
        description: newVoice.description || undefined,
      });
    }
  };

  const handleAudioUpload = (file: File) => {
    setAudioFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAudioPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteVoice = (voice: VoiceResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${voice.name}?`)) {
      deleteMutation.mutate(voice.id);
    }
  };

  const togglePlay = (voiceId: string, sampleUrl: string | null) => {
    if (!sampleUrl) return;

    // Stop currently playing audio
    if (playingId && playingId !== voiceId && audioRefs.current[playingId]) {
      audioRefs.current[playingId].pause();
      audioRefs.current[playingId].currentTime = 0;
    }

    // Create audio element if it doesn't exist
    if (!audioRefs.current[voiceId]) {
      audioRefs.current[voiceId] = new Audio(sampleUrl);
      audioRefs.current[voiceId].onended = () => setPlayingId(null);
    }

    // Toggle play/pause
    if (playingId === voiceId) {
      audioRefs.current[voiceId].pause();
      setPlayingId(null);
    } else {
      audioRefs.current[voiceId].play();
      setPlayingId(voiceId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Voices</h1>
          <p className="text-muted-foreground mt-1">
            Manage character voices and narrator audio profiles
          </p>
        </div>
        <Button
          size="lg"
          className="gap-2"
          onClick={handleCreateNew}
          data-testid="button-create-voice"
        >
          <Plus className="h-4 w-4" />
          New Voice
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search voices..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading voices...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVoices.map((voice) => (
              <Card
                key={voice.id}
                className="hover-elevate cursor-pointer"
                onClick={() => handleEditVoice(voice)}
                data-testid={`voice-card-${voice.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mic className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{voice.name}</h3>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {voice.sampleUrl && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlay(voice.id, voice.sampleUrl);
                          }}
                          data-testid={`button-play-${voice.id}`}
                        >
                          {playingId === voice.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditVoice(voice);
                        }}
                        data-testid={`button-edit-voice-${voice.id}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => handleDeleteVoice(voice, e)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-voice-${voice.id}`}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {voice.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{voice.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredVoices.length === 0 && (
            <div className="text-center py-12">
              <Mic className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No voices found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or create a new voice
              </p>
            </div>
          )}
        </>
      )}

      {/* Voice Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingVoice ? "Edit Voice" : "Create New Voice"}</DialogTitle>
            <DialogDescription>
              Define a voice profile and upload an audio sample.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="voice-name">Name</Label>
              <Input
                id="voice-name"
                placeholder="Voice name (e.g., Sarah - Warm & Friendly)"
                value={newVoice.name}
                onChange={(e) => setNewVoice({ ...newVoice, name: e.target.value })}
                data-testid="input-voice-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="voice-description">Description</Label>
              <Textarea
                id="voice-description"
                placeholder="Brief description of voice characteristics..."
                value={newVoice.description}
                onChange={(e) =>
                  setNewVoice({ ...newVoice, description: e.target.value })
                }
                rows={3}
                data-testid="input-voice-description"
              />
            </div>

            <div className="space-y-2">
              <Label>Audio Sample</Label>
              {audioPreview ? (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">
                        {audioFile ? audioFile.name : "Current sample"}
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setAudioPreview(null);
                        setAudioFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <audio controls className="w-full" src={audioPreview}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover-elevate">
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAudioUpload(file);
                    }}
                    data-testid="input-upload-audio"
                  />
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Upload Audio Sample</span>
                  <span className="text-xs text-muted-foreground mt-1">MP3, WAV, OGG (max 25MB)</span>
                </label>
              )}
            </div>

            <Button
              onClick={handleSaveVoice}
              className="w-full"
              disabled={createMutation.isPending || updateMutation.isPending || isUploading}
              data-testid="button-save-voice"
            >
              {(createMutation.isPending || updateMutation.isPending || isUploading) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? "Uploading audio..." : "Saving..."}
                </>
              ) : editingVoice ? (
                "Update Voice"
              ) : (
                "Add Voice"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
