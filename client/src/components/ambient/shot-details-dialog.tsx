import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, FileText, Search } from "lucide-react";
import type { Scene, Shot } from "@shared/schema";

interface ShotDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
}

export function ShotDetailsDialog({ open, onOpenChange, scenes, shots }: ShotDetailsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const totalDuration = scenes.reduce((total, scene) => total + (scene.duration || 0), 0);

  // Filter scenes and shots based on search query
  const filteredScenes = useMemo(() => {
    if (!searchQuery.trim()) {
      return scenes;
    }

    const query = searchQuery.toLowerCase();
    
    return scenes.filter((scene) => {
      const sceneShots = shots[scene.id] || [];
      
      // Check if scene title or description matches
      const sceneMatches = 
        scene.title.toLowerCase().includes(query) ||
        scene.description?.toLowerCase().includes(query);
      
      // Check if any shot narration matches
      const shotMatches = sceneShots.some((shot) => 
        shot.description?.toLowerCase().includes(query)
      );
      
      return sceneMatches || shotMatches;
    });
  }, [scenes, shots, searchQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Shot-by-Shot Details
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            Complete breakdown of scenes and shots with narration and timing
            <div className="flex items-center gap-1 ml-auto">
              <Clock className="h-3 w-3" />
              <span>{totalDuration}s total</span>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        {/* Search Input */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search narration text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-narration"
          />
        </div>
        
        <div className="mt-4 space-y-6">
          {scenes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No scenes available</p>
            </div>
          ) : filteredScenes.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No results found for "{searchQuery}"</p>
            </div>
          ) : (
            filteredScenes.map((scene) => {
              const sceneShots = shots[scene.id] || [];
              
              return (
                <div key={scene.id} className="space-y-4 pb-6 border-b last:border-0" data-testid={`scene-${scene.id}`}>
                  {/* Scene Header */}
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary" className="shrink-0 mt-0.5">
                      Scene {scene.sceneNumber}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base mb-1">{scene.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {scene.description}
                      </p>
                      {scene.duration && (
                        <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{scene.duration}s duration</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shots */}
                  {sceneShots.length > 0 && (
                    <div className="space-y-4 pl-6 border-l-2 border-primary/30">
                      {sceneShots.map((shot) => (
                        <div 
                          key={shot.id} 
                          className="space-y-2 p-3 rounded-lg bg-muted/30 border"
                          data-testid={`shot-${shot.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs shrink-0">
                              Shot {shot.shotNumber}
                            </Badge>
                            {shot.duration && (
                              <div className="flex items-center gap-1 ml-auto text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{shot.duration}s</span>
                              </div>
                            )}
                          </div>
                          
                          {shot.description && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">Narration:</p>
                              <p className="text-sm leading-relaxed bg-background p-3 rounded border-l-2 border-primary/40">
                                {shot.description}
                              </p>
                            </div>
                          )}
                          
                          {shot.soundEffects && (
                            <p className="text-xs text-muted-foreground italic">
                              SFX: {shot.soundEffects}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
