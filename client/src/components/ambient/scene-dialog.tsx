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
import { Loader2 } from "lucide-react";
import type { Scene } from "@/types/storyboard";

const sceneFormSchema = z.object({
  sceneNumber: z.number().min(1),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  duration: z.number().min(10).max(120).optional(),
});

type SceneFormValues = z.infer<typeof sceneFormSchema>;

interface SceneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scene?: Scene;
  videoId: string;
  sceneCount: number;
  onSubmit: (data: SceneFormValues) => Promise<void>;
  isPending: boolean;
}

export function SceneDialog({
  open,
  onOpenChange,
  scene,
  videoId,
  sceneCount,
  onSubmit,
  isPending,
}: SceneDialogProps) {
  const isEdit = !!scene;

  const form = useForm<SceneFormValues>({
    resolver: zodResolver(sceneFormSchema),
    defaultValues: {
      sceneNumber: scene?.sceneNumber ?? sceneCount + 1,
      title: scene?.title ?? "",
      description: scene?.description ?? "",
      duration: scene?.duration ?? 45,
    },
  });

  useEffect(() => {
    if (scene) {
      form.reset({
        sceneNumber: scene.sceneNumber,
        title: scene.title,
        description: scene.description ?? "",
        duration: scene.duration ?? 45,
      });
    } else {
      form.reset({
        sceneNumber: sceneCount + 1,
        title: "",
        description: "",
        duration: 45,
      });
    }
  }, [scene, sceneCount, form]);

  const handleSubmit = async (data: SceneFormValues) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#0a0a0a] border-white/[0.06] text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              {isEdit ? "Edit Segment" : "Add Segment"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {isEdit ? "Update segment details" : "Create a new visual segment for your ambient video"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sceneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Segment Number</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-500/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      data-testid="input-scene-number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Title</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Segment title (e.g., Morning Mist)" 
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-500/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      data-testid="input-scene-title" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Atmosphere Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the visual atmosphere of this segment..."
                      className="resize-none bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-500/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      rows={3}
                      data-testid="input-scene-description"
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
                    <Input
                      type="number"
                      min={10}
                      max={120}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-500/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      data-testid="input-scene-duration"
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
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
                data-testid="button-cancel-scene"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending} 
                className="bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-500 hover:opacity-90 text-white border-0"
                data-testid="button-save-scene"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{isEdit ? "Update" : "Create"} Segment</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
