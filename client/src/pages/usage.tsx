import React, { useState, useMemo, useEffect } from "react";
import { useWorkspace } from "@/contexts/workspace-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, CreditCard, Zap, TrendingUp, ArrowUpRight, Calendar, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { AmbientBackground } from "@/components/story-studio/shared/AmbientBackground";

// --- Types ---

type UsageType = "video" | "story" | "assets";
type UsageMode = 
  | "ambient" 
  | "problem-solution" 
  | "before-after" 
  | "myth-busting" 
  | "tease-reveal" 
  | "asmr"
  | "character"
  | "location";

interface ModelUsage {
  id: string;
  date: string;
  time: string;
  type: UsageType;
  mode: UsageMode;
  modelName: string;
  provider: string;
  cost: number;
}

const MOCK_USAGE_DATA: ModelUsage[] = [
  {
    id: "1",
    date: "2026-02-12",
    time: "14:23",
    type: "video",
    mode: "ambient",
    modelName: "GPT-5 Nano",
    provider: "OpenAI",
    cost: 0.0045,
  },
  {
    id: "2",
    date: "2026-02-12",
    time: "14:24",
    type: "video",
    mode: "ambient",
    modelName: "Sora 2",
    provider: "OpenAI",
    cost: 2.40,
  },
  {
    id: "3",
    date: "2026-02-12",
    time: "13:15",
    type: "story",
    mode: "problem-solution",
    modelName: "Gemini 2.5 Flash",
    provider: "Gemini",
    cost: 0.0032,
  },
  {
    id: "4",
    date: "2026-02-12",
    time: "13:16",
    type: "story",
    mode: "problem-solution",
    modelName: "Nano Banana",
    provider: "Runware",
    cost: 0.15,
  },
  {
    id: "5",
    date: "2026-02-11",
    time: "16:42",
    type: "assets",
    mode: "character",
    modelName: "Runway Gen-4 Image",
    provider: "Runware",
    cost: 0.25,
  },
  {
    id: "6",
    date: "2026-02-11",
    time: "15:30",
    type: "assets",
    mode: "location",
    modelName: "OpenAI GPT Image 1.5",
    provider: "Runware",
    cost: 0.18,
  },
  {
    id: "7",
    date: "2026-02-11",
    time: "10:05",
    type: "video",
    mode: "ambient",
    modelName: "KlingAI v1.6",
    provider: "KlingAI",
    cost: 1.80,
  },
  {
    id: "8",
    date: "2026-02-10",
    time: "17:20",
    type: "story",
    mode: "before-after",
    modelName: "GPT-4o",
    provider: "OpenAI",
    cost: 0.0125,
  },
];

// --- Helper Functions ---

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric", 
    year: "numeric" 
  });
}

function formatTime(timeString: string): string {
  return timeString;
}

function getTypeLabel(type: UsageType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function getTypeColor(type: UsageType): string {
  switch (type) {
    case "video":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    case "story":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "assets":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getModeLabel(mode: UsageMode): string {
  const labels: Record<UsageMode, string> = {
    "ambient": "Ambient",
    "problem-solution": "Problem-Solution",
    "before-after": "Before-After",
    "myth-busting": "Myth-Busting",
    "tease-reveal": "Tease-Reveal",
    "asmr": "ASMR",
    "character": "Character",
    "location": "Location",
  };
  return labels[mode] || mode;
}

function getModeColor(mode: UsageMode): string {
  const colors: Record<UsageMode, string> = {
    "ambient": "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    "problem-solution": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    "before-after": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    "myth-busting": "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    "tease-reveal": "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
    "asmr": "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    "character": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    "location": "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  };
  return colors[mode] || "bg-muted text-muted-foreground";
}

// --- Components ---

export default function UsagePage() {
  const { currentWorkspace } = useWorkspace();
  const [timeRange, setTimeRange] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [usageData, setUsageData] = useState<ModelUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch usage data from API
  useEffect(() => {
    async function fetchUsage() {
      if (!currentWorkspace?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        if (timeRange === "custom" && startDate) params.set("startDate", startDate);
        if (timeRange === "custom" && endDate) params.set("endDate", endDate);
        if (selectedType !== "all") params.set("type", selectedType);

        const response = await fetch(`/api/usage?${params}`, {
          headers: {
            'x-workspace-id': currentWorkspace.id,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch usage data");
        }

        const data = await response.json();
        // Map API response to ModelUsage format
        const mappedData: ModelUsage[] = data.usage.map((item: any) => ({
          id: item.id,
          date: item.date,
          time: item.time,
          type: item.type as UsageType,
          mode: item.mode as UsageMode,
          modelName: item.modelName,
          provider: item.provider,
          cost: parseFloat(item.estimatedCostUsd),
        }));
        setUsageData(mappedData);
      } catch (err) {
        console.error("Failed to fetch usage:", err);
        setError("Failed to load usage data");
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, [currentWorkspace?.id, timeRange, startDate, endDate, selectedType]);

  // Filter data based on selections (client-side filtering for custom range)
  const filteredData = useMemo(() => {
    return usageData.filter((item) => {
      // Filter by date range (additional client-side filter for custom range)
      if (startDate && item.date < startDate) {
        return false;
      }
      if (endDate && item.date > endDate) {
        return false;
      }

      return true;
    });
  }, [usageData, startDate, endDate]);

  // Calculate summary stats from filtered data
  const totalCost = filteredData.reduce((sum, item) => sum + item.cost, 0);
  const totalRequests = filteredData.length;
  const uniqueProviders = new Set(filteredData.map(item => item.provider)).size;

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Ambient Background */}
      <AmbientBackground accentColor="from-primary to-violet-500" />

      <div className="relative z-10 space-y-6 p-6">
        {/* Header Section */}
        <div className="border-b bg-background/80 backdrop-blur-xl">
          <div className="px-4 py-5">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Usage & Billing</h1>
              <p className="text-muted-foreground">
                Track your AI model usage and estimated costs across all providers.
              </p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <Card className="border-0 bg-card">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter usage data by type and date range.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Type and Time Range Row */}
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-full border-border">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="story">Story</SelectItem>
                      <SelectItem value="assets">Assets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={timeRange === "24h" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setTimeRange("24h");
                      const now = new Date();
                      const yesterday = new Date(now);
                      yesterday.setDate(yesterday.getDate() - 1);
                      setStartDate(yesterday.toISOString().split('T')[0]);
                      setEndDate(now.toISOString().split('T')[0]);
                    }}
                    className="h-9"
                  >
                    24 hours
                  </Button>
                  <Button
                    variant={timeRange === "7d" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setTimeRange("7d");
                      const now = new Date();
                      const weekAgo = new Date(now);
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      setStartDate(weekAgo.toISOString().split('T')[0]);
                      setEndDate(now.toISOString().split('T')[0]);
                    }}
                    className="h-9"
                  >
                    7 days
                  </Button>
                  <Button
                    variant={timeRange === "30d" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setTimeRange("30d");
                      const now = new Date();
                      const monthAgo = new Date(now);
                      monthAgo.setDate(monthAgo.getDate() - 30);
                      setStartDate(monthAgo.toISOString().split('T')[0]);
                      setEndDate(now.toISOString().split('T')[0]);
                    }}
                    className="h-9"
                  >
                    30 days
                  </Button>
                  <Button
                    variant={timeRange === "custom" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange("custom")}
                    className="h-9 gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Custom
                  </Button>
                </div>
              </div>

              {/* Custom Date Range Row - Only show when Custom is selected */}
              {timeRange === "custom" && (
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm font-medium mb-2 block">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border-border"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm font-medium mb-2 block">End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border-border"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedType("all");
                      setTimeRange("all");
                      setStartDate("");
                      setEndDate("");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-0 bg-card hover:bg-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card hover:bg-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-600 dark:text-green-400" />
                <p className="text-xs text-muted-foreground">
                  +180 since last hour
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card hover:bg-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Providers</CardTitle>
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueProviders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                AI providers used
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Usage Table */}
        <Card className="border-0 bg-card">
          <CardHeader>
            <CardTitle>Model Breakdown</CardTitle>
            <CardDescription>
              Detailed usage statistics by AI model.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Time</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Mode</TableHead>
                    <TableHead className="font-semibold">Model Name</TableHead>
                    <TableHead className="font-semibold">Provider</TableHead>
                    <TableHead className="text-right font-semibold">Estimated Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Loading usage data...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-destructive">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No usage data found for the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item, index) => (
                      <TableRow 
                        key={item.id}
                        className={cn(
                          "border-b border-border",
                          index !== filteredData.length - 1 && "border-b"
                        )}
                      >
                        <TableCell className="font-medium">{formatDate(item.date)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatTime(item.time)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "border",
                              getTypeColor(item.type)
                            )}
                          >
                            {getTypeLabel(item.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "border",
                              getModeColor(item.mode)
                            )}
                          >
                            {getModeLabel(item.mode)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.modelName}</TableCell>
                        <TableCell className="text-muted-foreground">{item.provider}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.cost)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
