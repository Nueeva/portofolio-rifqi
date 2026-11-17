import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { InkThemeSwitch } from "@/components/InkThemeSwitch";
import { useTheme } from "next-themes";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LayoutGrid,
  Loader2,
  Monitor,
  Moon,
  Pencil,
  Plus,
  Search,
  Sun,
  Trash2,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/integrations/api/client";
import { useAuth } from "@/hooks/useAuth";
import { consoleSections } from "@/lib/consoleNavigation";
import { ProjectEditor } from "@/components/admin/ProjectEditor";
import { pageSelection, projectImagePath } from "@/lib/projectWorkspace";
const Analytics = lazy(() =>
  import("@/components/admin/AnalyticsDashboard").then((m) => ({
    default: m.AnalyticsDashboard,
  })),
);
const Security = lazy(() =>
  import("@/components/admin/SecurityDashboard").then((m) => ({
    default: m.SecurityDashboard,
  })),
);
const Content = lazy(() =>
  import("@/components/admin/ContentManager").then((m) => ({
    default: m.ContentManager,
  })),
);
const Settings = lazy(() =>
  import("@/components/admin/SiteSettingsManager").then((m) => ({
    default: m.SiteSettingsManager,
  })),
);
const Certifications = lazy(() =>
  import("@/components/admin/CertificationsManager").then((m) => ({
    default: m.CertificationsManager,
  })),
);
const Export = lazy(() =>
  import("@/components/admin/DataExporter").then((m) => ({
    default: m.DataExporter,
  })),
);
const Notifications = lazy(() =>
  import("@/components/admin/NotificationCenter").then((m) => ({
    default: m.NotificationCenter,
  })),
);

function Preferences() {
  const { theme } = useTheme();
  return (
    <section className="console-editor-section">
      <h2>Tampilan ruang kerja</h2>
      <p>
        Pilihan disimpan di browser ini dan mengikuti halaman portofolio. Palet
        portofolio tetap konsisten.
      </p>
      <div className="console-preferences">
        {(
          [
            { id: "light", label: "Terang", icon: Sun },
            { id: "dark", label: "Gelap", icon: Moon },
            { id: "system", label: "Sistem", icon: Monitor },
          ] as const
        ).map((item) => (
          <InkThemeSwitch
            key={item.id}
            className=""
            preference={item.id}
            aria-pressed={theme === item.id}
          >
            <item.icon size={18} />
            {item.label}
          </InkThemeSwitch>
        ))}
      </div>
    </section>
  );
}
export default function Admin() {
  const auth = useAuth();
  const cache = useQueryClient();
  const [params, setParams] = useSearchParams();
  const section =
    consoleSections.find((row) => row.id === params.get("section")) ??
    consoleSections[0];
  const edit = params.get("edit");
  const search = params.get("q") ?? "";
  const category = params.get("category") ?? "all";
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [message, setMessage] = useState("");
  const checkbox = useRef<HTMLInputElement>(null);
  const projects = useQuery({
    queryKey: ["admin-projects"],
    enabled: auth.isAdmin,
    retry: false,
    queryFn: async () => {
      const result = await api
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(2000);
      if (result.error) throw Error(result.error.message);
      return result.data ?? [];
    },
  });
  const rows = projects.data ?? [];
  const filtered = rows.filter(
    (row) =>
      (category === "all" || row.category === category) &&
      [row.title, row.category, ...row.tech_stack]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * 10, current * 10);
  const selection = pageSelection(
    visible.map((row) => row.id),
    selected,
  );
  const hiddenSelected = [...selected].filter(
    (id) => !filtered.some((row) => row.id === id),
  ).length;
  const change = (updates: Record<string, string | null>, replace = false) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    setParams(next, { replace });
  };
  useEffect(() => {
    if (checkbox.current) checkbox.current.indeterminate = selection.some;
  }, [selection.some, selected]);
  useEffect(() => {
    if (!projects.isPending && page > pages) {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          next.set("page", String(pages));
          return next;
        },
        { replace: true },
      );
    }
  }, [page, pages, projects.isPending, setParams]);
  useEffect(() => {
    if (projects.data)
      setSelected(
        (previous) =>
          new Set(
            [...previous].filter((id) =>
              projects.data!.some((row) => row.id === id),
            ),
          ),
      );
  }, [projects.data]);
  const closeEditor = () => change({ edit: null });
  const remove = async () => {
    if (!deleteIds?.length || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const toRemove = rows.filter((row) => deleteIds.includes(row.id));
      const result = await api.from("projects").delete().in("id", deleteIds);
      if (result.error) throw Error(result.error.message);
      // Delete database records first. A failed deletion must never erase media.
      for (const row of toRemove) {
        const path = projectImagePath(row.image_url);
        if (!path) continue;
        const refs = await api
          .from("projects")
          .select("*")
          .eq("image_url", row.image_url);
        if (!refs.error && refs.data?.length === 0)
          await api.storage.from("project-images").remove([path]);
      }
      await api.from("activity_logs").insert({
        user_id: auth.user!.id,
        action: "DELETE",
        entity_type: "projects",
        entity_title: toRemove.map((row) => row.title).join(", "),
        details: { count: deleteIds.length },
      });
      setSelected(
        (previous) =>
          new Set([...previous].filter((id) => !deleteIds.includes(id))),
      );
      setMessage(`${deleteIds.length} karya dihapus.`);
      setDeleteIds(null);
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["admin-projects"] }),
        cache.invalidateQueries({ queryKey: ["projects"] }),
      ]);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Penghapusan gagal. Silakan coba kembali.",
      );
    } finally {
      setDeleting(false);
    }
  };
  let body;
  if (auth.loading)
    body = (
      <div className="console-state" role="status">
        <Loader2 className="animate-spin" />
        <h1>Memeriksa akses…</h1>
      </div>
    );
  else if (auth.error)
    body = (
      <div className="console-state" role="alert">
        <h1>Akses belum dapat diperiksa.</h1>
        <p>Coba kembali setelah koneksi tersedia.</p>
        <Button onClick={auth.retry}>Coba lagi</Button>
      </div>
    );
  else if (!auth.user) return <Navigate to="/auth" replace />;
  else if (!auth.isAdmin)
    body = (
      <div className="console-state">
        <h1>Area ini untuk pengelola.</h1>
        <p>Akun Anda belum memiliki akses admin.</p>
        <a href="/">Kembali ke portofolio</a>
      </div>
    );
  else if (section.id === "projects" && edit) {
    const project = rows.find((row) => row.id === edit);
    body = projects.isPending ? (
      <div className="console-state" role="status">
        Memuat karya…
      </div>
    ) : projects.isError ? (
      <div className="console-state" role="alert">
        <h1>Karya belum dapat dimuat.</h1>
        <Button onClick={() => void projects.refetch()}>Coba lagi</Button>
      </div>
    ) : edit !== "new" && !project ? (
      <div className="console-state">
        <h1>Karya tidak ditemukan.</h1>
        <Button onClick={closeEditor}>Kembali ke daftar</Button>
      </div>
    ) : (
      <ProjectEditor
        key={edit}
        project={project ?? null}
        onClose={closeEditor}
        onSaved={(value) => {
          setMessage(value);
          closeEditor();
        }}
      />
    );
  } else
    body = (
      <>
        <div className="console-page-heading">
          <div>
            <span className="console-eyebrow">
              {section.group} / Portofolio
            </span>
            <h1>{section.label}</h1>
            <p>{section.description}</p>
          </div>
          {section.id === "projects" && (
            <Button
              onClick={() => change({ section: "projects", edit: "new" })}
            >
              <Plus size={18} />
              Tambah karya
            </Button>
          )}
        </div>
        {message && (
          <div className="console-notice console-success" role="status">
            <Check size={18} />
            <p>{message}</p>
            <button
              type="button"
              aria-label="Tutup pemberitahuan"
              className="ml-auto"
              onClick={() => setMessage("")}
            >
              ×
            </button>
          </div>
        )}
        <Suspense
          fallback={
            <div className="console-state" role="status">
              Memuat bagian…
            </div>
          }
        >
          {section.id === "projects" && (
            <>
              <div className="console-toolbar">
                <div className="console-search">
                  <Search aria-hidden="true" />
                  <label htmlFor="project-search" className="sr-only">
                    Cari karya
                  </label>
                  <Input
                    id="project-search"
                    type="search"
                    value={search}
                    placeholder="Cari judul, kategori, atau teknologi…"
                    onChange={(e) =>
                      change({ q: e.target.value, page: "1" }, true)
                    }
                  />
                </div>
                <label htmlFor="project-filter" className="sr-only">
                  Filter kategori
                </label>
                <select
                  id="project-filter"
                  value={category}
                  onChange={(e) =>
                    change({ category: e.target.value, page: "1" })
                  }
                >
                  <option value="all">Semua kategori</option>
                  <option value="tools">Tools</option>
                  <option value="web-security">Web Security</option>
                  <option value="pentesting">Pentesting</option>
                </select>
              </div>
              {projects.isError && (
                <div className="console-notice console-error" role="alert">
                  Daftar karya belum dapat diperbarui.{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => void projects.refetch()}
                  >
                    Coba lagi
                  </button>
                </div>
              )}
              <div className="console-panel">
                {selected.size > 0 && (
                  <div className="console-selection">
                    <span>
                      {selected.size} karya dipilih
                      {hiddenSelected
                        ? ` · ${hiddenSelected} di luar filter`
                        : ""}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected(new Set())}
                    >
                      Batal memilih
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeleteError("");
                        setDeleteIds([...selected]);
                      }}
                    >
                      <Trash2 size={15} />
                      Hapus pilihan
                    </Button>
                  </div>
                )}
                {projects.isPending ? (
                  <div className="console-state" role="status">
                    <Loader2 className="animate-spin" />
                    Memuat karya…
                  </div>
                ) : !rows.length && !projects.isError ? (
                  <div className="console-empty">
                    <LayoutGrid size={28} />
                    <h2>Setiap karya punya cerita.</h2>
                    <p>
                      Tambahkan karya pertama untuk mulai menyusun portofolio
                      Anda.
                    </p>
                    <Button
                      onClick={() =>
                        change({ section: "projects", edit: "new" })
                      }
                    >
                      <Plus size={16} />
                      Tambah karya pertama
                    </Button>
                  </div>
                ) : !filtered.length && !projects.isError ? (
                  <div className="console-empty">
                    <h2>Belum ada hasil yang cocok.</h2>
                    <p>
                      Coba judul lain atau hapus filter yang sedang digunakan.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() =>
                        change({ q: null, category: null, page: null })
                      }
                    >
                      Hapus pencarian & filter
                    </Button>
                  </div>
                ) : (
                  rows.length > 0 && (
                    <>
                      <table className="console-table">
                        <caption className="sr-only">
                          Daftar karya portofolio, terbaru diperbarui lebih
                          dahulu
                        </caption>
                        <thead>
                          <tr>
                            <th>
                              <label className="console-check">
                                <input
                                  ref={checkbox}
                                  type="checkbox"
                                  aria-label="Pilih semua karya di halaman ini"
                                  checked={selection.all}
                                  onChange={() =>
                                    setSelected((previous) => {
                                      const next = new Set(previous);
                                      for (const row of visible) {
                                        if (selection.all) next.delete(row.id);
                                        else next.add(row.id);
                                      }
                                      return next;
                                    })
                                  }
                                />
                              </label>
                            </th>
                            <th>Karya</th>
                            <th className="console-project-category">
                              Kategori
                            </th>
                            <th className="console-project-date">Diperbarui</th>
                            <th>
                              <span className="sr-only">Tindakan</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {visible.map((row) => (
                            <tr key={row.id}>
                              <td>
                                <label className="console-check">
                                  <input
                                    type="checkbox"
                                    checked={selected.has(row.id)}
                                    aria-label={`Pilih ${row.title}`}
                                    onChange={() =>
                                      setSelected((previous) => {
                                        const next = new Set(previous);
                                        if (next.has(row.id))
                                          next.delete(row.id);
                                        else next.add(row.id);
                                        return next;
                                      })
                                    }
                                  />
                                </label>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="console-project-title"
                                  onClick={() =>
                                    change({
                                      section: "projects",
                                      edit: row.id,
                                    })
                                  }
                                >
                                  {row.title}
                                </button>
                                <div className="console-project-meta">
                                  {row.tech_stack.slice(0, 3).join(" · ")}
                                </div>
                              </td>
                              <td className="console-project-category">
                                <span className="console-tag">
                                  {row.category}
                                </span>
                              </td>
                              <td className="console-project-date text-muted-foreground">
                                {new Date(
                                  row.updated_at || row.created_at,
                                ).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>
                              <td>
                                <div className="console-row-actions">
                                  <button
                                    type="button"
                                    aria-label={`Ubah ${row.title}`}
                                    onClick={() =>
                                      change({
                                        section: "projects",
                                        edit: row.id,
                                      })
                                    }
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    data-delete
                                    aria-label={`Hapus ${row.title}`}
                                    onClick={() => {
                                      setDeleteError("");
                                      setDeleteIds([row.id]);
                                    }}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="console-list-footer">
                        <span>
                          {filtered.length} karya
                          {rows.length === 2000
                            ? " · batas pemuatan 2.000 karya"
                            : ""}
                        </span>
                        <button
                          type="button"
                          aria-label="Halaman sebelumnya"
                          disabled={current === 1}
                          onClick={() => change({ page: String(current - 1) })}
                        >
                          <ArrowLeft size={16} />
                        </button>
                        Halaman {current} dari {pages}
                        <button
                          type="button"
                          aria-label="Halaman berikutnya"
                          disabled={current === pages}
                          onClick={() => change({ page: String(current + 1) })}
                        >
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </>
                  )
                )}
              </div>
            </>
          )}
          {section.id === "settings" && <Settings />}
          {section.id === "content" && <Content />}
          {section.id === "certifications" && <Certifications />}
          {section.id === "analytics" && <Analytics />}
          {section.id === "security" && (
            <>
              <div className="mb-6">
                <Notifications />
              </div>
              <Security />
            </>
          )}
          {section.id === "export" && <Export />}
          {section.id === "theme" && <Preferences />}
        </Suspense>
      </>
    );
  return (
    <Layout>
      {body}
      <AlertDialog
        open={!!deleteIds}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteIds(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus{" "}
              {deleteIds?.length === 1
                ? "karya ini"
                : `${deleteIds?.length} karya`}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Halaman karya tidak akan tersedia setelah dihapus. Tindakan ini
              tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="text-sm space-y-2 max-h-40 overflow-auto">
            {rows
              .filter((row) => deleteIds?.includes(row.id))
              .map((row) => (
                <li key={row.id}>{row.title}</li>
              ))}
          </ul>
          {deleteError && (
            <p role="alert" className="console-field-error">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => void remove()}
            >
              {deleting ? "Menghapus…" : "Hapus karya"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
