import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Film, Link as LinkIcon } from "lucide-react";

interface NarrativeModeSelectorProps {
  onSelectMode: (mode: "image-reference" | "start-end") => void;
}

export function NarrativeModeSelector({ onSelectMode }: NarrativeModeSelectorProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-storia bg-clip-text text-transparent">
          Choose Your Workflow
        </h2>
        <p className="text-muted-foreground text-lg">
          Select how you want to generate your video shots
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Image-Reference Mode */}
        <Card className="hover-elevate active-elevate-2 border-2 transition-all">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-lg bg-primary/10">
                <Film className="h-8 w-8 text-primary" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted">
                Classic
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">Image-Reference Mode</h3>
              <p className="text-muted-foreground leading-relaxed">
                Each shot generates a single reference image. AI creates smooth video from that frame with camera movements and transitions.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">1 frame per shot</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">Faster generation</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">Independent shots</span>
              </div>
            </div>

            <Button className="w-full" onClick={() => onSelectMode("image-reference")} data-testid="button-select-image-reference">
              Select Image-Reference Mode
            </Button>
          </CardContent>
        </Card>

        {/* Start-End Frame Mode */}
        <Card className="hover-elevate active-elevate-2 border-2 border-primary/50 transition-all relative overflow-hidden">
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium bg-gradient-storia text-white">
            Advanced
          </div>
          
          <CardContent className="p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-lg bg-gradient-storia">
                <LinkIcon className="h-8 w-8 text-white" />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">Start-End Frame Mode</h3>
              <p className="text-muted-foreground leading-relaxed">
                Connected shots create seamless transitions. AI proposes which shots should flow together, creating cinematic continuity.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">Smart frame pairing</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">Seamless continuity</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">AI-suggested connections</span>
              </div>
            </div>

            <Button className="w-full bg-gradient-storia hover:opacity-90" onClick={() => onSelectMode("start-end")} data-testid="button-select-start-end">
              Select Start-End Mode
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          You can't change the mode once workflow starts. Choose carefully!
        </p>
      </div>
    </div>
  );
}
