import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "../../../../shared/components/ui/status-badge";

// Response shape from GET /api/autoproduction/story/:id/stories/:itemIndex
interface StoryItemResponse {
  index: number;
  topic: string;
  status: string;
  error?: string;
  story: {
    id: string;
    projectName: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    duration?: number;
    aspectRatio?: string;
    storyMode: string;
  } | null;
}

export default function StoryDetail() {
  const { id, storyId } = useParams();
  const [, navigate] = useLocation();
  const { data: storyData } = useQuery<StoryItemResponse>({
    queryKey: [`/api/autoproduction/story/${id}/stories/${storyId}`],
  });
  
  if (!storyData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/autoproduction/story/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">{storyData.topic}</h1>
            <p className="text-sm text-muted-foreground">Story {storyData.index + 1}</p>
          </div>
        </div>
        <StatusBadge status={storyData.status as any} />
      </div>

      {/* Video Player */}
      {storyData.story?.videoUrl && (
        <Card>
          <CardContent className="p-6">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video src={storyData.story.videoUrl} controls className="w-full h-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Story Info */}
      {storyData.story && (
        <Card>
          <CardHeader>
            <CardTitle>Story Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {storyData.story.projectName}</div>
              <div><span className="font-medium">Mode:</span> {storyData.story.storyMode}</div>
              {storyData.story.duration && (
                <div><span className="font-medium">Duration:</span> {storyData.story.duration}s</div>
              )}
              {storyData.story.aspectRatio && (
                <div><span className="font-medium">Aspect Ratio:</span> {storyData.story.aspectRatio}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {storyData.error && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600">Generation Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">{storyData.error}</p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
