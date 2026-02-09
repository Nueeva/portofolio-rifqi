import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Loader2,
  Database,
  BarChart3,
  ShieldAlert,
  Award,
  History,
} from "lucide-react";

type DataSource = "projects" | "analytics" | "ip_logs" | "certifications" | "activity_logs" | "blocked_ips";
type ExportFormat = "json" | "csv";

interface ExportOption {
  key: DataSource;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  { key: "projects", label: "Projects", icon: <Database className="h-5 w-5" />, description: "Semua data project" },
  { key: "certifications", label: "Sertifikasi", icon: <Award className="h-5 w-5" />, description: "Data sertifikasi" },
  { key: "analytics", label: "Analytics", icon: <BarChart3 className="h-5 w-5" />, description: "Data visitor analytics" },
  { key: "ip_logs", label: "IP Logs", icon: <ShieldAlert className="h-5 w-5" />, description: "Log aktivitas IP" },
  { key: "blocked_ips", label: "Blocked IPs", icon: <ShieldAlert className="h-5 w-5" />, description: "Daftar IP terblokir" },
  { key: "activity_logs", label: "Activity Logs", icon: <History className="h-5 w-5" />, description: "Log aktivitas admin" },
];

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const toCSV = (data: Record<string, unknown>[]): string => {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      if (Array.isArray(val)) return `"${val.join("; ")}"`;
      if (typeof val === "string") return `"${val.replace(/"/g, '""')}"`;
      return String(val);
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
};

export const DataExporter = () => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState<string | null>(null);

  const fetchData = async (source: DataSource) => {
    const { data, error } = await supabase
      .from(source === "analytics" ? "page_analytics" : source)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw error;
    return data || [];
  };

  const handleExport = async (source: DataSource, format: ExportFormat) => {
    setExporting(`${source}-${format}`);
    try {
      const data = await fetchData(source);
      if (data.length === 0) {
        toast({ title: "Info", description: "Tidak ada data untuk diekspor" });
        return;
      }

      const date = new Date().toISOString().split("T")[0];
      const filename = `${source}-${date}`;

      if (format === "json") {
        downloadFile(JSON.stringify(data, null, 2), `${filename}.json`, "application/json");
      } else {
        downloadFile(toCSV(data as Record<string, unknown>[]), `${filename}.csv`, "text/csv;charset=utf-8;");
      }

      toast({ title: "Berhasil", description: `${data.length} data diekspor ke ${format.toUpperCase()}` });
    } catch (error) {
      console.error("Export error:", error);
      toast({ title: "Error", description: "Gagal mengekspor data", variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  const handleExportAll = async (format: ExportFormat) => {
    setExporting(`all-${format}`);
    try {
      const allData: Record<string, unknown[]> = {};
      for (const opt of EXPORT_OPTIONS) {
        try {
          allData[opt.key] = await fetchData(opt.key);
        } catch {
          allData[opt.key] = [];
        }
      }

      const date = new Date().toISOString().split("T")[0];
      if (format === "json") {
        downloadFile(JSON.stringify(allData, null, 2), `backup-all-${date}.json`, "application/json");
      } else {
        // For CSV, export each as separate content in one file
        let csvContent = "";
        for (const [key, data] of Object.entries(allData)) {
          if (data.length > 0) {
            csvContent += `\n--- ${key.toUpperCase()} ---\n`;
            csvContent += toCSV(data as Record<string, unknown>[]);
            csvContent += "\n";
          }
        }
        downloadFile(csvContent, `backup-all-${date}.csv`, "text/csv;charset=utf-8;");
      }

      const totalCount = Object.values(allData).reduce((sum, arr) => sum + arr.length, 0);
      toast({ title: "Berhasil", description: `Backup lengkap: ${totalCount} data diekspor` });
    } catch (error) {
      console.error("Export all error:", error);
      toast({ title: "Error", description: "Gagal mengekspor backup", variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Full Backup */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Full Backup</h3>
            <p className="text-sm text-muted-foreground">Export semua data sekaligus</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleExportAll("json")}
            disabled={!!exporting}
            size="sm"
          >
            {exporting === "all-json" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileJson className="h-4 w-4 mr-2" />}
            Backup JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportAll("csv")}
            disabled={!!exporting}
            size="sm"
          >
            {exporting === "all-csv" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
            Backup CSV
          </Button>
        </div>
      </div>

      {/* Per-table Export */}
      <div className="grid gap-3">
        {EXPORT_OPTIONS.map((opt) => (
          <div
            key={opt.key}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">{opt.icon}</div>
              <div>
                <p className="font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport(opt.key, "json")}
                disabled={!!exporting}
              >
                {exporting === `${opt.key}-json` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileJson className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport(opt.key, "csv")}
                disabled={!!exporting}
              >
                {exporting === `${opt.key}-csv` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
