import React, { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, CreditCard, Layers, Zap, TrendingUp, ArrowUpRight, ChevronDown, Calendar, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { AmbientBackground } from "@/components/story-studio/shared/AmbientBackground";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// --- Mock Data & Types ---

interface ModelUsage {
  id: string;
  modelName: string;
  provider: string;
  type: "text" | "image" | "video" | "audio";
  requests: number;
  usageAmount: number; // tokens or seconds
  cost: number;
}

const MOCK_USAGE_DATA: ModelUsage[] = [
  {
    id: "1",
    modelName: "GPT-4o",
    provider: "OpenAI",
    type: "text",
    requests: 1250,
    usageAmount: 5000000, // tokens
    cost: 45.25,
  },
  {
    id: "2",
    modelName: "Sora 2",
    provider: "Runware",
    type: "video",
    requests: 12,
    usageAmount: 96, // seconds
    cost: 28.80,
  },
  {
    id: "3",
    modelName: "FLUX.2 Pro",
    provider: "Runware",
    type: "image",
    requests: 85,
    usageAmount: 85, // images
    cost: 4.25,
  },
  {
    id: "4",
    modelName: "Gemini 2.5 Flash",
    provider: "Google",
    type: "text",
    requests: 4500,
    usageAmount: 12000000, // tokens
    cost: 8.50,
  },
  {
    id: "5",
    modelName: "ElevenLabs Multilingual v2",
    provider: "ElevenLabs",
    type: "audio",
    requests: 45,
    usageAmount: 25000, // characters
    cost: 12.50,
  },
  {
    id: "6",
    modelName: "KlingAI 2.5 Turbo",
    provider: "Runware",
    type: "video",
    requests: 5,
    usageAmount: 25, // seconds
    cost: 15.00,
  },
];

// --- Chart Data ---

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Mock data for the chart - This period (2026)
const thisPeriodData = [
  { month: "Jan", value: 8.5 },
  { month: "Feb", value: 12.3 },
  { month: "Mar", value: 11.8 },
  { month: "Apr", value: 9.2 },
  { month: "May", value: 7.6 },
  { month: "Jun", value: 6.9 },
  { month: "Jul", value: 8.1 },
  { month: "Aug", value: 10.87 },
  { month: "Sep", value: 12.4 },
  { month: "Oct", value: 13.8 },
  { month: "Nov", value: 15.2 },
  { month: "Dec", value: 16.5 },
];

// Mock data for the chart - Previous period (2025)
const previousPeriodData = [
  { month: "Jan", value: 7.2 },
  { month: "Feb", value: 8.9 },
  { month: "Mar", value: 9.5 },
  { month: "Apr", value: 8.1 },
  { month: "May", value: 7.8 },
  { month: "Jun", value: 8.3 },
  { month: "Jul", value: 8.7 },
  { month: "Aug", value: 9.54 },
  { month: "Sep", value: 10.1 },
  { month: "Oct", value: 10.8 },
  { month: "Nov", value: 11.5 },
  { month: "Dec", value: 12.2 },
];

// Combine data for chart
const chartData = MONTHS.map((month, index) => ({
  month,
  "This period": thisPeriodData[index]?.value || 0,
  "Previous period": previousPeriodData[index]?.value || 0,
}));

// --- Helper Functions ---

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatGB(value: number) {
  return `${value.toFixed(2)} GB`;
}

function formatUsageAmount(amount: number, type: ModelUsage["type"]) {
  if (type === "text") return `${(amount / 1000).toFixed(1)}k tokens`;
  if (type === "video") return `${amount}s`;
  if (type === "audio") return `${(amount / 1000).toFixed(1)}k chars`;
  return `${amount} imgs`;
}

function getTypeColor(type: ModelUsage["type"]) {
  switch (type) {
    case "text":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "image":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    case "video":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    case "audio":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

// --- Components ---

export default function UsagePage() {
  const [timeRange, setTimeRange] = useState<string>("custom");
  const [selectedPage, setSelectedPage] = useState<string>("all");

  // Calculate summary stats
  const totalCost = MOCK_USAGE_DATA.reduce((sum, item) => sum + item.cost, 0);
  const totalRequests = MOCK_USAGE_DATA.reduce((sum, item) => sum + item.requests, 0);
  const uniqueProviders = new Set(MOCK_USAGE_DATA.map(item => item.provider)).size;
  const mostUsedModel = MOCK_USAGE_DATA.reduce((prev, current) => 
    (prev.requests > current.requests) ? prev : current
  );

  // Calculate total usage from chart data
  const totalUsage = thisPeriodData.reduce((sum, item) => sum + item.value, 0);
  const previousTotalUsage = previousPeriodData.reduce((sum, item) => sum + item.value, 0);
  const usageIncrease = ((totalUsage - previousTotalUsage) / previousTotalUsage) * 100;

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

        {/* Usage Chart Section */}
        <Card className="border-0 bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Select value={selectedPage} onValueChange={setSelectedPage}>
                  <SelectTrigger className="w-[140px] border-border">
                    <SelectValue placeholder="All pages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All pages</SelectItem>
                    <SelectItem value="videos">Videos</SelectItem>
                    <SelectItem value="stories">Stories</SelectItem>
                    <SelectItem value="characters">Characters</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{totalUsage.toFixed(0)} GB</span>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">{usageIncrease.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={timeRange === "30" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("30")}
                  className="h-9"
                >
                  30 days
                </Button>
                <Button
                  variant={timeRange === "7" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("7")}
                  className="h-9"
                >
                  7 days
                </Button>
                <Button
                  variant={timeRange === "24" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange("24")}
                  className="h-9"
                >
                  24 hours
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
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-2 w-2 rounded-full bg-primary"
                )} />
                <span className="text-sm text-muted-foreground">This period</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-sm text-muted-foreground">Previous period</span>
              </div>
              {timeRange === "custom" && (
                <div className="flex items-center gap-2 ml-auto">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">1 Jan 2025 - 31 Dec 2026</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `${value} GB`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '8px 12px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))', marginBottom: '4px' }}
                    formatter={(value: number) => [formatGB(value), '']}
                    labelFormatter={(label) => `12 ${label} 2026`}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                    formatter={(value) => (
                      <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>
                        {value}
                      </span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="This period"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Previous period"
                    stroke="hsl(45, 93%, 47%)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(45, 93%, 47%)', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Models</CardTitle>
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{MOCK_USAGE_DATA.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {uniqueProviders} providers
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card hover:bg-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Most Used</CardTitle>
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate" title={mostUsedModel.modelName}>
                {mostUsedModel.modelName}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {mostUsedModel.requests.toLocaleString()} requests
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
                    <TableHead className="font-semibold">Model Name</TableHead>
                    <TableHead className="font-semibold">Provider</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="text-right font-semibold">Requests</TableHead>
                    <TableHead className="text-right font-semibold">Usage Volume</TableHead>
                    <TableHead className="text-right font-semibold">Estimated Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_USAGE_DATA.map((item, index) => (
                    <TableRow 
                      key={item.id}
                      className={cn(
                        "border-b border-border",
                        index !== MOCK_USAGE_DATA.length - 1 && "border-b"
                      )}
                    >
                      <TableCell className="font-medium">{item.modelName}</TableCell>
                      <TableCell className="text-muted-foreground">{item.provider}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "border",
                            getTypeColor(item.type)
                          )}
                        >
                          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.requests.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatUsageAmount(item.usageAmount, item.type)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.cost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
