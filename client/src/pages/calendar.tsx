import { useState } from "react";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarItem } from "@/components/calendar-item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Calendar() {
  const [view, setView] = useState("list");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Schedule and manage your content releases
          </p>
        </div>
        <Button size="lg" className="gap-2" data-testid="button-schedule-content">
          <Plus className="h-4 w-4" />
          Schedule Content
        </Button>
      </div>

      <Tabs value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="list" data-testid="tab-list">List View</TabsTrigger>
          <TabsTrigger value="month" data-testid="tab-month">Month View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 mt-6">
          {[
            {
              title: "Summer Product Launch",
              scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
              platform: "youtube",
              status: "scheduled",
            },
            {
              title: "Behind the Scenes",
              scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
              platform: "instagram",
              status: "scheduled",
            },
            {
              title: "Product Demo Shorts",
              scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
              platform: "tiktok",
              status: "scheduled",
            },
            {
              title: "Customer Success Story",
              scheduledDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
              platform: "facebook",
              status: "published",
              publishedUrl: "https://facebook.com/example",
            },
          ].map((item, i) => (
            <CalendarItem key={i} {...item} />
          ))}
        </TabsContent>

        <TabsContent value="month" className="mt-6">
          <div className="flex items-center justify-center h-96 border border-border rounded-lg bg-muted/30">
            <div className="text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Month view coming soon</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
