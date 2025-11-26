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
import type { Scene } from "@shared/schema";

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Segment" : "Add Segment"}</DialogTitle>
          <DialogDescription>
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
                  <FormLabel>Segment Number</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
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
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Segment title (e.g., Morning Mist)" data-testid="input-scene-title" />
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
                  <FormLabel>Atmosphere Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the visual atmosphere of this segment..."
                      className="resize-none"
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
                  <FormLabel>Duration (seconds)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={10}
                      max={120}
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
                data-testid="button-cancel-scene"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-save-scene">
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
