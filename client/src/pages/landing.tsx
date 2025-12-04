import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Play, Sparkles, Video, Wand2 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/storia-logo.png"
              alt="Storia"
              className="h-8 w-8"
            />
            <span className="text-xl font-bold">Storia</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/auth/sign-in">
              <Button data-testid="button-login">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Create AI-Powered Videos & Stories
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Transform your ideas into stunning videos with AI. Generate scripts, create storyboards, and produce professional content in minutes.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="gap-2" data-testid="button-get-started">
              <Play className="h-5 w-5" />
              Get Started
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="hover-elevate">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Wand2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Script Writing</h3>
              <p className="text-muted-foreground">
                Generate compelling scripts and narratives with advanced AI technology.
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Storyboards</h3>
              <p className="text-muted-foreground">
                Create visual storyboards automatically from your scripts.
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Video Generation</h3>
              <p className="text-muted-foreground">
                Produce high-quality videos with AI-generated scenes and animations.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>Create stunning AI-powered content with Storia</p>
        </div>
      </footer>
    </div>
  );
}
