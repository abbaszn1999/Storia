import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TextareaWithMentions } from "./textarea-with-mentions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Shot } from "@/types/storyboard";

const shotFormSchema = z.object({
  shotNumber: z.number().min(1),
  shotType: z.string().min(1, "Shot type is required"),
  cameraMovement: z.string().min(1, "Camera movement is required"),
  duration: z.number().min(1, "Duration is required"),
  description: z.string().optional(),
});

type ShotFormValues = z.infer<typeof shotFormSchema>;

interface ShotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shot?: Shot;
  sceneId: string;
  shotCount: number;
  onSubmit: (data: ShotFormValues) => Promise<void>;
  isPending: boolean;
  characters?: Array<{ id: string; name: string; description?: string }>;
  locations?: Array<{ id: string; name: string; description?: string }>;
}

const SHOT_TYPES = [
  "Extreme Wide Shot",
  "Wide Shot",
  "Medium Shot",
  "Close-Up",
  "Extreme Close-Up",
  "Over-the-Shoulder",
  "Point of View",
];

const CAMERA_MOVEMENTS = [
  "static",
  "pan-left",
  "pan-right",
  "tilt-up",
  "tilt-down",
  "zoom-in",
  "zoom-out",
  "dolly-in",
  "dolly-out",
  "crane-up",
  "crane-down",
];

export function ShotDialog({
  open,
  onOpenChange,
  shot,
  sceneId,
  shotCount,
  onSubmit,
  isPending,
  characters = [],
  locations = [],
}: ShotDialogProps) {
  const isEdit = !!shot;

  const form = useForm<ShotFormValues>({
    resolver: zodResolver(shotFormSchema),
    defaultValues: {
      shotNumber: shot?.shotNumber ?? shotCount + 1,
      shotType: shot?.shotType ?? "",
      cameraMovement: shot?.cameraMovement ?? "static",
      duration: shot?.duration ?? 3,
      description: shot?.description ?? "",
    },
  });

  useEffect(() => {
    if (shot) {
      form.reset({
        shotNumber: shot.shotNumber,
        shotType: shot.shotType,
        cameraMovement: shot.cameraMovement,
        duration: shot.duration,
        description: shot.description ?? "",
      });
    } else {
      form.reset({
        shotNumber: shotCount + 1,
        shotType: "",
        cameraMovement: "static",
        duration: 3,
        description: "",
      });
    }
  }, [shot, shotCount, form]);

  const handleSubmit = async (data: ShotFormValues) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Shot" : "Add Shot"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update shot details" : "Create a new shot for this scene"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="shotNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shot Number</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      data-testid="input-shot-number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shotType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shot Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-shot-type">
                        <SelectValue placeholder="Select shot type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SHOT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cameraMovement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Camera Movement</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-camera-movement">
                        <SelectValue placeholder="Select camera movement" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CAMERA_MOVEMENTS.map((movement) => (
                        <SelectItem key={movement} value={movement}>
                          {movement}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (seconds)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      disabled={true}
                      className="bg-muted cursor-not-allowed"
                      data-testid="input-shot-duration"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Duration is automatically set by the AI and cannot be edited.
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <TextareaWithMentions
                      value={field.value || ""}
                      onChange={field.onChange}
                      characters={characters}
                      locations={locations}
                      placeholder="Describe the shot composition and action (type @ to mention characters or locations)"
                      className="resize-none min-h-[80px]"
                      data-testid="input-shot-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                data-testid="button-cancel-shot"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90" data-testid="button-save-shot">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{isEdit ? "Update" : "Create"} Shot</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
