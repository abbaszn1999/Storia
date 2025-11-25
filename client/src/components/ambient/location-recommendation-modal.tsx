import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Check, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Location {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
}

interface LocationRecommendationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLocation: (location: Location) => void;
  existingLocations: Location[];
}

const MOCK_RECOMMENDED_LOCATIONS = [
  {
    name: "Downtown Coffee Shop",
    description: "A cozy urban cafe with large windows overlooking the busy street, warm lighting and wooden furniture",
    details: "Modern industrial interior with exposed brick walls, hanging Edison bulbs, espresso machine sounds, and comfortable booth seating",
  },
  {
    name: "City Park at Sunset",
    description: "A peaceful urban park with tree-lined walking paths and a central fountain during golden hour",
    details: "Mature oak trees providing dappled shade, well-maintained grass, wooden benches, flower beds, and warm sunset lighting casting long shadows",
  },
  {
    name: "Underground Parking Garage",
    description: "A dimly lit concrete parking structure with fluorescent lights and painted parking spaces",
    details: "Cold industrial atmosphere, concrete pillars, yellow parking lines, echoing sounds, emergency exit signs, and stark overhead lighting",
  },
];

export function LocationRecommendationModal({
  open,
  onOpenChange,
  onAddLocation,
  existingLocations,
}: LocationRecommendationModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<typeof MOCK_RECOMMENDED_LOCATIONS>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open && recommendations.length === 0) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setRecommendations(MOCK_RECOMMENDED_LOCATIONS);
        setIsAnalyzing(false);
      }, 2000);
    }
  }, [open, recommendations.length]);

  const handleAddLocation = (recLocation: typeof MOCK_RECOMMENDED_LOCATIONS[0]) => {
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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
        ) : (
          <div className="space-y-4 mt-4">
            {recommendations.map((recLocation, index) => {
              const isAdded = existingLocations.some(l => l.name === recLocation.name);
              return (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <h4 className="font-semibold text-base">{recLocation.name}</h4>
                        <p className="text-sm text-muted-foreground">{recLocation.description}</p>
                        <div className="pt-2">
                          <Label className="text-xs font-medium text-muted-foreground">VISUAL DETAILS</Label>
                          <p className="text-sm mt-1">{recLocation.details}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddLocation(recLocation)}
                        disabled={isAdded}
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
