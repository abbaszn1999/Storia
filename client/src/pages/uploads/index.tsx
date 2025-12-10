import { useState, useCallback } from "react";
import { Plus, Search, Image, Video, Upload as UploadIcon, X, Loader2, Trash2, Pencil } from "lucide-react";
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
import {
  listUploads,
  uploadFile,
  updateUpload,
  deleteUpload,
  type UploadResponse,
} from "@/assets/uploads";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Uploads</h1>
          <p className="text-muted-foreground mt-1">
            Manage your uploaded media files and assets
          </p>
        </div>
        <Button
          size="lg"
          className="gap-2"
          onClick={() => setIsUploadDialogOpen(true)}
          data-testid="button-upload-file"
        >
          <UploadIcon className="h-4 w-4" />
          Upload Files
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40" data-testid="select-file-type">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading uploads...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUploads.map((file) => {
              const fileCategory = getFileTypeCategory(file.fileType);
              const Icon = FILE_TYPE_ICONS[fileCategory];
              const colorClass = FILE_TYPE_COLORS[fileCategory];

              return (
                <Card
                  key={file.id}
                  className="hover-elevate cursor-pointer group"
                  onClick={() => handleOpenEditDialog(file)}
                  data-testid={`upload-card-${file.id}`}
                >
                  <CardContent className="p-0">
                    <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                      {fileCategory === "image" ? (
                        <img
                          src={file.storageUrl}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<div class="flex flex-col items-center justify-center gap-2"><svg class="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-xs text-muted-foreground">Image unavailable</p></div>';
                          }}
                        />
                      ) : (
                        <div className="relative w-full h-full group/video">
                          <video
                            src={file.storageUrl}
                            className="w-full h-full object-cover"
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
                                container.innerHTML = '<div class="flex flex-col items-center justify-center gap-2 w-full h-full"><svg class="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg><p class="text-xs text-muted-foreground">Video unavailable</p></div>';
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
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-7 w-7"
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
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatFileSize(file.fileSize)}</span>
                        <span>{formatDate(file.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredUploads.length === 0 && (
            <div className="text-center py-12">
              <UploadIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No files found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or upload new files
              </p>
            </div>
          )}
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={handleCloseUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Upload an image or video file to your workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <label className="cursor-pointer">
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
                  <UploadIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium mb-1">
                    Drop files here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Images (JPG, PNG, WebP, GIF) or Videos (MP4, WebM, MOV)
                  </p>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-20 h-20 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                      {filePreview ? (
                        selectedFile.type.startsWith("image/") ? (
                          <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="relative w-full h-full">
                            <video src={filePreview} className="w-full h-full object-cover" muted />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Video className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        )
                      ) : (
                        selectedFile.type.startsWith("image/") ? (
                          <Image className="h-8 w-8 text-blue-500" />
                        ) : (
                          <Video className="h-8 w-8 text-purple-500" />
                        )
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upload-name">Display Name</Label>
                  <Input
                    id="upload-name"
                    placeholder="Enter a display name..."
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    data-testid="input-upload-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upload-description">Description (optional)</Label>
                  <Textarea
                    id="upload-description"
                    placeholder="Add a description..."
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    rows={2}
                    data-testid="input-upload-description"
                  />
                </div>
              </div>
            )}

            <Button
              onClick={() => uploadMutation.mutate()}
              className="w-full"
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit File Details</DialogTitle>
            <DialogDescription>
              Update the display name and description for this file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {editingUpload && (
              <div className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {getFileTypeCategory(editingUpload.fileType) === "image" ? (
                      <img
                        src={editingUpload.storageUrl}
                        alt={editingUpload.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Video className="h-8 w-8 text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{editingUpload.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(editingUpload.fileSize)} • {editingUpload.fileType}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-name">Display Name</Label>
              <Input
                id="edit-name"
                placeholder="Enter a display name..."
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                data-testid="input-edit-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Add a description..."
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={2}
                data-testid="input-edit-description"
              />
            </div>

            <Button
              onClick={handleSaveEdit}
              className="w-full"
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
