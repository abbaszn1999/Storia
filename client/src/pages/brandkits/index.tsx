import { useState } from "react";
import { Plus, Search, Palette, X, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newBrandKit, setNewBrandKit] = useState({
    name: "",
    description: "",
    colors: [] as string[],
    fonts: [] as string[],
    guidelines: "",
  });
  const [currentColor, setCurrentColor] = useState("#8B3FFF");
  const [currentFont, setCurrentFont] = useState("");

  const mockBrandKits: BrandKit[] = [
    {
      id: "1",
      name: "Storia Official",
      description: "Official Storia brand colors and typography",
      colors: ["#8B3FFF", "#C944E6", "#22D3EE"],
      fonts: ["Plus Jakarta Sans", "Inter"],
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

  const generateRandomColor = () => {
    const colors = [
      "#8B3FFF", "#C944E6", "#22D3EE", "#FF3F8E", 
      "#6D5BFF", "#3B82F6", "#10B981", "#F59E0B",
      "#EC4899", "#8B5CF6", "#14B8A6", "#F97316"
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return randomColor;
  };

  const handleAddColor = () => {
    if (currentColor && !newBrandKit.colors.includes(currentColor.toUpperCase())) {
      setNewBrandKit(prev => ({
        ...prev,
        colors: [...prev.colors, currentColor.toUpperCase()]
      }));
      // Generate a new color suggestion for the next one
      setCurrentColor(generateRandomColor());
    }
  };

  const handleRemoveColor = (color: string) => {
    setNewBrandKit(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c !== color)
    }));
  };

  const handleAddFont = () => {
    if (currentFont.trim() && !newBrandKit.fonts.includes(currentFont.trim())) {
      setNewBrandKit(prev => ({
        ...prev,
        fonts: [...prev.fonts, currentFont.trim()]
      }));
      setCurrentFont("");
    }
  };

  const handleRemoveFont = (font: string) => {
    setNewBrandKit(prev => ({
      ...prev,
      fonts: prev.fonts.filter(f => f !== font)
    }));
  };

  const handleCreateBrandKit = () => {
    console.log("Creating brand kit:", newBrandKit);
    // TODO: Implement API call to create brand kit
    setIsCreateDialogOpen(false);
    setNewBrandKit({
      name: "",
      description: "",
      colors: [],
      fonts: [],
      guidelines: "",
    });
    setCurrentColor("#8B3FFF");
    setCurrentFont("");
  };

  const isFormValid = newBrandKit.name.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Brand Kits</h1>
          <p className="text-muted-foreground mt-1">
            Define and manage your brand colors, fonts, and logos
          </p>
        </div>
        <Button 
          size="lg" 
          className="gap-2" 
          onClick={() => setIsCreateDialogOpen(true)}
          data-testid="button-create-brandkit"
        >
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

      {/* Create Brand Kit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Brand Kit</DialogTitle>
            <DialogDescription>
              Define your brand colors, typography, and guidelines to maintain consistency across your videos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="brandkit-name">Brand Kit Name *</Label>
              <Input
                id="brandkit-name"
                placeholder="e.g., My Company Brand"
                value={newBrandKit.name}
                onChange={(e) => setNewBrandKit(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-brandkit-name"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="brandkit-description">Description</Label>
              <Input
                id="brandkit-description"
                placeholder="Brief description of this brand kit"
                value={newBrandKit.description}
                onChange={(e) => setNewBrandKit(prev => ({ ...prev, description: e.target.value }))}
                data-testid="input-brandkit-description"
              />
            </div>

            {/* Colors */}
            <div className="space-y-3">
              <Label>Brand Colors</Label>
              <div className="flex gap-2">
                <div className="flex-1 flex gap-2">
                  <Input
                    type="color"
                    value={currentColor}
                    onChange={(e) => setCurrentColor(e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                    data-testid="input-color-picker"
                  />
                  <Input
                    type="text"
                    value={currentColor}
                    onChange={(e) => setCurrentColor(e.target.value.toUpperCase())}
                    placeholder="#000000"
                    className="flex-1"
                    data-testid="input-color-hex"
                  />
                </div>
                <Button 
                  onClick={handleAddColor}
                  variant="secondary"
                  data-testid="button-add-color"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Quick Color Presets */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Quick add:</p>
                <div className="flex flex-wrap gap-1.5">
                  {["#8B3FFF", "#C944E6", "#22D3EE", "#FF3F8E", "#6D5BFF", "#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#14B8A6", "#F97316"].map((presetColor, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentColor(presetColor)}
                      className="h-8 w-8 rounded-md border-2 border-border hover-elevate cursor-pointer transition-all"
                      style={{ backgroundColor: presetColor }}
                      title={presetColor}
                      data-testid={`preset-color-${idx}`}
                    />
                  ))}
                </div>
              </div>

              {newBrandKit.colors.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Your colors ({newBrandKit.colors.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {newBrandKit.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="group relative"
                        data-testid={`color-swatch-${idx}`}
                      >
                        <div
                          className="h-14 w-14 rounded-lg border-2 border-border hover-elevate cursor-pointer"
                          style={{ backgroundColor: color }}
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveColor(color)}
                          data-testid={`button-remove-color-${idx}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <p className="text-xs text-center mt-1 text-muted-foreground font-mono">{color}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fonts */}
            <div className="space-y-3">
              <Label>Brand Fonts</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={currentFont}
                  onChange={(e) => setCurrentFont(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFont()}
                  placeholder="e.g., Inter, Roboto, Playfair Display"
                  className="flex-1"
                  data-testid="input-font-name"
                />
                <Button 
                  onClick={handleAddFont}
                  variant="secondary"
                  data-testid="button-add-font"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {newBrandKit.fonts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newBrandKit.fonts.map((font, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="gap-1 pr-1"
                      data-testid={`font-badge-${idx}`}
                    >
                      <Type className="h-3 w-3" />
                      {font}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-4 w-4 ml-1 hover:bg-destructive/20"
                        onClick={() => handleRemoveFont(font)}
                        data-testid={`button-remove-font-${idx}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Guidelines */}
            <div className="space-y-2">
              <Label htmlFor="brandkit-guidelines">Brand Guidelines</Label>
              <Textarea
                id="brandkit-guidelines"
                placeholder="Add brand voice, tone, messaging guidelines, or other notes..."
                value={newBrandKit.guidelines}
                onChange={(e) => setNewBrandKit(prev => ({ ...prev, guidelines: e.target.value }))}
                rows={4}
                data-testid="textarea-guidelines"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBrandKit}
              disabled={!isFormValid}
              data-testid="button-create"
            >
              Create Brand Kit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
