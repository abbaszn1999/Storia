import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Lightbulb, RefreshCw, AlertCircle, Music } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { STORY_TEMPLATES, type StoryTemplate } from "@/constants/story-templates";

export default function Stories() {

  const getTemplateIcon = (templateId: string) => {
    switch (templateId) {
      case 'problem-solution':
        return Lightbulb;
      case 'tease-reveal':
        return Sparkles;
      case 'before-after':
        return RefreshCw;
      case 'myth-busting':
        return AlertCircle;
      case 'asmr-sensory':
        return Music;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild data-testid="button-back">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              
              <div className="h-6 w-px bg-border" />
              
              <h1 className="text-sm font-semibold">Stories</h1>
            </div>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Create a Story
            </h1>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose a proven template to create engaging short-form videos in minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {STORY_TEMPLATES.map((template) => {
              const Icon = getTemplateIcon(template.id);
              
              return (
                <Link href={`/stories/create/${template.id}`} key={template.id}>
                  <Card className="hover-elevate overflow-hidden cursor-pointer group" data-testid={`card-template-${template.id}`}>
                    {/* Gradient Header */}
                    <div className={`h-32 bg-gradient-to-br ${template.iconColor} relative flex items-center justify-center`}>
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                      <Icon className="h-16 w-16 text-white relative z-10" />
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {template.description}
                      </p>

                      {template.structure && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Structure
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {template.structure.map((step, index) => (
                              <span
                                key={index}
                                className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground"
                              >
                                {index + 1}. {step}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button 
                        className="w-full mt-4" 
                        variant="outline"
                        data-testid={`button-select-${template.id}`}
                      >
                        Select Template
                      </Button>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
