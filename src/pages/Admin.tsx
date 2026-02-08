import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  FolderOpen,
  Clock,
  Download,
  FileJson,
  FileSpreadsheet,
  History,
  CheckSquare,
  BarChart3,
  ShieldAlert,
  FileText,
  Settings
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { SecurityDashboard } from "@/components/admin/SecurityDashboard";
import { ContentManager } from "@/components/admin/ContentManager";
import { SiteSettingsManager } from "@/components/admin/SiteSettingsManager";

interface Project {
  id: string;
  title: string;
  problem: string;
  solution: string;
  tech_stack: string[];
  category: string;
  github_url: string | null;
  demo_url: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_title: string | null;
  details: { count?: number; format?: string; titles?: string[]; changes?: string } | null;
  created_at: string;
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
type SortField = "title" | "category" | "created_at" | "updated_at";
type SortOrder = "asc" | "desc";

export default function Admin() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Search, Filter, Sort, Pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(projects.map((p) => p.category))];
    return cats.sort();
  }, [projects]);

  // Calculate statistics
  const stats = useMemo(() => {
    const categoryStats = projects.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const lastUpdated = projects.length > 0
      ? projects.reduce((latest, p) => 
          new Date(p.updated_at) > new Date(latest.updated_at) ? p : latest
        )
      : null;

    return {
      total: projects.length,
      byCategory: categoryStats,
      lastUpdated,
    };
  }, [projects]);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.tech_stack.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (filterCategory !== "all") {
      result = result.filter((p) => p.category === filterCategory);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "title" || sortField === "category") {
        comparison = a[sortField].localeCompare(b[sortField]);
      } else {
        comparison = new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [projects, searchQuery, filterCategory, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProjects.length / itemsPerPage);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProjects.slice(start, start + itemsPerPage);
  }, [filteredAndSortedProjects, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, sortField, sortOrder]);

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
        fetchActivityLogs();
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

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivityLogs((data || []) as unknown as ActivityLog[]);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    }
  };

  const logActivity = async (
    action: string,
    entityType: string,
    entityId?: string,
    entityTitle?: string,
    details?: { count?: number; format?: string; titles?: string[]; changes?: string }
  ) => {
    if (!user) return;

    try {
      await supabase.from("activity_logs").insert([{
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        entity_title: entityTitle || null,
        details: details || null,
      }]);
      fetchActivityLogs();
    } catch (error) {
      console.error("Error logging activity:", error);
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
    setImageFile(null);
    setImagePreview(null);
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
    setImageFile(null);
    setImagePreview(project.image_url);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (project: Project) => {
    setDeletingProject(project);
    setIsDeleteDialogOpen(true);
  };

  const handleFileSelect = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Ukuran gambar maksimal 5MB",
        variant: "destructive",
      });
      return;
    }
    
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Format gambar harus JPG, PNG, GIF, atau WebP",
        variant: "destructive",
      });
      return;
    }
    
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, [toast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const uploadImage = async (projectId: string): Promise<string | null> => {
    if (!imageFile) return editingProject?.image_url || null;

    setIsUploading(true);
    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${projectId}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`;

      // Delete old image if exists
      if (editingProject?.image_url) {
        const oldPath = editingProject.image_url.split("/").pop();
        if (oldPath) {
          await supabase.storage.from("project-images").remove([`thumbnails/${oldPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("project-images")
        .upload(filePath, imageFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("project-images")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Gagal mengupload gambar",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
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
      const projectId = editingProject?.id || crypto.randomUUID();
      const imageUrl = await uploadImage(projectId);

      const projectData = {
        title: formData.title.trim(),
        problem: formData.problem.trim(),
        solution: formData.solution.trim(),
        tech_stack: formData.tech_stack.split(",").map((t) => t.trim()).filter(Boolean),
        category: formData.category.trim(),
        github_url: formData.github_url?.trim() || null,
        demo_url: formData.demo_url?.trim() || null,
        image_url: imageUrl,
      };

      if (editingProject) {
        const { error } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", editingProject.id);

        if (error) throw error;

        await logActivity("UPDATE", "project", editingProject.id, projectData.title, {
          changes: "Project updated",
        });

        toast({
          title: "Berhasil",
          description: "Project berhasil diupdate",
        });
      } else {
        const { error } = await supabase
          .from("projects")
          .insert({ ...projectData, id: projectId });

        if (error) throw error;

        await logActivity("CREATE", "project", projectId, projectData.title);

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
      // Delete image if exists
      if (deletingProject.image_url) {
        const fileName = deletingProject.image_url.split("/").pop();
        if (fileName) {
          await supabase.storage.from("project-images").remove([`thumbnails/${fileName}`]);
        }
      }

      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", deletingProject.id);

      if (error) throw error;

      await logActivity("DELETE", "project", deletingProject.id, deletingProject.title);

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

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedProjects.size === 0) return;

    setIsDeleting(true);
    try {
      const projectsToDelete = projects.filter((p) => selectedProjects.has(p.id));
      
      // Delete images
      const imagesToDelete = projectsToDelete
        .filter((p) => p.image_url)
        .map((p) => `thumbnails/${p.image_url!.split("/").pop()}`);
      
      if (imagesToDelete.length > 0) {
        await supabase.storage.from("project-images").remove(imagesToDelete);
      }

      // Delete projects
      const { error } = await supabase
        .from("projects")
        .delete()
        .in("id", Array.from(selectedProjects));

      if (error) throw error;

      await logActivity("BULK_DELETE", "project", undefined, undefined, {
        count: selectedProjects.size,
        titles: projectsToDelete.map((p) => p.title),
      });

      toast({
        title: "Berhasil",
        description: `${selectedProjects.size} project berhasil dihapus`,
      });

      setSelectedProjects(new Set());
      setIsBulkDeleteDialogOpen(false);
      fetchProjects();
    } catch (error) {
      console.error("Error bulk deleting:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus projects",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle project selection
  const toggleProjectSelection = (projectId: string) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  // Select all visible projects
  const toggleSelectAll = () => {
    if (selectedProjects.size === paginatedProjects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(paginatedProjects.map((p) => p.id)));
    }
  };

  // Export functions
  const exportToJSON = () => {
    const dataToExport = filteredAndSortedProjects.map(({ id, created_at, updated_at, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projects-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logActivity("EXPORT", "projects", undefined, undefined, {
      format: "JSON",
      count: dataToExport.length,
    });

    toast({
      title: "Berhasil",
      description: `${dataToExport.length} project diekspor ke JSON`,
    });
  };

  const exportToCSV = () => {
    const headers = ["title", "category", "problem", "solution", "tech_stack", "github_url", "demo_url", "image_url"];
    const csvRows = [
      headers.join(","),
      ...filteredAndSortedProjects.map((p) =>
        headers
          .map((h) => {
            const value = p[h as keyof Project];
            if (Array.isArray(value)) {
              return `"${value.join("; ")}"`;
            }
            if (typeof value === "string") {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? "";
          })
          .join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projects-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logActivity("EXPORT", "projects", undefined, undefined, {
      format: "CSV",
      count: filteredAndSortedProjects.length,
    });

    toast({
      title: "Berhasil",
      description: `${filteredAndSortedProjects.length} project diekspor ke CSV`,
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortOrder === "asc" 
      ? <ArrowUp className="h-4 w-4 ml-1" /> 
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400";
      case "UPDATE":
        return "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400";
      case "DELETE":
      case "BULK_DELETE":
        return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400";
      case "EXPORT":
        return "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400";
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
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-[180px] sm:max-w-none">{user?.email}</p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0">
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah kamu yakin ingin logout? Kamu perlu login lagi untuk mengakses fitur admin.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSignOut}>Logout</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Activity Log Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Activity Log</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[320px] sm:w-[400px] md:w-[540px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Activity Log
                  </SheetTitle>
                  <SheetDescription>
                    Riwayat aktivitas terbaru di admin dashboard
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {activityLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Belum ada aktivitas
                    </p>
                  ) : (
                    activityLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-lg border border-border bg-card"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}
                              >
                                {log.action}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {log.entity_type}
                              </span>
                            </div>
                            {log.entity_title && (
                              <p className="font-medium text-sm truncate">{log.entity_title}</p>
                            )}
                            {log.details && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {log.action === "BULK_DELETE" && log.details.count
                                  ? `Menghapus ${log.details.count} project`
                                  : log.action === "EXPORT" && log.details.format
                                  ? `Export ${log.details.count} project ke ${log.details.format}`
                                  : JSON.stringify(log.details)}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportToJSON}>
                  <FileJson className="h-4 w-4 mr-2" />
                  Export ke JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export ke CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={openCreateDialog} size="sm">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Tambah Project</span>
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="mb-6 w-full flex overflow-x-auto no-scrollbar">
            <TabsTrigger value="projects" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
              <LayoutGrid className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Projects</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
              <Settings className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <LayoutGrid className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Projects</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </div>
              
              {Object.entries(stats.byCategory).slice(0, 2).map(([category, count]) => (
                <div key={category} className="p-4 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary">
                      <FolderOpen className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground truncate">{category}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent">
                    <Clock className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="text-sm font-medium truncate">
                      {stats.lastUpdated 
                        ? new Date(stats.lastUpdated.updated_at).toLocaleDateString("id-ID", { 
                            day: "numeric", 
                            month: "short" 
                          })
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari judul, kategori, atau tech stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Bulk Delete Button */}
            {selectedProjects.size > 0 && (
              <Button
                variant="destructive"
                onClick={() => setIsBulkDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus ({selectedProjects.size})
              </Button>
            )}
          </div>
        </div>

        {/* Projects Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium w-12">
                    <Checkbox
                      checked={paginatedProjects.length > 0 && selectedProjects.size === paginatedProjects.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="text-left p-4 font-medium">Thumbnail</th>
                  <th className="text-left p-4 font-medium">
                    <button 
                      onClick={() => handleSort("title")}
                      className="flex items-center hover:text-primary transition-colors"
                    >
                      Judul
                      <SortIcon field="title" />
                    </button>
                  </th>
                  <th className="text-left p-4 font-medium hidden md:table-cell">
                    <button 
                      onClick={() => handleSort("category")}
                      className="flex items-center hover:text-primary transition-colors"
                    >
                      Kategori
                      <SortIcon field="category" />
                    </button>
                  </th>
                  <th className="text-left p-4 font-medium hidden lg:table-cell">Tech Stack</th>
                  <th className="text-left p-4 font-medium hidden xl:table-cell">
                    <button 
                      onClick={() => handleSort("created_at")}
                      className="flex items-center hover:text-primary transition-colors"
                    >
                      Tanggal
                      <SortIcon field="created_at" />
                    </button>
                  </th>
                  <th className="text-right p-4 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                      {searchQuery || filterCategory !== "all" 
                        ? "Tidak ada project yang cocok dengan filter"
                        : "Belum ada project"}
                    </td>
                  </tr>
                ) : (
                  paginatedProjects.map((project) => (
                    <tr 
                      key={project.id} 
                      className={`border-t border-border transition-colors ${
                        selectedProjects.has(project.id) 
                          ? "bg-primary/5" 
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <td className="p-4">
                        <Checkbox
                          checked={selectedProjects.has(project.id)}
                          onCheckedChange={() => toggleProjectSelection(project.id)}
                        />
                      </td>
                      <td className="p-4">
                        {project.image_url ? (
                          <img
                            src={project.image_url}
                            alt={project.title}
                            className="w-16 h-12 object-cover rounded border border-border"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-muted rounded border border-border flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </td>
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
                      <td className="p-4 hidden xl:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {new Date(project.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedProjects.length)} dari {filteredAndSortedProjects.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      if (totalPages <= 5) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, idx, arr) => (
                      <div key={page} className="flex items-center">
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="min-w-[32px]"
                        >
                          {page}
                        </Button>
                      </div>
                    ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="security">
            <SecurityDashboard />
          </TabsContent>

          <TabsContent value="content">
            <ContentManager />
          </TabsContent>

          <TabsContent value="settings">
            <SiteSettingsManager />
          </TabsContent>
        </Tabs>

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
              {/* Image Upload with Drag & Drop */}
              <div className="space-y-2">
                <Label>Thumbnail</Label>
                <div
                  ref={dropZoneRef}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative cursor-pointer rounded-lg border-2 border-dashed transition-all duration-200
                    ${isDragging 
                      ? "border-primary bg-primary/5 scale-[1.02]" 
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }
                    ${imagePreview ? "p-4" : "p-8"}
                  `}
                >
                  {imagePreview ? (
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-32 h-24 object-cover rounded border border-border"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageFile(null);
                            setImagePreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Klik atau drag gambar baru untuk mengganti</p>
                        <p className="text-xs mt-1">Max 5MB. Format: JPG, PNG, GIF, WebP</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className={`p-3 rounded-full mb-3 transition-colors ${isDragging ? "bg-primary/10" : "bg-muted"}`}>
                        <Upload className={`h-6 w-6 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <p className="font-medium">
                        {isDragging ? "Lepaskan gambar di sini" : "Drag & drop gambar di sini"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        atau klik untuk memilih file
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Max 5MB. Format: JPG, PNG, GIF, WebP
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>

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
              <Button onClick={handleSave} disabled={isSaving || isUploading}>
                {isSaving || isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isUploading ? "Mengupload..." : "Simpan"}
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

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Hapus {selectedProjects.size} Project?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Anda yakin ingin menghapus {selectedProjects.size} project yang dipilih? 
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus Semua
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
