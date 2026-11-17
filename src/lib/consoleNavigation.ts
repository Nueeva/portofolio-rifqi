import {
  BookOpen,
  ChartNoAxesCombined,
  FileDown,
  FileText,
  LayoutGrid,
  Settings,
  ShieldCheck,
  Award,
} from "lucide-react";

export const consoleSections = [
  {
    id: "projects",
    label: "Karya & studi kasus",
    group: "Konten",
    icon: LayoutGrid,
    description:
      "Kelola karya, ceritakan prosesnya, dan pilih yang tampil di portofolio.",
  },
  {
    id: "settings",
    label: "Profil & kontak",
    group: "Konten",
    icon: FileText,
    description: "Informasi diri dan tautan yang tampil di halaman publik.",
  },
  {
    id: "content",
    label: "Keahlian & CV",
    group: "Konten",
    icon: BookOpen,
    description: "Perbarui keahlian dan dokumen yang mewakili perjalanan Anda.",
  },
  {
    id: "certifications",
    label: "Sertifikasi",
    group: "Konten",
    icon: Award,
    description:
      "Catat sertifikasi dan tautan kredensial yang dapat diverifikasi.",
  },
  {
    id: "analytics",
    label: "Kunjungan",
    group: "Pemantauan",
    icon: ChartNoAxesCombined,
    description: "Pahami halaman yang dibaca dan sumber kunjungan portofolio.",
  },
  {
    id: "security",
    label: "Keamanan",
    group: "Pemantauan",
    icon: ShieldCheck,
    description: "Tinjau aktivitas akses dan kelola pembatasan IP.",
  },
  {
    id: "export",
    label: "Ekspor data",
    group: "Pengaturan",
    icon: FileDown,
    description: "Unduh salinan data dengan cakupan yang jelas.",
  },
  {
    id: "theme",
    label: "Preferensi",
    group: "Pengaturan",
    icon: Settings,
    description: "Sesuaikan kenyamanan ruang kerja di perangkat ini.",
  },
];
export function canLeaveConsole() {
  return (
    !document.querySelector('[data-console-dirty="true"]') ||
    window.confirm(
      "Perubahan belum disimpan. Tinggalkan editor dan buang perubahan?",
    )
  );
}
