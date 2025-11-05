import { useState, useMemo } from "react";
import { Video, Zap, Search, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow, format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const historyItems = [
  {
    id: "1",
    title: "Summer Product Launch",
    type: "video" as const,
    status: "completed",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    url: "/videos/narrative/1",
    thumbnailUrl: undefined,
  },
  {
    id: "2",
    title: "Brand Story 2024",
    type: "video" as const,
    status: "processing",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    url: "/videos/narrative/2",
    thumbnailUrl: undefined,
  },
  {
    id: "3",
    title: "Quick Product Demo",
    type: "story" as const,
    status: "completed",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    url: "/stories/3",
    thumbnailUrl: undefined,
  },
  {
    id: "4",
    title: "Customer Testimonials",
    type: "video" as const,
    status: "draft",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    url: "/videos/narrative/4",
    thumbnailUrl: undefined,
  },
  {
    id: "5",
    title: "Team Introduction",
    type: "story" as const,
    status: "published",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
    url: "/stories/5",
    thumbnailUrl: undefined,
  },
  {
    id: "6",
    title: "Product Feature Highlights",
    type: "video" as const,
    status: "completed",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 120),
    url: "/videos/narrative/6",
    thumbnailUrl: undefined,
  },
  {
    id: "7",
    title: "Behind the Scenes",
    type: "story" as const,
    status: "published",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 144),
    url: "/stories/7",
    thumbnailUrl: undefined,
  },
  {
    id: "8",
    title: "Company Culture Video",
    type: "video" as const,
    status: "completed",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 168),
    url: "/videos/narrative/8",
    thumbnailUrl: undefined,
  },
];

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  processing: "bg-chart-3 text-white",
  completed: "bg-chart-4 text-white",
  published: "bg-primary text-primary-foreground",
};

export default function History() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");

  // Generate available months from history data
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    historyItems.forEach(item => {
      const monthKey = format(item.updatedAt, "yyyy-MM");
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, []);

  const filteredItems = useMemo(() => {
    return historyItems.filter(item => {
      // Search filter
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Month filter
      let matchesMonth = true;
      if (selectedMonth !== "all") {
        const monthStart = startOfMonth(new Date(selectedMonth + "-01"));
        const monthEnd = endOfMonth(monthStart);
        matchesMonth = isWithinInterval(item.updatedAt, { start: monthStart, end: monthEnd });
      }
      
      return matchesSearch && matchesMonth;
    });
  }, [searchQuery, selectedMonth]);

  const videos = filteredItems.filter(item => item.type === "video");
  const stories = filteredItems.filter(item => item.type === "story");

  const HistoryItemCard = ({ item }: { item: typeof historyItems[0] }) => {
    const Icon = item.type === "video" ? Video : Zap;
    
    return (
      <Link href={item.url} data-testid={`link-history-item-${item.id}`}>
        <div className="hover-elevate active-elevate-2 cursor-pointer">
          <Card className="overflow-hidden" data-testid={`card-history-${item.id}`}>
            <div className="aspect-video bg-muted relative overflow-hidden">
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt={item.title} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge className={statusColors[item.status] || statusColors.draft}>
                  {item.status}
                </Badge>
              </div>
            </div>
            <CardContent className="pt-4">
              <h3 className="font-semibold text-base line-clamp-2 mb-2" data-testid={`text-history-title-${item.id}`}>
                {item.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="capitalize">{item.type}</span>
                <span>{formatDistanceToNow(item.updatedAt, { addSuffix: true })}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-muted-foreground mt-1">
          View all your recently created videos and stories
        </p>
      </div>

      <Tabs defaultValue="all">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all">All ({filteredItems.length})</TabsTrigger>
            <TabsTrigger value="videos" data-testid="tab-videos">Videos ({videos.length})</TabsTrigger>
            <TabsTrigger value="stories" data-testid="tab-stories">Stories ({stories.length})</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48" data-testid="select-month">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All months</SelectItem>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>
                    {format(new Date(month + "-01"), "MMMM yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search history..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-history"
              />
            </div>
          </div>
        </div>

        <TabsContent value="all" className="mt-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search query
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <HistoryItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No videos found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search query" : "No videos in your history yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videos.map((item) => (
                <HistoryItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stories" className="mt-6">
          {stories.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No stories found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search query" : "No stories in your history yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stories.map((item) => (
                <HistoryItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
