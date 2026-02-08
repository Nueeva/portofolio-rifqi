import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileText,
  Trash2,
  Loader2,
  Award,
  Plus,
  X,
  Save,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Certification {
  name: string;
  issuer: string;
  year: string;
  status: "active" | "in-progress";
}

// Certifications are stored in localStorage for simplicity (no DB table needed)
const CERTS_KEY = "portfolio_certifications";
const RESUME_URL_KEY = "portfolio_resume_url";

const loadCertifications = (): Certification[] => {
  try {
    const stored = localStorage.getItem(CERTS_KEY);
    return stored ? JSON.parse(stored) : [
      { name: "CompTIA Security+", issuer: "CompTIA", year: "2024", status: "active" },
      { name: "CEH (Certified Ethical Hacker)", issuer: "EC-Council", year: "2024", status: "active" },
      { name: "OSCP", issuer: "Offensive Security", year: "2025", status: "in-progress" },
    ];
  } catch {
    return [];
  }
};

export const ContentManager = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(() => localStorage.getItem(RESUME_URL_KEY));
  const [certifications, setCertifications] = useState<Certification[]>(loadCertifications);
  const [newCert, setNewCert] = useState<Certification>({ name: "", issuer: "", year: "", status: "active" });
  const [isAddingCert, setIsAddingCert] = useState(false);

  const handleResumeUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "Ukuran file maksimal 10MB", variant: "destructive" });
      return;
    }

    if (file.type !== "application/pdf") {
      toast({ title: "Error", description: "Format file harus PDF", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const filePath = `resume-rifqi-ariansyah.pdf`;

      // Try to delete old file first
      await supabase.storage.from("resume").remove([filePath]);

      const { error } = await supabase.storage
        .from("resume")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("resume")
        .getPublicUrl(filePath);

      setResumeUrl(publicUrl);
      localStorage.setItem(RESUME_URL_KEY, publicUrl);

      toast({ title: "Berhasil", description: "CV/Resume berhasil diupload" });
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast({ title: "Error", description: "Gagal mengupload CV/Resume", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [toast]);

  const handleDeleteResume = async () => {
    try {
      await supabase.storage.from("resume").remove(["resume-rifqi-ariansyah.pdf"]);
      setResumeUrl(null);
      localStorage.removeItem(RESUME_URL_KEY);
      toast({ title: "Berhasil", description: "CV/Resume berhasil dihapus" });
    } catch (error) {
      console.error("Error deleting resume:", error);
      toast({ title: "Error", description: "Gagal menghapus CV/Resume", variant: "destructive" });
    }
  };

  const addCertification = () => {
    if (!newCert.name || !newCert.issuer || !newCert.year) {
      toast({ title: "Error", description: "Semua field sertifikasi harus diisi", variant: "destructive" });
      return;
    }
    const updated = [...certifications, newCert];
    setCertifications(updated);
    localStorage.setItem(CERTS_KEY, JSON.stringify(updated));
    setNewCert({ name: "", issuer: "", year: "", status: "active" });
    setIsAddingCert(false);
    toast({ title: "Berhasil", description: "Sertifikasi berhasil ditambahkan" });
  };

  const removeCertification = (index: number) => {
    const updated = certifications.filter((_, i) => i !== index);
    setCertifications(updated);
    localStorage.setItem(CERTS_KEY, JSON.stringify(updated));
    toast({ title: "Berhasil", description: "Sertifikasi berhasil dihapus" });
  };

  return (
    <div className="space-y-8">
      {/* Resume/CV Upload */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          CV / Resume
        </h3>

        {resumeUrl ? (
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">resume-rifqi-ariansyah.pdf</p>
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Lihat file →
                </a>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Ganti
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteResume}>
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer rounded-lg border-2 border-dashed border-border hover:border-primary/50 p-8 text-center transition-colors"
          >
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">Upload CV / Resume</p>
            <p className="text-sm text-muted-foreground mt-1">Format: PDF, Maks 10MB</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleResumeUpload}
          className="hidden"
        />

        {isUploading && (
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Mengupload...
          </div>
        )}
      </div>

      {/* Certifications Management */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Sertifikasi
          </h3>
          <Button size="sm" onClick={() => setIsAddingCert(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah
          </Button>
        </div>

        {/* Add form */}
        {isAddingCert && (
          <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 mb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Nama Sertifikasi *</Label>
                <Input
                  placeholder="e.g., OSCP"
                  value={newCert.name}
                  onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Penerbit *</Label>
                <Input
                  placeholder="e.g., Offensive Security"
                  value={newCert.issuer}
                  onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                />
              </div>
              <div>
                <Label>Tahun *</Label>
                <Input
                  placeholder="e.g., 2025"
                  value={newCert.year}
                  onChange={(e) => setNewCert({ ...newCert, year: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={newCert.status}
                  onValueChange={(v) => setNewCert({ ...newCert, status: v as "active" | "in-progress" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsAddingCert(false)}>
                <X className="h-4 w-4 mr-2" />
                Batal
              </Button>
              <Button size="sm" onClick={addCertification}>
                <Save className="h-4 w-4 mr-2" />
                Simpan
              </Button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {certifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Belum ada sertifikasi</p>
          ) : (
            certifications.map((cert, index) => (
              <div
                key={`${cert.name}-${index}`}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
              >
                <div>
                  <p className="font-medium">{cert.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {cert.issuer} · {cert.year}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={cert.status === "active" ? "default" : "secondary"}>
                    {cert.status === "active" ? "Active" : "In Progress"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeCertification(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
