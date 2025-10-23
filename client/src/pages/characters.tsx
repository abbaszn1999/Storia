import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CharacterCard } from "@/components/character-card";

export default function Characters() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Characters</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage AI characters for your videos
          </p>
        </div>
        <Button size="lg" className="gap-2" data-testid="button-create-character">
          <Plus className="h-4 w-4" />
          New Character
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search characters..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[
          { name: "Alex Morgan", description: "A young entrepreneur with a passion for technology", hasVoice: true },
          { name: "Sarah Chen", description: "Creative director and visual storyteller", hasVoice: true },
          { name: "Marcus Williams", description: "Professional narrator with warm tone", hasVoice: false },
          { name: "Dr. Elena Rodriguez", description: "Scientific expert and educator", hasVoice: true },
          { name: "Jamie Taylor", description: "Energetic host for product demos", hasVoice: false },
          { name: "Prof. David Kim", description: "Academic lecturer and researcher", hasVoice: true },
        ].map((char, i) => (
          <CharacterCard
            key={i}
            id={String(i)}
            name={char.name}
            description={char.description}
            hasVoice={char.hasVoice}
          />
        ))}
      </div>
    </div>
  );
}
