import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  LogOut, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  X,
  Save,
  AlertTriangle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { z } from "zod";

interface Project {
  id: string;
  title: string;
  problem: string;
  solution: string;
  tech_stack: string[];
  category: string;
  github_url: string | null;
  demo_url: string | null;
  created_at: string;
  updated_at: string;
}

const projectSchema = z.object({
  title: z.string().trim().min(1, "Judul harus diisi").max(100, "Judul maksimal 100 karakter"),
  problem: z.string().trim().min(1, "Problem harus diisi").max(500, "Problem maksimal 500 karakter"),
  solution: z.string().trim().min(1, "Solusi harus diisi").max(1000, "Solusi maksimal 1000 karakter"),
  tech_stack: z.string().trim().min(1, "Tech stack harus diisi"),
  category: z.string().trim().min(1, "Kategori harus diisi").max(50, "Kategori maksimal 50 karakter"),
  github_url: z.string().url("URL GitHub tidak valid").optional().or(z.literal("")),
  demo_url: z.string().url("URL Demo tidak valid").optional().or(z.literal("")),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function Admin() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    problem: "",
    solution: "",
    tech_stack: "",
    category: "",
    github_url: "",
    demo_url: "",
  });
  const [errors, setErrors] = useState<Partial<ProjectFormData>>({});

  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        toast({
          title: "Akses Ditolak",
          description: "Anda tidak memiliki akses admin",
          variant: "destructive",
        });
        navigate("/");
      } else {
        fetchProjects();
      }
    }
  }, [user, isAdmin, loading, navigate, toast]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Gagal memuat projects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const openCreateDialog = () => {
    setEditingProject(null);
    setFormData({
      title: "",
      problem: "",
      solution: "",
      tech_stack: "",
      category: "",
      github_url: "",
      demo_url: "",
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      problem: project.problem,
      solution: project.solution,
      tech_stack: project.tech_stack.join(", "),
      category: project.category,
      github_url: project.github_url || "",
      demo_url: project.demo_url || "",
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (project: Project) => {
    setDeletingProject(project);
    setIsDeleteDialogOpen(true);
  };

  const validateForm = () => {
    try {
      projectSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<ProjectFormData> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof ProjectFormData;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);

    try {
      const projectData = {
        title: formData.title.trim(),
        problem: formData.problem.trim(),
        solution: formData.solution.trim(),
        tech_stack: formData.tech_stack.split(",").map((t) => t.trim()).filter(Boolean),
        category: formData.category.trim(),
        github_url: formData.github_url?.trim() || null,
        demo_url: formData.demo_url?.trim() || null,
      };

      if (editingProject) {
        const { error } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", editingProject.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Project berhasil diupdate",
        });
      } else {
        const { error } = await supabase
          .from("projects")
          .insert(projectData);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Project berhasil ditambahkan",
        });
      }

      setIsDialogOpen(false);
      fetchProjects();
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan project",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProject) return;

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", deletingProject.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Project berhasil dihapus",
      });

      setIsDeleteDialogOpen(false);
      setDeletingProject(null);
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus project",
        variant: "destructive",
      });
    }
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Project
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Projects Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Judul</th>
                  <th className="text-left p-4 font-medium hidden md:table-cell">Kategori</th>
                  <th className="text-left p-4 font-medium hidden lg:table-cell">Tech Stack</th>
                  <th className="text-right p-4 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center p-8 text-muted-foreground">
                      Belum ada project
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr key={project.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="font-medium">{project.title}</div>
                        <div className="text-sm text-muted-foreground md:hidden">
                          {project.category}
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {project.category}
                        </span>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {project.tech_stack.slice(0, 3).map((tech) => (
                            <span
                              key={tech}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground"
                            >
                              {tech}
                            </span>
                          ))}
                          {project.tech_stack.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{project.tech_stack.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(project)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(project)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? "Edit Project" : "Tambah Project Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingProject 
                  ? "Ubah informasi project yang ada" 
                  : "Isi form berikut untuk menambahkan project baru"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <Input
                  id="category"
                  placeholder="e.g., Web Security, Penetration Testing"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={errors.category ? "border-destructive" : ""}
                />
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="problem">Problem *</Label>
                <Textarea
                  id="problem"
                  rows={3}
                  placeholder="Jelaskan masalah yang diselesaikan..."
                  value={formData.problem}
                  onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                  className={errors.problem ? "border-destructive" : ""}
                />
                {errors.problem && (
                  <p className="text-sm text-destructive">{errors.problem}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="solution">Solusi *</Label>
                <Textarea
                  id="solution"
                  rows={4}
                  placeholder="Jelaskan solusi yang diimplementasikan..."
                  value={formData.solution}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  className={errors.solution ? "border-destructive" : ""}
                />
                {errors.solution && (
                  <p className="text-sm text-destructive">{errors.solution}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tech_stack">Tech Stack * (pisahkan dengan koma)</Label>
                <Input
                  id="tech_stack"
                  placeholder="e.g., Python, Burp Suite, React"
                  value={formData.tech_stack}
                  onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                  className={errors.tech_stack ? "border-destructive" : ""}
                />
                {errors.tech_stack && (
                  <p className="text-sm text-destructive">{errors.tech_stack}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="github_url">GitHub URL (opsional)</Label>
                  <Input
                    id="github_url"
                    placeholder="https://github.com/..."
                    value={formData.github_url}
                    onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                    className={errors.github_url ? "border-destructive" : ""}
                  />
                  {errors.github_url && (
                    <p className="text-sm text-destructive">{errors.github_url}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demo_url">Demo URL (opsional)</Label>
                  <Input
                    id="demo_url"
                    placeholder="https://..."
                    value={formData.demo_url}
                    onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                    className={errors.demo_url ? "border-destructive" : ""}
                  />
                  {errors.demo_url && (
                    <p className="text-sm text-destructive">{errors.demo_url}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Batal
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Simpan
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Hapus Project?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Anda yakin ingin menghapus project "{deletingProject?.title}"? 
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
