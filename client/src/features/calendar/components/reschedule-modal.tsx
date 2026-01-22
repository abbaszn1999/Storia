// Reschedule Modal Component
// ═══════════════════════════════════════════════════════════════════════════
// Modal for rescheduling a post to a new date/time

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, Loader2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useReschedulePost } from "../hooks/use-calendar";
import type { CalendarPost } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface RescheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  post: CalendarPost | null;
  onSuccess?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function RescheduleModal({
  open,
  onOpenChange,
  workspaceId,
  post,
  onSuccess,
}: RescheduleModalProps) {
  const { toast } = useToast();
  const rescheduleMutation = useReschedulePost(workspaceId);

  // Initialize with current scheduled time or current time
  const currentScheduledDate = post?.scheduledFor 
    ? new Date(post.scheduledFor) 
    : new Date();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(currentScheduledDate);
  const [selectedTime, setSelectedTime] = useState(() => {
    const hours = currentScheduledDate.getHours().toString().padStart(2, '0');
    const minutes = currentScheduledDate.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  });

  // Update when post changes
  useEffect(() => {
    if (post?.scheduledFor) {
      const date = new Date(post.scheduledFor);
      setSelectedDate(date);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      setSelectedTime(`${hours}:${minutes}`);
    }
  }, [post]);

  // Submit reschedule
  const handleSubmit = async () => {
    if (!selectedDate || !post) {
      toast({
        title: "Missing information",
        description: "Please select a date and time",
        variant: "destructive",
      });
      return;
    }

    // Build scheduled datetime
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const scheduledFor = new Date(selectedDate);
    scheduledFor.setHours(hours, minutes, 0, 0);

    // Check if date is in the past
    if (scheduledFor < new Date()) {
      toast({
        title: "Invalid date",
        description: "Cannot schedule posts in the past",
        variant: "destructive",
      });
      return;
    }

    try {
      await rescheduleMutation.mutateAsync({
        postId: post._id,
        input: {
          scheduledFor: scheduledFor.toISOString(),
        },
      });
      
      toast({
        title: "Post rescheduled!",
        description: `Rescheduled for ${format(scheduledFor, "MMM d, yyyy 'at' h:mm a")}`,
      });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Rescheduling failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const canSubmit = selectedDate && selectedTime && !rescheduleMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Post</DialogTitle>
          <DialogDescription>
            {post && (
              <>
                Change the scheduled time for "{post.title || 'Untitled'}"
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Picker */}
          <div className="space-y-2">
            <Label>Time</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Current scheduled time display */}
          {post?.scheduledFor && (
            <div className="text-sm text-muted-foreground">
              Currently scheduled: {format(new Date(post.scheduledFor), "MMM d, yyyy 'at' h:mm a")}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!canSubmit}
          >
            {rescheduleMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rescheduling...
              </>
            ) : (
              "Reschedule"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
