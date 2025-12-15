import React from "react";
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
import { Activity, CreditCard, Layers, Zap } from "lucide-react";

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

// --- Helper Functions ---

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
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
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "image":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "video":
      return "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300";
    case "audio":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// --- Components ---

export default function UsagePage() {
  // Calculate summary stats
  const totalCost = MOCK_USAGE_DATA.reduce((sum, item) => sum + item.cost, 0);
  const totalRequests = MOCK_USAGE_DATA.reduce((sum, item) => sum + item.requests, 0);
  const mostUsedModel = MOCK_USAGE_DATA.reduce((prev, current) => 
    (prev.requests > current.requests) ? prev : current
  );

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-7xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Usage & Billing</h1>
        <p className="text-muted-foreground">
          Track your AI model usage and estimated costs across all providers.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +180 since last hour
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{MOCK_USAGE_DATA.length}</div>
            <p className="text-xs text-muted-foreground">
              Across 4 providers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate" title={mostUsedModel.modelName}>
              {mostUsedModel.modelName}
            </div>
            <p className="text-xs text-muted-foreground">
              {mostUsedModel.requests} requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Model Breakdown</CardTitle>
          <CardDescription>
            Detailed usage statistics by AI model.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Usage Volume</TableHead>
                <TableHead className="text-right">Estimated Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_USAGE_DATA.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.modelName}</TableCell>
                  <TableCell>{item.provider}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getTypeColor(item.type)}>
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{item.requests.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {formatUsageAmount(item.usageAmount, item.type)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.cost)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
