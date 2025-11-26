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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Shot } from "@shared/schema";

const shotFormSchema = z.object({
  shotNumber: z.number().min(1),
  shotType: z.string().min(1, "Shot type is required"),
  cameraMovement: z.string().min(1, "Camera movement is required"),
  duration: z.number().min(5, "Duration must be at least 5 seconds"),
  description: z.string().optional(),
  animationMode: z.enum(["inherit", "smooth-image", "animate"]).optional(),
  motionSpeed: z.enum(["slow", "medium", "fast"]).optional(),
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
}

const SHOT_TYPES = [
  "Wide Shot",
  "Medium Shot",
  "Close-Up",
  "Extreme Close-Up",
  "Aerial",
  "Macro",
];

const CAMERA_MOVEMENTS = [
  "static",
  "slow pan-left",
  "slow pan-right",
  "slow tilt-up",
  "slow tilt-down",
  "slow zoom-in",
  "slow zoom-out",
  "drift",
  "subtle motion",
];

const ANIMATION_MODES = [
  { value: "inherit", label: "Inherit Global Setting" },
  { value: "smooth-image", label: "Smooth Image Effect (Ken Burns)" },
  { value: "animate", label: "Full Animation (AI Video)" },
];

const MOTION_SPEEDS = [
  { value: "slow", label: "Slow (Relaxing)" },
  { value: "medium", label: "Medium" },
  { value: "fast", label: "Fast" },
];

export function ShotDialog({
  open,
  onOpenChange,
  shot,
  sceneId,
  shotCount,
  onSubmit,
  isPending,
}: ShotDialogProps) {
  const isEdit = !!shot;

  const form = useForm<ShotFormValues>({
    resolver: zodResolver(shotFormSchema),
    defaultValues: {
      shotNumber: shot?.shotNumber ?? shotCount + 1,
      shotType: shot?.shotType ?? "Wide Shot",
      cameraMovement: shot?.cameraMovement ?? "static",
      duration: shot?.duration ?? 15,
      description: shot?.description ?? "",
      animationMode: "inherit",
      motionSpeed: "slow",
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
        animationMode: "inherit",
        motionSpeed: "slow",
      });
    } else {
      form.reset({
        shotNumber: shotCount + 1,
        shotType: "Wide Shot",
        cameraMovement: "static",
        duration: 15,
        description: "",
        animationMode: "inherit",
        motionSpeed: "slow",
      });
    }
  }, [shot, shotCount, form]);

  const handleSubmit = async (data: ShotFormValues) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Shot" : "Add Shot"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update shot details" : "Create a new shot for this segment"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (seconds)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={5}
                        max={60}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-shot-duration"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    <FormLabel>Motion Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-camera-movement">
                          <SelectValue placeholder="Select motion" />
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
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visual Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the visual content (e.g., sunlight filtering through leaves, morning mist over water)"
                      className="resize-none"
                      rows={3}
                      data-testid="input-shot-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3">Animation Override</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="animationMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Animation Mode</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-animation-mode">
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ANIMATION_MODES.map((mode) => (
                            <SelectItem key={mode.value} value={mode.value}>
                              {mode.label}
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
                  name="motionSpeed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motion Speed</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-motion-speed">
                            <SelectValue placeholder="Select speed" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MOTION_SPEEDS.map((speed) => (
                            <SelectItem key={speed.value} value={speed.value}>
                              {speed.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
              <Button type="submit" disabled={isPending} data-testid="button-save-shot">
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
