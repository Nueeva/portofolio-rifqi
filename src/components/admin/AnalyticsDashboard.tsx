import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  Eye, 
  Users, 
  TrendingUp, 
  Calendar,
  RefreshCw,
  Globe,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { api } from "@/integrations/api/client";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

type TimeRange = "7d" | "30d" | "90d" | "all";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const PAGE_OPTIONS = [
  { value: "all", label: "Semua Halaman" },
  { value: "/", label: "Home" },
  { value: "/projects", label: "Projects" },
  { value: "/about", label: "About" },
  { value: "/contact", label: "Contact" },
];

export const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [pageFilter, setPageFilter] = useState<string>("all");

  const { data: stats, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["page-analytics", timeRange, pageFilter],
    queryFn: async () => {
      const { data, error } = await api.analytics.summary({ timeRange, page: pageFilter });
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Statistik belum tersedia.");
      return { ...data, viewsByDate: data.viewsByDate.map(row => ({ ...row,
        date: new Date(row.date + "T00:00:00+07:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }),
      })) };
    },
  });

  const chartConfig = {
    views: {
      label: "Views",
      color: "hsl(var(--primary))",
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !stats) return <div role="alert"><p>Statistik pengunjung belum dapat dimuat.</p><Button onClick={() => void refetch()}>Coba lagi</Button></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Visitor Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Statistik seluruh halaman dalam periode terpilih
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={pageFilter} onValueChange={setPageFilter}>
            <SelectTrigger className="w-[160px]">
              <FileText className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Hari</SelectItem>
              <SelectItem value="30d">30 Hari</SelectItem>
              <SelectItem value="90d">90 Hari</SelectItem>
              <SelectItem value="all">Semua</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <Users className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unique Visitors</p>
              <p className="text-2xl font-bold">{stats.uniqueVisitors.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent">
              <TrendingUp className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg/Day</p>
              <p className="text-2xl font-bold">{stats.avgViewsPerDay}</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Globe className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Top Page</p>
              <p className="text-sm font-medium truncate max-w-[120px]">
                {stats.viewsByPage[0]?.page || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Views Over Time */}
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-medium mb-4">Views Over Time</h3>
          {stats.viewsByDate.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <LineChart data={stats.viewsByDate}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 0 }}
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Belum ada data
            </div>
          )}
        </div>

        {/* Views by Page */}
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-medium mb-4">Top Pages</h3>
          {stats.viewsByPage.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={stats.viewsByPage} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis 
                  type="category" 
                  dataKey="page" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="views" 
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Belum ada data
            </div>
          )}
        </div>
      </div>

      {/* Top Referrers */}
      {stats.topReferrers.length > 0 && (
        <div className="p-4 rounded-lg border border-border bg-card">
          <h3 className="font-medium mb-4">Top Referrers</h3>
          <div className="space-y-2">
            {stats.topReferrers.map((referrer, index) => (
              <div key={referrer.referrer} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm truncate max-w-[200px]">{referrer.referrer}</span>
                </div>
                <span className="text-sm font-medium">{referrer.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
