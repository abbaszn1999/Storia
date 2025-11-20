import { Card, CardContent } from "@/components/ui/card";
import { Image, ArrowRightLeft } from "lucide-react";

interface Step3NarrativeModeProps {
  value: "image-reference" | "start-end-frame";
  onChange: (value: "image-reference" | "start-end-frame") => void;
}

export function Step3NarrativeMode({ value, onChange }: Step3NarrativeModeProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Select Narrative Mode</h2>
        <p className="text-muted-foreground mt-2">
          Choose how shots will be generated and connected
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card
          className={`cursor-pointer transition-all hover-elevate ${
            value === "image-reference" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => onChange("image-reference")}
          data-testid="card-mode-image-reference"
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Image className="h-16 w-16 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Image-Reference</h3>
            <p className="text-muted-foreground text-center text-sm">
              Each shot has a single reference image
            </p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover-elevate ${
            value === "start-end-frame" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => onChange("start-end-frame")}
          data-testid="card-mode-start-end-frame"
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ArrowRightLeft className="h-16 w-16 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Start-End Frame</h3>
            <p className="text-muted-foreground text-center text-sm">
              Shots connect with seamless transitions using start and end frames
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
