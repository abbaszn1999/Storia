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
import type { Shot } from "@/types/storyboard";
import { getVideoModelConfig } from "@/constants/video-models";

// Camera movements match backend values from flow-shot-composer-prompts.ts
const CAMERA_MOVEMENTS_BY_MODE: Record<'video-animation' | 'image-transitions', string[]> = {
  'video-animation': [
    'static',
    'slow-pan-left',
    'slow-pan-right',
    'tilt-up',
    'tilt-down',
    'gentle-drift',
    'orbit',
    'push-in',
    'pull-out',
    'floating',
  ],
  'image-transitions': [
    'static',
    'slow-zoom-in',
    'slow-zoom-out',
    'pan-left',
    'pan-right',
    'ken-burns-up',
    'ken-burns-down',
    'diagonal-drift',
  ],
};

// Get camera movements for a specific animation mode
const getCameraMovements = (animationMode: 'video-animation' | 'image-transitions'): string[] => {
  return CAMERA_MOVEMENTS_BY_MODE[animationMode] || CAMERA_MOVEMENTS_BY_MODE['video-animation'];
};

// Get display label for camera movement
const getCameraMotionLabel = (value: string): string => {
  const labels: Record<string, string> = {
    'static': 'Static',
    'slow-pan-left': 'Slow Pan Left',
    'slow-pan-right': 'Slow Pan Right',
    'tilt-up': 'Tilt Up',
    'tilt-down': 'Tilt Down',
    'gentle-drift': 'Gentle Drift',
    'orbit': 'Orbit',
    'push-in': 'Push In',
    'pull-out': 'Pull Out',
    'floating': 'Floating',
    'slow-zoom-in': 'Slow Zoom In',
    'slow-zoom-out': 'Slow Zoom Out',
    'pan-left': 'Pan Left',
    'pan-right': 'Pan Right',
    'ken-burns-up': 'Ken Burns Up',
    'ken-burns-down': 'Ken Burns Down',
    'diagonal-drift': 'Diagonal Drift',
  };
  return labels[value] || value;
};

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
  videoModel?: string; // Video model from atmosphere phase
  animationMode: 'image-transitions' | 'video-animation'; // Animation mode to determine camera movements
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
  videoModel,
  animationMode,
  onSubmit,
  isPending,
}: ShotDialogProps) {
  const isEdit = !!shot;
  
  // Get camera movements based on animation mode
  const cameraMovements = getCameraMovements(animationMode);
  
  // Get supported durations for the video model
  const modelConfig = videoModel ? getVideoModelConfig(videoModel) : undefined;
  const supportedDurations = modelConfig?.durations || [5, 10]; // Default fallback

  // Get nearest supported duration if current duration is not supported
  const getValidDuration = (currentDuration?: number): number => {
    if (!currentDuration) {
      return supportedDurations[0] || 5; // Default to first supported duration
    }
    if (supportedDurations.includes(currentDuration)) {
      return currentDuration;
    }
    // Find nearest supported duration
    const nearest = supportedDurations.reduce((prev, curr) => {
      return Math.abs(curr - currentDuration) < Math.abs(prev - currentDuration) ? curr : prev;
    });
    return nearest;
  };

  const form = useForm<ShotFormValues>({
    resolver: zodResolver(shotFormSchema),
    defaultValues: {
      shotNumber: shot?.shotNumber ?? shotCount + 1,
      shotType: shot?.shotType ?? "Wide Shot",
      cameraMovement: shot?.cameraMovement ?? "static",
      duration: getValidDuration(shot?.duration),
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
        duration: getValidDuration(shot.duration),
        description: shot.description ?? "",
        animationMode: "inherit",
        motionSpeed: "slow",
      });
    } else {
      form.reset({
        shotNumber: shotCount + 1,
        shotType: "Wide Shot",
        cameraMovement: "static",
        duration: supportedDurations[0] || 5,
        description: "",
        animationMode: "inherit",
        motionSpeed: "slow",
      });
    }
  }, [shot, shotCount, form, supportedDurations]);

  const handleSubmit = async (data: ShotFormValues) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-[#0a0a0a] border-white/[0.06] text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              {isEdit ? "Edit Shot" : "Add Shot"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-white/60">
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
                    <FormLabel className="text-white/80">Shot Number</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-500/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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
                    <FormLabel className="text-white/80">Duration (seconds)</FormLabel>
                    <FormControl>
                      {supportedDurations.length > 0 ? (
                        <Select
                          value={field.value?.toString()}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <SelectTrigger 
                            data-testid="select-shot-duration"
                            className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          >
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0a0a0a] border-white/10">
                            {supportedDurations.map((duration) => (
                              <SelectItem 
                                key={duration} 
                                value={duration.toString()}
                                className="text-white focus:bg-cyan-500/20 focus:text-cyan-300"
                              >
                                {duration}s
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type="number"
                          min={5}
                          max={60}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-500/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-shot-duration"
                        />
                      )}
                    </FormControl>
                    {supportedDurations.length > 0 && (
                      <p className="text-xs text-cyan-400/70">
                        Supported durations for {modelConfig?.label || videoModel || 'selected model'}
                      </p>
                    )}
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
                    <FormLabel className="text-white/80">Shot Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger 
                          data-testid="select-shot-type"
                          className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        >
                          <SelectValue placeholder="Select shot type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#0a0a0a] border-white/10">
                        {SHOT_TYPES.map((type) => (
                          <SelectItem 
                            key={type} 
                            value={type}
                            className="text-white focus:bg-cyan-500/20 focus:text-cyan-300"
                          >
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
                    <FormLabel className="text-white/80">Camera Movement</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger 
                          data-testid="select-camera-movement"
                          className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        >
                          <SelectValue placeholder="Select movement" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#0a0a0a] border-white/10">
                        {cameraMovements.map((movement) => (
                          <SelectItem 
                            key={movement} 
                            value={movement}
                            className="text-white focus:bg-cyan-500/20 focus:text-cyan-300"
                          >
                            {getCameraMotionLabel(movement)}
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
                  <FormLabel className="text-white/80">Visual Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the visual content (e.g., sunlight filtering through leaves, morning mist over water)"
                      className="resize-none bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-500/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      rows={3}
                      data-testid="input-shot-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t border-white/10 pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3 text-white/90">Animation Override</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="animationMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Animation Mode</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger 
                            data-testid="select-animation-mode"
                            className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          >
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#0a0a0a] border-white/10">
                          {ANIMATION_MODES.map((mode) => (
                            <SelectItem 
                              key={mode.value} 
                              value={mode.value}
                              className="text-white focus:bg-cyan-500/20 focus:text-cyan-300"
                            >
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
                      <FormLabel className="text-white/80">Motion Speed</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger 
                            data-testid="select-motion-speed"
                            className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          >
                            <SelectValue placeholder="Select speed" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#0a0a0a] border-white/10">
                          {MOTION_SPEEDS.map((speed) => (
                            <SelectItem 
                              key={speed.value} 
                              value={speed.value}
                              className="text-white focus:bg-cyan-500/20 focus:text-cyan-300"
                            >
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
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
                data-testid="button-cancel-shot"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending} 
                className="bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-500 hover:opacity-90 text-white border-0"
                data-testid="button-save-shot"
              >
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
