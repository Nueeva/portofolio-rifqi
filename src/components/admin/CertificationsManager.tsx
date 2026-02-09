import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Award,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Upload,
  X,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";

interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
  status: string;
  image_url: string | null;
  credential_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CertForm {
  name: string;
  issuer: string;
  year: string;
  status: string;
  credential_url: string;
}

export const CertificationsManager = () => {
  const { toast } = useToast();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const [deletingCert, setDeletingCert] = useState<Certification | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CertForm>({
    name: "",
    issuer: "",
    year: "",
    status: "active",
    credential_url: "",
  });

  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    try {
      const { data, error } = await supabase
        .from("certifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCertifications(data || []);
    } catch (error) {
      console.error("Error fetching certifications:", error);
      toast({ title: "Error", description: "Gagal memuat sertifikasi", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Ukuran gambar maksimal 5MB", variant: "destructive" });
      return;
    }
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Error", description: "Format: JPG, PNG, GIF, atau WebP", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, [toast]);

  const openCreateDialog = () => {
    setEditingCert(null);
    setFormData({ name: "", issuer: "", year: "", status: "active", credential_url: "" });
    setImageFile(null);
    setImagePreview(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (cert: Certification) => {
    setEditingCert(cert);
    setFormData({
      name: cert.name,
      issuer: cert.issuer,
      year: cert.year,
      status: cert.status,
      credential_url: cert.credential_url || "",
    });
    setImageFile(null);
    setImagePreview(cert.image_url);
    setIsDialogOpen(true);
  };

  const uploadImage = async (certId: string): Promise<string | null> => {
    if (!imageFile) return editingCert?.image_url || null;

    try {
      const fileExt = imageFile.name.split(".").pop();
      const filePath = `${certId}.${fileExt}`;

      if (editingCert?.image_url) {
        const oldPath = editingCert.image_url.split("/").pop();
        if (oldPath) await supabase.storage.from("cert-images").remove([oldPath]);
      }

      const { error } = await supabase.storage
        .from("cert-images")
        .upload(filePath, imageFile, { upsert: true });
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from("cert-images").getPublicUrl(filePath);
      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({ title: "Error", description: "Gagal upload gambar", variant: "destructive" });
      return null;
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.issuer || !formData.year) {
      toast({ title: "Error", description: "Nama, penerbit, dan tahun harus diisi", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const certId = editingCert?.id || crypto.randomUUID();
      const imageUrl = await uploadImage(certId);

      const certData = {
        name: formData.name.trim(),
        issuer: formData.issuer.trim(),
        year: formData.year.trim(),
        status: formData.status,
        credential_url: formData.credential_url?.trim() || null,
        image_url: imageUrl,
      };

      if (editingCert) {
        const { error } = await supabase
          .from("certifications")
          .update(certData)
          .eq("id", editingCert.id);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Sertifikasi berhasil diupdate" });
      } else {
        const { error } = await supabase
          .from("certifications")
          .insert({ ...certData, id: certId });
        if (error) throw error;
        toast({ title: "Berhasil", description: "Sertifikasi berhasil ditambahkan" });
      }

      setIsDialogOpen(false);
      fetchCertifications();
    } catch (error) {
      console.error("Error saving certification:", error);
      toast({ title: "Error", description: "Gagal menyimpan sertifikasi", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCert) return;
    try {
      if (deletingCert.image_url) {
        const fileName = deletingCert.image_url.split("/").pop();
        if (fileName) await supabase.storage.from("cert-images").remove([fileName]);
      }
      const { error } = await supabase.from("certifications").delete().eq("id", deletingCert.id);
      if (error) throw error;
      toast({ title: "Berhasil", description: "Sertifikasi berhasil dihapus" });
      setDeletingCert(null);
      fetchCertifications();
    } catch (error) {
      console.error("Error deleting certification:", error);
      toast({ title: "Error", description: "Gagal menghapus sertifikasi", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Sertifikasi
        </h3>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah
        </Button>
      </div>

      {certifications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
          <Award className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>Belum ada sertifikasi</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Sertifikasi
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
            >
              {cert.image_url ? (
                <img
                  src={cert.image_url}
                  alt={cert.name}
                  className="w-14 h-14 object-cover rounded-lg border border-border"
                />
              ) : (
                <div className="w-14 h-14 bg-muted rounded-lg border border-border flex items-center justify-center">
                  <Award className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{cert.name}</p>
                  <Badge variant={cert.status === "active" ? "default" : "secondary"}>
                    {cert.status === "active" ? "Active" : "In Progress"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {cert.issuer} · {cert.year}
                </p>
                {cert.credential_url && (
                  <a
                    href={cert.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Lihat Credential
                  </a>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(cert)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeletingCert(cert)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCert ? "Edit Sertifikasi" : "Tambah Sertifikasi"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Gambar Sertifikat</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-lg border-2 border-dashed border-border hover:border-primary/50 p-4 text-center transition-colors"
              >
                {imagePreview ? (
                  <div className="flex items-center gap-3">
                    <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded border" />
                    <div className="text-sm text-muted-foreground text-left">
                      <p>Klik untuk ganti gambar</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="text-destructive text-xs hover:underline mt-1"
                      >
                        Hapus gambar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Upload gambar sertifikat</p>
                    <p className="text-xs text-muted-foreground">Max 5MB · JPG, PNG, GIF, WebP</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nama Sertifikasi *</Label>
                <Input
                  placeholder="e.g., OSCP"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Penerbit *</Label>
                <Input
                  placeholder="e.g., Offensive Security"
                  value={formData.issuer}
                  onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tahun *</Label>
                <Input
                  placeholder="e.g., 2025"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
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
              <div className="space-y-1.5">
                <Label>URL Credential</Label>
                <Input
                  placeholder="https://..."
                  value={formData.credential_url}
                  onChange={(e) => setFormData({ ...formData, credential_url: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCert ? "Update" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCert} onOpenChange={() => setDeletingCert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Sertifikasi</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus sertifikasi "{deletingCert?.name}"? Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
