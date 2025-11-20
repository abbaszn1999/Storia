import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  conceptPrompt: z.string().min(10, "Concept prompt must be at least 10 characters"),
  videoCount: z.number().min(1).max(50),
  automationMode: z.enum(["manual", "auto"]),
  aspectRatio: z.string(),
  duration: z.number(),
  language: z.string(),
  artStyle: z.string(),
  tone: z.string(),
  genre: z.string(),
  targetAudience: z.string().optional(),
  scheduleStartDate: z.date().optional(),
  scheduleEndDate: z.date().optional(),
  selectedPlatforms: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

const platforms = [
  { id: "youtube", label: "YouTube" },
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
];

export default function ProductionCampaignCreate() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      conceptPrompt: "",
      videoCount: 10,
      automationMode: "manual",
      aspectRatio: "16:9",
      duration: 60,
      language: "en",
      artStyle: "Realistic",
      tone: "Educational",
      genre: "Educational",
      targetAudience: "",
      selectedPlatforms: [],
    },
  });

  const createCampaign = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/production-campaigns", data);
      return await res.json();
    },
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-campaigns"] });
      toast({
        title: "Campaign created",
        description: "Your production campaign has been created successfully.",
      });
      navigate(`/production/${campaign.id}/review`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createCampaign.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          Create Auto Production Campaign
        </h1>
        <p className="text-muted-foreground mt-2">
          Set up an automated video production campaign powered by AI
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card data-testid="card-campaign-basics">
            <CardHeader>
              <CardTitle>Campaign Basics</CardTitle>
              <CardDescription>Define your campaign name and concept</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Video Campaign" {...field} data-testid="input-campaign-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conceptPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Concept Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the overall theme and topics for your video series. The AI will generate unique video concepts based on this prompt."
                        rows={5}
                        {...field}
                        data-testid="textarea-concept-prompt"
                      />
                    </FormControl>
                    <FormDescription>
                      The AI will use this to generate {form.watch("videoCount")} unique video concepts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="videoCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Videos</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-video-count"
                        />
                      </FormControl>
                      <FormDescription>1-50 videos</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="automationMode"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel>Automation Mode</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Switch
                            checked={field.value === "auto"}
                            onCheckedChange={(checked) => field.onChange(checked ? "auto" : "manual")}
                            data-testid="switch-automation-mode"
                          />
                        </FormControl>
                        <span className="text-sm">{field.value === "auto" ? "Fully Automated" : "Manual Review"}</span>
                      </div>
                      <FormDescription>
                        {field.value === "auto" ? "Videos will be generated and published automatically" : "Review each video before publishing"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-video-settings">
            <CardHeader>
              <CardTitle>Video Settings</CardTitle>
              <CardDescription>Configure video format and style</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="aspectRatio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aspect Ratio</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-aspect-ratio">
                            <SelectValue placeholder="Select ratio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                          <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                          <SelectItem value="1:1">1:1 (Square)</SelectItem>
                          <SelectItem value="4:5">4:5 (Vertical)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger data-testid="select-duration">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="30">30 seconds</SelectItem>
                          <SelectItem value="60">60 seconds</SelectItem>
                          <SelectItem value="90">90 seconds</SelectItem>
                          <SelectItem value="120">2 minutes</SelectItem>
                          <SelectItem value="180">3 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-language">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="ar">Arabic</SelectItem>
                          <SelectItem value="zh">Chinese</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="artStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Art Style</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-art-style">
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Realistic">Realistic</SelectItem>
                          <SelectItem value="Cartoon">Cartoon</SelectItem>
                          <SelectItem value="Anime">Anime</SelectItem>
                          <SelectItem value="3D Animation">3D Animation</SelectItem>
                          <SelectItem value="Minimalist">Minimalist</SelectItem>
                          <SelectItem value="Watercolor">Watercolor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-tone">
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Educational">Educational</SelectItem>
                          <SelectItem value="Entertaining">Entertaining</SelectItem>
                          <SelectItem value="Inspirational">Inspirational</SelectItem>
                          <SelectItem value="Dramatic">Dramatic</SelectItem>
                          <SelectItem value="Humorous">Humorous</SelectItem>
                          <SelectItem value="Professional">Professional</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genre</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-genre">
                            <SelectValue placeholder="Select genre" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Educational">Educational</SelectItem>
                          <SelectItem value="Tutorial">Tutorial</SelectItem>
                          <SelectItem value="Storytelling">Storytelling</SelectItem>
                          <SelectItem value="Documentary">Documentary</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Entertainment">Entertainment</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Audience</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Tech enthusiasts, Young professionals" {...field} data-testid="input-target-audience" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-scheduling">
            <CardHeader>
              <CardTitle>Scheduling</CardTitle>
              <CardDescription>Set up automated publishing schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scheduleStartDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn("justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                              data-testid="button-schedule-start-date"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduleEndDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn("justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                              data-testid="button-schedule-end-date"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-platforms">
            <CardHeader>
              <CardTitle>Publishing Platforms</CardTitle>
              <CardDescription>Select where to publish your videos</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="selectedPlatforms"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-2 gap-4">
                      {platforms.map((platform) => (
                        <FormField
                          key={platform.id}
                          control={form.control}
                          name="selectedPlatforms"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(platform.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, platform.id])
                                      : field.onChange(field.value?.filter((value) => value !== platform.id));
                                  }}
                                  data-testid={`checkbox-platform-${platform.id}`}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{platform.label}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/production")} data-testid="button-cancel">
              Cancel
            </Button>
            <Button type="submit" disabled={createCampaign.isPending} data-testid="button-create-campaign">
              {createCampaign.isPending ? "Creating..." : "Create Campaign & Generate Concepts"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
