import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { NarrativeWorkflow } from "@/components/narrative-workflow";

export default function NarrativeMode() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild data-testid="button-back">
          <Link href="/videos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Narrative Video Mode</h1>
          <p className="text-muted-foreground mt-1">
            Create story-driven videos from script to final export
          </p>
        </div>
      </div>

      <NarrativeWorkflow />
    </div>
  );
}
