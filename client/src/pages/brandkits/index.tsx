import { useState } from "react";
import { Plus, Search, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BrandKit {
  id: string;
  name: string;
  description: string;
  colors: string[];
  fonts?: string[];
  logoUrl?: string;
}

export default function BrandKits() {
  const [searchQuery, setSearchQuery] = useState("");

  const mockBrandKits: BrandKit[] = [
    {
      id: "1",
      name: "Storia Official",
      description: "Official Storia brand colors and typography",
      colors: ["#158F65", "#8B5CF6", "#10B981"],
      fonts: ["Inter", "Outfit"],
    },
    {
      id: "2",
      name: "Tech Startup",
      description: "Modern tech company branding",
      colors: ["#3B82F6", "#1E40AF", "#60A5FA"],
      fonts: ["Roboto", "Montserrat"],
    },
    {
      id: "3",
      name: "Creative Agency",
      description: "Vibrant creative brand kit",
      colors: ["#EC4899", "#F59E0B", "#8B5CF6"],
      fonts: ["Poppins", "Playfair Display"],
    },
  ];

  const filteredBrandKits = mockBrandKits.filter(kit =>
    kit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kit.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Brand Kits</h1>
          <p className="text-muted-foreground mt-1">
            Define and manage your brand colors, fonts, and logos
          </p>
        </div>
        <Button size="lg" className="gap-2" data-testid="button-create-brandkit">
          <Plus className="h-4 w-4" />
          New Brand Kit
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search brand kits..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBrandKits.map((kit) => (
          <Card key={kit.id} className="hover-elevate cursor-pointer" data-testid={`brandkit-card-${kit.id}`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1">{kit.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{kit.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Colors</p>
                  <div className="flex gap-1.5">
                    {kit.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="h-8 w-8 rounded-md border border-border"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {kit.fonts && kit.fonts.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Fonts</p>
                    <div className="flex gap-2 flex-wrap">
                      {kit.fonts.map((font, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {font}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBrandKits.length === 0 && (
        <div className="text-center py-12">
          <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No brand kits found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or create a new brand kit
          </p>
        </div>
      )}
    </div>
  );
}
