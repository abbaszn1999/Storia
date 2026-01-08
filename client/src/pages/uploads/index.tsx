import { useState, useCallback } from "react";
import { Plus, Search, Image, Video, Upload as UploadIcon, X, Loader2, Trash2, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/contexts/workspace-context";
import { cn } from "@/lib/utils";
import {
  listUploads,
  uploadFile,
  updateUpload,
  deleteUpload,
  type UploadResponse,
} from "@/assets/uploads";
import { AmbientBackground } from "@/components/story-studio/shared/AmbientBackground";

const FILE_TYPE_ICONS = {
  image: Image,
  video: Video,
};

const FILE_TYPE_COLORS = {
  image: "text-blue-500",
  video: "text-purple-500",
};

// Helper to determine file type category
function getFileTypeCategory(mimeType: string): "image" | "video" {
  if (mimeType.startsWith("image/")) return "image";
  return "video";
}

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Helper to format date
function formatDate(date: Date): string {
  const now = new Date();
  const uploadDate = new Date(date);
  const diffMs = now.getTime() - uploadDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return uploadDate.toLocaleDateString();
}

export default function Uploads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUpload, setEditingUpload] = useState<UploadResponse | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [uploadForm, setUploadForm] = useState({ name: "", description: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  // Fetch uploads
  const { data: uploads = [], isLoading } = useQuery<UploadResponse[]>({
    queryKey: ["/api/uploads", currentWorkspace?.id],
    queryFn: () => {
      if (!currentWorkspace?.id) throw new Error("No workspace selected");
      return listUploads(currentWorkspace.id);
    },
    enabled: !!currentWorkspace?.id,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !currentWorkspace?.id) {
        throw new Error("No file selected or workspace not available");
      }
      setIsUploading(true);
      return uploadFile(
        currentWorkspace.id,
        selectedFile,
        uploadForm.name || selectedFile.name,
        uploadForm.description || undefined
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      toast({
        title: "File Uploaded",
        description: "Your file has been uploaded successfully.",
      });
      handleCloseUploadDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateUpload>[1] }) =>
      updateUpload(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      toast({
        title: "Upload Updated",
        description: "File details have been updated.",
      });
      handleCloseEditDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update file",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteUpload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      toast({
        title: "File Deleted",
        description: "The file has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const filteredUploads = uploads.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const fileCategory = getFileTypeCategory(file.fileType);
    const matchesType = filterType === "all" || fileCategory === filterType;
    return matchesSearch && matchesType;
  });

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    
    if (!isImage && !isVideo) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image or video file.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setUploadForm({ name: file.name, description: "" });

    // Create preview for images
    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleCloseUploadDialog = () => {
    setIsUploadDialogOpen(false);
    setSelectedFile(null);
    setFilePreview(null);
    setUploadForm({ name: "", description: "" });
  };

  const handleOpenEditDialog = (upload: UploadResponse) => {
    setEditingUpload(upload);
    setEditForm({
      name: upload.name,
      description: upload.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingUpload(null);
    setEditForm({ name: "", description: "" });
  };

  const handleSaveEdit = () => {
    if (!editingUpload) return;
    updateMutation.mutate({
      id: editingUpload.id,
      data: {
        name: editForm.name,
        description: editForm.description || undefined,
      },
    });
  };

  const handleDeleteUpload = (upload: UploadResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${upload.name}"?`)) {
      deleteMutation.mutate(upload.id);
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
                  placeholder="Search files..."
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

              {/* Filter Select */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className={cn(
                  "w-40 h-10 rounded-xl"
                )} data-testid="select-file-type">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                </SelectContent>
              </Select>

              {/* Upload Files Button */}
              <Button
                className="gap-2"
                onClick={() => setIsUploadDialogOpen(true)}
                data-testid="button-upload-file"
              >
                <UploadIcon className="h-4 w-4" />
                Upload Files
              </Button>
            </div>
          </div>
        </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading uploads...</p>
        </div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            {filteredUploads.length === 0 ? (
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
                <UploadIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">No files found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or upload new files
                </p>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredUploads.map((file) => {
                  const fileCategory = getFileTypeCategory(file.fileType);
                  const Icon = FILE_TYPE_ICONS[fileCategory];
                  const colorClass = FILE_TYPE_COLORS[fileCategory];

                  return (
                    <motion.div
                      key={file.id}
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
                        onClick={() => handleOpenEditDialog(file)}
                        data-testid={`upload-card-${file.id}`}
                      >
                        <CardContent className="p-0">
                          <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                            {fileCategory === "image" ? (
                              <img
                                src={file.storageUrl}
                                alt={file.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.innerHTML = '<div class="flex flex-col items-center justify-center gap-2"><svg class="h-8 w-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-xs text-white/30">Image unavailable</p></div>';
                                }}
                              />
                            ) : (
                              <div className="relative w-full h-full group/video">
                                <video
                                  src={file.storageUrl}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                  preload="metadata"
                                  muted
                                  onMouseEnter={(e) => {
                                    e.currentTarget.play().catch(() => {});
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.pause();
                                    e.currentTarget.currentTime = 0;
                                  }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const container = e.currentTarget.parentElement;
                                    if (container) {
                                      container.innerHTML = '<div class="flex flex-col items-center justify-center gap-2 w-full h-full"><svg class="h-8 w-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg><p class="text-xs text-white/30">Video unavailable</p></div>';
                                    }
                                  }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-opacity pointer-events-none">
                                  <div className="bg-black/50 rounded-full p-3">
                                    <Video className="h-6 w-6 text-white" />
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-7 w-7 bg-muted backdrop-blur-md border-border hover:bg-muted/80"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditDialog(file);
                                }}
                                data-testid={`button-edit-upload-${file.id}`}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                className="h-7 w-7"
                                onClick={(e) => handleDeleteUpload(file, e)}
                                disabled={deleteMutation.isPending}
                                data-testid={`button-delete-upload-${file.id}`}
                              >
                                {deleteMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="p-3">
                            <h3 className="font-semibold text-sm truncate mb-1" title={file.name}>
                              {file.name}
                            </h3>
                            <div className="flex items-center justify-between text-xs text-white/40">
                              <span>{formatFileSize(file.fileSize)}</span>
                              <span>{formatDate(file.createdAt)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      </div>

      {/* Enhanced Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={handleCloseUploadDialog}>
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
                  {editingUpload ? "Edit File" : "Upload File"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-base">
                  Upload an image or video file to your workspace.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="overflow-y-auto flex-1 min-h-0 px-8 py-6">
            <div className="space-y-6">
              {!selectedFile ? (
                <div>
                  <div
                    className={cn(
                      "border-0 rounded-xl p-12 text-center cursor-pointer transition-all",
                      isDragging 
                        ? "bg-primary/10" 
                        : "bg-muted/50 hover:bg-muted"
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <label className="cursor-pointer group/upload">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                        data-testid="input-file-upload"
                      />
                      <UploadIcon className={cn(
                        "h-12 w-12 text-muted-foreground mx-auto mb-4",
                        "group-hover/upload:text-primary transition-colors"
                      )} />
                      <p className="text-base font-medium mb-2 text-muted-foreground group-hover/upload:text-foreground">
                        Drop files here or click to browse
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Images (JPG, PNG, WebP, GIF) or Videos (MP4, WebM, MOV)
                      </p>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <div className={cn(
                      "border-0 rounded-xl p-5",
                      "bg-muted/50"
                    )}>
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 relative border-0">
                          {filePreview ? (
                            selectedFile.type.startsWith("image/") ? (
                              <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <div className="relative w-full h-full">
                                <video src={filePreview} className="w-full h-full object-cover" muted />
                                <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                                  <Video className="h-8 w-8 text-foreground" />
                                </div>
                              </div>
                            )
                          ) : (
                            selectedFile.type.startsWith("image/") ? (
                              <Image className="h-10 w-10 text-primary" />
                            ) : (
                              <Video className="h-10 w-10 text-violet-500" />
                            )
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base truncate text-foreground mb-1">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(selectedFile.size)} • {selectedFile.type}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 bg-muted hover:bg-muted/80 rounded-lg"
                          onClick={() => {
                            setSelectedFile(null);
                            setFilePreview(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className={cn(
                      "text-lg font-semibold mb-4 pb-2",
                      "text-white border-b border-white/[0.08]",
                      "flex items-center gap-2"
                    )}>
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      File Information
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2.5">
                        <Label htmlFor="upload-name" className="text-foreground font-medium text-sm">
                          Display Name <span className="text-primary">*</span>
                        </Label>
                        <Input
                          id="upload-name"
                          placeholder="Enter a display name..."
                          value={uploadForm.name}
                          onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                          className={cn(
                            "h-11",
                            "focus:border-primary focus:ring-2 focus:ring-primary/30",
                            "transition-all duration-200"
                          )}
                          data-testid="input-upload-name"
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label htmlFor="upload-description" className="text-foreground font-medium text-sm">
                          Description (optional)
                        </Label>
                        <Textarea
                          id="upload-description"
                          placeholder="Add a description..."
                          value={uploadForm.description}
                          onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                          rows={3}
                          className={cn(
                            "focus:border-primary focus:ring-2 focus:ring-primary/30",
                            "transition-all duration-200 resize-none"
                          )}
                          data-testid="input-upload-description"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
              onClick={handleCloseUploadDialog}
              disabled={uploadMutation.isPending}
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
                onClick={() => uploadMutation.mutate()}
                className={cn(
                  "h-11 px-8 bg-gradient-to-r from-primary to-violet-500",
                  "hover:shadow-lg hover:shadow-primary/30",
                  "border-0 text-white font-semibold",
                  "transition-all duration-200"
                )}
                disabled={!selectedFile || isUploading}
                data-testid="button-submit-upload"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload File"
                )}
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleCloseEditDialog}>
        <DialogContent className={cn(
          "max-w-2xl max-h-[90vh] overflow-y-auto",
          "bg-[#111111]/95 backdrop-blur-2xl",
          "border border-white/[0.1]",
          "shadow-2xl shadow-black/50"
        )}>
          <DialogHeader className="border-b border-white/[0.06] pb-4">
            <DialogTitle className={cn(
              "text-2xl font-bold",
              "bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent"
            )}>
              Edit File Details
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Update the display name and description for this file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {editingUpload && (
              <div className={cn(
                "border border-white/[0.1] rounded-lg p-4",
                "bg-white/[0.02]"
              )}>
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 rounded bg-white/[0.05] flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/[0.1]">
                    {getFileTypeCategory(editingUpload.fileType) === "image" ? (
                      <img
                        src={editingUpload.storageUrl}
                        alt={editingUpload.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Video className="h-8 w-8 text-violet-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate text-white/80">{editingUpload.fileName}</p>
                    <p className="text-xs text-white/40">
                      {formatFileSize(editingUpload.fileSize)} • {editingUpload.fileType}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-white/80">Display Name</Label>
              <Input
                id="edit-name"
                placeholder="Enter a display name..."
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className={cn(
                  "bg-white/[0.05] border-white/[0.1]",
                  "text-white placeholder:text-white/40",
                  "focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                )}
                data-testid="input-edit-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-white/80">Description (optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Add a description..."
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={2}
                className={cn(
                  "bg-white/[0.05] border-white/[0.1]",
                  "text-white placeholder:text-white/40",
                  "focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                )}
                data-testid="input-edit-description"
              />
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleSaveEdit}
                className={cn(
                  "w-full h-12",
                  "bg-gradient-to-r from-primary to-violet-500",
                  "hover:shadow-lg hover:shadow-primary/25",
                  "border-0 text-white font-semibold"
                )}
                disabled={updateMutation.isPending}
                data-testid="button-save-edit"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
