import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  Loader2,
  Globe,
  Mail,
  User,
  Wrench,
  Github,
  Linkedin,
  Twitter,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface SettingRow {
  id: string;
  setting_key: string;
  setting_value: string;
  category: string;
  label: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  social: <Globe className="h-5 w-5 text-primary" />,
  contact: <Mail className="h-5 w-5 text-primary" />,
  hero: <User className="h-5 w-5 text-primary" />,
  skills: <Wrench className="h-5 w-5 text-primary" />,
};

const categoryTitles: Record<string, string> = {
  social: "Link Sosial Media",
  contact: "Kontak",
  hero: "Hero Section",
  skills: "Skills & Tools",
};

const fieldIcons: Record<string, React.ReactNode> = {
  social_github: <Github className="h-4 w-4" />,
  social_linkedin: <Linkedin className="h-4 w-4" />,
  social_twitter: <Twitter className="h-4 w-4" />,
};

export const SiteSettingsManager = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .order("category")
        .order("setting_key");

      if (error) throw error;
      setSettings((data || []) as SettingRow[]);
      const values: Record<string, string> = {};
      (data || []).forEach((row: SettingRow) => {
        values[row.setting_key] = row.setting_value;
      });
      setEditedValues(values);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({ title: "Error", description: "Gagal memuat settings", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
    const original = settings.find((s) => s.setting_key === key);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = settings
        .filter((s) => editedValues[s.setting_key] !== s.setting_value)
        .map((s) =>
          supabase
            .from("site_settings")
            .update({ setting_value: editedValues[s.setting_key] })
            .eq("setting_key", s.setting_key)
        );

      if (updates.length === 0) {
        toast({ title: "Info", description: "Tidak ada perubahan" });
        setIsSaving(false);
        return;
      }

      await Promise.all(updates);
      await fetchSettings();
      setHasChanges(false);
      toast({ title: "Berhasil", description: `${updates.length} setting berhasil disimpan` });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ title: "Error", description: "Gagal menyimpan settings", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Group by category
  const grouped: Record<string, SettingRow[]> = {};
  settings.forEach((s) => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  });

  const categoryOrder = ["social", "contact", "hero", "skills"];

  return (
    <div className="space-y-6">
      {/* Save bar */}
      {hasChanges && (
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/30">
          <p className="text-sm font-medium">Ada perubahan yang belum disimpan</p>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Simpan Semua
          </Button>
        </div>
      )}

      {categoryOrder
        .filter((cat) => grouped[cat])
        .map((category) => (
          <div key={category} className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {categoryIcons[category]}
              {categoryTitles[category] || category}
            </h3>
            <div className="space-y-4">
              {grouped[category].map((setting) => {
                const isMultiValue = category === "skills";
                return (
                  <div key={setting.setting_key} className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-sm">
                      {fieldIcons[setting.setting_key]}
                      {setting.label}
                    </Label>
                    {isMultiValue ? (
                      <Input
                        value={editedValues[setting.setting_key] || ""}
                        onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                        placeholder="Pisahkan dengan koma, e.g.: Skill 1, Skill 2"
                        className="font-mono text-sm"
                      />
                    ) : (
                      <Input
                        value={editedValues[setting.setting_key] || ""}
                        onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                      />
                    )}
                    {isMultiValue && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(editedValues[setting.setting_key] || "")
                          .split(",")
                          .map((v) => v.trim())
                          .filter(Boolean)
                          .map((v, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground"
                            >
                              {v}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
};
