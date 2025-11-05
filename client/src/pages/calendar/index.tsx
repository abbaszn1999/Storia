import { useState, useMemo } from "react";
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarItem } from "@/components/calendar-item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";

const calendarItems = [
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
  {
    title: "Weekly Tips & Tricks",
    scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
    platform: "youtube",
    status: "scheduled",
  },
  {
    title: "Product Features Highlight",
    scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    platform: "instagram",
    status: "scheduled",
  },
];

const platformColors: Record<string, string> = {
  youtube: "bg-red-500",
  instagram: "bg-pink-500",
  tiktok: "bg-primary",
  facebook: "bg-blue-500",
};

export default function Calendar() {
  const [view, setView] = useState("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getItemsForDate = (date: Date) => {
    return calendarItems.filter(item => isSameDay(item.scheduledDate, date));
  };

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
          {calendarItems.map((item, i) => (
            <CalendarItem key={i} {...item} />
          ))}
        </TabsContent>

        <TabsContent value="month" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
                data-testid="button-today"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                data-testid="button-next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 bg-muted">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium border-b border-border">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((day, index) => {
                const items = getItemsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={index}
                    className={`min-h-32 p-2 border-b border-r border-border ${
                      !isCurrentMonth ? "bg-muted/30" : ""
                    } ${isToday ? "bg-primary/5" : ""}`}
                    data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-medium ${
                          !isCurrentMonth ? "text-muted-foreground" : ""
                        } ${isToday ? "text-primary font-bold" : ""}`}
                      >
                        {format(day, "d")}
                      </span>
                      {isToday && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          Today
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      {items.map((item, i) => (
                        <div
                          key={i}
                          className="text-xs p-1.5 rounded bg-card border border-border hover-elevate cursor-pointer"
                          data-testid={`calendar-item-${format(day, "yyyy-MM-dd")}-${i}`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <div className={`h-2 w-2 rounded-full ${platformColors[item.platform]}`} />
                            <span className="font-medium truncate">{item.title}</span>
                          </div>
                          <span className="text-muted-foreground capitalize">{item.platform}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
