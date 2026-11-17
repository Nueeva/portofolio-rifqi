import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Check, Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api } from "@/integrations/api/client";
import type { ProjectRecord } from "@/integrations/api/types";
import { normalizeEditorial, type ProjectEditorial } from "@/data/editorial";
import { curatedProjects } from "@/data/projects";
import { persistProjectWorkspace } from "@/lib/projectWorkspace";
import { useBlocker } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

function emptyStudy(id: string, project?: ProjectRecord): ProjectEditorial {
  const source = curatedProjects.find((row) => row.id === id)?.caseStudy;
  return {
    project_key: id,
    summary: "",
    featured: false,
    sort_order: 0,
    role: source?.role ?? "",
    period: source?.period ?? "",
    overview: source?.overview ?? "",
    challenges: source?.challenges ?? [],
    approach: source?.approach ?? [],
    outcomes: source?.outcomes ?? [],
    lessons: source?.lessons ?? "",
  };
}
export function ProjectEditor({
  project,
  onClose,
  onSaved,
}: {
  project: ProjectRecord | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [id] = useState(() => project?.id ?? crypto.randomUUID());
  const [data, setData] = useState<ProjectRecord>(
    () =>
      project ?? {
        id,
        title: "",
        problem: "",
        solution: "",
        category: "tools",
        tech_stack: [],
        github_url: null,
        demo_url: null,
        image_url: null,
        created_at: "",
        updated_at: "",
      },
  );
  const [tech, setTech] = useState(project?.tech_stack.join(", ") ?? "");
  const [study, setStudy] = useState<ProjectEditorial>(() =>
    emptyStudy(id, project ?? undefined),
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(project?.image_url ?? "");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const errorRef = useRef<HTMLDivElement>(null);
  const cache = useQueryClient();
  const allowLeave = useRef(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      !allowLeave.current &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search),
  );
  const editorial = useQuery({
    queryKey: ["admin-editorial", id],
    retry: false,
    enabled: !!project,
    queryFn: async () => {
      const result = await api
        .from("portfolio_project_content")
        .select("*")
        .eq("project_key", id);
      if (result.error) throw Error(result.error.message);
      return result.data?.[0] ?? null;
    },
  });
  useEffect(() => {
    if (editorial.data && !dirty) setStudy(normalizeEditorial(editorial.data));
  }, [editorial.data, dirty]);
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  useEffect(() => {
    const prevent = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);
  const update = (key: keyof ProjectRecord, value: unknown) => {
    setDirty(true);
    setData((previous) => ({ ...previous, [key]: value }));
  };
  const updateStudy = (key: keyof ProjectEditorial, value: unknown) => {
    setDirty(true);
    setStudy((previous) => ({ ...previous, [key]: value }));
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || (!!project && (editorial.isPending || editorial.isError)))
      return;
    const next: Record<string, string> = {};
    for (const key of ["title", "problem", "solution"] as const)
      if (!data[key].trim()) next[key] = "Isian ini perlu diisi.";
    if (!tech.split(",").some((item) => item.trim()))
      next.tech_stack = "Masukkan sedikitnya satu teknologi.";
    for (const key of ["github_url", "demo_url"] as const)
      if (data[key]) {
        try {
          const url = new URL(data[key]!);
          if (!["http:", "https:"].includes(url.protocol)) throw Error();
        } catch {
          next[key] = "Gunakan tautan http atau https yang valid.";
        }
      }
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById("project-" + Object.keys(next)[0])?.focus();
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await persistProjectWorkspace({
        project: {
          ...data,
          title: data.title.trim(),
          problem: data.problem.trim(),
          solution: data.solution.trim(),
          tech_stack: tech
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
        editorial: study,
        mode: project ? "update" : "create",
        file,
        previousImage: project?.image_url ?? null,
      });
      allowLeave.current = true;
      setDirty(false);
      await Promise.all(
        ["projects", "project-editorial", "admin-projects"].map((key) =>
          cache.invalidateQueries({ queryKey: [key] }),
        ),
      );
      onSaved(
        result.cleanupWarning
          ? "Karya tersimpan. Gambar lama belum dapat dibersihkan."
          : "Karya dan studi kasus tersimpan.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan. Isian dan gambar sebelumnya tetap tersedia.",
      );
    } finally {
      setBusy(false);
    }
  };
  const field = (
    key: "title" | "problem" | "solution" | "github_url" | "demo_url",
    label: string,
    multiline = false,
  ) => (
    <div className="console-field">
      <Label htmlFor={"project-" + key}>{label}</Label>
      {multiline ? (
        <Textarea
          id={"project-" + key}
          rows={4}
          value={data[key] ?? ""}
          aria-invalid={!!errors[key]}
          aria-describedby={errors[key] ? key + "-error" : undefined}
          onChange={(e) => update(key, e.target.value)}
        />
      ) : (
        <Input
          id={"project-" + key}
          value={data[key] ?? ""}
          aria-invalid={!!errors[key]}
          aria-describedby={errors[key] ? key + "-error" : undefined}
          onChange={(e) => update(key, e.target.value)}
        />
      )}{" "}
      {errors[key] && (
        <p id={key + "-error"} className="console-field-error">
          {errors[key]}
        </p>
      )}
    </div>
  );
  return (
    <>
      <AlertDialog
        open={blocker.state === "blocked"}
        onOpenChange={(open) => {
          if (!open && !busy && blocker.state === "blocked") blocker.reset();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tinggalkan perubahan?</AlertDialogTitle>
            <AlertDialogDescription>
              Perubahan karya belum disimpan. Kembali ke editor untuk menyimpan,
              atau buang perubahan dan lanjutkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              Kembali ke editor
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={() => {
                if (blocker.state === "blocked") blocker.proceed();
              }}
            >
              Buang perubahan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <form onSubmit={save} data-console-dirty={dirty} aria-busy={busy}>
        <div className="console-editor-top">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (!busy) onClose();
            }}
            disabled={busy}
          >
            <ArrowLeft size={16} />
            Semua karya
          </Button>
          <span className="console-eyebrow">
            {dirty ? "Perubahan belum disimpan" : "Editor karya"}
          </span>
        </div>
        <div className="console-page-heading">
          <div>
            <span className="console-eyebrow">
              {project ? "Perbarui karya" : "Karya baru"}
            </span>
            <h1>{data.title || "Ceritakan karya Anda."}</h1>
            <p>
              Informasi, studi kasus, dan penempatan dalam satu ruang kerja.
            </p>
          </div>
        </div>
        {error && (
          <div
            className="console-notice console-error"
            role="alert"
            tabIndex={-1}
            ref={errorRef}
          >
            {error} Perubahan Anda belum dibuang.
          </div>
        )}
        {project && editorial.isError && (
          <div className="console-notice console-error" role="alert">
            Studi kasus belum dapat dimuat. Penyimpanan dinonaktifkan agar data
            lama tidak tertimpa.{" "}
            <button type="button" onClick={() => void editorial.refetch()}>
              Coba lagi
            </button>
          </div>
        )}
        {project && editorial.isPending && (
          <p role="status">Memuat studi kasus…</p>
        )}
        <div className="console-editor-grid">
          <fieldset
            className="console-editor-sections"
            disabled={
              busy || (!!project && (editorial.isPending || editorial.isError))
            }
          >
            <section className="console-editor-section">
              <h2>01 — Informasi karya</h2>
              {field("title", "Judul karya")}
              <div className="console-field">
                <Label htmlFor="project-category">Kategori</Label>
                <select
                  id="project-category"
                  value={data.category}
                  onChange={(e) => update("category", e.target.value)}
                  className="h-12 rounded border border-input bg-background px-3"
                >
                  <option value="tools">Tools</option>
                  <option value="web-security">Web Security</option>
                  <option value="pentesting">Pentesting</option>
                </select>
              </div>
              {field("problem", "Masalah yang diselesaikan", true)}
              {field("solution", "Solusi singkat", true)}
              <div className="console-field">
                <Label htmlFor="project-tech_stack">Teknologi</Label>
                <Input
                  id="project-tech_stack"
                  value={tech}
                  onChange={(e) => {
                    setTech(e.target.value);
                    setDirty(true);
                  }}
                  placeholder="React, Node.js, PostgreSQL"
                  aria-invalid={!!errors.tech_stack}
                  aria-describedby="tech-help"
                />
                <p id="tech-help">
                  {errors.tech_stack || "Pisahkan dengan koma."}
                </p>
              </div>
            </section>
            <section className="console-editor-section">
              <h2>02 — Studi kasus</h2>
              <p>
                Konteks dan proses di balik hasilnya. Bagian ini dapat
                dilengkapi bertahap.
              </p>
              <div className="console-fields-grid">
                {(["role", "period"] as const).map((key) => (
                  <div key={key} className="console-field">
                    <Label htmlFor={"study-" + key}>
                      {key === "role" ? "Peran Anda" : "Periode"}
                    </Label>
                    <Input
                      id={"study-" + key}
                      value={study[key]}
                      onChange={(e) => updateStudy(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              {(
                [
                  "summary",
                  "overview",
                  "challenges",
                  "approach",
                  "outcomes",
                  "lessons",
                ] as const
              ).map((key) => (
                <div className="console-field" key={key}>
                  <Label htmlFor={"study-" + key}>
                    {
                      {
                        summary: "Ringkasan untuk halaman publik",
                        overview: "Konteks studi kasus",
                        challenges: "Tantangan — satu poin per baris",
                        approach: "Pendekatan — satu poin per baris",
                        outcomes: "Hasil — satu poin per baris",
                        lessons: "Pelajaran",
                      }[key]
                    }
                  </Label>
                  <Textarea
                    id={"study-" + key}
                    rows={key === "overview" ? 5 : 3}
                    value={
                      Array.isArray(study[key])
                        ? (study[key] as string[]).join("\n")
                        : (study[key] as string)
                    }
                    onChange={(e) =>
                      updateStudy(
                        key,
                        ["challenges", "approach", "outcomes"].includes(key)
                          ? e.target.value.split("\n")
                          : e.target.value,
                      )
                    }
                  />
                </div>
              ))}
            </section>
            <section className="console-editor-section">
              <h2>03 — Media & tautan</h2>
              <div className="console-cover">
                {preview && <img src={preview} alt="Pratinjau cover karya" />}
                <Label htmlFor="project-cover">
                  {preview ? "Ganti gambar cover" : "Pilih gambar cover"}
                </Label>
                <input
                  id="project-cover"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (!selected) return;
                    if (
                      !["image/png", "image/jpeg", "image/webp"].includes(
                        selected.type,
                      ) ||
                      selected.size > 5 * 1024 * 1024
                    ) {
                      setError("Pilih JPG, PNG, atau WebP maksimal 5 MB.");
                      e.target.value = "";
                      return;
                    }
                    setError("");
                    setFile(selected);
                    setDirty(true);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, atau WebP. Maksimal 5 MB.
                </p>
                {preview && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFile(null);
                      setPreview("");
                      update("image_url", null);
                    }}
                  >
                    <X size={16} />
                    Lepas gambar cover
                  </Button>
                )}
              </div>
              <div className="console-fields-grid">
                {field("github_url", "Tautan repository (opsional)")}
                {field("demo_url", "Tautan demo (opsional)")}
              </div>
            </section>
            <section className="console-editor-section">
              <h2>04 — Penempatan</h2>
              <label className="flex items-center gap-3 min-h-11">
                <input
                  type="checkbox"
                  checked={study.featured}
                  onChange={(e) => updateStudy("featured", e.target.checked)}
                />
                Tampilkan di bagian karya pilihan
              </label>
              <div className="console-field">
                <Label htmlFor="study-order">Urutan tampil</Label>
                <Input
                  id="study-order"
                  type="number"
                  min={-100000}
                  max={100000}
                  value={study.sort_order}
                  onChange={(e) =>
                    updateStudy("sort_order", Number(e.target.value))
                  }
                />
                <p>Angka lebih kecil tampil lebih dahulu.</p>
              </div>
            </section>
          </fieldset>
          <aside className="console-editor-review">
            <h2>Ringkasan</h2>
            <dl>
              <div>
                <dt>Karya</dt>
                <dd>{data.title || "Belum diberi judul"}</dd>
              </div>
              <div>
                <dt>Penempatan</dt>
                <dd>{study.featured ? "Karya pilihan" : "Daftar karya"}</dd>
              </div>
              <div>
                <dt>Status perubahan</dt>
                <dd>{dirty ? "Belum disimpan" : "Tidak ada perubahan"}</dd>
              </div>
            </dl>
            <Button
              type="submit"
              disabled={
                busy ||
                (!!project && (editorial.isPending || editorial.isError))
              }
            >
              {busy ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}{" "}
              {busy ? "Menyimpan…" : "Simpan perubahan"}
            </Button>
            <p>
              Konten tersimpan ke CMS. HTML dan pratinjau SEO diperbarui pada
              rilis situs berikutnya.
            </p>
            {project && (
              <a
                className="flex items-center gap-2 mt-5 text-sm underline underline-offset-4"
                href={"/projects/" + id}
                target="_blank"
                rel="noopener noreferrer"
              >
                Lihat halaman publik <ArrowUpRight size={15} />
              </a>
            )}
          </aside>
        </div>
      </form>
    </>
  );
}
