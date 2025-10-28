import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Sparkles, Edit, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Scene, Shot } from "@shared/schema";

interface SceneBreakdownProps {
  videoId: string;
  script: string;
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  onScenesGenerated: (scenes: Scene[], shots: { [sceneId: string]: Shot[] }) => void;
  onNext: () => void;
}

export function SceneBreakdown({ videoId, script, scenes, shots, onScenesGenerated, onNext }: SceneBreakdownProps) {
  const { toast } = useToast();

  const breakdownMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/narrative/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          script,
        }),
      });
      if (!response.ok) throw new Error('Failed to generate breakdown');
      return response.json() as Promise<{ scenes: Scene[]; shots: { [sceneId: string]: Shot[] } }>;
    },
    onSuccess: (data) => {
      onScenesGenerated(data.scenes, data.shots);
      toast({
        title: "Breakdown Complete",
        description: `Generated ${data.scenes.length} scenes with shots.`,
      });
    },
    onError: () => {
      toast({
        title: "Breakdown Failed",
        description: "Failed to analyze script. Please try again.",
        variant: "destructive",
      });
    },
  });

  const hasBreakdown = scenes.length > 0;

  return (
    <div className="space-y-6">
      {!hasBreakdown ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-6">
            AI will analyze your script and break it down into scenes and shots.
          </p>
          <Button
            size="lg"
            onClick={() => breakdownMutation.mutate()}
            disabled={breakdownMutation.isPending}
            data-testid="button-generate-breakdown"
          >
            {breakdownMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Script...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Scene Breakdown
              </>
            )}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Scene Breakdown</h3>
              <p className="text-sm text-muted-foreground">
                {scenes.length} scenes with {Object.values(shots).flat().length} total shots
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => breakdownMutation.mutate()}
              disabled={breakdownMutation.isPending}
              data-testid="button-regenerate-breakdown"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {scenes.map((scene, sceneIndex) => {
              const sceneShots = shots[scene.id] || [];
              return (
                <AccordionItem key={scene.id} value={scene.id}>
                  <Card>
                    <AccordionTrigger className="px-6 hover:no-underline">
                      <div className="flex items-center gap-4 text-left">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="font-semibold text-primary">{sceneIndex + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold">{scene.title}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {scene.location} · {scene.timeOfDay}
                          </p>
                        </div>
                        <Badge variant="secondary" data-testid={`badge-scene-${scene.id}-shots`}>
                          {sceneShots.length} shots
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <CardContent className="space-y-4 pt-4">
                        <p className="text-sm">{scene.description}</p>
                        
                        <div className="space-y-2">
                          <h5 className="text-sm font-semibold">Shots</h5>
                          {sceneShots.map((shot, shotIndex) => (
                            <Card key={shot.id}>
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                                    <span className="text-sm font-medium">{shotIndex + 1}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-xs">
                                        {shot.shotType}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {shot.cameraMovement}
                                      </Badge>
                                    </div>
                                    <p className="text-sm">{shot.description}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              );
            })}
          </Accordion>

          <div className="flex justify-end">
            <Button onClick={onNext} data-testid="button-next">
              Continue to World & Cast
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
