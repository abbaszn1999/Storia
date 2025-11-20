import { Card, CardContent } from "@/components/ui/card";
import { Video, FileText } from "lucide-react";

interface Step1TypeSelectionProps {
  value: "video" | "story";
  onChange: (value: "video" | "story") => void;
}

export function Step1TypeSelection({ value, onChange }: Step1TypeSelectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Choose Content Type</h2>
        <p className="text-muted-foreground mt-2">
          Select whether you want to create videos or stories
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card
          className={`cursor-pointer transition-all hover-elevate ${
            value === "video" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => onChange("video")}
          data-testid="card-type-video"
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-16 w-16 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Video</h3>
            <p className="text-muted-foreground text-center text-sm">
              Create AI-powered narrative videos with scenes and shots
            </p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover-elevate opacity-50 cursor-not-allowed`}
          data-testid="card-type-story"
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-muted-foreground">Story</h3>
            <p className="text-muted-foreground text-center text-sm">
              Coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
