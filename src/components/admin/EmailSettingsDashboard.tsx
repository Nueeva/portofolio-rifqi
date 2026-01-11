import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Mail, RefreshCw, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EmailSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
  updated_at: string;
}

const settingLabels: Record<string, string> = {
  preview_contact_email: "Email Kontak",
  preview_password_reset: "Reset Password",
  preview_magic_link: "Magic Link Login",
  preview_signup_confirmation: "Konfirmasi Signup",
  preview_password_changed: "Password Diubah",
};

const settingIcons: Record<string, string> = {
  preview_contact_email: "📬",
  preview_password_reset: "🔐",
  preview_magic_link: "✨",
  preview_signup_confirmation: "🎉",
  preview_password_changed: "🔒",
};

export function EmailSettingsDashboard() {
  const [settings, setSettings] = useState<EmailSetting[]>([]);
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_settings")
        .select("*")
        .order("setting_key");

      if (error) throw error;

      setSettings(data || []);
      // Initialize edited values with current values
      const initialEdits: Record<string, string> = {};
      data?.forEach((setting) => {
        initialEdits[setting.setting_key] = setting.setting_value;
      });
      setEditedSettings(initialEdits);
    } catch (error) {
      console.error("Error fetching email settings:", error);
      toast({
        title: "Error",
        description: "Gagal memuat pengaturan email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (settingKey: string) => {
    const newValue = editedSettings[settingKey];
    if (!newValue?.trim()) {
      toast({
        title: "Error",
        description: "Preview text tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(settingKey);
    try {
      const { error } = await supabase
        .from("email_settings")
        .update({ 
          setting_value: newValue.trim(),
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq("setting_key", settingKey);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Preview text berhasil diperbarui",
      });
      
      // Update local state
      setSettings((prev) =>
        prev.map((s) =>
          s.setting_key === settingKey
            ? { ...s, setting_value: newValue.trim(), updated_at: new Date().toISOString() }
            : s
        )
      );
    } catch (error) {
      console.error("Error saving email setting:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan",
        variant: "destructive",
      });
    } finally {
      setIsSaving(null);
    }
  };

  const handleReset = (settingKey: string) => {
    const original = settings.find((s) => s.setting_key === settingKey);
    if (original) {
      setEditedSettings((prev) => ({
        ...prev,
        [settingKey]: original.setting_value,
      }));
    }
  };

  const hasChanges = (settingKey: string) => {
    const original = settings.find((s) => s.setting_key === settingKey);
    return original?.setting_value !== editedSettings[settingKey];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Email Preview Text</h2>
          <p className="text-sm text-muted-foreground">
            Konfigurasi teks preview yang muncul di inbox email
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {settings.map((setting) => (
          <Card key={setting.id} className="bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{settingIcons[setting.setting_key] || "📧"}</span>
                  <CardTitle className="text-base">
                    {settingLabels[setting.setting_key] || setting.setting_key}
                  </CardTitle>
                </div>
                {setting.description && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="text-sm">{setting.description}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <CardDescription className="text-xs">
                Terakhir diubah: {new Date(setting.updated_at).toLocaleString("id-ID")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={setting.setting_key} className="sr-only">
                    Preview Text
                  </Label>
                  <Input
                    id={setting.setting_key}
                    value={editedSettings[setting.setting_key] || ""}
                    onChange={(e) =>
                      setEditedSettings((prev) => ({
                        ...prev,
                        [setting.setting_key]: e.target.value,
                      }))
                    }
                    placeholder="Masukkan preview text..."
                    className="bg-background"
                    maxLength={150}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {(editedSettings[setting.setting_key] || "").length}/150 karakter
                  </p>
                </div>
                
                <div className="flex items-center justify-end gap-2">
                  {hasChanges(setting.setting_key) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReset(setting.setting_key)}
                      disabled={isSaving === setting.setting_key}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleSave(setting.setting_key)}
                    disabled={!hasChanges(setting.setting_key) || isSaving === setting.setting_key}
                  >
                    {isSaving === setting.setting_key ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Simpan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Variable Reference */}
      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4" />
            Variabel yang Tersedia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><code className="bg-muted px-1 rounded">{"{name}"}</code> - Nama pengirim (hanya untuk email kontak)</p>
            <p><code className="bg-muted px-1 rounded">{"{email}"}</code> - Email pengirim (hanya untuk email kontak)</p>
            <p><code className="bg-muted px-1 rounded">{"{message_preview}"}</code> - 50 karakter pertama pesan (hanya untuk email kontak)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}