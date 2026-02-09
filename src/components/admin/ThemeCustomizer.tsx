import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
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
  Palette,
  Sun,
  Moon,
  Monitor,
  Eye,
  RotateCcw,
} from "lucide-react";

const PRESET_THEMES = [
  {
    name: "Cyber Green (Default)",
    primary: "160 100% 45%",
    accent: "160 80% 40%",
    description: "Tema default cybersecurity hijau",
  },
  {
    name: "Electric Blue",
    primary: "210 100% 50%",
    accent: "210 80% 45%",
    description: "Nuansa biru elektrik modern",
  },
  {
    name: "Neon Purple",
    primary: "270 100% 60%",
    accent: "270 80% 55%",
    description: "Ungu neon futuristik",
  },
  {
    name: "Amber Warning",
    primary: "35 100% 50%",
    accent: "35 80% 45%",
    description: "Amber/orange hangat",
  },
  {
    name: "Ruby Red",
    primary: "0 85% 55%",
    accent: "0 75% 50%",
    description: "Merah ruby berani",
  },
  {
    name: "Teal Ocean",
    primary: "180 80% 40%",
    accent: "180 70% 35%",
    description: "Warna laut tenang",
  },
];

const FONT_OPTIONS = [
  { value: "inter", label: "Inter (Default)", css: "'Inter', sans-serif" },
  { value: "jetbrains", label: "JetBrains Mono", css: "'JetBrains Mono', monospace" },
  { value: "roboto", label: "Roboto", css: "'Roboto', sans-serif" },
  { value: "system", label: "System UI", css: "system-ui, sans-serif" },
];

export const ThemeCustomizer = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customPrimary, setCustomPrimary] = useState("160 100% 45%");
  const [selectedFont, setSelectedFont] = useState("inter");
  const [previewMode, setPreviewMode] = useState(false);

  // Read current CSS variable on mount
  useEffect(() => {
    const root = document.documentElement;
    const currentPrimary = getComputedStyle(root).getPropertyValue("--primary").trim();
    if (currentPrimary) {
      setCustomPrimary(currentPrimary);
      const presetIdx = PRESET_THEMES.findIndex((t) => t.primary === currentPrimary);
      if (presetIdx >= 0) setSelectedPreset(presetIdx);
    }
  }, []);

  const applyThemePreview = (primary: string, accent: string) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--ring", primary);
    setPreviewMode(true);
  };

  const resetTheme = () => {
    const root = document.documentElement;
    root.style.removeProperty("--primary");
    root.style.removeProperty("--accent");
    root.style.removeProperty("--ring");
    setPreviewMode(false);
    setSelectedPreset(0);
    setCustomPrimary("160 100% 45%");
    toast({ title: "Reset", description: "Tema dikembalikan ke default" });
  };

  const applyPreset = (index: number) => {
    const preset = PRESET_THEMES[index];
    setSelectedPreset(index);
    setCustomPrimary(preset.primary);
    applyThemePreview(preset.primary, preset.accent);
    toast({ title: "Preview", description: `Previewing: ${preset.name}` });
  };

  const applyCustomColor = () => {
    applyThemePreview(customPrimary, customPrimary);
    toast({ title: "Preview", description: "Preview warna kustom diterapkan" });
  };

  const confirmTheme = () => {
    setPreviewMode(false);
    toast({ title: "Berhasil", description: "Tema berhasil diterapkan (session ini)" });
  };

  // Convert HSL string to hex for color picker
  const hslToHex = (hsl: string): string => {
    try {
      const [h, sStr, lStr] = hsl.split(" ");
      const s = parseInt(sStr) / 100;
      const l = parseInt(lStr) / 100;
      const hNum = parseInt(h);

      const a = s * Math.min(l, 1 - l);
      const f = (n: number) => {
        const k = (n + hNum / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, "0");
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    } catch {
      return "#00b36b";
    }
  };

  return (
    <div className="space-y-6">
      {/* Theme Mode Switcher */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Mode Tampilan
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
            { value: "system", label: "System", icon: Monitor },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                theme === value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <Icon className={`h-6 w-6 ${theme === value ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-medium ${theme === value ? "text-primary" : ""}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Theme Preview */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Preview Tema
          </h3>
          {previewMode && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetTheme}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button size="sm" onClick={confirmTheme}>
                Terapkan
              </Button>
            </div>
          )}
        </div>

        {/* Preview Card */}
        <div className="rounded-lg border border-border p-4 bg-background">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">A</span>
            </div>
            <div>
              <p className="font-semibold">Preview Komponen</p>
              <p className="text-sm text-muted-foreground">Lihat perubahan warna secara langsung</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm">Primary Button</Button>
            <Button variant="outline" size="sm">Outline</Button>
            <Button variant="secondary" size="sm">Secondary</Button>
            <Badge>Badge</Badge>
            <Badge variant="secondary">Secondary</Badge>
          </div>
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full w-2/3 rounded-full bg-primary" />
          </div>
        </div>
      </div>

      {/* Preset Themes */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Preset Tema</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PRESET_THEMES.map((preset, idx) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(idx)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                selectedPreset === idx
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div
                className="h-6 w-6 rounded-full mb-2"
                style={{ backgroundColor: `hsl(${preset.primary})` }}
              />
              <p className="text-sm font-medium">{preset.name}</p>
              <p className="text-xs text-muted-foreground">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Color */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Warna Kustom</h3>
        <div className="flex gap-3 items-end">
          <div className="space-y-1.5 flex-1">
            <Label>Primary Color (HSL)</Label>
            <Input
              value={customPrimary}
              onChange={(e) => setCustomPrimary(e.target.value)}
              placeholder="160 100% 45%"
              className="font-mono"
            />
          </div>
          <div
            className="h-10 w-10 rounded-lg border border-border shrink-0"
            style={{ backgroundColor: `hsl(${customPrimary})` }}
          />
          <Button onClick={applyCustomColor} size="sm">
            Preview
          </Button>
        </div>
      </div>

      {/* Font Selection */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Font</h3>
        <Select value={selectedFont} onValueChange={setSelectedFont}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <span style={{ fontFamily: font.css }}>{font.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-2">
          Perubahan font berlaku untuk session ini. Font default akan kembali saat halaman di-refresh.
        </p>
      </div>
    </div>
  );
};
