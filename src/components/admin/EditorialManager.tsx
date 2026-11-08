import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePortfolioContent } from "@/hooks/usePortfolioContent";
import { supabase } from "@/integrations/api/client";
import type { ProjectEditorial, SkillGroup } from "@/data/editorial";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
const lines = (value: string) => value.split("\n").map(s => s.trim()).filter(Boolean);
export function EditorialManager() {
    const catalog = usePortfolioContent();
    const cache = useQueryClient();
    const { toast } = useToast();
    const [entry, setEntry] = useState<ProjectEditorial | null>(null);
    const [group, setGroup] = useState<SkillGroup | null>(null);
    const [busy, setBusy] = useState(false);
    const [preview, setPreview] = useState(false);
    const refresh = async () => { await Promise.all([cache.invalidateQueries({ queryKey: ["project-editorial"] }), cache.invalidateQueries({ queryKey: ["skill-groups"] }), cache.invalidateQueries({ queryKey: ["projects"] })]); };
    async function save(kind: "project" | "skill") {
        setBusy(true);
        try {
            const result = kind === "project" && entry ? await supabase.from("portfolio_project_content").upsert({ ...entry, challenges: lines(entry.challenges.join("\n")), approach: lines(entry.approach.join("\n")), outcomes: lines(entry.outcomes.join("\n")) }) : group ? await supabase.from("portfolio_skill_groups").upsert({ ...group, title: group.title.trim(), items: lines(group.items.join("\n")) }) : null;
            if (!result)
                throw Error("Pilih konten terlebih dahulu.");
            if (result.error)
                throw result.error;
            await refresh();
            toast({ title: "Konten diterbitkan", description: "Halaman publik memakai data yang sama." });
        }
        catch (error) {
            toast({ title: "Gagal menyimpan", description: error instanceof Error ? error.message : "Periksa koneksi dan status migrasi editorial.", variant: "destructive" });
        }
        finally {
            setBusy(false);
        }
    }
    return <section className="space-y-6"><h2 className="text-2xl font-semibold">Editorial portofolio</h2><p>Tambahkan proyek melalui tab Projects, lalu pilih di sini untuk mengatur featured dan studi kasus. Sertifikasi dikelola melalui tab Certifications.</p>
 {catalog.editorialError && <p role="alert">Data editorial belum tersedia. Periksa koneksi backend sebelum menerbitkan.</p>}
 <label className="block">Proyek<select className="block w-full bg-background border p-3" value={entry?.project_key ?? ""} onChange={e => { const p = catalog.projects.find(p => p.id === e.target.value); if (!p)
        return; const s = p.caseStudy; const saved = catalog.entries.find(row => row.project_key === p.id); const original = { role: s?.role ?? "", period: s?.period ?? "", overview: s?.overview ?? "", challenges: s?.challenges ?? [], approach: s?.approach ?? [], outcomes: s?.outcomes ?? [], lessons: s?.lessons ?? "" }; setEntry(saved ? { ...saved, ...(!saved.overview.trim() ? original : {}) } : { project_key: p.id, summary: "", featured: false, sort_order: 0, ...original }); setPreview(false); }}><option value="">Pilih proyek</option>{catalog.projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
 {entry && <div className="space-y-4"><label className="flex gap-3"><input type="checkbox" checked={entry.featured} onChange={e => setEntry({ ...entry, featured: e.target.checked })}/>Tampilkan di Home dan pengalaman Tentang</label><label className="block">Urutan<Input type="number" value={entry.sort_order} onChange={e => setEntry({ ...entry, sort_order: Number(e.target.value) || 0 })}/></label>
 {(["summary", "role", "period", "overview", "lessons"] as const).map(key => <label className="block" key={key}>{({ summary: "Ringkasan publik (singkat)", role: "Peran", period: "Periode", overview: "Konteks studi kasus", lessons: "Pelajaran" })[key]}<Textarea value={entry[key]} maxLength={12000} onChange={e => setEntry({ ...entry, [key]: e.target.value })}/></label>)}
 {(["challenges", "approach", "outcomes"] as const).map(key => <label className="block" key={key}>{({ challenges: "Masalah", approach: "Pendekatan", outcomes: "Hasil" })[key]} (satu poin per baris)<Textarea value={entry[key].join("\n")} onChange={e => setEntry({ ...entry, [key]: e.target.value.split("\n") })}/></label>)}
 <div className="flex gap-3"><Button variant="outline" onClick={() => setPreview(!preview)}>Pratinjau isi</Button><Button disabled={busy || !!catalog.editorialError} onClick={() => { const clean = { ...entry, challenges: lines(entry.challenges.join("\n")), approach: lines(entry.approach.join("\n")), outcomes: lines(entry.outcomes.join("\n")) }; setEntry(clean); void save("project"); }}>Simpan dan terbitkan</Button></div>
 {preview && <article className="space-y-3 border p-6"><h3>{catalog.projects.find(p => p.id === entry.project_key)?.title}</h3><p>{entry.overview}</p>{[...entry.challenges, ...entry.approach, ...entry.outcomes].map((text, i) => <p key={i}>{text}</p>)}</article>}</div>}
 <h3 className="text-xl">Kelompok keahlian</h3><div className="flex flex-wrap gap-2">{catalog.skills.map(s => <Button variant="outline" key={s.id} onClick={() => setGroup(s)}>{s.title}</Button>)}<Button onClick={() => setGroup({ id: crypto.randomUUID(), title: "", items: [], sort_order: catalog.skills.length })}>Tambah kelompok</Button></div>
 {group && <div className="space-y-3"><label>Nama kelompok<Input value={group.title} maxLength={120} onChange={e => setGroup({ ...group, title: e.target.value })}/></label><label>Keahlian (satu per baris)<Textarea value={group.items.join("\n")} onChange={e => setGroup({ ...group, items: e.target.value.split("\n") })}/></label><label>Urutan<Input type="number" value={group.sort_order} onChange={e => setGroup({ ...group, sort_order: Number(e.target.value) || 0 })}/></label><Button disabled={busy || !group.title.trim()} onClick={() => void save("skill")}>Terbitkan kelompok</Button><Button variant="outline" disabled={busy} onClick={async () => { if (!confirm("Hapus kelompok keahlian ini?"))
        return; const { error } = await supabase.from("portfolio_skill_groups").delete().eq("id", group.id); if (error) {
        toast({ title: "Gagal menghapus", variant: "destructive" });
        return;
    } setGroup(null); await refresh(); }}>Hapus kelompok</Button></div>}
 </section>;
}
