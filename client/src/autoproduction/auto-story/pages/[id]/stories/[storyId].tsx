import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "../../../../shared/components/ui/status-badge";
import { useUpdateStory } from "../../../hooks";
import { useToast } from "@/hooks/use-toast";

export default function StoryDetail() {
  const { id, storyId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const { data: story } = useQuery({
    queryKey: [`/api/autoproduction/story/${id}/stories/${storyId}`],
  });
  
  const updateStory = useUpdateStory(id!);

  if (!story) {
    return <div>Loading...</div>;
  }

  const handleApprove = () => {
    updateStory.mutate(
      { itemId: storyId!, data: { status: 'approved' } },
      {
        onSuccess: () => {
          toast({ title: "Story Approved" });
          navigate(`/autoproduction/story/${id}`);
        },
      }
    );
  };

  const handleReject = () => {
    updateStory.mutate(
      { itemId: storyId!, data: { status: 'rejected' } },
      {
        onSuccess: () => {
          toast({ title: "Story Rejected" });
          navigate(`/autoproduction/story/${id}`);
        },
      }
    );
  };

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
            <h1 className="text-2xl font-display font-bold">{story.sourceIdea}</h1>
            <p className="text-sm text-muted-foreground">Story {story.orderIndex}</p>
          </div>
        </div>
        <StatusBadge status={story.status} />
      </div>

      {/* Video Player */}
      {story.previewUrl && (
        <Card>
          <CardContent className="p-6">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video src={story.previewUrl} controls className="w-full h-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Script */}
      {story.script && (
        <Card>
          <CardHeader>
            <CardTitle>Script</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm">{story.script}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scenes */}
      {story.scenes && (
        <Card>
          <CardHeader>
            <CardTitle>Scenes Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(story.scenes as any).scenes?.map((scene: any) => (
                <div key={scene.sceneNumber} className="p-4 border rounded-lg">
                  <div className="font-medium mb-2">
                    Scene {scene.sceneNumber} ({scene.duration}s)
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {scene.description}
                  </div>
                  {scene.narration && (
                    <div className="text-sm mt-2 italic">
                      "{scene.narration}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {story.status === 'completed' && (
        <div className="flex items-center gap-3">
          <Button onClick={handleApprove}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
          <Button variant="outline" onClick={handleReject}>
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
        </div>
      )}
    </div>
  );
}
