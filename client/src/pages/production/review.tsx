import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, GripVertical, CheckCircle, XCircle, RefreshCw, PlayCircle, Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProductionCampaign, CampaignVideo } from "@shared/schema";

function SortableConceptCard({ concept, onUpdate, onApprove, onReject, onRegenerate }: {
  concept: CampaignVideo;
  onUpdate: (id: string, updates: Partial<CampaignVideo>) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRegenerate: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: concept.id });
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(concept.title);
  const [editedDescription, setEditedDescription] = useState(concept.conceptDescription);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    onUpdate(concept.id, { title: editedTitle, conceptDescription: editedDescription });
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} data-testid={`concept-card-${concept.id}`}>
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing" data-testid={`drag-handle-${concept.id}`}>
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" data-testid={`badge-order-${concept.id}`}>#{concept.orderIndex + 1}</Badge>
              {isEditing ? (
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="flex-1"
                  data-testid={`input-title-${concept.id}`}
                />
              ) : (
                <CardTitle className="text-lg" data-testid={`text-title-${concept.id}`}>{concept.title}</CardTitle>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <Button size="sm" onClick={handleSave} data-testid={`button-save-${concept.id}`}>
                <Save className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} data-testid={`button-edit-${concept.id}`}>
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <Textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              rows={3}
              data-testid={`textarea-description-${concept.id}`}
            />
          ) : (
            <p className="text-muted-foreground" data-testid={`text-description-${concept.id}`}>{concept.conceptDescription}</p>
          )}
          
          <div className="flex gap-2">
            <Button size="sm" variant="default" onClick={() => onApprove(concept.id)} data-testid={`button-approve-${concept.id}`}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => onReject(concept.id)} data-testid={`button-reject-${concept.id}`}>
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button size="sm" variant="outline" onClick={() => onRegenerate(concept.id)} data-testid={`button-regenerate-${concept.id}`}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProductionCampaignReview() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [concepts, setConcepts] = useState<CampaignVideo[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: campaign, isLoading: campaignLoading } = useQuery<ProductionCampaign>({
    queryKey: ["/api/production-campaigns", id],
    enabled: !!id,
  });

  const { data: videosData, isLoading: videosLoading } = useQuery<CampaignVideo[]>({
    queryKey: ["/api/production-campaigns", id, "videos"],
    enabled: !!id,
  });

  useEffect(() => {
    if (videosData) {
      setConcepts([...videosData].sort((a, b) => a.orderIndex - b.orderIndex));
    }
  }, [videosData]);

  const updateVideoMutation = useMutation({
    mutationFn: async ({ videoId, updates }: { videoId: string; updates: Partial<CampaignVideo> }) => {
      const res = await apiRequest("PATCH", `/api/production-campaigns/${id}/videos/${videoId}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-campaigns", id, "videos"] });
    },
  });

  const startProductionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/production-campaigns/${id}/start`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-campaigns"] });
      toast({
        title: "Production started",
        description: "Your campaign is now in production",
      });
      navigate(`/production/${id}/dashboard`);
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setConcepts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        newItems.forEach((item, index) => {
          if (item.orderIndex !== index) {
            updateVideoMutation.mutate({ videoId: item.id, updates: { orderIndex: index } });
          }
        });
        
        return newItems;
      });
    }
  };

  const handleUpdateConcept = (videoId: string, updates: Partial<CampaignVideo>) => {
    updateVideoMutation.mutate({ videoId, updates });
    setConcepts((prev) =>
      prev.map((c) => (c.id === videoId ? { ...c, ...updates } : c))
    );
  };

  const handleApprove = (videoId: string) => {
    updateVideoMutation.mutate({ videoId, updates: { status: "approved" } });
    toast({ title: "Concept approved" });
  };

  const handleReject = (videoId: string) => {
    updateVideoMutation.mutate({ videoId, updates: { status: "cancelled" } });
    toast({ title: "Concept rejected" });
  };

  const handleRegenerate = (videoId: string) => {
    toast({ title: "Regenerating concept", description: "This feature will be available soon" });
  };

  const handleApproveAll = () => {
    startProductionMutation.mutate();
  };

  const handleSaveDraft = async () => {
    await apiRequest("PATCH", `/api/production-campaigns/${id}`, { status: "draft" });
    toast({ title: "Draft saved" });
    navigate("/production");
  };

  if (campaignLoading || videosLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return <div>Campaign not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold" data-testid="text-campaign-name">{campaign.name}</h1>
        <p className="text-muted-foreground mt-2">Review and organize generated video concepts</p>
      </div>

      <Card data-testid="card-campaign-info">
        <CardHeader>
          <CardTitle>Campaign Overview</CardTitle>
          <CardDescription>{campaign.conceptPrompt}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total Videos</div>
              <div className="font-semibold" data-testid="text-total-videos">{concepts.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Duration</div>
              <div className="font-semibold">{campaign.duration}s</div>
            </div>
            <div>
              <div className="text-muted-foreground">Aspect Ratio</div>
              <div className="font-semibold">{campaign.aspectRatio}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Art Style</div>
              <div className="font-semibold">{campaign.artStyle}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={concepts.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {concepts.map((concept) => (
              <SortableConceptCard
                key={concept.id}
                concept={concept}
                onUpdate={handleUpdateConcept}
                onApprove={handleApprove}
                onReject={handleReject}
                onRegenerate={handleRegenerate}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={handleSaveDraft} data-testid="button-save-draft">
          <Save className="h-4 w-4 mr-2" />
          Save as Draft
        </Button>
        <Button onClick={handleApproveAll} disabled={startProductionMutation.isPending} data-testid="button-start-production">
          <PlayCircle className="h-4 w-4 mr-2" />
          {startProductionMutation.isPending ? "Starting..." : "Approve All & Start Production"}
        </Button>
      </div>
    </div>
  );
}
