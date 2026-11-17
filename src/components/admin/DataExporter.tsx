import { contentCSV } from "@/lib/contentExport";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { api } from "@/integrations/api/client";
import type { ApiTables } from "@/integrations/api/types";
import { Button } from "@/components/ui/button";
const sources: { key: keyof ApiTables; label: string }[] = [
  { key: "projects", label: "Karya" },
  { key: "portfolio_project_content", label: "Studi kasus" },
  { key: "portfolio_skill_groups", label: "Keahlian" },
  { key: "site_settings", label: "Profil & pengaturan" },
  { key: "certifications", label: "Sertifikasi" },
  { key: "page_analytics", label: "Kunjungan" },
  { key: "ip_logs", label: "Log akses" },
  { key: "blocked_ips", label: "IP dibatasi" },
  { key: "activity_logs", label: "Aktivitas pengelola" },
];
function download(value: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
export function DataExporter() {
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [busy, setBusy] = useState<string | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const run = async (key: keyof ApiTables | "all") => {
    if (busy) return;
    setBusy(key);
    setError("");
    setMessage("");
    try {
      const records: Record<string, unknown[]> = {};
      for (const source of key === "all"
        ? sources
        : sources.filter((row) => row.key === key)) {
        const result = await api.from(source.key).select("*").limit(2000);
        if (result.error)
          throw Error(
            `${source.label}: ${result.error.message}. Tidak ada file yang diunduh.`,
          );
        if ((result.data?.length ?? 0) >= 2000)
          throw Error(
            `${source.label} mencapai batas 2.000 record. Gunakan backup database untuk memperoleh data lengkap; file terpotong tidak diunduh.`,
          );
        records[source.key] = result.data ?? [];
      }
      const exportedAt = new Date().toISOString();
      download(
        format === "json"
          ? JSON.stringify(
              {
                exportedAt,
                coverage: Object.keys(records),
                includesFiles: false,
                records,
              },
              null,
              2,
            )
          : contentCSV(records),
        `celah-${key}-${exportedAt.slice(0, 10)}.${format}`,
        format === "json" ? "application/json" : "text/csv;charset=utf-8",
      );
      setMessage(
        `${Object.values(records).reduce((sum, rows) => sum + rows.length, 0)} record dari ${Object.keys(records).length} sumber diunduh.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ekspor gagal. Silakan coba kembali.",
      );
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="space-y-6">
      <div className="console-field">
        <label htmlFor="export-format">Format unduhan</label>
        <select
          id="export-format"
          className="h-12 px-3 border border-input bg-background rounded max-w-xs"
          value={format}
          disabled={!!busy}
          onChange={(e) => setFormat(e.target.value as "json" | "csv")}
        >
          <option value="json">JSON — data terstruktur</option>
          <option value="csv">CSV — spreadsheet</option>
        </select>
      </div>
      <div className="console-notice">
        Ekspor mencakup record yang dipilih. Berkas unggahan, akun, sesi, dan
        konfigurasi rahasia tidak disertakan. Untuk pemulihan situs diperlukan
        backup database dan unggahan melalui pengelola server.
      </div>
      {error && (
        <p className="console-notice console-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="console-notice console-success" role="status">
          {message}
        </p>
      )}
      <div className="console-editor-section">
        <div className="flex flex-wrap justify-between gap-4 items-center">
          <div>
            <h2>Semua sumber yang tersedia</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Sembilan sumber data; unduhan dibatalkan jika salah satu sumber
              gagal atau mencapai batas.
            </p>
          </div>
          <Button disabled={!!busy} onClick={() => void run("all")}>
            {busy === "all" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            Ekspor semua data
          </Button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {sources.map((source) => (
          <section className="console-editor-section" key={source.key}>
            <h2>{source.label}</h2>
            <Button
              variant="outline"
              disabled={!!busy}
              onClick={() => void run(source.key)}
            >
              {busy === source.key ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              Unduh data
            </Button>
          </section>
        ))}
      </div>
    </div>
  );
}
