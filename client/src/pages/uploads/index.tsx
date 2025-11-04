import { useState } from "react";
import { Plus, Search, Image, Video, Music, FileText, Upload as UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UploadedFile {
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "document";
  size: string;
  uploadedAt: string;
  thumbnailUrl?: string;
}

const FILE_TYPE_ICONS = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
};

const FILE_TYPE_COLORS = {
  image: "text-blue-500",
  video: "text-purple-500",
  audio: "text-green-500",
  document: "text-orange-500",
};

export default function Uploads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const mockUploads: UploadedFile[] = [
    {
      id: "1",
      name: "hero-background.jpg",
      type: "image",
      size: "2.4 MB",
      uploadedAt: "2 hours ago",
      thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=200&fit=crop",
    },
    {
      id: "2",
      name: "intro-video.mp4",
      type: "video",
      size: "45.8 MB",
      uploadedAt: "1 day ago",
      thumbnailUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=300&h=200&fit=crop",
    },
    {
      id: "3",
      name: "background-music.mp3",
      type: "audio",
      size: "5.2 MB",
      uploadedAt: "3 days ago",
    },
    {
      id: "4",
      name: "product-photo.png",
      type: "image",
      size: "1.8 MB",
      uploadedAt: "1 week ago",
      thumbnailUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop",
    },
    {
      id: "5",
      name: "script-draft.pdf",
      type: "document",
      size: "156 KB",
      uploadedAt: "2 weeks ago",
    },
  ];

  const filteredUploads = mockUploads.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || file.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Uploads</h1>
          <p className="text-muted-foreground mt-1">
            Manage your uploaded media files and assets
          </p>
        </div>
        <Button size="lg" className="gap-2" data-testid="button-upload-file">
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
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredUploads.map((file) => {
          const Icon = FILE_TYPE_ICONS[file.type];
          const colorClass = FILE_TYPE_COLORS[file.type];

          return (
            <Card key={file.id} className="hover-elevate cursor-pointer" data-testid={`upload-card-${file.id}`}>
              <CardContent className="p-0">
                <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                  {file.thumbnailUrl ? (
                    <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className={`h-12 w-12 ${colorClass}`} />
                  )}
                  <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                    {file.type}
                  </Badge>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate mb-1" title={file.name}>
                    {file.name}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{file.size}</span>
                    <span>{file.uploadedAt}</span>
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
    </div>
  );
}
