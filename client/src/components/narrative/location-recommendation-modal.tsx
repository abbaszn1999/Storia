import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Check, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Location {
  id: string;
  name: string;
  description: string;
  details?: string;
  imageUrl?: string | null;
}

interface LocationRecommendation {
  name: string;
  description: string;
  atmosphere: string;
  timeOfDay: string;
  importanceScore: number;
}

interface LocationRecommendationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLocation: (location: Location) => void;
  existingLocations: Location[];
  script?: string;
  videoId: string;
  selectedModel?: string;
}


export function LocationRecommendationModal({
  open,
  onOpenChange,
  onAddLocation,
  existingLocations,
  script,
  videoId,
  selectedModel,
}: LocationRecommendationModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<LocationRecommendation[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open && script && recommendations.length === 0) {
      setIsAnalyzing(true);
      apiRequest('POST', '/api/narrative/locations/analyze', {
        videoId,
        script,
        model: selectedModel,
      })
        .then(res => res.json())
        .then(data => {
          if (data.locations && data.locations.length > 0) {
            setRecommendations(data.locations);
          } else {
            setRecommendations([]);
          }
        })
        .catch(err => {
          console.error('Failed to fetch location recommendations:', err);
          toast({
            title: "Error",
            description: "Failed to fetch location recommendations. Please try again.",
            variant: "destructive",
          });
          setRecommendations([]);
        })
        .finally(() => {
          setIsAnalyzing(false);
        });
    }
  }, [open, script, videoId, selectedModel, recommendations.length, toast]);

  const handleAddLocation = (recLocation: LocationRecommendation) => {
    const alreadyExists = existingLocations.some(l => l.name === recLocation.name);
    if (alreadyExists) {
      toast({
        title: "Already Added",
        description: `${recLocation.name} is already in your locations.`,
        variant: "destructive",
      });
      return;
    }

    const location: Location = {
      id: `loc-${Date.now()}-${Math.random()}`,
      name: recLocation.name,
      description: recLocation.description,
      details: recLocation.atmosphere,  // Map atmosphere to details field
      imageUrl: null,
    };

    onAddLocation(location);
    toast({
      title: "Location Added",
      description: `${recLocation.name} has been added to your locations.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Location Recommendations
          </DialogTitle>
          <DialogDescription>
            Based on your story script, here are suggested key locations
          </DialogDescription>
        </DialogHeader>

        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Analyzing your story...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">No locations found in the script.</p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {recommendations.map((recLocation, index) => {
              const isAdded = existingLocations.some(l => l.name === recLocation.name);
              return (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-base">{recLocation.name}</h4>
                          {recLocation.importanceScore && (
                            <Badge variant="secondary" className="ml-2">
                              ★ {recLocation.importanceScore}/10
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{recLocation.description}</p>
                        {recLocation.atmosphere && (
                          <div className="pt-2">
                            <Label className="text-xs font-medium text-muted-foreground">ATMOSPHERE</Label>
                            <p className="text-sm mt-1">{recLocation.atmosphere}</p>
                          </div>
                        )}
                        {recLocation.timeOfDay && recLocation.timeOfDay !== 'unspecified' && (
                          <div className="pt-2">
                            <Label className="text-xs font-medium text-muted-foreground">TIME OF DAY</Label>
                            <p className="text-sm mt-1 capitalize">{recLocation.timeOfDay}</p>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddLocation(recLocation)}
                        disabled={isAdded}
                        className={isAdded ? "" : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"}
                        data-testid={`button-add-recommended-${index}`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="mr-2 h-3 w-3" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-3 w-3" />
                            Add Location
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
