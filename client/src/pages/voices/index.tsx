import { useState } from "react";
import { Plus, Search, Mic, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Voice {
  id: string;
  name: string;
  description: string;
  type: "character" | "narrator";
  gender?: string;
  language: string;
  accent?: string;
}

export default function Voices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);

  const mockVoices: Voice[] = [
    {
      id: "1",
      name: "Sarah - Warm & Friendly",
      description: "Perfect for explainer videos and tutorials",
      type: "narrator",
      gender: "Female",
      language: "English (US)",
      accent: "American"
    },
    {
      id: "2",
      name: "Marcus - Deep & Authoritative",
      description: "Ideal for documentary narration",
      type: "narrator",
      gender: "Male",
      language: "English (UK)",
      accent: "British"
    },
    {
      id: "3",
      name: "Alex Morgan's Voice",
      description: "Character voice - Young entrepreneur",
      type: "character",
      gender: "Male",
      language: "English (US)",
    },
    {
      id: "4",
      name: "Elena - Professional",
      description: "Great for corporate and business content",
      type: "narrator",
      gender: "Female",
      language: "English (US)",
    },
  ];

  const filteredVoices = mockVoices.filter(voice =>
    voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    voice.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePlay = (id: string) => {
    setPlayingId(playingId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Voices</h1>
          <p className="text-muted-foreground mt-1">
            Manage character voices and narrator audio profiles
          </p>
        </div>
        <Button size="lg" className="gap-2" data-testid="button-create-voice">
          <Plus className="h-4 w-4" />
          New Voice
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search voices..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVoices.map((voice) => (
          <Card key={voice.id} className="hover-elevate" data-testid={`voice-card-${voice.id}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mic className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{voice.name}</h3>
                    <Badge variant={voice.type === "character" ? "default" : "secondary"} className="text-xs mt-1">
                      {voice.type === "character" ? "Character" : "Narrator"}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => togglePlay(voice.id)}
                  data-testid={`button-play-${voice.id}`}
                >
                  {playingId === voice.id ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mb-3">{voice.description}</p>

              <div className="space-y-1 text-xs text-muted-foreground">
                {voice.gender && <div>Gender: {voice.gender}</div>}
                <div>Language: {voice.language}</div>
                {voice.accent && <div>Accent: {voice.accent}</div>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVoices.length === 0 && (
        <div className="text-center py-12">
          <Mic className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No voices found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or create a new voice
          </p>
        </div>
      )}
    </div>
  );
}
