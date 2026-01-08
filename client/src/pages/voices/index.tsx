import { useState, useRef } from "react";
import { Plus, Search, Mic, Upload, X, Loader2, Trash2, Pencil, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/contexts/workspace-context";
import { cn } from "@/lib/utils";
import {
  listVoices,
  createVoice,
  updateVoice,
  deleteVoice,
  uploadAudioSample,
  type VoiceResponse,
} from "@/assets/voices";
import { AmbientBackground } from "@/components/story-studio/shared/AmbientBackground";

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Ambient Background */}
      <AmbientBackground accentColor="from-primary to-violet-500" />

      <div className="relative z-10 space-y-6 p-6">
        {/* Header Section */}
        <div className="border-b bg-background/80 backdrop-blur-xl">
          <div className="px-4 py-5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search voices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "pl-11 h-10 rounded-xl",
                    "bg-background border-border",
                    "text-foreground placeholder:text-muted-foreground",
                    "focus:border-primary focus:ring-2 focus:ring-primary/20",
                    "transition-all duration-200"
                  )}
                  data-testid="input-search"
                />
              </div>

              {/* New Voice Button */}
              <Button
                className="gap-2"
                onClick={handleCreateNew}
                data-testid="button-create-voice"
              >
                <Plus className="h-4 w-4" />
                New Voice
              </Button>
            </div>
          </div>
        </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading voices...</p>
        </div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            {filteredVoices.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "text-center py-16 rounded-2xl",
                  "bg-card border-0",
                  "backdrop-blur-xl"
                )}
              >
                <Mic className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">No voices found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or create a new voice
                </p>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredVoices.map((voice) => (
                  <motion.div
                    key={voice.id}
                    variants={cardVariants}
                    whileHover={{ y: -4 }}
                    className="relative group"
                  >
                    {/* Gradient Border Glow */}
                    <div className={cn(
                      "absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100",
                      "bg-gradient-to-r blur-sm transition-opacity duration-500",
                      "from-primary to-violet-500"
                    )} />
                    
                    <Card
                      className={cn(
                        "relative overflow-hidden cursor-pointer",
                        "bg-card backdrop-blur-xl",
                        "border-0",
                        "transition-all duration-300",
                        "group-hover:shadow-2xl group-hover:shadow-primary/30"
                      )}
                      onClick={() => handleEditVoice(voice)}
                      data-testid={`voice-card-${voice.id}`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={cn(
                              "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0",
                              "bg-gradient-to-br from-primary/20 to-violet-500/20",
                              "border border-primary/30"
                            )}>
                              <Mic className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base truncate">{voice.name}</h3>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {voice.sampleUrl && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 bg-muted hover:bg-muted/80"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePlay(voice.id, voice.sampleUrl ?? null);
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
                              className="h-8 w-8 bg-white/[0.05] hover:bg-white/[0.1]"
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
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      </div>

      {/* Enhanced Voice Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className={cn(
          "max-w-3xl max-h-[95vh] overflow-hidden p-0 flex flex-col",
          "bg-popover backdrop-blur-2xl",
          "border-0",
          "shadow-2xl"
        )}>
          {/* Header Section */}
          <div className={cn(
            "px-8 py-6 border-b-0 flex-shrink-0",
            "bg-muted/30"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className={cn(
                  "text-3xl font-bold mb-2",
                  "text-foreground"
                )}>
                  {editingVoice ? "Edit Voice" : "Create New Voice"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-base">
                  Define a voice profile and upload an audio sample.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="overflow-y-auto flex-1 min-h-0 px-8 py-6">
            <div className="space-y-6">
              <div>
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <Label htmlFor="voice-name" className="text-foreground font-medium text-sm">
                      Name <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="voice-name"
                      placeholder="Voice name (e.g., Sarah - Warm & Friendly)"
                      value={newVoice.name}
                      onChange={(e) => setNewVoice({ ...newVoice, name: e.target.value })}
                      className={cn(
                        "h-11",
                        "focus:border-primary focus:ring-2 focus:ring-primary/30",
                        "transition-all duration-200"
                      )}
                      data-testid="input-voice-name"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="voice-description" className="text-foreground font-medium text-sm">
                      Description
                    </Label>
                    <Textarea
                      id="voice-description"
                      placeholder="Brief description of voice characteristics..."
                      value={newVoice.description}
                      onChange={(e) =>
                        setNewVoice({ ...newVoice, description: e.target.value })
                      }
                      rows={4}
                      className={cn(
                        "focus:border-primary focus:ring-2 focus:ring-primary/30",
                        "transition-all duration-200 resize-none"
                      )}
                      data-testid="input-voice-description"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="space-y-3">
                  {audioPreview ? (
                    <div className={cn(
                      "border-0 rounded-xl p-5 space-y-4",
                      "bg-muted/50"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center",
                            "bg-gradient-to-br from-primary/20 to-violet-500/20",
                            "border border-primary/30"
                          )}>
                            <Mic className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {audioFile ? audioFile.name : "Current sample"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Audio file loaded
                            </p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="bg-muted hover:bg-muted/80 rounded-lg"
                          onClick={() => {
                            setAudioPreview(null);
                            setAudioFile(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <audio controls className="w-full rounded-lg" src={audioPreview}>
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  ) : (
                    <label className={cn(
                      "flex flex-col items-center justify-center h-40",
                      "border-0 rounded-xl",
                      "bg-muted/50 cursor-pointer",
                      "hover:bg-muted",
                      "transition-all duration-200 group/upload"
                    )}>
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
                      <Upload className={cn(
                        "h-10 w-10 text-muted-foreground mb-3",
                        "group-hover/upload:text-primary transition-colors"
                      )} />
                      <span className="text-sm font-medium text-muted-foreground group-hover/upload:text-foreground mb-1">
                        Upload Audio Sample
                      </span>
                      <span className="text-xs text-muted-foreground">
                        MP3, WAV, OGG (max 25MB)
                      </span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className={cn(
            "px-8 py-6 border-t-0 flex-shrink-0",
            "bg-muted/30",
            "flex items-center justify-end gap-3"
          )}>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={createMutation.isPending || updateMutation.isPending || isUploading}
              className={cn(
                "h-11 px-6",
                "transition-all duration-200"
              )}
            >
              Cancel
            </Button>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleSaveVoice}
                className={cn(
                  "h-11 px-8 bg-gradient-to-r from-primary to-violet-500",
                  "hover:shadow-lg hover:shadow-primary/30",
                  "border-0 text-white font-semibold",
                  "transition-all duration-200"
                )}
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
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
