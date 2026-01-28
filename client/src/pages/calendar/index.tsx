// Content Calendar Page
// ═══════════════════════════════════════════════════════════════════════════
// Displays scheduled posts from Late.dev with list and month views
// Late.dev is the single source of truth - no local database table

import { useState, useMemo, useCallback } from "react";
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarItem } from "@/components/calendar-item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { useWorkspace } from "@/contexts/workspace-context";
import { useToast } from "@/hooks/use-toast";
import { 
  useCalendarPosts, 
  useCancelPost, 
  useRetryPost,
  type CalendarPost,
} from "@/features/calendar";
import { CalendarMonthView } from "@/features/calendar/components/calendar-month-view";
import { RescheduleModal } from "@/features/calendar/components/reschedule-modal";

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function Calendar() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  
  const [view, setView] = useState("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedPostForReschedule, setSelectedPostForReschedule] = useState<CalendarPost | null>(null);

  // Calculate date range for the current month view
  const dateRange = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return {
      dateFrom: start.toISOString(),
      dateTo: end.toISOString(),
    };
  }, [currentMonth]);

  // Fetch calendar posts from Late.dev
  const { 
    data, 
    isLoading, 
    error,
    refetch,
  } = useCalendarPosts(
    currentWorkspace?.id,
    view === "month" ? dateRange : {}, // Only filter by date for month view
    { enabled: !!currentWorkspace }
  );

  const posts = data?.posts || [];

  // Mutations
  const cancelMutation = useCancelPost(currentWorkspace?.id);
  const retryMutation = useRetryPost(currentWorkspace?.id);

  // Handlers
  const handleCancel = useCallback(async (postId: string) => {
    if (!confirm("Are you sure you want to cancel this scheduled post?")) return;
    
    try {
      await cancelMutation.mutateAsync(postId);
      toast({
        title: "Post canceled",
        description: "The scheduled post has been canceled.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to cancel",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  }, [cancelMutation, toast]);

  const handleRetry = useCallback(async (postId: string) => {
    try {
      await retryMutation.mutateAsync(postId);
      toast({
        title: "Retry initiated",
        description: "The post is being retried.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to retry",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  }, [retryMutation, toast]);

  const handleReschedule = useCallback((postId: string) => {
    const post = posts.find(p => p._id === postId);
    if (post) {
      setSelectedPostForReschedule(post);
      setRescheduleModalOpen(true);
    }
  }, [posts]);

  const handleViewDetails = useCallback((postId: string) => {
    // TODO: Navigate to post details or open modal
    console.log("View details:", postId);
  }, []);

  const handleDayClick = useCallback((date: Date) => {
    // TODO: Could open a day detail view or filter to that day
    console.log("Day clicked:", date);
  }, []);

  const handlePostClick = useCallback((postId: string) => {
    handleViewDetails(postId);
  }, [handleViewDetails]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div>
            <p className="font-medium">Failed to load calendar</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // No workspace selected
  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <CalendarIcon className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-medium">No workspace selected</p>
            <p className="text-sm text-muted-foreground mt-1">
              Please select a workspace to view your content calendar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Schedule and manage your content releases
          </p>
        </div>
        <Button size="lg" className="gap-2" data-testid="button-schedule-content">
          <Plus className="h-4 w-4" />
          Schedule Content
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="list" data-testid="tab-list">List View</TabsTrigger>
          <TabsTrigger value="month" data-testid="tab-month">Month View</TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="space-y-4 mt-6">
          {posts.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">No scheduled content</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Schedule your first video or story to see it here.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Content
              </Button>
            </div>
          ) : (
            posts.map((post) => (
              <CalendarItem 
                key={post._id} 
                post={post}
                onCancel={handleCancel}
                onRetry={handleRetry}
                onReschedule={handleReschedule}
                onViewDetails={handleViewDetails}
              />
            ))
          )}
        </TabsContent>

        {/* Month View */}
        <TabsContent value="month" className="mt-6 space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
                data-testid="button-today"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                data-testid="button-next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar grid */}
          <CalendarMonthView
            posts={posts}
            currentMonth={currentMonth}
            onDayClick={handleDayClick}
            onPostClick={handlePostClick}
          />
        </TabsContent>
      </Tabs>

      {/* Reschedule Modal */}
      {currentWorkspace && (
        <RescheduleModal
          open={rescheduleModalOpen}
          onOpenChange={setRescheduleModalOpen}
          workspaceId={currentWorkspace.id}
          post={selectedPostForReschedule}
          onSuccess={() => {
            refetch();
            setSelectedPostForReschedule(null);
          }}
        />
      )}
    </div>
  );
}
