import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { EditorialManager } from "./EditorialManager";
export function ContentManager() {
    const [busy, setBusy] = useState(false);
    const cache = useQueryClient();
    const { toast } = useToast();
    return <div className="space-y-10"><section className="space-y-4"><h2 className="text-2xl">CV publik</h2><p>PDF maksimal 10 MB. Setelah diterbitkan, tombol CV di Home dan Tentang mengikuti file ini.</p><label className="block">Pilih PDF<input disabled={busy} className="block" type="file" accept="application/pdf" onChange={async (e) => { const file = e.target.files?.[0]; if (!file)
        return; if (file.type !== "application/pdf" || file.size > 10 * 1024 * 1024) {
        toast({ title: "Pilih PDF maksimal 10 MB", variant: "destructive" });
        return;
    } setBusy(true); try {
        const path = `resume-${crypto.randomUUID()}.pdf`;
        const { error } = await supabase.storage.from("resume").upload(path, file);
        if (error)
            throw error;
        const { data: { publicUrl } } = supabase.storage.from("resume").getPublicUrl(path);
        const result = await supabase.from("site_settings").upsert({ setting_key: "portfolio_cv_url", setting_value: publicUrl, category: "general", label: "URL CV publik" }, { onConflict: "setting_key" });
        if (result.error) {
            await supabase.storage.from("resume").remove([path]);
            throw result.error;
        }
        await cache.invalidateQueries({ queryKey: ["public-site-settings"] });
        toast({ title: "CV diterbitkan" });
    }
    catch (error) {
        toast({ title: "Gagal menerbitkan CV", description: error instanceof Error ? error.message : "Periksa koneksi dan izin penyimpanan.", variant: "destructive" });
    }
    finally {
        setBusy(false);
        e.target.value = "";
    } }}/></label>{busy && <p role="status">Mengunggah dan menerbitkan…</p>}</section><EditorialManager /></div>;
}
