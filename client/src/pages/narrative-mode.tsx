import { useState } from "react";
import { ArrowLeft, Home } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NarrativeWorkflow } from "@/components/narrative-workflow";
import { Badge } from "@/components/ui/badge";

export default function NarrativeMode() {
  const [videoTitle] = useState("Untitled Project");

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Left: Navigation & Branding */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <img src="/storia-logo.png" alt="Storia" className="h-8 w-8" />
                <span className="text-xl font-display font-semibold">Storia</span>
              </div>
              
              <div className="h-8 w-px bg-border" />
              
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild data-testid="button-back">
                  <Link href="/videos">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-semibold truncate">{videoTitle}</h1>
                    <Badge variant="secondary" className="text-xs">
                      Narrative Mode
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Story-driven video creation
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href="/">
                  <Home className="h-4 w-4" />
                </Link>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          <NarrativeWorkflow />
        </div>
      </main>
    </div>
  );
}
