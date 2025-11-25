import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Package, 
  Upload, 
  Target, 
  Sparkles,
  DollarSign,
  Users,
  Tag,
  Plus,
  X,
  Image as ImageIcon,
  Video
} from "lucide-react";

interface ProductSetupTabProps {
  onNext: () => void;
}

const PRODUCT_CATEGORIES = [
  "Fashion & Apparel",
  "Beauty & Skincare",
  "Electronics",
  "Home & Living",
  "Food & Beverage",
  "Health & Wellness",
  "Sports & Fitness",
  "Jewelry & Accessories",
  "Toys & Games",
  "Pet Products"
];

const TONE_OPTIONS = [
  { id: "luxury", label: "Luxury", description: "Premium, elegant, exclusive" },
  { id: "playful", label: "Fun & Playful", description: "Energetic, youthful, exciting" },
  { id: "professional", label: "Professional", description: "Clean, trustworthy, reliable" },
  { id: "trendy", label: "Trendy", description: "Gen-Z style, viral-ready, bold" },
  { id: "minimal", label: "Minimalist", description: "Simple, sophisticated, modern" },
  { id: "organic", label: "Natural", description: "Eco-friendly, authentic, warm" }
];

const TARGET_DEMOGRAPHICS = [
  "Gen Z (18-24)",
  "Millennials (25-40)",
  "Gen X (41-56)",
  "Parents",
  "Students",
  "Professionals",
  "Fitness Enthusiasts",
  "Beauty Lovers",
  "Tech Savvy",
  "Budget Conscious",
  "Luxury Seekers"
];

export function ProductSetupTab({ onNext }: ProductSetupTabProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Product Details */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name</Label>
                <Input 
                  id="product-name" 
                  placeholder="Enter your product name"
                  data-testid="input-product-name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product-price">Price</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="product-price" 
                      placeholder="0.00"
                      className="pl-9"
                      data-testid="input-product-price"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-category">Category</Label>
                  <select 
                    id="product-category"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    data-testid="select-product-category"
                  >
                    <option value="">Select category</option>
                    {PRODUCT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-description">Short Description</Label>
                <Textarea 
                  id="product-description"
                  placeholder="Briefly describe your product in 1-2 sentences..."
                  className="min-h-[80px] resize-none"
                  data-testid="input-product-description"
                />
              </div>
            </CardContent>
          </Card>

          {/* Value Proposition */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Value Proposition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Key Selling Points</Label>
                <p className="text-xs text-muted-foreground">What makes your product special?</p>
                <div className="space-y-2">
                  {[1, 2, 3].map((num) => (
                    <div key={num} className="flex items-center gap-2">
                      <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center shrink-0">
                        {num}
                      </Badge>
                      <Input 
                        placeholder={`Selling point ${num}...`}
                        data-testid={`input-selling-point-${num}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="problem-solved">Problem It Solves</Label>
                <Textarea 
                  id="problem-solved"
                  placeholder="What pain point does your product address?"
                  className="min-h-[60px] resize-none"
                  data-testid="input-problem-solved"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="differentiator">What Makes It Different</Label>
                <Textarea 
                  id="differentiator"
                  placeholder="How does it stand out from competitors?"
                  className="min-h-[60px] resize-none"
                  data-testid="input-differentiator"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Media & Targeting */}
        <div className="space-y-6">
          {/* Product Media */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                Product Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 cursor-pointer hover-elevate transition-colors"
                  data-testid="upload-product-image-1"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Main Image</span>
                </div>
                <div 
                  className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 cursor-pointer hover-elevate transition-colors"
                  data-testid="upload-product-image-2"
                >
                  <Plus className="h-8 w-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add More</span>
                </div>
              </div>

              <div 
                className="h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center gap-3 cursor-pointer hover-elevate transition-colors"
                data-testid="upload-product-video"
              >
                <Video className="h-6 w-6 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Upload existing product video</p>
                  <p className="text-xs text-muted-foreground/70">Optional - we can generate visuals from images</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Target Audience */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Target Audience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Demographics</Label>
                <div className="flex flex-wrap gap-2">
                  {TARGET_DEMOGRAPHICS.map((demo) => (
                    <Badge 
                      key={demo} 
                      variant="outline" 
                      className="cursor-pointer hover-elevate"
                      data-testid={`badge-demographic-${demo.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    >
                      {demo}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience-interests">Interests & Behaviors</Label>
                <Textarea 
                  id="audience-interests"
                  placeholder="What does your ideal customer care about?"
                  className="min-h-[60px] resize-none"
                  data-testid="input-audience-interests"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tone & Style */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Brand Tone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {TONE_OPTIONS.map((tone) => (
                  <div
                    key={tone.id}
                    className="p-3 rounded-lg border border-border cursor-pointer hover-elevate transition-all"
                    data-testid={`button-tone-${tone.id}`}
                  >
                    <p className="text-sm font-medium">{tone.label}</p>
                    <p className="text-xs text-muted-foreground">{tone.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={onNext} size="lg" data-testid="button-continue-hook">
          Continue to Hook & Format
        </Button>
      </div>
    </div>
  );
}
